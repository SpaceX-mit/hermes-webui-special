# Hermes Agent 数字员工创建与对话完整流程

## 概述

本文档详细梳理 Hermes Agent 对接的完整流程，包括：
1. 创建数字员工流程（Profile 创建、SOUL.md 生成、工具集配置）
2. 激活员工流程（Profile 切换、环境变量设置）
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
      └─ Hermes  ← 用户选择 Hermes
```

### 1.2 后端创建员工对象

```python
# api/employees.py:140-173
def create_employee(body):
    emp_id = uuid.uuid4().hex[:12]  # 生成 12 位 ID
    profile_name = f'emp-{emp_id}'
    
    emp = {
        'id': emp_id,
        'name': body.get('name'),
        'profile_name': profile_name,
        'agent_provider': 'hermes',
        'description': body.get('description'),
        'traits': body.get('traits'),
        'capabilities': body.get('capabilities'),
        'created_at': time.time(),
    }
    
    # 关键：为 Hermes 创建 Profile
    if emp['agent_provider'] == 'hermes':
        # 1. 克隆 default profile
        create_profile_api(profile_name, clone_from='default', clone_config=True)
        
        # 2. 生成 SOUL.md
        _write_soul_md(profile_name, _generate_soul_md(name, description, traits))
        
        # 3. 配置工具集
        _update_profile_toolsets(profile_name, capabilities)
    
    _save_employees(data)
    return emp
```

### 1.3 Profile 创建过程

**位置：** `~/.hermes/profiles/emp-{emp_id}/`

**创建步骤：** `api/profiles.py:325-381`

1. **克隆目录结构**
   ```
   memories/    - 长期记忆
   sessions/    - 会话历史
   skills/      - 技能库
   skins/       - 皮肤配置
   logs/        - 日志
   plans/       - 计划
   workspace/   - 工作目录
   cron/        - 定时任务
   ```

2. **克隆配置文件**
   - config.yaml - 配置文件
   - .env - 环境变量
   - SOUL.md - 性格定义

### 1.4 SOUL.md 生成

**生成逻辑：** `api/employees.py:54-63`

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

**示例输出：**
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

### 1.5 工具集配置

**配置逻辑：** `api/employees.py:73-134`

```python
def _update_profile_toolsets(profile_name, capabilities):
    """根据能力配置更新工具集"""
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
    
    # 写入 config.yaml
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

### 1.6 员工对象结构

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
  "agent_provider": "hermes",
  "created_at": 1713254400.123
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
    """激活员工。对于 Hermes：切换 Profile"""
    for emp in data['employees']:
        if emp['id'] == emp_id:
            provider = emp.get('agent_provider', 'hermes')
            profile_name = emp.get('profile_name', '')
            
            if provider == 'hermes':
                # Hermes: 切换 Profile
                return switch_profile(profile_name)
```

### 2.4 Profile 切换

**关键函数：** `api/profiles.py:153-214`

```python
def switch_profile(name: str) -> dict:
    """切换活跃 Profile"""
    global _active_profile
    
    # 1. 检查是否有 agent 正在运行
    with STREAMS_LOCK:
        if len(STREAMS) > 0:
            raise RuntimeError(
                'Cannot switch profiles while an agent is running. '
                'Cancel or wait for it to finish.'
            )
    
    # 2. 解析 profile 目录
    if name == 'default':
        home = _DEFAULT_HERMES_HOME
    else:
        home = _DEFAULT_HERMES_HOME / 'profiles' / name
        if not home.is_dir():
            raise ValueError(f"Profile '{name}' does not exist.")
    
    # 3. 更新全局状态
    with _profile_lock:
        _active_profile = name
        
        # 4. 设置 HERMES_HOME 环境变量
        _set_hermes_home(home)
        
        # 5. 重新加载 .env
        _reload_dotenv(home)
    
    # 6. 写入 sticky 文件
    ap_file = _DEFAULT_HERMES_HOME / 'active_profile'
    ap_file.write_text(name if name != 'default' else '')
    
    # 7. 重新加载 config.yaml
    reload_config()
    
    return {
        'profiles': list_profiles_api(),
        'active': name,
        'default_model': default_model,
        'default_workspace': get_last_workspace(),
    }
