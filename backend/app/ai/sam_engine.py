"""
SAM2 (Segment Anything Model 2) 集成模块
支持自动下载模型、多模型切换、点击分割、框精细化。

模型:
  tiny   93MB  (默认)  → sam2_hiera_tiny.pt
  small  184MB          → sam2_hiera_small.pt
  base   323MB          → sam2_hiera_base_plus.pt
  large  896MB          → sam2_hiera_large.pt

依赖:
  pip install segment-anything-2   (推荐)
  pip install segment-anything     (SAM1 回退)

下载源:
  https://dl.fbaipublicfiles.com/segment_anything_2/092824/
"""

import os
import sys
import warnings
import numpy as np
from PIL import Image

warnings.filterwarnings("ignore")

# ====== 模型注册表 ======
MODEL_REGISTRY = {
    "tiny": {
        "name": "SAM2 Hiera-Tiny",
        "config": "sam2_hiera_t.yaml",
        "checkpoint": "sam2_hiera_tiny.pt",
        "url": "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2_hiera_tiny.pt",
        "size_mb": 93,
    },
    "small": {
        "name": "SAM2 Hiera-Small",
        "config": "sam2_hiera_s.yaml",
        "checkpoint": "sam2_hiera_small.pt",
        "url": "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2_hiera_small.pt",
        "size_mb": 184,
    },
    "base": {
        "name": "SAM2 Hiera-Base+",
        "config": "sam2_hiera_b+.yaml",
        "checkpoint": "sam2_hiera_base_plus.pt",
        "url": "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2_hiera_base_plus.pt",
        "size_mb": 323,
    },
    "large": {
        "name": "SAM2 Hiera-Large",
        "config": "sam2_hiera_l.yaml",
        "checkpoint": "sam2_hiera_large.pt",
        "url": "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2_hiera_large.pt",
        "size_mb": 896,
    },
}

DEFAULT_MODEL = os.getenv("SAM_MODEL_SIZE", "tiny")
MODELS_DIR = os.getenv("SAM_MODELS_DIR", "./models")

# ====== 内部状态 ======
_predictor = None
_active_model = None
_features_cache: dict = {}


def _resolve_path(filename: str) -> str:
    return os.path.join(MODELS_DIR, filename)


def _download_model(model_key: str) -> str:
    """下载模型检查点到 models/ 目录，带进度条"""
    import urllib.request

    info = MODEL_REGISTRY[model_key]
    url = info["url"]
    dest = _resolve_path(info["checkpoint"])

    if os.path.exists(dest):
        return dest

    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"[SAM] 下载 {info['name']} ({info['size_mb']}MB) from {url}")
    print(f"[SAM] 保存到 {dest}")

    def _progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            mb = downloaded / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\r[SAM] {mb:.1f}/{total_mb:.1f} MB ({pct}%)")
            sys.stdout.flush()

    urllib.request.urlretrieve(url, dest, _progress)
    print(f"\n[SAM] 下载完成: {dest}")
    return dest


def is_available() -> bool:
    """检查 SAM 是否可用（不触发下载）"""
    try:
        info = MODEL_REGISTRY.get(DEFAULT_MODEL, MODEL_REGISTRY["tiny"])
        if os.path.exists(_resolve_path(info["checkpoint"])):
            return True
        return False
    except Exception:
        return False


def load_model(model_key: str = None) -> dict:
    """
    加载 SAM2 模型。如果检查点不存在，自动下载。
    model_key: tiny | small | base | large
    """
    global _predictor, _active_model

    model_key = model_key or DEFAULT_MODEL
    if model_key not in MODEL_REGISTRY:
        return {"status": "error", "message": f"Unknown model: {model_key}. Options: {list(MODEL_REGISTRY.keys())}"}

    if _predictor is not None and _active_model == model_key:
        return {"status": "ok", "model": model_key, "cached": True}

    info = MODEL_REGISTRY[model_key]

    # 下载检查点
    checkpoint = _download_model(model_key)
    if not os.path.exists(checkpoint):
        return {"status": "error", "message": f"Failed to download {checkpoint}"}

    # 加载模型
    try:
        from sam2.build_sam import build_sam2_vid_predictor

        predictor = build_sam2_vid_predictor(info["config"], checkpoint)
        _predictor = predictor
        _active_model = model_key
        return {"status": "ok", "model": model_key, "name": info["name"], "cached": False}
    except ImportError:
        # 尝试旧版 API
        try:
            from sam2.build_sam import build_sam2
            from sam2.sam2_image_predictor import SAM2ImagePredictor

            sam = build_sam2(info["config"], checkpoint)
            predictor = SAM2ImagePredictor(sam)
            _predictor = predictor
            _active_model = model_key
            return {"status": "ok", "model": model_key, "name": info["name"], "cached": False}
        except ImportError:
            return {"status": "error", "message": "segment-anything-2 not installed. pip install segment-anything-2"}


