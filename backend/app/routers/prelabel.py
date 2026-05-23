from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.prelabel import PrelabelJobCreate, PrelabelJobResponse
from app.services.prelabel_service import PrelabelService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api", tags=["Prelabel"])


@router.post("/projects/{project_id}/prelabel-jobs", response_model=PrelabelJobResponse)
def create_prelabel_job(
    project_id: str,
    data: PrelabelJobCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")

    job = PrelabelService.create_job(db, user.tenant_id, project_id, user.id, data.model_dump())
    return PrelabelService.process_job(db, job.id)


@router.get("/prelabel-jobs/{job_id}", response_model=PrelabelJobResponse)
def get_prelabel_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = PrelabelService.get_job(db, job_id)
    if not job or job.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/projects/{project_id}/prelabel-jobs", response_model=list[PrelabelJobResponse])
def list_prelabel_jobs(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return PrelabelService.list_by_project(db, project_id)
