# OpenClaw 对接详细设计方案

## 1. 背景

JDUI 已实现 `IAgentProvider` 抽象层和 `AgentManager`，`HermesProvider` 已完整运行。现在需要实现 `OpenClawProvider`，对接已有的 OpenClaw Gateway 实例，使数字员工可以选择 OpenClaw 作为 Agent 后端。

## 2. 什么是 openclaw-sdk

`openclaw-sdk` 是 OpenClaw 官方发布在 PyPI 上的 Python SDK 包，封装了与 OpenClaw Gateway 的通信协议（HTTP REST + WebSocket），提供 Python 类来调用 OpenClaw 的功能。

```
你的代码                    openclaw-sdk                OpenClaw Gateway
(JDUI Server)              (Python 包)                 (服务端进程)
     │                          │                           │
     │  import openclaw_sdk     │                           │
     │  client = OpenClawClient │                           │
     │  agent.execute_stream()  │── HTTP/WS 通信 ──────────→│
     │                          │                           │── 调用 LLM API
     │  ←── event.type='token' ─│←── 流式响应 ──────────────│
     │  ←── event.type='tool'  ─│                           │
```

安装方式：`pip install openclaw-sdk`（可选依赖，不装则 OpenClaw provider 显示"不可用"）

SDK 核心类：
- `OpenClawClient(base_url, api_key)` — 连接 Gateway
- `client.get_agent(model)` — 获取 Agent 实例
- `agent.execute(message)` — 同步执行
- `agent.execute_stream(message)` — 流式执行，返回事件迭代器
- `CostTracker` — token 用量和成本追踪

## 3. 对接架构

```
┌─────────────────────────────────────────────────────────────┐
│                     JDUI Server                              │
│                                                              │
│  routes.py                                                   │
│    └→ streaming.py                                           │
│         └→ AgentManager.get_provider('openclaw')             │
│              └→ OpenClawProvider.create_agent()               │
│                   └→ OpenClawAgent                            │
│                        │                                     │
│                        │  from openclaw_sdk import            │
│                        │       OpenClawClient                 │
│                        │                                     │
│                        ▼                                     │
│                   OpenClawClient(                             │
│                     base_url="http://host:18789",            │
│                     api_key="bearer-token"                   │
│                   )                                          │
└────────────────────────┼─────────────────────────────────────┘
                         │  HTTP REST + Bearer Token Auth
                         ▼
                ┌─────────────────┐
                │  OpenClaw       │
                │  Gateway        │
                │  :18789         │
                │                 │
                │  ┌───────────┐  │
                │  │ Agent     │  │
                │  │ Runtime   │──│──→ OpenAI / Anthropic / Google
                │  └───────────┘  │
                │  ┌───────────┐  │
                │  │ Sessions  │  │
                │  │ Memory    │  │
                │  │ Skills    │  │
                │  └───────────┘  │
                └─────────────────┘
```

## 4. 配置方式

### 4.1 环境变量（优先级最高）

```bash
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_API_KEY=your-bearer-token
```

### 4.2 设置页面（Settings > Agents 标签页）

在 UI 中填写 Gateway URL 和 API Key，保存到 `~/.hermes/webui/settings.json`：

```json
{
  "openclaw_gateway_url": "http://127.0.0.1:18789",
  "openclaw_api_key": "your-bearer-token"
}
```

### 4.3 配置读取优先级

```
环境变量 OPENCLAW_GATEWAY_URL / OPENCLAW_API_KEY
    ↓ (未设置时)
settings.json 中的 openclaw_gateway_url / openclaw_api_key
    ↓ (未设置时)
默认值 http://127.0.0.1:18789 / 空
```

## 5. OpenClawProvider 实现设计

### 5.1 IAgentProvider 方法

| 方法 | 实现逻辑 |
|------|----------|
| `get_provider_id()` | 返回 `'openclaw'` |
| `is_available()` | `import openclaw_sdk` 成功则 True |
| `get_supported_models()` | 调用 Gateway REST API `GET /api/models` 获取模型列表 |
| `create_agent()` | 读取配置，创建 `OpenClawAgent` 实例 |

### 5.2 OpenClawAgent.run() 流程

```
run(user_message, system_message, conversation_history, session_id, personality)
    │
    ├─ 1. 创建 OpenClawClient(base_url, api_key)
    │
    ├─ 2. 获取 agent = client.get_agent(model)
    │
    ├─ 3. 构建消息（注入 personality 到 system message）
    │
    ├─ 4. 调用 agent.execute_stream(message)
    │     │
    │     ├─ event.type == 'token' → on_token(event.text)
    │     ├─ event.type == 'tool_use' → on_tool(name, preview, args)
    │     └─ self._interrupted → break
    │
    ├─ 5. 构建返回消息列表（history + user + assistant）
    │
    ├─ 6. 提取 token 用量（从 CostTracker）
    │
    └─ 7. 返回 AgentResult(messages, usage)
```

