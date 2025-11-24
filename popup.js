// === TAB SWITCH ===
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Dynamic default tab based on current active tab URL
function activateTab(name){
  const targetBtn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if(!targetBtn) return;
  targetBtn.click();
}

try {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs.length) return;
    const url = tabs[0].url || '';
    if (url.includes('youtube.com')) {
      activateTab('youtube');
    } else if (url.includes('facebook.com')) {
      activateTab('facebook');
    } else {
      // leave default (facebook) or could activate settings if preferred
    }
  });
} catch(_) {}

// === SAVE STATE TO STORAGE ===
const toggles = [
  "blockFacebook", "hideFacebookFeed", "hideFacebookStories", "hideRightSidebar",
  "hideFacebookReelsPage",
  "blockYouTube", "hideYTRecs", "hideYTShorts", "hideYTComments", "hideYTNext", "ytCourseMode",
  "pauseToggle",
  // New feature toggle
  "productiveFacebook"
];

toggles.forEach(id => {
  const el = document.getElementById(id);
  if(!el) return;
  chrome.storage.sync.get([id], data => {
    if(id === 'ytCourseMode'){
      el.checked = (typeof data[id] === 'boolean') ? data[id] : true; // default ON
    } else {
      el.checked = data[id] || false;
    }
  });
  el.addEventListener("change", () => {
    const update = { [id]: el.checked };
    if(id === 'pauseToggle'){
      if(el.checked){
        chrome.storage.sync.get(['pauseMinutes'], d => {
          const minutes = d.pauseMinutes || 5;
          const reason = (prompt('Why are you pausing?', '') || '').trim();
          const pauseUntil = Date.now() + minutes*60*1000;
          chrome.storage.sync.set({ pauseToggle:true, pauseUntil, pauseReason: reason || 'Reminder' });
        });
        return; // early exit; handled async
      } else {
        update.pauseUntil = null;
        update.pauseReason = null;
      }
    }
    chrome.storage.sync.set(update);
  });
});

// Reflect pause state text (optional UX improvement)
const pauseToggleEl = document.getElementById('pauseToggle');
function syncPauseLabel(){
  if(!pauseToggleEl) return;
  const label = pauseToggleEl.closest('label');
  chrome.storage.sync.get(['pauseToggle','pauseReason','pauseUntil'], data => {
    if(!label) return;
    if(data.pauseToggle && data.pauseUntil && Date.now() < data.pauseUntil){
      label.dataset.originalText = label.dataset.originalText || label.textContent;
      const remMs = data.pauseUntil - Date.now();
      const minsLeft = Math.max(0, Math.floor(remMs/60000));
      label.textContent = `Pause (\u2713 Running${data.pauseReason? ': '+ data.pauseReason: ''}${minsLeft? ' ~'+minsLeft+'m':''})`;
    } else if(label.dataset.originalText){
      label.textContent = label.dataset.originalText;
    }
  });
}
if(pauseToggleEl){
  syncPauseLabel();
  setInterval(syncPauseLabel, 30000); // update every 30s (lightweight)
}
chrome.storage.onChanged.addListener((changes, area)=>{
  if(area==='sync' && (changes.pauseToggle || changes.pauseReason || changes.pauseUntil)){
    syncPauseLabel();
  }
});

// === Pause Minutes ===
const pauseInput = document.getElementById("pauseMinutes");
chrome.storage.sync.get(["pauseMinutes"], data => {
  if (data.pauseMinutes) pauseInput.value = data.pauseMinutes;
});
pauseInput.addEventListener("change", () => {
  chrome.storage.sync.set({ pauseMinutes: parseInt(pauseInput.value) });
});

// === Facebook Blacklist UI ===
const fbListEl = document.getElementById('fbBlacklistList');
const fbEmptyEl = document.getElementById('fbBlacklistEmpty');
const fbClearBtn = document.getElementById('fbBlacklistClear');

