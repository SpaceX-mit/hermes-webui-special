# Agent 目录结构与权限机制详解

## 概述

本文档梳理 JDUI 系统中每个创建好的数字员工（Agent）在 Hermes 和 OpenClaw 各自系统里的目录结构、权限模型、功能职责和实现原理。

---

## 一、Hermes Agent：本地 Profile 目录体系

### 1.1 目录结构

每个 Hermes 数字员工对应一个独立的 Profile 目录，位于：

```
~/.hermes/profiles/emp-{12位ID}/
├── SOUL.md              (600) ← 角色定义（性格、特质、工作准则）
├── config.yaml          (600) ← 工具集、模型、终端配置
├── .env                 (600) ← API Keys 等环境变量
├── auth.json            (600) ← 认证令牌
├── auth.lock            (664) ← 认证锁文件
│
├── memories/            (700) ← 长期记忆（agent 自主写入）
├── sessions/            (700) ← 会话历史（hermes-agent 侧存储）
├── logs/                (700) ← 执行日志
├── cron/                (700) ← 定时任务配置和输出
│
├── skills/              (775) ← 技能库（可被其他进程读取）
├── skins/               (775) ← UI 皮肤配置
├── plans/               (775) ← 计划文件
├── workspace/           (775) ← agent 的默认工作目录
├── home/                (775) ← 子进程 HOME 隔离目录
└── webui_state/         (775) ← webui 状态（last_workspace.txt 等）
```

**代码来源：** `api/profiles.py:20-24`

```python
_PROFILE_DIRS = [
    'memories', 'sessions', 'skills', 'skins',
    'logs', 'plans', 'workspace', 'cron',
]
_CLONE_CONFIG_FILES = ['config.yaml', '.env', 'SOUL.md']
```

---

### 1.2 文件权限设计

| 权限 | 文件/目录 | 原因 |
|------|----------|------|
| `600` | `config.yaml`, `.env`, `SOUL.md`, `auth.json` | 含 API Key、密钥、身份定义，仅 owner 可读写 |
| `664` | `auth.lock` | 需要 group 可读以支持协作进程 |
| `700` | `memories/`, `sessions/`, `logs/`, `cron/` | 私密数据，仅 owner 可访问 |
| `775` | `skills/`, `plans/`, `workspace/`, `home/`, `webui_state/` | 共享资源，允许其他进程读取 |

cron 目录的安全加固（`hermes-agent/cron/jobs.py:67-89`）：

```python
def _secure_dir(path):
    path.chmod(0o700)   # owner-only

def _secure_file(path):
    path.chmod(0o600)   # owner-only read/write
```

---

### 1.3 各目录功能详解

#### `SOUL.md` — 角色定义

由 `api/employees.py:_generate_soul_md()` 生成，内容来自员工的 `name`、`description`、`traits`：

```markdown
# 角色设定

你是 数据分析师，精通数据分析和可视化

## 性格特质
- 逻辑严谨
- 数据驱动

## 工作准则
- 保持专业、高效的工作态度
- 根据上下文灵活调整沟通风格
```

hermes-agent 在每次对话时读取（`hermes-agent/agent/prompt_builder.py:load_soul_md()`）：

```python
soul_path = get_hermes_home() / "SOUL.md"
```

#### `config.yaml` — 工具集与模型配置

由 `api/employees.py:_update_profile_toolsets()` 根据员工能力配置写入：

```yaml
platform_toolsets:
  cli:
    - skills      # 基础技能（始终包含）
    - web         # capabilities.search = true
    - memory      # capabilities.memory = true
    - terminal    # capabilities.autoExec = true
    - file        # capabilities.knowledge = true
```

能力到工具集的映射：

| 员工能力 | 工具集 | 功能 |
|---------|--------|------|
| `search: true` | `web` | 网络搜索 |
| `memory: true` | `memory` | 长期记忆读写 |
| `autoExec: true` | `terminal` | 自主执行终端命令 |
| `knowledge: true` | `file` | 知识库文件访问 |
| （始终） | `skills` | 自定义技能调用 |

#### `memories/` — 长期记忆

hermes-agent 的 memory_tool 动态读取（`hermes-agent/tools/memory_tool.py`）：

```python
def get_memory_dir() -> Path:
    return get_hermes_home() / "memories"
```

每个员工的记忆完全隔离，切换员工即切换记忆库。

#### `sessions/` — 会话历史

hermes-agent 侧的会话持久化目录（区别于 webui 的 `~/.hermes/webui/sessions/`）。

#### `skills/` — 技能库

hermes-agent 的 skills_tool 读取（`hermes-agent/tools/skills_tool.py:87-88`）：

```python
HERMES_HOME = get_hermes_home()
SKILLS_DIR = HERMES_HOME / "skills"
```

#### `cron/` — 定时任务

hermes-agent 的 cron/jobs 读取（`hermes-agent/cron/jobs.py:34-37`）：

```python
HERMES_DIR = get_hermes_home().resolve()
CRON_DIR = HERMES_DIR / "cron"
JOBS_FILE = CRON_DIR / "jobs.json"
OUTPUT_DIR = CRON_DIR / "output"
```

