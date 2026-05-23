import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.audit import AuditLog


class AuditService:
    @staticmethod
    def log(
        db: Session,
        tenant_id: Optional[str],
        user_id: Optional[str],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=f"log_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail,
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
        return entry

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str, limit: int = 100) -> list[AuditLog]:
        return db.exec(
            select(AuditLog)
            .where(AuditLog.tenant_id == tenant_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        ).all()

    @staticmethod
    def list_by_user(db: Session, user_id: str, limit: int = 50) -> list[AuditLog]:
        return db.exec(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        ).all()

    @staticmethod
    def list_by_resource(db: Session, resource_type: str, resource_id: str) -> list[AuditLog]:
        return db.exec(
            select(AuditLog)
            .where(AuditLog.resource_type == resource_type, AuditLog.resource_id == resource_id)
            .order_by(AuditLog.created_at.desc())
        ).all()
