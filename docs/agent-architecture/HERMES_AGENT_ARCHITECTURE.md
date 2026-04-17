# Hermes Agent 系统架构全面技术文档

## 概述

Hermes Agent 是一个功能完整的 AI Agent 框架，提供：
- 多平台消息集成（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Email 等）
- 交互式 CLI（prompt_toolkit + Rich 终端 UI）
- 工具化架构（50+ 内置工具）
- 技能系统（可扩展工作流）
- SQLite 会话持久化（FTS5 全文搜索）
- 上下文压缩（长对话自动管理）
- 多 Profile 支持（隔离实例）
- ACP 协议集成（VS Code、Zed、JetBrains IDE 支持）
- Cron 调度（自主任务执行）

**代码规模：** 848 个 Python 文件，20+ 主要子系统

---

## 一、核心架构

### 1.1 入口点

| 入口 | 用途 | 文件 |
|------|------|------|
| **CLI** | 交互式终端界面 | `cli.py`（HermesCLI，9930 行） |
| **Agent Loop** | 核心对话引擎 | `run_agent.py`（AIAgent，10593 行） |
| **Gateway** | 消息平台路由器 | `gateway/run.py`（GatewayRunner） |
| **ACP Server** | IDE 集成 | `acp_adapter/server.py`（HermesACPAgent） |
| **Batch Runner** | 并行轨迹生成 | `batch_runner.py` |
| **Cron Scheduler** | 自主任务执行 | `cron/scheduler.py` |

### 1.2 核心类

**AIAgent**（`run_agent.py`）
- 主对话循环，含工具调用
- 管理消息历史、上下文压缩、token 预算
- 支持多 LLM Provider（OpenAI 兼容 API）
- 最大迭代次数：90（可配置）
- 会话持久化到 SQLite

**HermesCLI**（`cli.py`）
- 基于 prompt_toolkit 的交互式 REPL
- Rich 终端 UI + KawaiiSpinner 动画
- 50+ 斜杠命令分发
- 配置管理和设置向导
- 皮肤/主题引擎

**SessionDB**（`hermes_state.py`，1238 行）
- SQLite 后端，WAL 模式支持并发访问
- FTS5 虚拟表全文搜索
- 存储 session、消息、token 用量、费用
- 线程安全，应用级重试逻辑

**ContextCompressor**（`agent/context_compressor.py`）
- 自动上下文窗口管理
- 中间轮次有损摘要
- 保护头部（系统提示）和尾部（最近消息）
- 多次压缩的迭代摘要更新

**GatewayRunner**（`gateway/run.py`，2000+ 行）
- 管理平台适配器（Telegram、Discord 等）
- 路由消息到对应平台处理器
- 处理 session 重置策略（daily/idle/both）
- Cron 任务交付协调

---

## 二、工具系统

### 2.1 工具注册架构

**注册表模式**（`tools/registry.py`）
- 中央 `ToolRegistry` 单例
- 每个工具文件在 import 时自注册
- 无循环依赖（注册表不导入工具）

**工具发现**（`model_tools.py`，577 行）
- 导入所有工具模块触发注册
- 公共 API：`get_tool_definitions()`、`handle_function_call()`
- 通过持久事件循环桥接异步（防止"Event loop is closed"错误）

### 2.2 工具文件列表（50+）

```
tools/
├── registry.py              # 中央注册表（无依赖）
├── web_tools.py             # web_search, web_extract
├── terminal_tool.py         # terminal, 进程管理
├── file_tools.py            # read_file, write_file, patch, search_files
├── vision_tools.py          # vision_analyze
├── image_generation_tool.py # image_generate
├── browser_tool.py          # 浏览器自动化（Browserbase，3000+ 行）
├── code_execution_tool.py   # execute_code 沙箱
├── delegate_tool.py         # 子 Agent 生成（1500+ 行）
├── memory_tool.py           # 持久记忆
├── skills_tool.py           # 技能管理
├── cronjob_tools.py         # Cron 任务调度
├── mcp_tool.py              # MCP 客户端集成（2000+ 行）
├── session_search_tool.py   # 跨会话全文搜索
└── environments/            # 终端后端（local, docker, ssh, modal 等）
```

### 2.3 Toolset 系统（`toolsets.py`）

