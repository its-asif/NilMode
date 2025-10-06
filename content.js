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
    "hideSponsoredPosts",
    // YouTube saved playlists (for future UI; not yet rendered here)
    "ytPlaylists"
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

      // Inject YouTube playlist management buttons (Start Course)
      maybeInjectYouTubePlaylistButtons(data.ytPlaylists || []);
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
    'hideFacebookFeed','hideFacebookStories','hideRightSidebar','hideYTRecs','hideYTShorts','hideYTComments','hideYTNext','pauseToggle','pauseUntil','productiveFacebook','fbBlacklist','hideSponsoredPosts','ytPlaylists'
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

// === YouTube Playlist Capture (Phase 1: Start Course Button Injection) ===
function maybeInjectYouTubePlaylistButtons(existingList){
  const url = location.href;
  const params = new URLSearchParams(location.search);
  const playlistId = params.get('list');
  // Way-1 Pure playlist page detection: /playlist?list=ID (no watch?v=)
  const isPurePlaylist = /\/playlist\?list=/.test(url) && !/watch\?/.test(url);
  // Way-2 Watch page with playlist: /watch?v=...&list=...
  const isWatchWithPlaylist = /watch\?/.test(url) && !!playlistId;

  if (!isPurePlaylist && !isWatchWithPlaylist) return; // Nothing to do

  ensurePlaylistButtonStyles();

  if (isPurePlaylist) {
    // Selector container to append anchor
    const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
    if (container) {
      const alreadySaved = Array.isArray(existingList) && existingList.some(p => p.id === playlistId);
      if (alreadySaved) {
        // Render stats box instead of button
        if (!container.querySelector('.ndx-yt-course-box')) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box';
          box.innerHTML = `
            <div class="ndx-yt-course-box-row"><strong>Playlist Saved</strong></div>
            <div class="ndx-yt-course-box-row" data-role="counts">Videos: <span class="ndx-yt-count">…</span></div>
            <div class="ndx-yt-course-box-row" data-role="duration">Total: <span class="ndx-yt-duration">…</span></div>
            <div class="ndx-yt-course-box-row" data-role="progress">Completed: <div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions">
              <button class="ndx-yt-course-update">Update</button>
              <button class="ndx-yt-course-delete">Delete</button>
            </div>
          `;
          container.appendChild(box);
          // Populate stats from DOM or stored values
          populatePlaylistStats(box, playlistId, existingList);
          attachPlaylistBoxHandlers(box, playlistId);
        }
      } else if (!container.querySelector('.ndx-yt-course-btn.ndx-yt-course-btn-pure')) {
        const a = document.createElement('a');
        a.textContent = 'Start Course';
        a.href = 'javascript:void(0)';
        a.className = 'ndx-yt-course-btn ndx-yt-course-btn-pure';
        a.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'pure', existingList));
        container.appendChild(a);
      }
    }
  }

  if (isWatchWithPlaylist) {
    const h3 = document.querySelector('#header-description > h3:nth-child(1)');
    const headerContents = document.querySelector('#header-contents');
    if (h3) {
      const alreadySaved = Array.isArray(existingList) && existingList.some(p => p.id === playlistId);
      if (alreadySaved && headerContents) {
        if (!headerContents.querySelector('.ndx-yt-course-box-watch')) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box-watch';
          box.innerHTML = `
            <div class="ndx-yt-course-box-watch-actions-corner">
              <button class="ndx-yt-icon-btn ndx-yt-course-update-watch" title="Update stats">↻</button>
              <button class="ndx-yt-icon-btn ndx-yt-course-delete-watch" title="Delete saved playlist">✕</button>
            </div>
            <div class="ndx-yt-course-box-watch-row1">
              <span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Videos</span><span class="ndx-yt-count">…</span></span>
              <span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Time</span><span class="ndx-yt-duration">…</span></span>
            </div>
            <div class="ndx-yt-course-box-watch-row2">
              <span class="ndx-yt-mini-block ndx-yt-progress-wrap"><span class="ndx-yt-mini-label">Completed</span><div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></span>
            </div>`;
          headerContents.appendChild(box);
          populateWatchPlaylistStats(box, playlistId, existingList);
          attachWatchPlaylistBoxHandlers(box, playlistId);
        }
      } else if (!h3.querySelector('.ndx-yt-course-btn-watch')) {
        const btn = document.createElement('button');
        btn.textContent = 'Start Course';
        btn.className = 'ndx-yt-course-btn ndx-yt-course-btn-watch';
        btn.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'watch'));
        h3.appendChild(btn);
      }
    }
  }
}

