# Agent 状态体系分析与统一设计

> 文档版本：2026-04-27  
> 涉及代码：`hermes-webui`、`hermes-agent`、`openclaw-sdk`、`openclaw-api-spec`

---

## 一、现状分析

### 1.1 Hermes Agent 状态来源

Hermes Agent 本身**不暴露任何 HTTP API**，状态通过两条路径流出：

#### 路径 A：`gateway_state.json`（进程级，持久化文件）

由 `hermes-agent/gateway/status.py:write_runtime_status()` 写入，路径为 `{HERMES_HOME}/gateway_state.json`。

| 字段 | 类型 | 可能值 | 说明 |
|---|---|---|---|
| `gateway_state` | string | `starting` / `running` / `draining` / `stopped` / `startup_failed` | gateway 进程生命周期 |
| `active_agents` | int | ≥ 0 | 当前正在运行的 agent 数量 |
| `exit_reason` | string \| null | 任意字符串 | 停止原因，停止时才有值 |
| `restart_requested` | bool | true / false | 是否请求了重启 |
| `pid` | int | — | gateway 进程 PID |
| `start_time` | string | ISO 时间 | 进程启动时间 |
| `updated_at` | string | ISO 时间 | 最后更新时间 |
| `platforms` | dict | — | 各平台连接状态，每个平台含 `state` / `error_code` / `error_message` |

#### 路径 B：`run()` 返回值（turn 级，内存）

`hermes-agent/run_agent.py` 每个 turn 结束后返回 dict，由 `hermes_provider.py` 的 `HermesAgent` 持有：

| 字段 | 类型 | 说明 |
|---|---|---|
| `interrupted` | bool | 是否被用户主动中断 |
| `interrupt_message` | string \| null | 中断原因 |
| `input_tokens` | int | 本次 turn 输入 token |
| `output_tokens` | int | 本次 turn 输出 token |
| `cache_read_tokens` | int | 缓存命中 token |
| `cache_write_tokens` | int | 缓存写入 token |
| `reasoning_tokens` | int | 推理 token |
| `estimated_cost_usd` | float | 估算费用 |
| `cost_status` | string | `estimated` / `included` / `unknown` |
| `model` / `provider` / `base_url` | string | 使用的模型信息 |
| `api_calls` | int | 本次 turn API 调用次数 |

#### 路径 C：`context_engine.get_status()`（turn 进行中，内存）

| 字段 | 类型 | 说明 |
|---|---|---|
| `last_prompt_tokens` | int | 最近一次 prompt 的 token 数 |
| `threshold_tokens` | int | 触发压缩的阈值 |
| `context_length` | int | 模型最大上下文长度 |
| `usage_percent` | float | 上下文使用百分比 |
| `compression_count` | int | 已压缩次数 |

#### 当前 `hermes_provider.get_status()` 实际透传的字段

```python
{
    'input_tokens': ...,
    'output_tokens': ...,
    'estimated_cost_usd': ...,
    'context_length': ...,
    'compression_count': ...,
    'last_prompt_tokens': ...,
}
```

**缺失的有价值字段**：`gateway_state`、`active_agents`、`interrupted`、`cache_read_tokens`、`cost_status`、`exit_reason`。

---

### 1.2 OpenClaw Agent 状态来源

OpenClaw 通过 `openclaw-sdk` 对接，状态分三个层次：

#### 层次 A：`AgentStatus` 枚举（`openclaw_sdk/core/constants.py`）

SDK 官方定义，通过 `agent.get_status()` → 调用 gateway `sessions.resolve` 获取：

| 值 | 含义 |
|---|---|
| `created` | agent 对象刚创建，还没跑过 |
| `running` | 正在执行 turn |
| `idle` | 在线，等待任务 |
| `error` | 出错 |
| `deleted` | 已删除 |

#### 层次 B：`ExecutionResult.stop_reason`（`openclaw_sdk/core/types.py`）

每次 turn 结束后由 `agent.execute()` / `execute_stream()` 返回：

| 值 | 含义 |
|---|---|
| `complete` | 正常完成 |
| `aborted` | 被用户中断（DONE 事件里 `state="aborted"`） |
| `error` | 执行出错 |
| `timeout` | 超时中止 |

#### 层次 C：`SessionInfo.aborted_last_run`（`openclaw_sdk/core/types.py`）

