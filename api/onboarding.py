"""Hermes Web UI -- first-run onboarding helpers."""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

from api.auth import is_auth_enabled
from api.config import (
    DEFAULT_MODEL,
    DEFAULT_WORKSPACE,
    _FALLBACK_MODELS,
    _HERMES_FOUND,
    _PROVIDER_DISPLAY,
    _PROVIDER_MODELS,
    _get_config_path,
    get_available_models,
    get_config,
    load_settings,
    reload_config,
    save_settings,
    verify_hermes_imports,
)
from api.workspace import get_last_workspace, load_workspaces


_SUPPORTED_PROVIDER_SETUPS = {
    "openrouter": {
        "label": "OpenRouter",
        "env_var": "OPENROUTER_API_KEY",
        "default_model": "anthropic/claude-sonnet-4.6",
        "requires_base_url": False,
        "models": [
            {"id": model["id"], "label": model["label"]} for model in _FALLBACK_MODELS
        ],
    },
    "anthropic": {
        "label": "Anthropic",
        "env_var": "ANTHROPIC_API_KEY",
        "default_model": "claude-sonnet-4.6",
        "requires_base_url": False,
        "models": list(_PROVIDER_MODELS.get("anthropic", [])),
    },
    "openai": {
        "label": "OpenAI",
        "env_var": "OPENAI_API_KEY",
        "default_model": "gpt-4o",
        "default_base_url": "https://api.openai.com/v1",
        "requires_base_url": False,
        "models": list(_PROVIDER_MODELS.get("openai", [])),
    },
    "minimax-cn": {
        "label": "MiniMax（国内）",
        "env_var": "MINIMAX_API_KEY",
        "default_model": "MiniMax-M2.7-highspeed",
        "default_base_url": "https://api.minimax.chat/v1",
        "requires_base_url": False,
        "models": list(_PROVIDER_MODELS.get("minimax", [])),
    },
    "kimi-cn": {
        "label": "Kimi（国内）",
        "env_var": "MOONSHOT_API_KEY",
        "default_model": "kimi-latest",
        "default_base_url": "https://api.moonshot.cn/v1",
        "requires_base_url": False,
        "models": list(_PROVIDER_MODELS.get("kimi-coding", [])),
    },
    "custom": {
        "label": "Custom OpenAI-compatible",
        "env_var": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
        "requires_base_url": True,
        "models": [],
    },
}

_UNSUPPORTED_PROVIDER_NOTE = (
    "OAuth and advanced provider flows such as Nous Portal, OpenAI Codex, and GitHub "
    "Copilot are still terminal-first. Use `hermes model` for those flows."
)


def _get_active_hermes_home() -> Path:
    try:
        from api.profiles import get_active_hermes_home

        return get_active_hermes_home()
    except ImportError:
        return Path.home() / ".hermes"


def _load_env_file(env_path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not env_path.exists():
        return values
    try:
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    except Exception:
        return {}
    return values


def _write_env_file(env_path: Path, updates: dict[str, str]) -> None:
    current = _load_env_file(env_path)
    for key, value in updates.items():
        if value is None:
            current.pop(key, None)
            os.environ.pop(key, None)
            continue
        clean = str(value).strip()
        if not clean:
            continue
        # Reject embedded newlines/carriage returns to prevent .env injection
        if "\n" in clean or "\r" in clean:
            raise ValueError("API key must not contain newline characters.")
        current[key] = clean
        os.environ[key] = clean

    env_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"{key}={current[key]}" for key in sorted(current)]
    env_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def _load_yaml_config(config_path: Path) -> dict:
    try:
        import yaml as _yaml
    except ImportError:
        return {}

    if not config_path.exists():
        return {}
    try:
        loaded = _yaml.safe_load(config_path.read_text(encoding="utf-8"))
        return loaded if isinstance(loaded, dict) else {}
    except Exception:
        return {}