---

### 1.4 Profile 创建流程

**入口：** `api/profiles.py:create_profile_api()`（第 325-381 行）

```
create_employee(body)
  ↓
create_profile_api('emp-xxx', clone_from='default', clone_config=True)
  ├─ 验证 profile 名称格式：^[a-z0-9][a-z0-9_-]{0,63}$
  ├─ 创建目录：~/.hermes/profiles/emp-xxx/
  ├─ 创建 8 个子目录（_PROFILE_DIRS）
  └─ 从 default profile 克隆配置文件（config.yaml, .env, SOUL.md）
  ↓
_write_soul_md('emp-xxx', content)
  └─ 覆盖写入 SOUL.md（员工专属角色定义）
  ↓
_update_profile_toolsets('emp-xxx', capabilities)
  └─ 更新 config.yaml 的 platform_toolsets.cli
```

---

### 1.5 Profile 切换机制（HERMES_HOME 切换）

**入口：** `api/profiles.py:switch_profile(name)`（第 153-214 行）

```python
def switch_profile(name: str) -> dict:
    # 1. 检查是否有 agent 正在运行（阻塞切换）
    with STREAMS_LOCK:
        if len(STREAMS) > 0:
            raise RuntimeError('Cannot switch profiles while an agent is running.')

    # 2. 解析 profile 目录
    home = _DEFAULT_HERMES_HOME / 'profiles' / name

    # 3. 设置 HERMES_HOME 环境变量
    os.environ['HERMES_HOME'] = str(home)

    # 4. 猴补丁模块级缓存（解决 import 时快照问题）
    _sk.HERMES_HOME = home
    _sk.SKILLS_DIR = home / 'skills'
    _cj.HERMES_DIR = home
    _cj.CRON_DIR = home / 'cron'

    # 5. 重新加载 .env
    _reload_dotenv(home)

    # 6. 写入 sticky 文件（重启后恢复）
    (base / 'active_profile').write_text(name)

    # 7. 重新加载 config.yaml
    reload_config()
```

**为什么需要猴补丁：** Python 模块在 import 时会把 `HERMES_HOME` 的值快照到模块级变量。切换 profile 后只改 `os.environ` 不够，必须同时更新这些已缓存的变量。

---

### 1.6 Profile 删除

**入口：** `api/employees.py:delete_employee()` → `api/profiles.py:delete_profile_api()`

```python
# 如果删除的是当前激活的 profile，先切换到 default
if name == _active_profile:
    switch_profile('default')

# 删除整个目录树
shutil.rmtree(profile_dir)
```

---

## 二、OpenClaw Agent：远程 Gateway 体系

### 2.1 架构对比

| 维度 | Hermes | OpenClaw |
|------|--------|----------|
| 存储位置 | 本地文件系统 `~/.hermes/profiles/` | 远程 OpenClaw Gateway |
| 创建方式 | 创建本地目录 | 调用 Gateway API |
| 配置载体 | `config.yaml`, `SOUL.md`, `.env` | `AgentConfig`（Gateway 管理） |
| 权限控制 | 文件系统权限（600/700/775） | Gateway 的 `permission_mode` |
| 工具集 | `platform_toolsets.cli` | `tool_policy`, `mcp_servers`, `skills` |
| 记忆 | 本地 `memories/` 目录 | Gateway 内存或 Redis |
| 会话历史 | 本地 `sessions/` 目录 | Gateway 管理 |

---

### 2.2 Gateway 上的 Agent 结构

每个 OpenClaw 数字员工在 Gateway 上对应一个 Agent，由 `AgentConfig` 定义：

```python
AgentConfig(
    agent_id    = 'emp-a1b2c3d4e5f6',   # = employee.profile_name
    name        = 'emp-a1b2c3d4e5f6',   # ASCII-safe，与 agent_id 相同
    system_prompt = '你是 数据分析师，精通数据分析\n性格特质:\n- 逻辑严谨',

    # LLM 配置（Gateway 管理）
    llm_provider = 'anthropic',
    llm_model    = 'claude-sonnet-4-20250514',
    llm_api_key  = None,                 # 使用 Gateway 配置的 key

    # 权限模型
    permission_mode = 'accept',          # accept / confirm / reject

    # 工具配置
    tool_policy  = None,                 # 工具使用策略
    mcp_servers  = None,                 # MCP 服务器配置
    skills       = None,                 # 技能配置

    # 记忆
    enable_memory   = True,
    memory_backend  = 'memory',          # memory / redis
)
```

**system_prompt 生成逻辑（`api/providers/openclaw_provider.py:49-54`）：**

```python
lines = [f'你是 {name}，{description}'] if description else [f'你是 {name}']
if traits:
    lines.append('\n性格特质:')
    for t in traits:
        lines.append(f'- {t}')
system_prompt = '\n'.join(lines)
```

---

### 2.3 Agent 创建流程

**入口：** `api/employees.py:create_employee()` → `create_openclaw_agent_on_gateway()`

