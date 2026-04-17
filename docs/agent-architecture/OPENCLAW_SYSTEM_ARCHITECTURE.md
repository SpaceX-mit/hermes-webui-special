# OpenClaw 系统架构全面技术文档

## 概述

OpenClaw 是一个**本地优先的个人 AI 助手平台**，运行在用户设备上，提供多通道消息集成、语音交互、可扩展插件系统和完整的 Agent 管理体系。

系统由三个主要组件构成：
1. **openclaw-api-spec**（TypeScript/Node.js）— 核心 Gateway 服务器和插件 SDK
2. **openclaw-sdk**（Python）— 编程访问客户端库
3. **JDClawWebUI**（TypeScript/Lit）— 官方 Web 前端

---

## 一、系统整体架构

### 1.1 架构全图

```
┌─────────────────────────────────────────────────────────────────────┐
│                      OpenClaw 系统架构                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  CLI/WebUI   │  │  macOS App   │  │  Mobile Node │             │
│  │  (TypeScript)│  │  (Swift)     │  │  (iOS/Android│             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                      │
│         └─────────────────┼──────────────────┘                     │
│                           │  WebSocket ws://host:18789              │
│                    ┌──────▼──────┐                                  │
│                    │   Gateway   │  ← 控制面（100+ RPC 方法）        │
│                    │  (Node.js)  │                                  │
│                    └──────┬──────┘                                  │
│                           │                                         │
│         ┌─────────────────┼─────────────────┐                      │
│         │                 │                 │                       │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐              │
│  │   Agent     │  │   Channel    │  │   Plugin    │              │
│  │   Runtime   │  │   Registry   │  │   Registry  │              │
│  │ (Pi-Agent)  │  │  (25+ 平台)  │  │  (可扩展)   │              │
│  └─────────────┘  └──────────────┘  └─────────────┘              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Python SDK (openclaw-sdk)                  │  │
│  │  OpenClawClient → Agent → Conversation → Manager classes     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心子系统

| 子系统 | 路径 | 语言 | 职责 |
|--------|------|------|------|
| Gateway | `src/gateway/` | TypeScript | WebSocket 控制面、RPC 方法、Session 管理 |
| Plugin SDK | `src/plugin-sdk/` | TypeScript | Provider 注册、工具系统、Hooks、Channel |
| Channels | `src/channels/` | TypeScript | 25+ 消息平台集成 |
| Agent Runtime | `src/agents/` | TypeScript | Pi-Agent 执行、工具调用、流式输出 |
| Auto-Reply | `src/auto-reply/` | TypeScript | 消息路由、命令控制、回复管道 |
| Config | `src/config/` | TypeScript | 配置管理、Schema 验证 |
| Python SDK | `openclaw-sdk/` | Python | 编程访问客户端库 |

### 1.3 技术栈

| 层次 | 技术 |
|------|------|
| Gateway 运行时 | Node.js 22+（TypeScript，ESM 模块） |
| 构建工具 | pnpm、tsx、tsdown |
| 测试框架 | Vitest |
| 桌面端 | Swift/SwiftUI（macOS/iOS） |
| Python SDK | Python 3.8+、Pydantic、asyncio |

---

## 二、Gateway 通信协议

### 2.1 WebSocket 协议（Protocol v3）

**默认地址：** `ws://127.0.0.1:18789`

**握手流程：**

```
Gateway → Client:  connect.challenge { nonce, ts }
Client  → Gateway: connect { auth, device, minProtocol:3, maxProtocol:3 }
Gateway → Client:  hello-ok { protocol:3, server:{...}, features:{...} }
```

**帧格式：**

```json
// 请求
{ "type": "req", "id": "uuid", "method": "agents.list", "params": {} }

// 响应（成功）
{ "type": "res", "id": "uuid", "ok": true, "payload": {...} }

// 响应（失败）
{ "id": "uuid", "error": { "code": 4001, "message": "AUTH_TOKEN_INVALID" } }

// 推送事件
{ "type": "event", "event": "agent", "payload": {...}, "seq": 42 }
```

**设备认证结构：**

