from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class TenantResponse(BaseModel):
    id: str
    name: str
    plan: str
    license_start: Optional[datetime] = None
    license_end: Optional[datetime] = None
    status: str
    max_users: int
    max_projects: int
    max_images: int
    max_storage_gb: int
    max_training_jobs_per_month: int
    max_prelabel_jobs_per_month: int
    allow_model_export: bool
    allow_private_deploy: bool

    model_config = {"from_attributes": True}


class LicenseResponse(BaseModel):
    plan: str
    license_start: Optional[datetime] = None
    license_end: Optional[datetime] = None
    status: str
    is_active: bool


class UsageResponse(BaseModel):
    projects_used: int
    projects_max: int
    images_used: int
    images_max: int
    training_jobs_used: int
    training_jobs_max: int
    storage_used_gb: float
    storage_max_gb: int
