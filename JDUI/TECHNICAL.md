# JDUI 技术文档 — Hermes WebUI 对接原理与接口

## 1. 架构概览

```
┌──────────────┐     HTTP/SSE      ┌──────────────┐    Python import    ┌──────────────┐
│   浏览器      │  ◄──────────────► │  WebUI 后端   │  ◄───────────────► │ Hermes Agent │
│  (vanilla JS) │   REST + SSE     │  (Python)     │   run_agent.AIAgent │  (AI 引擎)   │
└──────────────┘                   └──────────────┘                     └──────────────┘
     前端文件:                        后端文件:                           外部依赖:
     static/messages.js              api/routes.py                      hermes-agent/
     static/ui.js                    api/streaming.py                   run_agent.py
     static/sessions.js              api/models.py                      AIAgent class
     static/employee.js              api/employees.py
```

JDUI 没有改变核心对接链路，只是在前端增加了数字员工 UI 层。所有聊天消息仍走同一套 API。

---

## 2. 核心消息流程（用户输入 → Agent 响应）

### 完整链路

```
用户输入消息
    │
    ▼
[前端] messages.js send()
    │  验证输入、上传附件、创建 user message
    │
    ▼
[前端] POST /api/chat/start
    │  body: { session_id, message, model, workspace, attachments }
    │
    ▼
[后端] routes.py _handle_chat_start()
    │  生成 stream_id (UUID)
    │  创建 Queue 存入 STREAMS[stream_id]
    │  启动后台线程
    │  返回 { stream_id, session_id }
    │
    ▼
[前端] 打开 EventSource → GET /api/chat/stream?stream_id=xxx
    │
    ▼
[后端] streaming.py _run_agent_streaming() (后台线程)
    │  1. 获取 session 锁
    │  2. 设置环境变量 (TERMINAL_CWD, HERMES_HOME, ...)
    │  3. 实例化 AIAgent (model, provider, api_key, callbacks)
    │  4. 调用 agent.run_conversation(messages, system_prompt)
    │
    ▼
[Agent] AIAgent 调用 LLM API (OpenAI/Anthropic/...)
    │  流式返回 token
    │
    ▼
[后端] on_token(text) 回调 → Queue.put(('token', {text}))
[后端] on_tool(name, args) 回调 → Queue.put(('tool', {name, args}))
    │
    ▼
[后端] SSE handler 从 Queue 读取 → 写入 HTTP 响应流
    │
    ▼
[前端] EventSource 接收 SSE 事件
    │  token → 追加文字到消息气泡
    │  tool  → 显示工具调用卡片
    │  done  → 关闭连接、更新 session
```

### SSE 事件类型

| 事件 | 数据 | 说明 |
|------|------|------|
| `token` | `{text}` | LLM 流式输出的一个 token |
| `tool` | `{name, preview, args}` | Agent 调用了一个工具 |
| `approval` | `{id, description, command}` | 危险命令需要用户审批 |
| `done` | `{session, usage}` | 流结束，包含最终 session 状态和 token 用量 |
| `error` | `{message}` | 流错误 |
| `cancel` | `{message}` | 用户取消了流 |
| `apperror` | `{message, type, hint}` | 应用级错误（限流、认证失败等） |
| `compressed` | `{message}` | 上下文被自动压缩 |

---

## 3. 全部 API 接口

### 3.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/status` | 检查认证状态 → `{auth_enabled, logged_in}` |
| POST | `/api/auth/login` | 登录 → body: `{password}` |
| POST | `/api/auth/logout` | 登出 |

