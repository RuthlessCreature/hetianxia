from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class DatasetVersion(SQLModel, table=True):
    __tablename__ = "dataset_versions"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    version: str
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    train_count: int = Field(default=0)
    val_count: int = Field(default=0)
    test_count: int = Field(default=0)
    split_config: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="draft")
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DatasetItem(SQLModel, table=True):
    __tablename__ = "dataset_items"

    id: str = Field(primary_key=True)
    dataset_version_id: str = Field(foreign_key="dataset_versions.id")
    image_id: str = Field(foreign_key="image_assets.id")
    split: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
