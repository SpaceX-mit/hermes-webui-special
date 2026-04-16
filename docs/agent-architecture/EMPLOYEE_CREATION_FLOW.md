# 数字员工创建流程与Agent对齐机制

## 概述

本文档深入分析数字员工的创建流程，以及JDUI系统如何与Hermes Agent和OpenClaw的Agent/SubAgent管理体系对齐。

## 1. 数字员工创建流程

### 1.1 前端创建流程

```
用户点击"创建员工"
  ↓
填写员工信息
  ├─ 名称 (name)
  ├─ 描述 (description)
  ├─ 头像 (avatar_index)
  ├─ 性格特质 (traits)
  ├─ 能力配置 (capabilities)
  └─ Agent平台 (agent_provider: 'hermes' 或 'openclaw')
  ↓
POST /api/employee/create
  ↓
后端处理 (api/employees.py::create_employee)
  ├─ 生成员工ID (emp_id = uuid.uuid4().hex[:12])
  ├─ 生成Profile名称 (profile_name = f'emp-{emp_id}')
  ├─ 创建员工对象
  │   {
  │     "id": "emp_id",
  │     "name": "员工名称",
  │     "profile_name": "emp-emp_id",
  │     "agent_provider": "hermes" | "openclaw",
  │     "description": "描述",
  │     "traits": ["特质1", "特质2"],
  │     "capabilities": {
  │       "search": true,
  │       "memory": true,
  │       "autoExec": false,
  │       "knowledge": true
  │     },
  │     "avatar_index": 0,
  │     "created_at": timestamp
  │   }
  │
  ├─ 如果 agent_provider == 'hermes':
  │   ├─ 创建Hermes Profile
  │   ├─ 生成SOUL.md
  │   ├─ 配置工具集
  │   └─ 保存到 ~/.hermes/profiles/emp-xxx/
  │
  └─ 如果 agent_provider == 'openclaw':
      └─ 仅保存配置，不创建Profile
  ↓
保存员工数据
  └─ ~/.hermes/webui/state/employees.json
  ↓
返回员工对象给前端
  ↓
前端更新员工列表
```

### 1.2 关键代码分析

#### 创建员工 (api/employees.py::create_employee)

```python
def create_employee(body):
    data = _load_employees()
    emp_id = uuid.uuid4().hex[:12]  # 生成12位ID
    profile_name = f'emp-{emp_id}'  # Profile名称
    
    emp = {
        'id': emp_id,
        'name': body.get('name', 'Digital Employee'),
        'description': body.get('description', ''),
        'traits': body.get('traits', []),
        'capabilities': body.get('capabilities', {}),
        'profile_name': profile_name,
        'agent_provider': body.get('agent_provider', 'hermes'),
        'created_at': time.time(),
    }
    
    # 关键分支：只为Hermes创建Profile
    if emp['agent_provider'] == 'hermes':
        try:
            # 1. 从default profile克隆
            create_profile_api(profile_name, clone_from='default', clone_config=True)
            
            # 2. 生成SOUL.md (性格定义)
            _write_soul_md(profile_name, _generate_soul_md(name, description, traits))
            
            # 3. 配置工具集
            _update_profile_toolsets(profile_name, capabilities)
        except Exception:
            pass
    
    data['employees'].append(emp)
    _save_employees(data)
    return emp
```

#### 生成SOUL.md

```python
def _generate_soul_md(name, description, traits):
    """构建SOUL.md内容"""
    lines = [f'# 角色设定\n\n你是 {name}，{description}']
    lines.append('\n## 性格特质')
    for t in (traits or []):
        lines.append(f'- {t}')
    lines.append('\n## 工作准则')
    lines.append('- 保持专业、高效的工作态度')
    lines.append('- 根据上下文灵活调整沟通风格')
    return '\n'.join(lines) + '\n'
```

**SOUL.md 示例：**
```markdown
# 角色设定

你是 数据分析师，精通数据分析和可视化

## 性格特质
- 逻辑严谨
- 数据驱动
- 善于沟通

## 工作准则
- 保持专业、高效的工作态度
- 根据上下文灵活调整沟通风格
```

#### 配置工具集

