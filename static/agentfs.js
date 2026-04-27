/**
 * agentfs.js — AgentFS 项目空间前端
 * 提供：项目文件聚合视图、Agent协作配置、权限申请审批、Skill生成
 */

// ── State ──────────────────────────────────────────────────────────────────
let _afsCurrentProject = null;   // 当前打开的项目 {project_id, name, ...}
let _afsProjects = [];           // 项目列表缓存
let _afsPendingCount = 0;        // 待审批权限申请数
let _afsCurrentFiles = [];       // 当前项目文件列表缓存

// ── Init ───────────────────────────────────────────────────────────────────
async function afsInit() {
  await afsLoadProjects();
  afsRenderProjectList();
  await afsPollPendingRequests();
}

async function afsLoadProjects() {
  try {
    const data = await api('/api/projects');
    _afsProjects = data.projects || [];
  } catch (e) {
    _afsProjects = [];
  }
}

// ── switchPanel hook ───────────────────────────────────────────────────────
(function () {
  const _orig = switchPanel;
  switchPanel = async function (name) {
    const view = document.getElementById('agentfsView');
    if (name === 'agentfs') {
      if (view) { view.style.display = 'flex'; view.classList.add('afs-visible'); }
      await afsInit();
    } else {
      if (view) { view.style.display = 'none'; view.classList.remove('afs-visible'); }
    }
    return _orig(name);
  };
})();

// ── Project list ───────────────────────────────────────────────────────────
function afsRenderProjectList() {
  const list = document.getElementById('afsProjectList');
  if (!list) return;
  list.innerHTML = '';

  if (_afsProjects.length === 0) {
    list.innerHTML = '<div class="afs-empty">暂无项目，点击 + 创建</div>';
    return;
  }

  _afsProjects.forEach(proj => {
    const item = document.createElement('div');
    item.className = 'afs-proj-item' + (_afsCurrentProject?.project_id === proj.project_id ? ' active' : '');
    item.dataset.projectId = proj.project_id;
    const color = proj.color || '#7cb9ff';
    const fileCount = (proj.files || []).length;
    const agentCount = (proj.agents || []).length;
    item.innerHTML = `
      <span class="afs-proj-dot" style="background:${esc(color)}"></span>
      <div class="afs-proj-info">
        <div class="afs-proj-name">${esc(proj.name)}</div>
        <div class="afs-proj-meta">${fileCount}文件 · ${agentCount} Agent</div>
      </div>
    `;
    item.onclick = () => afsOpenProject(proj);
    list.appendChild(item);
  });
}

async function afsOpenProject(proj) {
  _afsCurrentProject = proj;
  document.querySelectorAll('.afs-proj-item').forEach(el => {
    el.classList.toggle('active', el.dataset.projectId === proj.project_id);
  });

  // Show col-2 project detail, hide empty state
  const detail = document.getElementById('afsProjectDetail');
  const empty = document.getElementById('afsDetailEmpty');
  if (detail) detail.style.display = 'flex';
  if (empty) empty.style.display = 'none';

  // Update header
  const dot = document.getElementById('afsDetailDot');
  const nameEl = document.getElementById('afsDetailName');
  const metaEl = document.getElementById('afsDetailMeta');
  if (dot) dot.style.background = proj.color || '#7cb9ff';
  if (nameEl) nameEl.textContent = proj.name;

  // Reset col-3 to empty state
  _afsHideDetailPanels();

  // Load files
  await afsLoadProjectFiles(proj.project_id);

  // Update meta after files loaded
  if (metaEl) {
    const agentCount = (proj.agents || []).length;
    metaEl.innerHTML = `
      <span>${_afsCurrentFiles.length} 文件</span>
      <span>${agentCount} Agent</span>
    `;
  }
}

