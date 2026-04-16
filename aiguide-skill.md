# AI Guide - Skills & Documentation

## 📋 文档编写指南

本文档定义了 JDUI 项目中关于 AI 指南、技能开发和架构文档的编写规范和要求。

## 1. 架构文档要求

### 1.1 数字员工与Agent平台对应关系文档

**需求描述：**
- 在 `/docs/agent-architecture/` 目录下创建详细的分析文档
- 说明数字员工、Agent平台、Profile、Session 之间的对应关系
- 包含完整的数据流、流程图和代码示例

**文档结构：**
```
/docs/agent-architecture/
├── README.md                          # 索引和快速导航
├── EMPLOYEE_AGENT_MAPPING.md          # 主要分析文档
└── PROVIDER_IMPLEMENTATION.md         # 技术细节文档
```

**主要内容：**

#### EMPLOYEE_AGENT_MAPPING.md (分析文档)
- 核心概念定义（数字员工、Agent平台、Profile、Session）
- 对应关系矩阵和架构图
- 数据流详解（员工激活、聊天启动）
- Provider 路由解析逻辑
- 会话生命周期管理
- 前端状态管理
- 常见场景和设计模式
- 扩展指南

**适合阅读对象：** 系统架构师、产品经理、新手开发者

#### PROVIDER_IMPLEMENTATION.md (技术细节)
- IAgentProvider 接口规范
- HermesProvider 实现代码
- OpenClawProvider 实现代码
- streaming.py 中的 Provider 分支逻辑
- 线程模型和同步机制
- 错误分类和处理
- 配置管理和优先级
- 测试策略

**适合阅读对象：** 后端开发者、系统集成工程师

#### README.md (索引)
- 文档列表和快速导航
- 关键概念速查表
- 核心流程总结
- 相关文件索引
- 扩展指南
- 测试指南

**适合阅读对象：** 所有开发者

### 1.2 文档质量标准

**必须包含：**
- [ ] 清晰的概念定义
- [ ] 完整的数据流图或时序图
- [ ] 代码示例或伪代码
- [ ] 关键文件索引
- [ ] 常见场景说明
- [ ] 扩展指南

**推荐包含：**
- [ ] ASCII 架构图
- [ ] 表格总结
- [ ] 快速导航链接
- [ ] 版本历史
- [ ] 相关文档交叉引用

**文档格式：**
- 使用 Markdown 格式
- 标题层级清晰（# ## ### ####）
- 代码块使用语言标记（```python, ```javascript 等）
- 使用表格组织复杂信息
- 使用列表和缩进表示层级关系

## 2. 技能开发指南

### 2.1 Skill 定义

在 JDUI 中，Skill 是指：
- 数字员工可以执行的特定功能或任务
- 通过 Hermes 框架的 toolsets 实现
- 可以是内置技能或自定义技能

### 2.2 Skill 文档要求

每个 Skill 应该有对应的文档，包含：

**基本信息：**
- Skill 名称和 ID
- 功能描述
- 适用场景
- 依赖关系

**使用指南：**
- 如何启用/禁用
- 配置参数
- 使用示例
- 常见问题

**实现细节：**
- 技术架构
- 关键代码
- 错误处理
- 性能考虑

### 2.3 Skill 文档位置

```
/docs/
├── agent-architecture/        # Agent 架构文档
├── skills/                     # Skill 文档
│   ├── README.md              # Skill 索引
│   ├── web-search.md          # 网络搜索 Skill
│   ├── memory.md              # 记忆 Skill
│   ├── knowledge-base.md      # 知识库 Skill
│   └── ...
└── ...
```

## 3. 前端开发指南

### 3.1 前端文档要求

前端相关文档应该包含：

**组件文档：**
- 组件名称和用途
- Props 和事件
- 使用示例
- 样式定制

**状态管理：**
- 全局状态对象 (S, EMPLOYEE)
- 状态更新流程
- 事件处理

**API 集成：**
- 端点列表
- 请求/响应格式
- 错误处理

### 3.2 前端文档位置

```
/docs/
├── frontend/                   # 前端文档
│   ├── README.md              # 前端指南索引
│   ├── components.md          # 组件文档
│   ├── state-management.md    # 状态管理
│   ├── api-integration.md     # API 集成
│   └── styling.md             # 样式指南
└── ...
```

## 4. 后端开发指南

### 4.1 后端文档要求

后端相关文档应该包含：

**API 文档：**
- 端点列表
- 请求/响应格式
- 认证方式
- 错误代码

**数据模型：**
- 数据结构定义
- 字段说明
- 关系图

