# 技术细节：Provider 实现与集成

## 1. IAgentProvider 接口规范

### 1.1 接口定义

```python
# api/agent_provider.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class AgentUsage:
    """Agent 执行的 token 用量统计"""
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    context_length: int
    threshold_tokens: int
    last_prompt_tokens: int
    compression_count: int

@dataclass
class AgentResult:
    """Agent 执行的结果"""
    messages: List[Dict]              # 完整消息列表 (history + user + assistant)
    usage: AgentUsage                 # Token 用量
    session_id_changed: bool = False  # Session ID 是否轮转
    new_session_id: Optional[str] = None

class IAgent(ABC):
    """Agent 实例接口"""
    
    @abstractmethod
    def run(self, user_message: str, system_message: str, 
            conversation_history: List[Dict], session_id: str, 
            personality: str) -> AgentResult:
        """
        执行一次对话
        
        Args:
            user_message: 用户消息
            system_message: 系统提示词
            conversation_history: 对话历史
            session_id: 会话ID
            personality: 性格提示词
            
        Returns:
            AgentResult: 执行结果
        """
        pass
    
    @abstractmethod
    def interrupt(self, reason: str) -> None:
        """中断当前执行"""
        pass
    
    @abstractmethod
    def get_usage(self) -> AgentUsage:
        """获取当前 token 用量"""
        pass

class IAgentProvider(ABC):
    """Agent Provider 接口"""
    
    @abstractmethod
    def get_provider_id(self) -> str:
        """获取 Provider ID (e.g., 'hermes', 'openclaw')"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """检查 Provider 是否可用"""
        pass
    
    @abstractmethod
    def get_supported_models(self) -> List[Dict]:
        """
        获取支持的模型列表
        
        Returns:
            [
                {
                    "id": "claude-3-sonnet",
                    "label": "Claude 3 Sonnet",
                    "provider": "anthropic"
                },
                ...
            ]
        """
        pass
    
    @abstractmethod
    def create_agent(self, model: str, api_key: str, 
                    base_url: Optional[str] = None) -> IAgent:
        """
        创建 Agent 实例
        
        Args:
            model: 模型ID
            api_key: API密钥
            base_url: 可选的自定义基础URL
            
        Returns:
            IAgent: Agent 实例
        """
        pass
```

### 1.2 回调机制

Provider 在执行过程中通过回调通知流式事件：

```python
class IAgent(ABC):
    def __init__(self):
        self.on_token = None      # 回调: on_token(text)
        self.on_tool = None       # 回调: on_tool(name, preview, args)
        self.on_error = None      # 回调: on_error(error_msg)
```

## 2. HermesProvider 实现

### 2.1 HermesAgent 类

```python
# api/providers/hermes_provider.py

class HermesAgent(IAgent):
    """Hermes Agent 适配器"""
    
    def __init__(self, raw_agent, model: str):
        super().__init__()
        self.raw_agent = raw_agent  # AIAgent 实例
        self.model = model
        self._interrupted = False
    
    def run(self, user_message: str, system_message: str,
            conversation_history: List[Dict], session_id: str,
            personality: str) -> AgentResult:
        """
        执行 Hermes Agent
        
        流程:
        1. 设置 ephemeral_system_prompt (性格)
        2. 调用 agent.run_conversation()
        3. 检测 session_id 轮转
        4. 提取 tool_calls
        5. 构建返回消息列表
        """
        
        # 1. 注入性格提示词
        if personality:
            self.raw_agent.ephemeral_system_prompt = personality
        
        # 2. 执行对话
        result = self.raw_agent.run_conversation(
            user_message,
            system_message,
            conversation_history,
            session_id
        )
        
        # 3. 检测 session_id 轮转 (上下文压缩)
        session_id_changed = False
        new_session_id = None
        if hasattr(result, 'session_id_changed'):
            session_id_changed = result.session_id_changed
            new_session_id = result.new_session_id
        
        # 4. 提取 tool_calls
        messages = self._extract_messages(result)
        
        # 5. 构建 AgentResult
        return AgentResult(
            messages=messages,
            usage=self._extract_usage(),
            session_id_changed=session_id_changed,
            new_session_id=new_session_id
        )
    
    def interrupt(self, reason: str) -> None:
        self._interrupted = True
    
    def get_usage(self) -> AgentUsage:
        return self._extract_usage()
    
    def _extract_usage(self) -> AgentUsage:
        """从 raw_agent 提取 token 用量"""
        agent = self.raw_agent
        return AgentUsage(
            input_tokens=agent.input_tokens or 0,
            output_tokens=agent.output_tokens or 0,
            estimated_cost_usd=agent.estimated_cost or 0.0,
            context_length=agent.context_length or 0,
            threshold_tokens=agent.threshold_tokens or 0,
            last_prompt_tokens=agent.last_prompt_tokens or 0,
            compression_count=agent.compression_count or 0
        )
```

