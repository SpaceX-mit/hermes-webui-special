# 数字员工与Agent平台对应关系分析

## 概述

JDUI系统实现了一个灵活的多Agent架构，允许每个数字员工绑定不同的Agent后端（Hermes、OpenClaw等）。本文档详细分析数字员工、Agent平台、Profile和Session之间的对应关系。

## 1. 核心概念

### 1.1 数字员工 (Employee)

数字员工是JDUI前端创建的虚拟助手实体，代表一个具体的工作角色。

**关键属性：**
```json
{
  "id": "emp-0994fd601c52",           // 唯一标识符
  "name": "AI助手",                   // 显示名称
  "profile_name": "emp-0994fd601c52", // 关联的Hermes Profile名称
  "agent_provider": "hermes",         // Agent后端类型: 'hermes' 或 'openclaw'
  "description": "全能型数字员工",     // 员工描述
  "avatar_index": 0,                  // 头像索引
  "capabilities": [...],              // 能力配置
  "personality": "analyst"            // 性格/角色类型
}
```

### 1.2 Agent平台 (Agent Provider)

Agent平台是实际执行对话的后端系统，通过`IAgentProvider`接口抽象。

**支持的平台：**
- **Hermes**: 本地Python框架，进程内调用
- **OpenClaw**: 远程网关，WebSocket通信
- **未来扩展**: 其他LLM服务

### 1.3 Profile (Hermes概念)

Profile是Hermes框架中的配置单元，包含：
- 工具集配置 (toolsets)
- 性格提示词 (personalities)
- 环境变量 (.env)
- 记忆库 (memories/)
- 技能库 (skills/)

**路径：** `~/.hermes/profiles/{profile_name}/`

### 1.4 Session (会话)

用户与员工的对话会话，持久化存储。

**路径：** `~/.hermes/webui/sessions/{session_id}.json`

## 2. 对应关系矩阵

```
┌─────────────────────────────────────────────────────────────┐
│                    数字员工 (Employee)                        │
│                                                              │
│  属性: id, name, profile_name, agent_provider, ...          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  agent_provider  │        │  profile_name    │
│  = 'hermes'      │        │  = 'emp-xxx'     │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │                           ▼
         │                  ~/.hermes/profiles/emp-xxx/
         │                  ├── SOUL.md
         │                  ├── config.yaml
         │                  ├── .env
         │                  ├── memories/
         │                  └── skills/
         │
         ▼
    HermesProvider
         │
         ├─ get_provider_id() → 'hermes'
         ├─ is_available() → True/False
         ├─ get_supported_models() → [...]
         └─ create_agent() → HermesAgent
              │
              └─ wraps AIAgent (Hermes库)
                   │
                   └─ agent.run_conversation()
                        │
                        ▼
                   LLM API (OpenAI/Anthropic)


┌──────────────────────────────────────────────────────────────┐
│  agent_provider = 'openclaw'                                 │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
    OpenClawProvider
         │
         ├─ get_provider_id() → 'openclaw'
         ├─ is_available() → True/False (检查SDK)
         ├─ get_supported_models() → [...]
         └─ create_agent() → OpenClawAgent
              │
              └─ wraps OpenClawClient (SDK)
                   │
                   └─ asyncio.run(agent.execute_stream())
                        │
                        ▼
                   OpenClaw Gateway (WebSocket)
                        │
                        ▼
                   LLM API (OpenAI/Anthropic)
```

## 3. 数据流：从员工激活到聊天

### 3.1 员工激活流程

