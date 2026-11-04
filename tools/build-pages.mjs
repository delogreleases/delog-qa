#!/usr/bin/env node
/*
 * Delog — static page builder. Plain Node (18+), no dependencies. Optional: the site works
 * without running it, but run it after editing site.config.js or products.js so that
 *   • products/<id>.html exists for every product (pre-rendered, crawlable, works without JS),
 *   • data regions in index/products/changelog/licenses are pre-rendered (no-JS + SEO),
 *   • the shared <head>, header and footer (tools/partials/*.html) are stamped into every page,
 *   • site.config.js values (company, legal entity, emails, dates, jurisdiction…) are baked into
 *     every [data-cfg] / [data-cfg-if] / [data-email] element, so no-JS visitors see them too,
 *   • canonical + Open Graph URLs, sitemap.xml and robots.txt use site.config.js → baseUrl,
 *   • assets/css/accents.css has every product's accent colour.
 *
 * Usage:  node tools/build-pages.mjs [--check]
 *   --check  exit 1 if any file would change (for CI), without writing.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const rel = (...p) => path.join(ROOT, ...p);
const read = (p) => fs.readFileSync(rel(p), 'utf8');
let changed = 0;
function write(p, content) {
  const file = rel(p);
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (prev === content) return;
  changed++;
  if (CHECK) { console.log('would change  ' + p); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('wrote         ' + p);
}

/* ---------------------------------------------------------------- load data + renderer */
const sandbox = { window: {}, self: undefined, module: undefined };
sandbox.self = sandbox.window;
vm.createContext(sandbox);
for (const f of ['site.config.js', 'assets/js/products.js']) vm.runInContext(read(f), sandbox, { filename: f });
const R = (() => { const m = { exports: {} }; vm.runInContext('(function(module){' + read('assets/js/render.js') + '\n})', sandbox)(m); return m.exports; })();
// The page-specific renderers extend the same object, as they do in the browser.
sandbox.window.DelogRender = R;
for (const f of ['assets/js/render-product.js', 'assets/js/render-pages.js']) vm.runInContext(read(f), sandbox, { filename: f });
const SITE = sandbox.window.DELOG_SITE;
const PRODUCTS = sandbox.window.DELOG_PRODUCTS;
if (!SITE || !Array.isArray(PRODUCTS)) throw new Error('site.config.js / products.js did not define DELOG_SITE / DELOG_PRODUCTS');
const BASE = String(SITE.baseUrl || '').replace(/\/$/, '');
const C = R.cfg(SITE);
validate();

// Same hash as assets/js/app.js — lets the browser skip re-rendering unchanged regions.
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const esc = R.esc;

/* ---------------------------------------------------------------- brand mark */
function mark(id, cls = 'logo__mark') {
  return `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><linearGradient id="dlg-${id}" x1="7" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#bdbfff"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs><rect x=".5" y=".5" width="31" height="31" rx="9" fill="#0d0e14" stroke="#ffffff" stroke-opacity=".14"/><path d="M10.25 9.5v13" stroke="url(#dlg-${id})" stroke-width="3.2" stroke-linecap="round"/><path d="M15.75 9.5a6.5 6.5 0 0 1 0 13" fill="none" stroke="url(#dlg-${id})" stroke-width="3.2" stroke-linecap="round"/><circle cx="15.75" cy="16" r="2" fill="url(#dlg-${id})"/></svg>`;
}

/* ---------------------------------------------------------------- partials */
const partials = Object.fromEntries(['head', 'header', 'footer', 'scripts'].map((n) => [n, read(`tools/partials/${n}.html`).trim()]));
const shipping = PRODUCTS.filter((p) => p.status !== 'coming-soon');