function _afsHideDetailPanels() {
  const panelEmpty = document.getElementById('afsDetailPanelEmpty');
  const fileDetail = document.getElementById('afsFileDetail');
  const agentPanel = document.getElementById('afsAgentPanel');
  if (panelEmpty) panelEmpty.style.display = '';
  if (fileDetail) fileDetail.style.display = 'none';
  if (agentPanel) agentPanel.style.display = 'none';
}

// ── File icon helpers ──────────────────────────────────────────────────────
function afsFileIconType(name) {
  const ext = (name.includes('.') ? name.split('.').pop() : '').toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['doc','docx','txt','md'].includes(ext)) return 'doc';
  if (['png','jpg','jpeg','gif','svg','webp','ico','bmp'].includes(ext)) return 'img';
  if (['xls','xlsx','csv'].includes(ext)) return 'xls';
  if (['ppt','pptx'].includes(ext)) return 'ppt';
  return 'txt';
}
function afsFileIconLabel(type) {
  return { pdf:'P', doc:'D', img:'I', xls:'X', ppt:'S', txt:'T' }[type] || 'F';
}

// ── Project files ──────────────────────────────────────────────────────────

async function afsLoadProjectFiles(projectId) {
  const container = document.getElementById('afsFileTree');
  if (!container) return;
  container.innerHTML = '<div class="afs-loading">加载中...</div>';
  try {
    const data = await api(`/api/agentfs/project/files?project_id=${encodeURIComponent(projectId)}`);
    _afsCurrentFiles = data.files || [];
    afsRenderFileTree(_afsCurrentFiles);
  } catch (e) {
    container.innerHTML = '<div class="afs-loading" style="color:var(--accent)">加载失败</div>';
  }
}

