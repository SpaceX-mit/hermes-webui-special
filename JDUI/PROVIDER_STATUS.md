# Agent Provider 接口实现状态

> 记录 Hermes Agent 和 OpenClaw 两个 Provider 的接口实现情况、已对接功能和待对接功能。

## 1. IAgentProvider 基础接口

两个 Provider 均已实现全部 7 个基础接口：

| 接口方法 | Hermes | OpenClaw |
|----------|--------|----------|
| `get_provider_id()` | ✅ 返回 `'hermes'` | ✅ 返回 `'openclaw'` |
| `is_available()` | ✅ 检查 `import run_agent` | ✅ 检查 `import openclaw_sdk` |
| `get_supported_models()` | ✅ 从 `config.yaml` 读取 | ✅ 调用 `client.list_agents()` |
| `create_agent()` | ✅ 创建 `HermesAgent` | ✅ 创建 `OpenClawAgent` |
| `IAgent.run()` | ✅ 调用 `AIAgent.run_conversation()` | ✅ 调用 `agent.execute_stream()` |
| `IAgent.interrupt()` | ✅ 调用 `AIAgent.interrupt()` | ✅ 设置 `_interrupted` 标志 |
| `IAgent.get_usage()` | ✅ 读取 agent 属性 | ✅ 从 done 事件提取 |

---

## 2. Hermes Agent 详细实现状态

### 2.1 已实现功能

| 功能 | 实现方式 | 文件 |
|------|----------|------|
| 流式对话 | `AIAgent.run_conversation()` + `stream_delta_callback` | `api/providers/hermes_provider.py` |
| 工具调用 | `tool_progress_callback` → 工具卡片 + 参数展示 | `api/streaming.py` |
| 审批系统 | `tools.approval` 网关通知 + 轮询，支持 once/session/always/deny | `api/streaming.py` |
| 会话持久化 | Session JSON 文件，跨页面刷新保持 | `api/models.py` |
| 上下文压缩 | `context_compressor` 检测，session_id 自动轮转 | `api/streaming.py` |
| Token 用量 | `session_prompt_tokens` / `session_completion_tokens` / `session_estimated_cost_usd` | `api/providers/hermes_provider.py` |
| 上下文窗口指示器 | `context_length` / `threshold_tokens` / `last_prompt_tokens` / `compression_count` | `api/providers/hermes_provider.py` |
| Profile 系统 | 每个员工独立 Profile（SOUL.md / config.yaml / memories / skills） | `api/employees.py` + `api/profiles.py` |
| 性格系统 | `ephemeral_system_prompt` + `config.yaml` agent.personalities | `api/streaming.py` |
| 工具集配置 | `platform_toolsets.cli` 按员工能力开关映射 | `api/employees.py` |
| 备用模型 | `fallback_model` 限流时自动切换 | `api/streaming.py` |
| 模型解析 | `resolve_model_provider()` 支持 bare / provider/model / @provider:model | `api/config.py` |
| API Key 解析 | `resolve_runtime_provider()` 按 provider 获取凭证 | `api/streaming.py` |
| 工作区上下文 | `[Workspace: /path]` 前缀注入每条消息 | `api/streaming.py` |
| 取消执行 | `agent.interrupt()` + `CANCEL_FLAGS` 事件 | `api/streaming.py` |
| 消息清洗 | `_sanitize_messages_for_api()` 过滤非 API 字段 | `api/streaming.py` |
| CLI 会话导入 | 从 hermes-agent 的 SQLite 导入历史会话 | `api/models.py` |
| 定时任务 | `/api/crons` 完整 CRUD + 立即执行 + 暂停/恢复 | `api/routes.py` |
| 技能管理 | `/api/skills` 完整 CRUD + 搜索 | `api/routes.py` |
| 记忆管理 | `/api/memory` 读写 MEMORY.md / USER.md | `api/routes.py` |
| 文件操作 | 工作区文件浏览、编辑、创建、删除、上传、下载 | `api/workspace.py` |
| Git 检测 | 工作区 Git 分支名和脏文件数 | `api/routes.py` |
| 多模型支持 | OpenAI / Anthropic / Google / DeepSeek / OpenRouter 等 | `api/config.py` |
| 思考过程显示 | `<think>` 标签解析，折叠显示推理过程 | `static/messages.js` |
| 环境隔离 | 线程局部 `_set_thread_env()` + 全局 `_ENV_LOCK` | `api/streaming.py` |

### 2.2 未通过 IAgentProvider 暴露的功能

这些功能 Hermes Agent 本身支持，但未抽象到 IAgentProvider 接口层：