function fill(tpl, base, page) {
  return tpl
    .replace(/\{\{extScripts\}\}/g, () => {
      // Each page loads only the extra code it uses.
      const product = page === 'product' || PRODUCTS.some((p) => p.id === page);
      const files = product ? ['render-product.js', 'app-product.js']
        : ({ download: ['render-pages.js', 'app-pages.js'], products: ['render-pages.js', 'app-pages.js'], changelog: ['render-pages.js', 'app-pages.js'],
          licenses: ['render-pages.js'], home: ['render-pages.js'], contact: ['contact.js'] })[page] || [];
      return files.map((f) => `<script src="{{base}}assets/js/${f}" defer></script>`).join('\n');
    })
    .replace(/\{\{(productName|productLinks|sheetProduct)\}\}/g, (_, slot) => {
      const p = PRODUCTS.find((x) => x.id === page && x.launch);
      if (!p) return '';
      return R.productNav(p, { base, site: SITE }, slot === 'productName' ? 'name' : slot === 'sheetProduct' ? 'sheet' : 'group');
    })
    .replace(/\{\{base\}\}/g, base)
    .replace(/\{\{company\}\}/g, esc(C.company))
    .replace(/\{\{legalName\}\}/g, esc(C.legal))
    .replace(/\{\{tagline\}\}/g, esc(SITE.tagline))
    .replace(/\{\{year\}\}/g, esc(C.year))
    .replace(/\{\{downloadHref\}\}/g, base + (shipping.length === 1 ? 'download.html?product=' + shipping[0].id : 'download.html'))
    // The Products menu in the top bar: every product, with its icon and one line — any number of them.
    .replace(/\{\{productMenu\}\}/g, () => productMenu(base, page))
    .replace(/\{\{productsCurrent\}\}/g, page === 'products' || PRODUCTS.some((p) => p.id === page) ? ' aria-current="page"' : '')
    .replace(/\{\{productRows\}\}/g, shipping.map((p) => `<a href="${esc(R.productHref(p, { base, site: SITE }))}" data-nav="${esc(p.id)}">${p.icon ? `<img src="${esc(base + p.icon.replace('icon-256', 'icon-128'))}" alt="" width="22" height="22" loading="lazy" decoding="async">` : ''}${esc(p.name)}</a>`).join('\n    '))
    .replace(/\{\{productFooter\}\}/g, PRODUCTS.map((p) => `<li><a href="${esc(R.productHref(p, { base, site: SITE }))}">${esc(p.name)}</a></li>`).join('\n          '))
    .replace(/\{\{mark:(\w+)\}\}/g, (_, id) => mark(id))
    .replace(/\{\{icon:(\w+)(?::([\w-]+))?\}\}/g, (_, n, c) => R.icon(n, c))
    .replace(/(<a [^>]*data-nav="([\w-]+)"[^>]*)>/g, (m, open, key) => (key === page ? `${open} aria-current="page">` : m));
}

/** The top bar's Products menu: a slim row per product, then "All products". */
function productMenu(base, page) {
  const items = PRODUCTS.map((p) => {
    const here = p.id === page;
    const line = (p.launch && p.launch.job) || p.tagline;
    const soon = p.status === 'coming-soon' ? '<em class="pmenu__soon">Coming soon</em>' : p.status === 'beta' ? '<em class="pmenu__soon">Beta</em>' : '';
    return `<a class="pmenu__item accent-${esc(p.id)}" href="${esc(R.productHref(p, { base, site: SITE }))}"${here ? ' aria-current="page"' : ''}>` +
      (p.icon ? `<img src="${esc(base + p.icon.replace('icon-256', 'icon-128'))}" alt="" width="28" height="28" loading="lazy" decoding="async">` : '<span class="pmenu__blank" aria-hidden="true"></span>') +
      `<span class="pmenu__t"><b>${esc(p.name)}${soon}</b><span>${esc(line)}</span></span></a>`;
  }).join('\n          ');
  return `<div class="pmenu__list">\n          ${items}\n          </div>\n          <a class="pmenu__all" href="${esc(base)}products.html">All products${R.icon('chevronRight')}</a>`;
}

