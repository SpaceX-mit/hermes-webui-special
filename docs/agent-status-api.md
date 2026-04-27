# Agent 状态接口二次开发文档

> 版本：2026-04-27  
> 适用：基于 hermes-webui 做二次开发的前端或第三方系统

---

## 概述

系统提供两个 Agent 状态接口：

| 接口 | 用途 | 推荐轮询间隔 |
|---|---|---|
| `GET /api/agent/status` | 查询**当前正在运行**的 stream，含实时 token 用量 | 2 秒（有活跃 stream 时） |
| `GET /api/agent/lifecycle` | 查询**所有员工**的生命周期状态，不依赖活跃 stream | 5 秒 |

两个接口均返回统一的 `agent_lifecycle` 字段，前端只需读这一个字段即可渲染状态指示器。

---

## 一、`GET /api/agent/status`

### 功能

返回当前所有正在运行的 agent stream。stream 结束后自动从列表消失。

### 请求

```
GET /api/agent/status
```

无请求参数。

### 响应结构

```json
{
  "agents": [ <AgentStreamEntry>, ... ],
  "count": 1
}
```

#### `AgentStreamEntry`

| 字段 | 类型 | 说明 |
|---|---|---|
| `stream_id` | string | 内部 stream 唯一标识 |
| `session_id` | string | 关联的员工 session ID |
| `provider` | string | `"hermes"` 或 `"openclaw"` |
| `model` | string | 当前使用的模型名 |
| `status` | string | 固定为 `"running"` |
| `started_at` | float | 启动时间（Unix timestamp） |
| `elapsed_seconds` | float | 已运行秒数 |
| `agent_lifecycle` | string | 统一生命周期状态（见第三节） |
| `agent_status` | object | Provider 详细状态（见下） |

#### `agent_status`（Hermes provider）

| 字段 | 类型 | 说明 |
|---|---|---|
| `input_tokens` | int | 累计输入 token |
| `output_tokens` | int | 累计输出 token |
| `cache_read_tokens` | int | 缓存命中 token |
| `cache_write_tokens` | int | 缓存写入 token |
| `estimated_cost_usd` | float | 估算费用（USD） |
| `cost_status` | string | `"estimated"` / `"included"` / `"unknown"` |
| `context_length` | int | 模型最大上下文长度 |
| `usage_percent` | float | 上下文使用率（0.0 ~ 1.0） |
| `last_prompt_tokens` | int | 最近一次 prompt 的 token 数 |
| `compression_count` | int | 上下文压缩次数 |
| `interrupted` | bool | 是否被用户中断 |
| `gateway_state` | string\|null | Hermes gateway 进程状态 |
| `active_agents` | int | gateway 当前活跃 agent 数 |
| `exit_reason` | string\|null | gateway 退出原因 |

#### `agent_status`（OpenClaw provider）

| 字段 | 类型 | 说明 |
|---|---|---|
| `openclaw_agent_id` | string | OpenClaw 侧 agent ID |
| `gateway_url` | string | 连接的 gateway WebSocket 地址 |
| `openclaw_session_key` | string | OpenClaw 会话 key |
| `sdk_status` | string | SDK 官方状态（见第三节） |
| `interrupted` | bool | 是否被用户中断 |
| `stop_reason` | string\|null | 上次 turn 结束原因 |
| `aborted_last_run` | bool | 上次 run 是否被中断（来自 gateway） |
| `input_tokens` | int | 累计输入 token |
| `output_tokens` | int | 累计输出 token |
| `cache_read_tokens` | int | 缓存命中 token |
| `estimated_cost_usd` | float | 估算费用（USD） |

### 示例响应

