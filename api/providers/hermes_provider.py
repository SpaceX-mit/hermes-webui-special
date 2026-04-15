"""
HermesProvider — Wraps the existing Hermes Agent (run_agent.AIAgent)
behind the IAgentProvider interface. Zero behaviour change from the
pre-refactor code path; all Hermes-specific logic lives here.
"""
from typing import Callable, Dict, List, Optional

from api.agent_provider import (
    IAgent, IAgentProvider, AgentResult, AgentUsage,
)


class HermesProvider(IAgentProvider):

    def get_provider_id(self) -> str:
        return 'hermes'

    def is_available(self) -> bool:
        try:
            from run_agent import AIAgent  # noqa: F401
            return True
        except ImportError:
            return False

    def get_supported_models(self) -> List[Dict]:
        try:
            from api.config import get_config
            cfg = get_config()
            models = cfg.get('models', [])
            if isinstance(models, list):
                return [{'id': m} if isinstance(m, str) else m for m in models]
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
                     ) -> 'HermesAgent':
        return HermesAgent(
            model=model,
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            toolsets=toolsets,
            fallback_model=fallback_model,
            session_id=session_id,
            on_token=on_token,
            on_tool=on_tool,
        )


class HermesAgent(IAgent):
    """Wraps a single AIAgent.run_conversation() call."""

    def __init__(self, *, model, provider, base_url, api_key,
                 toolsets, fallback_model, session_id, on_token, on_tool):
        # Lazy import — same pattern as the old streaming.py top-level try/except
        from run_agent import AIAgent
        self._agent = AIAgent(
            model=model,
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            platform='cli',
            quiet_mode=True,
            enabled_toolsets=toolsets,
            fallback_model=fallback_model,
            session_id=session_id,
            stream_delta_callback=on_token,
            tool_progress_callback=on_tool,
        )

    @property
    def raw_agent(self):
        """Expose underlying AIAgent for Hermes-specific attributes."""
        return self._agent

    def run(self, user_message, system_message, conversation_history,
            session_id, personality=None):
        # Personality injection (matches old streaming.py logic)
        if personality:
            self._agent.ephemeral_system_prompt = personality

        result = self._agent.run_conversation(
            user_message=user_message,
            system_message=system_message,
            conversation_history=conversation_history,
            task_id=session_id,
            persist_user_message=user_message.split('\n', 1)[-1] if '\n' in user_message else user_message,
        )

        messages = result.get('messages', [])
        usage = self.get_usage()

        # Detect session ID rotation from context compression
        agent_sid = getattr(self._agent, 'session_id', None)
        sid_changed = bool(agent_sid and agent_sid != session_id)

        return AgentResult(
            messages=messages,
            usage=usage,
            session_id_changed=sid_changed,
            new_session_id=agent_sid if sid_changed else None,
        )

    def interrupt(self, reason):
        try:
            self._agent.interrupt(reason)
        except Exception:
            pass

    def get_usage(self):
        a = self._agent
        cc = getattr(a, 'context_compressor', None)
        return AgentUsage(
            input_tokens=getattr(a, 'session_prompt_tokens', 0) or 0,
            output_tokens=getattr(a, 'session_completion_tokens', 0) or 0,
            estimated_cost_usd=getattr(a, 'session_estimated_cost_usd', 0) or 0,
            context_length=getattr(cc, 'context_length', 0) or 0 if cc else 0,
            threshold_tokens=getattr(cc, 'threshold_tokens', 0) or 0 if cc else 0,
            last_prompt_tokens=getattr(cc, 'last_prompt_tokens', 0) or 0 if cc else 0,
            compression_count=getattr(cc, 'compression_count', 0) or 0 if cc else 0,
        )
