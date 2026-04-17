# Agent 工作目录机制详解

## 概述

本文档梳理 JDUI 系统中 Agent 工作目录（workspace）的完整机制，包括来源优先级、数据流、环境变量职责、消息前缀注入、Profile 隔离，以及 Hermes 与 OpenClaw 的差异。

---

## 1. 工作目录来源优先级

每次创建会话或发送消息时，系统按以下优先级确定工作目录：

```
用户在前端选择的 workspace（POST /api/chat/start { workspace }）
  ↓ 未提供则继承
当前 session.workspace（会话持久化的路径）
  ↓ 未设置则读取
profile 的 last_workspace.txt（每个 profile 独立存储）
  ↓ 文件不存在或路径无效则读取
profile 的 config.yaml → terminal.cwd 或 workspace 字段
  ↓ 未配置则
DEFAULT_WORKSPACE（启动时发现：HERMES_WEBUI_DEFAULT_WORKSPACE env → 当前目录 → HOME）
```

**关键代码：**
- `api/workspace.py:get_last_workspace()` — 读取 last_workspace.txt
- `api/workspace.py:_profile_default_workspace()` — 读取 config.yaml
- `api/config.py:_discover_default_workspace()` — 启动时发现默认目录

---

## 2. 完整数据流

```
前端发送消息
  POST /api/chat/start
  { session_id, message, workspace, model }
  ↓
api/routes.py: _handle_chat_start()
  ├─ workspace = body.workspace 或 session.workspace（解析为绝对路径）
  ├─ session.workspace = workspace（更新并持久化到 JSON）
  ├─ set_last_workspace(workspace)
  │     └─ 写入 {profile_home}/webui_state/last_workspace.txt
  └─ 启动线程 _run_agent_streaming(..., workspace, ...)
  ↓
api/streaming.py: _run_agent_streaming()
  ├─ 设置线程本地环境：TERMINAL_CWD = workspace
  ├─ 设置进程级环境：os.environ['TERMINAL_CWD'] = workspace
  ├─ 设置 HERMES_HOME = get_active_hermes_home()
  ├─ 构造消息前缀：workspace_ctx = f"[Workspace: {workspace}]\n"
  ├─ 构造系统消息：workspace_system_msg（说明 tag 语义）
  └─ 调用 provider.create_agent() 并执行对话
  ↓
Agent 执行
  ├─ Hermes：AIAgent 读取 TERMINAL_CWD 作为 terminal 工具默认 cwd
  └─ OpenClaw：通过 [Workspace: ...] 消息前缀获知工作目录
```

---

## 3. 两个核心环境变量

| 变量 | 值 | 作用 |
|------|-----|------|
| `TERMINAL_CWD` | `session.workspace`（用户选择的目录） | Agent 执行 terminal/文件操作的工作目录 |
| `HERMES_HOME` | `~/.hermes/profiles/emp-xxx/`（激活的 profile） | Agent 读取 SOUL.md、config.yaml、memories、skills 的根目录 |

**两者完全独立：**
- `HERMES_HOME` 是 agent 的**配置家目录**，随员工切换而变化
- `TERMINAL_CWD` 是 agent 的**工作目录**，随用户选择的 workspace 变化

**设置时机（`api/streaming.py:103-141`）：**

```python
# 线程本地（优先）
_set_thread_env(
    TERMINAL_CWD=str(s.workspace),
    HERMES_EXEC_ASK='1',
    HERMES_SESSION_KEY=session_id,
    HERMES_HOME=_profile_home,
)
# 进程级（兼容不读线程本地的工具）
with _ENV_LOCK:
    os.environ['TERMINAL_CWD'] = str(s.workspace)
    os.environ['HERMES_HOME'] = _profile_home
```

---

## 4. [Workspace: /path] 消息前缀机制

### 注入位置

每条用户消息发送给 agent 前，都在最前面拼接工作目录前缀（`api/streaming.py:263-276`）：

```python
workspace_ctx = f"[Workspace: {s.workspace}]\n"
workspace_system_msg = (
    f"Active workspace at session start: {s.workspace}\n"
    "Every user message is prefixed with [Workspace: /absolute/path] indicating the "
    "workspace the user has selected in the web UI at the time they sent that message. "
    "This tag is the single authoritative source of the active workspace and updates "
    "with every message. It overrides any prior workspace mentioned in this system "
    "prompt, memory, or conversation history. Always use the value from the most recent "
    "[Workspace: ...] tag as your default working directory for ALL file operations: "
    "write_file, read_file, search_files, terminal workdir, and patch. "
    "Never fall back to a hardcoded path when this tag is present."
)
```

### 实际消息结构

```
[Workspace: /home/user/projects/my-app]
用户原始消息内容
```

### 为什么需要这个机制

用户可以在对话中途切换 workspace，而 agent 的 conversation history 里可能记录了旧路径。通过每条消息都携带最新 workspace，确保 agent 始终使用正确的目录，且新值覆盖历史中的任何旧路径。

