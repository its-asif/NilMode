// yt.js - YouTube playlist buttons, stats extraction, persistence

function ensurePlaylistButtonStyles(){
  if (document.getElementById('ndx-playlist-style')) return;
  const style = document.createElement('style');
  style.id = 'ndx-playlist-style';
  style.textContent = `
    .ndx-yt-course-btn { box-sizing:border-box;width:100%;max-width:340px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff !important;font-family:system-ui,Arial,sans-serif;font-size:14px;font-weight:600;text-align:center;padding:10px 14px;border-radius:8px;border:1px solid #1e40af;cursor:pointer;text-decoration:none !important;display:inline-block;letter-spacing:.3px;transition:background .18s ease,transform .15s ease,box-shadow .18s ease;margin:10px 0 4px;position:relative;}
    .ndx-yt-course-btn:hover { background:linear-gradient(135deg,#1d4ed8,#1e3a8a);box-shadow:0 4px 10px -2px rgba(0,0,0,.25); }
    .ndx-yt-course-btn:active { transform:translateY(1px); }
    @media (max-width:700px){ .ndx-yt-course-btn { max-width:100%; } }
    .ndx-yt-course-box {box-sizing:border-box;max-width:360px;width:100%;background:#0f172a;color:#f1f5f9;margin:10px 0 6px;padding:12px 14px;border:1px solid #1e293b;border-radius:10px;font-family:system-ui,Arial,sans-serif;font-size:13px;line-height:1.4;}
    .ndx-yt-course-box-row {margin:2px 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .ndx-yt-course-actions button {background:#1e40af;color:#fff;border:1px solid #1d4ed8;border-radius:5px;padding:4px 10px;font-size:12px;cursor:pointer;}
    .ndx-yt-course-actions button:hover {background:#1d4ed8;}
    .ndx-yt-progress {position:relative;flex:1;height:10px;background:#1e293b;border-radius:6px;overflow:hidden;min-width:120px;}
    .ndx-yt-progress-bar {position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);width:0%;transition:width .3s ease;}
    /* Watch variant condensed */
    .ndx-yt-course-box-watch {position:relative;box-sizing:border-box;display:block;width:100%;max-width:100%;background:#0f172a;color:#f1f5f9;border:1px solid #1e293b;border-radius:10px;padding:10px 12px;margin:10px 0;font-family:system-ui,Arial,sans-serif;font-size:12px;line-height:1.25;}
    .ndx-yt-course-box-watch-row1,.ndx-yt-course-box-watch-row2 {display:flex;flex-wrap:wrap;gap:18px 28px;align-items:center;margin:0 0 4px;}
    .ndx-yt-course-box-watch-row2 {margin:2px 0 0;}
    .ndx-yt-mini-block {display:flex;align-items:center;gap:4px;font-weight:500;}
    .ndx-yt-mini-label {font-size:10px;opacity:.65;background:#1e293b;padding:2px 4px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px;}
    .ndx-yt-progress-barline {height:8px;width:120px;background:#1e293b;border-radius:5px;overflow:hidden;position:relative;}
    .ndx-yt-course-box-watch-actions-corner {position:absolute;top:6px;right:6px;display:flex;gap:4px;}
    .ndx-yt-icon-btn {background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:4px 6px;font-size:11px;cursor:pointer;line-height:1;}
    .ndx-yt-icon-btn:hover {background:#334155;}
  `;
  document.documentElement.appendChild(style);
}

