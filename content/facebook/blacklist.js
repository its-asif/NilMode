// Blacklist hiding logic
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
