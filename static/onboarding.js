const ONBOARDING={status:null,step:0,steps:['system','setup','workspace','password','finish'],form:{provider:'openrouter',workspace:'',model:'',password:'',apiKey:'',baseUrl:''},active:false};

function _getOnboardingSetupProviders(){
  return (((ONBOARDING.status||{}).setup||{}).providers)||[];
}

function _getOnboardingSetupProvider(id){
  return _getOnboardingSetupProviders().find(p=>p.id===id)||null;
}

function _getOnboardingCurrentSetup(){
  return (((ONBOARDING.status||{}).setup||{}).current)||{};
}

function _onboardingStepMeta(key){
  return ({
    system:{title:t('onboarding_step_system_title'),desc:t('onboarding_step_system_desc')},
    setup:{title:t('onboarding_step_setup_title'),desc:t('onboarding_step_setup_desc')},
    workspace:{title:t('onboarding_step_workspace_title'),desc:t('onboarding_step_workspace_desc')},
    password:{title:t('onboarding_step_password_title'),desc:t('onboarding_step_password_desc')},
    finish:{title:t('onboarding_step_finish_title'),desc:t('onboarding_step_finish_desc')}
  })[key];
}

function _renderOnboardingSteps(){
  const wrap=$('onboardingSteps');
  if(!wrap)return;
  wrap.innerHTML='';
  ONBOARDING.steps.forEach((key,idx)=>{
    const meta=_onboardingStepMeta(key);
    const item=document.createElement('div');
    item.className='onboarding-step'+(idx===ONBOARDING.step?' active':idx<ONBOARDING.step?' done':'');
    item.innerHTML=`<div class="onboarding-step-index">${idx+1}</div><div><div class="onboarding-step-title">${meta.title}</div><div class="onboarding-step-desc">${meta.desc}</div></div>`;
    wrap.appendChild(item);
  });
}

function _setOnboardingNotice(msg,kind='info'){
  const el=$('onboardingNotice');
  if(!el)return;
  if(!msg){el.style.display='none';el.textContent='';el.className='onboarding-status';return;}
  el.style.display='block';
  el.className='onboarding-status '+kind;
  el.textContent=msg;
}

function _getOnboardingWorkspaceChoices(){
  const items=((ONBOARDING.status||{}).workspaces||{}).items||[];
  return items.length?items:[{name:'Home',path:ONBOARDING.form.workspace||''}];
}

function _getOnboardingProviderModelChoices(){
  const provider=_getOnboardingSetupProvider(ONBOARDING.form.provider);
  return provider?(provider.models||[]):[];
}

function _getOnboardingSelectedModel(){
  return ONBOARDING.form.model||'';
}

function _renderOnboardingModelField(){
  const choices=_getOnboardingProviderModelChoices();
  if(ONBOARDING.form.provider==='custom'){
    return `<label class="onboarding-field"><span>${t('onboarding_model_label')}</span><input id="onboardingModelInput" value="${esc(_getOnboardingSelectedModel())}" placeholder="${t('onboarding_custom_model_placeholder')}" oninput="ONBOARDING.form.model=this.value"></label><p class="onboarding-copy">${t('onboarding_custom_model_help')}</p>`;
  }
  const options=choices.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('');
  return `<label class="onboarding-field"><span>${t('onboarding_model_label')}</span><select id="onboardingModelSelect" onchange="ONBOARDING.form.model=this.value">${options}</select></label><p class="onboarding-copy">${t('onboarding_workspace_help')}</p>`;
}

function _providerStatusLabel(system){
  if(system.chat_ready) return t('onboarding_check_provider_ready');
  if(system.provider_configured) return t('onboarding_check_provider_partial');
  return t('onboarding_check_provider_pending');
}

