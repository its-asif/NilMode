// Productive Facebook: inject ❌ buttons beside author names
function insertProductiveFacebookButtons() {
  const posts = DOM.findAll('facebook.posts');
  posts.forEach(post => {
    const container = DOM.find('facebook.postContainer', post);
    if (!container) return;
    const nameWrapper = DOM.find('facebook.postNameWrapper', container);
    if (!nameWrapper) return;
    if (DOM.find('facebook.productiveBtn', nameWrapper)) return; // already inserted
    const userSpan = DOM.find('facebook.postUserSpan', nameWrapper);
    if (!userSpan) return;

    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.className = 'ndx-pf-btn';
    btn.title = 'Productive: remove / dismiss (blacklist source)';
    Object.assign(btn.style, {
      marginLeft: '4px', cursor: 'pointer', border: 'none', background: 'transparent',
      padding: '0 4px', fontSize: '14px'
    });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const anchor = DOM.find('facebook.postAnchor', userSpan);
      if (!anchor || !anchor.href) return;
      const href = anchor.href;
      let title = '';
      let type = 'unknown';
      const personSpan = DOM.find('facebook.postPersonName', anchor);
      if (personSpan && personSpan.textContent.trim()) {
        title = personSpan.textContent.trim();
        type = 'person';
      } else {
        const groupSpan = DOM.find('facebook.postGroupName', anchor);
        if (groupSpan && groupSpan.textContent.trim()) {
          title = groupSpan.textContent.trim();
          type = 'group';
        } else if (anchor.textContent.trim()) {
          title = anchor.textContent.trim();
          type = 'page';
        }
      }
      if (!title) return;
      chrome.storage.local.get(['fbBlacklist'], data => {
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
          if (estimatedSize > 150000) {
            alert('Blacklist storage near limit. Please clear some entries.');
            return;
          }
          list.push(newEntry);
          chrome.storage.local.set({ fbBlacklist: list });
        }
      });
    });
    userSpan.insertAdjacentElement('afterend', btn);
  });
}