```
用户点击员工头像
  │
  ▼
POST /api/employee/activate {id: 'emp-xxx'}
  │
  ├─ 查找员工: emp = EMPLOYEE.employees.find(e => e.id === 'emp-xxx')
  │
  ├─ 如果 emp.agent_provider === 'hermes':
  │   │
  │   ├─ switch_profile(emp.profile_name)
  │   │   └─ 设置 HERMES_HOME 环境变量
  │   │   └─ 切换 ~/.hermes/profiles/emp-xxx/
  │   │
  │   └─ 返回 {active: 'emp-xxx', agent_provider: 'hermes'}
  │
  └─ 如果 emp.agent_provider === 'openclaw':
      │
      ├─ 不切换 Profile (OpenClaw不需要)
      │
      └─ 返回 {active: 'emp-xxx', agent_provider: 'openclaw'}
  │
  ▼
前端更新:
  - EMPLOYEE.active = 'emp-xxx'
  - S.activeProfile = emp.profile_name (Hermes) 或 'emp-xxx' (OpenClaw)
  - 创建新会话: POST /api/session/new {employee_id: 'emp-xxx'}
```

### 3.2 聊天启动流程

```
用户发送消息
  │
  ▼
POST /api/chat/start {session_id, message, model, ...}
  │
  ▼
streaming.py::_run_agent_streaming()
  │
  ├─ 1. 解析 agent_provider_id:
  │   │
  │   ├─ 从 session.profile 匹配员工
  │   │   for emp in employees:
  │   │       if emp.profile_name === session.profile:
  │   │           agent_provider_id = emp.agent_provider
  │   │
  │   ├─ 回退: 从 session.employee_id 匹配
  │   │
  │   └─ 最终回退: 使用默认 provider ('hermes')
  │
  ├─ 2. 获取 Provider:
  │   │
  │   └─ provider = AgentManager.get_provider(agent_provider_id)
  │
  ├─ 3. 创建 Agent:
  │   │
  │   └─ agent = provider.create_agent(model, api_key, ...)
  │
  ├─ 4. 执行聊天:
  │   │
  │   ├─ 如果 agent 是 HermesAgent:
  │   │   │
  │   │   ├─ 设置 ephemeral_system_prompt (性格)
  │   │   ├─ agent.raw_agent.run_conversation(msg, sys, history, task_id)
  │   │   ├─ 检测 session_id 轮转 (上下文压缩)
  │   │   ├─ 提取 tool_calls
  │   │   └─ 提取 usage
  │   │
  │   └─ 如果 agent 是 OpenClawAgent:
  │       │
  │       ├─ agent.run(msg, sys, history, sid, personality)
  │       ├─ asyncio.run(_execute())
  │       ├─ 解析 AGENT/CONTENT/TOOL_CALL/DONE/ERROR 事件
  │       └─ 提取 usage
  │
  ├─ 5. 保存会话:
  │   │
  │   └─ session.messages 更新
  │   └─ session.save()
  │
  └─ 6. SSE 事件流:
      │
      ├─ event: token → 流式输出
      ├─ event: tool → 工具调用
      └─ event: done → 完成
```

## 4. Provider 路由解析详解

### 4.1 会话中的 Provider 识别

当用户恢复一个旧会话时，系统需要确定该会话应该使用哪个Provider：

```python
# 聊天启动时的 provider 解析链

def resolve_agent_provider(session):
    # 1. 从 session.profile 匹配员工
    for emp in employees:
        if emp.profile_name == session.profile:
            return emp.agent_provider  # 'hermes' 或 'openclaw'
    
    # 2. 回退: 从 session.employee_id 匹配
    for emp in employees:
        if emp.id == session.employee_id:
            return emp.agent_provider
    
    # 3. 最终回退: 使用默认 provider
    return AgentManager._default_provider  # 'hermes'
```

### 4.2 Hermes vs OpenClaw 执行路径

| 维度 | Hermes | OpenClaw |
|------|--------|----------|
| **Agent类** | HermesAgent | OpenClawAgent |
| **底层SDK** | Hermes AIAgent (Python库) | openclaw-sdk (PyPI包) |
| **通信方式** | 进程内调用 | WebSocket + HTTP |
| **Profile管理** | 创建独立Profile | 仅用于会话标记 |
| **配置来源** | Hermes config.yaml | 环境变量/settings.json |
| **执行方式** | agent.run_conversation() | asyncio.run(agent.execute_stream()) |
| **线程模型** | 同步阻塞 | 异步桥接到同步线程 |
| **Session轮转** | 支持 (上下文压缩) | 不支持 |
| **Tool调用** | Anthropic/OpenAI格式 | OpenClaw事件格式 |

