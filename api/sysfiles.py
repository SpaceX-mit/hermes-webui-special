"""
System-level file manager backend.

Handles multi-root directory browsing (public workspace + all agent workspaces),
file versioning (up to 10 versions per file), soft-delete trash (30-day retention),
and file uploads.
"""
import json
import shutil
import time
import hashlib
from pathlib import Path
from typing import List, Dict, Optional

from api.config import DEFAULT_WORKSPACE, MAX_FILE_BYTES
from api.workspace import safe_resolve_ws, list_dir, read_file_content

_VERSIONS_DIR = '.hermes_versions'
_TRASH_DIR = '.hermes_trash'
_MAX_VERSIONS = 10
_TRASH_DAYS = 30


# ── Root resolution ────────────────────────────────────────────────────────

def _get_employees():
    try:
        from api.employees import list_employees
        data = list_employees()
        return data.get('employees', [])
    except Exception:
        return []


def _get_profile_workspace(profile_name: str) -> Optional[Path]:
    """Return the workspace path for a profile, or None if not found."""
    try:
        from api.profiles import _DEFAULT_HERMES_HOME
        profile_dir = _DEFAULT_HERMES_HOME / 'profiles' / profile_name
        config_file = profile_dir / 'config.yaml'
        if config_file.exists():
            import re
            text = config_file.read_text()
            m = re.search(r'^workspace:\s*(.+)$', text, re.MULTILINE)
            if m:
                p = Path(m.group(1).strip()).expanduser().resolve()
                if p.exists():
                    return p
        # fallback: profile_dir/workspace
        ws = profile_dir / 'workspace'
        if ws.exists():
            return ws
    except Exception:
        pass
    return None


def get_roots() -> List[Dict]:
    """Return all root nodes: public workspace + each employee's workspace."""
    roots = []

    # Public workspace
    pub = Path(DEFAULT_WORKSPACE).resolve()
    pub.mkdir(parents=True, exist_ok=True)
    roots.append({
        'id': 'public',
        'label': '公共工作区',
        'path': str(pub),
        'type': 'public',
    })

    # Employee workspaces
    for emp in _get_employees():
        profile_name = emp.get('profile_name', '')
        if not profile_name:
            continue
        ws = _get_profile_workspace(profile_name)
        if ws is None:
            continue
        roots.append({
            'id': profile_name,
            'label': emp.get('name', profile_name),
            'path': str(ws),
            'type': 'agent',
            'avatar_index': emp.get('avatar_index', 0),
            'emp_id': emp.get('id', ''),
        })

    return roots


def _root_path(root_id: str) -> Path:
    """Resolve a root_id to its absolute Path, raising ValueError if unknown."""
    for r in get_roots():
        if r['id'] == root_id:
            return Path(r['path'])
    raise ValueError(f'Unknown root: {root_id}')


# ── Directory listing ──────────────────────────────────────────────────────

def sf_list_dir(root_id: str, rel: str = '.') -> List[Dict]:
    root = _root_path(root_id)
    entries = list_dir(root, rel)
    # Filter out internal dirs from listing
    return [e for e in entries if e['name'] not in (_VERSIONS_DIR, _TRASH_DIR)]


# ── File read / raw ────────────────────────────────────────────────────────

def sf_read_file(root_id: str, rel: str) -> Dict:
    root = _root_path(root_id)
    return read_file_content(root, rel)


def sf_resolve_raw(root_id: str, rel: str) -> Path:
    root = _root_path(root_id)
    return safe_resolve_ws(root, rel)


# ── Version management ─────────────────────────────────────────────────────

def _versions_dir(root: Path, rel: str) -> Path:
    return root / _VERSIONS_DIR / rel


