#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
SAM_DIR="${HTX_SAM_MODELS_DIR:-$BACKEND_DIR/models}"
YOLO_PATH="$BACKEND_DIR/yolov8n.pt"

DOWNLOAD_YOLO=1
SAM_SELECTION="tiny"
INSTALL_DEPS=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/download-ai-models.sh [options]

Options:
  --default        Download YOLOv8n + SAM2 tiny. This is the default.
  --all            Download YOLOv8n + all SAM2 checkpoints.
  --sam LIST       Download selected SAM2 checkpoints: tiny,small,base,large or all.
  --no-yolo        Skip YOLOv8n.
  --yolo-only      Download only YOLOv8n.
  --install-deps   Install Ubuntu download dependencies with apt-get.
  -h, --help       Show this help.

Examples:
  bash scripts/download-ai-models.sh
  bash scripts/download-ai-models.sh --all
  bash scripts/download-ai-models.sh --sam tiny,small --no-yolo
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --default)
      DOWNLOAD_YOLO=1
      SAM_SELECTION="tiny"
      ;;
    --all)
      DOWNLOAD_YOLO=1
      SAM_SELECTION="all"
      ;;
    --sam)
      SAM_SELECTION="${2:-}"
      shift
      ;;
    --no-yolo)
      DOWNLOAD_YOLO=0
      ;;
    --yolo-only)
      DOWNLOAD_YOLO=1
      SAM_SELECTION=""
      ;;
    --install-deps)
      INSTALL_DEPS=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
  shift
done

if [[ "$INSTALL_DEPS" == "1" ]]; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required. On Ubuntu run: sudo apt-get update && sudo apt-get install -y curl ca-certificates" >&2
  exit 1
fi

download_file() {
  local url="$1"
  local dest="$2"
  local label="$3"

  mkdir -p "$(dirname "$dest")"
  if [[ -s "$dest" ]]; then
    echo "[skip] $label already exists: $dest"
    return
  fi

  local tmp="${dest}.tmp"
  rm -f "$tmp"
  echo "[download] $label"
  echo "           $url"
  curl -fL --retry 5 --retry-delay 3 --connect-timeout 30 --progress-bar -o "$tmp" "$url"
  mv "$tmp" "$dest"
  echo "[ok] $dest"
}

download_sam() {
  local key="$1"
  local filename=""
  local url=""

  case "$key" in
    tiny)
      filename="sam2_hiera_tiny.pt"
      url="https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_tiny.pt"
      ;;
    small)
      filename="sam2_hiera_small.pt"
      url="https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_small.pt"
      ;;
    base|base_plus)
      filename="sam2_hiera_base_plus.pt"
      url="https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_base_plus.pt"
      ;;
    large)
      filename="sam2_hiera_large.pt"
      url="https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_large.pt"
      ;;
    "")
      return
      ;;
    *)
      echo "Unknown SAM model: $key. Use tiny,small,base,large or all." >&2
      exit 2
      ;;
  esac

  download_file "$url" "$SAM_DIR/$filename" "SAM2 $key"
}

if [[ "$DOWNLOAD_YOLO" == "1" ]]; then
  download_file \
    "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt" \
    "$YOLO_PATH" \
    "YOLOv8n"
fi

if [[ -n "$SAM_SELECTION" ]]; then
  if [[ "$SAM_SELECTION" == "all" ]]; then
    SAM_SELECTION="tiny,small,base,large"
  fi

  IFS=',' read -ra SAM_KEYS <<< "$SAM_SELECTION"
  for key in "${SAM_KEYS[@]}"; do
    download_sam "$(echo "$key" | xargs)"
  done
fi

echo ""
echo "Model files:"
[[ -e "$YOLO_PATH" ]] && ls -lh "$YOLO_PATH"
[[ -d "$SAM_DIR" ]] && find "$SAM_DIR" -maxdepth 1 -type f -name 'sam2_*.pt' -print0 | xargs -0 -r ls -lh
echo ""
echo "Done. For Docker builds, run: bash scripts/up.sh"