- 将工具分组为逻辑集合（web、terminal、browser 等）
- 支持组合（toolset 可包含其他 toolset）
- 每平台预设（CLI、Telegram、Discord 等）
- 动态解析 `resolve_toolset()`

**核心工具集**（`_HERMES_CORE_TOOLS`）：30+ 工具，所有平台可用

### 2.4 工具执行流程

```
用户消息
    ↓
AIAgent.run_conversation()
    ↓
构建系统提示 + 消息历史
    ↓
调用 LLM（携带工具 schema）
    ↓
如果响应含 tool_calls：
    ├─ 对每个 tool_call：
    │   ├─ registry.dispatch(tool_name, args)
    │   ├─ 执行 handler（同步或通过 _run_async 异步）
    │   └─ 将工具结果追加到消息
    └─ 循环回 LLM
    ↓
如果是文本响应：
    ├─ 持久化到 SessionDB
    └─ 返回 final_response
```

---

## 三、系统提示架构

### 3.1 提示构建器（`agent/prompt_builder.py`，1026 行）

系统提示按顺序组合：

```
1.  Identity          → DEFAULT_AGENT_IDENTITY 或 SOUL.md
2.  Platform Hints    → 消息平台指导（Telegram、Discord 等）
3.  Environment Hints → WSL、Termux、Docker 环境检测
4.  Tool Use Enforcement → 模型特定引导（GPT、Gemini 等）
5.  Memory Guidance   → 如何使用持久记忆
6.  Session Search    → 跨会话上下文检索指导
7.  Skills Index      → 可用技能及描述
8.  Nous Subscription → 托管工具可用性
9.  Context Files     → 项目上下文文件
10. Memory Blocks     → 持久用户/环境事实
```

### 3.2 上下文文件优先级（首个匹配生效）

```
1. .hermes.md / HERMES.md    （向上遍历到 git root）
2. AGENTS.md / agents.md     （仅当前目录）
3. CLAUDE.md / claude.md     （仅当前目录）
4. .cursorrules / .cursor/rules/*.mdc （仅当前目录）
```

### 3.3 技能索引缓存

- 两层缓存：进程内 LRU + 磁盘快照
- 快照通过 mtime/size manifest 验证
- 支持外部技能目录
- 基于可用工具/toolset 的条件激活
- 平台特定过滤（macOS、Linux、Windows）

---

## 四、技能系统

### 4.1 技能目录结构

```
skills/
└── category/
    └── skill-name/
        ├── SKILL.md              # 主指令（必需）
        ├── DESCRIPTION.md        # 类别描述（可选）
        └── scripts/              # 辅助脚本（可选）
            └── helper.py
```

### 4.2 SKILL.md 格式

```yaml
---
name: skill-name
description: 简短描述
version: 1.0.0
author: 作者名
platforms: [macos, linux]         # 可选 OS 过滤
required_environment_variables:   # 可选安全配置
  - name: API_KEY
    prompt: 显示名称
    help: 获取方式
metadata:
  hermes:
    tags: [Category, Keywords]
    fallback_for_toolsets: [web]  # 当 toolset 不可用时显示
    requires_toolsets: [terminal] # 仅当 toolset 可用时显示
---

# 技能标题
...
```

### 4.3 技能位置

| 位置 | 用途 | 激活方式 |
|------|------|---------|
| `skills/` | 内置技能 | 始终激活 |
| `optional-skills/` | 官方可选技能 | 通过 hub 发现 |
| `~/.hermes/skills/` | 用户创建技能 | 自动加载 |
| 外部目录 | 第三方技能 | 通过 config 配置 |

### 4.4 条件激活规则

| 规则 | 含义 |
|------|------|
| `fallback_for_toolsets` | 当主 toolset 不可用时显示 |
| `requires_toolsets` | 仅当 toolset 可用时显示 |
| `fallback_for_tools` | 当特定工具不可用时显示 |
| `requires_tools` | 仅当特定工具可用时显示 |
| `platforms` | OS 特定过滤（macos/linux/windows） |

---

## 五、配置系统

### 5.1 配置文件