```

### 2.5 环境变量设置

**关键函数：** `api/profiles.py:99-119`

```python
def _set_hermes_home(home: Path):
    """设置 HERMES_HOME 环境变量并猴补丁缓存"""
    # 1. 设置环境变量
    os.environ['HERMES_HOME'] = str(home)
    
    # 2. 猴补丁 skills_tool 模块级缓存
    try:
        import tools.skills_tool as _sk
        _sk.HERMES_HOME = home
        _sk.SKILLS_DIR = home / 'skills'
    except (ImportError, AttributeError):
        pass
    
    # 3. 猴补丁 cron/jobs 模块级缓存
    try:
        import cron.jobs as _cj
        _cj.HERMES_DIR = home
        _cj.CRON_DIR = home / 'cron'
        _cj.JOBS_FILE = _cj.CRON_DIR / 'jobs.json'
        _cj.OUTPUT_DIR = _cj.CRON_DIR / 'output'
    except (ImportError, AttributeError):
        pass
```

**重新加载 .env：** `api/profiles.py:122-137`

```python
def _reload_dotenv(home: Path):
    """从 profile 目录加载 .env 到 os.environ"""
    env_path = home / '.env'
    if not env_path.exists():
        return
    try:
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and v:
                    os.environ[k] = v
    except Exception:
        pass
```

## 3. 创建会话流程

### 3.1 前端创建会话

```javascript
// static/employee.js:154-169
async function _newSessionForEmployee(empId) {
  if (typeof MSG_QUEUE !== 'undefined') MSG_QUEUE.length = 0;
  const ws = S.session ? S.session.workspace : null;
  const model = $('modelSelect') ? $('modelSelect').value : '';
  const data = await api('/api/session/new', {
    method: 'POST',
    body: JSON.stringify({ model: model, workspace: ws, employee_id: empId }),
  });
  S.session = data.session;
  S.messages = data.session.messages || [];
  localStorage.setItem('hermes-webui-session', S.session.session_id);
}
```

### 3.2 后端创建会话

```python
# api/routes.py:597-613
if parsed.path == "/api/session/new":
    s = new_session(workspace=body.get("workspace"), model=body.get("model"))
    
    # 标记会话属于哪个员工
    _emp_id = body.get("employee_id", "").strip()
    if _emp_id:
        try:
            from api.employees import list_employees
            for _emp in list_employees().get('employees', []):
                if _emp.get('id') == _emp_id:
                    s.profile = _emp.get('profile_name', s.profile)
                    if hasattr(s, 'employee_id'):
                        s.employee_id = _emp_id
                    s.save()
                    break
        except Exception:
            pass
    
    return j(handler, {"session": s.compact() | {"messages": s.messages}})
