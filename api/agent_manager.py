"""
AgentManager — Central registry for all IAgentProvider implementations.
Call AgentManager.auto_discover() at server startup to register available providers.
"""
from typing import Dict, List, Optional

from api.agent_provider import IAgentProvider


class AgentManager:
    _providers: Dict[str, IAgentProvider] = {}
    _default_provider: str = 'hermes'

    @classmethod
    def register(cls, provider: IAgentProvider) -> None:
        pid = provider.get_provider_id()
        cls._providers[pid] = provider
        print(f'[agent-manager] registered provider: {pid} (available={provider.is_available()})', flush=True)

    @classmethod
    def get_provider(cls, provider_id: Optional[str] = None) -> IAgentProvider:
        pid = provider_id or cls._default_provider
        if pid not in cls._providers:
            raise ValueError(f"Agent provider '{pid}' not registered. Available: {list(cls._providers.keys())}")
        return cls._providers[pid]

    @classmethod
    def set_default(cls, provider_id: str) -> None:
        if provider_id not in cls._providers:
            raise ValueError(f"Cannot set default: provider '{provider_id}' not registered")
        cls._default_provider = provider_id

    @classmethod
    def list_providers(cls) -> List[Dict]:
        return [
            {
                'id': pid,
                'available': p.is_available(),
                'is_default': pid == cls._default_provider,
            }
            for pid, p in cls._providers.items()
        ]

    @classmethod
    def auto_discover(cls) -> None:
        """Import and register all known providers. Safe to call multiple times."""
        # Hermes Agent
        try:
            from api.providers.hermes_provider import HermesProvider
            if 'hermes' not in cls._providers:
                cls.register(HermesProvider())
        except Exception as e:
            print(f'[agent-manager] hermes provider failed to load: {e}', flush=True)

        # OpenClaw
        try:
            from api.providers.openclaw_provider import OpenClawProvider
            if 'openclaw' not in cls._providers:
                cls.register(OpenClawProvider())
        except Exception as e:
            print(f'[agent-manager] openclaw provider failed to load: {e}', flush=True)
