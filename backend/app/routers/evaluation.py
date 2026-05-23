from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.evaluation import EvaluationCreate, EvaluationResponse
from app.services.evaluation_service import EvaluationService
from app.services.model_service import ModelService

router = APIRouter(prefix="/api", tags=["Evaluation"])


@router.post("/models/{model_id}/evaluate", response_model=EvaluationResponse)
def create_evaluation(
    model_id: str,
    data: EvaluationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")

    return EvaluationService.create_report(
        db, user.tenant_id, model.project_id, model_id, user.id, data.model_dump()
    )


@router.get("/evaluation-reports/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation_report(evaluation_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = EvaluationService.get_report(db, evaluation_id)
    if not report or report.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/models/{model_id}/evaluation-reports", response_model=list[EvaluationResponse])
def list_model_evaluations(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return EvaluationService.list_by_model(db, model_id)
