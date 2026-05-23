from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class TrainingJob(SQLModel, table=True):
    __tablename__ = "training_jobs"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    dataset_version_id: Optional[str] = Field(default=None, foreign_key="dataset_versions.id")
    task_type: str
    strategy: Optional[str] = Field(default=None)
    config: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="queued")
    logs: Optional[str] = Field(default=None)
    metrics: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    started_at: Optional[datetime] = Field(default=None)
    finished_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
