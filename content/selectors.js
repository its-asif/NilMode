// selectors.js - Centralized DOM selector configurations and query helpers for NilMode

window.SELECTORS = {
  facebook: {
    // Main feed container selectors
    feedContainer: [
      '.x1hc1fzr.x1unhpq9.x6o7n8i'
    ],
    // Stories container selectors
    storiesContainer: [
      '.x193iq5w.xgmub6v.x1ceravr'
    ],
    // Right sidebar selectors
    rightSidebar: [
      '.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6>.x1y1aw1k'
    ],
    // Feed post nodes
    posts: [
      '.x1lliihq'
    ],
    // Reels indicators inside posts
    reelsIndicator: [
      'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1j85h84 span'
    ],
    // Posts hidden by Reels blocker
    hiddenReelsPosts: [
      '.x1lliihq[data-ndx-reels-hidden="1"]'
    ],
    // Posts hidden by blacklist blocker
    hiddenBlacklistPosts: [
      '.x1lliihq[data-ndx-bl-hidden="1"]'
    ],
    // Sub-elements within posts
    postContainer: [
      '.xu06os2.x1ok221b'
    ],
    postNameWrapper: [
      'span.xt0psk2'
    ],
    postAuthorLink: [
      'span.xjp7ctv a'
    ],
    postUserSpan: [
      'span.xjp7ctv'
    ],
    postAnchor: [
      'a'
    ],
    postPersonName: [
      'b > span'
    ],
    postGroupName: [
      ':scope > span'
    ],
    // Custom productive buttons injected
    productiveBtn: [
      '.ndx-pf-btn'
    ]
  },
  youtube: {
    // Recommendation feed / browse manager container
    feedContainer: [
      'ytd-browse.style-scope.ytd-page-manager'
    ],
    // Shorts container
    shortsContainer: [
      'ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer'
    ],
    // Comments section
    commentsContainer: [
      'ytd-comments#comments'
    ],
    // Related / next videos container
    relatedContainer: [
      '#related #items'
    ],
    // Playlist page title fallbacks
    playlistTitle: [
      '#page-manager ytd-browse yt-page-header-view-model h1',
      '#page-manager ytd-browse yt-dynamic-text-view-model h1',
      '#page-manager ytd-browse ytd-playlist-header-renderer h1',
      '#page-manager ytd-browse #playlist-header h1',
      '#playlist-header h1',
      'h1#title',
      'yt-page-header-view-model h1',
      'yt-dynamic-text-view-model h1',
      '#header-description > h3:nth-child(1) > yt-formatted-string > a',
      '#header-description h3 a',
      'ytd-playlist-panel-renderer #header-description a'
    ],
    // Pure playlist view header containers
    purePlaylistHeaderContainer: [
      '#page-manager > ytd-browse > yt-page-header-renderer > yt-page-header-view-model > div.ytPageHeaderViewModelScrollContainer > div',
      '#page-manager > ytd-browse > ytd-playlist-header-renderer > div > div.immersive-header-content.style-scope.ytd-playlist-header-renderer > div.thumbnail-and-metadata-wrapper.style-scope.ytd-playlist-header-renderer'
    ],
    // Watch playlist view headers
    watchPlaylistHeaderTitle: [
      '#header-description > h3:nth-child(1)'
    ],
    watchPlaylistHeaderContents: [
      '#header-contents'
    ],
    watchPlaylistPanel: [
      'ytd-playlist-panel-renderer'
    ],
    // Video elements in playlist page
    playlistVideoElements: [
      '#contents yt-lockup-view-model',
      '#contents ytd-playlist-panel-video-renderer',
      'ytd-playlist-video-renderer'
    ],
    // Video elements in watch playlist panel
    watchPlaylistVideoElements: [
      '#playlist-items',
      'ytd-playlist-panel-video-renderer'
    ],
    // Video link anchors
    videoAnchor: [
      'a#thumbnail',
      'a[href*="watch?v="]',
      'a'
    ],
    // Video duration badge (in pure playlist view)
    videoDurationBadge: [
      '#overlays ytd-thumbnail-overlay-time-status-renderer div.thumbnail-overlay-badge-shape badge-shape div.yt-badge-shape__text',
      'ytd-thumbnail-overlay-time-status-renderer span',
      '.yt-badge-shape__text',
      '#overlays span.style-scope.ytd-thumbnail-overlay-time-status-renderer',
      'yt-thumbnail-view-model > yt-thumbnail-bottom-overlay-view-model > div > yt-thumbnail-badge-view-model > badge-shape > div'
    ],
    // Video duration badge (in watch playlist panel view)
    watchVideoDurationBadge: [
      '.yt-badge-shape__text',
      'ytd-thumbnail-overlay-time-status-renderer span',
      '.style-scope.ytd-thumbnail-overlay-time-status-renderer'
    ],
    // Menu containers to inject check mark boxes next to
    playlistMenuContainer: [
      '#contents > div > yt-lockup-view-model > div > div > yt-lockup-metadata-view-model > div.ytLockupMetadataViewModelMenuButton',
      '#menu.style-scope.ytd-playlist-panel-video-renderer'
    ],
    // Parent renderer container of menu
    parentRenderer: [
      'ytd-playlist-video-renderer',
      'ytd-playlist-panel-video-renderer',
      'yt-lockup-view-model'
    ],

    // --- Extension internal injected UI elements ---
    courseBox: [
      '.ndx-yt-course-box'
    ],
    courseBoxWatch: [
      '.ndx-yt-course-box-watch'
    ],
    courseProgressBar: [
      '.ndx-yt-progress-bar'
    ],
    courseCompletedText: [
      '.ndx-yt-completed-text'
    ],
    coursePctText: [
      '.ndx-yt-pct-text'
    ],
    courseTimeDone: [
      '.ndx-yt-progress-time-done'
    ],
    courseTimeLeft: [
      '.ndx-yt-progress-time-left'
    ],
    courseTimeTotal: [
      '.ndx-yt-progress-time-total'
    ],
    courseProgressVideos: [
      '.ndx-yt-progress-videos'
    ],
    courseProgressSummary: [
      '.ndx-yt-progress-summary'
    ],
    courseCheckHost: [
      '.ndx-course-check-host'
    ],
    courseMenuAug: [
      '.ndx-course-menu-aug'
    ],
    courseBtn: [
      '.ndx-yt-course-btn'
    ],
    courseBtnPure: [
      '.ndx-yt-course-btn-pure'
    ],
    courseBtnWatch: [
      '.ndx-yt-course-btn-watch'
    ],
    courseUpdateBtn: [
      '.ndx-yt-course-update'
    ],
    courseDeleteBtn: [
      '.ndx-yt-course-delete'
    ],
    courseUpdateWatchBtn: [
      '.ndx-yt-course-update-watch'
    ],
    courseDeleteWatchBtn: [
      '.ndx-yt-course-delete-watch'
    ],
    courseCount: [
      '.ndx-yt-count'
    ],
    courseDuration: [
      '.ndx-yt-duration'
    ]
  }
};