function _renderOnboardingBody(){
  const body=$('onboardingBody');
  if(!body||!ONBOARDING.status)return;
  const key=ONBOARDING.steps[ONBOARDING.step];
  const system=ONBOARDING.status.system||{};
  const settings=ONBOARDING.status.settings||{};
  const setup=ONBOARDING.status.setup||{};
  const nextBtn=$('onboardingNextBtn');
  const backBtn=$('onboardingBackBtn');
  if(backBtn) backBtn.style.display=ONBOARDING.step>0?'':'none';
  if(nextBtn) nextBtn.textContent=key==='finish'?t('onboarding_open'):t('onboarding_continue');

  if(key==='system'){
    const hermesOk=system.hermes_found&&system.imports_ok;
    const setupOk=!!system.chat_ready;
    _setOnboardingNotice(system.provider_note|| (setupOk?t('onboarding_notice_system_ready'):t('onboarding_notice_system_unavailable')),setupOk?'success':(hermesOk?'info':'warn'));
    body.innerHTML=`
      <div class="onboarding-panel-grid">
        <div class="onboarding-check ${hermesOk?'ok':'warn'}"><strong>${t('onboarding_check_agent')}</strong><span>${hermesOk?t('onboarding_check_agent_ready'):t('onboarding_check_agent_missing')}</span></div>
        <div class="onboarding-check ${(setupOk?'ok':system.provider_configured?'warn':'muted')}"><strong>${t('onboarding_check_provider')}</strong><span>${_providerStatusLabel(system)}</span></div>
        <div class="onboarding-check ${(settings.password_enabled?'ok':'muted')}"><strong>${t('onboarding_check_password')}</strong><span>${settings.password_enabled?t('onboarding_check_password_enabled'):t('onboarding_check_password_disabled')}</span></div>
      </div>
      <div class="onboarding-copy">
        <p><strong>${t('onboarding_config_file')}</strong> ${esc(system.config_path||t('onboarding_unknown'))}</p>
        <p><strong>${t('onboarding_env_file')}</strong> ${esc(system.env_path||t('onboarding_unknown'))}</p>
        <p>${esc(system.provider_note||'')}</p>
        ${system.current_provider?`<p><strong>${t('onboarding_current_provider')}</strong> ${esc(system.current_provider)}${system.current_model?` — ${esc(system.current_model)}`:''}</p>`:''}
        ${system.current_base_url?`<p><strong>${t('onboarding_base_url_label')}</strong> ${esc(system.current_base_url)}</p>`:''}
        ${system.missing_modules&&system.missing_modules.length?`<p><strong>${t('onboarding_missing_imports')}</strong> ${esc(system.missing_modules.join(', '))}</p>`:''}
      </div>`;
    return;
  }

  if(key==='setup'){
    const providers=_getOnboardingSetupProviders();
    const options=providers.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}${p.quick?' — '+esc(t('onboarding_quick_setup_badge')):''}</option>`).join('');
    const provider=_getOnboardingSetupProvider(ONBOARDING.form.provider)||providers[0]||null;
    const showBaseUrl=provider&&provider.requires_base_url;
    const keyHelp=provider?`${t('onboarding_api_key_help_prefix')} ${esc(provider.env_var)}.`:'';

    // OAuth provider path: configured via CLI, no API key input needed.
    const currentIsOauth=!!(ONBOARDING.status.setup||{}).current_is_oauth;
    const currentProviderName=((ONBOARDING.status.setup||{}).current||{}).provider||'';
    if(currentIsOauth){
      const isReady=!!(ONBOARDING.status.system||{}).chat_ready;
      const providerLabel=esc(currentProviderName);
      if(isReady){
        _setOnboardingNotice(t('onboarding_notice_setup_already_ready'),'success');
        body.innerHTML=`
          <div class="onboarding-oauth-card onboarding-oauth-ready">
            <div class="onboarding-oauth-icon">✓</div>
            <div>
              <strong>${t('onboarding_oauth_provider_ready_title')}</strong>
              <p>${t('onboarding_oauth_provider_ready_body').replace('{provider}',providerLabel)}</p>
            </div>
          </div>
          <p class="onboarding-copy" style="margin-top:20px">${t('onboarding_oauth_switch_hint')}</p>
          <label class="onboarding-field">
            <span>${t('onboarding_provider_label')}</span>
            <select id="onboardingProviderSelect" onchange="syncOnboardingProvider(this.value)">${options}</select>
          </label>
          <label class="onboarding-field" id="onboardingApiKeyField">
            <span>${t('onboarding_api_key_label')}</span>
            <input id="onboardingApiKeyInput" type="password" value="${esc(ONBOARDING.form.apiKey||'')}" placeholder="${t('onboarding_api_key_placeholder')}" oninput="ONBOARDING.form.apiKey=this.value">
          </label>
          ${showBaseUrl?`<label class="onboarding-field"><span>${t('onboarding_base_url_label')}</span><input id="onboardingBaseUrlInput" value="${esc(ONBOARDING.form.baseUrl||'')}" placeholder="${t('onboarding_base_url_placeholder')}" oninput="ONBOARDING.form.baseUrl=this.value"></label>`:''}
          <p class="onboarding-copy">${keyHelp}</p>`;
      } else {
        _setOnboardingNotice(t('onboarding_notice_setup_required'),'warn');
        body.innerHTML=`
          <div class="onboarding-oauth-card onboarding-oauth-pending">
            <div class="onboarding-oauth-icon">⚠</div>
            <div>
              <strong>${t('onboarding_oauth_provider_not_ready_title')}</strong>
              <p>${t('onboarding_oauth_provider_not_ready_body').replace('{provider}',providerLabel)}</p>
            </div>
          </div>
          <p class="onboarding-copy" style="margin-top:20px">${t('onboarding_oauth_switch_hint')}</p>
          <label class="onboarding-field">
            <span>${t('onboarding_provider_label')}</span>
            <select id="onboardingProviderSelect" onchange="syncOnboardingProvider(this.value)">${options}</select>
          </label>
          <label class="onboarding-field" id="onboardingApiKeyField">
            <span>${t('onboarding_api_key_label')}</span>
            <input id="onboardingApiKeyInput" type="password" value="${esc(ONBOARDING.form.apiKey||'')}" placeholder="${t('onboarding_api_key_placeholder')}" oninput="ONBOARDING.form.apiKey=this.value">
          </label>
          ${showBaseUrl?`<label class="onboarding-field"><span>${t('onboarding_base_url_label')}</span><input id="onboardingBaseUrlInput" value="${esc(ONBOARDING.form.baseUrl||'')}" placeholder="${t('onboarding_base_url_placeholder')}" oninput="ONBOARDING.form.baseUrl=this.value"></label>`:''}
          <p class="onboarding-copy">${keyHelp}</p>`;
      }
      const providerSel=$('onboardingProviderSelect');
      if(providerSel) providerSel.value=ONBOARDING.form.provider;
      return;
    }

    _setOnboardingNotice(system.chat_ready?t('onboarding_notice_setup_already_ready'):t('onboarding_notice_setup_required'),system.chat_ready?'success':'info');
    body.innerHTML=`
      <label class="onboarding-field">
        <span>${t('onboarding_provider_label')}</span>
        <select id="onboardingProviderSelect" onchange="syncOnboardingProvider(this.value)">${options}</select>
      </label>
      <label class="onboarding-field">
        <span>${t('onboarding_api_key_label')}</span>
        <input id="onboardingApiKeyInput" type="password" value="${esc(ONBOARDING.form.apiKey||'')}" placeholder="${t('onboarding_api_key_placeholder')}" oninput="ONBOARDING.form.apiKey=this.value">
      </label>
      ${showBaseUrl?`<label class="onboarding-field"><span>${t('onboarding_base_url_label')}</span><input id="onboardingBaseUrlInput" value="${esc(ONBOARDING.form.baseUrl||'')}" placeholder="${t('onboarding_base_url_placeholder')}" oninput="ONBOARDING.form.baseUrl=this.value"></label>`:''}
      <p class="onboarding-copy">${keyHelp}</p>
      ${showBaseUrl?`<p class="onboarding-copy">${t('onboarding_base_url_help')}</p>`:''}
      <p class="onboarding-copy">${esc(setup.unsupported_note||'')||''}</p>`;
    const providerSel=$('onboardingProviderSelect');
    if(providerSel) providerSel.value=ONBOARDING.form.provider;
    return;
  }

  if(key==='workspace'){
    const workspaceOptions=_getOnboardingWorkspaceChoices().map(ws=>`<option value="${esc(ws.path)}">${esc(ws.name||ws.path)} — ${esc(ws.path)}</option>`).join('');
    _setOnboardingNotice(t('onboarding_notice_workspace'), 'info');
    body.innerHTML=`
      <label class="onboarding-field">
        <span>${t('onboarding_workspace_label')}</span>
        <select id="onboardingWorkspaceSelect" onchange="syncOnboardingWorkspaceSelect(this.value)">${workspaceOptions}</select>
      </label>
      <label class="onboarding-field">
        <span>${t('onboarding_workspace_or_path')}</span>
        <input id="onboardingWorkspaceInput" value="${esc(ONBOARDING.form.workspace||'')}" placeholder="${t('onboarding_workspace_placeholder')}" oninput="ONBOARDING.form.workspace=this.value">
      </label>
      ${_renderOnboardingModelField()}`;
    const wsSel=$('onboardingWorkspaceSelect');
    if(wsSel && ONBOARDING.form.workspace) wsSel.value=ONBOARDING.form.workspace;
    const modelSel=$('onboardingModelSelect');
    if(modelSel && ONBOARDING.form.model) modelSel.value=ONBOARDING.form.model;
    return;
  }

  if(key==='password'){
    _setOnboardingNotice(settings.password_enabled?t('onboarding_notice_password_enabled'):t('onboarding_notice_password_recommended'), settings.password_enabled?'success':'info');
    body.innerHTML=`
      <label class="onboarding-field">
        <span>${t('onboarding_password_label')}</span>
        <input id="onboardingPasswordInput" type="password" value="${esc(ONBOARDING.form.password||'')}" placeholder="${t('onboarding_password_placeholder')}" oninput="ONBOARDING.form.password=this.value">
      </label>
      <p class="onboarding-copy">${t('onboarding_password_help')}</p>`;
    return;
  }

  const provider=_getOnboardingSetupProvider(ONBOARDING.form.provider);
  _setOnboardingNotice(t('onboarding_notice_finish'), 'success');
  body.innerHTML=`
    <div class="onboarding-summary">
      <div><strong>${t('onboarding_provider_label')}</strong><span>${esc((provider&&provider.label)||ONBOARDING.form.provider||t('onboarding_not_set'))}</span></div>
      <div><strong>${t('onboarding_model_label')}</strong><span>${esc(_getOnboardingSelectedModel()||t('onboarding_not_set'))}</span></div>
      <div><strong>${t('onboarding_workspace_label')}</strong><span>${esc(ONBOARDING.form.workspace||t('onboarding_not_set'))}</span></div>
      <div><strong>${t('onboarding_check_password')}</strong><span>${ONBOARDING.form.password?t('onboarding_password_will_enable'):t('onboarding_password_skipped')}</span></div>
    </div>
    ${ONBOARDING.form.baseUrl?`<p class="onboarding-copy"><strong>${t('onboarding_base_url_label')}</strong> ${esc(ONBOARDING.form.baseUrl)}</p>`:''}
    <p class="onboarding-copy">${t('onboarding_finish_help')}</p>`;
}

function syncOnboardingWorkspaceSelect(value){
  ONBOARDING.form.workspace=value;
  const input=$('onboardingWorkspaceInput');
  if(input) input.value=value;
}

function syncOnboardingProvider(value){
  const provider=_getOnboardingSetupProvider(value);
  ONBOARDING.form.provider=value;
  if(provider){
    if(!ONBOARDING.form.model || !_getOnboardingProviderModelChoices().some(m=>m.id===ONBOARDING.form.model) || value==='custom'){
      ONBOARDING.form.model=provider.default_model||'';
    }
    if(provider.requires_base_url){
      ONBOARDING.form.baseUrl=ONBOARDING.form.baseUrl||provider.default_base_url||'';
    }else{
      ONBOARDING.form.baseUrl=provider.default_base_url||'';
    }
  }
  _renderOnboardingBody();
}

async function loadOnboardingWizard(){
  try{
    const status=await api('/api/onboarding/status');
    ONBOARDING.status=status;
    const current=((status.setup||{}).current)||{};
    ONBOARDING.form.provider=current.provider||'openrouter';
    ONBOARDING.form.workspace=(status.workspaces&&status.workspaces.last)||status.settings.default_workspace||'';
    ONBOARDING.form.model=status.settings.default_model||current.model||'openai/gpt-5.4-mini';
    ONBOARDING.form.password='';
    ONBOARDING.form.apiKey='';
    ONBOARDING.form.baseUrl=current.base_url||'';
    ONBOARDING.active=!status.completed;
    if(!ONBOARDING.active) return false;
    // JDUI theme: use digital employee wizard
    if(typeof _isJduiTheme==='function'&&_isJduiTheme()){
      return _loadJduiWizard();
    }
    $('onboardingOverlay').style.display='flex';
    _renderOnboardingSteps();
    _renderOnboardingBody();
    return true;
  }catch(e){
    console.warn('onboarding status failed',e);
    return false;
  }
}

function prevOnboardingStep(){
  if(ONBOARDING.step===0)return;
  ONBOARDING.step--;
  _renderOnboardingSteps();
  _renderOnboardingBody();
}

async function _saveOnboardingProviderSetup(){
  const provider=(ONBOARDING.form.provider||'').trim();
  const model=(ONBOARDING.form.model||'').trim();
  const apiKey=(ONBOARDING.form.apiKey||'').trim();
  const baseUrl=(ONBOARDING.form.baseUrl||'').trim();
  const current=_getOnboardingCurrentSetup();
  const isUnchanged=current.provider===provider&&((current.model||'')===model)&&((current.base_url||'')===baseUrl);
  if(isUnchanged && !apiKey && (ONBOARDING.status.system||{}).chat_ready) return;
  const body={provider,model};
  if(apiKey) body.api_key=apiKey;
  if(baseUrl) body.base_url=baseUrl;
  const status=await api('/api/onboarding/setup',{method:'POST',body:JSON.stringify(body)});
  ONBOARDING.status=status;
}

async function _saveOnboardingDefaults(){
  const workspace=(ONBOARDING.form.workspace||'').trim();
  const model=(ONBOARDING.form.model||'').trim();
  const password=(ONBOARDING.form.password||'').trim();
  if(!workspace) throw new Error(t('onboarding_error_choose_workspace'));
  if(!model) throw new Error(t('onboarding_error_choose_model'));
  const known=_getOnboardingWorkspaceChoices().some(ws=>ws.path===workspace);
  if(!known){
    await api('/api/workspaces/add',{method:'POST',body:JSON.stringify({path:workspace})});
  }
  const body={default_workspace:workspace,default_model:model};
  if(password) body._set_password=password;
  await api('/api/settings',{method:'POST',body:JSON.stringify(body)});
  localStorage.setItem('hermes-webui-model',model);
  if($('modelSelect')) _applyModelToDropdown(model,$('modelSelect'));
}

async function _finishOnboarding(){
  await _saveOnboardingProviderSetup();
  await _saveOnboardingDefaults();
  const done=await api('/api/onboarding/complete',{method:'POST',body:'{}'});
  ONBOARDING.status=done;
  ONBOARDING.active=false;
  $('onboardingOverlay').style.display='none';
  showToast(t('onboarding_complete'));
  await loadWorkspaceList();
  if(typeof renderSessionList==='function') await renderSessionList();
  if(!S.session && typeof newSession==='function'){
    await newSession(true);
    await renderSessionList();
  }
}

async function nextOnboardingStep(){
  try{
    if(ONBOARDING.steps[ONBOARDING.step]==='setup'){
      ONBOARDING.form.provider=(($('onboardingProviderSelect')||{}).value||ONBOARDING.form.provider||'').trim();
      ONBOARDING.form.apiKey=(($('onboardingApiKeyInput')||{}).value||'').trim();
      ONBOARDING.form.baseUrl=(($('onboardingBaseUrlInput')||{}).value||ONBOARDING.form.baseUrl||'').trim();
      if(!ONBOARDING.form.provider) throw new Error(t('onboarding_error_provider_required'));
      if(ONBOARDING.form.provider==='custom' && !ONBOARDING.form.baseUrl) throw new Error(t('onboarding_error_base_url_required'));
    }
    if(ONBOARDING.steps[ONBOARDING.step]==='workspace'){
      ONBOARDING.form.workspace=(($('onboardingWorkspaceInput')||{}).value||ONBOARDING.form.workspace||'').trim();
      ONBOARDING.form.model=(($('onboardingModelInput')||{}).value||($('onboardingModelSelect')||{}).value||ONBOARDING.form.model||'').trim();
      if(!ONBOARDING.form.workspace) throw new Error(t('onboarding_error_workspace_required'));
      if(!ONBOARDING.form.model) throw new Error(t('onboarding_error_model_required'));
    }
    if(ONBOARDING.steps[ONBOARDING.step]==='password'){
      ONBOARDING.form.password=(($('onboardingPasswordInput')||{}).value||'').trim();
    }
    if(ONBOARDING.step===ONBOARDING.steps.length-1){
      await _finishOnboarding();
      return;
    }
    ONBOARDING.step++;
    _renderOnboardingSteps();
    _renderOnboardingBody();
  }catch(e){
    _setOnboardingNotice(e.message||String(e),'warn');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// JDUI Digital Employee Onboarding Wizard
// ═══════════════════════════════════════════════════════════════════════════

const JDUI_WIZ={step:'platform',employeeName:'1 号员工',avatarIndex:0,description:'',traits:['专业高效','善于沟通','持续学习'],capabilities:{search:true,memory:true,autoExec:false,knowledge:true},selectedProvider:'spacemit',apiProvider:'openai',apiModel:'gpt-4o',apiBaseUrl:'',apiKey:'',platform:'hermes',installPollTimer:null};

function _loadJduiWizard(){
  const overlay=$('onboardingOverlay');
  overlay.style.display='flex';
  overlay.style.background='#232323';
  overlay.innerHTML='';
  // Sync saved platform choice and install status from onboarding status
  const status=ONBOARDING.status||{};
  if(status.agent_platform) JDUI_WIZ.platform=status.agent_platform;
  const shell=document.createElement('div');
  shell.className='jdui-wizard';
  shell.id='jduiWizardShell';
  overlay.appendChild(shell);
  _renderJduiWizard();
  return true;
}

function _jduiStepNum(){
  const m={platform:1,env:1,install:2,model:2,employee:3,confirm:3,loading:3};
  return m[JDUI_WIZ.step]||1;
}

function _renderJduiWizard(){
  const shell=$('jduiWizardShell');
  if(!shell)return;
  const step=_jduiStepNum();
  shell.innerHTML=`
    <div class="jdui-wizard-sidebar" id="jduiWizSidebar">
      <div class="jdui-wizard-logo">
        <svg width="40" height="50" viewBox="0 0 27 34" fill="none"><path d="M10.8425 33.4418L1.01193 28.5266C0.707839 28.3746 0.452095 28.1409 0.273362 27.8517C0.0946292 27.5625 -2.85304e-05 27.2293 6.45042e-09 26.8893V17.4904C0.000109948 17.1784 0.0799397 16.8716 0.231914 16.5992C0.383888 16.3267 0.602964 16.0976 0.868355 15.9336C1.13374 15.7696 1.43664 15.6761 1.74831 15.662C2.05998 15.6479 2.37007 15.7137 2.64916 15.8532L12.4797 20.7685C12.7838 20.9204 13.0395 21.1541 13.2183 21.4433C13.397 21.7325 13.4917 22.0657 13.4916 22.4057V31.8046C13.4917 32.1167 13.412 32.4235 13.2601 32.6961C13.1082 32.9687 12.8891 33.1979 12.6236 33.362C12.3582 33.526 12.0552 33.6195 11.7434 33.6335C11.4317 33.6474 11.1215 33.5815 10.8425 33.4418Z" fill="#B0E237"/><path d="M17.5272 14.3061L25.1552 10.4907C25.4593 10.3387 25.7151 10.105 25.8938 9.81582C26.0725 9.52664 26.1672 9.1934 26.1672 8.85344V1.61917C26.1663 1.34303 26.095 1.07168 25.9601 0.830739C25.8252 0.589802 25.6311 0.387236 25.3961 0.242177C25.1611 0.0971179 24.8931 0.0143547 24.6172 0.00170538C24.3414 -0.0109439 24.0668 0.0469383 23.8196 0.169884L16.1887 3.98176C15.8846 4.13375 15.6289 4.36743 15.4501 4.65661C15.2714 4.94579 15.1767 5.27904 15.1768 5.61899V12.8533C15.1768 13.1301 15.2476 13.4023 15.3824 13.6441C15.5172 13.8859 15.7116 14.0892 15.9471 14.2348C16.1825 14.3803 16.4513 14.4633 16.7279 14.4758C17.0044 14.4883 17.2796 14.4299 17.5272 14.3061Z" fill="#C0E767"/><path d="M17.1656 23.5561L21.2962 21.4908C21.6003 21.3388 21.856 21.1051 22.0348 20.8159C22.2135 20.5267 22.3082 20.1935 22.3081 19.8535V16.0774C22.3081 15.8431 22.2482 15.6128 22.1342 15.4082C22.0201 15.2036 21.8556 15.0315 21.6564 14.9084C21.4571 14.7852 21.2297 14.715 20.9956 14.7045C20.7616 14.694 20.5288 14.7434 20.3193 14.8482L16.1887 16.9135C15.8846 17.0655 15.6289 17.2992 15.4501 17.5884C15.2714 17.8775 15.1767 18.2108 15.1768 18.5507V22.3247C15.1764 22.5592 15.236 22.7898 15.3499 22.9947C15.4638 23.1996 15.6283 23.3719 15.8276 23.4953C16.0269 23.6187 16.2545 23.6891 16.4887 23.6997C16.7229 23.7104 16.9559 23.6609 17.1656 23.5561Z" fill="#D0EE90"/></svg>
      </div>
      <div class="jdui-wizard-welcome">
        <h2>欢迎使用<br><span class="accent">Spacemit</span><br>数字员工</h2>
        <p class="subtitle">三步完成初始化，让你的数字员工开始工作</p>
        <div class="jdui-wizard-steps">
          <span class="${step===1?'active':'inactive'}">01&nbsp;&nbsp;环境检测</span>
          <span class="${step===2?'active':'inactive'}">02&nbsp;&nbsp;核心引擎</span>
          <span class="${step===3?'active':'inactive'}">03&nbsp;&nbsp;创建员工</span>
        </div>
      </div>
      <div class="jdui-wizard-footer"><span>V0.1.0 STABLE</span></div>
    </div>
    <div class="jdui-wizard-content">
      <div class="jdui-wizard-body" id="jduiWizBody"></div>
    </div>`;
  _renderJduiStepBody();
}

function _renderJduiStepBody(){
  const body=$('jduiWizBody');
  if(!body)return;
  const fn={platform:_renderJduiPlatformSelect,env:_renderJduiEnvCheck,install:_renderJduiInstall,model:_renderJduiModelSelect,employee:_renderJduiCreateEmployee,confirm:_renderJduiConfirm,loading:_renderJduiLoading};
  (fn[JDUI_WIZ.step]||fn.platform)(body);
}

function _jduiGoStep(step){
  JDUI_WIZ.step=step;
  _renderJduiWizard();
}

function _renderJduiEnvCheck(body){
  const checks=[
    {name:'设备硬件',desc:'检测处理器和内存配置',icon:'💻',color:'#206CFF',bg:'rgba(32,108,255,0.1)'},
    {name:'本地服务',desc:'检测必要的系统服务状态',icon:'⚙️',color:'#FF7024',bg:'rgba(255,112,36,0.1)'},
    {name:'网络连接',desc:'检测网络连通性和延迟',icon:'🌐',color:'#7434DC',bg:'rgba(116,52,220,0.1)'},
    {name:'存储空间',desc:'检测可用磁盘空间',icon:'💾',color:'#4EA100',bg:'rgba(78,161,0,0.1)'},
    {name:'系统权限',desc:'检测必要的系统权限',icon:'🔒',color:'#FF0000',bg:'rgba(255,0,0,0.1)'},
  ];
  body.innerHTML=`<div class="jdui-step"><div style="display:flex;align-items:center;justify-content:space-between"><h3>环境检测</h3><span class="jdui-badge" style="color:#fff;background:#206cff" id="jduiEnvBadge">检测中</span></div><p class="step-desc">正在检测您的系统环境，确保一切就绪</p><div class="jdui-env-list" id="jduiEnvList"></div><div class="jdui-step-actions"><button class="jdui-btn-primary" id="jduiEnvNext" disabled onclick="_jduiGoStep('model')">下一步</button></div></div>`;
  const list=$('jduiEnvList');
  checks.forEach((c,i)=>{
    const card=document.createElement('div');card.className='jdui-env-card';
    card.innerHTML=`<div class="jdui-env-icon" style="background:${c.bg}"><span style="font-size:20px">${c.icon}</span></div><div class="jdui-env-info"><strong>${c.name}</strong><span>${c.desc}</span></div><div class="jdui-env-status checking" id="jduiEnvStatus${i}"></div>`;
    list.appendChild(card);
  });
  let done=0;
  checks.forEach((c,i)=>{
    setTimeout(()=>{
      const el=$('jduiEnvStatus'+i);if(!el)return;
      const pass=i!==4;
      el.className='jdui-env-status '+(pass?'pass':'fail');
      el.innerHTML=pass?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      done++;
      if(done===checks.length){
        const badge=$('jduiEnvBadge');if(badge){badge.textContent='检测完成';badge.style.background='#4EA100';}
        const btn=$('jduiEnvNext');if(btn)btn.disabled=false;
      }
    },600+i*500);
  });
}

// ── P1: Platform selection step ───────────────────────────────────────────────

function _renderJduiPlatformSelect(body){
  const status=ONBOARDING.status||{};
  const installStatus=status.install_status||{};
  const hermesOk=!!installStatus.hermes;
  const oclawSdk=!!installStatus.openclaw_sdk;
  const oclawGw=!!installStatus.openclaw_gateway;
  const oclawOk=oclawSdk&&oclawGw;

  function badge(ok,label){
    return ok
      ?`<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#4EA100;background:rgba(78,161,0,0.1);padding:2px 8px;border-radius:20px">✓ ${label||'已检测到'}</span>`
      :`<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#888;background:rgba(0,0,0,0.05);padding:2px 8px;border-radius:20px">未检测到</span>`;
  }

  function card(id,title,desc,tags,ok,selected,extraBadges){
    const border=selected?'border:2px solid #b2e40d;':'border:2px solid rgba(0,0,0,0.08);';
    const tagHtml=tags.map(t=>`<span style="font-size:11px;color:#206cff;background:rgba(32,108,255,0.08);padding:2px 8px;border-radius:20px">${t}</span>`).join('');
    const badgeRow=(extraBadges||[badge(ok)]).join(' ');
    return `<div class="jdui-platform-card${selected?' selected':''}" style="cursor:pointer;border-radius:16px;padding:20px;${border}background:#fff;transition:all .2s" onclick="_jduiSelectPlatform('${id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <h4 style="margin:0;font-size:16px;font-weight:700">${title}</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${badgeRow}</div>
      </div>
      <p style="font-size:13px;color:rgba(60,60,67,0.7);margin:0 0 12px">${desc}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${tagHtml}</div>
    </div>`;
  }

  const oclawBadges=[
    badge(oclawSdk,'SDK'),
    badge(oclawGw,'Gateway'),
  ];

  body.innerHTML=`<div class="jdui-step">
    <h3>选择 Agent 平台</h3>
    <p class="step-desc">选择驱动数字员工的 Agent 引擎，两种平台均可在安装后切换</p>
    <div style="display:flex;flex-direction:column;gap:12px;margin:20px 0" id="jduiPlatformCards">
      ${card('hermes','Hermes Agent','本地 Python Agent，开箱即用，支持 50+ 工具和多平台消息集成',['本地运行','50+ 工具','多平台消息'],hermesOk,JDUI_WIZ.platform==='hermes')}
      ${card('openclaw','OpenClaw','Gateway 架构，支持 25+ 消息平台、插件系统和多 Agent 协调',['Gateway 架构','25+ 平台','插件系统'],oclawOk,JDUI_WIZ.platform==='openclaw',oclawBadges)}
    </div>
    <div class="jdui-step-actions">
      <button class="jdui-btn-primary" onclick="_jduiConfirmPlatform()">下一步</button>
    </div>
  </div>`;
}

