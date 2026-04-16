# OpenClaw 数字员工与会话完整流程

## 概述

本文档详细梳理 OpenClaw 对接的完整流程，包括：
1. 创建数字员工流程
2. 激活员工流程
3. 创建会话流程
4. 发送消息/对话流程
5. 会话持久化流程
6. 跟踪对话使用的 agent

## 1. 创建数字员工流程

### 1.1 前端创建表单

```
用户点击"创建员工"
  ↓
前端显示创建表单
  ├─ 名称 (name)
  ├─ 描述 (description)
  ├─ 头像 (avatar_index)
  ├─ 性格特质 (traits)
  ├─ 能力配置 (capabilities)
  └─ Agent 平台 (agent_provider)
      ├─ Hermes
      └─ OpenClaw  ← 用户选择 OpenClaw
```

### 1.2 前端获取 Provider 列表

```javascript
// static/panels.js:1875
const data = await api('/api/agent/providers');
// 返回:
{
  "providers": [
    {
      "id": "hermes",
      "available": true,
      "is_default": true,
      "models": [...]
    },
    {
      "id": "openclaw",
      "available": true,
      "is_default": false,
      "models": [
        {"id": "agent-001", "label": "Agent 001"},
        {"id": "agent-002", "label": "Agent 002"},
        ...
      ]
    }
  ]
}
```

**关键点：** 
- `/api/agent/providers` 调用 `OpenClawProvider.get_supported_models()`
- 该方法连接到 OpenClaw Gateway 并调用 `client.list_agents()`
- 返回 Gateway 中所有可用的 agents

### 1.3 后端处理创建请求

```python
# api/routes.py:831
if parsed.path == "/api/employee/create":
    emp = create_employee(body)
    return j(handler, {"ok": True, "employee": emp})
```

### 1.4 创建员工对象

```python
# api/employees.py:140-173
def create_employee(body):
    emp_id = uuid.uuid4().hex[:12]  # 生成 12 位 ID
    profile_name = f'emp-{emp_id}'
    
    emp = {
        'id': emp_id,
        'name': body.get('name'),
        'avatar_index': body.get('avatar_index', 0),
        'description': body.get('description'),
        'traits': body.get('traits', []),
        'capabilities': body.get('capabilities', {}),
        'profile_name': profile_name,
        'agent_provider': body.get('agent_provider'),  # 'openclaw'
        'created_at': time.time(),
    }
    
    # 关键分支：只为 Hermes 创建 Profile
    if emp['agent_provider'] == 'hermes':
        # 创建 Hermes Profile
        create_profile_api(profile_name, clone_from='default', clone_config=True)
        _write_soul_md(profile_name, _generate_soul_md(name, description, traits))
        _update_profile_toolsets(profile_name, capabilities)
    else:
        # OpenClaw: 不创建 Profile，仅保存配置
        pass
    
    data['employees'].append(emp)
    _save_employees(data)
    return emp
```

**问题：** 系统没有保存用户选择的具体 agent ID！

