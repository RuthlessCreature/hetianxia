from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class Annotation(SQLModel, table=True):
    __tablename__ = "annotations"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    project_id: str = Field(foreign_key="projects.id")
    image_id: str = Field(foreign_key="image_assets.id")
    annotation_type: str
    label: Optional[str] = Field(default=None)
    geometry: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    source: str
    status: str = Field(default="candidate")
    confidence: Optional[float] = Field(default=None)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    reviewed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
