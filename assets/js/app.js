/*
 * Delog — page behaviour. No dependencies, no network requests (except reading a local
 * license file over http/https), no storage beyond the theme preference.
 */
(function () {
  'use strict';

  var R = window.DelogRender;
  var SITE = window.DELOG_SITE || {};
  var PRODUCTS = window.DELOG_PRODUCTS || [];
  var root = document.documentElement;
  var body = document.body;
  var ctx = { base: body.getAttribute('data-base') || '', site: SITE, products: PRODUCTS };
  var C = R.cfg(SITE);
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function param(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  /* --- theme */

  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function storedTheme() { var a = root.getAttribute('data-theme'); return a === 'light' || a === 'dark' ? a : 'system'; }
  function effectiveTheme() { var s = storedTheme(); return s !== 'system' ? s : (mq && mq.matches ? 'dark' : 'light'); }
  function setTheme(t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    try { if (t === 'light' || t === 'dark') localStorage.setItem('delog-theme', t); else localStorage.removeItem('delog-theme'); } catch (e) {}
    syncTheme();
  }
  function syncTheme() {
    var eff = effectiveTheme(), st = storedTheme();
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', eff === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      b.setAttribute('data-current', eff);
    });
    $$('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === st)); });
    applyAccents();
  }
  function applyAccents() {
    var eff = effectiveTheme();
    $$('[data-accent-dark]').forEach(function (el) {
      var c = el.getAttribute(eff === 'dark' ? 'data-accent-dark' : 'data-accent-light');
      if (c) el.style.setProperty('--accent', c);
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-theme-toggle]');
    if (t) { setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'); return; }
    var s = e.target.closest('[data-theme-set]');
    if (s) setTheme(s.getAttribute('data-theme-set'));
  });
  if (mq) (mq.addEventListener ? mq.addEventListener('change', syncTheme) : mq.addListener(syncTheme));

  /* --- header */

  // The nav islands merge into one once the page is scrolled; a highlight slides between links.
  var pnav = $('[data-pnav]'), sheet = $('#site-sheet'), scrim = $('[data-sheet-close]'), navBtn = $('[data-nav-toggle]');
  function sheetOpen() { return sheet && !sheet.hidden; }
  function setSheet(open, focusBack) {
    if (!sheet) return;
    sheet.hidden = !open;
    if (scrim) scrim.hidden = !open;
    root.classList.toggle('sheet-open', open);
    if (pnav) pnav.classList.toggle('is-open', open);
    if (navBtn) { navBtn.setAttribute('aria-expanded', String(open)); navBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if (open) {
      $$('a', sheet).forEach(function (a, i) { a.style.setProperty('--i', String(i)); });
      var first = $('a', sheet); if (first) first.focus();
    } else if (focusBack && navBtn) navBtn.focus();
  }
  if (navBtn) navBtn.addEventListener('click', function () { setSheet(!sheetOpen()); });
  if (sheet) sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
  if (scrim) scrim.addEventListener('click', function () { setSheet(false, true); });
  document.addEventListener('keydown', function (e) {
    if (!sheetOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); setSheet(false, true); return; }
    if (e.key !== 'Tab') return;
    var f = [navBtn].concat($$('a[href], button:not([disabled])', sheet)).filter(function (x) { return x && x.getClientRects().length; });
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 860 && sheetOpen()) setSheet(false); });
  var navRaf = 0, compact = null;
  function onScroll() {
    navRaf = 0;
    var c = window.scrollY > 40;
    if (!pnav || c === compact) return;
    compact = c;
    pnav.classList.toggle('is-compact', c);
    // the merged island's own logo and Download take over from the hidden side islands
    $$('.pnav__mini', pnav).forEach(function (a) { a.tabIndex = c ? 0 : -1; });
  }
  onScroll();
  window.addEventListener('scroll', function () { if (!navRaf) navRaf = requestAnimationFrame(onScroll); }, { passive: true });
  // sliding highlight (each [data-glide] group has its own)
  function glideTo(group, a) {
    var g = $('.pnav__glide', group);
    if (!g) return;
    if (!a) { group.classList.remove('has-glide'); return; }
    g.style.setProperty('--gx', a.offsetLeft + 'px');
    g.style.setProperty('--gw', a.offsetWidth + 'px');
    group.classList.add('has-glide');
  }
  function glideHome(group) { glideTo(group, $('a[aria-current]', group)); }
  $$('[data-glide]').forEach(function (group) {
    group.addEventListener('pointerover', function (e) { var a = e.target.closest('a'); if (a) glideTo(group, a); });
    group.addEventListener('focusin', function (e) { var a = e.target.closest('a'); if (a) glideTo(group, a); });
    group.addEventListener('pointerleave', function () { glideHome(group); });
    group.addEventListener('focusout', function () { glideHome(group); });
    glideHome(group);
    // follow the links when the bar compacts, resizes or fonts load
    if (window.ResizeObserver) new ResizeObserver(function () { if (group.offsetWidth && !group.matches(':hover,:focus-within')) glideHome(group); }).observe(group);
  });

  /* --- the Products menu in the top bar */

  // A link to the Products page that opens a menu of every product instead (without JavaScript
  // it simply goes there). Click or Enter opens it; Escape, a click outside or leaving it closes it;
  // the arrow keys move between its items. On a pointer that hovers, resting on it opens it too.
  var drop = $('[data-drop]'), dropPanel = $('[data-drop-panel]'), dropTimer = 0;
  function dropOpen() { return dropPanel && !dropPanel.hidden; }
  function setDrop(open, focus) {
    if (!drop || !dropPanel || open === dropOpen()) { if (open && focus) focusItem(0); return; }
    dropPanel.hidden = !open;
    drop.setAttribute('aria-expanded', String(open));
    if (pnav) pnav.classList.toggle('has-menu', open);
    if (open && focus) focusItem(0);
    if (!open && focus === 'back') drop.focus();
  }
  function items() { return $$('a', dropPanel); }
  function focusItem(i) { var list = items(); if (list.length) list[(i + list.length) % list.length].focus(); }
  if (drop && dropPanel) {
    drop.addEventListener('click', function (e) {
      e.preventDefault();
      // e.detail is 0 for a keyboard press: then the first product takes the focus.
      setDrop(!dropOpen(), e.detail === 0);
    });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDrop(true, true); }
    });
    dropPanel.addEventListener('keydown', function (e) {
      var list = items(), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); focusItem(i + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i <= 0) setDrop(false, 'back'); else focusItem(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
      else if (e.key === 'End') { e.preventDefault(); focusItem(-1); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dropOpen()) { e.preventDefault(); setDrop(false, 'back'); } });
    document.addEventListener('pointerdown', function (e) { if (dropOpen() && !dropPanel.contains(e.target) && !drop.contains(e.target)) setDrop(false); });
    dropPanel.addEventListener('focusout', function (e) { if (e.relatedTarget && !dropPanel.contains(e.relatedTarget) && e.relatedTarget !== drop) setDrop(false); });
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var hoverIn = function () { clearTimeout(dropTimer); dropTimer = setTimeout(function () { setDrop(true); }, 120); };
      var hoverOut = function () { clearTimeout(dropTimer); dropTimer = setTimeout(function () { setDrop(false); }, 260); };
      [drop, dropPanel].forEach(function (el) { el.addEventListener('pointerenter', hoverIn); el.addEventListener('pointerleave', hoverOut); });
    }
    // The product's own section links take over the bar past the hero: the menu goes with the main links.
    window.addEventListener('scroll', function () { if (dropOpen() && pnav && pnav.classList.contains('is-product')) setDrop(false); }, { passive: true });
  }

  /* --- site config into static pages */

  // site.config.js → [data-cfg] text, [data-cfg-if]/[data-cfg-unless] visibility, [data-email] links.
  function fillSite() {
    $$('[data-cfg]').forEach(function (el) {
      var v = C[el.getAttribute('data-cfg')];
      if (v != null) el.textContent = v;
    });
    $$('[data-cfg-if]').forEach(function (el) { el.hidden = !C[el.getAttribute('data-cfg-if')]; });
    $$('[data-cfg-unless]').forEach(function (el) { el.hidden = !!C[el.getAttribute('data-cfg-unless')]; });
    $$('[data-email]').forEach(function (a) {
      var addr = C['email.' + a.getAttribute('data-email')];
      if (!addr) { a.hidden = true; return; }
      a.hidden = false;
      a.setAttribute('href', R.mailto(addr, a.getAttribute('data-subject')));
      if (a.hasAttribute('data-email-text')) a.textContent = addr;
    });
    $$('[data-signed]').forEach(function (el) {
      var k = el.getAttribute('data-signed');
      var on = !!(SITE.codeSigning && SITE.codeSigning[k]);
      el.hidden = el.getAttribute('data-signed-when') === 'yes' ? !on : on;
    });
    var soc = $('[data-social]');
    if (soc && SITE.social && SITE.social.length) {
      soc.innerHTML = SITE.social.map(function (s) {
        return '<li><a href="' + R.esc(s.url) + '" rel="me noopener">' + R.esc(s.label) + '</a></li>';
      }).join('');
      soc.hidden = false;
    }
  }

  /* --- data regions */

  function region(el, html) {
    // Pre-rendered by tools/build-pages.mjs? Skip the re-render if the output is unchanged.
    var h = hash(html);
    if (el.getAttribute('data-rendered') === h) return;
    el.innerHTML = html;
    el.setAttribute('data-rendered', h);
  }

  function renderRegions() {
    $$('[data-render]').forEach(function (el) {
      var kind = el.getAttribute('data-render');
      var p = byId(el.getAttribute('data-product') || param('id') || '');
      switch (kind) {
        case 'products-grid':
          region(el, R.productsGrid(PRODUCTS, ctx, { withNext: el.getAttribute('data-next') !== 'false' }));
          break;
        case 'download-cta':
          if (p) region(el, R.downloadCta(p, ctx, el.getAttribute('data-variant') === 'launch'
            ? { launch: true, secondaryHref: el.getAttribute('data-secondary-href'), secondaryLabel: el.getAttribute('data-secondary-label') } : undefined));
          break;
        case 'hero-shot':
          if (p) region(el, R.heroShot(p, ctx, true));
          break;
        case 'changelog':
          region(el, R.changelog(PRODUCTS, ctx));
          break;
        case 'changelog-filters':
          region(el, R.changelogFilters(PRODUCTS));
          break;
        case 'verify':
          if (p) { var rel = R.latest(p); var f = rel && (R.filesFor(rel, 'windows')[0] || rel.files[0]); if (f) region(el, R.verifyBlock(f, { id: 'home-' + p.id })); }
          break;
        case 'licenses':
          region(el, R.licensesList(PRODUCTS, ctx));
          break;
        case 'product-page':
          renderProductPage(el);
          break;
        case 'download-page':
          if (P.renderDownloadPage) P.renderDownloadPage(el);
          break;
      }
    });
  }

  function renderProductPage(el) {
    var id = el.getAttribute('data-product') || param('id');
    var p = byId(id || '');
    if (!p) {
      el.innerHTML = '<section class="section section--first"><div class="container narrow">' +
        '<p class="eyebrow">Not found</p><h1 class="page-title">We couldn’t find that product.</h1>' +
        '<p class="lead">It may have been renamed. Every product is listed on the products page.</p>' +
        '<p><a class="btn btn--primary" href="' + ctx.base + 'products.html">See all products' + R.icon('arrow') + '</a></p></div></section>';
      return;
    }
    var key = hash(JSON.stringify(p) + JSON.stringify(SITE));
    if (el.getAttribute('data-product') !== p.id || el.getAttribute('data-rendered') !== key) {
      el.innerHTML = R.productPage(p, ctx);
      el.setAttribute('data-rendered', key);
    }
    body.setAttribute('data-accent-dark', (p.accent || {}).dark || '');
    body.setAttribute('data-accent-light', (p.accent || {}).light || '');
    body.classList.toggle('has-lnav', !!p.launch);
    if (!el.hasAttribute('data-product')) {
      document.title = p.name + ' — ' + p.tagline.replace(/\.$/, '') + ' · ' + C.company;
      var md = $('meta[name="description"]');
      if (md) md.setAttribute('content', p.description);
      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = R.jsonLd(p, SITE, (SITE.baseUrl || '') + '/products/' + p.id + '.html');
      document.head.appendChild(ld);
    }
  }

  /* --- OS detection */

  function detectOS() {
    var uad = navigator.userAgentData;
    var ua = navigator.userAgent || '';
    var s = ((uad && uad.platform) || '') + ' ' + ua;
    s = s.toLowerCase();
    var r = { os: 'unknown', arch: /arm64|aarch64/.test(s) ? 'arm64' : 'x64', mobile: false };
    if (/android/.test(s)) { r.os = 'android'; r.mobile = true; }
    else if (/iphone|ipad|ipod/.test(s) || (/macintosh/.test(s) && navigator.maxTouchPoints > 1)) { r.os = 'ios'; r.mobile = true; }
    else if (/windows|win32|win64/.test(s)) r.os = 'windows';
    else if (/mac ?os|macintosh/.test(s)) r.os = 'macos';
    else if (/cros/.test(s)) r.os = 'chromeos';
    else if (/linux|x11|ubuntu|fedora|debian/.test(s)) r.os = 'linux';
    return r;
  }
  var OS = detectOS();
  var OS_LABEL = { android: 'Android', ios: 'iOS', chromeos: 'ChromeOS', windows: 'Windows', macos: 'macOS', linux: 'Linux' };

  function pickFile(p, platform, arch) {
    var files = R.filesFor(R.latest(p), platform);
    if (!files.length) return null;
    var pref = files.filter(function (f) { return f.arch === arch || f.arch === 'universal'; });
    var pool = pref.length ? pref : files;
    var inst = pool.filter(function (f) { return f.kind !== 'portable' && f.kind !== 'zip'; });
    return (inst.length ? inst : pool)[0];
  }
  function firstAvailablePlatform(p) {
    var rel = R.latest(p);
    for (var i = 0; i < R.PLATFORMS.length; i++) if (R.filesFor(rel, R.PLATFORMS[i]).length) return R.PLATFORMS[i];
    return null;
  }

  function retargetCtas() {
    $$('[data-dl-cta]').forEach(function (box) {
      var p = byId(box.getAttribute('data-dl-cta'));
      if (!p) return;
      var rel = R.latest(p);
      var a = $('[data-dl-primary]', box), label = $('[data-dl-label]', box), ic = $('[data-dl-icon]', box);
      var meta = $('[data-dl-meta]', box), note = $('[data-dl-note]', box);
      var target = R.filesFor(rel, OS.os).length ? OS.os : firstAvailablePlatform(p);
      if (!target || !a) return;
      var f = pickFile(p, target, OS.arch);
      a.setAttribute('href', R.downloadHref(p, ctx, target));
      label.textContent = 'Download for ' + R.PLATFORM_NAME[target];
      ic.innerHTML = R.icon(target);
      if (meta && f) {
        var size = R.fmtSize(f.size);
        meta.textContent = 'v' + rel.version + ' · ' + R.PLATFORM_NAME[target] + ' · ' + f.arch + (size ? ' · ' + size : '') + (R.isFree(p) ? ' · free' : '') + ' · no account needed';
      }
      if (note) {
        var msg = '';
        if (OS.mobile) {
          msg = R.esc(p.name) + ' is a desktop app for ' + R.esc(R.osSummary(p)) + '. Open this page on your computer to install it.';
        } else if (OS.os !== 'unknown' && OS.os !== target) {
          var st = R.platformStatus(p, OS.os);
          msg = st === 'coming-soon'
            ? R.esc(p.name) + ' for ' + OS_LABEL[OS.os] + ' is coming soon. <a href="' + R.esc(R.notifyHref(p, ctx, OS.os)) + '">Get an email when it ships</a>.'
            : R.esc(p.name) + ' isn’t available for ' + R.esc(OS_LABEL[OS.os] || 'your system') + ' yet.';
        }
        note.innerHTML = msg;
        note.hidden = !msg;
      }
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-dl-file]');
    if (!a) return;
    var p = byId(a.getAttribute('data-product'));
    if (!p) return;
    // The browser downloads the file (default action); we only add the verification panel.
    if (!(P.showThanks && P.showThanks(p, a.getAttribute('data-version'), a.getAttribute('data-filename')))) {
      toast('Downloading ' + a.getAttribute('data-filename') + '. <a href="#verify" data-open-verify>How to verify it</a>');
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-open-verify]')) return;
    var d = $('#verify'); if (d) d.open = true;
  });

  /* --- copy */

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.className = 'sr-only';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); }
      ta.remove();
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    copyText(b.getAttribute('data-copy')).then(function () {
      b.classList.add('is-copied');
      var t = $('.copy__txt', b); var prev = t && t.textContent;
      if (t) t.textContent = 'Copied';
      toast('Copied to clipboard');
      setTimeout(function () { b.classList.remove('is-copied'); if (t) t.textContent = prev; }, 1600);
    }, function () { toast('Couldn’t copy — select the text and copy it manually.'); });
  });

  /* --- toast */

  var toastEl, toastTimer;
  function toast(html) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = html;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200);
  }

  /* --- tabs */

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t && !t.closest('[data-demo]')) selectTab(t);
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('[role="tab"]');
    if (!t || t.closest('[data-demo]')) return;
    var tabs = $$('[role="tab"]', t.parentNode), i = tabs.indexOf(t), n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') n = tabs[0];
    else if (e.key === 'End') n = tabs[tabs.length - 1];
    if (n) { e.preventDefault(); selectTab(n); n.focus(); }
  });
  function selectTab(t) {
    var list = t.parentNode;
    $$('[role="tab"]', list).forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.setAttribute('tabindex', on ? '0' : '-1');
      var panel = document.getElementById(x.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
  }

  /* --- lightbox */

  var lb, lbItems = [], lbIndex = 0, lbReturn = null;
  function buildLightbox() {
    lb = document.createElement('dialog');
    lb.className = 'lightbox';
    lb.setAttribute('aria-label', 'Screenshot viewer');
    lb.innerHTML =
      '<div class="lightbox__inner">' +
      '<figure class="lightbox__fig"><img class="lightbox__img" alt="" width="1440" height="900"><figcaption class="lightbox__cap"><span class="mono lightbox__n"></span><span class="lightbox__title"></span></figcaption></figure>' +
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close">' + R.icon('x') + '</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous screenshot">' + R.icon('chevronLeft') + '</button>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next screenshot">' + R.icon('chevronRight') + '</button>' +
      '</div>';
    document.body.appendChild(lb);
    $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
    $('.lightbox__prev', lb).addEventListener('click', function () { lbShow(lbIndex - 1); });
    $('.lightbox__next', lb).addEventListener('click', function () { lbShow(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__inner')) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lbIndex + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbShow(lbIndex - 1); }
    });
    lb.addEventListener('close', function () { root.classList.remove('has-modal'); if (lbReturn) lbReturn.focus(); });
  }
  function lbShow(i) {
    var n = lbItems.length;
    lbIndex = (i + n) % n;
    var b = lbItems[lbIndex];
    var im = $('.lightbox__img', lb);
    im.src = b.getAttribute('data-full') + '-' + effectiveTheme() + '-1440.webp';
    im.alt = b.getAttribute('data-alt');
    $('.lightbox__n', lb).textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    $('.lightbox__title', lb).textContent = b.getAttribute('data-title');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lightbox]');
    if (!b) return;
    if (typeof HTMLDialogElement === 'undefined') { window.open(b.getAttribute('data-full'), '_blank', 'noopener'); return; }
    if (!lb) buildLightbox();
    lbItems = $$('[data-lightbox]', b.closest('[data-gallery]') || document);
    lbReturn = b;
    lbShow(lbItems.indexOf(b));
    lb.showModal();
    root.classList.add('has-modal');
  });

  /* --- license text */

  function loadLicenses() {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    $$('[data-license-src]').forEach(function (pre) {
      fetch(pre.getAttribute('data-license-src')).then(function (r) { return r.ok ? r.text() : null; })
        .then(function (t) { if (t) pre.textContent = t; }).catch(function () {});
    });
  }

  /* --- reveal */

  function setupReveal() {
    var els = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window) || !els.length) return;
    root.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach(function (el, i) {
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 6) * 60 + 'ms');
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      else io.observe(el);
    });
  }

  /* --- 3D: tilt + pausing */

  // [data-tilt3d="max degrees"]: a gentle 3D tilt and a light sheen that follow the pointer …
  function setupDepth() {
    document.addEventListener('visibilitychange', function () { root.classList.toggle('is-hidden', document.hidden); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('is-paused', !e.isIntersecting); }); }, { rootMargin: '80px 0px' });
      $$('[data-anim]').forEach(function (el) { el.classList.add('is-paused'); io.observe(el); });
    }
    if (reduceMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('[data-tilt3d]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt3d')) || 4, raf = 0, x = 0, y = 0;
      el.classList.add('tilt3d');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          el.style.setProperty('--ry', ((x - 0.5) * 2 * max).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - y) * 2 * max).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerenter', function () { el.classList.add('is-tilting'); });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* --- extensions
     app-pages.js (download page, filters) and app-product.js (product page) load before this
     file on the pages that need them and receive these internals. */

  var A = { $: $, $$: $$, R: R, SITE: SITE, PRODUCTS: PRODUCTS, root: root, body: body, ctx: ctx, C: C, reduceMotion: reduceMotion,
    byId: byId, param: param, OS: OS, OS_LABEL: OS_LABEL, pickFile: pickFile, firstAvailablePlatform: firstAvailablePlatform,
    toast: toast, effectiveTheme: effectiveTheme, pnav: pnav, glideHome: glideHome };
  var EXT = window.DelogExt || {};
  var P = EXT.pages ? EXT.pages(A) : {};
  var Q = EXT.product ? EXT.product(A) : {};

  /* --- boot */

  fillSite();
  renderRegions();
  retargetCtas();
  if (P.setupFilters) P.setupFilters();
  setupDepth();
  if (Q.setup) Q.setup();
  syncTheme();
  loadLicenses();
  setupReveal();
  if (location.hash) {
    var tgt = document.getElementById(location.hash.slice(1));
    if (tgt && tgt.tagName === 'DETAILS') tgt.open = true;
    if (tgt) tgt.scrollIntoView();
  }
})();
