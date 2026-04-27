# OpenClaw Cron 任务对接设计文档

> 版本：2026-04-27  
> 涉及代码：`hermes-webui`、`openclaw-sdk`、`openclaw-api-spec`

---

## 一、调查结论

### 1.1 OpenClaw Cron 的架构

**OpenClaw 的定时任务完全由 OpenClaw Gateway 自己管理**，不依赖任何外部调度器：

- **存储**：`~/.openclaw/cron/jobs.json`（gateway 侧，权限 `0o600`）
- **执行**：gateway 内部 timer 每分钟 tick，到期自动触发 agent turn
- **API**：通过 WebSocket RPC 协议暴露 `cron.*` 方法，SDK 封装为 `client.schedules.*`

webui 只需调用 SDK，**不需要实现任何执行器、存储、或调度逻辑**。

### 1.2 与 Hermes Cron 的对比

| 维度 | Hermes | OpenClaw |
|---|---|---|
| 存储位置 | `~/.hermes/cron/jobs.json` | `~/.openclaw/cron/jobs.json` |
| 执行器 | hermes-agent scheduler（webui 触发） | openclaw gateway 内部 timer |
| API 调用方式 | Python 函数调用（`cron.jobs.create_job()`） | WebSocket RPC（`cron.add`） |
| SDK 封装 | 无（直接调函数） | `client.schedules.create_schedule()` |
| webui 需要实现执行器 | 否（hermes-agent 负责） | 否（gateway 负责） |

### 1.3 OpenClaw SDK 的 cron 入口

```python
# openclaw-sdk/src/openclaw_sdk/core/client.py
client.schedules  # → ScheduleManager

# openclaw-sdk/src/openclaw_sdk/scheduling/manager.py
await client.schedules.list_schedules()
await client.schedules.create_schedule(config)
await client.schedules.update_schedule(job_id, patch)
await client.schedules.delete_schedule(job_id)
await client.schedules.run_now(job_id)
await client.schedules.get_runs(job_id)
await client.schedules.cron_status()
```

底层通过 `gateway.call("cron.add", params)` 等 RPC 调用，HTTP 映射为 `POST /v1/cron`。

---

## 二、OpenClaw Cron API 完整规范

### 2.1 `cron.add` — 创建任务

**请求参数**（`CronAddParamsSchema`）：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `name` | string | ✅ | 任务名称 |
| `schedule` | CronSchedule | ✅ | 调度配置（见 2.4） |
| `sessionTarget` | string | ✅ | 执行会话目标（见 2.5） |
| `wakeMode` | string | ✅ | `"now"` / `"next-heartbeat"` |
| `payload` | CronPayload | ✅ | 执行内容（见 2.6） |
| `agentId` | string | 否 | 指定 agent（默认 `"main"`） |
| `sessionKey` | string | 否 | 指定 session key |
| `description` | string | 否 | 任务描述 |
| `enabled` | bool | 否 | 默认 `true` |
| `deleteAfterRun` | bool | 否 | 执行一次后自动删除（一次性任务） |
| `delivery` | CronDelivery | 否 | 结果投递配置（见 2.7） |
| `failureAlert` | CronFailureAlert | 否 | 失败告警配置（见 2.8） |

**响应**：返回完整的 `CronJob` 对象（含 `id`、`state` 等）。

### 2.2 `cron.update` — 更新任务

```json
{
  "id": "<job_id>",
  "patch": {
    "name": "新名称",
    "enabled": false,
    "schedule": {"kind": "cron", "expr": "0 10 * * *"},
    "payload": {"kind": "agentTurn", "message": "新指令"}
  }
}
```

`patch` 字段均为可选，只传需要修改的字段。

### 2.3 其他方法

