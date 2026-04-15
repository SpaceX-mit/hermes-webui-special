# IAgentProvider 多 Agent 接入架构设计

## Context

当前 JDUI 服务端直接 `import run_agent.AIAgent` 调用 Hermes Agent，是硬编码的一对一绑定。需要在 server 和 agent 之间引入 `IAgentProvider` 抽象层，支持多种 Agent 后端接入（Hermes、OpenClaw 等），并通过 `AgentManager` 统一管理。

## 1. 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                     JDUI Server (api/)                       │
│                                                              │
│  routes.py → streaming.py → AgentManager                     │
│                                  │                           │
│                          ┌───────┴───────┐                   │
│                          │ IAgentProvider │ (抽象接口)         │
│                          └───────┬───────┘                   │
│                    ┌─────────────┼─────────────┐             │
│                    ▼             ▼              ▼             │
│            ┌──────────┐  ┌──────────┐  ┌──────────────┐      │
│            │ Hermes   │  │ OpenClaw │  │ 未来扩展...   │      │
│            │ Provider │  │ Provider │  │              │      │
│            └────┬─────┘  └────┬─────┘  └──────────────┘      │
└─────────────────┼─────────────┼──────────────────────────────┘
                  │             │
                  ▼             ▼
           Hermes Agent    OpenClaw Gateway
           (Python 类库)    (WebSocket/SDK)
```

## 2. IAgentProvider 接口定义

```python
# api/agent_provider.py

from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Optional
from dataclasses import dataclass

@dataclass
class AgentUsage:
    """Agent 执行后的用量统计"""
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0
    context_length: int = 0
    compression_count: int = 0

@dataclass
class AgentResult:
    """Agent 执行结果"""
    messages: List[Dict]           # 更新后的消息历史
    usage: AgentUsage              # token 用量
    session_id_changed: bool       # session_id 是否因压缩而变化
    new_session_id: Optional[str]  # 变化后的新 ID

