(function () {
  const API_URL = 'http://localhost:3000/events';

  let userId = localStorage.getItem('mp_uid');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('mp_uid', userId);
  }

  function send(eventType, data) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        eventType,
        pageUrl: window.location.href,
        timestamp: Date.now(),
        scrollDepth: 0,
        ...data
      })
    }).catch(function () {});
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  send('pageview', {});

  window.addEventListener('scroll', debounce(function () {
    var depth = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    ) || 0;
    send('scroll', { scrollDepth: depth });
  }, 500));

  document.addEventListener('click', function (e) {
    send('click', { scrollDepth: 0, x: e.clientX, y: e.clientY });
  });

  document.addEventListener('mouseleave', function (e) {
    if (e.clientY <= 0) send('exit_intent', {});
  });

})();