### 2.2 HermesProvider 类

```python
class HermesProvider(IAgentProvider):
    """Hermes Agent Provider"""
    
    def get_provider_id(self) -> str:
        return 'hermes'
    
    def is_available(self) -> bool:
        """检查 Hermes 是否可用"""
        try:
            from hermes_agent import AIAgent
            return True
        except ImportError:
            return False
    
    def get_supported_models(self) -> List[Dict]:
        """从 Hermes 配置获取模型列表"""
        try:
            from api.config import get_config
            config = get_config()
            models = []
            
            # 从 config.yaml 的 providers 部分提取
            if hasattr(config, 'providers'):
                for provider_name, provider_config in config.providers.items():
                    if hasattr(provider_config, 'models'):
                        for model_id in provider_config.models:
                            models.append({
                                'id': f'{provider_name}/{model_id}',
                                'label': model_id,
                                'provider': provider_name
                            })
            
            return models
        except Exception as e:
            logger.warning(f'Failed to get Hermes models: {e}')
            return []
    
    def create_agent(self, model: str, api_key: str,
                    base_url: Optional[str] = None) -> IAgent:
        """创建 HermesAgent 实例"""
        from hermes_agent import AIAgent
        
        # 解析模型 (可能是 'provider/model' 格式)
        if '/' in model:
            provider, model_name = model.split('/', 1)
        else:
            provider = 'anthropic'
            model_name = model
        
        # 创建 AIAgent
        raw_agent = AIAgent(
            model=model_name,
            provider=provider,
            api_key=api_key,
            base_url=base_url
        )
        
        return HermesAgent(raw_agent, model)
```

## 3. OpenClawProvider 实现

### 3.1 OpenClawAgent 类

```python
# api/providers/openclaw_provider.py

import asyncio
from openclaw_sdk import OpenClawClient

class OpenClawAgent(IAgent):
    """OpenClaw Agent 适配器"""
    
    def __init__(self, gateway_url: str, api_key: str, model: str):
        super().__init__()
        self.gateway_url = gateway_url
        self.api_key = api_key
        self.model = model
        self._interrupted = False
        self._usage = AgentUsage(
            input_tokens=0,
            output_tokens=0,
            estimated_cost_usd=0.0,
            context_length=0,
            threshold_tokens=0,
            last_prompt_tokens=0,
            compression_count=0
        )
    
    def run(self, user_message: str, system_message: str,
            conversation_history: List[Dict], session_id: str,
            personality: str) -> AgentResult:
        """
        执行 OpenClaw Agent
        
        流程:
        1. 创建 OpenClawClient
        2. 获取 agent 实例
        3. 构建消息 (注入 personality)
        4. 调用 agent.execute_stream()
        5. 解析事件流
        6. 构建返回消息列表
        """
        
        # 在同步线程中运行异步代码
        result = asyncio.run(self._execute(
            user_message, system_message, conversation_history,
            session_id, personality
        ))
        
        return result
    
    async def _execute(self, user_message: str, system_message: str,
                      conversation_history: List[Dict], session_id: str,
                      personality: str) -> AgentResult:
        """异步执行"""
        
        # 1. 创建客户端
        client = OpenClawClient(
            base_url=self.gateway_url,
            api_key=self.api_key
        )
        
        # 2. 获取 agent
        agent = client.get_agent(self.model)
        
        # 3. 构建消息
        messages = []
        
        # 添加历史消息
        for msg in conversation_history:
            messages.append({
                'role': msg.get('role', 'user'),
                'content': msg.get('content', '')
            })
        
        # 添加用户消息
        messages.append({
            'role': 'user',
            'content': user_message
        })
        
        # 4. 构建系统提示词 (注入 personality)
        full_system = system_message
        if personality:
            full_system = f"{system_message}\n\n{personality}"
        
        # 5. 流式执行
        assistant_content = []
        tool_calls = []
        
        async for event in agent.execute_stream(
            messages=messages,
            system=full_system,
            session_id=session_id
        ):
            if self._interrupted:
                break
            
            # 解析事件
            if event.type == 'token':
                # 流式输出 token
                if self.on_token:
                    self.on_token(event.text)
                assistant_content.append(event.text)
            
            elif event.type == 'tool_use':
                # 工具调用
                tool_calls.append({
                    'id': event.id,
                    'type': 'tool_use',
                    'name': event.name,
                    'input': event.input
                })
                if self.on_tool:
                    self.on_tool(event.name, str(event.input), event.input)
            
            elif event.type == 'done':
                # 完成
                if hasattr(event, 'usage'):
                    self._usage = AgentUsage(
                        input_tokens=event.usage.input_tokens,
                        output_tokens=event.usage.output_tokens,
                        estimated_cost_usd=event.usage.cost,
                        context_length=0,
                        threshold_tokens=0,
                        last_prompt_tokens=0,
                        compression_count=0
                    )
            
            elif event.type == 'error':
                # 错误
                if self.on_error:
                    self.on_error(event.message)
                raise RuntimeError(f"OpenClaw error: {event.message}")
        
        # 6. 构建返回消息列表
        result_messages = conversation_history + [
            {'role': 'user', 'content': user_message},
            {
                'role': 'assistant',
                'content': ''.join(assistant_content),
                'tool_calls': tool_calls if tool_calls else None
            }
        ]
        
        return AgentResult(
            messages=result_messages,
            usage=self._usage,
            session_id_changed=False,
            new_session_id=None
        )
    
    def interrupt(self, reason: str) -> None:
        self._interrupted = True
    
    def get_usage(self) -> AgentUsage:
        return self._usage
```

