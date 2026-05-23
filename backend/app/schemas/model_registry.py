from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class ModelResponse(BaseModel):
    id: str
    project_id: str
    training_job_id: Optional[str] = None
    version: str
    artifact_path: Optional[str] = None
    model_format: Optional[str] = None
    metrics: Optional[dict] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ModelTestRequest(BaseModel):
    image_url: Optional[str] = None


class ModelTestResponse(BaseModel):
    predictions: list[dict]
    inference_time_ms: int
