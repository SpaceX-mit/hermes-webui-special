# JDUI 数字员工平台

基于 Hermes Agent 的数字员工管理平台，提供可视化的 AI 员工创建、管理和对话界面。

## 核心功能

- **数字员工管理** — 创建、编辑、删除 AI 数字员工，每个员工拥有独立的性格、记忆和技能
- **多员工并行** — 同时管理多个数字员工，一键切换，各自独立的对话上下文
- **引导式创建** — 环境检测 → 引擎选择 → 员工定制 → 能力配置，三步完成初始化
- **流式对话** — 基于 SSE 的实时流式响应，支持工具调用、审批系统
- **多模型支持** — OpenAI、Anthropic、Google、DeepSeek、OpenRouter 等主流提供商
- **定时任务** — 员工可执行定时任务，离线运行，结果推送到多个平台
- **文件管理** — 内置工作区文件浏览器，支持预览、编辑、上传
- **自主学习** — 员工自动积累记忆和技能，越用越懂你的业务

## 快速开始

### 环境要求

- Python 3.12+
- Linux / macOS / WSL2

### 安装与启动

```bash
# 克隆项目
git clone git@github.com:SpaceX-mit/hermes-webui-special.git
cd hermes-webui-special
git checkout jdui

# 安装依赖
pip3 install -r requirements.txt
pip3 install openai 'anthropic>=0.39.0' python-dotenv fire httpx rich \
  tenacity prompt_toolkit requests jinja2 'pydantic>=2.0' 'PyJWT[crypto]'

# 启动服务
python3 server.py
```

打开浏览器访问 `http://127.0.0.1:8787`，首次进入会自动启动引导向导。

### 局域网访问

```bash
HERMES_WEBUI_HOST=0.0.0.0 python3 server.py
```

其他机器访问 `http://<你的IP>:8787`。建议设置密码：

```bash
HERMES_WEBUI_HOST=0.0.0.0 HERMES_WEBUI_PASSWORD=your-secret python3 server.py
```

### Docker 部署

```bash
docker compose up -d
```

## 数字员工系统

### 创建员工

每个数字员工对应一个独立的 Hermes Profile，拥有：

| 组件 | 说明 |
|------|------|
| SOUL.md | 性格定义文件，由员工描述和特质自动生成 |
| config.yaml | 模型配置和工具集，由能力开关映射 |
| memories/ | 独立的长期记忆 |
| skills/ | 独立的自定义技能 |
| sessions/ | 独立的对话历史 |

### 能力配置

| 能力 | 说明 | 对应工具集 |
|------|------|-----------|
| 联网搜索 | 访问互联网获取实时信息 | web |
| 长期记忆 | 跨会话记住用户偏好和上下文 | memory |
| 自主执行 | 执行终端命令（需审批） | terminal |
| 知识库对接 | 读写工作区文件 | file |

### 性格预设

内置 9 种性格模板：创意文案、数据分析师、客服专员、项目经理、代码审查、会议助手、翻译专家、知识管理、社媒运营。也可自定义描述和特质。

## 项目架构

```
浏览器 (vanilla JS)
    │ HTTP REST + SSE
    ▼
WebUI 后端 (Python, 端口 8787)
    │ Python import
    ▼
Hermes Agent (AI 引擎)
    │ API 调用
    ▼
LLM 提供商 (OpenAI / Anthropic / ...)
```

详细架构文档见 [JDUI/ARCHITECTURE.md](JDUI/ARCHITECTURE.md)。

## 代码结构

### 运行代码（vanilla JS + Python，无需构建）

**前端（`static/`）**

