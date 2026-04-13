/* ═══════════════════════════════════════════════════════════════════
   employee.js — Digital Employee data model, avatars, personalities
   Loaded between panels.js and onboarding.js
   ═══════════════════════════════════════════════════════════════════ */

const EMPLOYEE = {
  employees: [],
  active: null,
  avatars: [
    '/static/avatars/avatar0.png',
    '/static/avatars/avatar1.png',
    '/static/avatars/avatar2.png',
    '/static/avatars/avatar3.png',
    '/static/avatars/avatar4.png',
    '/static/avatars/avatar5.png',
    '/static/avatars/avatar6.png',
  ],
  personalities: [
    { id: 'copywriter', name: '创意文案', nameEn: 'Creative Copywriter', desc: '擅长撰写各类创意文案、营销内容和品牌故事，能够根据不同平台和受众调整写作风格。', gradient: 'linear-gradient(135deg,#ff6b6b,#ee5a24)' },
    { id: 'analyst', name: '数据分析师', nameEn: 'Data Analyst', desc: '精通数据分析和可视化，能够从复杂数据中提取有价值的洞察，支持业务决策。', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
    { id: 'support', name: '客服专员', nameEn: 'Customer Service', desc: '专业的客户服务代表，善于处理客户咨询、投诉和反馈，提供优质的服务体验。', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
    { id: 'pm', name: '项目经理', nameEn: 'Project Manager', desc: '经验丰富的项目管理专家，擅长制定计划、协调资源、跟踪进度和风险管理。', gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },
    { id: 'reviewer', name: '代码审查', nameEn: 'Code Reviewer', desc: '资深代码审查专家，关注代码质量、安全性和最佳实践，帮助团队提升代码水平。', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
    { id: 'meeting', name: '会议助手', nameEn: 'Meeting Assistant', desc: '高效的会议管理助手，负责会议记录、纪要整理、行动项跟踪和日程协调。', gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },
    { id: 'translator', name: '翻译专家', nameEn: 'Translation Expert', desc: '精通多语言翻译，能够准确传达原文含义，同时保持目标语言的自然流畅。', gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
    { id: 'knowledge', name: '知识管理', nameEn: 'Knowledge Manager', desc: '专注于知识库建设和管理，善于整理、分类和检索信息，构建团队知识体系。', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
    { id: 'social', name: '社媒运营', nameEn: 'Social Media Manager', desc: '社交媒体运营专家，擅长内容策划、社群管理和数据分析，提升品牌影响力。', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  ],
  defaultCapabilities: [
    { id: 'search', name: '联网搜索', nameEn: 'Web Search', icon: 'search', color: '#206CFF', enabled: true },
    { id: 'memory', name: '长期记忆', nameEn: 'Long-term Memory', icon: 'memory', color: '#7434DC', enabled: true },
    { id: 'autoExec', name: '自主执行', nameEn: 'Autonomous Execution', icon: 'auto', color: '#E6A817', enabled: false },
    { id: 'knowledge', name: '知识库对接', nameEn: 'Knowledge Base', icon: 'knowledge', color: '#4EA100', enabled: true },
  ],
};

function _isJduiTheme() {
  return document.documentElement.dataset.theme === 'jdui';
}

function _getEmployeeAvatar(index) {
  return EMPLOYEE.avatars[index] || EMPLOYEE.avatars[0];
}

async function _loadEmployees() {
  try {
    const res = await fetch('/api/employees');
    if (res.ok) {
      const data = await res.json();
      EMPLOYEE.employees = data.employees || [];
    }
  } catch (e) { /* ignore */ }
}

async function _saveEmployee(emp) {
  try {
    const res = await fetch('/api/employee/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
      body: JSON.stringify(emp),
    });
    if (res.ok) {
      const data = await res.json();
      EMPLOYEE.employees.push(data.employee || emp);
      return data.employee || emp;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function _getActiveEmployee() {
  if (!EMPLOYEE.active) return null;
  return EMPLOYEE.employees.find(e => e.id === EMPLOYEE.active) || null;
}

function _employeeStatusBadge(status) {
  const map = {
    online: { text: '在线', color: '#fff', bg: '#206cff' },
    busy: { text: '忙碌', color: '#ff7024', bg: '#fcede5' },
    idle: { text: '空闲', color: '#7434dc', bg: '#f7edff' },
    offline: { text: '离线', color: 'rgba(0,0,0,0.2)', bg: 'rgba(143,143,154,0.1)' },
    task: { text: '任务进行中', color: '#fff', bg: '#206cff' },
    scheduled: { text: '定时任务', color: '#fff', bg: '#206cff' },
  };
  return map[status] || map.online;
}

async function _updateEmployee(emp) {
  try {
    const res = await fetch('/api/employee/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
      body: JSON.stringify(emp),
    });
    if (res.ok) {
      const data = await res.json();
      const idx = EMPLOYEE.employees.findIndex(e => e.id === emp.id);
      if (idx >= 0) EMPLOYEE.employees[idx] = data.employee || emp;
      return data.employee || emp;
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function _deleteEmployeeById(id) {
  try {
    const res = await fetch('/api/employee/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      EMPLOYEE.employees = EMPLOYEE.employees.filter(e => e.id !== id);
      if (EMPLOYEE.active === id) EMPLOYEE.active = null;
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function _setActiveEmployee(id) {
  EMPLOYEE.active = id;
  localStorage.setItem('jdui-active-employee', id || '');
  if (typeof syncTopbar === 'function') syncTopbar();
}

function _restoreActiveEmployee() {
  const saved = localStorage.getItem('jdui-active-employee');
  if (saved) EMPLOYEE.active = saved;
}

async function _activateEmployee(id) {
  try {
    const res = await fetch('/api/employee/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF': '1' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const data = await res.json();
      EMPLOYEE.active = id;
      localStorage.setItem('jdui-active-employee', id);
      // Update global profile state
      if (data.active) S.activeProfile = data.active;
      if (typeof syncTopbar === 'function') syncTopbar();
      if (typeof renderSessionList === 'function') renderSessionList();
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}
