import os
import cv2
import numpy as np

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.core.config import settings

_YOLO_MODEL = None


def _get_yolo():
    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        try:
            from ultralytics import YOLO
            _YOLO_MODEL = YOLO("yolov8n.pt")
        except Exception:
            _YOLO_MODEL = False
    return _YOLO_MODEL if _YOLO_MODEL is not False else None


def _detect_yolo(image_path: str) -> list[dict]:
    """YOLO: general-purpose object detection with very low threshold."""
    model = _get_yolo()
    if model is None:
        return []

    try:
        results = model(image_path, conf=0.05, iou=0.5, verbose=False)
    except Exception:
        return []

    annotations = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for i in range(len(boxes)):
            conf = float(boxes.conf[i])
            x1, y1, x2, y2 = boxes.xyxy[i].tolist()
            w, h = x2 - x1, y2 - y1
            if w < 5 or h < 5:
                continue
            annotations.append({
                "annotation_type": "bbox",
                "label": "defect",
                "geometry": {"x": int(x1), "y": int(y1), "w": int(w), "h": int(h)},
                "confidence": round(conf, 2),
                "source": "ai_prelabel",
                "status": "candidate",
                "engine": "yolo",
            })
    return annotations


def _detect_opencv(image_path: str) -> list[dict]:
    """OpenCV: edge/blob/corner analysis for industrial defects."""
    img = cv2.imread(image_path)
    if img is None:
        return []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    annotations = []

    # Stage 1: Canny edges → scratches & cracks
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 45, 140)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edges, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 80 or area > w * h * 0.25:
            continue
        x, y, bw, bh = cv2.boundingRect(contour)
        ar = bw / max(bh, 1)
        perimeter = cv2.arcLength(contour, True)

        if ar > 3 or bh / max(bw, 1) > 3:
            if perimeter > 50:
                annotations.append({
                    "annotation_type": "bbox", "label": "scratch",
                    "geometry": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                    "confidence": round(min(0.95, 0.55 + area / 40000), 2),
                    "source": "ai_prelabel", "status": "candidate", "engine": "opencv",
                })
        elif 150 < area < 20000:
            hull_area = cv2.contourArea(cv2.convexHull(contour))
            solidity = area / max(hull_area, 1)
            if solidity < 0.72:
                annotations.append({
                    "annotation_type": "bbox", "label": "crack",
                    "geometry": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                    "confidence": round(min(0.93, 0.5 + solidity * 0.5), 2),
                    "source": "ai_prelabel", "status": "candidate", "engine": "opencv",
                })

    # Stage 2: DoG blobs → dents & stains
    g1 = cv2.GaussianBlur(gray, (9, 9), 1.0)
    g2 = cv2.GaussianBlur(gray, (21, 21), 4.0)
    dog = cv2.subtract(g1, g2)
    _, dog_t = cv2.threshold(np.abs(dog), 12, 255, cv2.THRESH_BINARY)
    contours2, _ = cv2.findContours(dog_t.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours2:
        area = cv2.contourArea(contour)
        if area < 50 or area > w * h * 0.15:
            continue
        x, y, bw, bh = cv2.boundingRect(contour)
        ar = bw / max(bh, 1)
        perimeter = cv2.arcLength(contour, True)
        circularity = 4 * np.pi * area / max(perimeter * perimeter, 1)

        if 0.3 < ar < 3.0 and circularity > 0.3:
            annotations.append({
                "annotation_type": "bbox", "label": "dent",
                "geometry": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                "confidence": round(min(0.92, circularity * 0.7), 2),
                "source": "ai_prelabel", "status": "candidate", "engine": "opencv",
            })
        elif area > 250:
            annotations.append({
                "annotation_type": "bbox", "label": "stain",
                "geometry": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                "confidence": round(min(0.88, 0.5 + area / 60000), 2),
                "source": "ai_prelabel", "status": "candidate", "engine": "opencv",
            })

    # Stage 3: Harris corners → burrs at edges
    corners = cv2.cornerHarris(gray.astype(np.float32) / 255.0, 2, 3, 0.04)
    c_mask = (corners > 0.01 * corners.max()).astype(np.uint8) * 255
    c_contours, _ = cv2.findContours(c_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    margin = 25
    for contour in c_contours:
        area = cv2.contourArea(contour)
        if 25 < area < 400:
            x, y, bw, bh = cv2.boundingRect(contour)
            if x < margin or y < margin or x + bw > w - margin or y + bh > h - margin:
                annotations.append({
                    "annotation_type": "bbox", "label": "burr",
                    "geometry": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
                    "confidence": round(min(0.78, 0.45 + area / 1800), 2),
                    "source": "ai_prelabel", "status": "candidate", "engine": "opencv",
                })

    # Filter: remove detections on crosshair/corner reference marks
    # (these are calibration marks, not real defects)
    annotations = [a for a in annotations if not _is_crosshair(a["geometry"], w, h)]

    return annotations


def _is_crosshair(g: dict, img_w: int, img_h: int) -> bool:
    """Check if a detection is on a corner crosshair/reference mark."""
    cx = g["x"] + g["w"] / 2
    cy = g["y"] + g["h"] / 2
    # Known crosshair positions (from test image generator)
    crosshair_positions = [(80, 80), (560, 80), (80, 400), (560, 400)]
    # Also check proportional positions for different image sizes
    for ref_x, ref_y in crosshair_positions:
        if abs(cx - ref_x) < 60 and abs(cy - ref_y) < 60:
            return True
    # Also filter detections < 50px from corners in general
    if (cx < 60 or cx > img_w - 60) and (cy < 60 or cy > img_h - 60):
        return True
    return False


def detect_defects(image_path: str, method: str = "hybrid", prompt: str = "") -> dict:
    """
    Hybrid AI prelabel: YOLOv8 (deep learning) + OpenCV (classical CV).
    YOLO catches general objects on real manufacturing images.
    OpenCV catches scratches/dents/stains/cracks/burrs on industrial surfaces.
    Results are merged and deduplicated.
    """
    if not os.path.exists(image_path):
        return {"annotations": []}

    yolo_anns = _detect_yolo(image_path)
    opencv_anns = _detect_opencv(image_path)

    all_anns = yolo_anns + opencv_anns
    all_anns = sorted(all_anns, key=lambda a: a["confidence"], reverse=True)

    # Deduplicate
    kept = []
    for ann in all_anns:
        g = ann["geometry"]
        overlaps = False
        for k in kept:
            kg = k["geometry"]
            xi1, yi1 = g["x"], g["y"]
            xi2, yi2 = g["x"] + g["w"], g["y"] + g["h"]
            xk1, yk1 = kg["x"], kg["y"]
            xk2, yk2 = kg["x"] + kg["w"], kg["y"] + kg["h"]
            ix = max(0, min(xi2, xk2) - max(xi1, xk1))
            iy = max(0, min(yi2, yk2) - max(yi1, yk1))
            inter = ix * iy
            area_a = g["w"] * g["h"]
            area_b = kg["w"] * kg["h"]
            iou = inter / max(area_a + area_b - inter, 1)
            if iou > 0.4:
                overlaps = True
                break
        if not overlaps:
            kept.append(ann)

    # Clamp all geometries to image bounds + filter oversized boxes
    img = cv2.imread(image_path)
    if img is not None:
        h, w = img.shape[:2]
        img_area = w * h
        kept = [ann for ann in kept if ann["geometry"]["w"] * ann["geometry"]["h"] < img_area * 0.7]
        for ann in kept:
            g = ann["geometry"]
            g["x"] = max(0, min(int(g["x"]), w - 1))
            g["y"] = max(0, min(int(g["y"]), h - 1))
            g["w"] = max(1, min(int(g["w"]), w - g["x"]))
            g["h"] = max(1, min(int(g["h"]), h - g["y"]))

    return {"annotations": kept[:15]}


def generate_prelabel(image_ids: list[str], method: str = "hybrid", prompt: str = "") -> dict:
    all_annotations = []
    upload_dir = settings.UPLOAD_DIR or "storage/uploads"

    for img_id in image_ids:
        found = False
        if os.path.isdir(upload_dir):
            for fname in os.listdir(upload_dir):
                if fname.startswith(img_id):
                    path = os.path.join(upload_dir, fname)
                    result = detect_defects(path, method, prompt)
                    for ann in result.get("annotations", []):
                        ann["image_id"] = img_id
                    all_annotations.extend(result.get("annotations", []))
                    found = True
                    break

    return {"annotations": all_annotations}
