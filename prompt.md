# 【和天下】工业 AOI 视觉 AI 标注训练平台 - DeepSeek 开工交接文档 v0.2

> 本文档用于直接交给 DeepSeek / 开发 Agent 拆任务、写代码、搭原型。  
> 开发代号：【和天下】。  
> 产品类型：面向工业 AOI / 外观检测的图像数据、标注、训练、评估、部署闭环平台。  
> 类比产品：Roboflow，但要更垂直于工业检测、少样本缺陷、OK 样本异常检测、私有化交付。

---

## 1. DeepSeek 执行指令

你现在是【和天下】项目的全栈研发 Agent，请基于本文档输出可执行的软件工程方案，并逐步实现 MVP。

### 1.1 你的任务

你需要完成以下工作：

1. 根据本文档梳理系统架构；
2. 设计前端页面结构；
3. 设计后端服务模块；
4. 设计数据库表结构；
5. 设计 API；
6. 实现 MVP 原型；
7. 保留后续接入真实 AI 训练任务的扩展点；
8. 优先跑通完整业务闭环，而不是一开始追求复杂算法。

### 1.2 开发原则

1. 先跑通闭环：注册登录 → 创建项目 → 上传图片 → 标注 → 训练任务 → evaluate → 模型版本；
2. AI 算法部分可以先 mock，但接口、任务状态、模型指标、报告结构必须真实设计；
3. 多租户、项目隔离、License 限制必须从第一版就纳入数据模型；
4. 标注数据必须区分 AI 预标注 candidate 与人工确认 ground truth；
5. Evaluate 模块必须成为核心，不要只做训练按钮；
6. 数据结构要支持后续工业现场回流，包括误报、漏报、人工复判；
7. 不要做成普通图片相册，也不要做成玩具标注器。

### 1.3 MVP 输出物

第一阶段请输出：

1. `README.md`：项目说明与启动方式；
2. `docs/architecture.md`：架构文档；
3. `docs/api.md`：API 文档；
4. `docs/database.md`：数据库设计；
5. `docs/workflow.md`：核心业务流程；
6. 可运行的前后端原型；
7. 数据库 migration；
8. 基础 seed 数据；
9. 最少一个完整 demo 流程。

---

## 2. 产品一句话定义

【和天下】是一个面向工业 AOI / 外观检测场景的视觉 AI 数据与模型平台。客户通过注册获得账号，并以账号许可有效期的方式付费使用平台。客户可以上传图片，通过三种路线完成数据生产与模型训练：

1. 人工标注 + 监督训练；
2. AI / 大模型预标注 + 人工审核 + 监督训练；
3. 只用 OK 样本的无监督异常检测。

平台最终输出可评估、可追溯、可导出、可持续迭代的工业视觉检测模型。

---

## 3. 产品核心定位

不要把【和天下】做成普通在线标注工具。它的定位是：

> 面向工业 AOI 的少样本缺陷检测数据闭环平台。

核心价值：

```text
图片结构化管理
  → 标注 / 预标注 / 异常检测
  → 训练
  → Evaluate
  → 模型版本
  → 部署导出
  → 现场误报漏报回流
  → 持续迭代
```

---

## 4. 目标客户

| 客户类型 | 典型需求 | 平台价值 |
|---|---|---|
| AOI 设备商 | 给客户项目快速训练检测模型 | 降低交付成本，沉淀项目数据 |
| 非标自动化公司 | 项目多、复用差、靠工程师经验 | 把 AI 检测流程标准化 |
| 制造企业质检部门 | 有大量产线图片，但无 AI 闭环 | 建立内部视觉数据资产 |
| 系统集成商 | 给多个客户做定制模型 | 多租户、多项目、多版本管理 |
| 算法团队 | 需要数据集、训练、评估管理 | 减少脚本化训练和人工整理报告 |

---

## 5. 收费与 License 模型

### 5.1 基础收费方式

以账号许可有效期为主：

```text
账号 / 租户 license + 有效期 + 项目数限制 + 图片数限制 + 存储限制 + 训练次数限制
```

### 5.2 套餐草案