function _jduiSelectPlatform(id){
  JDUI_WIZ.platform=id;
  _renderJduiPlatformSelect($('jduiWizBody'));
}

async function _jduiConfirmPlatform(){
  try{
    await api('/api/onboarding/platform',{method:'POST',body:JSON.stringify({platform:JDUI_WIZ.platform})});
    ONBOARDING.status=await api('/api/onboarding/status');
  }catch(e){console.warn('platform save failed',e);}
  _jduiGoStep('install');
}

// ── P1: Install detection step ────────────────────────────────────────────────

async function _renderJduiInstall(body){
  const platform=JDUI_WIZ.platform;
  let status={hermes:false,openclaw_sdk:false,openclaw_gateway:false};
  try{status=await api('/api/onboarding/install-status');}catch(e){}

  if(platform==='hermes'){
    _renderJduiHermesInstall(body,status);
  } else {
    _renderJduiOpenClawInstall(body,status);
  }
}

function _renderJduiHermesInstall(body,status){
  const ok=status.hermes;
  if(ok){
    body.innerHTML=`<div class="jdui-step">
      <h3>Hermes Agent</h3>
      <p class="step-desc">Agent 环境已就绪，可以继续配置</p>
      <div style="background:rgba(78,161,0,0.08);border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:12px;margin:20px 0">
        <span style="font-size:24px">✓</span>
        <div><strong style="color:#4EA100">Hermes Agent 已检测到</strong><p style="margin:4px 0 0;font-size:13px;color:rgba(60,60,67,0.7)">环境正常，可以继续</p></div>
      </div>
      <div class="jdui-step-actions">
        <button class="jdui-btn-secondary" onclick="_jduiGoStep('platform')">上一步</button>
        <button class="jdui-btn-primary" onclick="_jduiGoStep('model')">下一步</button>
      </div>
    </div>`;
    return;
  }
  body.innerHTML=`<div class="jdui-step">
    <h3>安装 Hermes Agent</h3>
    <p class="step-desc">未检测到 Hermes Agent，请按以下步骤安装</p>
    <div style="background:#f5f5f7;border-radius:12px;padding:16px 20px;margin:20px 0;font-family:monospace;font-size:13px">
      <div style="color:#888;margin-bottom:8px"># 方式一：pip 安装</div>
      <div>pip install hermes-agent</div>
      <div style="color:#888;margin:12px 0 8px"># 方式二：源码安装</div>
      <div>git clone &lt;repo&gt; &amp;&amp; pip install -e .</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
      <span id="jduiInstallStatusBadge" style="font-size:13px;color:#888">等待检测...</span>
      <button class="jdui-btn-secondary" style="padding:6px 16px;font-size:13px" onclick="_jduiCheckHermesInstall()">重新检测</button>
    </div>
    <div class="jdui-step-actions">
      <button class="jdui-btn-secondary" onclick="_jduiGoStep('platform')">上一步</button>
      <button class="jdui-btn-primary" id="jduiInstallNextBtn" disabled onclick="_jduiGoStep('model')">下一步</button>
    </div>
  </div>`;
  _jduiStartInstallPoll('hermes');
}