def _save_yaml_config(config_path: Path, config: dict) -> None:
    try:
        import yaml as _yaml
    except ImportError as exc:
        raise RuntimeError("PyYAML is required to write Hermes config.yaml") from exc

    config_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.write_text(
        _yaml.safe_dump(config, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def _normalize_model_for_provider(provider: str, model: str) -> str:
    clean = (model or "").strip()
    if not clean:
        return ""
    if provider in {"anthropic", "openai"} and clean.startswith(provider + "/"):
        return clean.split("/", 1)[1]
    return clean


def _normalize_base_url(base_url: str) -> str:
    return (base_url or "").strip().rstrip("/")


def _extract_current_provider(cfg: dict) -> str:
    model_cfg = cfg.get("model", {})
    if isinstance(model_cfg, dict):
        provider = str(model_cfg.get("provider") or "").strip().lower()
        if provider:
            return provider
    return ""


def _extract_current_model(cfg: dict) -> str:
    model_cfg = cfg.get("model", {})
    if isinstance(model_cfg, str):
        return model_cfg.strip()
    if isinstance(model_cfg, dict):
        return str(model_cfg.get("default") or "").strip()
    return ""


def _extract_current_base_url(cfg: dict) -> str:
    model_cfg = cfg.get("model", {})
    if isinstance(model_cfg, dict):
        return _normalize_base_url(str(model_cfg.get("base_url") or ""))
    return ""


def _provider_api_key_present(
    provider: str, cfg: dict, env_values: dict[str, str]
) -> bool:
    provider = (provider or "").strip().lower()
    if not provider:
        return False

    env_var = _SUPPORTED_PROVIDER_SETUPS.get(provider, {}).get("env_var")
    if env_var and env_values.get(env_var):
        return True

    model_cfg = cfg.get("model", {})
    if isinstance(model_cfg, dict) and str(model_cfg.get("api_key") or "").strip():
        return True

    providers_cfg = cfg.get("providers", {})
    if isinstance(providers_cfg, dict):
        provider_cfg = providers_cfg.get(provider, {})
        if (
            isinstance(provider_cfg, dict)
            and str(provider_cfg.get("api_key") or "").strip()
        ):
            return True
        if provider == "custom":
            custom_cfg = providers_cfg.get("custom", {})
            if (
                isinstance(custom_cfg, dict)
                and str(custom_cfg.get("api_key") or "").strip()
            ):
                return True
    return False



def _provider_oauth_authenticated(provider: str, hermes_home: "Path") -> bool:
    """Return True if the provider has valid OAuth credentials.

    Checks via hermes_cli.auth.get_auth_status() when available, then falls
    back to reading auth.json directly for the known OAuth provider IDs
    (openai-codex, copilot, copilot-acp, qwen-oauth, nous).

    This covers users who authenticated via 'hermes auth' or 'hermes model'
    but whose provider is not in _SUPPORTED_PROVIDER_SETUPS because it does
    not use a plain API key.
    """
    provider = (provider or "").strip().lower()
    if not provider:
        return False

    # Fast path: ask hermes_cli directly — the authoritative source
    try:
        from hermes_cli.auth import get_auth_status as _gas

        status = _gas(provider)
        if isinstance(status, dict) and status.get("logged_in"):
            return True
    except Exception:
        pass

    # Fallback: parse auth.json ourselves for known OAuth provider IDs.
    # Covers deployments where hermes_cli is installed but the import above
    # fails for an unexpected reason (version mismatch, import cycle, etc.).
    _known_oauth_providers = {"openai-codex", "copilot", "copilot-acp", "qwen-oauth", "nous"}
    if provider not in _known_oauth_providers:
        return False

    try:
        import json as _j

        auth_path = hermes_home / "auth.json"
        if not auth_path.exists():
            return False
        store = _j.loads(auth_path.read_text(encoding="utf-8"))
        providers_store = store.get("providers")
        if not isinstance(providers_store, dict):
            return False
        state = providers_store.get(provider)
        if not isinstance(state, dict):
            return False
        # Any non-empty token is enough to confirm the user has credentials.
        # Token refresh happens at runtime inside the agent.
        has_token = bool(
            str(state.get("access_token") or "").strip()
            or str(state.get("api_key") or "").strip()
            or str(state.get("refresh_token") or "").strip()
        )
        return has_token
    except Exception:
        return False


def _status_from_runtime(cfg: dict, imports_ok: bool) -> dict:
    provider = _extract_current_provider(cfg)
    model = _extract_current_model(cfg)
    base_url = _extract_current_base_url(cfg)
    env_values = _load_env_file(_get_active_hermes_home() / ".env")

    provider_configured = bool(provider and model)
    provider_ready = False

    if provider_configured:
        if provider == "custom":
            provider_ready = bool(
                base_url and _provider_api_key_present(provider, cfg, env_values)
            )
        elif provider in _SUPPORTED_PROVIDER_SETUPS:
            provider_ready = _provider_api_key_present(provider, cfg, env_values)
        else:
            # Unknown / OAuth provider (e.g. openai-codex, copilot, qwen-oauth).
            # These do not use a plain API key; auth lives in auth.json or a
            # credential pool managed by hermes_cli.
            provider_ready = _provider_oauth_authenticated(
                provider, _get_active_hermes_home()
            )

    chat_ready = bool(_HERMES_FOUND and imports_ok and provider_ready)

    if not _HERMES_FOUND or not imports_ok:
        state = "agent_unavailable"
        note = (
            "Hermes is not fully importable from the Web UI yet. Finish bootstrap or fix the "
            "agent install before provider setup will work."
        )
    elif chat_ready:
        state = "ready"
        provider_name = _PROVIDER_DISPLAY.get(
            provider, provider.title() if provider else "Hermes"
        )
        note = f"Hermes is minimally configured and ready to chat via {provider_name}."
    elif provider_configured:
        state = "provider_incomplete"
        if provider == "custom" and not base_url:
            note = (
                "Hermes has a saved provider/model selection but still needs the "
                "base URL and API key required to chat."
            )
        elif provider not in _SUPPORTED_PROVIDER_SETUPS:
            # OAuth / unsupported provider: avoid misleading "API key" wording.
            note = (
                f"Provider '{provider}' is configured but not yet authenticated. "
                "Run 'hermes auth' or 'hermes model' in a terminal to complete "
                "setup, then reload the Web UI."
            )
        else:
            note = (
                "Hermes has a saved provider/model selection but still needs the "
                "API key required to chat."
            )
    else:
        state = "needs_provider"
        note = "Hermes is installed, but you still need to choose a provider and save working credentials."

    return {
        "provider_configured": provider_configured,
        "provider_ready": provider_ready,
        "chat_ready": chat_ready,
        "setup_state": state,
        "provider_note": note,
        "current_provider": provider or None,
        "current_model": model or None,
        "current_base_url": base_url or None,
        "env_path": str(_get_active_hermes_home() / ".env"),
    }


def _build_setup_catalog(cfg: dict) -> dict:
    current_provider = _extract_current_provider(cfg) or "openrouter"
    current_model = _extract_current_model(cfg)
    current_base_url = _extract_current_base_url(cfg)

    providers = []
    for provider_id, meta in _SUPPORTED_PROVIDER_SETUPS.items():
        providers.append(
            {
                "id": provider_id,
                "label": meta["label"],
                "env_var": meta["env_var"],
                "default_model": meta["default_model"],
                "default_base_url": meta.get("default_base_url") or "",
                "requires_base_url": bool(meta.get("requires_base_url")),
                "models": list(meta.get("models", [])),
                "quick": provider_id == "openrouter",
            }
        )

    # Flag whether the currently-configured provider is OAuth-based (not in the
    # API-key flow).  The frontend uses this to show a confirmation card instead
    # of a key input when the user has already authenticated via 'hermes auth'.
    current_is_oauth = current_provider not in _SUPPORTED_PROVIDER_SETUPS and bool(
        current_provider
    )

    return {
        "providers": providers,
        "unsupported_note": _UNSUPPORTED_PROVIDER_NOTE,
        "current_is_oauth": current_is_oauth,
        "current": {
            "provider": current_provider,
            "model": current_model
            or _SUPPORTED_PROVIDER_SETUPS.get(current_provider, {}).get(
                "default_model", ""
            ),
            "base_url": current_base_url,
        },
    }


def get_onboarding_status() -> dict:
    settings = load_settings()
    cfg = get_config()
    imports_ok, missing, errors = verify_hermes_imports()
    runtime = _status_from_runtime(cfg, imports_ok)
    workspaces = load_workspaces()
    last_workspace = get_last_workspace()
    available_models = get_available_models()

    # HERMES_WEBUI_SKIP_ONBOARDING=1 lets hosting providers (e.g. Agent37) ship
    # a pre-configured instance without the wizard blocking the first load.
    # Only takes effect when the system is actually chat_ready — a misconfigured
    # deployment still shows the wizard so the user can fix it.
    skip_env = os.environ.get("HERMES_WEBUI_SKIP_ONBOARDING", "").strip()
    skip_requested = skip_env in {"1", "true", "yes"}
    auto_completed = skip_requested and bool(runtime.get("chat_ready"))

    return {
        "completed": bool(settings.get("onboarding_completed")) or auto_completed,
        "agent_platform": settings.get("agent_platform") or "hermes",
        "install_status": get_install_status(),
        "settings": {
            "default_model": settings.get("default_model") or DEFAULT_MODEL,
            "default_workspace": settings.get("default_workspace")
            or str(DEFAULT_WORKSPACE),
            "password_enabled": is_auth_enabled(),
            "bot_name": settings.get("bot_name") or "Hermes",
        },
        "system": {
            "hermes_found": bool(_HERMES_FOUND),
            "imports_ok": bool(imports_ok),
            "missing_modules": missing,
            "import_errors": errors,
            "config_path": str(_get_config_path()),
            "config_exists": Path(_get_config_path()).exists(),
            **runtime,
        },
        "setup": _build_setup_catalog(cfg),
        "workspaces": {
            "items": workspaces,
            "last": last_workspace,
        },
        "models": available_models,
    }


def apply_onboarding_setup(body: dict) -> dict:
    provider = str(body.get("provider") or "").strip().lower()
    model = str(body.get("model") or "").strip()
    api_key = str(body.get("api_key") or "").strip()
    base_url = _normalize_base_url(str(body.get("base_url") or ""))

    # Persist user info if provided
    user_fields = {}
    if body.get("user_name") is not None:
        user_fields["user_name"] = str(body["user_name"]).strip()
    if body.get("user_timezone") is not None:
        user_fields["user_timezone"] = str(body["user_timezone"]).strip()
    if body.get("user_notes") is not None:
        user_fields["user_notes"] = str(body["user_notes"]).strip()
    if user_fields:
        save_settings(user_fields)

    if provider not in _SUPPORTED_PROVIDER_SETUPS:
        # Unsupported providers (openai-codex, copilot, nous, etc.) are already
        # configured via the CLI. Just mark onboarding as complete and let the
        # user through — the agent is already set up, no further setup needed.
        save_settings({"onboarding_completed": True})
        return get_onboarding_status()
    if not model:
        raise ValueError("model is required")

    provider_meta = _SUPPORTED_PROVIDER_SETUPS[provider]
    if provider_meta.get("requires_base_url"):
        if not base_url:
            raise ValueError("base_url is required for custom endpoints")
        parsed = urlparse(base_url)
        if parsed.scheme not in {"http", "https"}:
            raise ValueError("base_url must start with http:// or https://")

    cfg = _load_yaml_config(_get_config_path())
    env_path = _get_active_hermes_home() / ".env"
    env_values = _load_env_file(env_path)

    if not api_key and not _provider_api_key_present(provider, cfg, env_values):
        raise ValueError(f"{provider_meta['env_var']} is required")

    model_cfg = cfg.get("model", {})
    if not isinstance(model_cfg, dict):
        model_cfg = {}

    model_cfg["provider"] = provider
    model_cfg["default"] = _normalize_model_for_provider(provider, model)

    if provider == "custom":
        model_cfg["base_url"] = base_url
    elif provider_meta.get("default_base_url"):
        # Providers with a fixed non-standard base URL (e.g. minimax-cn, kimi-cn)
        model_cfg["base_url"] = provider_meta["default_base_url"]
    else:
        model_cfg.pop("base_url", None)

    cfg["model"] = model_cfg
    _save_yaml_config(_get_config_path(), cfg)

    if api_key:
        _write_env_file(env_path, {provider_meta["env_var"]: api_key})
        # Belt-and-braces: set directly on os.environ so the value is visible to
        # any code in the same process that reads it before the next request cycle.
        os.environ[provider_meta["env_var"]] = api_key

    # Reload the hermes_cli provider/config cache so the next streaming call
    # picks up the new key without requiring a server restart.
    try:
        from api.profiles import _reload_dotenv
        _reload_dotenv(_get_active_hermes_home())
    except Exception:
        pass

    try:
        # hermes_cli may cache config at import time; ask it to reload if possible.
        from hermes_cli.config import reload as _cli_reload
        _cli_reload()
    except Exception:
        pass

    reload_config()
    return get_onboarding_status()


def complete_onboarding() -> dict:
    save_settings({"onboarding_completed": True})
    _sync_user_md_to_all_agents()
    return get_onboarding_status()


def _sync_user_md_to_all_agents() -> None:
    """Write USER.md with current user info into every OpenClaw agent workspace.

    Also writes memories/USER.md for Hermes agents.
    Runs best-effort — errors are logged but do not abort onboarding.
    """
    settings = load_settings()
    user_info = {
        'name': settings.get('user_name') or '',
        'timezone': settings.get('user_timezone') or '',
        'notes': settings.get('user_notes') or '',
    }

    # OpenClaw agents
    try:
        from api.employees import _load_employees
        from api.providers.openclaw_provider import write_user_md_to_openclaw_workspace
        import os
        employees = _load_employees().get('employees', [])
        for emp in employees:
            if emp.get('agent_provider') == 'openclaw':
                agent_id = emp.get('profile_name') or emp.get('id')
                ws = os.path.expanduser(f'~/.openclaw/workspace/{agent_id}')
                if os.path.isdir(ws):
                    try:
                        write_user_md_to_openclaw_workspace(ws, user_info)
                    except Exception as e:
                        print(f'[onboarding] USER.md sync failed for {agent_id}: {e}', flush=True)
    except Exception as e:
        print(f'[onboarding] OpenClaw USER.md sync error: {e}', flush=True)

    # Hermes agents — write memories/USER.md
    try:
        from api.employees import _load_employees, _get_profile_dir
        employees = _load_employees().get('employees', [])
        for emp in employees:
            if emp.get('agent_provider', 'hermes') == 'hermes':
                profile_name = emp.get('profile_name')
                if not profile_name:
                    continue
                mem_dir = _get_profile_dir(profile_name) / 'memories'
                if mem_dir.is_dir():
                    user_md = mem_dir / 'USER.md'
                    lines = [
                        '# USER.md - 关于用户\n',
                        f'- **Name:** {user_info["name"]}',
                        f'- **Timezone:** {user_info["timezone"]}',
                        f'- **Notes:** {user_info["notes"]}',
                    ]
                    try:
                        user_md.write_text('\n'.join(lines) + '\n', encoding='utf-8')
                    except Exception as e:
                        print(f'[onboarding] Hermes USER.md sync failed for {profile_name}: {e}', flush=True)
    except Exception as e:
        print(f'[onboarding] Hermes USER.md sync error: {e}', flush=True)


# ── P1: Platform selection & install detection ────────────────────────────────

def apply_platform_selection(platform: str) -> dict:
    """Persist the chosen agent platform and return updated onboarding status."""
    platform = (platform or "hermes").strip().lower()
    if platform not in {"hermes", "openclaw"}:
        raise ValueError(f"Unknown platform: {platform!r}")
    save_settings({"agent_platform": platform})
    return get_onboarding_status()


def _check_openclaw_sdk() -> bool:
    try:
        import openclaw_sdk  # noqa: F401
        return True
    except Exception:
        return False


def _check_openclaw_gateway() -> bool:
    """Return True if the configured (or default) OpenClaw Gateway is reachable."""
    from api.config import load_settings as _ls
    settings = _ls()
    url = (settings.get("openclaw_gateway_url") or "ws://127.0.0.1:18789").strip()
    # Convert ws:// → http:// for a quick HTTP health probe
    http_url = url.replace("ws://", "http://").replace("wss://", "https://")
    if not http_url.endswith("/health"):
        http_url = http_url.rstrip("/") + "/health"
    try:
        import urllib.request as _ur
        req = _ur.Request(http_url, headers={"User-Agent": "hermes-webui/onboarding"})
        with _ur.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


def get_install_status() -> dict:
    """Return real-time availability of each agent platform."""
    imports_ok, _, _ = verify_hermes_imports()
    return {
        "hermes": bool(_HERMES_FOUND and imports_ok),
        "openclaw_sdk": _check_openclaw_sdk(),
        "openclaw_gateway": _check_openclaw_gateway(),
    }


def test_openclaw_gateway(url: str, api_key: str) -> dict:
    """Test connectivity to an OpenClaw Gateway and optionally save the config."""
    url = (url or "").strip()
    if not url:
        return {"ok": False, "error": "URL is required"}

    parsed = urlparse(url)
    if parsed.scheme not in {"ws", "wss"}:
        return {"ok": False, "error": "URL must start with ws:// or wss://"}

    http_url = url.replace("ws://", "http://").replace("wss://", "https://")
    if not http_url.endswith("/health"):
        http_url = http_url.rstrip("/") + "/health"

    try:
        import urllib.request as _ur
        req = _ur.Request(http_url, headers={"User-Agent": "hermes-webui/onboarding"})
        with _ur.urlopen(req, timeout=5) as resp:
            ok = resp.status == 200
    except Exception as exc:
        return {"ok": False, "error": str(exc)}

    if ok:
        updates: dict = {"openclaw_gateway_url": url}
        if api_key:
            updates["openclaw_api_key"] = api_key
        save_settings(updates)

    return {"ok": ok, "error": None}


# ── P2: OpenClaw LLM config via Gateway config.patch ─────────────────────────

def apply_openclaw_llm_config(provider: str, model: str, api_key: str, base_url: str) -> dict:
    """
    Write LLM provider config into the OpenClaw Gateway via config.patch RPC,
    then persist provider/model to settings.json for status display.
    """
    provider = (provider or "").strip().lower()
    model = (model or "").strip()
    api_key = (api_key or "").strip()

    if provider not in _SUPPORTED_PROVIDER_SETUPS:
        raise ValueError(f"Unsupported provider: {provider!r}")
    if not model:
        raise ValueError("model is required")

    provider_meta = _SUPPORTED_PROVIDER_SETUPS[provider]
    effective_base_url = (
        base_url.strip()
        or provider_meta.get("default_base_url", "")
    )

    # Build the Gateway config patch.
    # OpenClaw uses OpenAI-compatible format for all providers.
    provider_patch: dict = {}
    if api_key:
        provider_patch["apiKey"] = api_key
    if effective_base_url:
        provider_patch["baseUrl"] = effective_base_url

    patch: dict = {
        "agents": {
            "defaults": {
                "llm_provider": "openai",
                "llm_model": model,
            }
        }
    }
    if provider_patch:
        patch["models"] = {"providers": {"openai": provider_patch}}

    try:
        from api.providers.openclaw_provider import _get_openclaw_config, _gw_conn
        cfg = _get_openclaw_config()
        import asyncio as _asyncio

        async def _do_patch():
            client, _ = await _gw_conn.get(cfg)
            await client.gateway.request("config.patch", {"patch": patch})

        loop = _asyncio.new_event_loop()
        try:
            loop.run_until_complete(_do_patch())
        finally:
            loop.close()
    except Exception as exc:
        raise RuntimeError(f"Gateway config.patch failed: {exc}") from exc

    save_settings({
        "openclaw_llm_provider": provider,
        "openclaw_llm_model": model,
    })
    return get_onboarding_status()

