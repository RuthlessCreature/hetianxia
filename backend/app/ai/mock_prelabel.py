import hashlib
import random
import time
from datetime import datetime


def generate_mock_prelabel(image_ids: list[str], method: str = "mock_bbox", prompt: str = "") -> dict:
    annotations = []
    labels = ["scratch", "dent", "stain", "crack", "burr"]

    for img_id in image_ids:
        seed = int(hashlib.md5(img_id.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        count = rng.randint(0, 5)
        for _ in range(count):
            annotations.append(
                {
                    "image_id": img_id,
                    "annotation_type": "bbox",
                    "label": rng.choice(labels),
                    "geometry": {
                        "x": rng.randint(10, 500),
                        "y": rng.randint(10, 500),
                        "w": rng.randint(30, 200),
                        "h": rng.randint(10, 100),
                    },
                    "confidence": round(rng.uniform(0.55, 0.95), 2),
                    "source": "ai_prelabel",
                    "status": "candidate",
                }
            )

    return {"annotations": annotations}
