# LLM Provider 配置与调用流程分析
# LLM Provider Configuration & Usage Flow

---

## 一、Hermes Agent

### 存储位置 / Storage

```
~/.hermes/
├── active_profile                        # 当前激活的 profile 名 (e.g. emp-d17e6b9966bb)
└── profiles/
    └── emp-xxx/
        ├── config.yaml                   # model.provider / model.default / model.base_url
        └── .env                          # API Key (e.g. MINIMAX_CN_API_KEY=sk-...)
```

`config.yaml` 中的 model 配置示例：

```yaml
model:
  provider: minimax-cn
  default: MiniMax-M2.7-highspeed
  base_url: https://api.minimaxi.com/v1
```

### 配置写入流程 / Write Flow

```
WebUI 引导页 / 设置页
        │
        ▼
POST /api/onboarding/setup
  { provider, model, api_key, base_url }
        │
        ├─► config.yaml  ← 写入 model.provider / model.default / model.base_url
        │     api/config._get_config_path()
        │       → active_profile → profiles/emp-xxx/config.yaml
        │
        ├─► .env         ← 写入 PROVIDER_API_KEY=xxx
        │     api/config._get_active_hermes_home()
        │       → profiles/emp-xxx/.env
        │
        └─► os.environ   ← 同步到当前进程，无需重启
              + hermes_cli.config.reload()  ← 刷新 CLI 侧缓存
```

### Agent 调用流程 / Usage Flow

```
WebUI 发送消息
        │
        ▼
api/streaming.py
        │
        ├─► api/config.get_config()
        │     读 active_profile → profiles/emp-xxx/config.yaml
        │     取 model.provider + model.default + model.base_url
        │
        ├─► api/profiles._reload_dotenv()
        │     读 profiles/emp-xxx/.env → 注入 API Key 到 os.environ
        │
        └─► hermes_cli 用 provider + model + api_key 直接发起 LLM 请求
```

### 配置优先级 / Priority

| 优先级 | 来源 |
|--------|------|
| 1 (最高) | `HERMES_CONFIG_PATH` 环境变量 |
| 2 | `active_profile` → `profiles/emp-xxx/config.yaml` |
| 3 (fallback) | `~/.hermes/config.yaml` 全局配置 |

API Key 同理：profile `.env` > 全局 `.env` > 系统环境变量。

---

## 二、OpenClaw Agent

### 存储位置 / Storage

```
~/.openclaw/
├── openclaw.json                         # 全局配置：models.providers + agents.defaults
└── agents/
    └── emp-xxx/
        └── agent/
            ├── models.json               # per-agent provider 列表 + apiKey
            └── auth-profiles.json        # per-agent auth profile (type/key)
```

`models.json` 中的 provider 配置示例：

```json
{
  "providers": {
    "moonshot": {
      "baseUrl": "https://api.moonshot.cn/v1",
      "api": "openai-completions",
      "apiKey": "sk-xxx",
      "models": [{ "id": "kimi-k2.5", ... }]
    }
  }
}
```

### 配置写入流程 / Write Flow

```
WebUI 引导页 (openclaw 平台)
        │
        ▼
POST /api/onboarding/openclaw-llm
  { provider, model, api_key, base_url }
        │
        ▼
api/onboarding.apply_openclaw_llm_config()
        │
        ├─► 构建 Gateway patch:
        │     agents.defaults.llm_model = model
        │     models.providers.openai.apiKey = api_key
        │     models.providers.openai.baseUrl = base_url
        │
        ├─► Gateway RPC: config.patch(patch)   ← WebSocket 调用
        │     Gateway 写入 ~/.openclaw/openclaw.json
        │               + agents/emp-xxx/agent/models.json
        │
        └─► settings.json ← 记录 openclaw_llm_provider / openclaw_llm_model
              (仅用于 WebUI 状态显示，不参与实际调用)
```

### Agent 调用流程 / Usage Flow

```
WebUI 发送消息
        │
        ▼
api/streaming.py → OpenClawProvider.create_agent(session_id, model)
        │
        ├─► _get_openclaw_config()
        │     优先级: OPENCLAW_GATEWAY_URL env > settings.json > ws://127.0.0.1:18789
        │
        ├─► 从 session.profile 找到对应 employee
        │     openclaw_agent_id = emp.profile_name
        │
        ▼
OpenClawAgent.run(message)
        │
        ▼
OpenClawClient.connect(gateway_ws_url, api_key)   ← WebSocket 连接 Gateway
        │
        ▼
client.get_agent(openclaw_agent_id)
        │
        ├─► 有 session_key → agent.conversation(key).say(msg)    # 多轮对话
        └─► 无 session_key → agent.execute_stream(msg)           # 单次流式
                │
                ▼
        Gateway 内部读取 agents/emp-xxx/agent/models.json
        用 apiKey + baseUrl 调用实际 LLM (OpenAI-compatible API)
```

### Gateway 连接管理 / Connection Management

`_GatewayConnection` 是模块级单例，维护一个持久 WebSocket 连接：

- 后台独立线程运行 asyncio event loop
- 同一连接复用，避免每次请求重建
- 配置变更（URL/Key）时自动重连

---

## 三、对比总结 / Comparison

| 维度 | Hermes | OpenClaw |
|------|--------|----------|
| LLM 调用方 | hermes-webui 进程直接调用 | Gateway 进程调用，webui 是 WebSocket 客户端 |
| 配置存储 | `profiles/emp-xxx/config.yaml` + `.env` | `openclaw.json` + `agents/emp-xxx/agent/models.json` |
| 配置写入方式 | 直接写文件 | 通过 Gateway RPC `config.patch` |
| API Key 位置 | `.env` 文件（明文） | `models.json` 的 `apiKey` 字段 |
| 多轮对话上下文 | hermes-webui 维护 session history | Gateway 维护 conversation session（session_key） |
| 支持的 API 格式 | 多种（openrouter/anthropic/openai/minimax 等） | OpenAI-compatible（统一格式） |

---

*文件生成时间：2026-06*
*涉及源码：`api/onboarding.py`, `api/config.py`, `api/profiles.py`, `api/providers/openclaw_provider.py`, `api/streaming.py`*
