"""
AgentFS — 多 Agent 协作文件系统逻辑索引层

核心职责：
- 维护文件到项目的逻辑映射（不移动物理文件）
- 聚合展示项目下所有文件（跨员工工作区）
- 提供文件添加/移除/移动/列表接口
"""
import json
import time
import threading
import uuid
from pathlib import Path
from typing import List, Dict, Optional

from api.config import STATE_DIR

_INDEX_FILE = Path(STATE_DIR) / "agentfs_index.json"
_lock = threading.Lock()


# ── Index I/O ──────────────────────────────────────────────────────────────

def _load_index() -> dict:
    if _INDEX_FILE.exists():
        try:
            return json.loads(_INDEX_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"version": 1, "entries": []}


def _save_index(index: dict):
    _INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    _INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Core operations ────────────────────────────────────────────────────────

def afs_add_to_project(project_id: str, root_id: str, rel_path: str,
                        added_by: str = "user", tags: Optional[List[str]] = None) -> dict:
    """添加文件到项目逻辑索引，返回新建的 entry。"""
    with _lock:
        index = _load_index()
        # 去重：同一项目内同一文件只记录一次
        for e in index["entries"]:
            if e["project_id"] == project_id and e["root_id"] == root_id and e["rel_path"] == rel_path:
                return e
        entry = {
            "entry_id": uuid.uuid4().hex[:12],
            "project_id": project_id,
            "root_id": root_id,
            "rel_path": rel_path,
            "added_at": time.time(),
            "added_by": added_by,
            "tags": tags or [],
        }
        index["entries"].append(entry)
        _save_index(index)
        return entry


def afs_remove_from_project(entry_id: str) -> bool:
    """从项目移除逻辑索引条目，返回是否成功。"""
    with _lock:
        index = _load_index()
        before = len(index["entries"])
        index["entries"] = [e for e in index["entries"] if e["entry_id"] != entry_id]
        if len(index["entries"]) < before:
            _save_index(index)
            return True
        return False


def afs_move_entry(entry_id: str, new_project_id: str) -> Optional[dict]:
    """将逻辑索引条目移动到另一个项目。"""
    with _lock:
        index = _load_index()
        for e in index["entries"]:
            if e["entry_id"] == entry_id:
                e["project_id"] = new_project_id
                _save_index(index)
                return e
        return None


def afs_list_project_files(project_id: str) -> List[dict]:
    """
    聚合展示项目下所有文件，解析物理路径并附加根目录信息。
    对不存在的文件标记 exists=False（文件被删除但索引未清理）。
    """
    from api.sysfiles import get_roots, _root_path

    with _lock:
        index = _load_index()
        entries = [e for e in index["entries"] if e["project_id"] == project_id]

    # 构建 root_id → root_info 映射
    roots = {r["id"]: r for r in get_roots()}

    result = []
    for e in entries:
        root_info = roots.get(e["root_id"])
        if not root_info:
            continue
        try:
            root_path = _root_path(e["root_id"])
            file_path = root_path / e["rel_path"]
            exists = file_path.exists() and file_path.is_file()
            stat = file_path.stat() if exists else None
            result.append({
                "entry_id": e["entry_id"],
                "project_id": e["project_id"],
                "root_id": e["root_id"],
                "root_label": root_info.get("label", e["root_id"]),
                "rel_path": e["rel_path"],
                "name": Path(e["rel_path"]).name,
                "size": stat.st_size if stat else 0,
                "mtime": stat.st_mtime if stat else 0,
                "exists": exists,
                "added_at": e["added_at"],
                "added_by": e["added_by"],
                "tags": e.get("tags", []),
            })
        except Exception:
            continue

    result.sort(key=lambda x: x["mtime"], reverse=True)
    return result


def afs_list_all_entries() -> List[dict]:
    """返回所有索引条目（供调试/管理用）。"""
    with _lock:
        return _load_index()["entries"][:]


def afs_remove_project_entries(project_id: str):
    """删除项目时清理其所有逻辑索引条目。"""
    with _lock:
        index = _load_index()
        index["entries"] = [e for e in index["entries"] if e["project_id"] != project_id]
        _save_index(index)