| 文件 | 用途 | 位置 |
|------|------|------|
| `config.yaml` | 设置（model、terminal、toolsets 等） | `~/.hermes/` |
| `.env` | API Keys 和密钥 | `~/.hermes/` |
| `auth.json` | OAuth 凭证（Nous Portal） | `~/.hermes/` |
| `SOUL.md` | Agent 性格定义 | `~/.hermes/` |

### 5.2 完整 config.yaml Schema

```yaml
model: anthropic/claude-opus-4.6
max_iterations: 90
reasoning_effort: medium

terminal:
  backend: local          # local, docker, ssh, modal, daytona, singularity
  cwd: .
  timeout: 300

compression:
  enabled: true
  threshold_percent: 0.50  # 上下文窗口使用率触发阈值
  protect_first_n: 3       # 保护前 N 轮对话

display:
  skin: default
  tool_progress_command: false
  background_process_notifications: all

skills:
  external_dirs: []
  disabled: []

toolsets:
  enabled: [web, terminal, file, vision, browser, skills]
  disabled: []

platform_toolsets:
  cli:
    - skills
    - web
    - memory
    - terminal
    - file
```

### 5.3 环境变量元数据（`hermes_cli/config.py`）

`OPTIONAL_ENV_VARS` 列表，每项含：
- `description`：用途说明
- `prompt`：交互式提示文本
- `url`：获取方式链接
- `category`：provider / tool / messaging / setting
- 安全收集（密码不回显）

---

## 六、斜杠命令系统

### 6.1 命令注册表（`hermes_cli/commands.py`）

```python
CommandDef(
    name="mycommand",
    description="功能描述",
    category="Session",   # Session, Configuration, Tools & Skills, Info, Exit
    aliases=("mc",),
    args_hint="[arg]",
    cli_only=False,
    gateway_only=False,
    gateway_config_gate="display.tool_progress_command",
)
```

### 6.2 命令分发

| 环境 | 处理位置 |
|------|---------|
| CLI | `HermesCLI.process_command()` in `cli.py` |
| Gateway | `GatewayRunner._handle_command()` in `gateway/run.py` |
| Telegram | `telegram_bot_commands()` 生成 BotCommand 菜单 |
| Slack | `slack_subcommand_map()` 生成 `/hermes` 路由 |
| 自动补全 | `SlashCommandCompleter` 驱动 prompt_toolkit |

### 6.3 添加新斜杠命令（3 步）

1. 在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 添加 `CommandDef`
2. 在 `cli.py` 的 `HermesCLI.process_command()` 添加处理逻辑
3. 在 `gateway/run.py` 的 `GatewayRunner._handle_command()` 添加处理逻辑（如需 gateway 支持）

---

## 七、Gateway 与消息平台

### 7.1 支持的平台（15+）

| 平台 | 文件 | 特性 |
|------|------|------|
| **Telegram** | `gateway/platforms/telegram.py`（3000+ 行） | 线程、媒体、内联按钮 |
| **Discord** | `gateway/platforms/discord.py` | 线程、嵌入、表情回应 |
| **Slack** | `gateway/platforms/slack.py` | 线程、Block Kit、文件上传 |
| **WhatsApp** | `gateway/platforms/whatsapp.py` | 媒体、模板消息 |
| **Signal** | `gateway/platforms/signal.py` | 端对端加密 |
| **Matrix** | `gateway/platforms/matrix.py` | 联邦聊天 |
| **Mattermost** | `gateway/platforms/mattermost.py` | 自托管 Slack 替代 |
| **Email** | `gateway/platforms/email.py` | SMTP/IMAP |
| **SMS** | `gateway/platforms/sms.py` | Twilio 集成 |
| **Home Assistant** | `gateway/platforms/homeassistant.py` | 智能家居控制 |
| **Feishu** | `gateway/platforms/feishu.py` | 飞书 |
| **WeChat** | `gateway/platforms/weixin.py` | 微信 |
| **DingTalk** | `gateway/platforms/dingtalk.py` | 钉钉 |
| **API Server** | `gateway/platforms/api_server.py` | HTTP REST API |
| **Webhook** | `gateway/platforms/webhook.py` | 入站 Webhook |

### 7.2 平台基类（`gateway/platforms/base.py`）

```python
class PlatformAdapter:
    async def connect()        # 建立连接
    async def disconnect()     # 清理资源
    async def send_message()   # 发送给用户
    async def receive()        # 轮询消息
    async def handle_command() # 处理斜杠命令
```

