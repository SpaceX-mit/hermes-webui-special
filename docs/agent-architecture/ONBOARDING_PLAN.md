# 首次运行引导安装方案

## 一、现状分析

### 已有基础设施

| 文件 | 用途 |
|------|------|
| `api/onboarding.py` | 后端引导逻辑（provider 配置、状态检测） |
| `api/config.py` | 模型列表、provider 显示名、settings 持久化 |
| `api/routes.py` | `/api/onboarding/status`、`/api/onboarding/setup`、`/api/onboarding/complete` |
| `static/onboarding.js` | 前端向导 UI |
| `static/boot.js` | 应用初始化时调用 `loadOnboardingWizard()` |

### 现有向导步骤

```
system → setup → workspace → password → finish
```

- `system`：检测 Hermes Agent 是否可用
- `setup`：选择 LLM provider + 填写 API Key
- `workspace`：默认工作目录 + 默认模型
- `password`：可选密码保护
- `finish`：完成确认

### 缺失部分

1. 没有 Agent 平台选择步骤（只支持 Hermes，OpenClaw 完全缺失）
2. OpenClaw 安装引导缺失（SDK 安装 + Gateway 连接配置）
3. LLM 配置只写入 Hermes 的 `config.yaml`，没有 OpenClaw 的 Gateway 配置路径
4. 国内 LLM provider（MiniMax CN、Kimi CN）未在 onboarding 中暴露

---

## 二、新向导流程

### 步骤设计

```
platform → install → llm → workspace → password → finish
```

| 步骤 | 名称 | 内容 | 是否新增 |
|------|------|------|---------|
| 1 | **platform** | 选择 Agent 平台：Hermes / OpenClaw | 新增 |
| 2 | **install** | 安装引导 + 连接验证 | 新增 |
| 3 | **llm** | 配置 LLM Provider + API Key | 改造现有 setup 步骤 |
| 4 | **workspace** | 默认工作目录 + 默认模型 | 保持不变 |
| 5 | **password** | 可选密码保护 | 保持不变 |
| 6 | **finish** | 完成确认 | 保持不变 |

### 步骤跳过规则

- 若检测到平台已安装且可用 → install 步骤显示"已就绪"，可直接跳过
- 若 `HERMES_WEBUI_SKIP_ONBOARDING=1` 且系统 `chat_ready` → 整个向导跳过
- 若用户已完成过 onboarding（`onboarding_completed: true`）→ 不显示向导

---

## 三、步骤详细设计

### 步骤 1：Platform 选择

**UI 布局：**
```
┌─────────────────────────────────────────────────────┐
│  选择 Agent 平台                                     │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Hermes Agent      │  │    OpenClaw         │  │
│  │                     │  │                     │  │
│  │  本地 Python Agent  │  │  Gateway 架构        │  │
│  │  开箱即用           │  │  多平台消息集成       │  │
│  │  ✓ 已检测到         │  │  ✗ 未检测到         │  │
│  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**检测逻辑：**

| 平台 | 检测方式 |
|------|---------|
| Hermes | `from run_agent import AIAgent`（现有 `_HERMES_FOUND`） |
| OpenClaw | `import openclaw_sdk` 成功 + Gateway WebSocket 可达 |

**持久化：** 选择结果写入 `settings.json` 的 `agent_platform` 字段，作为后续创建员工时的默认 `agent_provider`。

**API：**
```
POST /api/onboarding/platform
Body: { "platform": "hermes" | "openclaw" }
```

---

### 步骤 2：Install 引导

#### 2a. Hermes Agent

**已安装（`_HERMES_FOUND = True`）：**
```
✓ Hermes Agent 已就绪
  版本：x.x.x
  路径：/data/workspace2026-new/hermes-agent
[继续 →]
```

**未安装：**
```
Hermes Agent 未检测到，请按以下步骤安装：

  pip install hermes-agent
  # 或从源码安装：
  git clone <repo> && pip install -e .

[重新检测]  ← 每 3 秒轮询 /api/onboarding/install-status
```

#### 2b. OpenClaw

**子步骤 A：SDK 安装**
```
OpenClaw SDK 未检测到：

  pip install openclaw-sdk

