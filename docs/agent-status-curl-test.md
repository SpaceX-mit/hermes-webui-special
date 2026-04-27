# Agent 状态接口 curl 验证手册

> 前提：服务已启动，监听 `http://127.0.0.1:8787`

---

## 一、基础验证

### 健康检查

```bash
curl -s http://127.0.0.1:8787/health
```

期望：`{"status": "ok"}`

### 查看所有员工及其 session_id

```bash
curl -s http://127.0.0.1:8787/api/employees | \
  python3 -c "import json,sys; [print(e['id'], e.get('agent_provider','hermes'), e['name']) for e in json.load(sys.stdin)['employees']]"
```

---

## 二、`/api/agent/lifecycle` 验证

### 查询所有员工生命周期

```bash
curl -s http://127.0.0.1:8787/api/agent/lifecycle | python3 -m json.tool
```

### 只看 Hermes 员工

```bash
curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; [print(e['employee_name'], '->', e['agent_lifecycle']) for e in json.load(sys.stdin)['lifecycle']]"
```

### 只看 OpenClaw 员工

```bash
curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=openclaw" | \
  python3 -c "import json,sys; [print(e['employee_name'], '->', e['agent_lifecycle']) for e in json.load(sys.stdin)['lifecycle']]"
```

### 查询指定员工（替换 session_id）

```bash
curl -s "http://127.0.0.1:8787/api/agent/lifecycle?session_id=<session_id>" | python3 -m json.tool
```

---

## 三、`/api/agent/status` 验证

### 查询当前活跃 stream（有任务在跑时才有数据）

```bash
curl -s http://127.0.0.1:8787/api/agent/status | python3 -m json.tool
```

期望（无任务时）：`{"agents": [], "count": 0}`

期望（有任务时）：返回含 `agent_lifecycle`、`agent_status` 的完整条目。

---

## 四、模拟 Hermes gateway 各状态

> 通过写入 `~/.hermes/gateway_state.json` 模拟 gateway 状态，验证推导逻辑。

### `idle` — gateway 在线，无任务

```bash
echo '{"gateway_state":"running","active_agents":0,"exit_reason":null,"updated_at":"2026-04-27T10:00:00Z"}' \
  > ~/.hermes/gateway_state.json

curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; [print(e['employee_name'], '->', e['agent_lifecycle'], '| gateway:', e['gateway_state']) for e in json.load(sys.stdin)['lifecycle']]"
```

期望：所有 Hermes 员工显示 `idle`

### `starting` — gateway 启动中

```bash
echo '{"gateway_state":"starting","active_agents":0}' \
  > ~/.hermes/gateway_state.json

curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])"
```

期望：`starting`

### `error` — gateway 启动失败

```bash
echo '{"gateway_state":"startup_failed","active_agents":0,"exit_reason":"config error"}' \
  > ~/.hermes/gateway_state.json

curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; e=json.load(sys.stdin)['lifecycle'][0]; print(e['agent_lifecycle'], '|', e['last_stop_reason'])"
```

期望：`error | config error`

### `stopping` — gateway drain 中

```bash
echo '{"gateway_state":"draining","active_agents":1}' \
  > ~/.hermes/gateway_state.json

curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])"
```

期望：`stopping`

### `offline` — gateway 已停止

```bash
echo '{"gateway_state":"stopped","active_agents":0}' \
  > ~/.hermes/gateway_state.json

curl -s "http://127.0.0.1:8787/api/agent/lifecycle?provider=hermes" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])"
```

期望：`offline`

### 清理测试文件

```bash
rm -f ~/.hermes/gateway_state.json
```

---

## 五、真实任务运行时验证

在 webui 中向任意 Hermes 员工发送一条消息，消息发出后立即执行：

```bash
# 确认 agent_lifecycle = running，并查看 token 用量
curl -s http://127.0.0.1:8787/api/agent/status | \
  python3 -c "
import json, sys
d = json.load(sys.stdin)
for a in d['agents']:
    s = a.get('agent_status', {})
    print(f\"员工: {a['session_id']}\")
    print(f\"  lifecycle     : {a['agent_lifecycle']}\")
    print(f\"  gateway_state : {s.get('gateway_state')}\")
    print(f\"  input_tokens  : {s.get('input_tokens')}\")
    print(f\"  usage_percent : {s.get('usage_percent')}\")
    print(f\"  cost_usd      : {s.get('estimated_cost_usd')}\")
"
```

任务结束后再次执行，期望：`{"agents": [], "count": 0}`，同时 `/api/agent/lifecycle` 显示 `idle`。

---

## 六、中断状态验证

1. 在 webui 中发送一条消息，任务开始后点击"停止"按钮
2. 执行：

```bash
curl -s http://127.0.0.1:8787/api/agent/lifecycle | \
  python3 -c "
import json, sys
for e in json.load(sys.stdin)['lifecycle']:
    if e['agent_lifecycle'] != 'offline':
        print(e['employee_name'], '->', e['agent_lifecycle'], '| stop_reason:', e['last_stop_reason'])
"
```

期望：对应员工显示 `interrupted`，`last_stop_reason` 为 `aborted`。

---

## 七、一键全量验证脚本

```bash
BASE="http://127.0.0.1:8787"
GW="$HOME/.hermes/gateway_state.json"
PASS=0; FAIL=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $desc (expected='$expected' actual='$actual')"
    FAIL=$((FAIL+1))
  fi
}

echo "=== 1. 健康检查 ==="
check "health" "ok" "$(curl -s $BASE/health | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))")"

echo "=== 2. lifecycle 接口可访问 ==="
check "lifecycle count>0" "true" "$(curl -s $BASE/api/agent/lifecycle | python3 -c "import json,sys; print(json.load(sys.stdin)['count']>0)")"

echo "=== 3. Hermes offline（无 gateway_state.json）==="
rm -f "$GW"
check "hermes offline" "offline" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 4. Hermes idle ==="
echo '{"gateway_state":"running","active_agents":0}' > "$GW"
check "hermes idle" "idle" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 5. Hermes starting ==="
echo '{"gateway_state":"starting"}' > "$GW"
check "hermes starting" "starting" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 6. Hermes error ==="
echo '{"gateway_state":"startup_failed","exit_reason":"config error"}' > "$GW"
check "hermes error" "error" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 7. Hermes stopping ==="
echo '{"gateway_state":"draining"}' > "$GW"
check "hermes stopping" "stopping" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 8. Hermes offline（stopped）==="
echo '{"gateway_state":"stopped"}' > "$GW"
check "hermes stopped->offline" "offline" "$(curl -s "$BASE/api/agent/lifecycle?provider=hermes" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 9. OpenClaw idle ==="
rm -f "$GW"
check "openclaw idle" "idle" "$(curl -s "$BASE/api/agent/lifecycle?provider=openclaw" | python3 -c "import json,sys; print(json.load(sys.stdin)['lifecycle'][0]['agent_lifecycle'])")"

echo "=== 10. agent/status 无活跃 stream ==="
check "status empty" "0" "$(curl -s $BASE/api/agent/status | python3 -c "import json,sys; print(json.load(sys.stdin)['count'])")"

rm -f "$GW"
echo ""
echo "结果: PASS=$PASS FAIL=$FAIL"
```

运行方式：

```bash
bash /data/workspace2026-new/hermes-webui/docs/agent-status-curl-test.md
# 或复制脚本内容直接粘贴到终端执行
```
