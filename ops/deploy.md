# 可为科技 部署指南

> Alibaba Linux 3，从零到上线

---

## 0. 安全组开端口

阿里云控制台 → 安全组 → 入方向规则：

| 端口 | 用途 |
|---|---|
| 80 | 前端页面 |
| 22 | SSH |

---

## 1. 装 Docker

```bash
ssh root@你的IP

# Alibaba Linux 3
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-compose-plugin

# 国内镜像加速（必须）
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
EOF

systemctl daemon-reload
systemctl enable --now docker
docker --version
```

## 2. 拉代码

```bash
cd /root
git clone https://github.com/RuthlessCreature/hetianxia.git
cd hetianxia
```

## 3. 配置

```bash
cat > .env << EOF
HTX_APP_NAME=高纳AI
HTX_COMPANY_NAME=高纳科技
HTX_PLATFORM_NAME=工业视觉平台
HTX_THEME=light
HTX_LAYOUT=sidebar
HTX_HOST_BIND=0.0.0.0
HTX_FRONTEND_PORT=80
HTX_BACKEND_PORT=8000
HTX_SAM_MODEL_SIZE=tiny
HTX_SAM_MODELS_DIR=./models
HTX_DATABASE_URL=sqlite:///./data/hetianxia.db
HTX_SECRET_KEY=$(openssl rand -hex 32)
HTX_ALGORITHM=HS256
HTX_ACCESS_TOKEN_EXPIRE_MINUTES=1440
HTX_UPLOAD_DIR=./data/uploads
HTX_THUMBNAIL_DIR=./data/thumbnails
EOF

mkdir -p data/uploads data/thumbnails data/models
```

下载 AI 模型：

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates
bash scripts/download-ai-models.sh
```

## 4. 启动

```bash
docker compose up -d --build
docker compose exec backend python seed.py
```

## 5. 验证

```
浏览器: http://你的公网IP
API文档: http://你的IP:8000/docs
```

---

## 改名字

`.env` 里改 `HTX_APP_NAME=你的名字`，重新 `docker compose up -d`。

---

## 运维

```bash
docker compose ps          # 状态
docker compose logs -f     # 日志
docker compose restart     # 重启
docker compose down        # 停

# 备份
tar -czf backup_$(date +%Y%m%d).tar.gz data/
```
