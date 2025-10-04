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
    "pauseToggle", "pauseUntil",
    // Productive Facebook feature
    "productiveFacebook",
    // Facebook blacklist
    "fbBlacklist",
    // Hide sponsored posts
    "hideSponsoredPosts"
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

      // Right Sidebar (new primary selector + legacy fallback)
      const rightSidebarSelectors = [
        '.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6>.x1y1aw1k',
      ];
      rightSidebarSelectors.forEach(sel => applyVisibility(sel, !!data.hideRightSidebar));

      // Hide Reels posts when Hide Stories is enabled
      if (hideStories) {
        hideReelsPosts();
      } else {
        restoreReelsPosts();
      }

      // Productive Facebook buttons injection
      if (data.productiveFacebook) {
        insertProductiveFacebookButtons();
        // Hide blacklisted posts ONLY when productive mode is active
        if (Array.isArray(data.fbBlacklist) && data.fbBlacklist.length) {
          hideBlacklistedPosts(data.fbBlacklist);
        } else {
          // If list empty, restore any previously hidden posts
          document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => {
            post.style.display = '';
            delete post.dataset.ndxBlHidden;
          });
        }
        // Hide sponsored posts if toggle on
        if (data.hideSponsoredPosts) {
          hideSponsoredPosts();
        } else {
          restoreSponsoredPosts();
        }
      } else {
        // Clean up if toggled off
        document.querySelectorAll('.ndx-pf-btn').forEach(btn => btn.remove());
        // Also restore any blacklist-hidden posts since feature inactive
        document.querySelectorAll('.x1lliihq[data-ndx-bl-hidden="1"]').forEach(post => {
          post.style.display = '';
          delete post.dataset.ndxBlHidden;
        });
        // Restore sponsored if productive mode off
        restoreSponsoredPosts();
      }
    }

    // ===== YOUTUBE =====
    if (url.includes("youtube.com")) {
      // Only hide recommendations on the pure homepage (no path or path is '/'), not on search, subscriptions, library, etc.
      const isHome = (/^https?:\/\/(www\.)?youtube\.com\/?(\?|$)/).test(url);
      if (isHome) {
        applyVisibility("ytd-browse.style-scope.ytd-page-manager", !!data.hideYTRecs);
      } else if (!isHome) {
        // Ensure restored off home if previously hidden
        applyVisibility("ytd-browse.style-scope.ytd-page-manager", false);
      }
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
    'hideFacebookFeed','hideFacebookStories','hideRightSidebar','hideYTRecs','hideYTShorts','hideYTComments','hideYTNext','pauseToggle','pauseUntil','productiveFacebook','fbBlacklist','hideSponsoredPosts'
  ];
  if (Object.keys(changes).some(k => relevantKeys.includes(k))) {
    runContentFilters();
  }
});

// === Productive Facebook Feature ===
// Adds a small ❌ button after the username span.xjp7ctv inside the FIRST span.xt0psk2
// that is found within the FIRST .xu06os2.x1ok221b inside each post (.x1lliihq).
// We only insert once per post (by checking for existing button in that wrapper).
function insertProductiveFacebookButtons() {
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    // First container within this post
    const container = post.querySelector('.xu06os2.x1ok221b');
    if (!container) return;
    // First name wrapper inside that container
    const nameWrapper = container.querySelector('span.xt0psk2');
    if (!nameWrapper) return;
    // Skip if button already present
    if (nameWrapper.querySelector('.ndx-pf-btn')) return;
    const userSpan = nameWrapper.querySelector('span.xjp7ctv');
    if (!userSpan) return;

    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.className = 'ndx-pf-btn';
    btn.title = 'Productive: remove / dismiss (no action wired yet)';
    Object.assign(btn.style, {
      marginLeft: '4px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      padding: '0 4px',
      fontSize: '14px'
    });
    // Click: extract person/group link + name, store in blacklist
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const anchor = userSpan.querySelector('a');
      if (!anchor || !anchor.href) return;
      const href = anchor.href;
      let title = '';
      let type = 'unknown';
      const personSpan = anchor.querySelector('b > span');
      if (personSpan && personSpan.textContent.trim()) {
        title = personSpan.textContent.trim();
        type = 'person';
      } else {
        const groupSpan = anchor.querySelector(':scope > span');
        if (groupSpan && groupSpan.textContent.trim()) {
          title = groupSpan.textContent.trim();
          type = 'group';
        } else if (anchor.textContent.trim()) {
          // For pages, title is directly in the anchor tag
          title = anchor.textContent.trim();
          type = 'page';
        }
      }
      if (!title) return; // nothing meaningful

      chrome.storage.sync.get(['fbBlacklist'], data => {
        const list = Array.isArray(data.fbBlacklist) ? data.fbBlacklist : [];
        // Derive path-only key (no protocol/domain, truncated before '?')
        const pathKey = (() => {
          try {
            const u = new URL(href);
            let p = u.pathname; // keeps leading '/'
            // Truncate group path to /groups/<id>/ pattern if applicable
            if (p.startsWith('/groups/')) {
              const segs = p.split('/').filter(Boolean); // ['groups','184379328369061', ...]
              if (segs.length >= 2) {
                p = `/groups/${segs[1]}/`; // ensure trailing slash
              }
            } else {
              // Remove trailing slash except root
              if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
            }
            // Remove query portion by ignoring search entirely
            // Already have path only; drop leading '/'
            return p.startsWith('/') ? p.slice(1) : p;
          } catch { return href; }
        })();

        if (!pathKey) return;

        // Deduplicate by pathKey (entries now store path only in href field)
        if (!list.some(entry => entry.href === pathKey)) {
          const cleanTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;
          const newEntry = { href: pathKey, title: cleanTitle, type, addedAt: Date.now() };
          const estimatedSize = JSON.stringify([...list, newEntry]).length;
          if (estimatedSize > 7000) {
            alert('Blacklist storage full. Please clear some entries.');
            return;
          }
          list.push(newEntry);
          chrome.storage.sync.set({ fbBlacklist: list });
          try { console.log('[NilMode][FB Blacklist] Added:', { path: pathKey, title: cleanTitle, type }); } catch(_){ }
        }
      });
    });
    userSpan.insertAdjacentElement('afterend', btn);
  });
}

