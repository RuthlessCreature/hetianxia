from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class TrainingJobCreate(BaseModel):
    dataset_version_id: str
    task_type: str
    strategy: Optional[str] = "fast_baseline"
    config: Optional[dict] = None


class TrainingJobResponse(BaseModel):
    id: str
    project_id: str
    dataset_version_id: Optional[str] = None
    task_type: str
    strategy: Optional[str] = None
    config: Optional[dict] = None
    status: str
    logs: Optional[str] = None
    metrics: Optional[dict] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
