# JDUI 多 Agent 架构详细设计

## 1. 架构总览

JDUI 实现了可插拔的多 Agent 架构，通过 `IAgentProvider` 抽象层支持多种 Agent 后端（Hermes、OpenClaw 及未来扩展），通过 `AgentManager` 统一管理，每个数字员工可绑定不同的 Agent Provider。

```
┌─────────────────────────────────────────────────────────────────────┐
│                          JDUI WebUI                                  │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │ 浏览器    │───→│ routes.py│───→│streaming │───→│  Agent   │       │
│  │ (前端JS)  │←──│ (路由)    │←──│  .py     │←──│  Manager │       │
│  └──────────┘    └──────────┘    └──────────┘    └─────┬────┘       │
│       ↑ SSE                                            │             │
│       │                                     ┌──────────┴──────────┐  │
│       │                                     │   IAgentProvider    │  │
│       │                                     └──────────┬──────────┘  │
│       │                              ┌─────────────────┼────────────┐│
│       │                              ▼                 ▼            ▼│
│       │                     ┌──────────────┐  ┌──────────────┐  ┌───┤
│       │                     │   Hermes     │  │   OpenClaw   │  │...│
│       │                     │   Provider   │  │   Provider   │  │   │
│       │                     └──────┬───────┘  └──────┬───────┘  └───┤
└───────│────────────────────────────┼─────────────────┼──────────────┘
        │                            │                 │
        │                            ▼                 ▼
        │                   ┌──────────────┐  ┌──────────────┐
        │                   │ Hermes Agent │  │   OpenClaw   │
        │                   │ (Python 类库) │  │   Gateway    │
        │                   │              │  │  (WebSocket) │
        │                   └──────┬───────┘  └──────┬───────┘
        │                          │                 │
        │                          ▼                 ▼
        │                      LLM API           LLM API
        │                  (OpenAI/Anthropic)  (OpenAI/Anthropic)
        │
   token/tool/done 事件实时推送
```

## 2. 类层次结构

```
┌─────────────────────────────────────────────────────┐
│                  api/agent_provider.py                │
│                                                      │
│  AgentUsage (dataclass)                              │
│  ├── input_tokens: int                               │
│  ├── output_tokens: int                              │
│  ├── estimated_cost_usd: float                       │
│  ├── context_length: int                             │
│  ├── threshold_tokens: int                           │
│  ├── last_prompt_tokens: int                         │
│  └── compression_count: int                          │
│                                                      │
│  AgentResult (dataclass)                             │
│  ├── messages: List[Dict]                            │
│  ├── usage: AgentUsage                               │
│  ├── session_id_changed: bool                        │
│  └── new_session_id: Optional[str]                   │
│                                                      │
│  IAgent (ABC)                                        │
│  ├── run(user_msg, sys_msg, history, sid, personality)│
│  ├── interrupt(reason)                               │
│  └── get_usage() → AgentUsage                        │
│                                                      │
│  IAgentProvider (ABC)                                │
│  ├── get_provider_id() → str                         │
│  ├── is_available() → bool                           │
│  ├── get_supported_models() → List[Dict]             │
│  └── create_agent(...) → IAgent                      │
└─────────────────────────────────────────────────────┘
         ▲                          ▲
         │ implements               │ implements
┌────────┴──────────┐    ┌─────────┴──────────┐
│  HermesProvider   │    │  OpenClawProvider   │
│  ├── HermesAgent  │    │  ├── OpenClawAgent  │
│  │   └── wraps    │    │  │   └── wraps      │
│  │     AIAgent    │    │  │   OpenClawClient  │
│  │   (进程内调用)  │    │  │   (WebSocket)     │
│  └── raw_agent    │    │  └── asyncio.run()  │
│     属性暴露       │    │     异步桥接         │
└───────────────────┘    └────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  api/agent_manager.py                 │
│                                                      │
│  AgentManager (类方法单例)                             │
│  ├── _providers: Dict[str, IAgentProvider]            │
│  ├── _default_provider: str = 'hermes'               │
│  ├── register(provider)                              │
│  ├── get_provider(provider_id) → IAgentProvider      │
│  ├── set_default(provider_id)                        │
│  ├── list_providers() → List[Dict]                   │
│  ├── auto_discover()  ← server.py 启动时调用          │
│  └── _get_provider_interfaces(p) → List[Dict]        │
└─────────────────────────────────────────────────────┘
```

