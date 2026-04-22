/**
 * sysfiles.js — System-level file manager
 * Handles multi-root tree, preview, versioning, trash, upload.
 */

// ── State ──────────────────────────────────────────────────────────────────
let _sfRoots = null;           // [{id, label, path, type, avatar_index}]
let _sfExpanded = new Set();   // expanded root/dir keys
let _sfSelected = null;        // {root_id, path, name, type}
let _sfCurrentRoot = null;     // currently active root_id for upload/mkdir
let _sfTrashOpen = false;

// ── Init ───────────────────────────────────────────────────────────────────
async function sfInit() {
  if (!_sfRoots) await sfLoadRoots();
  sfRenderTree();
  sfLoadTrashCount();
  sfInitDragDrop();
  sfInitResize();
}

async function sfLoadRoots() {
  try {
    const data = await api('/api/sysfile/roots');
    _sfRoots = data.roots || [];
  } catch (e) {
    _sfRoots = [];
  }
}

// ── switchPanel hook ───────────────────────────────────────────────────────
(function () {
  const _orig = switchPanel;
  switchPanel = async function (name) {
    const view = document.getElementById('sysfilesView');
    if (name === 'sysfiles') {
      if (view) { view.style.display = 'flex'; view.classList.add('sf-visible'); }
      await sfInit();
    } else {
      if (view) { view.style.display = 'none'; view.classList.remove('sf-visible'); }
    }
    return _orig(name);
  };
})();

// ── Tree rendering ─────────────────────────────────────────────────────────
function sfRenderTree() {
  const tree = document.getElementById('sfTree');
  if (!tree || !_sfRoots) return;
  tree.innerHTML = '';
  _sfRoots.forEach(root => {
    tree.appendChild(sfMakeRootNode(root));
  });
}

function sfMakeRootNode(root) {
  const node = document.createElement('div');
  node.className = 'sf-root-node';
  node.dataset.rootId = root.id;

  const isExpanded = _sfExpanded.has(root.id);
  const label = document.createElement('div');
  label.className = 'sf-root-label';
  label.innerHTML = `
    <svg class="sf-root-chevron ${isExpanded ? 'open' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    ${root.type === 'public'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    }
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${esc(root.label)}</span>
  `;
  label.onclick = () => sfToggleRoot(root.id, node, label);
  node.appendChild(label);

  const children = document.createElement('div');
  children.className = 'sf-root-children';
  children.id = `sf-children-${root.id}`;
  if (isExpanded) {
    sfLoadChildren(root.id, '.', children);
  }
  node.appendChild(children);
  return node;
}

async function sfToggleRoot(rootId, node, label) {
  const chevron = label.querySelector('.sf-root-chevron');
  const children = document.getElementById(`sf-children-${rootId}`);
  if (_sfExpanded.has(rootId)) {
    _sfExpanded.delete(rootId);
    chevron.classList.remove('open');
    children.innerHTML = '';
  } else {
    _sfExpanded.add(rootId);
    chevron.classList.add('open');
    children.innerHTML = '<div class="sf-loading">加载中...</div>';
    await sfLoadChildren(rootId, '.', children);
  }
  _sfCurrentRoot = rootId;
}

async function sfLoadChildren(rootId, rel, container) {
  try {
    const data = await api(`/api/sysfile/list?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(rel)}`);
    container.innerHTML = '';
    (data.entries || []).forEach(entry => {
      container.appendChild(sfMakeTreeItem(rootId, entry, rel));
    });
    if (!data.entries || data.entries.length === 0) {
      container.innerHTML = '<div class="sf-loading" style="padding-left:24px">空目录</div>';
    }
  } catch (e) {
    container.innerHTML = `<div class="sf-loading" style="color:var(--accent)">加载失败</div>`;
  }
}

