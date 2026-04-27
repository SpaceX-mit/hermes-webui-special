"""
AgentFS — 权限管理模块

职责：
- 静态权限：项目 Agent 对文件的 DENY/READ/WRITE 配置
- 动态权限：Agent 跨工作区访问时的临时权限申请/审批/回收
- 后台线程：定期清理过期临时权限
"""
import json
import time
import threading
import uuid
from enum import Enum
from pathlib import Path
from typing import Optional, List, Dict

from api.config import STATE_DIR

_REQUESTS_FILE = Path(STATE_DIR) / "permission_requests.json"
_lock = threading.Lock()

# 临时权限有效期（秒）
TEMP_PERMISSION_TTL = 3600


class PermissionLevel(str, Enum):
    DENY = "deny"
    READ = "read"
    WRITE = "write"


# ── Requests I/O ───────────────────────────────────────────────────────────

def _load_requests() -> dict:
    if _REQUESTS_FILE.exists():
        try:
            return json.loads(_REQUESTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"requests": []}


def _save_requests(data: dict):
    _REQUESTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _REQUESTS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Static permission helpers ──────────────────────────────────────────────

def check_permission(emp_id: str, root_id: str, rel_path: str,
                     project_id: Optional[str] = None) -> PermissionLevel:
    """
    检查 emp_id 对 root_id/rel_path 的权限。
    规则：
    1. 同一员工的工作区 → WRITE
    2. 项目内配置了权限 → 按配置
    3. 有效的临时权限 → READ
    4. 默认 → DENY
    """
    # 同一员工自己的根目录始终可写
    if root_id == emp_id or root_id == f"emp-{emp_id}":
        return PermissionLevel.WRITE

    # 检查项目静态权限
    if project_id:
        from api.models import load_projects
        projects = load_projects()
        proj = next((p for p in projects if p["project_id"] == project_id), None)
        if proj:
            for agent_cfg in proj.get("agents", []):
                if agent_cfg["emp_id"] == emp_id:
                    perms = agent_cfg.get("permissions", {})
                    if perms.get("write"):
                        return PermissionLevel.WRITE
                    if perms.get("read"):
                        return PermissionLevel.READ
                    return PermissionLevel.DENY

    # 检查临时权限
    with _lock:
        data = _load_requests()
        now = time.time()
        for req in data["requests"]:
            if (req["status"] == "approved"
                    and req["requester_emp_id"] == emp_id
                    and req["target_root_id"] == root_id
                    and req["target_rel_path"] == rel_path
                    and (req.get("expires_at") or 0) > now):
                return PermissionLevel.READ

    return PermissionLevel.DENY


# ── Permission request lifecycle ───────────────────────────────────────────

def create_permission_request(requester_emp_id: str, target_root_id: str,
                               target_rel_path: str, project_id: str,
                               reason: str = "") -> dict:
    """创建权限申请，返回申请记录。"""
    with _lock:
        data = _load_requests()
        # 去重：同一申请方对同一文件的 pending 申请只保留一个
        for req in data["requests"]:
            if (req["status"] == "pending"
                    and req["requester_emp_id"] == requester_emp_id
                    and req["target_root_id"] == target_root_id
                    and req["target_rel_path"] == target_rel_path):
                return req
        req = {
            "request_id": uuid.uuid4().hex[:12],
            "project_id": project_id,
            "requester_emp_id": requester_emp_id,
            "target_root_id": target_root_id,
            "target_rel_path": target_rel_path,
            "reason": reason,
            "status": "pending",
            "expires_at": None,
            "created_at": time.time(),
            "resolved_at": None,
        }
        data["requests"].append(req)
        _save_requests(data)
        return req


def approve_request(request_id: str) -> Optional[dict]:
    """审批通过，设置临时权限有效期。"""
    with _lock:
        data = _load_requests()
        for req in data["requests"]:
            if req["request_id"] == request_id and req["status"] == "pending":
                req["status"] = "approved"
                req["expires_at"] = time.time() + TEMP_PERMISSION_TTL
                req["resolved_at"] = time.time()
                _save_requests(data)
                return req
        return None


def deny_request(request_id: str) -> Optional[dict]:
    """拒绝申请。"""
    with _lock:
        data = _load_requests()
        for req in data["requests"]:
            if req["request_id"] == request_id and req["status"] == "pending":
                req["status"] = "denied"
                req["resolved_at"] = time.time()
                _save_requests(data)
                return req
        return None


def list_pending_requests() -> List[dict]:
    """返回所有待审批申请，附加申请方员工名称。"""
    from api.employees import list_employees
    emps = {e["id"]: e for e in list_employees()}

    with _lock:
        data = _load_requests()

    result = []
    for req in data["requests"]:
        if req["status"] == "pending":
            emp = emps.get(req["requester_emp_id"], {})
            result.append({
                **req,
                "requester_name": emp.get("name", req["requester_emp_id"]),
            })
    result.sort(key=lambda x: x["created_at"], reverse=True)
    return result


def revoke_expired_permissions():
    """回收所有过期的临时权限（由后台线程调用）。"""
    with _lock:
        data = _load_requests()
        changed = False
        now = time.time()
        for req in data["requests"]:
            if req["status"] == "approved" and (req.get("expires_at") or 0) < now:
                req["status"] = "expired"
                changed = True
        if changed:
            _save_requests(data)


# ── Background cleanup thread ──────────────────────────────────────────────

def _cleanup_loop():
    while True:
        time.sleep(60)
        try:
            revoke_expired_permissions()
        except Exception:
            pass


def start_permission_cleanup():
    """启动后台清理线程（服务启动时调用一次）。"""
    t = threading.Thread(target=_cleanup_loop, daemon=True)
    t.start()
