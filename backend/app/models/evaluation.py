from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class EvaluationReport(SQLModel, table=True):
    __tablename__ = "evaluation_reports"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    model_id: str = Field(foreign_key="model_registry.id")
    dataset_version_id: Optional[str] = Field(default=None, foreign_key="dataset_versions.id")
    task_type: str
    threshold: Optional[float] = Field(default=None)
    metrics: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    failure_cases: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    report_path: Optional[str] = Field(default=None)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
