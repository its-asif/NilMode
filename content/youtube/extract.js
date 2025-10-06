// Extraction of playlist stats from DOM
function extractPlaylistStatsFromDom(){
  try {
    const videoEls = document.querySelectorAll('#contents > ytd-playlist-video-renderer');
    if (!videoEls.length) return null;
    const videoCount = videoEls.length;
    let totalSeconds = 0;
    const videoDurations = {};
    videoEls.forEach(vel => {
      let videoId = '';
      const a = vel.querySelector('a#thumbnail');
      if (a && a.href) {
        try { const pu = new URL(a.href); videoId = pu.searchParams.get('v') || ''; } catch(_){ }
      }
      const durBadge = vel.querySelector('#overlays ytd-thumbnail-overlay-time-status-renderer div.thumbnail-overlay-badge-shape badge-shape div.yt-badge-shape__text');
      if (durBadge && durBadge.textContent.trim()) {
        const parsed = parseYouTubeTime(durBadge.textContent.trim());
        if (!isNaN(parsed)) {
          totalSeconds += parsed;
          if (videoId) videoDurations[videoId] = parsed;
        }
      }
    });
    return { videoCount, totalDurationSeconds: totalSeconds, videoDurations };
  } catch { return null; }
}
function extractWatchPlaylistStatsFromDom(){
  try {
    const itemNodes = document.querySelectorAll('#playlist-items ytd-playlist-panel-video-renderer');
    const videoCount = itemNodes.length;
    let totalSeconds = 0;
    const videoDurations = {};
    itemNodes.forEach(node => {
      let videoId = '';
      const a = node.querySelector('a');
      if (a && a.href) { try { const pu = new URL(a.href); videoId = pu.searchParams.get('v') || ''; } catch(_){ } }
      const badge = node.querySelector('.yt-badge-shape__text');
      if (badge && badge.textContent.trim()) {
        const parsed = parseYouTubeTime(badge.textContent.trim());
        if (!isNaN(parsed)) {
          totalSeconds += parsed;
          if (videoId) videoDurations[videoId] = parsed;
        }
      }
    });
    if (!videoCount) return null;
    return { videoCount, totalDurationSeconds: totalSeconds, videoDurations };
  } catch { return null; }
}