```typescript
interface DeviceAuth {
  id: string;           // 设备 ID
  publicKey: string;    // Ed25519 公钥（base64url）
  signature: string;    // Ed25519 签名（base64url）
  signedAt: number;     // 签名时间戳（ms）
  nonce: string;        // 来自 connect.challenge 的 nonce
}
```

### 2.2 Session Key 格式

```
sessionKey = `${channelId}:${accountId}:${threadId || 'main'}`

示例：
  telegram:123456789:main
  discord:987654321:channel-1
  agent:my-agent:main          ← SDK 默认格式
  jdui-abc123def456            ← JDUI 创建的 session
```

---

## 三、RPC API 完整方法列表（100+）

### 3.1 Session 管理（18 个方法）

| 方法 | 功能 |
|------|------|
| `sessions.list` | 列出所有 session（支持过滤） |
| `sessions.create` | 创建 session |
| `sessions.get` | 获取 session 详情 |
| `sessions.send` | 发送消息（已废弃，用 chat.send） |
| `sessions.subscribe` | 订阅 session 变更事件 |
| `sessions.unsubscribe` | 取消订阅 |
| `sessions.patch` | 更新 session（label、model、thinking level） |
| `sessions.delete` | 删除 session |
| `sessions.reset` | 清空 session 消息 |
| `sessions.compact` | 压缩 session 历史（上下文压缩） |
| `sessions.usage` | 获取 token 使用统计 |
| `sessions.abort` | 中止运行中的 session |
| `sessions.preview` | 获取 session 状态快照 |
| `sessions.resolve` | 解析 session 当前状态 |
| `chat.send` | 发送消息（流式，推荐） |
| `chat.abort` | 中止对话 |
| `chat.history` | 获取对话历史 |
| `chat.inject` | 注入消息 |

### 3.2 Agent 管理（10 个方法）

| 方法 | 功能 |
|------|------|
| `agents.list` | 列出所有 agent |
| `agents.create` | 创建 agent |
| `agents.update` | 更新 agent 配置 |
| `agents.delete` | 删除 agent |
| `agents.files.list` | 列出 agent 文件 |
| `agents.files.get` | 获取文件内容 |
| `agents.files.set` | 写入文件内容 |
| `agent.identity.get` | 获取 agent 身份信息 |
| `agent.wait` | 等待 agent 执行完成 |
| `agent` | 直接执行 agent |

### 3.3 配置管理（6 个方法）

| 方法 | 功能 |
|------|------|
| `config.get` | 获取完整配置（含 hash） |
| `config.set` | 替换完整配置 |
| `config.patch` | 部分更新（支持 CAS） |
| `config.apply` | 应用配置（带验证） |
| `config.schema` | 获取配置 JSON Schema |
| `models.list` | 获取可用 LLM 模型列表 |

### 3.4 Skills 管理（6 个方法）

| 方法 | 功能 |
|------|------|
| `skills.status` | 获取技能状态（含依赖检查） |
| `skills.search` | 搜索技能 |
| `skills.detail` | 获取技能详情 |
| `skills.bins` | 获取技能可执行文件 |
| `skills.install` | 安装技能 |
| `skills.update` | 更新技能 |

### 3.5 Cron 调度（7 个方法）

| 方法 | 功能 |
|------|------|
| `cron.list` | 列出所有定时任务 |
| `cron.status` | 获取 cron 系统状态 |
| `cron.add` | 创建定时任务 |
| `cron.update` | 更新定时任务 |
| `cron.remove` | 删除定时任务 |
| `cron.run` | 立即触发任务 |
| `cron.runs` | 获取任务执行历史 |

### 3.6 Approval 审批（10 个方法）

| 方法 | 功能 |
|------|------|
| `exec.approval.request` | 请求审批（阻塞直到决策） |
| `exec.approval.resolve` | 批准或拒绝 |
| `exec.approval.waitDecision` | 等待审批决策 |
| `exec.approvals.get` | 获取审批配置 |
| `exec.approvals.set` | 更新审批配置（CAS） |
| `exec.approvals.node.get` | 获取节点级审批配置 |
| `exec.approvals.node.set` | 更新节点级审批配置 |
| `plugin.approval.*` | 插件审批工作流 |

### 3.7 其他类别

