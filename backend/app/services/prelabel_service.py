import os
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.ai.real_prelabel import generate_prelabel
from app.core.config import settings
from app.models.prelabel import PrelabelJob
from app.models.annotation import Annotation
from app.models.image import ImageAsset


class PrelabelService:
    @staticmethod
    def create_job(db: Session, tenant_id: str, project_id: str, user_id: str, data: dict) -> PrelabelJob:
        job = PrelabelJob(
            id=f"plj_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            method=data.get("method", "mock_bbox"),
            prompt=data.get("prompt"),
            image_count=len(data.get("image_ids", [])),
            config={"image_ids": data.get("image_ids", [])},
            created_by=user_id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def process_job(db: Session, job_id: str) -> PrelabelJob:
        job = db.get(PrelabelJob, job_id)
        if not job:
            raise ValueError("Job not found")

        job.status = "running"
        job.started_at = datetime.utcnow()
        db.add(job)
        db.commit()

        image_ids = (job.config or {}).get("image_ids", [])
        result = generate_prelabel(image_ids, job.method or "opencv", job.prompt or "")

        for ann_data in result["annotations"]:
            annotation = Annotation(
                id=f"ann_{uuid.uuid4().hex[:12]}",
                tenant_id=job.tenant_id,
                project_id=job.project_id,
                image_id=ann_data["image_id"],
                annotation_type=ann_data["annotation_type"],
                label=ann_data["label"],
                geometry=ann_data["geometry"],
                source=ann_data["source"],
                status=ann_data["status"],
                confidence=ann_data["confidence"],
                created_by=job.created_by,
            )
            db.add(annotation)

            image = db.get(ImageAsset, ann_data["image_id"])
            if image:
                image.label_status = "prelabeled"
                image.updated_at = datetime.utcnow()
                db.add(image)

        job.status = "completed"
        job.finished_at = datetime.utcnow()
        job.result = result
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[PrelabelJob]:
        return db.get(PrelabelJob, job_id)

    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[PrelabelJob]:
        return db.exec(
            select(PrelabelJob)
            .where(PrelabelJob.project_id == project_id)
            .order_by(PrelabelJob.created_at.desc())
        ).all()
