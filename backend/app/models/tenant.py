from typing import Optional
from datetime import datetime

from sqlmodel import Field, SQLModel


class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"

    id: str = Field(primary_key=True)
    name: str
    plan: str = Field(default="trial")
    license_start: Optional[datetime] = Field(default=None)
    license_end: Optional[datetime] = Field(default=None)
    status: str = Field(default="active")
    max_users: int = Field(default=5)
    max_projects: int = Field(default=10)
    max_images: int = Field(default=100000)
    max_storage_gb: int = Field(default=100)
    max_training_jobs_per_month: int = Field(default=100)
    max_prelabel_jobs_per_month: int = Field(default=100)
    allow_model_export: bool = Field(default=False)
    allow_private_deploy: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