function saveYouTubePlaylist(id, source){
  if (!id) return;
  const canonicalUrl = `https://www.youtube.com/playlist?list=${id}`;
  // Attempt to derive name based on page type & selectors
  let title = '';
  // Way-1 selector
  const pureTitleEl = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div > div.yt-page-header-view-model__page-header-headline > div > yt-dynamic-text-view-model > h1 > span');
  if (pureTitleEl && pureTitleEl.textContent.trim()) {
    title = pureTitleEl.textContent.trim();
  }
  // Way-2 selector
  if (!title) {
    const watchTitleAnchor = document.querySelector('#header-description > h3:nth-child(1) > yt-formatted-string > a');
    if (watchTitleAnchor && watchTitleAnchor.textContent.trim()) {
      title = watchTitleAnchor.textContent.trim();
    }
  }
  if (!title) title = id; // fallback

  chrome.storage.sync.get(['ytPlaylists'], data => {
    const list = Array.isArray(data.ytPlaylists) ? data.ytPlaylists : [];
    if (list.some(p => p.id === id)) {
      console.log('[NilMode][YT Playlist] Already saved:', id);
      return;
    }
    // Attempt immediate stat extraction based on source only once (store so future renders don't recalc)
    let videoCount = null;
    let totalDurationSeconds = null;
    try {
      if (source === 'pure') {
        const stats = extractPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; }
      } else if (source === 'watch') {
        const stats = extractWatchPlaylistStatsFromDom();
        if (stats) { videoCount = stats.videoCount; totalDurationSeconds = stats.totalDurationSeconds; }
      }
    } catch(_){ }
    const entry = { id, title, url: canonicalUrl, addedAt: Date.now(), source, videoCount, totalDurationSeconds };
    // Basic size guard
    const estimatedSize = JSON.stringify([...list, entry]).length;
    if (estimatedSize > 7000) {
      alert('Playlist storage near limit. Consider pruning.');
      return;
    }
    list.push(entry);
    chrome.storage.sync.set({ ytPlaylists: list }, () => {
      console.log('[NilMode][YT Playlist] Added:', entry);
      // Replace start button with info box dynamically
      if (source === 'pure') {
        const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
        if (container) {
          const btn = container.querySelector('.ndx-yt-course-btn-pure');
          if (btn) btn.remove();
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box';
          box.innerHTML = `
            <div class="ndx-yt-course-box-row"><strong>Playlist Saved</strong></div>
            <div class="ndx-yt-course-box-row" data-role="counts">Videos: <span class="ndx-yt-count">${videoCount ?? '…'}</span></div>
            <div class="ndx-yt-course-box-row" data-role="duration">Total: <span class="ndx-yt-duration">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></div>
            <div class="ndx-yt-course-box-row" data-role="progress">Completed: <div class="ndx-yt-progress"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></div>
            <div class="ndx-yt-course-box-row ndx-yt-course-actions">
              <button class="ndx-yt-course-update">Update</button>
              <button class="ndx-yt-course-delete">Delete</button>
            </div>`;
          container.appendChild(box);
          populatePlaylistStats(box, id, [...list, entry]);
          attachPlaylistBoxHandlers(box, id);
        }
      } else if (source === 'watch') {
        const h3 = document.querySelector('#header-description > h3:nth-child(1)');
        const headerContents = document.querySelector('#header-contents');
        if (h3) {
          const btn = h3.querySelector('.ndx-yt-course-btn-watch');
          if (btn) btn.remove();
        }
        if (headerContents) {
          const box = document.createElement('div');
          box.className = 'ndx-yt-course-box-watch';
          box.innerHTML = `
            <div class="ndx-yt-course-box-watch-actions-corner">
              <button class="ndx-yt-icon-btn ndx-yt-course-update-watch" title="Update stats">↻</button>
              <button class="ndx-yt-icon-btn ndx-yt-course-delete-watch" title="Delete saved playlist">✕</button>
            </div>
            <div class="ndx-yt-course-box-watch-row1">
              <span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Videos</span><span class="ndx-yt-count">${videoCount ?? '…'}</span></span>
              <span class="ndx-yt-mini-block"><span class="ndx-yt-mini-label">Time</span><span class="ndx-yt-duration">${videoCount ? formatDuration(totalDurationSeconds) : '…'}</span></span>
            </div>
            <div class="ndx-yt-course-box-watch-row2">
              <span class="ndx-yt-mini-block ndx-yt-progress-wrap"><span class="ndx-yt-mini-label">Completed</span><div class="ndx-yt-progress ndx-yt-progress-barline"><div class="ndx-yt-progress-bar" style="width:0%"></div></div></span>
            </div>`;
          headerContents.appendChild(box);
          populateWatchPlaylistStats(box, id, [...list, entry]);
          attachWatchPlaylistBoxHandlers(box, id);
        }
      }
    });
  });
}