### 5.3 事件映射

| OpenClaw SDK 事件 | JDUI 回调 | 说明 |
|-------------------|-----------|------|
| `event.type == 'token'` | `on_token(event.text)` | LLM 输出 token |
| `event.type == 'tool_use'` | `on_tool(name, preview, args)` | 工具调用 |
| 流结束 | 循环退出 | 构建 AgentResult |
| 异常 | 抛出到 streaming.py | 转为 SSE error 事件 |

## 6. streaming.py 改造

当前代码在创建 agent 后直接调用 Hermes 专用的 `agent.run_conversation()`。需要分支处理：

```python
if hasattr(_iagent, 'raw_agent'):
    # ── Hermes provider：走原有完整路径 ──
    agent = _iagent.raw_agent
    # ... 原有的 run_conversation + 后处理逻辑不变 ...
else:
    # ── 其他 provider（OpenClaw 等）：走 IAgent.run() 标准接口 ──
    _agent_result = _iagent.run(
        user_message=workspace_ctx + msg_text,
        system_message=workspace_system_msg,
        conversation_history=_sanitize_messages_for_api(s.messages),
        session_id=session_id,
        personality=_personality_prompt,
    )
    s.messages = _agent_result.messages
    usage = {
        'input_tokens': _agent_result.usage.input_tokens,
        'output_tokens': _agent_result.usage.output_tokens,
        'estimated_cost': _agent_result.usage.estimated_cost_usd,
    }
    # 直接发送 done 事件，跳过 Hermes 特有的后处理
```

## 7. 前端改动

### 7.1 员工表单增加 Provider 选择

在添加/编辑员工弹窗中，头像选择之前加入 Agent 平台下拉框：

```html
<div class="jdui-form-group">
  <label>Agent 平台</label>
  <select class="jdui-input" id="empFormProvider">
    <!-- 动态从 /api/agent/providers 加载 -->
  </select>
</div>
```

### 7.2 Settings > Agents 面板增加 OpenClaw 配置

在 provider 卡片下方，为 OpenClaw 显示配置表单：

```
┌─────────────────────────────────────┐
│  OpenClaw          [可用] [设为默认]  │
│                                      │
│  接口方法          状态               │
│  get_provider_id   ✓ 已实现          │
│  is_available      ✓ 已实现          │
│  IAgent.run        ✓ 已实现          │
│  ...                                 │
│                                      │
│  ── 连接配置 ──                       │
│  Gateway URL: [http://127.0.0.1:18789]│
│  API Key:     [••••••••••]    [保存]  │
└─────────────────────────────────────┘
```

## 8. 错误处理

| 场景 | 处理方式 |
|------|----------|
| `openclaw-sdk` 未安装 | `is_available()` 返回 False，UI 显示"不可用"，创建员工时不可选 |
| Gateway 不可达 | `run()` 抛 `ConnectionError` → streaming.py 捕获 → SSE `error` 事件 |
| Bearer Token 无效 | 401 → 转为 SSE `apperror` 事件（type: `auth_mismatch`） |
| 模型不存在 | Gateway 返回错误 → 转为 SSE `error` 事件 |
| 流式中断 | `interrupt()` 设置 `_interrupted=True` → `execute_stream` 循环 break |
| SDK 版本不兼容 | `is_available()` 中 try/except 捕获，返回 False |

## 9. 涉及文件

| 文件 | 改动 |
|------|------|
| `api/providers/openclaw_provider.py` | 完整重写：实现 `OpenClawAgent.run()` |
| `api/streaming.py` | 加入 Hermes vs 其他 provider 分支逻辑 |
| `static/panels.js` | 员工表单加 provider 下拉框 + Agents 面板加 OpenClaw 配置表单 |
| `static/index.html` | 员工表单加 provider select + Agents 面板加配置 HTML |
| `requirements.txt` | 添加 `openclaw-sdk`（注释标记为可选） |

## 10. 验证步骤

1. `pip install openclaw-sdk` → 重启服务 → Settings > Agents 显示 OpenClaw "可用"
2. 填写 Gateway URL 和 API Key → 保存
3. 创建员工 → Agent 平台选择 "OpenClaw" → 保存
4. 切换到该员工 → 发送消息 → 收到流式响应
5. 切换回 Hermes 员工 → 聊天正常（无回归）