class IAgentProvider(ABC):
    """Agent 提供者抽象接口"""

    @abstractmethod
    def create_agent(self,
                     model: str,
                     provider: str,
                     base_url: Optional[str],
                     api_key: Optional[str],
                     toolsets: List[str],
                     fallback_model: Optional[str],
                     session_id: str,
                     on_token: Callable[[str], None],
                     on_tool: Callable[[str, str, dict], None],
                     ) -> 'IAgent':
        """创建一个 Agent 实例"""
        pass

    @abstractmethod
    def get_provider_id(self) -> str:
        """返回提供者标识，如 'hermes', 'openclaw'"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """检查该 provider 是否可用（依赖已安装等）"""
        pass

    @abstractmethod
    def get_supported_models(self) -> List[Dict]:
        """返回该 provider 支持的模型列表"""
        pass


class IAgent(ABC):
    """单次 Agent 运行实例"""

    @abstractmethod
    def run(self,
            user_message: str,
            system_message: str,
            conversation_history: List[Dict],
            session_id: str,
            personality: Optional[str] = None,
            ) -> AgentResult:
        """执行对话，返回结果"""
        pass

    @abstractmethod
    def interrupt(self, reason: str) -> None:
        """中断执行"""
        pass

    @abstractmethod
    def get_usage(self) -> AgentUsage:
        """获取执行后的用量"""
        pass
```

## 3. AgentManager

```python
# api/agent_manager.py

class AgentManager:
    """管理所有注册的 AgentProvider"""

    _providers: Dict[str, IAgentProvider] = {}
    _default_provider: str = 'hermes'

    @classmethod
    def register(cls, provider: IAgentProvider):
        """注册一个 provider"""
        cls._providers[provider.get_provider_id()] = provider

    @classmethod
    def get_provider(cls, provider_id: str = None) -> IAgentProvider:
        """获取指定 provider，默认返回 default"""
        pid = provider_id or cls._default_provider
        if pid not in cls._providers:
            raise ValueError(f"Agent provider '{pid}' not registered")
        return cls._providers[pid]

    @classmethod
    def set_default(cls, provider_id: str):
        cls._default_provider = provider_id

    @classmethod
    def list_providers(cls) -> List[Dict]:
        """列出所有已注册的 provider"""
        return [
            {
                'id': pid,
                'available': p.is_available(),
                'is_default': pid == cls._default_provider,
            }
            for pid, p in cls._providers.items()
        ]

    @classmethod
    def auto_discover(cls):
        """自动发现并注册可用的 provider"""
        # Hermes
        try:
            from api.providers.hermes_provider import HermesProvider
            cls.register(HermesProvider())
        except Exception:
            pass
        # OpenClaw
        try:
            from api.providers.openclaw_provider import OpenClawProvider
            cls.register(OpenClawProvider())
        except Exception:
            pass
```

## 4. Hermes Provider 实现

```python
# api/providers/hermes_provider.py

class HermesProvider(IAgentProvider):
    """封装现有的 Hermes Agent (run_agent.AIAgent)"""

    def get_provider_id(self) -> str:
        return 'hermes'

    def is_available(self) -> bool:
        try:
            from run_agent import AIAgent
            return True
        except ImportError:
            return False

    def create_agent(self, ...) -> IAgent:
        return HermesAgent(...)

    def get_supported_models(self) -> List[Dict]:
        # 从 config.yaml 读取已配置的模型


class HermesAgent(IAgent):
    """封装 AIAgent.run_conversation()"""

    def __init__(self, ...):
        from run_agent import AIAgent
        self._agent = AIAgent(
            model=model, provider=provider, ...
            stream_delta_callback=on_token,
            tool_progress_callback=on_tool,
        )

    def run(self, ...) -> AgentResult:
        result = self._agent.run_conversation(...)
        return AgentResult(
            messages=result.get('messages', []),
            usage=self.get_usage(),
            ...
        )

    def interrupt(self, reason):
        self._agent.interrupt(reason)

    def get_usage(self) -> AgentUsage:
        return AgentUsage(
            input_tokens=getattr(self._agent, 'session_prompt_tokens', 0),
            output_tokens=getattr(self._agent, 'session_completion_tokens', 0),
            estimated_cost_usd=getattr(self._agent, 'session_estimated_cost_usd', 0),
        )
```

## 5. OpenClaw Provider 实现（预留）

```python
# api/providers/openclaw_provider.py

class OpenClawProvider(IAgentProvider):
    """通过 openclaw-sdk 连接 OpenClaw Gateway"""

    def get_provider_id(self) -> str:
        return 'openclaw'

    def is_available(self) -> bool:
        try:
            import openclaw_sdk
            return True
        except ImportError:
            return False

    def create_agent(self, ...) -> IAgent:
        return OpenClawAgent(...)


class OpenClawAgent(IAgent):
    """封装 openclaw-sdk 的 Agent.execute_stream()"""

    def __init__(self, ...):
        from openclaw_sdk import OpenClawClient
        self._client = OpenClawClient(base_url=base_url, api_key=api_key)
        self._agent = self._client.get_agent(agent_id)

    def run(self, ...) -> AgentResult:
        # 使用 execute_stream() 流式执行
        # 将 OpenClaw 的事件转换为 on_token/on_tool 回调
        for event in self._agent.execute_stream(message):
            if event.type == 'token':
                self._on_token(event.text)
            elif event.type == 'tool':
                self._on_tool(event.name, event.preview, event.args)
        return AgentResult(messages=..., usage=...)
```

## 6. streaming.py 改造

当前 `_run_agent_streaming()` 直接操作 `AIAgent`，改造后通过 `AgentManager` 获取 provider：

```python
# 改造前（当前）
from run_agent import AIAgent
agent = AIAgent(model=..., provider=..., ...)
result = agent.run_conversation(...)

# 改造后
from api.agent_manager import AgentManager
provider = AgentManager.get_provider(agent_provider_id)
agent = provider.create_agent(model=..., ...)
result = agent.run(user_message=..., system_message=..., ...)
```

关键改动点（全部在 `api/streaming.py`）：
- 移除 `from run_agent import AIAgent` 直接导入
- `_run_agent_streaming()` 接收额外参数 `agent_provider_id`
- Agent 实例化改为通过 `AgentManager.get_provider().create_agent()`
- `agent.run_conversation()` 改为 `agent.run()`
- 用量提取改为 `agent.get_usage()`
- 中断改为 `agent.interrupt()`

## 7. 员工绑定 Provider

员工记录增加 `agent_provider` 字段：

```json
{
  "id": "abc123",
  "name": "数据分析师",
  "agent_provider": "hermes",
  "profile_name": "emp-abc123",
  ...
}
```

切换员工时，同时切换 agent provider。

## 8. 新增 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agent/providers` | 列出已注册的 provider |
| POST | `/api/agent/provider/set-default` | 设置默认 provider |

## 9. 文件结构

```
api/
├── agent_provider.py          # IAgentProvider + IAgent 接口定义
├── agent_manager.py           # AgentManager 注册/发现/管理
├── providers/
│   ├── __init__.py
│   ├── hermes_provider.py     # Hermes Agent 实现
│   └── openclaw_provider.py   # OpenClaw 实现（预留）
├── streaming.py               # 改造：通过 AgentManager 调用
├── employees.py               # 增加 agent_provider 字段
└── routes.py                  # 新增 /api/agent/* 路由
```

## 10. 实施步骤

| 阶段 | 内容 | 风险 |
|------|------|------|
| Phase 1 | 定义 IAgentProvider + IAgent 接口 | 无 |
| Phase 2 | 实现 HermesProvider（封装现有逻辑） | 低 |
| Phase 3 | 实现 AgentManager + 自动发现 | 低 |
| Phase 4 | 改造 streaming.py 通过 AgentManager 调用 | 中 |
| Phase 5 | 新增 API 路由 + 员工绑定 provider | 低 |
| Phase 6 | 实现 OpenClawProvider | 独立 |

## 11. 验证

1. 启动服务 → `GET /api/agent/providers` 返回 `[{id:'hermes', available:true}]`
2. 创建员工 → 默认使用 hermes provider → 聊天正常
3. 安装 openclaw-sdk → 重启 → providers 列表出现 openclaw
4. 创建 openclaw 员工 → 聊天走 OpenClaw 通道
5. 切换回 hermes 员工 → 聊天恢复 Hermes 通道
