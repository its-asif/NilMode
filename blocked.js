(function () {
  const params = new URLSearchParams(location.search);
  const site = params.get('site');
  const siteTag = document.getElementById('siteTag');
  const headline = document.getElementById('headline');
  const message = document.getElementById('message');
  const quoteEl = document.getElementById('quote');
  const streakEl = document.getElementById('streak');

  const siteCopy = {
    facebook: {
      tag: 'FACEBOOK BLOCKED',
      headline: 'Newsfeed Interrupted',
      message:
        'You were about to scroll an infinite feed. Instead, redirect that energy into something you control. Ship a feature. Read a chapter. Move your body.',
    },
    youtube: {
      tag: 'YOUTUBE BLOCKED',
      headline: 'YouTube Pattern Break',
      message:
        "Those recommendations are engineered to capture hours. Capture them back. Create, don't consume.",
    },
  };

  const quotes = [
    'Discipline is remembering what you want. - David Campbell',
    "You don't need more time, you need more focus.",
    'Small, daily progress compounds into unstoppable momentum.',
    'Action cures anxiety.',
    'Your future self is watching. Make them proud.',
    'Once you control your attention, you control your trajectory.',
    'The algorithm is powerful. Your intent is stronger.',
  ];

  if (site && siteCopy[site]) {
    const c = siteCopy[site];
    siteTag.textContent = c.tag;
    headline.textContent = c.headline;
    message.textContent = c.message;
  } else {
    message.textContent =
      'This page was blocked to protect your focus window. Choose an intentional task and execute it now.';
  }

  quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  document.getElementById('goBack').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.close();
  });

  // ── Focus streak counter ──────────────────────────────
  // Tracks how many times each site has been blocked today.
  if (streakEl && site) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    chrome.storage.local.get(['blockStreaks'], data => {
      const streaks = data.blockStreaks || {};
      const entry = streaks[site] || { date: '', count: 0 };

      if (entry.date === today) {
        entry.count += 1;
      } else {
        // New day - reset streak for this site
        entry.date = today;
        entry.count = 1;
      }
      streaks[site] = entry;
      chrome.storage.local.set({ blockStreaks: streaks });

      const n = entry.count;
      const label = n === 1
        ? '1st block today'
        : n < 5
          ? `${n} blocks today - you're holding strong`
          : n < 10
            ? `${n} blocks today - impressive self-control`
            : `${n} blocks today - absolute machine 🔒`;

      streakEl.textContent = '🛡 ' + label;
      streakEl.classList.add('visible');
    });
  }
})();
