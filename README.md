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
docker compose up -d
```

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