## 3. 数据流：用户发消息到 Agent 响应

### 3.1 完整时序图

```
浏览器                    routes.py              streaming.py            AgentManager         Provider/Agent
  │                          │                       │                       │                    │
  │ POST /api/chat/start     │                       │                       │                    │
  │─────────────────────────→│                       │                       │                    │
  │                          │ 解析 employee →        │                       │                    │
  │                          │ agent_provider_id      │                       │                    │
  │                          │                       │                       │                    │
  │                          │ 创建 Queue             │                       │                    │
  │                          │ 启动后台线程 ──────────→│                       │                    │
  │                          │                       │                       │                    │
  │ {stream_id}              │                       │ 获取 session 锁        │                    │
  │←─────────────────────────│                       │ 设置环境变量            │                    │
  │                          │                       │ 解析 model/key         │                    │
  │                          │                       │                       │                    │
  │ GET /api/chat/stream     │                       │ get_provider(id)       │                    │
  │─────────────────────────→│                       │──────────────────────→│                    │
  │                          │                       │                       │ create_agent()     │
  │  SSE 连接建立             │                       │                       │───────────────────→│
  │                          │                       │                       │                    │
  │                          │                       │                       │  ← IAgent 实例     │
  │                          │                       │←──────────────────────│                    │
  │                          │                       │                       │                    │
  │                          │                       │ _iagent.run() 或       │                    │
  │                          │                       │ agent.run_conversation()                   │
  │                          │                       │───────────────────────────────────────────→│
  │                          │                       │                       │                    │
  │                          │                       │  on_token("Hi")       │                    │
  │  event: token            │                       │←──────────────── callback ────────────────│
  │←─────────────────────────│←──────────────────────│                       │                    │
  │                          │                       │  on_tool("search",...)│                    │
  │  event: tool             │                       │←──────────────── callback ────────────────│
  │←─────────────────────────│←──────────────────────│                       │                    │
  │                          │                       │                       │                    │
  │                          │                       │  ← AgentResult        │                    │
  │                          │                       │←──────────────────────────────────────────│
  │                          │                       │                       │                    │
  │                          │                       │ 保存 session           │                    │
  │                          │                       │ 提取 usage             │                    │
  │  event: done             │                       │                       │                    │
  │←─────────────────────────│←──────────────────────│                       │                    │
  │                          │                       │ 释放锁、清理           │                    │
```

### 3.2 Hermes 路径 vs OpenClaw 路径

```
streaming.py::_run_agent_streaming()
    │
    ├─ 公共部分：解析 model/provider/api_key、加载 config、创建 agent
    │
    ├─ _is_hermes = hasattr(_iagent, 'raw_agent')
    │
    ├─ if _is_hermes:  ──────────────────────────────────────────────┐
    │   │  agent = _iagent.raw_agent  (AIAgent 实例)                  │
    │   │  设置 ephemeral_system_prompt (性格)                        │
    │   │  agent.run_conversation(msg, sys, history, task_id)        │
    │   │  检测 session_id 轮转 (上下文压缩)                          │
    │   │  提取 tool_calls (Anthropic/OpenAI 格式)                   │
    │   │  提取 usage (agent 属性)                                    │
    │   │  自动生成标题                                               │
    │   │  同步到 state.db (insights)                                 │
    │   └─ put('done', {session+messages, usage})                    │
    │                                                                │
    └─ if not _is_hermes:  ──────────────────────────────────────────┤
        │  _iagent.run(msg, sys, history, sid, personality)          │
        │  → OpenClawAgent.run()                                     │
        │    → asyncio.run(_execute())                               │
        │      → OpenClawClient.connect()                            │
        │      → agent.execute_stream()                              │
        │      → 解析 AGENT/CONTENT/TOOL_CALL/DONE/ERROR 事件        │
        │      → on_token()/on_tool() 回调                           │
        │  s.messages = result.messages                              │
        │  提取 usage (AgentResult.usage)                            │
        │  保存 session                                              │
        └─ put('done', {session+messages, usage})                    │
                                                                     │
    ← 两条路径最终都发送 done 事件到 SSE 队列 ──────────────────────────┘
```

