# JDUI 系统架构与接口总览

## 1. 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                      浏览器 (Frontend)                        │
│   vanilla JS + CSS，无构建步骤                                 │
│   employee.js / panels.js / sessions.js / messages.js / ...  │
└──────────────────────┬───────────────────────────────────────┘
                       │  HTTP REST (JSON) + SSE (流式)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              server.py — Python HTTP 服务 (:8787)             │
│                                                              │
│  api/routes.py ─── 路由分发（80+ 端点）                        │
│  api/streaming.py ─ SSE 流引擎 + Agent 线程                   │
│  api/employees.py ─ 员工 CRUD + Profile 同步                  │
│  api/profiles.py ── Profile 管理                              │
│  api/models.py ──── Session 数据模型                           │
│  api/auth.py ────── Cookie 认证                               │
│  api/config.py ──── 全局配置 + Agent 发现                      │
└──────────────────────┬───────────────────────────────────────┘
                       │  Python import (run_agent.AIAgent)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Hermes Agent (AI 引擎)                      │
│   调用 LLM API → OpenAI / Anthropic / Google / DeepSeek      │
│   执行工具 → terminal / file / web / skills / memory          │
└──────────────────────────────────────────────────────────────┘
```

## 2. 接口类型汇总

| 类型 | 数量 | 说明 |
|------|------|------|
| REST (JSON) | 75+ | 标准 JSON 请求/响应，POST 需携带 `X-CSRF: 1` |
| SSE (流式) | 2 | 实时流式推送（聊天响应、网关会话同步） |
| Multipart | 1 | 文件上传 |
| HTML | 2 | 主页和登录页 |
| 静态资源 | 1 | JS / CSS / 图片 |

---

## 3. 全部接口列表

### 3.1 认证（Auth）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/auth/status` | REST | 检查认证状态 → `{auth_enabled, logged_in}` |
| POST | `/api/auth/login` | REST | 登录 → body: `{password}` |
| POST | `/api/auth/logout` | REST | 登出，清除 Cookie |

### 3.2 数字员工（Employee）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/employees` | REST | 列出所有员工 → `{employees: [...]}` |
| POST | `/api/employee/create` | REST | 创建员工 + 同步创建 Hermes Profile |
| POST | `/api/employee/update` | REST | 更新员工 + 同步更新 SOUL.md / config.yaml |
| POST | `/api/employee/delete` | REST | 删除员工 + 删除对应 Profile |
| POST | `/api/employee/activate` | REST | 激活员工（切换 Hermes Profile） |

请求示例（创建）：
```json
{
  "name": "数据分析师",
  "avatar_index": 2,
  "description": "精通数据分析和可视化",
  "traits": ["逻辑清晰", "数据敏感"],
  "capabilities": {"search": true, "memory": true, "autoExec": false, "knowledge": true}
}
```

### 3.3 聊天（Chat）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| POST | `/api/chat/start` | REST | 启动聊天流 → 返回 `{stream_id, session_id}` |
| GET | `/api/chat/stream?stream_id=xxx` | **SSE** | 接收流式响应（token / tool / done / error） |
| GET | `/api/chat/stream/status?stream_id=xxx` | REST | 检查流是否活跃 |
| GET | `/api/chat/cancel?stream_id=xxx` | REST | 取消正在进行的流 |
| POST | `/api/chat` | REST | 同步聊天（备用，非流式） |

SSE 事件类型：

| 事件 | 数据 | 说明 |
|------|------|------|
| `token` | `{"text": "..."}` | LLM 输出的一个 token |
| `tool` | `{"name", "preview", "args"}` | Agent 调用工具 |
| `approval` | `{"id", "description", "command"}` | 危险命令需审批 |
| `done` | `{"session", "usage"}` | 流结束，含最终状态和 token 用量 |
| `error` | `{"message"}` | 错误 |
| `cancel` | `{"message"}` | 用户取消 |
| `apperror` | `{"message", "type", "hint"}` | 应用错误（限流、认证失败等） |

### 3.4 会话（Session）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/session?session_id=xxx` | REST | 获取单个会话（含消息） |
| GET | `/api/sessions` | REST | 列出所有会话 |
| GET | `/api/sessions/search?q=xxx` | REST | 搜索会话 |
| GET | `/api/session/export?session_id=xxx` | REST | 导出会话 JSON（文件下载） |
| POST | `/api/session/new` | REST | 创建新会话 |
| POST | `/api/session/rename` | REST | 重命名会话 |
| POST | `/api/session/update` | REST | 更新会话元数据 |
| POST | `/api/session/delete` | REST | 删除会话 |
| POST | `/api/session/clear` | REST | 清空会话消息 |
| POST | `/api/session/truncate` | REST | 截断会话（保留前 N 条） |
| POST | `/api/session/pin` | REST | 置顶/取消置顶 |
| POST | `/api/session/archive` | REST | 归档/取消归档 |
| POST | `/api/session/move` | REST | 移动到项目 |
| POST | `/api/sessions/cleanup` | REST | 清理旧会话 |
| POST | `/api/sessions/cleanup_zero_message` | REST | 清理空会话 |