function renderFbBlacklist(list){
  fbListEl.innerHTML = '';
  if(!list || list.length === 0){
    fbEmptyEl.style.display = 'block';
    fbClearBtn.style.display = 'none';
    return;
  }
  fbEmptyEl.style.display = 'none';
  fbClearBtn.style.display = 'inline-block';

  list.sort((a,b)=> b.addedAt - a.addedAt); // newest first
  list.forEach(entry => {
    const li = document.createElement('li');
    li.style.margin = '2px 0';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '4px';
    const link = document.createElement('a');
  const fullHref = entry.href.startsWith('http') ? entry.href : ('https://www.facebook.com/' + entry.href);
  link.href = fullHref;
    link.textContent = entry.title + (entry.type && entry.type !== 'unknown' ? ` (${entry.type[0]})` : '');
    link.target = '_blank';
    link.style.flex = '1';
    link.style.textDecoration = 'none';
    link.style.color = '#1877f2';
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove from blacklist';
    removeBtn.style.border = 'none';
    removeBtn.style.background = '#eee';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.padding = '0 6px';
    removeBtn.style.borderRadius = '3px';
    removeBtn.addEventListener('click', () => {
      chrome.storage.sync.get(['fbBlacklist'], data => {
        const newList = (data.fbBlacklist || []).filter(e => e.href !== entry.href);
        chrome.storage.sync.set({ fbBlacklist: newList });
      });
    });
    li.appendChild(link);
    li.appendChild(removeBtn);
    fbListEl.appendChild(li);
  });
}

chrome.storage.sync.get(['fbBlacklist'], data => {
  renderFbBlacklist(data.fbBlacklist || []);
});

