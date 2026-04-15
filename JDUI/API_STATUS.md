# JDUI WebUI 接口方案与实现状态

> 梳理 JDUI 对外提供的全部 86 个 HTTP 接口，按模块分类，标注实现状态。

## 接口状态说明

| 标记 | 含义 |
|------|------|
| ✅ 已实现 | 功能完整，前后端联通，可正常使用 |
| ⚠️ 部分实现 | 后端接口存在但功能不完整，或前端未对接 |
| ❌ 未实现 | 接口路由存在但核心逻辑缺失或未启用 |

---

## 1. 认证（3 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/auth/status` | ✅ 已实现 | 返回 `{auth_enabled, logged_in}` |
| POST | `/api/auth/login` | ✅ 已实现 | Cookie 认证，PBKDF2 密码哈希，限流 5次/60秒 |
| POST | `/api/auth/logout` | ✅ 已实现 | 清除 session Cookie |

## 2. 数字员工（5 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/employees` | ✅ 已实现 | 列出所有员工，含 `agent_provider` 字段 |
| POST | `/api/employee/create` | ✅ 已实现 | 创建员工 + 按 provider 同步 Hermes Profile |
| POST | `/api/employee/update` | ✅ 已实现 | 更新员工 + 按 provider 同步 SOUL.md/config |
| POST | `/api/employee/delete` | ✅ 已实现 | 删除员工 + 按 provider 清理 Profile |
| POST | `/api/employee/activate` | ✅ 已实现 | 激活员工，Hermes 切换 Profile，OpenClaw 返回信息 |

## 3. Agent Provider（2 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/agent/providers` | ✅ 已实现 | 列出所有 provider + 可用状态 + 接口实现情况 |
| POST | `/api/agent/provider/set-default` | ✅ 已实现 | 设置默认 provider |

## 4. 聊天（5 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| POST | `/api/chat/start` | ✅ 已实现 | 启动流式聊天，按员工 `agent_provider` 路由到对应 provider |
| GET | `/api/chat/stream` | ✅ 已实现 | SSE 流端点，推送 token/tool/done/error 事件 |
| GET | `/api/chat/stream/status` | ✅ 已实现 | 检查流是否活跃 |
| GET | `/api/chat/cancel` | ✅ 已实现 | 取消正在进行的流 |
| POST | `/api/chat` | ⚠️ 部分实现 | 同步聊天备用接口，前端未使用，仅 Hermes 支持 |

## 5. 会话管理（15 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/session` | ✅ 已实现 | 获取单个会话（含消息） |
| GET | `/api/sessions` | ✅ 已实现 | 列出所有会话元数据 |
| GET | `/api/sessions/search` | ✅ 已实现 | 按标题和内容搜索会话 |
| GET | `/api/session/export` | ✅ 已实现 | 导出会话 JSON 文件下载 |
| POST | `/api/session/new` | ✅ 已实现 | 创建新会话，支持 `employee_id` 标记 |
| POST | `/api/session/rename` | ✅ 已实现 | 重命名会话 |
| POST | `/api/session/update` | ✅ 已实现 | 更新会话元数据（workspace, model） |
| POST | `/api/session/delete` | ✅ 已实现 | 删除会话 |
| POST | `/api/session/clear` | ✅ 已实现 | 清空会话消息 |
| POST | `/api/session/truncate` | ✅ 已实现 | 截断会话（保留前 N 条） |
| POST | `/api/session/pin` | ✅ 已实现 | 置顶/取消置顶 |
| POST | `/api/session/archive` | ✅ 已实现 | 归档/取消归档 |
| POST | `/api/session/move` | ✅ 已实现 | 移动到项目 |
| POST | `/api/session/import` | ✅ 已实现 | 从 JSON 导入会话 |
| POST | `/api/session/import_cli` | ⚠️ 部分实现 | 导入 CLI 会话，仅 Hermes 有 CLI 会话源 |
| POST | `/api/sessions/cleanup` | ✅ 已实现 | 清理旧会话 |
| POST | `/api/sessions/cleanup_zero_message` | ✅ 已实现 | 清理空会话 |