def encode_image(image_path: str) -> dict:
    """编码图片：送入 SAM 视觉编码器，缓存特征"""
    if image_path in _features_cache:
        return {"status": "ok", "cached": True}

    if _predictor is None:
        result = load_model()
        if result["status"] == "error":
            return result

    img = _read_image(image_path)
    if img is None:
        return {"status": "error", "message": "Cannot read image"}

    try:
        _predictor.set_image(img)
        _features_cache[image_path] = True
        return {"status": "ok", "cached": False}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def decode_point(image_path: str, x: int, y: int, label: int = 1) -> dict:
    """
    点击解码：根据用户点击坐标生成分割 mask。
    x, y: 图像像素坐标
    label: 1=前景(缺陷区域), 0=背景
    """
    if _predictor is None:
        result = load_model()
        if result["status"] == "error":
            return result

    img = _read_image(image_path)
    if img is None:
        return {"status": "error", "message": "Cannot read image"}

    # 编码
    encode_result = encode_image(image_path)
    if encode_result["status"] == "error":
        return encode_result

    input_point = np.array([[x, y]])
    input_label = np.array([label])

    try:
        masks, scores, logits = _predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=True,
        )
    except Exception as e:
        return {"status": "error", "message": f"Prediction failed: {str(e)}"}

    best_idx = np.argmax(scores)
    best_mask = masks[best_idx]
    best_score = float(scores[best_idx])

    return _mask_to_result(best_mask, best_score)


def decode_box(image_path: str, x: int, y: int, w: int, h: int) -> dict:
    """框解码：给定 bbox，SAM 精细化生成 mask"""
    if _predictor is None:
        result = load_model()
        if result["status"] == "error":
            return result

    img = _read_image(image_path)
    if img is None:
        return {"status": "error", "message": "Cannot read image"}

    encode_result = encode_image(image_path)
    if encode_result["status"] == "error":
        return encode_result

    input_box = np.array([[x, y, x + w, y + h]])

    try:
        masks, scores, logits = _predictor.predict(
            point_coords=None,
            point_labels=None,
            box=input_box,
            multimask_output=False,
        )
    except Exception as e:
        return {"status": "error", "message": f"Prediction failed: {str(e)}"}

    mask = masks[0]
    score = float(scores[0])
    return _mask_to_result(mask, score)


def clear_cache(image_path: str = None):
    """清除特征缓存"""
    if image_path:
        _features_cache.pop(image_path, None)
    else:
        _features_cache.clear()


def available_models() -> list[dict]:
    """列出所有可用模型及其状态"""
    result = []
    for key, info in MODEL_REGISTRY.items():
        downloaded = os.path.exists(_resolve_path(info["checkpoint"]))
        result.append({
            "key": key,
            "name": info["name"],
            "size_mb": info["size_mb"],
            "downloaded": downloaded,
            "active": _active_model == key,
        })
    return result


# ====== helpers ======

def _read_image(path: str):
    """读取图片为 RGB numpy 数组"""
    import cv2
    img = cv2.imread(path)
    if img is not None:
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return None


def _mask_to_result(mask: np.ndarray, score: float) -> dict:
    """二值 mask → polygon + bbox"""
    contours = _mask_to_contours(mask)
    if not contours:
        return {"status": "error", "message": "No contour found in mask"}

    largest = max(contours, key=lambda c: len(c))
    if len(largest) > 30:
        step = max(1, len(largest) // 20)
        largest = largest[::step]

    polygon = [{"x": int(pt[0][0]), "y": int(pt[0][1])} for pt in largest]

    ys, xs = np.where(mask)
    if len(ys) > 0:
        bbox = {
            "x": int(xs.min()), "y": int(ys.min()),
            "w": int(xs.max() - xs.min()), "h": int(ys.max() - ys.min()),
        }
    else:
        bbox = {"x": 0, "y": 0, "w": 10, "h": 10}

    return {
        "status": "ok",
        "polygon": polygon,
        "bbox": bbox,
        "score": round(score, 3),
    }


def _mask_to_contours(mask: np.ndarray):
    import cv2
    mask_uint8 = (mask * 255).astype(np.uint8)
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours
