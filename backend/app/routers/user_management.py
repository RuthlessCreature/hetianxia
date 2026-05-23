import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.deps import get_current_user, get_db
from app.core.security import hash_password
from app.core.guard import check_license_active
from app.models.user import User
from app.models.tenant import Tenant
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/users", tags=["User Management"])


@router.get("")
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.exec(select(User).where(User.tenant_id == user.tenant_id)).all()


@router.get("/{user_id}")
def get_user(user_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.get(User, user_id)
    if not target or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    return target


@router.post("/invite")
def invite_user(
    email: str = Query(...),
    name: str = Query(...),
    role: str = Query("engineer"),
    password: str = Query("invite123"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner/admin can invite users")

    tenant = db.get(Tenant, user.tenant_id)
    count = len(db.exec(select(User).where(User.tenant_id == user.tenant_id)).all())
    if tenant and count >= tenant.max_users:
        raise HTTPException(status_code=403, detail="User limit reached")

    existing = db.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        id=f"u_{uuid.uuid4().hex[:12]}",
        tenant_id=user.tenant_id,
        email=email,
        name=name,
        password_hash=hash_password(password),
        role=role,
        status="active",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log(db, user.tenant_id, user.id, "invite_user", "user", new_user.id, {"email": email, "role": role})
    return new_user


@router.patch("/{user_id}/role")
def change_role(
    user_id: str,
    role: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can change roles")

    target = db.get(User, user_id)
    if not target or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = target.role
    target.role = role
    db.add(target)
    db.commit()
    db.refresh(target)

    AuditService.log(db, user.tenant_id, user.id, "change_role", "user", user_id, {"old": old_role, "new": role})
    return target


@router.patch("/{user_id}/status")
def change_status(
    user_id: str,
    status: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner/admin can change status")

    target = db.get(User, user_id)
    if not target or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")

    target.status = status
    db.add(target)
    db.commit()
    db.refresh(target)

    AuditService.log(db, user.tenant_id, user.id, "change_user_status", "user", user_id, {"status": status})
    return target
