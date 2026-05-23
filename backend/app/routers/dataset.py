from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dataset import DatasetVersionCreate, DatasetVersionResponse
from app.services.dataset_service import DatasetService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api", tags=["Dataset"])


@router.post("/projects/{project_id}/dataset-versions", response_model=DatasetVersionResponse)
def create_dataset_version(
    project_id: str,
    data: DatasetVersionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return DatasetService.create_version(db, user.tenant_id, project_id, user.id, data.model_dump())


@router.get("/projects/{project_id}/dataset-versions", response_model=list[DatasetVersionResponse])
def list_dataset_versions(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return DatasetService.list_by_project(db, project_id)


@router.get("/dataset-versions/{dataset_version_id}", response_model=DatasetVersionResponse)
def get_dataset_version(dataset_version_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = DatasetService.get(db, dataset_version_id)
    if not ds or ds.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Dataset version not found")
    return ds


@router.post("/dataset-versions/{dataset_version_id}/freeze", response_model=DatasetVersionResponse)
def freeze_dataset_version(dataset_version_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = DatasetService.get(db, dataset_version_id)
    if not ds or ds.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Dataset version not found")
    try:
        return DatasetService.freeze(db, dataset_version_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
