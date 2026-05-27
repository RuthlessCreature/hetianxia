# API 参考

Base URL: `http://host:8000/api`

## 认证

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/register | 注册(自动创建租户) |
| POST | /auth/login | 登录，返回 JWT |
| GET | /auth/me | 当前用户信息 |
| POST | /auth/logout | 登出 |

## 项目

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /projects | 创建 |
| GET | /projects | 列表 |
| GET | /projects/{id} | 详情(含图片数/标注数) |
| PATCH | /projects/{id} | 更新 |
| DELETE | /projects/{id} | 删除 |

## 图片

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /projects/{id}/images/upload | 上传(multipart) |
| GET | /projects/{id}/images | 列表(分页、筛选) |
| GET | /images/{id} | 详情 |
| DELETE | /images/{id} | 删除 |
| POST | /projects/{id}/images/batch-action | 批量操作 |
| GET | /projects/{id}/images/batches | 批次列表 |

## 标注

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /images/{id}/annotations | 创建 |
| GET | /images/{id}/annotations | 图片的所有标注 |
| PATCH | /annotations/{id} | 更新(几何/标签) |
| DELETE | /annotations/{id} | 删除 |
| POST | /annotations/{id}/review | 审核(confirm/reject) |
| POST | /annotations/batch-review | 批量审核 |
| GET | /projects/{id}/pending-reviews | 待审核列表 |

## 预标注

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /projects/{id}/prelabel-jobs | 启动预标注 |
| GET | /prelabel-jobs/{id} | 任务状态 |
| GET | /projects/{id}/prelabel-jobs | 历史 |

## 数据集

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /projects/{id}/dataset-versions | 创建版本 |
| GET | /projects/{id}/dataset-versions | 列表 |
| POST | /dataset-versions/{id}/freeze | 冻结(切分train/val/test) |

## 训练

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /projects/{id}/training-jobs | 启动训练 |
| GET | /training-jobs/{id} | 状态/日志/指标 |
| GET | /projects/{id}/training-jobs | 历史 |
| POST | /training-jobs/{id}/cancel | 取消 |

## 评估

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /models/{id}/evaluate | 运行评估 |
| GET | /evaluation-reports/{id} | 报告详情 |
| GET | /models/{id}/evaluation-reports | 历史 |

## 模型

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /projects/{id}/models | 列表 |
| GET | /models/{id} | 详情 |
| POST | /models/{id}/test | 在线推理 |
| POST | /models/{id}/export | 导出 |
| POST | /models/{id}/rollback | 回滚 |
| POST | /models/{id}/deploy | 部署 |
