# JDUI 前端开发者对接指南

> 面向 WebUI 前端开发者的完整技术文档，涵盖架构、接口、流程和代码示例。

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (你的代码)                        │
│                                                          │
│  HTTP REST (JSON)  ←→  JDUI Server (:8787)               │
│  SSE (流式)        ←─  /api/chat/stream                  │
│  Multipart         ─→  /api/upload                       │
└─────────────────────────────────────────────────────────┘
```

所有通信基于 HTTP，数据格式 JSON，流式响应用 SSE (Server-Sent Events)。

### 1.1 Base URL

```
http://127.0.0.1:8787
```

局域网访问时替换为服务器 IP。

### 1.2 请求规范

所有 POST 请求必须携带：

```
Content-Type: application/json
X-CSRF: 1
```

GET 请求无需特殊 header。

### 1.3 认证

默认无需认证。设置密码后：

```javascript
// 登录
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({ password: 'your-password' }),
});
// 成功后自动设置 Cookie，后续请求自动携带
```

### 1.4 错误格式

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
| 409 | 冲突（Agent 运行中无法切换） |
| 500 | 服务器内部错误 |

---

## 2. 核心流程

### 2.1 完整对话流程（最重要）

```
1. 创建/激活员工  →  2. 创建会话  →  3. 发送消息  →  4. 接收流式响应
```

#### 步骤 1：创建员工

```javascript
const emp = await fetch('/api/employee/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({
    name: '代码助手',
    description: '精通 Python 和 JavaScript',
    traits: ['严谨', '高效'],
    capabilities: { search: true, memory: true, autoExec: false, knowledge: true },
    avatar_index: 1,
    agent_provider: 'hermes',  // 或 'openclaw'
  }),
}).then(r => r.json());

console.log(emp.employee.id);           // "a1b2c3d4e5f6"
console.log(emp.employee.profile_name); // "emp-a1b2c3d4e5f6"
```

#### 步骤 2：激活员工

```javascript
const activated = await fetch('/api/employee/activate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({ id: 'a1b2c3d4e5f6' }),
}).then(r => r.json());

console.log(activated.active); // "emp-a1b2c3d4e5f6"
```

#### 步骤 3：创建会话（带 employee_id）

```javascript
const session = await fetch('/api/session/new', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    employee_id: 'a1b2c3d4e5f6',  // 关键：标记会话属于哪个员工
  }),
}).then(r => r.json());

const sessionId = session.session.session_id;
```

#### 步骤 4：发送消息 + 接收流式响应

```javascript
// 4a. 启动聊天流
const start = await fetch('/api/chat/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({
    session_id: sessionId,
    message: '用 Python 写一个快速排序',
    model: 'claude-sonnet-4-20250514',
  }),
}).then(r => r.json());

const streamId = start.stream_id;

// 4b. 打开 SSE 连接接收流式响应
const source = new EventSource(`/api/chat/stream?stream_id=${streamId}`);

let fullText = '';

source.addEventListener('token', (e) => {
  const data = JSON.parse(e.data);
  fullText += data.text;
  // 实时渲染到 UI
  document.getElementById('chat').textContent = fullText;
});

source.addEventListener('tool', (e) => {
  const data = JSON.parse(e.data);
  console.log(`工具调用: ${data.name}`, data.args);
});

source.addEventListener('done', (e) => {
  source.close();
  const data = JSON.parse(e.data);
  console.log('完成', data.usage);
  // data.session.messages 包含完整消息历史
});

