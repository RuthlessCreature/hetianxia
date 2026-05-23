import hashlib
import io
import os
import uuid
from typing import Optional

from PIL import Image as PILImage, UnidentifiedImageError
from sqlmodel import Session, func, select

from app.core.config import settings
from app.models.image import ImageAsset


def validate_image(content: bytes, filename: str) -> dict:
    errors = []
    
    # Check file extension
    allowed_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_exts:
        errors.append(f"Unsupported file type: {ext}")

    # Check file size (max 50MB)
    max_size = 50 * 1024 * 1024
    if len(content) > max_size:
        errors.append(f"File too large: {len(content)} bytes (max {max_size})")

    # Check file is empty
    if len(content) == 0:
        errors.append("Empty file")

    if errors:
        return {"valid": False, "errors": errors}

    # Try to open as image
    try:
        with PILImage.open(io.BytesIO(content)) as img:
            img.verify()
    except UnidentifiedImageError:
        return {"valid": False, "errors": ["Unrecognized image format or corrupted file"]}
    except Exception as e:
        return {"valid": False, "errors": [f"Corrupted image: {str(e)}"]}

    # Re-open after verify() to get dimensions
    try:
        with PILImage.open(io.BytesIO(content)) as img:
            w, h = img.size
            if w < 10 or h < 10:
                errors.append(f"Image too small: {w}x{h} (min 10x10)")
            mode = img.mode
            if mode not in ('RGB', 'RGBA', 'L', 'LA', 'P', 'CMYK'):
                errors.append(f"Unsupported color mode: {mode}")
    except Exception:
        return {"valid": False, "errors": ["Cannot read image dimensions"]}

    if errors:
        return {"valid": False, "errors": errors}

    return {"valid": True, "errors": []}


class ImageService:
    @staticmethod
    def upload(db: Session, tenant_id: str, project_id: str, user_id: str, file, batch_id: Optional[str] = None) -> ImageAsset:
        content = file.file.read()

        # Validate image
        validation = validate_image(content, file.filename or "unknown")
        if not validation["valid"]:
            raise ValueError(f"Invalid image: {'; '.join(validation['errors'])}")

        checksum = hashlib.sha256(content).hexdigest()

        existing = db.exec(
            select(ImageAsset).where(
                ImageAsset.project_id == project_id,
                ImageAsset.checksum == checksum,
            )
        ).first()
        if existing:
            raise ValueError("Duplicate image detected (same checksum)")

        img_id = f"img_{uuid.uuid4().hex[:12]}"
        ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
        save_name = f"{img_id}{ext}"

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        save_path = os.path.join(settings.UPLOAD_DIR, save_name)
        with open(save_path, "wb") as f:
            f.write(content)

        width, height = None, None
        try:
            with PILImage.open(save_path) as img:
                width, height = img.size
        except Exception:
            raise ValueError("Invalid image file")

        thumbnail_path = None
        try:
            thumb_dir = settings.THUMBNAIL_DIR
            os.makedirs(thumb_dir, exist_ok=True)
            thumb_name = f"thumb_{img_id}.jpg"
            thumb_full = os.path.join(thumb_dir, thumb_name)
            with PILImage.open(save_path) as img:
                img.thumbnail((400, 400))
                img.save(thumb_full, "JPEG")
            thumbnail_path = f"/static/thumbnails/{thumb_name}"
        except Exception:
            pass

        image = ImageAsset(
            id=img_id,
            tenant_id=tenant_id,
            project_id=project_id,
            file_path=f"/static/uploads/{save_name}",
            thumbnail_path=thumbnail_path,
            file_name=file.filename,
            width=width,
            height=height,
            file_size=len(content),
            checksum=checksum,
            upload_batch_id=batch_id or f"batch_{uuid.uuid4().hex[:8]}",
            created_by=user_id,
        )
        db.add(image)
        db.commit()
        db.refresh(image)
        return image

    @staticmethod
    def list_images(
        db: Session,
        project_id: str,
        page: int = 1,
        page_size: int = 20,
        label_status: Optional[str] = None,
        quality_status: Optional[str] = None,
    ) -> dict:
        query = select(ImageAsset).where(ImageAsset.project_id == project_id)
        if label_status:
            query = query.where(ImageAsset.label_status == label_status)
        if quality_status:
            query = query.where(ImageAsset.quality_status == quality_status)

        total = db.exec(select(func.count()).select_from(query.subquery())).one()
        images = db.exec(query.order_by(ImageAsset.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()

        from app.models.annotation import Annotation

        result = []
        for img in images:
            ann_count = db.exec(
                select(func.count(Annotation.id)).where(Annotation.image_id == img.id)
            ).one()
            d = img.model_dump()
            d["annotation_count"] = ann_count
            result.append(d)

        return {"images": result, "total": total, "page": page, "page_size": page_size}

    @staticmethod
    def get(db: Session, image_id: str) -> Optional[ImageAsset]:
        return db.get(ImageAsset, image_id)

    @staticmethod
    def delete(db: Session, image_id: str) -> bool:
        image = db.get(ImageAsset, image_id)
        if not image:
            return False
        db.delete(image)
        db.commit()
        return True