| 文件 | 作用 |
|------|------|
| `jdui.css` | JDUI 主题全部样式，通过 `[data-theme="jdui"]` 门控 |
| `employee.js` | 数字员工数据模型、API 调用、激活/切换逻辑 |
| `onboarding.js` | JDUI 引导向导（环境检测 → 引擎选择 → 创建员工 → 确认 → 加载） |
| `panels.js` | 员工管理面板（列表、添加、编辑、删除）+ 任务/计划面板 |
| `sessions.js` | 员工风格会话列表（头像 + 名称 + 状态 + 删除，按 profile 匹配） |
| `ui.js` | JDUI topbar（员工名/状态/描述）、消息气泡头像、打字指示器 |
| `boot.js` | JDUI 布局切换、员工数据加载、默认主题设置 |
| `index.html` | JDUI 导航栏、员工面板、表单弹窗、任务面板的 HTML 结构 |
| `style.css` | jdui 主题 CSS 变量块 |
| `avatars/` | 7 张员工头像 PNG + Spacemit 三叶 Logo SVG |

**后端（`api/`）**

| 文件 | 作用 |
|------|------|
| `employees.py` | 员工 CRUD + Hermes Profile 同步（SOUL.md、config.yaml、toolsets） |
| `routes.py` | 员工 API 路由（create / update / delete / activate / list） |

### 设计原型（`JDUI/src/`，仅参考，不参与运行）

| 目录 | 作用 |
|------|------|
| `src/app/components/Step1-5*.tsx` | 各引导步骤的 React 原型组件 |
| `src/app/components/Sidebar.tsx` | 侧边栏原型 |
| `src/app/components/ui/` | shadcn/ui 组件库（50+ 组件） |
| `src/imports/` | Figma 导出的 SVG 路径和页面原型 |
| `src/assets/` | 原型用的头像图片 |

### 文档

| 文件 | 说明 |
|------|------|
| `JDUI/ARCHITECTURE.md` | 项目架构（数据流、模块依赖、线程模型） |
| `JDUI/API_GUIDE.md` | 外部开发者 API 对接指南（含 Python / Node.js 示例） |
| `JDUI/TECHNICAL.md` | 技术文档（对接原理、全部 60+ 接口、SSE 协议） |
| `README.md` | 项目总览（本文件） |
| `SETUP.md` | 本地启动指南和常见问题 |

## API 对接

提供完整的 HTTP API，支持外部系统对接：

```bash
# 创建员工
curl -X POST http://localhost:8787/api/employee/create \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"name":"数据分析师","description":"精通数据分析","traits":["严谨"]}'

# 激活员工
curl -X POST http://localhost:8787/api/employee/activate \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"id":"员工ID"}'

# 发送消息
curl -X POST http://localhost:8787/api/chat/start \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"session_id":"会话ID","message":"你好"}'
```

完整 API 文档见 [JDUI/API_GUIDE.md](JDUI/API_GUIDE.md)。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HERMES_WEBUI_HOST` | `127.0.0.1` | 绑定地址，`0.0.0.0` 开放局域网 |
| `HERMES_WEBUI_PORT` | `8787` | 端口 |
| `HERMES_WEBUI_PASSWORD` | 无 | 访问密码 |
| `HERMES_WEBUI_STATE_DIR` | `~/.hermes/webui` | 数据存储目录 |
| `HERMES_WEBUI_AGENT_DIR` | 自动发现 | Hermes Agent 路径 |
| `HERMES_HOME` | `~/.hermes` | Hermes 主目录 |

## 文档

| 文档 | 说明 |
|------|------|
| [SETUP.md](SETUP.md) | 本地启动指南和常见问题 |
| [JDUI/ARCHITECTURE.md](JDUI/ARCHITECTURE.md) | 项目架构（数据流、模块依赖、线程模型） |
| [JDUI/API_GUIDE.md](JDUI/API_GUIDE.md) | 外部开发者 API 对接指南 |
| [JDUI/TECHNICAL.md](JDUI/TECHNICAL.md) | 技术文档（对接原理、全部接口） |

## 技术栈

- 后端：Python 3.12 + 标准库 HTTPServer（无框架）
- 前端：原生 JavaScript + CSS（无构建步骤）
- AI 引擎：Hermes Agent（支持 OpenAI / Anthropic / Google 等）
- 通信：HTTP REST + Server-Sent Events (SSE)
