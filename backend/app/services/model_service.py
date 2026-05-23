from typing import Optional

from sqlmodel import Session, select

from app.ai.mock_training import generate_mock_training
from app.models.model_registry import ModelRegistry


class ModelService:
    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[ModelRegistry]:
        return db.exec(
            select(ModelRegistry)
            .where(ModelRegistry.project_id == project_id)
            .order_by(ModelRegistry.created_at.desc())
        ).all()

    @staticmethod
    def get(db: Session, model_id: str) -> Optional[ModelRegistry]:
        return db.get(ModelRegistry, model_id)

    @staticmethod
    def test_inference(model_id: str) -> dict:
        labels = ["scratch", "dent", "stain", "crack", "burr", "normal"]
        import random

        predictions = [
            {
                "label": random.choice(labels),
                "confidence": round(random.uniform(0.6, 0.98), 2),
                "bbox": {
                    "x": random.randint(10, 400),
                    "y": random.randint(10, 400),
                    "w": random.randint(20, 150),
                    "h": random.randint(10, 80),
                },
            }
            for _ in range(random.randint(0, 3))
        ]
        return {"predictions": predictions, "inference_time_ms": random.randint(15, 40)}
