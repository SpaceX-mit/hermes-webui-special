// ── File Manager Modal ────────────────────────────────────────────────────
let _fmCurrentDir = '.';
let _fmDirCache = {};
let _fmExpandedDirs = new Set();
let _fmCurrentFile = '';
let _fmCurrentMode = '';
let _fmDirty = false;
let _fmRawContent = '';

const FM_IMAGE_EXTS = new Set(['.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.bmp']);
const FM_MD_EXTS    = new Set(['.md','.markdown','.mdown']);
const FM_PDF_EXTS   = new Set(['.pdf']);
const FM_HTML_EXTS  = new Set(['.html','.htm']);
const FM_EXCEL_EXTS = new Set(['.xlsx','.xls','.csv']);
const FM_PPT_EXTS   = new Set(['.pptx','.ppt']);
const FM_DOCX_EXTS  = new Set(['.docx','.doc']);
const FM_BINARY_EXTS = new Set([
  '.odt','.ods','.odp',
  '.zip','.tar','.gz','.bz2','.7z','.rar',
  '.mp3','.mp4','.wav','.m4a','.ogg','.flac','.mov','.avi','.mkv','.webm',
  '.exe','.dmg','.pkg','.deb','.rpm',
  '.woff','.woff2','.ttf','.otf','.eot',
  '.bin','.dat','.db','.sqlite','.pyc','.class','.so','.dylib','.dll',
]);

function _fmExt(p){ const i=p.lastIndexOf('.'); return i>=0?p.slice(i).toLowerCase():''; }
function _fmFmtSize(b){
  if(b==null)return '';
  if(b<1024)return b+'B';
  if(b<1048576)return (b/1024).toFixed(1)+'K';
  return (b/1048576).toFixed(1)+'M';
}

// ── Open / Close ──────────────────────────────────────────────────────────
function openFM(){
  if(!S.session)return;
  const modal=document.getElementById('fmModal');
  if(!modal)return;
  modal.style.display='block';
  document.getElementById('fmWorkspacePath').textContent=S.session.workspace||'';
  _fmCurrentDir='.';_fmDirCache={};_fmExpandedDirs=new Set();_fmCurrentFile='';
  _fmClearPreview();
  _fmLoadDir('.');
  _fmRefreshGitBadge();
  _fmInitShell();
  _fmInitResize();
}

function closeFM(){
  const modal=document.getElementById('fmModal');
  if(modal)modal.style.display='none';
  document.removeEventListener('keydown',_fmEscHandler);
  const iframe=document.getElementById('fmIframe');
  if(iframe)iframe.src='about:blank';
}

function _fmEscHandler(e){if(e.key==='Escape')closeFM();}

