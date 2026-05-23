import json
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.model_registry import ModelRegistry
from app.models.evaluation import EvaluationReport


class ExportService:
    @staticmethod
    def export_model_onnx(db: Session, model_id: str) -> dict:
        model = db.get(ModelRegistry, model_id)
        if not model:
            raise ValueError("Model not found")
        reports = db.exec(
            select(EvaluationReport).where(EvaluationReport.model_id == model_id)
        ).all()
        return {
            "model": {
                "id": model.id,
                "version": model.version,
                "format": model.model_format,
                "metrics": model.metrics,
                "created_at": model.created_at.isoformat() if model.created_at else None,
            },
            "evaluations": [
                {
                    "id": r.id,
                    "metrics": r.metrics,
                    "threshold": r.threshold,
                    "failure_cases": r.failure_cases,
                }
                for r in reports
            ],
            "exported_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def export_dataset_manifest(db: Session, dataset_version_id: str) -> dict:
        from app.models.dataset import DatasetVersion, DatasetItem
        ds = db.get(DatasetVersion, dataset_version_id)
        if not ds:
            raise ValueError("Dataset not found")
        items = db.exec(
            select(DatasetItem).where(DatasetItem.dataset_version_id == dataset_version_id)
        ).all()
        return {
            "dataset": {
                "id": ds.id,
                "version": ds.version,
                "name": ds.name,
                "splits": {"train": ds.train_count, "val": ds.val_count, "test": ds.test_count},
            },
            "items": [
                {"image_id": item.image_id, "split": item.split} for item in items
            ],
            "exported_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def export_evaluation_report(db: Session, report_id: str) -> dict:
        report = db.get(EvaluationReport, report_id)
        if not report:
            raise ValueError("Report not found")
        return {
            "report": {
                "id": report.id,
                "model_id": report.model_id,
                "task_type": report.task_type,
                "threshold": report.threshold,
                "metrics": report.metrics,
                "failure_cases": report.failure_cases,
                "created_at": report.created_at.isoformat() if report.created_at else None,
            }
        }

    @staticmethod
    def export_evaluation_markdown(db: Session, report_id: str) -> str:
        report = db.get(EvaluationReport, report_id)
        if not report:
            raise ValueError("Report not found")
        model = db.get(ModelRegistry, report.model_id) if report.model_id else None

        md = f"""# 评估报告

**报告ID**: {report.id}  
**模型版本**: {model.version if model else 'N/A'}  
**任务类型**: {report.task_type}  
**阈值**: {report.threshold}  
**生成时间**: {report.created_at.isoformat() if report.created_at else 'N/A'}

## 核心指标

| 指标 | 值 |
|------|-----|
"""
        if report.metrics:
            for k, v in report.metrics.items():
                if isinstance(v, (int, float)):
                    if k in ('precision', 'recall', 'f1', 'map50', 'map75', 'accuracy', 'auroc', 'aupr'):
                        md += f"| {k} | {(v * 100):.2f}% |\n"
                    elif k == 'avg_inference_ms':
                        md += f"| {k} | {v:.1f}ms |\n"
                    else:
                        md += f"| {k} | {v} |\n"

        md += "\n## 误报/漏报\n\n"
        fp = report.metrics.get('false_positive_count', 'N/A') if report.metrics else 'N/A'
        fn = report.metrics.get('false_negative_count', 'N/A') if report.metrics else 'N/A'
        md += f"- 误报 (FP): {fp}\n"
        md += f"- 漏检 (FN): {fn}\n"

        if report.failure_cases and isinstance(report.failure_cases, list):
            md += "\n## 失败样本\n\n"
            for fc in report.failure_cases[:10]:
                md += f"- **{fc.get('reason', 'Unknown')}** (image: {fc.get('image_id', '?')}, score: {fc.get('score', '?')})\n"

        md += f"\n---\n*由和天下AOI平台自动生成*"
        return md