function metaBlock(meta, base) {
  const url = BASE + '/' + (meta.path === 'index.html' ? '' : meta.path);
  const og = meta.og || 'assets/img/og-default.png';
  const title = meta.title;
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    meta.noindex ? '<meta name="robots" content="noindex, follow">' : null,
    `<link rel="canonical" href="${esc(meta.canonical ? BASE + '/' + meta.canonical : url)}">`,
    `<meta property="og:type" content="${esc(meta.type || 'website')}">`,
    `<meta property="og:site_name" content="${esc(C.company)}">`,
    `<meta property="og:title" content="${esc(meta.ogTitle || title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(BASE + '/' + og)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(meta.ogAlt || C.company + ' — ' + C.tagline)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    meta.org ? '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: C.company, legalName: C.legal !== C.company ? C.legal : undefined, url: BASE + '/', logo: BASE + '/assets/img/icon-512.png', email: C['email.general'] || undefined, address: C.address || undefined }) + '</script>' : null
  ];
  return lines.filter(Boolean).join('\n');
}

const REGIONS = {
  'products-grid': (attrs, ctx) => R.productsGrid(PRODUCTS, ctx, { withNext: attrs['data-next'] !== 'false' }),
  'download-cta': (attrs, ctx) => {
    const p = byId(attrs['data-product']);
    if (!p) return null;
    const unesc = (v) => (v || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return R.downloadCta(p, ctx, attrs['data-variant'] === 'launch' ? { launch: true, secondaryHref: unesc(attrs['data-secondary-href']), secondaryLabel: unesc(attrs['data-secondary-label']) } : undefined);
  },
  'hero-shot': (attrs, ctx) => { const p = byId(attrs['data-product']); return p ? R.heroShot(p, ctx, true) : null; },
  changelog: (attrs, ctx) => R.changelog(PRODUCTS, ctx),
  'changelog-filters': () => R.changelogFilters(PRODUCTS),
  licenses: (attrs, ctx) => R.licensesList(PRODUCTS, ctx),
  verify: (attrs) => {
    const p = byId(attrs['data-product']); const r = p && R.latest(p);
    const f = r && (R.filesFor(r, 'windows')[0] || r.files[0]);
    return f ? R.verifyBlock(f, { id: 'home-' + p.id }) : null;
  }
};
function byId(id) { return PRODUCTS.find((p) => p.id === id); }
function attrsOf(tag) {
  const out = {};
  tag.replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => { out[k] = v; return ''; });
  return out;
}

function stamp(html, file) {
  const bodyTag = /<body([^>]*)>/.exec(html.replace(/<!--[\s\S]*?-->/g, '')); // ignore "<body>" mentioned in comments
  if (!bodyTag) return html;
  const battrs = attrsOf(bodyTag[1]);
  const base = battrs['data-base'] || '';
  const page = battrs['data-page'] || '';
  const ctx = { base, site: SITE, products: PRODUCTS };

  // <!-- @meta {...} --> … <!-- /@meta -->
  html = html.replace(/<!-- @meta (\{[\s\S]*?\}) -->[\s\S]*?<!-- \/@meta -->/, (m, json) => {
    const meta = JSON.parse(json);
    return `<!-- @meta ${json} -->\n${metaBlock(meta, base)}\n<!-- /@meta -->`;
  });
  for (const name of ['head', 'header', 'footer', 'scripts']) {
    const re = new RegExp(`<!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->`);
    html = html.replace(re, `<!-- @${name} -->\n${fill(partials[name], base, page)}\n<!-- /@${name} -->`);
  }
  // data regions: <el data-render="kind" …><!-- @render --> … <!-- /@render --></el>
  html = html.replace(/(<[a-z][\w-]*\s[^>]*data-render="([\w-]+)"[^>]*>)<!-- @render -->[\s\S]*?<!-- \/@render -->/g, (m, open, kind) => {
    const fn = REGIONS[kind];
    if (!fn) return m;
    const out = fn(attrsOf(open), ctx);
    if (out == null) return m;
    const tag = /data-rendered="[^"]*"/.test(open) ? open.replace(/data-rendered="[^"]*"/, `data-rendered="${hash(out)}"`) : open.replace(/>$/, ` data-rendered="${hash(out)}">`);
    return `${tag}<!-- @render -->${out}<!-- /@render -->`;
  });
  // "On this page" for long documents: <!-- @doc-toc --><!-- /@doc-toc --> lists the page's
  // h2/h3 headings (each gets a stable id, h3 ids prefixed by their h2 so numbering can repeat).
  const docStart = html.indexOf('<div class="prose">'), docEnd = html.indexOf('<!-- @doc-toc -->');
  if (docStart > -1 && docEnd > docStart) {
    const slug = (s) => s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;|&#\d+;/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const items = [];
    let parent = '';
    const doc = html.slice(docStart, docEnd).replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
      let id = (/\sid="([^"]+)"/.exec(attrs) || [])[1];
      if (!id) id = (tag === 'h3' && parent ? parent + '-' : '') + slug(inner);
      if (tag === 'h2') parent = id;
      items.push({ tag, id, text: inner.replace(/<[^>]+>/g, '').trim() });
      return /\sid="/.test(attrs) ? m : `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    });
    html = html.slice(0, docStart) + doc + html.slice(docEnd);
    const list = items.map((i) => `<li${i.tag === 'h3' ? ' class="doc-toc__sub"' : ''}><a href="#${esc(i.id)}">${i.text}</a></li>`).join('');
    html = html.replace(/<!-- @doc-toc -->[\s\S]*?<!-- \/@doc-toc -->/, `<!-- @doc-toc --><nav class="doc-toc" aria-label="On this page"><p class="doc-toc__title">On this page</p><ul>${list}</ul></nav><!-- /@doc-toc -->`);
  }
  // mailto links that follow site.config.js → email.<key>, hidden when no address is set
  html = html.replace(/<a ([^>]*\bdata-email="(\w+)"[^>]*)>([^<]*)<\/a>/g, (m, attrs, key, text) => {
    const addr = C['email.' + key];
    let rest = attrs.replace(/\s*href="[^"]*"/, '').replace(/\s+hidden\b/, '').trim();
    if (!addr) return `<a href="${base}contact.html" ${rest} hidden>${text}</a>`;
    const subj = (/data-subject="([^"]*)"/.exec(attrs) || [])[1];
    const href = esc(R.mailto(addr, subj ? subj.replace(/&amp;/g, '&') : ''));
    return `<a href="${href}" ${rest}>${/data-email-text/.test(attrs) ? esc(addr) : text}</a>`;
  });
  // [data-cfg="key"] text, [data-cfg-if|unless="key"] visibility
  html = html.replace(/<([a-z][\w-]*)([^>]*?\sdata-cfg="([\w.]+)"[^>]*)>([^<]*)<\/\1>/g, (m, tag, attrs, key) =>
    C[key] == null ? m : `<${tag}${attrs}>${esc(C[key])}</${tag}>`);
  html = html.replace(/<([a-z][\w-]*)([^>]*?\sdata-cfg-(if|unless)="([\w.]+)"[^>]*)>/g, (m, tag, attrs, mode, key) => {
    const show = mode === 'if' ? !!C[key] : !C[key];
    const clean = attrs.replace(/\s+hidden(?=[\s>]|$)/, '');
    return `<${tag}${clean}${show ? '' : ' hidden'}>`;
  });
  // Screenshot macro: {{shot:path/without-theme|alt text}} → light + dark responsive images
  html = html.replace(/\{\{shot:([^|}]+)\|([^}]*)\}\}/g, (_, src, alt) => R.shot(src.trim(), ctx, alt.trim(), '', false, '(min-width: 834px) 46vw, 100vw'));
  // Contact form: product choices, and the <form> set up for site.config.js → contactForm.provider
  html = html.replace(/\{\{productOptions\}\}/g, PRODUCTS.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''));
  html = html.replace(/<form class="cform" data-contact-form[^>]*><!-- @form-hidden -->[\s\S]*?<!-- \/@form-hidden -->/, () => {
    const prov = C.formProvider, cf = SITE.contactForm || {};
    let attrs = '', hidden = '';
    if (prov === 'mailto') attrs = C['email.general'] ? ` action="mailto:${esc(C['email.general'])}" method="post" enctype="text/plain"` : '';
    else if (prov === 'netlify') { attrs = ' name="contact" method="POST" action="/contact.html" data-netlify="true" netlify-honeypot="company"'; hidden = '<input type="hidden" name="form-name" value="contact">'; }
    else if (C.formEndpoint) {
      attrs = ` action="${esc(C.formEndpoint)}" method="POST"`;
      if (prov === 'web3forms') hidden = `<input type="hidden" name="access_key" value="${esc(cf.accessKey || '')}">`;
    }
    return `<form class="cform" data-contact-form data-provider="${esc(prov)}"${attrs} novalidate><!-- @form-hidden -->${hidden}<!-- /@form-hidden -->`;
  });
  // Icon macros anywhere in a page: {{icon:name}} or {{icon:name:extra-class}} → inline SVG.
  html = html.replace(/\{\{icon:(\w+)(?::([\w-]+))?\}\}/g, (_, n, c) => R.icon(n, c));
  html = html.replace(/\{\{mark:(\w+)\}\}/g, (_, id) => mark(id));
  return html;
}

