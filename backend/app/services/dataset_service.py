import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.dataset import DatasetVersion, DatasetItem
from app.models.image import ImageAsset
from app.models.annotation import Annotation


class DatasetService:
    @staticmethod
    def create_version(db: Session, tenant_id: str, project_id: str, user_id: str, data: dict) -> DatasetVersion:
        version_count = len(
            db.exec(
                select(DatasetVersion).where(DatasetVersion.project_id == project_id)
            ).all()
        )
        version_name = f"v{version_count + 1}"

        ds = DatasetVersion(
            id=f"dsv_{uuid.uuid4().hex[:12]}",
            tenant_id=tenant_id,
            project_id=project_id,
            version=version_name,
            name=data.get("name"),
            description=data.get("description"),
            split_config=data.get("split_config"),
            created_by=user_id,
        )
        db.add(ds)
        db.commit()
        db.refresh(ds)
        return ds

    @staticmethod
    def freeze(db: Session, dataset_version_id: str) -> Optional[DatasetVersion]:
        ds = db.get(DatasetVersion, dataset_version_id)
        if not ds or ds.status == "frozen":
            return None

        confirmed_images = db.exec(
            select(ImageAsset).where(
                ImageAsset.project_id == ds.project_id,
                ImageAsset.label_status.in_(["labeled", "reviewed", "prelabeled"]),
            )
        ).all()

        image_ids = [img.id for img in confirmed_images]
        if not image_ids:
            raise ValueError("No labeled images available for dataset")

        split_config = ds.split_config or {"train": 0.7, "val": 0.15, "test": 0.15}
        items = []
        for i, img_id in enumerate(image_ids):
            r = i / len(image_ids)
            if r < split_config.get("train", 0.7):
                split = "train"
            elif r < split_config.get("train", 0.7) + split_config.get("val", 0.15):
                split = "val"
            else:
                split = "test"
            items.append(
                DatasetItem(
                    id=f"dsi_{uuid.uuid4().hex[:12]}",
                    dataset_version_id=ds.id,
                    image_id=img_id,
                    split=split,
                )
            )

        for item in items:
            db.add(item)

        splits = {"train": 0, "val": 0, "test": 0}
        for item in items:
            splits[item.split] += 1

        ds.train_count = splits["train"]
        ds.val_count = splits["val"]
        ds.test_count = splits["test"]
        ds.status = "frozen"
        db.add(ds)
        db.commit()
        db.refresh(ds)
        return ds

    @staticmethod
    def list_by_project(db: Session, project_id: str) -> list[DatasetVersion]:
        return db.exec(
            select(DatasetVersion)
            .where(DatasetVersion.project_id == project_id)
            .order_by(DatasetVersion.created_at.desc())
        ).all()

    @staticmethod
    def get(db: Session, dataset_version_id: str) -> Optional[DatasetVersion]:
        return db.get(DatasetVersion, dataset_version_id)
