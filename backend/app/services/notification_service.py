import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import JSON, Column, Field, Session, SQLModel, select


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenants.id")
    user_id: Optional[str] = Field(default=None, foreign_key="users.id")
    title: str
    message: str
    level: str = Field(default="info")
    is_read: bool = Field(default=False)
    link: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationService:
    @staticmethod
    def create(db: Session, tenant_id: str, user_id: Optional[str], title: str, message: str, level: str = "info", link: Optional[str] = None) -> Notification:
        notif = Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            user_id=user_id,
            title=title,
            message=message,
            level=level,
            link=link,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def list_by_user(db: Session, user_id: str, unread_only: bool = False, limit: int = 50) -> list[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        return db.exec(query.order_by(Notification.created_at.desc()).limit(limit)).all()

    @staticmethod
    def list_by_tenant(db: Session, tenant_id: str, limit: int = 50) -> list[Notification]:
        return db.exec(
            select(Notification)
            .where(Notification.tenant_id == tenant_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        ).all()

    @staticmethod
    def mark_read(db: Session, notification_id: str) -> Optional[Notification]:
        notif = db.get(Notification, notification_id)
        if not notif:
            return None
        notif.is_read = True
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(db: Session, user_id: str) -> int:
        notifs = db.exec(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read == False)
        ).all()
        count = 0
        for n in notifs:
            n.is_read = True
            db.add(n)
            count += 1
        db.commit()
        return count

    @staticmethod
    def delete(db: Session, notification_id: str) -> bool:
        notif = db.get(Notification, notification_id)
        if not notif:
            return False
        db.delete(notif)
        db.commit()
        return True
