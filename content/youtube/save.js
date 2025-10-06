// Save playlist entry & create stats box
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
  let videoCount = null; let totalDurationSeconds = null; let videoDurations = null;
    try {
      if (source === 'pure') {
        const stats = extractPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; videoDurations = stats.videoDurations || {}; }
      } else if (source === 'watch') {
        const stats = extractWatchPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; videoDurations = stats.videoDurations || {}; }
      }
    } catch(_){ }
    const entry = { id, title, url: canonicalUrl, addedAt: Date.now(), source, videoCount, totalDurationSeconds, videoDurations };
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
            <div class="ndx-yt-course-box-row" data-role="progress"><span class="ndx-yt-completed-text">0/${videoCount ?? '…'} Completed</span><div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions"><button class="ndx-yt-course-update">Update</button><button class="ndx-yt-course-delete">Delete</button></div>`;
          container.appendChild(box);
          box.dataset.playlistId = id;
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
            <div class="ndx-yt-progress-meta"><span class="ndx-yt-progress-time-done">0s</span><span class="ndx-yt-progress-videos">0/${videoCount ?? '…'} watched</span><span class="ndx-yt-progress-time-total">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></div>
            <div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div>
            <div class="ndx-yt-progress-summary">0% completed • ${videoCount ? (totalDurationSeconds? formatDuration(totalDurationSeconds) : '…') : '…'} left</div>`;
          headerContents.appendChild(box);
          box.dataset.playlistId = id;
          populateWatchPlaylistStats(box, id, [...list, entry]);
          attachWatchPlaylistBoxHandlers(box, id);
        }
      }
    });
  });
}