| 方法 | 参数 | 说明 |
|---|---|---|
| `cron.list` | `{includeDisabled, limit, offset, query, enabled, sortBy, sortDir}` | 列出任务 |
| `cron.remove` | `{id}` | 删除任务 |
| `cron.run` | `{id, mode: "force"\|"due"}` | 立即触发执行 |
| `cron.runs` | `{id, limit, offset, statuses, sortDir}` | 查询执行历史 |
| `cron.status` | `{}` | 查询 cron 服务状态 |

### 2.4 `CronSchedule` — 调度格式

#### 一次性执行（`at`）

```json
{"kind": "at", "at": "2026-05-01T09:00:00Z"}
{"kind": "at", "at": "20m"}
```

`at` 支持 ISO 8601 绝对时间或相对时间（如 `"20m"` = 20 分钟后）。

#### 固定间隔（`every`）

```json
{"kind": "every", "everyMs": 3600000}
{"kind": "every", "everyMs": 86400000, "anchorMs": 1714550400000}
```

| 间隔 | `everyMs` |
|---|---|
| 每 5 分钟 | `300000` |
| 每小时 | `3600000` |
| 每天 | `86400000` |
| 每周 | `604800000` |

#### Cron 表达式（`cron`）

```json
{"kind": "cron", "expr": "0 9 * * *"}
{"kind": "cron", "expr": "0 9 * * 1-5", "tz": "Asia/Shanghai"}
{"kind": "cron", "expr": "*/15 * * * *", "staggerMs": 30000}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `expr` | string | 标准 5 字段 cron 表达式 |
| `tz` | string | IANA 时区（默认 UTC） |
| `staggerMs` | int | 随机抖动窗口（毫秒），0 = 精确执行 |

常用表达式：

| 表达式 | 含义 |
|---|---|
| `"0 9 * * *"` | 每天早上 9:00 |
| `"0 9 * * 1-5"` | 工作日早上 9:00 |
| `"*/15 * * * *"` | 每 15 分钟 |
| `"0 0 1 * *"` | 每月 1 号午夜 |
| `"0 6 * * 1"` | 每周一早上 6:00 |

### 2.5 `sessionTarget` — 执行会话目标

| 值 | 含义 | 适用场景 |
|---|---|---|
| `"isolated"` | 每次创建独立会话（`cron:<jobId>`） | 推荐，任务间互不干扰 |
| `"main"` | 在主会话的下一个心跳时执行 | 需要访问主会话上下文 |
| `"current"` | 在创建时绑定的会话中执行 | 特定会话的定期任务 |
| `"session:xxx"` | 在指定持久化会话中执行 | 自定义会话 key |

### 2.6 `CronPayload` — 执行内容

#### Agent Turn（最常用）

```json
{
  "kind": "agentTurn",
  "message": "检查系统状态并汇报",
  "model": "claude-sonnet-4-6",
  "timeoutSeconds": 300,
  "toolsAllow": ["bash", "read_file"]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `kind` | `"agentTurn"` | 固定值 |
| `message` | string | 发给 agent 的指令 |
| `model` | string | 可选，覆盖模型 |
| `fallbacks` | string[] | 可选，备用模型列表 |
| `thinking` | string | 可选，thinking 模式 |
| `timeoutSeconds` | int | 可选，超时秒数 |
| `toolsAllow` | string[] | 可选，工具白名单 |
| `lightContext` | bool | 可选，轻量上下文模式 |

#### System Event

```json
{
  "kind": "systemEvent",
  "text": "定时触发系统事件"
}
```

### 2.7 `CronDelivery` — 结果投递

```json
{"mode": "none"}
{"mode": "announce", "channel": "telegram", "to": "@username"}
{"mode": "webhook", "to": "https://example.com/webhook"}
```

| `mode` | 说明 |
|---|---|
| `"none"` | 不投递，仅本地保存 |
| `"announce"` | 通过消息渠道发送结果 |
| `"webhook"` | HTTP POST 到指定 URL |

### 2.8 `CronJob` 响应结构

```json
{
  "id": "abc123",
  "name": "系统巡检",
  "description": "每小时检查系统状态",
  "enabled": true,
  "agentId": "main",
  "sessionKey": "agent:main:main",
  "createdAtMs": 1714180000000,
  "updatedAtMs": 1714180000000,
  "schedule": {"kind": "cron", "expr": "0 * * * *"},
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {"kind": "agentTurn", "message": "检查系统状态"},
  "state": {
    "nextRunAtMs": 1714183600000,
    "lastRunAtMs": 1714180000000,
    "lastRunStatus": "ok",
    "lastDurationMs": 12300,
    "consecutiveErrors": 0,
    "lastDeliveryStatus": "not-requested"
  }
}
```

### 2.9 `CronJobState` — 任务运行时状态

| 字段 | 类型 | 说明 |
|---|---|---|
| `nextRunAtMs` | int | 下次执行时间（Unix ms） |
| `runningAtMs` | int | 当前正在执行的开始时间 |
| `lastRunAtMs` | int | 上次执行时间 |
| `lastRunStatus` | string | `"ok"` / `"error"` / `"skipped"` |
| `lastError` | string | 上次错误信息 |
| `lastDurationMs` | int | 上次执行耗时（ms） |
| `consecutiveErrors` | int | 连续错误次数（成功后重置） |
| `lastDeliveryStatus` | string | `"delivered"` / `"not-delivered"` / `"not-requested"` |
| `lastDeliveryError` | string | 投递错误信息 |

---

## 三、hermes-webui 对接方案

### 3.1 架构

```
hermes-webui routes.py  POST /api/crons/create
    ├── agent_platform = "hermes"（默认）
    │     └── create_job() → ~/.hermes/cron/jobs.json
    │           hermes-agent scheduler tick 执行（不变）
    └── agent_platform = "openclaw"
          └── _gw_conn.run(client.schedules.create_schedule())
                → gateway WebSocket RPC: cron.add
                → ~/.openclaw/cron/jobs.json
                  openclaw gateway 内部 timer 执行
```

**hermes-agent 零改动。**

### 3.2 webui 接口参数设计

`POST /api/crons/create` 统一入口，按 `agent_platform` 分流：

| 参数 | 类型 | Hermes | OpenClaw | 说明 |
|---|---|---|---|---|
| `agent_platform` | string | `"hermes"`（默认） | `"openclaw"` | 平台选择 |
| `prompt` | string | ✅ 必填 | ✅ 必填（→ `payload.message`） | 任务指令 |
| `schedule` | string/object | ✅ 必填（string） | ✅ 必填（object） | 调度配置 |
| `name` | string | 可选 | ✅ 必填 | 任务名称 |
| `repeat` | int | 可选 | → `deleteAfterRun: true` | 执行次数 |
| `deliver` | string | 可选 | → `delivery.mode` | 投递方式 |
| `skills` | list | 可选 | ❌ 不支持 | Hermes skill |
| `model` | string | 可选 | 可选（→ `payload.model`） | 模型覆盖 |
| `session_target` | string | ❌ | 可选（默认 `"isolated"`） | OpenClaw 专用 |
| `wake_mode` | string | ❌ | 可选（默认 `"now"`） | OpenClaw 专用 |
| `agent_id` | string | ❌ | 可选（默认 `"main"`） | OpenClaw 专用 |
| `tools_allow` | list | ❌ | 可选 | OpenClaw 工具白名单 |
| `timeout_seconds` | int | ❌ | 可选 | OpenClaw 超时 |

### 3.3 其余接口分流规则

list/delete/update/run/pause/resume/recent 接口需要区分 job 来自哪个平台。

**方案**：job `id` 加前缀区分，或在 list 时合并两个来源并在每条记录加 `agent_platform` 字段。

推荐：**合并 list，每条记录带 `agent_platform`**，其余操作按 `agent_platform` 字段路由。

| 接口 | Hermes 后端 | OpenClaw 后端 |
|---|---|---|
| `GET /api/crons` | `list_jobs()` | `client.schedules.list_schedules()` |
| `POST /api/crons/delete` | `remove_job(job_id)` | `client.schedules.delete_schedule(job_id)` |
| `POST /api/crons/update` | `update_job(job_id, patch)` | `client.schedules.update_schedule(job_id, patch)` |
| `POST /api/crons/run` | `run_job(job)` | `client.schedules.run_now(job_id)` |
| `POST /api/crons/pause` | `pause_job(job_id)` | `update_schedule(job_id, {"patch": {"enabled": false}})` |
| `POST /api/crons/resume` | `resume_job(job_id)` | `update_schedule(job_id, {"patch": {"enabled": true}})` |
| `GET /api/crons/recent` | `list_runs(job_id)` | `client.schedules.get_runs(job_id)` |
| `GET /api/crons/output` | 读本地文件 | `client.schedules.get_runs(job_id)` 的 `summary` 字段 |

### 3.4 关键实现代码

#### `_handle_cron_create_openclaw()`

```python
def _handle_cron_create_openclaw(handler, body):
    try:
        from openclaw_sdk.scheduling.manager import ScheduleConfig
        from api.providers.openclaw_provider import _gw_conn, _get_openclaw_config

        cfg = _get_openclaw_config()
        client, _ = _gw_conn.get(cfg)

        # 构建 schedule 对象
        schedule = body.get("schedule")
        if isinstance(schedule, str):
            # 兼容 hermes 风格的 cron 字符串
            schedule = {"kind": "cron", "expr": schedule}

        # 构建 payload
        payload = {
            "kind": "agentTurn",
            "message": body["prompt"],
        }
        if body.get("model"):
            payload["model"] = body["model"]
        if body.get("tools_allow"):
            payload["toolsAllow"] = body["tools_allow"]
        if body.get("timeout_seconds"):
            payload["timeoutSeconds"] = body["timeout_seconds"]

        params = {
            "name": body.get("name") or body["prompt"][:40],
            "schedule": schedule,
            "sessionTarget": body.get("session_target") or "isolated",
            "wakeMode": body.get("wake_mode") or "now",
            "payload": payload,
            "enabled": body.get("enabled", True),
        }
        if body.get("agent_id"):
            params["agentId"] = body["agent_id"]
        if body.get("repeat") == 1:
            params["deleteAfterRun"] = True

        async def _create():
            return await client.gateway.call("cron.add", params)

        job = _gw_conn.run(_create(), timeout=15)
        job["agent_platform"] = "openclaw"
        return j(handler, {"ok": True, "job": job})

    except Exception as e:
        return j(handler, {"error": str(e)}, status=400)
```

#### `_handle_cron_list` 合并两个来源

```python
def _handle_cron_list(handler, parsed):
    jobs = []

    # Hermes jobs
    try:
        from cron.jobs import list_jobs
        for job in list_jobs():
            job["agent_platform"] = "hermes"
            jobs.append(job)
    except Exception:
        pass

    # OpenClaw jobs
    try:
        from api.providers.openclaw_provider import _gw_conn, _get_openclaw_config
        cfg = _get_openclaw_config()
        client, _ = _gw_conn.get(cfg)

        async def _list():
            return await client.gateway.call("cron.list", {})

        result = _gw_conn.run(_list(), timeout=10)
        for job in result.get("jobs", []):
            job["agent_platform"] = "openclaw"
            jobs.append(job)
    except Exception:
        pass

    return j(handler, {"jobs": jobs, "count": len(jobs)})
```

### 3.5 改动文件清单

| 文件 | 改动内容 |
|---|---|
| `api/routes.py` | `_handle_cron_create` 加 openclaw 分流；`_handle_cron_list` 合并两个来源；delete/update/run/pause/resume/recent 加 openclaw 分支 |

**hermes-agent 零改动。**

---

## 四、curl 验证示例

### 创建 OpenClaw cron 任务

```bash
# 每小时执行一次（cron 表达式）
curl -s -X POST http://127.0.0.1:8787/api/crons/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_platform": "openclaw",
    "name": "系统巡检",
    "prompt": "检查系统状态，汇报异常",
    "schedule": {"kind": "cron", "expr": "0 * * * *", "tz": "Asia/Shanghai"},
    "session_target": "isolated",
    "wake_mode": "now"
  }' | python3 -m json.tool

# 固定间隔（每 30 分钟）
curl -s -X POST http://127.0.0.1:8787/api/crons/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_platform": "openclaw",
    "name": "定期检查",
    "prompt": "检查最新消息",
    "schedule": {"kind": "every", "everyMs": 1800000}
  }' | python3 -m json.tool

# 一次性任务（5 分钟后执行）
curl -s -X POST http://127.0.0.1:8787/api/crons/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_platform": "openclaw",
    "name": "一次性任务",
    "prompt": "发送今日报告",
    "schedule": {"kind": "at", "at": "5m"},
    "repeat": 1
  }' | python3 -m json.tool
```

### 创建 Hermes cron 任务（不变）

```bash
curl -s -X POST http://127.0.0.1:8787/api/crons/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_platform": "hermes",
    "name": "每日报告",
    "prompt": "生成今日工作总结",
    "schedule": "0 18 * * 1-5"
  }' | python3 -m json.tool
```

### 查询所有任务（合并两个平台）

```bash
curl -s http://127.0.0.1:8787/api/crons | \
  python3 -c "
import json, sys
d = json.load(sys.stdin)
for job in d['jobs']:
    print(f\"{job.get('agent_platform','?'):10} | {job.get('id','?'):15} | {job.get('name','?')}\")
"
```

### 立即触发执行

```bash
curl -s -X POST http://127.0.0.1:8787/api/crons/run \
  -H "Content-Type: application/json" \
  -d '{"job_id": "<job_id>", "agent_platform": "openclaw"}' | python3 -m json.tool
```

### 暂停 / 恢复

```bash
# 暂停
curl -s -X POST http://127.0.0.1:8787/api/crons/pause \
  -H "Content-Type: application/json" \
  -d '{"job_id": "<job_id>", "agent_platform": "openclaw"}' | python3 -m json.tool

# 恢复
curl -s -X POST http://127.0.0.1:8787/api/crons/resume \
  -H "Content-Type: application/json" \
  -d '{"job_id": "<job_id>", "agent_platform": "openclaw"}' | python3 -m json.tool
```

### 删除任务

```bash
curl -s -X POST http://127.0.0.1:8787/api/crons/delete \
  -H "Content-Type: application/json" \
  -d '{"job_id": "<job_id>", "agent_platform": "openclaw"}' | python3 -m json.tool
```

### 查询执行历史

```bash
curl -s "http://127.0.0.1:8787/api/crons/recent?job_id=<job_id>&agent_platform=openclaw" | \
  python3 -m json.tool
```

---

## 五、注意事项

1. **`_gw_conn.run()` 有超时**：create/update/delete 建议 15s，list 建议 10s，失败时返回 `{"error": "..."}` 不影响 Hermes 任务。
2. **`sessionTarget` 推荐用 `"isolated"`**：每次任务在独立会话执行，不污染主会话上下文。
3. **`wakeMode` 推荐用 `"now"`**：任务到期立即执行；`"next-heartbeat"` 会等到下一个心跳周期（最多延迟 60s）。
4. **`schedule` 格式差异**：Hermes 接受 string（`"every 1h"`），OpenClaw 必须是 object（`{"kind":"every","everyMs":3600000}`）。webui 层做转换，对外统一。
5. **job_id 区分**：Hermes job id 是 12 位 hex，OpenClaw job id 由 gateway 生成（格式不同）。list 接口合并后每条记录带 `agent_platform` 字段，后续操作按此字段路由。
6. **OpenClaw gateway 必须在线**：所有 OpenClaw cron 操作依赖 gateway WebSocket 连接，gateway 离线时操作失败，Hermes 任务不受影响。
