/*
 * Delog — download page and list filters.
 * Loaded before assets/js/app.js, which calls this with its internals.
 */
(window.DelogExt = window.DelogExt || {}).pages = function (A) {
  'use strict';
  var $ = A.$, $$ = A.$$, R = A.R, SITE = A.SITE, PRODUCTS = A.PRODUCTS, body = A.body, ctx = A.ctx, C = A.C, reduceMotion = A.reduceMotion, byId = A.byId, param = A.param, OS = A.OS, OS_LABEL = A.OS_LABEL, pickFile = A.pickFile, firstAvailablePlatform = A.firstAvailablePlatform;

  /* --- download page */

  function renderDownloadPage(el) {
    var p = byId(param('product') || '');
    if (!p) {
      el.innerHTML = '<section class="page-head"><div class="mesh" aria-hidden="true"></div><div class="container"><p class="eyebrow">Downloads</p><h1 class="page-title">Choose a product.</h1>' +
        '<p class="lead">Every Delog product, with installers for each platform it supports.</p></div></section>' + R.rule() + '<section><div class="container"><h2 class="sr-only">Products</h2>' +
        '<div class="grid-cards">' + R.productsGrid(PRODUCTS, ctx, { withNext: false }) + '</div></div></section>';
      return;
    }
    var rel = R.latest(p);
    body.setAttribute('data-accent-dark', (p.accent || {}).dark || '');
    body.setAttribute('data-accent-light', (p.accent || {}).light || '');
    document.title = 'Download ' + p.name + ' · ' + C.company;
    var requested = param('platform');
    var platform = R.PLATFORM_NAME[requested] ? requested
      : (R.PLATFORM_NAME[OS.os] ? OS.os : (firstAvailablePlatform(p) || 'windows'));
    var detectedLine = R.PLATFORM_NAME[OS.os]
      ? 'Detected: ' + OS_LABEL[OS.os] + (OS.os !== 'macos' ? ' · ' + OS.arch : '')
      : (OS.mobile ? 'You’re on ' + OS_LABEL[OS.os] + ' — ' + p.name + ' is a desktop app' : 'We couldn’t detect your system');

    var h = '<section class="dl-hero"><div class="mesh" aria-hidden="true"></div><div class="container">' +
      '<nav class="crumbs mono" aria-label="Breadcrumb"><a href="' + ctx.base + 'products.html">Products</a><span aria-hidden="true">/</span>' +
      '<a href="' + R.esc(R.productHref(p, ctx)) + '">' + R.esc(p.name) + '</a><span aria-hidden="true">/</span><span aria-current="page">Download</span></nav>' +
      '<div class="dl-hero__head">' + R.img(p.icon, ctx, '', 64, 64, 'dl-hero__icon', true) +
      '<div><h1 class="page-title">Download ' + R.esc(p.name) + '</h1>' +
      '<p class="lead">' + (rel ? 'Version ' + R.esc(rel.version) + ' · released ' + R.esc(R.fmtDate(rel.date)) : 'Not released yet') + '</p></div></div>' +
      '<p class="detect mono">' + R.icon(R.PLATFORM_NAME[OS.os] ? OS.os : 'monitor') + R.esc(detectedLine) + '</p>' +
      '<div class="seg" role="group" aria-label="Platform">' + R.PLATFORMS.filter(function (k) { return R.platformStatus(p, k) || R.filesFor(rel, k).length; }).map(function (k) {
        return '<button type="button" class="seg__btn" data-platform="' + k + '" aria-pressed="' + (k === platform) + '">' + R.icon(k) + R.PLATFORM_NAME[k] + '</button>';
      }).join('') + '</div>' +
      '<div class="dl-main" data-dl-main></div>' +
      '<div class="thanks" data-thanks hidden tabindex="-1"></div>' +
      '</div></section>';
    if (rel) {
      h += R.rule() + '<section class="section" id="all"><div class="container">' +
        R.sectionHead('All downloads', p.name + ' ' + rel.version, 'Every file in this release, with its size and SHA-256 checksum.') +
        R.filesTable(p, rel, ctx) +
        '<p class="more"><a class="link-arrow" href="' + R.esc(R.productHref(p, ctx)) + '#release-notes">Release notes' + R.icon('arrow') + '</a>' +
        '<a class="link-arrow" href="' + ctx.base + 'changelog.html?product=' + encodeURIComponent(p.id) + '">Previous versions' + R.icon('arrow') + '</a></p>' +
        '</div></section>';
    }
    el.innerHTML = h;

    function show(k) {
      platform = k;
      $$('.seg__btn', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-platform') === k)); });
      $('[data-dl-main]', el).innerHTML = mainCard(p, rel, k);
      $('[data-thanks]', el).hidden = true;
    }
    $$('.seg__btn', el).forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-platform')); }); });
    show(platform);
  }

  function mainCard(p, rel, k) {
    var f = rel && pickFile(p, k, OS.arch);
    if (!f) {
      var st = R.platformStatus(p, k);
      return '<div class="dl-card dl-card--empty">' + R.icon(k, 'dl-card__os') +
        '<div class="dl-card__info"><h2>' + R.esc(p.name) + ' for ' + R.PLATFORM_NAME[k] + (st === 'coming-soon' ? ' is coming soon' : ' isn’t available') + '</h2>' +
        '<p>' + (st === 'coming-soon' ? 'We’re working on it. Leave your email and we’ll tell you when it ships.' : 'There is no ' + R.PLATFORM_NAME[k] + ' build of this product.') + '</p></div>' +
        (st === 'coming-soon' ? '<a class="btn btn--primary btn--lg" href="' + R.esc(R.notifyHref(p, ctx, k)) + '">' + R.icon('mail') + 'Notify me</a>' : '') + '</div>';
    }
    var size = R.fmtSize(f.size);
    var signed = SITE.codeSigning && SITE.codeSigning[k];
    return '<div class="dl-card">' + R.icon(k, 'dl-card__os') +
      '<div class="dl-card__info"><p class="eyebrow">Recommended for ' + R.PLATFORM_NAME[k] + '</p>' +
      '<h2 class="dl-card__file">' + R.esc(f.filename) + '</h2>' +
      '<p class="dl-card__meta mono">' + R.esc(R.KIND_NAME[f.kind] || f.kind) + ' · ' + R.esc(f.arch) + (size ? ' · ' + R.esc(size) : '') + '</p>' +
      '<p class="dl-card__sha"><span class="mono muted">SHA-256</span> ' + R.hashCell(f) + '</p>' +
      (k === 'windows' && !signed ? '<p class="fine">Not code-signed yet — Windows may show a SmartScreen prompt. Verify the checksum first.</p>' : '') +
      '</div>' +
      '<a class="btn btn--accent btn--xl" href="' + R.esc(R.fileUrl(f, ctx)) + '" download data-dl-file data-product="' + R.esc(p.id) + '" data-version="' + R.esc(rel.version) + '" data-filename="' + R.esc(f.filename) + '" data-platform="' + k + '">' +
      R.icon('download') + 'Download</a></div>';
  }

  function showThanks(p, version, filename) {
    var box = $('[data-thanks]');
    var rel = (p.releases || []).filter(function (r) { return r.version === version; })[0];
    var f = rel && (rel.files || []).filter(function (x) { return x.filename === filename; })[0];
    if (!box || !f) return false;
    box.innerHTML =
      '<div class="thanks__head"><span class="thanks__check">' + R.icon('check') + '</span><div>' +
      '<h2>Thanks — your download is starting</h2>' +
      '<p>' + R.esc(f.filename) + (R.fmtSize(f.size) ? ' · ' + R.esc(R.fmtSize(f.size)) : '') + '. Nothing happening? <a href="' + R.esc(R.fileUrl(f, ctx)) + '" download>Try again</a>.</p></div></div>' +
      '<div class="thanks__grid">' +
      '<div><h3 class="thanks__h">1 · Verify the file</h3>' +
      (f.sha256 ? '<p class="thanks__sha"><span class="mono muted">Expected SHA-256</span><code class="sha-full">' + R.esc(f.sha256) + '</code>' +
        '<button class="copy" type="button" data-copy="' + R.esc(f.sha256) + '" aria-label="Copy SHA-256">' + R.icon('copy') + '<span class="copy__txt">Copy</span></button></p>'
        : '<p class="muted">The checksum is published together with the file.</p>') +
      R.verifyBlock(f, { id: 'thanks', platform: f.platform }) + '</div>' +
      '<div><h3 class="thanks__h">2 · Install</h3><ol class="steps">' + (p.install || []).map(function (s) { return '<li>' + R.txt(s) + '</li>'; }).join('') + '</ol>' +
      (f.platform === 'windows' && !(SITE.codeSigning && SITE.codeSigning.windows)
        ? '<p class="note">' + R.icon('info') + '<span>If Windows SmartScreen says “Windows protected your PC”, choose <strong>More info → Run anyway</strong> — after the checksum matches.</span></p>' : '') +
      '</div></div>';
    box.hidden = false;
    box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    box.focus({ preventScroll: true });
    return true;
  }

  /* --- filters */

  function setupFilters() {
    $$('[data-filters]').forEach(function (bar) {
      var targetSel = bar.getAttribute('data-filters');
      var mode = bar.getAttribute('data-filter-mode') || 'products';
      var target = $(targetSel);
      var empty = $(bar.getAttribute('data-empty') || '#__none');
      if (!target) return;
      function items() { return $$(mode === 'changelog' ? '[data-product]' : '.pcard', target); }
      function match(el, f) {
        if (f === 'all') return true;
        if (mode === 'changelog') return el.getAttribute('data-product') === f;
        if (f === 'open-source') return el.getAttribute('data-oss') === 'true';
        return el.getAttribute('data-status') === f;
      }
      function counts() {
        $$('[data-filter]', bar).forEach(function (b) {
          var c = $('[data-count]', b);
          if (!c) return;
          var f = b.getAttribute('data-filter');
          c.textContent = items().filter(function (el) { return el.getAttribute('data-status') !== 'next' && match(el, f); }).length;
        });
      }
      function apply(f, push) {
        $$('[data-filter]', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)); });
        var shown = 0;
        items().forEach(function (el) {
          var ok = el.getAttribute('data-status') === 'next' ? f === 'all' : match(el, f);
          el.hidden = !ok;
          if (ok && el.getAttribute('data-status') !== 'next') shown++;
        });
        if (empty) empty.hidden = shown > 0;
        if (push && history.replaceState) {
          var key = mode === 'changelog' ? 'product' : 'filter';
          var u = new URL(location.href);
          if (f === 'all') u.searchParams.delete(key); else u.searchParams.set(key, f);
          try { history.replaceState(null, '', u.toString()); } catch (err) {}
        }
      }
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filter]');
        if (b) apply(b.getAttribute('data-filter'), true);
      });
      counts();
      var initial = param(mode === 'changelog' ? 'product' : 'filter');
      apply(initial && $('[data-filter="' + CSS.escape(initial) + '"]', bar) ? initial : 'all', false);
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-filter-reset]')) return;
    var all = $('[data-filters] [data-filter="all"]');
    if (all) { all.click(); all.focus(); }
  });


  return { renderDownloadPage: renderDownloadPage, showThanks: showThanks, setupFilters: setupFilters };
};