function _renderJduiOpenClawInstall(body,status){
  const sdkOk=status.openclaw_sdk;
  const gwOk=status.openclaw_gateway;
  const settings=(ONBOARDING.status||{}).settings||{};
  const savedUrl=((ONBOARDING.status||{}).openclaw_gateway_url)||'ws://127.0.0.1:18789';

  body.innerHTML=`<div class="jdui-step">
    <h3>安装 OpenClaw</h3>
    <p class="step-desc">需要完成 SDK 安装和 Gateway 连接两个步骤</p>

    <div style="margin:20px 0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:22px;height:22px;border-radius:50%;background:${sdkOk?'#4EA100':'#ddd'};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">${sdkOk?'✓':'1'}</span>
        <strong>安装 OpenClaw SDK</strong>
        ${sdkOk?'<span style="font-size:12px;color:#4EA100">已安装</span>':''}
      </div>
      ${!sdkOk?`<div style="background:#f5f5f7;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:13px;margin-left:32px">pip install openclaw-sdk</div>
      <div style="margin-left:32px;margin-top:8px;display:flex;align-items:center;gap:8px">
        <span id="jduiSdkBadge" style="font-size:12px;color:#888">等待检测...</span>
        <button class="jdui-btn-secondary" style="padding:4px 12px;font-size:12px" onclick="_jduiCheckOpenClawInstall()">重新检测</button>
      </div>`:''}
    </div>

    <div style="margin:20px 0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:22px;height:22px;border-radius:50%;background:${gwOk?'#4EA100':'#ddd'};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">${gwOk?'✓':'2'}</span>
        <strong>配置 Gateway 连接</strong>
        ${gwOk?'<span style="font-size:12px;color:#4EA100">已连接</span>':''}
      </div>
      <div style="margin-left:32px">
        <div class="jdui-form-group" style="margin-bottom:10px">
          <label style="font-size:13px;color:rgba(60,60,67,0.7)">Gateway URL</label>
          <input class="jdui-input" id="jduiGwUrl" value="${esc(savedUrl)}" placeholder="ws://127.0.0.1:18789">
        </div>
        <div class="jdui-form-group" style="margin-bottom:10px">
          <label style="font-size:13px;color:rgba(60,60,67,0.7)">API Key（可选）</label>
          <input class="jdui-input" id="jduiGwApiKey" type="password" placeholder="留空表示无需认证">
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="jdui-btn-secondary" style="padding:6px 16px;font-size:13px" onclick="_jduiTestGateway()">测试连接</button>
          <span id="jduiGwTestResult" style="font-size:13px"></span>
        </div>
      </div>
    </div>

    <div class="jdui-step-actions">
      <button class="jdui-btn-secondary" onclick="_jduiGoStep('platform')">上一步</button>
      <button class="jdui-btn-primary" id="jduiInstallNextBtn" ${sdkOk&&gwOk?'':'disabled'} onclick="_jduiGoStep('model')">下一步</button>
    </div>
  </div>`;

  if(!sdkOk) _jduiStartInstallPoll('openclaw');
}