// TODO (settings UI): Expose facebook blacklist (fbBlacklist) for viewing/removing entries.
// Structure: [{ href, title, type<'person'|'group'|'unknown'>, addedAt }]
// Planned actions: remove single, clear all, maybe auto-hide matching posts.

// === Blacklist Hiding Logic ===
function hideBlacklistedPosts(blacklist) {
  const normalize = raw => {
    try {
      const u = new URL(raw);
      let p = u.pathname;
      if (p.startsWith('/groups/')) {
        const segs = p.split('/').filter(Boolean);
        if (segs.length >= 2) p = `/groups/${segs[1]}/`;
      } else {
        if (p.length > 1 && p.endsWith('/')) p = p.slice(0,-1);
      }
      return p.startsWith('/') ? p.slice(1) : p;
    } catch { return raw; }
  };
  // Stored href now is already path-only; but normalize anyway for safety
  const set = new Set(blacklist.map(e => e.href));

  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    const container = post.querySelector('.xu06os2.x1ok221b');
    if(!container) return;
    const nameWrapper = container.querySelector('span.xt0psk2');
    if(!nameWrapper) return;
    const anchor = nameWrapper.querySelector('span.xjp7ctv a');
    if(!anchor || !anchor.href) return;
    const norm = normalize(anchor.href);
    if (set.has(norm)) {
      if (!post.dataset.ndxBlHidden) {
        post.style.display = 'none';
        post.dataset.ndxBlHidden = '1';
      }
    } else if (post.dataset.ndxBlHidden) {
      post.style.display = '';
      delete post.dataset.ndxBlHidden;
    }
  });
}

// === Sponsored Posts Hiding ===
// A sponsored marker inside a post contains all these classes together:
// .xmper1u.x1qlqyl8.x1r8a4m5.x1n2onr6.x17ihmo5.x1ihsnu5
// If found within a .x1lliihq post and productive mode + hideSponsoredPosts are on, hide it.
const SPONSORED_SELECTOR = '.xt0psk2.x1qlqyl8.x1n2onr6.x17ihmo5.x1o7lsid';
function hideSponsoredPosts(){
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    if (post.dataset.ndxSponsoredHidden) return; // already hidden
    if (post.querySelector(SPONSORED_SELECTOR)) {
      post.style.display = 'none';
      post.dataset.ndxSponsoredHidden = '1';
    }
  });
}
function restoreSponsoredPosts(){
  document.querySelectorAll('.x1lliihq[data-ndx-sponsored-hidden="1"]').forEach(post => {
    post.style.display = '';
    delete post.dataset.ndxSponsoredHidden;
  });
}

// === Reels Posts Hiding (when Hide Stories is enabled) ===
function hideReelsPosts(){
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    if (post.dataset.ndxReelsHidden) return; // already hidden
    const reelsIndicator = post.querySelector('span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1j85h84 span');
    if (reelsIndicator && reelsIndicator.textContent && (reelsIndicator.textContent.includes('Reels') || reelsIndicator.textContent.includes('Short Video'))) {
      post.style.display = 'none';
      post.dataset.ndxReelsHidden = '1';
    }
  });
}

function restoreReelsPosts(){
  document.querySelectorAll('.x1lliihq[data-ndx-reels-hidden="1"]').forEach(post => {
    post.style.display = '';
    delete post.dataset.ndxReelsHidden;
  });
}
