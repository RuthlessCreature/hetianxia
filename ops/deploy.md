# 高纳AI 部署SOP

> 适用于 Linux VPS（阿里云/腾讯云/华为云/UCloud 等）

---

## 1. 服务器准备

```bash
ssh root@你的IP

# 装 Docker
curl -fsSL https://get.docker.com | bash

# 启动 Docker
systemctl enable docker && systemctl start docker
docker --version
```

## 2. 上传项目

```bash
# 方式A：本地打包上传
# （在你电脑上）
tar -czf gaona.tar.gz \
  --exclude=node_modules \
  --exclude=__pycache__ \
  --exclude=.git \
  --exclude=storage \
  --exclude='*.db' \
  .
scp gaona.tar.gz root@你的IP:/opt/

# （回到服务器上）
cd /opt && tar -xzf gaona.tar.gz -C /opt/gaona
cd /opt/gaona
```

## 3. 配置

```bash
cd /opt/gaona

# 生成密钥
SECRET_KEY=$(openssl rand -hex 32)

# 写 .env
cat > .env << EOF
DATABASE_URL=sqlite:///./data/hetianxia.db
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=./data/uploads
THUMBNAIL_DIR=./data/thumbnails
EOF

# 创建数据目录
mkdir -p data/uploads data/thumbnails data/models
```

## 4. 启动

```bash
docker compose up -d --build
```

等3-5分钟（第一次构建需要拉镜像+编译前端）。

```bash
# 看日志确认启动
docker compose logs -f

# 看到这行就OK了：
# Application startup complete.
```

## 5. 初始化数据

```bash
docker compose exec backend python seed.py
```

输出：
```
Seed data created: 5 users, 4 projects
Demo accounts:
  owner@demo.com / demo123 (owner)
  admin@demo.com / demo123 (admin)
  ...
```

## 6. 验证

```
浏览器打开: http://你的IP
看到登录页 → 部署成功

API文档: http://你的IP:8000/docs
健康检查: http://你的IP:8000/api/health
```

---

## 运维

```bash
# 查看状态
docker compose ps

# 重启
docker compose restart

# 停止
docker compose down

# 升级
cd /opt/gaona
git pull && docker compose up -d --build

# 备份
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# 定时备份（crontab -e）
0 3 * * * tar -czf /opt/backups/gaona_$(date +\%Y\%m\%d).tar.gz /opt/gaona/data/
```

---

## Docker Compose 一键脚本

存为 `/opt/gaona/setup.sh`:

```bash
#!/bin/bash
cd /opt/gaona
SECRET_KEY=$(openssl rand -hex 32)
cat > .env << EOF
DATABASE_URL=sqlite:///./data/hetianxia.db
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=./data/uploads
THUMBNAIL_DIR=./data/thumbnails
EOF
mkdir -p data/uploads data/thumbnails data/models
docker compose up -d --build
sleep 10
docker compose exec backend python seed.py
echo "Done. Visit http://$(curl -s ifconfig.me)"
```
