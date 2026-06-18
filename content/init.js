// orchestrates feature execution for both Facebook & YouTube

function ndxCtxOk() {
  try { return !!chrome.runtime?.id; } catch (_) { return false; }
}

// Called when pause is active — restores everything that our filters may have hidden
// so the page looks natural during the pause window without requiring a reload.
function ndxRestoreAllForPause() {
  const url = location.href;
  if (url.includes('facebook.com')) {
    applyVisibility('facebook.feedContainer', false);
    applyVisibility('facebook.storiesContainer', false);
    applyVisibility('facebook.rightSidebar', false);
    restoreReelsPosts();
    DOM.findAll('facebook.productiveBtn').forEach(btn => btn.remove());
    DOM.findAll('facebook.hiddenBlacklistPosts').forEach(post => {
      post.style.display = ''; delete post.dataset.ndxBlHidden;
    });
  }
  if (url.includes('youtube.com')) {
    applyVisibility('youtube.feedContainer', false);
    applyVisibility('youtube.shortsContainer', false);
    applyVisibility('youtube.commentsContainer', false);
    applyVisibility('youtube.relatedContainer', false);
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
        applyVisibility('facebook.feedContainer', !!data.hideFacebookFeed);
        const hideStories = !!data.hideFacebookStories;
        if (hideStories) {
          applyVisibility('facebook.storiesContainer', true);
        } else if (!data.hideFacebookFeed) {
          applyVisibility('facebook.storiesContainer', false);
        } else {
          applyVisibility('facebook.storiesContainer', true);
        }
        const rightSidebarSelectors = ['facebook.rightSidebar'];
        rightSidebarSelectors.forEach(sel => applyVisibility(sel, !!data.hideRightSidebar));
        if (hideStories) hideReelsPosts(); else restoreReelsPosts();
        if (data.productiveFacebook) {
          insertProductiveFacebookButtons();
          if (Array.isArray(data.fbBlacklist) && data.fbBlacklist.length) {
            hideBlacklistedPosts(data.fbBlacklist);
          } else {
            DOM.findAll('facebook.hiddenBlacklistPosts').forEach(post => {
              post.style.display = '';
              delete post.dataset.ndxBlHidden;
            });
          }
        } else {
          DOM.findAll('facebook.productiveBtn').forEach(btn => btn.remove());
          DOM.findAll('facebook.hiddenBlacklistPosts').forEach(post => { post.style.display = ''; delete post.dataset.ndxBlHidden; });
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
        if (isHome) applyVisibility('youtube.feedContainer', !!data.hideYTRecs); else applyVisibility('youtube.feedContainer', false);
        applyVisibility('youtube.shortsContainer', !!data.hideYTShorts);
        if (url.includes('watch')) {
          applyVisibility('youtube.commentsContainer', !!data.hideYTComments);
          applyVisibility('youtube.relatedContainer', !!data.hideYTNext);
        }
        if (data.ytCourseMode !== false) {
          maybeInjectYouTubePlaylistButtons(data.ytPlaylists || []);
          ndxInjectCompletionCheckboxes(data.ytPlaylists || []);
        } else {
          DOM.findAll('youtube.courseBtn').forEach(el => el.remove());
          DOM.findAll('youtube.courseBox').forEach(el => el.remove());
          DOM.findAll('youtube.courseBoxWatch').forEach(el => el.remove());
          DOM.findAll('youtube.courseCheckHost').forEach(h => h.remove());
          DOM.findAll('youtube.courseMenuAug').forEach(m => m.classList.remove('ndx-course-menu-aug'));
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
