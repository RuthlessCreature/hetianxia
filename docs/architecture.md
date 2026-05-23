# 架构文档

## 系统概述

【和天下】是一个面向工业 AOI/外观检测场景的视觉 AI 数据与模型平台。平台采用前后端分离架构，支持多租户隔离。

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                    前端 (React)                   │
│  Vite + Tailwind CSS + Zustand + React Router    │
│  Fabric.js (标注) + Recharts (图表)              │
├─────────────────────────────────────────────────┤
│                 HTTP / REST API                   │
├─────────────────────────────────────────────────┤
│               后端 (FastAPI)                       │
│  JWT Auth → Router → Service → Model (SQLModel)  │
│  AI Mock: Prelabel / Training / Evaluation        │
├─────────────────────────────────────────────────┤
│               SQLite / PostgreSQL                 │
│  12 表: tenants, users, projects, images,         │
│  annotations, datasets, training_jobs,            │
│  model_registry, evaluation_reports, etc.         │
├─────────────────────────────────────────────────┤
│           文件存储: 本地 / MinIO / S3             │
└─────────────────────────────────────────────────┘
```

## 核心设计原则

1. **多租户隔离**: 所有数据通过 tenant_id 隔离，用户只能访问自己租户的资源
2. **标注状态区分**: AI 预标注 = candidate，人工确认后 = confirmed/ground truth
3. **数据集版本化**: Freeze 后不可修改，训练任务引用 dataset_version
4. **训练可追溯**: training_job → model_registry → evaluation_report
5. **Mock 先行**: AI 算法接口真实设计，先 mock 跑通闭环

## 数据流

### 路线一：人工标注 + 监督训练
```
用户注册 → 创建项目 → 上传图片 → 人工标注(OK/NG/BBox)
→ 创建数据集版本 → Freeze → 启动训练 → 生成模型 → 评估
```

### 路线二：AI 预标注 + 人工审核
```
上传图片 → 启动 AI 预标注 Job → 生成 candidate annotations
→ 人工审核(确认/修改/拒绝) → 标注变更为 confirmed
→ 进入监督训练流程
```

### 路线三：OK 样本异常检测
```
上传 OK 图片 → 创建 anomaly_detection 训练
→ 生成异常检测模型 → 上传测试图片 → 输出 anomaly score/heatmap
```

## 安全设计

- JWT Token 认证，token 包含 user_id 和 tenant_id
- RBAC 角色: owner > admin > engineer > labeler > viewer
- 租户隔离: 所有 API 查询自动携带 tenant_id 过滤
- License 检查: 到期后限制写操作

## 扩展点

- AI 层: mock_prelabel.py / mock_training.py / mock_evaluation.py 可替换为真实算法
- 存储: 本地文件系统 → MinIO/S3
- 数据库: SQLite → PostgreSQL
- 异步任务: 协程模拟 → Celery/RQ
- 推理: 后续接入 PyTorch, YOLO, ONNX Runtime