## 6. 模型与设置（5 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/models` | ✅ 已实现 | 列出可用模型（从 Hermes config 读取） |
| GET | `/api/settings` | ✅ 已实现 | 获取设置（含 OpenClaw 配置字段） |
| POST | `/api/settings` | ✅ 已实现 | 更新设置，支持 `openclaw_gateway_url` / `openclaw_api_key` |
| GET | `/api/personalities` | ✅ 已实现 | 列出性格预设 |
| POST | `/api/personality/set` | ⚠️ 部分实现 | 设置会话性格，仅 Hermes 支持 `ephemeral_system_prompt` |

## 7. 文件操作（9 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/list` | ✅ 已实现 | 列出目录内容 |
| GET | `/api/file` | ✅ 已实现 | 读取文件内容 |
| GET | `/api/file/raw` | ✅ 已实现 | 下载原始文件（二进制） |
| POST | `/api/file/save` | ✅ 已实现 | 保存文件 |
| POST | `/api/file/create` | ✅ 已实现 | 创建文件 |
| POST | `/api/file/delete` | ✅ 已实现 | 删除文件 |
| POST | `/api/file/rename` | ✅ 已实现 | 重命名文件 |
| POST | `/api/file/create-dir` | ✅ 已实现 | 创建目录 |
| POST | `/api/upload` | ✅ 已实现 | 上传文件（Multipart） |

## 8. 工作区（4 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/workspaces` | ✅ 已实现 | 列出工作区 |
| POST | `/api/workspaces/add` | ✅ 已实现 | 添加工作区 |
| POST | `/api/workspaces/remove` | ✅ 已实现 | 移除工作区 |
| POST | `/api/workspaces/rename` | ✅ 已实现 | 重命名工作区 |

## 9. 定时任务（9 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/crons` | ✅ 已实现 | 列出定时任务 |
| GET | `/api/crons/output` | ✅ 已实现 | 获取任务输出 |
| GET | `/api/crons/recent` | ✅ 已实现 | 最近执行记录 |
| POST | `/api/crons/create` | ✅ 已实现 | 创建定时任务 |
| POST | `/api/crons/update` | ✅ 已实现 | 更新定时任务 |
| POST | `/api/crons/delete` | ✅ 已实现 | 删除定时任务 |
| POST | `/api/crons/run` | ✅ 已实现 | 立即执行 |
| POST | `/api/crons/pause` | ✅ 已实现 | 暂停 |
| POST | `/api/crons/resume` | ✅ 已实现 | 恢复 |

> 注：定时任务仅通过 Hermes Agent 执行。OpenClaw 员工的定时任务需对接 OpenClaw ScheduleManager（未实现）。

## 10. 技能（4 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/skills` | ✅ 已实现 | 列出技能 |
| GET | `/api/skills/content` | ✅ 已实现 | 获取技能内容 |
| POST | `/api/skills/save` | ✅ 已实现 | 保存技能 |
| POST | `/api/skills/delete` | ✅ 已实现 | 删除技能 |

> 注：技能管理仅操作 Hermes Agent 的 skills 目录。OpenClaw 员工的技能需对接 OpenClaw SkillManager（未实现）。

## 11. 记忆（2 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/memory` | ✅ 已实现 | 读取记忆（MEMORY.md / USER.md） |
| POST | `/api/memory/write` | ✅ 已实现 | 写入记忆 |

> 注：记忆管理仅操作 Hermes Agent 的 memories 目录。OpenClaw 员工的记忆需对接 `agent.get_memory_status()` / `reset_memory()`（未实现）。

## 12. Profile 配置文件（5 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/profiles` | ✅ 已实现 | 列出所有 Profile |
| GET | `/api/profile/active` | ✅ 已实现 | 获取当前活跃 Profile |
| POST | `/api/profile/switch` | ✅ 已实现 | 切换 Profile |
| POST | `/api/profile/create` | ✅ 已实现 | 创建 Profile |
| POST | `/api/profile/delete` | ✅ 已实现 | 删除 Profile |

> 注：Profile 系统是 Hermes 专有概念。OpenClaw 员工不使用 Profile。

## 13. 项目（4 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/projects` | ✅ 已实现 | 列出项目 |
| POST | `/api/projects/create` | ✅ 已实现 | 创建项目 |
| POST | `/api/projects/rename` | ✅ 已实现 | 重命名项目 |
| POST | `/api/projects/delete` | ✅ 已实现 | 删除项目 |

## 14. 审批（3 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/approval/pending` | ✅ 已实现 | 查询待审批项 |
| GET | `/api/approval/inject_test` | ✅ 已实现 | 注入测试审批（开发用） |
| POST | `/api/approval/respond` | ✅ 已实现 | 响应审批（once/session/always/deny） |