### 3.2 OpenClawProvider 类

```python
class OpenClawProvider(IAgentProvider):
    """OpenClaw Agent Provider"""
    
    def get_provider_id(self) -> str:
        return 'openclaw'
    
    def is_available(self) -> bool:
        """检查 openclaw-sdk 是否安装"""
        try:
            import openclaw_sdk
            return True
        except ImportError:
            return False
    
    def get_supported_models(self) -> List[Dict]:
        """从 OpenClaw Gateway 获取模型列表"""
        try:
            from api.config import get_openclaw_config
            gateway_url, api_key = get_openclaw_config()
            
            # 调用 Gateway REST API
            import requests
            response = requests.get(
                f'{gateway_url}/api/models',
                headers={'Authorization': f'Bearer {api_key}'},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                models = []
                for model in data.get('models', []):
                    models.append({
                        'id': model['id'],
                        'label': model.get('name', model['id']),
                        'provider': 'openclaw'
                    })
                return models
            
            return []
        except Exception as e:
            logger.warning(f'Failed to get OpenClaw models: {e}')
            return []
    
    def create_agent(self, model: str, api_key: str,
                    base_url: Optional[str] = None) -> IAgent:
        """创建 OpenClawAgent 实例"""
        
        # 获取 Gateway 配置
        from api.config import get_openclaw_config
        gateway_url, stored_api_key = get_openclaw_config()
        
        # 使用传入的 api_key 或存储的配置
        final_api_key = api_key or stored_api_key
        final_gateway_url = base_url or gateway_url
        
        return OpenClawAgent(final_gateway_url, final_api_key, model)
```

## 4. streaming.py 中的 Provider 分支

### 4.1 Provider 路由逻辑

