# Agent 架构文档索引

本目录包含关于 JDUI 多 Agent 架构的详细文档。

## 📚 文档列表

### 1. [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md)
**数字员工与Agent平台对应关系分析**

这是主要的分析文档，详细说明：
- 数字员工、Agent平台、Profile、Session 的概念和关系
- 完整的数据流和对应关系矩阵
- 员工激活和聊天启动的流程
- Provider 路由解析逻辑
- 会话生命周期管理
- 前端状态管理
- 常见场景和设计模式

**适合阅读对象：** 系统架构师、产品经理、新手开发者

**关键章节：**
- 第2章：对应关系矩阵 - 快速理解系统结构
- 第3章：数据流 - 了解执行流程
- 第4章：Provider 路由解析 - 理解动态选择逻辑
- 第9章：扩展新 Provider - 了解如何添加新后端

### 2. [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md)
**技术细节：Provider 实现与集成**

这是技术实现文档，包含：
- IAgentProvider 接口的完整规范
- HermesProvider 和 OpenClawProvider 的具体实现代码
- streaming.py 中的 Provider 分支逻辑
- 线程模型和同步机制
- 错误分类和处理
- 配置管理和优先级
- 测试策略

**适合阅读对象：** 后端开发者、系统集成工程师

**关键章节：**
- 第1章：IAgentProvider 接口规范 - 了解扩展点
- 第2-3章：Provider 实现 - 参考具体代码
- 第4章：streaming.py 分支逻辑 - 理解执行路径
- 第8章：测试策略 - 编写测试用例

## 🎯 快速导航

### 我想了解...

**系统整体架构**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第1-2章

**数字员工如何绑定到Agent**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第4章

**聊天时如何选择Provider**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第4章 + [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第4章

**如何添加新的Agent后端**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第9章 + [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第1-3章

**前端如何与后端交互**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第7章 + [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第4章

**错误处理和恢复**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第8章 + [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第6章

**会话持久化和恢复**
→ 阅读 [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第6章

## 📊 关键概念速查

### 数字员工 (Employee)
- **定义：** JDUI 前端创建的虚拟助手实体
- **关键属性：** id, name, profile_name, agent_provider, description, avatar_index
- **文档：** [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第1.1节

### Agent 平台 (Provider)
- **定义：** 实际执行对话的后端系统
- **支持的平台：** Hermes (本地), OpenClaw (远程), 可扩展
- **文档：** [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第1.2节

### Profile (Hermes 概念)
- **定义：** Hermes 框架中的配置单元
- **包含内容：** 工具集、性格提示词、环境变量、记忆库、技能库
- **路径：** `~/.hermes/profiles/{profile_name}/`
- **文档：** [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第1.3节

### Session (会话)
- **定义：** 用户与员工的对话会话
- **持久化路径：** `~/.hermes/webui/sessions/{session_id}.json`
- **关键字段：** session_id, profile, employee_id, model, messages, usage
- **文档：** [EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第6章

## 🔄 核心流程

### 员工激活流程
```
用户点击员工 → POST /api/employee/activate → 
  ├─ Hermes: switch_profile() → 
  └─ OpenClaw: 返回配置 → 
创建新会话 → 前端更新状态
```
详见：[EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第3.1节

### 聊天启动流程
```
用户发送消息 → POST /api/chat/start → 
解析 agent_provider_id → 
获取 Provider → 
创建 Agent → 
执行聊天 → 
保存会话 → 
SSE 事件流
```
详见：[EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第3.2节 + [PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第4章

## 📁 相关文件

### 后端文件
- `api/agent_provider.py` - 接口定义
- `api/agent_manager.py` - Provider 管理
- `api/providers/hermes_provider.py` - Hermes 实现
- `api/providers/openclaw_provider.py` - OpenClaw 实现
- `api/streaming.py` - SSE 流引擎
- `api/routes.py` - HTTP 路由
- `api/employees.py` - 员工 CRUD
- `api/models.py` - Session 模型
- `api/profiles.py` - Hermes Profile 管理

### 前端文件
- `static/employee.js` - 员工管理
- `static/ui.js` - UI 同步
- `static/messages.js` - 消息处理
- `static/panels.js` - 面板管理
- `static/sessions.js` - 会话列表

## 🧪 测试

### 单元测试
- 测试 Provider 接口实现
- 测试 Agent 创建和执行
- 测试配置读取

### 集成测试
- 测试 Provider 自动发现
- 测试员工激活流程
- 测试聊天启动和执行
- 测试会话持久化

详见：[PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第8章

## 🚀 扩展指南

### 添加新的 Agent Provider

1. **创建 Provider 类**
   - 继承 `IAgentProvider`
   - 实现所有抽象方法
   - 详见：[PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第1章

2. **创建 Agent 类**
   - 继承 `IAgent`
   - 实现 `run()` 方法
   - 详见：[PROVIDER_IMPLEMENTATION.md](./PROVIDER_IMPLEMENTATION.md) 第2-3章

3. **注册 Provider**
   - 在 `AgentManager.auto_discover()` 中添加
   - 详见：[EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第9章

4. **添加配置字段**
   - 在 `api/config.py` 中添加
   - 详见：[EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第5章

5. **前端支持**
   - 在员工表单中显示 Provider 选择
   - 在 Settings 中显示配置面板
   - 详见：[EMPLOYEE_AGENT_MAPPING.md](./EMPLOYEE_AGENT_MAPPING.md) 第9章

## 📝 版本历史

- **v1.0** (2026-04-16) - 初始版本
  - 完成 Hermes Provider 实现
  - 完成 OpenClaw Provider 设计
  - 文档化多 Agent 架构

## 🤝 贡献指南

修改这些文档时，请：

1. 保持一致的结构和格式
2. 更新相关的交叉引用
3. 添加代码示例和图表
4. 更新版本历史
5. 确保文档与代码同步

## 📞 联系方式

如有问题或建议，请：
- 提交 Issue
- 发起 Pull Request
- 联系架构团队

---

**最后更新：** 2026-04-16
**维护者：** JDUI 架构团队