function parseYouTubeTime(str){
  const parts = str.split(':').map(p=>p.trim()).filter(Boolean);
  if (!parts.length) return 0;
  if (parts.length === 3) return (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]);
  if (parts.length === 2) return (+parts[0])*60 + (+parts[1]);
  return +parts[0];
}
function formatDuration(totalSeconds){
  if (totalSeconds == null) return '…';
  const h = Math.floor(totalSeconds/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = totalSeconds%60;
  if (h>0) return `${h}h ${m}m ${s}s`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

function extractPlaylistStatsFromDom(){
  try {
    const videoEls = document.querySelectorAll('#contents > ytd-playlist-video-renderer');
    if (!videoEls.length) return null;
    const videoCount = videoEls.length;
    let totalSeconds = 0;
    videoEls.forEach(vel => {
      const durBadge = vel.querySelector('#overlays ytd-thumbnail-overlay-time-status-renderer div.thumbnail-overlay-badge-shape badge-shape div.yt-badge-shape__text');
      if (durBadge && durBadge.textContent.trim()) {
        const parsed = parseYouTubeTime(durBadge.textContent.trim());
        if (!isNaN(parsed)) totalSeconds += parsed;
      }
    });
    return { videoCount, totalDurationSeconds: totalSeconds };
  } catch { return null; }
}
function extractWatchPlaylistStatsFromDom(){
  try {
    const itemNodes = document.querySelectorAll('#playlist-items ytd-playlist-panel-video-renderer');
    const videoCount = itemNodes.length;
    const badgeNodes = document.querySelectorAll('#playlist-items .yt-badge-shape__text');
    let totalSeconds = 0;
    badgeNodes.forEach(node => {
      const txt = node.textContent.trim();
      if (!txt) return;
      const parsed = parseYouTubeTime(txt);
      if (!isNaN(parsed)) totalSeconds += parsed;
    });
    if (!videoCount) return null;
    return { videoCount, totalDurationSeconds: totalSeconds };
  } catch { return null; }
}

function populatePlaylistStats(box, playlistId, list){
  const entry = Array.isArray(list)? list.find(p=>p.id===playlistId): null;
  if (!entry) return;
  let { videoCount, totalDurationSeconds } = entry;
  if (videoCount == null || totalDurationSeconds == null) {
    const stats = extractPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds;
      entry.videoCount = videoCount; entry.totalDurationSeconds = totalDurationSeconds;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){ arr[idx] = entry; chrome.storage.sync.set({ ytPlaylists: arr }); }
      });
    }
  }
  if (videoCount == null) return;
  const countEl = box.querySelector('.ndx-yt-count');
  const durEl = box.querySelector('.ndx-yt-duration');
  if (countEl) countEl.textContent = videoCount;
  if (durEl) durEl.textContent = formatDuration(totalDurationSeconds);
}
function populateWatchPlaylistStats(box, playlistId, list){
  const entry = Array.isArray(list)? list.find(p=>p.id===playlistId): null;
  if (!entry) return;
  let { videoCount, totalDurationSeconds } = entry;
  if (videoCount == null || totalDurationSeconds == null) {
    const stats = extractWatchPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds;
      entry.videoCount = videoCount; entry.totalDurationSeconds = totalDurationSeconds;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){ arr[idx] = entry; chrome.storage.sync.set({ ytPlaylists: arr }); }
      });
    }
  }
  if (videoCount == null) return;
  const countEl = box.querySelector('.ndx-yt-count');
  const durEl = box.querySelector('.ndx-yt-duration');
  if (countEl) countEl.textContent = videoCount;
  if (durEl) durEl.textContent = formatDuration(totalDurationSeconds);
}