source.addEventListener('error', (e) => {
  source.close();
  console.error('流错误');
});
```

### 2.2 SSE 事件类型完整列表

| 事件 | 数据结构 | 说明 |
|------|----------|------|
| `token` | `{"text": "..."}` | LLM 输出的一个 token，实时追加到消息 |
| `tool` | `{"name": "...", "preview": "...", "args": {...}}` | Agent 调用了一个工具 |
| `approval` | `{"id": "...", "description": "...", "command": "..."}` | 危险命令需要用户审批 |
| `done` | `{"session": {...}, "usage": {...}}` | 流结束，包含最终 session 和 token 用量 |
| `error` | `{"message": "..."}` | 流错误 |
| `cancel` | `{"message": "..."}` | 用户取消了流 |
| `apperror` | `{"message": "...", "type": "...", "hint": "..."}` | 应用错误（限流、认证失败等） |
| `compressed` | `{"message": "..."}` | 上下文被自动压缩 |

### 2.3 取消正在进行的对话

```javascript
await fetch(`/api/chat/cancel?stream_id=${streamId}`);
// SSE 会收到 'cancel' 事件
```

---

## 3. 全部接口分类

### 3.1 数字员工管理

#### 列出所有员工

```
GET /api/employees
```

```json
// 响应
{
  "employees": [
    {
      "id": "a1b2c3d4e5f6",
      "name": "代码助手",
      "avatar_index": 1,
      "description": "精通 Python 和 JavaScript",
      "traits": ["严谨", "高效"],
      "capabilities": {"search": true, "memory": true, "autoExec": false, "knowledge": true},
      "profile_name": "emp-a1b2c3d4e5f6",
      "agent_provider": "hermes",
      "created_at": 1776065817.19
    }
  ]
}
```

#### 创建员工

```
POST /api/employee/create
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 员工名称 |
| description | string | 否 | 职责描述 |
| traits | string[] | 否 | 性格特质 |
| capabilities | object | 否 | 能力开关：search/memory/autoExec/knowledge |
| avatar_index | int | 否 | 头像索引 0-6 |
| agent_provider | string | 否 | `'hermes'`（默认）或 `'openclaw'` |

#### 更新员工

```
POST /api/employee/update
Body: {"id": "...", "name": "新名称", "agent_provider": "openclaw", ...}
```

#### 删除员工

```
POST /api/employee/delete
Body: {"id": "..."}
```

#### 激活员工（切换 Agent）

```
POST /api/employee/activate
Body: {"id": "..."}
Response: {"ok": true, "active": "emp-a1b2c3d4e5f6"}
```

> 激活后应创建新会话（带 employee_id），确保聊天路由到正确的 Agent Provider。

#### 获取员工的所有会话

```
GET /api/employee/sessions?employee_id=a1b2c3d4e5f6
```

```json
// 响应
{
  "employee_id": "a1b2c3d4e5f6",
  "employee_name": "代码助手",
  "agent_provider": "hermes",
  "count": 5,
  "sessions": [
    {
      "session_id": "xxx",
      "title": "快速排序",
      "message_count": 4,
      "updated_at": 1776224538,
      "model": "claude-sonnet-4-20250514",
      "pinned": false,
      "archived": false
    }
  ]
}
```

> 按 `updated_at` 倒序排列。详细文档见 [EMPLOYEE_SESSIONS_API.md](EMPLOYEE_SESSIONS_API.md)。

### 3.2 Agent Provider

#### 列出所有 Provider

```
GET /api/agent/providers
```

```json
{
  "providers": [
    {
      "id": "hermes",
      "available": true,
      "is_default": true,
      "models": [],
      "interfaces": [
        {"name": "get_provider_id", "status": "implemented"},
        {"name": "IAgent.run", "status": "implemented"},
        ...
      ]
    },
    {
      "id": "openclaw",
      "available": true,
      "is_default": false,
      "models": [],
      "interfaces": [...]
    }
  ]
}
```

#### 设置默认 Provider

```
POST /api/agent/provider/set-default
Body: {"provider_id": "openclaw"}
```

### 3.3 会话管理

#### 创建会话

```
POST /api/session/new
Body: {"model": "claude-sonnet-4-20250514", "workspace": "/path", "employee_id": "a1b2c3d4e5f6"}
```

> `employee_id` 是关键字段，确保会话绑定到正确的员工和 Agent Provider。

#### 获取会话（含消息）

```
GET /api/session?session_id=xxx
```

```json
{
  "session": {
    "session_id": "xxx",
    "title": "快速排序",
    "profile": "emp-a1b2c3d4e5f6",
    "model": "claude-sonnet-4-20250514",
    "messages": [
      {"role": "user", "content": "写一个快速排序"},
      {"role": "assistant", "content": "def quick_sort(arr):..."}
    ],
    "input_tokens": 85,
    "output_tokens": 120
  }
}
```