```python
# api/streaming.py

def _run_agent_streaming(session_id, msg_text, model, workspace_ctx, ...):
    """
    主要的 Agent 执行函数
    
    分支逻辑:
    - 如果 agent 是 HermesAgent: 走 Hermes 完整路径
    - 否则: 走标准 IAgent.run() 接口
    """
    
    try:
        # 1. 解析 agent_provider_id
        agent_provider_id = _resolve_agent_provider(session)
        
        # 2. 获取 Provider
        provider = AgentManager.get_provider(agent_provider_id)
        
        # 3. 创建 Agent
        _iagent = provider.create_agent(model, api_key, base_url)
        
        # 4. 设置回调
        def on_token(text):
            queue.put(('token', {'text': text}))
        
        def on_tool(name, preview, args):
            queue.put(('tool', {
                'name': name,
                'preview': preview,
                'args': args
            }))
        
        _iagent.on_token = on_token
        _iagent.on_tool = on_tool
        
        # 5. 执行 Agent
        _is_hermes = hasattr(_iagent, 'raw_agent')
        
        if _is_hermes:
            # ── Hermes 路径 ──
            agent = _iagent.raw_agent
            
            # 设置性格
            if personality:
                agent.ephemeral_system_prompt = personality
            
            # 执行
            result = agent.run_conversation(
                msg_text,
                workspace_system_msg,
                _sanitize_messages_for_api(s.messages),
                session_id
            )
            
            # 检测 session_id 轮转
            if hasattr(result, 'session_id_changed') and result.session_id_changed:
                s.session_id = result.new_session_id
            
            # 提取 tool_calls
            tool_calls = _extract_tool_calls(result)
            
            # 提取 usage
            usage = {
                'input_tokens': agent.input_tokens or 0,
                'output_tokens': agent.output_tokens or 0,
                'estimated_cost': agent.estimated_cost or 0.0,
            }
            
            # 自动生成标题
            if not s.title or s.title == 'Untitled':
                s.title = _generate_title(result)
            
            # 同步到 state.db (insights)
            _sync_to_insights(s)
            
            # 保存会话
            s.messages = result.messages
            s.save()
            
            # 发送 done 事件
            queue.put(('done', {
                'session': s.to_dict(),
                'messages': result.messages,
                'usage': usage
            }))
        
        else:
            # ── 其他 Provider 路径 (OpenClaw 等) ──
            _agent_result = _iagent.run(
                user_message=workspace_ctx + msg_text,
                system_message=workspace_system_msg,
                conversation_history=_sanitize_messages_for_api(s.messages),
                session_id=session_id,
                personality=personality
            )
            
            # 更新会话消息
            s.messages = _agent_result.messages
            
            # 提取 usage
            usage = {
                'input_tokens': _agent_result.usage.input_tokens,
                'output_tokens': _agent_result.usage.output_tokens,
                'estimated_cost': _agent_result.usage.estimated_cost_usd,
            }
            
            # 自动生成标题
            if not s.title or s.title == 'Untitled':
                s.title = _generate_title(_agent_result.messages)
            
            # 保存会话
            s.save()
            
            # 发送 done 事件
            queue.put(('done', {
                'session': s.to_dict(),
                'messages': _agent_result.messages,
                'usage': usage
            }))
    
    except Exception as e:
        # 错误处理
        error_type = _classify_error(e)
        if error_type == 'rate_limit':
            queue.put(('apperror', {'type': 'rate_limit', 'message': str(e)}))
        elif error_type == 'auth_error':
            queue.put(('apperror', {'type': 'auth_mismatch', 'message': str(e)}))
        else:
            queue.put(('error', {'message': str(e)}))
```

## 5. 线程模型与同步

### 5.1 Hermes 线程模型

```
主线程 (HTTP Server)
    │
    ├─ POST /api/chat/start
    │   └─ 创建 Queue + 启动后台线程
    │
    └─ GET /api/chat/stream
        └─ 读 Queue 写 SSE

后台线程 (Agent 执行)
    │
    ├─ 获取 _agent_lock[session_id] (同一会话串行)
    ├─ 设置 HERMES_HOME 环境变量 (线程局部)
    ├─ 获取 _ENV_LOCK (全局锁)
    ├─ os.environ[...] = ... (进程级 fallback)
    ├─ agent.run_conversation() (阻塞直到完成)
    └─ Queue.put(('done', {...}))
```

### 5.2 OpenClaw 线程模型

```
主线程 (HTTP Server)
    │
    ├─ POST /api/chat/start
    │   └─ 创建 Queue + 启动后台线程
    │
    └─ GET /api/chat/stream
        └─ 读 Queue 写 SSE

后台线程 (Agent 执行)
    │
    ├─ 获取 _agent_lock[session_id]
    ├─ asyncio.run(_execute())
    │   │
    │   ├─ OpenClawClient.connect() (WebSocket)
    │   ├─ async for event in stream:
    │   │   ├─ on_token() → Queue.put(('token', ...))
    │   │   ├─ on_tool() → Queue.put(('tool', ...))
    │   │   └─ on_error() → Queue.put(('error', ...))
    │   │
    │   └─ return AgentResult
    │
    └─ Queue.put(('done', {...}))
```

## 6. 错误分类与处理

### 6.1 错误分类函数