```

### 3.3 会话对象结构

```python
# api/models.py:36-60
class Session:
    def __init__(self, session_id, title, workspace, model, ...):
        self.session_id = session_id          # 会话 ID
        self.title = title                    # 会话标题
        self.workspace = workspace            # 工作目录
        self.model = model                    # 当前使用的 model
        self.messages = []                    # 对话消息
        self.profile = profile                # 员工的 profile_name
        self.employee_id = employee_id        # 员工 ID
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
  "model": "claude-sonnet-4.6",
  "profile": "emp-a1b2c3d4e5f6",
  "employee_id": "a1b2c3d4e5f6",
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
    model: S.session.model || $('modelSelect').value,
    workspace: S.session.workspace,
    attachments: uploaded.length ? uploaded : undefined
  })
});
```

### 4.2 后端处理消息

```python
# api/routes.py:1540-1588
def _handle_chat_start(handler, body):
    try:
        require(body, "session_id")
    except ValueError as e:
        return bad(handler, str(e))
    
    s = get_session(body["session_id"])
    msg = str(body.get("message", "")).strip()
    if not msg:
        return bad(handler, "message is required")
    
    # 获取 model
    model = body.get("model") or s.model
    s.workspace = workspace
    s.model = model
    s.save()
    
    # 关键：解析 agent provider
    _agent_provider_id = None
    try:
        from api.employees import list_employees
        _all_emps = list_employees().get('employees', [])
        
        # 方式1：通过 profile_name 匹配
        if hasattr(s, 'profile') and s.profile:
            for _emp in _all_emps:
                if _emp.get('profile_name') == s.profile:
                    _agent_provider_id = _emp.get('agent_provider')  # 'hermes'
                    break
        
        # 方式2：通过 employee_id 匹配
        if not _agent_provider_id and hasattr(s, 'employee_id') and s.employee_id:
            for _emp in _all_emps:
                if _emp.get('id') == s.employee_id:
                    _agent_provider_id = _emp.get('agent_provider')
                    break
    except Exception:
        pass
    
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
    resolved_api_key = None
    try:
        from hermes_cli.runtime_provider import resolve_runtime_provider
        _rt = resolve_runtime_provider(requested=resolved_provider)
        resolved_api_key = _rt.get("api_key")
        if not resolved_provider:
            resolved_provider = _rt.get("provider")
        if not resolved_base_url:
            resolved_base_url = _rt.get("base_url")
    except Exception:
        pass
    
    # 2. 读取 profile 配置
    from api.config import get_config as _get_config
    _cfg = _get_config()
    
    # 3. 获取工具集
    _pt = _cfg.get('platform_toolsets', {})
    _toolsets = _pt.get('cli', CLI_TOOLSETS) if isinstance(_pt, dict) else CLI_TOOLSETS
    
    # 4. 获取 Provider
    from api.agent_manager import AgentManager
    _provider = AgentManager.get_provider(agent_provider_id)  # 'hermes'
    
    # 5. 创建 Agent
    _iagent = _provider.create_agent(
        model=resolved_model,
        provider=resolved_provider,
        base_url=resolved_base_url,
        api_key=resolved_api_key,
        toolsets=_toolsets,
        fallback_model=_fallback_resolved,
        session_id=session_id,
        on_token=on_token,
        on_tool=on_tool,
    )
    
    # 6. 执行对话（Hermes 特有路径）
    if hasattr(_iagent, 'raw_agent'):
        # 注入性格
        if personality:
            _iagent.raw_agent.ephemeral_system_prompt = personality
        
        # 执行对话
        result = _iagent.raw_agent.run_conversation(
            user_message=msg_text,
            system_message=system_message,
            conversation_history=conversation_history,
            task_id=session_id,
        )
        
        # 检测 session 轮转（上下文压缩）
        if hasattr(result, 'session_id_changed') and result.session_id_changed:
            s.session_id = result.new_session_id
```

### 4.4 Hermes Provider 创建 Agent

```python
# api/providers/hermes_provider.py:36-57
def create_agent(self, model, provider, base_url, api_key, toolsets, 
                fallback_model, session_id, on_token, on_tool):
    return HermesAgent(
        model=model,
        provider=provider,
        base_url=base_url,
        api_key=api_key,
        toolsets=toolsets,
        fallback_model=fallback_model,
        session_id=session_id,
        on_token=on_token,
        on_tool=on_tool,
    )
```

### 4.5 Hermes Agent 初始化

```python
# api/providers/hermes_provider.py:63-79
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
- AIAgent 初始化时读取当前 HERMES_HOME 下的配置
- enabled_toolsets 来自 config.yaml 中的 platform_toolsets.cli
- 所有资源（skills, memories, .env）都来自当前 Profile 目录

### 4.6 Hermes Agent 执行对话

```python
# api/providers/hermes_provider.py:86-112
def run(self, user_message, system_message, conversation_history,
        session_id, personality=None):
    
    # 性格注入
    if personality:
        self._agent.ephemeral_system_prompt = personality
    
    # 执行对话
    result = self._agent.run_conversation(
        user_message=user_message,
        system_message=system_message,
        conversation_history=conversation_history,
        task_id=session_id,
        persist_user_message=user_message.split('\n', 1)[-1] if '\n' in user_message else user_message,
    )
    
    messages = result.get('messages', [])
    usage = self.get_usage()
    
    # 检测 session ID 轮转（上下文压缩）
    agent_sid = getattr(self._agent, 'session_id', None)
    sid_changed = bool(agent_sid and agent_sid != session_id)
    
    return AgentResult(
        messages=messages,
        usage=usage,
        session_id_changed=sid_changed,
        new_session_id=agent_sid if sid_changed else None,
    )
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
    # 验证 session ID 格式
    if not sid or not all(c in '0123456789abcdefghijklmnopqrstuvwxyz_' for c in sid):
        return None
    p = SESSION_DIR / f'{sid}.json'
    if not p.exists():
        return None
    return cls(**json.loads(p.read_text(encoding='utf-8')))
```

## 6. 跟踪对话使用的 Agent

### 6.1 Hermes 的优势

✅ **系统知道使用的是哪个 Profile 的 Agent**

