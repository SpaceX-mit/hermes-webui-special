# Hermes WebUI + JDUI 项目架构文档

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        浏览器 (Frontend)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ boot.js  │ │  ui.js   │ │messages.js│ │sessions.js│ ...      │
│  │ (初始化)  │ │ (核心UI) │ │ (聊天消息) │ │ (会话管理) │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │employee.js│ │panels.js │ │onboarding│  ← JDUI 数字员工层      │
│  │ (员工数据) │ │ (面板交互) │ │ (引导向导) │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│  ┌──────────────────────────────────────┐                       │
│  │  style.css + jdui.css (主题门控样式)   │                       │
│  └──────────────────────────────────────┘                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP REST + SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     server.py (HTTP 服务)                        │
│              ThreadingHTTPServer + Handler                       │
│                    ↓ 路由分发 ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  api/routes.py (60+ 端点)                 │   │
│  │  GET/POST → 分发到各业务模块                                │   │
│  └──────┬───────┬───────┬───────┬───────┬───────┬───────────┘   │
│         │       │       │       │       │       │               │
│  ┌──────┴┐ ┌───┴───┐ ┌─┴──┐ ┌──┴──┐ ┌──┴──┐ ┌──┴───┐          │
│  │models │ │stream-│ │auth│ │empl-│ │prof-│ │onboa-│          │
│  │.py    │ │ing.py │ │.py │ │oyees│ │iles │ │rding │  ...     │
│  │(会话)  │ │(SSE流) │ │(认证)│ │.py  │ │.py  │ │.py   │          │
│  └───────┘ └───┬───┘ └────┘ └──┬──┘ └──┬──┘ └──────┘          │
│                │               │       │                        │
│  ┌─────────────┴───────────────┴───────┴──────────────────┐     │
│  │              api/config.py (全局配置与状态)               │     │
│  │  SESSIONS, STREAMS, CANCEL_FLAGS, AGENT_DIR, ...       │     │
│  └────────────────────────┬───────────────────────────────┘     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ Python import (run_agent.AIAgent)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hermes Agent (AI 引擎)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AIAgent.run_conversation(messages, system_prompt)        │   │
│  │    → 调用 LLM API (OpenAI / Anthropic / Google / ...)    │   │
│  │    → 执行工具 (terminal, file, web, skills, memory)       │   │
│  │    → 流式回调 on_token(), on_tool()                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ SOUL.md  │ │config.yaml│ │ skills/  │ │memories/ │           │
│  │ (性格)    │ │ (模型配置) │ │ (技能)   │ │ (记忆)    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
hermes-webui/
├── server.py                 # 入口：HTTP 服务器（ThreadingHTTPServer）
├── bootstrap.py              # 首次启动引导脚本
├── start.sh                  # Shell 启动包装器
├── requirements.txt          # Python 依赖（仅 pyyaml）
├── docker-compose.yml        # Docker 部署配置
├── Dockerfile                # 容器镜像定义
├── SETUP.md                  # 本地启动指南
│
├── api/                      # ── 后端业务逻辑 ──
│   ├── config.py             # 全局配置、常量、Agent 发现、线程状态
│   ├── routes.py             # 所有 HTTP 端点处理（60+ 路由）
│   ├── streaming.py          # SSE 流引擎、Agent 线程运行器
│   ├── models.py             # Session 数据模型、持久化
│   ├── auth.py               # 认证（Cookie + 密码哈希）
│   ├── employees.py          # 数字员工 CRUD + Profile 同步
│   ├── profiles.py           # Hermes Profile 管理
│   ├── onboarding.py         # 引导向导后端
│   ├── workspace.py          # 工作区文件操作
│   ├── helpers.py            # 工具函数（JSON 响应等）
│   ├── upload.py             # 文件上传处理
│   ├── updates.py            # 版本更新检查
│   ├── startup.py            # 启动辅助（权限修复、依赖安装）
│   ├── gateway_watcher.py    # 实时 SSE 网关监听
│   └── state_sync.py         # 状态同步
│
├── static/                   # ── 前端（原生 JS，无构建步骤）──
│   ├── index.html            # 主 HTML（单页应用）
│   ├── style.css             # 主样式（含 8 个主题）
│   ├── jdui.css              # JDUI 主题样式（[data-theme="jdui"] 门控）
│   ├── boot.js               # 初始化（加载设置、恢复会话）
│   ├── ui.js                 # 核心 UI（DOM 操作、弹窗、下拉框）
│   ├── messages.js           # 消息发送、SSE 接收、渲染
│   ├── sessions.js           # 会话列表、创建、删除、搜索
│   ├── panels.js             # 侧边栏面板（定时任务、技能、记忆、员工）
│   ├── employee.js           # 数字员工数据模型和 API 调用
│   ├── onboarding.js         # 引导向导 UI（含 JDUI 向导）
│   ├── workspace.js          # 文件浏览器 UI
│   ├── commands.js           # 斜杠命令系统
│   ├── i18n.js               # 国际化（中/英/西/德/繁体）
│   ├── icons.js              # SVG 图标
│   ├── login.js              # 登录页
│   └── avatars/              # 员工头像 PNG + Spacemit Logo SVG
│
├── JDUI/                     # ── JDUI 设计原型与文档 ──
│   ├── src/                  # React/Vite 原型代码（参考用）
│   ├── TECHNICAL.md          # 技术文档（对接原理、全部接口）
│   ├── API_GUIDE.md          # 外部开发者 API 对接指南
│   ├── guidelines/           # 设计规范
│   └── jdui_figma.md         # Figma 设计链接
│
└── tests/                    # 测试
```

## 3. 数据流

### 3.1 聊天消息流（核心链路）

```
用户输入 "帮我写个排序算法"
         │
         ▼