布尔值，来自 gateway `sessions.resolve`，表示上一次 run 是否被中断。

#### 层次 D：`SessionRunStatus`（`openclaw-api-spec/gateway/session-utils.types.ts`）

gateway 内部 session 状态，通过 `sessions.list` / `sessions.resolve` 可查：

| 值 | 含义 |
|---|---|
| `running` | turn 正在执行 |
| `done` | 正常完成 |
| `failed` | 执行出错 |
| `killed` | 被用户中断（stopReason = "aborted"） |
| `timeout` | 超时中止 |

#### 层次 E：`TaskStatus`（`openclaw-api-spec/tasks/task-registry.types.ts`）

子任务/工具调用级别：`queued` / `running` / `succeeded` / `failed` / `timed_out` / `cancelled` / `lost`

#### 当前 `openclaw_provider.get_status()` 实际透传的字段

```python
{
    'openclaw_agent_id': ...,
    'gateway_url': ...,
    'interrupted': ...,          # 本地 _interrupted 标志，非 SDK 查询
    'input_tokens': ...,
    'output_tokens': ...,
    'openclaw_session_key': ...,
}
```

**缺失的有价值字段**：`AgentStatus`（SDK 官方状态）、`stop_reason`、`aborted_last_run`、`cache_read_tokens`、`estimated_cost_usd`。

---

### 1.3 当前 `/api/agent/status` 接口的问题

1. **`status` 字段永远是 `"running"`**：只有正在跑的 stream 才在列表里，结束后直接消失，webui 无法区分"正常完成"、"报错退出"、"被中断"。
2. **没有进程级状态**：webui 不知道 Hermes gateway 是否在线，只知道"有没有活跃 stream"。
3. **两个 provider 字段不对齐**：Hermes 有 `estimated_cost_usd`，OpenClaw 没有；OpenClaw 有 `interrupted`，Hermes 没有。
4. **没有历史快照**：只能查当前正在跑的 agent，无法查上一次的结束状态。

---

## 二、统一状态设计

### 2.1 `agent_lifecycle` — 统一 7 态枚举

在 `/api/agent/status` 响应中新增 `agent_lifecycle` 字段，由后端统一推导，webui 只读这一个字段。

| 状态值 | 语义 | 颜色建议 |
|---|---|---|
| `offline` | 进程不存在 / 依赖未安装 / 连接不通 | 灰色 |
| `starting` | 进程启动中，尚未 ready | 黄色（闪烁） |
| `idle` | 在线，无任务运行 | 绿色（暗） |
| `running` | 有 turn 正在执行 | 绿色（亮/动画） |
| `interrupted` | 上一次 turn 被用户主动中断，等待下一条消息 | 橙色 |
| `error` | 启动失败 / 平台连接断开 / turn 报错 | 红色 |
| `stopping` | 正在 drain/关闭中 | 黄色 |

### 2.2 推导规则

#### Hermes 推导逻辑

```
1. is_available() == False
   → offline

2. gateway_state.json 不存在 或 pid 进程不存在
   → offline

3. gateway_state == "starting"
   → starting

4. gateway_state == "startup_failed"
   → error

5. gateway_state == "draining"
   → stopping

6. gateway_state == "running"
   + AGENT_META 有该 session 的活跃 stream
     → running
   + 无活跃 stream
     + 上次 run() 返回 interrupted == True
       → interrupted
     + 上次 run() 返回 exception / error
       → error
     + 其他
       → idle

7. gateway_state == "stopped"
   → offline
```

#### OpenClaw 推导逻辑

```
1. is_available() == False（openclaw_sdk 未安装）
   → offline

2. gateway 连接失败（WebSocket 不通）
   → offline

3. 有活跃 stream（AGENT_META 中存在）
   + _interrupted == False
     → running
   + _interrupted == True（本地标志）
     → interrupted

4. 无活跃 stream
   + SDK agent.get_status() == AgentStatus.RUNNING
     → running（gateway 侧仍在跑，本地 stream 已断）
   + SDK agent.get_status() == AgentStatus.ERROR
     → error
   + stop_reason == "aborted" 或 aborted_last_run == True
     → interrupted
   + stop_reason == "error" 或 stop_reason == "timeout"
     → error
   + AgentStatus.IDLE 或 AgentStatus.CREATED
     → idle
```

