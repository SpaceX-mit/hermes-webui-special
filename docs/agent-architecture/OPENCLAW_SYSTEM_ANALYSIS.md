# OpenClaw 系统架构与 JDUI 集成分析

## 概述

本文档结合 OpenClaw API 规范（`/data/workspace2026-new/JDClaw-WebUI-Project/openclaw-api-spec`）、Python SDK（`/data/workspace2026-new/openclaw-sdk`）和 JDClawWebUI，深入分析 OpenClaw 的系统架构、Agent 管理机制、权限模型，以及 JDUI 当前集成的完整性与差距。

---

## 一、OpenClaw 系统全貌

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Agent 管理   │  │  Session 管理 │  │   Channel 管理    │  │
│  │ agents.*     │  │ sessions.*   │  │ channels.*       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Skills 管理  │  │  Cron 调度   │  │   Approval 审批   │  │
│  │ skills.*     │  │ cron.*       │  │ exec.approvals.* │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Plugin 系统  │  │  Config 管理  │  │   Node 管理      │  │
│  │ plugin.*     │  │ config.*     │  │ node.*           │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  WebSocket 控制面（主接口）+ HTTP REST API（辅助）           │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
   JDUI Python SDK      JDClawWebUI          其他客户端
   (openclaw_sdk)       (TypeScript)         (Telegram/Discord/...)
```

### 1.2 通信协议

**主接口：WebSocket**（默认 `ws://127.0.0.1:18789`）

握手流程：
```
Server → client: connect.challenge { nonce }
Client → server: connect { device_auth_payload }
Server → client: hello-ok { protocol_version, auth_tokens }
```

帧格式：
```json
// 请求
{ "type": "req", "id": "uuid", "method": "agents.list", "params": {} }

// 响应
{ "type": "res", "id": "uuid", "ok": true, "payload": {...} }

// 推送事件
{ "type": "event", "event": "agent", "payload": {...}, "seq": 42 }
```

**辅助接口：HTTP REST**
- `GET /health` — 健康检查
- `GET /api/v1/status` — Gateway 状态
- `POST /api/v1/sessions/send` — 发送消息
- `GET /api/v1/sessions/:key/messages` — 获取历史
- `POST /api/v1/config/set` — 设置配置

---

## 二、Agent 管理 API 完整规范

### 2.1 Agent CRUD（`agents.*`）

| 方法 | 功能 |
|------|------|
| `agents.list` | 列出所有 agent |
| `agents.create` | 创建 agent |
| `agents.update` | 更新 agent 配置 |
| `agents.delete` | 删除 agent |
| `agents.files.list` | 列出 agent 文件 |
| `agents.files.get` | 获取文件内容 |
| `agents.files.set` | 设置文件内容 |
| `agent.identity.get` | 获取 agent 身份信息 |
| `agent.wait` | 等待 agent 完成 |
| `agent` | 直接执行 agent |

### 2.2 AgentConfig 完整字段

```python
AgentConfig(
    # 基础标识
    agent_id: str,                    # 必填，格式：^[a-zA-Z0-9_-]+$
    name: str | None = None,          # 显示名称

    # 角色定义
    system_prompt: str = 'You are a helpful assistant.',

    # LLM 配置
    llm_provider: Literal['anthropic', 'openai', 'gemini', 'ollama'] = 'anthropic',
    llm_model: str = 'claude-sonnet-4-20250514',
    llm_api_key: str | None = None,   # None = 使用 Gateway 配置的 key

    # 通道
    channels: list[str] = [],         # 绑定的消息通道

    # 记忆
    enable_memory: bool = True,
    memory_backend: Literal['memory', 'redis'] = 'memory',

    # 权限模型
    permission_mode: Literal['accept', 'confirm', 'reject'] = 'accept',

    # 工具配置
    tool_policy: ToolPolicy | None = None,
    mcp_servers: dict[str, StdioMcpServer | HttpMcpServer] | None = None,
    skills: SkillsConfig | None = None,
)
```

### 2.3 Agent 状态机

```
CREATED → RUNNING → IDLE
                  ↓
               ERROR
                  ↓
              DELETED
```

```python
class AgentStatus(StrEnum):
    CREATED = "created"
    RUNNING = "running"
    IDLE    = "idle"
    ERROR   = "error"
    DELETED = "deleted"
```

---

## 三、Session 管理 API（17 个方法）

| 方法 | 功能 |
|------|------|
| `sessions.list` | 列出所有 session（支持过滤） |
| `sessions.create` | 创建 session |
| `sessions.get` | 获取 session 详情 |
| `sessions.send` | 发送消息（已废弃，用 `chat.send`） |
| `sessions.subscribe` | 订阅 session 变更事件 |
| `sessions.unsubscribe` | 取消订阅 |
| `sessions.patch` | 更新 session（label、model、thinking level） |
| `sessions.delete` | 删除 session |
| `sessions.reset` | 清空 session 消息 |
| `sessions.compact` | 压缩 session 历史 |
| `sessions.usage` | 获取 token 使用统计 |
| `sessions.abort` | 中止运行中的 session |
| `chat.send` | 发送消息（流式） |
| `chat.abort` | 中止对话 |
| `chat.history` | 获取对话历史 |
| `chat.inject` | 注入消息 |

