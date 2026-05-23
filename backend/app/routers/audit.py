from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.core.guard import check_license_active
from app.models.user import User
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("/logs")
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return AuditService.list_by_tenant(db, user.tenant_id, limit)


@router.get("/logs/user/{user_id}")
def list_user_logs(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id != user.id and user.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return AuditService.list_by_user(db, user_id, limit)
