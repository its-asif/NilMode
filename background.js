// background.js
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  chrome.storage.sync.get(
    ["blockFacebook", "blockYouTube", "pauseToggle", "pauseUntil", "hideFacebookReelsPage"],
    data => {
      // Pause logic with timestamp validation
      if (data.pauseToggle) {
        const now = Date.now();
        if (data.pauseUntil && now > data.pauseUntil) {
          chrome.storage.sync.set({ pauseToggle: false, pauseUntil: null });
        } else {
          // still paused
          return;
        }
      }

      // Block Facebook (full site)
      if (data.blockFacebook && details.url.includes("facebook.com")) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("blocked.html?site=facebook")
        });
        return;
      }

      // Redirect individual Reels pages if feature enabled
      if (data.hideFacebookReelsPage && /https?:\/\/(www\.)?facebook\.com\/reel\//.test(details.url)) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("blocked.html?site=facebook")
        });
        return;
      }

      // Block YouTube
      if (data.blockYouTube && details.url.includes("youtube.com")) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("blocked.html?site=youtube")
        });
      }
    }
  );
}, { url: [{ urlMatches: ".*" }] });

// Handle Pause Auto-Off
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.pauseToggle) {
    if (changes.pauseToggle.newValue === true) {
      chrome.storage.sync.get(["pauseMinutes"], data => {
        const minutes = data.pauseMinutes || 5;
        const pauseUntil = Date.now() + minutes * 60 * 1000;
        chrome.storage.sync.set({ pauseUntil });
      });
    } else if (changes.pauseToggle.newValue === false) {
      // Clear timestamp when unpausing manually
      chrome.storage.sync.set({ pauseUntil: null });
    }
  }
});