```
create_employee(body)  [agent_provider = 'openclaw']
  ↓
create_openclaw_agent_on_gateway(
    agent_id    = 'emp-a1b2c3d4e5f6',
    name        = '数据分析师',
    description = '精通数据分析',
    traits      = ['逻辑严谨'],
    capabilities = {...}
)
  ↓
async OpenClawClient.connect(gateway_ws_url, api_key)
  ↓
client.create_agent(AgentConfig(...))
  ↓
返回 {'agent_id': 'emp-a1b2c3d4e5f6', 'created': True}
```

**注意：** JDUI 不在本地创建任何目录，所有状态由 Gateway 管理。

---

### 2.4 Gateway 连接配置

**配置来源优先级（`api/providers/openclaw_provider.py:17-39`）：**

```
OPENCLAW_GATEWAY_URL 环境变量
  ↓ 未设置则
settings.json 的 openclaw_gateway_url 字段
  ↓ 未设置则
ws://127.0.0.1:18789（默认）
```

同理适用于 `OPENCLAW_API_KEY`。

---

### 2.5 权限模型

OpenClaw 的权限由 Gateway 的 `AgentConfig.permission_mode` 控制：

| 模式 | 行为 |
|------|------|
| `accept` | 自动接受所有工具调用（默认） |
| `confirm` | 危险操作需要用户确认 |
| `reject` | 拒绝所有工具调用 |

JDUI 当前创建 agent 时使用默认值（`accept`），未将员工的 `capabilities` 映射到 `permission_mode`。

---

### 2.6 Agent 执行流程

```
POST /api/chat/start
  ↓
streaming.py: _run_agent_streaming()
  ↓
OpenClawProvider.create_agent(model=session.model, ...)
  ├─ 从 session.profile 查找员工
  └─ openclaw_agent_id = employee.profile_name
  ↓
OpenClawAgent.run(user_message, ...)
  ↓
async OpenClawClient.connect(gateway_ws_url)
  ↓
agent = client.get_agent('emp-a1b2c3d4e5f6')
  ↓
stream = await agent.execute_stream(message)
  ↓
处理事件流：
  AGENT   → on_token(delta)      # 流式输出
  TOOL_CALL → on_tool(name, args) # 工具调用
  DONE    → 提取 token 使用量
  ERROR   → 抛出 RuntimeError
```

---

### 2.7 Agent 删除流程

```
delete_employee(emp_id)
  ↓
delete_openclaw_agent_on_gateway('emp-a1b2c3d4e5f6')
  ↓
async client.delete_agent('emp-a1b2c3d4e5f6')
```

---

## 三、两种体系的完整对比

### 3.1 创建时

| 步骤 | Hermes | OpenClaw |
|------|--------|----------|
| 本地目录 | ✅ `~/.hermes/profiles/emp-xxx/` | ❌ 无 |
| 子目录（8个） | ✅ memories/sessions/skills/... | ❌ 无 |
| SOUL.md | ✅ 生成并写入本地 | ❌ 转为 system_prompt 发送 Gateway |
| config.yaml | ✅ 写入工具集配置 | ❌ 无（Gateway 管理） |
| .env | ✅ 从 default 克隆 | ❌ 无 |
| Gateway API 调用 | ❌ 无 | ✅ `client.create_agent(AgentConfig)` |

### 3.2 运行时

| 机制 | Hermes | OpenClaw |
|------|--------|----------|
| 工作目录 | `TERMINAL_CWD` 环境变量 + 消息前缀 | 仅消息前缀 |
| 配置家目录 | `HERMES_HOME` 切换 | 无 |
| 工具集 | `config.yaml:platform_toolsets.cli` | Gateway `AgentConfig` |
| 记忆 | 本地 `memories/` | Gateway 内存/Redis |
| 技能 | 本地 `skills/` | Gateway `skills` 配置 |
| 性格 | SOUL.md（静态）+ ephemeral_system_prompt（动态） | system_prompt（动态） |

### 3.3 删除时

| 步骤 | Hermes | OpenClaw |
|------|--------|----------|
| 本地目录 | ✅ `shutil.rmtree(profile_dir)` | ❌ 无 |
| Gateway 清理 | ❌ 无 | ✅ `client.delete_agent(agent_id)` |

---

## 四、关键文件索引

| 文件 | 职责 |
|------|------|
| `api/profiles.py` | Hermes Profile 创建、切换、删除、列表 |
| `api/employees.py` | 员工 CRUD，Hermes/OpenClaw 分支逻辑 |
| `api/providers/hermes_provider.py` | Hermes agent 包装，SOUL.md/config.yaml 读取 |
| `api/providers/openclaw_provider.py` | OpenClaw Gateway 连接，AgentConfig 构建 |
| `api/agent_manager.py` | Provider 注册与路由 |
| `api/streaming.py` | 运行时环境变量设置，消息前缀注入 |
| `hermes-agent/agent/prompt_builder.py` | SOUL.md 加载注入 system prompt |
| `hermes-agent/tools/memory_tool.py` | 读取 `HERMES_HOME/memories/` |
| `hermes-agent/tools/skills_tool.py` | 读取 `HERMES_HOME/skills/` |
| `hermes-agent/cron/jobs.py` | 读取 `HERMES_HOME/cron/` |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本
