"""
OpenClawProvider — Connects to an OpenClaw Gateway via openclaw-sdk.
Requires `pip install openclaw-sdk` to activate.

SDK is fully async; we use asyncio.run() to bridge into the sync
streaming thread used by JDUI's SSE engine.
"""
import asyncio
import os
import threading
from typing import Callable, Dict, List, Optional

from api.agent_provider import (
    IAgent, IAgentProvider, AgentResult, AgentUsage,
)


def _get_openclaw_config() -> dict:
    """Resolve OpenClaw gateway URL and API key.

    Priority: env vars > settings.json > defaults.
    """
    gateway_url = os.environ.get('OPENCLAW_GATEWAY_URL')
    api_key = os.environ.get('OPENCLAW_API_KEY')

    if not gateway_url or not api_key:
        try:
            from api.config import load_settings
            settings = load_settings()
            if not gateway_url:
                gateway_url = settings.get('openclaw_gateway_url')
            if not api_key:
                api_key = settings.get('openclaw_api_key')
        except Exception:
            pass

    return {
        'gateway_url': gateway_url or 'ws://127.0.0.1:18789',
        'api_key': api_key or '',
    }


def _build_agent_config(agent_id: str, name: str, description: str,
                         traits: list, capabilities: dict):
    """Build AgentConfig from employee metadata, mapping capabilities to Gateway fields.

    Capability → AgentConfig mapping:
      autoExec: true  → permission_mode='accept'  (auto-approve all tool calls)
      autoExec: false → permission_mode='confirm' (dangerous ops need user approval)
      memory: true    → enable_memory=True
      memory: false   → enable_memory=False
    """
    from openclaw_sdk import AgentConfig
    caps = capabilities or {}

    # Build system prompt from employee identity
    lines = [f'你是 {name}，{description}'] if description else [f'你是 {name}']
    if traits:
        lines.append('\n性格特质:')
        for t in traits:
            lines.append(f'- {t}')
    system_prompt = '\n'.join(lines)

    # Map capabilities to AgentConfig fields
    permission_mode = 'accept' if caps.get('autoExec') else 'confirm'
    enable_memory = bool(caps.get('memory', True))

    return AgentConfig(
        agent_id=agent_id,
        name=agent_id,  # Gateway agent name must be ASCII-safe
        system_prompt=system_prompt,
        permission_mode=permission_mode,
        enable_memory=enable_memory,
    )


# ── Connection pool ────────────────────────────────────────────────────────


class _GatewayConnection:
    """Module-level singleton that maintains a persistent WebSocket connection
    to the OpenClaw Gateway.

    All operations share one connection instead of creating a new one per call.
    A dedicated background thread runs the asyncio event loop so that the
    sync JDUI streaming thread can submit coroutines via
    asyncio.run_coroutine_threadsafe().
    """

    def __init__(self):
        self._client = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._cfg_key: Optional[str] = None

    def _cfg_hash(self, cfg: dict) -> str:
        return f"{cfg['gateway_url']}|{cfg['api_key']}"

    def _ensure_loop(self):
        """Start the background event loop thread if not running."""
        if self._loop is not None and self._loop.is_running():
            return
        loop = asyncio.new_event_loop()
        self._loop = loop

        def _run():
            asyncio.set_event_loop(loop)
            loop.run_forever()

        t = threading.Thread(target=_run, daemon=True, name='openclaw-event-loop')
        t.start()
        self._thread = t

    def _run_sync(self, coro, timeout=15):
        """Submit a coroutine to the background loop and wait for the result."""
        self._ensure_loop()
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result(timeout=timeout)

    def _connect_async(self, cfg: dict):
        async def _do():
            from openclaw_sdk import OpenClawClient
            return await OpenClawClient.connect(
                gateway_ws_url=cfg['gateway_url'],
                api_key=cfg['api_key'] or None,
            )
        return self._run_sync(_do(), timeout=10)

    def _close_async(self, client):
        async def _do():
            try:
                if asyncio.iscoroutinefunction(client.close):
                    await client.close()
                else:
                    client.close()
            except Exception:
                pass
        try:
            self._run_sync(_do(), timeout=5)
        except Exception:
            pass

    def get(self, cfg: dict):
        """Return (client, loop), creating or reconnecting as needed."""
        key = self._cfg_hash(cfg)
        with self._lock:
            if self._client is None or self._cfg_key != key:
                if self._client is not None:
                    self._close_async(self._client)
                    self._client = None
                self._cfg_key = key
                self._ensure_loop()
                self._client = self._connect_async(cfg)
        return self._client, self._loop

    def invalidate(self):
        """Mark connection as dead so next get() reconnects."""
        with self._lock:
            self._client = None

    def run(self, coro, timeout=30):
        """Run a coroutine on the shared event loop (no lock needed)."""
        self._ensure_loop()
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result(timeout=timeout)