| 类别 | 方法数 | 主要功能 |
|------|--------|---------|
| Channels | 2 | 通道状态、登出 |
| TTS | 6 | 文字转语音、provider 管理 |
| Devices | 6 | 设备配对、token 轮换 |
| Nodes | 16 | 节点管理、配对、调用 |
| Webhooks | 4 | Webhook 配置 |
| Usage/Billing | 4 | 用量统计、费用分析 |
| Logs | 2 | 日志查看 |
| Updates | 2 | 系统更新 |
| Secrets | 2 | 密钥管理 |

### 3.8 HTTP REST API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/v1/status` | Gateway 状态 |
| POST | `/api/v1/sessions/send` | 发送消息 |
| GET | `/api/v1/sessions/:key/messages` | 获取消息历史 |
| POST | `/api/v1/config/set` | 设置配置 |
| GET | `/api/v1/channels/status` | 通道状态 |

---

## 四、AgentConfig 完整字段

```python
AgentConfig(
    # 基础标识（必填）
    agent_id: str,                    # 格式：^[a-zA-Z0-9_-]+$

    # 显示
    name: str | None = None,

    # 角色定义
    system_prompt: str = 'You are a helpful assistant.',

    # LLM 配置
    llm_provider: Literal['anthropic', 'openai', 'gemini', 'ollama'] = 'anthropic',
    llm_model: str = 'claude-sonnet-4-20250514',
    llm_api_key: str | None = None,   # None = 使用 Gateway 全局 key

    # 通道绑定
    channels: list[str] = [],

    # 记忆
    enable_memory: bool = True,
    memory_backend: Literal['memory', 'redis'] = 'memory',

    # 权限模型
    permission_mode: Literal['accept', 'confirm', 'reject'] = 'accept',
    #   accept  → 自动接受所有工具调用
    #   confirm → 危险操作需用户确认（exec.approval.* API）
    #   reject  → 拒绝所有工具调用

    # 工具配置
    tool_policy: ToolPolicy | None = None,
    mcp_servers: dict[str, StdioMcpServer | HttpMcpServer] | None = None,
    skills: SkillsConfig | None = None,
)
```

### Agent 状态机

```
CREATED → RUNNING → IDLE
                  ↓
               ERROR → DELETED
```

---

## 五、事件流系统

### 5.1 Agent 事件（`agent` 事件类型）

```json
{
  "runId": "run-uuid",
  "sessionKey": "agent:main:main",
  "stream": "assistant" | "tool" | "thinking" | "lifecycle" | "error",
  "seq": 42,
  "ts": 1713254400000,
  "data": { "delta": "text chunk...", "payload": {} }
}
```

### 5.2 Chat 事件（`chat` 事件类型）

```json
{
  "runId": "run-uuid",
  "sessionKey": "agent:main:main",
  "state": "delta" | "final" | "aborted" | "error",
  "message": { "role": "assistant", "content": "..." },
  "errorMessage": null
}
```

### 5.3 Python SDK EventType 枚举

```python
class EventType(StrEnum):
    # SDK 层（强类型）
    THINKING       = "thinking"
    TOOL_CALL      = "tool_call"
    TOOL_RESULT    = "tool_result"
    FILE_GENERATED = "file_generated"
    CONTENT        = "content"
    ERROR          = "error"
    DONE           = "done"

    # Gateway 层（原始事件）
    AGENT          = "agent"
    CHAT           = "chat"
    PRESENCE       = "presence"
    HEALTH         = "health"
    TICK           = "tick"
    HEARTBEAT      = "heartbeat"
    CRON           = "cron"
    SHUTDOWN       = "shutdown"
```

---

## 六、Python SDK 架构

### 6.1 OpenClawClient — 入口

```python
client = await OpenClawClient.connect(
    gateway_ws_url="ws://127.0.0.1:18789",
    api_key="your-key",
)
# 三种 Gateway 实现：
# ProtocolGateway      → WebSocket RPC（ws:// 或 wss://）
# LocalGateway         → 本地 OpenClaw（ws://127.0.0.1:18789）
# OpenAICompatGateway  → OpenAI 兼容 HTTP REST
```

**懒加载 Manager 属性：**

