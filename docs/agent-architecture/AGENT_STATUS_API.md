# Agent 状态查询接口设计文档

## 概述

本文档描述 `GET /api/agent/status` 接口的设计，该接口用于查询当前活跃 Agent 的运行状态，支持 Hermes 和 OpenClaw 两个 Agent 平台。

## 背景

现有接口的局限性：

| 接口 | 能力 | 局限 |
|------|------|------|
| `GET /health` | 返回活跃 stream 总数 | 无法查询具体 agent 信息 |
| `GET /api/chat/stream/status?stream_id=xxx` | 查询指定 stream 是否活跃 | 只返回 true/false |

两个接口均无法回答：
- 当前是哪个 provider 在运行？
- 使用的是哪个 model / agent？
- 已消耗多少 token？
- Hermes 使用的是哪个 Profile？
- OpenClaw 连接的是哪个 agent_id？

## 接口定义

### `GET /api/agent/status`

**查询参数（均可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `stream_id` | string | 查询指定 stream 的 agent |
| `session_id` | string | 查询指定 session 的 agent |

不传参数时返回所有活跃 agent 列表。

**响应结构：**

```json
{
  "agents": [
    {
      "stream_id": "abc123",
      "session_id": "sess456",
      "provider": "hermes",
      "model": "claude-sonnet-4-6",
      "status": "running",
      "started_at": 1713254400.0,
      "elapsed_seconds": 12.3,
      "agent_status": { ... }
    }
  ],
  "count": 1
}
```

**顶层字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `stream_id` | string | SSE stream ID |
| `session_id` | string | 会话 ID |
| `provider` | string | `"hermes"` 或 `"openclaw"` |
| `model` | string | 使用的模型名称或 agent ID |
| `status` | string | 当前固定为 `"running"` |
| `started_at` | float | Unix 时间戳（agent 启动时间） |
| `elapsed_seconds` | float | 已运行秒数 |
| `agent_status` | object | Provider 特定的状态字段（见下） |

---

## Hermes Agent 状态字段

Hermes 通过 `HermesAgent.get_status()` 暴露以下字段，数据来源于 `AIAgent` 实例的实时属性：

```json
{
  "agent_status": {
    "input_tokens": 1200,
    "output_tokens": 340,
    "estimated_cost_usd": 0.0023,
    "context_length": 8192,
    "compression_count": 0,
    "last_prompt_tokens": 1200
  }
}
```

| 字段 | 来源 | 说明 |
|------|------|------|
| `input_tokens` | `agent.session_prompt_tokens` | 本次会话累计输入 token |
| `output_tokens` | `agent.session_completion_tokens` | 本次会话累计输出 token |
| `estimated_cost_usd` | `agent.session_estimated_cost_usd` | 估算费用（美元） |
| `context_length` | `agent.context_compressor.context_length` | 当前上下文长度 |
| `compression_count` | `agent.context_compressor.compression_count` | 上下文压缩次数 |
| `last_prompt_tokens` | `agent.context_compressor.last_prompt_tokens` | 最近一次 prompt token 数 |

**特点：** 执行中即可实时读取，token 数随对话进行持续更新。

---

## OpenClaw Agent 状态字段

OpenClaw 通过 `OpenClawAgent.get_status()` 暴露以下字段：

```json
{
  "agent_status": {
    "openclaw_agent_id": "emp-a1b2c3d4e5f6",
    "gateway_url": "ws://127.0.0.1:18789",
    "interrupted": false,
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

| 字段 | 来源 | 说明 |
|------|------|------|
| `openclaw_agent_id` | `self._openclaw_agent_id` | Gateway 中的 agent ID |
| `gateway_url` | `self._gateway_url` | 连接的 Gateway WebSocket 地址 |
| `interrupted` | `self._interrupted` | 是否已被取消 |
| `input_tokens` | `self._usage.input_tokens` | 输入 token（run 完成后才有值） |
| `output_tokens` | `self._usage.output_tokens` | 输出 token（run 完成后才有值） |

**局限：** OpenClaw SDK 的 `execute_stream` 是 async 流，执行中无法从外部查询进度，token 数在 `DONE` 事件后才填充，执行中为 0。

---

## 数据流

```
agent 启动
  ↓
streaming.py: _run_agent_streaming()
  ├─ 创建 _iagent 实例
  ├─ AGENT_INSTANCES[stream_id] = _iagent
  └─ AGENT_META[stream_id] = {session_id, provider, model, started_at}
  ↓
GET /api/agent/status
  ├─ 加锁读取 AGENT_META + AGENT_INSTANCES 快照
  ├─ 遍历 meta，按 stream_id / session_id 过滤
  ├─ 调用 iagent.get_status() 获取 provider 特定状态
  └─ 返回 JSON
  ↓
agent 结束（finally 块）
  ├─ STREAMS.pop(stream_id)
  ├─ CANCEL_FLAGS.pop(stream_id)
  ├─ AGENT_INSTANCES.pop(stream_id)
  └─ AGENT_META.pop(stream_id)
```

---

## 响应示例

### 无活跃 agent

```json
{
  "agents": [],
  "count": 0
}
```

### Hermes agent 运行中

```json
{
  "agents": [
    {
      "stream_id": "abc123def456",
      "session_id": "sess789abc",
      "provider": "hermes",
      "model": "claude-sonnet-4-6",
      "status": "running",
      "started_at": 1713254400.0,
      "elapsed_seconds": 12.3,
      "agent_status": {
        "input_tokens": 1200,
        "output_tokens": 340,
        "estimated_cost_usd": 0.0023,
        "context_length": 8192,
        "compression_count": 0,
        "last_prompt_tokens": 1200
      }
    }
  ],
  "count": 1
}
```

### OpenClaw agent 运行中

```json
{
  "agents": [
    {
      "stream_id": "def456ghi789",
      "session_id": "sess123xyz",
      "provider": "openclaw",
      "model": "emp-a1b2c3d4e5f6",
      "status": "running",
      "started_at": 1713254500.0,
      "elapsed_seconds": 5.1,
      "agent_status": {
        "openclaw_agent_id": "emp-a1b2c3d4e5f6",
        "gateway_url": "ws://127.0.0.1:18789",
        "interrupted": false,
        "input_tokens": 0,
        "output_tokens": 0
      }
    }
  ],
  "count": 1
}
```

---

## 实现文件索引

| 文件 | 改动 |
|------|------|
| `api/config.py:971` | 新增 `AGENT_META: dict = {}` |
| `api/agent_provider.py` | `IAgent` 新增 `get_status()` 默认方法 |
| `api/providers/hermes_provider.py` | `HermesAgent.get_status()` 实现 |
| `api/providers/openclaw_provider.py` | `OpenClawAgent.get_status()` 实现 |
| `api/streaming.py:244-246` | 写入 `AGENT_META`，清理时删除 |
| `api/routes.py` | 新增 `GET /api/agent/status` 路由 |

---

## 版本历史

- **v1.0** (2026-04-17) - 初始版本，支持 Hermes 和 OpenClaw 状态查询
