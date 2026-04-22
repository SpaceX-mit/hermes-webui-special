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
    def _get_provider_interfaces(cls, provider: IAgentProvider) -> List[Dict]:
        """Inspect which IAgent methods are actually implemented (not just abstract)."""
        interfaces = [
            {'name': 'get_provider_id', 'status': 'implemented'},
            {'name': 'is_available', 'status': 'implemented'},
            {'name': 'get_supported_models', 'status': 'implemented'},
            {'name': 'create_agent', 'status': 'implemented'},
        ]
        # Check IAgent methods by creating a test probe
        try:
            # Try to detect if run() raises NotImplementedError
            import inspect
            from api.agent_provider import IAgent
            # Find the agent class from the provider module
            mod = inspect.getmodule(provider)
            agent_classes = [
                cls_obj for name, cls_obj in inspect.getmembers(mod, inspect.isclass)
                if issubclass(cls_obj, IAgent) and cls_obj is not IAgent
            ]
            if agent_classes:
                agent_cls = agent_classes[0]
                src = inspect.getsource(agent_cls.run)
                run_status = 'not_implemented' if 'NotImplementedError' in src else 'implemented'
            else:
                run_status = 'unknown'
        except Exception:
            run_status = 'unknown'

        interfaces.extend([
            {'name': 'IAgent.run', 'status': run_status},
            {'name': 'IAgent.interrupt', 'status': 'implemented'},
            {'name': 'IAgent.get_usage', 'status': 'implemented'},
        ])
        return interfaces

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