function afsRenderFileTree(files) {
  const container = document.getElementById('afsFileTree');
  if (!container) return;
  if (files.length === 0) {
    container.innerHTML = '<div class="afs-empty">暂无文件，从文件管理器右键"添加到项目"</div>';
    return;
  }
  container.innerHTML = '';

  // Group by folder (dirname of rel_path)
  const folders = {};
  files.forEach(f => {
    const parts = f.rel_path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(f);
  });

  Object.keys(folders).sort().forEach(folder => {
    const folderFiles = folders[folder];
    if (folder) {
      const folderRow = document.createElement('div');
      folderRow.className = 'afs-folder-row';
      folderRow.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="afs-folder-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>${esc(folder.split('/').pop())}</span>
        <span class="afs-folder-count">${folderFiles.length}</span>
      `;
      container.appendChild(folderRow);
      const children = document.createElement('div');
      children.className = 'afs-folder-children';
      folderFiles.forEach(f => children.appendChild(_afsFileRow(f)));
      container.appendChild(children);
    } else {
      folderFiles.forEach(f => container.appendChild(_afsFileRow(f)));
    }
  });
}

function _afsFileRow(f) {
  const row = document.createElement('div');
  row.className = 'afs-file-row' + (f.exists === false ? ' afs-file-missing' : '');
  const type = afsFileIconType(f.name);
  const label = afsFileIconLabel(type);
  row.innerHTML = `
    <div class="afs-file-icon ${esc(type)}">${label}</div>
    <span class="afs-file-name" title="${esc(f.rel_path)}">${esc(f.name)}</span>
    <button class="afs-file-remove" title="从项目移除">×</button>
  `;
  row.querySelector('.afs-file-name').onclick = () => afsShowFileDetail(f);
  row.querySelector('.afs-file-remove').onclick = (e) => { e.stopPropagation(); afsRemoveFile(f.entry_id); };
  return row;
}

async function afsRemoveFile(entryId) {
  try {
    await api('/api/agentfs/project/remove', { method: 'POST', body: JSON.stringify({ entry_id: entryId }) });
    if (_afsCurrentProject) await afsLoadProjectFiles(_afsCurrentProject.project_id);
    _afsHideDetailPanels();
  } catch (e) {
    console.error('Remove file failed', e);
  }
}

function afsFmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ── File detail (col 3) ────────────────────────────────────────────────────
function afsShowFileDetail(f) {
  _afsHideDetailPanels();
  const panel = document.getElementById('afsFileDetail');
  const body = document.getElementById('afsFileDetailBody');
  if (!panel || !body) return;
  panel.style.display = 'flex';

  const type = afsFileIconType(f.name);
  const label = afsFileIconLabel(type);
  body.innerHTML = `
    <div class="afs-fd-file">
      <div class="afs-file-icon ${esc(type)}" style="width:24px;height:24px">${label}</div>
      <span class="afs-fd-filename">${esc(f.name)}</span>
    </div>
    <div class="afs-fd-row"><span class="afs-fd-label">路径</span><span class="afs-fd-value" style="word-break:break-all">${esc(f.rel_path)}</span></div>
    <div class="afs-fd-row"><span class="afs-fd-label">大小</span><span class="afs-fd-value">${afsFmtSize(f.size)}</span></div>
    <div class="afs-fd-row"><span class="afs-fd-label">来源</span><span class="afs-fd-value">${esc(f.root_label || '—')}</span></div>
    ${f.exists === false ? '<div class="afs-fd-missing">文件已删除</div>' : ''}
    <div class="afs-fd-actions">
      <button class="afs-text-btn" style="color:#e53e3e;border-color:#e53e3e" onclick="afsRemoveFile('${esc(f.entry_id)}')">从项目移除</button>
    </div>
  `;
}



// ── Add file to project (called from sysfiles context menu) ───────────────
async function afsAddFileToProject(rootId, relPath) {
  if (_afsProjects.length === 0) await afsLoadProjects();
  if (_afsProjects.length === 0) {
    afsShowToast('请先创建项目');
    return;
  }
  afsShowProjectPicker(rootId, relPath);
}

function afsShowProjectPicker(rootId, relPath) {
  // Remove existing picker
  document.getElementById('afsProjectPicker')?.remove();

  const picker = document.createElement('div');
  picker.id = 'afsProjectPicker';
  picker.className = 'afs-picker';
  picker.innerHTML = `
    <div class="afs-picker-header">添加到项目</div>
    ${_afsProjects.map(p => `
      <div class="afs-picker-item" data-pid="${esc(p.project_id)}" data-rid="${esc(rootId)}" data-rp="${esc(relPath)}">
        <span class="afs-proj-dot" style="background:${esc(p.color||'#7cb9ff')}"></span>
        ${esc(p.name)}
      </div>
    `).join('')}
    <div class="afs-picker-cancel" onclick="document.getElementById('afsProjectPicker')?.remove()">取消</div>
  `;
  // Bind click via event delegation (avoids inline onclick quoting issues)
  picker.querySelectorAll && setTimeout(() => {
    picker.querySelectorAll('.afs-picker-item').forEach(el => {
      el.onclick = () => afsDoAddFile(el.dataset.pid, el.dataset.rid, el.dataset.rp);
    });
  }, 0);
  document.body.appendChild(picker);

  // Position near sfTree panel
  const sfTree = document.getElementById('sfTreePanel');
  if (sfTree) {
    const rect = sfTree.getBoundingClientRect();
    picker.style.left = (rect.right + 4) + 'px';
    picker.style.top = rect.top + 'px';
  }

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function _close(e) {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 0);
}

async function afsDoAddFile(projectId, rootId, relPath) {
  document.getElementById('afsProjectPicker')?.remove();
  try {
    await api('/api/agentfs/project/add', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, root_id: rootId, rel_path: relPath })
    });
    afsShowToast('已添加到项目');
    if (_afsCurrentProject?.project_id === projectId) {
      await afsLoadProjectFiles(projectId);
    }
  } catch (e) {
    afsShowToast('添加失败：' + (e.message || e));
  }
}

// ── Agent panel (col 3) ────────────────────────────────────────────────────
function afsShowAgentPanel() {
  _afsHideDetailPanels();
  const panel = document.getElementById('afsAgentPanel');
  if (!panel) return;
  panel.style.display = 'flex';
  if (_afsCurrentProject) afsRenderAgentMatrix(_afsCurrentProject);
}

// ── Agent matrix ───────────────────────────────────────────────────────────
async function afsRenderAgentMatrix(proj) {
  const container = document.getElementById('afsAgentMatrix');
  if (!container) return;
  container.innerHTML = '<div class="afs-loading">加载中...</div>';
  try {
    const data = await api(`/api/agentfs/permissions?project_id=${encodeURIComponent(proj.project_id)}`);
    const matrix = data.matrix || [];
    if (matrix.length === 0) {
      container.innerHTML = '<div class="afs-empty">暂无协作 Agent</div>';
      return;
    }
    container.innerHTML = '';
    matrix.forEach(m => {
      const card = document.createElement('div');
      card.className = 'afs-agent-card';
      const initials = (m.emp_name || '?').slice(0, 2);
      card.innerHTML = `
        <div class="afs-agent-avatar">${esc(initials)}</div>
        <div class="afs-agent-info">
          <div class="afs-agent-name">${esc(m.emp_name)}</div>
          <div class="afs-agent-role">${esc(m.role || '协作Agent')}</div>
        </div>
        <div class="afs-agent-perms">
          <button class="afs-perm-toggle ${m.permissions.read ? 'on' : 'off'}" data-field="read" data-emp="${esc(m.emp_id)}" data-proj="${esc(proj.project_id)}">读</button>
          <button class="afs-perm-toggle ${m.permissions.write ? 'on' : 'off'}" data-field="write" data-emp="${esc(m.emp_id)}" data-proj="${esc(proj.project_id)}">写</button>
        </div>
        <button class="afs-agent-remove" data-emp="${esc(m.emp_id)}" data-proj="${esc(proj.project_id)}">×</button>
      `;
      card.querySelectorAll('.afs-perm-toggle').forEach(btn => {
        btn.onclick = async () => {
          const isOn = btn.classList.contains('on');
          btn.classList.toggle('on', !isOn);
          btn.classList.toggle('off', isOn);
          await afsUpdatePerm(btn.dataset.proj, btn.dataset.emp, btn.dataset.field, !isOn);
        };
      });
      card.querySelector('.afs-agent-remove').onclick = () => afsRemoveAgent(proj.project_id, m.emp_id);
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = '<div class="afs-loading" style="color:var(--accent)">加载失败</div>';
  }
}

async function afsUpdatePerm(projectId, empId, field, value) {
  // Read current permissions first
  try {
    const data = await api(`/api/agentfs/permissions?project_id=${encodeURIComponent(projectId)}`);
    const agent = (data.matrix || []).find(m => m.emp_id === empId);
    if (!agent) return;
    const perms = { ...agent.permissions, [field]: value };
    await api('/api/agentfs/permissions/update', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, emp_id: empId, permissions: perms })
    });
  } catch (e) {
    console.error('Update permission failed', e);
  }
}

async function afsRemoveAgent(projectId, empId) {
  try {
    await api('/api/projects/agents/remove', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, emp_id: empId })
    });
    // Refresh
    const proj = _afsProjects.find(p => p.project_id === projectId);
    if (proj) {
      proj.agents = (proj.agents || []).filter(a => a.emp_id !== empId);
      afsRenderAgentMatrix(proj);
    }
  } catch (e) {
    console.error('Remove agent failed', e);
  }
}

// ── Add agent dialog ───────────────────────────────────────────────────────
async function afsShowAddAgentDialog() {
  if (!_afsCurrentProject) return;
  document.getElementById('afsAddAgentDialog')?.remove();

  let employees = [];
  try {
    const data = await api('/api/employees');
    employees = data.employees || [];
  } catch (e) {}

  const dialog = document.createElement('div');
  dialog.id = 'afsAddAgentDialog';
  dialog.className = 'afs-dialog-overlay';
  dialog.innerHTML = `
    <div class="afs-dialog">
      <div class="afs-dialog-header">
        <span>添加协作 Agent</span>
        <button class="afs-dialog-close" onclick="document.getElementById('afsAddAgentDialog')?.remove()">×</button>
      </div>
      <div class="afs-dialog-body">
        <label>选择员工</label>
        <select id="afsAgentSelect" style="width:100%;margin-bottom:8px">
          ${employees.map(e => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}
        </select>
        <label>角色描述</label>
        <input id="afsAgentRole" type="text" placeholder="如：设计Agent、开发Agent" style="width:100%;margin-bottom:8px">
        <label>权限</label>
        <div style="display:flex;gap:12px;margin-bottom:12px">
          <label><input type="checkbox" id="afsPermRead" checked> 读取</label>
          <label><input type="checkbox" id="afsPermWrite"> 写入</label>
        </div>
      </div>
      <div class="afs-dialog-footer">
        <button class="sf-btn" onclick="document.getElementById('afsAddAgentDialog')?.remove()">取消</button>
        <button class="sf-btn sf-btn-primary" onclick="afsDoAddAgent()">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
}

async function afsDoAddAgent() {
  const empId = document.getElementById('afsAgentSelect')?.value;
  const role = document.getElementById('afsAgentRole')?.value || '协作Agent';
  const read = document.getElementById('afsPermRead')?.checked ?? true;
  const write = document.getElementById('afsPermWrite')?.checked ?? false;
  if (!empId || !_afsCurrentProject) return;

  try {
    const data = await api('/api/projects/agents/add', {
      method: 'POST',
      body: JSON.stringify({
        project_id: _afsCurrentProject.project_id,
        emp_id: empId,
        role,
        permissions: { read, write }
      })
    });
    document.getElementById('afsAddAgentDialog')?.remove();
    // Update local cache
    const proj = _afsProjects.find(p => p.project_id === _afsCurrentProject.project_id);
    if (proj && data.project) {
      Object.assign(proj, data.project);
      _afsCurrentProject = proj;
    }
    afsRenderAgentMatrix(_afsCurrentProject);
  } catch (e) {
    afsShowToast('添加失败：' + (e.message || e));
  }
}

// ── Create project ─────────────────────────────────────────────────────────
function afsShowCreateProject() {
  document.getElementById('afsCreateDialog')?.remove();
  const PROJECT_COLORS = ['#7cb9ff','#f5c542','#e94560','#50c878','#c084fc','#fb923c','#67e8f9','#f472b6'];
  const color = PROJECT_COLORS[_afsProjects.length % PROJECT_COLORS.length];

  const dialog = document.createElement('div');
  dialog.id = 'afsCreateDialog';
  dialog.className = 'afs-dialog-overlay';
  dialog.innerHTML = `
    <div class="afs-dialog">
      <div class="afs-dialog-header">
        <span>创建项目</span>
        <button class="afs-dialog-close" onclick="document.getElementById('afsCreateDialog')?.remove()">×</button>
      </div>
      <div class="afs-dialog-body">
        <label>项目名称</label>
        <input id="afsNewProjName" type="text" placeholder="输入项目名称" style="width:100%;margin-bottom:8px" autofocus>
        <label>项目描述（可选）</label>
        <textarea id="afsNewProjDesc" placeholder="描述项目目标..." style="width:100%;height:60px;margin-bottom:8px;resize:vertical"></textarea>
      </div>
      <div class="afs-dialog-footer">
        <button class="sf-btn" onclick="document.getElementById('afsCreateDialog')?.remove()">取消</button>
        <button class="sf-btn sf-btn-primary" onclick="afsDoCreateProject('${esc(color)}')">创建</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  document.getElementById('afsNewProjName')?.focus();
  document.getElementById('afsNewProjName')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') afsDoCreateProject(color);
  });
}

async function afsDoCreateProject(color) {
  const name = document.getElementById('afsNewProjName')?.value?.trim();
  const desc = document.getElementById('afsNewProjDesc')?.value?.trim();
  if (!name) return;
  try {
    const data = await api('/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({ name, color, description: desc })
    });
    document.getElementById('afsCreateDialog')?.remove();
    _afsProjects.push(data.project);
    // Also sync to sessions.js _allProjects if available
    if (typeof _allProjects !== 'undefined') _allProjects.push(data.project);
    afsRenderProjectList();
    afsOpenProject(data.project);
  } catch (e) {
    afsShowToast('创建失败：' + (e.message || e));
  }
}

// ── Permission requests ────────────────────────────────────────────────────
async function afsPollPendingRequests() {
  try {
    const data = await api('/api/agentfs/permission/requests');
    const reqs = data.requests || [];
    _afsPendingCount = reqs.length;
    afsUpdateNotificationBadge();
    if (reqs.length > 0) afsRenderPendingRequests(reqs);
  } catch (e) {}
}

function afsUpdateNotificationBadge() {
  // Nav badge
  const navBadge = document.getElementById('afsNavBadge');
  if (navBadge) {
    navBadge.textContent = _afsPendingCount;
    navBadge.style.display = _afsPendingCount > 0 ? 'inline-flex' : 'none';
  }
  // Sidebar perm entry
  const permEntry = document.getElementById('afsPermEntry');
  const permBadge = document.getElementById('afsPermBadge');
  if (permEntry) permEntry.style.display = _afsPendingCount > 0 ? 'flex' : 'none';
  if (permBadge) permBadge.textContent = _afsPendingCount;
}

function afsRenderPendingRequests(reqs) {
  const container = document.getElementById('afsPendingRequests');
  if (!container) return;
  container.innerHTML = '';
  reqs.forEach(req => {
    const card = document.createElement('div');
    card.className = 'afs-req-card';
    card.innerHTML = `
      <div class="afs-req-info">
        <strong>${esc(req.requester_name)}</strong> 申请访问
        <span class="afs-req-file">${esc(req.target_rel_path)}</span>
        ${req.reason ? `<div class="afs-req-reason">"${esc(req.reason)}"</div>` : ''}
      </div>
      <div class="afs-req-actions">
        <button class="sf-btn sf-btn-primary" onclick="afsApproveRequest('${esc(req.request_id)}')">批准</button>
        <button class="sf-btn sf-btn-danger" onclick="afsDenyRequest('${esc(req.request_id)}')">拒绝</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function afsApproveRequest(requestId) {
  try {
    await api('/api/agentfs/permission/approve', { method: 'POST', body: JSON.stringify({ request_id: requestId }) });
    afsShowToast('已批准，临时权限有效 1 小时');
    await afsPollPendingRequests();
  } catch (e) {
    afsShowToast('操作失败');
  }
}

async function afsDenyRequest(requestId) {
  try {
    await api('/api/agentfs/permission/deny', { method: 'POST', body: JSON.stringify({ request_id: requestId }) });
    afsShowToast('已拒绝');
    await afsPollPendingRequests();
  } catch (e) {
    afsShowToast('操作失败');
  }
}

// ── Skill generation ───────────────────────────────────────────────────────
async function afsGenerateSkill() {
  if (!_afsCurrentProject) return;
  const btn = document.getElementById('afsBtnGenerateSkill');
  if (btn) { btn.disabled = true; btn.textContent = '生成中...'; }
  try {
    const data = await api('/api/agentfs/project/skill/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: _afsCurrentProject.project_id })
    });
    afsShowToast(`Skill 已生成，写入 ${data.files_written?.length || 0} 个 Agent`);
    // Show skill content
    const content = await api(`/api/agentfs/project/skill?project_id=${encodeURIComponent(_afsCurrentProject.project_id)}`);
    afsShowSkillPreview(content.content);
  } catch (e) {
    afsShowToast('生成失败：' + (e.message || e));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '生成 Skill'; }
  }
}

function afsShowSkillPreview(content) {
  document.getElementById('afsSkillPreviewDialog')?.remove();
  const dialog = document.createElement('div');
  dialog.id = 'afsSkillPreviewDialog';
  dialog.className = 'afs-dialog-overlay';
  dialog.innerHTML = `
    <div class="afs-dialog" style="max-width:640px;width:90vw">
      <div class="afs-dialog-header">
        <span>项目 Skill 预览</span>
        <button class="afs-dialog-close" onclick="document.getElementById('afsSkillPreviewDialog')?.remove()">×</button>
      </div>
      <div class="afs-dialog-body" style="max-height:60vh;overflow-y:auto">
        <pre style="white-space:pre-wrap;font-size:12px;line-height:1.6">${esc(content)}</pre>
      </div>
      <div class="afs-dialog-footer">
        <button class="sf-btn sf-btn-primary" onclick="document.getElementById('afsSkillPreviewDialog')?.remove()">关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
}

// ── Charter editor ─────────────────────────────────────────────────────────
function afsShowCharterEditor() {
  if (!_afsCurrentProject) return;
  document.getElementById('afsCharterDialog')?.remove();
  const dialog = document.createElement('div');
  dialog.id = 'afsCharterDialog';
  dialog.className = 'afs-dialog-overlay';
  dialog.innerHTML = `
    <div class="afs-dialog" style="max-width:600px;width:90vw">
      <div class="afs-dialog-header">
        <span>项目章程</span>
        <button class="afs-dialog-close" onclick="document.getElementById('afsCharterDialog')?.remove()">×</button>
      </div>
      <div class="afs-dialog-body">
        <textarea id="afsCharterContent" style="width:100%;height:200px;resize:vertical;font-size:13px">${esc(_afsCurrentProject.charter || '')}</textarea>
      </div>
      <div class="afs-dialog-footer">
        <button class="sf-btn" onclick="document.getElementById('afsCharterDialog')?.remove()">取消</button>
        <button class="sf-btn sf-btn-primary" onclick="afsSaveCharter()">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
}

async function afsSaveCharter() {
  const content = document.getElementById('afsCharterContent')?.value || '';
  try {
    await api('/api/projects/update', {
      method: 'POST',
      body: JSON.stringify({ project_id: _afsCurrentProject.project_id, charter: content })
    });
    _afsCurrentProject.charter = content;
    document.getElementById('afsCharterDialog')?.remove();
    afsShowToast('章程已保存');
  } catch (e) {
    afsShowToast('保存失败');
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
function afsShowToast(msg) {
  const t = document.createElement('div');
  t.className = 'afs-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

// ── Poll pending requests every 30s ───────────────────────────────────────
setInterval(() => {
  if (document.getElementById('agentfsView')?.classList.contains('afs-visible')) {
    afsPollPendingRequests();
  } else {
    // Still update badge even when panel is hidden
    afsPollPendingRequests();
  }
}, 30000);

// ── Public aliases (called from HTML) ─────────────────────────────────────
function afsCreateProject() { afsShowCreateProject(); }
function afsOpenSkillPanel() { afsGenerateSkill(); }
function afsOpenCharter() { afsShowCharterEditor(); }
function afsAddAgent() { afsShowAddAgentDialog(); }

function afsOpenPermRequests() {
  document.getElementById('afsPermRequestsDialog')?.remove();
  const dialog = document.createElement('div');
  dialog.id = 'afsPermRequestsDialog';
  dialog.className = 'afs-dialog-overlay';
  dialog.innerHTML = `
    <div class="afs-dialog" style="max-width:560px;width:90vw">
      <div class="afs-dialog-header">
        <span>权限申请审批</span>
        <button class="afs-dialog-close" onclick="document.getElementById('afsPermRequestsDialog')?.remove()">×</button>
      </div>
      <div class="afs-dialog-body" id="afsPendingRequests" style="max-height:60vh;overflow-y:auto">
        <div class="afs-loading">加载中...</div>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  afsPollPendingRequests();
}