| 套餐 | 适合对象 | 限制 |
|---|---|---|
| Trial | 试用客户 | 限时、限图片、限训练次数 |
| Basic | 小团队 / 单项目 | 少量项目，基础标注和训练 |
| Pro | AOI 设备商 / 集成商 | 多项目、AI 预标注、模型版本管理 |
| Enterprise | 大客户 | 私有化部署、权限审计、专属模型、接口集成 |

### 5.3 License 控制维度

| 维度 | 说明 |
|---|---|
| license_start | 授权开始时间 |
| license_end | 授权结束时间 |
| max_users | 最大用户数 |
| max_projects | 最大项目数 |
| max_images | 最大图片数 |
| max_storage_gb | 最大存储空间 |
| max_training_jobs_per_month | 每月训练次数 |
| max_prelabel_jobs_per_month | 每月 AI 预标注次数 |
| allow_model_export | 是否允许模型导出 |
| allow_private_deploy | 是否允许私有化部署 |

### 5.4 到期策略

License 到期后：

1. 可登录；
2. 可查看历史数据；
3. 不可上传新图片；
4. 不可启动训练；
5. 不可调用在线推理；
6. 模型导出权限按合同配置。

---

## 6. 三种核心路线

## 6.1 路线一：人工标注 + 监督训练

### 适用场景

1. 缺陷类别明确；
2. NG 样本相对充足；
3. 客户需要明确分类；
4. 项目进入量产阶段；
5. 对检出率、误报率有验收指标。

### 流程

```text
上传图片
  → 人工标注 OK / NG / box / polygon / mask
  → 数据集切分 train / val / test
  → 选择任务类型：分类 / 检测 / 分割
  → 启动训练
  → Evaluate
  → 模型版本入库
  → 部署 / 导出
```

### MVP 要支持

1. Image-level OK / NG；
2. Bounding Box；
3. Polygon 或 Mask 二选一；
4. 分类训练 mock；
5. 检测训练 mock；
6. Evaluation 报告 mock 但数据结构真实。

---

## 6.2 路线二：AI / 大模型预标注 + 人工审核

### 定义

平台使用视觉大模型、分割模型、检测模型或历史模型对图片进行预标注，生成候选标签。人工审核后，候选标签才能变成正式 ground truth。

### 核心原则

```text
AI 预标注 = candidate annotation
人工确认后 = ground truth annotation
```

绝不能把 AI 预标注直接当真值，否则伪标签会污染训练集。

### 流程

```text
上传图片
  → 选择预标注方式
  → AI 生成 candidate annotation
  → 人工审核：确认 / 修改 / 删除 / 补充
  → 生成正式标注版本
  → 监督训练
  → Evaluate
```

### 预标注能力规划

| 能力 | MVP 是否实现 | 说明 |
|---|---|---|
| 自动分类 | mock | 生成 OK / NG 候选 |
| 自动框选 | mock | 生成 bounding box 候选 |
| 自动 mask | 后续 | 可接 SAM / 分割模型 |
| 文本提示标注 | 后续 | 如“找出划痕” |
| 历史模型预跑 | 后续 | 使用客户旧模型生成候选 |
| 置信度排序 | MVP 可做 | 低置信度优先审核 |

---

## 6.3 路线三：OK 样本无监督异常检测

### 定义

客户上传 OK 样本，平台训练“正常样子”的模型。测试时输出异常分数、热力图、疑似异常区域。

### 适用场景

1. NG 样本少；
2. 缺陷类型不可预知；
3. 客户希望先抓异常，不一定分类；
4. 项目冷启动；
5. 正常样本稳定、工况可控。

### 流程

```text
上传 OK 图片
  → 清洗，剔除混入 NG
  → 训练正常分布模型
  → 上传测试图片
  → 输出 anomaly score / heatmap / region proposal
  → 人工调阈值
  → Evaluate
```

### MVP 实现策略

AI 算法可先 mock，但接口必须按真实任务设计：

1. anomaly training job；
2. anomaly score；
3. anomaly heatmap path；
4. threshold；
5. OK / NG decision；
6. false positive / false negative 记录。

后续可接入：

1. PatchCore；
2. PaDiM；
3. FastFlow；
4. DRAEM；
5. AutoEncoder / Reconstruction；
6. 工业场景自研异常检测模型。

---

## 7. 用户角色与权限

