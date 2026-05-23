import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, func, select

from app.models.project import Project
from app.models.image import ImageAsset
from app.models.annotation import Annotation


class ProjectService:
    @staticmethod
    def create(db: Session, tenant_id: str, user_id: str, data: dict) -> Project:
        project = Project(
            id=f"p_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            name=data["name"],
            description=data.get("description"),
            task_type=data.get("task_type"),
            image_type=data.get("image_type", "2d_rgb"),
            created_by=user_id,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str) -> list[dict]:
        projects = db.exec(
            select(Project).where(Project.tenant_id == tenant_id).order_by(Project.updated_at.desc())
        ).all()

        result = []
        for p in projects:
            img_count = db.exec(
                select(func.count(ImageAsset.id)).where(ImageAsset.project_id == p.id)
            ).one()
            ann_count = db.exec(
                select(func.count(Annotation.id)).where(Annotation.project_id == p.id)
            ).one()
            pd = p.model_dump()
            pd["image_count"] = img_count
            pd["annotation_count"] = ann_count
            result.append(pd)
        return result

    @staticmethod
    def get(db: Session, project_id: str) -> Optional[Project]:
        return db.get(Project, project_id)

    @staticmethod
    def update(db: Session, project_id: str, data: dict) -> Optional[Project]:
        project = db.get(Project, project_id)
        if not project:
            return None
        for key, value in data.items():
            if value is not None and hasattr(project, key):
                setattr(project, key, value)
        project.updated_at = datetime.utcnow()
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete(db: Session, project_id: str) -> bool:
        project = db.get(Project, project_id)
        if not project:
            return False
        db.delete(project)
        db.commit()
        return True