```json
{
  "agents": [
    {
      "stream_id": "a1b2c3d4",
      "session_id": "b5aa2fdc851e",
      "provider": "hermes",
      "model": "claude-sonnet-4-6",
      "status": "running",
      "started_at": 1714180000.0,
      "elapsed_seconds": 12.3,
      "agent_lifecycle": "running",
      "agent_status": {
        "input_tokens": 1200,
        "output_tokens": 340,
        "cache_read_tokens": 800,
        "cache_write_tokens": 200,
        "estimated_cost_usd": 0.0021,
        "cost_status": "estimated",
        "context_length": 200000,
        "usage_percent": 0.006,
        "last_prompt_tokens": 1100,
        "compression_count": 0,
        "interrupted": false,
        "gateway_state": "running",
        "active_agents": 1,
        "exit_reason": null
      }
    }
  ],
  "count": 1
}
```

---

## 二、`GET /api/agent/lifecycle`

### 功能

返回所有已配置员工的生命周期状态。即使没有任何 agent 在运行也能查询，适合做状态指示器的数据源。

### 请求

```
GET /api/agent/lifecycle
GET /api/agent/lifecycle?provider=hermes
GET /api/agent/lifecycle?session_id=b5aa2fdc851e
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `session_id` | string | 否 | 只返回指定 session 的员工 |
| `provider` | string | 否 | 只返回指定 provider（`hermes` / `openclaw`） |

### 响应结构

```json
{
  "lifecycle": [ <LifecycleEntry>, ... ],
  "count": 70
}
```

#### `LifecycleEntry`

| 字段 | 类型 | 说明 |
|---|---|---|
| `employee_id` | string | 员工 ID |
| `employee_name` | string | 员工名称 |
| `session_id` | string | 员工 session ID（与 employee_id 相同） |
| `provider` | string | `"hermes"` 或 `"openclaw"` |
| `agent_lifecycle` | string | 统一生命周期状态（见第三节） |
| `is_active` | bool | 当前是否有活跃 stream |
| `gateway_state` | string\|null | Hermes gateway 原始状态（OpenClaw 为 null） |
| `active_agents` | int | gateway 当前活跃 agent 数 |
| `last_stop_reason` | string\|null | 上次停止原因 |
| `updated_at` | string\|null | 状态最后更新时间（ISO 8601） |

### 示例响应

```json
{
  "lifecycle": [
    {
      "employee_id": "b5aa2fdc851e",
      "employee_name": "测试工程师",
      "session_id": "b5aa2fdc851e",
      "provider": "hermes",
      "agent_lifecycle": "idle",
      "is_active": false,
      "gateway_state": "running",
      "active_agents": 0,
      "last_stop_reason": null,
      "updated_at": "2026-04-27T10:00:00Z"
    },
    {
      "employee_id": "5c1341e89b8a",
      "employee_name": "王老二",
      "session_id": "5c1341e89b8a",
      "provider": "openclaw",
      "agent_lifecycle": "idle",
      "is_active": false,
      "gateway_state": null,
      "active_agents": 0,
      "last_stop_reason": null,
      "updated_at": null
    }
  ],
  "count": 2
}
```

---

## 三、`agent_lifecycle` 状态枚举

所有接口统一使用此枚举，前端只需读这一个字段。

| 值 | 语义 | 推荐颜色 | 推荐图标 |
|---|---|---|---|
| `offline` | 进程不存在 / 连接不通 | `#9ca3af` 灰 | ○ |
| `starting` | 进程启动中，尚未 ready | `#fbbf24` 黄（闪烁） | ◌ |
| `idle` | 在线，无任务运行 | `#4ade80` 绿暗 | ● |
| `running` | turn 正在执行 | `#22c55e` 绿亮（动画） | ● |
| `interrupted` | 上次 turn 被用户中断 | `#f97316` 橙 | ◑ |
| `error` | 启动失败 / 报错退出 | `#ef4444` 红 | ✕ |
| `stopping` | 正在 drain / 关闭中 | `#fbbf24` 黄 | ◌ |

### 推导规则

#### Hermes

