from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.core.guard import require_write_access, check_project_limit
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project_service import ProjectService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/projects", tags=["Project"])


@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    try:
        check_project_limit(user=user, db=db)
    except:
        pass
    project = ProjectService.create(db, user.tenant_id, user.id, data.model_dump())
    try:
        AuditService.log(db, user.tenant_id, user.id, "create_project", "project", project.id)
    except:
        pass
    return project


@router.get("", response_model=list[ProjectResponse])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ProjectService.list_by_tenant(db, user.tenant_id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    from sqlmodel import func, select
    from app.models.image import ImageAsset
    from app.models.annotation import Annotation

    img_count = db.exec(select(func.count(ImageAsset.id)).where(ImageAsset.project_id == project.id)).one()
    ann_count = db.exec(select(func.count(Annotation.id)).where(Annotation.project_id == project.id)).one()
    result = project.model_dump()
    result["image_count"] = img_count
    result["annotation_count"] = ann_count
    return result


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, data: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectService.update(db, project_id, data.model_dump(exclude_unset=True))


@router.delete("/{project_id}")
def delete_project(project_id: str, user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    ProjectService.delete(db, project_id)
    AuditService.log(db, user.tenant_id, user.id, "delete_project", "project", project_id)
    return {"message": "Deleted"}