```python
def _update_profile_toolsets(profile_name, capabilities):
    """根据能力配置更新工具集"""
    profile_dir = _get_profile_dir(profile_name)
    config_path = profile_dir / 'config.yaml'
    
    # 构建工具集列表
    toolsets = ['skills']  # 基础技能
    caps = capabilities or {}
    if caps.get('search'):
        toolsets.append('web')      # 网络搜索
    if caps.get('memory'):
        toolsets.append('memory')   # 长期记忆
    if caps.get('autoExec'):
        toolsets.append('terminal') # 自主执行
    if caps.get('knowledge'):
        toolsets.append('file')     # 知识库
    
    # 更新 config.yaml
    cfg['platform_toolsets']['cli'] = toolsets
```

**config.yaml 示例：**
```yaml
platform_toolsets:
  cli:
    - skills
    - web
    - memory
    - file
```

## 2. Hermes Agent 对齐机制

### 2.1 Profile 与 Agent 的关系

```
数字员工 (Employee)
  │
  ├─ agent_provider: 'hermes'
  ├─ profile_name: 'emp-xxx'
  └─ capabilities: {...}
      │
      ▼
  Hermes Profile (~/.hermes/profiles/emp-xxx/)
      │
      ├─ SOUL.md              ← 性格定义 (从 employee.description + traits 生成)
      ├─ config.yaml          ← 工具集配置 (从 employee.capabilities 映射)
      ├─ .env                 ← 环境变量 (克隆自 default)
      ├─ memories/            ← 独立记忆库
      ├─ skills/              ← 独立技能库
      ├─ sessions/            ← 会话历史
      └─ cron/                ← 定时任务
      │
      ▼
  Hermes Agent (run_agent.AIAgent)
      │
      ├─ 初始化时读取 SOUL.md
      ├─ 初始化时读取 config.yaml
      ├─ 运行时使用 HERMES_HOME 环境变量
      └─ 执行时注入 ephemeral_system_prompt (性格)
```

### 2.2 Profile 创建过程

#### 步骤1：克隆Default Profile

```python
# api/profiles.py::create_profile_api
def create_profile_api(name, clone_from='default', clone_config=True):
    """
    创建新Profile，可选地从现有Profile克隆
    """
    base_dir = _DEFAULT_HERMES_HOME / 'profiles'
    new_profile_dir = base_dir / name
    
    if clone_from:
        source_dir = _DEFAULT_HERMES_HOME if clone_from == 'default' else base_dir / clone_from
        
        # 克隆目录结构
        for subdir in _PROFILE_DIRS:  # ['memories', 'sessions', 'skills', 'skins', 'logs', 'plans', 'workspace', 'cron']
            src = source_dir / subdir
            dst = new_profile_dir / subdir
            if src.exists():
                shutil.copytree(src, dst, dirs_exist_ok=True)
        
        # 克隆配置文件
        if clone_config:
            for fname in _CLONE_CONFIG_FILES:  # ['config.yaml', '.env', 'SOUL.md']
                src = source_dir / fname
                dst = new_profile_dir / fname
                if src.exists():
                    shutil.copy2(src, dst)
```

#### 步骤2：生成SOUL.md

```python
def _write_soul_md(profile_name, content):
    """写入SOUL.md到Profile目录"""
    profile_dir = _get_profile_dir(profile_name)
    profile_dir.mkdir(parents=True, exist_ok=True)
    (profile_dir / 'SOUL.md').write_text(content, encoding='utf-8')
```

#### 步骤3：配置工具集

```python
def _update_profile_toolsets(profile_name, capabilities):
    """更新 config.yaml 中的工具集"""
    # 根据 capabilities 构建工具集列表
    # 写入 config.yaml
```

### 2.3 Profile 激活与Agent初始化

#### 激活Profile

```python
# api/profiles.py::switch_profile
def switch_profile(name):
    """
    切换活跃Profile
    
    1. 更新 ~/.hermes/active_profile 文件
    2. 设置 HERMES_HOME 环境变量
    3. 重新加载 .env
    4. 猴补丁 module-level 缓存
    """
    global _active_profile
    
    # 1. 保存到文件
    ap_file = _DEFAULT_HERMES_HOME / 'active_profile'
    ap_file.write_text(name)
    
    # 2. 更新全局状态
    _active_profile = name
    
    # 3. 设置环境变量
    home = get_active_hermes_home()
    _set_hermes_home(home)
    
    # 4. 重新加载 .env
    _reload_dotenv(home)
    
    return {'active': name}
```