[messages.js] send()
  │ 验证 → 上传附件 → 创建 user message
  │
  ▼
POST /api/chat/start ──────────────────────────────────────┐
  body: {session_id, message, model, workspace}            │
         │                                                  │
         ▼                                                  │
[routes.py] 生成 stream_id → 创建 Queue → 启动后台线程       │
  return: {stream_id, session_id}                          │
         │                                                  │
         ▼                                                  │
[messages.js] 打开 EventSource                              │
  GET /api/chat/stream?stream_id=xxx                       │
         │                                                  │
         │              [streaming.py] 后台线程              │
         │                │                                 │
         │                ▼                                 │
         │         设置环境变量 (HERMES_HOME, CWD)            │
         │                │                                 │
         │                ▼                                 │
         │         AIAgent.run_conversation()               │
         │                │                                 │
         │                ▼                                 │
         │         调用 LLM API (Anthropic/OpenAI)          │
         │                │                                 │
         │    on_token("def") → Queue.put(token)           │
         │    on_token(" sort") → Queue.put(token)         │
         │    on_tool("write_file") → Queue.put(tool)      │
         │    ...                                           │
         │    Queue.put(done)                               │
         │                                                  │
         ▼                                                  │
[routes.py] SSE handler 从 Queue 读取 → 写入 HTTP 流        │
         │                                                  │
         ▼                                                  │
[messages.js] EventSource 接收事件                           │
  token → 追加文字到气泡                                      │
  tool  → 显示工具卡片                                        │
  done  → 关闭连接、保存会话                                   │
```

### 3.2 员工切换流

```
用户点击员工卡片
         │
         ▼
[employee.js] _activateEmployee(id)
  POST /api/employee/activate {id}
         │
         ▼
[employees.py] activate_employee()
  │ 查找员工 → 获取 profile_name
  │
  ▼
[profiles.py] switch_profile("emp-xxx")
  │ 验证 profile 存在
  │ 更新 HERMES_HOME 环境变量
  │ 重载 .env 和 config.yaml
  │ 写入 active_profile 标记文件
  │
  ▼
返回 {active: "emp-xxx"}
         │
         ▼
[employee.js] 更新本地状态
  → newSession() 创建新会话
  → syncTopbar() 更新标题栏
  → renderSessionList() 刷新列表
```

## 4. 前端 JS 加载顺序与依赖

```
index.html 按顺序加载：

  i18n.js          ← 国际化（无依赖）
       ↓
  icons.js         ← SVG 图标（无依赖）
       ↓
  ui.js            ← 核心 UI：$(), esc(), api(), renderMessages(), syncTopbar()
       ↓
  workspace.js     ← 文件浏览器（依赖 ui.js 的 api()）
       ↓
  sessions.js      ← 会话管理（依赖 ui.js, workspace.js）
       ↓
  commands.js      ← 斜杠命令（依赖 ui.js）
       ↓
  messages.js      ← 消息发送/SSE（依赖 ui.js, sessions.js）
       ↓
  panels.js        ← 面板交互（依赖 ui.js, sessions.js）
       ↓
  employee.js      ← 员工数据模型（依赖 ui.js）  ← JDUI 层
       ↓
  onboarding.js    ← 引导向导（依赖 ui.js, employee.js）  ← JDUI 层
       ↓
  boot.js          ← 初始化 IIFE（调用以上所有模块）