| 角色 | 权限 |
|---|---|
| Owner | 租户最高权限，管理 License、用户、项目、账单 |
| Admin | 管理项目、数据集、模型、成员 |
| Engineer | 上传图片、标注、训练、评估、部署 |
| Labeler | 只允许标注和审核 |
| Viewer | 只读查看项目、报告、模型结果 |

---

## 8. 核心业务对象

## 8.1 Tenant 租户

客户公司级对象。

```json
{
  "id": "t_xxx",
  "name": "某某自动化有限公司",
  "plan": "pro",
  "license_start": "2026-01-01T00:00:00Z",
  "license_end": "2026-12-31T23:59:59Z",
  "status": "active"
}
```

## 8.2 User 用户

```json
{
  "id": "u_xxx",
  "tenant_id": "t_xxx",
  "email": "engineer@example.com",
  "name": "张三",
  "role": "engineer",
  "status": "active"
}
```

## 8.3 Project 项目

一个项目对应一个产品、一个检测任务或一条产线。

```json
{
  "id": "p_xxx",
  "tenant_id": "t_xxx",
  "name": "手机中框划痕检测",
  "task_type": "defect_detection",
  "image_type": "2d_rgb",
  "status": "active"
}
```

## 8.4 ImageAsset 图片资产

```json
{
  "id": "img_xxx",
  "project_id": "p_xxx",
  "file_path": "s3://bucket/path/image.jpg",
  "width": 2448,
  "height": 2048,
  "checksum": "sha256_xxx",
  "label_status": "raw",
  "quality_status": "ok"
}
```

## 8.5 Annotation 标注

```json
{
  "id": "ann_xxx",
  "image_id": "img_xxx",
  "annotation_type": "bbox",
  "label": "scratch",
  "geometry": {
    "x": 100,
    "y": 120,
    "w": 300,
    "h": 40
  },
  "source": "ai_prelabel",
  "status": "candidate",
  "confidence": 0.82
}
```

source 可选值：

```text
human
ai_prelabel
model_inference
imported
```

status 可选值：

```text
candidate
confirmed
rejected
needs_review
```

## 8.6 DatasetVersion 数据集版本

```json
{
  "id": "dsv_xxx",
  "project_id": "p_xxx",
  "version": "v1",
  "train_count": 800,
  "val_count": 100,
  "test_count": 100,
  "status": "frozen"
}
```

## 8.7 TrainingJob 训练任务

```json
{
  "id": "job_xxx",
  "project_id": "p_xxx",
  "dataset_version_id": "dsv_xxx",
  "task_type": "object_detection",
  "strategy": "fast_baseline",
  "status": "running",
  "config": {}
}
```

status 可选值：

```text
queued
running
succeeded
failed
cancelled
```

## 8.8 ModelRegistry 模型注册表

```json
{
  "id": "model_xxx",
  "project_id": "p_xxx",
  "training_job_id": "job_xxx",
  "version": "M-2026-001",
  "artifact_path": "s3://bucket/models/model.onnx",
  "metrics": {
    "precision": 0.94,
    "recall": 0.987,
    "f1": 0.962
  },
  "status": "ready"
}
```

---

## 9. 核心页面

## 9.1 登录 / 注册

功能：

1. 注册；
2. 登录；
3. 找回密码；
4. 邀请成员；
5. 查看 License 状态。

## 9.2 Dashboard

展示：

1. 项目总数；
2. 图片总数；
3. 标注进度；
4. 训练任务状态；
5. 最新模型指标；
6. License 用量；
7. 待审核标注数量。

## 9.3 项目列表

字段：

1. 项目名称；
2. 检测类型；
3. 图片数量；
4. 标注进度；
5. 最新模型；
6. 最新 Recall / Precision；
7. 更新时间；
8. 状态。

## 9.4 项目详情

Tabs：

1. Overview；
2. Images；
3. Annotation；
4. Dataset Versions；
5. Training；
6. Evaluation；
7. Models；
8. Deployment；
9. Settings。

## 9.5 图片管理页

功能：

1. 图片网格；
2. 图片列表；
3. 按 OK / NG 筛选；
4. 按标注状态筛选；
5. 按缺陷类别筛选；
6. 按上传批次筛选；
7. 批量删除；
8. 批量移动；
9. 批量预标注。