## 4. 员工 → Provider → Agent 映射

### 4.1 映射关系

```
Employee (employees.json)
    │
    ├── agent_provider: 'hermes'
    │       │
    │       ├── profile_name: 'emp-abc123'
    │       │       │
    │       │       └── ~/.hermes/profiles/emp-abc123/
    │       │           ├── SOUL.md      ← 从 employee.description + traits 生成
    │       │           ├── config.yaml  ← 从 employee.capabilities 映射 toolsets
    │       │           ├── .env         ← 克隆自 default profile
    │       │           ├── memories/    ← 独立记忆
    │       │           └── skills/      ← 独立技能
    │       │
    │       └── activate → switch_profile('emp-abc123')
    │                      → 切换 HERMES_HOME 环境变量
    │
    └── agent_provider: 'openclaw'
            │
            ├── profile_name: 'emp-def456' (仅用于 session 标记，不创建 Hermes Profile)
            │
            └── activate → 返回 {active: 'emp-def456', agent_provider: 'openclaw'}
                           → 不切换 Hermes Profile
                           → 创建新 session 标记 employee_id
```

### 4.2 Provider 路由解析

```python
# 聊天启动时的 provider 解析链

1. 从 session.profile 匹配员工
   for emp in employees:
       if emp.profile_name == session.profile:
           agent_provider_id = emp.agent_provider  # 'hermes' 或 'openclaw'

2. 回退：从 session.employee_id 匹配
   for emp in employees:
       if emp.id == session.employee_id:
           agent_provider_id = emp.agent_provider

3. 最终回退：默认 provider
   agent_provider_id = agent_provider_id or AgentManager._default_provider  # 'hermes'
```

## 5. 线程模型

```
┌─────────────────────────────────────────────────────────────┐
│                    主线程 (HTTP Server)                       │
│  ThreadingHTTPServer.serve_forever()                         │
│  ├── 请求线程 A: POST /api/chat/start → 创建 Queue + 启动线程 │
│  ├── 请求线程 B: GET /api/chat/stream → 读 Queue 写 SSE      │
│  └── 请求线程 C: 其他 REST 请求                               │
└─────────────────────────────────────────────────────────────┘
        │
        │ 启动
        ▼
┌─────────────────────────────────────────────────────────────┐
│              Agent 后台线程 (每个聊天一个)                     │
│                                                              │
│  ┌─ 获取 _agent_lock[session_id] (同一会话串行)               │
│  │                                                           │
│  ├─ Hermes 路径:                                             │
│  │   _set_thread_env(HERMES_HOME=...)  ← 线程局部            │
│  │   with _ENV_LOCK:                   ← 全局锁              │
│  │       os.environ[...] = ...         ← 进程级 fallback     │
│  │   agent.run_conversation()          ← 阻塞直到完成         │
│  │                                                           │
│  ├─ OpenClaw 路径:                                           │
│  │   asyncio.run(_execute())           ← 异步桥接到同步线程    │
│  │     await OpenClawClient.connect()  ← WebSocket 连接      │
│  │     async for event in stream:      ← 异步迭代事件         │
│  │       on_token(delta)               ← 回调写入 Queue       │
│  │                                                           │
│  └─ Queue.put(('done', {...}))         ← 通知 SSE 线程结束    │
└─────────────────────────────────────────────────────────────┘

锁机制:
  _agent_lock[session_id]  → 同一会话不能并发运行
  _ENV_LOCK                → os.environ 写入串行化
  STREAMS_LOCK             → STREAMS/CANCEL_FLAGS/AGENT_INSTANCES 字典保护
```

## 6. 配置解析链

### 6.1 Hermes Agent 配置

```
请求参数 model
    │
    ▼
resolve_model_provider(model)
    │ 解析格式: bare / provider/model / @provider:model / 自定义 provider
    │
    ▼
resolve_runtime_provider(requested=provider)
    │ 从 hermes_cli 获取 api_key, base_url
    │
    ▼
get_config()  ← 读取当前 profile 的 config.yaml
    ├── platform_toolsets.cli → 工具集列表
    ├── fallback_model → 限流备用模型
    └── agent.personalities[name] → 性格 prompt
```

