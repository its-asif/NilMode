(function () {
  const params = new URLSearchParams(location.search);
  const site = params.get('site');
  const siteTag = document.getElementById('siteTag');
  const headline = document.getElementById('headline');
  const message = document.getElementById('message');
  const quoteEl = document.getElementById('quote');

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
    'Discipline is remembering what you want. — David Campbell',
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
})();
