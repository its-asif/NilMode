// orchestrates feature execution for both Facebook & YouTube

function ndxCtxOk() {
  try { return !!chrome.runtime?.id; } catch (_) { return false; }
}

// Called when pause is active — restores everything that our filters may have hidden
// so the page looks natural during the pause window without requiring a reload.
function ndxRestoreAllForPause() {
  const url = location.href;
  if (url.includes('facebook.com')) {
    applyVisibility('.x1hc1fzr.x1unhpq9.x6o7n8i', false);
    applyVisibility('.x193iq5w.xgmub6v.x1ceravr', false);
    applyVisibility('.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6>.x1y1aw1k', false);
    restoreReelsPosts();
    document.querySelectorAll('.ndx-pf-btn').forEach(btn => btn.remove());
    document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => {
      post.style.display = ''; delete post.dataset.ndxBlHidden;
    });
  }
  if (url.includes('youtube.com')) {
    applyVisibility('ytd-browse.style-scope.ytd-page-manager', false);
    applyVisibility('ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer', false);
    applyVisibility('ytd-comments#comments', false);
    applyVisibility('#related #items', false);
  }
}

function runContentFilters() {
  if (!ndxCtxOk()) return; // extension was reloaded - bail before any chrome API call
  chrome.storage.sync.get([
    'hideFacebookFeed', 'hideFacebookStories', 'hideRightSidebar',
    'hideFacebookReelsPage',
    'hideYTRecs', 'hideYTShorts', 'hideYTComments', 'hideYTNext',
    'pauseToggle', 'pauseUntil', 'pauseReason',
    'productiveFacebook',
    'ytFeedRedirect',
    // include legacy copies for migration/fallback
    'fbBlacklist', 'ytPlaylists',
    'ytCourseMode'
  ], syncData => {
    chrome.storage.local.get(['fbBlacklist', 'ytPlaylists'], localData => {
      const data = { ...syncData, ...localData };

      if (data.pauseToggle) {
        const now = Date.now();
        if (data.pauseUntil && now > data.pauseUntil) {
          // Timer expired - clear pause and let filters run
          chrome.storage.sync.set({ pauseToggle: false, pauseUntil: null });
        } else if (data.pauseUntil && now <= data.pauseUntil) {
          ndxRestoreAllForPause(); // instantly restore hidden elements — no reload needed
          return; // valid active pause with a future timestamp
        }
        // if pauseToggle:true but pauseUntil is null (race condition), fall through
      }
      const url = location.href;

      // facebook
      if (url.includes('facebook.com')) {
        // Redirect dedicated reels pages if enabled (fallback if background didn't catch)
        const isReelsPage = /^https?:\/\/(www\.)?facebook\.com\/reel\//.test(url);
        if (isReelsPage && data.hideFacebookReelsPage) {
          if (!/blocked\.html/.test(url)) {
            location.replace(chrome.runtime.getURL('blocked.html?site=facebook'));
          }
          return; // Skip other FB logic
        }
        applyVisibility('.x1hc1fzr.x1unhpq9.x6o7n8i', !!data.hideFacebookFeed);
        const hideStories = !!data.hideFacebookStories;
        if (hideStories) {
          applyVisibility('.x193iq5w.xgmub6v.x1ceravr', true);
        } else if (!data.hideFacebookFeed) {
          applyVisibility('.x193iq5w.xgmub6v.x1ceravr', false);
        } else {
          applyVisibility('.x193iq5w.xgmub6v.x1ceravr', true);
        }
        const rightSidebarSelectors = ['.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6>.x1y1aw1k'];
        rightSidebarSelectors.forEach(sel => applyVisibility(sel, !!data.hideRightSidebar));
        if (hideStories) hideReelsPosts(); else restoreReelsPosts();
        if (data.productiveFacebook) {
          insertProductiveFacebookButtons();
          if (Array.isArray(data.fbBlacklist) && data.fbBlacklist.length) {
            hideBlacklistedPosts(data.fbBlacklist);
          } else {
            document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => {
              post.style.display = '';
              delete post.dataset.ndxBlHidden;
            });
          }
        } else {
          document.querySelectorAll('.ndx-pf-btn').forEach(btn => btn.remove());
          document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => { post.style.display = ''; delete post.dataset.ndxBlHidden; });
        }
      }

      // youtube
      if (url.includes('youtube.com')) {
        const isHome = (/^https?:\/\/(www\.)?youtube\.com\/?(\?|$)/).test(url);
        if (isHome && data.hideYTRecs) {
          if (data.ytFeedRedirect === 'subscriptions') {
            location.replace('https://www.youtube.com/feed/subscriptions');
            return;
          } else if (data.ytFeedRedirect === 'watchlater') {
            location.replace('https://www.youtube.com/playlist?list=WL');
            return;
          }
        }
        if (isHome) applyVisibility('ytd-browse.style-scope.ytd-page-manager', !!data.hideYTRecs); else applyVisibility('ytd-browse.style-scope.ytd-page-manager', false);
        applyVisibility('ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer', !!data.hideYTShorts);
        if (url.includes('watch')) {
          applyVisibility('ytd-comments#comments', !!data.hideYTComments);
          applyVisibility('#related #items', !!data.hideYTNext);
        }
        if (data.ytCourseMode !== false) {
          maybeInjectYouTubePlaylistButtons(data.ytPlaylists || []);
          ndxInjectCompletionCheckboxes(data.ytPlaylists || []);
        } else {
          document.querySelectorAll('.ndx-yt-course-btn, .ndx-yt-course-box, .ndx-yt-course-box-watch').forEach(el => el.remove());
          document.querySelectorAll('.ndx-course-check-host').forEach(h => h.remove());
          document.querySelectorAll('.ndx-course-menu-aug').forEach(m => m.classList.remove('ndx-course-menu-aug'));
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', runContentFilters);
// MutationObserver - self-disconnects when the extension is reloaded
let __ndxLastUrlProcessedForPlaylist = '';
const observer = new MutationObserver(() => {
  if (!ndxCtxOk()) { observer.disconnect(); return; }
  runContentFilters();
});
observer.observe(document.body, { childList: true, subtree: true });
chrome.storage.onChanged.addListener((changes, area) => {
  if (!ndxCtxOk()) return;
  const relevantSync = ['hideFacebookFeed', 'hideFacebookStories', 'hideRightSidebar', 'hideYTRecs', 'hideYTShorts', 'hideYTComments', 'hideYTNext', 'pauseToggle', 'pauseUntil', 'pauseReason', 'productiveFacebook', 'ytCourseMode', 'ytFeedRedirect'];
  const relevantLocal = ['fbBlacklist', 'ytPlaylists'];
  const keys = Object.keys(changes);
  const shouldRun = (area === 'sync' && keys.some(k => relevantSync.includes(k))) ||
    (area === 'local' && keys.some(k => relevantLocal.includes(k)));
  if (shouldRun) runContentFilters();
});
chrome.runtime.onMessage.addListener((msg) => {
  if (!ndxCtxOk()) return;
  if (msg && msg.type === 'ndx-refresh') {
    runContentFilters();
  }
});
