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
  "blockYouTube", "hideYTRecs", "hideYTShorts", "hideYTComments", "hideYTNext",
  "pauseToggle",
  // New feature toggle
  "productiveFacebook",
  // Hide sponsored posts
  "hideSponsoredPosts"
];

toggles.forEach(id => {
  const el = document.getElementById(id);
  if(!el) return;
  chrome.storage.sync.get([id], data => {
    el.checked = data[id] || false;
  });
  el.addEventListener("change", () => {
    const update = { [id]: el.checked };
    if(id === 'pauseToggle' && el.checked === false){
      update.pauseUntil = null; // ensure cleared when manually unpausing
    }
    chrome.storage.sync.set(update);
  });
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

function renderYtPlaylists(list){
  if(!ytListEl) return;
  ytListEl.innerHTML = '';
  const arr = Array.isArray(list) ? list.slice() : [];
  arr.sort((a,b)=> (b.addedAt||0) - (a.addedAt||0));
  if(arr.length === 0){
    if(ytEmptyEl) ytEmptyEl.style.display = 'block';
    if(ytClearBtn) ytClearBtn.style.display = 'none';
    return;
  }
  if(ytEmptyEl) ytEmptyEl.style.display = 'none';
  if(ytClearBtn) ytClearBtn.style.display = 'inline-block';
  arr.forEach(pl => {
    const li = document.createElement('li');
    li.style.margin = '2px 0';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '4px';
    const link = document.createElement('a');
    link.textContent = pl.title || pl.id || 'Untitled playlist';
    link.href = pl.url || ('https://www.youtube.com/playlist?list=' + encodeURIComponent(pl.id));
    link.target = '_blank';
    link.style.flex = '1';
    link.style.textDecoration = 'none';
    link.style.color = '#065fd4';
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
    li.appendChild(removeBtn);
    ytListEl.appendChild(li);
  });
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
