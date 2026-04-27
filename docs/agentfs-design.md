# AgentFS — 多 Agent 协作文件系统设计文档

> 版本：v1.0 | 日期：2026-04-23 | 基于 agentfs_dev_prd.pdf

---

## 1. 设计背景与目标

### 1.1 核心理念

> **存储按事，交互按人，Agent 承担分类成本**

传统文件系统以用户/目录为组织单位，多 Agent 协作时文件分散在各自工作区，难以聚合。AgentFS 在不改变物理存储结构的前提下，通过**逻辑索引层**将文件按"项目/事件"维度重新组织，让用户和 Agent 都能以最自然的方式访问文件。

### 1.2 目标用户

| 用户类型 | 诉求 |
|---------|------|
| 普通用户 | 零认知成本，上传即用，Agent 自动分类 |
| 协作用户 | 多 Agent 任务中无缝访问相关文件 |
| 进阶用户 | 主动管理项目、手动分类、配置权限 |

### 1.3 与现有系统的关系

```
现有系统                          AgentFS 新增
─────────────────────────────     ──────────────────────────────
sysfiles.py                       agentfs.py
  物理文件管理（按人）        ──►   逻辑索引层（按事）
  多根目录树                        项目文件聚合视图

employees.json                    projects.json（扩展）
  员工/Agent 管理             ──►   项目 Agent 协作配置

sessions.js（项目芯片）       ──►   agentfs.js
  会话级项目过滤                    完整项目空间 UI
```

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  我的空间     │  │  项目空间     │  │  权限审批通知  │  │
│  │ (sysfiles)   │  │ (agentfs.js) │  │  (topbar)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────┐
│                      API 路由层                           │
│  /api/sysfile/*    /api/agentfs/*    /api/projects/*     │
└─────────┬─────────────────┬──────────────────┬──────────┘
          │                 │                  │
┌─────────▼──────┐  ┌───────▼────────┐  ┌─────▼──────────┐
│  sysfiles.py   │  │  agentfs.py    │  │agentfs_perms.py│
│  物理文件操作   │  │  逻辑索引管理   │  │  权限管理       │
└─────────┬──────┘  └───────┬────────┘  └─────┬──────────┘
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼──────────┐
│                      数据存储层                           │
│  ~/.hermes/webui/                                        │
│    employees.json      ← 员工/Agent 物理工作区            │
│    projects.json       ← 项目元数据（扩展字段）            │
│    agentfs_index.json  ← 逻辑索引（文件→项目映射）         │
│    permission_requests.json ← 权限申请记录               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心概念：逻辑索引

逻辑索引是 AgentFS 的核心，它**不移动文件**，只记录"哪个文件属于哪个项目"的映射关系。

```
物理存储（按人）                    逻辑索引（按事）
─────────────────────               ─────────────────────
员工A/workspace/                    项目X/
  report.pdf          ──entry_1──►    report.pdf  (来自员工A)
  draft.docx                          code.py     (来自员工B)
员工B/workspace/                      design.fig  (来自员工C)
  code.py             ──entry_2──►
员工C/workspace/
  design.fig          ──entry_3──►
```

---

## 3. 数据模型

### 3.1 agentfs_index.json

```json
{
  "version": 1,
  "entries": [
    {
      "entry_id": "abc123def456",
      "project_id": "proj_aabbccdd1122",
      "root_id": "emp-051e588f14d9",
      "rel_path": "reports/q1_report.pdf",
      "added_at": 1714000000.0,
      "added_by": "emp-051e588f14d9",
      "tags": ["报告", "Q1"]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `entry_id` | string | 12位hex，唯一标识 |
| `project_id` | string | 关联的项目ID |
| `root_id` | string | 文件所在根目录ID（来自 sysfiles.get_roots()） |
| `rel_path` | string | 相对于根目录的路径 |
| `added_at` | float | 添加时间戳 |
| `added_by` | string | 添加者（员工ID或"user"） |
| `tags` | list | 可选标签 |

### 3.2 projects.json（扩展字段）

在现有 `{project_id, name, color, created_at}` 基础上新增：

```json
{
  "project_id": "proj_aabbccdd1122",
  "name": "AI图像生成项目",
  "color": "#7cb9ff",
  "created_at": 1714000000.0,
  "description": "使用多Agent协作完成AI图像生成工作流",
  "status": "active",
  "agents": [
    {
      "emp_id": "emp-aaa111",
      "role": "设计Agent",
      "permissions": {"read": true, "write": true}
    },
    {
      "emp_id": "emp-bbb222",
      "role": "开发Agent",
      "permissions": {"read": true, "write": false}
    }
  ],
  "skill_ref": "project_proj_aabbccdd1122",
  "charter": "# 项目章程\n\n## 目标\n...",
  "updated_at": 1714000000.0
}
```

### 3.3 permission_requests.json

```json
{
  "requests": [
    {
      "request_id": "req_112233445566",
      "project_id": "proj_aabbccdd1122",
      "requester_emp_id": "emp-aaa111",
      "target_root_id": "emp-bbb222",
      "target_rel_path": "design/mockup_v2.fig",
      "reason": "需要读取设计稿以生成代码",
      "status": "pending",
      "expires_at": null,
      "created_at": 1714000000.0,
      "resolved_at": null
    }
  ]
}
```

---

## 4. API 设计

### 4.1 逻辑索引 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agentfs/project/files?project_id=xxx` | 获取项目聚合文件列表 |
| POST | `/api/agentfs/project/add` | 添加文件到项目 |
| POST | `/api/agentfs/project/remove` | 从项目移除文件 |
| POST | `/api/agentfs/project/move` | 移动到其他项目 |

**GET /api/agentfs/project/files 响应**
```json
{
  "project_id": "proj_xxx",
  "files": [
    {
      "entry_id": "abc123",
      "rel_path": "report.pdf",
      "root_id": "emp-aaa",
      "root_label": "张三",
      "name": "report.pdf",
      "size": 102400,
      "mtime": 1714000000.0,
      "exists": true,
      "tags": []
    }
  ]
}
```

**POST /api/agentfs/project/add 请求**
```json
{
  "project_id": "proj_xxx",
  "root_id": "emp-aaa",
  "rel_path": "report.pdf",
  "tags": ["报告"]
}
```

### 4.2 项目 Agent 协作 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/agents/add` | 添加 Agent 到项目 |
| POST | `/api/projects/agents/remove` | 从项目移除 Agent |
| POST | `/api/projects/update` | 更新项目元数据（description/status/charter） |

### 4.3 权限管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agentfs/permissions?project_id=xxx` | 获取项目权限矩阵 |
| POST | `/api/agentfs/permissions/update` | 更新 Agent 对文件的权限 |
| GET | `/api/agentfs/permission/requests` | 获取待审批权限申请列表 |
| POST | `/api/agentfs/permission/approve` | 审批通过 |
| POST | `/api/agentfs/permission/deny` | 拒绝申请 |

### 4.4 Skill 生成 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/agentfs/project/skill/generate` | 生成项目 Skill 文件 |
| GET | `/api/agentfs/project/skill?project_id=xxx` | 获取 Skill 内容 |
| POST | `/api/agentfs/project/charter` | 更新项目章程 |
| GET | `/api/agentfs/project/log?project_id=xxx` | 获取项目任务日志 |

---

## 5. 前端设计

### 5.1 整体布局

AgentFS 前端集成在现有 sysfiles 文件管理器面板内，顶部新增"我的空间 / 项目空间"切换标签。

```
┌─────────────────────────────────────────────────────────────┐
│  [✕]  文件管理器                                              │
│  ┌──────────────┬──────────────────────────────────────┐    │
│  │ [我的空间]   │ [项目空间]  ← 新增标签                │    │
│  └──────────────┴──────────────────────────────────────┘    │
│                                                              │
│  ── 项目空间视图 ──────────────────────────────────────────  │
│  ┌──────────────────────┬───────────────────────────────┐   │
│  │  项目列表 (左侧)      │  项目文件列表 (右侧)           │   │
│  │  ─────────────────   │  ─────────────────────────── │   │
│  │  + 新建项目           │  [上传到项目] [管理Agent]      │   │
│  │                      │                               │   │
│  │  ● AI图像生成项目     │  📄 report.pdf  [张三]        │   │
│  │  ● 数据分析项目       │  📄 code.py     [李四]        │   │
│  │  ● 营销方案           │  📄 design.fig  [王五]        │   │
│  │                      │                               │   │
│  │                      │  [来源标签] [添加文件] [移除]  │   │
│  └──────────────────────┴───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 项目详情面板

点击项目后右侧展示：

```
┌─────────────────────────────────────────────────────────────┐
│  ● AI图像生成项目                          [编辑] [删除]      │
│  状态: 进行中  |  创建: 2026-04-23  |  文件: 12个            │
│  描述: 使用多Agent协作完成AI图像生成工作流                     │
│                                                              │
│  ── 参与 Agent ──────────────────────────────────────────── │
│  [张三 · 设计Agent · 读写]  [李四 · 开发Agent · 只读]  [+]   │
│                                                              │
│  ── 项目文件 ────────────────────────────────────────────── │
│  筛选: [全部▼]  [按时间▼]                    [+ 添加文件]    │
│                                                              │
│  📄 report.pdf          张三  2026-04-20  102KB  [•••]      │
│  📄 code.py             李四  2026-04-21   8KB   [•••]      │
│  🖼 design.fig          王五  2026-04-22  2.1MB  [•••]      │
│                                                              │
│  ── 项目 Skill ──────────────────────────────────────────── │
│  [生成 Skill]  [查看章程]                                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 权限矩阵 UI

```
┌─────────────────────────────────────────────────────────────┐
│  权限配置 — AI图像生成项目                                    │
│                                                              │
│              张三(设计)   李四(开发)   王五(测试)             │
│  report.pdf  [读写  ▼]   [只读  ▼]   [禁止  ▼]             │
│  code.py     [只读  ▼]   [读写  ▼]   [只读  ▼]             │
│  design.fig  [读写  ▼]   [只读  ▼]   [禁止  ▼]             │
│                                                              │
│  快捷操作: [全部只读] [仅我可见] [重置默认]                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 权限申请通知

```
顶部通知栏（有待审批时显示）：
┌─────────────────────────────────────────────────────────────┐
│  🔔 有 2 个权限申请待审批                          [查看]    │
└─────────────────────────────────────────────────────────────┘

审批弹窗：
┌─────────────────────────────────────────────────────────────┐
│  权限申请                                                    │
│  ─────────────────────────────────────────────────────────  │
│  申请方：张三 (设计Agent)                                    │
│  目标文件：李四/workspace/code.py                            │
│  申请理由：需要读取代码以生成设计规范                          │
│  有效期：1小时                                               │
│                                                              │
│                              [拒绝]  [批准临时访问]          │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 sysfiles 右键菜单扩展

在现有右键菜单基础上新增：

```
┌─────────────────┐
│  预览            │
│  下载            │
│  重命名          │
│  ─────────────  │
│  添加到项目  ►   │  ← 新增，展开子菜单显示项目列表
│  ─────────────  │
│  版本历史        │
│  删除            │
└─────────────────┘
```

### 5.6 协作关系图

项目详情页底部展示 Agent 协作关系 SVG 图：

```
        ┌──────────┐
        │  用户     │
        └────┬─────┘
             │ 创建任务
    ┌────────▼────────┐
    │   主Agent(张三)  │
    └──┬──────────┬───┘
       │          │
  设计任务      开发任务
       │          │
┌──────▼──┐  ┌───▼──────┐
│ 设计Agent│  │ 开发Agent │
│  (王五)  │  │  (李四)   │
└──────────┘  └──────────┘
```

---

## 6. 后端模块设计

### 6.1 api/agentfs.py

```python
# 核心函数
def afs_add_to_project(project_id, root_id, rel_path, added_by, tags=None) -> dict
def afs_remove_from_project(entry_id) -> bool
def afs_list_project_files(project_id) -> list[dict]
def afs_move_entry(entry_id, new_project_id) -> bool
def afs_get_entry(entry_id) -> dict | None

# 内部
def _load_index() -> dict
def _save_index(data: dict)
def _index_path() -> Path
```

### 6.2 api/agentfs_permissions.py

```python
class PermissionLevel(Enum):
    DENY = "deny"
    READ = "read"
    WRITE = "write"

# 权限检查
def check_permission(emp_id, root_id, rel_path) -> PermissionLevel

# 权限申请流程
def create_permission_request(requester_emp_id, target_root_id, rel_path, project_id, reason) -> dict
def approve_request(request_id) -> bool   # 临时授权1小时
def deny_request(request_id) -> bool
def get_pending_requests() -> list[dict]
def cleanup_expired_requests()            # 后台线程定期调用

# 内部
def _load_requests() -> dict
def _save_requests(data: dict)
```

### 6.3 api/agentfs_skill.py

```python
def generate_project_skill(project_id) -> str   # 返回生成的Skill内容
def get_project_skill(project_id) -> str | None
def get_project_charter(project_id) -> str | None
def update_project_charter(project_id, content) -> bool
def get_project_log(project_id) -> list[dict]
def append_project_log(project_id, agent_id, action, detail)
```

**生成的 Skill 文件格式** (`~/.hermes/profiles/{profile}/skills/project_{id}.md`)：

```markdown
# 项目：{项目名称}

## 项目背景
{description}

## 你的角色
你是 {Agent名称}，在本项目中担任 {role}。

## 参与成员
{其他Agent列表及职责}

## 工作流程
1. 接收任务后，优先读取项目文件：
   {文件列表}
2. 完成工作后，将输出保存到你的工作区
3. 完成后在 project_log.md 中记录完成情况
4. 通知下一个负责的 Agent 或用户

## 输出规范
- 所有输出文件命名需包含日期：YYYY-MM-DD_文件名
- 完成报告格式：project_log.md（追加写入）

## 项目文件索引
{逻辑索引中的文件列表}
```

---

## 7. 开发阶段计划

### Phase 1 — 逻辑索引 + 项目文件聚合（P0）

**目标**：用户可以将文件添加到项目，并在项目视图中看到聚合的文件列表。

**后端**
- [ ] 新建 `api/agentfs.py`（逻辑索引 CRUD）
- [ ] `api/routes.py` 新增 `/api/agentfs/project/*` 路由
- [ ] `api/routes.py` 扩展 `/api/projects/create` 支持 description/agents/status

**前端**
- [ ] `static/sysfiles.js` 右键菜单新增"添加到项目"
- [ ] 新建 `static/agentfs.js`（项目空间视图）
- [ ] `static/index.html` sysfiles 面板加"项目空间"标签
- [ ] `static/jdui.css` 新增项目空间样式

### Phase 2 — Agent 协作配置 + 权限矩阵（P1）

**目标**：项目可以配置参与的 Agent 及其权限。

**后端**
- [ ] 新建 `api/agentfs_permissions.py`（权限枚举、check/grant/revoke）
- [ ] `api/routes.py` 新增 `/api/projects/agents/*` 和 `/api/agentfs/permissions/*` 路由

**前端**
- [ ] `static/agentfs.js` 权限矩阵 UI
- [ ] Agent 选择器（从 employees 列表选择）

### Phase 3 — 动态权限申请流程（P0）

**目标**：Agent 访问无权限文件时自动发起申请，用户审批后临时生效。

**后端**
- [ ] `api/agentfs_permissions.py` 申请/审批/回收流程
- [ ] 后台线程定期清理过期临时权限
- [ ] `api/routes.py` 新增 `/api/agentfs/permission/requests|approve|deny`

**前端**
- [ ] 顶部通知角标（轮询 pending requests）
- [ ] 审批弹窗

### Phase 4 — Skill 封装 + 任务流转（P1）

**目标**：为项目生成 Skill 文件，Agent 加载后知道自己的角色和工作方式。

**后端**
- [ ] 新建 `api/agentfs_skill.py`
- [ ] `api/routes.py` 新增 Skill/Charter/Log 路由

**前端**
- [ ] 项目详情页"生成 Skill"按钮
- [ ] 章程编辑器（Markdown）
- [ ] 任务日志展示

### Phase 5 — 自然语言创建 + 协作关系图（P1）

**目标**：用户通过自然语言创建项目，系统生成协作关系图。

**后端**
- [ ] `/api/projects/create` 支持 `from_nl` 参数

**前端**
- [ ] 自然语言创建项目入口
- [ ] SVG 协作关系图渲染

---

## 8. 非功能需求

| 指标 | 要求 |
|------|------|
| 文件分类推荐响应 | P95 < 500ms |
| 权限检查 | 同步，< 10ms |
| 逻辑索引读写 | 文件锁保护，并发安全 |
| 临时权限有效期 | 1小时，后台自动回收 |
| 兼容性 | 主流浏览器 + K3/客户板硬件 |
| 安全性 | 所有权限变更需用户显式确认，日志可追溯 |

---

## 9. 文件结构

```
hermes-webui/
├── api/
│   ├── agentfs.py              # 逻辑索引核心（新建）
│   ├── agentfs_permissions.py  # 权限管理（新建）
│   ├── agentfs_skill.py        # Skill生成（新建）
│   └── routes.py               # 新增 /api/agentfs/* 路由
├── static/
│   ├── agentfs.js              # 前端项目空间（新建）
│   ├── sysfiles.js             # 新增右键菜单项
│   ├── index.html              # 新增项目空间标签、通知栏
│   └── jdui.css                # 新增样式
└── docs/
    └── agentfs-design.md       # 本文档
```

---

*文档由 Kiro 生成，基于 agentfs_dev_prd.pdf 需求文档*
