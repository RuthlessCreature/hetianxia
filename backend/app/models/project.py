from typing import Optional
from datetime import datetime

from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    name: str
    description: Optional[str] = Field(default=None)
    task_type: Optional[str] = Field(default=None)
    image_type: str = Field(default="2d_rgb")
    status: str = Field(default="active")
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