_gw_conn = _GatewayConnection()


# ── Gateway agent management ───────────────────────────────────────────────


def create_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities):
    """Create a new agent on the OpenClaw Gateway."""
    cfg = _get_openclaw_config()
    config = _build_agent_config(agent_id, name, description, traits, capabilities)

    async def _create():
        client, _ = _gw_conn.get(cfg)
        try:
            result = client.create_agent(config)
            if asyncio.iscoroutine(result):
                result = await result
            return {'agent_id': agent_id, 'created': True}
        except Exception:
            _gw_conn.invalidate()
            raise

    try:
        return _gw_conn.run(_create())
    except Exception:
        # Fallback: direct asyncio.run if pool fails
        async def _fallback():
            from openclaw_sdk import OpenClawClient
            client = await OpenClawClient.connect(
                gateway_ws_url=cfg['gateway_url'],
                api_key=cfg['api_key'] or None,
            )
            try:
                result = client.create_agent(config)
                if asyncio.iscoroutine(result):
                    result = await result
                return {'agent_id': agent_id, 'created': True}
            finally:
                if asyncio.iscoroutinefunction(client.close):
                    await client.close()
                else:
                    client.close()
        return asyncio.run(_fallback())


def update_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities):
    """Update an existing agent on the Gateway by delete + recreate.

    The SDK has no update_agent method, so we delete and recreate with the
    new AgentConfig. This preserves the agent_id but resets memory/sessions.
    """
    cfg = _get_openclaw_config()

    async def _update():
        client, _ = _gw_conn.get(cfg)
        try:
            # Delete existing agent (ignore errors if not found)
            try:
                result = client.delete_agent(agent_id)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                pass
            # Recreate with new config
            config = _build_agent_config(agent_id, name, description, traits, capabilities)
            result = client.create_agent(config)
            if asyncio.iscoroutine(result):
                result = await result
            return {'agent_id': agent_id, 'updated': True}
        except Exception:
            _gw_conn.invalidate()
            raise

    try:
        return _gw_conn.run(_update())
    except Exception as e:
        print(f'[openclaw] update_agent failed: {e}', flush=True)
        return None


def delete_openclaw_agent_on_gateway(agent_id):
    """Delete an agent from the OpenClaw Gateway."""
    cfg = _get_openclaw_config()

    async def _delete():
        client, _ = _gw_conn.get(cfg)
        try:
            result = client.delete_agent(agent_id)
            if asyncio.iscoroutine(result):
                result = await result
            return result
        except Exception:
            _gw_conn.invalidate()
            raise

    try:
        return _gw_conn.run(_delete())
    except Exception:
        # Fallback
        async def _fallback():
            from openclaw_sdk import OpenClawClient
            client = await OpenClawClient.connect(
                gateway_ws_url=cfg['gateway_url'],
                api_key=cfg['api_key'] or None,
            )
            try:
                result = client.delete_agent(agent_id)
                if asyncio.iscoroutine(result):
                    result = await result
                return result
            finally:
                if asyncio.iscoroutinefunction(client.close):
                    await client.close()
                else:
                    client.close()
        return asyncio.run(_fallback())


def create_gateway_session(agent_id: str, session_id: str) -> str:
    """Create a session on the Gateway for multi-turn conversation context.

    Returns the Gateway session key (e.g. 'jdui-abc123def456').
    """
    cfg = _get_openclaw_config()
    session_key = f'jdui-{session_id}'

    async def _create():
        client, _ = _gw_conn.get(cfg)
        try:
            result = await client.gateway.request('sessions.create', {
                'key': session_key,
                'agentId': agent_id,
                'label': f'JDUI {session_id[:8]}',
            })
            return result.get('key', session_key) if isinstance(result, dict) else session_key
        except Exception:
            _gw_conn.invalidate()
            raise

    try:
        return _gw_conn.run(_create())
    except Exception as e:
        print(f'[openclaw] create_gateway_session failed: {e}', flush=True)
        return session_key  # Return key anyway; run() will fall back to execute_stream


# ── Provider & Agent ───────────────────────────────────────────────────────


