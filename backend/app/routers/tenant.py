from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.tenant import LicenseResponse, TenantResponse, UsageResponse
from app.services.tenant_service import TenantService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api", tags=["Tenant"])


@router.get("/tenant/current", response_model=TenantResponse)
def get_current_tenant(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = TenantService.get_tenant(db, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.get("/license/current", response_model=LicenseResponse)
def get_license(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return TenantService.get_license(user.tenant_id, db)


@router.get("/usage", response_model=UsageResponse)
def get_usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return TenantService.get_usage(db, user.tenant_id)


@router.post("/license/activate")
def activate_license(
    license_key: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can activate license")

    from datetime import datetime, timedelta
    from app.models.tenant import Tenant

    tenant = db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Mock license activation - in production, validate key against license server
    key_map = {
        "TRIAL-XXXX-XXXX-XXXX": {"plan": "trial", "days": 30, "max_projects": 5, "max_images": 1000, "max_users": 3},
        "BASIC-XXXX-XXXX-XXXX": {"plan": "basic", "days": 365, "max_projects": 10, "max_images": 50000, "max_users": 10},
        "PRO-XXXX-XXXX-XXXX": {"plan": "pro", "days": 365, "max_projects": 50, "max_images": 200000, "max_users": 20},
        "ENT-XXXX-XXXX-XXXX": {"plan": "enterprise", "days": 365, "max_projects": 999, "max_images": 999999, "max_users": 999},
    }

    if license_key not in key_map:
        raise HTTPException(status_code=400, detail="Invalid license key")

    config = key_map[license_key]
    tenant.plan = config["plan"]
    tenant.license_start = datetime.utcnow()
    tenant.license_end = datetime.utcnow() + timedelta(days=config["days"])
    tenant.status = "active"
    tenant.max_projects = config["max_projects"]
    tenant.max_images = config["max_images"]
    tenant.max_users = config["max_users"]
    db.add(tenant)
    db.commit()

    AuditService.log(db, user.tenant_id, user.id, "activate_license", "tenant", user.tenant_id,
                     {"plan": config["plan"], "key": license_key[:8] + "..."})

    return {
        "message": "License activated",
        "plan": config["plan"],
        "expires_at": tenant.license_end.isoformat(),
    }