function attachPlaylistBoxHandlers(box, playlistId){
  const updateBtn = box.querySelector('.ndx-yt-course-update');
  const deleteBtn = box.querySelector('.ndx-yt-course-delete');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist into view?'); return; }
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          chrome.storage.sync.set({ ytPlaylists: arr }, () => {
            const countEl = box.querySelector('.ndx-yt-count');
            const durEl = box.querySelector('.ndx-yt-duration');
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.sync.set({ ytPlaylists: next }, () => {
          box.remove();
          const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
          if (container && !container.querySelector('.ndx-yt-course-btn-pure')) {
            const a = document.createElement('a');
            a.textContent = 'Start Course';
            a.href = 'javascript:void(0)';
            a.className = 'ndx-yt-course-btn ndx-yt-course-btn-pure';
            a.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'pure'));
            container.appendChild(a);
          }
          const h3 = document.querySelector('#header-description > h3:nth-child(1)');
          if (h3 && !h3.querySelector('.ndx-yt-course-btn-watch')) {
            const btn = document.createElement('button');
            btn.textContent = 'Start Course';
            btn.className = 'ndx-yt-course-btn ndx-yt-course-btn-watch';
            btn.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'watch'));
            h3.appendChild(btn);
          }
        });
      });
    });
  }
}
function attachWatchPlaylistBoxHandlers(box, playlistId){
  const updateBtn = box.querySelector('.ndx-yt-course-update-watch');
  const deleteBtn = box.querySelector('.ndx-yt-course-delete-watch');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractWatchPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist?'); return; }
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          chrome.storage.sync.set({ ytPlaylists: arr }, () => {
            const countEl = box.querySelector('.ndx-yt-count');
            const durEl = box.querySelector('.ndx-yt-duration');
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.sync.set({ ytPlaylists: next }, () => {
          box.remove();
          const h3 = document.querySelector('#header-description > h3:nth-child(1)');
          if (h3 && !h3.querySelector('.ndx-yt-course-btn-watch')) {
            const btn = document.createElement('button');
            btn.textContent = 'Start Course';
            btn.className = 'ndx-yt-course-btn ndx-yt-course-btn-watch';
            btn.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'watch'));
            h3.appendChild(btn);
          }
        });
      });
    });
  }
}

function saveYouTubePlaylist(id, source){
  if (!id) return;
  const canonicalUrl = `https://www.youtube.com/playlist?list=${id}`;
  let title = '';
  const pureTitleEl = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div > div.yt-page-header-view-model__page-header-headline > div > yt-dynamic-text-view-model > h1 > span');
  if (pureTitleEl && pureTitleEl.textContent.trim()) title = pureTitleEl.textContent.trim();
  if (!title) {
    const watchTitleAnchor = document.querySelector('#header-description > h3:nth-child(1) > yt-formatted-string > a');
    if (watchTitleAnchor && watchTitleAnchor.textContent.trim()) title = watchTitleAnchor.textContent.trim();
  }
  if (!title) title = id;

  chrome.storage.sync.get(['ytPlaylists'], data => {
    const list = Array.isArray(data.ytPlaylists) ? data.ytPlaylists : [];
    if (list.some(p => p.id === id)) return;
    let videoCount = null; let totalDurationSeconds = null;
    try {
      if (source === 'pure') {
        const stats = extractPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; }
      } else if (source === 'watch') {
        const stats = extractWatchPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; }
      }
    } catch(_){ }
    const entry = { id, title, url: canonicalUrl, addedAt: Date.now(), source, videoCount, totalDurationSeconds };
    const estimatedSize = JSON.stringify([...list, entry]).length;
    if (estimatedSize > 7000) { alert('Playlist storage near limit. Consider pruning.'); return; }
    list.push(entry);
    chrome.storage.sync.set({ ytPlaylists: list }, () => {
      if (source === 'pure') {
        const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
        if (container) {
          const btn = container.querySelector('.ndx-yt-course-btn-pure');
          if (btn) btn.remove();
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box';
          box.innerHTML = `
            <div class="ndx-yt-course-box-row" data-role="counts">Videos: <span class="ndx-yt-count">${videoCount ?? '…'}</span></div>
            <div class="ndx-yt-course-box-row" data-role="duration">Total: <span class="ndx-yt-duration">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></div>
            <div class="ndx-yt-course-box-row" data-role="progress">Completed: <div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions"><button class="ndx-yt-course-update">Update</button><button class="ndx-yt-course-delete">Delete</button></div>`;
          container.appendChild(box);
          populatePlaylistStats(box, id, [...list, entry]);
          attachPlaylistBoxHandlers(box, id);
        }
      } else if (source === 'watch') {
        const h3 = document.querySelector('#header-description > h3:nth-child(1)');
        const headerContents = document.querySelector('#header-contents');
        if (h3) { const btn = h3.querySelector('.ndx-yt-course-btn-watch'); if (btn) btn.remove(); }
        if (headerContents) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box-watch';
          box.innerHTML = `
            <div class="ndx-yt-course-box-watch-actions-corner"><button class="ndx-yt-icon-btn ndx-yt-course-update-watch" title="Update stats">↻</button><button class="ndx-yt-icon-btn ndx-yt-course-delete-watch" title="Delete saved playlist">✕</button></div>
            <div class="ndx-yt-course-box-watch-row1"><span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Videos</span><span class="ndx-yt-count">${videoCount ?? '…'}</span></span><span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Time</span><span class="ndx-yt-duration">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></span></div>
            <div class="ndx-yt-course-box-watch-row2"><span class="ndx-yt-mini-block ndx-yt-progress-wrap"><span class="ndx-yt-mini-label">Completed</span><div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></span></div>`;
          headerContents.appendChild(box);
          populateWatchPlaylistStats(box, id, [...list, entry]);
          attachWatchPlaylistBoxHandlers(box, id);
        }
      }
    });
  });
}

