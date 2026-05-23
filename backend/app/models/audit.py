from typing import Optional
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: str = Field(primary_key=True)
    tenant_id: Optional[str] = Field(default=None, foreign_key="tenants.id")
    user_id: Optional[str] = Field(default=None, foreign_key="users.id")
    action: str
    resource_type: Optional[str] = Field(default=None)
    resource_id: Optional[str] = Field(default=None)
    detail: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
