// pauseOverlay.js - Floating pause reminder with reason & +5m extension
(function(){
  const OVERLAY_ID = 'ndx-pause-reminder';
  let intervalId = null;
  let lastPauseUntil = null;

  function formatRemaining(ms){
    if(ms < 0) ms = 0;
    const s = Math.floor(ms/1000);
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s % 60;
    const parts = [];
    if(h) parts.push(h+'h');
    if(m || h) parts.push(m+'m');
    parts.push(sec+'s');
    return parts.join(' ');
  }
  function removeOverlay(){
    const el = document.getElementById(OVERLAY_ID);
    if(el) el.remove();
    if(intervalId){ clearInterval(intervalId); intervalId = null; }
    lastPauseUntil = null;
  }
  function updateCountdown(pauseUntil){
    const wrap = document.getElementById(OVERLAY_ID);
    if(!wrap) return;
    const cd = wrap.querySelector('.ndx-pr-count');
    if(!cd) return;
    const diff = pauseUntil - Date.now();
    if(diff <= 0){
      chrome.storage.sync.set({ pauseToggle:false, pauseUntil:null, pauseReason:null });
      removeOverlay();
      return;
    }
    const txt = formatRemaining(diff);
    if(cd.textContent !== txt) cd.textContent = txt;
  }
  function extendFiveMinutes(){
    chrome.storage.sync.get(['pauseToggle','pauseUntil'], data => {
      if(!data.pauseToggle || !data.pauseUntil) return;
      const newUntil = data.pauseUntil + 5*60*1000;
      chrome.storage.sync.set({ pauseUntil: newUntil });
    });
  }
  function ensureOverlay(pauseUntil, reason){
    lastPauseUntil = pauseUntil;
    let el = document.getElementById(OVERLAY_ID);
    if(!el){
      el = document.createElement('div');
      el.id = OVERLAY_ID;
      el.innerHTML = `
        <div class="ndx-pr-inner">
          <div class="ndx-pr-header">
            <span class="ndx-pr-title">Reminder</span>
            <div class="ndx-pr-actions">
              <button class="ndx-pr-add5" title="Add 5 minutes">+5m</button>
              <button class="ndx-pr-resume" title="Resume now">✕</button>
            </div>
          </div>
          <div class="ndx-pr-reason"></div>
          <div class="ndx-pr-timer"><span class="ndx-pr-count">--</span></div>
        </div>`;
      document.documentElement.appendChild(el);
      el.querySelector('.ndx-pr-resume').addEventListener('click', ()=>{
        chrome.storage.sync.set({ pauseToggle:false, pauseUntil:null, pauseReason:null });
      });
      el.querySelector('.ndx-pr-add5').addEventListener('click', extendFiveMinutes);
    }
    const reasonEl = el.querySelector('.ndx-pr-reason');
    if(reasonEl && reasonEl.textContent !== reason){ reasonEl.textContent = reason || 'Reminder'; }
    if(!intervalId){
      intervalId = setInterval(()=>{ if(lastPauseUntil) updateCountdown(lastPauseUntil); }, 1000);
    }
    updateCountdown(pauseUntil);
  }
  function applyPauseUI(){
    chrome.storage.sync.get(['pauseToggle','pauseUntil','pauseReason'], data => {
      if(data.pauseToggle && data.pauseUntil && Date.now() < data.pauseUntil){
        ensureOverlay(data.pauseUntil, data.pauseReason || 'Reminder');
      } else {
        removeOverlay();
      }
    });
  }
  chrome.storage.onChanged.addListener(changes => {
    if(changes.pauseToggle || changes.pauseUntil || changes.pauseReason){
      applyPauseUI();
    }
  });
  function injectStyles(){
    if(document.getElementById('ndx-pause-overlay-style')) return;
    const st = document.createElement('style');
    st.id = 'ndx-pause-overlay-style';
    st.textContent = `
      #${OVERLAY_ID}{position:fixed;z-index:999999;bottom:16px;right:16px;font-family:system-ui,Arial,sans-serif;max-width:260px;color:#f1f5f9;animation:ndx-pr-fade .35s ease;}
      #${OVERLAY_ID} .ndx-pr-inner{background:linear-gradient(145deg,#0f172a,#1e293b);border:1px solid #334155;border-radius:14px;padding:14px 16px 16px;box-shadow:0 4px 18px -4px rgba(0,0,0,.55),0 2px 4px -1px rgba(0,0,0,.4);backdrop-filter:blur(6px);}
      #${OVERLAY_ID} .ndx-pr-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;gap:8px;}
      #${OVERLAY_ID} .ndx-pr-title{font-size:13px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:#93c5fd;}
      #${OVERLAY_ID} .ndx-pr-actions{display:flex;gap:6px;}
      #${OVERLAY_ID} .ndx-pr-actions button{background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-size:11px;line-height:1;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background .2s,border-color .2s;}
      #${OVERLAY_ID} .ndx-pr-actions button:hover{background:#334155;border-color:#475569;}
      #${OVERLAY_ID} .ndx-pr-reason{font-size:14px;font-weight:500;line-height:1.35;margin:2px 0 10px;word-break:break-word;color:#f8fafc;}
      #${OVERLAY_ID} .ndx-pr-timer{display:flex;justify-content:center;align-items:center;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 12px;font-size:26px;font-weight:600;letter-spacing:1px;color:#38bdf8;text-shadow:0 0 4px rgba(56,189,248,.4);min-height:46px;}
      @keyframes ndx-pr-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @media (max-width:620px){#${OVERLAY_ID}{right:8px;left:8px;bottom:10px;max-width:none;}}
    `;
    document.documentElement.appendChild(st);
  }
  injectStyles();
  applyPauseUI();
  window.__ndxApplyPauseUI = applyPauseUI; // optional debug
})();