function maybeInjectYouTubePlaylistButtons(existingList){
  const url = location.href;
  const params = new URLSearchParams(location.search);
  const playlistId = params.get('list');
  const isPurePlaylist = /\/playlist\?list=/.test(url) && !/watch\?/.test(url);
  const isWatchWithPlaylist = /watch\?/.test(url) && !!playlistId;
  if (!isPurePlaylist && !isWatchWithPlaylist) return;
  ensurePlaylistButtonStyles();
  if (isPurePlaylist) {
    const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
    if (container) {
      const alreadySaved = Array.isArray(existingList) && existingList.some(p => p.id === playlistId);
      if (alreadySaved) {
        if (!container.querySelector('.ndx-yt-course-box')) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box';
          box.innerHTML = `
            <div class="ndx-yt-course-box-row" data-role="counts">Videos: <span class="ndx-yt-count">…</span></div>
            <div class="ndx-yt-course-box-row" data-role="duration">Total: <span class="ndx-yt-duration">…</span></div>
            <div class="ndx-yt-course-box-row" data-role="progress">Completed: <div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions"><button class="ndx-yt-course-update">Update</button><button class="ndx-yt-course-delete">Delete</button></div>`;
          container.appendChild(box);
          populatePlaylistStats(box, playlistId, existingList);
          attachPlaylistBoxHandlers(box, playlistId);
        }
      } else if (!container.querySelector('.ndx-yt-course-btn-pure')) {
        const a = document.createElement('a');
        a.textContent = 'Start Course';
        a.href = 'javascript:void(0)';
        a.className = 'ndx-yt-course-btn ndx-yt-course-btn-pure';
        a.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'pure', existingList));
        container.appendChild(a);
      }
    }
  }
  if (isWatchWithPlaylist) {
    const h3 = document.querySelector('#header-description > h3:nth-child(1)');
    const headerContents = document.querySelector('#header-contents');
    if (h3) {
      const alreadySaved = Array.isArray(existingList) && existingList.some(p => p.id === playlistId);
      if (alreadySaved && headerContents) {
        if (!headerContents.querySelector('.ndx-yt-course-box-watch')) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box-watch';
          box.innerHTML = `
            <div class="ndx-yt-course-box-watch-actions-corner"><button class="ndx-yt-icon-btn ndx-yt-course-update-watch" title="Update stats">↻</button><button class="ndx-yt-icon-btn ndx-yt-course-delete-watch" title="Delete saved playlist">✕</button></div>
            <div class="ndx-yt-course-box-watch-row1"><span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Videos</span><span class="ndx-yt-count">…</span></span><span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Time</span><span class="ndx-yt-duration">…</span></span></div>
            <div class="ndx-yt-course-box-watch-row2"><span class="ndx-yt-mini-block ndx-yt-progress-wrap"><span class="ndx-yt-mini-label">Completed</span><div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></span></div>`;
          headerContents.appendChild(box);
          populateWatchPlaylistStats(box, playlistId, existingList);
          attachWatchPlaylistBoxHandlers(box, playlistId);
        }
      } else if (!h3.querySelector('.ndx-yt-course-btn-watch')) {
        const btn = document.createElement('button');
        btn.textContent = 'Start Course';
        btn.className = 'ndx-yt-course-btn ndx-yt-course-btn-watch';
        btn.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'watch'));
        h3.appendChild(btn);
      }
    }
  }
}
