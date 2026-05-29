# 和天下 - 工业 AOI 视觉 AI 标注训练平台

> 面向工业 AOI 的少样本缺陷检测数据闭环平台。
> 支持人工标注、AI 预标注和 OK 样本异常检测三种路线。

## 快速启动

### 环境要求

- Python 3.10+
- Node.js 18+
- 或 Docker Compose

### 本地开发

**后端：**

```bash
cd backend
pip install -r requirements.txt
mkdir -p storage/uploads storage/thumbnails
uvicorn app.main:app --reload --port 8000
```

API 文档: http://localhost:8000/docs

**前端：**

```bash
cd frontend
npm install
npm run dev
```

前端: http://localhost:5173

### Docker 一键启动

```bash
bash scripts/up.sh
```

### 多分发启动参数

同一套镜像可以通过启动参数切换品牌、平台名、主题和布局：

```bash
HTX_APP_NAME=锐检AI \
HTX_COMPANY_NAME=锐检科技 \
HTX_PLATFORM_NAME=缺陷检测平台 \
HTX_THEME=industrial \
HTX_LAYOUT=focus \
HTX_HOST_BIND=0.0.0.0 \
HTX_FRONTEND_PORT=8080 \
HTX_BACKEND_PORT=18000 \
bash scripts/up.sh
```

可选值：

| 变量 | 可选值 |
|---|---|
| `HTX_THEME` | `light` / `dark` / `industrial` |
| `HTX_LAYOUT` | `sidebar` / `topbar` / `focus` |

端口与监听地址：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `HTX_HOST_BIND` | `0.0.0.0` | 宿主机监听地址 |
| `HTX_FRONTEND_PORT` | `80` | 前端宿主机端口 |
| `HTX_BACKEND_PORT` | `8000` | 后端 API 宿主机端口 |

### Ubuntu 一键下载 AI 模型

默认下载 `YOLOv8n` + `SAM2 tiny`，适合轻量服务器先跑通：

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates
bash scripts/download-ai-models.sh
```

全量下载四个 SAM2 模型：

```bash
bash scripts/download-ai-models.sh --all
```

可选：

```bash
bash scripts/download-ai-models.sh --sam tiny,small --no-yolo
bash scripts/download-ai-models.sh --yolo-only
```

脚本会把 YOLO 放到 `backend/yolov8n.pt`，SAM2 放到 `backend/models/`。Docker Compose 会把 `backend/models` 挂到后端容器的 `/app/models`。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Python FastAPI + SQLModel |
| 数据库 | SQLite (MVP) / PostgreSQL (生产) |
| 认证 | JWT |
| 可视化 | Recharts + Fabric.js |

## 项目结构

```
hetianxia/
  docs/              # 文档
  backend/           # FastAPI 后端
    app/
      main.py        # 入口
      core/          # 配置、安全、依赖注入
      db/            # 数据库连接
      models/        # 数据模型 (12 表)
      schemas/       # Pydantic 请求/响应
      routers/       # API 路由 (10 模块)
      services/      # 业务逻辑
      ai/            # AI mock 模块
  frontend/          # React 前端
    src/
      api/           # API 客户端
      stores/        # Zustand 状态管理
      features/      # 功能页面
      components/    # 通用组件
  storage/           # 本地文件存储
```

## 文档索引

- [架构文档](docs/architecture.md)
- [API 文档](docs/api.md)
- [数据库设计](docs/database.md)
- [业务流程](docs/workflow.md)
