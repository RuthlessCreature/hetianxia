import random


def generate_mock_evaluation(task_type: str) -> dict:
    precision = round(random.uniform(0.85, 0.96), 3)
    recall = round(random.uniform(0.82, 0.96), 3)
    f1 = round(2 * precision * recall / (precision + recall), 3)
    fp_count = random.randint(3, 15)
    fn_count = random.randint(1, 8)
    avg_inference_ms = random.randint(15, 45)

    metrics = {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "false_positive_count": fp_count,
        "false_negative_count": fn_count,
        "avg_inference_ms": avg_inference_ms,
    }

    if task_type == "object_detection":
        metrics.update({
            "map50": round(random.uniform(0.80, 0.94), 3),
            "miss_rate": round(fn_count / 100, 3),
            "false_positive_rate": round(fp_count / 100, 3),
        })
    elif task_type == "anomaly_detection":
        metrics.update({
            "auroc": round(random.uniform(0.88, 0.98), 3),
            "aupr": round(random.uniform(0.75, 0.95), 3),
        })

    failure_cases = [
        {
            "image_id": f"img_mock_{i}",
            "reason": random.choice(["missed tiny scratch", "false alarm on texture", "low contrast defect", "edge artifact"]),
            "score": round(random.uniform(0.2, 0.6), 2),
        }
        for i in range(1, 6)
    ]

    suggestions = [
        "补充极细划痕样本",
        "补充强反光 OK 样本",
        "检查标注类别是否混用",
        "增加数据增强强度",
    ]

    return {
        "metrics": metrics,
        "failure_cases": failure_cases,
        "suggestions": suggestions,
    }