#### Agent初始化

```python
# api/providers/hermes_provider.py::HermesAgent.__init__
def __init__(self, *, model, provider, base_url, api_key,
             toolsets, fallback_model, session_id, on_token, on_tool):
    from run_agent import AIAgent
    
    self._agent = AIAgent(
        model=model,
        provider=provider,
        base_url=base_url,
        api_key=api_key,
        platform='cli',
        quiet_mode=True,
        enabled_toolsets=toolsets,  # 从 config.yaml 读取
        fallback_model=fallback_model,
        session_id=session_id,
        stream_delta_callback=on_token,
        tool_progress_callback=on_tool,
    )
```

**关键点：**
- `enabled_toolsets` 来自 config.yaml 中的 `platform_toolsets.cli`
- AIAgent 初始化时会读取当前 HERMES_HOME 下的配置
- 性格通过 `ephemeral_system_prompt` 在运行时注入

### 2.4 性格注入机制

```python
# api/providers/hermes_provider.py::HermesAgent.run
def run(self, user_message, system_message, conversation_history,
        session_id, personality=None):
    
    # 性格注入：设置 ephemeral_system_prompt
    if personality:
        self._agent.ephemeral_system_prompt = personality
    
    # 执行对话
    result = self._agent.run_conversation(
        user_message=user_message,
        system_message=system_message,
        conversation_history=conversation_history,
        task_id=session_id,
    )
```

**性格来源：**
1. SOUL.md 中的内容 (静态)
2. 运行时注入的 personality 参数 (动态)

## 3. OpenClaw Agent 对齐机制

### 3.1 OpenClaw 的Agent管理

OpenClaw 有自己的Agent管理体系：

```
OpenClaw Gateway
  │
  ├─ Agent 1 (agent_id: 'agent-001')
  │   ├─ SubAgent A
  │   ├─ SubAgent B
  │   └─ SubAgent C
  │
  ├─ Agent 2 (agent_id: 'agent-002')
  │   └─ ...
  │
  └─ Agent N
      └─ ...
```

### 3.2 JDUI 与 OpenClaw 的对齐

```
数字员工 (Employee)
  │
  ├─ agent_provider: 'openclaw'
  ├─ profile_name: 'emp-xxx' (仅用于会话标记，不创建Profile)
  └─ capabilities: {...}
      │
      ▼
  OpenClaw Gateway (远程)
      │
      ├─ 不创建独立的Agent
      ├─ 使用Gateway中已有的Agent
      └─ 通过 model 参数指定具体的Agent
      │
      ▼
  OpenClawAgent (JDUI包装)
      │
      ├─ 连接到 Gateway
      ├─ 获取指定的 Agent
      └─ 执行 agent.execute_stream()
```

### 3.3 关键区别

| 维度 | Hermes | OpenClaw |
|------|--------|----------|
| **Profile创建** | ✅ 创建独立Profile | ❌ 不创建Profile |
| **Agent管理** | 本地创建 | 远程Gateway管理 |
| **SOUL.md** | ✅ 生成并保存 | ❌ 不需要 |
| **工具集配置** | ✅ config.yaml | ❌ Gateway配置 |
| **性格注入** | ✅ ephemeral_system_prompt | ✅ 系统提示词 |
| **会话标记** | profile_name | profile_name (仅标记) |

### 3.4 OpenClaw Agent 初始化

```python
# api/providers/openclaw_provider.py::OpenClawAgent.__init__
def __init__(self, *, model, gateway_url, gateway_key,
             session_id, on_token, on_tool):
    self._model = model                    # Gateway中的Agent ID
    self._gateway_url = gateway_url        # WebSocket URL
    self._gateway_key = gateway_key        # API Key
    self._session_id = session_id
    self._on_token = on_token
    self._on_tool = on_tool
    self._usage = AgentUsage()
    self._interrupted = False
```

### 3.5 OpenClaw Agent 执行