### 3.5 模型与设置（Settings）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/models` | REST | 列出可用模型 |
| GET | `/api/settings` | REST | 获取设置 |
| POST | `/api/settings` | REST | 更新设置 |
| GET | `/api/personalities` | REST | 列出性格预设 |
| POST | `/api/personality/set` | REST | 设置会话性格 |

### 3.6 文件操作（File）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/list?session_id=xxx&path=...` | REST | 列出目录内容 |
| GET | `/api/file?session_id=xxx&path=...` | REST | 读取文件内容 |
| GET | `/api/file/raw?session_id=xxx&path=...` | REST | 下载原始文件（二进制） |
| POST | `/api/file/save` | REST | 保存文件 |
| POST | `/api/file/create` | REST | 创建文件 |
| POST | `/api/file/delete` | REST | 删除文件 |
| POST | `/api/file/rename` | REST | 重命名文件 |
| POST | `/api/file/create-dir` | REST | 创建目录 |
| POST | `/api/upload` | **Multipart** | 上传文件 |

### 3.7 工作区（Workspace）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/workspaces` | REST | 列出工作区 |
| POST | `/api/workspaces/add` | REST | 添加工作区 |
| POST | `/api/workspaces/remove` | REST | 移除工作区 |
| POST | `/api/workspaces/rename` | REST | 重命名工作区 |

### 3.8 定时任务（Cron）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/crons` | REST | 列出定时任务 |
| GET | `/api/crons/output?job_id=xxx` | REST | 获取任务输出 |
| GET | `/api/crons/recent` | REST | 最近执行记录 |
| POST | `/api/crons/create` | REST | 创建定时任务 |
| POST | `/api/crons/update` | REST | 更新定时任务 |
| POST | `/api/crons/delete` | REST | 删除定时任务 |
| POST | `/api/crons/run` | REST | 立即执行 |
| POST | `/api/crons/pause` | REST | 暂停 |
| POST | `/api/crons/resume` | REST | 恢复 |

### 3.9 技能（Skills）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/skills` | REST | 列出技能 |
| GET | `/api/skills/content?name=xxx` | REST | 获取技能内容 |
| POST | `/api/skills/save` | REST | 保存技能 |
| POST | `/api/skills/delete` | REST | 删除技能 |

### 3.10 记忆（Memory）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/memory?session_id=xxx` | REST | 读取记忆 |
| POST | `/api/memory/write` | REST | 写入记忆 |

### 3.11 Profile（配置文件）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/profiles` | REST | 列出所有 Profile |
| GET | `/api/profile/active` | REST | 获取当前活跃 Profile |
| POST | `/api/profile/switch` | REST | 切换 Profile |
| POST | `/api/profile/create` | REST | 创建 Profile |
| POST | `/api/profile/delete` | REST | 删除 Profile |

### 3.12 项目（Project）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/projects` | REST | 列出项目 |
| POST | `/api/projects/create` | REST | 创建项目 |
| POST | `/api/projects/rename` | REST | 重命名项目 |
| POST | `/api/projects/delete` | REST | 删除项目 |

### 3.13 审批（Approval）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/approval/pending?session_id=xxx` | REST | 查询待审批项 |
| GET | `/api/approval/inject_test?session_id=xxx` | REST | 注入测试审批（开发用） |
| POST | `/api/approval/respond` | REST | 响应审批（once/session/always/deny） |

### 3.14 引导（Onboarding）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/api/onboarding/status` | REST | 获取引导状态 |
| POST | `/api/onboarding/setup` | REST | 配置提供商/模型 |
| POST | `/api/onboarding/complete` | REST | 完成引导 |

### 3.15 系统（System）

| 方法 | 路径 | 类型 | 说明 |
|------|------|------|------|
| GET | `/health` | REST | 健康检查 → `{status, sessions, active_streams, uptime}` |
| GET | `/api/git-info?session_id=xxx` | REST | Git 仓库信息 |
| GET | `/api/updates/check` | REST | 检查更新 |
| GET | `/api/sessions/gateway/stream` | **SSE** | 网关会话实时同步流 |
| GET | `/login` | HTML | 登录页面 |
| GET | `/` | HTML | 主页面 |
| GET | `/static/*` | 静态资源 | JS / CSS / 图片 / 字体 |

---

## 4. 通用规则

### 4.1 请求头

所有 POST 请求必须携带：
```
Content-Type: application/json
X-CSRF: 1
```

### 4.2 认证

- 默认无需认证（本地访问）
- 设置密码后需先调用 `/api/auth/login` 获取 Cookie
- Cookie 名：`hermes_session`，有效期 24 小时

### 4.3 错误响应

```json
{"error": "错误描述"}
```

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | CSRF 校验失败 |
| 404 | 资源不存在 |
| 409 | 冲突（如 Agent 运行中无法切换 Profile） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 4.4 数据存储

| 数据 | 位置 |
|------|------|
| 会话 | `~/.hermes/webui/sessions/{id}.json` |
| 设置 | `~/.hermes/webui/settings.json` |
| 员工 | `~/.hermes/webui/employees.json` |
| Profile | `~/.hermes/profiles/{name}/` |
| Agent 配置 | `~/.hermes/config.yaml` |
| Agent 记忆 | `~/.hermes/memories/` |
| Agent 技能 | `~/.hermes/skills/` |
