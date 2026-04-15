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
6. 停止 OpenClaw Gateway → 发送消息 → 显示连接错误提示