## 9.6 标注页

布局：

```text
左侧：类别列表 / 标注工具栏
中间：图片画布
右侧：标注对象列表 / 属性面板 / AI 建议
底部：图片队列 / 审核按钮 / 快捷操作
```

工具：

1. 整图 OK / NG；
2. BBox；
3. Polygon；
4. 删除标注；
5. 修改类别；
6. 确认 AI 候选；
7. 拒绝 AI 候选；
8. 保存；
9. 下一张。

## 9.7 训练页

功能：

1. 选择数据集版本；
2. 选择训练路线；
3. 选择任务类型；
4. 选择训练策略；
5. 启动训练；
6. 查看任务状态；
7. 查看日志；
8. 查看中间指标。

## 9.8 Evaluate 页

功能：

1. 选择模型版本；
2. 选择测试集；
3. 查看指标；
4. 阈值调节；
5. 失败样本列表；
6. 模型版本对比；
7. 导出评估报告。

## 9.9 模型管理页

功能：

1. 模型版本列表；
2. 指标展示；
3. 在线测试；
4. 导出模型；
5. 部署状态；
6. 回滚版本。

---

## 10. 评估指标设计

## 10.1 分类任务

| 指标 | 含义 |
|---|---|
| Accuracy | 总准确率 |
| Precision | 判为 NG 的样本中有多少是真的 NG |
| Recall | 真实 NG 中检出了多少 |
| F1 | Precision 与 Recall 平衡 |
| Confusion Matrix | 混淆矩阵 |

## 10.2 检测任务

| 指标 | 含义 |
|---|---|
| mAP | 检测平均精度 |
| IoU | 框重合度 |
| Miss Rate | 漏检率 |
| False Positive Rate | 误报率 |
| Per-class AP | 各类缺陷 AP |

## 10.3 分割任务

| 指标 | 含义 |
|---|---|
| mIoU | 平均交并比 |
| Dice | 分割重合度 |
| Pixel Precision | 像素级精度 |
| Pixel Recall | 像素级召回 |

## 10.4 异常检测任务

| 指标 | 含义 |
|---|---|
| AUROC | 异常分数区分能力 |
| AUPR | 异常样本稀少时更关键 |
| PRO | 区域级异常评估 |
| FPR at Target Recall | 指定召回下误报率 |
| Threshold Sweep | 不同阈值效果变化 |

## 10.5 工业业务指标

必须额外展示：

1. 漏检数；
2. 误报数；
3. 每小时预计误报量；
4. 单张推理耗时；
5. 最小可检缺陷尺寸；
6. 失败样本列表；
7. 高风险样本 Top N；
8. 建议补充数据类型。

---

## 11. 数据库表结构草案

推荐使用 PostgreSQL。

### 11.1 tenants

```sql
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  plan VARCHAR NOT NULL,
  license_start TIMESTAMP,
  license_end TIMESTAMP,
  status VARCHAR NOT NULL DEFAULT 'active',
  max_users INT DEFAULT 5,
  max_projects INT DEFAULT 10,
  max_images INT DEFAULT 100000,
  max_storage_gb INT DEFAULT 100,
  max_training_jobs_per_month INT DEFAULT 100,
  max_prelabel_jobs_per_month INT DEFAULT 100,
  allow_model_export BOOLEAN DEFAULT false,
  allow_private_deploy BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11.2 users

```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11.3 projects

