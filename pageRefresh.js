(function aggressivelyPreventPageJump() {
  if (window.self !== window.top) return;

  // 1. Turn off history-based scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // 2. A helper that forces every container back to 0,0
  var attempts = 0, maxAttempts = 20;
  function scrollFix() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    var spScroll = document.querySelector('.sp-scroll');
    if (spScroll) spScroll.scrollTop = 0;
    var mainBody = document.querySelector('main.body');
    if (mainBody) mainBody.scrollTop = 0;
    if (++attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }

  // 3. Run it right away…
  scrollFix();
  var interval = setInterval(scrollFix, 100);

  // …again as soon as the DOM is parsed (fires before load)
  window.addEventListener('DOMContentLoaded', scrollFix);

  // …and one more time on load to clean up
  window.addEventListener('load', scrollFix);
})();