```
gateway_state.json 不存在或为空         → offline
gateway_state = "starting"              → starting
gateway_state = "startup_failed"        → error
gateway_state = "draining"              → stopping
gateway_state = "stopped"               → offline
gateway_state = "running" + 有活跃stream → running
gateway_state = "running" + interrupted  → interrupted
gateway_state = "running" + 无任务       → idle
```

#### OpenClaw

```
sdk_status = "error"                    → error
sdk_status = "deleted"                  → offline
有活跃 stream + interrupted = true      → interrupted
有活跃 stream + interrupted = false     → running
stop_reason = "aborted" 或 aborted_last_run = true → interrupted
stop_reason = "error" 或 "timeout"      → error
sdk_status = "idle" / "created" / ""   → idle
sdk_status = "running"（无本地stream）  → running
```

### OpenClaw `sdk_status` 枚举

来自 `openclaw-sdk AgentStatus`：

| 值 | 含义 |
|---|---|
| `created` | agent 刚创建，未运行过 |
| `running` | 正在执行 turn |
| `idle` | 在线，等待任务 |
| `error` | 出错 |
| `deleted` | 已删除 |
| `unknown` | SDK 查询失败（降级值，不影响主流程） |

### OpenClaw `stop_reason` 枚举

来自 `ExecutionResult.stop_reason`：

| 值 | 含义 |
|---|---|
| `complete` | 正常完成 |
| `aborted` | 被用户主动中断 |
| `error` | 执行出错 |
| `timeout` | 超时中止 |

---

## 四、前端集成示例

### 状态指示器（React）

```jsx
const LIFECYCLE_STYLE = {
  offline:     { color: '#9ca3af', label: '离线',   dot: '○' },
  starting:    { color: '#fbbf24', label: '启动中', dot: '◌' },
  idle:        { color: '#4ade80', label: '空闲',   dot: '●' },
  running:     { color: '#22c55e', label: '运行中', dot: '●' },
  interrupted: { color: '#f97316', label: '已中断', dot: '◑' },
  error:       { color: '#ef4444', label: '错误',   dot: '✕' },
  stopping:    { color: '#fbbf24', label: '停止中', dot: '◌' },
};

function AgentStatusDot({ sessionId }) {
  const [lifecycle, setLifecycle] = useState('offline');

  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/agent/lifecycle?session_id=${sessionId}`);
      const data = await res.json();
      const entry = data.lifecycle?.[0];
      if (entry) setLifecycle(entry.agent_lifecycle);
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const s = LIFECYCLE_STYLE[lifecycle] ?? LIFECYCLE_STYLE.offline;
  return (
    <span style={{ color: s.color }} title={s.label}>
      {s.dot} {s.label}
    </span>
  );
}
```

### 实时 token 用量（有活跃 stream 时）

```js
async function pollTokenUsage(sessionId, onUpdate) {
  const res = await fetch('/api/agent/status');
  const data = await res.json();
  const agent = data.agents.find(a => a.session_id === sessionId);
  if (agent) onUpdate(agent.agent_status);
}

// 有 stream 时每 2 秒轮询
const timer = setInterval(() => pollTokenUsage(sessionId, updateUI), 2000);
```

---

## 五、注意事项

1. **`/api/agent/status` 只有活跃 stream 才有数据**，agent 结束后列表为空，不要用它做状态指示器的数据源。
2. **`/api/agent/lifecycle` 的 `agent_lifecycle` 是推导值**，Hermes 依赖 `gateway_state.json` 文件，OpenClaw 依赖 SDK `agent.get_status()` 调用（有 10s 超时，失败时 `sdk_status` 降级为 `"unknown"`，不影响主流程）。
3. **`session_id` 与 `employee_id` 相同**，可互换使用。
4. **`updated_at` 来自 `gateway_state.json`**，OpenClaw 员工此字段为 `null`。
5. **两个接口均无需认证**（未设置 `HERMES_WEBUI_PASSWORD` 时），生产环境建议设置密码。
