
  (function(){
    try{
      const KEY = 'STUDY_TIMER_OVERRIDE_HTML';
      const hasNo = new URLSearchParams(location.search).has('nooverride');
      const override = localStorage.getItem(KEY);
      if (!hasNo && override && !sessionStorage.getItem('STUDY_TIMER__OVERRIDE_LOADED')){
        sessionStorage.setItem('STUDY_TIMER__OVERRIDE_LOADED','1');
        document.open();
        document.write(override);
        document.close();
      }
    }catch(e){}
  })();


// ===== Manual HTML Override Loader (v1) =====
(() => {
  try{
    const key = 'ST_OVERRIDE_HTML';
    const raw = localStorage.getItem(key);
    if(raw && raw.trim().startsWith('<!')){
      document.open();
      document.write(raw);
      document.close();
    }
  }catch(e){}
})();


(() => {
  const LS = {
    MODE: 'st_mode',
    PALETTE_ID: 'st_palette_id',
    PALETTES: 'st_palettes',
    WORKBOOKS: 'st_workbooks',
    RECORDS: 'st_records',
    RESV: 'st_reservations',
    UI: 'st_ui',
    RUNSTATE: 'st_runstate',
    AUTO_SAVE: 'st_auto_save',
    LIVE_SAVE: 'st_live_save'
  };

  const $ = (id) => document.getElementById(id);
  const banner = $('banner');

  function showBanner(message, type='info', actions=[]){
    // v6.2.5: 모든 알림을 알림바/알림목록으로만 표시합니다.
    try{
      if(typeof pushNotice === 'function') pushNotice(String(message));
    }catch(e){}
  }

  function showModalMessage(title, bodyHtml){
    $('msgTitle').textContent = title;
    $('msgBody').innerHTML = bodyHtml;
    $('msgBack').style.display = 'flex';
  }
  function closeModalMessage(){ $('msgBack').style.display='none'; }
  $('msgClose').onclick = closeModalMessage;
  $('msgOk').onclick = closeModalMessage;

  function escapeHtml(s){
    return String(s).replace(/[&<>"]+/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]||m));
  }

  function pad2(n){ n = Math.floor(Math.abs(n)); return (n<10?'0':'')+n; }
  function pad3(n){ n = Math.floor(Math.abs(n)); if(n<10) return '00'+n; if(n<100) return '0'+n; return ''+n; }

  function msToHMS(ms, withMs=false){
    // withMs=true: show centiseconds (2 digits) rounded
    ms = Math.max(0, Number(ms) || 0);
    if(withMs){
      const totalCs = Math.max(0, Math.round(ms/10)); // 10ms unit
      const h = Math.floor(totalCs/360000);
      const m = Math.floor((totalCs%360000)/6000);
      const s = Math.floor((totalCs%6000)/100);
      const cs = totalCs%100;
      return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
    }
    ms = Math.max(0, Math.floor(ms));
    const h = Math.floor(ms/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  function fmt12(d, withSec=true){
    const hh = d.getHours();
    const am = hh < 12;
    const h12 = (hh % 12) === 0 ? 12 : (hh % 12);
    const mm = d.getMinutes();
    const ss = d.getSeconds();
    return `${am?'오전':'오후'} ${h12}:${pad2(mm)}${withSec?`:${pad2(ss)}`:''}`;
  }

  function ymd(d){
    const y = d.getFullYear();
    const m = pad2(d.getMonth()+1);
    const dd = pad2(d.getDate());
    return `${y}-${m}-${dd}`;
  }

  function loadJSON(key, fallback){
    try{ const v = localStorage.getItem(key); return v? JSON.parse(v): fallback; }catch(_){ return fallback; }
  }
  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ===== Theme (mode + palette) =====
  const defaultPalettes = [
    {
      id: 'pal_default',
      name: '기본(블루)',
      vars: {
        bg: '#f4f6fb', card:'#ffffff', text:'#10142a', muted:'#5b647e', border:'#d9e0f2',
        accent:'#2f67ff', success:'#1aae56', warning:'#d39a00', danger:'#d64545'
      }
    },
    {
      id: 'pal_mint',
      name: '민트',
      vars: {
        bg:'#f3fbfa', card:'#ffffff', text:'#0f1a1a', muted:'#53696a', border:'#cfe9e7',
        accent:'#1bb7a8', success:'#17a65a', warning:'#d39a00', danger:'#d64545'
      }
    },
    {
      id: 'pal_purple',
      name: '퍼플',
      vars: {
        bg:'#f6f3fb', card:'#ffffff', text:'#1a102a', muted:'#6a5b7e', border:'#e0d9f2',
        accent:'#7b4dff', success:'#1aae56', warning:'#d39a00', danger:'#d64545'
      }
    }
  ];

  function getPalettes(){
    const stored = loadJSON(LS.PALETTES, null);
    if(!stored || !Array.isArray(stored) || stored.length===0){
      saveJSON(LS.PALETTES, defaultPalettes);
      return defaultPalettes;
    }
    // ensure defaults exist at least once (do not overwrite user)
    return stored;
  }

  function setCssVars(vars){
    const r = document.documentElement;
    r.style.setProperty('--bg', vars.bg);
    r.style.setProperty('--card', vars.card);
    r.style.setProperty('--text', vars.text);
    r.style.setProperty('--muted', vars.muted);
    r.style.setProperty('--border', vars.border);
    r.style.setProperty('--accent', vars.accent);
    r.style.setProperty('--success', vars.success);
    r.style.setProperty('--warning', vars.warning);
    r.style.setProperty('--danger', vars.danger);
  }

  function applyTheme(){
    const mode = localStorage.getItem(LS.MODE) || 'light';
    document.documentElement.setAttribute('data-mode', mode);
    $('modeToggle').checked = (mode==='dark');
    $('modeLabel').textContent = mode==='dark' ? 'Dark' : 'Light';

    const palettes = getPalettes();
    const pid = localStorage.getItem(LS.PALETTE_ID) || palettes[0].id;
    const pal = palettes.find(p => p.id===pid) || palettes[0];

    // In dark mode, we still use palette accent/success/warning/danger, but base colors can be dark defaults.
    if(mode==='dark'){
      // keep the dark base (defined in CSS) but override accent/success/warning/danger if palette differs
      const r = document.documentElement;
      r.style.setProperty('--accent', pal.vars.accent);
      r.style.setProperty('--success', pal.vars.success);
      r.style.setProperty('--warning', pal.vars.warning);
      r.style.setProperty('--danger', pal.vars.danger);
      // bg/card/text/muted/border remain dark defaults for readability
    } else {
      setCssVars(pal.vars);
    }

    // refresh selects
    renderPaletteSelect();
  }

  function renderPaletteSelect(){
    const palettes = getPalettes();
    const pid = localStorage.getItem(LS.PALETTE_ID) || palettes[0].id;
    const sel = $('paletteSelect');
    sel.innerHTML = '';
    for(const p of palettes){
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      if(p.id===pid) o.selected = true;
      sel.appendChild(o);
    }
  }

  $('modeToggle').addEventListener('change', () => {
    localStorage.setItem(LS.MODE, $('modeToggle').checked ? 'dark' : 'light');
    applyTheme();
    showBanner('테마가 변경되었습니다.', 'success');
  });

  // ===== Layout toggle (PC/Mobile) =====
  const LAYOUT_KEY = 'ST_LAYOUT_MODE';
  function applyLayout(mode){
    document.body.classList.toggle('force-mobile', mode==='mobile');
    document.body.classList.toggle('force-desktop', mode==='desktop');
    if($('layoutToggle')){
      $('layoutToggle').checked = (mode==='mobile');
      $('layoutLabel').textContent = (mode==='mobile') ? '모바일' : 'PC';
    }
    try{ localStorage.setItem(LAYOUT_KEY, mode); }catch(e){}
  }
  // init layout: on small screens default to mobile; user can force PC
  (function initLayout(){
    let saved = null;
    try{ saved = localStorage.getItem(LAYOUT_KEY); }catch(e){}
    if(saved==='desktop' || saved==='mobile'){
      applyLayout(saved);
    } else {
      applyLayout('pc');
    }
  })();
  $('layoutToggle').addEventListener('change', () => {
    applyLayout($('layoutToggle').checked ? 'mobile' : 'desktop');
  });


  $('paletteSelect').addEventListener('change', () => {
    localStorage.setItem(LS.PALETTE_ID, $('paletteSelect').value);
    applyTheme();
    showBanner('색상 테마가 적용되었습니다.', 'success');
  });

  // Palette manage modal
  function openPal(){
    $('palBack').style.display = 'flex';
    renderPalList();
  }
  function closePal(){ $('palBack').style.display = 'none'; }
  $('paletteManageBtn').onclick = openPal;
  $('palClose').onclick = closePal;

  function renderPalList(){
    const palettes = getPalettes();
    const list = $('palList');
    list.innerHTML='';
    const pid = localStorage.getItem(LS.PALETTE_ID) || palettes[0].id;
    palettes.forEach((p, idx) => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      if(p.id===pid) o.selected = true;
      list.appendChild(o);
    });
    if(list.value) loadPalToEditor(list.value);
  }

  function loadPalToEditor(id){
    const palettes = getPalettes();
    const p = palettes.find(x=>x.id===id);
    if(!p) return;
    $('palName').value = p.name;
    $('palBg').value = p.vars.bg;
    $('palCard').value = p.vars.card;
    $('palText').value = p.vars.text;
    $('palMuted').value = p.vars.muted;
    $('palBorder').value = p.vars.border;
    $('palAccent').value = p.vars.accent;
    $('palSuccess').value = p.vars.success;
    $('palWarning').value = p.vars.warning;
    $('palDanger').value = p.vars.danger;
  }

  $('palList').addEventListener('change', () => loadPalToEditor($('palList').value));

  function readPalEditor(){
    return {
      name: ($('palName').value || '').trim() || '새 팔레트',
      vars: {
        bg: $('palBg').value,
        card: $('palCard').value,
        text: $('palText').value,
        muted: $('palMuted').value,
        border: $('palBorder').value,
        accent: $('palAccent').value,
        success: $('palSuccess').value,
        warning: $('palWarning').value,
        danger: $('palDanger').value,
      }
    };
  }

  $('palAddBtn').onclick = () => {
    const palettes = getPalettes();
    const data = readPalEditor();
    const id = 'pal_' + Math.random().toString(16).slice(2);
    palettes.push({id, ...data});
    saveJSON(LS.PALETTES, palettes);
    localStorage.setItem(LS.PALETTE_ID, id);
    applyTheme();
    renderPalList();
    showBanner('새 팔레트를 추가하였습니다.', 'success');
  };

  $('palUpdateBtn').onclick = () => {
    const palettes = getPalettes();
    const id = $('palList').value;
    if(!id){ showModalMessage('안내', '변경하실 팔레트를 선택해 주세요.'); return; }
    const idx = palettes.findIndex(p=>p.id===id);
    if(idx<0) return;
    const data = readPalEditor();
    palettes[idx].name = data.name;
    palettes[idx].vars = data.vars;
    saveJSON(LS.PALETTES, palettes);
    applyTheme();
    renderPalList();
    showBanner('팔레트를 변경하였습니다.', 'success');
  };

  $('palDeleteBtn').onclick = () => {
    const palettes = getPalettes();
    const id = $('palList').value;
    if(!id){ showModalMessage('안내', '삭제하실 팔레트를 선택해 주세요.'); return; }
    if(palettes.length<=1){ showModalMessage('안내', '최소 1개의 팔레트는 유지되어야 합니다.'); return; }
    const next = palettes.filter(p=>p.id!==id);
    saveJSON(LS.PALETTES, next);
    localStorage.setItem(LS.PALETTE_ID, next[0].id);
    applyTheme();
    renderPalList();
    showBanner('팔레트를 삭제하였습니다.', 'success');
  };

  // ===== Workbooks =====
  function getWorkbooks(){
    const w = loadJSON(LS.WORKBOOKS, null);
    if(!w || !Array.isArray(w)){
      const init = [];
      saveJSON(LS.WORKBOOKS, init);
      return init;
    }
    return w;
  }
  function setWorkbooks(w){ saveJSON(LS.WORKBOOKS, w); }

  function renderWorkbookSelect(){
    const sel = $('workbookSelect');
    const w = getWorkbooks();
    const saved = loadJSON(LS.UI, {}).workbookId || '';
    sel.innerHTML='';
    const none = document.createElement('option');
    none.value='';
    none.textContent='(선택 안 함)';
    sel.appendChild(none);
    w.forEach(x=>{
      const o = document.createElement('option');
      o.value=x.id;
      o.textContent = `${x.title} · 문제 ${x.totalProblems} · 페이지 ${x.totalPages}`;
      if(x.id===saved) o.selected = true;
      sel.appendChild(o);
    });
  }

  $('workbookSelect').addEventListener('change', () => {
    const ui = loadJSON(LS.UI, {});
    ui.workbookId = $('workbookSelect').value;
    saveJSON(LS.UI, ui);
    showBanner('문제집 선택이 저장되었습니다.', 'success');
  });

  function openWB(){
    $('wbBack').style.display='flex';
    renderWBList();
  }
  function closeWB(){ $('wbBack').style.display='none'; }
  $('workbookManageBtn').onclick = openWB;
  $('wbClose').onclick = closeWB;

  function renderWBList(){
    const list = $('wbList');
    list.innerHTML='';
    const w = getWorkbooks();
    w.forEach(x=>{
      const o = document.createElement('option');
      o.value=x.id;
      o.textContent = `${x.title} (문제 ${x.totalProblems}, 페이지 ${x.totalPages})`;
      list.appendChild(o);
    });
    if(list.value) loadWBToEditor(list.value);
  }

  function loadWBToEditor(id){
    const w = getWorkbooks();
    const x = w.find(a=>a.id===id);
    if(!x) return;
    $('wbTitle').value = x.title;
    $('wbTotalProblems').value = x.totalProblems;
    $('wbTotalPages').value = x.totalPages;
  }

  $('wbList').addEventListener('change', () => loadWBToEditor($('wbList').value));

  function readWBEditor(){
    const title = ($('wbTitle').value||'').trim();
    const tp = parseInt(($('wbTotalProblems').value||'').trim(),10);
    const tpg = parseInt(($('wbTotalPages').value||'').trim(),10);
    if(!title){
      showModalMessage('입력 오류입니다', '문제집 제목을 입력해 주세요.');
      return null;
    }
    if(!Number.isFinite(tp) || tp<=0 || !Number.isFinite(tpg) || tpg<=0){
      showModalMessage('입력 오류입니다', '전체 문제수와 전체 페이지수는 1 이상의 숫자로 입력해 주세요.');
      return null;
    }
    return {title, totalProblems: tp, totalPages: tpg};
  }

  $('wbAddBtn').onclick = () => {
    const data = readWBEditor();
    if(!data) return;
    const w = getWorkbooks();
    const id = 'wb_' + Math.random().toString(16).slice(2);
    w.push({id, ...data});
    setWorkbooks(w);
    renderWBList();
    renderWorkbookSelect();
    showBanner('문제집을 추가하였습니다.', 'success');
  };

  $('wbUpdateBtn').onclick = () => {
    const id = $('wbList').value;
    if(!id){ showModalMessage('안내', '변경하실 문제집을 선택해 주세요.'); return; }
    const data = readWBEditor();
    if(!data) return;
    const w = getWorkbooks();
    const idx = w.findIndex(x=>x.id===id);
    if(idx<0) return;
    w[idx] = {id, ...data};
    setWorkbooks(w);
    renderWBList();
    renderWorkbookSelect();
    showBanner('문제집을 변경하였습니다.', 'success');
  };

  $('wbDeleteBtn').onclick = () => {
    const id = $('wbList').value;
    if(!id){ showModalMessage('안내', '삭제하실 문제집을 선택해 주세요.'); return; }
    const w = getWorkbooks().filter(x=>x.id!==id);
    setWorkbooks(w);
    // if selected removed
    const ui = loadJSON(LS.UI, {});
    if(ui.workbookId===id){ ui.workbookId=''; saveJSON(LS.UI, ui); }
    renderWBList();
    renderWorkbookSelect();
    showBanner('문제집을 삭제하였습니다.', 'success');
  };

  // ===== Records =====
  function getRecords(){ return loadJSON(LS.RECORDS, []); }
  function setRecords(r){ saveJSON(LS.RECORDS, r); }

  // ===== Timer/Stopwatch state =====
  const state = {
    mode: 'stopwatch',
    running: false,
    paused: false,
    startMs: 0,
    pauseMs: 0,
    elapsedBeforePause: 0,
    timerTotalMs: 0,
    timerRemainMs: 0,
    tickHandle: null,
    lastUiUpdate: 0,
    session: null,
    liveCounter: 5,
    liveHandle: null,
    liveTickHandle: null,
  };

  function setTab(mode){
    state.mode = mode;
    $('tabStopwatch').classList.toggle('active', mode==='stopwatch');
    $('tabTimer').classList.toggle('active', mode==='timer');
    $('timerInputs').style.display = (mode==='timer') ? 'grid' : 'none';
    $('timeDisplay').textContent = (mode==='stopwatch') ? '00:00:00.00' : '00:00:00';
    syncButtons();
  }

  $('tabStopwatch').onclick = () => setTab('stopwatch');
  $('tabTimer').onclick = () => setTab('timer');

  function syncButtons(){
    const hasRun = state.running;
    $('startBtn').disabled = hasRun;
    $('pauseBtn').disabled = !hasRun || state.paused;
    $('resumeBtn').disabled = !hasRun || !state.paused;
    $('stopBtn').disabled = !hasRun;
    $('resetBtn').disabled = hasRun;

    $('manualSaveBtn').style.display = ($('liveSaveToggle').checked) ? 'none' : 'inline-block';

    // measurement areas
    $('pageArea').style.display = $('pageToggle').checked ? 'grid' : 'none';
    $('probArea').classList.toggle('hide', !$('probToggle').checked);

    $('liveBadge').style.display = $('liveSaveToggle').checked ? 'grid' : 'none';

    // correctness row
    const skip = $('skipCwToggle').checked;
    $('cwRow').style.display = skip ? 'none' : 'grid';
  }

  $('pageToggle').addEventListener('change', syncButtons);
  $('probToggle').addEventListener('change', syncButtons);
  $('skipCwToggle').addEventListener('change', syncButtons);
  $('liveSaveToggle').addEventListener('change', () => {
    localStorage.setItem(LS.AUTO_SAVE, $('liveSaveToggle').checked ? '1':'0');
    syncButtons();
    showBanner($('liveSaveToggle').checked ? '자동저장을 켰습니다.' : '자동저장을 껐습니다. 필요하시면 수동 저장을 눌러 주세요.', 'info');
  });

  $('manualSaveBtn').onclick = () => {
    snapshotSave(true);
    showBanner('수동 저장을 완료하였습니다.', 'success');
  };

  // problem mode switch
  document.querySelectorAll('input[name="probMode"]').forEach(r => r.addEventListener('change', () => {
    const val = document.querySelector('input[name="probMode"]:checked').value;
    $('probRangeRow').classList.toggle('hide', val!=='range');
    $('probManualRow').classList.toggle('hide', val!=='manual');
  }));

  function getSelectedWorkbook(){
    const id = $('workbookSelect').value || loadJSON(LS.UI, {}).workbookId || '';
    if(id) $('workbookSelect').value = id;
    const w = getWorkbooks();
    return w.find(x=>x.id===id) || null;
  }

  function numOrNull(v){
    v = (v??'').toString().trim();
    if(v==='') return null;
    const n = parseInt(v,10);
    return Number.isFinite(n) ? n : null;
  }

  function computeProbSolved(){
    const mode = document.querySelector('input[name="probMode"]:checked').value;
    if(mode==='manual'){
      const n = numOrNull($('probSolvedManual').value);
      return n;
    }
    const s = numOrNull($('probStart').value);
    const e = numOrNull($('probEnd').value);
    if(s==null || e==null) return null;
    return Math.max(0, e - s + 1);
  }

  function updateProbAuto(){
    const mode = document.querySelector('input[name="probMode"]:checked').value;
    if(mode==='range'){
      const v = computeProbSolved();
      $('probSolvedAuto').value = (v==null) ? '' : String(v);
    }
  }
  $('probStart').addEventListener('input', updateProbAuto);
  $('probEnd').addEventListener('input', updateProbAuto);

  function validateMeasurements(durationMs){
    const wb = getSelectedWorkbook();

    // pages
    let page = null;
    if($('pageToggle').checked){
      const ps = numOrNull($('pageStart').value);
      const pe = numOrNull($('pageEnd').value);
      if(ps==null || pe==null){
        return {ok:false, title:'입력 오류입니다', msg:'페이지 측정을 사용 중이시므로 시작 페이지와 끝 페이지를 모두 입력해 주세요. 다시 입력해 주세요.'};
      }
      if(wb && (ps<1 || pe<1 || ps>wb.totalPages || pe>wb.totalPages)){
        return {ok:false, title:'입력 오류입니다', msg:`선택하신 문제집의 페이지 범위(1~${wb.totalPages})를 벗어났습니다. 다시 입력해 주세요.`};
      }
      const solvedPages = Math.max(0, pe - ps);
      const minutes = Math.max(0.000001, durationMs/60000);
      const ppm = solvedPages / minutes;
      page = {start: ps, end: pe, solved: solvedPages, ppm};
    }

    // problems
    let prob = null;
    if($('probToggle').checked){
      const mode = document.querySelector('input[name="probMode"]:checked').value;
      let solved = null;
      let start = null, end = null;
      if(mode==='manual'){
        solved = numOrNull($('probSolvedManual').value);
        if(solved==null){
          return {ok:false, title:'입력 오류입니다', msg:'문제수 측정을 사용 중이시므로 푼 문제수를 입력해 주세요. 다시 입력해 주세요.'};
        }
      } else {
        start = numOrNull($('probStart').value);
        end = numOrNull($('probEnd').value);
        if(start==null || end==null){
          return {ok:false, title:'입력 오류입니다', msg:'문제수 측정을 사용 중이시므로 시작/끝 문제번호를 모두 입력해 주세요. 다시 입력해 주세요.'};
        }
        if(wb && (start<1 || end<1 || start>wb.totalProblems || end>wb.totalProblems)){
          return {ok:false, title:'입력 오류입니다', msg:`선택하신 문제집의 문제 범위(1~${wb.totalProblems})를 벗어났습니다. 다시 입력해 주세요.`};
        }
        solved = Math.max(0, end - start + 1);
      }

      if(wb && (solved<0 || solved>wb.totalProblems)){
        return {ok:false, title:'입력 오류입니다', msg:`푼 문제수가 선택하신 문제집의 전체 문제수(${wb.totalProblems})를 초과합니다. 다시 입력해 주세요.`};
      }

      // correctness
      const skip = $('skipCwToggle').checked;
      let correct = null, wrong = null, acc = null, wr = null;
      if(!skip){
        correct = numOrNull($('correctCnt').value);
        wrong = numOrNull($('wrongCnt').value);
        if(correct==null || wrong==null){
          return {ok:false, title:'입력 오류입니다', msg:'정답/오답 입력을 사용 중이시므로 정답 개수와 오답 개수를 모두 입력해 주세요. 다시 입력해 주세요.'};
        }
        if(correct<0 || wrong<0){
          return {ok:false, title:'입력 오류입니다', msg:'정답/오답 개수는 0 이상의 숫자여야 합니다. 다시 입력해 주세요.'};
        }
        if(wb && (correct+wrong>wb.totalProblems)){
          return {ok:false, title:'입력 오류입니다', msg:`정답+오답이 문제집 전체 문제수(${wb.totalProblems})를 초과합니다. 다시 입력해 주세요.`};
        }
        if((correct + wrong) !== solved){
          return {ok:false, title:'입력 오류입니다', msg:`정답(${correct})+오답(${wrong})이 푼 문제수(${solved})와 일치하지 않습니다. 다시 입력해 주세요.`};
        }
        const total = correct + wrong;
        acc = total>0 ? (correct/total) : null;
        wr = total>0 ? (wrong/total) : null;
      }

      const minutes = Math.max(0.000001, durationMs/60000);
      const ppm = solved / minutes;
      prob = {mode, start, end, solved, ppm, skip, correct, wrong, acc, wr};
    }

    return {ok:true, page, prob};
  }

  // ===== Run / display =====
  function getTimerInputMs(){
    const h = numOrNull($('inH').value) || 0;
    const m = numOrNull($('inM').value) || 0;
    const s = numOrNull($('inS').value) || 0;
    const total = (h*3600 + m*60 + s) * 1000;
    return Math.max(0, total);
  }

  function updateDisplay(){
    if(!state.running){
      // show base
      $('timeDisplay').textContent = state.mode==='stopwatch' ? '00:00:00.00' : '00:00:00';
      return;
    }
    if(state.mode==='stopwatch'){
      const now = Date.now();
      let elapsed = state.elapsedBeforePause;
      if(!state.paused) elapsed += (now - state.startMs);
      $('timeDisplay').textContent = msToHMS(elapsed, true);
    } else {
      const now = Date.now();
      let remain = state.timerRemainMs;
      if(!state.paused){
        const passed = now - state.startMs;
        remain = Math.max(0, state.timerTotalMs - passed);
        state.timerRemainMs = remain;
      }
      $('timeDisplay').textContent = msToHMS(remain, false);
      if(!state.paused && remain<=0){
        // auto stop
        showBanner('타이머가 종료되었습니다.', 'success');
        finishSession(true);
      }
    }
  }

  function startSession(){
    const title = ($('titleInput').value||'').trim();
    if(!title){
      showModalMessage('입력 오류입니다', '제목을 입력해 주세요.');
      return;
    }

    if(state.mode==='timer'){
      const total = getTimerInputMs();
      if(total<=0){
        showModalMessage('입력 오류입니다', '타이머 시간(시/분/초)을 1초 이상으로 입력해 주세요.');
        return;
      }
      state.timerTotalMs = total;
      state.timerRemainMs = total;
    }

    state.running = true;
    state.paused = false;
    state.startMs = Date.now();
    state.elapsedBeforePause = 0;

    const startDate = new Date();
    $('sessionStart').textContent = fmt12(startDate, true);
    $('sessionEnd').textContent = '-';

    state.session = {
      id: 'rec_' + Date.now().toString(16) + Math.random().toString(16).slice(2),
      date: ymd(startDate),
      title,
      workbookId: $('workbookSelect').value || '',
      type: state.mode==='stopwatch' ? 'SW' : 'TM',
      startMs: state.startMs,
      endMs: null,
      durationMs: 0,
      // measurements filled later
      page: null,
      prob: null,
      // snapshots
      snapshots: []
    };

    saveRunState();
    syncButtons();
    updateDisplay();

    if(state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle = setInterval(() => {
      updateDisplay();
      // update prob auto while running
      if($('probToggle').checked) updateProbAuto();
    }, 50);

    showBanner('공부를 시작하였습니다. 집중해 주세요!', 'success');
  }

  function pauseSession(){
    if(!state.running || state.paused) return;
    state.paused = true;
    state.pauseMs = Date.now();
    if(state.mode==='stopwatch'){
      state.elapsedBeforePause += (state.pauseMs - state.startMs);
    } else {
      // timer: keep remain as is
      state.timerRemainMs = Math.max(0, state.timerTotalMs - (state.pauseMs - state.startMs));
    }
    saveRunState();
    syncButtons();
    showBanner('일시정지하였습니다.', 'info');
  }

  function resumeSession(){
    if(!state.running || !state.paused) return;
    state.paused = false;
    state.startMs = Date.now();
    // for stopwatch, elapsedBeforePause already holds
    // for timer, timerTotalMs remains; startMs reset and we adjust by setting timerTotalMs = remain + 0? simpler:
    if(state.mode==='timer'){
      state.timerTotalMs = state.timerRemainMs;
      state.timerRemainMs = state.timerTotalMs;
    }
    saveRunState();
    syncButtons();
    showBanner('재개하였습니다.', 'success');
  }

  function resetSessionUI(){
    state.running=false;
    state.paused=false;
    state.startMs=0;
    state.elapsedBeforePause=0;
    state.timerTotalMs=0;
    state.timerRemainMs=0;
    if(state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle=null;
    state.session=null;
    $('sessionStart').textContent='-';
    $('sessionEnd').textContent='-';
    updateDisplay();
    syncButtons();
    clearRunState();
  }

  function finishSession(auto=false){
    if(!state.running) return;

    // compute duration
    const end = Date.now();
    let durationMs = 0;
    if(state.mode==='stopwatch'){
      durationMs = state.elapsedBeforePause + (state.paused ? 0 : (end - state.startMs));
    } else {
      // timer duration is total set - remaining
      const totalSet = state.timerTotalMs;
      const remain = state.paused ? state.timerRemainMs : Math.max(0, totalSet - (end - state.startMs));
      durationMs = Math.max(0, totalSet - remain);
    }

    // validate measurements
    const v = validateMeasurements(durationMs);
    if(!v.ok){
      showModalMessage(v.title, `${escapeHtml(v.msg)}`);
      return;
    }

    state.running=false;
    state.paused=false;

    if(state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle=null;

    const endDate = new Date(end);
    $('sessionEnd').textContent = fmt12(endDate, true);

    // finalize record
    const rec = state.session;
    rec.endMs = end;
    rec.durationMs = durationMs;
    rec.page = v.page;
    rec.prob = v.prob;

    // add snapshot before save
    rec.snapshots.push(makeSnapshot());

    const records = getRecords();
    records.push(rec);
    setRecords(records);

    if($('liveSaveToggle').checked){
      // already saved in localStorage; this message is just UI
      showBanner(auto ? '자동으로 저장되었습니다.' : '저장하였습니다.', 'success');
    } else {
      showBanner('자동저장이 꺼져 있습니다. 필요하시면 수동 저장을 눌러 주세요.', 'info');
    }

    resetSessionUI();
    renderRecords();
    renderCalendar();
    renderStats('day');
    computeTodayTotal();
  }

  function makeSnapshot(){
    const now = Date.now();
    const title = ($('titleInput').value||'').trim();
    const wbId = $('workbookSelect').value || '';

    // duration current
    let durationMs = 0;
    if(state.running){
      if(state.mode==='stopwatch'){
        durationMs = state.elapsedBeforePause + (state.paused ? 0 : (now - state.startMs));
      } else {
        const total = state.timerTotalMs;
        const remain = state.paused ? state.timerRemainMs : Math.max(0, total - (now - state.startMs));
        durationMs = Math.max(0, total - remain);
      }
    }

    // best-effort measurement (do not validate hard here)
    const pb = $('pageToggle').checked ? {
      start: numOrNull($('pageStart').value),
      end: numOrNull($('pageEnd').value)
    } : null;

    const probOn = $('probToggle').checked;
    const probMode = probOn ? document.querySelector('input[name="probMode"]:checked').value : null;
    const prob = probOn ? {
      mode: probMode,
      start: numOrNull($('probStart').value),
      end: numOrNull($('probEnd').value),
      solved: computeProbSolved(),
      skip: $('skipCwToggle').checked,
      correct: numOrNull($('correctCnt').value),
      wrong: numOrNull($('wrongCnt').value)
    } : null;

    return {t: now, title, wbId, durationMs, pb, prob};
  }

  
  function setLiveRing(counter){
    const numEl = document.getElementById('liveNum');
    const fg = document.querySelector('#liveBadge .ring-fg');
    if(numEl) numEl.textContent = String(counter);
    // progress: 5 -> full, 0 -> empty
    const total = 5;
    const C = 100.53; // circumference r=16
    const frac = Math.max(0, Math.min(1, counter / total));
    if(fg) fg.style.strokeDashoffset = String(C * (1 - frac));
  }
  function spinLiveRing(){
    const svg = document.querySelector('#liveBadge .ring');
    if(!svg) return;
    svg.classList.remove('spin');
    void svg.offsetWidth;
    svg.classList.add('spin');
  }

  function saveLiveSnapshot(){
    // lightweight snapshot: current UI + running timers
    try{
      persistAll();
    }catch(e){
      try{ localStorage.setItem('ST_STATE', JSON.stringify(state)); }catch(_){}
    }
  }
// ===== Live save engine =====
  function startLiveLoop(){
    stopLiveLoop();
    state.liveEnabled = true;
    state.liveCounter = 5;
    state.liveNextTick = performance.now() + 1000;
    state.liveEnd = performance.now() + 5000;
    setLiveRing(5);
    // rAF loop for ring progress (works even when setInterval is throttled)
    function raf(now){
      if(!state.liveEnabled) return;
      // update counter each 1s
      if(now >= state.liveNextTick){
        state.liveCounter = Math.max(0, state.liveCounter - 1);
        state.liveNextTick += 1000;
        setLiveRing(state.liveCounter);
      }
      // update progress smoothly based on remaining ms
      const remain = Math.max(0, state.liveEnd - now);
      const frac = remain / 5000;
      const fg = document.querySelector('#liveBadge .ring-fg');
      if(fg){
        const C = 100.53;
        fg.style.strokeDashoffset = String(C * (1 - frac));
      }
      if(remain <= 0){
        // trigger save
        spinLiveRing();
        try{ saveLiveSnapshot(); }catch(e){}
        // restart cycle
        state.liveCounter = 5;
        state.liveNextTick = now + 1000;
        state.liveEnd = now + 5000;
        setLiveRing(5);
      }
      state.liveRaf = requestAnimationFrame(raf);
    }
    state.liveRaf = requestAnimationFrame(raf);
  }

  function stopLiveLoop(){
    if(state.liveTickHandle) clearInterval(state.liveTickHandle);
    state.liveTickHandle = null;
  }

  $('liveSaveToggle').addEventListener('change', () => {
    localStorage.setItem(LS.LIVE_SAVE, $('liveSaveToggle').checked ? '1':'0');
    syncButtons();
    if($('liveSaveToggle').checked){
      showBanner('라이브 저장을 켰습니다. 5초마다 저장됩니다.', 'success');
      startLiveLoop();
    } else {
      showBanner('라이브 저장을 껐습니다.', 'info');
      stopLiveLoop();
    }
  });

  function snapshotSave(force){
    // live snapshot: store runstate so it survives refresh
    if(!state.running) return;
    if(!$('liveSaveToggle').checked && !force) return;

    const snap = makeSnapshot();
    try{
      const rs = loadJSON(LS.RUNSTATE, null) || {};
      rs.snapshot = snap;
      rs.ui = {
        title: $('titleInput').value,
        workbookId: $('workbookSelect').value,
        pageToggle: $('pageToggle').checked,
        pageStart: $('pageStart').value,
        pageEnd: $('pageEnd').value,
        probToggle: $('probToggle').checked,
        probMode: document.querySelector('input[name="probMode"]:checked').value,
        probStart: $('probStart').value,
        probEnd: $('probEnd').value,
        probSolvedManual: $('probSolvedManual').value,
        skipCw: $('skipCwToggle').checked,
        correct: $('correctCnt').value,
        wrong: $('wrongCnt').value,
        tab: state.mode,
        timerIn: {h:$('inH').value,m:$('inM').value,s:$('inS').value}
      };
      // running mechanics
      rs.running = {
        mode: state.mode,
        running: state.running,
        paused: state.paused,
        startMs: state.startMs,
        elapsedBeforePause: state.elapsedBeforePause,
        timerTotalMs: state.timerTotalMs,
        timerRemainMs: state.timerRemainMs,
        session: state.session
      };
      saveJSON(LS.RUNSTATE, rs);
    } catch(_){ }
  }

  function saveRunState(){ snapshotSave(true); }
  function clearRunState(){ localStorage.removeItem(LS.RUNSTATE); }

  // ===== Records rendering =====
  function renderRecords(){
    const list = $('recordList');
    list.innerHTML='';
    const records = getRecords().slice().reverse();
    if(records.length===0){
      list.innerHTML = `<div class="small">아직 기록이 없습니다. 타이머를 시작해 주세요.</div>`;
      return;
    }

    for(const r of records){
      const start = new Date(r.startMs);
      const end = r.endMs ? new Date(r.endMs) : null;
      const dur = msToHMS(r.durationMs, false);

      const wb = (r.workbookId ? getWorkbooks().find(w=>w.id===r.workbookId) : null);
      const wbText = wb ? ` · ${wb.title}` : '';

      const sub = `${fmt12(start,true)} ~ ${end?fmt12(end,true):'-'} · ${dur} · ${r.type==='SW'?'스톱워치':'타이머'}${wbText}`;

      const item = document.createElement('div');
      item.className='item';
      item.innerHTML = `
        <div class="meta">
          <div class="name">${escapeHtml(r.title)}</div>
          <div class="sub">${escapeHtml(sub)}</div>
        </div>
        <div class="right">
          <button class="btn" data-act="detail">상세보기</button>
          <button class="btn danger" data-act="del">삭제</button>
        </div>
      `;
      item.querySelector('[data-act="detail"]').onclick = () => openDetail(r.id);
      item.querySelector('[data-act="del"]').onclick = () => deleteRecord(r.id);
      list.appendChild(item);
    }
  }

  function deleteRecord(id){
    const records = getRecords().filter(r=>r.id!==id);
    setRecords(records);
    renderRecords();
    renderCalendar();
    computeTodayTotal();
    showBanner('기록을 삭제하였습니다.', 'success');
  }

  function openDetail(id){
    const r = getRecords().find(x=>x.id===id);
    if(!r) return;
    const start = new Date(r.startMs);
    const end = new Date(r.endMs);
    const dur = msToHMS(r.durationMs, true);

    const wb = r.workbookId ? getWorkbooks().find(w=>w.id===r.workbookId) : null;

    const pageHtml = r.page ? `
      <div class="divider"></div>
      <h3 style="font-size:14px;margin:0 0 6px 0">페이지 측정</h3>
      <div class="kpi">
        <div class="k"><div class="t">시작 페이지</div><div class="v">${r.page.start}</div></div>
        <div class="k"><div class="t">끝 페이지</div><div class="v">${r.page.end}</div></div>
        <div class="k"><div class="t">푼 페이지</div><div class="v">${r.page.solved}</div></div>
        <div class="k"><div class="t">분당 페이지</div><div class="v">${r.page.ppm.toFixed(2)}</div></div>
      </div>
    ` : '';

    let probHtml = '';
    if(r.prob){
      const pr = r.prob;
      const modeText = pr.mode==='manual' ? '직접 입력' : '시작/끝';
      const acc = (pr.acc==null) ? '-' : (pr.acc*100).toFixed(1)+'%';
      const wr = (pr.wr==null) ? '-' : (pr.wr*100).toFixed(1)+'%';
      probHtml = `
        <div class="divider"></div>
        <h3 style="font-size:14px;margin:0 0 6px 0">문제수 측정</h3>
        <div class="small">입력 방식: <b>${modeText}</b></div>
        <div style="height:8px"></div>
        <div class="kpi">
          ${pr.mode==='range' ? `
            <div class="k"><div class="t">시작 문제번호</div><div class="v">${pr.start??'-'}</div></div>
            <div class="k"><div class="t">끝 문제번호</div><div class="v">${pr.end??'-'}</div></div>
          ` : ''}
          <div class="k"><div class="t">푼 문제수</div><div class="v">${pr.solved}</div></div>
          <div class="k"><div class="t">분당 문제수</div><div class="v">${pr.ppm.toFixed(2)}</div></div>
          <div class="k"><div class="t">정답</div><div class="v">${pr.skip ? '-' : pr.correct}</div></div>
          <div class="k"><div class="t">오답</div><div class="v">${pr.skip ? '-' : pr.wrong}</div></div>
          <div class="k"><div class="t">정답률</div><div class="v">${pr.skip ? '-' : acc}</div></div>
          <div class="k"><div class="t">오답률</div><div class="v">${pr.skip ? '-' : wr}</div></div>
        </div>
      `;
    }

    $('detailBody').innerHTML = `
      <div class="kpi">
        <div class="k"><div class="t">제목</div><div class="v">${escapeHtml(r.title)}</div></div>
        <div class="k"><div class="t">문제집</div><div class="v">${escapeHtml(wb?wb.title:'-')}</div></div>
        <div class="k"><div class="t">유형</div><div class="v">${r.type==='SW'?'스톱워치':'타이머'}</div></div>
      </div>
      <div class="divider"></div>
      <div class="kpi">
        <div class="k"><div class="t">시작 시각</div><div class="v">${fmt12(start,true)}</div></div>
        <div class="k"><div class="t">종료 시각</div><div class="v">${fmt12(end,true)}</div></div>
        <div class="k"><div class="t">공부 시간</div><div class="v">${dur}</div></div>
      </div>
      ${pageHtml}
      ${probHtml}
    `;
    $('detailBack').style.display='flex';
  }

  $('detailClose').onclick = () => $('detailBack').style.display='none';

  // ===== Calendar =====
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  let selected = ymd(new Date());

  function renderCalendar(){
    const grid = $('calGrid');
    grid.innerHTML='';

    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();

    $('monthLabel').textContent = `${calYear}년 ${calMonth+1}월`;

    const dows = ['일','월','화','수','목','금','토'];
    for(const d of dows){
      const el = document.createElement('div');
      el.className='dow';
      el.textContent=d;
      grid.appendChild(el);
    }

    const records = getRecords();
    const recDays = new Set(records.map(r=>r.date));

    const totalCells = 42; // 6 weeks
    const prevDays = new Date(calYear, calMonth, 0).getDate();

    for(let i=0;i<totalCells;i++){
      const idx = i - startDow + 1;
      let d; let inMonth=true;
      if(idx<=0){
        d = new Date(calYear, calMonth-1, prevDays + idx);
        inMonth=false;
      } else if(idx>daysInMonth){
        d = new Date(calYear, calMonth+1, idx - daysInMonth);
        inMonth=false;
      } else {
        d = new Date(calYear, calMonth, idx);
      }
      const key = ymd(d);
      const el = document.createElement('div');
      el.className='day' + (inMonth?'':' muted');
      if(key===ymd(new Date())) el.classList.add('today');
      el.innerHTML = `<div>${d.getDate()}</div>`;
      const hasRec = recDays.has(key);
      // reservation dots: placeholder (yellow) for future expansion
      const hasResv = false;
      if(hasRec || hasResv){
        const dot = document.createElement('div');
        dot.className='dot';
        if(hasRec){ const i1 = document.createElement('i'); i1.className='g'; dot.appendChild(i1); }
        if(hasResv){ const i2 = document.createElement('i'); i2.className='y'; dot.appendChild(i2); }
        el.appendChild(dot);
      }
      el.onclick = () => {
        selected = key;
        $('selectedDate').textContent = key;
        renderDayRecords();
      };
      grid.appendChild(el);
    }

    $('selectedDate').textContent = selected;
    renderDayRecords();
  }

  function renderDayRecords(){
    const list = $('dayRecords');
    list.innerHTML='';
    const records = getRecords().filter(r=>r.date===selected).slice().reverse();
    if(records.length===0){
      list.innerHTML = `<div class="small">선택하신 날짜에는 기록이 없습니다.</div>`;
      return;
    }
    for(const r of records){
      const start = new Date(r.startMs);
      const end = new Date(r.endMs);
      const dur = msToHMS(r.durationMs,false);
      const item = document.createElement('div');
      item.className='item';
      item.innerHTML = `
        <div class="meta">
          <div class="name">${escapeHtml(r.title)}</div>
          <div class="sub">${fmt12(start,true)} ~ ${fmt12(end,true)} · ${dur}</div>
        </div>
        <div class="right">
          <button class="btn" data-act="detail">상세보기</button>
        </div>
      `;
      item.querySelector('[data-act="detail"]').onclick = () => openDetail(r.id);
      list.appendChild(item);
    }
  }

  $('prevMonth').onclick = () => {
    calMonth -= 1;
    if(calMonth<0){ calMonth=11; calYear-=1; }
    renderCalendar();
  };
  $('nextMonth').onclick = () => {
    calMonth += 1;
    if(calMonth>11){ calMonth=0; calYear+=1; }
    renderCalendar();
  };

  // collapse
  $('collapseCalBtn').onclick = () => {
    $('side').classList.add('collapsed');
    $('sideCollapsed').classList.remove('hide');
    const ui = loadJSON(LS.UI, {});
    ui.sideCollapsed = true;
    saveJSON(LS.UI, ui);
  };
  $('expandCalBtn').onclick = () => {
    $('side').classList.remove('collapsed');
    $('sideCollapsed').classList.add('hide');
    const ui = loadJSON(LS.UI, {});
    ui.sideCollapsed = false;
    saveJSON(LS.UI, ui);
  };

  // ===== Stats =====
  function getPeriodRange(kind){
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if(kind==='day'){
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if(kind==='week'){
      const day = now.getDay(); // 0 Sunday
      const diffToMon = (day===0 ? -6 : 1 - day);
      start.setDate(now.getDate() + diffToMon);
      start.setHours(0,0,0,0);
      end.setTime(start.getTime() + 6*86400000);
      end.setHours(23,59,59,999);
    } else if(kind==='month'){
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setMonth(now.getMonth()+1, 0);
      end.setHours(23,59,59,999);
    } else if(kind==='year'){
      start.setMonth(0,1);
      start.setHours(0,0,0,0);
      end.setMonth(11,31);
      end.setHours(23,59,59,999);
    }
    return {start, end};
  }

  function renderStats(kind){
    const {start, end} = getPeriodRange(kind);
    const records = getRecords().filter(r => r.startMs>=start.getTime() && r.startMs<=end.getTime());

    const totalMs = records.reduce((a,r)=>a+r.durationMs, 0);
    const totalMin = totalMs/60000;

    let pages = 0;
    let probs = 0;
    let correct = 0;
    let wrong = 0;
    for(const r of records){
      if(r.page) pages += (r.page.solved||0);
      if(r.prob){
        probs += (r.prob.solved||0);
        if(!r.prob.skip){
          correct += (r.prob.correct||0);
          wrong += (r.prob.wrong||0);
        }
      }
    }

    const ppm = totalMin>0 ? pages/totalMin : 0;
    const qpm = totalMin>0 ? probs/totalMin : 0;

    const totalAns = correct+wrong;
    const acc = totalAns>0 ? (correct/totalAns) : null;

    const kpi = $('statsKpi');
    kpi.innerHTML='';

    const add = (t,v) => {
      const el = document.createElement('div');
      el.className='k';
      el.innerHTML = `<div class="t">${escapeHtml(t)}</div><div class="v">${escapeHtml(v)}</div>`;
      kpi.appendChild(el);
    };

    add('기간', `${ymd(start)} ~ ${ymd(end)}`);
    add('총 공부시간', msToHMS(totalMs,false));
    add('총 푼 페이지', String(pages));
    add('분당 페이지', ppm.toFixed(2));
    add('총 푼 문제', String(probs));
    add('분당 문제', qpm.toFixed(2));
    add('정답/오답', totalAns>0 ? `${correct} / ${wrong}` : '-');
    add('정답률', acc==null ? '-' : (acc*100).toFixed(1)+'%');

    $('statsHint').textContent = '통계는 기록된 세션을 기반으로 자동 계산됩니다.';
  }

  document.querySelectorAll('[data-stat]').forEach(btn => btn.onclick = () => renderStats(btn.dataset.stat));

  // ===== Today total =====
  function computeTodayTotal(){
    const today = ymd(new Date());
    const records = getRecords().filter(r=>r.date===today);
    const totalMs = records.reduce((a,r)=>a+r.durationMs, 0);
    $('todayTotal').textContent = msToHMS(totalMs, false);
  }

  // ===== Current clock =====
  setInterval(() => {
    $('nowClock').textContent = fmt12(new Date(), true);
  }, 250);

  // ===== Controls =====
  $('startBtn').onclick = startSession;
  $('pauseBtn').onclick = pauseSession;
  $('resumeBtn').onclick = resumeSession;
  $('stopBtn').onclick = () => finishSession(false);
  $('resetBtn').onclick = () => {
    showModalMessage('안내', '초기화하시면 현재 입력값이 유지되며, 타이머만 초기화됩니다. 진행하시겠습니까?');
    // only reset timer state, keep inputs; simple confirm via modal: reuse ok only
    // We'll just reset directly (no browser confirm)
    setTimeout(() => {
      resetSessionUI();
      showBanner('초기화하였습니다.', 'success');
    }, 50);
  };

  $('exitBtn').onclick = () => {
    // Try close; may fail.
    window.close();
    setTimeout(() => {
      showModalMessage('안내', '브라우저 보안 정책으로 인해 자동 종료가 제한될 수 있습니다. 필요하시면 이 탭을 직접 닫아 주세요.');
    }, 200);
  };

  $('clearTodayBtn').onclick = () => {
    const today = ymd(new Date());
    const records = getRecords().filter(r=>r.date!==today);
    setRecords(records);
    renderRecords();
    renderCalendar();
    computeTodayTotal();
    showBanner('오늘 기록을 초기화하였습니다.', 'success');
  };

  $('clearAllBtn').onclick = () => {
    showModalMessage('안내', '전체 기록을 초기화하려면, 새로고침 후에도 복구되지 않습니다. 정말로 진행하시겠습니까?');
    // immediate (no confirm buttons in this simple modal), so we do not auto delete.
    // Provide action in banner instead.
    showBanner('전체 초기화를 진행하시겠습니까?', 'info', [{label:'전체 초기화', onClick: () => {
      setRecords([]);
      renderRecords();
      renderCalendar();
      computeTodayTotal();
      showBanner('전체 기록을 초기화하였습니다.', 'success');
    }}]);
  };

  // ===== Restore UI settings =====
  function restoreSettings(){
    // auto/live
    $('liveSaveToggle').checked = (localStorage.getItem(LS.AUTO_SAVE) ?? '1') === '1';
    $('liveSaveToggle').checked = (localStorage.getItem(LS.LIVE_SAVE) ?? '1') === '1';

    const ui = loadJSON(LS.UI, {});
    if(ui.title) $('titleInput').value = ui.title;
    if(ui.workbookId) $('workbookSelect').value = ui.workbookId;

    if(ui.sideCollapsed){
      $('side').classList.add('collapsed');
      $('sideCollapsed').classList.remove('hide');
    }

    syncButtons();

    // Restore runstate if any
    const rs = loadJSON(LS.RUNSTATE, null);
    if(rs && rs.running && rs.running.running){
      // restore basic UI
      if(rs.ui){
        $('titleInput').value = rs.ui.title || '';
        $('workbookSelect').value = rs.ui.workbookId || '';
        $('pageToggle').checked = !!rs.ui.pageToggle;
        $('pageStart').value = rs.ui.pageStart || '';
        $('pageEnd').value = rs.ui.pageEnd || '';

        $('probToggle').checked = !!rs.ui.probToggle;
        // prob mode
        if(rs.ui.probMode){
          document.querySelectorAll('input[name="probMode"]').forEach(r=>{ r.checked = (r.value===rs.ui.probMode); });
        }
        $('probStart').value = rs.ui.probStart || '';
        $('probEnd').value = rs.ui.probEnd || '';
        $('probSolvedManual').value = rs.ui.probSolvedManual || '';

        $('skipCwToggle').checked = !!rs.ui.skipCw;
        $('correctCnt').value = rs.ui.correct || '';
        $('wrongCnt').value = rs.ui.wrong || '';

        if(rs.ui.tab){
          setTab(rs.ui.tab);
        }
        if(rs.ui.timerIn){
          $('inH').value = rs.ui.timerIn.h || '';
          $('inM').value = rs.ui.timerIn.m || '';
          $('inS').value = rs.ui.timerIn.s || '';
        }
      }

      // restore mechanics
      const r = rs.running;
      state.mode = r.mode || 'stopwatch';
      setTab(state.mode);
      state.running = true;
      state.paused = !!r.paused;
      state.startMs = r.startMs || Date.now();
      state.elapsedBeforePause = r.elapsedBeforePause || 0;
      state.timerTotalMs = r.timerTotalMs || 0;
      state.timerRemainMs = r.timerRemainMs || 0;
      state.session = r.session || null;

      // session start label
      if(state.session && state.session.startMs){
        $('sessionStart').textContent = fmt12(new Date(state.session.startMs), true);
      }

      // tick
      if(state.tickHandle) clearInterval(state.tickHandle);
      state.tickHandle = setInterval(updateDisplay, 50);
      syncButtons();
      showBanner('이전 실행 상태를 복구하였습니다.', 'success');
    }
  }

  // ===== Init =====
  function init(){
    // mode default
    if(!localStorage.getItem(LS.MODE)) localStorage.setItem(LS.MODE, 'light');
    if(!localStorage.getItem(LS.AUTO_SAVE)) localStorage.setItem(LS.AUTO_SAVE, '1');
    if(!localStorage.getItem(LS.LIVE_SAVE)) localStorage.setItem(LS.LIVE_SAVE, '1');

    applyTheme();
    renderWorkbookSelect();
    computeTodayTotal();
    renderRecords();
    renderCalendar();
    renderStats('day');
    restoreSettings();
    syncButtons();
    startLiveLoop();
  }

  init();

  // Save UI inputs when they change (no browser message)
  const uiFields = ['titleInput','pageStart','pageEnd','probStart','probEnd','probSolvedManual','correctCnt','wrongCnt','inH','inM','inS'];
  uiFields.forEach(id => $(id).addEventListener('input', () => {
    const ui = loadJSON(LS.UI, {});
    ui.title = $('titleInput').value;
    ui.workbookId = $('workbookSelect').value;
    saveJSON(LS.UI, ui);
    if($('liveSaveToggle').checked) snapshotSave(false);
  }));

  // keep prob auto updated
  document.querySelectorAll('input[name="probMode"]').forEach(r => r.addEventListener('change', () => {
    updateProbAuto();
    syncButtons();
  }));

  // Close modals on backdrop click
  function backdropClose(backId){
    const b = $(backId);
    b.addEventListener('click', (e) => { if(e.target===b) b.style.display='none'; });
  }
  backdropClose('detailBack');
  backdropClose('wbBack');
  backdropClose('palBack');
  backdropClose('msgBack');

})();

  function toast(message){
    // v6.2.5: 알림바/알림목록으로만 표시합니다.
    try{
      if(typeof pushNotice === 'function') pushNotice(String(message));
    }catch(e){}
  }

  // ===== Color wheel + brightness (v6.1.1) =====
  const CW_KEY = 'ST_CW_HSV';
  function openModal(id){ const m=document.getElementById(id); if(!m) return; m.setAttribute('aria-hidden','false'); }
  function closeModal(id){ const m=document.getElementById(id); if(!m) return; m.setAttribute('aria-hidden','true'); }
  document.addEventListener('click', (e)=>{
    const t=e.target;
    if(t && t.dataset && t.dataset.close){ closeModal(t.dataset.close); }
  });
  const openBtn = document.getElementById('openColorWheelBtn');
  if(openBtn) openBtn.addEventListener('click', ()=> openModal('colorWheelModal'));

  function hsvToRgb(h,s,v){
    h=((h%360)+360)%360; s=Math.max(0,Math.min(1,s)); v=Math.max(0,Math.min(1,v));
    const c=v*s, x=c*(1-Math.abs(((h/60)%2)-1)), m=v-c;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}
    else if(h<120){r=x;g=c;}
    else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}
    else if(h<300){r=x;b=c;}
    else {r=c;b=x;}
    return {r:Math.round((r+m)*255), g:Math.round((g+m)*255), b:Math.round((b+m)*255)};
  }
  function rgbToHex(r,g,b){
    const to=n=>String(n.toString(16)).padStart(2,'0');
    return ('#'+to(r)+to(g)+to(b)).toUpperCase();
  }
  function setAccent(hex){
    document.documentElement.style.setProperty('--accent', hex);
  }

  let cw = {h:210, s:0.78, v:1.0};

  function loadCW(){
    try{
      const raw = localStorage.getItem(CW_KEY);
      if(raw){ const o=JSON.parse(raw);
        if(o && typeof o.h==='number' && typeof o.s==='number' && typeof o.v==='number') cw={h:o.h,s:o.s,v:o.v};
      }
    }catch(e){}
  }
  function saveCW(){
    try{ localStorage.setItem(CW_KEY, JSON.stringify(cw)); }catch(e){}
  }
  function applyCWToUI(){
    const rgb = hsvToRgb(cw.h,cw.s,cw.v);
    const hex = rgbToHex(rgb.r,rgb.g,rgb.b);
    setAccent(hex);
    const sw=document.getElementById('cwSwatch'); if(sw) sw.style.background=hex;
    const hx=document.getElementById('cwHex'); if(hx) hx.textContent=hex;
    const topRGB = hsvToRgb(cw.h,cw.s,1);
    const topHex = rgbToHex(topRGB.r, topRGB.g, topRGB.b);
    const bar=document.getElementById('cwBrightBar'); if(bar) bar.style.background=`linear-gradient(to top, #000, ${topHex})`;
  }
  function drawWheel(){
    const c=document.getElementById('cwCanvas'); if(!c) return;
    const ctx=c.getContext('2d');
    const w=c.width,h=c.height,cx=w/2,cy=h/2,r=Math.min(cx,cy)-2;
    const img=ctx.createImageData(w,h);
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const dx=x-cx, dy=y-cy;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const i=(y*w+x)*4;
        if(dist>r){ img.data[i+3]=0; continue; }
        const ang=Math.atan2(dy,dx);
        const hue=(ang*180/Math.PI+360)%360;
        const sat=Math.min(1, dist/r);
        const rgb=hsvToRgb(hue,sat,1);
        img.data[i]=rgb.r; img.data[i+1]=rgb.g; img.data[i+2]=rgb.b; img.data[i+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
  }
  function placeKnobs(){
    const c=document.getElementById('cwCanvas');
    const knob=document.getElementById('cwKnob');
    if(c && knob){
      const rect=c.getBoundingClientRect();
      const r=rect.width/2-2, cx=rect.width/2, cy=rect.height/2;
      const ang=cw.h*Math.PI/180;
      const dist=cw.s*r;
      knob.style.left = (cx + Math.cos(ang)*dist) + 'px';
      knob.style.top  = (cy + Math.sin(ang)*dist) + 'px';
    }
    const track=document.getElementById('cwBrightTrack');
    const k=document.getElementById('cwBrightKnob');
    if(track && k){
      const rect=track.getBoundingClientRect();
      const top=6, bottom=rect.height-6;
      const y = bottom - cw.v*(bottom-top);
      k.style.top = y + 'px';
    }
    const slider=document.getElementById('cwBright');
    if(slider) slider.value = String(Math.round(cw.v*100));
  }
  function pickWheel(clientX, clientY){
    const c=document.getElementById('cwCanvas'); if(!c) return;
    const rect=c.getBoundingClientRect();
    const x=clientX-rect.left, y=clientY-rect.top;
    const cx=rect.width/2, cy=rect.height/2;
    const dx=x-cx, dy=y-cy;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const r=rect.width/2-2;
    if(dist>r) return;
    const ang=Math.atan2(dy,dx);
    cw.h=(ang*180/Math.PI+360)%360;
    cw.s=Math.max(0, Math.min(1, dist/r));
    applyCWToUI();
    placeKnobs();
  }

  function initCW(){
    loadCW();
    applyCWToUI();
    drawWheel();
    placeKnobs();

    const c=document.getElementById('cwCanvas');
    if(c){
      let down=false;
      const downFn=(e)=>{ down=true; const p=(e.touches?e.touches[0]:e); pickWheel(p.clientX,p.clientY); e.preventDefault(); };
      const moveFn=(e)=>{ if(!down) return; const p=(e.touches?e.touches[0]:e); pickWheel(p.clientX,p.clientY); e.preventDefault(); };
      const upFn=()=>{ down=false; };
      c.addEventListener('mousedown', downFn);
      window.addEventListener('mousemove', moveFn);
      window.addEventListener('mouseup', upFn);
      c.addEventListener('touchstart', downFn, {passive:false});
      window.addEventListener('touchmove', moveFn, {passive:false});
      window.addEventListener('touchend', upFn);
    }

    const slider=document.getElementById('cwBright');
    if(slider){
      slider.addEventListener('input', ()=>{
        cw.v=Math.max(0, Math.min(1, Number(slider.value)/100));
        applyCWToUI();
        placeKnobs();
      });
    }

    const copy=document.getElementById('cwCopy');
    if(copy) copy.addEventListener('click', async ()=>{
      const hex = document.getElementById('cwHex')?.textContent || '';
      try{ await navigator.clipboard.writeText(hex); toast('복사되었습니다.'); }
      catch(e){ toast('복사에 실패했습니다.'); }
    });

    const apply=document.getElementById('cwApply');
    if(apply) apply.addEventListener('click', ()=>{
      saveCW();
      toast('색상이 적용되었습니다.');
      closeModal('colorWheelModal');
    });

    // apply immediately on load
    saveCW();
  }
  window.addEventListener('load', initCW);

  // ===== Notice system (v6.1.7) =====
  const NOTICE_KEY = 'ST_NOTICES';
  const NOTICE_AUTOCLEAR_KEY = 'ST_NOTICE_AUTOCLEAR';

  function fmtAmPm(ts){
    const d = new Date(ts);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = (h < 12) ? '오전' : '오후';
    h = h % 12; if(h === 0) h = 12;
    return `${ampm} ${h}:${String(m).padStart(2,'0')}`;
  }
  function loadNotices(){
    try{ const raw = localStorage.getItem(NOTICE_KEY); return raw ? (JSON.parse(raw) || []) : []; }
    catch(e){ return []; }
  }
  function saveNotices(arr){
    try{ localStorage.setItem(NOTICE_KEY, JSON.stringify(arr.slice(0,200))); }catch(e){}
  }
  function setTopNotice(item){
    const textEl = document.getElementById('noticeText');
    const timeEl = document.getElementById('noticeTime');
    const metaEl = document.getElementById('noticeMeta');
    if(item){
      if(textEl) textEl.textContent = item.text;
      if(timeEl) timeEl.textContent = fmtAmPm(item.ts);
      if(metaEl) metaEl.style.display = 'flex';
    }else{
      if(textEl) textEl.textContent = '알림은 여기서 표시됩니다.';
      if(timeEl) timeEl.textContent = '';
      if(metaEl) metaEl.style.display = 'none';
    }
  }
  function renderNoticeList(){
    const list = document.getElementById('noticeList');
    if(!list) return;
    const arr = loadNotices();
    list.innerHTML = '';
    if(arr.length === 0){
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.style.padding = '10px 6px';
      empty.textContent = '아직 알림가 없습니다.';
      list.appendChild(empty);
      return;
    }
    // v6.3.1: '전체' 선택 항목(알림 있을 때만)
    const allRow = document.createElement('div');
    allRow.className = 'noticeItem';
    allRow.innerHTML = `
      <input type="checkbox" class="noticePick noticePickAll" data-id="__ALL__" aria-label="전체 선택" />
      <div class="noticeItemBody">
        <div class="noticeItemText" style="font-weight:800">전체</div>
        <div class="noticeItemTime"></div>
      </div>
    `;
    list.appendChild(allRow);

    // 전체 토글 동작
    const allCb = allRow.querySelector('.noticePickAll');
    allCb.addEventListener('change', ()=>{
      const on = allCb.checked;
      list.querySelectorAll('.noticePick:not(.noticePickAll)').forEach(cb=> cb.checked = on);
    });

    // 개별 변경 시 전체 체크 동기화
    const syncAll = ()=>{
      const items = Array.from(list.querySelectorAll('.noticePick:not(.noticePickAll)'));
      const allOn = items.length>0 && items.every(cb=>cb.checked);
      allCb.checked = allOn;
    };
    list.addEventListener('change', (e)=>{
      const t=e.target;
      if(t && t.classList && t.classList.contains('noticePick') && !t.classList.contains('noticePickAll')){
        syncAll();
      }
    });

    arr.forEach((it)=>{
      const row = document.createElement('div');
      row.className = 'noticeItem';
      row.innerHTML = `
        <input type="checkbox" class="noticePick" data-id="${it.id}" aria-label="선택" />
        <div class="noticeItemBody">
          <div class="noticeItemText"></div>
          <div class="noticeItemTime">${fmtAmPm(it.ts)}</div>
        </div>
      `;
      row.querySelector('.noticeItemText').textContent = it.text;
      list.appendChild(row);
    });
  }
  
// v6.3.2: 알림 효과(단색 테두리 1바퀴 + 상단 5초 라인)
let __noticeFxTimer = null;
let __noticeSummaryTimer = null;
function startNoticeFx(){
  try{
    const svg = document.getElementById('noticeStrokeSvg');
    const prog = document.getElementById('noticeProgress');
    if(svg){
      svg.classList.remove('ringOn');
      void svg.offsetWidth; // restart
      svg.classList.add('ringOn');
      // ring fades shortly after
      setTimeout(()=>{ try{ svg.classList.remove('ringOn'); }catch(e){} }, 900);
    }
    if(prog){
      prog.classList.remove('progressOn');
      void prog.offsetWidth;
      prog.classList.add('progressOn');
      clearTimeout(__noticeFxTimer);
      __noticeFxTimer = setTimeout(()=>{ try{ prog.classList.remove('progressOn'); }catch(e){} }, 5200);
    }
  }catch(e){}
}

function pushNotice(text){
    const t = (text ?? '').toString().trim();
    if(!t) return;
    const arr = loadNotices();
    const item = {id: String(Date.now()) + '_' + Math.random().toString(16).slice(2), text: t, ts: Date.now()};
    arr.unshift(item);
    saveNotices(arr);
    setTopNotice(item);
    renderNoticeList();

    // Edge lighting + auto hide after 5 seconds (UI only)
    const edge = document.getElementById('noticeEdge');
    if(edge){
      edge.classList.add('on');
      clearTimeout(window.__edgeTimer);
      window.__edgeTimer = setTimeout(()=> edge.classList.remove('on'), 5000);
    }
    clearTimeout(window.__noticeAutoHideTimer);
    window.__noticeAutoHideTimer = setTimeout(()=>{
      // v6.3.1: 5초 후에는 알림를 지우지 않고(최신 알림 유지), 효과만 종료합니다.
      const edge = document.getElementById('noticeEdge');
      if(edge) edge.classList.remove('on');
    }, 5000);
  }
  function deleteNoticesByIds(ids){
    const set = new Set(ids);
    const arr = loadNotices().filter(it => !set.has(it.id));
    saveNotices(arr);
    setTopNotice(arr[0] || null);
    if(!(arr && arr.length)) /* v6.3.2: 최신 알림 유지 */
renderNoticeList();
  }
  function deleteTopNotice(){
    const arr = loadNotices();
    if(arr.length === 0) return;
    deleteNoticesByIds([arr[0].id]);
  }
  function autoClearOldNotices(){
    const sw = document.getElementById('noticeAutoClear');
    const on = sw ? sw.checked : false;
    if(!on) return;
    const cutoff = Date.now() - 3*60*1000;
    const arr = loadNotices();
    const keep = arr.filter(it => it.ts >= cutoff);
    if(keep.length !== arr.length){
      saveNotices(keep);
      setTopNotice(keep[0] || null);
      renderNoticeList();
    }
  }
  function openNoticePanel(){
    const p = document.getElementById('noticePanel');
    if(!p) return;
    p.setAttribute('aria-hidden','false');
    renderNoticeList();
  }
  function closeNoticePanel(){
    const p = document.getElementById('noticePanel');
    if(!p) return;
    p.setAttribute('aria-hidden','true');
  }
  function toggleNoticePanel(){
    const p = document.getElementById('noticePanel');
    if(!p) return;
    const open = p.getAttribute('aria-hidden') === 'false';
    (open ? closeNoticePanel : openNoticePanel)();
  }

  // Public: use this for all important messages
  function announce(msg){ pushNotice(msg); }

  window.addEventListener('load', ()=>{
    const sw = document.getElementById('noticeAutoClear');
    if(sw){
      const saved = (localStorage.getItem(NOTICE_AUTOCLEAR_KEY) || '0');
      sw.checked = (saved === '1');
      sw.addEventListener('change', ()=>{
        try{ localStorage.setItem(NOTICE_AUTOCLEAR_KEY, sw.checked ? '1' : '0'); }catch(e){}
        autoClearOldNotices();
      });
    }
    const arr = loadNotices();
    setTopNotice(arr[0] || null);

    const btn = document.getElementById('noticeDropBtn');
    if(btn) btn.addEventListener('click', (e)=>{ e.stopPropagation(); toggleNoticePanel(); });

    const delBtn = document.getElementById('noticeDelBtn');
    if(delBtn) delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); deleteTopNotice(); });

    document.addEventListener('click', (e)=>{
      const p = document.getElementById('noticePanel');
      const bar = document.getElementById('noticeBar');
      if(!p || !bar) return;
      if(p.getAttribute('aria-hidden') === 'false' && !bar.contains(e.target)){
        closeNoticePanel();
      }
    });

    const clearBtn = document.getElementById('noticeClearBtn');
    if(clearBtn){
      clearBtn.addEventListener('click', ()=>{
        const picks = Array.from(document.querySelectorAll('.noticePick'))
          .filter(cb=>cb.checked)
          .map(cb=>cb.getAttribute('data-id'));
        const arr = loadNotices();

        // v6.3.1: '전체'를 선택한 경우 -> 즉시 전체 삭제
        if(picks.includes('__ALL__')){
          deleteNoticesByIds(arr.map(x=>x.id));
          /* 삭제 알림은 표시하지 않습니다. */
          return;
        }

        if(picks.length === 0){
          // 기존 동작 유지(실수 방지용)
          if(window.__noticeClearArmed){
            window.__noticeClearArmed = false;
            deleteNoticesByIds(arr.map(x=>x.id));
            /* 삭제 알림은 표시하지 않습니다. */
          }else{
            window.__noticeClearArmed = true;
            pushNotice('전체 삭제를 원하시면 한 번 더 눌러 주세요.');
            setTimeout(()=> window.__noticeClearArmed = false, 2000);
          }
          return;
        }
        deleteNoticesByIds(picks);
        pushNotice('선택하신 알림가 삭제되었습니다.');
      });
    }

    setInterval(autoClearOldNotices, 15000);

    // ===== HARD BRIDGE: stop old top toast, store to notice instead =====
    try{
      // Remove any existing toast element (if present) to prevent overlay.
      const oldToast = document.getElementById('toast') || document.getElementById('toastHost');
      if(oldToast) oldToast.remove();

      // Override toast() used by the app
      window.toast = function(message){
        pushNotice(String(message));
      };

      // Override alert-like notifier if any
      window.notify = function(message){
        pushNotice(String(message));
      };
    }catch(e){}
  });


/* v6.3.8: (1) 상단 X=전체삭제 (2) 최신 알림 시간 고정(오전/오후 h:mm) (3) 2문장 알림은 반드시 줄바꿈 (4) +/NaN 시간 방지 */
(() => {
  const FX_MS = 5000;
  let summaryTimer = null;
  let barAnim = null;
  let glowTimer = null;
  let initialShown = false;

  function fmtApTime(d){
    let h=d.getHours(), m=d.getMinutes();
    const ap = h<12 ? '오전' : '오후';
    h = h%12; if(h===0) h=12;
    return `${ap} ${h}:${String(m).padStart(2,'0')}`;
  }

  function normalizeTwoLine(msg){
    const s = String(msg ?? '').trim();
    if(!s) return '';
    // 이미 줄바꿈 있으면 유지
    if(s.includes('\n')) return s;
    // 마침표/물음표/느낌표 뒤에 줄바꿈 강제(첫 문장만)
    const m = s.match(/^(.+?[\.!?])\s*(.+)$/);
    if(m) return `${m[1]}\n${m[2]}`;
    return s;
  }

  function loadArr(){
    try{
      if(typeof window.loadNotices === 'function'){
        const a = window.loadNotices();
        return Array.isArray(a) ? a : [];
      }
    }catch(e){}
    try{
      const a = JSON.parse(localStorage.getItem('studyTimer_notices') || "[]");
      return Array.isArray(a) ? a : [];
    }catch(e){}
    return [];
  }

  function saveArr(a){
    try{
      if(typeof window.saveNotices === 'function'){ window.saveNotices(a); return; }
    }catch(e){}
    try{ localStorage.setItem('studyTimer_notices', JSON.stringify(a||[])); }catch(e){}
  }

  function latestTimeStr(arr){
    if(!arr || !arr.length) return '';
    const last = arr[0];
    const ts = last && last.ts ? new Date(last.ts) : null;
    if(ts && !isNaN(ts.getTime())) return fmtApTime(ts);
    if(last && typeof last.timeStr === 'string' && last.timeStr.trim() && !/NaN/.test(last.timeStr)) return last.timeStr.trim();
    return fmtApTime(new Date());
  }

  function setTop(text, timeStr){
    const t = document.getElementById('noticeText');
    const meta = document.getElementById('noticeMeta');
    const timeEl = document.getElementById('noticeTime');
    if(!t) return;

    const has = !!(text && String(text).trim());
    t.textContent = normalizeTwoLine(text);

    if(meta && timeEl){
      const goodTime = (timeStr||'').trim();
      if(goodTime && !/NaN/.test(goodTime)){
        meta.style.display = '';
        timeEl.textContent = goodTime;
      }else{
        // 시간/버튼 숨김(알림 없을 때)
        meta.style.display = 'none';
        timeEl.textContent = '';
      }
    }
  }

  function setInitial(){
    setTop('알림은 여기서 표시됩니다.', '');
    initialShown = true;
  }

  function setZero(){
    setTop('알림이 0개입니다.\n현재 온 알림이 없습니다.', '');
    initialShown = true;
  }

  function updateSummary(keepWhenNoNew=false){
    const arr = loadArr();
    if(arr.length === 0){
      if(!initialShown) setInitial();
      else setZero();
      return;
    }
    // 알림창(리스트)에서 일부 삭제해도 '알림 n개' 유지하도록 옵션
    const timeStr = latestTimeStr(arr);
    setTop(`알림이 ${arr.length}개 왔습니다.`, timeStr);
  }

  function startFx(){
    const progBox = document.getElementById('noticeProgress');
    const span = progBox ? progBox.querySelector('span') : null;
    if(progBox && span){
      if(barAnim){ try{ barAnim.cancel(); }catch(e){} barAnim = null; }
      if(summaryTimer){ clearTimeout(summaryTimer); summaryTimer=null; }
      progBox.style.opacity='1';
      span.style.transformOrigin='right center'; // 오른쪽 고정, 오->좌로 줄어듦
      span.style.transform='scaleX(1)';
      barAnim = span.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:FX_MS,easing:'linear',iterations:1});
      barAnim.onfinish = () => { try{ progBox.style.opacity='0'; }catch(e){} };
      summaryTimer = setTimeout(()=>{ updateSummary(); }, FX_MS);
    }

    // 글로우 5초 유지(중복 꼬임 방지)
    const glow = document.getElementById('noticeGlow');
    if(glow){
      glow.style.opacity='1';
      if(glowTimer) clearTimeout(glowTimer);
      glowTimer = setTimeout(()=>{ glow.style.opacity='0'; }, FX_MS);
    }
  }

  // 전체삭제
  function clearAll(){
    try{
      if(typeof window.deleteNoticesByIds === 'function'){
        const arr = loadArr();
        window.deleteNoticesByIds(arr.map(x=>x.id));
      }else{
        saveArr([]);
      }
    }catch(e){
      try{ saveArr([]); }catch(_){}
    }
    setZero();
    try{ if(typeof window.renderNoticeList === 'function') window.renderNoticeList(); }catch(e){}
  }

  // 상단 X(#noticeDelBtn)를 전체삭제로 강제(기존 리스너보다 먼저, 그리고 완전 차단)
  function hijackTopX(){
    const btn = document.getElementById('noticeDelBtn');
    if(!btn || btn.__hijacked638) return;
    btn.__hijacked638 = true;
    btn.title = '전체 알림 삭제';
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      clearAll();
    }, true);
  }

  // 삭제 기능이 '삭제되었습니다' 같은 알림을 만들면 차단
  function suppressDeleteNotices(){
    const orig = window.pushNotice;
    if(typeof orig !== 'function' || window.__pushWrapped638) return;
    window.pushNotice = function(msg){
      const s = (typeof msg === 'string') ? msg : (msg && msg.text ? String(msg.text) : '');
      if(/삭제|지웠|초기화/.test(s)) return;
      // timeStr/ts 보강
      let r = orig.apply(this, arguments);
      try{
        const arr = loadArr();
        if(arr.length){
          const it = arr[0];
          if(it && (!it.ts || isNaN(new Date(it.ts).getTime()))){
            it.ts = Date.now();
          }
          if(it && (!it.timeStr || !String(it.timeStr).trim() || /NaN/.test(String(it.timeStr)))){
            it.timeStr = fmtApTime(new Date(it.ts || Date.now()));
          }
          saveArr(arr);
        }
        // 바로 표시 + FX 리셋
        const arr2 = loadArr();
        if(arr2.length){
          setTop(normalizeTwoLine(arr2[0].text || arr2[0].msg || s), latestTimeStr(arr2));
        }
        startFx();
      }catch(e){}
      return r;
    };
    window.__pushWrapped638 = true;
  }

  // 3분 경계 자동삭제: 알림창이 열려 있어도 즉시 반영
  function boundaryPurge(){
    const now = new Date();
    if(now.getSeconds() !== 0) return;
    if(now.getMinutes() % 3 !== 0) return;
    const boundary = new Date(now); boundary.setMilliseconds(0);

    const arr = loadArr();
    if(!arr.length) return;

    const keep = [];
    for(const it of arr){
      let d = null;
      if(it && it.ts){ d = new Date(it.ts); if(isNaN(d.getTime())) d=null; }
      if(!d){ keep.push(it); continue; }
      if(d.getTime() >= boundary.getTime()) keep.push(it);
    }
    if(keep.length !== arr.length){
      saveArr(keep);
      try{ if(typeof window.renderNoticeList === 'function') window.renderNoticeList(); }catch(e){}
      if(keep.length===0) setZero();
      else setTop(`알림이 ${keep.length}개 왔습니다.`, latestTimeStr(keep));
    }
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    hijackTopX();
    suppressDeleteNotices();
    updateSummary();
    setInterval(boundaryPurge, 1000);
  });
})();