class OpenClawProvider(IAgentProvider):

    def get_provider_id(self) -> str:
        return 'openclaw'

    def is_available(self) -> bool:
        try:
            import openclaw_sdk  # noqa: F401
            return True
        except ImportError:
            return False

    def get_supported_models(self) -> List[Dict]:
        """Query the OpenClaw gateway for available agents/models."""
        try:
            cfg = _get_openclaw_config()

            async def _list():
                client, _ = _gw_conn.get(cfg)
                try:
                    result = client.list_agents()
                    if asyncio.iscoroutine(result):
                        agents = await asyncio.wait_for(result, timeout=5)
                    else:
                        agents = await asyncio.wait_for(
                            asyncio.get_event_loop().run_in_executor(None, client.list_agents),
                            timeout=5,
                        )
                    return [{'id': a.agent_id, 'name': getattr(a, 'name', a.agent_id)} for a in agents]
                except Exception:
                    _gw_conn.invalidate()
                    raise

            return _gw_conn.run(_list(), timeout=8)
        except Exception:
            return []

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
                     ) -> 'OpenClawAgent':
        cfg = _get_openclaw_config()
        openclaw_agent_id = model  # default: use model as agent_id
        openclaw_session_key = None
        try:
            from api.employees import list_employees
            from api.models import get_session
            s = get_session(session_id)
            if s and hasattr(s, 'profile') and s.profile:
                for emp in list_employees().get('employees', []):
                    if emp.get('profile_name') == s.profile and emp.get('agent_provider') == 'openclaw':
                        openclaw_agent_id = emp['profile_name']
                        break
            # Pick up Gateway session key if available
            if s and hasattr(s, 'openclaw_session_key') and s.openclaw_session_key:
                openclaw_session_key = s.openclaw_session_key
        except Exception:
            pass
        return OpenClawAgent(
            model=model,
            openclaw_agent_id=openclaw_agent_id,
            gateway_url=cfg['gateway_url'],
            gateway_key=cfg['api_key'],
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
            openclaw_session_key=openclaw_session_key,
            cfg=cfg,
        )