```

## 5. 后端模块依赖

```
server.py
  ├── api/auth.py
  ├── api/config.py ←──────────── 全局状态中心
  │     ├── SESSIONS, STREAMS     (线程安全的共享状态)
  │     ├── AGENT_DIR             (Agent 目录发现)
  │     └── sys.path.append()     (使 run_agent 可导入)
  ├── api/routes.py ←──────────── 路由分发中心
  │     ├── api/models.py         (Session 模型)
  │     ├── api/streaming.py      (SSE + Agent 运行)
  │     │     └── run_agent.AIAgent  (Hermes Agent 核心)
  │     ├── api/employees.py      (员工 CRUD)
  │     │     └── api/profiles.py    (Profile 同步)
  │     ├── api/onboarding.py
  │     ├── api/workspace.py
  │     └── api/upload.py
  └── api/startup.py
```

## 6. 数据存储

### WebUI 数据（`~/.hermes/webui/`）

| 文件 | 内容 |
|------|------|
| `sessions/{id}.json` | 会话数据（消息、元数据、token 用量） |
| `sessions/_index.json` | 会话索引（O(1) 列表查询） |
| `settings.json` | 用户设置（主题、语言、模型等） |
| `workspaces.json` | 工作区路径列表 |
| `projects.json` | 项目分组 |
| `employees.json` | 数字员工元数据 |

### Agent 数据（`~/.hermes/`）

| 路径 | 内容 |
|------|------|
| `config.yaml` | 默认 Profile 的模型/提供商配置 |
| `.env` | API Key（ANTHROPIC_API_KEY 等） |
| `SOUL.md` | 默认 Profile 的性格文件 |
| `memories/` | Agent 长期记忆 |
| `skills/` | 自定义技能 |
| `cron/jobs.json` | 定时任务 |
| `active_profile` | 当前活跃 Profile 名称 |
| `profiles/{name}/` | 命名 Profile（每个员工一个） |
| `profiles/{name}/SOUL.md` | 该员工的性格定义 |
| `profiles/{name}/config.yaml` | 该员工的模型和工具集配置 |
| `profiles/{name}/memories/` | 该员工的独立记忆 |

## 7. JDUI 层与现有系统的关系

```
┌─────────────────────────────────────────────┐
│              JDUI 层（纯 UI）                 │
│                                              │
│  employee.js    → 员工数据模型 + API 调用      │
│  jdui.css       → 主题样式（[data-theme] 门控）│
│  onboarding.js  → JDUI 引导向导               │
│  panels.js      → 员工管理面板                 │
│                                              │
│  概念映射：                                    │
│  数字员工  ←→  Hermes Profile                 │
│  员工会话  ←→  Session（完全复用）              │
│  核心引擎  ←→  Provider + Model               │
│  能力开关  ←→  config.yaml toolsets           │
│  任务面板  ←→  /api/crons 数据                │
│  计划面板  ←→  session.tool_calls 数据        │
├─────────────────────────────────────────────┤
│         现有 Hermes WebUI（全部保留）           │
│                                              │
│  聊天、会话、文件、定时任务、技能、记忆、         │
│  配置文件、审批、设置、国际化、7 个主题          │
└─────────────────────────────────────────────┘
```

JDUI 通过 `_isJduiTheme()` 判断是否激活，所有 JDUI 行为都在 `data-theme="jdui"` 条件下运行。切换到其他主题时，JDUI 功能完全隐藏，现有功能不受任何影响。

## 8. 线程模型

```
主线程: ThreadingHTTPServer.serve_forever()
  │
  ├── 请求线程 1: GET /api/chat/stream (SSE 长连接，阻塞读 Queue)
  │
  ├── 请求线程 2: POST /api/chat/start (创建 Queue，启动 Agent 线程)
  │
  ├── Agent 线程 1: _run_agent_streaming()
  │     ├── 获取 session 锁（同一会话串行）
  │     ├── 设置线程局部环境变量
  │     ├── AIAgent.run_conversation() (调用 LLM API)
  │     └── 写入 Queue → SSE 线程读取
  │
  ├── Gateway 线程: gateway_watcher (监听 CLI 会话变化)
  │
  └── 请求线程 N: 其他 HTTP 请求（并发处理）

关键锁：
  LOCK           → 保护 SESSIONS 字典
  STREAMS_LOCK   → 保护 STREAMS 字典
  _ENV_LOCK      → 保护 os.environ 写入
  _agent_lock    → 每个 session 一把锁（防止同一会话并发运行）
```
