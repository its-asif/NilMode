// Event handlers for playlist stats boxes (update/delete)
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