---

## 四、权限与工具控制体系

### 4.1 三级权限模型

```
permission_mode
  ├─ accept  → 自动接受所有工具调用（默认）
  ├─ confirm → 危险操作需用户确认（exec.approvals.* API）
  └─ reject  → 拒绝所有工具调用
```

### 4.2 Approval 审批 API（10 个方法）

```
exec.approvals.list     — 列出待审批项
exec.approvals.approve  — 批准
exec.approvals.reject   — 拒绝
exec.approvals.policy.* — 管理审批策略
plugin.approval.*       — 插件审批工作流
```

### 4.3 工具策略（ToolPolicy）

通过 `AgentConfig.tool_policy` 精细控制工具使用：
- 白名单/黑名单工具
- 工具调用频率限制
- 参数校验规则

### 4.4 MCP 服务器

```python
mcp_servers = {
    "filesystem": StdioMcpServer(command="npx", args=["-y", "@modelcontextprotocol/server-filesystem"]),
    "web":        HttpMcpServer(url="http://localhost:3001"),
}
```

---

## 五、事件流系统

### 5.1 Agent 事件（`agent` 事件类型）

```json
{
  "runId": "run-uuid",
  "sessionKey": "session-key",
  "stream": "assistant" | "tool" | "thinking" | "lifecycle" | "error",
  "seq": 42,
  "ts": 1713254400000,
  "data": { "delta": "text chunk..." }
}
```

### 5.2 Chat 事件（`chat` 事件类型）

```json
{
  "runId": "run-uuid",
  "sessionKey": "session-key",
  "state": "delta" | "final" | "aborted" | "error",
  "message": { "role": "assistant", "content": "..." },
  "errorMessage": null
}
```

### 5.3 Python SDK EventType

```python
class EventType(StrEnum):
    # SDK 层
    THINKING      = "thinking"
    TOOL_CALL     = "tool_call"
    TOOL_RESULT   = "tool_result"
    FILE_GENERATED = "file_generated"
    CONTENT       = "content"
    ERROR         = "error"
    DONE          = "done"

    # Gateway 层
    AGENT         = "agent"
    CHAT          = "chat"
    PRESENCE      = "presence"
    HEALTH        = "health"
    TICK          = "tick"
    HEARTBEAT     = "heartbeat"
    CRON          = "cron"
    SHUTDOWN      = "shutdown"
```

---

## 六、Python SDK 使用方式

### 6.1 基础用法

```python
from openclaw_sdk import OpenClawClient

# 连接
client = await OpenClawClient.connect(
    gateway_ws_url="ws://127.0.0.1:18789",
    api_key="your-key",
)

# 获取 agent 并执行
agent = client.get_agent("emp-a1b2c3d4e5f6")
result = await agent.execute("分析这份数据")

# 流式执行
async for event in agent.execute_stream("分析这份数据"):
    if event.event_type == EventType.CONTENT:
        print(event.data.get("text", ""), end="")
    elif event.event_type == EventType.DONE:
        break

# 多轮对话
async with agent.conversation("session-001") as convo:
    r1 = await convo.say("你好")
    r2 = await convo.say("继续上面的话题")
```

### 6.2 Manager 类

| Manager | 功能 |
|---------|------|
| `ChannelManager` | 消息通道管理（Telegram/Discord/Slack 等） |
| `ScheduleManager` | Cron 定时任务 |
| `SkillManager` | 技能安装、搜索、更新 |
| `WebhookManager` | Webhook 配置 |
| `ConfigManager` | Gateway 配置管理 |
| `DeviceManager` | 设备配对 |
| `NodeManager` | 节点管理 |
| `ApprovalManager` | 审批工作流 |
| `TTSManager` | 文字转语音 |

---

## 七、JDUI 当前集成分析

### 7.1 已使用的 API

| API | 使用位置 | 说明 |
|-----|---------|------|
| `OpenClawClient.connect()` | `openclaw_provider.py:222` | 每次对话都重新连接 |
| `client.get_agent(agent_id)` | `openclaw_provider.py:227` | 获取指定 agent |
| `agent.execute_stream(message)` | `openclaw_provider.py:229` | 流式执行 |
| `client.list_agents()` | `openclaw_provider.py:131` | 获取 agent 列表（用于 model 选择） |
| `client.create_agent(AgentConfig)` | `openclaw_provider.py:68` | 创建员工时建 agent |
| `client.delete_agent(agent_id)` | `openclaw_provider.py:94` | 删除员工时删 agent |

### 7.2 未使用但可利用的 API

**Session 管理（当前 JDUI 自己管理 session，未对接 Gateway session）：**
- `sessions.list` — 可获取 Gateway 侧的 session 列表
- `sessions.patch` — 可更新 session 的 model、thinking level
- `sessions.usage` — 可获取精确的 token 使用统计
- `sessions.compact` — 可触发 Gateway 侧的上下文压缩

