// Inject Start Course buttons or stats boxes based on current state
function maybeInjectYouTubePlaylistButtons(existingList){
  const url = location.href;
  const params = new URLSearchParams(location.search);
  const playlistId = params.get('list');
  const isPurePlaylist = /\/playlist\?list=/.test(url) && !/watch\?/.test(url);
  const isWatchWithPlaylist = /watch\?/.test(url) && !!playlistId;
  if (!isPurePlaylist && !isWatchWithPlaylist) return; // nothing to do
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
            <div class="ndx-yt-course-box-row" data-role="progress"><span class="ndx-yt-completed-text">0/… Completed</span><div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions"><button class="ndx-yt-course-update">Update</button><button class="ndx-yt-course-delete">Delete</button></div>`;
          container.appendChild(box);
          box.dataset.playlistId = playlistId;
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
            <div class="ndx-yt-progress-meta"><span class="ndx-yt-progress-time-done">0s</span><span class="ndx-yt-progress-videos">0/… watched</span><span class="ndx-yt-progress-time-total">…</span></div>
            <div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div>
            <div class="ndx-yt-progress-summary">0% completed • … left</div>`;
          headerContents.appendChild(box);
          box.dataset.playlistId = playlistId;
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
