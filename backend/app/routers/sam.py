from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.ai.sam_engine import (
    load_model, encode_image, decode_point, decode_box, is_available,
    clear_cache, available_models,
)
import os
from app.core.config import settings

router = APIRouter(prefix="/api/sam", tags=["SAM"])


@router.get("/status")
def sam_status():
    """SAM 状态：是否已加载 + 所有模型列表"""
    return {
        "available": is_available(),
        "loaded": load_model().get("status") == "ok",
        "models": available_models(),
    }


@router.post("/models/{model_key}/load")
def sam_load_model(model_key: str = "tiny"):
    """切换/加载指定大小的 SAM 模型（首次触发下载）"""
    result = load_model(model_key)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


def _resolve_image_path(image_id: str, user: User, db: Session) -> str:
    from app.services.image_service import ImageService
    img = ImageService.get(db, image_id)
    if not img or img.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Image not found")
    filename = img.file_path.replace("/static/uploads/", "")
    local = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(local):
        raise HTTPException(status_code=404, detail="Image file not found")
    return local


@router.post("/images/{image_id}/encode")
def sam_encode(
    image_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = _resolve_image_path(image_id, user, db)
    result = encode_image(path)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.post("/images/{image_id}/decode")
def sam_decode(
    image_id: str,
    x: int = Query(...),
    y: int = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = _resolve_image_path(image_id, user, db)
    result = decode_point(path, x, y)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.post("/images/{image_id}/refine")
def sam_refine(
    image_id: str,
    x: int = Query(...), y: int = Query(...),
    w: int = Query(...), h: int = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = _resolve_image_path(image_id, user, db)
    result = decode_box(path, x, y, w, h)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.post("/cache/clear")
def sam_clear_cache(
    image_id: str = Query(None),
    user: User = Depends(get_current_user),
):
    clear_cache(image_id)
    return {"message": "Cache cleared"}
