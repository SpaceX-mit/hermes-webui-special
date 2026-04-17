# OpenClaw 集成优化技术方案

## 一、业务现状与代码流程

### 1.1 连接管理现状

**现状：每次操作都新建 WebSocket 连接，用完即关。**

涉及 4 处独立连接（`api/providers/openclaw_provider.py`）：

| 操作 | 触发时机 | 连接行为 |
|------|---------|---------|
| `create_openclaw_agent_on_gateway()` | 创建员工 | 新建 → 创建 agent → 关闭 |
| `delete_openclaw_agent_on_gateway()` | 删除员工 | 新建 → 删除 agent → 关闭 |
| `get_supported_models()` | 前端加载 provider 列表 | 新建 → list agents → 关闭 |
| `OpenClawAgent.run()` | **每条消息** | 新建 → execute_stream → 关闭 |

核心代码（`openclaw_provider.py:218-290`）：

```python
async def _execute():
    client = await OpenClawClient.connect(   # ← 每条消息都新建连接
        gateway_ws_url=self._gateway_url,
        api_key=self._gateway_key or None,
    )
    try:
        agent = client.get_agent(self._openclaw_agent_id)
        stream = await agent.execute_stream(full_message)
        async for event in stream:
            ...
    finally:
        await client.close()                 # ← 每条消息都关闭连接

asyncio.run(_execute())
```

**问题：**
- 每条消息都经历 TCP 握手 + WebSocket 握手 + 认证，增加 50-200ms 延迟
- 高并发时 Gateway 连接数线性增长
- 连接建立失败会直接导致消息发送失败，无重试机制

---

### 1.2 Session/对话历史现状

**现状：JDUI 自己管理历史，每次发消息把全量历史传给 OpenClaw，但 OpenClaw 实际上只收到当前这条消息。**

完整流程：

```
前端 POST /api/chat/start { session_id, message, workspace }
  ↓
routes.py: _handle_chat_start()
  └─ 从 SESSIONS 内存 / 磁盘读取 s.messages（全量历史）
  ↓
streaming.py: _run_agent_streaming()
  └─ conversation_history = _sanitize_messages_for_api(s.messages)
     （过滤掉 attachments/timestamp 等展示字段，只保留 role/content）
  ↓
OpenClawAgent.run(
    user_message = "[Workspace: /path]\n用户消息",
    conversation_history = [...全量历史...],   ← 传入了
    ...
)
  ↓
async def _execute():
    agent = client.get_agent(self._openclaw_agent_id)
    stream = await agent.execute_stream(full_message)  ← 只传了当前消息！
    # conversation_history 完全没有用到
```

返回时（`openclaw_provider.py:294-298`）：

```python
# conversation_history 只用来构造返回值，没有传给 Gateway
messages = list(conversation_history) if conversation_history else []
messages.append({'role': 'user', 'content': display_message})
if result_text:
    messages.append({'role': 'assistant', 'content': result_text})
return AgentResult(messages=messages, usage=self._usage)
```

**问题：**
- Gateway 侧的 agent 每次都是无记忆的单轮对话，不知道上下文
- JDUI 把全量历史传过来但没用，是无效的序列化和网络传输
- 随着对话增长，`s.messages` 越来越大，每次都全量读写磁盘
- Gateway 自带的 session 管理（`sessions.*` API）完全没有使用

---

### 1.3 能力映射现状

**现状：员工的 capabilities 存入了数据库，但创建 OpenClaw agent 时完全忽略。**

Hermes 侧的映射（`api/employees.py:73-135`）：

```python
def _update_profile_toolsets(profile_name, capabilities):
    toolsets = ['skills']
    caps = capabilities or {}
    if caps.get('search'):    toolsets.append('web')
    if caps.get('memory'):    toolsets.append('memory')
    if caps.get('autoExec'):  toolsets.append('terminal')
    if caps.get('knowledge'): toolsets.append('file')
    # 写入 config.yaml → platform_toolsets.cli
```

OpenClaw 侧的创建（`api/providers/openclaw_provider.py:42-78`）：

```python
def create_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities):
    # capabilities 参数接收了，但从未使用
    lines = [f'你是 {name}，{description}']
    if traits:
        lines.append('\n性格特质:')
        for t in traits: lines.append(f'- {t}')
    system_prompt = '\n'.join(lines)

    config = AgentConfig(
        agent_id=agent_id,
        name=agent_id,
        system_prompt=system_prompt,
        # ← permission_mode 未设置（默认 accept）
        # ← enable_memory 未设置（默认 True，但 memory 能力未区分）
        # ← tool_policy 未设置
        # ← skills 未设置
    )
```