// ── Directory loading ─────────────────────────────────────────────────────
async function _fmLoadDir(path){
  if(!S.session)return;
  try{
    if(!path||path==='.'){_fmDirCache={};_fmExpandedDirs=new Set();}
    _fmCurrentDir=path||'.';
    const data=await api(`/api/list?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
    _fmDirCache[path||'.']=data.entries||[];
    _fmRenderBreadcrumb(path);
    _fmRenderTree();
  }catch(e){console.warn('fmLoadDir',e);}
}

function fmRefresh(){_fmDirCache={};_fmLoadDir(_fmCurrentDir);}

// ── Breadcrumb ────────────────────────────────────────────────────────────
function _fmRenderBreadcrumb(path){
  const bar=document.getElementById('fmBreadcrumb');
  if(!bar)return;
  bar.innerHTML='';
  const root=document.createElement('span');
  root.className='breadcrumb-seg breadcrumb-link';root.textContent='~';
  root.onclick=()=>_fmLoadDir('.');
  bar.appendChild(root);
  if(!path||path==='.')return;
  const parts=path.split('/');let acc='';
  for(let i=0;i<parts.length;i++){
    const sep=document.createElement('span');sep.className='breadcrumb-sep';sep.textContent='/';bar.appendChild(sep);
    acc+=(acc?'/':'')+parts[i];
    const seg=document.createElement('span');seg.textContent=parts[i];
    if(i<parts.length-1){
      seg.className='breadcrumb-seg breadcrumb-link';
      const t=acc;seg.onclick=()=>_fmLoadDir(t);
    }else{seg.className='breadcrumb-seg breadcrumb-current';}
    bar.appendChild(seg);
  }
}

// ── File tree ─────────────────────────────────────────────────────────────
function _fmRenderTree(){
  const box=document.getElementById('fmTree');if(!box)return;
  box.innerHTML='';
  _fmRenderItems(box,_fmDirCache[_fmCurrentDir]||[],0);
}

function _fmRenderItems(container,entries,depth){
  for(const item of entries){
    const el=document.createElement('div');
    el.className='file-item';
    el.style.paddingLeft=(8+depth*16)+'px';
    if(item.type==='dir'){
      const arrow=document.createElement('span');arrow.className='file-tree-toggle';
      arrow.textContent=_fmExpandedDirs.has(item.path)?'\u25BE':'\u25B8';
      el.appendChild(arrow);
    }
    const iconEl=document.createElement('span');iconEl.className='file-icon';
    iconEl.innerHTML=typeof fileIcon==='function'?fileIcon(item.name,item.type):'';
    el.appendChild(iconEl);
    const nameEl=document.createElement('span');nameEl.className='file-name';nameEl.textContent=item.name;el.appendChild(nameEl);
    if(item.type==='file'&&item.size!=null){
      const sz=document.createElement('span');sz.className='file-size';sz.textContent=_fmFmtSize(item.size);el.appendChild(sz);
    }
    if(item.type==='dir'){
      el.onclick=async()=>{
        if(_fmExpandedDirs.has(item.path)){_fmExpandedDirs.delete(item.path);}
        else{
          _fmExpandedDirs.add(item.path);
          if(!_fmDirCache[item.path]){
            try{const d=await api(`/api/list?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(item.path)}`);_fmDirCache[item.path]=d.entries||[];}
            catch(e2){_fmDirCache[item.path]=[];}
          }
        }
        _fmRenderTree();
      };
    }else{
      el.onclick=()=>_fmOpenFile(item.path);
      if(item.path===_fmCurrentFile)el.classList.add('active');
    }
    container.appendChild(el);
    if(item.type==='dir'&&_fmExpandedDirs.has(item.path))
      _fmRenderItems(container,_fmDirCache[item.path]||[],depth+1);
  }
}

// ── Preview modes ─────────────────────────────────────────────────────────
function _fmShowMode(mode){
  document.getElementById('fmCode').style.display       =mode==='code'  ?'':'none';
  document.getElementById('fmMd').style.display         =mode==='md'    ?'':'none';
  document.getElementById('fmImgWrap').style.display    =mode==='image' ?'':'none';
  document.getElementById('fmIframe').style.display     =(mode==='pdf'||mode==='html')?'':'none';
  document.getElementById('fmOfficeFrame').style.display=mode==='office'?'':'none';
  document.getElementById('fmExcel').style.display      =mode==='excel' ?'':'none';
  document.getElementById('fmEditArea').style.display='none';
  document.getElementById('fmEmpty').style.display   =mode?'none':'';
  const badge=document.getElementById('fmPreviewBadge');
  if(badge){badge.className='preview-badge '+(mode==='image'?'image':mode==='md'?'md':'code');badge.textContent=mode||'';}
  _fmCurrentMode=mode;_fmDirty=false;_fmUpdateEditBtn();
}

function _fmClearPreview(){
  _fmCurrentFile='';_fmCurrentMode='';_fmDirty=false;_fmRawContent='';
  const toolbar=document.getElementById('fmPreviewToolbar');if(toolbar)toolbar.style.display='none';
  ['fmCode','fmMd','fmImgWrap','fmIframe','fmOfficeFrame','fmExcel','fmEditArea'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  const empty=document.getElementById('fmEmpty');if(empty)empty.style.display='';
  const iframe=document.getElementById('fmIframe');if(iframe)iframe.src='about:blank';
}

async function _fmOpenFile(path){
  if(!S.session)return;
  _fmCurrentFile=path;
  const ext=_fmExt(path);
  const toolbar=document.getElementById('fmPreviewToolbar');
  if(toolbar)toolbar.style.display='flex';
  document.getElementById('fmPreviewPath').textContent=path;
  _fmRenderTree();

  if(FM_BINARY_EXTS.has(ext)){
    // Binary: show download prompt
    _fmShowMode('');
    if(toolbar)toolbar.style.display='flex';
    document.getElementById('fmPreviewPath').textContent=path;
    const empty=document.getElementById('fmEmpty');
    if(empty){empty.style.display='flex';empty.innerHTML='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>二进制文件，点击下载</span>';}
    return;
  }

  // PPT: python-pptx server-side render
  if(FM_PPT_EXTS.has(ext)){
    _fmShowMode('office');
    const frame=document.getElementById('fmOfficeFrame');
    frame.srcdoc='<body style="background:#1a1a2e;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">加载中...</body>';
    try{
      const resp=await fetch(`/api/file/pptx_html?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
      const data=await resp.json();
      if(data.error){frame.srcdoc=`<body style="color:red;padding:20px">${data.error}</body>`;}
      else{frame.srcdoc=data.html;}
    }catch(e){frame.srcdoc=`<body style="color:red;padding:20px">加载失败: ${e.message}</body>`;}
    return;
  }

  // DOCX: mammoth server-side render
  if(FM_DOCX_EXTS.has(ext)){
    _fmShowMode('office');
    const frame=document.getElementById('fmOfficeFrame');
    frame.srcdoc='<body style="background:#fff;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">加载中...</body>';
    try{
      const resp=await fetch(`/api/file/docx_html?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
      const data=await resp.json();
      if(data.error){frame.srcdoc=`<body style="color:red;padding:20px">${data.error}</body>`;}
      else{frame.srcdoc=data.html;}
    }catch(e){frame.srcdoc=`<body style="color:red;padding:20px">加载失败: ${e.message}</body>`;}
    return;
  }

  // Excel / CSV: SheetJS render
  if(FM_EXCEL_EXTS.has(ext)){
    try{
      const resp=await fetch(`/api/file/raw?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
      const buf=await resp.arrayBuffer();
      _fmShowMode('excel');
      const container=document.getElementById('fmExcel');
      container.innerHTML='';
      if(typeof XLSX==='undefined'){container.textContent='SheetJS 未加载，请刷新页面重试';return;}
      const wb=XLSX.read(buf,{type:'array'});
      // Sheet tabs
      const tabs=document.createElement('div');tabs.className='fm-excel-tabs';
      const content=document.createElement('div');content.className='fm-excel-content';
      container.appendChild(tabs);container.appendChild(content);
      const renderSheet=name=>{
        const ws=wb.Sheets[name];
        const html=XLSX.utils.sheet_to_html(ws,{editable:false});
        content.innerHTML=html;
        // style the generated table
        const tbl=content.querySelector('table');
        if(tbl)tbl.className='fm-excel-table';
        tabs.querySelectorAll('.fm-excel-tab').forEach(t=>t.classList.toggle('active',t.dataset.sheet===name));
      };
      wb.SheetNames.forEach((name,i)=>{
        const tab=document.createElement('button');
        tab.className='fm-excel-tab'+(i===0?' active':'');
        tab.dataset.sheet=name;tab.textContent=name;
        tab.onclick=()=>renderSheet(name);
        tabs.appendChild(tab);
      });
      if(wb.SheetNames.length)renderSheet(wb.SheetNames[0]);
    }catch(e){console.warn('fmExcel',e);}
    return;
  }

  if(FM_PDF_EXTS.has(ext)){
    const url=`/api/file/raw?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`;
    _fmShowMode('pdf');
    const old=document.getElementById('fmIframe');
    const neo=document.createElement('iframe');
    neo.id='fmIframe';neo.className='fm-iframe';
    neo.title='文件预览';
    old.replaceWith(neo);
    neo.src=url;
    return;
  }

  if(FM_HTML_EXTS.has(ext)){
    try{
      const data=await api(`/api/file?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
      _fmShowMode('html');
      // Replace iframe entirely to avoid stale src/srcdoc state
      const old=document.getElementById('fmIframe');
      const neo=document.createElement('iframe');
      neo.id='fmIframe';neo.className='fm-iframe';
      neo.setAttribute('sandbox','allow-scripts allow-forms allow-popups allow-modals');
      neo.title='文件预览';
      old.replaceWith(neo);
      neo.srcdoc=data.content;
      _fmRawContent=data.content;
    }catch(e){console.warn('fmOpenHtml',e);}
    return;
  }

  if(FM_IMAGE_EXTS.has(ext)){
    const url=`/api/file/raw?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`;
    _fmShowMode('image');
    const img=document.getElementById('fmImg');
    img.src=url;img.alt=path;
    return;
  }

  if(FM_MD_EXTS.has(ext)){
    try{
      const data=await api(`/api/file?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
      _fmShowMode('md');
      _fmRawContent=data.content;
      const md=document.getElementById('fmMd');
      md.innerHTML=typeof renderMd==='function'?renderMd(data.content):data.content;
    }catch(e){console.warn('fmOpenMd',e);}
    return;
  }

  // Code / text
  try{
    const data=await api(`/api/file?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(path)}`);
    if(data.binary){_fmClearPreview();if(toolbar)toolbar.style.display='flex';document.getElementById('fmPreviewPath').textContent=path;return;}
    _fmShowMode('code');
    _fmRawContent=data.content;
    const codeEl=document.getElementById('fmCode');
    // Detect language from extension for Prism highlighting
    const lang=_fmPrismLang(ext);
    codeEl.innerHTML='<code class="language-'+(lang||'none')+'">'+_fmEscHtml(data.content)+'</code>';
    if(lang){
      const _highlight=()=>{if(window.Prism)Prism.highlightElement(codeEl.firstChild);};
      window.Prism?_highlight():window.addEventListener('load',_highlight,{once:true});
    }
  }catch(e){console.warn('fmOpenFile',e);}
}

// ── Edit mode ─────────────────────────────────────────────────────────────
function _fmEscHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _fmPrismLang(ext){
  const map={'.js':'javascript','.ts':'typescript','.jsx':'jsx','.tsx':'tsx',
    '.py':'python','.rb':'ruby','.go':'go','.rs':'rust','.java':'java',
    '.c':'c','.cpp':'cpp','.cs':'csharp','.php':'php','.swift':'swift',
    '.kt':'kotlin','.sh':'bash','.bash':'bash','.zsh':'bash',
    '.css':'css','.scss':'scss','.less':'less',
    '.html':'html','.htm':'html','.xml':'xml','.svg':'svg',
    '.json':'json','.yaml':'yaml','.yml':'yaml','.toml':'toml',
    '.sql':'sql','.md':'markdown','.dockerfile':'docker',
    '.tf':'hcl','.lua':'lua','.r':'r','.dart':'dart','.vue':'markup'};
  return map[ext]||null;
}

function _fmUpdateEditBtn(){
  const btn=document.getElementById('fmBtnEdit');
  if(!btn)return;
  const editable=_fmCurrentMode==='code'||_fmCurrentMode==='md'||_fmCurrentMode==='html';
  btn.style.display=editable?'inline-flex':'none';
  const editing=document.getElementById('fmEditArea').style.display!=='none';
  btn.innerHTML=editing?'&#128190; 保存':'&#9998; 编辑';
  btn.style.color=editing?'var(--blue)':'';
  if(_fmDirty)btn.innerHTML='&#128190; 保存*';
}

async function fmToggleEdit(){
  const editing=document.getElementById('fmEditArea').style.display!=='none';
  if(editing){
    if(!S.session||!_fmCurrentFile)return;
    const content=document.getElementById('fmEditArea').value;
    try{
      await api('/api/file/save',{method:'POST',body:JSON.stringify({session_id:S.session.session_id,path:_fmCurrentFile,content})});
      _fmDirty=false;_fmRawContent=content;
      // Update read-only view
      if(_fmCurrentMode==='code')document.getElementById('fmCode').textContent=content;
      else if(_fmCurrentMode==='md')document.getElementById('fmMd').innerHTML=typeof renderMd==='function'?renderMd(content):content;
      else if(_fmCurrentMode==='html'){
        const iframe=document.getElementById('fmIframe');
        const blob=new Blob([content],{type:'text/html'});
        const blobUrl=URL.createObjectURL(blob);
        if(iframe._blobUrl)URL.revokeObjectURL(iframe._blobUrl);
        iframe._blobUrl=blobUrl;iframe.src=blobUrl;
      }
      document.getElementById('fmEditArea').style.display='none';
      if(_fmCurrentMode==='code')document.getElementById('fmCode').style.display='';
      else if(_fmCurrentMode==='md')document.getElementById('fmMd').style.display='';
      else if(_fmCurrentMode==='html')document.getElementById('fmIframe').style.display='';
      if(typeof showToast==='function')showToast('已保存');
    }catch(e){if(typeof setStatus==='function')setStatus('保存失败: '+e.message);}
  }else{
    const currentText=_fmRawContent||(_fmCurrentMode==='code'?document.getElementById('fmCode').textContent:'');
    document.getElementById('fmEditArea').value=currentText;
    document.getElementById('fmEditArea').style.display='';
    if(_fmCurrentMode==='code')document.getElementById('fmCode').style.display='none';
    else if(_fmCurrentMode==='md')document.getElementById('fmMd').style.display='none';
    else if(_fmCurrentMode==='html')document.getElementById('fmIframe').style.display='none';
    document.getElementById('fmEditArea').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();_fmCancelEdit();}};
  }
  _fmUpdateEditBtn();
}

