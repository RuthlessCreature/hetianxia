from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class ImageResponse(BaseModel):
    id: str
    project_id: str
    file_path: str
    thumbnail_path: Optional[str] = None
    file_name: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    checksum: Optional[str] = None
    label_status: str
    quality_status: str
    upload_batch_id: Optional[str] = None
    annotation_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ImageListResponse(BaseModel):
    images: list[ImageResponse]
    total: int
    page: int
    page_size: int