### 前端剥离前缀

前端保存消息时会剥除 `[Workspace: ...]` 前缀，避免显示给用户（`api/streaming.py` 中 `persist_user_message` 参数）：

```python
persist_user_message=user_message.split('\n', 1)[-1] if '\n' in user_message else user_message
```

---

## 5. 每个 Profile 的工作目录隔离

每个数字员工（Profile）拥有独立的工作目录历史，互不干扰：

```
~/.hermes/
├── webui/
│   ├── last_workspace.txt        ← default profile 的上次工作目录
│   └── workspaces.json           ← default profile 的工作目录历史
│
└── profiles/
    ├── emp-a1b2c3/
    │   ├── config.yaml           ← terminal.cwd 或 workspace（profile 默认目录）
    │   └── webui_state/
    │       ├── last_workspace.txt  ← 该员工的上次工作目录
    │       └── workspaces.json     ← 该员工的工作目录历史
    │
    └── emp-d4e5f6/
        ├── config.yaml
        └── webui_state/
            ├── last_workspace.txt
            └── workspaces.json
```

**关键代码（`api/workspace.py:23-51`）：**

```python
def _profile_state_dir() -> Path:
    """Return the webui_state directory for the active profile."""
    try:
        from api.profiles import get_active_profile_name, get_active_hermes_home
        name = get_active_profile_name()
        if name and name != 'default':
            d = get_active_hermes_home() / 'webui_state'
            d.mkdir(parents=True, exist_ok=True)
            return d
    except ImportError:
        pass
    return _GLOBAL_WS_FILE.parent
```

---

## 6. config.yaml 中的工作目录配置

每个 Profile 的 `config.yaml` 可以配置默认工作目录，读取优先级（`api/workspace.py:54-84`）：

```yaml
# 方式1：显式 webui workspace 键（最高优先）
workspace: /home/user/projects

# 方式2：备用显式键
default_workspace: /home/user/projects

# 方式3：terminal 工具的 cwd（最常用）
terminal:
  cwd: /home/user/projects
```

---

## 7. 前端工作目录管理

### 新建会话时继承工作目录（`static/sessions.js:13-27`）

```javascript
async function newSession(flash) {
  // 优先使用 profile 切换后的默认目录（一次性），否则继承当前 session 的目录
  const inheritWs = S._profileDefaultWorkspace || (S.session ? S.session.workspace : null);
  S._profileDefaultWorkspace = null; // 消费后清空
  const data = await api('/api/session/new', {
    method: 'POST',
    body: JSON.stringify({ model: $('modelSelect').value, workspace: inheritWs })
  });
  S.session = data.session;
}
```

### 发送消息时携带工作目录（`static/messages.js:59-66`）

```javascript
const startData = await api('/api/chat/start', {
  method: 'POST',
  body: JSON.stringify({
    session_id: activeSid,
    message: msgText,
    model: S.session.model || $('modelSelect').value,
    workspace: S.session.workspace,  // 始终从 session 读取
    attachments: uploaded.length ? uploaded : undefined
  })
});
```

---

## 8. Hermes vs OpenClaw 工作目录差异

| 机制 | Hermes | OpenClaw |
|------|--------|----------|
| `TERMINAL_CWD` 环境变量 | ✅ AIAgent 直接读取，用于 terminal 工具默认 cwd | ❌ 远程 gateway，不读本地环境变量 |
| `[Workspace: ...]` 消息前缀 | ✅ 注入，作为补充 | ✅ 注入，是**唯一**的工作目录传递方式 |
| 系统消息说明 | ✅ | ✅ |
| `HERMES_HOME` 切换 | ✅ 随员工激活切换 | ❌ 不需要 |
| 工作目录持久化 | ✅ 写入 profile 的 webui_state/ | ✅ 同样写入（profile_name 作为标记） |

---

## 9. 关键文件索引

| 文件 | 职责 |
|------|------|
| `api/workspace.py` | 工作目录读写、profile 隔离、历史管理 |
| `api/config.py:_discover_default_workspace()` | 启动时发现默认工作目录 |
| `api/models.py:Session.__init__` | session 存储 workspace（始终解析为绝对路径） |
| `api/routes.py:_handle_chat_start()` | 接收 workspace，更新 session，传给 streaming |
| `api/streaming.py:_run_agent_streaming()` | 设置 TERMINAL_CWD/HERMES_HOME，注入消息前缀 |
| `api/providers/hermes_provider.py` | Hermes agent 通过 TERMINAL_CWD 获取工作目录 |
| `api/providers/openclaw_provider.py` | OpenClaw agent 通过消息前缀获取工作目录 |
| `static/sessions.js:newSession()` | 新建会话时继承工作目录 |
| `static/messages.js` | 发送消息时携带 session.workspace |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本