async function _jduiCheckHermesInstall(){
  const badge=$('jduiInstallStatusBadge');
  if(badge) badge.textContent='检测中...';
  try{
    const s=await api('/api/onboarding/install-status');
    if(s.hermes){
      if(badge){badge.textContent='✓ 已检测到';badge.style.color='#4EA100';}
      const btn=$('jduiInstallNextBtn');if(btn)btn.disabled=false;
      _jduiStopInstallPoll();
    } else {
      if(badge){badge.textContent='未检测到，请安装后重试';badge.style.color='#888';}
    }
  }catch(e){if(badge)badge.textContent='检测失败';}
}

async function _jduiCheckOpenClawInstall(){
  const badge=$('jduiSdkBadge');
  if(badge) badge.textContent='检测中...';
  try{
    const s=await api('/api/onboarding/install-status');
    if(s.openclaw_sdk){
      if(badge){badge.textContent='✓ 已安装';badge.style.color='#4EA100';}
      _jduiStopInstallPoll();
      // Re-render to update step indicators
      _renderJduiInstall($('jduiWizBody'));
    } else {
      if(badge){badge.textContent='未检测到，请安装后重试';badge.style.color='#888';}
    }
  }catch(e){if(badge)badge.textContent='检测失败';}
}

async function _jduiTestGateway(){
  const url=($('jduiGwUrl')||{}).value||'';
  const key=($('jduiGwApiKey')||{}).value||'';
  const result=$('jduiGwTestResult');
  if(result) result.textContent='连接中...';
  try{
    const r=await api('/api/onboarding/test-gateway',{method:'POST',body:JSON.stringify({url,api_key:key})});
    if(r.ok){
      if(result){result.textContent='✓ 连接成功';result.style.color='#4EA100';}
      ONBOARDING.status=await api('/api/onboarding/status');
      const btn=$('jduiInstallNextBtn');if(btn)btn.disabled=false;
    } else {
      if(result){result.textContent='✗ '+(r.error||'连接失败');result.style.color='#e53935';}
    }
  }catch(e){
    if(result){result.textContent='✗ 请求失败';result.style.color='#e53935';}
  }
}