class OpenClawAgent(IAgent):
    """Wraps openclaw-sdk async Agent via the shared _GatewayConnection pool."""

    def __init__(self, *, model, openclaw_agent_id=None, gateway_url, gateway_key,
                 session_id, on_token, on_tool, openclaw_session_key=None, cfg=None):
        self._model = model
        self._openclaw_agent_id = openclaw_agent_id or model
        self._gateway_url = gateway_url
        self._gateway_key = gateway_key
        self._session_id = session_id
        self._on_token = on_token
        self._on_tool = on_tool
        self._openclaw_session_key = openclaw_session_key
        self._cfg = cfg or {'gateway_url': gateway_url, 'api_key': gateway_key or ''}
        self._usage = AgentUsage()
        self._interrupted = False

    def run(self, user_message, system_message, conversation_history,
            session_id, personality=None):

        # Strip [Workspace: ...] prefix for display, keep for agent
        display_message = user_message
        if display_message.startswith('[Workspace:'):
            newline_idx = display_message.find('\n')
            if newline_idx >= 0:
                display_message = display_message[newline_idx + 1:]

        full_message = user_message
        if personality:
            full_message = personality + '\n\n' + user_message

        result_text = ''
        usage = AgentUsage()

        async def _execute():
            nonlocal result_text, usage
            from openclaw_sdk import EventType

            client, _ = _gw_conn.get(self._cfg)

            try:
                if self._openclaw_session_key:
                    # P2: Use Gateway session for multi-turn context
                    stream = await self._run_with_session(client, full_message)
                else:
                    # Fallback: single-turn via execute_stream
                    agent = client.get_agent(self._openclaw_agent_id)
                    stream = await agent.execute_stream(full_message)

                async for event in stream:
                    if self._interrupted:
                        break
                    et = event.event_type
                    data = event.data or {}

                    if et == EventType.AGENT:
                        payload = data.get('payload', {}) if isinstance(data, dict) else {}
                        if payload.get('stream') == 'assistant':
                            delta = (payload.get('data') or {}).get('delta', '')
                            if delta:
                                self._on_token(delta)
                                result_text += delta

                    elif et == EventType.CONTENT:
                        text = data.get('text', '') if isinstance(data, dict) else str(data)
                        if text:
                            self._on_token(text)
                            result_text += text

                    elif et == EventType.TOOL_CALL:
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        name = payload.get('name', 'tool') if isinstance(payload, dict) else 'tool'
                        args = payload.get('args', {}) if isinstance(payload, dict) else {}
                        preview = payload.get('preview', '') if isinstance(payload, dict) else ''
                        self._on_tool(name, preview, args if isinstance(args, dict) else {})

                    elif et == EventType.DONE:
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        tu = payload.get('tokenUsage', payload.get('token_usage', {})) if isinstance(payload, dict) else {}
                        if tu:
                            usage = AgentUsage(
                                input_tokens=tu.get('input', 0),
                                output_tokens=tu.get('output', 0),
                            )
                        break

                    elif et == EventType.ERROR:
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        err_msg = payload.get('message', str(data)) if isinstance(payload, dict) else str(data)
                        raise RuntimeError(f'OpenClaw error: {err_msg}')

                # Fallback usage from agent result
                if not usage.input_tokens:
                    agent_obj = client.get_agent(self._openclaw_agent_id)
                    result = getattr(agent_obj, '_last_result', None)
                    if result and hasattr(result, 'token_usage') and result.token_usage:
                        tu = result.token_usage
                        usage = AgentUsage(
                            input_tokens=getattr(tu, 'input', 0) or 0,
                            output_tokens=getattr(tu, 'output', 0) or 0,
                        )

            except Exception:
                _gw_conn.invalidate()
                raise

        try:
            _gw_conn.run(_execute(), timeout=300)
        except Exception:
            # Fallback: direct asyncio.run with fresh connection
            asyncio.run(self._execute_fallback(full_message, result_text, usage))

        self._usage = usage

        messages = list(conversation_history) if conversation_history else []
        messages.append({'role': 'user', 'content': display_message})
        if result_text:
            messages.append({'role': 'assistant', 'content': result_text})

        return AgentResult(messages=messages, usage=self._usage)

    async def _run_with_session(self, client, message: str):
        """Send message via Gateway session for multi-turn context."""
        try:
            agent = client.get_agent(self._openclaw_agent_id)
            # Use conversation with session key for persistent context
            async with agent.conversation(self._openclaw_session_key) as convo:
                result = await convo.say(message)
                # Yield a synthetic DONE event with the result
                from openclaw_sdk.core.constants import EventType as ET
                from types import SimpleNamespace
                if hasattr(result, 'content'):
                    yield SimpleNamespace(
                        event_type=ET.CONTENT,
                        data={'text': result.content or ''},
                    )
                yield SimpleNamespace(
                    event_type=ET.DONE,
                    data={},
                )
        except Exception:
            # Fallback to execute_stream if conversation API fails
            agent = client.get_agent(self._openclaw_agent_id)
            async for event in agent.execute_stream(message):
                yield event

    async def _execute_fallback(self, full_message, result_text, usage):
        """Direct connection fallback when pool fails."""
        from openclaw_sdk import OpenClawClient, EventType
        client = await OpenClawClient.connect(
            gateway_ws_url=self._gateway_url,
            api_key=self._gateway_key or None,
        )
        try:
            agent = client.get_agent(self._openclaw_agent_id)
            stream = await agent.execute_stream(full_message)
            async for event in stream:
                if self._interrupted:
                    break
                et = event.event_type
                data = event.data or {}
                if et == EventType.AGENT:
                    payload = data.get('payload', {}) if isinstance(data, dict) else {}
                    if payload.get('stream') == 'assistant':
                        delta = (payload.get('data') or {}).get('delta', '')
                        if delta:
                            self._on_token(delta)
                            result_text += delta
                elif et == EventType.CONTENT:
                    text = data.get('text', '') if isinstance(data, dict) else str(data)
                    if text:
                        self._on_token(text)
                        result_text += text
                elif et == EventType.DONE:
                    break
        finally:
            if asyncio.iscoroutinefunction(client.close):
                await client.close()
            else:
                client.close()

    def interrupt(self, reason):
        self._interrupted = True

    def get_usage(self):
        return self._usage

    def get_status(self) -> dict:
        return {
            'openclaw_agent_id': self._openclaw_agent_id,
            'gateway_url': self._gateway_url,
            'interrupted': self._interrupted,
            'input_tokens': self._usage.input_tokens,
            'output_tokens': self._usage.output_tokens,
            'openclaw_session_key': self._openclaw_session_key,
        }