```sql
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  name VARCHAR NOT NULL,
  description TEXT,
  task_type VARCHAR,
  image_type VARCHAR DEFAULT '2d_rgb',
  status VARCHAR DEFAULT 'active',
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11.4 image_assets

```sql
CREATE TABLE image_assets (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_name VARCHAR,
  width INT,
  height INT,
  file_size BIGINT,
  checksum VARCHAR,
  label_status VARCHAR DEFAULT 'raw',
  quality_status VARCHAR DEFAULT 'unknown',
  upload_batch_id VARCHAR,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11.5 annotations

```sql
CREATE TABLE annotations (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  image_id VARCHAR NOT NULL REFERENCES image_assets(id),
  annotation_type VARCHAR NOT NULL,
  label VARCHAR,
  geometry JSONB,
  source VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'candidate',
  confidence FLOAT,
  created_by VARCHAR REFERENCES users(id),
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 11.6 dataset_versions

```sql
CREATE TABLE dataset_versions (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  version VARCHAR NOT NULL,
  name VARCHAR,
  description TEXT,
  train_count INT DEFAULT 0,
  val_count INT DEFAULT 0,
  test_count INT DEFAULT 0,
  split_config JSONB,
  status VARCHAR DEFAULT 'draft',
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.7 dataset_items

```sql
CREATE TABLE dataset_items (
  id VARCHAR PRIMARY KEY,
  dataset_version_id VARCHAR NOT NULL REFERENCES dataset_versions(id),
  image_id VARCHAR NOT NULL REFERENCES image_assets(id),
  split VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.8 prelabel_jobs

```sql
CREATE TABLE prelabel_jobs (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  status VARCHAR NOT NULL DEFAULT 'queued',
  method VARCHAR,
  prompt TEXT,
  image_count INT DEFAULT 0,
  config JSONB,
  result JSONB,
  created_by VARCHAR REFERENCES users(id),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.9 training_jobs

```sql
CREATE TABLE training_jobs (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  dataset_version_id VARCHAR REFERENCES dataset_versions(id),
  task_type VARCHAR NOT NULL,
  strategy VARCHAR,
  config JSONB,
  status VARCHAR NOT NULL DEFAULT 'queued',
  logs TEXT,
  metrics JSONB,
  created_by VARCHAR REFERENCES users(id),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.10 model_registry

```sql
CREATE TABLE model_registry (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  training_job_id VARCHAR REFERENCES training_jobs(id),
  version VARCHAR NOT NULL,
  artifact_path TEXT,
  model_format VARCHAR,
  metrics JSONB,
  status VARCHAR DEFAULT 'ready',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.11 evaluation_reports

```sql
CREATE TABLE evaluation_reports (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  model_id VARCHAR NOT NULL REFERENCES model_registry(id),
  dataset_version_id VARCHAR REFERENCES dataset_versions(id),
  task_type VARCHAR NOT NULL,
  threshold FLOAT,
  metrics JSONB,
  failure_cases JSONB,
  report_path TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11.12 audit_logs

```sql
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  tenant_id VARCHAR REFERENCES tenants(id),
  user_id VARCHAR REFERENCES users(id),
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  detail JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. API 设计草案

### 12.1 Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/invite
```

### 12.2 Tenant / License

```http
GET  /api/tenant/current
GET  /api/license/current
POST /api/license/activate
GET  /api/usage
```

### 12.3 Project

```http
POST   /api/projects
GET    /api/projects
GET    /api/projects/{project_id}
PATCH  /api/projects/{project_id}
DELETE /api/projects/{project_id}
```

### 12.4 Image

```http
POST   /api/projects/{project_id}/images/upload
GET    /api/projects/{project_id}/images
GET    /api/images/{image_id}
DELETE /api/images/{image_id}
POST   /api/projects/{project_id}/images/batch-action
```

### 12.5 Annotation

```http
POST   /api/images/{image_id}/annotations
GET    /api/images/{image_id}/annotations
PATCH  /api/annotations/{annotation_id}
DELETE /api/annotations/{annotation_id}
POST   /api/annotations/{annotation_id}/review
POST   /api/annotations/batch-review
```

### 12.6 Dataset

```http
POST /api/projects/{project_id}/dataset-versions
GET  /api/projects/{project_id}/dataset-versions
GET  /api/dataset-versions/{dataset_version_id}
POST /api/dataset-versions/{dataset_version_id}/freeze
```

### 12.7 AI Prelabel

```http
POST /api/projects/{project_id}/prelabel-jobs
GET  /api/prelabel-jobs/{job_id}
GET  /api/projects/{project_id}/prelabel-jobs
```

### 12.8 Training

```http
POST /api/projects/{project_id}/training-jobs
GET  /api/training-jobs/{job_id}
GET  /api/projects/{project_id}/training-jobs
POST /api/training-jobs/{job_id}/cancel
```

### 12.9 Evaluation

```http
POST /api/models/{model_id}/evaluate
GET  /api/evaluation-reports/{evaluation_id}
GET  /api/models/{model_id}/evaluation-reports
GET  /api/projects/{project_id}/evaluation-reports
```

### 12.10 Model

```http
GET  /api/projects/{project_id}/models
GET  /api/models/{model_id}
POST /api/models/{model_id}/test
POST /api/models/{model_id}/export
POST /api/models/{model_id}/deploy
```

---

## 13. 推荐技术架构

### 13.1 前端

建议：

1. React + TypeScript；
2. Vite；
3. Tailwind CSS；
4. React Router；
5. Zustand / Redux Toolkit；
6. Canvas 标注可用 Konva.js / Fabric.js；
7. 图表可用 ECharts / Recharts。

### 13.2 后端

建议：

1. Python FastAPI；
2. PostgreSQL；
3. SQLAlchemy / SQLModel；
4. Redis；
5. Celery / RQ 做异步任务；
6. MinIO / S3 做对象存储；
7. JWT Auth；
8. Docker Compose。

### 13.3 AI 任务层

MVP：

1. 训练任务 mock；
2. 预标注任务 mock；
3. 评估结果 mock；
4. 保留真实算法入口。

后续：

1. PyTorch；
2. Ultralytics YOLO；
3. ONNX export；
4. TensorRT export；
5. PatchCore / PaDiM / FastFlow；
6. SAM / GroundingDINO / VLM 预标注。

### 13.4 推荐目录结构

```text
hetianxia/
  README.md
  docker-compose.yml
  .env.example
  docs/
    architecture.md
    api.md
    database.md
    workflow.md
  backend/
    app/
      main.py
      core/
      db/
      models/
      schemas/
      routers/
      services/
      workers/
      ai/
        mock_prelabel.py
        mock_training.py
        mock_evaluation.py
    migrations/
    tests/
  frontend/
    src/
      main.tsx
      app/
      pages/
      components/
      api/
      stores/
      types/
      features/
        auth/
        dashboard/
        projects/
        images/
        annotation/
        training/
        evaluation/
        models/
  storage/
    .gitkeep
```

---

## 14. MVP 功能范围

## 14.1 必须做

### 账号与租户

1. 注册；
2. 登录；
3. JWT 鉴权；
4. 租户表；
5. 用户角色；
6. License 有效期检查；
7. 基础用量限制。

### 项目管理

1. 创建项目；
2. 项目列表；
3. 项目详情；
4. 项目状态。

### 图片管理

1. 上传图片；
2. 图片列表；
3. 缩略图；
4. 图片详情；
5. 删除图片；
6. 按状态筛选。

### 标注

1. 整图 OK / NG；
2. BBox；
3. AI candidate annotation 展示；
4. 确认 / 拒绝 candidate；
5. 保存人工标注；
6. 标注状态更新。

### AI 预标注

1. 创建 prelabel job；
2. 异步任务状态；
3. mock 生成候选 bbox；
4. 写入 annotations 表，source=ai_prelabel，status=candidate。

### 数据集版本

1. 创建 dataset version；
2. 简单 train / val / test 切分；
3. freeze dataset version；
4. 训练任务引用 dataset version。

### 训练

1. 创建 training job；
2. 异步任务状态；
3. mock 训练日志；
4. mock 指标；
5. 训练成功后创建 model_registry 记录。

### Evaluate

1. 创建 evaluation report；
2. 展示指标；
3. 展示失败样本；
4. 支持阈值字段；
5. 支持导出 JSON / Markdown 报告。

### 模型管理

1. 模型列表；
2. 模型详情；
3. 在线测试 mock；
4. 导出按钮占位；
5. 模型状态。

---

## 14.2 暂时不做

1. 真实大模型接入；
2. 真实 GPU 训练；
3. 复杂 AutoML；
4. 3D 点云；
5. 复杂计费；
6. 模型市场；
7. 图纸理解；
8. 现场设备 Agent；
9. 多语言；
10. 企业 SSO。

---

## 15. 关键工作流验收

## 15.1 Demo 流程 1：人工标注监督训练

```text
注册登录
  → 创建租户 / 用户
  → 创建项目：手机中框划痕检测
  → 上传 20 张图片
  → 人工画 bbox / 标 OK NG
  → 创建数据集版本 v1
  → 启动 object_detection 训练
  → training job 从 queued → running → succeeded
  → 自动生成 model M-001
  → 进入 Evaluate 查看 precision / recall / failure cases
```

验收：流程能跑通，数据真实入库。

## 15.2 Demo 流程 2：AI 预标注 + 人工审核

```text
上传图片
  → 启动 AI prelabel job
  → 系统 mock 生成 candidate bbox
  → 用户在标注页看到候选框
  → 用户确认 / 修改 / 拒绝
  → confirmed annotation 进入数据集
  → 创建训练任务
```

验收：candidate 与 confirmed 状态严格区分。

## 15.3 Demo 流程 3：无监督异常检测

```text
创建项目
  → 选择 anomaly_detection
  → 上传 OK 图片
  → 创建 anomaly training job
  → mock 生成 anomaly model
  → 上传测试图片
  → mock 输出 anomaly score
  → Evaluate 页面显示阈值和 OK / NG 判定
```

验收：异常检测流程与监督检测流程区分清楚。

---

## 16. 质量门

## 16.1 数据质量门

1. 图片损坏必须拒绝；
2. checksum 去重；
3. 未审核 AI candidate 不得进入正式训练集；
4. 没有 annotation 的图片不能进入监督训练集；
5. 数据集 freeze 后不允许直接修改，只能创建新版本。

## 16.2 训练质量门

1. training job 必须记录 config；
2. training job 必须记录 dataset_version；
3. model 必须关联 training_job；
4. evaluation 必须关联 model 与 dataset_version；
5. 指标必须可追溯。

## 16.3 权限质量门

1. 用户只能访问自己 tenant 的资源；
2. Labeler 不能启动训练；
3. Viewer 不能修改数据；
4. License 到期不能启动训练；
5. 超过项目数 / 图片数限制不能继续创建或上传。

---

## 17. 前端页面开发任务拆分

### P0

1. 登录页；
2. 注册页；
3. Dashboard；
4. 项目列表；
5. 项目创建弹窗；
6. 项目详情布局；
7. 图片上传页；
8. 图片列表页；
9. 简单标注页；
10. 训练任务页；
11. Evaluate 页面；
12. 模型列表页。

### P1

1. License 页面；
2. 成员管理；
3. 标注审核队列；
4. 数据集版本页面；
5. 模型对比；
6. 报告导出；
7. 阈值调节 UI。

---

## 18. 后端服务开发任务拆分

### P0

1. AuthService；
2. TenantService；
3. LicenseService；
4. ProjectService；
5. ImageService；
6. AnnotationService；
7. PrelabelJobService；
8. DatasetService；
9. TrainingJobService；
10. ModelRegistryService；
11. EvaluationService；
12. AuditLogService。

### P1

1. UsageService；
2. ExportService；
3. DeploymentService；
4. ReportService；
5. NotificationService。

---

## 19. AI mock 任务要求

MVP 阶段 mock 不能乱写，必须符合未来真实算法替换接口。

### 19.1 mock_prelabel

输入：

```json
{
  "project_id": "p_xxx",
  "image_ids": ["img_1", "img_2"],
  "method": "mock_bbox",
  "prompt": "find scratches"
}
```

输出：

```json
{
  "annotations": [
    {
      "image_id": "img_1",
      "annotation_type": "bbox",
      "label": "scratch",
      "geometry": {"x": 100, "y": 100, "w": 200, "h": 60},
      "confidence": 0.81,
      "source": "ai_prelabel",
      "status": "candidate"
    }
  ]
}
```

### 19.2 mock_training

输入：

```json
{
  "project_id": "p_xxx",
  "dataset_version_id": "ds_v1",
  "task_type": "object_detection",
  "strategy": "fast_baseline",
  "config": {}
}
```

输出：

```json
{
  "status": "succeeded",
  "metrics": {
    "precision": 0.94,
    "recall": 0.91,
    "f1": 0.925,
    "map50": 0.88
  },
  "artifact_path": "mock://models/model_xxx.onnx"
}
```

### 19.3 mock_evaluation

输出：

```json
{
  "metrics": {
    "precision": 0.94,
    "recall": 0.91,
    "f1": 0.925,
    "false_positive_count": 8,
    "false_negative_count": 3,
    "avg_inference_ms": 24
  },
  "failure_cases": [
    {
      "image_id": "img_xxx",
      "reason": "missed tiny scratch",
      "score": 0.42
    }
  ],
  "suggestions": [
    "补充极细划痕样本",
    "补充强反光 OK 样本",
    "检查标注类别是否混用"
  ]
}
```

---

## 20. 开发排期建议

### 第 1 阶段：基础骨架

目标：项目能启动，前后端能跑。

任务：

1. 初始化 repo；
2. Docker Compose；
3. PostgreSQL；
4. FastAPI；
5. React；
6. Auth；
7. Tenant / User；
8. Project CRUD。

### 第 2 阶段：图片与标注

目标：能上传图片、显示图片、保存标注。

任务：

1. 图片上传；
2. 对象存储 / 本地存储；
3. 图片列表；
4. 标注画布；
5. annotation CRUD；
6. 标注状态。

### 第 3 阶段：AI 预标注与审核

目标：能生成 candidate 并审核。

任务：

1. prelabel job；
2. 异步 worker；
3. mock bbox；
4. candidate 展示；
5. confirm / reject。

### 第 4 阶段：数据集与训练

目标：能 freeze 数据集并启动训练。

任务：

1. dataset version；
2. train / val / test split；
3. training job；
4. mock training；
5. model registry。

### 第 5 阶段：Evaluate 与报告

目标：模型有可视化评估。

任务：

1. evaluation report；
2. 指标卡片；
3. 失败样本；
4. 阈值字段；
5. 报告导出。

### 第 6 阶段：License 与权限加固

目标：变成可销售原型。

任务：

1. license check；
2. usage check；
3. RBAC；
4. tenant isolation；
5. audit logs。

---

## 21. 风险清单

### 21.1 产品风险

1. 客户以为上传图片就能全自动完美检测；
2. 三种路线过于复杂，用户选错；
3. 标注台体验差会直接劝退；
4. Evaluate 如果不可信，训练就像玄学；
5. 云端 SaaS 对生产图片可能有接受度问题。

### 21.2 技术风险

1. 大图加载性能；
2. Canvas 标注体验；
3. GPU 任务调度；
4. 多租户隔离；
5. 模型导出兼容性；
6. AI 预标注质量不稳定；
7. 无监督异常检测误报高。

### 21.3 商业风险

1. 单纯账号费可能太轻；
2. 私有化定制容易变项目泥潭；
3. 算力和存储成本吞利润；
4. 客户要效果兜底，责任边界要写清楚；
5. 客户数据用于通用模型训练必须合同授权。

---

## 22. 第一版成功标准

MVP 成功标准：

1. 一个新客户能注册并创建项目；
2. 能上传图片并管理图片；
3. 能手动画 bbox / 标 OK NG；
4. 能启动 AI 预标注任务并生成 candidate；
5. 能审核 candidate；
6. 能创建 dataset version；
7. 能启动 mock training；
8. 能生成 model version；
9. 能查看 evaluate report；
10. 能展示 License 用量；
11. 所有核心数据可追溯。

---

## 23. 禁止事项

1. 不要把 AI 预标注直接当 ground truth；
2. 不要跳过 dataset version；
3. 不要只做 UI mock 而不落库；
4. 不要把训练任务写成同步阻塞接口；
5. 不要忽略租户隔离；
6. 不要先做复杂计费系统；
7. 不要先做模型市场；
8. 不要把 Evaluate 做成摆设；
9. 不要假装无监督能解决所有 AOI 问题；
10. 不要把平台做成普通网盘。

---

## 24. 最终产品楔子

对外可以这样描述：

> 【和天下】是面向工业 AOI 的少样本缺陷检测数据闭环平台，支持人工标注、AI 预标注和 OK 样本异常检测，帮助设备商和制造企业快速完成图像数据管理、模型训练、效果评估和现场迭代。

更销售化版本：

> 不替代你的视觉工程师，而是把他们从重复标注、反复训练、手工整理报告的屎活里解放出来。

---

## 25. DeepSeek 下一步动作

请先输出以下内容，然后再开始编码：

1. 推荐技术栈最终确认；
2. 项目目录结构；
3. 数据库 migration 方案；
4. API 路由清单；
5. 前端页面路由清单；
6. P0 开发任务 checklist；
7. 第一阶段代码实现。