function _jduiStartInstallPoll(type){
  _jduiStopInstallPoll();
  JDUI_WIZ.installPollTimer=setInterval(async()=>{
    try{
      const s=await api('/api/onboarding/install-status');
      const done=type==='hermes'?s.hermes:(s.openclaw_sdk&&s.openclaw_gateway);
      if(done){
        _jduiStopInstallPoll();
        _renderJduiInstall($('jduiWizBody'));
      }
    }catch(e){}
  },3000);
}

function _jduiStopInstallPoll(){
  if(JDUI_WIZ.installPollTimer){clearInterval(JDUI_WIZ.installPollTimer);JDUI_WIZ.installPollTimer=null;}
}

// ── P2: LLM step — platform-aware ────────────────────────────────────────────

function _renderJduiModelSelect(body){
  const platform=JDUI_WIZ.platform;
  // Provider options for custom API key path
  const cnProviders=[
    {id:'minimax-cn',label:'MiniMax（国内）',hint:'MINIMAX_API_KEY',url:'https://platform.minimax.chat/'},
    {id:'kimi-cn',label:'Kimi（国内）',hint:'MOONSHOT_API_KEY',url:'https://platform.moonshot.cn/'},
  ];
  const intlProviders=[
    {id:'openrouter',label:'OpenRouter',hint:'OPENROUTER_API_KEY',url:'https://openrouter.ai/keys'},
    {id:'anthropic',label:'Anthropic',hint:'ANTHROPIC_API_KEY',url:'https://console.anthropic.com/'},
    {id:'openai',label:'OpenAI',hint:'OPENAI_API_KEY',url:'https://platform.openai.com/api-keys'},
    {id:'custom',label:'自定义 OpenAI 兼容',hint:'OPENAI_API_KEY',url:''},
  ];
  const allProviders=[...cnProviders,...intlProviders];

  body.innerHTML=`<div class="jdui-step">
    <h3>选择核心引擎</h3>
    <p class="step-desc">选择驱动数字员工的 AI 模型服务</p>
    <div class="jdui-model-cards">
      <div class="jdui-model-card${JDUI_WIZ.selectedProvider==='spacemit'?' selected':''}" onclick="JDUI_WIZ.selectedProvider='spacemit';_renderJduiModelSelect($('jduiWizBody'))">
        <div class="jdui-model-badge" style="background:rgba(178,228,13,0.15);color:#558b2f">推荐方案</div>
        <h4>Spacemit Engine</h4>
        <p>预配置的高性能引擎，支持 GPT-5 和 Claude 4 双推理模型，开箱即用。</p>
      </div>
      <div class="jdui-model-card${JDUI_WIZ.selectedProvider==='custom'?' selected':''}" onclick="JDUI_WIZ.selectedProvider='custom';_renderJduiModelSelect($('jduiWizBody'))">
        <div class="jdui-model-badge" style="background:rgba(0,0,0,0.05);color:rgba(60,60,67,0.6)">高级路径</div>
        <h4>自定义 API Key</h4>
        <p>使用您自己的 API Key，支持 MiniMax、Kimi、OpenAI、Anthropic 等。</p>
      </div>
    </div>
    ${JDUI_WIZ.selectedProvider==='custom'?`
    <div style="margin-top:20px">
      <div class="jdui-form-group">
        <label>服务商</label>
        <select class="jdui-input" id="jduiLlmProvider" onchange="_jduiOnProviderChange(this.value)">
          ${allProviders.map(p=>`<option value="${p.id}"${JDUI_WIZ.apiProvider===p.id?' selected':''}>${p.label}</option>`).join('')}
        </select>
      </div>
      <div id="jduiLlmModelField"></div>
      <div id="jduiLlmBaseUrlField"></div>
      <div class="jdui-form-group">
        <label id="jduiLlmKeyLabel">API Key</label>
        <input class="jdui-input" id="jduiApiKeyInput" type="password" value="${esc(JDUI_WIZ.apiKey)}" placeholder="sk-...">
        <p id="jduiLlmKeyHint" style="font-size:12px;color:rgba(60,60,67,0.5);margin:4px 0 0"></p>
      </div>
    </div>`:''}
    <div class="jdui-step-actions">
      <button class="jdui-btn-secondary" onclick="_jduiGoStep('install')">上一步</button>
      <button class="jdui-btn-primary" onclick="_jduiSaveApiKey()">下一步</button>
    </div>
  </div>`;
  if(JDUI_WIZ.selectedProvider==='custom') _jduiOnProviderChange(JDUI_WIZ.apiProvider||'openrouter');
}