### 7.3 Session 管理（`gateway/session.py`）

- 每用户 session 隔离
- Session 重置策略：daily / idle / both
- 每平台上下文提示注入
- 消息历史持久化

---

## 八、ACP（Agent Client Protocol）集成

### 8.1 ACP Server（`acp_adapter/server.py`）

通过 ACP 协议暴露 Hermes Agent，支持 IDE 集成：
- **VS Code** — Claude Code 扩展
- **Zed** — 内置 Agent 支持
- **JetBrains** — IDE 插件

### 8.2 ACP 组件

| 组件 | 文件 | 用途 |
|------|------|------|
| Server | `acp_adapter/server.py` | 主 ACP Agent 实现 |
| Session Manager | `acp_adapter/session.py` | Session 生命周期 |
| Events | `acp_adapter/events.py` | 流式回调 |
| Auth | `acp_adapter/auth.py` | Provider 检测 |
| Permissions | `acp_adapter/permissions.py` | 工具审批流程 |

### 8.3 ACP 功能

- Session 管理（new、fork、resume、load）
- 模型切换
- 工具可用性报告
- 流式响应
- Thinking/推理显示
- 认证（OAuth、API key）

---

## 九、Cron 调度系统

### 9.1 任务存储（`cron/jobs.py`）

```
~/.hermes/cron/
├── jobs.json              # 任务定义
└── output/
    └── {job_id}/
        └── {timestamp}.md # 任务输出
```

### 9.2 任务 Schema

```json
{
  "id": "uuid",
  "name": "任务名称",
  "prompt": "任务描述",
  "schedule": "0 9 * * *",
  "skills": ["skill-name"],
  "deliver": "telegram",
  "chat_id": "123456",
  "enabled": true,
  "created_at": "2026-04-17T...",
  "last_run": "2026-04-17T..."
}
```

### 9.3 调度格式

| 格式 | 含义 |
|------|------|
| `"30m"` | 30 分钟后执行一次 |
| `"every 30m"` | 每 30 分钟循环 |
| `"0 9 * * *"` | Cron 表达式（5 字段） |
| `"2026-04-17T14:00"` | ISO 时间戳（一次性） |

### 9.4 调度器（`cron/scheduler.py`）

- 后台线程运行，每 60 秒检查任务
- 为每个任务生成 AIAgent 实例
- 将输出交付到配置的平台
- 处理失败和重试

---

## 十、记忆系统

### 10.1 记忆文件（`~/.hermes/memories/`）

| 文件 | 用途 |
|------|------|
| `MEMORY.md` | 持久事实（用户偏好、环境细节） |
| `USER.md` | 用户档案（姓名、偏好、反复纠正） |

### 10.2 记忆工具（`tools/memory_tool.py`）

```python
memory(action="save", key="fact", value="...")
memory(action="load")
memory(action="delete", key="fact")
```

### 10.3 记忆使用指导（系统提示中）

- 保存减少未来引导的持久事实
- 不保存任务进度或会话结果
- 使用 session_search 查找过去的对话记录
- 将复杂工作流保存为技能

---

## 十一、会话持久化

### 11.1 SQLite Schema（`hermes_state.py`）

```sql
sessions
├── id, source, user_id, model, model_config
├── system_prompt
├── parent_session_id        -- 压缩链
├── started_at, ended_at
├── message_count, tool_call_count
├── input_tokens, output_tokens, cache_read_tokens, cache_write_tokens
├── estimated_cost_usd, actual_cost_usd
└── title

messages
├── id, session_id, role
├── content
├── tool_calls (JSON)
├── tool_name, timestamp, token_count
├── reasoning                -- o1/thinking 模型
└── finish_reason

messages_fts (FTS5 虚拟表)
└── 消息内容全文搜索索引
```

### 11.2 跨会话搜索（`tools/session_search_tool.py`）

- FTS5 全文搜索所有历史会话
- 匹配轮次的摘要生成
- 跨会话上下文检索

---

## 十二、上下文压缩

### 12.1 压缩算法（`agent/context_compressor.py`）

