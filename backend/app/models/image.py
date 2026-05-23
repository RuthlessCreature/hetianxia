from typing import Optional
from datetime import datetime

from sqlmodel import Field, SQLModel


class ImageAsset(SQLModel, table=True):
    __tablename__ = "image_assets"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    file_path: str
    thumbnail_path: Optional[str] = Field(default=None)
    file_name: Optional[str] = Field(default=None)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)
    file_size: Optional[int] = Field(default=None)
    checksum: Optional[str] = Field(default=None)
    label_status: str = Field(default="raw")
    quality_status: str = Field(default="unknown")
    upload_batch_id: Optional[str] = Field(default=None)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
