# API 文档

Base URL: `http://localhost:8000/api`

## 认证

所有 API（除注册/登录）需携带 `Authorization: Bearer <token>` 头。

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | 注册（自动创建租户） |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/logout` | 登出 |

### Tenant & License

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tenant/current` | 当前租户信息 |
| GET | `/api/license/current` | License 状态 |
| GET | `/api/usage` | 用量统计 |

### Project

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects` | 项目列表 |
| GET | `/api/projects/{id}` | 项目详情 |
| PATCH | `/api/projects/{id}` | 更新项目 |
| DELETE | `/api/projects/{id}` | 删除项目 |

### Image

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{id}/images/upload` | 上传图片 (multipart) |
| GET | `/api/projects/{id}/images` | 图片列表 (支持分页、筛选) |
| GET | `/api/images/{id}` | 图片详情 |
| DELETE | `/api/images/{id}` | 删除图片 |

### Annotation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/images/{id}/annotations` | 创建标注 |
| GET | `/api/images/{id}/annotations` | 图片的所有标注 |
| PATCH | `/api/annotations/{id}` | 更新标注 |
| DELETE | `/api/annotations/{id}` | 删除标注 |
| POST | `/api/annotations/{id}/review` | 审核 AI 预标注 |

### AI Prelabel

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{id}/prelabel-jobs` | 创建预标注任务 |
| GET | `/api/prelabel-jobs/{id}` | 任务状态 |
| GET | `/api/projects/{id}/prelabel-jobs` | 项目预标注任务列表 |

### Dataset

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{id}/dataset-versions` | 创建数据集版本 |
| GET | `/api/projects/{id}/dataset-versions` | 数据集版本列表 |
| GET | `/api/dataset-versions/{id}` | 数据集版本详情 |
| POST | `/api/dataset-versions/{id}/freeze` | 冻结数据集 |

### Training

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{id}/training-jobs` | 创建训练任务 |
| GET | `/api/training-jobs/{id}` | 训练任务详情 |
| GET | `/api/projects/{id}/training-jobs` | 训练任务列表 |
| POST | `/api/training-jobs/{id}/cancel` | 取消训练 |

### Evaluation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/models/{id}/evaluate` | 创建评估报告 |
| GET | `/api/evaluation-reports/{id}` | 评估报告详情 |
| GET | `/api/models/{id}/evaluation-reports` | 模型评估报告列表 |

### Model

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/{id}/models` | 模型列表 |
| GET | `/api/models/{id}` | 模型详情 |
| POST | `/api/models/{id}/test` | 在线推理测试 |
| POST | `/api/models/{id}/export` | 导出模型 |

## 通用响应格式

成功: 直接返回数据对象或列表
错误: `{ "detail": "error message" }`

## 标注对象结构

```json
{
  "id": "ann_xxx",
  "image_id": "img_xxx",
  "project_id": "p_xxx",
  "annotation_type": "bbox | image_label | polygon",
  "label": "scratch | dent | stain | crack | burr | OK | NG",
  "geometry": { "x": 100, "y": 100, "w": 200, "h": 60 },
  "source": "human | ai_prelabel | model_inference | imported",
  "status": "candidate | confirmed | rejected",
  "confidence": 0.95
}
```