## 5. 配置优先级

### 5.1 Hermes Agent 配置

```
请求参数 model
    ↓
resolve_model_provider(model)
    ↓
resolve_runtime_provider(requested=provider)
    ├─ 从 hermes_cli 获取 api_key, base_url
    │
    ▼
get_config()  ← 读取当前 profile 的 config.yaml
    ├── platform_toolsets.cli → 工具集列表
    ├── fallback_model → 限流备用模型
    └── agent.personalities[name] → 性格 prompt
```

### 5.2 OpenClaw 配置

```
环境变量 (最高优先级)
    OPENCLAW_GATEWAY_URL
    OPENCLAW_API_KEY
        ↓ (未设置时)
settings.json 中的字段
    openclaw_gateway_url
    openclaw_api_key
        ↓ (未设置时)
默认值
    gateway_url = 'ws://127.0.0.1:18789'
    api_key = ''
```

## 6. 会话生命周期

### 6.1 会话创建

```json
POST /api/session/new {employee_id: 'emp-xxx', model: 'claude-3-sonnet', workspace: '/path'}

响应:
{
  "session": {
    "session_id": "sess-abc123",
    "profile": "emp-xxx",           // 从 employee.profile_name 复制
    "employee_id": "emp-xxx",       // 员工ID
    "model": "claude-3-sonnet",
    "messages": [],
    "created_at": "2026-04-16T...",
    "updated_at": "2026-04-16T...",
    "title": "Untitled"
  }
}
```

### 6.2 会话恢复

```
页面刷新 → localStorage 读取 session_id
  ↓
GET /api/session?session_id=sess-abc123
  ↓
解析 session.profile 或 session.employee_id
  ↓
resolve_agent_provider(session)
  ↓
恢复 S.session, S.messages
  ↓
renderMessages()
```

### 6.3 会话持久化

```
~/.hermes/webui/sessions/{session_id}.json

{
  "session_id": "sess-abc123",
  "profile": "emp-xxx",
  "employee_id": "emp-xxx",
  "model": "claude-3-sonnet",
  "messages": [...],
  "input_tokens": 1000,
  "output_tokens": 500,
  "estimated_cost": 0.05,
  "created_at": "2026-04-16T...",
  "updated_at": "2026-04-16T...",
  "title": "会话标题",
  "archived": false
}
```

## 7. 前端状态管理

### 7.1 全局状态对象 (S)

```javascript
const S = {
  session: null,              // 当前会话对象
  messages: [],               // 消息列表
  activeProfile: 'default',   // 当前Profile名称 (Hermes)
  // ... 其他字段
};
```

### 7.2 员工状态对象 (EMPLOYEE)

```javascript
const EMPLOYEE = {
  employees: [],              // 所有员工列表
  active: null,               // 当前活跃员工ID
  avatars: [...],             // 头像URL列表
  personalities: [...],       // 性格定义
  defaultCapabilities: [...]  // 默认能力
};
```

### 7.3 状态同步流程

```
用户激活员工
  ↓
_activateEmployee(id)
  ├─ POST /api/employee/activate {id}
  ├─ EMPLOYEE.active = id
  ├─ S.activeProfile = data.active (从服务器返回)
  ├─ _newSessionForEmployee(id)
  └─ syncTopbar()
      └─ 更新 profileChipLabel 显示员工名字
```

## 8. 错误处理与回退

### 8.1 Provider 不可用

```
AgentManager.auto_discover()
  │
  ├─ try: register(HermesProvider())
  │   └─ 成功 → [agent-manager] registered provider: hermes
  │
  └─ try: register(OpenClawProvider())
      ├─ openclaw-sdk 未安装 → is_available() = False
      └─ 显示"不可用"，创建员工时不可选
```

### 8.2 聊天执行错误