function _fmCancelEdit(){
  document.getElementById('fmEditArea').style.display='none';
  if(_fmCurrentMode==='code')document.getElementById('fmCode').style.display='';
  else if(_fmCurrentMode==='md')document.getElementById('fmMd').style.display='';
  else if(_fmCurrentMode==='html')document.getElementById('fmIframe').style.display='';
  _fmDirty=false;_fmUpdateEditBtn();
}

// ── Download ──────────────────────────────────────────────────────────────
function fmDownload(){
  if(!S.session||!_fmCurrentFile)return;
  const url=`/api/file/raw?session_id=${encodeURIComponent(S.session.session_id)}&path=${encodeURIComponent(_fmCurrentFile)}&download=1`;
  const a=document.createElement('a');a.href=url;a.download=_fmCurrentFile.split('/').pop();
  document.body.appendChild(a);a.click();setTimeout(()=>document.body.removeChild(a),100);
}

// ── New file / folder ─────────────────────────────────────────────────────
async function fmPromptNewFile(){
  if(!S.session)return;
  const name=prompt('新建文件名:');
  if(!name||!name.trim())return;
  const relPath=_fmCurrentDir==='.'?name.trim():(_fmCurrentDir+'/'+name.trim());
  try{
    await api('/api/file/create',{method:'POST',body:JSON.stringify({session_id:S.session.session_id,path:relPath,content:''})});
    fmRefresh();
    setTimeout(()=>_fmOpenFile(relPath),300);
  }catch(e){alert('创建失败: '+e.message);}
}