fbClearBtn.addEventListener('click', () => {
  if(confirm('Clear entire Facebook blacklist?')){
    chrome.storage.sync.set({ fbBlacklist: [] });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if(area !== 'sync') return;
  if(changes.fbBlacklist){
    renderFbBlacklist(changes.fbBlacklist.newValue || []);
  }
  if(changes.ytPlaylists){
    renderYtPlaylists(changes.ytPlaylists.newValue || []);
  }
});

// === YouTube Playlists UI ===
const ytListEl = document.getElementById('ytPlaylistsList');
const ytEmptyEl = document.getElementById('ytPlaylistsEmpty');
const ytClearBtn = document.getElementById('ytPlaylistsClear');
const ytCompletedWrap = document.getElementById('ytCompletedWrap');
const ytCompletedList = document.getElementById('ytCompletedList');
const ytCompletedToggle = document.getElementById('ytCompletedToggle');
const ytCompletedChevron = document.getElementById('ytCompletedChevron');

if(ytCompletedToggle){
  ytCompletedToggle.addEventListener('click', () => {
    if(!ytCompletedList) return;
    const open = ytCompletedList.style.display !== 'none';
    ytCompletedList.style.display = open ? 'none' : 'block';
    if(ytCompletedChevron) ytCompletedChevron.textContent = open ? '▲' : '▼';
  });
}

function formatPct(pl){
  if(!pl || typeof pl.progressPct !== 'number') return '';
  return ` (${pl.progressPct}%)`;
}

function renderYtPlaylists(list){
  if(!ytListEl) return;
  // If course mode disabled, hide entire saved playlists UI (list, empty text, clear, completed section)
  try {
    chrome.storage.sync.get(['ytCourseMode'], data => {
      const enabled = data.ytCourseMode !== false; // default true
      const sectionHeader = document.querySelector('#youtube h4');
      const savedHeader = Array.from(document.querySelectorAll('#youtube h4')).find(h=>/Saved Playlists/i.test(h.textContent||''));
      if(!enabled){
        if(savedHeader) savedHeader.style.display = 'none';
        if(ytEmptyEl) ytEmptyEl.style.display = 'none';
        if(ytClearBtn) ytClearBtn.style.display = 'none';
        if(ytListEl) ytListEl.style.display = 'none';
        if(ytCompletedWrap) ytCompletedWrap.style.display = 'none';
        return; // do not render
      } else {
        if(savedHeader) savedHeader.style.display = '';
        if(ytListEl) ytListEl.style.display = '';
      }
      // proceed with normal rendering when enabled
      internalRender(list);
    });
  } catch(_){
    internalRender(list);
  }
}

function internalRender(list){
  // original body of renderYtPlaylists moved here
  ytListEl.innerHTML = '';
  if(ytCompletedList) ytCompletedList.innerHTML='';
  const arr = Array.isArray(list) ? list.slice() : [];
  arr.sort((a,b)=> (b.addedAt||0) - (a.addedAt||0));
  if(arr.length === 0){
    if(ytEmptyEl) ytEmptyEl.style.display = 'block';
    if(ytClearBtn) ytClearBtn.style.display = 'none';
    if(ytCompletedWrap) ytCompletedWrap.style.display = 'none';
    return;
  }
  if(ytEmptyEl) ytEmptyEl.style.display = 'none';
  if(ytClearBtn) ytClearBtn.style.display = 'inline-block';
  const active = [];
  const completed = [];
  arr.forEach(pl => {
    if (typeof pl.progressPct === 'number' && pl.progressPct >= 100) completed.push(pl); else active.push(pl);
  });

  const buildItem = (pl, listEl) => {
    const li = document.createElement('li');
    li.style.margin = '2px 0';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '4px';
    const link = document.createElement('a');
    const baseTitle = pl.title || pl.id || 'Untitled playlist';
    link.textContent = baseTitle + formatPct(pl);
    link.href = pl.url || ('https://www.youtube.com/playlist?list=' + encodeURIComponent(pl.id));
    link.target = '_blank';
    link.style.flex = '1';
    link.style.textDecoration = 'none';
    link.style.color = '#065fd4';
    if(pl.progressPct >= 100){
      link.style.textDecoration = 'line-through';
      link.style.opacity = '.75';
    }
    const meta = document.createElement('span');
    meta.style.fontSize = '11px';
    meta.style.opacity = '.7';
    const done = (pl.completedIds||[]).length;
    const total = pl.videoCount || 0;
    if(total){
      meta.textContent = `${done}/${total}`;
    }
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove playlist';
    removeBtn.style.border = 'none';
    removeBtn.style.background = '#eee';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.padding = '0 6px';
    removeBtn.style.borderRadius = '3px';
    removeBtn.addEventListener('click', () => {
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const current = Array.isArray(data.ytPlaylists) ? data.ytPlaylists : [];
        const next = current.filter(p => p.id !== pl.id);
        chrome.storage.sync.set({ ytPlaylists: next });
      });
    });
    li.appendChild(link);
    if(total) li.appendChild(meta);
    li.appendChild(removeBtn);
    listEl.appendChild(li);
  };

  active.forEach(pl => buildItem(pl, ytListEl));
  completed.forEach(pl => buildItem(pl, ytCompletedList));

  if(ytCompletedWrap){
    ytCompletedWrap.style.display = completed.length ? 'block' : 'none';
  }
}

if(ytClearBtn){
  ytClearBtn.addEventListener('click', () => {
    if(confirm('Clear all saved playlists?')){
      chrome.storage.sync.set({ ytPlaylists: [] });
    }
  });
}

chrome.storage.sync.get(['ytPlaylists'], data => {
  renderYtPlaylists(data.ytPlaylists || []);
});

// React to ytCourseMode changes to hide/show without needing playlists change
chrome.storage.sync.get(['ytCourseMode'], data => {
  const enabled = data.ytCourseMode !== false; // default true
  if(!enabled){
    // Force a re-render pass which will early hide
    renderYtPlaylists([]);
  } else {
    chrome.storage.sync.get(['ytPlaylists'], d2 => renderYtPlaylists(d2.ytPlaylists || []));
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if(area !== 'sync') return;
  if(changes.ytCourseMode){
    chrome.storage.sync.get(['ytPlaylists'], data => renderYtPlaylists(data.ytPlaylists || []));
  }
});
