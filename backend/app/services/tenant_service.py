from datetime import datetime
from typing import Optional

from sqlmodel import Session, func, select

from app.models.tenant import Tenant
from app.models.project import Project
from app.models.image import ImageAsset
from app.models.training import TrainingJob


class TenantService:
    @staticmethod
    def get_tenant(db: Session, tenant_id: str) -> Optional[Tenant]:
        return db.get(Tenant, tenant_id)

    @staticmethod
    def get_license(tenant_id: str, db: Session) -> dict:
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError("Tenant not found")

        now = datetime.utcnow()
        is_active = (
            tenant.status == "active"
            and (tenant.license_end is None or tenant.license_end > now)
        )

        return {
            "plan": tenant.plan,
            "license_start": tenant.license_start,
            "license_end": tenant.license_end,
            "status": tenant.status,
            "is_active": is_active,
        }

    @staticmethod
    def get_usage(db: Session, tenant_id: str) -> dict:
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            raise ValueError("Tenant not found")

        project_count = db.exec(
            select(func.count(Project.id)).where(Project.tenant_id == tenant_id)
        ).one()

        image_count = db.exec(
            select(func.count(ImageAsset.id)).where(ImageAsset.tenant_id == tenant_id)
        ).one()

        this_month = TrainingJob.created_at >= datetime.utcnow().replace(day=1)
        training_count = db.exec(
            select(func.count(TrainingJob.id)).where(
                TrainingJob.tenant_id == tenant_id, this_month
            )
        ).one()

        return {
            "projects_used": project_count,
            "projects_max": tenant.max_projects,
            "images_used": image_count,
            "images_max": tenant.max_images,
            "training_jobs_used": training_count,
            "training_jobs_max": tenant.max_training_jobs_per_month,
            "storage_used_gb": round(image_count * 0.005, 2),
            "storage_max_gb": tenant.max_storage_gb,
        }