### 3.2 聊天与流式响应

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/start` | 启动聊天流 → body: `{session_id, message, model, workspace, attachments}` → 返回 `{stream_id}` |
| GET | `/api/chat/stream` | SSE 流端点 → query: `stream_id` |
| GET | `/api/chat/stream/status` | 检查流是否活跃 → query: `stream_id` |
| GET | `/api/chat/cancel` | 取消流 → query: `stream_id` |
| POST | `/api/chat` | 同步聊天（备用） → body: `{session_id, message}` |

### 3.3 会话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/session` | 获取单个会话 → query: `session_id` |
| GET | `/api/sessions` | 列出所有会话 |
| GET | `/api/sessions/search` | 搜索会话 → query: `q`, `content`, `depth` |
| POST | `/api/session/new` | 创建新会话 → body: `{workspace, model}` |
| POST | `/api/session/rename` | 重命名 → body: `{session_id, title}` |
| POST | `/api/session/delete` | 删除 → body: `{session_id}` |
| POST | `/api/session/clear` | 清空消息 → body: `{session_id}` |
| POST | `/api/session/pin` | 置顶 → body: `{session_id, pinned}` |
| POST | `/api/session/archive` | 归档 → body: `{session_id, archived}` |
| POST | `/api/session/move` | 移到项目 → body: `{session_id, project_id}` |
| POST | `/api/session/import` | 导入 JSON → body: session JSON |
| POST | `/api/session/import_cli` | 导入 CLI 会话 → body: `{session_id}` |
| GET | `/api/session/export` | 导出 JSON → query: `session_id` |

### 3.4 模型与设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 列出可用模型 → `{models: [{id, label, provider}]}` |
| GET | `/api/settings` | 获取设置 |
| POST | `/api/settings` | 更新设置 → body: `{bot_name, language, theme, ...}` |
| GET | `/api/personalities` | 列出性格预设 |
| POST | `/api/personality/set` | 设置会话性格 → body: `{session_id, name}` |

### 3.5 文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/list` | 列出目录 → query: `session_id, path` |
| GET | `/api/file` | 读取文件 → query: `session_id, path` |
| GET | `/api/file/raw` | 原始文件内容/下载 |
| POST | `/api/file/save` | 保存文件 → body: `{session_id, path, content}` |
| POST | `/api/file/create` | 创建文件 |
| POST | `/api/file/delete` | 删除文件 |
| POST | `/api/file/rename` | 重命名文件 |
| POST | `/api/file/create-dir` | 创建目录 |
| POST | `/api/upload` | 上传文件（multipart） |

### 3.6 工作区

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/workspaces` | 列出工作区 |
| POST | `/api/workspaces/add` | 添加工作区 → body: `{path}` |
| POST | `/api/workspaces/remove` | 移除工作区 |
| POST | `/api/workspaces/rename` | 重命名工作区 |

### 3.7 定时任务（Cron）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/crons` | 列出定时任务 |
| GET | `/api/crons/output` | 获取任务输出 |
| GET | `/api/crons/recent` | 最近执行记录 |
| POST | `/api/crons/create` | 创建任务 → body: `{name, schedule, prompt}` |
| POST | `/api/crons/update` | 更新任务 |
| POST | `/api/crons/delete` | 删除任务 |
| POST | `/api/crons/run` | 立即执行 |
| POST | `/api/crons/pause` | 暂停 |
| POST | `/api/crons/resume` | 恢复 |

### 3.8 技能

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | 列出技能 |
| GET | `/api/skills/content` | 获取技能内容 |
| POST | `/api/skills/save` | 保存技能 |
| POST | `/api/skills/delete` | 删除技能 |

### 3.9 记忆

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/memory` | 读取记忆 |
| POST | `/api/memory/write` | 写入记忆 |

### 3.10 配置文件（Profiles）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profiles` | 列出配置文件 |
| GET | `/api/profile/active` | 获取当前活跃配置 |
| POST | `/api/profile/switch` | 切换配置 → body: `{name}` |
| POST | `/api/profile/create` | 创建配置 → body: `{name, clone_from, base_url, api_key}` |
| POST | `/api/profile/delete` | 删除配置 |

### 3.11 项目

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 列出项目 |
| POST | `/api/projects/create` | 创建项目 → body: `{name, color}` |
| POST | `/api/projects/rename` | 重命名项目 |
| POST | `/api/projects/delete` | 删除项目 |

### 3.12 审批系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/approval/pending` | 获取待审批项 |
| POST | `/api/approval/respond` | 响应审批 → body: `{session_id, approval_id, action}` |

