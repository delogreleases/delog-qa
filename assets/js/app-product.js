/*
 * Delog — product page behaviour: product bar and scrollspy, count-up stats, screenshots carousel, scroll-reveal fallback, before/after slider, terminal.
 * Loaded before assets/js/app.js, which calls this with its internals.
 */
(window.DelogExt = window.DelogExt || {}).product = function (A) {
  'use strict';
  var $ = A.$, $$ = A.$$, root = A.root, body = A.body, reduceMotion = A.reduceMotion;

  /* --- launch page */

  // The product bar slides in once the hero has scrolled away; the link of the section you are …
  function setupLnav() {
    var pnav = A.pnav, hero = $('#overview');
    if (!pnav || !hero) return;
    // product.html?id=… isn't pre-built: add the product's section links to the pill here …
    if (!$('.pnav__group--product', pnav) && A.R.productNav) {
      var id = ($('[data-render="product-page"]') || body).getAttribute('data-product') || A.param('id');
      var p = A.byId(id || '');
      if (!p || !p.launch) return;
      $('.pnav__groups', pnav).insertAdjacentHTML('beforeend', A.R.productNav(p, A.ctx, 'group'));
      $('.pnav__logo', pnav).insertAdjacentHTML('afterend', A.R.productNav(p, A.ctx, 'name'));
    }
    var group = $('.pnav__group--product', pnav);
    root.classList.add('pnav-product');
    // the pill shows the product's sections once the hero has scrolled away …
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        pnav.classList.toggle('is-product', !en[0].isIntersecting);
        if (!en[0].isIntersecting) requestAnimationFrame(function () { A.glideHome(group); });
      }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
    } else pnav.classList.add('is-product');
    var links = $$('[data-spy]');
    var targets = links.map(function (l) { return document.getElementById(l.getAttribute('href').slice(1)); });
    var raf = 0, hovering = false;
    group.addEventListener('pointerenter', function () { hovering = true; });
    group.addEventListener('pointerleave', function () { hovering = false; });
    function spy() {
      raf = 0;
      var y = innerHeight * 0.35, best = null, bestSize = Infinity;
      targets.forEach(function (t) {
        if (!t) return;
        var r = t.getBoundingClientRect();
        if (r.top <= y && r.bottom > y && r.height < bestSize) { best = t; bestSize = r.height; }
      });
      links.forEach(function (l, i) { if (targets[i] === best) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      if (!hovering) A.glideHome(group);
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  // The reveal's floating chips drift with the pointer at three depths (while on screen only);
  function setupParallax() {
    var stage = $('.cine__sticky'), flips = $$('[data-flip]');
    var sda = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    if (!sda && flips.length && 'IntersectionObserver' in window && !reduceMotion) {
      var fo = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-flipped'); fo.unobserve(e.target); } }); }, { threshold: 0.5 });
      flips.forEach(function (f) { fo.observe(f); });
    }
    if (!stage || reduceMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var on = false, raf = 0, px = 0, py = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; }).observe(stage);
    window.addEventListener('pointermove', function (e) {
      if (!on) return;
      px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      });
    }, { passive: true });
  }

  // Stats count up once, when they come into view (the final value is already in the HTML).
  function setupCount() {
    var nums = $$('[data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseInt(el.getAttribute('data-count'), 10);
        if (!(to > 0)) return;
        var t0 = performance.now(), dur = 900 + to * 40;
        el.textContent = '0';
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = String(Math.round(to * e));
          if (k < 1) requestAnimationFrame(step); else el.textContent = String(to);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  // Screenshot carousel. Every slide (the last one too, thanks to a trailing spacer) snaps with …
  function setupCarousels() {
    $$('[data-carousel]').forEach(function (c) {
      var track = $('.carousel__track', c), slides = $$('.carousel__slide', c), dots = $$('.carousel__dot', c);
      var prev = $('[data-prev]', c), next = $('[data-next]', c), n = $('[data-carousel-n]', c);
      if (!track || !slides.length) return;
      var cur = 0, settleTimer = 0, last = slides.length - 1;
      var left = function (i) { return slides[i].offsetLeft - slides[0].offsetLeft; };
      function nearest() {
        var x = track.scrollLeft, best = 0, d = Infinity;
        slides.forEach(function (s, i) { var dd = Math.abs(left(i) - x); if (dd < d) { d = dd; best = i; } });
        return best;
      }
      function show(i, focus) {
        cur = i;
        slides.forEach(function (s, k) {
          var on = k === i;
          s.classList.toggle('is-active', on);
          var b = $('.carousel__shot', s);
          if (b) b.tabIndex = on ? 0 : -1;
        });
        dots.forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
        if (n) n.textContent = String(i + 1);
        if (prev) prev.disabled = i === 0;
        if (next) next.disabled = i === last;
        if (focus) { var b = $('.carousel__shot', slides[i]); if (b) b.focus({ preventScroll: true }); }
      }
      function go(i, focus) {
        i = Math.max(0, Math.min(last, i));
        show(i, focus);
        track.scrollTo({ left: left(i), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      function settle() { settleTimer = 0; var i = nearest(); if (i !== cur) show(i); }
      track.addEventListener('scroll', function () { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 140); }, { passive: true });
      track.addEventListener('scrollend', function () { clearTimeout(settleTimer); settle(); });
      if (prev) prev.addEventListener('click', function () { go(cur - 1); });
      if (next) next.addEventListener('click', function () { go(cur + 1); });
      dots.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
      track.addEventListener('keydown', function (e) {
        var to = e.key === 'ArrowRight' ? cur + 1 : e.key === 'ArrowLeft' ? cur - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
        if (to === null) return;
        e.preventDefault();
        go(to, true);
      });
      window.addEventListener('resize', function () { track.scrollLeft = left(cur); });
      show(0);
    });
  }

  // Browsers without CSS scroll-driven animations: drive the same effect with --p (0 → 1).
  function setupScrub() {
    var scenes = $$('.cine');
    if (!scenes.length || reduceMotion) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) return;
    root.classList.add('scrub-js');
    var raf = 0;
    function update() {
      raf = 0;
      scenes.forEach(function (el) {
        var r = el.getBoundingClientRect(), span = r.height - innerHeight;
        var p = span > 0 ? Math.min(1, Math.max(0, -r.top / (span * 0.75))) : 1;
        el.style.setProperty('--p', p.toFixed(4));
      });
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Before/after slider: a native range input over the two images (drag, click, keyboard).
  function setupCompare() {
    $$('[data-compare]').forEach(function (fig) {
      var stage = $('.compare__stage', fig), input = $('.compare__range', fig);
      if (!stage || !input) return;
      function set() {
        var v = Number(input.value);
        stage.style.setProperty('--pos', v + '%');
        input.setAttribute('aria-valuetext', v < 50 ? Math.round(100 - v) + '% after' : v > 50 ? Math.round(v) + '% before' : 'Half before, half after');
      }
      input.addEventListener('input', set);
      set();
    });
  }

  // Terminal: types the command, then prints the output, once it scrolls into view.
  function setupTerm() {
    $$('[data-term]').forEach(function (t) {
      var type = $('.term__type', t);
      if (type) type.style.setProperty('--n', type.getAttribute('data-chars') || '40');
      $$('.term__line', t).forEach(function (l, i) { l.style.setProperty('--i', String(i)); });
      if (reduceMotion || !('IntersectionObserver' in window)) { t.classList.add('is-done'); return; }
      t.classList.add('is-armed');
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { t.classList.add('is-in'); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(t);
    });
  }


  return { setup: function () { setupParallax(); setupLnav(); setupCount(); setupCarousels(); setupScrub(); setupCompare(); setupTerm(); } };
};
