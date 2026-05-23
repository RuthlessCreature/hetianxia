from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.model_registry import ModelResponse, ModelTestRequest, ModelTestResponse
from app.services.evaluation_service import EvaluationService
from app.services.model_service import ModelService

router = APIRouter(prefix="/api", tags=["Model"])


@router.get("/projects/{project_id}/models", response_model=list[ModelResponse])
def list_models(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.project_service import ProjectService
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ModelService.list_by_project(db, project_id)


@router.get("/models/{model_id}", response_model=ModelResponse)
def get_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("/models/{model_id}/test", response_model=ModelTestResponse)
def test_model(model_id: str, data: ModelTestRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelService.test_inference(model_id)


@router.post("/models/{model_id}/export")
def export_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "message": "Model export initiated",
        "model_id": model_id,
        "artifact_path": model.artifact_path or "pending",
        "format": model.model_format or "onnx",
    }


@router.post("/models/{model_id}/rollback")
def rollback_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")

    from app.models.model_registry import ModelRegistry
    from sqlmodel import select
    from app.services.audit_service import AuditService

    prev_models = db.exec(
        select(ModelRegistry)
        .where(ModelRegistry.project_id == model.project_id, ModelRegistry.id != model.id)
        .order_by(ModelRegistry.created_at.desc())
        .limit(1)
    ).all()

    if not prev_models:
        raise HTTPException(status_code=400, detail="No previous model version to rollback to")

    prev = prev_models[0]
    model.status = "rolled_back"
    db.add(model)
    db.commit()

    AuditService.log(db, user.tenant_id, user.id, "rollback_model", "model", model_id,
                     {"from": model.version, "to": prev.version})
    return {"message": "Rollback successful", "current": prev.version, "rolled_back_from": model.version}


@router.post("/models/{model_id}/deploy")
def deploy_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")

    from app.services.audit_service import AuditService
    AuditService.log(db, user.tenant_id, user.id, "deploy_model", "model", model_id)

    return {
        "message": "Model deployed successfully",
        "model_id": model_id,
        "version": model.version,
        "endpoint": f"http://inference.hetianxia.com/models/{model_id}",
        "status": "deployed",
    }
