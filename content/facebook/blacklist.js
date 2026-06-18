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
  const posts = DOM.findAll('facebook.posts');
  posts.forEach(post => {
    const container = DOM.find('facebook.postContainer', post);
    if(!container) return;
    const nameWrapper = DOM.find('facebook.postNameWrapper', container);
    if(!nameWrapper) return;
    const anchor = DOM.find('facebook.postAuthorLink', nameWrapper);
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