### 1.5 员工对象结构

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "数据分析师",
  "avatar_index": 0,
  "description": "精通数据分析和可视化",
  "traits": ["逻辑严谨", "数据驱动"],
  "capabilities": {
    "search": true,
    "memory": true,
    "autoExec": false,
    "knowledge": true
  },
  "profile_name": "emp-a1b2c3d4e5f6",
  "agent_provider": "openclaw",
  "created_at": 1713254400.123,
  "model": null  ← ⚠️ 缺失！应该保存选择的 agent ID
}
```

## 2. 激活员工流程

### 2.1 前端激活员工

```javascript
// static/employee.js:132-152
async function _activateEmployee(id) {
  const res = await fetch('/api/employee/activate', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  EMPLOYEE.active = id;
  S.activeProfile = data.active;
  
  // 创建新会话
  await _newSessionForEmployee(id);
}
```

### 2.2 后端激活员工

```python
# api/routes.py:856-867
if parsed.path == "/api/employee/activate":
    result = activate_employee(emp_id)
    return j(handler, {"ok": True, "active": result.get("active", "")})
```

### 2.3 激活逻辑

```python
# api/employees.py:241-261
def activate_employee(emp_id):
    for emp in data['employees']:
        if emp['id'] == emp_id:
            provider = emp.get('agent_provider', 'hermes')
            profile_name = emp.get('profile_name', '')
            
            if provider == 'hermes':
                # Hermes: 切换 Profile
                return switch_profile(profile_name)
            else:
                # OpenClaw: 仅返回标记信息
                return {
                    'active': profile_name or f'emp-{emp_id}',
                    'agent_provider': provider,
                }
```

**关键点：**
- Hermes: 调用 `switch_profile()` 切换 HERMES_HOME 环境变量
- OpenClaw: 仅返回员工标记，不做任何环境变量切换

### 2.4 创建新会话

```javascript
// static/employee.js:154-169
async function _newSessionForEmployee(empId) {
  const model = $('modelSelect').value;  // 用户从下拉框选择的 model
  const data = await api('/api/session/new', {
    method: 'POST',
    body: JSON.stringify({ 
      model: model,
      workspace: ws, 
      employee_id: empId 
    }),
  });
  S.session = data.session;
}
```

**问题：** 前端从 `modelSelect` 获取 model，但这个值是临时的，不是员工配置的一部分！

## 3. 创建会话流程

### 3.1 后端创建会话

```python
# api/routes.py:597-613
if parsed.path == "/api/session/new":
    s = new_session(workspace=body.get("workspace"), model=body.get("model"))
    
    # 标记会话属于哪个员工
    _emp_id = body.get("employee_id", "").strip()
    if _emp_id:
        for _emp in list_employees().get('employees', []):
            if _emp.get('id') == _emp_id:
                s.profile = _emp.get('profile_name', s.profile)
                s.employee_id = _emp_id
                s.save()
                break
    
    return j(handler, {"session": s.compact() | {"messages": s.messages}})
```

### 3.2 会话对象结构

```python
# api/models.py:36-60
class Session:
    def __init__(self, session_id, title, workspace, model, ...):
        self.session_id = session_id          # 会话 ID
        self.title = title                    # 会话标题
        self.workspace = workspace            # 工作目录
        self.model = model                    # ← 当前使用的 model (agent ID)
        self.messages = []                    # 对话消息
        self.profile = profile                # ← 员工的 profile_name
        self.employee_id = employee_id        # ← 员工 ID
        self.created_at = created_at
        self.updated_at = updated_at
        self.personality = personality        # 性格提示词
```

**会话持久化：** `~/.hermes/webui/sessions/{session_id}.json`

```json
{
  "session_id": "abc123def456",
  "title": "数据分析讨论",
  "workspace": "/home/user/projects",
  "model": "agent-001",  ← 当前使用的 OpenClaw agent
  "profile": "emp-a1b2c3d4e5f6",  ← 员工的 profile_name
  "employee_id": "a1b2c3d4e5f6",  ← 员工 ID
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "created_at": 1713254400.123,
  "updated_at": 1713254500.456,
  "personality": "你是数据分析师..."
}
```

## 4. 发送消息/对话流程

### 4.1 前端发送消息

```javascript
// static/messages.js:62-66
const startData = await api('/api/chat/start', {
  method: 'POST',
  body: JSON.stringify({
    session_id: activeSid,
    message: msgText,
    model: S.session.model || $('modelSelect').value,  ← 使用会话中的 model
    workspace: S.session.workspace,
    attachments: uploaded.length ? uploaded : undefined
  })
});
```

### 4.2 后端处理消息

```python
# api/routes.py:1540-1588
def _handle_chat_start(handler, body):
    s = get_session(body["session_id"])
    msg = str(body.get("message", "")).strip()
    
    # 获取 model（优先使用请求中的，否则使用会话中的）
    model = body.get("model") or s.model
    s.model = model
    s.save()
    
    # 关键：解析 agent provider
    _agent_provider_id = None
    _all_emps = list_employees().get('employees', [])
    
    # 方式1：通过 profile_name 匹配
    if hasattr(s, 'profile') and s.profile:
        for _emp in _all_emps:
            if _emp.get('profile_name') == s.profile:
                _agent_provider_id = _emp.get('agent_provider')
                break
    
    # 方式2：通过 employee_id 匹配
    if not _agent_provider_id and hasattr(s, 'employee_id') and s.employee_id:
        for _emp in _all_emps:
            if _emp.get('id') == s.employee_id:
                _agent_provider_id = _emp.get('agent_provider')
                break
    
    # 启动流处理线程
    thr = threading.Thread(
        target=_run_agent_streaming,
        args=(s.session_id, msg, model, workspace, stream_id, attachments, _agent_provider_id),
        daemon=True,
    )
    thr.start()
    return j(handler, {"stream_id": stream_id, "session_id": s.session_id})
```

### 4.3 流处理引擎

```python
# api/streaming.py:82-240
def _run_agent_streaming(session_id, msg_text, model, workspace, stream_id, 
                        attachments=None, agent_provider_id=None):
    
    # 1. 解析 model 和 provider
    resolved_model, resolved_provider, resolved_base_url = resolve_model_provider(model)
    
    # 2. 获取 Provider
    _provider = AgentManager.get_provider(agent_provider_id)
    
    # 3. 创建 Agent
    _iagent = _provider.create_agent(
        model=resolved_model,  # ← 传入 model (agent ID)
        provider=resolved_provider,
        base_url=resolved_base_url,
        api_key=resolved_api_key,
        toolsets=_toolsets,
        fallback_model=_fallback_resolved,
        session_id=session_id,
        on_token=on_token,
        on_tool=on_tool,
    )
    
    # 4. 执行对话
    if hasattr(_iagent, 'raw_agent'):
        # Hermes 路径
        result = _iagent.raw_agent.run_conversation(...)
    else:
        # OpenClaw 路径
        agent_result = _iagent.run(...)
```

### 4.4 OpenClaw Agent 创建

```python
# api/providers/openclaw_provider.py:83-102
def create_agent(self, model, provider, base_url, api_key, toolsets, 
                fallback_model, session_id, on_token, on_tool):
    cfg = _get_openclaw_config()
    return OpenClawAgent(
        model=model,  # ← 保存为 self._model
        gateway_url=cfg['gateway_url'],
        gateway_key=cfg['api_key'],
        session_id=session_id,
        on_token=on_token,
        on_tool=on_tool,
    )
```

### 4.5 OpenClaw Agent 执行

```python
# api/providers/openclaw_provider.py:119-211
def run(self, user_message, system_message, conversation_history, 
        session_id, personality=None):
    
    full_message = user_message
    if personality:
        full_message = personality + '\n\n' + user_message
    
    async def _execute():
        from openclaw_sdk import OpenClawClient, EventType
        
        # 1. 连接到 Gateway
        client = await OpenClawClient.connect(
            gateway_ws_url=self._gateway_url,
            api_key=self._gateway_key or None,
        )
        
        try:
            # 2. 获取指定的 Agent
            agent = client.get_agent(self._model)  # ← 使用 self._model 获取 agent
            
            # 3. 执行流式对话
            stream = await agent.execute_stream(full_message)
            
            # 4. 处理事件流
            async for event in stream:
                if event.event_type == EventType.AGENT:
                    # 处理 Agent 输出
                    delta = event.data.get('payload', {}).get('data', {}).get('delta', '')
                    self._on_token(delta)
                
                elif event.event_type == EventType.TOOL_CALL:
                    # 处理工具调用
                    self._on_tool(name, preview, args)
                
                elif event.event_type == EventType.DONE:
                    # 提取 token 使用量
                    usage = event.data.get('payload', {}).get('tokenUsage', {})
                    break
        finally:
            await client.close()
    
    asyncio.run(_execute())
    return AgentResult(messages=messages, usage=self._usage)
```

## 5. 会话持久化流程

### 5.1 会话保存

```python
# api/models.py:66-72
def save(self) -> None:
    self.updated_at = time.time()
    self.path.write_text(
        json.dumps(self.__dict__, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    _write_session_index()
```

**保存位置：** `~/.hermes/webui/sessions/{session_id}.json`

### 5.2 会话恢复

```python
# api/models.py:74-82
@classmethod
def load(cls, sid):
    p = SESSION_DIR / f'{sid}.json'
    if not p.exists():
        return None
    return cls(**json.loads(p.read_text(encoding='utf-8')))
```

## 6. 跟踪对话使用的 Agent

### 6.1 当前问题

系统**无法准确跟踪**对话使用的是哪个 OpenClaw agent，原因：

1. **员工对象缺少 model 字段**
   ```json
   {
     "id": "emp-001",
     "agent_provider": "openclaw",
     "model": null  ← 缺失！
   }
   ```

2. **会话中的 model 是临时的**
   - 用户可以在发送消息时临时改变 model
   - 系统无法知道这是否符合员工的配置

3. **无法验证 agent 存在性**
   - 创建员工时不验证 agent 是否存在
   - agent 被删除后，系统无法检测

### 6.2 跟踪链路

```
员工激活
  ↓
创建会话
  ├─ session.profile = emp.profile_name
  ├─ session.employee_id = emp.id
  └─ session.model = 用户选择的 model  ← 临时值
  ↓
发送消息
  ├─ 从 session.model 获取 model
  ├─ 从 employee_id 查找 agent_provider
  └─ 创建对应的 Agent
  ↓
执行对话
  └─ OpenClawAgent.run()
      └─ client.get_agent(self._model)  ← 使用 model 获取 agent
```

### 6.3 改进方案

**添加 model 字段到员工对象：**

```python
# api/employees.py:150-160
emp = {
    'id': emp_id,
    'name': name,
    'agent_provider': body.get('agent_provider'),
    'profile_name': profile_name,
    'model': body.get('model'),  # ← 新增：对于 OpenClaw 是 agent ID
    'description': description,
    'traits': traits,
    'capabilities': capabilities,
    'created_at': time.time(),
}
```

**前端创建员工时强制选择 model：**

```javascript
// 对于 OpenClaw 员工，必须选择具体的 agent
if (agent_provider === 'openclaw') {
    if (!selectedModel) {
        showToast('请选择 OpenClaw Agent');
        return;
    }
}
```

**激活员工时自动设置 model：**

```python
# api/employees.py:241-261
def activate_employee(emp_id):
    for emp in data['employees']:
        if emp['id'] == emp_id:
            provider = emp.get('agent_provider', 'hermes')
            
            if provider == 'openclaw':
                # 返回员工配置的 model
                return {
                    'active': emp.get('profile_name'),
                    'agent_provider': provider,
                    'model': emp.get('model'),  # ← 返回员工的 agent ID
                }
```

## 7. 完整流程图

```
┌─ 创建数字员工 ────────────────────────────────────────┐
│                                                       │
│  前端选择 agent_provider = 'openclaw'                 │
│  ↓                                                   │
│  前端获取 /api/agent/providers                        │
│  ├─ OpenClawProvider.get_supported_models()          │
│  └─ 返回 Gateway 中的所有 agents                      │
│  ↓                                                   │
│  前端显示 agent 列表供用户选择                        │
│  ↓                                                   │
│  POST /api/employee/create                           │
│  {                                                   │
│    "name": "数据分析师",                              │
│    "agent_provider": "openclaw",                      │
│    "model": "agent-001"  ← 用户选择的 agent          │
│  }                                                   │
│  ↓                                                   │
│  后端创建员工对象并保存                               │
│                                                       │
└───────────────────────────────────────────────────────┘

┌─ 激活员工 ────────────────────────────────────────────┐
│                                                       │
│  前端: _activateEmployee(emp_id)                      │
│  ↓                                                   │
│  POST /api/employee/activate                         │
│  ↓                                                   │
│  后端: activate_employee(emp_id)                      │
│  ├─ 查找员工                                         │
│  ├─ 如果是 OpenClaw: 返回员工信息（不切换环境）      │
│  └─ 如果是 Hermes: 切换 Profile                      │
│  ↓                                                   │
│  前端: _newSessionForEmployee(emp_id)                │
│  ↓                                                   │
│  POST /api/session/new                               │
│  {                                                   │
│    "employee_id": "emp-001",                         │
│    "model": "agent-001"  ← 从 modelSelect 获取       │
│  }                                                   │
│  ↓                                                   │
│  后端创建会话并标记员工                               │
│                                                       │
└───────────────────────────────────────────────────────┘

┌─ 发送消息 ────────────────────────────────────────────┐
│                                                       │
│  前端: POST /api/chat/start                           │
│  {                                                   │
│    "session_id": "abc123",                           │
│    "message": "...",                                 │
│    "model": "agent-001"  ← 从 session.model 获取     │
│  }                                                   │
│  ↓                                                   │
│  后端: _handle_chat_start()                           │
│  ├─ 从 session.employee_id 查找员工                  │
│  ├─ 获取员工的 agent_provider = 'openclaw'           │
│  └─ 启动流处理线程                                   │
│  ↓                                                   │
│  _run_agent_streaming()                              │
│  ├─ 调用 AgentManager.get_provider('openclaw')       │
│  ├─ 调用 provider.create_agent(model='agent-001')    │
│  └─ 创建 OpenClawAgent 实例                          │
│  ↓                                                   │
│  OpenClawAgent.run()                                 │
│  ├─ 连接到 OpenClaw Gateway                          │
│  ├─ client.get_agent('agent-001')  ← 获取指定 agent │
│  ├─ agent.execute_stream(message)  ← 执行对话        │
│  └─ 处理事件流并返回结果                              │
│  ↓                                                   │
│  前端通过 SSE 接收流式结果                            │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## 8. 关键代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| 创建员工 | `api/employees.py` | 140-173 |
| 激活员工 | `api/employees.py` | 241-261 |
| 创建会话 | `api/routes.py` | 597-613 |
| 发送消息 | `api/routes.py` | 1540-1588 |
| 流处理 | `api/streaming.py` | 82-240 |
| OpenClaw Agent | `api/providers/openclaw_provider.py` | 105-211 |
| 前端激活 | `static/employee.js` | 132-169 |
| 前端发送消息 | `static/messages.js` | 62-66 |

## 9. 总结

### 当前状态

✅ **已实现：**
- 创建 OpenClaw 员工
- 激活员工
- 创建会话
- 发送消息并执行对话
- 会话持久化

❌ **缺失：**
- 员工对象中没有保存 model 字段
- 无法准确跟踪对话使用的是哪个 agent
- 无法验证 agent 是否存在
- 无法在激活员工时自动设置正确的 model

### 改进建议

1. **添加 model 字段到员工对象**
   - 创建员工时强制选择 agent
   - 保存到员工配置中

2. **激活员工时返回 model**
   - 前端自动设置 modelSelect 的值
   - 确保发送消息时使用正确的 agent

3. **验证 agent 存在性**
   - 创建员工时验证 agent 是否存在
   - 定期检查 agent 是否被删除

4. **改进会话跟踪**
   - 在会话中记录 agent_provider 和 model
   - 便于后续审计和调试