```python
# api/providers/openclaw_provider.py::OpenClawAgent.run
async def _execute():
    from openclaw_sdk import OpenClawClient, EventType
    
    # 1. 连接到Gateway
    client = await OpenClawClient.connect(
        gateway_ws_url=self._gateway_url,
        api_key=self._gateway_key or None,
    )
    
    try:
        # 2. 获取指定的Agent
        agent = client.get_agent(self._model)
        
        # 3. 执行流式对话
        stream = await agent.execute_stream(full_message)
        
        # 4. 处理事件流
        async for event in stream:
            if event.event_type == EventType.AGENT:
                # 处理Agent输出
                ...
            elif event.event_type == EventType.TOOL_CALL:
                # 处理工具调用
                ...
```

## 4. 聊天启动时的对齐

### 4.1 Provider 解析

```python
# api/streaming.py::_run_agent_streaming
def _run_agent_streaming(session_id, msg_text, model, workspace, stream_id, 
                        attachments=None, agent_provider_id=None):
    
    # 1. 获取会话
    s = get_session(session_id)
    
    # 2. 解析 agent_provider_id
    if not agent_provider_id:
        # 从会话的 profile 或 employee_id 推断
        agent_provider_id = _resolve_agent_provider(s)
    
    # 3. 获取 Provider
    provider = AgentManager.get_provider(agent_provider_id)
    
    # 4. 创建 Agent
    if agent_provider_id == 'hermes':
        # Hermes路径：需要Profile信息
        agent = provider.create_agent(
            model=model,
            provider=resolved_provider,
            base_url=resolved_base_url,
            api_key=resolved_api_key,
            toolsets=CLI_TOOLSETS,  # 从 config.yaml 读取
            fallback_model=fallback_model,
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
        )
    else:
        # OpenClaw路径：直接连接Gateway
        agent = provider.create_agent(
            model=model,
            provider=None,
            base_url=None,
            api_key=None,
            toolsets=None,
            fallback_model=None,
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
        )
```

### 4.2 Hermes 执行路径

```python
# Hermes特有的处理
if hasattr(agent, 'raw_agent'):  # 检测是否是HermesAgent
    raw_agent = agent.raw_agent
    
    # 1. 注入性格
    if personality:
        raw_agent.ephemeral_system_prompt = personality
    
    # 2. 执行对话
    result = raw_agent.run_conversation(
        user_message=msg_text,
        system_message=system_message,
        conversation_history=conversation_history,
        task_id=session_id,
    )
    
    # 3. 检测Session轮转 (上下文压缩)
    if hasattr(result, 'session_id_changed') and result.session_id_changed:
        s.session_id = result.new_session_id
    
    # 4. 提取工具调用
    tool_calls = _extract_tool_calls(result)
    
    # 5. 提取使用量
    usage = {
        'input_tokens': raw_agent.input_tokens or 0,
        'output_tokens': raw_agent.output_tokens or 0,
        'estimated_cost': raw_agent.estimated_cost or 0.0,
    }
```

### 4.3 OpenClaw 执行路径

```python
# OpenClaw标准接口
else:
    # 调用标准 IAgent.run() 接口
    agent_result = agent.run(
        user_message=msg_text,
        system_message=system_message,
        conversation_history=conversation_history,
        session_id=session_id,
        personality=personality,
    )
    
    # 提取结果
    s.messages = agent_result.messages
    usage = {
        'input_tokens': agent_result.usage.input_tokens,
        'output_tokens': agent_result.usage.output_tokens,
        'estimated_cost': agent_result.usage.estimated_cost_usd,
    }
```

## 5. 对齐机制总结

### 5.1 Hermes 对齐

```
数字员工创建
  ↓
创建Hermes Profile
  ├─ 克隆default profile
  ├─ 生成SOUL.md (性格)
  └─ 配置工具集 (config.yaml)
  ↓
员工激活
  ├─ switch_profile(profile_name)
  └─ 设置HERMES_HOME环境变量
  ↓
聊天启动
  ├─ 读取config.yaml获取工具集
  ├─ 创建AIAgent实例
  ├─ 注入性格 (ephemeral_system_prompt)
  └─ 执行run_conversation()
```

