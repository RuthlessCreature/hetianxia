from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.core.guard import check_license_active, require_training_access
from app.models.user import User
from app.services.export_service import ExportService
from app.services.deployment_service import DeploymentService
from app.services.model_service import ModelService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api", tags=["Deploy"])


@router.get("/projects/{project_id}/deployments")
def list_deployments(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return DeploymentService.list_by_project(db, project_id)


@router.post("/projects/{project_id}/deployments")
def create_deployment(
    project_id: str,
    model_id: str = Query(...),
    name: str = Query(...),
    target: str = Query("local"),
    user: User = Depends(require_training_access),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return DeploymentService.create(db, user.tenant_id, project_id, model_id, user.id, name, target)


@router.get("/deployments/{deployment_id}")
def get_deployment(deployment_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dep = DeploymentService.get(db, deployment_id)
    if not dep or dep.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return dep


@router.patch("/deployments/{deployment_id}/status")
def update_deployment_status(
    deployment_id: str,
    status: str = Query(...),
    user: User = Depends(require_training_access),
    db: Session = Depends(get_db),
):
    dep = DeploymentService.get(db, deployment_id)
    if not dep or dep.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return DeploymentService.update_status(db, deployment_id, status)


@router.delete("/deployments/{deployment_id}")
def delete_deployment(deployment_id: str, user: User = Depends(require_training_access), db: Session = Depends(get_db)):
    dep = DeploymentService.get(db, deployment_id)
    if not dep or dep.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    DeploymentService.delete(db, deployment_id)
    return {"message": "Deleted"}
