// utils.js - shared utility helpers for NilMode content scripts
// Visibility toggling helper retained verbatim from original content.js
function applyVisibility(selector, shouldHide) {
  const els = document.querySelectorAll(selector);
  els.forEach(el => {
    if (shouldHide) {
      if (!el.dataset.ndxHidden) {
        if (!el.dataset.ndxDisplay) {
          el.dataset.ndxDisplay = el.style.display || "";
        }
        el.dataset.ndxHidden = "1";
        el.style.display = "none";
      }
    } else {
      if (el.dataset.ndxHidden) {
        el.style.display = el.dataset.ndxDisplay;
        delete el.dataset.ndxDisplay;
        delete el.dataset.ndxHidden;
      } else if (el.style.display === 'none') {
        el.style.display = '';
      }
    }
  });
}
