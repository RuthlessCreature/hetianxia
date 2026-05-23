from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.core.guard import require_training_access
from app.models.user import User
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["Export"])


@router.get("/model/{model_id}")
def export_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.model_service import ModelService
    model = ModelService.get(db, model_id)
    if not model or model.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Model not found")
    return ExportService.export_model_onnx(db, model_id)


@router.get("/dataset/{dataset_version_id}")
def export_dataset(dataset_version_id: str, user: User = Depends(require_training_access), db: Session = Depends(get_db)):
    try:
        return ExportService.export_dataset_manifest(db, dataset_version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/evaluation/{report_id}/markdown")
def export_evaluation_markdown(report_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return ExportService.export_evaluation_markdown(db, report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