/* ---------------------------------------------------------------- product pages */
function productPageFile(p) {
  const ctx = { base: '../', site: SITE, products: PRODUCTS };
  const r = R.latest(p);
  const key = hash(JSON.stringify(p) + JSON.stringify(SITE));
  const ogFile = `assets/img/og-${p.id}.png`;
  const meta = {
    title: `${p.name} — ${p.tagline.replace(/\.$/, '')} · ${C.company}`,
    ogTitle: `${p.name} by ${C.company}`,
    description: p.description,
    path: `products/${p.id}.html`,
    og: fs.existsSync(rel(ogFile)) ? ogFile : undefined,
    ogAlt: `${p.name} — ${p.tagline}`,
    type: 'website'
  };
  const a = p.accent || {};
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- Generated by tools/build-pages.mjs from assets/js/products.js. Edit the data, not this file. -->
<!-- @meta ${JSON.stringify(meta)} -->
<!-- /@meta -->
<!-- @head -->
<!-- /@head -->
<script type="application/ld+json">
${R.jsonLd(p, SITE, `${BASE}/products/${p.id}.html`)}
</script>
</head>
<body data-base="../" data-page="${esc(p.id)}" class="has-accent accent-${esc(p.id)}${p.launch ? ' has-lnav' : ''}" data-accent-dark="${esc(a.dark || '')}" data-accent-light="${esc(a.light || '')}">
<!-- @header -->
<!-- /@header -->
<main id="main" class="flush" data-render="product-page" data-product="${esc(p.id)}" data-rendered="${key}">
${R.productPage(p, ctx)}
</main>
<!-- @footer -->
<!-- /@footer -->
<!-- @scripts -->
<!-- /@scripts -->
</body>
</html>
`;
}

/* ---------------------------------------------------------------- accents.css */
function accentsCss() {
  const withAccent = PRODUCTS.filter((p) => p.accent && p.accent.light && p.accent.dark);
  const rules = (prefix, k, indent = '') => withAccent.map((p) => `${indent}${prefix}.accent-${p.id} { --accent: ${p.accent[k]}; }`).join('\n');
  return `/* Generated by tools/build-pages.mjs from products.js accent colours. Do not edit. */
${rules('', 'light')}
@media (prefers-color-scheme: dark) {
${rules(':root:not([data-theme="light"]) ', 'dark', '  ')}
}
${rules(':root[data-theme="dark"] ', 'dark')}
`;
}

/* ---------------------------------------------------------------- run */
write('assets/css/accents.css', accentsCss());
write('assets/img/favicon.svg', mark('fav', 'mark').replace(' class="mark"', ' xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true" focusable="false"', '') + '\n');

const productFiles = [];
for (const p of PRODUCTS) {
  const f = `products/${p.id}.html`;
  productFiles.push(f);
  write(f, stamp(productPageFile(p), f));
}
// remove pages of products that no longer exist
for (const f of fs.readdirSync(rel('products'))) {
  if (f.endsWith('.html') && !productFiles.includes('products/' + f)) {
    changed++;
    if (CHECK) console.log('would delete  products/' + f);
    else { fs.unlinkSync(rel('products', f)); console.log('deleted       products/' + f); }
  }
}

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const f of pages) write(f, stamp(read(f), f));

// sitemap + robots
const lastmod = (p) => (R.latest(p) && R.latest(p).date) || null;
const urls = [
  { loc: '' }, { loc: 'products.html' }, ...PRODUCTS.map((p) => ({ loc: `products/${p.id}.html`, lastmod: lastmod(p) })),
  { loc: 'download.html' }, { loc: 'changelog.html' }, { loc: 'licenses.html' }, { loc: 'contact.html' },
  { loc: 'privacy.html' }, { loc: 'terms.html' }
].filter((u) => u.loc === '' || fs.existsSync(rel(u.loc)));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by tools/build-pages.mjs. Base URL comes from site.config.js. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(BASE + '/' + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
// Content-Security-Policy (in _headers): only this site, plus the contact-form provider's origin
// when the form posts to one. mailto and Netlify Forms need nothing extra.
{
  const extra = C.formOrigin ? ' ' + C.formOrigin : '';
  const formAction = C.formProvider === 'mailto' ? "'self' mailto:" : "'self'" + extra;
  const csp = `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'${extra}; manifest-src 'self'; base-uri 'none'; form-action ${formAction}; frame-ancestors 'none'; upgrade-insecure-requests`;
  write('_headers', read('_headers').replace(/^(\s*Content-Security-Policy:).*$/m, `$1 ${csp}`));
}