## 11. Agent ID 与工作目录规范

### 11.1 Agent ID 的生成

OpenClaw Gateway 上的 agent ID **由 JDUI 生成**，Gateway 本身不分配 ID。

生成逻辑在 `api/employees.py` 的 `create_employee()`：

```python
emp_id = uuid.uuid4().hex[:12]          # 12 位随机 hex，如 "c5809d2d1039"
profile_name = f'emp-{emp_id}'          # "emp-c5809d2d1039"

# profile_name 同时作为：
# - JDUI employees.json 中的 profile_name 字段
# - OpenClaw Gateway 上的 agent_id
create_openclaw_agent_on_gateway(profile_name, ...)
```

因此 JDUI 的 `profile_name` 与 Gateway 的 `agent_id` 是同一个值，格式固定为 `emp-{12位hex}`。

### 11.2 Agent 工作目录

每个 OpenClaw agent 有独立的工作目录，用于存放 `SOUL.md`、`IDENTITY.md`、`memory/` 等文件。

**规范路径**：`~/.openclaw/workspace/<agent_id>/`

例如：`/home/duancheng/.openclaw/workspace/emp-c5809d2d1039/`

创建 agent 时由 `create_openclaw_agent_on_gateway()` 自动创建该目录并传给 SDK：

```python
agent_workspace = os.path.expanduser(f'~/.openclaw/workspace/{agent_id}')
os.makedirs(agent_workspace, exist_ok=True)
result = client.create_agent(config, workspace=agent_workspace)
```

**注意**：若不传 `workspace`，SDK 默认使用 `"."` 即进程当前目录。server.py 从 `/home/duancheng` 启动，会导致所有 agent 文件写入 home 目录，污染用户主目录。

### 11.3 目录结构

```
~/.openclaw/
├── openclaw.json              # Gateway 全局配置，含 agents.list
├── workspace/
│   ├── emp-c5809d2d1039/      # 每个 OpenClaw 员工独立工作目录
│   │   ├── SOUL.md            # 性格与行为准则
│   │   ├── IDENTITY.md        # 名字、身份
│   │   ├── USER.md            # 用户信息
│   │   ├── BOOTSTRAP.md       # 首次启动指南
│   │   └── memory/            # 日常记忆
│   └── emp-8b46868528ea/
│       └── ...
└── agents/
    └── emp-c5809d2d1039/
        └── agent/             # Gateway 内部 agent 状态
```

---

## 12. Agent Workspace 文件初始化现状与改进方案

### 12.1 现状分析

#### Hermes agent（创建员工时）

`api/employees.py:create_employee()` 写入：

| 文件 | 内容来源 | 代码位置 |
|------|----------|----------|
| `SOUL.md` | `_generate_soul_md(name, description, traits)` 生成 | `employees.py:54-70` |
| `config.yaml` | 克隆自 default profile | `profiles.py:create_profile_api()` |
| `memories/MEMORY.md` | 空文件 | profile 创建时自动生成 |
| `memories/USER.md` | 空文件 | profile 创建时自动生成 |

**缺失**：IDENTITY.md、BOOTSTRAP.md、HEARTBEAT.md、AGENTS.md、TOOLS.md 均未生成。

#### OpenClaw agent（创建员工时）

`create_openclaw_agent_on_gateway()` 只做了：
1. 创建 `~/.openclaw/workspace/<agent_id>/` 目录
2. 调用 `client.create_agent(config, workspace=...)` 注册到 Gateway

Gateway 自动生成 7 个通用模板文件，但**内容与员工无关**，name/description/traits 没有写入：

| 文件 | Gateway 默认内容 | 问题 |
|------|-----------------|------|
| `SOUL.md` | 通用行为准则模板 | 未包含员工性格特质和描述 |
| `IDENTITY.md` | 空白模板，Name 字段为空 | 未填入员工姓名 |
| `USER.md` | 空白模板 | 未填入用户信息 |
| `TOOLS.md` | 通用工具配置说明 | 未根据员工能力定制 |
| `AGENTS.md` | 通用工作空间指南 | 可保持通用 |
| `BOOTSTRAP.md` | 通用首次启动指南 | 可保持通用 |
| `HEARTBEAT.md` | 空（无心跳任务） | 可保持空 |

#### 引导阶段（Onboarding）

目前对 OpenClaw workspace 文件**没有任何操作**。用户在引导时填写的信息（姓名、时区等）不会写入任何 agent 的 USER.md。

---

### 12.2 改进方案

