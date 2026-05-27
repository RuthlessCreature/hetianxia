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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  高纳AI - 工业视觉平台 部署脚本  ${NC}"
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
        sudo apt-get install -y docker.io docker-compose-v2
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

# ---------- 3. 创建项目目录 ----------
echo -e "${YELLOW}[3/7] 创建项目目录...${NC}"
sudo mkdir -p /opt/hetianxia/data/uploads /opt/hetianxia/data/thumbnails
sudo chmod -R 755 /opt/hetianxia/data

# ---------- 4. 生成 SECRET_KEY ----------
echo -e "${YELLOW}[4/7] 生成安全密钥...${NC}"
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
echo "DATABASE_URL=sqlite:///./data/hetianxia.db" > /opt/hetianxia/.env
echo "SECRET_KEY=$SECRET_KEY" >> /opt/hetianxia/.env
echo "ALGORITHM=HS256" >> /opt/hetianxia/.env
echo "ACCESS_TOKEN_EXPIRE_MINUTES=1440" >> /opt/hetianxia/.env
echo "UPLOAD_DIR=./data/uploads" >> /opt/hetianxia/.env
echo "THUMBNAIL_DIR=./data/thumbnails" >> /opt/hetianxia/.env

# ---------- 5. 拉取/构建 ----------
echo -e "${YELLOW}[5/7] 构建镜像（需要几分钟）...${NC}"
cd /opt/hetianxia
sudo docker compose build

# ---------- 6. 启动服务 ----------
echo -e "${YELLOW}[6/7] 启动服务...${NC}"
sudo docker compose up -d

# ---------- 7. 初始化数据库 ----------
echo -e "${YELLOW}[7/7] 初始化数据库...${NC}"
sleep 3
sudo docker compose exec -T backend python seed.py 2>/dev/null || echo "seed跳过（已初始化）"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  前端: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "  后端: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):8000"
echo "  API文档: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):8000/docs"
echo ""
echo "  管理命令:"
echo "    cd /opt/hetianxia"
echo "    sudo docker compose ps          # 查看状态"
echo "    sudo docker compose logs -f     # 查看日志"
echo "    sudo docker compose restart     # 重启"
echo "    sudo docker compose down        # 停止"
echo "    sudo docker compose up -d       # 启动"
echo ""