#### 列出所有会话

```
GET /api/sessions
```

> 返回的每个 session 有 `profile` 字段，可用来匹配员工的 `profile_name`。

#### 其他会话操作

| 接口 | 说明 |
|------|------|
| `POST /api/session/rename` | `{session_id, title}` |
| `POST /api/session/delete` | `{session_id}` |
| `POST /api/session/clear` | `{session_id}` 清空消息 |
| `POST /api/session/pin` | `{session_id, pinned: true}` |
| `POST /api/session/archive` | `{session_id, archived: true}` |
| `GET /api/sessions/search?q=xxx` | 搜索会话 |
| `GET /api/session/export?session_id=xxx` | 导出 JSON |

### 3.4 设置

#### 获取设置

```
GET /api/settings
```

#### 更新设置

```
POST /api/settings
Body: {"theme": "jdui", "bot_name": "JDUI", "openclaw_gateway_url": "ws://...", ...}
```

关键设置字段：

| 字段 | 说明 |
|------|------|
| `theme` | UI 主题 |
| `bot_name` | 助手显示名称 |
| `language` | 语言 |
| `send_key` | 发送键（enter / ctrl+enter） |
| `openclaw_gateway_url` | OpenClaw Gateway 地址 |
| `openclaw_api_key` | OpenClaw Bearer Token |
| `onboarding_completed` | 设为 false 可重新触发引导 |

### 3.5 文件操作

| 接口 | 说明 |
|------|------|
| `GET /api/list?session_id=xxx&path=.` | 列出目录 |
| `GET /api/file?session_id=xxx&path=file.py` | 读取文件 |
| `GET /api/file/raw?session_id=xxx&path=file.py` | 下载文件 |
| `POST /api/file/save` | `{session_id, path, content}` |
| `POST /api/file/create` | `{session_id, path, content}` |
| `POST /api/file/delete` | `{session_id, path}` |
| `POST /api/file/rename` | `{session_id, old_path, new_path}` |
| `POST /api/upload` | Multipart 文件上传 |

### 3.6 定时任务

| 接口 | 说明 |
|------|------|
| `GET /api/crons` | 列出任务 → `{jobs: [...]}` |
| `POST /api/crons/create` | `{name, schedule, prompt}` |
| `POST /api/crons/run` | `{job_id}` 立即执行 |
| `POST /api/crons/pause` | `{job_id}` |
| `POST /api/crons/resume` | `{job_id}` |
| `POST /api/crons/delete` | `{job_id}` |

### 3.7 审批系统

当 Agent 执行危险命令时触发。

```javascript
// SSE 中收到 approval 事件
source.addEventListener('approval', (e) => {
  const data = JSON.parse(e.data);
  // 显示审批 UI: data.description, data.command
});

// 用户响应审批
await fetch('/api/approval/respond', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
  body: JSON.stringify({
    session_id: sessionId,
    choice: 'once',  // once | session | always | deny
  }),
});
```

### 3.8 系统

| 接口 | 说明 |
|------|------|
| `GET /health` | `{status, sessions, active_streams, uptime_seconds}` |
| `GET /api/auth/status` | `{auth_enabled, logged_in}` |
| `GET /api/models` | 可用模型列表 |

---

## 4. 员工与会话的关系

```
Employee (员工)
  ├── id: "a1b2c3d4e5f6"
  ├── profile_name: "emp-a1b2c3d4e5f6"
  ├── agent_provider: "hermes" | "openclaw"
  │
  └── Sessions (会话，1:N)
      ├── session.profile == employee.profile_name  ← 匹配关系
      ├── session.messages: [...]
      └── session.model: "claude-sonnet-4-20250514"
```

### 按员工过滤会话

```javascript
const employees = await fetch('/api/employees').then(r => r.json());
const sessions = await fetch('/api/sessions').then(r => r.json());

const activeEmp = employees.employees.find(e => e.id === activeEmployeeId);
const empSessions = sessions.sessions.filter(
  s => s.profile === activeEmp.profile_name
);
```

### 判断会话使用的 Agent Provider