**问题：**
- `autoExec: false` 的员工和 `autoExec: true` 的员工在 OpenClaw 侧行为完全相同
- `memory: false` 的员工仍然启用了记忆
- Hermes 和 OpenClaw 员工的能力边界不一致，用户配置形同虚设

---

## 二、技术方案

### 方案一：连接池（Connection Pool）

#### 设计

在 `OpenClawProvider` 类级别维护一个共享的长连接，所有操作复用同一个 WebSocket 连接。

```
OpenClawProvider（单例）
  └─ _connection: OpenClawClient | None
       ├─ 首次使用时建立
       ├─ 心跳保活
       ├─ 断线自动重连
       └─ 所有 Agent 操作共用
```

#### 实现

**`api/providers/openclaw_provider.py`**

```python
import asyncio
import threading
import time
from typing import Optional

class _ConnectionPool:
    """单连接池：维护一个到 Gateway 的长连接，自动重连。"""

    def __init__(self):
        self._client = None
        self._lock = threading.Lock()
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._gateway_url: Optional[str] = None
        self._api_key: Optional[str] = None
        self._last_cfg_hash: Optional[str] = None

    def _cfg_hash(self, cfg: dict) -> str:
        return f"{cfg['gateway_url']}|{cfg['api_key']}"

    def get_client(self, cfg: dict):
        """获取或创建连接，配置变化时重建。"""
        h = self._cfg_hash(cfg)
        with self._lock:
            if self._client is None or self._last_cfg_hash != h:
                self._close_existing()
                self._gateway_url = cfg['gateway_url']
                self._api_key = cfg['api_key']
                self._last_cfg_hash = h
                self._client = self._connect_sync()
        return self._client

    def _connect_sync(self):
        """在独立事件循环线程中建立连接。"""
        import asyncio
        from openclaw_sdk import OpenClawClient

        loop = asyncio.new_event_loop()
        client_holder = [None]
        error_holder = [None]
        done = threading.Event()

        def run():
            asyncio.set_event_loop(loop)
            async def _connect():
                try:
                    client_holder[0] = await OpenClawClient.connect(
                        gateway_ws_url=self._gateway_url,
                        api_key=self._api_key or None,
                    )
                except Exception as e:
                    error_holder[0] = e
                finally:
                    done.set()
            loop.run_until_complete(_connect())

        t = threading.Thread(target=run, daemon=True)
        t.start()
        done.wait(timeout=10)
        if error_holder[0]:
            raise error_holder[0]
        self._loop = loop
        self._thread = t
        return client_holder[0]

    def _close_existing(self):
        if self._client and self._loop:
            try:
                asyncio.run_coroutine_threadsafe(
                    self._client.close(), self._loop
                ).result(timeout=3)
            except Exception:
                pass
        self._client = None

    def invalidate(self):
        """连接出错时主动失效，下次自动重建。"""
        with self._lock:
            self._client = None


# 模块级单例
_pool = _ConnectionPool()


class OpenClawProvider(IAgentProvider):
    ...
    def create_agent(self, ...):
        cfg = _get_openclaw_config()
        return OpenClawAgent(
            ...,
            pool=_pool,   # 传入连接池
            cfg=cfg,
        )


class OpenClawAgent(IAgent):
    def __init__(self, *, ..., pool: _ConnectionPool, cfg: dict):
        ...
        self._pool = pool
        self._cfg = cfg

    def run(self, user_message, ...):
        async def _execute():
            try:
                client = self._pool.get_client(self._cfg)
                agent = client.get_agent(self._openclaw_agent_id)
                stream = await agent.execute_stream(full_message)
                async for event in stream:
                    ...
            except Exception:
                self._pool.invalidate()   # 出错时失效，下次重建
                raise

        asyncio.run(_execute())
```

#### 好处

| 指标 | 改前 | 改后 |
|------|------|------|
| 每条消息延迟 | +50~200ms（握手） | 接近 0（复用） |
| Gateway 并发连接数 | N 条消息 = N 个连接 | 始终 1 个连接 |
| 连接失败影响 | 消息直接失败 | 自动重连后重试 |
| 资源消耗 | 每次 TCP+WS 握手 | 一次握手长期复用 |

---

### 方案二：对接 Gateway Session

#### 设计