def _save_version(root: Path, rel: str):
    """Copy current file to versions dir before overwrite. Prune to MAX_VERSIONS."""
    src = safe_resolve_ws(root, rel)
    if not src.is_file():
        return
    vdir = _versions_dir(root, rel)
    vdir.mkdir(parents=True, exist_ok=True)

    ts = int(time.time() * 1000)
    dest = vdir / f'{ts}_{src.name}'
    shutil.copy2(src, dest)

    # Prune oldest versions
    versions = sorted(vdir.iterdir(), key=lambda p: p.stat().st_mtime)
    while len(versions) > _MAX_VERSIONS:
        versions.pop(0).unlink(missing_ok=True)
        versions = sorted(vdir.iterdir(), key=lambda p: p.stat().st_mtime)


def sf_list_versions(root_id: str, rel: str) -> List[Dict]:
    root = _root_path(root_id)
    vdir = _versions_dir(root, rel)
    if not vdir.exists():
        return []
    versions = []
    for p in sorted(vdir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            ts_ms = int(p.name.split('_')[0]) if '_' in p.name else int(p.stat().st_mtime * 1000)
            versions.append({
                'version_id': p.name,
                'timestamp': ts_ms // 1000,
                'size': p.stat().st_size,
                'label': _fmt_ts(ts_ms // 1000),
            })
    return versions


def sf_read_version(root_id: str, rel: str, version_id: str) -> Dict:
    root = _root_path(root_id)
    vdir = _versions_dir(root, rel)
    vfile = vdir / version_id
    if not vfile.exists() or not vfile.is_file():
        raise FileNotFoundError(f'Version not found: {version_id}')
    size = vfile.stat().st_size
    if size > MAX_FILE_BYTES:
        raise ValueError(f'Version file too large')
    content = vfile.read_text(encoding='utf-8', errors='replace')
    return {'version_id': version_id, 'content': content, 'size': size}


def sf_restore_version(root_id: str, rel: str, version_id: str):
    """Restore a version: save current as new version, then overwrite with old."""
    root = _root_path(root_id)
    vdir = _versions_dir(root, rel)
    vfile = vdir / version_id
    if not vfile.exists():
        raise FileNotFoundError(f'Version not found: {version_id}')
    target = safe_resolve_ws(root, rel)
    # Save current state as a version first
    _save_version(root, rel)
    # Restore
    shutil.copy2(vfile, target)


# ── Trash ──────────────────────────────────────────────────────────────────

def _trash_dir(root: Path) -> Path:
    return root / _TRASH_DIR


def sf_delete(root_id: str, rel: str):
    """Move file/dir to trash."""
    root = _root_path(root_id)
    src = safe_resolve_ws(root, rel)
    if not src.exists():
        raise FileNotFoundError(f'Not found: {rel}')

    tdir = _trash_dir(root)
    ts = int(time.time() * 1000)
    h = hashlib.md5(rel.encode()).hexdigest()[:8]
    item_id = f'{ts}_{h}'
    item_dir = tdir / item_id
    item_dir.mkdir(parents=True, exist_ok=True)

    # Move file
    shutil.move(str(src), str(item_dir / 'file'))

    # Write metadata
    meta = {
        'original_path': rel,
        'original_name': Path(rel).name,
        'deleted_at': ts // 1000,
        'is_dir': src.is_dir() if not src.exists() else False,
    }
    (item_dir / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False))


def sf_list_trash(root_id: str) -> List[Dict]:
    root = _root_path(root_id)
    tdir = _trash_dir(root)
    if not tdir.exists():
        return []
    cutoff = time.time() - _TRASH_DAYS * 86400
    items = []
    for item_dir in sorted(tdir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not item_dir.is_dir():
            continue
        meta_file = item_dir / 'meta.json'
        if not meta_file.exists():
            continue
        try:
            meta = json.loads(meta_file.read_text())
        except Exception:
            continue
        deleted_at = meta.get('deleted_at', 0)
        if deleted_at < cutoff:
            # Auto-purge expired items
            shutil.rmtree(item_dir, ignore_errors=True)
            continue
        file_path = item_dir / 'file'
        size = file_path.stat().st_size if file_path.is_file() else None
        items.append({
            'trash_id': item_dir.name,
            'root_id': root_id,
            'original_path': meta.get('original_path', ''),
            'original_name': meta.get('original_name', ''),
            'deleted_at': deleted_at,
            'expires_at': deleted_at + _TRASH_DAYS * 86400,
            'size': size,
            'label_deleted': _fmt_ts(deleted_at),
        })
    return items


def sf_restore_trash(root_id: str, trash_id: str):
    root = _root_path(root_id)
    item_dir = _trash_dir(root) / trash_id
    if not item_dir.exists():
        raise FileNotFoundError(f'Trash item not found: {trash_id}')
    meta = json.loads((item_dir / 'meta.json').read_text())
    original_path = meta['original_path']
    dest = safe_resolve_ws(root, original_path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        # Rename existing to avoid collision
        dest = dest.parent / (dest.stem + f'_restored_{int(time.time())}' + dest.suffix)
    shutil.move(str(item_dir / 'file'), str(dest))
    shutil.rmtree(item_dir, ignore_errors=True)


def sf_purge_trash(root_id: str, trash_id: Optional[str] = None):
    root = _root_path(root_id)
    tdir = _trash_dir(root)
    if not tdir.exists():
        return
    if trash_id:
        item_dir = tdir / trash_id
        shutil.rmtree(item_dir, ignore_errors=True)
    else:
        shutil.rmtree(tdir, ignore_errors=True)


# ── Upload ─────────────────────────────────────────────────────────────────

def sf_save_upload(root_id: str, rel_dir: str, filename: str, data: bytes):
    import re
    root = _root_path(root_id)
    safe_name = re.sub(r'[^\w.\-]', '_', filename)
    if not safe_name or safe_name.strip('.') == '':
        raise ValueError('Invalid filename')
    dest_dir = safe_resolve_ws(root, rel_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / safe_name
    dest.write_bytes(data)
    return str(dest.relative_to(root))


# ── Mkdir ──────────────────────────────────────────────────────────────────

def sf_mkdir(root_id: str, rel: str):
    root = _root_path(root_id)
    target = safe_resolve_ws(root, rel)
    target.mkdir(parents=True, exist_ok=True)


# ── Helpers ────────────────────────────────────────────────────────────────

def _fmt_ts(ts: int) -> str:
    import datetime
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')


# ── File watcher (auto-version on external writes) ─────────────────────────

def _start_watcher():
    """Watch all sysfile roots; save a version whenever a file is modified externally."""
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        return

    import threading

    class _Handler(FileSystemEventHandler):
        def __init__(self, root: Path):
            self._root = root
            self._pending: dict = {}  # path -> Timer
            self._lock = threading.Lock()

        def _handle(self, path_str: str):
            p = Path(path_str)
            parts = p.parts
            if _VERSIONS_DIR in parts or _TRASH_DIR in parts:
                return
            try:
                rel = str(p.relative_to(self._root))
            except ValueError:
                return
            # Debounce: cancel any pending timer for this path, wait for writes to settle
            with self._lock:
                existing = self._pending.pop(path_str, None)
                if existing:
                    existing.cancel()
                t = threading.Timer(0.5, self._save, args=(path_str, rel))
                self._pending[path_str] = t
                t.start()

        def _save(self, path_str: str, rel: str):
            with self._lock:
                self._pending.pop(path_str, None)
            p = Path(path_str)
            if not p.is_file() or p.stat().st_size == 0:
                return
            try:
                _save_version(self._root, rel)
            except Exception:
                pass

        def on_modified(self, event):
            if not event.is_directory:
                self._handle(event.src_path)

        def on_created(self, event):
            if not event.is_directory:
                self._handle(event.src_path)

    observer = Observer()
    for root_info in get_roots():
        root_path = Path(root_info['path'])
        if root_path.exists():
            observer.schedule(_Handler(root_path), str(root_path), recursive=True)

    observer.daemon = True
    observer.start()
    return observer


# Watcher is started explicitly via start_file_watcher() after server init
_watcher = None

def start_file_watcher():
    global _watcher
    if _watcher is None:
        _watcher = _start_watcher()
