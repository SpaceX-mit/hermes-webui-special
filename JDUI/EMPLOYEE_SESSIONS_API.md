# 按员工获取会话列表接口

## 接口说明

根据员工 ID 获取该员工的所有历史会话，按更新时间倒序排列。通过匹配 `session.profile == employee.profile_name` 关联员工和会话。

## 接口定义

```
GET /api/employee/sessions?employee_id={员工ID}
```

### 请求参数

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| employee_id | query | string | 是 | 员工 ID（12 位 hex） |

### 响应

```json
{
  "employee_id": "d71c565ba2cb",
  "employee_name": "王老五",
  "agent_provider": "openclaw",
  "count": 11,
  "sessions": [
    {
      "session_id": "eb018b72c27d",
      "title": "hi",
      "profile": "emp-d71c565ba2cb",
      "model": "main",
      "message_count": 4,
      "created_at": 1776224100.0,
      "updated_at": 1776224538.0,
      "pinned": false,
      "archived": false,
      "input_tokens": 85,
      "output_tokens": 120,
      "estimated_cost": 0.003
    }
  ]
}
```

### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| employee_id | string | 员工 ID |
| employee_name | string | 员工名称 |
| agent_provider | string | Agent 平台（`hermes` 或 `openclaw`） |
| count | int | 会话总数 |
| sessions | array | 会话列表，按 `updated_at` 倒序 |

### 错误响应

| 状态码 | 场景 | 响应 |
|--------|------|------|
| 400 | 缺少 employee_id | `{"error": "employee_id required"}` |
| 404 | 员工不存在 | `{"error": "employee not found"}` |

## 使用示例

### JavaScript

```javascript
async function getEmployeeSessions(employeeId) {
  const res = await fetch(`/api/employee/sessions?employee_id=${employeeId}`);
  const data = await res.json();
  
  console.log(`${data.employee_name} (${data.agent_provider}): ${data.count} 个会话`);
  
  data.sessions.forEach(s => {
    console.log(`  ${s.title} - ${s.message_count} 条消息`);
  });
  
  return data;
}
```

### Python

```python
import requests

resp = requests.get("http://127.0.0.1:8787/api/employee/sessions", 
                     params={"employee_id": "d71c565ba2cb"})
data = resp.json()

print(f"{data['employee_name']} ({data['agent_provider']}): {data['count']} 个会话")
for s in data["sessions"]:
    print(f"  {s['title']} - {s.get('message_count', 0)} 条消息")
```

### curl

```bash
curl "http://127.0.0.1:8787/api/employee/sessions?employee_id=d71c565ba2cb"
```

## 实现原理

1. 根据 `employee_id` 查找员工记录，获取 `profile_name`
2. 遍历内存缓存 `SESSIONS` + 磁盘 `SESSION_DIR/*.json`
3. 匹配 `session.profile == employee.profile_name`
4. 按 `updated_at` 倒序排列返回

## 典型场景

- 切换员工后加载该员工的历史对话列表
- 在员工详情页展示对话记录
- 统计某个员工的对话数量和 token 用量

---

## 测试记录

### 测试环境

```
服务地址: http://127.0.0.1:8787
HERMES_WEBUI_HOST=0.0.0.0
Agent Providers: hermes (available), openclaw (available)
```

### 测试 1：OpenClaw 员工（王老五）

```bash
curl -s "http://127.0.0.1:8787/api/employee/sessions?employee_id=d71c565ba2cb"
```

结果：

```
员工: 王老五 | provider: openclaw | 会话数: 11
  6752c13c6daa | Untitled                  | msgs=0
  eb018b72c27d | hi                        | msgs=4
  8eebf92eebf7 | 你号                      | msgs=4
  d371223d3f09 | Untitled                  | msgs=2
  851b1ef62965 | Untitled                  | msgs=2
```

✅ 正确返回 OpenClaw 员工的所有会话，按时间倒序。

### 测试 2：Hermes 员工（1 号员工）

```bash
curl -s "http://127.0.0.1:8787/api/employee/sessions?employee_id=bd2be9b90bf5"
```

结果：

```
员工: 1 号员工 | provider: hermes | 会话数: 3
  0f23fdd26c5e | Untitled                              | msgs=0
  94af1ce94d5d | Untitled                              | msgs=0
  cbf7f641eeea | 你能提供Hermes根据agent获取会话的接口么 | msgs=53
```

✅ 正确返回 Hermes 员工的会话，包含有大量消息的历史对话。

### 测试 3：少量会话的员工（王老三）

```bash
curl -s "http://127.0.0.1:8787/api/employee/sessions?employee_id=97e757e440ab"
```

结果：

```
员工: 王老三 | provider: openclaw | 会话数: 2
  b3baacc58dcc | hi | msgs=2
  d14d452c46a6 | hi | msgs=2
```

✅ 正确返回。

### 测试 4：不存在的员工

```bash
curl -s "http://127.0.0.1:8787/api/employee/sessions?employee_id=notexist"
```

结果：

```json
{"error": "employee not found"}
```

✅ 返回 404，错误信息明确。

### 测试 5：缺少参数

```bash
curl -s "http://127.0.0.1:8787/api/employee/sessions"
```

结果：

```json
{"error": "employee_id required"}
```

✅ 返回 400，参数校验正确。

### 测试 6：列出所有员工后逐个查询

```bash
# 先获取所有员工 ID
curl -s http://127.0.0.1:8787/api/employees | python3 -c "
import sys,json
d=json.load(sys.stdin)
for e in d['employees']:
    print(f\"{e['id']} | {e['name']} | {e.get('agent_provider','?')}\")
"
```

结果：

```
b5aa2fdc851e | 测试工程师       | ?
7ce2b1e9422b | 数据分析师-1     | ?
c8198a2396ff | 会议助手         | ?
a7ec520cc9bf | 项目经理-1：李沟沟 | ?
a1f666de42bd | 我的客户         | ?
803e2a864868 | 1 号员工         | ?
bd2be9b90bf5 | 1 号员工         | ?
5c1341e89b8a | 王老二           | openclaw
97e757e440ab | 王老三           | openclaw
48792227b66a | 王老四           | openclaw
d71c565ba2cb | 王老五           | openclaw
80ab369125db | 王老六           | openclaw
9480dca015a3 | 王老七           | hermes
3e2047855ebf | 王老八           | openclaw
84cdcfff6047 | 1 号员工         | hermes
17dc1c101492 | 1 号员工         | hermes
```

然后用任意 employee_id 调用 `/api/employee/sessions` 即可获取对应会话。

### 测试总结

| 测试场景 | 状态码 | 结果 |
|----------|--------|------|
| OpenClaw 员工（多会话） | 200 | ✅ 正确返回 11 个会话 |
| Hermes 员工（含历史对话） | 200 | ✅ 正确返回 3 个会话 |
| 少量会话的员工 | 200 | ✅ 正确返回 2 个会话 |
| 不存在的员工 | 404 | ✅ `employee not found` |
| 缺少参数 | 400 | ✅ `employee_id required` |
