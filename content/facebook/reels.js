// Reels hiding (when stories hidden)
function hideReelsPosts(){
  const posts = DOM.findAll('facebook.posts');
  posts.forEach(post => {
    if (post.dataset.ndxReelsHidden) return;
    const reelsIndicator = DOM.find('facebook.reelsIndicator', post);
    if (reelsIndicator && reelsIndicator.textContent && (reelsIndicator.textContent.includes('Reels') || reelsIndicator.textContent.includes('Short Video'))) {
      post.style.display = 'none';
      post.dataset.ndxReelsHidden = '1';
    }
  });
}
function restoreReelsPosts(){
  DOM.findAll('facebook.hiddenReelsPosts').forEach(post => {
    post.style.display = '';
    delete post.dataset.ndxReelsHidden;
  });
}
