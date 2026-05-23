from typing import Optional

from pydantic import BaseModel


class DatasetVersionCreate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    split_config: Optional[dict] = None


class DatasetVersionResponse(BaseModel):
    id: str
    project_id: str
    version: str
    name: Optional[str] = None
    description: Optional[str] = None
    train_count: int
    val_count: int
    test_count: int
    split_config: Optional[dict] = None
    status: str

    model_config = {"from_attributes": True}
