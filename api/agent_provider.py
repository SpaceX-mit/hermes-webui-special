"""
IAgentProvider — Abstract interface for pluggable agent backends.
Allows JDUI to work with Hermes, OpenClaw, or any future agent.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional


@dataclass
class AgentUsage:
    """Token usage and cost after an agent run."""
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0
    context_length: int = 0
    threshold_tokens: int = 0
    last_prompt_tokens: int = 0
    compression_count: int = 0


@dataclass
class AgentResult:
    """Result returned by IAgent.run()."""
    messages: List[Dict] = field(default_factory=list)
    usage: AgentUsage = field(default_factory=AgentUsage)
    session_id_changed: bool = False
    new_session_id: Optional[str] = None


class IAgent(ABC):
    """A single agent run instance, created by IAgentProvider.create_agent()."""

    @abstractmethod
    def run(self,
            user_message: str,
            system_message: str,
            conversation_history: List[Dict],
            session_id: str,
            personality: Optional[str] = None,
            **kwargs,
            ) -> AgentResult:
        """Execute a conversation turn. Streams via on_token/on_tool callbacks."""

    @abstractmethod
    def interrupt(self, reason: str) -> None:
        """Cancel execution immediately."""

    @abstractmethod
    def get_usage(self) -> AgentUsage:
        """Return usage stats after run() completes."""

    def get_status(self) -> dict:
        """Return real-time status snapshot. Override in subclasses."""
        return {}


class IAgentProvider(ABC):
    """Registry entry for an agent backend (Hermes, OpenClaw, etc.)."""

    @abstractmethod
    def get_provider_id(self) -> str:
        """Unique identifier, e.g. 'hermes', 'openclaw'."""

    @abstractmethod
    def is_available(self) -> bool:
        """True if dependencies are installed and the backend is reachable."""

    @abstractmethod
    def get_supported_models(self) -> List[Dict]:
        """Return list of models this provider can serve."""

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
                     ) -> IAgent:
        """Create an agent instance ready to call .run()."""