// Global DOM selector helpers
window.DOM = {
  // Resolve selector key or list to an array of selectors
  resolve: function(keyOrArray) {
    if (Array.isArray(keyOrArray)) {
      return keyOrArray;
    }
    if (typeof keyOrArray === 'string') {
      const parts = keyOrArray.split('.');
      let current = window.SELECTORS;
      for (const part of parts) {
        if (current && typeof current === 'object') {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined) {
        return Array.isArray(current) ? current : [current];
      }
      return [keyOrArray]; // treat as direct selector string
    }
    return [];
  },

  // Returns the first element matching any of the selectors (fallback strategy)
  find: function(keyOrArray, parent = document) {
    const list = this.resolve(keyOrArray);
    for (const selector of list) {
      const el = parent.querySelector(selector);
      if (el) return el;
    }
    return null;
  },

  // Returns all elements matching ANY of the selectors (union strategy)
  findAll: function(keyOrArray, parent = document) {
    const list = this.resolve(keyOrArray);
    const results = [];
    for (const selector of list) {
      const els = parent.querySelectorAll(selector);
      results.push(...els);
    }
    // Remove duplicates to prevent performing actions multiple times on same element
    return [...new Set(results)];
  },

  // Returns all elements matching the first selector that yields any matches (fallback strategy for lists of elements)
  findAllFallback: function(keyOrArray, parent = document) {
    const list = this.resolve(keyOrArray);
    for (const selector of list) {
      const els = parent.querySelectorAll(selector);
      if (els.length > 0) {
        return Array.from(els);
      }
    }
    return [];
  },

  // Helper for closest matching using resolved selector keys/lists
  closest: function(el, keyOrArray) {
    if (!el || typeof el.closest !== 'function') return null;
    const list = this.resolve(keyOrArray);
    for (const selector of list) {
      const parent = el.closest(selector);
      if (parent) return parent;
    }
    return null;
  }
};