function sfMakeTreeItem(rootId, entry, parentRel) {
  const item = document.createElement('div');
  const indent = (parentRel.split('/').filter(Boolean).length + 1) * 12 + 12;
  item.className = 'sf-tree-item';
  item.style.paddingLeft = indent + 'px';

  const isDir = entry.type === 'dir';
  const key = `${rootId}::${entry.path}`;
  const isExpanded = _sfExpanded.has(key);

  item.innerHTML = `
    ${isDir
      ? `<svg class="sf-root-chevron ${isExpanded ? 'open' : ''}" style="width:10px;height:10px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
      : `<svg width="10" height="10" style="flex-shrink:0;opacity:0"></svg>
         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
    }
    <span class="sf-tree-item-name" title="${esc(entry.name)}">${esc(entry.name)}</span>
    ${!isDir && entry.size != null ? `<span class="sf-tree-item-size">${sfFmtSize(entry.size)}</span>` : ''}
  `;

  if (isDir) {
    // Sub-children container
    const subId = `sf-sub-${rootId}-${entry.path.replace(/[^a-z0-9]/gi, '_')}`;
    item.dataset.subId = subId;
    item.onclick = async (e) => {
      e.stopPropagation();
      _sfCurrentRoot = rootId;
      const chevron = item.querySelector('.sf-root-chevron');
      let sub = document.getElementById(subId);
      if (_sfExpanded.has(key)) {
        _sfExpanded.delete(key);
        chevron.classList.remove('open');
        if (sub) sub.remove();
      } else {
        _sfExpanded.add(key);
        chevron.classList.add('open');
        sub = document.createElement('div');
        sub.id = subId;
        item.insertAdjacentElement('afterend', sub);
        sub.innerHTML = '<div class="sf-loading" style="padding-left:' + (indent + 16) + 'px">加载中...</div>';
        await sfLoadChildren(rootId, entry.path, sub);
      }
    };
  } else {
    item.onclick = (e) => {
      e.stopPropagation();
      _sfCurrentRoot = rootId;
      document.querySelectorAll('.sf-tree-item.sf-selected').forEach(el => el.classList.remove('sf-selected'));
      item.classList.add('sf-selected');
      sfOpenFile(rootId, entry);
    };
  }
  return item;
}

// ── File preview ───────────────────────────────────────────────────────────
const SF_IMG_EXTS    = new Set(['.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.bmp']);
const SF_MD_EXTS     = new Set(['.md','.markdown','.mdown']);
const SF_PDF_EXTS    = new Set(['.pdf']);
const SF_HTML_EXTS   = new Set(['.html','.htm']);
const SF_EXCEL_EXTS  = new Set(['.xlsx','.xls','.csv']);
const SF_PPT_EXTS    = new Set(['.pptx','.ppt']);
const SF_TEXT_EXTS   = new Set(['.txt','.log','.json','.yaml','.yml','.toml','.ini','.cfg','.conf','.sh','.bash','.py','.js','.ts','.jsx','.tsx','.css','.scss','.less','.xml','.sql','.go','.rs','.java','.c','.cpp','.h','.hpp','.rb','.php','.swift','.kt','.r','.m','.env','.gitignore','.dockerfile']);