| 属性 | Manager 类 | 功能 |
|------|-----------|------|
| `client.channels` | ChannelManager | 消息通道管理 |
| `client.scheduling` | ScheduleManager | Cron 定时任务 |
| `client.skills` | SkillManager | 技能管理 |
| `client.config_mgr` | ConfigManager | 配置管理 |
| `client.approvals` | ApprovalManager | 审批工作流 |
| `client.nodes` | NodeManager | 节点管理 |
| `client.ops` | OpsManager | 运维（日志、用量） |
| `client.devices` | DeviceManager | 设备配对 |
| `client.tts` | TTSManager | 文字转语音 |
| `client.clawhub` | ClawHub | 技能市场 |

### 6.2 Agent — 执行核心

```python
agent = client.get_agent("my-agent")
# session_key = "agent:my-agent:main"

# 单次执行（阻塞）
result = await agent.execute("分析这份数据")
print(result.content)
print(result.token_usage)  # input/output/cache_read/cache_write

# 流式执行（原始事件）
async for event in agent.execute_stream("分析这份数据"):
    if event.event_type == EventType.CONTENT:
        print(event.data.get("text", ""), end="")
    elif event.event_type == EventType.DONE:
        break

# 强类型流式执行
async for event in agent.execute_stream_typed("分析这份数据"):
    if isinstance(event, ContentEvent):
        print(event.content, end="")
    elif isinstance(event, ToolCallEvent):
        print(f"\n[工具调用] {event.tool_name}: {event.input}")
    elif isinstance(event, ThinkingEvent):
        print(f"\n[思考] {event.thinking}")

# 多轮对话
async with agent.conversation("session-001") as convo:
    r1 = await convo.say("你好")
    r2 = await convo.say("继续上面的话题")
    print(f"共 {convo.turns} 轮对话")

# 批量执行（并发）
results = await agent.batch(
    ["问题1", "问题2", "问题3"],
    max_concurrency=3,
)

# 结构化输出（Pydantic）
class Report(BaseModel):
    title: str
    summary: str
    score: float

report = await agent.execute_structured("生成报告", output_model=Report)
```

**ExecutionResult 结构：**

```python
class ExecutionResult(BaseModel):
    success: bool
    content: str
    content_blocks: list[ContentBlock] = []
    files: list[GeneratedFile] = []
    tool_calls: list[ToolCall] = []
    thinking: str | None = None
    latency_ms: int = 0
    token_usage: TokenUsage           # input/output/cache_read/cache_write
    completed_at: datetime
    stop_reason: str | None           # "complete"/"aborted"/"error"/"timeout"
    error_message: str | None
```

**Agent 运行时配置方法：**

```python
# 工具策略
await agent.set_tool_policy(ToolPolicy(deny=["web_search"]))
await agent.deny_tools("web_search", "terminal")
await agent.allow_tools("read_file")

# 技能
await agent.enable_skill("code-runner")
await agent.disable_skill("web-scraper")

# MCP 服务器
await agent.add_mcp_server("fs", StdioMcpServer(
    command="npx", args=["-y", "@modelcontextprotocol/server-filesystem"]
))
await agent.remove_mcp_server("fs")

# Agent 文件操作（workspace）
await agent.set_file("SOUL.md", "# 角色设定\n你是...")
content = await agent.get_file("SOUL.md")
files = await agent.list_files()

# 记忆管理
await agent.reset_memory()
status = await agent.get_memory_status()
```

### 6.3 Manager 类详解

#### ScheduleManager — 定时任务

```python
job = await client.scheduling.create_schedule(ScheduleConfig(
    name="每日报告",
    schedule="0 9 * * *",
    session_target="agent:main:main",
    payload="生成今日工作报告",
    enabled=True,
))

jobs = await client.scheduling.list_schedules()
await client.scheduling.run_now(job.id)
runs = await client.scheduling.get_runs(job.id)
await client.scheduling.delete_schedule(job.id)
```

**Schedule 类型：**
```python
{ "kind": "cron",  "expr": "0 9 * * *", "tz": "Asia/Shanghai" }
{ "kind": "every", "everyMs": 3600000 }
{ "kind": "at",    "at": "2026-04-18T09:00:00Z" }
```

#### ConfigManager — 配置管理