**业务逻辑：**
- 核心流程
- 关键算法
- 性能优化

### 4.2 后端文档位置

```
/docs/
├── backend/                    # 后端文档
│   ├── README.md              # 后端指南索引
│   ├── api-reference.md       # API 参考
│   ├── data-models.md         # 数据模型
│   ├── business-logic.md      # 业务逻辑
│   └── deployment.md          # 部署指南
└── ...
```

## 5. 文档维护

### 5.1 更新流程

1. **识别需要更新的文档**
   - 代码变更时检查相关文档
   - 新功能添加时创建文档
   - 定期审查文档准确性

2. **更新文档**
   - 修改相关的 .md 文件
   - 更新交叉引用
   - 更新版本历史

3. **审查和合并**
   - 代码审查时同时审查文档
   - 确保文档与代码同步
   - 合并到主分支

### 5.2 文档版本控制

每个主要文档应该包含版本历史：

```markdown
## 版本历史

- **v1.0** (2026-04-16) - 初始版本
  - 完成 Hermes Provider 实现
  - 完成 OpenClaw Provider 设计
  - 文档化多 Agent 架构

- **v0.9** (2026-04-10) - 草稿版本
  - 初步设计
```

### 5.3 文档检查清单

在提交文档时，检查：

- [ ] 标题和结构清晰
- [ ] 代码示例正确且可运行
- [ ] 链接和引用有效
- [ ] 没有拼写或语法错误
- [ ] 与代码保持同步
- [ ] 版本历史已更新
- [ ] 交叉引用已更新

## 6. 文档工具和流程

### 6.1 推荐工具

- **编辑器：** VS Code, Vim, Emacs
- **Markdown 预览：** VS Code 插件, GitHub 预览
- **图表工具：** Mermaid, PlantUML, ASCII 图
- **版本控制：** Git

### 6.2 本地预览

```bash
# 使用 Python 简单 HTTP 服务器预览 Markdown
cd /data/workspace2026-new/hermes-webui/docs
python3 -m http.server 8000

# 访问 http://localhost:8000
```

### 6.3 CI/CD 集成

文档应该作为 CI/CD 流程的一部分：

- [ ] 检查 Markdown 语法
- [ ] 验证代码块
- [ ] 检查链接有效性
- [ ] 生成文档网站

## 7. 当前文档状态

### 7.1 已完成

- [x] 数字员工与Agent平台对应关系分析
  - [x] EMPLOYEE_AGENT_MAPPING.md - 主要分析文档
  - [x] PROVIDER_IMPLEMENTATION.md - 技术细节文档
  - [x] README.md - 索引和导航

### 7.2 进行中

- [ ] 前端开发指南
- [ ] 后端开发指南
- [ ] Skill 文档

### 7.3 待规划

- [ ] 部署指南
- [ ] 故障排查指南
- [ ] 性能优化指南
- [ ] 安全指南

## 8. 文档贡献指南

### 8.1 如何贡献

1. **Fork 项目**
   ```bash
   git clone <repo>
   cd hermes-webui
   ```

2. **创建分支**
   ```bash
   git checkout -b docs/your-topic
   ```

3. **编写文档**
   - 遵循本指南的格式要求
   - 添加代码示例
   - 包含图表和表格

4. **提交 PR**
   - 清晰的 PR 标题
   - 详细的描述
   - 链接相关 Issue

### 8.2 文档审查标准

审查者应该检查：

- [ ] 内容准确性
- [ ] 格式一致性
- [ ] 代码示例正确性
- [ ] 链接有效性
- [ ] 与现有文档的一致性

### 8.3 常见问题

**Q: 文档应该有多详细？**
A: 足够让新开发者理解核心概念和实现细节，但不需要逐行代码注释。

**Q: 如何处理过时的文档？**
A: 标记为"已过时"，提供新文档的链接，计划删除时间。

**Q: 文档应该放在哪里？**
A: 按照本指南的目录结构组织，相关文档放在同一目录。

## 9. 参考资源

### 9.1 Markdown 指南
- [Markdown 官方指南](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### 9.2 文档最佳实践
- [Google 技术写作指南](https://developers.google.com/tech-writing)
- [Write the Docs](https://www.writethedocs.org/)

### 9.3 相关项目文档
- [Hermes Agent 文档](../../../hermes-agent/website/docs/)
- [OpenClaw 文档](../../../JDClaw/openclaw/docs/)

## 10. 联系方式

如有问题或建议：

- 提交 Issue
- 发起 Pull Request
- 联系文档维护者

---

**最后更新：** 2026-04-16
**维护者：** JDUI 文档团队
**状态：** 活跃维护中