write('robots.txt', `# Generated by tools/build-pages.mjs
User-agent: *
Allow: /
Disallow: /tools/
Disallow: /.review/

Sitemap: ${BASE}/sitemap.xml
`);

console.log(changed ? `${CHECK ? 'Out of date' : 'Done'}: ${changed} file(s).` : 'Everything is up to date.');
if (CHECK && changed) process.exit(1);

/* ---------------------------------------------------------------- validation */
function validate() {
  const ids = new Set();
  const problems = [];
  for (const p of PRODUCTS) {
    if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) problems.push(`product id "${p.id}" must be lowercase letters, digits and dashes`);
    if (ids.has(p.id)) problems.push(`duplicate product id "${p.id}"`);
    ids.add(p.id);
    if (!['available', 'beta', 'coming-soon'].includes(p.status)) problems.push(`${p.id}: status must be available | beta | coming-soon`);
    if (!p.license || !['proprietary', 'open-source'].includes(p.license.kind)) problems.push(`${p.id}: license.kind must be proprietary | open-source`);
    if (p.icon && !fs.existsSync(rel(p.icon))) problems.push(`${p.id}: icon not found: ${p.icon}`);
    const chapters = (p.launch && p.launch.chapters) || [];
    const shots = [...(p.screenshots || []), ...(p.hero ? [p.hero] : []), ...chapters.map((c) => c.visual).filter((v) => v && v.src)];
    for (const v of chapters.map((c) => c.visual).filter((v) => v && v.type === 'compare')) for (const f of [v.before, v.after]) for (const w of [800, 1440]) if (!fs.existsSync(rel(`${f}-${w}.webp`))) problems.push(`${p.id}: compare image missing: ${f}-${w}.webp`);
    for (const s of shots) for (const t of ['dark', 'light']) for (const w of [800, 1440]) if (!fs.existsSync(rel(`${s.src}-${t}-${w}.webp`))) problems.push(`${p.id}: screenshot missing: ${s.src}-${t}-${w}.webp`);
    for (const r of p.releases || []) for (const f of r.files || []) {
      if (!['windows', 'macos', 'linux'].includes(f.platform)) problems.push(`${p.id} ${r.version}: platform "${f.platform}"`);
      if (f.sha256 && !/^[a-f0-9]{64}$/.test(f.sha256)) problems.push(`${p.id} ${r.version}: sha256 of ${f.filename} is not 64 hex characters`);
    }
  }
  if (problems.length) { console.error('products.js problems:\n  ' + problems.join('\n  ')); process.exit(1); }
}
