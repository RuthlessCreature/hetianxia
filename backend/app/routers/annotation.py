from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.annotation import AnnotationCreate, AnnotationResponse, AnnotationUpdate, ReviewRequest
from app.services.annotation_service import AnnotationService

router = APIRouter(prefix="/api", tags=["Annotation"])


@router.post("/images/{image_id}/annotations", response_model=AnnotationResponse)
def create_annotation(
    image_id: str,
    data: AnnotationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.image_service import ImageService
    img = ImageService.get(db, image_id)
    if not img or img.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Image not found")

    payload = data.model_dump()
    payload["image_id"] = image_id
    return AnnotationService.create(db, user.tenant_id, img.project_id, user.id, payload)


@router.get("/images/{image_id}/annotations", response_model=list[AnnotationResponse])
def list_annotations(image_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.image_service import ImageService
    img = ImageService.get(db, image_id)
    if not img or img.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Image not found")
    return AnnotationService.list_by_image(db, image_id)


@router.patch("/annotations/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(
    annotation_id: str,
    data: AnnotationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ann = AnnotationService.update(db, annotation_id, user.id, data.model_dump(exclude_unset=True))
    if not ann or ann.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return ann


@router.delete("/annotations/{annotation_id}")
def delete_annotation(annotation_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.annotation import Annotation
    ann = db.get(Annotation, annotation_id)
    if not ann or ann.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Annotation not found")
    AnnotationService.delete(db, annotation_id)
    return {"message": "Deleted"}


@router.post("/annotations/{annotation_id}/review", response_model=AnnotationResponse)
def review_annotation(
    annotation_id: str,
    data: ReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.annotation import Annotation
    ann = db.get(Annotation, annotation_id)
    if not ann or ann.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Annotation not found")
    try:
        return AnnotationService.review(db, annotation_id, user.id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/annotations/batch-review")
def batch_review_annotations(
    annotation_ids: list[str],
    status: str = "confirmed",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AnnotationService.batch_review(db, annotation_ids, user.id, status)


@router.get("/projects/{project_id}/pending-reviews")
def get_pending_reviews(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.project_service import ProjectService
    project = ProjectService.get(db, project_id)
    if not project or project.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return AnnotationService.get_pending_reviews(db, project_id)
