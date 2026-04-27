"""
Hermes Web UI -- Digital Employee CRUD.
Stores employee data in STATE_DIR/employees.json.
Syncs each employee with a Hermes Agent profile for config, SOUL.md, and toolsets.
"""
import json
import time
import uuid
from pathlib import Path

from api.config import STATE_DIR
from api.profiles import (
    create_profile_api,
    delete_profile_api,
    switch_profile,
    _DEFAULT_HERMES_HOME,
)


_EMPLOYEES_FILE = STATE_DIR / 'employees.json'


# ── Persistence (unchanged) ────────────────────────────────────────────────


def _load_employees():
    if _EMPLOYEES_FILE.exists():
        try:
            return json.loads(_EMPLOYEES_FILE.read_text())
        except Exception:
            pass
    return {'employees': []}


def _save_employees(data):
    _EMPLOYEES_FILE.parent.mkdir(parents=True, exist_ok=True)
    _EMPLOYEES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def list_employees():
    return _load_employees().get('employees', [])


# ── Profile helpers ────────────────────────────────────────────────────────


def _get_profile_dir(profile_name):
    """Return the Path to a profile's home directory."""
    if profile_name == 'default':
        return _DEFAULT_HERMES_HOME
    return _DEFAULT_HERMES_HOME / 'profiles' / profile_name


def _generate_soul_md(name, description, traits):
    """Build SOUL.md content from employee metadata."""
    lines = [f'# 角色设定\n\n你是 {name}，{description}']
    lines.append('\n## 性格特质')
    for t in (traits or []):
        lines.append(f'- {t}')
    lines.append('\n## 工作准则')
    lines.append('- 保持专业、高效的工作态度')
    lines.append('- 根据上下文灵活调整沟通风格')
    return '\n'.join(lines) + '\n'


def _write_soul_md(profile_name, content):
    """Write SOUL.md into the profile directory."""
    profile_dir = _get_profile_dir(profile_name)
    profile_dir.mkdir(parents=True, exist_ok=True)
    (profile_dir / 'SOUL.md').write_text(content, encoding='utf-8')


