// Reels hiding (when stories hidden)
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
