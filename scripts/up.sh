#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

WITH_MODELS=0
NO_BUILD=0
NO_SEED=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/up.sh [options]

Options:
  --with-models   Download default AI models before starting.
  --all-models    Download all SAM2 models before starting.
  --no-build      Start without rebuilding images.
  --no-seed       Skip demo database seed.
  -h, --help      Show this help.

Examples:
  bash scripts/up.sh
  bash scripts/up.sh --with-models
  bash scripts/up.sh --all-models
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-models)
      WITH_MODELS=1
      MODEL_ARGS=(--default)
      ;;
    --all-models)
      WITH_MODELS=1
      MODEL_ARGS=(--all)
      ;;
    --no-build)
      NO_BUILD=1
      ;;
    --no-seed)
      NO_SEED=1
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

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker first." >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is not installed. On Ubuntu 20.04 you can run: apt install docker-compose" >&2
  exit 1
fi

write_env() {
  local key="$1"
  local value="$2"
  local tmp=""
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    tmp="$(mktemp "${ENV_FILE}.XXXXXX")"
    awk -v key="$key" -v value="$value" '
      index($0, key "=") == 1 { $0 = key "=" value }
      { print }
    ' "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

ensure_env() {
  local key="$1"
  local value="$2"
  local override="${!key-}"
  if [[ -n "$override" ]]; then
    write_env "$key" "$override"
    return
  fi

  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    write_env "$key" "$value"
  fi
}

touch "$ENV_FILE"
ensure_env "HTX_APP_NAME" "高纳AI"
ensure_env "HTX_COMPANY_NAME" "高纳科技"
ensure_env "HTX_PLATFORM_NAME" "工业视觉平台"
ensure_env "HTX_THEME" "light"
ensure_env "HTX_LAYOUT" "sidebar"
ensure_env "HTX_HOST_BIND" "0.0.0.0"
ensure_env "HTX_FRONTEND_PORT" "80"
ensure_env "HTX_BACKEND_PORT" "8000"
ensure_env "HTX_PYTHON_BASE_IMAGE" "python:3.12-slim"
ensure_env "HTX_NODE_BASE_IMAGE" "node:20-alpine"
ensure_env "HTX_NGINX_BASE_IMAGE" "nginx:alpine"
ensure_env "HTX_SAM_MODEL_SIZE" "tiny"
ensure_env "HTX_SAM_MODELS_DIR" "./models"
ensure_env "HTX_DATABASE_URL" "sqlite:///./data/hetianxia.db"
ensure_env "HTX_SECRET_KEY" "$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32)"
ensure_env "HTX_ALGORITHM" "HS256"
ensure_env "HTX_ACCESS_TOKEN_EXPIRE_MINUTES" "1440"
ensure_env "HTX_UPLOAD_DIR" "./data/uploads"
ensure_env "HTX_THUMBNAIL_DIR" "./data/thumbnails"

mkdir -p "$ROOT_DIR/data/uploads" "$ROOT_DIR/data/thumbnails" "$ROOT_DIR/backend/models"

if [[ "$WITH_MODELS" == "1" ]]; then
  bash "$ROOT_DIR/scripts/download-ai-models.sh" "${MODEL_ARGS[@]}"
fi

cd "$ROOT_DIR"
echo "Compose command: ${COMPOSE[*]}"

if [[ "$NO_BUILD" == "1" ]]; then
  "${COMPOSE[@]}" up -d
else
  "${COMPOSE[@]}" up -d --build
fi

if [[ "$NO_SEED" != "1" ]]; then
  "${COMPOSE[@]}" exec -T backend python seed.py 2>/dev/null || echo "seed skipped"
fi

FRONTEND_PORT="$(grep '^HTX_FRONTEND_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
BACKEND_PORT="$(grep '^HTX_BACKEND_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

echo ""
echo "Started."
echo "Frontend: http://SERVER_IP:${FRONTEND_PORT}"
echo "Backend:  http://SERVER_IP:${BACKEND_PORT}"
echo "API docs: http://SERVER_IP:${BACKEND_PORT}/docs"