```
1. 裁剪旧工具结果  → 替换为占位符（廉价，无需 LLM）
2. 保护头部        → 系统提示 + 前 N 轮对话
3. 保护尾部        → 最近 ~20K tokens
4. 摘要中间部分    → LLM 驱动的有损压缩
5. 迭代更新        → 与上次摘要合并
```

### 12.2 压缩触发条件

- 阈值：上下文窗口使用率达 50%（可配置）
- 最小值：MINIMUM_CONTEXT_LENGTH tokens
- 手动：`/compact` 命令

### 12.3 摘要格式

```
[CONTEXT COMPACTION — REFERENCE ONLY]
Earlier turns were compacted into the summary below...

## Resolved Questions
- ...

## Pending Work
- ...

## Key Decisions
- ...

---
[End of compaction summary]
```

---

## 十三、多 Profile 支持

### 13.1 Profile 机制

- 每个 Profile 有独立的 `HERMES_HOME` 目录
- 通过 `HERMES_HOME` 环境变量设置
- 默认：`~/.hermes`
- Profile：`~/.hermes/profiles/{name}`

### 13.2 Profile 安全编码规则

1. **使用 `get_hermes_home()`** 获取所有 HERMES_HOME 路径
2. **使用 `display_hermes_home()`** 用于用户可见消息
3. **永远不要硬编码 `~/.hermes`**
4. **模块级常量** 在 import 时缓存 `get_hermes_home()`（profile 覆盖后）
5. **Gateway 适配器** 使用 token 锁防止凭证共享

### 13.3 Profile 操作

```bash
hermes -p coder profile list
hermes -p coder profile create
hermes -p coder profile delete
hermes -p coder chat -q "Hello"
```

---

## 十四、Prompt 缓存

### 14.1 Anthropic Prompt Caching（`agent/prompt_caching.py`）

- 对系统提示 + 技能索引应用缓存控制
- 降低重复查询成本
- 缓存 TTL：5 分钟
- 失效条件：toolset 变更、技能更新、记忆变更

### 14.2 缓存失效规则

**对话中途不要破坏缓存：**
- 不修改历史上下文
- 不更改 toolset
- 不重新加载记忆
- 不重建系统提示

破坏缓存会导致成本大幅上升。

---

## 十五、终端后端

### 15.1 支持的后端（`tools/environments/`）

| 后端 | 文件 | 使用场景 |
|------|------|---------|
| **Local** | `local.py` | 直接 shell 执行 |
| **Docker** | `docker.py` | 容器化执行 |
| **SSH** | `ssh.py` | 远程机器执行 |
| **Modal** | `modal.py` | 无服务器 GPU 执行 |
| **Daytona** | `daytona.py` | 开发环境配置 |
| **Singularity** | `singularity.py` | HPC 容器执行 |

### 15.2 Terminal 工具

```python
terminal(
    command="ls -la",
    background=False,
    notify_on_complete=False,
    timeout=300,
    cwd=None,
    env=None,
)
```

---

## 十六、安全机制

### 16.1 安全防护层

| 层次 | 实现 |
|------|------|
| Sudo 密码管道 | `shlex.quote()` 防止 shell 注入 |
| 危险命令检测 | `tools/approval.py` 中的正则模式 |
| Cron 提示注入 | `tools/cronjob_tools.py` 中的扫描器 |
| 写入拒绝列表 | 通过 `os.path.realpath()` 解析的受保护路径 |
| 技能安全守卫 | hub 安装技能的安全扫描器 |
| 代码执行沙箱 | `execute_code` 从环境中剥离 API Keys |
| 容器加固 | Docker：丢弃能力，禁止权限提升 |

### 16.2 上下文文件扫描（`agent/prompt_builder.py`）

检测并阻止以下文件中的提示注入：SOUL.md、AGENTS.md、.cursorrules、.hermes.md

检测模式：
- "ignore previous instructions"
- "do not tell the user"
- "system prompt override"
- HTML 注释注入
- 隐藏 div 注入
- 不可见 Unicode 字符

---

## 十七、皮肤/主题系统

### 17.1 皮肤引擎（`hermes_cli/skin_engine.py`）

数据驱动的 CLI 定制，无需修改代码。

### 17.2 内置皮肤