def _get_openclaw_config() -> dict:
    """Resolve OpenClaw gateway URL and API key.

    Priority: env vars > settings.json > defaults.
    """
    gateway_url = os.environ.get('OPENCLAW_GATEWAY_URL')
    api_key = os.environ.get('OPENCLAW_API_KEY')

    if not gateway_url or not api_key:
        try:
            from api.config import load_settings
            settings = load_settings()
            if not gateway_url:
                gateway_url = settings.get('openclaw_gateway_url')
            if not api_key:
                api_key = settings.get('openclaw_api_key')
        except Exception:
            pass

    return {
        'gateway_url': gateway_url or 'ws://127.0.0.1:18789',
        'api_key': api_key or '',
    }


def create_openclaw_agent_on_gateway(agent_id, name, description, traits, capabilities):
    """Create a new agent on the OpenClaw Gateway."""
    import asyncio

    cfg = _get_openclaw_config()

    # Build system prompt from employee data
    lines = [f'你是 {name}，{description}'] if description else [f'你是 {name}']
    if traits:
        lines.append('\n性格特质:')
        for t in traits:
            lines.append(f'- {t}')
    system_prompt = '\n'.join(lines)

    async def _create():
        from openclaw_sdk import OpenClawClient, AgentConfig
        client = await OpenClawClient.connect(
            gateway_ws_url=cfg['gateway_url'],
            api_key=cfg['api_key'] or None,
        )
        try:
            config = AgentConfig(
                agent_id=agent_id,
                name=agent_id,  # Gateway agent name must be ASCII-safe
                system_prompt=system_prompt,
            )
            result = client.create_agent(config)
            if asyncio.iscoroutine(result):
                result = await result
            return {'agent_id': agent_id, 'created': True}
        finally:
            if asyncio.iscoroutinefunction(client.close):
                await client.close()
            else:
                client.close()

    return asyncio.run(_create())


def delete_openclaw_agent_on_gateway(agent_id):
    """Delete an agent from the OpenClaw Gateway."""
    import asyncio

    cfg = _get_openclaw_config()

    async def _delete():
        from openclaw_sdk import OpenClawClient
        client = await OpenClawClient.connect(
            gateway_ws_url=cfg['gateway_url'],
            api_key=cfg['api_key'] or None,
        )
        try:
            result = client.delete_agent(agent_id)
            if asyncio.iscoroutine(result):
                result = await result
            return result
        finally:
            if asyncio.iscoroutinefunction(client.close):
                await client.close()
            else:
                client.close()

    return asyncio.run(_delete())


class OpenClawProvider(IAgentProvider):

    def get_provider_id(self) -> str:
        return 'openclaw'

    def is_available(self) -> bool:
        try:
            import openclaw_sdk  # noqa: F401
            return True
        except ImportError:
            return False

    def get_supported_models(self) -> List[Dict]:
        """Query the OpenClaw gateway for available agents/models."""
        try:
            cfg = _get_openclaw_config()

            async def _list():
                from openclaw_sdk import OpenClawClient
                client = await OpenClawClient.connect(
                    gateway_ws_url=cfg['gateway_url'],
                    api_key=cfg['api_key'] or None,
                )
                try:
                    agents = await asyncio.wait_for(
                        asyncio.coroutine(client.list_agents)()
                        if asyncio.iscoroutinefunction(client.list_agents)
                        else asyncio.get_event_loop().run_in_executor(None, client.list_agents),
                        timeout=5,
                    )
                    return [{'id': a.agent_id, 'name': getattr(a, 'name', a.agent_id)} for a in agents]
                finally:
                    if asyncio.iscoroutinefunction(client.close):
                        await client.close()
                    else:
                        client.close()

            return asyncio.run(_list())
        except Exception:
            return []

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
                     ) -> 'OpenClawAgent':
        cfg = _get_openclaw_config()
        # For OpenClaw, resolve the agent_id from the session's employee profile
        # The model param is the LLM model name, but we need the OpenClaw agent_id
        openclaw_agent_id = model  # default: use model as agent_id
        try:
            from api.employees import list_employees
            from api.models import get_session
            s = get_session(session_id)
            if s and hasattr(s, 'profile') and s.profile:
                # Check if this profile_name exists as an OpenClaw agent
                for emp in list_employees().get('employees', []):
                    if emp.get('profile_name') == s.profile and emp.get('agent_provider') == 'openclaw':
                        openclaw_agent_id = emp['profile_name']
                        break
        except Exception:
            pass
        return OpenClawAgent(
            model=model,
            openclaw_agent_id=openclaw_agent_id,
            gateway_url=cfg['gateway_url'],
            gateway_key=cfg['api_key'],
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
        )


