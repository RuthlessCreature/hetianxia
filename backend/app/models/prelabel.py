from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class PrelabelJob(SQLModel, table=True):
    __tablename__ = "prelabel_jobs"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    status: str = Field(default="queued")
    method: Optional[str] = Field(default=None)
    prompt: Optional[str] = Field(default=None)
    image_count: int = Field(default=0)
    config: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    started_at: Optional[datetime] = Field(default=None)
    finished_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
