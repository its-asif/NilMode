// Event handlers for playlist stats boxes (update/delete)
function attachPlaylistBoxHandlers(box, playlistId){
  const updateBtn = DOM.find('youtube.courseUpdateBtn', box);
  const deleteBtn = DOM.find('youtube.courseDeleteBtn', box);
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist into view?'); return; }
      chrome.storage.local.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          arr[idx].videoDurations = stats.videoDurations || {};
          ndxUpdatePlaylistEntryProgress(arr[idx]);
          chrome.storage.local.set({ ytPlaylists: arr }, () => {
            const countEl = DOM.find('youtube.courseCount', box);
            const durEl = DOM.find('youtube.courseDuration', box);
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
            ndxRefreshProgressBars(arr[idx]);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.local.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.local.set({ ytPlaylists: next }, () => {
          box.remove();
          const container = DOM.find('youtube.purePlaylistHeaderContainer');
          if (container && !DOM.find('youtube.courseBtnPure', container)) {
            const a = document.createElement('a');
            a.textContent = 'Start Course';
            a.href = 'javascript:void(0)';
            a.className = 'ndx-yt-course-btn ndx-yt-course-btn-pure';
            a.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'pure'));
            container.appendChild(a);
          }
          const h3 = DOM.find('youtube.watchPlaylistHeaderTitle');
          if (h3 && !DOM.find('youtube.courseBtnWatch', h3)) {
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
  const updateBtn = DOM.find('youtube.courseUpdateWatchBtn', box);
  const deleteBtn = DOM.find('youtube.courseDeleteWatchBtn', box);
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractWatchPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist?'); return; }
      chrome.storage.local.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          arr[idx].videoDurations = stats.videoDurations || {};
          ndxUpdatePlaylistEntryProgress(arr[idx]);
          chrome.storage.local.set({ ytPlaylists: arr }, () => {
            const countEl = DOM.find('youtube.courseCount', box);
            const durEl = DOM.find('youtube.courseDuration', box);
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
            ndxRefreshProgressBars(arr[idx]);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.local.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.local.set({ ytPlaylists: next }, () => {
          box.remove();
          const h3 = DOM.find('youtube.watchPlaylistHeaderTitle');
          if (h3 && !DOM.find('youtube.courseBtnWatch', h3)) {
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