```python
config, hash = await client.config_mgr.get_parsed()

await client.config_mgr.set_agent_model(
    "my-agent",
    provider="anthropic",
    model="claude-opus-4-6",
)

# 已知 Provider
ConfigManager.available_providers()
# ['anthropic', 'openai', 'google', 'openrouter', 'ollama', ...]

ConfigManager.available_models("anthropic")
# ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', ...]
```

#### ApprovalManager — 审批工作流

```python
result = await client.approvals.request(
    command="rm -rf /tmp/data",
    agent_id="my-agent",
    timeout_ms=30000,
)
# result.decision: "allow-once" | "allow-always" | "deny" | null(超时)

await client.approvals.resolve(request_id, "approve")
await client.approvals.resolve(request_id, "deny")
```

#### OpsManager — 运维

```python
usage = await client.ops.usage_cost()       # 每日费用明细
sessions_usage = await client.ops.sessions_usage()  # 每 session token 用量
logs = await client.ops.logs_tail()
status = await client.ops.system_status()

---

## 七、插件系统

### 7.1 插件类型

| 类型 | 功能 |
|------|------|
| **Provider** | LLM 模型提供商（OpenAI、Anthropic、Google 等） |
| **Channel** | 消息平台（Telegram、Discord、Slack、WhatsApp 等） |
| **Speech** | TTS/STT 提供商（ElevenLabs、Microsoft、OpenAI） |
| **Memory** | 存储后端（LanceDB、Redis、Qdrant） |
| **Hook-only** | 纯 Hook 插件（无其他能力） |

### 7.2 插件入口结构

```typescript
const plugin: OpenClawPluginDefinition = {
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  description: "插件描述",
  minHostVersion: "0.3.0",

  register(api: OpenClawPluginApi) {
    api.registerProvider({ /* 40+ hooks */ });

    api.registerChannel({
      id: "my-channel",
      setup: { webhook: { path: "/webhook", handler } },
      lifecycle: { onMessage: async (msg) => {} },
      actions: { send: async (target, content) => {} },
    });

    api.addTool({
      name: "my_tool",
      description: "工具描述",
      schema: { type: "object", properties: { query: { type: "string" } } },
      handler: async (params, ctx) => ({ result: "..." }),
    });

    api.addHook("before_agent_start", async (ctx) => {});
    api.addHook("after_agent_reply",  async (ctx) => {});
    api.addHook("before_tool_call",   async (ctx) => {});
    api.addHook("after_tool_call",    async (ctx) => {});

    api.addRoute("GET", "/my-endpoint", async (req, res) => {});

    api.addService({
      start: async () => {},
      stop: async () => {},
      healthCheck: async () => ({ healthy: true }),
    });
  },
};
```

### 7.3 Provider 注册（40+ Hooks 顺序执行）

```
1.  catalog              → 发布 provider 配置到 models.json
2.  applyConfigDefaults  → 应用全局配置默认值
3.  normalizeModelId     → 规范化旧版 model ID
4.  normalizeTransport   → 规范化 API/baseUrl
5.  normalizeConfig      → 规范化配置
...（35+ 更多 hooks）
40. onModelSelected      → 模型选择后的副作用
```

### 7.4 插件加载流程

```
发现插件路径 → 读取 manifest → 安全验证 → 启用决策
    ↓
运行时加载（jiti import）→ 调用 register(api) → 注册能力到各子系统
```

---

## 八、消息路由与 Auto-Reply 管道

### 8.1 入站消息处理流程

```
Channel Webhook 触发
    ↓
解析 & 验证消息格式
    ↓
Allowlist 检查（DMPolicy、Pairing 策略）
    ↓
Session 解析（路由到对应 agent）
    ↓
Agent 执行（Pi-Agent runtime）
    ↓
回复管道（格式化 & 发送）
```

### 8.2 Auto-Reply 管道阶段

```
inbound（入站消息）
    ↓
inbound-debounce  → 去重（防止重复消息）
    ↓
command-control   → 命令检测（/help、/reset 等）
    ↓
dispatch          → 消息路由（选择 agent）
    ↓
reply             → 响应处理（流式输出）
    ↓