| 皮肤 | 风格 |
|------|------|
| `default` | 经典 Hermes 金色/kawaii |
| `ares` | 深红/青铜战神主题 |
| `mono` | 简洁灰度单色 |
| `slate` | 冷蓝开发者风格 |

### 17.3 可定制元素

| 元素 | Skin Key |
|------|----------|
| Banner 边框 | `colors.banner_border` |
| Banner 标题 | `colors.banner_title` |
| 响应框边框 | `colors.response_border` |
| Spinner 表情 | `spinner.waiting_faces`, `spinner.thinking_faces` |
| Spinner 动词 | `spinner.thinking_verbs` |
| 工具输出前缀 | `tool_prefix` |
| Agent 名称 | `branding.agent_name` |
| 欢迎消息 | `branding.welcome` |
| 提示符号 | `branding.prompt_symbol` |

### 17.4 用户自定义皮肤

创建 `~/.hermes/skins/<name>.yaml`：
```yaml
name: cyberpunk
description: 霓虹终端主题

colors:
  banner_border: "#FF00FF"
  banner_title: "#00FFFF"

spinner:
  thinking_verbs: ["接入中", "解密中"]

branding:
  agent_name: "赛博 Agent"
```

---

## 十八、开发指南

### 18.1 添加新工具（3 个文件）

**1. 创建 `tools/your_tool.py`：**
```python
from tools.registry import registry

def your_tool(param: str, **kwargs) -> str:
    return json.dumps({"result": "..."})

registry.register(
    name="your_tool",
    toolset="your_toolset",
    schema={
        "name": "your_tool",
        "description": "工具描述",
        "parameters": {
            "type": "object",
            "properties": {"param": {"type": "string"}},
            "required": ["param"],
        },
    },
    handler=lambda args, **kw: your_tool(**args, **kw),
    check_fn=lambda: True,
)
```

**2. 在 `model_tools.py` 的 `_discover_tools()` 列表中添加 import**

**3. 在 `toolsets.py` 中添加到 `_HERMES_CORE_TOOLS` 或新 toolset**

### 18.2 添加技能

```
skills/category/skill-name/
├── SKILL.md
└── scripts/
    └── helper.py
```

### 18.3 添加配置项

1. 在 `hermes_cli/config.py` 的 `DEFAULT_CONFIG` 中添加
2. 递增 `_config_version` 触发迁移
3. 在 `OPTIONAL_ENV_VARS` 中添加元数据

---

## 十九、已知陷阱

| 陷阱 | 说明 |
|------|------|
| 硬编码 `~/.hermes` | 使用 `get_hermes_home()`（代码）和 `display_hermes_home()`（用户消息） |
| 使用 `simple_term_menu` | tmux/iTerm2 渲染 bug，改用 `curses` |
| Spinner 中使用 `\033[K` | 在 prompt_toolkit 下泄漏为字面文本，改用空格填充 |
| 对话中途破坏 prompt 缓存 | 导致成本大幅上升 |
| 在 schema 中硬编码跨工具引用 | 工具可能不可用，在 `get_tool_definitions()` 中动态添加 |
| 测试写入 `~/.hermes/` | 使用 `_isolate_hermes_home` fixture |

---

## 二十、关键文件索引

| 文件 | 行数 | 用途 |
|------|------|------|
| `cli.py` | 9,930 | 交互式 CLI |
| `run_agent.py` | 10,593 | 核心 Agent 循环 |
| `hermes_state.py` | 1,238 | SQLite 会话存储 |
| `agent/prompt_builder.py` | 1,026 | 系统提示组装 |
| `agent/context_compressor.py` | 600+ | 上下文压缩 |
| `model_tools.py` | 577 | 工具编排 |
| `gateway/run.py` | 2,000+ | Gateway 运行器 |
| `gateway/platforms/telegram.py` | 3,000+ | Telegram 适配器 |
| `tools/browser_tool.py` | 3,000+ | 浏览器自动化 |
| `tools/delegate_tool.py` | 1,500+ | 子 Agent 生成 |
| `tools/mcp_tool.py` | 2,000+ | MCP 集成 |
| `hermes_cli/commands.py` | — | 斜杠命令注册表 |
| `toolsets.py` | — | Toolset 定义 |
| `hermes_constants.py` | — | 全局常量（HERMES_HOME 等） |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本