**对齐点：**
1. Profile名称 = `emp-{emp_id}`
2. SOUL.md内容 = employee.description + traits
3. 工具集 = employee.capabilities 映射
4. 性格 = SOUL.md + 运行时注入

### 5.2 OpenClaw 对齐

```
数字员工创建
  ├─ 不创建Profile
  └─ 仅保存配置
  ↓
员工激活
  └─ 返回profile_name (仅标记)
  ↓
聊天启动
  ├─ 连接到Gateway
  ├─ 获取指定的Agent (model参数)
  ├─ 注入性格 (系统提示词)
  └─ 执行execute_stream()
```

**对齐点：**
1. profile_name 用于会话标记
2. model 参数指定Gateway中的Agent
3. 性格通过系统提示词注入
4. 工具集由Gateway管理

## 6. 关键设计决策

### 6.1 为什么Hermes需要Profile，OpenClaw不需要？

**Hermes：**
- 本地框架，需要本地配置文件
- Profile包含工具集、技能、记忆等本地资源
- 每个员工需要独立的配置空间

**OpenClaw：**
- 远程网关，配置在服务端
- Agent已由Gateway管理
- JDUI只需连接并调用

### 6.2 为什么都需要profile_name？

**Hermes：**
- 实际的Profile目录名称
- 用于切换HERMES_HOME

**OpenClaw：**
- 会话标记，用于恢复会话时识别员工
- 不对应实际的Profile目录

### 6.3 性格注入的两种方式

**Hermes：**
- 静态：SOUL.md (Profile中)
- 动态：ephemeral_system_prompt (运行时)

**OpenClaw：**
- 动态：系统提示词 (运行时)
- 无静态配置

## 7. 扩展新Agent后端的对齐要点

### 7.1 需要决定的问题

1. **是否需要本地Profile？**
   - 是 → 类似Hermes
   - 否 → 类似OpenClaw

2. **如何管理Agent？**
   - 本地创建 → 需要初始化逻辑
   - 远程管理 → 需要连接逻辑

3. **如何注入性格？**
   - 配置文件 → 需要生成配置
   - 系统提示词 → 运行时注入

4. **如何配置工具集？**
   - 本地配置 → 需要config文件
   - 远程配置 → 由后端管理

### 7.2 实现清单

- [ ] 继承 IAgentProvider
- [ ] 实现 get_provider_id()
- [ ] 实现 is_available()
- [ ] 实现 get_supported_models()
- [ ] 实现 create_agent()
- [ ] 继承 IAgent
- [ ] 实现 run()
- [ ] 实现 interrupt()
- [ ] 实现 get_usage()
- [ ] 在 employees.py 中处理Profile创建逻辑
- [ ] 在 streaming.py 中处理执行路径

## 8. 常见问题

### Q: 为什么OpenClaw的profile_name不是实际的Profile？

A: 因为OpenClaw是远程服务，不需要本地Profile。profile_name仅用于会话标记和员工识别。

### Q: 如何在OpenClaw中实现类似SOUL.md的性格定义？

A: 通过系统提示词注入。在 OpenClawAgent.run() 中，将性格信息添加到系统提示词中。

### Q: Hermes的SOUL.md是否会被LLM看到？

A: 是的。SOUL.md的内容通过系统提示词注入到LLM，影响Agent的行为。

### Q: 如何在运行时修改员工的性格？

A: 对于Hermes，修改SOUL.md后需要重新激活Profile。对于OpenClaw，直接修改系统提示词。

### Q: 多个员工可以共享同一个Profile吗？

A: 不建议。每个员工应该有独立的Profile，以保持配置隔离。

## 总结

JDUI通过以下机制与Hermes Agent和OpenClaw对齐：

1. **Hermes对齐：** 通过Profile机制，将员工配置映射到本地文件系统
2. **OpenClaw对齐：** 通过标准接口，将员工配置映射到远程Agent
3. **统一接口：** 通过IAgentProvider和IAgent，隐藏具体实现细节
4. **灵活扩展：** 新Agent后端只需实现标准接口，无需修改核心代码

这种设计既支持本地框架（Hermes），也支持远程服务（OpenClaw），为未来的扩展预留了空间。