outbound（出站消息）
```

---

## 九、工具系统

### 9.1 工具定义

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  schema: JsonSchema;
  handler: ToolHandler;
  permissions?: string[];
  workspaceOnly?: boolean;
  ownerOnly?: boolean;
}
```

### 9.2 工具调用管道

```
工具调用请求
    ↓
Policy Match    → 匹配工具策略（allow/deny 列表）
    ↓
Sandbox Check   → 路径沙箱验证
    ↓
Workspace Guard → Workspace 边界守卫
    ↓
Loop Detection  → 无限循环检测
    ↓
执行工具
```

### 9.3 ToolPolicy 配置

```python
from openclaw_sdk import ToolPolicy

policy = ToolPolicy(deny=["web_search", "terminal"])
policy = ToolPolicy(allow=["read_file", "write_file"])
await agent.set_tool_policy(policy)
```

---

## 十、Channel 系统

### 10.1 支持的消息平台（25+）

| 类别 | 平台 |
|------|------|
| 即时通讯 | Telegram、WhatsApp、Signal、iMessage、SMS |
| 团队协作 | Slack、Discord、Microsoft Teams、Google Chat |
| 开放协议 | Matrix |
| 亚洲平台 | Zalo |
| 自定义 | Custom Webhook |

### 10.2 Channel 配置结构

```typescript
interface ChannelConfig {
  id: string;
  enabled: boolean;
  accountId: string;
  allowFrom?: string[];
  dmPolicy?: "open" | "pairing" | "closed";
}

interface ChannelStatus {
  id: string;
  state: "running" | "stopped" | "error" | "reconnecting";
  connected: boolean;
  lastConnectedAt?: number;
  lastError?: string;
  activeRuns?: number;
}
```

---

## 十一、认证与权限体系

### 11.1 三层认证

```
Layer 1: Gateway 认证
  ├─ connect.auth.token（WebSocket 连接时）
  ├─ connect.auth.password
  └─ Device Token（已配对设备）

Layer 2: Scope 授权
  ├─ operator.read      → 读操作
  ├─ operator.write     → 写操作
  ├─ operator.admin     → 管理操作（config.set 等）
  ├─ operator.approvals → 审批操作
  ├─ operator.pairing   → 设备配对
  └─ operator.talk.secrets → Talk 模式密钥

Layer 3: 命令级权限
  ├─ /config set → 需要 operator.admin
  ├─ /exec       → 需要 operator.approvals
  └─ /pair       → 需要 operator.pairing
```

### 11.2 设备配对（Ed25519 签名）

```python
await client.devices.approve_pairing(request_id)
await client.devices.rotate_token(device_id, role="operator")
await client.devices.revoke_token(device_id, role="operator")
```

---

## 十二、配置系统

### 12.1 完整配置结构

```typescript
interface OpenClawConfig {
  gateway: { port: number; mode: "local" | "remote"; auth: GatewayAuthConfig };
  agents:  { defaults: AgentDefaults; entries: Record<string, AgentConfig> };
  channels: { telegram?: ...; discord?: ...; slack?: ...; /* 其他通道 */ };
  models:  { providers: Record<string, ProviderConfig>; defaults: ModelDefaults };
  plugins: { enabled: string[]; allow: string[]; deny: string[]; entries: Record<string, PluginEntry> };
  skills?: SkillsConfig;
  hooks?:  HooksConfig;
}
```

### 12.2 已知 LLM Provider 和模型

| Provider | 代表模型 |
|----------|---------|
| `anthropic` | claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001 |
| `openai` | gpt-4o, gpt-4o-mini, gpt-4.1, o3, o4-mini |
| `google` | gemini-3-flash, gemini-2.5-pro, gemini-2.5-flash |
| `openrouter` | anthropic/claude-*, openai/gpt-*, google/gemini-* |
| `ollama` | llama3.3, mistral, codellama, deepseek-r1 |

---

## 十三、高级功能

### 13.1 自主 Agent

```python
from openclaw_sdk.autonomous import Goal, GoalLoop, Budget

goal = Goal(
    description="研究 AI 最新趋势",
    success_criteria="生成完整的研究报告",
    budget=Budget(max_tokens=100000, max_cost=10.0),
)
result = await GoalLoop(agent, goal).run()
```

### 13.2 工作流

