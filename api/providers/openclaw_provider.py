"""
OpenClawProvider — Connects to an OpenClaw Gateway via openclaw-sdk.
Stub implementation; requires `pip install openclaw-sdk` to activate.
"""
from typing import Callable, Dict, List, Optional

from api.agent_provider import (
    IAgent, IAgentProvider, AgentResult, AgentUsage,
)


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
        # TODO: query OpenClaw gateway for available models
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
        return OpenClawAgent(
            model=model,
            base_url=base_url,
            api_key=api_key,
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
        # TODO: implement when openclaw-sdk is available
        # Sketch:
        #   from openclaw_sdk import OpenClawClient
        #   client = OpenClawClient(base_url=self._base_url, api_key=self._api_key)
        #   agent = client.get_agent(self._model)
        #   for event in agent.execute_stream(user_message):
        #       if self._interrupted: break
        #       if event.type == 'token': self._on_token(event.text)
        #       elif event.type == 'tool_use': self._on_tool(event.name, '', {})
        #   return AgentResult(messages=..., usage=self._usage)
        raise NotImplementedError(
            "OpenClaw provider is not yet implemented. "
            "Install openclaw-sdk and complete this integration."
        )

    def interrupt(self, reason):
        self._interrupted = True

    def get_usage(self):
        return self._usage