// Inject stylesheet for playlist buttons once
function ensurePlaylistButtonStyles(){
  if (document.getElementById('ndx-playlist-style')) return;
  const style = document.createElement('style');
  style.id = 'ndx-playlist-style';
  style.textContent = `
    .ndx-yt-course-btn {
      box-sizing: border-box;
      width: 100%;
      max-width: 340px;
      background: linear-gradient(135deg,#2563eb,#1d4ed8);
      color: #fff !important;
      font-family: system-ui, Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #1e40af;
      cursor: pointer;
      text-decoration: none !important;
      display: inline-block;
      letter-spacing: .3px;
      transition: background .18s ease, transform .15s ease, box-shadow .18s ease;
      margin: 10px 0 4px;
      position: relative;
    }
    .ndx-yt-course-btn:hover { background: linear-gradient(135deg,#1d4ed8,#1e3a8a); box-shadow: 0 4px 10px -2px rgba(0,0,0,.25); }
    .ndx-yt-course-btn:active { transform: translateY(1px); }
    .ndx-yt-course-btn.ndx-yt-course-btn-watch { margin-left: 0; }
    @media (max-width: 700px){ .ndx-yt-course-btn { max-width: 100%; } }
    .ndx-yt-course-box {box-sizing:border-box;max-width:360px;width:100%;background:#0f172a;color:#f1f5f9;margin:10px 0 6px;padding:12px 14px;border:1px solid #1e293b;border-radius:10px;font-family:system-ui,Arial,sans-serif;font-size:13px;line-height:1.4;}
    .ndx-yt-course-box-row {margin:2px 0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .ndx-yt-course-actions button {background:#1e40af;color:#fff;border:1px solid #1d4ed8;border-radius:5px;padding:4px 10px;font-size:12px;cursor:pointer;}
    .ndx-yt-course-actions button:hover {background:#1d4ed8;}
    .ndx-yt-progress {position:relative;flex:1;height:10px;background:#1e293b;border-radius:6px;overflow:hidden;min-width:120px;}
    .ndx-yt-progress-bar {position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);width:0%;transition:width .3s ease;}
    /* Compact watch variant */
    .ndx-yt-course-box-watch {display:inline-flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px;background:#0f172a;color:#f1f5f9;border:1px solid #1e293b;border-radius:8px;padding:6px 8px;margin-left:8px;font-family:system-ui,Arial,sans-serif;font-size:11px;line-height:1.2;}
    .ndx-yt-course-box-watch-row {display:flex;align-items:center;gap:4px;}
    .ndx-yt-course-actions-watch button {background:#1e40af;color:#fff;border:1px solid #1d4ed8;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;}
    .ndx-yt-course-actions-watch button:hover {background:#1d4ed8;}
    .ndx-yt-progress-compact {height:6px;min-width:60px;flex:0 0 60px;}
    .ndx-yt-icon {opacity:.8;}
  /* Condensed full-width watch header variant */
  .ndx-yt-course-box-watch {position:relative;box-sizing:border-box;display:block;width:100%;max-width:100%;background:#0f172a;color:#f1f5f9;border:1px solid #1e293b;border-radius:10px;padding:10px 12px;margin:10px 0;font-family:system-ui,Arial,sans-serif;font-size:12px;line-height:1.25;}
  .ndx-yt-course-box-watch-row1,.ndx-yt-course-box-watch-row2 {display:flex;flex-wrap:wrap;gap:18px 28px;align-items:center;margin:0 0 4px;}
  .ndx-yt-course-box-watch-row2 {margin:2px 0 0;}
  .ndx-yt-mini-block {display:flex;align-items:center;gap:4px;font-weight:500;}
  .ndx-yt-mini-label {font-size:10px;opacity:.65;background:#1e293b;padding:2px 4px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px;}
  .ndx-yt-progress-barline {height:8px;width:120px;background:#1e293b;border-radius:5px;overflow:hidden;position:relative;}
  .ndx-yt-course-box-watch-actions-corner {position:absolute;top:6px;right:6px;display:flex;gap:4px;}
  .ndx-yt-icon-btn {background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:4px 6px;font-size:11px;cursor:pointer;line-height:1;}
  .ndx-yt-icon-btn:hover {background:#334155;}
  `;
  document.documentElement.appendChild(style);
  // Migrate any old-class buttons if present
  document.querySelectorAll('.tmc-wp-start-course-btn').forEach(el => {
    el.classList.add('ndx-yt-course-btn');
    if (el.classList.contains('tmc-wp-start-course-btn')) el.classList.add('ndx-yt-course-btn-watch');
    if (el.classList.contains('tmc-pp-start-course-btn')) el.classList.add('ndx-yt-course-btn-pure');
  });
}

