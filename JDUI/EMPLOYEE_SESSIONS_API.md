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