[重新检测]
```

**子步骤 B：Gateway 连接配置**
```
Gateway URL:  [ws://127.0.0.1:18789        ]
API Key:      [可选                         ]

[测试连接]  → 成功 ✓ / 失败 ✗（显示错误原因）
```

**API：**
```
GET  /api/onboarding/install-status
     Response: { "hermes": bool, "openclaw_sdk": bool, "openclaw_gateway": bool }

POST /api/onboarding/test-gateway
     Body: { "url": "ws://...", "api_key": "..." }
     Response: { "ok": bool, "error": "..." }
```

---

### 步骤 3：LLM Provider 配置

#### 支持的 Provider 列表

| Provider ID | 显示名 | API Key 环境变量 | Base URL | 默认模型 |
|-------------|--------|----------------|----------|---------|
| `openrouter` | OpenRouter | `OPENROUTER_API_KEY` | — | `anthropic/claude-sonnet-4.6` |
| `anthropic` | Anthropic | `ANTHROPIC_API_KEY` | — | `claude-sonnet-4.6` |
| `openai` | OpenAI | `OPENAI_API_KEY` | `https://api.openai.com/v1` | `gpt-4o` |
| `minimax-cn` | MiniMax（国内）| `MINIMAX_API_KEY` | `https://api.minimax.chat/v1` | `MiniMax-M2.7-highspeed` |
| `kimi-cn` | Kimi（国内）| `MOONSHOT_API_KEY` | `https://api.moonshot.cn/v1` | `kimi-latest` |
| `custom` | 自定义 OpenAI 兼容 | `OPENAI_API_KEY` | 用户填写 | `gpt-4o-mini` |

#### MiniMax CN 模型列表

| 模型 ID | 显示名 |
|---------|--------|
| `MiniMax-M2.7-highspeed` | MiniMax M2.7 Highspeed（默认） |
| `MiniMax-M2.7` | MiniMax M2.7 |
| `MiniMax-M2.5-highspeed` | MiniMax M2.5 Highspeed |
| `MiniMax-M2.5` | MiniMax M2.5 |
| `MiniMax-M2.1` | MiniMax M2.1 |

#### Kimi CN 模型列表

| 模型 ID | 显示名 |
|---------|--------|
| `kimi-latest` | Kimi Latest（默认） |
| `moonshot-v1-128k` | Moonshot v1 128k |
| `moonshot-v1-32k` | Moonshot v1 32k |
| `moonshot-v1-8k` | Moonshot v1 8k |

#### 配置写入路径（按平台分支）

**Hermes Agent：**
```
~/.hermes/profiles/<profile>/config.yaml
  model:
    provider: minimax-cn
    default: MiniMax-M2.7-highspeed
    base_url: https://api.minimax.chat/v1

~/.hermes/profiles/<profile>/.env
  MINIMAX_API_KEY=<key>
```

**OpenClaw（新增）：**
```
通过 Gateway RPC: config.patch
  agents.<agent_id>.llm_provider = "openai"  ← OpenAI 兼容格式
  agents.<agent_id>.llm_model    = "MiniMax-M2.7-highspeed"
  agents.<agent_id>.llm_api_key  = "<key>"
  agents.<agent_id>.llm_base_url = "https://api.minimax.chat/v1"

settings.json:
  openclaw_llm_provider: "minimax-cn"
  openclaw_llm_model: "MiniMax-M2.7-highspeed"
```

**API（修改现有）：**
```
POST /api/onboarding/setup
Body: {
  "platform": "hermes" | "openclaw",
  "provider": "minimax-cn",
  "model": "MiniMax-M2.7-highspeed",
  "api_key": "...",
  "base_url": ""   ← minimax-cn/kimi-cn 由后端自动填充，无需前端传
}
```

---

## 四、后端改动清单

### `api/onboarding.py`

#### 已完成

- [x] `_SUPPORTED_PROVIDER_SETUPS` 新增 `minimax-cn` 和 `kimi-cn`
- [x] `apply_onboarding_setup()` 中 base_url 写入逻辑：`default_base_url` 字段存在时自动写入，不再只处理 `openai` 和 `custom`

#### 待实现

```python
# 新增：平台选择
def apply_platform_selection(platform: str) -> None:
    save_settings({"agent_platform": platform})

# 新增：安装状态检测
def get_install_status() -> dict:
    return {
        "hermes": bool(_HERMES_FOUND),
        "openclaw_sdk": _check_openclaw_sdk(),
        "openclaw_gateway": _check_openclaw_gateway(),
    }

def _check_openclaw_sdk() -> bool:
    try:
        import openclaw_sdk  # noqa: F401
        return True
    except ImportError:
        return False

def _check_openclaw_gateway() -> bool:
    from api.config import load_settings
    url = load_settings().get("openclaw_gateway_url", "ws://127.0.0.1:18789")
    # 尝试 TCP 连接（不做完整 WebSocket 握手，避免阻塞）
    from urllib.parse import urlparse
    import socket
    p = urlparse(url)
    host = p.hostname or "127.0.0.1"
    port = p.port or 18789
    try:
        with socket.create_connection((host, port), timeout=2):
            return True
    except OSError:
        return False

# 新增：Gateway 连接测试
def test_openclaw_gateway(url: str, api_key: str) -> dict:
    # 保存配置
    save_settings({"openclaw_gateway_url": url, "openclaw_api_key": api_key})
    # 测试连接
    ok = _check_openclaw_gateway()
    return {"ok": ok, "error": None if ok else "无法连接到 Gateway"}

# 修改：apply_onboarding_setup() 增加 platform 分支
def apply_onboarding_setup(body: dict) -> dict:
    platform = body.get("platform", "hermes")
    if platform == "openclaw":
        return _apply_openclaw_llm_config(body)
    # 现有 Hermes 逻辑不变
    ...

def _apply_openclaw_llm_config(body: dict) -> dict:
    provider = body.get("provider", "")
    model = body.get("model", "")
    api_key = body.get("api_key", "")
    provider_meta = _SUPPORTED_PROVIDER_SETUPS.get(provider, {})
    base_url = provider_meta.get("default_base_url", "")

    # 写入 settings.json 供 openclaw_provider.py 读取
    save_settings({
        "openclaw_llm_provider": provider,
        "openclaw_llm_model": model,
        "openclaw_llm_api_key": api_key,
        "openclaw_llm_base_url": base_url,
    })
    # 通过 Gateway config.patch 同步（后台线程，不阻塞）
    import threading
    threading.Thread(
        target=_sync_openclaw_gateway_llm,
        args=(provider, model, api_key, base_url),
        daemon=True,
    ).start()
    save_settings({"onboarding_completed": True})
    return get_onboarding_status()
```

### `api/routes.py`

新增三个路由：

```python
# 平台选择
if parsed.path == "/api/onboarding/platform":
    from api.onboarding import apply_platform_selection
    apply_platform_selection(body.get("platform", "hermes"))
    return j(handler, {"ok": True})

# 安装状态轮询
if parsed.path == "/api/onboarding/install-status":
    from api.onboarding import get_install_status
    return j(handler, get_install_status())

# Gateway 连接测试
if parsed.path == "/api/onboarding/test-gateway":
    from api.onboarding import test_openclaw_gateway
    result = test_openclaw_gateway(body.get("url", ""), body.get("api_key", ""))
    return j(handler, result)
```

### `api/config.py`

#### 已完成

- [x] `_PROVIDER_DISPLAY` 新增 `"minimax-cn": "MiniMax（国内）"` 和 `"kimi-cn": "Kimi（国内）"`

---

## 五、前端改动清单

### `static/onboarding.js`

#### 步骤数组

```javascript
// 现有
ONBOARDING.steps = ['system', 'setup', 'workspace', 'password', 'finish'];

// 新
ONBOARDING.steps = ['platform', 'install', 'llm', 'workspace', 'password', 'finish'];
```

#### 新增函数

```javascript
// 步骤 1：平台选择
function renderPlatformStep(status) {
    // 渲染两张卡片：Hermes / OpenClaw
    // 卡片显示检测状态（已安装 ✓ / 未安装 ✗）
    // 点击选中后 POST /api/onboarding/platform
}

// 步骤 2：安装引导
function renderInstallStep(platform, status) {
    if (platform === 'hermes') {
        renderHermesInstallStep(status);
    } else {
        renderOpenClawInstallStep(status);
    }
}

function renderHermesInstallStep(status) {
    // 已安装：显示版本信息 + 继续按钮
    // 未安装：显示 pip install 命令 + 轮询检测按钮
}

function renderOpenClawInstallStep(status) {
    // 子步骤 A：SDK 安装检测
    // 子步骤 B：Gateway URL + API Key 输入 + 测试连接
}

// 安装状态轮询（每 3 秒）
function startInstallPolling() {
    const timer = setInterval(async () => {
        const s = await fetch('/api/onboarding/install-status').then(r => r.json());
        if (s.hermes || (s.openclaw_sdk && s.openclaw_gateway)) {
            clearInterval(timer);
            renderInstallStep(ONBOARDING.platform, s);
        }
    }, 3000);
}
```

#### 修改函数

```javascript
// 原 renderSetupStep() → 改名为 renderLlmStep()
// 新增：根据 ONBOARDING.platform 决定写入目标
// 新增：provider 列表中显示 minimax-cn 和 kimi-cn
// minimax-cn / kimi-cn 的 base_url 字段隐藏（后端自动填充）
function renderLlmStep(status) {
    // provider 下拉：openrouter / anthropic / openai / minimax-cn / kimi-cn / custom
    // 选中 minimax-cn 或 kimi-cn 时：
    //   - 不显示 base_url 输入框（后端自动填充）
    //   - API Key 标签改为对应的变量名（MINIMAX_API_KEY / MOONSHOT_API_KEY）
    //   - 显示获取 Key 的链接
}
```

---

## 六、`api/routes.py` 新增路由

```python
# 平台选择
if parsed.path == '/api/onboarding/platform':
    from api.onboarding import apply_platform_selection
    apply_platform_selection(body.get('platform', 'hermes'))
    return j(handler, {'ok': True})

# 安装状态检测
if parsed.path == '/api/onboarding/install-status':
    from api.onboarding import get_install_status
    return j(handler, get_install_status())

# Gateway 连接测试
if parsed.path == '/api/onboarding/test-gateway':
    from api.onboarding import test_openclaw_gateway
    result = test_openclaw_gateway(body.get('url', ''), body.get('api_key', ''))
    return j(handler, result)
```

---

## 七、settings.json 新增字段

```json
{
  "onboarding_completed": false,
  "agent_platform": "hermes",
  "openclaw_gateway_url": "ws://127.0.0.1:18789",
  "openclaw_api_key": "",
  "openclaw_llm_provider": "",
  "openclaw_llm_model": ""
}
```

`agent_platform` 字段与现有 `api/employees.py` 中的 `agent_provider` 字段对齐，onboarding 完成后创建员工时作为默认值。

---

## 八、OpenClaw LLM 配置写入机制

OpenClaw 的 LLM 配置通过 Gateway `config.patch` RPC 写入，不写本地文件。

```python
def _apply_openclaw_llm_config(provider: str, model: str, api_key: str, base_url: str):
    from api.providers.openclaw_provider import _gw_conn, _get_openclaw_config

    cfg = _get_openclaw_config()

    async def _patch():
        client, _ = _gw_conn.get(cfg)
        patch = {
            'models': {
                'providers': {
                    provider: {
                        'apiKey': api_key,
                        'baseUrl': base_url or None,
                    }
                }
            },
            'agents': {
                'defaults': {
                    'llm_provider': 'openai',   # OpenAI 兼容格式
                    'llm_model': model,
                }
            }
        }
        result = client.gateway.request('config.patch', {'patch': patch})
        if asyncio.iscoroutine(result):
            await result

    _gw_conn.run(_patch())
    # 同时保存到 settings.json 供状态展示
    save_settings({
        'openclaw_llm_provider': provider,
        'openclaw_llm_model': model,
    })
```

---

## 九、实现优先级

| 优先级 | 任务 | 文件 | 状态 |
|--------|------|------|------|
| P0 | `_SUPPORTED_PROVIDER_SETUPS` 新增 minimax-cn / kimi-cn | `api/onboarding.py` | ✅ 已完成 |
| P0 | base_url 写入逻辑修复（支持 default_base_url） | `api/onboarding.py` | ✅ 已完成 |
| P0 | `_PROVIDER_DISPLAY` 新增 minimax-cn / kimi-cn | `api/config.py` | ✅ 已完成 |
| P1 | 新增 `platform` 步骤 UI + `/api/onboarding/platform` 路由 | `onboarding.js` / `routes.py` | 待实现 |
| P1 | 新增 `install` 步骤 UI + 安装状态轮询 | `onboarding.js` | 待实现 |
| P1 | `/api/onboarding/install-status` 路由 | `routes.py` / `onboarding.py` | 待实现 |
| P1 | OpenClaw Gateway 连接测试 `/api/onboarding/test-gateway` | `routes.py` / `onboarding.py` | 待实现 |
| P2 | `renderLlmStep()` 支持 platform 分支（Hermes vs OpenClaw 写入路径） | `onboarding.js` | 待实现 |
| P2 | OpenClaw LLM 配置通过 `config.patch` 写入 Gateway | `onboarding.py` | 待实现 |

---

## 十、关键设计决策

1. **两个平台可以共存**，onboarding 只设置默认平台，不影响后续在员工管理中切换
2. **minimax-cn / kimi-cn 的 base_url 由后端自动填充**，前端不需要展示输入框，降低用户认知负担
3. **OpenClaw LLM 配置写入 Gateway**（`config.patch`），不写本地文件，与 OpenClaw 的配置中心化原则一致
4. **安装检测失败不阻塞**，用户可以跳过 install 步骤，后续在设置页手动配置
5. **`agent_platform` 持久化到 `settings.json`**，与现有 `agent_provider` 字段命名对齐，onboarding 完成后作为创建员工的默认值
6. **base_url 写入逻辑统一**：`requires_base_url=True` → 用户填写；`default_base_url` 存在 → 后端自动写入；两者都没有 → 清除 base_url 字段


### `static/onboarding.js`

#### 步骤数组

```javascript
// 修改前
ONBOARDING.steps = ['system', 'setup', 'workspace', 'password', 'finish'];

// 修改后
ONBOARDING.steps = ['platform', 'install', 'llm', 'workspace', 'password', 'finish'];
```

#### 新增函数

```javascript
// 步骤 1：平台选择
function renderPlatformStep(status) { ... }

// 步骤 2：安装引导（含轮询）
function renderInstallStep(platform, status) {
    // 每 3 秒轮询 /api/onboarding/install-status
    const timer = setInterval(async () => {
        const s = await fetch('/api/onboarding/install-status').then(r => r.json());
        if (platform === 'hermes' && s.hermes) { clearInterval(timer); nextStep(); }
        if (platform === 'openclaw' && s.openclaw_sdk && s.openclaw_gateway) {
            clearInterval(timer); nextStep();
        }
    }, 3000);
}

// Gateway 连接测试
async function testGatewayConnection(url, apiKey) {
    const r = await fetch('/api/onboarding/test-gateway', {
        method: 'POST',
        body: JSON.stringify({ url, api_key: apiKey }),
    }).then(r => r.json());
    return r;
}
```

#### 修改函数

```javascript
// renderSetupStep → renderLlmStep
// 增加 platform 参数，根据平台决定写入目标
function renderLlmStep(platform, status) {
    // provider 选择 UI 不变
    // 提交时 body 增加 platform 字段
    body.platform = ONBOARDING.selectedPlatform;
}
```

---

## 六、settings.json 新增字段

```json
{
  "agent_platform": "hermes",           // 默认 agent 平台
  "openclaw_gateway_url": "ws://127.0.0.1:18789",
  "openclaw_api_key": "",
  "openclaw_llm_provider": "minimax-cn",
  "openclaw_llm_model": "MiniMax-M2.7-highspeed",
  "openclaw_llm_api_key": "",
  "openclaw_llm_base_url": "https://api.minimax.chat/v1"
}
```

---

## 七、关键设计决策

1. **平台选择持久化**：`agent_platform` 写入 `settings.json`，后续创建员工时作为默认 `agent_provider`，两个平台可共存，onboarding 只设默认值。

2. **安装检测不阻塞**：install 步骤失败不阻止用户继续，可点"跳过"进入下一步，后续手动配置。

3. **base_url 自动填充**：`minimax-cn` 和 `kimi-cn` 的 base_url 由后端 `default_base_url` 字段自动写入，前端无需展示 base_url 输入框（`requires_base_url: false`）。

4. **OpenClaw LLM 配置双写**：同时写入 `settings.json`（供 `_get_openclaw_config()` 读取）和通过 Gateway `config.patch` 同步（后台线程，不阻塞响应）。

5. **Gateway 连接测试用 TCP 探测**：不做完整 WebSocket 握手，只做 TCP connect，避免阻塞和超时问题，2 秒超时。

6. **现有 Hermes onboarding 逻辑零改动**：所有新逻辑通过 `platform` 字段分支，不影响现有 Hermes 流程。

---

## 八、文件改动汇总

| 文件 | 改动类型 | 内容 |
|------|---------|------|
| `api/onboarding.py` | 修改 | 新增 `minimax-cn`、`kimi-cn` provider；base_url 写入逻辑通用化；新增 4 个函数 |
| `api/config.py` | 修改 | `_PROVIDER_DISPLAY` 新增 2 个显示名 |
| `api/routes.py` | 修改 | 新增 3 个路由 |
| `static/onboarding.js` | 修改 | 步骤数组改为 6 步；新增 3 个渲染函数；修改 1 个函数 |

已完成（本次提交）：
- `api/onboarding.py` — provider 新增 + base_url 逻辑
- `api/config.py` — 显示名新增

待实现：
- `api/onboarding.py` — 4 个新函数
- `api/routes.py` — 3 个新路由
- `static/onboarding.js` — 前端向导改造