```
streaming.py::_run_agent_streaming()
  │
  ├─ Provider 不存在 → ValueError → SSE error 事件
  ├─ Gateway 不可达 → ConnectionError → SSE error 事件
  ├─ Bearer Token 无效 → 401 → SSE apperror 事件 (auth_mismatch)
  ├─ 模型不存在 → Gateway 错误 → SSE error 事件
  └─ 流式中断 → interrupt() 设置标志 → break 循环
```

## 9. 扩展新 Provider 的步骤

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

## 10. 关键文件索引

| 文件 | 职责 |
|------|------|
| `api/agent_provider.py` | 接口定义：IAgentProvider、IAgent、AgentResult、AgentUsage |
| `api/agent_manager.py` | AgentManager：注册、发现、获取、列表 |
| `api/providers/hermes_provider.py` | HermesProvider + HermesAgent |
| `api/providers/openclaw_provider.py` | OpenClawProvider + OpenClawAgent |
| `api/streaming.py` | SSE 流引擎：线程管理、Provider 分支、事件队列 |
| `api/routes.py` | HTTP 路由：/api/chat/start 的 provider 解析 |
| `api/employees.py` | 员工 CRUD：按 agent_provider 区分 Profile 操作 |
| `api/models.py` | Session 模型：持久化、profile/employee_id 字段 |
| `api/profiles.py` | Hermes Profile：创建、切换、删除 |
| `server.py` | 入口：启动时 AgentManager.auto_discover() |
| `static/employee.js` | 前端：_activateEmployee、_newSessionForEmployee |
| `static/ui.js` | 前端：syncTopbar、profileChipLabel 更新 |
| `static/messages.js` | 前端：send()、SSE 事件处理 |
| `static/panels.js` | 前端：员工面板、Provider 选择 |
| `static/sessions.js` | 前端：会话列表按员工过滤 |

## 11. 常见场景

### 场景1：用户切换员工

```
1. 点击员工头像
2. _activateEmployee(emp_id)
3. POST /api/employee/activate
4. 如果是Hermes: switch_profile()
5. 创建新会话
6. 聊天自动使用该员工的Provider
```

### 场景2：用户恢复旧会话

```
1. 页面刷新
2. localStorage 读取 session_id
3. GET /api/session?session_id=xxx
4. 解析 session.profile 或 employee_id
5. resolve_agent_provider() 确定Provider
6. 恢复消息列表
7. 下一条消息使用该Provider
```

### 场景3：添加新员工

```
1. 点击"创建员工"
2. 选择 Agent 平台 (Hermes/OpenClaw)
3. 填写员工信息
4. POST /api/employee/create
5. 如果是Hermes: 创建新Profile
6. 如果是OpenClaw: 仅保存配置
7. 员工列表更新
```

### 场景4：切换Provider配置

```
1. Settings > Agents 标签页
2. 修改 OpenClaw Gateway URL / API Key
3. 保存到 settings.json
4. 下次创建员工或聊天时使用新配置
```

## 12. 设计模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| Provider 模式 | `IAgentProvider` | 可插拔的 Agent 后端 |
| 适配器模式 | `HermesAgent` / `OpenClawAgent` | 统一接口 |
| 工厂模式 | `IAgentProvider.create_agent()` | 创建 Agent 实例 |
| 观察者模式 | `on_token` / `on_tool` 回调 | 事件通知 |
| 单例模式 | `AgentManager` | 全局 Provider 注册表 |
| 策略模式 | `_is_hermes` 分支 | 不同执行路径 |

## 总结

JDUI 的多 Agent 架构通过以下关键设计实现灵活性：

1. **抽象层** - `IAgentProvider` 接口隐藏具体实现
2. **动态路由** - 根据员工配置自动选择 Provider
3. **独立配置** - 每个员工可有不同的 Profile 和 Provider
4. **会话持久化** - 支持会话恢复和跨 Provider 迁移
5. **可扩展性** - 新 Provider 无需修改核心代码

这使得系统可以轻松支持多种 LLM 后端，同时保持用户体验的一致性。