#### 方案 A：创建员工时写入定制文件（OpenClaw）

在 `create_openclaw_agent_on_gateway()` 完成 Gateway 注册后，立即写入定制内容：

```
create_employee()
    └→ create_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities)
           ├→ client.create_agent(config, workspace=agent_workspace)   # Gateway 生成模板
           └→ _write_openclaw_workspace_files(agent_workspace, name, description, traits, capabilities)
                  ├→ SOUL.md      ← 覆盖：写入员工性格特质
                  ├→ IDENTITY.md  ← 覆盖：写入员工姓名
                  └→ TOOLS.md     ← 覆盖：根据 capabilities 写入工具配置
```

**SOUL.md 定制内容**（参考 Hermes 的 `_generate_soul_md`）：
```markdown
# SOUL.md - {name} 的灵魂

你是 {name}。{description}

## 性格特质
- {trait1}
- {trait2}

## 工作准则
- 保持专业、高效的工作态度
- 根据上下文灵活调整沟通风格
```

**IDENTITY.md 定制内容**：
```markdown
# IDENTITY.md - 我是谁

- **Name:** {name}
- **Creature:** AI 数字员工
- **Vibe:** {description}
- **Emoji:** 🤖
```

#### 方案 B：引导阶段写入 USER.md

在 `onboarding.py:complete_onboarding()` 或 `apply_onboarding_setup()` 中，将用户信息写入所有已存在的 agent workspace：

```
complete_onboarding(user_name, timezone, ...)
    └→ _sync_user_md_to_all_agents(user_name, timezone)
           ├→ 遍历 employees.json 中所有 openclaw 员工
           └→ 写入 ~/.openclaw/workspace/<agent_id>/USER.md
```

**USER.md 内容**：
```markdown
# USER.md - 关于你的用户

- **Name:** {user_name}
- **Timezone:** {timezone}
- **Notes:** {notes}
```

#### 方案 C：Hermes agent 补全缺失文件

在 `create_employee()` 的 Hermes 分支中，补充写入目前缺失的文件：

| 文件 | 内容 | 写入时机 |
|------|------|----------|
| `IDENTITY.md` | 员工姓名、描述 | 创建员工时 |
| `memories/USER.md` | 用户信息（引导阶段填写的） | 创建员工时 + 引导完成时同步 |

---

### 12.3 实现计划

#### P1 — 创建员工时定制 OpenClaw workspace 文件

**文件**：`api/providers/openclaw_provider.py`

新增函数 `_write_openclaw_workspace_files(workspace, name, description, traits, capabilities)`，在 `create_openclaw_agent_on_gateway()` 的后台线程中调用（Gateway 创建完成后执行）。

覆盖写入：`SOUL.md`、`IDENTITY.md`。根据 capabilities 定制 `TOOLS.md`（如有 search/memory 能力则注明）。

**文件**：`api/employees.py`

无需改动，OpenClaw 创建逻辑已在后台线程中调用 `create_openclaw_agent_on_gateway`。

#### P2 — 引导阶段同步 USER.md

**文件**：`api/onboarding.py`

在 `complete_onboarding()` 中新增 `_sync_user_md()` 调用，遍历所有 openclaw 员工写入 USER.md。

引导阶段需要收集的用户信息字段：姓名（`user_name`）、时区（`timezone`）。这些字段目前引导流程中未收集，需要在前端引导步骤中增加。

#### P3 — Hermes agent 补全 IDENTITY.md

**文件**：`api/employees.py`

在 `_write_soul_md()` 调用之后，新增 `_write_identity_md()` 写入员工姓名和描述。

---

### 12.4 各文件定制策略汇总

| 文件 | Hermes 现状 | OpenClaw 现状 | 改进后（两者对齐） |
|------|------------|--------------|------------------|
| `SOUL.md` | ✅ 已定制（name/traits） | ⚠️ 通用模板 | ✅ 写入 name/description/traits |
| `IDENTITY.md` | ❌ 未生成 | ⚠️ 空白模板 | ✅ 写入 name/description |
| `USER.md` | ⚠️ 空文件 | ⚠️ 空白模板 | ✅ 引导完成时写入用户信息 |
| `TOOLS.md` | ❌ 不适用 | ⚠️ 通用模板 | 🔲 可选：根据 capabilities 定制 |
| `AGENTS.md` | ❌ 不适用 | ✅ 通用即可 | 保持通用 |
| `BOOTSTRAP.md` | ❌ 不适用 | ✅ 通用即可 | 保持通用 |
| `HEARTBEAT.md` | ❌ 不适用 | ✅ 空即可 | 保持空 |
