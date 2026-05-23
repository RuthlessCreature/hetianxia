# 核心业务流程

## Demo 流程 1：人工标注 + 监督训练

```
Step 1: 注册/登录
  POST /api/auth/register  → 自动创建租户 + 用户(owner)

Step 2: 创建项目
  POST /api/projects  → 创建项目(手机中框划痕检测, defect_detection)

Step 3: 上传图片
  POST /api/projects/{id}/images/upload  → 上传 20 张图片

Step 4: 人工标注
  进入标注页 → 在 canvas 上拖拽绘制 BBox
  POST /api/images/{id}/annotations  → 创建标注(human, confirmed)
  或点击 OK/NG 按钮 → 创建整图标签

Step 5: 创建数据集版本
  POST /api/projects/{id}/dataset-versions  → 创建 v1
  POST /api/dataset-versions/{id}/freeze  → 冻结(自动切分train/val/test)

Step 6: 启动训练
  POST /api/projects/{id}/training-jobs  → 创建训练任务
  (后台 mock 执行 → succeeded → 自动创建 model_registry)

Step 7: 查看评估
  进入 Evaluate 页 → 选择模型 → POST /api/models/{id}/evaluate
  → 查看 metrics, failure_cases, 图表

Step 8: 模型管理
  模型列表 → 查看指标 → 在线测试 → 导出
```

## Demo 流程 2：AI 预标注 + 人工审核

```
Step 1-3: 同上 (注册、创建项目、上传图片)

Step 4: 启动 AI 预标注
  POST /api/projects/{id}/prelabel-jobs
  → 后台 mock 生成 candidate bbox (source=ai_prelabel, status=candidate)

Step 5: 审核候选标注
  进入标注页 → 看到虚线黄色候选框
  → 点击"确认" → 标注变为 confirmed
  → 点击"拒绝" → 删除标注
  → 也可以手动修改/补充标注

Step 6-8: 同流程 1 (数据集 → 训练 → 评估)
```

## Demo 流程 3：OK 样本异常检测

```
Step 1-2: 注册、创建项目(task_type=anomaly_detection)

Step 3: 上传 OK 图片

Step 4: 创建数据集并冻结

Step 5: 启动 anomaly_detection 训练
  POST /api/projects/{id}/training-jobs  { task_type: "anomaly_detection" }
  → mock 生成 anomaly model

Step 6: Evaluate
  → 查看 anomaly score, threshold, OK/NG 判定
```

## 角色权限

| 操作 | Owner | Admin | Engineer | Labeler | Viewer |
|------|-------|-------|----------|---------|--------|
| 管理租户 | ✓ | - | - | - | - |
| 管理项目 | ✓ | ✓ | - | - | - |
| 上传图片 | ✓ | ✓ | ✓ | - | - |
| 标注 | ✓ | ✓ | ✓ | ✓ | - |
| 审核 AI 标注 | ✓ | ✓ | ✓ | ✓ | - |
| 启动训练 | ✓ | ✓ | ✓ | - | - |
| 查看数据 | ✓ | ✓ | ✓ | ✓ | ✓ |

## License 到期策略

1. 可登录查看历史数据
2. 不可上传新图片
3. 不可启动训练
4. 不可调用在线推理
5. 模型导出权限按合同配置