```python
from openclaw_sdk.workflows import Workflow, WorkflowStep, research_workflow

result = await research_workflow(agent, topic="AI 趋势")

workflow = Workflow(steps=[
    WorkflowStep(name="research", agent=researcher),
    WorkflowStep(name="review",   agent=reviewer),
    WorkflowStep(name="write",    agent=writer),
])
result = await workflow.execute()
```

### 13.3 多 Agent 协调

```python
from openclaw_sdk.coordination import Supervisor, ConsensusGroup, AgentRouter

# 监督者模式（多数投票）
result = await Supervisor(agents=[a1, a2, a3], strategy="majority_vote").execute(query)

# 共识组
result = await ConsensusGroup(agents=[a1, a2]).reach_consensus(query)

# 路由器
router = AgentRouter(agents={"support": support_agent, "sales": sales_agent})
result = await router.route(query, category="support")
```

### 13.4 语义缓存

```python
from openclaw_sdk.cache import SemanticCache, OpenAIEmbeddingProvider

cache = SemanticCache(
    embedding_provider=OpenAIEmbeddingProvider(api_key="..."),
    similarity_threshold=0.85,
)
await cache.set("ai-query", result)
cached = await cache.get("人工智能是什么？")  # 语义相似命中
```

### 13.5 告警系统

```python
from openclaw_sdk.alerting import AlertManager, CostThresholdRule, WebhookAlertSink

alert_mgr = AlertManager()
alert_mgr.add_rule(CostThresholdRule(threshold_usd=1.0))
alert_mgr.add_sink(WebhookAlertSink(url="https://hooks.slack.com/..."))
alert_mgr.set_cooldown(seconds=3600)

alerts = await alert_mgr.evaluate(agent.agent_id, result)
```

**内置规则：** CostThresholdRule、LatencyThresholdRule、ErrorRateRule、ConsecutiveFailureRule

**内置 Sink：** LogAlertSink、WebhookAlertSink、SlackAlertSink、PagerDutyAlertSink、EmailAlertSink

---

## 十四、JDClawWebUI 架构

### 14.1 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Lit Web Components（TypeScript） |
| 构建 | Vite |
| 通信 | WebSocket → OpenClaw Gateway |
| 认证 | 设备指纹 + Token |

### 14.2 GatewayClient 核心

```typescript
class GatewayClient {
  // 连接管理（自动重连，指数退避 1s→30s）
  connect(): Promise<GatewayHello>

  // RPC 调用（30s 超时，UUID 请求追踪）
  request<T>(method: string, params?: Record<string, unknown>): Promise<T>

  // 事件订阅
  on(event: string, handler): () => void
  onChat(handler: (payload: ChatEventPayload) => void): () => void
  onAgent(handler: (payload: AgentEventPayload) => void): () => void
}
```

### 14.3 核心类型

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thinking?: string;
  usage?: TokenUsage;
  stopReason?: string;
}

interface Session {
  id: string;
  key: string;           // sessionKey 格式
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  model?: string;
  agentId?: string;
}

