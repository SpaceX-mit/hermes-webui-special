# Hermes WebUI API 对接指南

> 面向外部开发者的接口文档，用于对接 Hermes WebUI 数字员工系统。

## 1. 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://127.0.0.1:8787` |
| 协议 | HTTP（支持可选 HTTPS） |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 1.1 认证

系统支持可选的密码认证。未设置密码时所有接口无需认证。

- 认证方式：Cookie（`hermes_session`）
- 登录后 Cookie 有效期 24 小时
- 登录限流：同一 IP 60 秒内最多 5 次

### 1.2 CSRF 保护

所有 POST 请求必须携带以下任一 header：

```
X-CSRF: 1
```

或确保 `Origin` / `Referer` 与服务器地址匹配。

### 1.3 通用错误格式

```json
{"error": "错误描述"}
```

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | CSRF 校验失败 |
| 404 | 资源不存在 |
| 409 | 冲突（如 agent 运行中无法切换） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 2. 核心接口

### 2.1 健康检查

```
GET /health
```

响应：
```json
{
  "status": "ok",
  "sessions": 12,
  "active_streams": 0,
  "uptime_seconds": 3600.5
}
```

---

### 2.2 认证

#### 检查认证状态
```
GET /api/auth/status
```
```json
{"auth_enabled": false, "logged_in": true}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json
X-CSRF: 1

{"password": "your_password"}
```
成功返回 `{"ok": true}` 并设置 Cookie。

#### 登出
```
POST /api/auth/logout
X-CSRF: 1
```

---

### 2.3 数字员工管理

#### 列出所有员工
```
GET /api/employees
```
```json
{
  "employees": [
    {
      "id": "b5aa2fdc851e",
      "name": "测试工程师",
      "avatar_index": 1,
      "description": "负责代码审查和测试",
      "traits": ["严谨", "高效"],
      "capabilities": {
        "search": true,
        "memory": true,
        "autoExec": false,
        "knowledge": true
      },
      "profile_name": "emp-b5aa2fdc851e",
      "created_at": 1776065817.19
    }
  ]
}
```

#### 创建员工
```
POST /api/employee/create
Content-Type: application/json
X-CSRF: 1

{
  "name": "数据分析师",
  "avatar_index": 2,
  "description": "精通数据分析和可视化，支持业务决策",
  "traits": ["逻辑清晰", "数据敏感", "善于总结"],
  "capabilities": {
    "search": true,
    "memory": true,
    "autoExec": false,
    "knowledge": true
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 员工名称 |
| avatar_index | int | 否 | 头像索引 0-6，默认 0 |
| description | string | 否 | 职责描述，写入 SOUL.md |
| traits | string[] | 否 | 性格特质列表 |
| capabilities | object | 否 | 能力开关 |

capabilities 字段说明：

| 键 | 说明 | 映射的 Agent 工具集 |
|----|------|-------------------|
| search | 联网搜索 | web |
| memory | 长期记忆 | memory |
| autoExec | 自主执行 | terminal |
| knowledge | 知识库对接 | file |

响应：
```json
{
  "ok": true,
  "employee": {
    "id": "a1b2c3d4e5f6",
    "name": "数据分析师",
    "profile_name": "emp-a1b2c3d4e5f6",
    ...
  }
}
```

创建员工时后端自动：
1. 创建 Hermes Profile（`~/.hermes/profiles/emp-{id}/`）
2. 生成 SOUL.md（性格文件）
3. 配置 config.yaml（工具集）

#### 更新员工
```
POST /api/employee/update
Content-Type: application/json
X-CSRF: 1

{
  "id": "a1b2c3d4e5f6",
  "name": "高级数据分析师",
  "description": "新的职责描述",
  "traits": ["逻辑清晰", "数据敏感", "善于总结", "沟通能力强"]
}
```

只需传入要更新的字段，未传入的字段保持不变。更新会同步到 SOUL.md 和 config.yaml。

#### 删除员工
```
POST /api/employee/delete
Content-Type: application/json
X-CSRF: 1

{"id": "a1b2c3d4e5f6"}
```
```json
{"ok": true, "deleted": true}
```

同时删除对应的 Hermes Profile 目录。

#### 激活员工（切换 Profile）
```
POST /api/employee/activate
Content-Type: application/json
X-CSRF: 1

{"id": "a1b2c3d4e5f6"}
```
```json
{"ok": true, "active": "emp-a1b2c3d4e5f6"}
```

切换后所有聊天请求将使用该员工的性格、记忆和工具配置。

> 注意：Agent 运行中无法切换，返回 409。

---

### 2.4 聊天（流式）

聊天采用两步流程：先启动流，再通过 SSE 接收响应。

#### 第一步：启动聊天流
```
POST /api/chat/start
Content-Type: application/json
X-CSRF: 1