```javascript
function getSessionProvider(session, employees) {
  const emp = employees.find(e => e.profile_name === session.profile);
  return emp ? emp.agent_provider : 'hermes';
}
```

---

## 5. 完整 Example：React 对接

```jsx
import { useState, useEffect, useRef } from 'react';

const API = 'http://127.0.0.1:8787';
const HEADERS = { 'Content-Type': 'application/json', 'X-CSRF': '1' };

function Chat() {
  const [employees, setEmployees] = useState([]);
  const [activeEmp, setActiveEmp] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const textRef = useRef('');

  // 加载员工列表
  useEffect(() => {
    fetch(`${API}/api/employees`).then(r => r.json())
      .then(d => setEmployees(d.employees));
  }, []);

  // 激活员工 + 创建会话
  async function activateEmployee(empId) {
    await fetch(`${API}/api/employee/activate`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({ id: empId }),
    });

    const session = await fetch(`${API}/api/session/new`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({ employee_id: empId }),
    }).then(r => r.json());

    setActiveEmp(empId);
    setSessionId(session.session.session_id);
    setMessages([]);
  }

  // 发送消息
  async function sendMessage() {
    if (!input.trim() || !sessionId) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);
    textRef.current = '';

    // 启动流
    const start = await fetch(`${API}/api/chat/start`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({ session_id: sessionId, message: userMsg }),
    }).then(r => r.json());

    // SSE 接收
    const source = new EventSource(
      `${API}/api/chat/stream?stream_id=${start.stream_id}`
    );

    source.addEventListener('token', (e) => {
      const { text } = JSON.parse(e.data);
      textRef.current += text;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          last.content = textRef.current;
        } else {
          updated.push({ role: 'assistant', content: textRef.current });
        }
        return [...updated];
      });
    });

    source.addEventListener('done', (e) => {
      source.close();
      setStreaming(false);
      const { session } = JSON.parse(e.data);
      if (session.messages) setMessages(session.messages);
    });

    source.addEventListener('error', () => {
      source.close();
      setStreaming(false);
    });
  }

  return (
    <div>
      {/* 员工列表 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {employees.map(emp => (
          <button
            key={emp.id}
            onClick={() => activateEmployee(emp.id)}
            style={{
              padding: '8px 16px',
              background: activeEmp === emp.id ? '#b2e40d' : '#f5f5f5',
              border: 'none', borderRadius: 12, cursor: 'pointer',
            }}
          >
            {emp.name}
            <small style={{ marginLeft: 4, opacity: 0.6 }}>
              {emp.agent_provider}
            </small>
          </button>
        ))}
      </div>

      {/* 消息列表 */}
      <div style={{ minHeight: 300, border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
        {messages.filter(m => m.role !== 'tool').map((msg, i) => (
          <div key={i} style={{
            marginBottom: 12,
            textAlign: msg.role === 'user' ? 'right' : 'left',
          }}>
            <span style={{
              display: 'inline-block', padding: '8px 16px', borderRadius: 12,
              background: msg.role === 'user' ? '#b2e40d' : '#f5f5f5',
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        {streaming && <div style={{ color: '#999' }}>思考中...</div>}
      </div>

      {/* 输入框 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #ddd' }}
        />
        <button onClick={sendMessage} disabled={streaming}
          style={{ padding: '12px 24px', background: '#b2e40d', border: 'none', borderRadius: 12 }}>
          发送
        </button>
      </div>
    </div>
  );
}

export default Chat;
```

---

## 6. 完整 Example：Python 对接

