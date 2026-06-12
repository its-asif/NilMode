function extractPlaylistStatsFromDom(){
  try {

    const videoEls = document.querySelectorAll('#contents yt-lockup-view-model, #contents ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer');
    if (!videoEls.length) return null;
    
    const videoCount = videoEls.length;
    let totalSeconds = 0;
    const videoDurations = {};
    
    videoEls.forEach(vel => {
      let videoId = '';
      const a = vel.querySelector('a#thumbnail') || vel.querySelector('a');
      if (a && a.href) {
        try { 
          const pu = new URL(a.href); 
          videoId = pu.searchParams.get('v') || ''; 
        } catch(_){}
      }
      
      const durBadge = vel.querySelector('#overlays ytd-thumbnail-overlay-time-status-renderer div.thumbnail-overlay-badge-shape badge-shape div.yt-badge-shape__text')
                    || vel.querySelector('ytd-thumbnail-overlay-time-status-renderer span')
                    || vel.querySelector('.yt-badge-shape__text')
                    || vel.querySelector('#overlays span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
                    || vel.querySelector('yt-thumbnail-view-model > yt-thumbnail-bottom-overlay-view-model > div > yt-thumbnail-badge-view-model > badge-shape > div');

                    
      if (durBadge && durBadge.textContent.trim()) {
        const txt = durBadge.textContent.trim();
        const parsed = parseYouTubeTime(txt);
        if (!isNaN(parsed) && parsed > 0) {
          totalSeconds += parsed;
          if (videoId) videoDurations[videoId] = parsed;
        }
      }
    });
    
    return { videoCount, totalDurationSeconds: totalSeconds, videoDurations };
  } catch (_) { 
    return null; 
  }
}

function extractWatchPlaylistStatsFromDom(){
  try {
    const itemNodes = document.querySelectorAll('#playlist-items, ytd-playlist-panel-video-renderer');
    if (!itemNodes.length) return null;
    
    const videoCount = itemNodes.length;
    let totalSeconds = 0;
    const videoDurations = {};
    
    itemNodes.forEach(node => {
      let videoId = '';
      const a = node.querySelector('a');
      if (a && a.href) { 
        try { 
          const pu = new URL(a.href); 
          videoId = pu.searchParams.get('v') || ''; 
        } catch(_){} 
      }
      
      const badge = node.querySelector('.yt-badge-shape__text') 
                 || node.querySelector('ytd-thumbnail-overlay-time-status-renderer span')
                 || node.querySelector('.style-scope.ytd-thumbnail-overlay-time-status-renderer');
                 
      if (badge && badge.textContent.trim()) {
        const txt = badge.textContent.trim();
        const parsed = parseYouTubeTime(txt);
        if (!isNaN(parsed) && parsed > 0) {
          totalSeconds += parsed;
          if (videoId) videoDurations[videoId] = parsed;
        }
      }
    });
    
    return { videoCount, totalDurationSeconds: totalSeconds, videoDurations };
  } catch (_) { 
    return null; 
  }
}
