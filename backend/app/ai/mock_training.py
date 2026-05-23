import random
import time
from datetime import datetime


def generate_mock_training(task_type: str, strategy: str = "fast_baseline") -> dict:
    base_precision = round(random.uniform(0.85, 0.96), 3)
    base_recall = round(random.uniform(0.82, 0.96), 3)
    f1 = round(2 * base_precision * base_recall / (base_precision + base_recall), 3)

    metrics = {
        "precision": base_precision,
        "recall": base_recall,
        "f1": f1,
    }

    if task_type == "object_detection":
        metrics["map50"] = round(random.uniform(0.80, 0.94), 3)
        metrics["map75"] = round(random.uniform(0.70, 0.88), 3)
    elif task_type == "classification":
        metrics["accuracy"] = round(random.uniform(0.88, 0.97), 3)
    elif task_type == "segmentation":
        metrics["miou"] = round(random.uniform(0.75, 0.92), 3)

    return {
        "status": "succeeded",
        "metrics": metrics,
        "artifact_path": f"mock://models/model_{random.randint(1000, 9999)}.onnx",
    }


def generate_mock_logs() -> list[str]:
    epochs = 5
    logs = []
    for e in range(1, epochs + 1):
        loss = round(2.5 - e * 0.4 + random.uniform(-0.1, 0.1), 4)
        logs.append(f"[{datetime.utcnow().isoformat()}] Epoch {e}/{epochs} - loss: {loss:.4f} - val_loss: {loss + 0.05:.4f}")
        logs.append(f"[{datetime.utcnow().isoformat()}] Epoch {e}/{epochs} - lr: {0.001 * (0.9 ** (e-1)):.6f}")
    logs.append(f"[{datetime.utcnow().isoformat()}] Training completed successfully.")
    return logs