```python
"""JDUI API 对接示例 — 创建员工 → 激活 → 对话"""
import json
import requests
import sseclient  # pip install sseclient-py

BASE = "http://127.0.0.1:8787"
H = {"Content-Type": "application/json", "X-CSRF": "1"}

# 1. 创建员工
emp = requests.post(f"{BASE}/api/employee/create", headers=H, json={
    "name": "Python助手",
    "description": "精通Python开发",
    "agent_provider": "hermes",
}).json()["employee"]
print(f"员工: {emp['name']} ({emp['id']})")

# 2. 激活
requests.post(f"{BASE}/api/employee/activate", headers=H, json={"id": emp["id"]})

# 3. 创建会话
sid = requests.post(f"{BASE}/api/session/new", headers=H, json={
    "employee_id": emp["id"],
}).json()["session"]["session_id"]

# 4. 发消息 + 流式接收
stream_id = requests.post(f"{BASE}/api/chat/start", headers=H, json={
    "session_id": sid, "message": "写一个冒泡排序",
}).json()["stream_id"]

resp = requests.get(f"{BASE}/api/chat/stream?stream_id={stream_id}", stream=True)
for event in sseclient.SSEClient(resp).events():
    data = json.loads(event.data)
    if event.event == "token":
        print(data["text"], end="", flush=True)
    elif event.event == "done":
        print(f"\n\n用量: 输入{data['usage']['input_tokens']} 输出{data['usage']['output_tokens']}")
        break
```

---

## 7. 完整 Example：curl 对接

```bash
# 创建员工
curl -s -X POST http://127.0.0.1:8787/api/employee/create \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"name":"测试员工","agent_provider":"hermes"}'

# 激活员工
curl -s -X POST http://127.0.0.1:8787/api/employee/activate \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"id":"员工ID"}'

# 创建会话
curl -s -X POST http://127.0.0.1:8787/api/session/new \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"employee_id":"员工ID"}'

# 发消息
curl -s -X POST http://127.0.0.1:8787/api/chat/start \
  -H "Content-Type: application/json" -H "X-CSRF: 1" \
  -d '{"session_id":"会话ID","message":"hello"}'

# 接收 SSE 流
curl -N http://127.0.0.1:8787/api/chat/stream?stream_id=流ID
```

---

## 8. 关键注意事项

### 8.1 employee_id 必须传

创建会话时如果不传 `employee_id`，会话不会绑定到员工，聊天时默认走 Hermes。

```javascript
// 错误 ❌
fetch('/api/session/new', { body: JSON.stringify({ model: 'xxx' }) });

// 正确 ✅
fetch('/api/session/new', { body: JSON.stringify({ model: 'xxx', employee_id: empId }) });
```

### 8.2 SSE 连接要及时关闭

收到 `done` 或 `error` 事件后必须 `source.close()`，否则连接泄漏。

### 8.3 Agent 运行中不能切换员工

如果有活跃的聊天流，`/api/employee/activate` 对 Hermes 员工会返回 409。等流结束再切换。

### 8.4 done 事件包含完整消息

`done` 事件的 `data.session.messages` 包含完整的消息历史（含 user + assistant），应该用它替换本地消息列表。

### 8.5 OpenClaw 需要配置

使用 OpenClaw 员工前，必须在设置中配置 Gateway URL 和 API Key：

```javascript
await fetch('/api/settings', {
  method: 'POST', headers: HEADERS,
  body: JSON.stringify({
    openclaw_gateway_url: 'ws://127.0.0.1:18789',
    openclaw_api_key: 'your-bearer-token',
  }),
});
```

---

## 9. 数据模型

### Employee

```typescript
interface Employee {
  id: string;              // 12位 hex
  name: string;
  avatar_index: number;    // 0-6
  description: string;
  traits: string[];
  capabilities: {
    search: boolean;       // 联网搜索
    memory: boolean;       // 长期记忆
    autoExec: boolean;     // 自主执行
    knowledge: boolean;    // 知识库
  };
  profile_name: string;    // "emp-{id}"
  agent_provider: string;  // "hermes" | "openclaw"
  created_at: number;      // Unix timestamp
}
```

### Session

```typescript
interface Session {
  session_id: string;
  title: string;
  profile: string;         // 匹配 employee.profile_name
  model: string;
  workspace: string;
  messages: Message[];
  created_at: number;
  updated_at: number;
  pinned: boolean;
  archived: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
}
```

### Message

```typescript
interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  attachments?: string[];
  _ts?: number;            // 时间戳
  tool_calls?: ToolCall[];
}
```

### AgentProvider

```typescript
interface AgentProvider {
  id: string;              // "hermes" | "openclaw"
  available: boolean;
  is_default: boolean;
  models: { id: string }[];
  interfaces: {
    name: string;
    status: 'implemented' | 'not_implemented' | 'unknown';
  }[];
}
```
