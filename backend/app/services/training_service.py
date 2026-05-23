import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.ai.real_training import train_classifier, generate_mock_logs
from app.core.config import settings
from app.models.training import TrainingJob
from app.models.model_registry import ModelRegistry


class TrainingService:
    @staticmethod
    def create_job(db: Session, tenant_id: str, project_id: str, user_id: str, data: dict) -> TrainingJob:
        job = TrainingJob(
            id=f"job_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            dataset_version_id=data.get("dataset_version_id"),
            task_type=data["task_type"],
            strategy=data.get("strategy", "fast_baseline"),
            config=data.get("config"),
            created_by=user_id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def process_job(db: Session, job_id: str) -> TrainingJob:
        job = db.get(TrainingJob, job_id)
        if not job:
            raise ValueError("Job not found")

        job.status = "running"
        job.started_at = datetime.utcnow()
        db.add(job)
        db.commit()

        logs = generate_mock_logs()
        job.logs = "\n".join(logs)

        upload_dir = settings.UPLOAD_DIR
        backbone = (job.config or {}).get("model", "resnet18")
        result = train_classifier(job.project_id, job.task_type, upload_dir, backbone)

        job.status = result["status"]
        job.metrics = result["metrics"]
        job.finished_at = datetime.utcnow()
        db.add(job)
        db.commit()

        if result["status"] == "succeeded":
            model_count = len(
                db.exec(
                    select(ModelRegistry).where(ModelRegistry.project_id == job.project_id)
                ).all()
            )
            model = ModelRegistry(
                id=f"model_{uuid.uuid4().hex[:12]}",
                tenant_id=job.tenant_id,
                project_id=job.project_id,
                training_job_id=job.id,
                version=f"M-{datetime.utcnow().year}-{model_count + 1:03d}",
                artifact_path=result["artifact_path"],
                model_format="pth",
                metrics=result["metrics"],
                status="ready",
            )
            db.add(model)
            db.commit()

            try:
                from app.services.notification_service import NotificationService
                from app.models.project import Project
                project = db.get(Project, job.project_id)
                project_name = project.name if project else "Unknown"
                NotificationService.create(
                    db, job.tenant_id, job.created_by,
                    title=f"训练完成 - {project_name}",
                    message=f"模型 {model.version} 训练成功。Precision: {(result['metrics'].get('precision', 0) * 100):.1f}%, Recall: {(result['metrics'].get('recall', 0) * 100):.1f}%",
                    level="success",
                    link=f"/projects/{job.project_id}/models",
                )
            except Exception:
                pass

        db.refresh(job)
        return job

    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[TrainingJob]:
        return db.get(TrainingJob, job_id)

    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[TrainingJob]:
        return db.exec(
            select(TrainingJob)
            .where(TrainingJob.project_id == project_id)
            .order_by(TrainingJob.created_at.desc())
        ).all()

    @staticmethod
    def cancel_job(db: Session, job_id: str) -> Optional[TrainingJob]:
        job = db.get(TrainingJob, job_id)
        if not job or job.status not in ("queued", "running"):
            return None
        job.status = "cancelled"
        job.finished_at = datetime.utcnow()
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
