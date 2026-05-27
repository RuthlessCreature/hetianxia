# 高纳AI - Obsidian Vault

> 用 Obsidian 打开 `docs/vault/` 目录即可浏览全部文档。

---

## 文档索引

### 入门
- [[00-项目总览]] — 定位、技术栈、目录结构、快速启动
- [[01-部署指南]] — Alibaba Linux 从零到上线 SOP
- [[06-主题配置]] — 三套主题 + CSS 变量自定义

### 功能
- [[02-使用手册]] — 角色权限、三种检测路线、标注画布操作
- [[10-功能清单]] — 完整功能列表（16 大模块，30+ API）
- [[11-AI大模型集成路线]] — SAM / Grounding DINO / VLM 集成方案

### 技术
- [[03-API参考]] — 30+ 端点速查表
- [[05-架构设计]] — 系统架构图、数据流、14 张表 ER

### 管理
- [[04-改进清单]] — 高中低优先级改进项 + 技术债

---

## 配置速查

```env
# .env — 改完 docker compose up -d --build 即生效
APP_NAME=高纳AI          # 软件名
COMPANY_NAME=高纳科技     # 公司名
THEME=light              # light | dark | industrial
```

## 端口

| 端口 | 服务 |
|---|---|
| 80 | 前端 (Nginx) |
| 8000 | 后端 API |

## Demo 账号

| 邮箱 | 密码 | 角色 |
|---|---|---|
| owner@demo.com | demo123 | Owner |
| engineer@demo.com | demo123 | Engineer |
| labeler@demo.com | demo123 | Labeler |
