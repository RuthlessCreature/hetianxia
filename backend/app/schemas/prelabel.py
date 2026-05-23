from typing import Optional

from pydantic import BaseModel


class PrelabelJobCreate(BaseModel):
    image_ids: list[str]
    method: str = "mock_bbox"
    prompt: Optional[str] = None


class PrelabelJobResponse(BaseModel):
    id: str
    project_id: str
    status: str
    method: Optional[str] = None
    prompt: Optional[str] = None
    image_count: int
    config: Optional[dict] = None
    result: Optional[dict] = None

    model_config = {"from_attributes": True}
