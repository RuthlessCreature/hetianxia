import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import JSON, Column, Field, Session, SQLModel, select


class Deployment(SQLModel, table=True):
    __tablename__ = "deployments"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    model_id: str = Field(foreign_key="model_registry.id")
    name: str
    target: str = Field(default="local")
    config: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="created")
    endpoint_url: Optional[str] = Field(default=None)
    deployed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    deployed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DeploymentService:
    @staticmethod
    def create(db: Session, tenant_id: str, project_id: str, model_id: str, user_id: str, name: str, target: str = "local") -> Deployment:
        dep = Deployment(
            id=f"dep_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            model_id=model_id,
            name=name,
            target=target,
            status="deploying",
            deployed_by=user_id,
        )
        db.add(dep)
        db.commit()
        db.refresh(dep)

        dep.status = "running"
        dep.deployed_at = datetime.utcnow()
        dep.endpoint_url = f"http://inference.hetianxia.com/{dep.id}"
        db.add(dep)
        db.commit()
        db.refresh(dep)
        return dep

    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[Deployment]:
        return db.exec(
            select(Deployment)
            .where(Deployment.project_id == project_id)
            .order_by(Deployment.created_at.desc())
        ).all()

    @staticmethod
    def get(db: Session, deployment_id: str) -> Optional[Deployment]:
        return db.get(Deployment, deployment_id)

    @staticmethod
    def update_status(db: Session, deployment_id: str, status: str) -> Optional[Deployment]:
        dep = db.get(Deployment, deployment_id)
        if not dep:
            return None
        dep.status = status
        db.add(dep)
        db.commit()
        db.refresh(dep)
        return dep

    @staticmethod
    def delete(db: Session, deployment_id: str) -> bool:
        dep = db.get(Deployment, deployment_id)
        if not dep:
            return False
        db.delete(dep)
        db.commit()
        return True
