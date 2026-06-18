function extractPlaylistStatsFromDom(){
  try {
    const videoEls = DOM.findAll('youtube.playlistVideoElements');
    if (!videoEls.length) return null;
    
    const videoCount = videoEls.length;
    let totalSeconds = 0;
    const videoDurations = {};
    
    videoEls.forEach(vel => {
      let videoId = '';
      const a = DOM.find('youtube.videoAnchor', vel);
      if (a && a.href) {
        try { 
          const pu = new URL(a.href); 
          videoId = pu.searchParams.get('v') || ''; 
        } catch(_){}
      }
      
      const durBadge = DOM.find('youtube.videoDurationBadge', vel);
                    
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
    const itemNodes = DOM.findAll('youtube.watchPlaylistVideoElements');
    if (!itemNodes.length) return null;
    
    const videoCount = itemNodes.length;
    let totalSeconds = 0;
    const videoDurations = {};
    
    itemNodes.forEach(node => {
      let videoId = '';
      const a = DOM.find('youtube.videoAnchor', node);
      if (a && a.href) { 
        try { 
          const pu = new URL(a.href); 
          videoId = pu.searchParams.get('v') || ''; 
        } catch(_){} 
      }
      
      const badge = DOM.find('youtube.watchVideoDurationBadge', node);
                 
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

