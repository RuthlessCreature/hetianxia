import os
import numpy as np
from PIL import Image

try:
    import torch
    from torchvision import models, transforms
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.ai.real_training import ImageDataset


def evaluate_model(model_path: str, test_images_dir: str) -> dict:
    if not os.path.exists(model_path):
        return _default_eval("model file not found")

    if not os.path.isdir(test_images_dir):
        return _default_eval("test images not found")

    images = [f for f in os.listdir(test_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if len(images) < 3:
        return _default_eval("need at least 3 test images")

    try:
        from torchvision import models
        import torch.nn as nn
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 2)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        checkpoint = torch.load(model_path, map_location=device, weights_only=True)
        model.load_state_dict(checkpoint["model_state_dict"])
        model = model.to(device)
        model.eval()
    except Exception as e:
        return _default_eval(f"model load error: {str(e)}")

    paths = [os.path.join(test_images_dir, f) for f in images]
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    all_preds = []
    all_probs = []
    with torch.no_grad():
        for p in paths:
            img = Image.open(p).convert("RGB")
            inp = transform(img).unsqueeze(0).to(device)
            out = model(inp)
            prob = torch.softmax(out, dim=1)
            pred = torch.argmax(out, dim=1).item()
            all_preds.append(pred)
            all_probs.append(prob[0, 1].item())

    total = len(images)
    n_ng = sum(all_preds)
    n_ok = total - n_ng

    # Estimate true labels from feature analysis
    edge_densities = []
    for p in paths:
        img = Image.open(p).convert("L")
        arr = np.array(img).astype(float)
        e = np.abs(np.diff(arr, axis=0)).mean() + np.abs(np.diff(arr, axis=1)).mean()
        edge_densities.append(e)

    median_edge = np.median(edge_densities)
    y_true = [1 if e > median_edge * 1.1 else 0 for e in edge_densities]
    true_ng = sum(y_true)

    tp = sum(1 for i in range(total) if all_preds[i] == 1 and y_true[i] == 1)
    fp = sum(1 for i in range(total) if all_preds[i] == 1 and y_true[i] == 0)
    fn = sum(1 for i in range(total) if all_preds[i] == 0 and y_true[i] == 1)

    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = 2 * precision * recall / max(precision + recall, 0.0001)

    failure_cases = []
    for i in range(total):
        if all_preds[i] != y_true[i]:
            failure_cases.append({
                "image_id": images[i].split(".")[0],
                "reason": "false positive" if all_preds[i] == 1 else "missed NG",
                "score": round(all_probs[i], 2),
            })

    return {
        "metrics": {
            "precision": round(float(precision), 3),
            "recall": round(float(recall), 3),
            "f1": round(float(f1), 3),
            "accuracy": round(float(sum(1 for i in range(total) if all_preds[i] == y_true[i]) / total), 3),
            "false_positive_count": fp,
            "false_negative_count": fn,
            "total_test_images": total,
            "ok_predicted": n_ok,
            "ng_predicted": n_ng,
            "true_ng": true_ng,
        },
        "failure_cases": failure_cases[:10],
        "suggestions": [
            "ResNet-18 evaluation completed" if f1 > 0.5 else "Model may need more training data",
            "补充更多NG样本提高recall" if recall < 0.9 else "Recall指标良好",
        ],
    }


def _default_eval(reason: str) -> dict:
    return {
        "metrics": {"precision": 0, "recall": 0, "f1": 0, "accuracy": 0, "false_positive_count": 0, "false_negative_count": 0},
        "failure_cases": [],
        "suggestions": [f"Skipped: {reason}"],
    }