function _jduiOnProviderChange(providerId){
  JDUI_WIZ.apiProvider=providerId;
  const sel=$('jduiLlmProvider');if(sel)sel.value=providerId;

  // Fetch provider meta from onboarding status
  const providers=_getOnboardingSetupProviders();
  const meta=providers.find(p=>p.id===providerId)||null;

  // Model field
  const modelField=$('jduiLlmModelField');
  if(modelField){
    const models=(meta&&meta.models)||[];
    if(providerId==='custom'||!models.length){
      modelField.innerHTML=`<div class="jdui-form-group"><label>模型名称</label><input class="jdui-input" id="jduiApiModel" value="${esc(JDUI_WIZ.apiModel||'gpt-4o-mini')}" placeholder="gpt-4o-mini"></div>`;
    } else {
      const opts=models.map(m=>`<option value="${esc(m.id)}"${JDUI_WIZ.apiModel===m.id?' selected':''}>${esc(m.label)}</option>`).join('');
      modelField.innerHTML=`<div class="jdui-form-group"><label>模型</label><select class="jdui-input" id="jduiApiModel">${opts}</select></div>`;
    }
  }

  // Base URL field — only show for custom
  const baseUrlField=$('jduiLlmBaseUrlField');
  if(baseUrlField){
    if(providerId==='custom'){
      baseUrlField.innerHTML=`<div class="jdui-form-group"><label>Base URL</label><input class="jdui-input" id="jduiApiBaseUrl" value="${esc(JDUI_WIZ.apiBaseUrl||'')}" placeholder="https://api.openai.com/v1"></div>`;
    } else {
      const defaultUrl=(meta&&meta.default_base_url)||'';
      baseUrlField.innerHTML=defaultUrl?`<p style="font-size:12px;color:rgba(60,60,67,0.5);margin:0 0 12px">Base URL: ${esc(defaultUrl)}</p>`:'';
    }
  }

  // Key hint
  const hint=$('jduiLlmKeyHint');
  if(hint&&meta) hint.textContent=`环境变量：${meta.env_var}`;

  const keyLabel=$('jduiLlmKeyLabel');
  if(keyLabel&&meta) keyLabel.textContent=`${meta.label} API Key`;
}

async function _jduiSaveApiKey(){
  if(JDUI_WIZ.selectedProvider==='spacemit'){
    // Spacemit: no key needed, skip LLM config
    _jduiGoStep('employee');
    return;
  }
  const providerId=JDUI_WIZ.apiProvider||'openrouter';
  const modelEl=$('jduiApiModel');
  const model=(modelEl?modelEl.value:'')||JDUI_WIZ.apiModel||'gpt-4o';
  const baseUrlEl=$('jduiApiBaseUrl');
  const baseUrl=baseUrlEl?baseUrlEl.value:'';
  const apiKey=($('jduiApiKeyInput')||{}).value||'';

  JDUI_WIZ.apiProvider=providerId;
  JDUI_WIZ.apiModel=model;
  JDUI_WIZ.apiBaseUrl=baseUrl;
  JDUI_WIZ.apiKey=apiKey;

  // Map to ONBOARDING.form for _saveOnboardingProviderSetup()
  ONBOARDING.form.provider=providerId;
  ONBOARDING.form.model=model;
  ONBOARDING.form.baseUrl=baseUrl;
  ONBOARDING.form.apiKey=apiKey;

  // P2: If OpenClaw platform, write config via Gateway
  if(JDUI_WIZ.platform==='openclaw'){
    try{
      await api('/api/onboarding/openclaw-llm',{method:'POST',body:JSON.stringify({
        provider:providerId,model,api_key:apiKey,base_url:baseUrl
      })});
    }catch(e){console.warn('openclaw llm config failed',e);}
  }

  _jduiGoStep('employee');
}

