// progress.js - Track per-video completion within a playlist (pure & watch variants)
// Data model extension: each playlist entry in ytPlaylists may now have completedIds: string[]

function ndxGetPlaylistIdFromUrl(){
  const params = new URLSearchParams(location.search);
  return params.get('list');
}

function ndxComputeAndStoreProgress(playlistId, videoId, checked){
  if(!playlistId || !videoId) return;
  chrome.storage.sync.get(['ytPlaylists'], data => {
    const arr = Array.isArray(data.ytPlaylists) ? data.ytPlaylists : [];
    const idx = arr.findIndex(p=>p.id===playlistId);
    if(idx<0) return;
    const entry = arr[idx];
    if(!Array.isArray(entry.completedIds)) entry.completedIds = [];
    if(checked){
      if(!entry.completedIds.includes(videoId)) entry.completedIds.push(videoId);
    } else {
      entry.completedIds = entry.completedIds.filter(id=>id!==videoId);
    }
    const total = entry.videoCount || 0;
    const done = entry.completedIds.length;
    // compute completed seconds via stored per-video durations
    let completedSeconds = 0;
    if (entry.videoDurations && typeof entry.videoDurations === 'object') {
      entry.completedIds.forEach(id => { if (entry.videoDurations[id]) completedSeconds += entry.videoDurations[id]; });
    } else if (entry.totalDurationSeconds && total>0) {
      // fallback average distribution
      const avg = entry.totalDurationSeconds / total;
      completedSeconds = Math.round(avg * done);
    }
    entry.completedSeconds = completedSeconds;
    entry.progressPct = total > 0 ? Math.min(100, Math.round(done/total*100)) : 0;
    arr[idx] = entry;
    chrome.storage.sync.set({ ytPlaylists: arr }, () => {
      ndxRefreshProgressBars(entry);
    });
  });
}

function ndxRefreshProgressBars(entry){
  if(!entry) return;
  const { id: playlistId, progressPct=0, videoCount=0, completedIds=[], completedSeconds=0, totalDurationSeconds=0 } = entry;
  const done = completedIds.length;
  const leftSeconds = totalDurationSeconds ? Math.max(0, totalDurationSeconds - completedSeconds) : 0;
  // Pure playlist box
  document.querySelectorAll('.ndx-yt-course-box').forEach(box => {
    if(box.dataset.playlistId === playlistId){
      const bar = box.querySelector('.ndx-yt-progress-bar');
      if(bar && bar.style.width !== (progressPct + '%')) bar.style.width = progressPct + '%';
      const txt = box.querySelector('.ndx-yt-completed-text');
      const desiredCompleted = `${done}/${videoCount} Completed`;
      if(txt && txt.textContent !== desiredCompleted) txt.textContent = desiredCompleted;
    }
  });
  // Watch variant box
  document.querySelectorAll('.ndx-yt-course-box-watch').forEach(box => {
    if(box.dataset.playlistId === playlistId){
      const bar = box.querySelector('.ndx-yt-progress-bar'); if(bar && bar.style.width !== (progressPct + '%')) bar.style.width = progressPct + '%';
      const timeDoneEl = box.querySelector('.ndx-yt-progress-time-done');
      const timeTotalEl = box.querySelector('.ndx-yt-progress-time-total');
      const vidsEl = box.querySelector('.ndx-yt-progress-videos');
      const summaryEl = box.querySelector('.ndx-yt-progress-summary');
      const desiredDone = formatDuration(completedSeconds);
      if(timeDoneEl && timeDoneEl.textContent !== desiredDone) timeDoneEl.textContent = desiredDone;
      const desiredTotal = totalDurationSeconds ? formatDuration(totalDurationSeconds) : '…';
      if(timeTotalEl && timeTotalEl.textContent !== desiredTotal) timeTotalEl.textContent = desiredTotal;
      const desiredVids = `${done}/${videoCount} watched`;
      if(vidsEl && vidsEl.textContent !== desiredVids) vidsEl.textContent = desiredVids;
      const desiredSummary = `${progressPct}% completed • ${leftSeconds? formatDuration(leftSeconds): '0s'} left`;
      if(summaryEl && summaryEl.textContent !== desiredSummary) summaryEl.textContent = desiredSummary;
    }
  });
}

function ndxInjectCompletionCheckboxes(existingList){
  const playlistId = ndxGetPlaylistIdFromUrl();
  if(!playlistId) return;
  const entry = Array.isArray(existingList)? existingList.find(p=>p.id===playlistId): null;
  const completed = entry && Array.isArray(entry.completedIds) ? new Set(entry.completedIds) : new Set();

  // Apply flex reversal & center styling to menu containers then insert checkbox
  // Support both pure playlist (ytd-playlist-video-renderer) and watch panel (ytd-playlist-panel-video-renderer)
  const menus = document.querySelectorAll('#menu.style-scope.ytd-playlist-video-renderer, #menu.style-scope.ytd-playlist-panel-video-renderer');
  let injectedAny = false;
  menus.forEach(menu => {
    if(menu.classList.contains('ndx-course-menu-aug')) return; // already processed
    menu.classList.add('ndx-course-menu-aug');
    menu.style.display = 'flex';
    menu.style.justifyContent = 'center';
    menu.style.alignItems = 'center';
    menu.style.flexDirection = 'row';
    injectedAny = true;

    const host = document.createElement('div');
    host.className = 'ndx-course-check-host';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.title = 'Mark video completed';
    cb.className = 'ndx-course-check';
    // derive video id from parent anchor if possible
    let videoId = '';
    try {
      const parentRenderer = menu.closest('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer');
      if(parentRenderer){
        // Try standard thumbnail anchor first
        let a = parentRenderer.querySelector('a#thumbnail');
        if(!a) {
          // Fallback: any anchor with a watch URL
            a = Array.from(parentRenderer.querySelectorAll('a')).find(el => el.href && el.href.includes('watch?v='));
        }
        if(a && a.href){
          const pu = new URL(a.href);
          videoId = pu.searchParams.get('v') || '';
        }
      }
    } catch(_){ }
    if(videoId && completed.has(videoId)) cb.checked = true;
    cb.addEventListener('change', () => ndxComputeAndStoreProgress(playlistId, videoId, cb.checked));

    host.appendChild(cb);
    menu.prepend(host);
  });

  // After all checkboxes, update progress bars once
  if(entry && typeof entry.progressPct === 'number' && injectedAny){
    ndxRefreshProgressBars(entry);
  }
}
