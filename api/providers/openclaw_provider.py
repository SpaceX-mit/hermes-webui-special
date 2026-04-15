"""
OpenClawProvider — Connects to an OpenClaw Gateway via openclaw-sdk.
Requires `pip install openclaw-sdk` to activate.
"""
import os
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
        'gateway_url': gateway_url or 'http://127.0.0.1:18789',
        'api_key': api_key or '',
    }


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
        """Query the OpenClaw gateway for available models."""
        cfg = _get_openclaw_config()
        try:
            import urllib.request
            import json
            url = cfg['gateway_url'].rstrip('/') + '/api/models'
            req = urllib.request.Request(url)
            if cfg['api_key']:
                req.add_header('Authorization', f"Bearer {cfg['api_key']}")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                if isinstance(data, list):
                    return data
                if isinstance(data, dict):
                    return data.get('models', data.get('data', []))
        except Exception:
            pass
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
        return OpenClawAgent(
            model=model,
            base_url=base_url or cfg['gateway_url'],
            api_key=api_key or cfg['api_key'],
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
        )


class OpenClawAgent(IAgent):
    """Wraps openclaw-sdk Agent.execute_stream()."""

    def __init__(self, *, model, base_url, api_key, session_id, on_token, on_tool):
        self._model = model
        self._base_url = base_url or 'http://127.0.0.1:18789'
        self._api_key = api_key
        self._session_id = session_id
        self._on_token = on_token
        self._on_tool = on_tool
        self._usage = AgentUsage()
        self._interrupted = False

    def run(self, user_message, system_message, conversation_history,
            session_id, personality=None):
        from openclaw_sdk import OpenClawClient

        client = OpenClawClient(base_url=self._base_url, api_key=self._api_key)
        agent = client.get_agent(self._model)

        full_message = user_message
        if personality:
            full_message = personality + '\n\n' + user_message

        result_text = ''
        for event in agent.execute_stream(full_message):
            if self._interrupted:
                break
            if event.type == 'token':
                self._on_token(event.text)
                result_text += event.text
            elif event.type == 'tool_use':
                name = getattr(event, 'name', 'tool')
                preview = getattr(event, 'preview', '')
                args = getattr(event, 'args', {}) or {}
                self._on_tool(name, preview, args)

        # Build messages list
        messages = list(conversation_history) if conversation_history else []
        messages.append({'role': 'user', 'content': user_message})
        if result_text:
            messages.append({'role': 'assistant', 'content': result_text})

        # Extract usage from agent cost tracker if available
        cost_tracker = getattr(agent, 'cost_tracker', None)
        if cost_tracker:
            self._usage = AgentUsage(
                input_tokens=getattr(cost_tracker, 'input_tokens', 0) or 0,
                output_tokens=getattr(cost_tracker, 'output_tokens', 0) or 0,
                estimated_cost_usd=getattr(cost_tracker, 'estimated_cost_usd', 0.0) or 0.0,
            )

        return AgentResult(messages=messages, usage=self._usage)

    def interrupt(self, reason):
        self._interrupted = True

    def get_usage(self):
        return self._usage
