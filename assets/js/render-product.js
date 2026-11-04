/*
 * Delog — product page renderers: the cinematic launch layout, the generic product page, stats, screenshots carousel, tech specs and licence.
 * Extends DelogRender (assets/js/render.js); also loaded by tools/build-pages.mjs.
 */
(function (R) {
  'use strict';
  if (!R) return;
  var esc = R.esc, txt = R.txt, url = R.url, slug = R.slug, fmtDate = R.fmtDate, fmtSize = R.fmtSize, cfg = R.cfg, latest = R.latest;
  var downloadHref = R.downloadHref, isOss = R.isOss, filesFor = R.filesFor, notifyHref = R.notifyHref, osSummary = R.osSummary, icon = R.icon, pill = R.pill, isFree = R.isFree;
  var licensePill = R.licensePill, licenseLabel = R.licenseLabel, img = R.img, shot = R.shot, heroShot = R.heroShot, plain = R.plain, rule = R.rule, downloadCta = R.downloadCta;
  var verifyBlock = R.verifyBlock, filesTable = R.filesTable, notesList = R.notesList, licenseBlock = R.licenseBlock, sectionHead = R.sectionHead;

  /* --- cinematic launch page */

  // The product's section links: a group inside the floating nav pill (it takes over from the …
  function productSections(p) {
    var L = p.launch || {}, out = [['overview', 'Overview'], ['tools', 'Tools']];
    if ((L.chapters || []).some(function (c) { return c.id === 'release'; })) out.push(['release', 'Release']);
    if (p.screenshots && p.screenshots.length) out.push(['screenshots', 'Screenshots']);
    if (L.specs && L.specs.length) out.push(['specs', 'Tech specs']);
    return out;
  }
  function productNav(p, ctx, where) {
    var links = productSections(p).map(function (x) { return '<a href="#' + x[0] + '" data-spy>' + esc(x[1]) + '</a>'; }).join('');
    if (where === 'name') return '<a class="pnav__product-name" href="#overview" tabindex="-1">' + esc(p.name) + '</a>';
    if (where === 'sheet') return '<nav class="sheet__sub" aria-label="' + esc(p.name) + ' sections"><p class="sheet__sub-title">' + esc(p.name) + '</p>' + links + '</nav>';
    return '<nav class="pnav__group pnav__group--product" aria-label="' + esc(p.name) + ' sections" data-glide><span class="pnav__glide" aria-hidden="true"></span>' + links + '</nav>';
  }
  function frame(inner, title) {
    return '<div class="vframe"><div class="vframe__bar" aria-hidden="true"><span class="vframe__dots"><i></i><i></i><i></i></span>' +
      (title ? '<span class="vframe__title">' + esc(title) + '</span>' : '') + '</div><div class="vframe__screen">' + inner + '</div></div>';
  }
  function visual(v, ctx, p) {
    if (!v) return '';
    var sizes = '(min-width: 1280px) 1100px, 100vw';
    if (v.type === 'compare') {
      return '<figure class="compare" data-compare>' +
        '<div class="compare__stage">' +
        '<div class="compare__img">' + plain(v.before, ctx, v.alt, '', false, sizes) + '</div>' +
        '<div class="compare__img compare__after">' + plain(v.after, ctx, 'The same page after the release.', '', false, sizes) + '</div>' +
        '<span class="compare__tag compare__tag--before">' + esc(v.beforeLabel || 'Before') + '</span>' +
        '<span class="compare__tag compare__tag--after">' + esc(v.afterLabel || 'After') + '</span>' +
        '<span class="compare__handle" aria-hidden="true"><span class="compare__knob">' + icon('chevronLeft') + icon('chevronRight') + '</span></span>' +
        '<input class="compare__range" type="range" min="0" max="100" value="50" step="1" aria-label="Before and after: move to show more of either version" aria-valuetext="Half before, half after">' +
        '</div><figcaption class="compare__hint">Drag, or use the arrow keys, to compare.</figcaption></figure>';
    }
    if (v.type === 'verdict') {
      return '<div class="verdict">' +
        '<div class="flip" data-flip aria-hidden="true"><div class="flip__card">' +
        '<p class="flip__face flip__face--front">GO</p><p class="flip__face flip__face--back verdict__word">' + esc(v.word) + '</p>' +
        '</div></div>' +
        '<ul class="verdict__chips" aria-label="Possible verdicts"><li class="v-go">GO</li><li class="v-warn">GO WITH WARNINGS</li><li class="v-no">NO-GO</li></ul>' +
        frame(shot(v.src, ctx, v.alt, '', false, sizes), p.name) + '</div>';
    }
    if (v.type === 'terminal') {
      var lines = (v.lines || []).map(function (l) {
        return '<span class="term__line term__line--' + esc(l.s || 'dim') + '">' + esc(l.t) + '</span>';
      }).join('');
      return '<figure class="term" data-term>' +
        '<div class="term__bar" aria-hidden="true"><span class="vframe__dots"><i></i><i></i><i></i></span><span class="term__title">Windows PowerShell</span></div>' +
        '<pre class="term__body" tabindex="0" aria-label="' + esc(v.label || p.name + ' command output') + '"><code>' +
        '<span class="term__line term__line--cmd"><span class="term__ps">PS&gt;</span> <span class="term__type" data-chars="' + esc(String(v.command.length)) + '">' + esc(v.command) + '</span></span>' +
        lines +
        '<span class="term__line term__line--verdict">' + esc(v.verdict) + '</span>' +
        (v.artifacts ? '<span class="term__line term__line--dim">' + esc(v.artifacts) + '</span>' : '') +
        '</code></pre><figcaption class="sr-only">' + esc(v.caption || 'Output of ' + v.command + ' for the demo store.') + '</figcaption></figure>';
    }
    return frame(shot(v.src, ctx, v.alt, '', false, sizes), p.name);
  }
  // Each animation may take a tile's own words, `say` (an array), and falls back to its own.
  function said(say, i, fallback) { return esc(say && say[i] != null ? say[i] : fallback); }
  var ANIM = {
    diff: function (say) { return '<span class="a-diff"><span class="a-diff__old">' + said(say, 0, 'Place order') + '</span><span class="a-diff__new">' + said(say, 1, 'Pay now') + '</span></span>'; },
    radar: '<span class="a-radar"><i></i><i></i><i></i><b></b><em></em><em></em><em></em></span>',
    budget: function (say) { return '<span class="a-budget"><span class="a-budget__track"><i class="a-budget__fill"></i><i class="a-budget__line"></i></span><span class="a-budget__lbl">' + said(say, 0, 'LCP · budget 2,500 ms') + '</span></span>'; },
    verdict: '<span class="a-verdict"><b class="a-verdict__go">GO</b><b class="a-verdict__no">NO-GO</b></span>',
    locator: function (say) { return '<span class="a-loc"><code class="a-loc__code"><span class="a-loc__t">' + said(say, 0, 'getByTestId(\'account-welcome\')') + '</span></code><span class="a-loc__ok">' + said(say, 1, 'healed') + '</span></span>'; },
    strip: '<span class="a-strip">' + new Array(15).join('<i></i>') + '</span>',
    noise: '<span class="a-noise"><s>5 min ago</s><s>10:42:07</s><b>$12/mo</b></span>',
    bell: '<span class="a-bell">' + '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' + '</svg><b>3</b></span>',
    api: function (say) { return '<span class="a-api"><code>' + said(say, 0, 'GET /api/me') + '</code><span class="a-api__s"><b class="a-api__ok">' + said(say, 1, '200') + '</b><b class="a-api__bad">' + said(say, 2, '401') + '</b></span></span>'; },
    ask: function (say) { return '<span class="a-ask"><span class="a-ask__me">' + said(say, 0, 'What changed today?') + '</span><span class="a-ask__ai">' + said(say, 1, '6 pages changed — 2 are critical.') + '</span></span>'; },
    ci: function (say) { return '<span class="a-ci"><code>PS&gt; ' + said(say, 0, 'driftly ci "Demo Store"') + '</code><code class="a-ci__v">' + said(say, 1, 'NO-GO — exit 1') + '</code></span>'; },
    share: '<span class="a-share"><span class="a-share__file">' + '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5"/></svg>' + '<span>dashboard.html</span></span><span class="a-share__lock">' + '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>' + '</span></span>',
    bug: function (say) { return '<span class="a-bug"><span><b>Expected</b>' + said(say, 0, 'Pay now') + '</span><span class="a-bug__bad"><b>Actual</b>' + said(say, 1, 'Place order') + '</span><em>' + said(say, 2, 'QA-128 · filed') + '</em></span>'; }
  };
  function anim(b) { var a = ANIM[b.anim]; return typeof a === 'function' ? a(b.say) : a || ''; }

  // Giant stats. Number, label and detail live in ONE element, in reading order, so they can …
  function statsRow(stats, cls) {
    return '<ul class="statrow' + (cls ? ' ' + cls : '') + '">' + stats.map(function (st) {
      return '<li class="statrow__item" data-stat="' + esc(st.value) + '">' +
        '<span class="sr-only">' + esc(st.value + ' ' + st.label + (st.sub ? ' ' + st.sub : '')) + '</span>' +
        '<span class="statrow__vis" aria-hidden="true"><span class="statrow__num" data-count="' + esc(st.value) + '">' + esc(st.value) + '</span>' +
        '<span class="statrow__label">' + esc(st.label) + '</span>' +
        (st.sub ? '<span class="statrow__sub">' + esc(st.sub) + '</span>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }

  // Screenshot carousel: every screenshot of a product, scroll-snap, prev/next, dots, lightbox.
  function carousel(p, ctx) {
    var list = p.screenshots || [];
    if (!list.length) return '';
    var id = 'shots-' + p.id;
    var h = '<div class="carousel" data-carousel data-gallery id="' + id + '">' +
      '<div class="carousel__track" role="region" aria-roledescription="carousel" aria-label="' + esc(p.name) + ' screenshots — arrow keys move between them">' +
      '<div class="carousel__list">';
    list.forEach(function (sh, i) {
      h += '<div class="carousel__slide' + (i ? '' : ' is-active') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + ': ' + esc(sh.title) + '">' +
        '<button class="carousel__shot" type="button" data-lightbox="' + i + '" data-full="' + esc(url(sh.src, ctx)) + '" data-title="' + esc(sh.title) + '" data-alt="' + esc(sh.alt) + '" tabindex="' + (i ? -1 : 0) + '">' +
        shot(sh.src, ctx, sh.alt, '', false, '(min-width: 1280px) 1000px, 86vw') +
        '<span class="carousel__zoom" aria-hidden="true">' + icon('expand') + '</span></button>' +
        '<p class="carousel__cap"><span class="carousel__n">' + String(i + 1).padStart(2, '0') + '</span>' + esc(sh.title) + '</p></div>';
    });
    h += '</div></div>' +
      '<div class="carousel__controls">' +
      '<div class="carousel__dots" role="group" aria-label="Choose a screenshot">' + list.map(function (sh, i) {
        return '<button class="carousel__dot" type="button" data-go="' + i + '" aria-label="Screenshot ' + (i + 1) + ': ' + esc(sh.title) + '"' + (i ? '' : ' aria-current="true"') + '></button>';
      }).join('') + '</div>' +
      '<p class="carousel__count" aria-live="polite"><span data-carousel-n>1</span> / ' + list.length + '</p>' +
      '<div class="carousel__nav"><button class="carousel__btn" type="button" data-prev aria-label="Previous screenshot">' + icon('chevronLeft') + '</button>' +
      '<button class="carousel__btn" type="button" data-next aria-label="Next screenshot">' + icon('chevronRight') + '</button></div>' +
      '</div></div>';
    return h;
  }
  function screenshotsSection(p, ctx) {
    if (!p.screenshots || !p.screenshots.length) return '';
    var pick = p.screenshots.slice(0, 3);
    return '<section class="lx-section shots" id="screenshots"><div class="container"><div class="shots__intro">' +
      '<header class="lx-head lx-head--left"><h2>Screenshots</h2><p>' + esc((p.launch && p.launch.shotsLead) || 'Every screen, checking a local demo store.') + ' Select one to see it full size.</p></header>' +
      '<div class="stack3d" data-anim aria-hidden="true">' + pick.map(function (sh, i) {
        return '<div class="stack3d__card stack3d__card--' + (i + 1) + '">' + shot(sh.src, ctx, '', '', false, '(min-width: 1000px) 520px, 80vw') + '</div>';
      }).join('') + '</div></div>' +
      carousel(p, ctx) + '</div></section>';
  }

  // Tech specs: group label on the left, labelled rows on the right.
  function specsTable(p, ctx) {
    var L = p.launch, rel = latest(p), signed = !!(ctx.site && ctx.site.codeSigning && ctx.site.codeSigning.windows);
    var winFile = rel && (filesFor(rel, 'windows')[0] || rel.files[0]);
    var fill = function (v) {
      if (v === 'release:version') return rel ? rel.version : '—';
      if (v === 'release:date') return rel ? fmtDate(rel.date) : '—';
      if (v === 'release:size') return winFile && winFile.size ? fmtSize(winFile.size) : 'Published with each download';
      return v;
    };
    var groups = L.specs.slice();
    groups.splice(Math.min(3, groups.length), 0, { group: 'Code signing', signing: true });
    return '<div class="spec">' + groups.map(function (g) {
      var body;
      if (g.signing) {
        body = '<div class="spec__row"><p class="spec__value" data-signed="windows" data-signed-when="no"' + (signed ? ' hidden' : '') + '>Not code-signed yet — Windows SmartScreen may warn on first run. <a href="#verify">Verify the published SHA-256</a> first.</p>' +
          '<p class="spec__value" data-signed="windows" data-signed-when="yes"' + (signed ? '' : ' hidden') + '>Code-signed Windows installers, with a published SHA-256 for every file.</p></div>';
      } else {
        body = g.rows.map(function (r) {
          var val = r.list
            ? '<ul class="spec__list">' + r.list.map(function (x) { return '<li>' + txt(x) + '</li>'; }).join('') + '</ul>'
            : '<p class="spec__value">' + txt(fill(r.value)) + '</p>';
          return '<div class="spec__row">' + (r.label ? '<p class="spec__label">' + esc(r.label) + '</p>' : '') + val + '</div>';
        }).join('');
      }
      return '<section class="spec__group" aria-labelledby="spec-' + slug(g.group) + '"><h3 class="spec__group-title" id="spec-' + slug(g.group) + '">' + esc(g.group) + '</h3><div class="spec__rows">' + body + '</div></section>';
    }).join('') + '</div>';
  }

  // The product page's licence block: one statement, three points, the documents.
  function licenseHero(p, ctx) {
    var L = p.license || {}, C = cfg(ctx.site);
    var statement = isOss(p) ? (isFree(p) ? 'Free. ' : '') + 'Open source.' : (isFree(p) ? 'Free. Closed source.' : 'Closed source.');
    var pts = (L.summary || []).map(function (x) { return typeof x === 'string' ? { icon: 'check', text: x } : x; });
    var h = '<div class="lic">' +
      '<p class="lic__statement">' + esc(statement) + '</p>' +
      '<p class="lic__lead">' + esc(p.name) + ' is ' + (isOss(p) ? 'released under the ' + esc(L.name) + ' license' : 'proprietary software, licensed — not sold — under the ' + esc(L.name || 'licence agreement')) + '. In plain words:</p>' +
      '<ul class="lic__points">' + pts.map(function (x) {
        return '<li><span class="lic__icon">' + icon(x.icon || 'check') + '</span><span>' + txt(x.text) + '</span></li>';
      }).join('') + '</ul>' +
      '<p class="lic__note">A summary only — the licence agreement is the binding text. ' + esc(C.company) + ' distributes installers only; source code is not distributed.</p>' +
      '<ul class="lic__links">' +
      (L.url ? '<li><a class="link-more" href="' + esc(url(L.url, ctx)) + '">' + (isOss(p) ? 'Read the licence' : 'Read the End User Licence Agreement') + icon('chevronRight') + '</a></li>' : '') +
      '<li><a class="link-more" href="' + esc((ctx.base || '') + 'terms.html#website-terms') + '">Terms of Use' + icon('chevronRight') + '</a></li>' +
      (L.thirdParty ? '<li><a class="link-more" href="' + esc(url(L.thirdParty, ctx)) + '">Third-party notices' + icon('chevronRight') + '</a></li>' : '') +
      '</ul>' +
      // A product with its own EULA version (license.version) shows it; otherwise the site's.
      (isOss(p) ? '' : '<p class="lic__meta">EULA version ' + (L.version ? esc(L.version) : '<span data-cfg="eulaVersion">' + esc(C.eulaVersion) + '</span>') +
        '<span data-cfg-if="termsDate"' + (C.termsDate ? '' : ' hidden') + '> · Updated <span data-cfg="termsDate">' + esc(C.termsDate) + '</span></span></p>') +
      '</div>';
    return h;
  }

  // "Driftly or Tracemend?": each product's job in a sentence (launch.role), side by side, the
  // page's own marked — so nobody downloads one when they wanted the other. Needs two or more.
  function whichOne(p, ctx) {
    var list = (ctx.products || []).filter(function (x) { return x.launch && x.launch.role; });
    if (list.length < 2 || !p.launch.role) return '';
    // "Driftly or Tracemend?" reads well for two; past that, the names stop being a question.
    var n = list.length, count = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][n];
    var title = n === 2 ? list[0].name + ' or ' + list[1].name + '?' : 'Which one do you need?';
    var lead = (count ? count + ' tools, ' + count.toLowerCase() + ' jobs.' : 'Different tools, different jobs.') +
      (n === 2 ? ' Both free, both on your own computer.' : ' All free, all on your own computer.');
    return rule() + '<section class="lx-section which" id="which" aria-labelledby="which-' + esc(p.id) + '"><div class="container">' +
      '<header class="lx-head reveal"><h2 id="which-' + esc(p.id) + '">' + esc(title) + '</h2><p>' + esc(lead) + '</p></header>' +
      '<ul class="which__list">' + list.map(function (x) {
        var here = x.id === p.id;
        return '<li class="which__card accent-' + esc(x.id) + (here ? ' is-here' : '') + ' reveal">' +
          '<p class="which__name">' + img(x.icon, ctx, '', 36, 36, 'which__icon') + '<span>' + esc(x.name) + '</span>' + (here ? '<em class="which__here">You’re here</em>' : '') + '</p>' +
          '<h3 class="which__job">' + esc(x.launch.job || x.tagline) + '</h3>' +
          '<p class="which__role">' + txt(x.launch.role) + '</p>' +
          (here ? '' : '<p class="which__go"><a class="link-more" href="' + esc(R.productHref(x, ctx)) + '">Meet ' + esc(x.name) + icon('chevronRight') + '</a></p>') +
          '</li>';
      }).join('') + '</ul></div></section>';
  }

  function launchCta(p, ctx, href, label) {
    return downloadCta(p, ctx, { launch: true, secondaryHref: href, secondaryLabel: label });
  }
  function launchPage(p, ctx) {
    var L = p.launch, rel = latest(p), signed = !!(ctx.site && ctx.site.codeSigning && ctx.site.codeSigning.windows);
    var h = '';
    // Hero …
    h += '<section class="lx-hero" id="overview"><div class="container">' +
      '<p class="lx-hero__name">' + img(p.icon, ctx, '', 44, 44, 'lx-hero__icon', true) + '<span>' + esc(p.name) + '</span></p>' +
      '<h1 class="lx-hero__title sheen">' + esc(L.headline) + '</h1>' +
      '<p class="lx-hero__line">' + txt(L.line) + '</p>' +
      launchCta(p, ctx, '#tour', L.tour || 'Take the tour') +
      '</div></section>';
    h += rule();
    // Cinematic reveal: the window rotates flat and scales up as you scroll (pinned)
    h += '<section class="cine" id="tour" aria-label="' + esc(p.name) + ' Home"><div class="cine__sticky">' +
      '<div class="cine__glow" aria-hidden="true"></div>' +
      '<div class="cine__win"><div class="vframe__bar" aria-hidden="true"><span class="vframe__dots"><i></i><i></i><i></i></span><span class="vframe__title">' + esc(p.name) + '</span></div>' +
      '<div class="cine__screen"><div class="cine__empty" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="cine__ui">' + shot(p.hero.src, ctx, p.hero.alt, '', true, '(min-width: 1500px) 1440px, 100vw') + '</div></div></div>' +
      (L.chips && L.chips.length ? '<div class="cine__chips" aria-hidden="true">' + L.chips.map(function (c, i) {
        return '<span class="chip3d chip3d--' + (i + 1) + '"><i class="chip3d__dot chip3d__dot--' + esc(c.tone || 'ok') + '"></i>' + esc(c.text) + '</span>';
      }).join('') + '</div>' : '') +
      (L.reveal && L.reveal.caption ? '<p class="cine__cap">' + txt(L.reveal.caption) + '</p>' : '') +
      '</div></section>';
    // Giant numbers …
    if (L.stats && L.stats.length) {
      h += rule() + '<section class="stats-band" aria-labelledby="stats-' + esc(p.id) + '"><div class="container"><h2 class="sr-only" id="stats-' + esc(p.id) + '">' + esc(p.name) + ' in numbers</h2>' +
        statsRow(L.stats) + '</div></section>';
    }
    // Chapters — one idea per screen …
    h += rule() + '<div id="tools">' + L.chapters.map(function (c, ci) {
      return (ci ? rule() : '') + '<section class="chap chap--' + esc(c.layout || 'center') + '" id="' + esc(c.id) + '"><div class="container"><div class="chap__grid">' +
        '<header class="chap__head reveal"><p class="chap__eyebrow">' + esc(c.eyebrow) + '</p><h2 class="chap__title">' + esc(c.title) + '</h2>' +
        '<p class="chap__text">' + txt(c.text) + '</p>' +
        (c.points ? '<ul class="chap__points">' + c.points.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>' : '') +
        (c.more ? '<p class="chap__more"><a class="link-more" href="' + esc(url(c.more.href, ctx)) + '">' + esc(c.more.label) + icon('chevronRight') + '</a></p>' : '') + '</header>' +
        '<div class="chap__visual reveal">' + visual(c.visual, ctx, p) + '</div>' +
        '</div></div></section>';
    }).join('') + '</div>';
    // Bento …
    if (L.bento && L.bento.length) {
      h += rule() + '<section class="lx-section" id="everything"><div class="container"><header class="lx-head reveal"><h2>Everything in one place.</h2></header><ul class="bento" data-anim>' +
        L.bento.map(function (b) {
          return '<li class="tile tile--' + esc(b.size || 's') + ' reveal" data-tilt3d="5"><div class="tile__anim" aria-hidden="true">' + anim(b) + '</div>' +
            '<h3 class="tile__title">' + esc(b.title) + '</h3><p class="tile__text">' + txt(b.text) + '</p></li>';
        }).join('') + '</ul></div></section>';
    }
    h += whichOne(p, ctx);
    // Screenshots …
    if (p.screenshots && p.screenshots.length) h += rule() + screenshotsSection(p, ctx);
    // Tech specs …
    if (L.specs && L.specs.length) {
      h += rule() + '<section class="lx-section specs" id="specs"><div class="container"><header class="lx-head lx-head--left"><h2>Tech specs</h2></header>' + specsTable(p, ctx) + '</div></section>';
    }
    // Downloads, release notes, licence — calm and complete …
    h += rule() + '<section class="lx-section" id="downloads"><div class="container">';
    if (rel) {
      h += '<header class="lx-head lx-head--left"><h2>Downloads</h2><p>' + esc(p.name) + ' ' + esc(rel.version) + ' · released ' + esc(fmtDate(rel.date)) + '. Every file with its size and SHA-256.</p></header>' +
        filesTable(p, rel, ctx) +
        '<details class="disclosure" id="verify"><summary>' + icon('fileCheck') + '<span>How to verify your download</span>' + icon('chevronDown', 'disclosure__chev') + '</summary>' +
        '<div class="disclosure__body">' + verifyBlock(filesFor(rel, 'windows')[0] || rel.files[0], { id: 'pv-' + p.id }) + '</div></details>';
    }
    h += '</div></section>';
    if (rel) {
      h += rule() + '<section class="lx-section" id="release-notes"><div class="container"><header class="lx-head lx-head--left"><h2>What’s new in ' + esc(rel.version) + '</h2></header>' +
        '<div class="rn"><div class="rn__meta mono"><span class="rn__ver">v' + esc(rel.version) + '</span><span>' + esc(fmtDate(rel.date)) + '</span></div><div class="rn__body">' + notesList(rel) + '</div></div>' +
        '<p class="more"><a class="link-arrow" href="' + esc((ctx.base || '') + 'changelog.html?product=' + encodeURIComponent(p.id)) + '">Full changelog' + icon('chevronRight') + '</a></p></div></section>';
    }
    h += rule() + '<section class="lx-section" id="license"><div class="container"><header class="lx-head lx-head--left lx-head--eyebrow"><h2>Licence</h2></header>' + licenseHero(p, ctx) + '</div></section>';
    // Final call to action …
    h += rule() + '<section class="final"><div class="container">' +
      '<div class="orbit" data-anim aria-hidden="true"><div class="orbit__scene">' +
      '<span class="orbit__ring orbit__ring--1"><i class="orbit__dot"></i></span><span class="orbit__ring orbit__ring--2"><i class="orbit__dot"></i></span><span class="orbit__ring orbit__ring--3"></span>' +
      '</div>' + img(p.icon, ctx, '', 96, 96, 'orbit__icon') + '</div>' +
      '<h2 class="final__title">Download ' + esc(p.name) + '.<br><span class="final__free">' + (isFree(p) ? 'It’s free.' : 'Get started.') + '</span></h2>' +
      launchCta(p, ctx, '#verify', 'Verify your download') + '</div></section>';
    return h;
  }


  /* --- product page */
  function productPage(p, ctx) {
    if (p.launch) return launchPage(p, ctx);
    var rel = latest(p);
    var h = '';
    // Hero …
    h += '<section class="p-hero"><div class="mesh" aria-hidden="true"></div><div class="container">' +
      '<nav class="crumbs mono" aria-label="Breadcrumb"><a href="' + esc((ctx.base || '') + 'products.html') + '">Products</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(p.name) + '</span></nav>' +
      '<div class="p-id">' + img(p.icon, ctx, p.name + ' icon', 64, 64, 'p-id__icon', true) +
      '<div><h1 class="p-id__name">' + esc(p.name) + '</h1><div class="pills">' + pill(p.status) + licensePill(p) + '</div></div></div>' +
      '<p class="p-hero__tag">' + txt(p.tagline) + '</p>' +
      '<p class="p-hero__desc">' + txt(p.description) + '</p>' +
      downloadCta(p, ctx, { otherHref: '#downloads' }) +
      '</div></section>';
    // The interactive demo (or the hero screenshot)
    if (p.hero) h += '<section class="p-demo" aria-label="' + esc(p.name) + ' screenshot"><div class="container">' + heroShot(p, ctx, true) + '</div></section>';
    // Facts …
    h += '<section class="section section--tight"><div class="container"><dl class="p-facts">' +
      fact('Version', rel ? rel.version : '—', true) +
      fact('Released', rel ? fmtDate(rel.date) : '—') +
      fact('Platforms', osSummary(p) || 'Coming soon') +
      fact('License', licenseLabel(p)) +
      fact('Distribution', 'Installer + SHA-256') +
      '</dl></div></section>';
    // Overview …
    if (p.sections && p.sections.length) {
      h += '<section class="section"><div class="container"><div class="overview">' +
        p.sections.map(function (s, i) {
          return '<div class="overview__item reveal"><p class="overview__n mono">0' + (i + 1) + '</p><h2 class="overview__title">' + esc(s.title) + '</h2>' +
            (s.body || []).map(function (b) { return '<p>' + txt(b) + '</p>'; }).join('') + '</div>';
        }).join('') + '</div></div></section>';
    }
    // Screenshots …
    if (p.screenshots && p.screenshots.length) h += rule() + screenshotsSection(p, ctx);
    // Features …
    if (p.features && p.features.length) {
      h += '<section class="section" id="features"><div class="container">' + sectionHead('Features', 'What’s inside ' + p.name) +
        '<ul class="features">' + p.features.map(function (f) {
          return '<li class="feature reveal"><span class="feature__icon">' + icon(f.icon) + '</span><h3>' + esc(f.title) + '</h3><p>' + txt(f.text) + '</p></li>';
        }).join('') + '</ul></div></section>';
    }
    // Requirements + install …
    if ((p.requirements && p.requirements.length) || (p.install && p.install.length)) {
      h += '<section class="section" id="requirements"><div class="container"><div class="split">' +
        '<div class="split__col reveal">' + sectionHead('System requirements', 'What you need') +
        '<dl class="reqs">' + (p.requirements || []).map(function (r) { return '<div><dt>' + esc(r.label) + '</dt><dd>' + txt(r.value) + '</dd></div>'; }).join('') + '</dl></div>' +
        (p.install && p.install.length ? '<div class="split__col reveal">' + sectionHead('Installation', 'Up and running') +
          '<ol class="steps">' + p.install.map(function (s) { return '<li>' + txt(s) + '</li>'; }).join('') + '</ol></div>' : '') +
        '</div></div></section>';
    }
    // Downloads …
    h += '<section class="section" id="downloads"><div class="container">';
    if (rel) {
      h += sectionHead('Downloads', p.name + ' ' + rel.version, 'Released ' + fmtDate(rel.date) + '. Every file is listed with its size and SHA-256 checksum.') +
        filesTable(p, rel, ctx) +
        '<details class="disclosure reveal" id="verify"><summary>' + icon('fileCheck') + '<span>How to verify your download</span>' + icon('chevronDown', 'disclosure__chev') + '</summary>' +
        '<div class="disclosure__body">' + verifyBlock(filesFor(rel, 'windows')[0] || rel.files[0], { id: 'pv-' + p.id }) + '</div></details>';
    } else {
      var nr = notifyHref(p, ctx);
      h += sectionHead('Downloads', 'Not released yet', p.name + ' is in the works.') +
        (nr ? '<p><a class="btn btn--primary" href="' + esc(nr) + '">' + icon('mail') + 'Notify me</a></p>' : '');
    }
    h += '</div></section>';
    // Release notes …
    if (rel) {
      h += '<section class="section" id="release-notes"><div class="container">' + sectionHead('Release notes', 'What’s new in ' + rel.version) +
        '<div class="rn reveal"><div class="rn__meta mono"><span class="rn__ver">v' + esc(rel.version) + '</span><span>' + esc(fmtDate(rel.date)) + '</span></div><div class="rn__body">' + notesList(rel) + '</div></div>';
      var prev = p.releases.slice(1);
      if (prev.length) {
        h += '<h3 class="sub-title">Previous releases</h3><div class="prev">' + prev.map(function (r) {
          return '<details class="disclosure"><summary><span class="mono rn__ver">v' + esc(r.version) + '</span><span class="muted">' + esc(fmtDate(r.date)) + '</span>' + icon('chevronDown', 'disclosure__chev') + '</summary>' +
            '<div class="disclosure__body">' + notesList(r) + filesTable(p, r, ctx, { onlyWithFiles: true }) + '</div></details>';
        }).join('') + '</div>';
      }
      h += '<p class="more"><a class="link-arrow" href="' + esc((ctx.base || '') + 'changelog.html?product=' + encodeURIComponent(p.id)) + '">Full changelog' + icon('arrow') + '</a></p>';
      h += '</div></section>';
    }
    // A divider between every section of the generic page …
    h = h.replace(/<section class="section/g, rule() + '<section class="section');
    // License …
    h += rule() + '<section class="section section--last" id="license"><div class="container">' + sectionHead('License', 'License & notices') + licenseBlock(p, ctx) + '</div></section>';
    return h;
  }
  function fact(k, v, mono) {
    return '<div><dt>' + esc(k) + '</dt><dd' + (mono ? ' class="mono"' : '') + '>' + esc(v) + '</dd></div>';
  }


  R.launchPage = launchPage; R.productNav = productNav; R.statsRow = statsRow; R.carousel = carousel; R.screenshotsSection = screenshotsSection; R.productPage = productPage;
})(typeof self !== 'undefined' && self.DelogRender ? self.DelogRender : (typeof DelogRender !== 'undefined' ? DelogRender : null));
