from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.project import Project
from app.models.image import ImageAsset
from app.models.training import TrainingJob
from app.models.prelabel import PrelabelJob


def check_license_active(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant or tenant.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant is not active")
    now = datetime.utcnow()
    if tenant.license_end and tenant.license_end < now:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="License has expired")
    return user


def require_write_access(user: User = Depends(check_license_active)) -> User:
    if user.role in ("viewer",):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewer cannot perform this action")
    return user


def require_training_access(user: User = Depends(check_license_active), db: Session = Depends(get_db)) -> User:
    if user.role in ("viewer", "labeler"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for training")
    tenant = db.get(Tenant, user.tenant_id)
    this_month = TrainingJob.created_at >= datetime.utcnow().replace(day=1)
    count = db.exec(
        select(func.count(TrainingJob.id)).where(TrainingJob.tenant_id == user.tenant_id, this_month)
    ).one()
    if tenant and count >= tenant.max_training_jobs_per_month:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Monthly training limit reached")
    return user


def check_project_limit(user: User = Depends(check_license_active), db: Session = Depends(get_db)) -> User:
    tenant = db.get(Tenant, user.tenant_id)
    count = db.exec(select(func.count(Project.id)).where(Project.tenant_id == user.tenant_id)).one()
    if tenant and count >= tenant.max_projects:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project limit reached")
    return user


def check_image_limit(tenant_id: str, db: Session, add_count: int = 1) -> None:
    tenant = db.get(Tenant, tenant_id)
    count = db.exec(select(func.count(ImageAsset.id)).where(ImageAsset.tenant_id == tenant_id)).one()
    if tenant and count + add_count > tenant.max_images:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Image limit reached")


def check_prelabel_limit(tenant_id: str, db: Session) -> None:
    tenant = db.get(Tenant, tenant_id)
    this_month = PrelabelJob.created_at >= datetime.utcnow().replace(day=1)
    count = db.exec(
        select(func.count(PrelabelJob.id)).where(PrelabelJob.tenant_id == tenant_id, this_month)
    ).one()
    if tenant and count >= tenant.max_prelabel_jobs_per_month:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Prelabel job limit reached")
