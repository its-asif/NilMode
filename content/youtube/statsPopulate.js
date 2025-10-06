// Populate stats boxes (pure playlist & watch variant)
function populatePlaylistStats(box, playlistId, list){
  const entry = Array.isArray(list)? list.find(p=>p.id===playlistId): null;
  if (!entry) return;
  let { videoCount, totalDurationSeconds, videoDurations } = entry;
  if (videoCount == null || totalDurationSeconds == null || !videoDurations) {
    const stats = extractPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; videoDurations = stats.videoDurations || {};
      entry.videoCount = videoCount; entry.totalDurationSeconds = totalDurationSeconds; entry.videoDurations = videoDurations;
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
  let { videoCount, totalDurationSeconds, videoDurations } = entry;
  if (videoCount == null || totalDurationSeconds == null || !videoDurations) {
    const stats = extractWatchPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; videoDurations = stats.videoDurations || {};
      entry.videoCount = videoCount; entry.totalDurationSeconds = totalDurationSeconds; entry.videoDurations = videoDurations;
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
