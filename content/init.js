// init.js - orchestrates feature execution for both Facebook & YouTube

function runContentFilters() {
  chrome.storage.sync.get([
    'hideFacebookFeed','hideFacebookStories','hideRightSidebar',
    'hideYTRecs','hideYTShorts','hideYTComments','hideYTNext',
    'pauseToggle','pauseUntil','pauseReason',
    'productiveFacebook',
    'fbBlacklist',
  'hideSponsoredPosts',
  'ytPlaylists',
  'ytCourseMode'
  ], data => {
    if (data.pauseToggle) {
      const now = Date.now();
      if (data.pauseUntil && now > data.pauseUntil) {
        chrome.storage.sync.set({ pauseToggle: false, pauseUntil: null });
      } else if (!data.pauseUntil || (data.pauseUntil && now <= data.pauseUntil)) {
        return;
      }
    }
    const url = location.href;

    // Facebook
    if (url.includes('facebook.com')) {
      applyVisibility('.x1hc1fzr.x1unhpq9.x6o7n8i', !!data.hideFacebookFeed);
      const hideStories = !!data.hideFacebookStories;
      if (hideStories) {
        applyVisibility('.x193iq5w.xgmub6v.x1ceravr', true);
      } else if (!data.hideFacebookFeed) {
        applyVisibility('.x193iq5w.xgmub6v.x1ceravr', false);
      } else {
        applyVisibility('.x193iq5w.xgmub6v.x1ceravr', true);
      }
      const rightSidebarSelectors = [ '.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6>.x1y1aw1k' ];
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
        if (data.hideSponsoredPosts) hideSponsoredPosts(); else restoreSponsoredPosts();
      } else {
        document.querySelectorAll('.ndx-pf-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => { post.style.display = ''; delete post.dataset.ndxBlHidden; });
        restoreSponsoredPosts();
      }
    }

    // YouTube
    if (url.includes('youtube.com')) {
      const isHome = (/^https?:\/\/(www\.)?youtube\.com\/?(\?|$)/).test(url);
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
}

document.addEventListener('DOMContentLoaded', runContentFilters);
// Return to immediate observer but gate expensive playlist checkbox injection
let __ndxLastUrlProcessedForPlaylist = '';
const observer = new MutationObserver(() => {
  runContentFilters();
});
observer.observe(document.body, { childList:true, subtree:true });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const relevant = ['hideFacebookFeed','hideFacebookStories','hideRightSidebar','hideYTRecs','hideYTShorts','hideYTComments','hideYTNext','pauseToggle','pauseUntil','pauseReason','productiveFacebook','fbBlacklist','hideSponsoredPosts','ytPlaylists','ytCourseMode'];
  if (Object.keys(changes).some(k => relevant.includes(k))) runContentFilters();
});