```python
def _classify_error(e: Exception) -> str:
    """
    分类错误类型
    
    Returns:
        'rate_limit' - 限流错误
        'auth_error' - 认证错误
        'connection_error' - 连接错误
        'other' - 其他错误
    """
    
    error_msg = str(e).lower()
    
    if 'rate_limit' in error_msg or '429' in error_msg:
        return 'rate_limit'
    
    if 'auth' in error_msg or '401' in error_msg or '403' in error_msg:
        return 'auth_error'
    
    if 'connection' in error_msg or 'timeout' in error_msg:
        return 'connection_error'
    
    return 'other'
```

### 6.2 前端错误处理

```javascript
// static/messages.js

eventSource.addEventListener('apperror', (e) => {
    const data = JSON.parse(e.data);
    
    if (data.type === 'rate_limit') {
        showRateLimitCard(data.message);
    } else if (data.type === 'auth_mismatch') {
        showAuthErrorCard(data.message);
    } else {
        showErrorCard(data.message);
    }
});

eventSource.addEventListener('error', (e) => {
    const data = JSON.parse(e.data);
    showErrorCard(data.message);
    // 重连逻辑
    reconnectStream();
});
```

## 7. 配置管理

### 7.1 配置读取优先级

```python
# api/config.py

def get_openclaw_config():
    """
    获取 OpenClaw 配置
    
    优先级:
    1. 环境变量
    2. settings.json
    3. 默认值
    """
    
    import os
    
    # 1. 环境变量
    gateway_url = os.environ.get('OPENCLAW_GATEWAY_URL')
    api_key = os.environ.get('OPENCLAW_API_KEY')
    
    if gateway_url and api_key:
        return gateway_url, api_key
    
    # 2. settings.json
    try:
        settings = load_settings()
        gateway_url = gateway_url or settings.get('openclaw_gateway_url')
        api_key = api_key or settings.get('openclaw_api_key')
    except:
        pass
    
    # 3. 默认值
    gateway_url = gateway_url or 'ws://127.0.0.1:18789'
    api_key = api_key or ''
    
    return gateway_url, api_key
```

## 8. 测试策略

### 8.1 单元测试

```python
# tests/test_providers.py

import pytest
from api.providers.hermes_provider import HermesProvider
from api.providers.openclaw_provider import OpenClawProvider

class TestHermesProvider:
    def test_is_available(self):
        provider = HermesProvider()
        # 取决于是否安装了 hermes-agent
        assert isinstance(provider.is_available(), bool)
    
    def test_get_provider_id(self):
        provider = HermesProvider()
        assert provider.get_provider_id() == 'hermes'
    
    def test_create_agent(self):
        provider = HermesProvider()
        if provider.is_available():
            agent = provider.create_agent(
                model='claude-3-sonnet',
                api_key='test-key'
            )
            assert agent is not None

class TestOpenClawProvider:
    def test_is_available(self):
        provider = OpenClawProvider()
        # 取决于是否安装了 openclaw-sdk
        assert isinstance(provider.is_available(), bool)
    
    def test_get_provider_id(self):
        provider = OpenClawProvider()
        assert provider.get_provider_id() == 'openclaw'
```

### 8.2 集成测试

```python
# tests/test_agent_manager.py

def test_agent_manager_auto_discover():
    """测试 Provider 自动发现"""
    from api.agent_manager import AgentManager
    
    AgentManager.auto_discover()
    providers = AgentManager.list_providers()
    
    # 至少应该有一个 provider
    assert len(providers) > 0
    
    # 检查 provider 结构
    for p in providers:
        assert 'id' in p
        assert 'available' in p
        assert 'models' in p

def test_agent_manager_get_provider():
    """测试获取 Provider"""
    from api.agent_manager import AgentManager
    
    AgentManager.auto_discover()
    
    # 获取 Hermes provider
    provider = AgentManager.get_provider('hermes')
    assert provider is not None
    assert provider.get_provider_id() == 'hermes'
```

## 总结

这个技术细节文档涵盖了：

1. **接口规范** - IAgentProvider 和 IAgent 的完整定义
2. **实现示例** - HermesProvider 和 OpenClawProvider 的具体实现
3. **集成点** - streaming.py 中的 Provider 分支逻辑
4. **线程模型** - 同步和异步执行的区别
5. **错误处理** - 分类和前端展示
6. **配置管理** - 优先级和读取方式
7. **测试策略** - 单元测试和集成测试

这些细节对于理解系统如何支持多个 Agent 后端至关重要。
