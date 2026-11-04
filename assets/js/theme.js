/* Delog — runs in <head> before first paint: applies the saved theme so there is no flash. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var t = null;
  try { t = localStorage.getItem('delog-theme'); } catch (e) { /* storage blocked: follow the system */ }
  if (t !== 'light' && t !== 'dark') {
    var def = window.DELOG_SITE && window.DELOG_SITE.defaultTheme;
    t = def === 'light' || def === 'dark' ? def : null;
  }
  if (t) d.setAttribute('data-theme', t);
})();