{
  "session_id": "abc123def456",
  "message": "帮我分析一下最近的销售数据",
  "model": "anthropic/claude-sonnet-4-20250514",
  "workspace": "/home/user/projects",
  "attachments": ["report.csv"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 是 | 会话 ID |
| message | string | 是 | 用户消息 |
| model | string | 否 | 模型 ID |
| workspace | string | 否 | 工作目录 |
| attachments | string[] | 否 | 附件文件名（最多 20） |

响应：
```json
{
  "stream_id": "f47ac10b58cc4372",
  "session_id": "abc123def456"
}
```

#### 第二步：接收 SSE 流
```
GET /api/chat/stream?stream_id=f47ac10b58cc4372
```

Content-Type: `text/event-stream`

SSE 事件格式：
```
event: token
data: {"text": "根据"}

event: token
data: {"text": "销售数据"}

event: tool
data: {"name": "read_file", "preview": "Reading report.csv", "args": {"path": "report.csv"}}

event: done
data: {"session": {...}, "usage": {"input_tokens": 150, "output_tokens": 320}}
```

| 事件 | 数据 | 说明 |
|------|------|------|
| `token` | `{"text": string}` | LLM 输出的一个 token |
| `tool` | `{"name", "preview", "args"}` | Agent 调用工具 |
| `approval` | `{"id", "description", "command"}` | 危险命令需审批 |
| `done` | `{"session", "usage"}` | 流结束 |
| `error` | `{"message"}` | 错误 |
| `cancel` | `{"message"}` | 用户取消 |
| `apperror` | `{"message", "type", "hint"}` | 应用错误（限流等） |

#### 取消流
```
GET /api/chat/cancel?stream_id=f47ac10b58cc4372
```

#### 检查流状态
```
GET /api/chat/stream/status?stream_id=f47ac10b58cc4372
```
```json
{"active": true, "stream_id": "f47ac10b58cc4372"}
```

---

### 2.5 会话管理

#### 创建新会话
```
POST /api/session/new
Content-Type: application/json
X-CSRF: 1

{"workspace": "/home/user/projects", "model": "anthropic/claude-sonnet-4-20250514"}
```

#### 列出所有会话
```
GET /api/sessions
```
```json
{
  "sessions": [
    {
      "session_id": "abc123def456",
      "title": "销售数据分析",
      "profile": "emp-a1b2c3d4e5f6",
      "model": "anthropic/claude-sonnet-4-20250514",
      "created_at": 1776065800,
      "updated_at": 1776066000,
      "pinned": false,
      "archived": false,
      "last_message": "根据数据分析..."
    }
  ]
}
```

#### 获取单个会话（含消息）
```
GET /api/session?session_id=abc123def456
```

#### 删除会话
```
POST /api/session/delete
X-CSRF: 1
Content-Type: application/json

{"session_id": "abc123def456"}
```

#### 清空会话消息
```
POST /api/session/clear
X-CSRF: 1
Content-Type: application/json

{"session_id": "abc123def456"}
```

---

### 2.6 模型与设置

#### 列出可用模型
```
GET /api/models
```

#### 获取/更新设置
```
GET /api/settings
POST /api/settings
```

---

### 2.7 审批系统

当 Agent 执行危险命令时，需要用户审批。

#### 查询待审批项
```
GET /api/approval/pending?session_id=abc123def456
```

#### 响应审批
```
POST /api/approval/respond
X-CSRF: 1
Content-Type: application/json

{
  "session_id": "abc123def456",
  "choice": "once"
}
```

choice 可选值：`once`（允许一次）、`session`（本会话允许）、`always`（永久允许）、`deny`（拒绝）

---

## 3. 完整对接示例（Python）

```python
"""
Hermes WebUI API 对接示例
演示：创建员工 → 激活 → 创建会话 → 发送消息 → 接收流式响应
"""
import json
import requests
import sseclient  # pip install sseclient-py

BASE_URL = "http://127.0.0.1:8787"
HEADERS = {"Content-Type": "application/json", "X-CSRF": "1"}


def main():
    # 0. 健康检查
    r = requests.get(f"{BASE_URL}/health")
    print(f"服务状态: {r.json()['status']}")

    # 1. 创建数字员工
    emp = requests.post(f"{BASE_URL}/api/employee/create", headers=HEADERS, json={
        "name": "代码助手",
        "description": "精通 Python 和 JavaScript，擅长代码审查和重构",
        "traits": ["严谨", "高效", "注重代码质量"],
        "capabilities": {"search": True, "memory": True, "autoExec": False, "knowledge": True},
        "avatar_index": 1,
    }).json()
    emp_id = emp["employee"]["id"]
    print(f"创建员工: {emp['employee']['name']} (id={emp_id})")

    # 2. 激活员工（切换到该员工的 Profile）
    activate = requests.post(f"{BASE_URL}/api/employee/activate", headers=HEADERS, json={
        "id": emp_id,
    }).json()
    print(f"激活 Profile: {activate['active']}")

    # 3. 创建新会话
    session = requests.post(f"{BASE_URL}/api/session/new", headers=HEADERS, json={
        "model": "anthropic/claude-sonnet-4-20250514",
    }).json()
    session_id = session["session"]["session_id"]
    print(f"创建会话: {session_id}")

    # 4. 发送消息，启动聊天流
    stream_resp = requests.post(f"{BASE_URL}/api/chat/start", headers=HEADERS, json={
        "session_id": session_id,
        "message": "用 Python 写一个快速排序函数",
    }).json()
    stream_id = stream_resp["stream_id"]
    print(f"启动流: {stream_id}")

    # 5. 接收 SSE 流式响应
    response = requests.get(
        f"{BASE_URL}/api/chat/stream?stream_id={stream_id}",
        stream=True,
    )
    client = sseclient.SSEClient(response)
    full_text = ""
    for event in client.events():
        data = json.loads(event.data)
        if event.event == "token":
            full_text += data["text"]
            print(data["text"], end="", flush=True)
        elif event.event == "tool":
            print(f"\n[工具调用] {data['name']}: {data.get('preview', '')}")
        elif event.event == "done":
            print(f"\n\n--- 完成 ---")
            usage = data.get("usage", {})
            print(f"Token 用量: 输入 {usage.get('input_tokens', 0)}, 输出 {usage.get('output_tokens', 0)}")
            break
        elif event.event == "error":
            print(f"\n[错误] {data['message']}")
            break

    # 6. 查看会话列表
    sessions = requests.get(f"{BASE_URL}/api/sessions").json()
    print(f"\n当前会话数: {len(sessions['sessions'])}")

    # 7. 清理：删除员工（同时删除 Profile）
    # requests.post(f"{BASE_URL}/api/employee/delete", headers=HEADERS, json={"id": emp_id})


if __name__ == "__main__":
    main()
```

### 运行示例

```bash
pip install requests sseclient-py
python example.py
```

输出：
```
服务状态: ok
创建员工: 代码助手 (id=a1b2c3d4e5f6)
激活 Profile: emp-a1b2c3d4e5f6
创建会话: 7f8e9d0c1b2a
启动流: f47ac10b58cc
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

--- 完成 ---
Token 用量: 输入 85, 输出 120
当前会话数: 3
```

---

## 4. 完整对接示例（JavaScript / Node.js）

```javascript
/**
 * Hermes WebUI API 对接示例 (Node.js)
 * npm install eventsource
 */
const EventSource = require("eventsource");

const BASE = "http://127.0.0.1:8787";
const HEADERS = { "Content-Type": "application/json", "X-CSRF": "1" };

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers: HEADERS, body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  // 1. 创建员工
  const { employee } = await post("/api/employee/create", {
    name: "前端工程师",
    description: "精通 React 和 Vue，擅长 UI 开发",
    traits: ["细致", "有审美"],
    capabilities: { search: true, memory: true, autoExec: false, knowledge: true },
  });
  console.log(`创建员工: ${employee.name} (${employee.id})`);

  // 2. 激活
  await post("/api/employee/activate", { id: employee.id });

  // 3. 创建会话
  const { session } = await post("/api/session/new", {});
  console.log(`会话: ${session.session_id}`);

  // 4. 发送消息
  const { stream_id } = await post("/api/chat/start", {
    session_id: session.session_id,
    message: "用 React 写一个 Todo 组件",
  });

  // 5. SSE 流式接收
  return new Promise((resolve) => {
    const es = new EventSource(`${BASE}/api/chat/stream?stream_id=${stream_id}`);
    es.addEventListener("token", (e) => {
      process.stdout.write(JSON.parse(e.data).text);
    });
    es.addEventListener("done", (e) => {
      console.log("\n--- 完成 ---");
      es.close();
      resolve();
    });
    es.addEventListener("error", () => { es.close(); resolve(); });
  });
}

main();
```

---

## 5. 注意事项

1. **CSRF Header 必须携带**：所有 POST 请求需要 `X-CSRF: 1`，否则返回 403
2. **激活员工会切换全局 Profile**：影响所有后续聊天请求的性格和工具配置
3. **Agent 运行中不能切换**：如果有活跃的聊天流，`/api/employee/activate` 返回 409
4. **SSE 流需要保持连接**：使用支持 SSE 的 HTTP 客户端，不要设置短超时
5. **会话属于 Profile**：每个会话的 `profile` 字段标识它属于哪个员工
6. **删除员工会删除 Profile**：包括该员工的记忆、技能、配置，但不删除会话记录