// ===== Auto Update (GitHub Pages manifest) =====
// 버전은 여기만 바꾸면 상단 v표시/업데이트 비교에 같이 반영돼요.
// 현재 앱 버전 (manifest.json의 latest와 비교)
window.APP_VERSION = "6.3.16";
const UPDATE_MANIFEST_URL = "https://happynuri-codefair.github.io/study-timer-update/manifest.json";

(function initUpdateUI() {
  function $(id) { return document.getElementById(id); }

  const verEl = $("verLabel");
  if (verEl) verEl.textContent = "v" + APP_VERSION;

  const autoToggle = $("autoUpdateToggle");
  if (autoToggle) {
    autoToggle.checked = (localStorage.getItem("autoUpdate") === "on");
    autoToggle.addEventListener("change", () => {
      localStorage.setItem("autoUpdate", autoToggle.checked ? "on" : "off");
      // 켰을 때 즉시 1회 확인
      if (autoToggle.checked) checkForUpdate(true);
    });
  }

  const btn = $("updateBtn");
  if (btn) btn.addEventListener("click", () => openPasteUpdateModal());

  // 자동 업데이트: 1분마다 확인
  setInterval(() => {
    if (localStorage.getItem("autoUpdate") === "on") checkForUpdate(true);
  }, 60 * 1000);
})();