- 员工对象包含 `profile_name`
- Profile 对应实际的目录 `~/.hermes/profiles/emp-{emp_id}/`
- 激活员工时切换 HERMES_HOME 环境变量
- AIAgent 初始化时读取当前 Profile 的配置
- 所有资源都来自特定的 Profile 目录

### 6.2 完整跟踪链路

```
员工激活
  ↓
switch_profile(profile_name)
  ├─ 设置 HERMES_HOME = ~/.hermes/profiles/emp-xxx/
  ├─ 猴补丁 module-level 缓存
  ├─ 重新加载 .env
  └─ 重新加载 config.yaml
  ↓
创建会话
  ├─ session.profile = emp.profile_name
  ├─ session.employee_id = emp.id
  └─ session.model = 用户选择的 model
  ↓
发送消息
  ├─ 从 session.employee_id 查找员工
  ├─ 获取 agent_provider = 'hermes'
  └─ 创建 HermesAgent
  ↓
执行对话
  └─ AIAgent 使用当前 HERMES_HOME 的配置
      ├─ 读取 config.yaml 的工具集
      ├─ 读取 SOUL.md 的性格
      ├─ 读取 .env 的 API keys
      ├─ 使用 memories/ 的长期记忆
      ├─ 使用 skills/ 的技能库
      └─ 使用 sessions/ 的会话历史
```

### 6.3 关键数据结构

**员工对象：**
```json
{
  "id": "emp-001",
  "profile_name": "emp-emp-001",
  "agent_provider": "hermes"
}
```

**会话对象：**
```json
{
  "session_id": "abc123",
  "profile": "emp-emp-001",
  "employee_id": "emp-001",
  "model": "claude-sonnet-4.6"
}
```

**Profile 目录：**
```
~/.hermes/profiles/emp-emp-001/
├── SOUL.md              ← 性格定义
├── config.yaml          ← 工具集配置
├── .env                 ← API keys
├── memories/            ← 长期记忆
├── skills/              ← 技能库
├── sessions/            ← 会话历史
└── cron/                ← 定时任务
```

## 7. Hermes vs OpenClaw 对比

| 维度 | Hermes | OpenClaw |
|------|--------|----------|
| **Profile 创建** | ✅ 创建本地目录 | ❌ 不创建 |
| **SOUL.md** | ✅ 生成并保存 | ❌ 不需要 |
| **工具集配置** | ✅ config.yaml | ❌ Gateway 管理 |
| **环境变量** | ✅ 切换 HERMES_HOME | ❌ 不需要 |
| **Agent 管理** | ✅ 本地创建 | ❌ 远程 Gateway |
| **Model 字段** | ✅ 可选 | ❌ 必需 |
| **系统追踪** | ✅ 知道使用的 Profile | ❌ 不知道具体 agent |
| **资源隔离** | ✅ 完全隔离 | ❌ 共享 Gateway |
| **性格注入** | ✅ 静态 + 动态 | ❌ 仅动态 |

## 8. 关键代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| 创建员工 | `api/employees.py` | 140-173 |
| 生成 SOUL.md | `api/employees.py` | 54-63 |
| 配置工具集 | `api/employees.py` | 73-134 |
| 激活员工 | `api/employees.py` | 241-261 |
| 创建 Profile | `api/profiles.py` | 325-381 |
| 切换 Profile | `api/profiles.py` | 153-214 |
| 设置环境变量 | `api/profiles.py` | 99-119 |
| 创建会话 | `api/routes.py` | 597-613 |
| 发送消息 | `api/routes.py` | 1540-1588 |
| 流处理 | `api/streaming.py` | 82-240 |
| Hermes Provider | `api/providers/hermes_provider.py` | 13-132 |
| 前端激活 | `static/employee.js` | 132-169 |
| 前端发送消息 | `static/messages.js` | 62-66 |

## 9. 总结

Hermes Agent 的数字员工创建与对话流程具有以下特点：

1. **完整的 Profile 管理** - 每个员工对应一个独立的 Profile 目录
2. **性格定义** - 通过 SOUL.md 定义员工的性格和工作准则
3. **工具集配置** - 通过 config.yaml 配置员工的能力
4. **环境隔离** - 通过切换 HERMES_HOME 实现完全的资源隔离
5. **系统追踪** - 系统知道每个对话使用的是哪个 Profile 的 Agent
6. **资源共享** - 每个 Profile 有独立的 memories、skills、sessions 等资源
7. **灵活扩展** - 支持自定义 Profile、技能、记忆等