async function sfOpenFile(rootId, entry) {
  _sfSelected = { root_id: rootId, path: entry.path, name: entry.name };
  const toolbar = document.getElementById('sfPreviewToolbar');
  const empty = document.getElementById('sfPreviewEmpty');
  const content = document.getElementById('sfPreviewContent');
  const filename = document.getElementById('sfPreviewFilename');
  const btnVersions = document.getElementById('sfBtnVersions');

  empty.style.display = 'none';
  toolbar.style.display = 'flex';
  content.style.display = 'flex';
  filename.textContent = entry.name;

  // Hide all preview areas and reset iframes
  ['sfCodeView','sfMdView','sfImgView','sfIframe','sfPdfFrame','sfOfficeFrame','sfExcelView','sfBinaryView'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const _sfIframe = document.getElementById('sfIframe');
  if (_sfIframe) { _sfIframe.src = 'about:blank'; _sfIframe.removeAttribute('srcdoc'); }
  const _sfPdfFrame = document.getElementById('sfPdfFrame');
  if (_sfPdfFrame) _sfPdfFrame.src = 'about:blank';
  const _sfOfficeFrame = document.getElementById('sfOfficeFrame');
  if (_sfOfficeFrame) { _sfOfficeFrame.removeAttribute('srcdoc'); }

  const ext = entry.name.includes('.') ? ('.' + entry.name.split('.').pop()).toLowerCase() : '';
  const rawUrl = `/api/sysfile/raw?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(entry.path)}`;

  if (SF_IMG_EXTS.has(ext)) {
    const img = document.getElementById('sfImg');
    img.src = rawUrl;
    document.getElementById('sfImgView').style.display = 'block';
    btnVersions.style.display = 'none';
  } else if (SF_PDF_EXTS.has(ext)) {
    const frame = document.getElementById('sfPdfFrame');
    frame.src = rawUrl;
    frame.style.display = 'block';
    btnVersions.style.display = 'none';
  } else if (SF_PPT_EXTS.has(ext)) {
    const frame = document.getElementById('sfOfficeFrame');
    frame.style.display = 'block';
    frame.srcdoc = '<body style="background:#1a1a2e;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">加载中...</body>';
    btnVersions.style.display = 'none';
    try {
      const resp = await fetch(`/api/sysfile/pptx_html?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(entry.path)}`);
      const data = await resp.json();
      frame.srcdoc = data.error ? `<body style="color:red;padding:20px">${data.error}</body>` : data.html;
    } catch (e) {
      frame.srcdoc = `<body style="color:red;padding:20px">加载失败: ${e.message}</body>`;
    }
  } else if (SF_HTML_EXTS.has(ext)) {
    try {
      const data = await api(`/api/sysfile/read?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(entry.path)}`);
      const iframe = document.getElementById('sfIframe');
      iframe.srcdoc = data.content;
      iframe.style.display = 'block';
      btnVersions.style.display = 'inline-flex';
    } catch (e) { sfShowBinary(); }
  } else if (SF_EXCEL_EXTS.has(ext)) {
    btnVersions.style.display = 'none';
    try {
      const resp = await fetch(rawUrl);
      const buf = await resp.arrayBuffer();
      const container = document.getElementById('sfExcelView');
      container.style.display = 'flex';
      container.innerHTML = '';
      if (typeof XLSX === 'undefined') { container.textContent = 'SheetJS 未加载，请刷新页面重试'; return; }
      const wb = XLSX.read(buf, { type: 'array' });
      const tabs = document.createElement('div'); tabs.className = 'fm-excel-tabs';
      const content = document.createElement('div'); content.className = 'fm-excel-content';
      container.appendChild(tabs); container.appendChild(content);
      const renderSheet = name => {
        const ws = wb.Sheets[name];
        content.innerHTML = XLSX.utils.sheet_to_html(ws, { editable: false });
        const tbl = content.querySelector('table');
        if (tbl) tbl.className = 'fm-excel-table';
        tabs.querySelectorAll('.fm-excel-tab').forEach(t => t.classList.toggle('active', t.dataset.sheet === name));
      };
      wb.SheetNames.forEach((name, i) => {
        const tab = document.createElement('button');
        tab.className = 'fm-excel-tab' + (i === 0 ? ' active' : '');
        tab.dataset.sheet = name; tab.textContent = name;
        tab.onclick = () => renderSheet(name);
        tabs.appendChild(tab);
      });
      if (wb.SheetNames.length) renderSheet(wb.SheetNames[0]);
    } catch (e) { sfShowBinary(); }
  } else if (SF_MD_EXTS.has(ext)) {
    try {
      const data = await api(`/api/sysfile/read?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(entry.path)}`);
      const md = document.getElementById('sfMdView');
      md.innerHTML = typeof renderMd === 'function' ? renderMd(data.content) : esc(data.content).replace(/\n/g,'<br>');
      md.style.display = 'block';
      btnVersions.style.display = 'inline-flex';
    } catch (e) { sfShowBinary(); }
  } else if (SF_TEXT_EXTS.has(ext) || entry.size < 500000) {
    try {
      const data = await api(`/api/sysfile/read?root=${encodeURIComponent(rootId)}&path=${encodeURIComponent(entry.path)}`);
      if (data.binary) { sfShowBinary(); return; }
      const pre = document.getElementById('sfCodeView');
      const lang = _sfPrismLang(ext);
      pre.innerHTML = '<code class="language-' + (lang || 'none') + '">' + _sfEscHtml(data.content) + '</code>';
      pre.style.display = 'block';
      if (lang) {
        const highlight = () => { if (window.Prism) Prism.highlightElement(pre.firstChild); };
        window.Prism ? highlight() : window.addEventListener('load', highlight, { once: true });
      }
      btnVersions.style.display = 'inline-flex';
    } catch (e) { sfShowBinary(); }
  } else {
    sfShowBinary();
    btnVersions.style.display = 'none';
  }
}

function _sfEscHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _sfPrismLang(ext) {
  const map = {
    '.js':'javascript','.ts':'typescript','.jsx':'jsx','.tsx':'tsx',
    '.py':'python','.rb':'ruby','.go':'go','.rs':'rust','.java':'java',
    '.c':'c','.cpp':'cpp','.cs':'csharp','.php':'php','.swift':'swift',
    '.kt':'kotlin','.sh':'bash','.bash':'bash','.zsh':'bash',
    '.css':'css','.scss':'scss','.less':'less',
    '.html':'html','.htm':'html','.xml':'xml','.svg':'svg',
    '.json':'json','.yaml':'yaml','.yml':'yaml','.toml':'toml',
    '.sql':'sql','.md':'markdown','.dockerfile':'docker',
    '.tf':'hcl','.lua':'lua','.r':'r','.dart':'dart','.vue':'markup',
  };
  return map[ext] || null;
}

function sfShowBinary() {
  document.getElementById('sfBinaryView').style.display = 'block';
  document.getElementById('sfBtnVersions').style.display = 'none';
}

function sfDownload() {
  if (!_sfSelected) return;
  const { root_id, path } = _sfSelected;
  window.open(`/api/sysfile/raw?root=${encodeURIComponent(root_id)}&path=${encodeURIComponent(path)}&download=1`, '_blank');
}

async function sfDeleteFile() {
  if (!_sfSelected) return;
  const { root_id, path, name } = _sfSelected;
  if (!confirm(`删除 "${name}"？文件将移入回收站。`)) return;
  try {
    await api('/api/sysfile/delete', { method: 'POST', body: JSON.stringify({ root: root_id, path }) });
    showToast('已移入回收站');
    sfClearPreview();
    sfRefreshCurrentDir();
    sfLoadTrashCount();
  } catch (e) {
    showToast('删除失败: ' + e.message, 'error');
  }
}

function sfClearPreview() {
  _sfSelected = null;
  document.getElementById('sfPreviewToolbar').style.display = 'none';
  document.getElementById('sfPreviewContent').style.display = 'none';
  document.getElementById('sfPreviewEmpty').style.display = 'flex';
  ['sfCodeView','sfMdView','sfImgView','sfIframe','sfPdfFrame','sfOfficeFrame','sfExcelView','sfBinaryView'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function sfRefreshCurrentDir() {
  // Re-expand all currently expanded dirs
  const expanded = [..._sfExpanded];
  _sfExpanded.clear();
  _sfRoots = null;
  sfLoadRoots().then(() => {
    expanded.forEach(k => _sfExpanded.add(k));
    sfRenderTree();
  });
}

// ── Versions ───────────────────────────────────────────────────────────────
async function sfOpenVersions() {
  if (!_sfSelected) return;
  const { root_id, path } = _sfSelected;
  const drawer = document.getElementById('sfVersionsDrawer');
  const list = document.getElementById('sfVersionsList');
  drawer.style.display = 'flex';
  list.innerHTML = '<div class="sf-loading">加载中...</div>';
  try {
    const data = await api(`/api/sysfile/versions?root=${encodeURIComponent(root_id)}&path=${encodeURIComponent(path)}`);
    const versions = data.versions || [];
    if (!versions.length) {
      list.innerHTML = '<div class="sf-loading">暂无历史版本</div>';
      return;
    }
    list.innerHTML = '';
    versions.forEach(v => {
      const item = document.createElement('div');
      item.className = 'sf-version-item';
      item.innerHTML = `
        <div style="flex:1">
          <div class="sf-version-label">${esc(v.label)}</div>
          <div class="sf-version-size">${sfFmtSize(v.size)}</div>
        </div>
        <button class="sf-version-restore" onclick="sfPreviewVersion('${esc(v.version_id)}')">预览</button>
        <button class="sf-version-restore" style="color:var(--accent2,#b2e40d);border-color:rgba(178,228,13,.3)" onclick="sfRestoreVersion('${esc(v.version_id)}')">回退</button>
      `;
      list.appendChild(item);
    });
  } catch (e) {
    list.innerHTML = `<div class="sf-loading" style="color:var(--accent)">加载失败</div>`;
  }
}

function sfCloseVersions() {
  document.getElementById('sfVersionsDrawer').style.display = 'none';
}

async function sfPreviewVersion(versionId) {
  if (!_sfSelected) return;
  const { root_id, path } = _sfSelected;
  try {
    const data = await api(`/api/sysfile/version/read?root=${encodeURIComponent(root_id)}&path=${encodeURIComponent(path)}&version_id=${encodeURIComponent(versionId)}`);
    const code = document.getElementById('sfCodeView');
    ['sfMdView','sfImgView','sfIframe','sfExcelView','sfBinaryView'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    code.textContent = `[历史版本预览]\n\n${data.content}`;
    code.style.display = 'block';
    document.getElementById('sfPreviewContent').style.display = 'flex';
  } catch (e) {
    showToast('预览失败: ' + e.message, 'error');
  }
}

async function sfRestoreVersion(versionId) {
  if (!_sfSelected) return;
  if (!confirm('确认回退到此版本？当前内容将保存为新版本。')) return;
  const { root_id, path } = _sfSelected;
  try {
    await api('/api/sysfile/version/restore', { method: 'POST', body: JSON.stringify({ root: root_id, path, version_id: versionId }) });
    showToast('已回退到历史版本');
    sfCloseVersions();
    sfOpenFile(root_id, { path, name: _sfSelected.name });
  } catch (e) {
    showToast('回退失败: ' + e.message, 'error');
  }
}

// ── Trash ──────────────────────────────────────────────────────────────────
async function sfLoadTrashCount() {
  const badge = document.getElementById('sfTrashCount');
  if (!badge || !_sfRoots) return;
  let total = 0;
  for (const root of _sfRoots) {
    try {
      const data = await api(`/api/sysfile/trash/list?root=${encodeURIComponent(root.id)}`);
      total += (data.items || []).length;
    } catch (e) {}
  }
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

async function sfOpenTrash() {
  _sfTrashOpen = true;
  const trashView = document.getElementById('sfTrashView');
  const body = document.getElementById('sfBody') || document.querySelector('.sf-body');
  trashView.style.display = 'flex';
  const list = document.getElementById('sfTrashList');
  list.innerHTML = '<div class="sf-loading">加载中...</div>';

  let allItems = [];
  if (_sfRoots) {
    for (const root of _sfRoots) {
      try {
        const data = await api(`/api/sysfile/trash/list?root=${encodeURIComponent(root.id)}`);
        (data.items || []).forEach(item => {
          allItems.push({ ...item, _root_label: root.label });
        });
      } catch (e) {}
    }
  }

  allItems.sort((a, b) => b.deleted_at - a.deleted_at);

  if (!allItems.length) {
    list.innerHTML = '<div class="sf-loading">回收站为空</div>';
    return;
  }

  list.innerHTML = '';
  allItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'sf-trash-item';
    const deletedDate = new Date(item.deleted_at * 1000).toLocaleString();
    const expiresDate = new Date(item.expires_at * 1000).toLocaleDateString();
    el.innerHTML = `
      <div class="sf-trash-item-info">
        <div class="sf-trash-item-name" title="${esc(item.original_path)}">${esc(item.original_path.split('/').pop())}</div>
        <div class="sf-trash-item-meta">${esc(item._root_label)} · ${deletedDate} · 到期 ${expiresDate}</div>
      </div>
      <div class="sf-trash-item-actions">
        <button class="sf-btn" onclick="sfRestoreTrash('${esc(item.original_root)}','${esc(item.trash_id)}',this)">恢复</button>
        <button class="sf-btn sf-btn-danger" onclick="sfPurgeTrash('${esc(item.original_root)}','${esc(item.trash_id)}',this)">删除</button>
      </div>
    `;
    list.appendChild(el);
  });
}

function sfCloseTrash() {
  _sfTrashOpen = false;
  document.getElementById('sfTrashView').style.display = 'none';
}

async function sfRestoreTrash(rootId, trashId, btn) {
  try {
    await api('/api/sysfile/trash/restore', { method: 'POST', body: JSON.stringify({ root: rootId, trash_id: trashId }) });
    showToast('文件已恢复');
    btn.closest('.sf-trash-item').remove();
    sfLoadTrashCount();
    sfRefreshCurrentDir();
  } catch (e) {
    showToast('恢复失败: ' + e.message, 'error');
  }
}

async function sfPurgeTrash(rootId, trashId, btn) {
  if (!confirm('永久删除此文件？无法恢复。')) return;
  try {
    await api('/api/sysfile/trash/purge', { method: 'POST', body: JSON.stringify({ root: rootId, trash_id: trashId }) });
    showToast('已永久删除');
    btn.closest('.sf-trash-item').remove();
    sfLoadTrashCount();
  } catch (e) {
    showToast('删除失败: ' + e.message, 'error');
  }
}

async function sfPurgeAll() {
  if (!confirm('清空所有回收站？所有文件将永久删除，无法恢复。')) return;
  if (!_sfRoots) return;
  for (const root of _sfRoots) {
    try {
      await api('/api/sysfile/trash/purge', { method: 'POST', body: JSON.stringify({ root: root.id, all: true }) });
    } catch (e) {}
  }
  showToast('回收站已清空');
  document.getElementById('sfTrashList').innerHTML = '<div class="sf-loading">回收站为空</div>';
  sfLoadTrashCount();
}

// ── Upload ─────────────────────────────────────────────────────────────────
function sfUploadClick() {
  document.getElementById('sfUploadInput').click();
}

async function sfHandleUpload(files) {
  if (!files || !files.length) return;
  const rootId = _sfCurrentRoot || (_sfRoots && _sfRoots[0] && _sfRoots[0].id) || 'public';
  const dir = _sfSelected && _sfSelected.path
    ? _sfSelected.path.includes('/') ? _sfSelected.path.substring(0, _sfSelected.path.lastIndexOf('/')) : '.'
    : '.';

  let ok = 0, fail = 0;
  for (const file of files) {
    const fd = new FormData();
    fd.append('root', rootId);
    fd.append('dir', dir);
    fd.append('file', file);
    try {
      const resp = await fetch('/api/sysfile/upload', { method: 'POST', body: fd });
      const data = await resp.json();
      if (data.ok) ok++;
      else fail++;
    } catch (e) { fail++; }
  }
  showToast(ok > 0 ? `上传成功 ${ok} 个文件${fail > 0 ? `，${fail} 个失败` : ''}` : '上传失败');
  document.getElementById('sfUploadInput').value = '';
  sfRefreshCurrentDir();
}

// ── Mkdir ──────────────────────────────────────────────────────────────────
async function sfMkdirClick() {
  const rootId = _sfCurrentRoot || (_sfRoots && _sfRoots[0] && _sfRoots[0].id) || 'public';
  const name = prompt('新建文件夹名称：');
  if (!name || !name.trim()) return;
  const base = _sfSelected && _sfSelected.type === 'dir' ? _sfSelected.path : '.';
  const rel = base === '.' ? name.trim() : `${base}/${name.trim()}`;
  try {
    await api('/api/sysfile/mkdir', { method: 'POST', body: JSON.stringify({ root: rootId, path: rel }) });
    showToast('文件夹已创建');
    sfRefreshCurrentDir();
  } catch (e) {
    showToast('创建失败: ' + e.message, 'error');
  }
}

// ── Drag & drop upload ─────────────────────────────────────────────────────
function sfInitDragDrop() {
  const view = document.getElementById('sysfilesView');
  const overlay = document.getElementById('sfDropOverlay');
  if (!view || !overlay) return;

  let dragCounter = 0;
  view.addEventListener('dragenter', e => {
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      overlay.style.display = 'flex';
    }
  });
  view.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; overlay.style.display = 'none'; }
  });
  view.addEventListener('dragover', e => e.preventDefault());
  view.addEventListener('drop', e => {
    e.preventDefault();
    dragCounter = 0;
    overlay.style.display = 'none';
    if (e.dataTransfer.files.length) sfHandleUpload(e.dataTransfer.files);
  });
}

// ── Resize handle ──────────────────────────────────────────────────────────
function sfInitResize() {
  const handle = document.getElementById('sfResizeHandle');
  const treePanel = document.getElementById('sfTreePanel');
  if (!handle || !treePanel) return;
  let dragging = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startW = treePanel.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(160, Math.min(480, startW + e.clientX - startX));
    treePanel.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; handle.classList.remove('dragging'); document.body.style.userSelect = ''; }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function sfFmtSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'K';
  return (bytes / 1024 / 1024).toFixed(1) + 'M';
}
