# 数据库设计

## 技术选型

- SQLite (MVP 阶段，零配置)
- SQLModel (SQLAlchemy + Pydantic)
- 后续迁移至 PostgreSQL

## ER 图

```
tenants ──┬── users
          ├── projects ──┬── image_assets ──┬── annotations
          │              │                  │
          │              ├── dataset_versions ── dataset_items
          │              │
          │              ├── training_jobs ── model_registry ── evaluation_reports
          │              │
          │              ├── prelabel_jobs
          │              │
          │              └── audit_logs
          └── (所有表都有 tenant_id)
```

## 表清单 (12 张)

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `tenants` | 租户/客户公司 | id, name, plan, license_start/end, limits |
| `users` | 用户 | id, tenant_id, email, role, status |
| `projects` | 项目 | id, tenant_id, name, task_type |
| `image_assets` | 图片资产 | id, tenant_id, project_id, file_path, checksum, label_status |
| `annotations` | 标注 | id, image_id, annotation_type, label, geometry, source, status |
| `dataset_versions` | 数据集版本 | id, project_id, version, train/val/test_count, status |
| `dataset_items` | 数据集条目 | id, dataset_version_id, image_id, split |
| `prelabel_jobs` | AI预标注任务 | id, project_id, status, method, image_count |
| `training_jobs` | 训练任务 | id, project_id, dataset_version_id, task_type, status, metrics |
| `model_registry` | 模型注册表 | id, project_id, training_job_id, version, artifact_path, metrics |
| `evaluation_reports` | 评估报告 | id, model_id, metrics, failure_cases |
| `audit_logs` | 审计日志 | id, user_id, action, resource_type, detail |

## 核心约束

1. **多租户**: 所有业务表有 tenant_id 外键
2. **标注质量**: source 区分 human/ai_prelabel, status 区分 candidate/confirmed/rejected
3. **数据集版本化**: freeze 后不可修改
4. **训练可追溯**: training_job → model_registry → evaluation_report
5. **图片去重**: checksum (SHA-256) 检查

## 标注状态流转

```
raw (未标注)
  → prelabeled (AI预标注完成, 含candidate)
  → labeled (人工确认/标注完成, 含confirmed)
  → reviewed (审核通过)
```

## License 控制维度

| 维度 | 字段 | 默认值 |
|------|------|--------|
| 最大用户数 | max_users | 5 |
| 最大项目数 | max_projects | 10 |
| 最大图片数 | max_images | 100000 |
| 最大存储(GB) | max_storage_gb | 100 |
| 每月训练次数 | max_training_jobs_per_month | 100 |
| 每月预标注次数 | max_prelabel_jobs_per_month | 100 |
| 允许模型导出 | allow_model_export | false |
| 允许私有化部署 | allow_private_deploy | false |
