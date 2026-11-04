/*
 * Delog — HTML renderers shared by the browser (assets/js/app.js) and the static page
 * builder (tools/build-pages.mjs). Pure functions: data in, HTML string out.
 * This is the core used by every page; render-product.js (product pages) and render-pages.js
 * (cards, changelog, licenses) add to it, so no page loads code it doesn't use.
 * All text from products.js is escaped; `code` in backticks becomes <code>.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DelogRender = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* --- helpers */

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Escaped text with `inline code`.
  function txt(v) {
    return esc(v).replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function isAbs(u) { return /^([a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(u || ''); }
  function url(path, ctx) { return isAbs(path) ? path : (ctx.base || '') + path; }
  function fileUrl(file, ctx) {
    if (isAbs(file.url)) return file.url;
    var b = (ctx.site && ctx.site.downloadBaseUrl) || '';
    if (b) return b.replace(/\/?$/, '/') + file.url;
    return (ctx.base || '') + file.url;
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return 'Date to be announced';
    return Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
  }
  function fmtSize(n) {
    if (n == null || isNaN(n)) return null;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
    if (n >= 1e3) return Math.round(n / 1e3) + ' KB';
    return n + ' B';
  }
  function shortHash(h) { return h ? h.slice(0, 10) + '…' + h.slice(-6) : ''; }
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function fmtLong(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? Number(m[3]) + ' ' + MONTHS_LONG[Number(m[2]) - 1] + ' ' + m[1] : '';
  }

  /* Values derived from site.config.js, with graceful wording for empty fields. Pages use them as */
  function cfg(site) {
    site = site || {};
    var e = site.email || {};
    var company = site.companyName || site.company || 'Delog';
    var legal = site.legalName || company;
    var country = site.country || 'India';
    var place = [site.city, site.state].filter(Boolean).join(', ');
    var host = String(site.baseUrl || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    var mail = function (k) { return e[k] || e.general || ''; };
    var v = {
      company: company,
      legal: legal,
      address: site.registeredAddress || '',
      entity: legal + (site.registeredAddress ? ' (registered address: ' + site.registeredAddress + ')' : ''),
      country: country,
      jurisdiction: site.city ? 'the courts at ' + place + ', ' + country : 'the competent courts of ' + country,
      hosting: site.hostingProvider ? 'our hosting provider, ' + site.hostingProvider : 'the company that hosts this website',
      hostingName: site.hostingProvider || 'our hosting provider',
      downloads: site.downloadHost ? site.downloadHost + ', the service we use to deliver installers'
        : (site.hostingProvider ? site.hostingProvider + ', which also hosts this website' : 'the same host that serves this website'),
      termsDate: fmtLong(site.termsLastUpdated),
      privacyDate: fmtLong(site.privacyLastUpdated),
      eulaVersion: site.eulaVersion || '1.0',
      year: String(site.copyrightYear || new Date().getFullYear()),
      siteHost: host || 'this website',
      tagline: site.tagline || ''
    };
    ['general', 'support', 'legal', 'security', 'privacy', 'sales', 'press'].forEach(function (k) { v['email.' + k] = mail(k); });
    // contact form: provider, where it posts, and what the Privacy Policy says about it …
    var cf = site.contactForm || {}, prov = cf.provider || 'mailto';
    var endpoint = prov === 'web3forms' ? (cf.endpoint || 'https://api.web3forms.com/submit') : prov === 'netlify' ? '' : (cf.endpoint || '');
    var origin = (/^https:\/\/[^/]+/.exec(endpoint) || [''])[0];
    var who = { netlify: 'Netlify Forms (our host, Netlify)', formspree: 'Formspree', web3forms: 'Web3Forms', custom: origin ? 'our form service at ' + origin.replace('https://', '') : 'our form service' }[prov];
    v.formProvider = prov;
    v.formEndpoint = endpoint;
    v.formOrigin = origin;
    v.formSends = prov !== 'mailto' ? 'yes' : '';
    v.privacyTitle = prov === 'mailto' ? 'This website collects nothing.' : 'This website collects almost nothing.';
    v.privacyLead = prov === 'mailto'
      ? 'No cookies, no analytics, no tracking pixels and no requests to anyone else. Here is exactly what happens when you visit, download or write to us — and how our software handles your data.'
      : 'No cookies, no analytics and no tracking pixels. The only thing this site sends anywhere is a contact-form message you choose to submit. Here is exactly what happens when you visit, download or write to us — and how our software handles your data.';
    v.formBullet = prov === 'mailto'
      ? 'No form that sends data. The contact form opens your own email app with your message filled in; contact links do the same.'
      : 'One form, only when you use it. The contact form sends the message you write to ' + who + '; nothing else is collected.';
    v.formPrivacy = prov === 'mailto'
      ? 'The contact form doesn’t send anything itself. It opens your own email app with your message filled in and addressed to us; nothing leaves your device until you send that email, which we then handle like any other email (see “Email” below).'
      : 'When you submit the contact form, the name, email address, topic, product and message you entered are sent to ' + who + ', which delivers them to us. We use them only to reply, and keep them as described under “Email” below. The form also contains a hidden anti-spam field. ' + who.replace(/ \(.*\)$/, '') + ' handles the submission under its own privacy policy.';
    return v;
  }

  var PLATFORMS = ['windows', 'macos', 'linux'];
  var PLATFORM_NAME = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };
  var STATUS_NAME = { available: 'Available', beta: 'Beta', 'coming-soon': 'Coming soon' };
  var KIND_NAME = {
    installer: 'Installer', portable: 'Portable', zip: 'ZIP archive', msi: 'MSI installer',
    dmg: 'Disk image', pkg: 'Installer package', AppImage: 'AppImage', deb: 'Debian package',
    rpm: 'RPM package', 'tar.gz': 'Tarball', snap: 'Snap', flatpak: 'Flatpak'
  };

  function latest(p) { return (p.releases && p.releases[0]) || null; }
  function productHref(p, ctx) {
    return ctx.site && ctx.site.staticProductPages
      ? (ctx.base || '') + 'products/' + p.id + '.html'
      : (ctx.base || '') + 'product.html?id=' + encodeURIComponent(p.id);
  }
  function downloadHref(p, ctx, platform) {
    return (ctx.base || '') + 'download.html?product=' + encodeURIComponent(p.id) +
      (platform ? '&platform=' + platform : '');
  }
  function isOss(p) { return p.license && p.license.kind === 'open-source'; }
  // A platform with files in the latest release counts as available (or beta, if declared so).
  function platformStatus(p, platform) {
    var declared = (p.platforms || {})[platform] || null;
    if (filesFor(latest(p), platform).length) return declared === 'beta' ? 'beta' : 'available';
    return declared;
  }
  function filesFor(rel, platform) {
    return rel ? (rel.files || []).filter(function (f) { return f.platform === platform; }) : [];
  }
  function mailto(addr, subject) {
    return 'mailto:' + addr + (subject ? '?subject=' + encodeURIComponent(subject) : '');
  }
  // '' when no email is configured — callers then leave the "notify me" link out.
  function notifyHref(p, ctx, platform) {
    var e = cfg(ctx.site)['email.general'];
    return e ? mailto(e, 'Notify me: ' + p.name + (platform ? ' for ' + PLATFORM_NAME[platform] : '')) : '';
  }
  function osSummary(p) {
    return PLATFORMS.filter(function (k) { return platformStatus(p, k) === 'available' || platformStatus(p, k) === 'beta'; })
      .map(function (k) { return PLATFORM_NAME[k]; }).join(', ');
  }

  /* --- icons */

  var I = {
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    external: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M4 7h9M19 7h1M4 17h3M13 17h7"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/>',
    gauge: '<path d="M4.6 18.5a9 9 0 1 1 14.8 0"/><path d="m12 14 4-5"/><circle cx="12" cy="14" r="1.6"/>',
    braces: '<path d="M8 4H7a2 2 0 0 0-2 2v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2 2 0 0 0 2 2h1"/><path d="M16 4h1a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2 2 0 0 1-2 2h-1"/>',
    record: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/>',
    rocket: '<path d="M14 4.6c2.6-1.6 6-1.6 6-1.6s0 3.4-1.6 6L12.5 15 9 11.5z"/><path d="M9 11.5H5.5L8 8.5h4.5M12.5 15v3.5l3-2.5v-4.5"/><path d="M6 16.5c-1.6.6-2.5 3.5-2.5 3.5s2.9-.9 3.5-2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5M12.5 15H17"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="m8.2 10.8 7-3.6M8.2 13.2l7 3.6"/>',
    spark: '<path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9z"/>',
    bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2.5 19.5h19"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    noUser: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 10.6-5"/><path d="m17 16.5 4 4M21 16.5l-4 4"/>',
    box: '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    hash: '<path d="M9.5 4 7.5 20M16.5 4l-2 16M5 9h15M4 15h15"/>',
    fileCheck: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5"/><path d="m9 14 2 2 4-4"/>',
    notes: '<path d="M9 6.5h11M9 12h11M9 17.5h7"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>',
    scale: '<path d="M12 4v16M8 20h8M5 7.5h14"/><path d="m5 7.5-2.5 6a2.5 2.5 0 0 0 5 0zM19 7.5l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    minus: '<path d="M5 12h14"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'
  };
  var FILLED = {
    windows: '<path d="M3 5.3 10.4 4.2v7.2H3zM11.6 4 21 2.6v8.8h-9.4zM3 12.6h7.4v7.2L3 18.7zM11.6 12.6H21v8.8L11.6 20z"/>',
    macos: '<path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.6-3.9zM14.2 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z"/>',
    linux: '<path d="M12 2.6c-2.3 0-3.6 1.9-3.6 4.4 0 1.5.3 2.5-.6 4-1.2 2-2.7 3.8-2.7 6.2 0 .9.3 1.6.8 2.1-.6.4-1.4.6-1.4 1.2 0 .8 1.7.7 3.5.7 1 0 2.1.6 4 .6s3-.6 4-.6c1.8 0 3.5.1 3.5-.7 0-.6-.8-.8-1.4-1.2.5-.5.8-1.2.8-2.1 0-2.4-1.5-4.2-2.7-6.2-.9-1.5-.6-2.5-.6-4 0-2.5-1.3-4.4-3.6-4.4zm-1.4 3.6a.8 1 0 1 1 0 2 .8 1 0 0 1 0-2zm2.8 0a.8 1 0 1 1 0 2 .8 1 0 0 1 0-2zM12 8.6l1.6 1-1.6 1-1.6-1z"/>'
  };
  function icon(name, cls) {
    if (FILLED[name]) return '<svg class="i i--fill' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + FILLED[name] + '</svg>';
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (I[name] || I.box) + '</svg>';
  }

  /* --- small parts */

  function pill(status) {
    return '<span class="pill pill--' + esc(status) + '">' + esc(STATUS_NAME[status] || status) + '</span>';
  }
  function isFree(p) { return !!(p.price && Number(p.price.amount) === 0); }
  // "Free" (price 0) and "Open source · MIT" / "Closed source" badges.
  function licensePill(p) {
    var h = isFree(p) ? '<span class="pill pill--free">Free</span>' : '';
    if (isOss(p)) h += '<span class="pill pill--oss">' + icon('scale') + 'Open source · ' + esc(p.license.name) + '</span>';
    else if (p.license) h += '<span class="pill pill--quiet">' + icon('lock') + 'Closed source</span>';
    return h;
  }
  function licenseLabel(p) {
    if (isOss(p)) return (isFree(p) ? 'Free · ' : '') + 'Open source · ' + p.license.name;
    return (isFree(p) ? 'Free' : 'Proprietary') + ' · closed source';
  }
  function accentAttrs(p) {
    var a = p.accent || {};
    return ' data-accent-dark="' + esc(a.dark || '') + '" data-accent-light="' + esc(a.light || '') + '"';
  }
  function img(src, ctx, alt, w, h, cls, eager) {
    return '<img src="' + esc(url(src, ctx)) + '" alt="' + esc(alt || '') + '" width="' + w + '" height="' + h + '"' +
      (cls ? ' class="' + cls + '"' : '') + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  // A screenshot in both themes from a base path: <src>-dark|light-800|1440.webp. The theme that …
  function shot(src, ctx, alt, cls, eager, sizes) {
    var s = url(src, ctx), sz = sizes || '(min-width: 1280px) 1200px, 100vw';
    // Both themes are in the page; the hidden one is display:none and, being lazy, never loads …
    var one = function (theme) {
      var b = esc(s) + '-' + theme;
      return '<picture><source type="image/avif" srcset="' + b + '-800.avif 800w, ' + b + '-1440.avif 1440w" sizes="' + sz + '">' +
        '<img src="' + b + '-1440.webp" srcset="' + b + '-800.webp 800w, ' + b + '-1440.webp 1440w" sizes="' + sz + '" alt="' + esc(alt || '') +
        '" width="1440" height="900" class="theme-' + theme + '-only' + (cls ? ' ' + cls : '') + '" loading="lazy"' + (eager ? ' fetchpriority="high"' : '') + ' decoding="async"></picture>';
    };
    return one('dark') + one('light');
  }
  function windowFrame(inner, title) {
    return '<div class="frame">' +
      '<div class="frame__bar" aria-hidden="true"><span class="frame__title">' + esc(title || '') + '</span>' +
      '<span class="frame__ctl"><i></i><i></i><i></i></span></div>' +
      '<div class="frame__body">' + inner + '</div></div>';
  }
  function heroShot(p, ctx, eager) {
    if (!p.hero) return '';
    return windowFrame(shot(p.hero.src, ctx, p.hero.alt, '', eager), p.name);
  }

  // A single responsive image (not themed): <src>-800.webp / <src>-1440.webp.
  function plain(src, ctx, alt, cls, eager, sizes) {
    var b = esc(url(src, ctx)), sz = sizes || '(min-width: 1280px) 1200px, 100vw';
    return '<picture><source type="image/avif" srcset="' + b + '-800.avif 800w, ' + b + '-1440.avif 1440w" sizes="' + sz + '">' +
      '<img src="' + b + '-1440.webp" srcset="' + b + '-800.webp 800w, ' + b + '-1440.webp 1440w" sizes="' + sz +
      '" alt="' + esc(alt || '') + '" width="1440" height="900"' + (cls ? ' class="' + cls + '"' : '') + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"></picture>';
  }

  /* --- dividers */

  // A section divider: a hairline on the container edges, fading out at both ends.
  function rule() { return '<div class="container rule-wrap" aria-hidden="true"><div class="rule"></div></div>'; }

  /* --- download CTA */

  // Pre-rendered for Windows; app.js retargets it to the visitor's OS.
  function downloadCta(p, ctx, opts) {
    opts = opts || {};
    var rel = latest(p);
    var primary = PLATFORMS.filter(function (k) { return filesFor(rel, k).length; })[0] || 'windows';
    var f = filesFor(rel, primary)[0];
    var size = f ? fmtSize(f.size) : null;
    if (p.status === 'coming-soon' || !rel) {
      var nh = notifyHref(p, ctx);
      return '<div class="dl-cta">' + (nh ? '<a class="btn btn--primary btn--lg" href="' + esc(nh) + '">' + icon('mail') + 'Notify me when it ships</a>' : '<span class="pill pill--coming-soon">Coming soon</span>') + '</div>';
    }
    return '<div class="dl-cta' + (opts.launch ? ' dl-cta--launch' : '') + '" data-dl-cta="' + esc(p.id) + '">' +
      '<div class="dl-cta__row">' +
      '<a class="btn btn--primary btn--lg" data-dl-primary href="' + esc(downloadHref(p, ctx, primary)) + '">' +
      '<span data-dl-icon>' + icon(primary) + '</span><span data-dl-label>Download for ' + PLATFORM_NAME[primary] + '</span></a>' +
      (opts.launch
        ? '<a class="link-more" href="' + esc(opts.secondaryHref || '#tour') + '">' + esc(opts.secondaryLabel || 'Learn more') + icon('chevronRight') + '</a>'
        : '<a class="btn btn--ghost btn--lg" href="' + esc(opts.otherHref || (downloadHref(p, ctx) + '#all')) + '">Other platforms</a>') +
      '</div>' +
      '<p class="dl-cta__meta mono" data-dl-meta>v' + esc(rel.version) + ' · ' + esc(osSummary(p)) + (f ? ' · ' + esc(f.arch) : '') + (size ? ' · ' + esc(size) : '') + (isFree(p) ? ' · free' : '') + ' · no account needed</p>' +
      '<p class="dl-cta__note" data-dl-note hidden></p>' +
      '</div>';
  }

  /* --- verify */

  var verifyCount = 0;
  function verifyBlock(file, opts) {
    opts = opts || {};
    var id = 'v' + (opts.id || ++verifyCount);
    var fn = file ? file.filename : '<file name>';
    var sha = file && file.sha256;
    var tabs = [
      { k: 'windows', label: 'Windows', sub: 'PowerShell', cmd: 'Get-FileHash "$HOME\\Downloads\\' + fn + '" -Algorithm SHA256',
        check: sha ? '(Get-FileHash "$HOME\\Downloads\\' + fn + '" -Algorithm SHA256).Hash -eq "' + sha.toUpperCase() + '"' : null, checkNote: 'Prints True when the file matches.' },
      { k: 'macos', label: 'macOS', sub: 'Terminal', cmd: 'shasum -a 256 ~/Downloads/' + shellQuote(fn),
        check: sha ? 'echo "' + sha + '  ' + fn + '" | (cd ~/Downloads && shasum -a 256 -c)' : null, checkNote: 'Prints OK when the file matches.' },
      { k: 'linux', label: 'Linux', sub: 'Terminal', cmd: 'shasum -a 256 ~/Downloads/' + shellQuote(fn) + '\n# or: sha256sum ~/Downloads/' + shellQuote(fn),
        check: sha ? 'echo "' + sha + '  ' + fn + '" | (cd ~/Downloads && sha256sum -c)' : null, checkNote: 'Prints OK when the file matches.' }
    ];
    var sel = opts.platform && tabs.some(function (t) { return t.k === opts.platform; }) ? opts.platform : 'windows';
    var h = '<div class="verify" data-tabs>' +
      '<div class="tabs" role="tablist" aria-label="Verify on">';
    tabs.forEach(function (t) {
      var on = t.k === sel;
      h += '<button class="tab" type="button" role="tab" id="' + id + '-t-' + t.k + '" aria-controls="' + id + '-p-' + t.k + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' +
        icon(t.k) + '<span>' + t.label + '</span><span class="tab__sub">' + t.sub + '</span></button>';
    });
    h += '</div>';
    tabs.forEach(function (t) {
      var on = t.k === sel;
      h += '<div class="tabpanel" role="tabpanel" id="' + id + '-p-' + t.k + '" aria-labelledby="' + id + '-t-' + t.k + '"' + (on ? '' : ' hidden') + '>' +
        codeBlock(t.cmd, 'Compute the SHA-256 of the file') +
        (t.check ? codeBlock(t.check, 'Or check it against the published value in one step') + '<p class="fine">' + t.checkNote + '</p>' : '') +
        '</div>';
    });
    h += '<p class="verify__how">' + (sha
      ? 'Compare the result with the SHA-256 published here. If they differ, delete the file and download it again.'
      : 'Compare the result with the SHA-256 published next to the file. If they differ, delete the file and download it again.') + '</p>';
    h += '</div>';
    return h;
  }
  function shellQuote(s) { return /^[\w.\-\/]+$/.test(s) ? s : '"' + s.replace(/(["\\$`])/g, '\\$1') + '"'; }
  function codeBlock(code, label) {
    return '<div class="code">' + (label ? '<p class="code__label mono">' + esc(label) + '</p>' : '') +
      '<div class="code__body"><pre><code>' + esc(code) + '</code></pre>' +
      '<button class="copy" type="button" data-copy="' + esc(code) + '" aria-label="Copy command">' + icon('copy') + '<span class="copy__txt">Copy</span></button></div></div>';
  }
  function hashCell(f) {
    if (!f.sha256) return '<span class="muted">Published with the upload</span>';
    return '<span class="hash"><code title="' + esc(f.sha256) + '">' + esc(shortHash(f.sha256)) + '</code>' +
      '<button class="copy copy--icon" type="button" data-copy="' + esc(f.sha256) + '" aria-label="Copy SHA-256 of ' + esc(f.filename) + '">' + icon('copy') + '<span class="copy__txt">Copy</span></button></span>';
  }

  /* --- downloads table */

  function fileRow(f, ctx, p, rel) {
    var size = fmtSize(f.size);
    return '<tr>' +
      '<td data-label="File"><span class="file">' + icon('box') + '<span class="file__name">' + esc(f.filename) + '</span></span></td>' +
      '<td data-label="Type">' + esc(KIND_NAME[f.kind] || f.kind) + '</td>' +
      '<td data-label="Arch"><span class="mono">' + esc(f.arch) + '</span></td>' +
      '<td data-label="Size"><span class="mono">' + (size ? esc(size) : '<span class="muted">—</span>') + '</span></td>' +
      '<td data-label="SHA-256">' + hashCell(f) + '</td>' +
      '<td class="t-act"><a class="btn btn--accent btn--sm" href="' + esc(fileUrl(f, ctx)) + '" download data-dl-file data-product="' + esc(p.id) + '" data-version="' + esc(rel.version) + '" data-filename="' + esc(f.filename) + '" data-platform="' + esc(f.platform) + '">' + icon('download') + 'Download</a></td>' +
      '</tr>';
  }
  function filesTable(p, rel, ctx, opts) {
    opts = opts || {};
    var h = '<div class="dl-groups">';
    PLATFORMS.forEach(function (k) {
      var files = filesFor(rel, k);
      var st = platformStatus(p, k);
      if (!files.length && !st) return;
      if (!files.length && opts.onlyWithFiles) return;
      h += '<section class="dl-group" aria-label="' + PLATFORM_NAME[k] + '">' +
        '<header class="dl-group__head">' + icon(k) + '<h3>' + PLATFORM_NAME[k] + '</h3>' +
        (files.length ? (st === 'beta' ? pill('beta') : '') : pill('coming-soon')) + '</header>';
      if (files.length) {
        h += '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">File</th><th scope="col">Type</th><th scope="col">Arch</th><th scope="col">Size</th><th scope="col">SHA-256</th><th scope="col"><span class="sr-only">Download</span></th></tr></thead><tbody>' +
          files.map(function (f) { return fileRow(f, ctx, p, rel); }).join('') + '</tbody></table></div>';
        if (k === 'windows' && !(ctx.site && ctx.site.codeSigning && ctx.site.codeSigning.windows)) {
          h += '<p class="note">' + icon('info') + '<span>This installer is not code-signed yet, so Windows SmartScreen may say “Windows protected your PC”. Verify the checksum first, then choose <strong>More info → Run anyway</strong>.</span></p>';
        }
        if (k === 'macos' && !(ctx.site && ctx.site.codeSigning && ctx.site.codeSigning.macos)) {
          h += '<p class="note">' + icon('info') + '<span>This build is not notarised yet. After verifying the checksum, right-click the app and choose <strong>Open</strong> the first time.</span></p>';
        }
      } else {
        var nk = notifyHref(p, ctx, k);
        h += '<p class="dl-group__soon">' + esc(p.name) + ' for ' + PLATFORM_NAME[k] + ' is on the way.' + (nk ? ' <a href="' + esc(nk) + '">Get an email when it ships</a>.' : '') + '</p>';
      }
      h += '</section>';
    });
    return h + '</div>';
  }

  function notesList(rel) {
    return '<ul class="notes">' + (rel.notes || []).map(function (n) { return '<li>' + txt(n) + '</li>'; }).join('') + '</ul>';
  }

  /* --- license */

  function licenseBlock(p, ctx) {
    var L = p.license || {};
    var h = '<div class="license">';
    if (isOss(p)) {
      h += '<div class="license__head">' + icon('scale') + '<div><h3>Open source · ' + esc(L.name) + '</h3>' +
        '<p>' + esc(p.name) + ' is released under the ' + esc(L.name) + ' license.</p></div></div>';
      if (L.text) h += '<pre class="license__text">' + esc(L.text) + '</pre>';
      else if (L.file) h += '<pre class="license__text" data-license-src="' + esc(url(L.file, ctx)) + '">The full license text is in <a href="' + esc(url(L.file, ctx)) + '">' + esc(L.file.split('/').pop()) + '</a>.</pre>';
      else if (L.url) h += '<p><a href="' + esc(url(L.url, ctx)) + '">Read the full license</a></p>';
    } else {
      h += '<div class="license__head">' + icon('lock') + '<div><h3>' + esc(L.name || 'Proprietary license') + '</h3>' +
        '<p>' + esc(p.name) + (isFree(p) ? ' is free to download, install and use. It is closed-source, proprietary software, licensed — not sold — under its end user license agreement.' : ' is closed-source, proprietary software, licensed — not sold — under its end user license agreement.') + '</p></div></div>';
      if (L.summary && L.summary.length) h += '<ul class="notes license__summary">' + L.summary.map(function (x) { return '<li>' + txt(typeof x === 'string' ? x : x.text) + '</li>'; }).join('') + '</ul><p class="fine">A summary only — the license agreement is the binding text.</p>';
      if (L.url) h += '<p><a class="link-arrow" href="' + esc(url(L.url, ctx)) + '">Read the license agreement' + icon('arrow') + '</a></p>';
    }
    if (L.thirdParty) h += '<p><a class="link-arrow" href="' + esc(url(L.thirdParty, ctx)) + '">Third-party notices' + icon('arrow') + '</a> <span class="muted">Open-source components included in the installer, with their licenses.</span></p>';
    h += '<p class="license__note">' + icon('box') + '<span><strong>Installers only.</strong> ' + esc(cfg(ctx.site).company) + ' distributes ready-to-run installers for its products. Source code is not distributed' + (isOss(p) ? ', including for open-source products' : '') + '.</span></p>';
    return h + '</div>';
  }

  /* --- section heads */

  function sectionHead(eyebrow, title, lead, id) {
    return '<header class="sec-head"' + (id ? ' id="' + id + '"' : '') + '><p class="eyebrow">' + esc(eyebrow) + '</p><h2>' + esc(title) + '</h2>' +
      (lead ? '<p class="lead">' + txt(lead) + '</p>' : '') + '</header>';
  }

  /* --- structured data */

  function jsonLd(p, site, pageUrl) {
    var rel = latest(p);
    var base = (site.baseUrl || '').replace(/\/$/, '');
    var abs = function (u) { return isAbs(u) ? u : base + '/' + u; };
    var data = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      description: p.description,
      applicationCategory: p.schemaCategory || 'DeveloperApplication',
      operatingSystem: osSummary(p) || undefined,
      url: pageUrl,
      image: p.screenshots && p.screenshots[0] ? abs(p.screenshots[0].src + '-dark-1440.webp') : abs(p.icon),
      screenshot: (p.screenshots || []).map(function (s) { return abs(s.src + '-dark-1440.webp'); }),
      publisher: { '@type': 'Organization', name: cfg(site).legal, url: base + '/' }
    };
    if (rel) {
      data.softwareVersion = rel.version;
      if (rel.date) data.datePublished = rel.date;
      var f = rel.files && rel.files[0];
      if (f) {
        data.downloadUrl = isAbs(f.url) ? f.url : (site.downloadBaseUrl ? site.downloadBaseUrl.replace(/\/?$/, '/') + f.url : base + '/' + f.url);
        if (f.size) data.fileSize = fmtSize(f.size);
      }
      data.releaseNotes = base + '/changelog.html?product=' + p.id;
    }
    if (p.price && p.price.amount != null) {
      data.offers = { '@type': 'Offer', price: String(p.price.amount), priceCurrency: p.price.currency || 'USD' };
      if (isFree(p)) data.isAccessibleForFree = true;
    }
    return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  }

  return {
    esc: esc, txt: txt, url: url, fileUrl: fileUrl, slug: slug, fmtDate: fmtDate,
    fmtSize: fmtSize, fmtLong: fmtLong, cfg: cfg, PLATFORMS: PLATFORMS, PLATFORM_NAME: PLATFORM_NAME, STATUS_NAME: STATUS_NAME,
    KIND_NAME: KIND_NAME, latest: latest, productHref: productHref, downloadHref: downloadHref, isOss: isOss, platformStatus: platformStatus,
    filesFor: filesFor, mailto: mailto, notifyHref: notifyHref, osSummary: osSummary, icon: icon, pill: pill,
    isFree: isFree, licensePill: licensePill, licenseLabel: licenseLabel, accentAttrs: accentAttrs, img: img, shot: shot,
    windowFrame: windowFrame, heroShot: heroShot, plain: plain, rule: rule, downloadCta: downloadCta, verifyBlock: verifyBlock,
    codeBlock: codeBlock, hashCell: hashCell, filesTable: filesTable, notesList: notesList, licenseBlock: licenseBlock, sectionHead: sectionHead,
    jsonLd: jsonLd
  };
});
