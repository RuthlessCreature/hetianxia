import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.annotation import Annotation
from app.models.image import ImageAsset


class AnnotationService:
    @staticmethod
    def create(db: Session, tenant_id: str, project_id: str, user_id: str, data: dict) -> Annotation:
        annotation = Annotation(
            id=f"ann_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            image_id=data["image_id"],
            annotation_type=data["annotation_type"],
            label=data.get("label"),
            geometry=data.get("geometry"),
            source=data.get("source", "human"),
            status=data.get("status", "confirmed"),
            confidence=data.get("confidence"),
            created_by=user_id,
        )
        db.add(annotation)

        image = db.get(ImageAsset, data["image_id"])
        if image:
            image.label_status = "labeled" if annotation.status == "confirmed" else "prelabeled"
            image.updated_at = datetime.utcnow()
            db.add(image)

        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def list_by_image(db: Session, image_id: str) -> list[Annotation]:
        return db.exec(
            select(Annotation).where(Annotation.image_id == image_id)
        ).all()

    @staticmethod
    def update(db: Session, annotation_id: str, user_id: str, data: dict) -> Optional[Annotation]:
        annotation = db.get(Annotation, annotation_id)
        if not annotation:
            return None
        for key, value in data.items():
            if value is not None and hasattr(annotation, key):
                setattr(annotation, key, value)
        annotation.updated_at = datetime.utcnow()
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def batch_review(db: Session, annotation_ids: list[str], user_id: str, new_status: str) -> dict:
        confirmed = 0
        rejected = 0
        errors = []
        for ann_id in annotation_ids:
            try:
                annotation = db.get(Annotation, ann_id)
                if not annotation or annotation.source != "ai_prelabel":
                    errors.append(f"{ann_id}: not a prelabel")
                    continue
                annotation.status = new_status
                annotation.reviewed_by = user_id
                annotation.reviewed_at = datetime.utcnow()
                if new_status == "rejected":
                    annotation.label = None
                    annotation.geometry = None
                db.add(annotation)
                if new_status == "confirmed":
                    confirmed += 1
                else:
                    rejected += 1
            except Exception as e:
                errors.append(f"{ann_id}: {str(e)}")
        db.commit()
        return {"confirmed": confirmed, "rejected": rejected, "errors": errors}

    @staticmethod
    def get_pending_reviews(db: Session, project_id: str) -> list[Annotation]:
        return db.exec(
            select(Annotation).where(
                Annotation.project_id == project_id,
                Annotation.source == "ai_prelabel",
                Annotation.status == "candidate",
            )
        ).all()
        annotation = db.get(Annotation, annotation_id)
        if not annotation:
            return False
        db.delete(annotation)
        db.commit()
        return True

    @staticmethod
    def review(db: Session, annotation_id: str, user_id: str, new_status: str) -> Optional[Annotation]:
        annotation = db.get(Annotation, annotation_id)
        if not annotation:
            return None
        if annotation.source != "ai_prelabel":
            raise ValueError("Only AI prelabel annotations need review")

        annotation.status = new_status
        annotation.reviewed_by = user_id
        annotation.reviewed_at = datetime.utcnow()
        if new_status == "rejected":
            annotation.label = None
            annotation.geometry = None
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        return annotation
