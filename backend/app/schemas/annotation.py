from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class AnnotationCreate(BaseModel):
    image_id: str
    annotation_type: str
    label: Optional[str] = None
    geometry: Optional[dict] = None
    source: str = "human"
    status: str = "confirmed"
    confidence: Optional[float] = None


class AnnotationUpdate(BaseModel):
    label: Optional[str] = None
    geometry: Optional[dict] = None
    status: Optional[str] = None
    confidence: Optional[float] = None


class AnnotationResponse(BaseModel):
    id: str
    image_id: str
    project_id: str
    annotation_type: str
    label: Optional[str] = None
    geometry: Optional[dict] = None
    source: str
    status: str
    confidence: Optional[float] = None
    created_by: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    status: str