// Extract stats (video count & total duration) from current DOM for pure playlist page
function extractPlaylistStatsFromDom(){
  try {
    const videoEls = document.querySelectorAll('#contents > ytd-playlist-video-renderer');
    if (!videoEls.length) return null;
    const videoCount = videoEls.length;
    let totalSeconds = 0;
    videoEls.forEach(vel => {
      const durBadge = vel.querySelector('#overlays ytd-thumbnail-overlay-time-status-renderer div.thumbnail-overlay-badge-shape badge-shape div.yt-badge-shape__text');
      if (durBadge && durBadge.textContent.trim()) {
        const parsed = parseYouTubeTime(durBadge.textContent.trim());
        if (!isNaN(parsed)) totalSeconds += parsed;
      }
    });
    return { videoCount, totalDurationSeconds: totalSeconds };
  } catch { return null; }
}

// Extract stats for watch page sidebar playlist variant
function extractWatchPlaylistStatsFromDom(){
  try {
    const itemNodes = document.querySelectorAll('#playlist-items ytd-playlist-panel-video-renderer');
    const videoCount = itemNodes.length;
    const badgeNodes = document.querySelectorAll('#playlist-items .yt-badge-shape__text');
    let totalSeconds = 0;
    badgeNodes.forEach(node => {
      const txt = node.textContent.trim();
      if (!txt) return;
      const parsed = parseYouTubeTime(txt);
      if (!isNaN(parsed)) totalSeconds += parsed;
    });
    if (!videoCount) return null;
    return { videoCount, totalDurationSeconds: totalSeconds };
  } catch { return null; }
}

function parseYouTubeTime(str){
  // Formats: H:MM:SS or MM:SS
  const parts = str.split(':').map(p=>p.trim()).filter(Boolean);
  if (!parts.length) return 0;
  let secs = 0;
  if (parts.length === 3) { // H M S
    secs = (+parts[0])*3600 + (+parts[1])*60 + (+parts[2]);
  } else if (parts.length === 2) {
    secs = (+parts[0])*60 + (+parts[1]);
  } else if (parts.length === 1) {
    secs = +parts[0];
  }
  return secs;
}