创建 JDUI session 时，同步在 Gateway 创建对应的 session。后续对话使用 `sessionKey` 发消息，由 Gateway 管理上下文，JDUI 只存储展示用的消息副本。

```
JDUI Session (本地)          Gateway Session (远程)
  session_id: "abc123"   ←→   sessionKey: "jdui-abc123"
  messages: [...]              messages: [...] (Gateway 管理)
  profile: "emp-xxx"           agentId: "emp-xxx"
```

#### 实现

**Step 1：Session 对象新增 `openclaw_session_key` 字段**

`api/models.py`：

```python
class Session:
    def __init__(self, ..., openclaw_session_key=None, **kwargs):
        ...
        self.openclaw_session_key = openclaw_session_key  # Gateway session key
```

**Step 2：创建 JDUI session 时同步创建 Gateway session**

`api/routes.py`（`/api/session/new` 处理）：

```python
if parsed.path == "/api/session/new":
    s = new_session(workspace=body.get("workspace"), model=body.get("model"))
    _emp_id = body.get("employee_id", "").strip()
    if _emp_id:
        for _emp in list_employees().get('employees', []):
            if _emp.get('id') == _emp_id:
                s.profile = _emp.get('profile_name', s.profile)
                s.employee_id = _emp_id
                # 新增：为 OpenClaw 员工创建 Gateway session
                if _emp.get('agent_provider') == 'openclaw':
                    try:
                        from api.providers.openclaw_provider import create_gateway_session
                        gw_key = create_gateway_session(
                            agent_id=_emp['profile_name'],
                            session_id=s.session_id,
                        )
                        s.openclaw_session_key = gw_key
                    except Exception as e:
                        print(f'[session] Gateway session creation failed: {e}')
                s.save()
                break
```

**Step 3：`create_gateway_session()` 实现**

`api/providers/openclaw_provider.py`：

```python
def create_gateway_session(agent_id: str, session_id: str) -> str:
    """在 Gateway 创建 session，返回 sessionKey。"""
    cfg = _get_openclaw_config()
    session_key = f"jdui-{session_id}"

    async def _create():
        client = _pool.get_client(cfg)
        result = await client.request("sessions.create", {
            "key": session_key,
            "agentId": agent_id,
            "label": f"JDUI Session {session_id[:8]}",
        })
        return result.get("key", session_key)

    return asyncio.run(_create())
```

**Step 4：发消息时使用 sessionKey**

`api/providers/openclaw_provider.py`（`OpenClawAgent.run()`）：

```python
def run(self, user_message, system_message, conversation_history,
        session_id, personality=None, openclaw_session_key=None):

    async def _execute():
        client = _pool.get_client(self._cfg)

        if openclaw_session_key:
            # 使用 Gateway session，由 Gateway 管理历史
            result = await client.request("chat.send", {
                "sessionKey": openclaw_session_key,
                "text": full_message,
            })
            # 订阅流式事件
            async for event in client.stream_session(openclaw_session_key):
                ...
        else:
            # 降级：无 session key 时走原有路径
            agent = client.get_agent(self._openclaw_agent_id)
            stream = await agent.execute_stream(full_message)
            async for event in stream:
                ...
```

**Step 5：streaming.py 传递 session key**

`api/streaming.py`：

```python
# 从 session 对象读取 openclaw_session_key
_openclaw_session_key = getattr(s, 'openclaw_session_key', None)

_agent_result = _iagent.run(
    user_message=workspace_ctx + msg_text,
    system_message=workspace_system_msg,
    conversation_history=_sanitize_messages_for_api(s.messages),
    session_id=session_id,
    personality=_personality_prompt,
    openclaw_session_key=_openclaw_session_key,  # 新增
)
```

#### 好处

| 指标 | 改前 | 改后 |
|------|------|------|
| 上下文管理 | JDUI 传全量历史，Gateway 不知道 | Gateway 自己管理，真正多轮对话 |
| 消息体大小 | 随对话增长线性增大 | 只传当前消息 |
| 磁盘 I/O | 每次读写全量 messages JSON | 只追加新消息 |
| 对话质量 | 每次单轮，无上下文 | 真正的多轮连续对话 |
| Gateway 功能 | 无法使用 sessions.compact/reset | 可触发上下文压缩 |

---

### 方案三：能力映射到 AgentConfig

#### 设计

将员工的 `capabilities` 字段映射到 `AgentConfig` 的对应字段，使 OpenClaw agent 的行为与 Hermes agent 保持一致。

