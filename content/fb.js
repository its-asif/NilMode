// fb.js - Facebook specific features: productive buttons, blacklist, sponsored + reels hiding

// Insert Productive Facebook buttons beside post author names
function insertProductiveFacebookButtons() {
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    const container = post.querySelector('.xu06os2.x1ok221b');
    if (!container) return;
    const nameWrapper = container.querySelector('span.xt0psk2');
    if (!nameWrapper) return;
    if (nameWrapper.querySelector('.ndx-pf-btn')) return;
    const userSpan = nameWrapper.querySelector('span.xjp7ctv');
    if (!userSpan) return;

    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.className = 'ndx-pf-btn';
    btn.title = 'Productive: remove / dismiss (blacklist source)';
    Object.assign(btn.style, {
      marginLeft: '4px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      padding: '0 4px',
      fontSize: '14px'
    });
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
          title = anchor.textContent.trim();
          type = 'page';
        }
      }
      if (!title) return;

      chrome.storage.sync.get(['fbBlacklist'], data => {
        const list = Array.isArray(data.fbBlacklist) ? data.fbBlacklist : [];
        const pathKey = (() => {
          try {
            const u = new URL(href);
            let p = u.pathname;
            if (p.startsWith('/groups/')) {
              const segs = p.split('/').filter(Boolean);
              if (segs.length >= 2) p = `/groups/${segs[1]}/`;
            } else {
              if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
            }
            return p.startsWith('/') ? p.slice(1) : p;
          } catch { return href; }
        })();
        if (!pathKey) return;
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
        }
      });
    });
    userSpan.insertAdjacentElement('afterend', btn);
  });
}

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

// Sponsored posts
const SPONSORED_SELECTOR = '.xt0psk2.x1qlqyl8.x1n2onr6.x17ihmo5.x1o7lsid';
function hideSponsoredPosts(){
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    if (post.dataset.ndxSponsoredHidden) return;
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

// Reels hiding
function hideReelsPosts(){
  const posts = document.querySelectorAll('.x1lliihq');
  posts.forEach(post => {
    if (post.dataset.ndxReelsHidden) return;
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