| 功能 | 说明 | Hermes 实现位置 |
|------|------|----------------|
| 子 Agent 委派 | 可 spawn Claude Code / Codex 执行子任务 | hermes-agent 内部 |
| 消息平台 | Telegram / Discord / Slack / Signal 等 10+ 平台 | hermes-agent gateway |
| 自动技能学习 | Agent 自动从经验中创建和保存技能 | hermes-agent 内部 |
| Gateway 监听 | 实时同步 CLI 会话变化 | `api/gateway_watcher.py` |
| OAuth 提供商 | Copilot / Codex OAuth 认证流程 | `api/onboarding.py` |
| 自动更新 | 检查和应用 webui/agent 更新 | `api/updates.py` |

---

## 3. OpenClaw 详细实现状态

### 3.1 已实现功能

| 功能 | 实现方式 | 文件 |
|------|----------|------|
| 连接 Gateway | `OpenClawClient.connect(gateway_ws_url, api_key)` | `api/providers/openclaw_provider.py` |
| 流式对话 | `agent.execute_stream()` → `EventType.AGENT` 事件解析 delta | `api/providers/openclaw_provider.py` |
| 工具调用事件 | `EventType.TOOL_CALL` → `on_tool()` 回调 | `api/providers/openclaw_provider.py` |
| 错误处理 | `EventType.ERROR` → 抛出 RuntimeError → SSE error 事件 | `api/providers/openclaw_provider.py` |
| 中断执行 | `_interrupted` 标志中断 `async for` 循环 | `api/providers/openclaw_provider.py` |
| Token 用量 | 从 `EventType.DONE` 事件提取 `tokenUsage` | `api/providers/openclaw_provider.py` |
| 配置管理 | Gateway URL + API Key 保存到 `settings.json`，支持环境变量覆盖 | `api/providers/openclaw_provider.py` + `api/config.py` |
| 员工绑定 | 员工 `agent_provider='openclaw'` 路由到 OpenClaw | `api/employees.py` + `api/routes.py` |
| 模型/Agent 列表 | `client.list_agents()` 查询 Gateway 可用 agent | `api/providers/openclaw_provider.py` |
| 设置页面 | Settings > Agents 标签页配置 Gateway URL 和 API Key | `static/panels.js` + `static/index.html` |

### 3.2 未实现功能

OpenClaw SDK 提供但 JDUI 尚未对接的功能：

| 功能 | SDK 方法 | 优先级 | 说明 |
|------|----------|--------|------|
| **会话持久化** | `agent.conversation()` / `session_key` | 高 | 当前每次对话是新会话，不复用 OpenClaw 侧的会话上下文 |
| **思考过程** | `EventType.THINKING` | 高 | OpenClaw 的推理过程事件，可显示在折叠卡片中 |
| **文件生成** | `EventType.FILE_GENERATED` | 中 | Agent 生成文件的事件，可在工作区显示 |
| **同步执行** | `agent.execute()` | 低 | 非流式一次性返回，当前用流式即可 |
| **结构化输出** | `agent.execute_structured()` | 低 | 返回 Pydantic 模型，特定场景使用 |
| **文件操作** | `agent.get_file()` / `set_file()` / `list_files()` | 中 | 读写 agent 的文件系统 |
| **记忆管理** | `agent.get_memory_status()` / `reset_memory()` | 中 | 查看和重置 agent 记忆 |
| **技能管理** | `agent.set_skills()` / `enable_skill()` / `disable_skill()` | 中 | 管理 agent 可用技能 |
| **工具策略** | `agent.set_tool_policy()` / `allow_tools()` / `deny_tools()` | 中 | 控制工具权限 |
| **MCP 服务器** | `agent.add_mcp_server()` / `remove_mcp_server()` | 低 | 添加外部 MCP 工具服务器 |
| **批量执行** | `agent.batch()` | 低 | 批量发送多个查询 |
| **Pipeline** | `client.pipeline()` | 低 | 多 agent 链式调用 |
| **Agent CRUD** | `client.create_agent()` / `delete_agent()` | 中 | 在 Gateway 上创建/删除 agent |
| **频道管理** | `client.configure_channel()` / `list_channels()` | 低 | Telegram / Discord / Slack 等消息平台 |
| **定时任务** | `ScheduleManager` | 中 | OpenClaw 自己的 cron 系统 |
| **审批系统** | `ApprovalManager` | 高 | OpenClaw 的危险命令审批 |
| **成本追踪** | `CostTracker` / `BillingManager` | 中 | 详细费用追踪和预算控制 |
| **健康检查** | `client.health()` | 低 | Gateway 健康状态（已在 `is_available` 中间接使用） |
| **多租户** | `TenantConfig` / `TenantWorkspace` | 低 | 多租户隔离 |
| **语音** | `VoicePipeline` / `TTSManager` / `STTProvider` | 低 | 语音输入输出 |
| **数据源** | `DataSourceRegistry` / `SQLiteDataSource` | 低 | 结构化数据查询 |
| **告警** | `AlertManager` / `AlertRule` | 低 | 监控告警 |