### 2.3 扩展后的 `/api/agent/status` 响应结构

```json
{
  "agents": [
    {
      "stream_id": "abc123",
      "session_id": "sess_xyz",
      "provider": "hermes",
      "model": "claude-sonnet-4-6",
      "agent_lifecycle": "running",
      "status": "running",
      "started_at": 1714180000,
      "elapsed_seconds": 12.3,
      "agent_status": {
        "input_tokens": 1200,
        "output_tokens": 340,
        "estimated_cost_usd": 0.0021,
        "cost_status": "estimated",
        "context_length": 200000,
        "usage_percent": 0.8,
        "compression_count": 0,
        "last_prompt_tokens": 1100,
        "cache_read_tokens": 800,
        "cache_write_tokens": 200,
        "interrupted": false,
        "gateway_state": "running",
        "active_agents": 1,
        "exit_reason": null
      }
    },
    {
      "stream_id": "def456",
      "session_id": "sess_abc",
      "provider": "openclaw",
      "model": "main",
      "agent_lifecycle": "idle",
      "status": "running",
      "started_at": 1714179900,
      "elapsed_seconds": 100.0,
      "agent_status": {
        "openclaw_agent_id": "main",
        "gateway_url": "ws://localhost:4000",
        "openclaw_session_key": "agent:main:main",
        "sdk_status": "idle",
        "interrupted": false,
        "stop_reason": "complete",
        "aborted_last_run": false,
        "input_tokens": 500,
        "output_tokens": 120,
        "cache_read_tokens": 300,
        "estimated_cost_usd": 0.0008
      }
    }
  ],
  "count": 2
}
```

### 2.4 新增独立接口：`/api/agent/lifecycle`

用于查询**不依赖活跃 stream** 的 agent 生命周期状态（即使没有任务在跑也能查）：

```
GET /api/agent/lifecycle?session_id=<session_id>
GET /api/agent/lifecycle?provider=hermes
GET /api/agent/lifecycle        （查所有已配置的 employee）
```

响应：

```json
{
  "lifecycle": [
    {
      "session_id": "sess_xyz",
      "employee_id": "emp_001",
      "provider": "hermes",
      "agent_lifecycle": "idle",
      "gateway_state": "running",
      "active_agents": 0,
      "last_stop_reason": null,
      "updated_at": "2026-04-27T10:00:00Z"
    }
  ]
}
```

---

## 三、实现方案

### 3.1 改动清单

| 文件 | 改动内容 |
|---|---|
| `api/providers/hermes_provider.py` | `get_status()` 读 `gateway_state.json`，补充 `gateway_state`、`active_agents`、`exit_reason`、`interrupted`、`cache_read_tokens`、`cost_status` |
| `api/providers/openclaw_provider.py` | `get_status()` 调用 SDK `agent.get_status()`，补充 `sdk_status`、`stop_reason`、`aborted_last_run`、`cache_read_tokens`、`estimated_cost_usd` |
| `api/routes.py` | `/api/agent/status` 公共层加 `agent_lifecycle` 推导逻辑；新增 `/api/agent/lifecycle` 接口 |
| `static/` (webui) | 状态指示器组件读 `agent_lifecycle` 字段，渲染 7 种状态 |

### 3.2 `hermes_provider.get_status()` 改动

```python
def get_status(self) -> dict:
    from api.profiles import get_active_hermes_home
    from hermes_agent.gateway.status import read_runtime_status  # 或直接读 JSON

    usage = self.get_usage()
    gw = {}
    try:
        hermes_home = get_active_hermes_home()
        gw_path = hermes_home / "gateway_state.json"
        if gw_path.exists():
            import json
            gw = json.loads(gw_path.read_text()) or {}
    except Exception:
        pass

    return {
        # token 用量
        'input_tokens': usage.input_tokens,
        'output_tokens': usage.output_tokens,
        'estimated_cost_usd': usage.estimated_cost_usd,
        'cost_status': getattr(self._agent, '_cost_status', 'estimated'),
        'cache_read_tokens': getattr(self._agent, 'session_cache_read_tokens', 0) or 0,
        'cache_write_tokens': getattr(self._agent, 'session_cache_write_tokens', 0) or 0,
        # context
        'context_length': usage.context_length,
        'usage_percent': round(usage.last_prompt_tokens / usage.context_length, 4)
                         if usage.context_length else 0,
        'compression_count': usage.compression_count,
        'last_prompt_tokens': usage.last_prompt_tokens,
        # turn 结束状态
        'interrupted': self._interrupted,
        # gateway 进程状态
        'gateway_state': gw.get('gateway_state'),
        'active_agents': gw.get('active_agents', 0),
        'exit_reason': gw.get('exit_reason'),
    }
```

