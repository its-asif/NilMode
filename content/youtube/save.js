// Save playlist entry & create stats box
function saveYouTubePlaylist(id, source) {
  if (!id) return;
  const canonicalUrl = `https://www.youtube.com/playlist?list=${id}`;
  let title = '';
  // Try several selectors to find the playlist title (both for pure playlist view and watch panel view)
  const titleEl = DOM.find('youtube.playlistTitle');
  if (titleEl && titleEl.textContent.trim()) {
    title = titleEl.textContent.trim();
  }
  if (!title) title = id;
  chrome.storage.local.get(['ytPlaylists'], data => {
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
    } catch (_) { }
    const entry = { id, title, url: canonicalUrl, addedAt: Date.now(), source, videoCount, totalDurationSeconds, videoDurations };
    const estimatedSize = JSON.stringify([...list, entry]).length;
    if (estimatedSize > 400000) { alert('Playlist storage near limit. Consider pruning.'); return; }
    list.push(entry);
    chrome.storage.local.set({ ytPlaylists: list }, () => {
      if (source === 'pure') {
        const container = DOM.find('youtube.purePlaylistHeaderContainer');

        if (container) {
          const btn = DOM.find('youtube.courseBtnPure', container);
          if (btn) btn.remove();
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box';
          box.innerHTML = `
            <div class="ndx-yt-badge-row">
              <div class="ndx-yt-badge">🎓 <span class="ndx-yt-count">${videoCount ?? '…'}</span> videos</div>
              <div class="ndx-yt-badge">⏱️ <span class="ndx-yt-duration">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></div>
            </div>
            <div class="ndx-yt-progress-section">
              <div class="ndx-yt-progress-label">
                <span class="ndx-yt-completed-text">0/${videoCount ?? '…'} Completed</span>
                <span class="ndx-yt-pct-text">0%</span>
              </div>
              <div class="ndx-yt-progress">
                <div class="ndx-yt-progress-bar" style="width:0%"></div>
              </div>
              <div class="ndx-yt-progress-summary" style="margin-top: 8px; font-size: 11.5px; color: #94a3b8; font-weight: 500;">
                <span class="ndx-yt-progress-time-done">0s</span> done • <span class="ndx-yt-progress-time-left">${totalDurationSeconds ? formatDuration(totalDurationSeconds) : '…'}</span> left
              </div>
            </div>
            <div class="ndx-yt-course-actions">
              <button class="ndx-yt-course-update">🔄 Sync Stats</button>
              <button class="ndx-yt-course-delete">🗑️ Remove</button>
            </div>`;
          container.appendChild(box);
          box.dataset.playlistId = id;
          populatePlaylistStats(box, id, [...list, entry]);
          attachPlaylistBoxHandlers(box, id);
        }
      } else if (source === 'watch') {
        const h3 = DOM.find('youtube.watchPlaylistHeaderTitle');
        const headerContents = DOM.find('youtube.watchPlaylistHeaderContents');
        if (h3) { const btn = DOM.find('youtube.courseBtnWatch', h3); if (btn) btn.remove(); }
        if (headerContents) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box-watch';
          box.innerHTML = `
            <div class="ndx-yt-course-box-watch-actions-corner">
              <button class="ndx-yt-icon-btn ndx-yt-course-update-watch" title="Update stats">↻</button>
              <button class="ndx-yt-icon-btn ndx-yt-course-delete-watch" title="Delete saved playlist">✕</button>
            </div>
            <div class="ndx-yt-progress-meta">
              <span class="ndx-yt-progress-time-done">0s</span>
              <span class="ndx-yt-progress-videos">0/${videoCount ?? '…'} watched</span>
              <span class="ndx-yt-progress-time-total">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span>
            </div>
            <div class="ndx-yt-progress ndx-yt-progress-barline">
              <div class="ndx-yt-progress-bar" style="width:0%"></div>
            </div>
            <div class="ndx-yt-progress-summary">0% completed • ${videoCount ? (totalDurationSeconds ? formatDuration(totalDurationSeconds) : '…') : '…'} left</div>`;
          headerContents.appendChild(box);
          box.dataset.playlistId = id;
          populateWatchPlaylistStats(box, id, [...list, entry]);
          attachWatchPlaylistBoxHandlers(box, id);
        }
      }
    });
  });
}