```
员工 capabilities          AgentConfig 字段
─────────────────────────────────────────────
autoExec: false    →    permission_mode = 'confirm'
autoExec: true     →    permission_mode = 'accept'
memory: true       →    enable_memory = True
memory: false      →    enable_memory = False
knowledge: true    →    skills = SkillsConfig(enabled=True)
search: true       →    tool_policy（允许 web_search 工具）
```

#### 实现

`api/providers/openclaw_provider.py`：

```python
def _build_agent_config(agent_id: str, name: str, description: str,
                         traits: list, capabilities: dict) -> 'AgentConfig':
    from openclaw_sdk import AgentConfig

    caps = capabilities or {}

    # 系统提示词（性格定义）
    lines = [f'你是 {name}，{description}'] if description else [f'你是 {name}']
    if traits:
        lines.append('\n性格特质:')
        for t in traits:
            lines.append(f'- {t}')
    system_prompt = '\n'.join(lines)

    # 权限模式：autoExec 控制是否需要确认
    permission_mode = 'accept' if caps.get('autoExec') else 'confirm'

    # 记忆：memory 能力控制
    enable_memory = bool(caps.get('memory', True))

    # 工具策略：search 能力控制网络搜索
    tool_policy = None
    if not caps.get('search'):
        try:
            from openclaw_sdk import ToolPolicy
            tool_policy = ToolPolicy(deny=['web_search', 'web_fetch'])
        except ImportError:
            pass

    # 技能：knowledge 能力控制文件访问
    skills = None
    if caps.get('knowledge'):
        try:
            from openclaw_sdk import SkillsConfig
            skills = SkillsConfig(enabled=True)
        except ImportError:
            pass

    return AgentConfig(
        agent_id=agent_id,
        name=agent_id,
        system_prompt=system_prompt,
        permission_mode=permission_mode,
        enable_memory=enable_memory,
        tool_policy=tool_policy,
        skills=skills,
    )


def create_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities):
    cfg = _get_openclaw_config()
    config = _build_agent_config(agent_id, name, description, traits, capabilities)

    async def _create():
        client = _pool.get_client(cfg)
        result = client.create_agent(config)
        if asyncio.iscoroutine(result):
            result = await result
        return {'agent_id': agent_id, 'created': True}

    return asyncio.run(_create())
```

同时，员工更新时同步更新 Gateway agent（`api/employees.py`）：

```python
def update_employee(emp_id, body):
    """更新员工信息，同步更新 Gateway agent。"""
    ...
    if emp['agent_provider'] == 'openclaw':
        try:
            from api.providers.openclaw_provider import update_openclaw_agent_on_gateway
            update_openclaw_agent_on_gateway(
                emp['profile_name'],
                emp['name'], emp['description'],
                emp['traits'], emp['capabilities']
            )
        except Exception as e:
            print(f'[employees] OpenClaw agent update failed: {e}')
```

#### 好处

| 能力 | 改前（OpenClaw） | 改后（OpenClaw） | Hermes 对应 |
|------|----------------|----------------|------------|
| `autoExec: false` | 自动执行所有命令 | 危险命令需确认 | terminal 工具不启用 |
| `memory: false` | 仍然记忆 | 不记忆 | memory 工具不启用 |
| `search: false` | 可以搜索 | 禁止搜索 | web 工具不启用 |
| `knowledge: true` | 无文件访问 | 启用技能/文件 | file 工具启用 |

**核心价值：** 用户在创建员工时配置的能力边界，在 Hermes 和 OpenClaw 两个平台上都能生效，行为一致。

---

## 三、实施优先级

| 方案 | 优先级 | 原因 |
|------|--------|------|
| 方案三：能力映射 | P0 | 改动最小，只改 `create_openclaw_agent_on_gateway()`，立即修复用户配置失效问题 |
| 方案一：连接池 | P1 | 改动中等，显著降低延迟，提升稳定性 |
| 方案二：Gateway Session | P2 | 改动最大，需要 Session 模型变更，但解决根本的上下文问题 |

---

## 四、涉及文件

| 文件 | 方案一 | 方案二 | 方案三 |
|------|--------|--------|--------|
| `api/providers/openclaw_provider.py` | ✅ 核心改动 | ✅ 核心改动 | ✅ 核心改动 |
| `api/models.py` | — | ✅ 新增字段 | — |
| `api/routes.py` | — | ✅ session/new | — |
| `api/streaming.py` | — | ✅ 传 session key | — |
| `api/employees.py` | — | — | ✅ update 同步 |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本