### 3.13 引导（Onboarding）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/onboarding/status` | 获取引导状态 |
| POST | `/api/onboarding/setup` | 配置提供商/模型 |
| POST | `/api/onboarding/complete` | 完成引导 |

### 3.14 数字员工（JDUI 新增）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/employees` | 列出数字员工 → `{employees: []}` |
| POST | `/api/employee/create` | 创建员工 → body: `{name, avatar_index, description, traits, capabilities}` |

### 3.15 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 → `{status, sessions, active_streams, uptime}` |
| GET | `/api/git-info` | Git 仓库信息 |
| GET | `/api/updates/check` | 检查更新 |
| POST | `/api/updates/apply` | 应用更新 |

---

## 4. Agent 对接细节

### 4.1 Agent 发现与加载

```python
# api/config.py — Agent 目录发现顺序
1. HERMES_WEBUI_AGENT_DIR 环境变量（显式指定）
2. HERMES_HOME/hermes-agent（基于 profile）
3. ../hermes-agent（同级目录）
4. ~/.hermes/hermes-agent（默认安装位置）
5. ~/hermes-agent（平铺布局）

# api/streaming.py — 延迟导入
from run_agent import AIAgent  # hermes-agent 的核心类
```

### 4.2 AIAgent 实例化参数

```python
agent = AIAgent(
    model=model,              # 如 "claude-sonnet-4-20250514"
    provider=provider,        # 如 "anthropic"
    base_url=base_url,        # API 端点
    api_key=api_key,          # API 密钥
    platform='cli',
    quiet_mode=True,
    enabled_toolsets=toolsets, # 启用的工具集
    fallback_model=fallback,  # 备用模型
    session_id=session_id,
    stream_delta_callback=on_token,    # token 流回调
    tool_progress_callback=on_tool,    # 工具调用回调
)
```

### 4.3 环境变量上下文

每次 Agent 运行时设置的线程级环境变量：

| 变量 | 说明 |
|------|------|
| `TERMINAL_CWD` | 当前工作区路径 |
| `HERMES_EXEC_ASK` | `'1'` — 危险命令需审批 |
| `HERMES_SESSION_KEY` | 当前会话 ID |
| `HERMES_HOME` | Profile 主目录 |

### 4.4 回调函数

```python
def on_token(text):
    """每个 LLM token 触发，写入 SSE 队列"""
    queue.put(('token', {'text': text}))

def on_tool(name, preview, args):
    """Agent 调用工具时触发"""
    queue.put(('tool', {'name': name, 'preview': preview, 'args': args}))
    # 同时轮询审批系统
```

---

## 5. 数据存储

| 数据 | 存储位置 | 格式 |
|------|----------|------|
| 会话 | `~/.hermes/webui/sessions/{id}.json` | JSON |
| 设置 | `~/.hermes/webui/settings.json` | JSON |
| 工作区列表 | `~/.hermes/webui/workspaces.json` | JSON |
| 项目 | `~/.hermes/webui/projects.json` | JSON |
| 数字员工 | `~/.hermes/webui/employees.json` | JSON |
| Agent 记忆 | `~/.hermes/memory/` | Markdown |
| Agent 技能 | `~/.hermes/skills/` | YAML+Markdown |
| Agent 配置 | `~/.hermes/config.yaml` | YAML |

---

## 6. JDUI 新增部分与现有系统的关系

JDUI 的"数字员工"是一个纯 UI 概念层，映射关系如下：

| JDUI 概念 | 对应的现有系统 |
|-----------|---------------|
| 数字员工 | Profile（配置文件）+ 前端展示元数据 |
| 员工会话 | Session（会话），完全复用现有会话系统 |
| 核心引擎选择 | Provider + Model 配置 |
| 员工能力开关 | 前端展示，不影响 Agent 实际工具集 |
| 任务面板 | 复用 `/api/crons` 数据 |
| 计划面板 | 复用 session 中的 `tool_calls` 数据 |

所有聊天功能（发消息、流式响应、工具调用、审批）完全复用现有 API，JDUI 不引入任何新的后端聊天逻辑。