function _renderJduiCreateEmployee(body){
  const avatars=typeof EMPLOYEE!=='undefined'?EMPLOYEE.avatars:[];
  const personalities=typeof EMPLOYEE!=='undefined'?EMPLOYEE.personalities:[];
  body.innerHTML=`<div class="jdui-step"><h3>创建数字员工</h3><p class="step-desc">自定义您的数字员工形象和职责</p><div class="jdui-avatar-carousel" id="jduiAvatarCarousel"></div><div class="jdui-form-group"><label>员工名称</label><input class="jdui-input" id="jduiEmpName" value="${JDUI_WIZ.employeeName}" oninput="JDUI_WIZ.employeeName=this.value"></div><div class="jdui-form-group"><label>职责描述</label><textarea class="jdui-input" id="jduiEmpDesc" rows="3" placeholder="描述这位数字员工的工作职责和沟通风格..." oninput="JDUI_WIZ.description=this.value" style="resize:vertical">${JDUI_WIZ.description}</textarea></div><label style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:'Inter','Noto Sans SC',sans-serif;margin-top:8px;display:block">性格预设</label><div class="jdui-personality-grid" id="jduiPersonalityGrid"></div><div class="jdui-step-actions"><button class="jdui-btn-secondary" onclick="_jduiGoStep('model')">上一步</button><button class="jdui-btn-primary" onclick="_jduiGoStep('confirm')">下一步</button></div></div>`;
  const carousel=$('jduiAvatarCarousel');
  avatars.forEach((src,i)=>{const img=document.createElement('img');img.className='jdui-avatar-option'+(i===JDUI_WIZ.avatarIndex?' selected':(Math.abs(i-JDUI_WIZ.avatarIndex)===1?' near':''));img.src=src;img.alt='Avatar '+(i+1);img.onclick=()=>{JDUI_WIZ.avatarIndex=i;_renderJduiCreateEmployee(body);};carousel.appendChild(img);});
  const grid=$('jduiPersonalityGrid');
  personalities.slice(0,6).forEach(p=>{const card=document.createElement('div');card.className='jdui-personality-card';card.innerHTML=`<h5>${p.name}</h5><p>${p.desc.slice(0,50)}...</p>`;card.onclick=()=>{JDUI_WIZ.description=p.desc;$('jduiEmpDesc').value=p.desc;};grid.appendChild(card);});
}

function _renderJduiConfirm(body){
  const avSrc=typeof _getEmployeeAvatar==='function'?_getEmployeeAvatar(JDUI_WIZ.avatarIndex):'/static/avatars/avatar0.png';
  body.innerHTML=`<div class="jdui-step"><h3>确认信息</h3><p class="step-desc">检查并确认您的数字员工配置</p><div class="jdui-confirm-card"><img class="jdui-confirm-avatar" src="${avSrc}" alt=""><div class="jdui-confirm-info"><div class="jdui-confirm-name">${typeof esc==='function'?esc(JDUI_WIZ.employeeName):JDUI_WIZ.employeeName}</div><div class="jdui-confirm-status"><div class="dot"></div><span>在线 — 准备就绪</span></div></div></div><label style="font-size:14px;font-weight:600;color:#000;margin-top:24px;display:block;font-family:'Inter','Noto Sans SC',sans-serif">人设特质</label><div class="jdui-traits" id="jduiTraits"></div><div class="jdui-trait-add"><input class="jdui-input" id="jduiNewTrait" placeholder="添加新特质..." onkeydown="if(event.key==='Enter')_jduiAddTrait()"><button class="jdui-btn-primary" style="padding:8px 16px" onclick="_jduiAddTrait()">+</button></div><label style="font-size:14px;font-weight:600;color:#000;margin-top:24px;display:block;font-family:'Inter','Noto Sans SC',sans-serif">常用功能</label><div class="jdui-capabilities" id="jduiCapabilities"></div><div class="jdui-step-actions"><button class="jdui-btn-secondary" onclick="_jduiGoStep('employee')">上一步</button><button class="jdui-btn-primary" onclick="_jduiGoStep('loading')">启动数字员工</button></div></div>`;
  _renderJduiTraits();
  _renderJduiCapabilities();
}

function _renderJduiTraits(){
  const container=$('jduiTraits');if(!container)return;container.innerHTML='';
  JDUI_WIZ.traits.forEach((t,i)=>{const el=document.createElement('div');el.className='jdui-trait';el.innerHTML=`<div class="dot"></div><span>${typeof esc==='function'?esc(t):t}</span><button onclick="JDUI_WIZ.traits.splice(${i},1);_renderJduiTraits()">×</button>`;container.appendChild(el);});
}

function _jduiAddTrait(){
  const input=$('jduiNewTrait');if(!input||!input.value.trim())return;
  JDUI_WIZ.traits.push(input.value.trim());input.value='';_renderJduiTraits();
}

function _renderJduiCapabilities(){
  const container=$('jduiCapabilities');if(!container)return;container.innerHTML='';
  const caps=typeof EMPLOYEE!=='undefined'?EMPLOYEE.defaultCapabilities:[];
  caps.forEach(c=>{const enabled=JDUI_WIZ.capabilities[c.id]!==false;const el=document.createElement('div');el.className='jdui-capability';el.innerHTML=`<div class="jdui-capability-info"><div class="jdui-capability-icon" style="background:${c.color}20"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg></div><span class="jdui-capability-name">${c.name}</span></div><label class="jdui-toggle"><input type="checkbox" ${enabled?'checked':''} onchange="JDUI_WIZ.capabilities['${c.id}']=this.checked"><span class="jdui-toggle-slider"></span></label>`;container.appendChild(el);});
}

function _renderJduiLoading(body){
  const avSrc=typeof _getEmployeeAvatar==='function'?_getEmployeeAvatar(JDUI_WIZ.avatarIndex):'/static/avatars/avatar0.png';
  body.innerHTML=`<div class="jdui-loading"><div class="jdui-loading-ring"><svg width="140" height="140" viewBox="0 0 140 140" fill="none"><defs><linearGradient id="jduiRingGrad" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#b2e40d"/><stop offset="100%" stop-color="#d0ee90" stop-opacity="0.2"/></linearGradient></defs><circle cx="70" cy="70" r="64" stroke="url(#jduiRingGrad)" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="280 120"/></svg><img src="${avSrc}" alt=""></div><h3>正在为你准备数字员工</h3><p>请稍作等待，系统正在进行最终的配置与联调...</p></div>`;
  setTimeout(async()=>{
    try{
      if(typeof _saveEmployee==='function') await _saveEmployee({name:JDUI_WIZ.employeeName,avatar_index:JDUI_WIZ.avatarIndex,description:JDUI_WIZ.description,traits:JDUI_WIZ.traits,capabilities:JDUI_WIZ.capabilities});
      await _finishOnboarding();
    }catch(e){console.warn('JDUI finish error',e);$('onboardingOverlay').style.display='none';ONBOARDING.active=false;}
    if(typeof _applyJduiLayout==='function')_applyJduiLayout();
  },3200);
}