async function checkForUpdate(auto = false) {
  try {
    const res = await fetch(UPDATE_MANIFEST_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    const latest = (data && data.latest) ? String(data.latest).trim() : "";
    const url = (data && data.url) ? String(data.url).trim() : "";
    const notes = (data && data.notes) ? String(data.notes).trim() : "";

    if (!latest) {
      if (!auto) announce("업데이트 정보(manifest)가 비어 있습니다.");
      return;
    }

    if (latest !== APP_VERSION) {
      // 업데이트 알림: 클릭하면 새 버전 열기
      const msg = `업데이트가 있습니다.
현재: v${APP_VERSION}  →  최신: v${latest}` + (notes ? `

${notes}` : "");
      // 이 앱은 알림 시스템이 있으니 거기에 띄우고, 클릭 시 url 열기
      if (typeof announce === "function") {
        announce(msg);
      } else {
        alert(msg);
      }
      if (url) {
        // 사용자가 바로 열고 싶을 때를 위해, 자동이 아니면 바로 열기 버튼 느낌으로 confirm
        if (!auto) {
          const ok = confirm("새 버전을 새 탭에서 열까요?");
          if (ok) window.open(url, "_blank");
        }
      }
    } else {
      if (!auto) announce("현재 최신 버전입니다.");
    }
  } catch (e) {
    if (!auto) announce("업데이트 확인에 실패했습니다.
" + (e && e.message ? e.message : ""));
  }
}


// ===== Paste-update feature =====
  // 수동 HTML 붙여넣기(로컬 오버라이드) 저장 키
  const PASTE_UPDATE_KEY = 'ST_OVERRIDE_HTML';

function openPasteUpdateModal(){
  const m = document.getElementById('pasteUpdateModal');
  if(!m) return;
  const ta = document.getElementById('pasteUpdateTextarea');
  const msg = document.getElementById('pasteUpdateMsg');
  if(msg){ msg.style.display='none'; msg.textContent=''; }
  if(ta) ta.value='';
  m.style.display='block';
  m.setAttribute('aria-hidden','false');
  ta?.focus();
}
function closePasteUpdateModal(){
  const m = document.getElementById('pasteUpdateModal');
  if(!m) return;
  m.style.display='none';
  m.setAttribute('aria-hidden','true');
}
function showPasteUpdateError(text){
  const msg = document.getElementById('pasteUpdateMsg');
  if(!msg) return;
  msg.textContent = text;
  msg.style.display='block';
}
function applyPastedHtml(raw){
  const html = (raw||'').trim();
  if(!html) return showPasteUpdateError('붙여넣은 내용이 비어 있어요.');
  if(!/<!doctype\s+html/i.test(html) || !/<html[\s>]/i.test(html) || !/<\/html>\s*$/i.test(html)){
    return showPasteUpdateError('HTML 전체를 붙여넣어야 해요. (<!doctype html> ~ </html> 포함)');
  }
  // 간단 안전장치: 너무 짧은 값 방지
  if(html.length < 2000){
    return showPasteUpdateError('HTML이 너무 짧아요. 전체를 복사했는지 확인해줘.');
  }
  try{
    localStorage.setItem(PASTE_UPDATE_KEY, html);
    localStorage.setItem(PASTE_UPDATE_KEY + '_savedAt', String(Date.now()));
    // 다음 로드 때 오버라이드가 적용되도록
    sessionStorage.removeItem('STUDY_TIMER__OVERRIDE_LOADED');
    location.reload();
  }catch(e){
    showPasteUpdateError('저장에 실패했어요. (브라우저 저장공간 부족/권한 문제)');
  }
}
function resetPastedUpdate(){
  try{
    localStorage.removeItem(PASTE_UPDATE_KEY);
    localStorage.removeItem(PASTE_UPDATE_KEY + '_savedAt');
    sessionStorage.removeItem('STUDY_TIMER__OVERRIDE_LOADED');
    showNotice('업데이트를 초기화했습니다. (기본 버전으로 돌아갑니다.)', 'info');
    // nooverride로 한 번 로드해서 오버라이드 방지
    const url = new URL(location.href);
    url.searchParams.set('nooverride','1');
    location.href = url.toString();
  }catch(e){
    showNotice('초기화에 실패했습니다.', 'error');
  }
}

// modal events
(function bindPasteUpdateUI(){
  const m = document.getElementById('pasteUpdateModal');
  if(!m) return;
  m.querySelector('.pasteUpdateBackdrop')?.addEventListener('click', closePasteUpdateModal);
  document.getElementById('pasteUpdateClose')?.addEventListener('click', closePasteUpdateModal);
  document.getElementById('pasteUpdateCancel')?.addEventListener('click', closePasteUpdateModal);
  document.getElementById('pasteUpdateApply')?.addEventListener('click', () => {
    const ta = document.getElementById('pasteUpdateTextarea');
    applyPastedHtml(ta?.value || '');
  });
  document.getElementById('pasteUpdateReset')?.addEventListener('click', () => {
    if(confirm('붙여넣기 업데이트를 초기화하고 기본 버전으로 돌아갈까요?')) resetPastedUpdate();
  });
  // ESC to close
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && m.style.display === 'block') closePasteUpdateModal();
  });
})();


