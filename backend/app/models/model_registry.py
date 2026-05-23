from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class ModelRegistry(SQLModel, table=True):
    __tablename__ = "model_registry"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    training_job_id: Optional[str] = Field(default=None, foreign_key="training_jobs.id")
    version: str
    artifact_path: Optional[str] = Field(default=None)
    model_format: Optional[str] = Field(default=None)
    metrics: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="ready")
    created_at: datetime = Field(default_factory=datetime.utcnow)