### 6.2 OpenClaw 配置

```
环境变量 (最高优先级)
    OPENCLAW_GATEWAY_URL
    OPENCLAW_API_KEY
        │
        ▼ (未设置时)
settings.json
    openclaw_gateway_url
    openclaw_api_key
        │
        ▼ (未设置时)
默认值
    gateway_url = 'ws://127.0.0.1:18789'
    api_key = ''
```

## 7. 错误处理分层

```
┌─ 第 1 层: Provider 注册 ─────────────────────────────────────┐
│  AgentManager.auto_discover()                                 │
│  try: register(HermesProvider())                              │
│  except: print warning, 继续 (provider 不可用但不影响其他)      │
└───────────────────────────────────────────────────────────────┘
        │
┌─ 第 2 层: Agent 创建 ────────────────────────────────────────┐
│  AgentManager.get_provider(id)                                │
│  if id not in _providers: raise ValueError                    │
│  → streaming.py 捕获 → put('error', {message})               │
└───────────────────────────────────────────────────────────────┘
        │
┌─ 第 3 层: Agent 执行 ────────────────────────────────────────┐
│  Hermes: agent.run_conversation() 异常                        │
│  OpenClaw: asyncio.run() 内部异常 / EventType.ERROR           │
│  → streaming.py outer try/except 捕获                         │
│  → 检测错误类型:                                               │
│    ├── rate_limit → put('apperror', {type:'rate_limit'})      │
│    ├── auth_error → put('apperror', {type:'auth_mismatch'})   │
│    └── 其他      → put('error', {message})                    │
└───────────────────────────────────────────────────────────────┘
        │
┌─ 第 4 层: HTTP 层 ───────────────────────────────────────────┐
│  server.py Handler.do_GET/do_POST                             │
│  try: handle_get/handle_post(...)                             │
│  except: → 500 Internal Server Error                          │
└───────────────────────────────────────────────────────────────┘
        │
┌─ 第 5 层: 前端 ──────────────────────────────────────────────┐
│  messages.js SSE event listeners                              │
│  'error'    → 显示错误消息，尝试重连                            │
│  'apperror' → 显示限流/认证错误卡片                             │
│  网络断开    → 重连逻辑 (1 次重试)                              │
└───────────────────────────────────────────────────────────────┘
```

## 8. 启动序列

```
server.py main()
    │
    ├── 1. print_startup_config()
    ├── 2. fix_credential_permissions()  ← chmod 600 敏感文件
    ├── 3. verify_hermes_imports()
    │       └── auto_install_agent_deps() if needed
    │
    ├── 4. 创建目录: STATE_DIR, SESSION_DIR, DEFAULT_WORKSPACE
    │
    ├── 5. AgentManager.auto_discover()  ← 注册所有可用 Provider
    │       ├── try: register(HermesProvider())
    │       │   → [agent-manager] registered provider: hermes (available=True)
    │       └── try: register(OpenClawProvider())
    │           → [agent-manager] registered provider: openclaw (available=True/False)
    │
    ├── 6. start_watcher()  ← Gateway 会话监听
    ├── 7. ThreadingHTTPServer((HOST, PORT), Handler)
    ├── 8. TLS 配置 (可选)
    └── 9. httpd.serve_forever()
```

## 9. 会话生命周期

