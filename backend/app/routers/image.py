import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.image import ImageResponse, ImageListResponse
from app.services.image_service import ImageService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api", tags=["Image"])


@router.post("/projects/{project_id}/images/upload", response_model=ImageResponse)
async def upload_images(
    project_id: str,
    files: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")

    batch_id = f"batch_{uuid.uuid4().hex[:8]}"
    images = []
    for file in files:
        try:
            img = ImageService.upload(db, user.tenant_id, project_id, user.id, file, batch_id)
            images.append(img)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    return images[0] if len(images) == 1 else images


@router.get("/projects/{project_id}/images", response_model=ImageListResponse)
def list_images(
    project_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    label_status: Optional[str] = Query(None),
    quality_status: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ImageService.list_images(db, project_id, page, page_size, label_status, quality_status)


@router.post("/projects/{project_id}/images/batch-action")
def batch_image_action(
    project_id: str,
    action: str = Query(...),
    image_ids: list[str] = Query(...),
    target_project_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")

    results = {"success": 0, "failed": 0, "errors": []}
    for img_id in image_ids:
        try:
            img = ImageService.get(db, img_id)
            if not img or img.tenant_id != user.tenant_id:
                results["errors"].append(f"{img_id}: not found")
                results["failed"] += 1
                continue

            if action == "delete":
                ImageService.delete(db, img_id)
                results["success"] += 1
            elif action == "move" and target_project_id:
                tgt = ProjectService.get(db, target_project_id)
                if not tgt or tgt.tenant_id != user.tenant_id:
                    results["errors"].append(f"{img_id}: target project not found")
                    results["failed"] += 1
                    continue
                img.project_id = target_project_id
                from datetime import datetime
                img.updated_at = datetime.utcnow()
                db.add(img)
                db.commit()
                results["success"] += 1
            else:
                results["errors"].append(f"{img_id}: invalid action")
                results["failed"] += 1
        except Exception as e:
            results["errors"].append(f"{img_id}: {str(e)}")
            results["failed"] += 1

    return results


@router.get("/projects/{project_id}/images/batches")
def list_batches(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")

    from sqlmodel import func
    from app.models.image import ImageAsset

    batches = db.exec(
        select(ImageAsset.upload_batch_id, func.count(ImageAsset.id))
        .where(ImageAsset.project_id == project_id, ImageAsset.upload_batch_id.isnot(None))
        .group_by(ImageAsset.upload_batch_id)
        .order_by(ImageAsset.upload_batch_id.desc())
    ).all()

    return [{"batch_id": b[0], "count": b[1]} for b in batches]


@router.get("/images/{image_id}", response_model=ImageResponse)
def get_image(image_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    img = ImageService.get(db, image_id)
    if not img or img.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Image not found")
    from sqlmodel import func, select
    from app.models.annotation import Annotation

    ann_count = db.exec(select(func.count(Annotation.id)).where(Annotation.image_id == img.id)).one()
    result = img.model_dump()
    result["annotation_count"] = ann_count
    return result


@router.delete("/images/{image_id}")
def delete_image(image_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    img = ImageService.get(db, image_id)
    if not img or img.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Image not found")
    ImageService.delete(db, image_id)
    return {"message": "Deleted"}