> 注：审批系统仅对接 Hermes Agent 的 `tools.approval` 模块。OpenClaw 的 ApprovalManager 未对接。

## 15. 引导（3 个接口）

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/onboarding/status` | ✅ 已实现 | 获取引导状态 |
| POST | `/api/onboarding/setup` | ✅ 已实现 | 配置提供商/模型 |
| POST | `/api/onboarding/complete` | ✅ 已实现 | 完成引导 |

## 16. 系统（6 个接口 + 2 个页面 + 1 个静态资源）

| 方法 | 路径 | 类型 | 状态 | 说明 |
|------|------|------|------|------|
| GET | `/health` | REST | ✅ 已实现 | 健康检查 → `{status, sessions, active_streams, uptime}` |
| GET | `/api/git-info` | REST | ✅ 已实现 | Git 仓库信息 |
| GET | `/api/updates/check` | REST | ✅ 已实现 | 检查更新 |
| POST | `/api/updates/apply` | REST | ✅ 已实现 | 应用更新 |
| GET | `/api/sessions/gateway/stream` | SSE | ⚠️ 部分实现 | 网关会话实时同步，仅 Hermes CLI 会话 |
| GET | `/login` | HTML | ✅ 已实现 | 登录页面 |
| GET | `/` | HTML | ✅ 已实现 | 主页面 |
| GET | `/static/*` | 静态资源 | ✅ 已实现 | JS / CSS / 图片 / 字体 |

---

## 统计总结

| 分类 | 接口数 | ✅ 已实现 | ⚠️ 部分实现 | ❌ 未实现 |
|------|--------|----------|------------|----------|
| 认证 | 3 | 3 | 0 | 0 |
| 数字员工 | 5 | 5 | 0 | 0 |
| Agent Provider | 2 | 2 | 0 | 0 |
| 聊天 | 5 | 4 | 1 | 0 |
| 会话管理 | 17 | 16 | 1 | 0 |
| 模型与设置 | 5 | 4 | 1 | 0 |
| 文件操作 | 9 | 9 | 0 | 0 |
| 工作区 | 4 | 4 | 0 | 0 |
| 定时任务 | 9 | 9 | 0 | 0 |
| 技能 | 4 | 4 | 0 | 0 |
| 记忆 | 2 | 2 | 0 | 0 |
| Profile | 5 | 5 | 0 | 0 |
| 项目 | 4 | 4 | 0 | 0 |
| 审批 | 3 | 3 | 0 | 0 |
| 引导 | 3 | 3 | 0 | 0 |
| 系统 | 6 | 5 | 1 | 0 |
| **合计** | **86** | **82** | **4** | **0** |

### 部分实现的 4 个接口

| 接口 | 问题 | 改进方向 |
|------|------|----------|
| `POST /api/chat` | 同步聊天备用接口，前端未使用 | 为 OpenClaw 实现 `agent.execute()` 同步调用 |
| `POST /api/session/import_cli` | 仅 Hermes 有 CLI 会话源 | OpenClaw 无对应概念，可标记为 Hermes-only |
| `POST /api/personality/set` | 仅 Hermes 支持 `ephemeral_system_prompt` | OpenClaw 可通过 system message 注入实现 |
| `GET /api/sessions/gateway/stream` | 仅同步 Hermes CLI 会话变化 | OpenClaw 可对接 Gateway 的 presence 事件 |

---

## 还需要新增的接口（建议）

以下接口当前不存在，但对完善系统有价值：

| 方法 | 路径 | 说明 | 优先级 |
|------|------|------|--------|
| GET | `/api/employee/{id}` | 获取单个员工详情 | 中 |
| GET | `/api/employee/{id}/sessions` | 获取某员工的所有会话 | 中 |
| POST | `/api/employee/{id}/reset-memory` | 重置员工记忆 | 低 |
| GET | `/api/agent/providers/{id}/models` | 获取指定 provider 的模型列表 | 中 |
| GET | `/api/agent/providers/{id}/health` | 检查指定 provider 的健康状态 | 中 |
| POST | `/api/openclaw/test-connection` | 测试 OpenClaw Gateway 连接 | 高 |
| GET | `/api/openclaw/agents` | 列出 OpenClaw Gateway 上的 agent | 中 |