// ===== Update check (manifest.json) + UI reactions (v1) =====
(() => {
  // ---- Configure ----
  const APP_VERSION = window.APP_VERSION || "0.0.0";
  const MANIFEST_URL = "https://happynuri-codefair.github.io/study-timer-update/manifest.json";
  const STORE_KEY = "ST_AUTO_UPDATE_CHECK";

  const els = {
    verLabel: document.getElementById('verLabel'),
    updateBtn: document.getElementById('updateBtn'),
    autoToggle: document.getElementById('autoUpdateToggle'),
  };

  function safeNotice(msg){
    try{
      if(typeof window.pushNotice === "function") window.pushNotice(String(msg));
      else if(typeof window.announce === "function") window.announce(String(msg));
    }catch(e){}
  }
  function safeModal(title, bodyHtml){
    try{
      if(typeof window.showModalMessage === "function") window.showModalMessage(title, bodyHtml);
      else safeNotice(title + " - " + bodyHtml.replace(/<[^>]+>/g,''));
    }catch(e){ safeNotice(title); }
  }

  function setVersionLabel(){
    if(els.verLabel) els.verLabel.textContent = "v" + APP_VERSION;
  }

  function cmpVer(a,b){
    const pa = String(a||"").split(".").map(x=>parseInt(x,10));
    const pb = String(b||"").split(".").map(x=>parseInt(x,10));
    const n = Math.max(pa.length, pb.length, 3);
    for(let i=0;i<n;i++){
      const x = Number.isFinite(pa[i]) ? pa[i] : 0;
      const y = Number.isFinite(pb[i]) ? pb[i] : 0;
      if(x>y) return 1;
      if(x<y) return -1;
    }
    return 0;
  }

  async function fetchManifest(){
    const url = MANIFEST_URL + (MANIFEST_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
    const res = await fetch(url, {cache:"no-store"});
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  async function checkForUpdates({quiet=false} = {}){
    try{
      if(!quiet) safeNotice("업데이트 확인 중…");
      const m = await fetchManifest();
      const latest = m.latest || "";
      const notes = m.notes || "";
      const url = m.url || "";
      const c = cmpVer(latest, APP_VERSION);

      if(!latest){
        if(!quiet) safeModal("업데이트", "업데이트 정보에 <b>latest</b>가 없습니다.");
        return {status:"unknown", manifest:m};
      }

      if(c <= 0){
        if(!quiet){
          safeModal("업데이트", `이미 최신 버전입니다.<br><b>현재</b>: v${APP_VERSION}<br><b>최신</b>: v${latest}`);
        }
        return {status:"latest", manifest:m};
      }

      const safeNotes = String(notes||"")
        .replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/
/g,"<br>");
      safeModal("업데이트 가능",
        `새 버전이 있습니다!<br><b>현재</b>: v${APP_VERSION}<br><b>최신</b>: v${latest}` +
        `<br><br><b>변경사항</b><br>${safeNotes}` +
        (url ? `<br><br><a href="${url}" target="_blank" rel="noopener">업데이트 페이지 열기</a>` : "")
      );
      return {status:"available", manifest:m};
    }catch(err){
      if(!quiet){
        safeModal("업데이트 오류",
          `업데이트 정보를 불러오지 못했습니다.<br><span class="small">(${String(err.message||err)})</span>`
        );
      }
      return {status:"error", error:err};
    }
  }

  function initAutoToggle(){
    if(!els.autoToggle) return;
    const saved = localStorage.getItem(STORE_KEY);
    const on = (saved == null) ? true : (saved === "1");
    els.autoToggle.checked = on;
    els.autoToggle.addEventListener("change", () => {
      localStorage.setItem(STORE_KEY, els.autoToggle.checked ? "1" : "0");
      safeNotice(els.autoToggle.checked ? "자동 업데이트 확인: ON" : "자동 업데이트 확인: OFF");
    });
  }

  function hookUpdateButton(){
    if(!els.updateBtn) return;
    els.updateBtn.addEventListener("click", () => checkForUpdates({quiet:false}));
  }

  function hookManualHtmlUpdate(){
    const openBtn = document.getElementById("manualHtmlUpdateBtn");
    const back = document.getElementById("htmlUpdateBack");
    const closeBtn = document.getElementById("htmlUpdateClose");
    const applyBtn = document.getElementById("htmlUpdateApply");
    const clearBtn = document.getElementById("htmlUpdateClear");
    const ta = document.getElementById("htmlUpdateTextarea");
    if(!openBtn || !back || !ta) return;

    function open(){
      back.style.display = "flex";
      ta.value = "";
      ta.focus();
    }
    function close(){ back.style.display = "none"; }

    openBtn.addEventListener("click", open);
    if(closeBtn) closeBtn.addEventListener("click", close);
    back.addEventListener("click", (e)=>{ if(e.target===back) close(); });

    if(applyBtn) applyBtn.addEventListener("click", ()=>{
      const v = (ta.value||"").trim();
      if(!(v.startsWith("<!doctype") || v.startsWith("<!DOCTYPE"))){
        safeModal("입력 오류",
          "붙여넣은 내용이 HTML 전체가 아닌 것 같아요.<br>맨 처음이 <b>&lt;!doctype html&gt;</b>로 시작하는지 확인해 주세요."
        );
        return;
      }
      try{
        localStorage.setItem("ST_OVERRIDE_HTML", v);
        safeNotice("로컬 HTML 업데이트를 적용했습니다. 새로고침합니다…");
        location.reload();
      }catch(e){
        safeModal("저장 실패", "브라우저 저장공간이 부족하거나 권한이 없습니다.");
      }
    });

    if(clearBtn) clearBtn.addEventListener("click", ()=>{
      try{
        localStorage.removeItem("ST_OVERRIDE_HTML");
        safeNotice("로컬 HTML 업데이트를 제거했습니다. 새로고침합니다…");
        location.reload();
      }catch(e){}
    });
  }

  function hookDownloadButton(){
    const btn = document.getElementById("downloadBtn");
    if(!btn) return;
    btn.addEventListener("click", async ()=>{
      try{
        safeNotice("HTML 파일을 만드는 중…");
        const bust = "?t=" + Date.now();
        const [html, css, js] = await Promise.all([
          fetch("index.html" + bust, {cache:"no-store"}).then(r=>r.text()),
          fetch("app.css" + bust, {cache:"no-store"}).then(r=>r.text()),
          fetch("app.js" + bust, {cache:"no-store"}).then(r=>r.text()),
        ]);

        // index.html 안의 외부 참조를 인라인으로 바꾸기
        let out = html;
        out = out.replace(/<link[^>]*href=["']app\.css["'][^>]*>/i, `<style>\n${css}\n</style>`);
        out = out.replace(/<script[^>]*src=["']app\.js["'][^>]*><\/script>/i, `<script>\n${js}\n<\/script>`);

        const blob = new Blob([out], {type:"text/html;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `study_timer_offline_v${APP_VERSION}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 5000);
        safeNotice("다운로드를 시작했습니다.");
      }catch(e){
        safeModal("다운로드 실패", "이 기능은 GitHub Pages(https)에서 더 잘 동작합니다.\n그래도 안 되면 브라우저 다운로드 권한을 확인해줘.");
      }
    });
  }

  window.addEventListener("load", async () => {
    setVersionLabel();
    initAutoToggle();
    hookUpdateButton();
    hookManualHtmlUpdate();
    hookDownloadButton();

    const auto = document.getElementById("autoUpdateToggle");
    const on = auto ? auto.checked : true;
    if(on) await checkForUpdates({quiet:true});
  });
})();