type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'stream';
```

### 14.4 功能开发状态

**已完成：** WebSocket 连接、Session 列表、消息流式输出、Markdown 渲染、附件上传、Token 用量、主题切换、命令面板、Agent/Model 选择器、自动重连

**开发中（P0）：** Session CRUD、中止回复、消息重试/编辑/复制、代码块高亮

**规划中（P1/P2）：** Agent 管理、Tool 审批 UI、Cron 管理、Channel 管理、Skills 管理、用量统计面板

---

## 十五、性能参数与限制

| 参数 | 值 |
|------|-----|
| WebSocket 帧大小限制 | 512 KiB |
| 默认请求超时 | 30 秒 |
| 工具执行超时 | 120 秒 |
| 重连退避初始值 | 1 秒 |
| 重连退避最大值 | 30 秒（±50% jitter） |
| Cron 最大并发数 | 5 个任务 |
| Session 历史默认限制 | 50 条消息 |
| 协议版本 | 3 |

---

## 十六、错误码

| 错误码 | 含义 |
|--------|------|
| `AUTH_TOKEN_INVALID` | 认证 token 无效 |
| `AUTH_TOKEN_EXPIRED` | Token 已过期 |
| `AUTH_SCOPE_INSUFFICIENT` | 权限不足 |
| `SESSION_NOT_FOUND` | Session 不存在 |
| `SESSION_LOCKED` | Session 被锁定 |
| `CHANNEL_NOT_FOUND` | 通道不存在 |
| `CHANNEL_DISABLED` | 通道已禁用 |
| `TOOL_NOT_FOUND` | 工具不存在 |
| `TOOL_EXECUTION_FAILED` | 工具执行失败 |
| `INVALID_REQUEST` | 请求格式无效 |
| `RATE_LIMITED` | 触发速率限制 |

---

## 十七、JDUI 集成现状与差距

### 17.1 已使用的 API

| API | 使用位置 | 说明 |
|-----|---------|------|
| `OpenClawClient.connect()` | openclaw_provider.py | 连接 Gateway（已改为连接池） |
| `client.get_agent(id)` | openclaw_provider.py | 获取 agent 实例 |
| `agent.execute_stream(msg)` | openclaw_provider.py | 流式执行 |
| `client.list_agents()` | openclaw_provider.py | 获取 agent 列表 |
| `client.create_agent(config)` | openclaw_provider.py | 创建员工时建 agent |
| `client.delete_agent(id)` | openclaw_provider.py | 删除员工时删 agent |
| `agent.conversation(key)` | openclaw_provider.py | 多轮对话（P2 新增） |

### 17.2 可利用但未使用的 API

| API | 潜在用途 |
|-----|---------|
| `sessions.usage` | 精确 token 统计 |
| `sessions.compact` | 触发 Gateway 侧上下文压缩 |
| `agents.files.get/set` | 读写 agent 的 SOUL.md 等文件 |
| `agent.identity.get` | 获取 agent 身份信息 |
| `exec.approvals.*` | 危险命令审批 UI |
| `skills.*` | Gateway 侧技能管理 |
| `cron.*` | 定时任务管理 |
| `client.ops.usage_cost()` | 费用分析面板 |
| `client.config_mgr.set_agent_model()` | 动态切换 agent 模型 |
| `agent.batch()` | 批量并发执行 |

### 17.3 能力映射对照

| 员工能力 | Hermes 映射 | OpenClaw 映射（P0 已实现） |
|---------|------------|--------------------------|
| `autoExec: true` | toolsets: terminal | `permission_mode='accept'` |
| `autoExec: false` | 不含 terminal | `permission_mode='confirm'` |
| `memory: true` | toolsets: memory | `enable_memory=True` |
| `memory: false` | 不含 memory | `enable_memory=False` |
| `search: true` | toolsets: web | 待实现（tool_policy） |
| `knowledge: true` | toolsets: file | 待实现（skills） |

---

## 十八、关键文件索引

| 文件 | 内容 |
|------|------|
| `openclaw-api-spec/docs/API.md` | 完整 API 规范（100+ RPC 方法，1030 行） |
| `openclaw-api-spec/docs/ARCHITECTURE.md` | 系统架构设计（905 行） |
| `openclaw-api-spec/docs/PRINCIPLES.md` | 核心设计原则（1003 行） |
| `openclaw-api-spec/docs/pi.md` | Pi-Agent 运行时文档（570 行） |
| `openclaw-api-spec/docs/tts.md` | TTS 系统文档（452 行） |
| `openclaw-sdk/src/openclaw_sdk/core/client.py` | Python SDK 主客户端 |
| `openclaw-sdk/src/openclaw_sdk/core/agent.py` | Agent 类实现 |
| `openclaw-sdk/src/openclaw_sdk/core/types.py` | AgentConfig 等类型定义 |
| `openclaw-sdk/src/openclaw_sdk/core/constants.py` | EventType、AgentStatus 等常量 |
| `JDClawWebUI/src/utils/gateway.ts` | TypeScript Gateway 客户端 |
| `JDClawWebUI/src/types/index.ts` | 完整前端类型定义 |
| `hermes-webui/api/providers/openclaw_provider.py` | JDUI 侧 OpenClaw 集成 |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本，覆盖 Gateway 协议、RPC API、Python SDK、插件系统、Channel 系统、认证体系、JDClawWebUI 和 JDUI 集成分析
```
