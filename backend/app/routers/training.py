from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.core.guard import require_training_access
from app.models.user import User
from app.schemas.training import TrainingJobCreate, TrainingJobResponse
from app.services.project_service import ProjectService
from app.services.training_service import TrainingService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api", tags=["Training"])


@router.post("/projects/{project_id}/training-jobs", response_model=TrainingJobResponse)
def create_training_job(
    project_id: str,
    data: TrainingJobCreate,
    user: User = Depends(require_training_access),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")

    job = TrainingService.create_job(db, user.tenant_id, project_id, user.id, data.model_dump())
    result = TrainingService.process_job(db, job.id)
    AuditService.log(db, user.tenant_id, user.id, "start_training", "training_job", job.id, {"task_type": data.task_type})
    return result


@router.get("/training-jobs/{job_id}", response_model=TrainingJobResponse)
def get_training_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = TrainingService.get_job(db, job_id)
    if not job or job.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/projects/{project_id}/training-jobs", response_model=list[TrainingJobResponse])
def list_training_jobs(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return TrainingService.list_by_project(db, project_id)


@router.post("/training-jobs/{job_id}/cancel", response_model=TrainingJobResponse)
def cancel_training_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = TrainingService.get_job(db, job_id)
    if not job or job.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Job not found")
    result = TrainingService.cancel_job(db, job_id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot cancel this job")
    return result
