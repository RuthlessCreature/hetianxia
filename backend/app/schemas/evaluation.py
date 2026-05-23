from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class EvaluationCreate(BaseModel):
    dataset_version_id: Optional[str] = None
    threshold: Optional[float] = 0.5


class EvaluationResponse(BaseModel):
    id: str
    project_id: str
    model_id: str
    dataset_version_id: Optional[str] = None
    task_type: str
    threshold: Optional[float] = None
    metrics: Optional[dict] = None
    failure_cases: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}
