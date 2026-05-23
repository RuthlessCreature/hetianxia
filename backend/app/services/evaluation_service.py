import os
import uuid
from typing import Optional

from sqlmodel import Session, select

from app.ai.real_evaluation import evaluate_model
from app.core.config import settings
from app.models.evaluation import EvaluationReport
from app.models.model_registry import ModelRegistry


class EvaluationService:
    @staticmethod
    def create_report(
        db: Session,
        tenant_id: str,
        project_id: str,
        model_id: str,
        user_id: str,
        data: dict,
    ) -> EvaluationReport:
        model = db.get(ModelRegistry, model_id)
        if not model:
            raise ValueError("Model not found")

        # Use real model path from training
        model_path = (model.artifact_path or "").replace("mock://models/", "")
        if not model_path or not os.path.exists(model_path):
            # Fall back to upload dir for evaluation
            upload_dir = settings.UPLOAD_DIR
            result = evaluate_model("", upload_dir)
        else:
            upload_dir = settings.UPLOAD_DIR
            result = evaluate_model(model_path, upload_dir)

        report = EvaluationReport(
            id=f"eval_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            model_id=model_id,
            dataset_version_id=data.get("dataset_version_id"),
            task_type=result.get("task_type", "object_detection"),
            threshold=data.get("threshold", 0.5),
            metrics=result["metrics"],
            failure_cases=result["failure_cases"],
            created_by=user_id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_report(db: Session, report_id: str) -> Optional[EvaluationReport]:
        return db.get(EvaluationReport, report_id)

    @staticmethod
    def list_by_model(db: Session, model_id: str) -> list[EvaluationReport]:
        return db.exec(
            select(EvaluationReport)
            .where(EvaluationReport.model_id == model_id)
            .order_by(EvaluationReport.created_at.desc())
        ).all()

    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[EvaluationReport]:
        return db.exec(
            select(EvaluationReport)
            .where(EvaluationReport.project_id == project_id)
            .order_by(EvaluationReport.created_at.desc())
        ).all()
