/*
 * Delog — renderers for listing pages: product cards and grids, the changelog and the licenses page.
 * Extends DelogRender (assets/js/render.js); also loaded by tools/build-pages.mjs.
 */
(function (R) {
  'use strict';
  if (!R) return;
  var esc = R.esc, txt = R.txt, slug = R.slug, fmtDate = R.fmtDate, cfg = R.cfg, PLATFORMS = R.PLATFORMS, PLATFORM_NAME = R.PLATFORM_NAME, latest = R.latest;
  var productHref = R.productHref, isOss = R.isOss, platformStatus = R.platformStatus, filesFor = R.filesFor, mailto = R.mailto, notifyHref = R.notifyHref, icon = R.icon, pill = R.pill;
  var licensePill = R.licensePill, accentAttrs = R.accentAttrs, img = R.img, plain = R.plain, notesList = R.notesList, licenseBlock = R.licenseBlock;

  function platformChips(p) {
    return '<ul class="plats" aria-label="Platforms">' + PLATFORMS.map(function (k) {
      var s = platformStatus(p, k);
      if (!s) return '';
      var soon = s === 'coming-soon';
      return '<li class="plat' + (soon ? ' plat--soon' : '') + '">' + icon(k) + '<span>' + PLATFORM_NAME[k] +
        (soon ? '<span class="plat__soon"> · soon</span>' : s === 'beta' ? '<span class="plat__soon"> · beta</span>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }

  /* --- cards */

  function productCard(p, ctx) {
    var rel = latest(p);
    var href = productHref(p, ctx);
    var foot;
    if (p.status === 'coming-soon') {
      var nh = notifyHref(p, ctx);
      foot = nh ? '<a class="btn btn--ghost btn--sm pcard__action" href="' + esc(nh) + '">' + icon('mail') + 'Notify me</a>' : '<span class="pcard__ver mono">In development</span>';
    } else {
      foot = '<span class="pcard__ver mono">' + (rel ? 'v' + esc(rel.version) + ' · ' + esc(fmtDate(rel.date)) : '') + '</span>' +
        '<span class="pcard__go" aria-hidden="true">Details' + icon('arrow') + '</span>';
    }
    return '<article class="pcard accent-' + esc(p.id) + '"' + accentAttrs(p) + ' data-status="' + esc(p.status) + '" data-oss="' + (isOss(p) ? 'true' : 'false') + '">' +
      '<div class="pcard__glow" aria-hidden="true"></div>' +
      '<div class="pcard__top">' + img(p.icon, ctx, '', 56, 56, 'pcard__icon') +
      '<div class="pills">' + pill(p.status) + licensePill(p) + '</div></div>' +
      '<p class="eyebrow pcard__cat">' + esc(p.category) + '</p>' +
      '<h3 class="pcard__name"><a class="stretched" href="' + esc(href) + '">' + esc(p.name) + '</a></h3>' +
      '<p class="pcard__tag">' + txt(p.tagline) + '</p>' +
      '<p class="pcard__desc">' + txt(p.description) + '</p>' +
      platformChips(p) +
      '<div class="pcard__foot">' + foot + '</div>' +
      '</article>';
  }
  /** "Driftly", "Driftly and Tracemend", "Driftly, Tracemend and Lumen". */
  function names(products, ctx) {
    var list = (products || []).filter(function (p) { return p.status !== 'coming-soon'; }).map(function (p) { return p.name; });
    if (!list.length) return cfg(ctx.site).company;
    return list.length === 1 ? list[0] : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  function nextCard(ctx) {
    var e = cfg(ctx.site)['email.general'];
    return '<article class="pcard pcard--next" data-status="next" data-oss="false">' +
      '<div class="pcard__top"><span class="next-mark" aria-hidden="true">' + icon('plus') + '</span></div>' +
      '<p class="eyebrow pcard__cat">In the workshop</p>' +
      '<h3 class="pcard__name">More tools are on the way</h3>' +
      '<p class="pcard__tag">From the team behind ' + esc(names(ctx.products, ctx)) + '.</p>' +
      '<p class="pcard__desc">Every new tool for teams that ship websites arrives the same way: a plain installer, a SHA-256 checksum next to every file, and release notes for every version.</p>' +
      '<div class="plats" aria-hidden="true"></div>' +
      '<div class="pcard__foot">' + (e ? '<a class="btn btn--ghost btn--sm pcard__action" href="' + esc(mailto(e, 'Tell me about new ' + cfg(ctx.site).company + ' tools')) + '">' + icon('mail') + 'Tell me when there’s news</a>' : '') + '</div>' +
      '</article>';
  }
  function productsGrid(products, ctx, opts) {
    opts = opts || {};
    var list = products.slice();
    var html = list.map(function (p) { return productCard(p, ctx); }).join('');
    if (opts.withNext !== false) html += nextCard(ctx);
    return html;
  }


  /* --- changelog */

  function allReleases(products) {
    var out = [];
    products.forEach(function (p) { (p.releases || []).forEach(function (r) { out.push({ p: p, r: r }); }); });
    out.sort(function (a, b) { return String(b.r.date || '').localeCompare(String(a.r.date || '')); });
    return out;
  }
  function changelog(products, ctx) {
    var list = allReleases(products);
    if (!list.length) return '<p class="empty">No releases yet.</p>';
    return '<ol class="timeline">' + list.map(function (e) {
      var plats = PLATFORMS.filter(function (k) { return filesFor(e.r, k).length; }).map(function (k) { return PLATFORM_NAME[k]; }).join(' · ');
      return '<li class="tl reveal accent-' + esc(e.p.id) + '"' + accentAttrs(e.p) + ' data-product="' + esc(e.p.id) + '" id="' + esc(e.p.id + '-' + slug(e.r.version)) + '">' +
        '<div class="tl__date mono"><time datetime="' + esc(e.r.date || '') + '">' + esc(fmtDate(e.r.date)) + '</time></div>' +
        '<div class="tl__dot" aria-hidden="true"></div>' +
        '<article class="tl__card">' +
        '<header class="tl__head">' + img(e.p.icon, ctx, '', 32, 32, 'tl__icon') + '<h2><a href="' + esc(productHref(e.p, ctx)) + '">' + esc(e.p.name) + '</a> <span class="mono tl__ver">' + esc(e.r.version) + '</span></h2></header>' +
        notesList(e.r) +
        '<footer class="tl__foot"><span class="mono muted">' + esc(plats || 'No files yet') + '</span>' +
        '<a class="link-arrow" href="' + esc(productHref(e.p, ctx)) + '#downloads">Downloads' + icon('arrow') + '</a></footer>' +
        '</article></li>';
    }).join('') + '</ol>';
  }
  function changelogFilters(products) {
    var withRel = products.filter(function (p) { return (p.releases || []).length; });
    return '<button class="chip" type="button" data-filter="all" aria-pressed="true">All products</button>' +
      withRel.map(function (p) { return '<button class="chip" type="button" data-filter="' + esc(p.id) + '" aria-pressed="false">' + esc(p.name) + '</button>'; }).join('');
  }

  /* --- licenses page */

  function licensesList(products, ctx) {
    return products.map(function (p) {
      return '<section class="lic-card reveal accent-' + esc(p.id) + '"' + accentAttrs(p) + ' id="' + esc(p.id) + '">' +
        '<header class="lic-card__head">' + img(p.icon, ctx, '', 40, 40, '') + '<h2><a href="' + esc(productHref(p, ctx)) + '">' + esc(p.name) + '</a></h2>' +
        '<div class="pills">' + licensePill(p) + '</div></header>' +
        licenseBlock(p, ctx) + '</section>';
    }).join('');
  }


  R.platformChips = platformChips; R.productCard = productCard; R.nextCard = nextCard; R.productsGrid = productsGrid; R.changelog = changelog; R.changelogFilters = changelogFilters; R.licensesList = licensesList;
})(typeof self !== 'undefined' && self.DelogRender ? self.DelogRender : (typeof DelogRender !== 'undefined' ? DelogRender : null));
