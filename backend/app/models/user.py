from typing import Optional
from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    email: str = Field(unique=True, index=True)
    name: Optional[str] = Field(default=None)
    password_hash: str
    role: str = Field(default="engineer")
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