### 3.3 `openclaw_provider.get_status()` 改动

```python
def get_status(self) -> dict:
    sdk_status = 'unknown'
    aborted_last_run = False
    try:
        from openclaw_sdk.core.constants import AgentStatus
        client, _ = _gw_conn.get(self._cfg)
        agent = client.get_agent(self._openclaw_agent_id)
        # 同步调用（在已有 event loop 里用 run_coroutine_threadsafe）
        status_enum = _gw_conn.run_sync(agent.get_status())
        sdk_status = status_enum.value
        session_info = _gw_conn.run_sync(
            client.gateway.call("sessions.resolve", {"key": self._openclaw_session_key})
        ) if self._openclaw_session_key else {}
        aborted_last_run = session_info.get('abortedLastRun', False)
    except Exception:
        pass

    last_result = getattr(self, '_last_result', None)
    stop_reason = getattr(last_result, 'stop_reason', None) if last_result else None

    return {
        'openclaw_agent_id': self._openclaw_agent_id,
        'gateway_url': self._gateway_url,
        'openclaw_session_key': self._openclaw_session_key,
        'sdk_status': sdk_status,
        'interrupted': self._interrupted,
        'stop_reason': stop_reason,
        'aborted_last_run': aborted_last_run,
        'input_tokens': self._usage.input_tokens,
        'output_tokens': self._usage.output_tokens,
        'cache_read_tokens': getattr(self._usage, 'cache_read_tokens', 0) or 0,
        'estimated_cost_usd': getattr(self._usage, 'estimated_cost_usd', 0) or 0,
    }
```

### 3.4 `routes.py` 推导 `agent_lifecycle`

```python
def _derive_lifecycle(provider: str, meta: dict, agent_status: dict) -> str:
    if provider == 'hermes':
        gw_state = agent_status.get('gateway_state')
        if not gw_state:
            return 'offline'
        if gw_state == 'starting':
            return 'starting'
        if gw_state in ('startup_failed', 'stopped'):
            return 'offline' if gw_state == 'stopped' else 'error'
        if gw_state == 'draining':
            return 'stopping'
        if gw_state == 'running':
            if meta.get('_active'):          # 有活跃 stream
                return 'running'
            if agent_status.get('interrupted'):
                return 'interrupted'
            return 'idle'
        return 'offline'

    elif provider == 'openclaw':
        sdk_status = agent_status.get('sdk_status', '')
        if sdk_status == 'error':
            return 'error'
        if meta.get('_active'):
            return 'interrupted' if agent_status.get('interrupted') else 'running'
        stop_reason = agent_status.get('stop_reason')
        if stop_reason in ('aborted',) or agent_status.get('aborted_last_run'):
            return 'interrupted'
        if stop_reason in ('error', 'timeout'):
            return 'error'
        if sdk_status in ('idle', 'created', ''):
            return 'idle'
        if sdk_status == 'running':
            return 'running'
        return 'offline'

    return 'offline'
```

---

## 四、WebUI 状态展示建议

| `agent_lifecycle` | 图标 | 文字 | 颜色 |
|---|---|---|---|
| `offline` | ○ | 离线 | `#9ca3af`（灰） |
| `starting` | ◌ 闪烁 | 启动中 | `#fbbf24`（黄） |
| `idle` | ● | 空闲 | `#4ade80`（绿暗） |
| `running` | ● 动画 | 运行中 | `#22c55e`（绿亮） |
| `interrupted` | ◑ | 已中断 | `#f97316`（橙） |
| `error` | ✕ | 错误 | `#ef4444`（红） |
| `stopping` | ◌ | 停止中 | `#fbbf24`（黄） |

轮询建议：`/api/agent/lifecycle` 每 5 秒轮询一次（不依赖活跃 stream），`/api/agent/status` 在有活跃 stream 时每 2 秒轮询一次获取 token 用量。
