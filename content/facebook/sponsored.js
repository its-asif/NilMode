// Sponsored posts detection and hiding
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
