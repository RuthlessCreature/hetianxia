#!/bin/bash
# ============================================
# 高纳AI - 阿里云轻量服务器一键部署脚本
# 适用: CentOS 7+ / Ubuntu 18+ / Debian 10+
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"

HTX_APP_NAME="${HTX_APP_NAME:-高纳AI}"
HTX_COMPANY_NAME="${HTX_COMPANY_NAME:-高纳科技}"
HTX_PLATFORM_NAME="${HTX_PLATFORM_NAME:-工业视觉平台}"
HTX_THEME="${HTX_THEME:-light}"
HTX_LAYOUT="${HTX_LAYOUT:-sidebar}"
HTX_HOST_BIND="${HTX_HOST_BIND:-0.0.0.0}"
HTX_FRONTEND_PORT="${HTX_FRONTEND_PORT:-80}"
HTX_BACKEND_PORT="${HTX_BACKEND_PORT:-8000}"
HTX_PYTHON_BASE_IMAGE="${HTX_PYTHON_BASE_IMAGE:-python:3.12-slim}"
HTX_NODE_BASE_IMAGE="${HTX_NODE_BASE_IMAGE:-node:20-alpine}"
HTX_NGINX_BASE_IMAGE="${HTX_NGINX_BASE_IMAGE:-nginx:alpine}"
HTX_SAM_MODEL_SIZE="${HTX_SAM_MODEL_SIZE:-tiny}"
HTX_SAM_MODELS_DIR="${HTX_SAM_MODELS_DIR:-./models}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ${HTX_APP_NAME} - ${HTX_PLATFORM_NAME} 部署脚本  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ---------- 1. 检测系统 ----------
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi
echo -e "${YELLOW}[1/7] 检测系统: $OS${NC}"

# ---------- 2. 安装 Docker ----------
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[2/7] 安装 Docker...${NC}"
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get update -y
        sudo apt-get install -y docker.io
        sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "alinux" ]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    sudo systemctl start docker
    sudo systemctl enable docker
    echo -e "${GREEN}Docker 安装完成${NC}"
else
    echo -e "${GREEN}[2/7] Docker 已安装${NC}"
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${YELLOW}未检测到 Docker Compose，尝试安装 legacy docker-compose...${NC}"
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get update -y
        sudo apt-get install -y docker-compose
    else
        echo -e "${RED}请先安装 Docker Compose v2 插件或 legacy docker-compose${NC}"
        exit 1
    fi
    COMPOSE_CMD="docker-compose"
fi
echo -e "${GREEN}Compose 命令: $COMPOSE_CMD${NC}"

# ---------- 3. 创建项目目录 ----------
echo -e "${YELLOW}[3/7] 创建项目目录...${NC}"
mkdir -p "$ROOT_DIR/data/uploads" "$ROOT_DIR/data/thumbnails" "$ROOT_DIR/backend/models"

ensure_env() {
    local key="$1"
    local value="$2"
    if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# ---------- 4. 生成/补齐 .env ----------
echo -e "${YELLOW}[4/7] 生成/补齐 .env...${NC}"
touch "$ENV_FILE"
ensure_env "HTX_APP_NAME" "$HTX_APP_NAME"
ensure_env "HTX_COMPANY_NAME" "$HTX_COMPANY_NAME"
ensure_env "HTX_PLATFORM_NAME" "$HTX_PLATFORM_NAME"
ensure_env "HTX_THEME" "$HTX_THEME"
ensure_env "HTX_LAYOUT" "$HTX_LAYOUT"
ensure_env "HTX_HOST_BIND" "$HTX_HOST_BIND"
ensure_env "HTX_FRONTEND_PORT" "$HTX_FRONTEND_PORT"
ensure_env "HTX_BACKEND_PORT" "$HTX_BACKEND_PORT"
ensure_env "HTX_PYTHON_BASE_IMAGE" "$HTX_PYTHON_BASE_IMAGE"
ensure_env "HTX_NODE_BASE_IMAGE" "$HTX_NODE_BASE_IMAGE"
ensure_env "HTX_NGINX_BASE_IMAGE" "$HTX_NGINX_BASE_IMAGE"
ensure_env "HTX_SAM_MODEL_SIZE" "$HTX_SAM_MODEL_SIZE"
ensure_env "HTX_SAM_MODELS_DIR" "$HTX_SAM_MODELS_DIR"
ensure_env "HTX_DATABASE_URL" "sqlite:///./data/hetianxia.db"
ensure_env "HTX_SECRET_KEY" "$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)"
ensure_env "HTX_ALGORITHM" "HS256"
ensure_env "HTX_ACCESS_TOKEN_EXPIRE_MINUTES" "1440"
ensure_env "HTX_UPLOAD_DIR" "./data/uploads"
ensure_env "HTX_THUMBNAIL_DIR" "./data/thumbnails"

# ---------- 5. 拉取/构建 ----------
echo -e "${YELLOW}[5/7] 构建镜像（需要几分钟）...${NC}"
cd "$ROOT_DIR"
sudo $COMPOSE_CMD build

# ---------- 6. 启动服务 ----------
echo -e "${YELLOW}[6/7] 启动服务...${NC}"
sudo $COMPOSE_CMD up -d

# ---------- 7. 初始化数据库 ----------
echo -e "${YELLOW}[7/7] 初始化数据库...${NC}"
sleep 3
sudo $COMPOSE_CMD exec -T backend python seed.py 2>/dev/null || echo "seed跳过（已初始化）"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')
echo "  前端: http://${SERVER_IP}:${HTX_FRONTEND_PORT}"
echo "  后端: http://${SERVER_IP}:${HTX_BACKEND_PORT}"
echo "  API文档: http://${SERVER_IP}:${HTX_BACKEND_PORT}/docs"
echo ""
echo "  管理命令:"
echo "    cd $ROOT_DIR"
echo "    sudo $COMPOSE_CMD ps          # 查看状态"
echo "    sudo $COMPOSE_CMD logs -f     # 查看日志"
echo "    sudo $COMPOSE_CMD restart     # 重启"
echo "    sudo $COMPOSE_CMD down        # 停止"
echo "    sudo $COMPOSE_CMD up -d       # 启动"
echo ""
