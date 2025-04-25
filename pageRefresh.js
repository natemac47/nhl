(function aggressivelyPreventPageJump() {
  if (window.self !== window.top) return;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

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

  scrollFix();
  var interval = setInterval(scrollFix, 100);

  window.addEventListener('DOMContentLoaded', scrollFix);

  window.addEventListener('load', scrollFix);
})();
