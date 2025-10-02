// Robust hide/show helper. Even if dataset markers were lost (e.g. after reload before toggle change),
// we still attempt to restore by clearing inline display if appropriate.
function applyVisibility(selector, shouldHide) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => {
    if (shouldHide) {
      // Only (re)apply hide if not already intentionally hidden by us
      if (!el.dataset.ndxHidden) {
        if (!el.dataset.ndxDisplay) {
          el.dataset.ndxDisplay = el.style.display || ""; // store original inline display (might be empty)
        }
        el.dataset.ndxHidden = "1";
        el.style.display = "none";
      }
    } else {
      // Show logic: If we marked it hidden OR it's inline-hidden but we have no active toggle
      if (el.dataset.ndxHidden) {
        el.style.display = el.dataset.ndxDisplay;
        delete el.dataset.ndxDisplay;
        delete el.dataset.ndxHidden;
      } else if (el.style.display === 'none') {
        // Fallback: element is hidden inline (maybe prior session) but not marked now
        el.style.display = '';
      }
    }
  });
}

function runContentFilters() {
  chrome.storage.sync.get([
    "hideFacebookFeed", "hideFacebookStories", "hideRightSidebar",
    "hideYTRecs", "hideYTShorts", "hideYTComments", "hideYTNext",
    "pauseToggle", "pauseUntil"
  ], data => {
    // Handle pause with timestamp persistence
    if (data.pauseToggle) {
      const now = Date.now();
      if (data.pauseUntil && now > data.pauseUntil) {
        // Pause expired but flags not yet cleared (e.g. service worker slept)
        chrome.storage.sync.set({ pauseToggle: false, pauseUntil: null });
      } else if (!data.pauseUntil || (data.pauseUntil && now <= data.pauseUntil)) {
        return; // still paused (or missing timestamp but toggle on)
      }
    }

    const url = location.href;

    // ===== FACEBOOK =====
    if (url.includes("facebook.com")) {
      applyVisibility(".x1hc1fzr.x1unhpq9.x6o7n8i", !!data.hideFacebookFeed); // feed
      // Stories might share/overlap with feed; if both toggles can target same nodes, OR logic below prevents premature restore.
      const hideStories = !!data.hideFacebookStories;
      if (hideStories) {
        applyVisibility(".x193iq5w.xgmub6v.x1ceravr", true);
      } else if (!data.hideFacebookFeed) {
        // Only restore if feed toggle also off (avoid flicker when both refer to similar sections)
        applyVisibility(".x193iq5w.xgmub6v.x1ceravr", false);
      } else {
        // Feed still hiding; ensure consistent dataset marking for overlapping nodes
        applyVisibility(".x193iq5w.xgmub6v.x1ceravr", true);
      }

      // Right Sidebar
      applyVisibility(".xwib8y2.x1y1aw1k", !!data.hideRightSidebar);
    }

    // ===== YOUTUBE =====
    if (url.includes("youtube.com")) {
      applyVisibility("ytd-browse.style-scope.ytd-page-manager", !!data.hideYTRecs);
      applyVisibility("ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer", !!data.hideYTShorts);
      if (url.includes("watch")) {
        // Per user provided mapping
        applyVisibility("ytd-comments#comments", !!data.hideYTComments); // comments
        applyVisibility("div#secondary", !!data.hideYTNext); // next suggestions
      }
    }
  });
}

// Run once DOM loaded
document.addEventListener("DOMContentLoaded", runContentFilters);

// Also rerun on mutations (fb/yt dynamically load content)
const observer = new MutationObserver(runContentFilters);
observer.observe(document.body, { childList: true, subtree: true });

// Re-run when storage (toggles) change so un-hiding works instantly without reload.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const relevantKeys = [
    'hideFacebookFeed','hideFacebookStories','hideRightSidebar','hideYTRecs','hideYTShorts','hideYTComments','hideYTNext','pauseToggle','pauseUntil'
  ];
  if (Object.keys(changes).some(k => relevantKeys.includes(k))) {
    runContentFilters();
  }
});