class OpenClawAgent(IAgent):
    """Wraps openclaw-sdk async Agent via asyncio.run()."""

    def __init__(self, *, model, openclaw_agent_id=None, gateway_url, gateway_key,
                 session_id, on_token, on_tool):
        self._model = model
        self._openclaw_agent_id = openclaw_agent_id or model
        self._gateway_url = gateway_url
        self._gateway_key = gateway_key
        self._session_id = session_id
        self._on_token = on_token
        self._on_tool = on_tool
        self._usage = AgentUsage()
        self._interrupted = False

    def run(self, user_message, system_message, conversation_history,
            session_id, personality=None):

        # Strip [Workspace: ...] prefix for display, keep for agent
        display_message = user_message
        if display_message.startswith('[Workspace:'):
            newline_idx = display_message.find('\n')
            if newline_idx >= 0:
                display_message = display_message[newline_idx + 1:]

        full_message = user_message
        if personality:
            full_message = personality + '\n\n' + user_message

        result_text = ''
        usage = AgentUsage()

        async def _execute():
            nonlocal result_text, usage
            from openclaw_sdk import OpenClawClient, EventType

            client = await OpenClawClient.connect(
                gateway_ws_url=self._gateway_url,
                api_key=self._gateway_key or None,
            )
            try:
                agent = client.get_agent(self._openclaw_agent_id)

                stream = await agent.execute_stream(full_message)
                async for event in stream:
                    if self._interrupted:
                        break
                    et = event.event_type
                    data = event.data or {}

                    # OpenClaw streams 'agent' events with payload.stream='assistant'
                    if et == EventType.AGENT:
                        payload = data.get('payload', {}) if isinstance(data, dict) else {}
                        if payload.get('stream') == 'assistant':
                            delta = (payload.get('data') or {}).get('delta', '')
                            if delta:
                                self._on_token(delta)
                                result_text += delta

                    elif et == EventType.CONTENT:
                        text = data.get('text', '') if isinstance(data, dict) else str(data)
                        if text:
                            self._on_token(text)
                            result_text += text

                    elif et == EventType.TOOL_CALL:
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        name = payload.get('name', 'tool') if isinstance(payload, dict) else 'tool'
                        args = payload.get('args', {}) if isinstance(payload, dict) else {}
                        preview = payload.get('preview', '') if isinstance(payload, dict) else ''
                        self._on_tool(name, preview, args if isinstance(args, dict) else {})

                    elif et == EventType.DONE:
                        # Extract token usage from done event
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        tu = payload.get('tokenUsage', payload.get('token_usage', {})) if isinstance(payload, dict) else {}
                        if tu:
                            usage = AgentUsage(
                                input_tokens=tu.get('input', 0),
                                output_tokens=tu.get('output', 0),
                            )
                        break

                    elif et == EventType.ERROR:
                        payload = data.get('payload', data) if isinstance(data, dict) else {}
                        err_msg = payload.get('message', str(data)) if isinstance(payload, dict) else str(data)
                        raise RuntimeError(f"OpenClaw error: {err_msg}")

                # Try to get usage from execution result if not from done event
                if not usage.input_tokens:
                    result = getattr(agent, '_last_result', None)
                    if result and hasattr(result, 'token_usage') and result.token_usage:
                        tu = result.token_usage
                        usage = AgentUsage(
                            input_tokens=getattr(tu, 'input', 0) or 0,
                            output_tokens=getattr(tu, 'output', 0) or 0,
                        )
            finally:
                if asyncio.iscoroutinefunction(client.close):
                    await client.close()
                else:
                    client.close()

        # Run async code in sync context
        asyncio.run(_execute())

        self._usage = usage

        # Build messages list — use display_message (without workspace prefix) for storage
        messages = list(conversation_history) if conversation_history else []
        messages.append({'role': 'user', 'content': display_message})
        if result_text:
            messages.append({'role': 'assistant', 'content': result_text})

        return AgentResult(messages=messages, usage=self._usage)

    def interrupt(self, reason):
        self._interrupted = True

    def get_usage(self):
        return self._usage

    def get_status(self) -> dict:
        return {
            'openclaw_agent_id': self._openclaw_agent_id,
            'gateway_url': self._gateway_url,
            'interrupted': self._interrupted,
            'input_tokens': self._usage.input_tokens,
            'output_tokens': self._usage.output_tokens,
        }