function formatDuration(totalSeconds){
  if (totalSeconds == null) return '…';
  const h = Math.floor(totalSeconds/3600);
  const m = Math.floor((totalSeconds%3600)/60);
  const s = totalSeconds%60;
  if (h>0) return `${h}h ${m}m ${s}s`;
  if (m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

function populatePlaylistStats(box, playlistId, list){
  const entry = Array.isArray(list)? list.find(p=>p.id===playlistId): null;
  if (!entry) return;
  let videoCount = entry.videoCount;
  let totalDurationSeconds = entry.totalDurationSeconds;
  // Only extract if missing
  if (videoCount == null || totalDurationSeconds == null) {
    const stats = extractPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount;
      totalDurationSeconds = stats.totalDurationSeconds;
      entry.videoCount = videoCount;
      entry.totalDurationSeconds = totalDurationSeconds;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){ arr[idx] = entry; chrome.storage.sync.set({ ytPlaylists: arr }); }
      });
    }
  }
  if (videoCount == null) return; // still nothing to show
  const countEl = box.querySelector('.ndx-yt-count');
  const durEl = box.querySelector('.ndx-yt-duration');
  if (countEl) countEl.textContent = videoCount;
  if (durEl) durEl.textContent = formatDuration(totalDurationSeconds);
}

function populateWatchPlaylistStats(box, playlistId, list){
  const entry = Array.isArray(list)? list.find(p=>p.id===playlistId): null;
  if (!entry) return;
  let videoCount = entry.videoCount;
  let totalDurationSeconds = entry.totalDurationSeconds;
  if (videoCount == null || totalDurationSeconds == null) {
    const stats = extractWatchPlaylistStatsFromDom();
    if (stats) {
      videoCount = stats.videoCount;
      totalDurationSeconds = stats.totalDurationSeconds;
      entry.videoCount = videoCount;
      entry.totalDurationSeconds = totalDurationSeconds;
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

function attachPlaylistBoxHandlers(box, playlistId){
  const updateBtn = box.querySelector('.ndx-yt-course-update');
  const deleteBtn = box.querySelector('.ndx-yt-course-delete');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist into view?'); return; }
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          chrome.storage.sync.set({ ytPlaylists: arr }, () => {
            const countEl = box.querySelector('.ndx-yt-count');
            const durEl = box.querySelector('.ndx-yt-duration');
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.sync.set({ ytPlaylists: next }, () => {
          // Remove box and re-add Start Course button
          box.remove();
          const container = document.querySelector('#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.yt-page-header-view-model__scroll-container > div');
          if (container && !container.querySelector('.ndx-yt-course-btn-pure')) {
            const a = document.createElement('a');
            a.textContent = 'Start Course';
            a.href = 'javascript:void(0)';
            a.className = 'ndx-yt-course-btn ndx-yt-course-btn-pure';
            a.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'pure'));
            container.appendChild(a);
          }
        });
      });
    });
  }
}

function attachWatchPlaylistBoxHandlers(box, playlistId){
  const updateBtn = box.querySelector('.ndx-yt-course-update-watch');
  const deleteBtn = box.querySelector('.ndx-yt-course-delete-watch');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const stats = extractWatchPlaylistStatsFromDom();
      if (!stats) { alert('Could not extract stats. Scroll playlist?'); return; }
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const idx = arr.findIndex(p=>p.id===playlistId);
        if (idx>=0){
          arr[idx].videoCount = stats.videoCount;
          arr[idx].totalDurationSeconds = stats.totalDurationSeconds;
          chrome.storage.sync.set({ ytPlaylists: arr }, () => {
            const countEl = box.querySelector('.ndx-yt-count');
            const durEl = box.querySelector('.ndx-yt-duration');
            if (countEl) countEl.textContent = stats.videoCount;
            if (durEl) durEl.textContent = formatDuration(stats.totalDurationSeconds);
          });
        }
      });
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this saved playlist?')) return;
      chrome.storage.sync.get(['ytPlaylists'], data => {
        const arr = Array.isArray(data.ytPlaylists)? data.ytPlaylists: [];
        const next = arr.filter(p=>p.id!==playlistId);
        chrome.storage.sync.set({ ytPlaylists: next }, () => {
          box.remove();
          const h3 = document.querySelector('#header-description > h3:nth-child(1)');
          if (h3 && !h3.querySelector('.ndx-yt-course-btn-watch')) {
            const btn = document.createElement('button');
            btn.textContent = 'Start Course';
            btn.className = 'ndx-yt-course-btn ndx-yt-course-btn-watch';
            btn.addEventListener('click', () => saveYouTubePlaylist(playlistId, 'watch'));
            h3.appendChild(btn);
          }
        });
      });
    });
  }
}
