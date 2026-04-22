# 系统文件管理器设计方案

## 概述

在 hermes-webui 中新增一个系统级文件管理器，入口位于左侧 jdui-nav 导航栏。与现有的会话级文件管理器（filemanager.js，针对单个 session workspace）不同，系统文件管理器面向整个系统，可以浏览公共目录和所有 agent 的工作目录。

---

## 功能需求

1. **多根目录树**：显示公共工作区 + 每个 agent 的工作目录（以 agent name 显示）
2. **文件预览 & 下载**：支持文本、图片、PDF、Office、Markdown 等格式
3. **版本管理**：agent 修改文件时自动保存旧版本，最多保留 10 个版本，支持回退
4. **回收站**：删除文件移入回收站，保留 30 天，支持恢复和永久删除
5. **文件上传**：支持拖拽和点击上传到指定目录

---

## 界面布局

```
┌──────┬──────────────────────────────────────────────────┐
│      │  左侧树 (280px)        │  右侧预览区               │
│ nav  │  ─────────────────     │  ─────────────────────── │
│      │  📁 公共工作区          │  工具栏：                  │
│      │    ├─ 📄 file.txt      │    [下载] [版本] [删除]    │
│      │    └─ 📁 subdir        │                           │
│      │  📁 张三               │  文件内容预览               │
│      │    └─ 📁 workspace     │  （文本/图片/PDF/Office）  │
│      │  📁 李四               │                           │
│      │    └─ 📁 workspace     │                           │
│      │  🗑 回收站              │                           │
└──────┴──────────────────────────────────────────────────┘
```

---

## 技术架构

### 前端

- 新建 `static/sysfiles.js`：系统文件管理器的所有前端逻辑
- `index.html`：新增 panel 容器 `#sysfilesPanel` + jdui-nav 入口按钮
- `jdui.css`：新增样式

### 后端

- `api/routes.py`：新增 `/api/sysfile/*` 路由
- `api/sysfiles.py`：新建，处理多根目录、版本管理、回收站逻辑
- 版本存储：`{workspace}/.hermes_versions/{rel_path}/{timestamp}_{filename}`
- 回收站存储：`{workspace}/.hermes_trash/{timestamp}_{hash}/`（含元数据 JSON）

---

## API 设计

### 目录树

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sysfile/roots` | 返回所有根节点（公共目录 + 各 agent workspace） |
| GET | `/api/sysfile/list?root=&path=` | 列出指定根节点下的目录内容 |
| GET | `/api/sysfile/read?root=&path=` | 读取文件内容（文本） |
| GET | `/api/sysfile/raw?root=&path=&download=1` | 下载原始文件 |

### 版本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sysfile/versions?root=&path=` | 获取文件版本列表（最多10个） |
| POST | `/api/sysfile/version/restore` | 恢复到指定版本 `{root, path, version_id}` |
| GET | `/api/sysfile/version/read?root=&path=&version_id=` | 预览指定版本内容 |

### 回收站

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sysfile/trash/list?root=` | 列出回收站（30天内） |
| POST | `/api/sysfile/trash/restore` | 恢复文件 `{trash_id}` |
| POST | `/api/sysfile/trash/purge` | 永久删除 `{trash_id}` 或 `{all: true}` |

### 文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sysfile/delete` | 软删除（移入回收站）`{root, path}` |
| POST | `/api/sysfile/upload` | 上传文件 multipart `{root, dir, file}` |
| POST | `/api/sysfile/mkdir` | 创建目录 `{root, path}` |

---

## 数据结构

### roots 响应
```json
[
  {
    "id": "public",
    "label": "公共工作区",
    "path": "/home/user/.hermes/webui/workspace",
    "type": "public"
  },
  {
    "id": "emp-051e588f14d9",
    "label": "张三",
    "path": "/home/user/.hermes/profiles/emp-051e588f14d9/workspace",
    "type": "agent",
    "avatar_index": 2
  }
]
```

### versions 响应
```json
{
  "versions": [
    {
      "version_id": "20260422_143012_abc123",
      "timestamp": 1745123412,
      "size": 2048,
      "label": "2026-04-22 14:30:12"
    }
  ]
}
```

### trash item
```json
{
  "trash_id": "20260422_143012_abc123",
  "original_root": "emp-051e588f14d9",
  "original_path": "report.docx",
  "deleted_at": 1745123412,
  "size": 2048,
  "expires_at": 1747715412
}
```

---

## 版本管理实现

```
{workspace}/
└── .hermes_versions/
    └── report.docx/
        ├── 20260422_143012_v1.docx
        ├── 20260421_091530_v2.docx
        └── ...（最多10个，超出删最旧的）
```

触发时机：任何对文件的写操作（agent 修改 or 手动保存）前，先 copy 旧文件到版本目录。

---

## 回收站实现

```
{workspace}/
└── .hermes_trash/
    └── 20260422_143012_abc123/
        ├── file          ← 原始文件
        └── meta.json     ← {original_path, deleted_at, original_root}
```

定期清理：列出时过滤 > 30 天的条目（懒清理，不需要定时任务）。

---

## 开发阶段

### P1 — 入口 & 骨架
- `index.html`：jdui-nav 加"文件"按钮，新增 `#sysfilesPanel` 容器
- `jdui.css`：panel 布局样式（左树 + 右预览，两栏）
- `sysfiles.js`：`switchPanel('sysfiles')` 时初始化，空骨架

### P2 — 后端根目录 API
- `api/sysfiles.py`：`get_roots()`，读取公共目录 + 遍历所有 employee profile
- `api/routes.py`：注册 `/api/sysfile/roots`、`/api/sysfile/list`、`/api/sysfile/read`、`/api/sysfile/raw`

### P3 — 前端文件树 & 预览
- `sysfiles.js`：加载 roots，渲染多根树，展开/折叠，点击文件预览
- 预览复用现有 filemanager 的渲染逻辑（代码高亮、图片、PDF、Office）

### P4 — 版本管理
- `api/sysfiles.py`：`save_version()`、`list_versions()`、`restore_version()`
- `api/routes.py`：注册版本相关路由
- `sysfiles.js`：预览工具栏加"历史版本"按钮，版本列表抽屉，回退操作

### P5 — 回收站
- `api/sysfiles.py`：`move_to_trash()`、`list_trash()`、`restore_trash()`、`purge_trash()`
- `api/routes.py`：注册回收站路由，`/api/sysfile/delete` 改为软删除
- `sysfiles.js`：文件树底部"回收站"节点，回收站视图，恢复/永久删除操作

### P6 — 文件上传
- `api/routes.py`：注册 `/api/sysfile/upload`，复用 `upload.py` 逻辑
- `sysfiles.js`：工具栏上传按钮 + 拖拽区域，进度提示