---

## 4. 对比总结

| 维度 | Hermes Agent | OpenClaw |
|------|-------------|----------|
| 集成方式 | Python 直接 import（进程内） | SDK + WebSocket（进程间） |
| IAgentProvider 接口 | 7/7 ✅ | 7/7 ✅ |
| 流式对话 | ✅ 深度集成（回调直连） | ✅ 基础对接（事件解析） |
| 会话持久化 | ✅ 完整（JSON 文件 + session 轮转） | ⚠️ 仅 JDUI 侧保存 |
| 审批系统 | ✅ 完整（网关通知 + 轮询） | ❌ 未对接 |
| Profile / 性格 | ✅ SOUL.md + personalities | ❌ 未对接 |
| 工具集控制 | ✅ config.yaml toolsets | ❌ 未对接 |
| 记忆 / 技能 | ✅ 完整 CRUD | ❌ 未对接 |
| 上下文压缩 | ✅ 自动检测 + session 轮转 | ❌ 不适用 |
| 定时任务 | ✅ 完整 CRUD | ❌ 未对接 OpenClaw Schedule |
| Token 用量 | ✅ 精确（prompt + completion + cost） | ⚠️ 基础（依赖 done 事件） |
| 思考过程 | ✅ `<think>` 标签解析 | ❌ 未对接 `THINKING` 事件 |
| 文件操作 | ✅ 工作区完整操作 | ❌ 未对接 agent 文件 |
| 多模型 | ✅ 10+ 提供商 | ✅ Gateway 配置的模型 |
| 环境隔离 | ✅ 线程局部 + 全局锁 | ✅ 进程间天然隔离 |

---

## 5. 事件映射

### Hermes Agent 回调 → JDUI SSE 事件

| Hermes 回调 | SSE 事件 | 数据 |
|-------------|----------|------|
| `stream_delta_callback(text)` | `token` | `{"text": "..."}` |
| `tool_progress_callback(name, preview, args)` | `tool` | `{"name", "preview", "args"}` |
| `approval` 网关通知 | `approval` | `{"id", "description", "command"}` |
| `run_conversation()` 返回 | `done` | `{"session", "usage"}` |
| 异常 | `error` | `{"message"}` |

### OpenClaw SDK 事件 → JDUI SSE 事件

| OpenClaw EventType | SSE 事件 | 数据提取方式 |
|--------------------|----------|-------------|
| `AGENT` (stream=assistant) | `token` | `event.data.payload.data.delta` |
| `TOOL_CALL` | `tool` | `event.data.payload.{name, args}` |
| `DONE` | `done` | `event.data.payload.tokenUsage` |
| `ERROR` | `error` | `event.data.payload.message` |
| `THINKING` | ❌ 未对接 | `event.data.payload.data.text` |
| `FILE_GENERATED` | ❌ 未对接 | `event.data.payload.file` |
| `CONTENT` | `token`（备用） | `event.data.text` |
| `CHAT` | ❌ 未处理 | 聊天状态更新（delta/complete） |

---

## 6. 配置对比

### Hermes Agent

```
~/.hermes/
├── config.yaml              # 模型、提供商、工具集
├── .env                     # API Key
├── SOUL.md                  # 性格文件
├── profiles/{name}/         # 每个员工独立 Profile
│   ├── config.yaml
│   ├── .env
│   ├── SOUL.md
│   ├── memories/
│   ├── skills/
│   └── sessions/
```

### OpenClaw

```
settings.json:
  openclaw_gateway_url: "ws://127.0.0.1:18789"
  openclaw_api_key: "bearer-token"

环境变量（优先级更高）:
  OPENCLAW_GATEWAY_URL
  OPENCLAW_API_KEY
```

---

## 7. 代码文件索引

| 文件 | 说明 |
|------|------|
| `api/agent_provider.py` | IAgentProvider + IAgent 接口定义 |
| `api/agent_manager.py` | AgentManager 注册/发现/管理 |
| `api/providers/hermes_provider.py` | HermesProvider + HermesAgent 实现 |
| `api/providers/openclaw_provider.py` | OpenClawProvider + OpenClawAgent 实现 |
| `api/streaming.py` | SSE 流引擎，Hermes vs 非 Hermes 分支逻辑 |
| `api/employees.py` | 员工 CRUD，按 `agent_provider` 区分 Profile 操作 |
| `api/config.py` | OpenClaw 配置字段（`_SETTINGS_DEFAULTS`） |
| `static/panels.js` | Agents 设置面板 + 员工表单 provider 选择 |
| `static/index.html` | Agents 标签页 HTML + OpenClaw 配置表单 |