async function fmPromptNewFolder(){
  if(!S.session)return;
  const name=prompt('新建文件夹名:');
  if(!name||!name.trim())return;
  const relPath=_fmCurrentDir==='.'?name.trim():(_fmCurrentDir+'/'+name.trim());
  try{
    await api('/api/file/create-dir',{method:'POST',body:JSON.stringify({session_id:S.session.session_id,path:relPath})});
    fmRefresh();
  }catch(e){alert('创建失败: '+e.message);}
}

// ── Git badge ─────────────────────────────────────────────────────────────
async function _fmRefreshGitBadge(){
  const badge=document.getElementById('fmGitBadge');
  if(!badge||!S.session)return;
  try{
    const data=await api(`/api/git-info?session_id=${encodeURIComponent(S.session.session_id)}`);
    if(data.git&&data.git.is_git){
      const g=data.git;let text=g.branch||'git';
      if(g.dirty>0)text+=` \u00b7 ${g.dirty}\u2206`;
      if(g.behind>0)text+=` \u2193${g.behind}`;
      if(g.ahead>0)text+=` \u2191${g.ahead}`;
      badge.textContent=text;badge.className='git-badge'+(g.dirty>0?' dirty':'');badge.style.display='';
    }else{badge.style.display='none';}
  }catch(e){badge.style.display='none';}
}