def _write_identity_md(profile_name, name, description):
    """Write IDENTITY.md into the profile directory."""
    profile_dir = _get_profile_dir(profile_name)
    profile_dir.mkdir(parents=True, exist_ok=True)
    vibe = description if description else '专业、高效的数字员工'
    lines = [
        f'# IDENTITY.md - 我是谁\n',
        f'- **Name:** {name}',
        f'- **Creature:** AI 数字员工',
        f'- **Vibe:** {vibe}',
        f'- **Emoji:** 🤖',
        f'- **Avatar:**',
    ]
    (profile_dir / 'IDENTITY.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def _set_profile_workspace(profile_name, workspace_path: str):
    """Write the workspace path into the profile's config.yaml."""
    profile_dir = _get_profile_dir(profile_name)
    config_path = profile_dir / 'config.yaml'
    try:
        import yaml as _yaml
        cfg = {}
        if config_path.exists():
            try:
                loaded = _yaml.safe_load(config_path.read_text())
                if isinstance(loaded, dict):
                    cfg = loaded
            except Exception:
                pass
        cfg['workspace'] = workspace_path
        config_path.write_text(_yaml.dump(cfg, default_flow_style=False, allow_unicode=True))
    except ImportError:
        # yaml not available — append/replace workspace line manually
        import re
        line = f'workspace: {workspace_path}\n'
        if config_path.exists():
            text = config_path.read_text()
            text = re.sub(r'^workspace:.*\n', line, text, flags=re.MULTILINE)
            if 'workspace:' not in text:
                text += line
            config_path.write_text(text)
        else:
            config_path.write_text(line)


def _update_profile_toolsets(profile_name, capabilities):
    profile_dir = _get_profile_dir(profile_name)
    config_path = profile_dir / 'config.yaml'

    # Build toolset list from capabilities
    toolsets = ['skills']
    caps = capabilities or {}
    if caps.get('search'):
        toolsets.append('web')
    if caps.get('memory'):
        toolsets.append('memory')
    if caps.get('autoExec'):
        toolsets.append('terminal')
    if caps.get('knowledge'):
        toolsets.append('file')

    try:
        import yaml as _yaml

        cfg = {}
        if config_path.exists():
            try:
                loaded = _yaml.safe_load(config_path.read_text())
                if isinstance(loaded, dict):
                    cfg = loaded
            except Exception:
                pass

        if 'platform_toolsets' not in cfg or not isinstance(cfg.get('platform_toolsets'), dict):
            cfg['platform_toolsets'] = {}
        cfg['platform_toolsets']['cli'] = toolsets

        config_path.write_text(
            _yaml.dump(cfg, default_flow_style=False, allow_unicode=True)
        )
    except ImportError:
        # yaml not available -- write a minimal config manually
        # Read existing content and replace/append the toolsets block
        toolset_lines = ['platform_toolsets:', '  cli:']
        for t in toolsets:
            toolset_lines.append(f'    - {t}')
        toolset_block = '\n'.join(toolset_lines) + '\n'

        if config_path.exists():
            text = config_path.read_text()
            # Strip existing platform_toolsets block if present
            import re
            text = re.sub(
                r'platform_toolsets:.*?(?=\n\S|\Z)',
                '',
                text,
                flags=re.DOTALL,
            ).strip()
            if text:
                text += '\n\n'
            text += toolset_block
        else:
            text = toolset_block

        profile_dir.mkdir(parents=True, exist_ok=True)
        config_path.write_text(text, encoding='utf-8')


# ── CRUD operations ───────────────────────────────────────────────────────


def create_employee(body):
    data = _load_employees()
    emp_id = uuid.uuid4().hex[:12]
    profile_name = f'emp-{emp_id}'

    name = body.get('name', 'Digital Employee')
    description = body.get('description', '')
    traits = body.get('traits', [])
    capabilities = body.get('capabilities', {})

    emp = {
        'id': emp_id,
        'name': name,
        'avatar_index': body.get('avatar_index', 0),
        'description': description,
        'traits': traits,
        'capabilities': capabilities,
        'profile_name': profile_name,
        'agent_provider': body.get('agent_provider', 'hermes'),
        'created_at': time.time(),
    }

    # Only create Hermes profile for Hermes provider employees
    if emp['agent_provider'] == 'hermes':
        try:
            create_profile_api(profile_name, clone_from='default', clone_config=True)
            _write_soul_md(profile_name, _generate_soul_md(name, description, traits))
            _write_identity_md(profile_name, name, description)
            _update_profile_toolsets(profile_name, capabilities)
            # Set workspace to the profile's own workspace/ subdirectory
            ws_path = _get_profile_dir(profile_name) / 'workspace'
            ws_path.mkdir(exist_ok=True)
            _set_profile_workspace(profile_name, str(ws_path))
        except Exception:
            pass
    elif emp['agent_provider'] == 'openclaw':
        # Run in background thread — Gateway connection can be slow and
        # should not block the employee creation HTTP response.
        import threading as _threading
        def _bg_create(pname, n, d, t, c):
            try:
                from api.providers.openclaw_provider import create_openclaw_agent_on_gateway
                create_openclaw_agent_on_gateway(pname, n, d, t, c)
            except Exception as e:
                print(f'[employees] OpenClaw agent creation failed: {e}', flush=True)
        _threading.Thread(
            target=_bg_create,
            args=(profile_name, name, description, traits, capabilities),
            daemon=True,
        ).start()

    data['employees'].append(emp)
    _save_employees(data)
    return emp


def update_employee(emp_id, body):
    data = _load_employees()
    for emp in data['employees']:
        if emp['id'] == emp_id:
            soul_changed = False
            caps_changed = False

            for key in ('name', 'avatar_index', 'description', 'traits', 'capabilities', 'agent_provider'):
                if key in body:
                    emp[key] = body[key]
                    if key in ('name', 'description', 'traits'):
                        soul_changed = True
                    if key == 'capabilities':
                        caps_changed = True

            _save_employees(data)

            # Only sync to Hermes profile for Hermes provider employees
            if emp.get('agent_provider', 'hermes') == 'hermes':
                profile_name = emp.get('profile_name')
                if profile_name:
                    try:
                        if soul_changed:
                            _write_soul_md(
                                profile_name,
                                _generate_soul_md(
                                    emp['name'],
                                    emp.get('description', ''),
                                    emp.get('traits', []),
                                ),
                            )
                            _write_identity_md(profile_name, emp['name'], emp.get('description', ''))
                        if caps_changed:
                            _update_profile_toolsets(profile_name, emp.get('capabilities', {}))
                    except Exception:
                        pass
            elif emp.get('agent_provider') == 'openclaw':
                if soul_changed or caps_changed:
                    import threading as _threading
                    _pname = emp['profile_name']
                    _name = emp['name']
                    _desc = emp.get('description', '')
                    _traits = emp.get('traits', [])
                    _caps = emp.get('capabilities', {})
                    def _bg_update(pname, n, d, t, c):
                        try:
                            from api.providers.openclaw_provider import update_openclaw_agent_on_gateway
                            update_openclaw_agent_on_gateway(pname, n, d, t, c)
                        except Exception as e:
                            print(f'[employees] OpenClaw agent update failed: {e}', flush=True)
                    _threading.Thread(
                        target=_bg_update,
                        args=(_pname, _name, _desc, _traits, _caps),
                        daemon=True,
                    ).start()

            return emp
    return None


def delete_employee(emp_id):
    data = _load_employees()
    # Find the employee before removal
    target_emp = None
    for e in data['employees']:
        if e['id'] == emp_id:
            target_emp = e
            break

    before = len(data['employees'])
    data['employees'] = [e for e in data['employees'] if e['id'] != emp_id]
    if len(data['employees']) < before:
        _save_employees(data)
        # Only clean up Hermes profile for Hermes provider employees
        if target_emp and target_emp.get('agent_provider', 'hermes') == 'hermes':
            profile_name = target_emp.get('profile_name')
            if profile_name:
                try:
                    delete_profile_api(profile_name)
                except Exception:
                    pass
        elif target_emp and target_emp.get('agent_provider') == 'openclaw':
            profile_name = target_emp.get('profile_name')
            if profile_name:
                try:
                    from api.providers.openclaw_provider import delete_openclaw_agent_on_gateway
                    delete_openclaw_agent_on_gateway(profile_name)
                except Exception as e:
                    print(f'[employees] OpenClaw agent deletion failed: {e}', flush=True)
        return True
    return False


def activate_employee(emp_id):
    """Activate an employee. For Hermes: switch profile. For others: just return info."""
    data = _load_employees()
    for emp in data['employees']:
        if emp['id'] == emp_id:
            provider = emp.get('agent_provider', 'hermes')
            profile_name = emp.get('profile_name', '')

            if provider == 'hermes':
                # Hermes employees need a real profile switch
                if not profile_name:
                    return None
                return switch_profile(profile_name)
            else:
                # Non-Hermes employees: no profile switch needed,
                # just return the employee info so frontend can track it
                return {
                    'active': profile_name or f'emp-{emp_id}',
                    'agent_provider': provider,
                }
    return None
