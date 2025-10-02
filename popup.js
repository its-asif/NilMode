// === TAB SWITCH ===
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// === SAVE STATE TO STORAGE ===
const toggles = [
  "blockFacebook", "hideFacebookFeed", "hideFacebookStories", "hideRightSidebar",
  "blockYouTube", "hideYTRecs", "hideYTShorts", "hideYTComments", "hideYTNext",
  "pauseToggle"
];

toggles.forEach(id => {
  const el = document.getElementById(id);
  if(!el) return;
  chrome.storage.sync.get([id], data => {
    el.checked = data[id] || false;
  });
  el.addEventListener("change", () => {
    const update = { [id]: el.checked };
    if(id === 'pauseToggle' && el.checked === false){
      update.pauseUntil = null; // ensure cleared when manually unpausing
    }
    chrome.storage.sync.set(update);
  });
});

// === Pause Minutes ===
const pauseInput = document.getElementById("pauseMinutes");
chrome.storage.sync.get(["pauseMinutes"], data => {
  if (data.pauseMinutes) pauseInput.value = data.pauseMinutes;
});
pauseInput.addEventListener("change", () => {
  chrome.storage.sync.set({ pauseMinutes: parseInt(pauseInput.value) });
});