// ── Sidebar resize ────────────────────────────────────────────────────────
function _fmInitShell(){
  const shell=document.getElementById('fmShell');
  if(!shell||shell._fmDragInit)return;
  shell._fmDragInit=true;

  // Center on first open
  const vw=window.innerWidth,vh=window.innerHeight;
  const w=Math.min(Math.round(vw*0.9),1400),h=Math.round(vh*0.88);
  shell.style.width=w+'px';shell.style.height=h+'px';
  shell.style.left=Math.round((vw-w)/2)+'px';
  shell.style.top=Math.round((vh-h)/2)+'px';

  // Drag via header
  const header=shell.querySelector('.fm-header');
  if(header){
    header.addEventListener('mousedown',e=>{
      if(e.target.closest('button,a,input,select'))return;
      e.preventDefault();
      const ox=e.clientX-shell.offsetLeft,oy=e.clientY-shell.offsetTop;
      const onMove=ev=>{
        shell.style.left=Math.max(0,Math.min(window.innerWidth-80,ev.clientX-ox))+'px';
        shell.style.top=Math.max(0,Math.min(window.innerHeight-40,ev.clientY-oy))+'px';
      };
      const onUp=()=>{document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);};
      document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
    });
  }

  // Resize via edge handles
  shell.querySelectorAll('.fm-resize').forEach(handle=>{
    handle.addEventListener('mousedown',e=>{
      e.preventDefault();e.stopPropagation();
      const dir=handle.dataset.dir;
      const startX=e.clientX,startY=e.clientY;
      const r=shell.getBoundingClientRect();
      const startL=r.left,startT=r.top,startW=r.width,startH=r.height;
      const MIN_W=400,MIN_H=300;
      const onMove=ev=>{
        let l=startL,t=startT,w=startW,h=startH;
        if(dir.includes('e'))w=Math.max(MIN_W,startW+(ev.clientX-startX));
        if(dir.includes('s'))h=Math.max(MIN_H,startH+(ev.clientY-startY));
        if(dir.includes('w')){const dw=ev.clientX-startX;w=Math.max(MIN_W,startW-dw);l=startL+startW-w;}
        if(dir.includes('n')){const dh=ev.clientY-startY;h=Math.max(MIN_H,startH-dh);t=startT+startH-h;}
        shell.style.left=l+'px';shell.style.top=t+'px';
        shell.style.width=w+'px';shell.style.height=h+'px';
      };
      const onUp=()=>{document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);};
      document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
    });
  });
}

function _fmInitResize(){
  const handle=document.getElementById('fmResizeHandle');
  const sidebar=document.getElementById('fmSidebar');
  if(!handle||!sidebar||handle._fmResizeInit)return;
  handle._fmResizeInit=true;
  let startX=0,startW=0;
  handle.addEventListener('mousedown',e=>{
    e.preventDefault();
    startX=e.clientX;startW=sidebar.getBoundingClientRect().width;
    handle.classList.add('dragging');document.body.classList.add('resizing');
    const onMove=ev=>{
      const newW=Math.min(600,Math.max(160,startW+(ev.clientX-startX)));
      sidebar.style.width=newW+'px';
    };
    const onUp=()=>{
      handle.classList.remove('dragging');document.body.classList.remove('resizing');
      document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);
    };
    document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
  });
}