```
┌─ 创建 ──────────────────────────────────────────────────────┐
│  用户点击员工头像                                             │
│  → POST /api/employee/activate                               │
│    ├── Hermes: switch_profile('emp-xxx')                     │
│    └── OpenClaw: 返回 {active, agent_provider}               │
│  → _newSessionForEmployee(empId)                             │
│    → POST /api/session/new {employee_id: empId}              │
│      → session.profile = employee.profile_name               │
│      → session.save()                                        │
└──────────────────────────────────────────────────────────────┘
        │
┌─ 对话 ──────────────────────────────────────────────────────┐
│  用户发送消息                                                 │
│  → POST /api/chat/start                                      │
│    → 解析 agent_provider_id (从 session.profile 匹配员工)     │
│    → 启动 _run_agent_streaming 线程                           │
│      → AgentManager.get_provider(agent_provider_id)          │
│      → provider.create_agent(...)                            │
│      → agent.run() 或 agent.run_conversation()               │
│      → SSE 事件: token → tool → done                         │
│  → session.messages 更新                                     │
│  → session.save()                                            │
└──────────────────────────────────────────────────────────────┘
        │
┌─ 持久化 ────────────────────────────────────────────────────┐
│  ~/.hermes/webui/sessions/{session_id}.json                  │
│  {                                                           │
│    session_id, profile, messages, model,                     │
│    input_tokens, output_tokens, estimated_cost,              │
│    created_at, updated_at, title, ...                        │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
        │
┌─ 恢复 ──────────────────────────────────────────────────────┐
│  页面刷新 → localStorage 读取 session_id                      │
│  → loadSession(saved_id)                                     │
│  → GET /api/session?session_id=xxx                           │
│  → 恢复 S.session, S.messages                                │
│  → renderMessages()                                          │
└──────────────────────────────────────────────────────────────┘
```

## 10. 设计模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| Provider 模式 | `IAgentProvider` | 可插拔的 Agent 后端，运行时选择 |
| 适配器模式 | `HermesAgent` / `OpenClawAgent` | 将不同 Agent SDK 适配到统一 `IAgent` 接口 |
| 工厂模式 | `IAgentProvider.create_agent()` | 创建 Agent 实例，注入回调 |
| 观察者模式 | `on_token` / `on_tool` 回调 | Agent 事件实时通知到 SSE 流 |
| 单例模式 | `AgentManager` | 全局 Provider 注册表 |
| 策略模式 | `_is_hermes` 分支 | Hermes 走完整路径，其他走标准接口 |

## 11. 文件索引

| 文件 | 职责 |
|------|------|
| `api/agent_provider.py` | 接口定义：IAgentProvider、IAgent、AgentResult、AgentUsage |
| `api/agent_manager.py` | AgentManager：注册、发现、获取、列表 |
| `api/providers/__init__.py` | providers 包 |
| `api/providers/hermes_provider.py` | HermesProvider + HermesAgent：封装 AIAgent |
| `api/providers/openclaw_provider.py` | OpenClawProvider + OpenClawAgent：封装 openclaw-sdk |
| `api/streaming.py` | SSE 流引擎：线程管理、Provider 分支、事件队列 |
| `api/routes.py` | HTTP 路由：/api/chat/start 的 provider 解析、/api/agent/* |
| `api/employees.py` | 员工 CRUD：按 agent_provider 区分 Profile 操作 |
| `api/config.py` | 配置：模型解析、OpenClaw 设置字段、全局状态 |
| `api/models.py` | Session 模型：持久化、profile/employee_id 字段 |
| `api/profiles.py` | Hermes Profile：创建、切换、删除 |
| `server.py` | 入口：启动时 AgentManager.auto_discover() |
| `static/employee.js` | 前端：_activateEmployee、_newSessionForEmployee |
| `static/messages.js` | 前端：send()、SSE 事件处理 |
| `static/panels.js` | 前端：员工面板、Provider 选择、OpenClaw 配置 |
| `static/sessions.js` | 前端：会话列表按员工过滤 |

## 12. 扩展新 Provider 的步骤

添加一个新的 Agent Provider（如 `MyAgent`）只需：

```
1. 创建 api/providers/myagent_provider.py
   - class MyAgentProvider(IAgentProvider)
   - class MyAgent(IAgent)

2. 在 api/agent_manager.py auto_discover() 中添加:
   try:
       from api.providers.myagent_provider import MyAgentProvider
       if 'myagent' not in cls._providers:
           cls.register(MyAgentProvider())
   except Exception: pass

3. 如需配置字段，在 api/config.py _SETTINGS_DEFAULTS 中添加:
   "myagent_url": "",
   "myagent_api_key": "",

4. 重启服务 → GET /api/agent/providers 自动显示新 provider
5. 创建员工时选择 "MyAgent" → 聊天自动路由
```

无需修改 streaming.py、routes.py、前端代码。