**Agent 文件管理（当前未使用）：**
- `agents.files.list/get/set` — 可读写 agent 的配置文件（类似 Hermes 的 SOUL.md）
- `agent.identity.get` — 可获取 agent 的身份信息

**权限控制（当前未使用）：**
- `AgentConfig.permission_mode` — 创建时固定为默认 `accept`，未映射员工能力
- `AgentConfig.tool_policy` — 未配置
- `exec.approvals.*` — 未对接审批工作流

**技能管理（当前未使用）：**
- `skills.status/search/install` — 可管理 Gateway 侧的技能

**Cron 调度（当前未使用）：**
- `cron.*` — 可在 Gateway 侧创建定时任务

### 7.3 关键差距

**1. 连接复用问题**

当前每次对话都重新建立 WebSocket 连接，效率低：

```python
# 当前实现（openclaw_provider.py:218-225）
async def _execute():
    client = await OpenClawClient.connect(...)  # 每次都新建连接
    try:
        agent = client.get_agent(self._openclaw_agent_id)
        stream = await agent.execute_stream(full_message)
        ...
    finally:
        await client.close()  # 每次都关闭
```

**建议：** 使用连接池或长连接，在 `OpenClawProvider` 级别维护一个持久连接。

**2. Session 未对接**

JDUI 的 session 和 Gateway 的 session 是两套独立系统，对话历史没有在 Gateway 侧持久化。每次发消息都传完整的 `conversation_history`，随着对话增长性能下降。

**建议：** 创建会话时同步在 Gateway 创建 session，后续对话使用 `chat.send` 并传 `sessionKey`，由 Gateway 管理历史。

**3. 能力未映射到 AgentConfig**

员工的 `capabilities`（search/memory/autoExec/knowledge）在 Hermes 侧映射到 toolsets，但在 OpenClaw 侧创建 agent 时完全忽略：

```python
# 当前实现（openclaw_provider.py:63-71）
config = AgentConfig(
    agent_id=agent_id,
    name=agent_id,
    system_prompt=system_prompt,
    # ← capabilities 未映射到 tool_policy / permission_mode / skills
)
```

**建议：** 将 `capabilities` 映射到 `AgentConfig`：

| 员工能力 | AgentConfig 字段 |
|---------|----------------|
| `autoExec: false` | `permission_mode = 'confirm'` |
| `autoExec: true` | `permission_mode = 'accept'` |
| `memory: true` | `enable_memory = True` |
| `knowledge: true` | `skills = SkillsConfig(...)` |

**4. 执行中状态不可见**

OpenClaw 执行中的 token 数为 0（`DONE` 事件后才有值），而 Hermes 可实时读取。这是 SDK 层面的限制，需要 Gateway 侧支持中间状态推送。

---

## 八、JDClawWebUI 与 JDUI 的关系

JDClawWebUI 是 OpenClaw 官方的 Web 前端，直接对接 Gateway WebSocket，功能更完整：

| 功能 | JDClawWebUI | JDUI（当前） |
|------|------------|------------|
| Session CRUD | ✅ 完整 | ✅ 自己实现 |
| Agent 管理 | ✅ 完整 | ✅ 通过员工管理 |
| Model 切换 | ✅ 含 thinking level | ✅ 基础切换 |
| Tool 审批 | ✅ 审批对话框 | ❌ 未实现 |
| Cron 管理 | ✅ 完整 UI | ❌ 未实现 |
| Channel 管理 | ✅ 多通道 | ❌ 未实现 |
| Skills 管理 | ✅ 安装/搜索 | ❌ 未实现 |
| 连接复用 | ✅ 长连接 | ❌ 每次重连 |

---

## 九、关键文件索引

| 文件 | 内容 |
|------|------|
| `JDClaw-WebUI-Project/openclaw-api-spec/docs/API.md` | 完整 API 规范（100+ RPC 方法） |
| `JDClaw-WebUI-Project/openclaw-api-spec/docs/ARCHITECTURE.md` | Gateway 架构设计 |
| `JDClaw-WebUI-Project/JDClawWebUI/src/utils/gateway.ts` | TypeScript Gateway 客户端 |
| `JDClaw-WebUI-Project/JDClawWebUI/src/types/index.ts` | 完整类型定义 |
| `JDClaw-WebUI-Project/JDClawWebUI/docs/DEVELOPMENT_PLAN.md` | 开发计划 |
| `openclaw-sdk/src/openclaw_sdk/core/client.py` | Python SDK 主客户端 |
| `openclaw-sdk/src/openclaw_sdk/core/agent.py` | Agent 类实现 |
| `openclaw-sdk/src/openclaw_sdk/core/constants.py` | EventType、AgentStatus 等常量 |
| `openclaw-sdk/src/openclaw_sdk/core/types.py` | AgentConfig 等类型定义 |
| `hermes-webui/api/providers/openclaw_provider.py` | JDUI 侧 OpenClaw 集成 |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本，结合 API 规范、SDK 和 JDClawWebUI 完整分析
