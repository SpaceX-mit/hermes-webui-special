"""
Hermes Web UI -- Digital Employee CRUD.
Stores employee data in STATE_DIR/employees.json.
"""
import json
import time
import uuid
from pathlib import Path

from api.config import STATE_DIR


_EMPLOYEES_FILE = STATE_DIR / 'employees.json'


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
    return _load_employees()


def create_employee(body):
    data = _load_employees()
    emp = {
        'id': uuid.uuid4().hex[:12],
        'name': body.get('name', 'Digital Employee'),
        'avatar_index': body.get('avatar_index', 0),
        'description': body.get('description', ''),
        'traits': body.get('traits', []),
        'capabilities': body.get('capabilities', {}),
        'created_at': time.time(),
    }
    data['employees'].append(emp)
    _save_employees(data)
    return emp


def update_employee(emp_id, body):
    data = _load_employees()
    for emp in data['employees']:
        if emp['id'] == emp_id:
            for key in ('name', 'avatar_index', 'description', 'traits', 'capabilities'):
                if key in body:
                    emp[key] = body[key]
            _save_employees(data)
            return emp
    return None


def delete_employee(emp_id):
    data = _load_employees()
    before = len(data['employees'])
    data['employees'] = [e for e in data['employees'] if e['id'] != emp_id]
    if len(data['employees']) < before:
        _save_employees(data)
        return True
    return False
