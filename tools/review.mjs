#!/usr/bin/env node
/*
 * Delog — visual + technical review in a real browser (development only).
 * Starts tools/serve.mjs, opens every page in Microsoft Edge via playwright-core at
 * 1440×900 and 390×844 in light and dark, and checks: console errors, requests leaving the
 * site's origin, failed requests, horizontal overflow, images that didn't load, broken links
 * (after JavaScript rendered the page), and key interactions. Screenshots go to .review/.
 *
 *   node tools/review.mjs --playwright <path to node_modules/playwright-core> [--only index]
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.review');
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const pwPath = arg('--playwright') || process.env.PLAYWRIGHT_CORE;
const { chromium } = pwPath ? createRequire(path.join(path.resolve(pwPath), 'package.json'))(path.resolve(pwPath)) : await import('playwright-core');
const ONLY = arg('--only');
const PORT = 4179;
const ORIGIN = `http://127.0.0.1:${PORT}`;

const PAGES = [
  ['index', '/'],
  ['products', '/products.html'],
  ['product-static', '/products/driftly.html'],
  ['product-dynamic', '/product.html?id=driftly'],
  ['download', '/download.html?product=driftly'],
  ['tracemend-static', '/products/tracemend.html'],
  ['tracemend-dynamic', '/product.html?id=tracemend'],
  ['tracemend-download', '/download.html?product=tracemend'],
  ['prism-static', '/products/prism.html'],
  ['prism-dynamic', '/product.html?id=prism'],
  ['prism-download', '/download.html?product=prism'],
  ['download-picker', '/download.html'],
  ['changelog', '/changelog.html'],
  ['licenses', '/licenses.html'],
  ['privacy', '/privacy.html'],
  ['terms', '/terms.html'],
  ['contact', '/contact.html'],
  ['404', '/no-such-page']
].filter(([n]) => !ONLY || ONLY.split(',').includes(n));
const VIEWPORTS = [['desktop', 1440, 900], ['laptop', 1280, 800], ['phone', 390, 844]];
const THEMES = ['dark', 'light'];

fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), String(PORT)], { stdio: 'ignore' });
await waitFor(ORIGIN + '/');

const browser = await chromium.launch({ channel: 'msedge' });
const report = { issues: [], pages: [] };
const issue = (where, what) => { report.issues.push(`${where}: ${what}`); };
const linkSet = new Map();

for (const [name, url] of PAGES) {
  for (const [vp, w, h] of VIEWPORTS) {
    for (const theme of THEMES) {
      const tag = `${name} ${vp} ${theme}`;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: 1, acceptDownloads: true, hasTouch: vp === 'phone', isMobile: false });
      const page = await ctx.newPage();
      page.on('console', (m) => { if (name === '404' && /status of 404/.test(m.text())) return; if (m.type() === 'error' || m.type() === 'warning') issue(tag, `console ${m.type()}: ${m.text()}`); });
      page.on('pageerror', (e) => issue(tag, 'page error: ' + e.message));
      page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:')) issue(tag, 'request outside origin: ' + u); });
      page.on('response', (r) => { if (r.status() >= 400 && !(name === '404' && r.url().includes('no-such-page'))) issue(tag, `HTTP ${r.status()} ${r.url()}`); });
      page.on('requestfailed', (r) => { if (!r.url().includes('/downloads/')) issue(tag, `request failed: ${r.url()} ${r.failure() && r.failure().errorText}`); });
      await page.goto(ORIGIN + url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // scroll through so lazy images load and reveal animations finish
      await page.evaluate(async () => {
        const step = Math.max(300, innerHeight * 0.7);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
        scrollTo(0, 0);
        // full-page captures resize the viewport; settle every reveal so nothing is caught mid-fade
        document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in'));
      });
      await page.waitForLoadState('networkidle');
      // wait for every image that is actually rendered (hidden demo panels stay unloaded by design)
      await page.evaluate(() => Promise.race([
        Promise.all([...document.images].filter((i) => i.getClientRects().length).map((i) => i.complete ? 0 : new Promise((r) => { i.addEventListener('load', r); i.addEventListener('error', r); }))),
        new Promise((r) => setTimeout(r, 8000))
      ]));
      await page.waitForTimeout(1300);
      const facts = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = [];
        if (document.documentElement.scrollWidth > vw + 1) {
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('dialog')) {
              let p = el.parentElement, clipped = false;
              while (p) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { clipped = true; break; } p = p.parentElement; }
              if (!clipped) over.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '') + ` (right ${Math.round(r.right)})`);
            }
          }
        }
        const inView = (i) => { const t = i.closest('.carousel__track'); if (!t) return true; const a = i.getBoundingClientRect(), b = t.getBoundingClientRect(); return a.right > b.left + 1 && a.left < b.right - 1; };
        const imgs = [...document.images].filter((i) => i.getClientRects().length > 0 && inView(i)); // off-screen carousel slides load when reached
        const badImgs = imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
        const noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src);
        const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
        const h1 = document.querySelectorAll('h1').length;
        return { scrollWidth: document.documentElement.scrollWidth, vw, over: over.slice(0, 8), badImgs, noAlt, links, h1, title: document.title };
      });
      if (facts.scrollWidth > facts.vw + 1) issue(tag, `horizontal overflow ${facts.scrollWidth} > ${facts.vw}: ${facts.over.join(', ')}`);
      for (const b of facts.badImgs) issue(tag, 'image did not load: ' + b);
      for (const b of facts.noAlt) issue(tag, 'image without alt: ' + b);
      if (facts.h1 !== 1) issue(tag, `${facts.h1} <h1> elements`);
      // Alignment audit: every key block shares the header's content edges (or its centre), and
      // items laid out side by side start their parts on the same line.
      const misaligned = await page.evaluate(() => {
        const out = [];
        // Layout boxes ignore transforms, so mid-animation reveals and the scroll scene measure at rest.
        const box = (el) => {
          let x = 0, y = 0, n = el;
          while (n) { x += n.offsetLeft + (n !== el ? n.clientLeft : 0); y += n.offsetTop + (n !== el ? n.clientTop : 0); n = n.offsetParent; }
          return { left: x, right: x + el.offsetWidth, top: y };
        };
        const bar = document.querySelector('.site-footer .container');
        if (!bar) return ['no footer container to measure against'];
        const bs = getComputedStyle(bar), br = box(bar);
        const L = br.left + parseFloat(bs.paddingLeft), R = br.right - parseFloat(bs.paddingRight), C = (L + R) / 2;
        const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
        const nm = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
        const edge = (sel, mode) => document.querySelectorAll(sel).forEach((el) => {
          if (!shown(el)) return;
          const r = box(el);
          if (mode.includes('l') && Math.abs(r.left - L) > 1) out.push(`${nm(el)} left ${r.left.toFixed(1)} ≠ ${L.toFixed(1)}`);
          if (mode.includes('r') && Math.abs(r.right - R) > 1) out.push(`${nm(el)} right ${r.right.toFixed(1)} ≠ ${R.toFixed(1)}`);
          if (mode.includes('c') && Math.abs((r.left + r.right) / 2 - C) > 1) out.push(`${nm(el)} centre ${((r.left + r.right) / 2).toFixed(1)} ≠ ${C.toFixed(1)}`);
        });
        // full container width
        edge('.rule, .spec, .carousel__track, .carousel__controls, .statrow:not(.statrow--mini), :not(.home-tiles) > .ptile:not(.ptile--half), :not(.home-tiles) > .ptiles, .grid-cards, .footer-note, .footer-grid, .footer-bottom, .bento, .specs__list, .dl-groups, .stats-band__grid:not(.stats-mini), .chap__grid, .lic-list, .contact-grid, .timeline, .dl-card, .thanks, .rn, .p-facts, .container > .notice, .disclosure', 'lr');
        edge('.chap--center .chap__visual, .chap--bleed .chap__visual', 'lr');
        // home tiles run edge to edge, 12px from each side of the window
        const W = document.documentElement.clientWidth;
        document.querySelectorAll('.home-tiles > .ptile, .home-tiles > .ptiles').forEach((el) => {
          if (!shown(el)) return;
          const r = box(el);
          if (Math.abs(r.left - 12) > 1 || Math.abs(r.right - (W - 12)) > 1) out.push(`${nm(el)} edges ${r.left.toFixed(1)}–${r.right.toFixed(1)} ≠ 12–${W - 12}`);
        });
        // left-aligned blocks
        // centred: page headers, and legal documents as one block
        edge('.page-head :is(.eyebrow, .page-title, .lead), .doc', 'c');
        edge('.lic, .lx-head--left, .chips, .dl-hero .crumbs, .dl-hero__head, .sec-head:not(.sec-head--center), .chap--split .chap__head', 'l');
        // right-aligned blocks
        edge('.chap--split .chap__visual, .chap--split-rev .chap__head', 'r');
        edge('.chap--split-rev .chap__visual', 'l');
        // centred blocks
        edge('.pnav__brand', 'l');
        edge('.pnav__actions', 'r');
        edge('.pnav__mid, .brand-hero h1, .lx-hero__title, .lx-hero__line, .chap--center .chap__head, .chap--verdict .chap__head, .chap--terminal .chap__head, .chap--verdict .chap__visual, .chap--terminal .chap__visual, .lx-head:not(.lx-head--left), .final__title, .cine__win, .nf__code', 'c');
        // side-by-side items: parts start on the same line
        const rows = (gridSel, itemSel, parts) => document.querySelectorAll(gridSel).forEach((g) => {
          const items = [...g.children].filter((c) => c.matches(itemSel) && shown(c));
          const byTop = {};
          items.forEach((it) => { const t = Math.round(box(it).top); (byTop[t] = byTop[t] || []).push(it); });
          Object.values(byTop).filter((a) => a.length > 1).forEach((a) => parts.forEach((ps) => {
            const tops = a.map((it) => it.querySelector(ps)).filter((e) => e && shown(e)).map((e) => box(e).top);
            if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 2) out.push(`${nm(g)} row: ${ps} tops differ by ${(Math.max(...tops) - Math.min(...tops)).toFixed(1)}px`);
          }));
          // items in a row: same width inset for their visuals
          Object.values(byTop).filter((a) => a.length > 1).forEach((a) => {
            const ins = a.map((it) => { const v = it.querySelector('.ptile__visual'); if (!v) return null; const ir = box(it), vr = box(v); return [vr.left - ir.left, ir.right - vr.right]; }).filter(Boolean);
            if (ins.length > 1 && ins.some((x) => Math.abs(x[0] - ins[0][0]) > 1 || Math.abs(x[1] - ins[0][1]) > 1)) out.push(`${nm(g)} row: visual insets differ ${JSON.stringify(ins.map((x) => x.map(Math.round)))}`);
          });
        });
        rows('.ptiles', '.ptile', ['.ptile__name', 'h2', '.ptile__line', '.link-row', '.ptile__visual']);
        rows('.grid-cards', '.pcard', ['.pcard__top', '.pcard__cat', '.pcard__name', '.pcard__tag', '.pcard__desc', '.plats', '.pcard__foot']);
        rows('.bento', '.tile', ['.tile__anim', '.tile__title', '.tile__text']);
        rows('.statrow', '.statrow__item', ['.statrow__num', '.statrow__label', '.statrow__sub']);
        // tech specs: each group's title and first row start on one line
        document.querySelectorAll('.spec__group').forEach((g) => {
          const t = g.querySelector('.spec__group-title'), r = g.querySelector('.spec__row');
          if (t && r && shown(t) && shown(r) && Math.abs(box(t).left - box(r).left) > 40 && Math.abs(box(t).top - box(r).top) > 3) out.push(`spec group "${t.textContent}": title and rows start ${Math.round(box(r).top - box(t).top)}px apart`);
        });
        rows('.contact-grid', '.contact-card', ['.ic', 'h2', '.addr']);
        rows('.footer-grid', '.footer-col', ['h2', 'ul, .theme-seg']);
        // single big tile: its visual uses the same inset as the paired tiles
        const big = document.querySelector('.ptile:not(.ptile--half) .ptile__visual'), half = document.querySelector('.ptile--half .ptile__visual');
        if (big && half && shown(big) && shown(half)) {
          const bi = box(big).left - box(big.closest('.ptile')).left;
          const hi = box(half).left - box(half.closest('.ptile')).left;
          if (Math.abs(bi - hi) > 1) out.push(`tile visual inset ${bi.toFixed(1)} (wide tile) ≠ ${hi.toFixed(1)} (paired tiles)`);
        }
        return [...new Set(out)];
      });
      for (const m of misaligned) issue(tag, 'alignment: ' + m);
      // Stats: number and label are one element, in reading order, and never desync.
      await page.waitForFunction(() => [...document.querySelectorAll('[data-count]')].every((n) => n.textContent === n.getAttribute('data-count')), null, { timeout: 4000 }).catch(() => null);
      const statProblems = await page.evaluate(() => [...document.querySelectorAll('.statrow__item')].flatMap((it) => {
        const v = it.getAttribute('data-stat'), num = it.querySelector('.statrow__num'), lab = it.querySelector('.statrow__label'), vis = it.querySelector('.statrow__vis');
        const bad = [];
        if (!num || !lab || num.textContent !== v) bad.push(`stat shows "${num && num.textContent}" but is ${v}`);
        if (vis && vis.firstElementChild !== num) bad.push(`stat ${v}: number is not first`);
        const sr = it.querySelector('.sr-only');
        if (!sr || !sr.textContent.startsWith(v + ' ' + lab.textContent)) bad.push(`stat ${v}: screen-reader text "${sr && sr.textContent}"`);
        const r1 = num.getBoundingClientRect(), r2 = lab.getBoundingClientRect();
        if (r2.top < r1.bottom - 2 || Math.abs(r1.left - r2.left) > 40 && getComputedStyle(it).textAlign !== 'center') bad.push(`stat ${v}: label not under its number`);
        return bad;
      }));
      for (const m of statProblems) issue(tag, 'stats: ' + m);
      const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.images].map((i) => i.alt).join(' ') + ' ' + document.title);
      const ph = text.match(/\[[A-Z][A-Z0-9 _/.-]{2,}\]|PLACEHOLDER/g);
      if (ph) issue(tag, 'placeholder text on the page: ' + [...new Set(ph)].join(', '));
      if (new RegExp(String.fromCharCode(107, 97, 114, 116, 104), 'i').test(text)) issue(tag, 'personal name in rendered text'); // the OS account name seen in old screenshots
      for (const l of facts.links) if (!linkSet.has(l)) linkSet.set(l, tag);
      const tall = await page.evaluate(() => document.documentElement.scrollHeight);
      if (tall > 14000) {
        // Chromium can't capture pages this tall in one image, and scroll-driven scenes only look
        // right in a real viewport: capture the page as a sequence of scrolled viewport frames.
        for (let y = 0, n = 1; y < tall; y += h, n++) {
          await page.evaluate((yy) => scrollTo(0, yy), y);
          await page.waitForTimeout(260);
          await page.screenshot({ path: path.join(OUT, `${name}-${vp}-${theme}-part${String(n).padStart(2, '0')}.png`) });
        }
        await page.evaluate(() => scrollTo(0, 0));
      } else {
        await page.screenshot({ path: path.join(OUT, `${name}-${vp}-${theme}.png`), fullPage: true });
      }
      if (theme === 'dark' && vp === 'desktop') await page.screenshot({ path: path.join(OUT, `${name}-${vp}-${theme}-fold.png`) });
      report.pages.push({ tag, title: facts.title });
      await ctx.close();
    }
  }
}

/* ---------------------------------------------------------------- interactions */
async function interact(label, url, fn, opts = {}) {
  if (ONLY && !ONLY.split(',').includes('interactions')) return;
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, colorScheme: opts.scheme || 'dark', acceptDownloads: true, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', permissions: ['clipboard-read', 'clipboard-write'], ...(opts.ua ? { userAgent: opts.ua } : {}), ...(opts.touch ? { hasTouch: true, isMobile: true } : {}) });
  const page = await ctx.newPage();
  if (opts.ua) await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined }));
  page.on('pageerror', (e) => issue(label, 'page error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') issue(label, 'console error: ' + m.text()); });
  await page.goto(ORIGIN + url, { waitUntil: 'networkidle' });
  try { await fn(page); } catch (e) { issue(label, 'interaction failed: ' + e.message.split('\n')[0]); }
  await ctx.close();
}
await interact('theme toggle', '/', async (p) => {
  await p.click('[data-theme-toggle]');
  const t = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (t !== 'light') throw new Error('toggle did not switch to light (got ' + t + ')');
  await p.reload();
  const t2 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (t2 !== 'light') throw new Error('theme not remembered after reload');
  await p.click('.site-footer [data-theme-set="system"]');
  if (await p.evaluate(() => document.documentElement.hasAttribute('data-theme'))) throw new Error('System did not clear the theme');
});
await interact('os cta', '/', async (p) => {
  const label = await p.textContent('[data-dl-cta] [data-dl-label]');
  if (!/Windows/.test(label)) throw new Error('CTA label on Windows is "' + label + '"');
});
await interact('os cta mac', '/', async (p) => {
  const note = await p.textContent('[data-dl-cta] [data-dl-note]');
  if (!/coming soon/i.test(note)) throw new Error('macOS visitor note is "' + note + '"');
}, { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' });
await interact('reveal frames', '/products/driftly.html', async (p) => {
  const geo = await p.evaluate(() => { const c = document.querySelector('.cine'); return { top: c.getBoundingClientRect().top + scrollY, h: c.offsetHeight, vh: innerHeight }; });
  const states = [];
  const stops = [-0.6, 0, 0.18, 0.36, 0.54, 0.72, 1];
  for (let i = 0; i < stops.length; i++) {
    const y = geo.top + stops[i] * (geo.h - geo.vh);
    await p.evaluate((yy) => scrollTo(0, yy), Math.max(0, y));
    await p.waitForTimeout(450);
    states.push(await p.evaluate(() => {
      const w = document.querySelector('.cine__win'), ui = document.querySelector('.cine__ui');
      const m = new DOMMatrixReadOnly(getComputedStyle(w).transform);
      return { scale: Math.hypot(m.a, m.b, m.c), ui: Number(getComputedStyle(ui).opacity) };
    }));
    await p.screenshot({ path: path.join(OUT, `reveal-${i + 1}.png`) });
  }
  const first = states[1], last = states[states.length - 1];
  if (!(first.scale < 0.85)) throw new Error('window not scaled down at the start (' + first.scale.toFixed(2) + ')');
  if (!(last.scale > 0.97)) throw new Error('window not full size at the end (' + last.scale.toFixed(2) + ')');
  if (!(first.ui < 0.2 && last.ui > 0.95)) throw new Error('UI did not cross-fade in (' + first.ui + ' → ' + last.ui + ')');
});
await interact('compare slider', '/products/driftly.html#changes', async (p) => {
  const stage = await p.$('.compare__stage');
  await stage.scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  const box = await stage.boundingBox();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 8 });
  await p.mouse.up();
  const v1 = Number(await p.inputValue('.compare__range'));
  if (v1 > 30) throw new Error('drag did not move the slider (value ' + v1 + ')');
  const pos = await p.evaluate(() => getComputedStyle(document.querySelector('.compare__stage')).getPropertyValue('--pos').trim());
  if (pos !== v1 + '%') throw new Error('--pos ' + pos + ' does not follow value ' + v1);
  await p.screenshot({ path: path.join(OUT, 'interaction-compare-drag.png') });
  await p.focus('.compare__range');
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
  const v2 = Number(await p.inputValue('.compare__range'));
  if (v2 !== v1 + 10) throw new Error('arrow keys moved ' + v1 + ' → ' + v2);
  await p.keyboard.press('End');
  if (Number(await p.inputValue('.compare__range')) !== 100) throw new Error('End did not reach 100');
  await p.keyboard.press('Home');
  await p.screenshot({ path: path.join(OUT, 'interaction-compare-keyboard.png') });
});
await interact('terminal', '/products/driftly.html#ci', async (p) => {
  await p.locator('[data-term]').first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(5200);
  const op = await p.evaluate(() => Number(getComputedStyle(document.querySelector('#ci .term__line--verdict')).opacity));
  if (op < 0.99) throw new Error('verdict line not shown after typing (' + op + ')');
  await p.screenshot({ path: path.join(OUT, 'interaction-terminal.png') });
});
await interact('terminal (Tracemend)', '/products/tracemend.html#ci', async (p) => {
  await p.locator('[data-term]').first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(5200);
  const op = await p.evaluate(() => Number(getComputedStyle(document.querySelector('#ci .term__line--verdict')).opacity));
  if (op < 0.99) throw new Error('verdict line not shown after typing (' + op + ')');
  await p.screenshot({ path: path.join(OUT, 'interaction-terminal-tracemend.png') });
});
await interact('terminal (Prism)', '/products/prism.html#ci', async (p) => {
  await p.locator('[data-term]').first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(5200);
  const op = await p.evaluate(() => Number(getComputedStyle(document.querySelector('#ci .term__line--verdict')).opacity));
  if (op < 0.99) throw new Error('verdict line not shown after typing (' + op + ')');
  await p.screenshot({ path: path.join(OUT, 'interaction-terminal-prism.png') });
});
await interact('reduced motion', '/products/driftly.html', async (p) => {
  const r = await p.evaluate(() => ({
    t: getComputedStyle(document.querySelector('.cine__win')).transform,
    ui: getComputedStyle(document.querySelector('.cine__ui')).opacity,
    pos: getComputedStyle(document.querySelector('.cine__sticky')).position,
    term: getComputedStyle(document.querySelector('#ci .term__line--verdict')).opacity
  }));
  if (r.t !== 'none' || r.ui !== '1' || r.pos !== 'static' || r.term !== '1') throw new Error('not static with reduced motion: ' + JSON.stringify(r));
  await p.evaluate(() => scrollTo(0, document.querySelector('.cine').offsetTop - 60));
  await p.screenshot({ path: path.join(OUT, 'interaction-reduced-motion.png') });
}, { reduced: true });
await interact('verify tabs + copy', '/products/driftly.html#verify', async (p) => {
  await p.click('#verify summary').catch(() => {});
  const open = await p.evaluate(() => document.getElementById('verify').open);
  if (!open) await p.click('#verify summary');
  await p.click('[role="tab"][id$="-t-macos"]');
  const vis = await p.isVisible('[role="tabpanel"][id$="-p-macos"]');
  if (!vis) throw new Error('macOS panel not shown');
  await p.keyboard.press('ArrowRight');
  if (!(await p.isVisible('[role="tabpanel"][id$="-p-linux"]'))) throw new Error('arrow key tab nav failed');
  await p.click('[role="tabpanel"][id$="-p-linux"] .copy');
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  if (!/shasum -a 256/.test(clip)) throw new Error('clipboard has "' + clip + '"');
  await p.screenshot({ path: path.join(OUT, 'interaction-verify.png') });
});
await interact('download thanks', '/download.html?product=driftly', async (p) => {
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.click('[data-dl-main] [data-dl-file]')]);
  await p.waitForSelector('[data-thanks]:not([hidden])');
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'interaction-thanks.png'), fullPage: false });
  if (dl) await dl.cancel().catch(() => {});
});
await interact('filters', '/products.html', async (p) => {
  await p.click('[data-filter="open-source"]');
  if (!(await p.isVisible('#products-empty'))) throw new Error('empty state not shown for open source');
  await p.screenshot({ path: path.join(OUT, 'interaction-filter-empty.png') });
  await p.click('[data-filter-reset]');
  if (await p.isVisible('#products-empty')) throw new Error('reset did not clear');
});
await interact('island nav', '/products/driftly.html', async (p) => {
  const st = () => p.evaluate(() => { const n = document.querySelector('[data-pnav]'), r = n.querySelector('.pnav__mid').getBoundingClientRect(), vis = (s) => getComputedStyle(n.querySelector(s)).visibility;
    return { product: n.classList.contains('is-product'), compact: n.classList.contains('is-compact'), top: Math.round(r.top), centre: Math.round(r.left + r.width / 2), vw: document.documentElement.clientWidth,
      mainVis: vis('.pnav__group--main'), prodVis: vis('.pnav__group--product'), brand: vis('.pnav__brand'), actions: vis('.pnav__actions'), mini: vis('.pnav__mini--cta'),
      miniTab: n.querySelector('.pnav__mini--cta').tabIndex, name: !!n.querySelector('.pnav__brand .pnav__product-name') }; });
  let s = await st();
  if (s.product || s.mainVis !== 'visible' || s.prodVis !== 'hidden') throw new Error('over the hero the middle island should show the main links: ' + JSON.stringify(s));
  if (s.brand !== 'visible' || s.actions !== 'visible' || s.mini !== 'hidden' || s.miniTab !== -1 || !s.name) throw new Error('at the top all three islands should show, with the product name: ' + JSON.stringify(s));
  if (s.top < 8 || Math.abs(s.centre - s.vw / 2) > 1) throw new Error('middle island not floating and centred: ' + JSON.stringify(s));
  await p.screenshot({ path: path.join(OUT, 'interaction-header.png'), clip: { x: 0, y: 0, width: 1440, height: 90 } });
  await p.hover('.pnav__group--main a[data-nav="changelog"]');
  await p.waitForTimeout(500);
  const glide = await p.evaluate(() => { const g = document.querySelector('.pnav__group--main .pnav__glide').getBoundingClientRect(), a = document.querySelector('.pnav__group--main a[data-nav="changelog"]').getBoundingClientRect(); return Math.abs(g.left - a.left) + Math.abs(g.width - a.width); });
  if (glide > 2) throw new Error('the highlight did not slide under the hovered link (' + glide + 'px off)');
  await p.screenshot({ path: path.join(OUT, 'interaction-header-hover.png'), clip: { x: 0, y: 0, width: 1440, height: 90 } });
  await p.mouse.move(700, 600);
  for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 350); await p.waitForTimeout(70); }
  await p.waitForTimeout(800);
  s = await st();
  if (!s.product || !s.compact || s.prodVis !== 'visible' || s.mainVis !== 'hidden') throw new Error('after scrolling down the islands should merge and show the product sections: ' + JSON.stringify(s));
  if (s.brand !== 'hidden' || s.actions !== 'hidden' || s.mini !== 'visible' || s.miniTab !== 0 || Math.abs(s.centre - s.vw / 2) > 1) throw new Error('merged island: side islands hidden, its own logo and Download shown, still centred: ' + JSON.stringify(s));
  await p.screenshot({ path: path.join(OUT, 'interaction-header-compact.png'), clip: { x: 0, y: 0, width: 1440, height: 90 } });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
  s = await st();
  if (s.compact || s.brand !== 'visible' || s.actions !== 'visible') throw new Error('back at the top the islands did not split again: ' + JSON.stringify(s));
  await p.screenshot({ path: path.join(OUT, 'interaction-lnav.png'), clip: { x: 0, y: 0, width: 1440, height: 90 } });
});
await interact('menu sheet', '/products/driftly.html', async (p) => {
  await p.click('[data-nav-toggle]');
  await p.waitForTimeout(700);
  const st = await p.evaluate(() => { const sh = document.getElementById('site-sheet'), r = sh.getBoundingClientRect(), scrim = document.querySelector('[data-sheet-close]');
    return { open: !sh.hidden, bottomGap: Math.round(innerHeight - r.bottom), top: Math.round(r.top), w: r.width, lock: document.documentElement.classList.contains('sheet-open'), size: parseFloat(getComputedStyle(sh.querySelector('a')).fontSize),
      focus: sh.contains(document.activeElement), expanded: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'), modal: sh.getAttribute('aria-modal'),
      product: !!sh.querySelector('.sheet__sub a[href="#specs"]'), theme: !!sh.querySelector('[data-theme-set]'), scrim: !!scrim && !scrim.hidden, icon: !!sh.querySelector('.sheet__links a img') }; });
  // a bottom sheet: anchored to the bottom, clear of the header islands, over a dimmed page
  if (!st.open || st.bottomGap > 24 || st.bottomGap < 0 || st.top < 70 || st.w < 360 || !st.lock || st.size < 16 || !st.focus || st.expanded !== 'true' || st.modal !== 'true' || !st.product || !st.theme || !st.scrim || !st.icon) throw new Error('sheet: ' + JSON.stringify(st));
  await p.screenshot({ path: path.join(OUT, 'interaction-mobile-menu.png') });
  // focus stays inside the sheet (and its close button)
  for (let i = 0; i < 20; i++) await p.keyboard.press('Tab');
  const inside = await p.evaluate(() => document.getElementById('site-sheet').contains(document.activeElement) || document.activeElement.hasAttribute('data-nav-toggle'));
  if (!inside) throw new Error('focus left the open menu');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({ open: !document.getElementById('site-sheet').hidden, lock: document.documentElement.classList.contains('sheet-open'), focus: document.activeElement.hasAttribute('data-nav-toggle') }));
  if (after.open || after.lock || !after.focus) throw new Error('Escape did not close the menu: ' + JSON.stringify(after));
  await p.click('[data-nav-toggle]'); await p.waitForTimeout(600);
  await p.mouse.click(195, 40); await p.waitForTimeout(400);
  if (await p.evaluate(() => !document.getElementById('site-sheet').hidden)) throw new Error('tapping the dimmed page did not close the menu');
  await p.screenshot({ path: path.join(OUT, 'interaction-header-phone.png'), clip: { x: 0, y: 0, width: 390, height: 90 } });
}, { w: 390, h: 844 });
await interact('scrollspy', '/products/driftly.html', async (p) => {
  const at = async (id) => {
    await p.evaluate((i) => { const el = document.getElementById(i); scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.2); }, id);
    await p.waitForTimeout(800);
    return p.evaluate(() => [...document.querySelectorAll('.pnav__group--product [aria-current]')].map((a) => a.textContent));
  };
  const expect = { changes: 'Tools', release: 'Release', monitoring: 'Tools', screenshots: 'Screenshots', specs: 'Tech specs' };
  for (const [id, want] of Object.entries(expect)) {
    const got = await at(id);
    if (got.length !== 1 || got[0] !== want) throw new Error(`in #${id} the pill marks ${JSON.stringify(got)}, expected ${want}`);
    if (id === 'release') await p.screenshot({ path: path.join(OUT, 'interaction-lnav-release.png'), clip: { x: 0, y: 0, width: 1440, height: 90 } });
  }
});
await interact('contact form', '/contact.html', async (p) => {
  // the page's own config has no email yet → the form is disabled with a notice
  const disabled = await p.evaluate(() => document.querySelector('#cf-name').disabled && !document.querySelector('[data-cfg-unless="email.general"]').hidden);
  if (!disabled) throw new Error('without an email address the form should be disabled with a notice');
  await p.screenshot({ path: path.join(OUT, 'interaction-contact-unset.png'), fullPage: true });
});
await interact('contact form (mailto)', '/contact.html', async (p) => {
  // pretend site.config.js has addresses (the page reads DELOG_SITE at run time)
  await p.route('**/site.config.js', async (route) => {
    const body = (await (await route.fetch()).text()).replace("general: '',", "general: 'hello@example.com',").replace("support: '',", "support: 'help@example.com',");
    route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
  await p.reload(); await p.waitForTimeout(400);
  await p.click('.cform__submit');
  const errs = await p.evaluate(() => [...document.querySelectorAll('.cform__err:not([hidden])')].map((e) => e.id));
  if (errs.length !== 3) throw new Error('empty form should show 3 inline errors, got ' + JSON.stringify(errs));
  const a11y = await p.evaluate(() => ({ inv: document.querySelector('#cf-name').getAttribute('aria-invalid'), focus: document.activeElement.id }));
  if (a11y.inv !== 'true' || a11y.focus !== 'cf-name') throw new Error('errors not announced/focused: ' + JSON.stringify(a11y));
  await p.screenshot({ path: path.join(OUT, 'interaction-contact-errors.png'), fullPage: true });
  await p.fill('#cf-name', 'Alex'); await p.fill('#cf-email', 'alex@example.org');
  await p.selectOption('#cf-topic', 'support'); await p.selectOption('#cf-product', 'driftly');
  await p.fill('#cf-message', 'The installer finished but Driftly does not start.');
  await p.waitForTimeout(3100); // minimum time on the page
  let mailto = '';
  await p.evaluate(() => { window.__go = []; });
  p.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
  const nav = p.waitForEvent('framenavigated', { timeout: 1500 }).catch(() => null);
  await p.click('.cform__submit');
  await nav;
  const status = await p.textContent('[data-form-status]');
  if (!/email app should open/.test(status)) throw new Error('mailto status: ' + status);
  await p.screenshot({ path: path.join(OUT, 'interaction-contact-sent.png'), fullPage: true });
  // rate limit: a second send within 30 s is refused
  await p.click('.cform__submit');
  const again = await p.textContent('[data-form-status]');
  if (!/wait \d+ seconds/.test(again)) throw new Error('rate limit: ' + again);
  if (mailto && !/^mailto:help@example\.com\?subject=%5BSupport%5D/.test(mailto)) throw new Error('mailto went to ' + mailto);
});
await interact('contact honeypot', '/contact.html', async (p) => {
  await p.route('**/site.config.js', async (route) => { const body = (await (await route.fetch()).text()).replace("general: '',", "general: 'hello@example.com',"); route.fulfill({ status: 200, contentType: 'text/javascript', body }); });
  await p.reload(); await p.waitForTimeout(3200);
  await p.fill('#cf-name', 'Bot'); await p.fill('#cf-email', 'bot@example.org'); await p.fill('#cf-message', 'Buy cheap things now please.');
  await p.evaluate(() => { document.querySelector('#cf-company').value = 'spam inc'; });
  let opened = false;
  p.on('framenavigated', () => { opened = true; });
  await p.click('.cform__submit'); await p.waitForTimeout(500);
  if (opened) throw new Error('honeypot submission opened the mail app');
});
await interact('3D reduced motion', '/products/driftly.html', async (p) => {
  const r = await p.evaluate(() => {
    const card = document.querySelector('.flip__card'), tile = document.querySelector('.tile');
    return { flip: getComputedStyle(card).transform, tilt: tile.classList.contains('tilt3d'), orbit: getComputedStyle(document.querySelector('.orbit__ring')).animationName,
      stack: getComputedStyle(document.querySelector('.stack3d__card')).animationName };
  });
  if (!/matrix3d|-1, 0, 0|none/.test(r.flip) || r.tilt || r.orbit !== 'none' || r.stack !== 'none') throw new Error('3D not static with reduced motion: ' + JSON.stringify(r));
}, { reduced: true });
await interact('3D', '/products/driftly.html', async (p) => {
  // bento tile tilts toward the pointer
  await p.evaluate(() => document.querySelector('#everything').scrollIntoView());
  await p.waitForTimeout(800);
  const t = await p.$('.tile');
  const b = await t.boundingBox();
  await p.mouse.move(b.x + b.width * 0.9, b.y + b.height * 0.1, { steps: 4 });
  await p.waitForTimeout(400);
  const tilt = await p.evaluate(() => getComputedStyle(document.querySelector('.tile')).transform);
  if (!tilt.startsWith('matrix3d')) throw new Error('tile did not tilt: ' + tilt);
  await p.screenshot({ path: path.join(OUT, 'interaction-3d-tilt.png') });
  // the verdict card flips to NO-GO as it comes into view
  await p.evaluate(() => { const v = document.querySelector('#release .flip'); scrollTo(0, v.getBoundingClientRect().top + scrollY - innerHeight * 0.3); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(OUT, 'interaction-3d-verdict.png') });
  for (const id of ['screenshots', 'license']) {
    await p.evaluate((i) => document.getElementById(i).scrollIntoView(), id === 'license' ? 'license' : id);
    await p.waitForTimeout(900);
  }
  await p.evaluate(() => document.querySelector('.final').scrollIntoView());
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(OUT, 'interaction-3d-orbit.png') });
  // off-screen decorative animations are paused
  const paused = await p.evaluate(() => document.querySelector('.stack3d').classList.contains('is-paused'));
  if (!paused) throw new Error('screenshot stack keeps animating while off-screen');
});
// Screenshots carousel: after every move (next, prev, dots, keys, swipe) the active slide's left
// edge sits on the content edge, the whole slide is visible, and the counter, dot, focusable
// slide and caption all describe that same slide.
async function carouselCheck(p, tag, opts) {
  await p.evaluate(() => document.querySelector('#screenshots').scrollIntoView());
  await p.waitForTimeout(500);
  const settle = () => p.evaluate(() => new Promise((res) => {
    const t = document.querySelector('.carousel__track'); let last = -1, same = 0;
    (function tick() { if (t.scrollLeft === last) { if (++same > 4) return setTimeout(res, 200); } else { same = 0; last = t.scrollLeft; } setTimeout(tick, 60); })();
  }));
  const state = () => p.evaluate(() => {
    const bar = document.querySelector('.site-footer .container'), cs = getComputedStyle(bar), br = bar.getBoundingClientRect();
    const L = br.left + parseFloat(cs.paddingLeft);
    const tr = document.querySelector('.carousel__track').getBoundingClientRect();
    const slides = [...document.querySelectorAll('.carousel__slide')];
    const act = slides.findIndex((s) => s.classList.contains('is-active'));
    const r = slides[act].getBoundingClientRect();
    const dots = [...document.querySelectorAll('.carousel__dot')];
    return {
      act, L, left: r.left, right: r.right, trackR: tr.right, total: slides.length,
      n: Number(document.querySelector('[data-carousel-n]').textContent) - 1,
      dot: dots.findIndex((d) => d.hasAttribute('aria-current')), dotsShown: dots.length && dots[0].getClientRects().length > 0,
      tab: slides.findIndex((s) => s.querySelector('.carousel__shot').tabIndex === 0),
      cap: slides[act].querySelector('.carousel__cap').textContent, title: slides[act].querySelector('.carousel__shot').getAttribute('data-title')
    };
  });
  const expect = async (i, how) => {
    await settle();
    const s = await state(), e = [];
    if (s.act !== i) e.push(`active slide is ${s.act + 1}`);
    if (Math.abs(s.left - s.L) > 1) e.push(`left edge ${s.left.toFixed(1)} ≠ content edge ${s.L.toFixed(1)}`);
    if (s.right > s.trackR + 1) e.push(`slide cut off on the right (${s.right.toFixed(1)} > ${s.trackR.toFixed(1)})`);
    if (s.n !== s.act) e.push(`counter says ${s.n + 1}`);
    if (s.dotsShown && s.dot !== s.act) e.push(`dot ${s.dot + 1} is current`);
    if (s.tab !== s.act) e.push(`slide ${s.tab + 1} is the focusable one`);
    if (!s.cap.endsWith(s.title)) e.push(`caption "${s.cap}" under slide "${s.title}"`);
    if (e.length) throw new Error(`${tag}: ${how} → expected slide ${i + 1}: ${e.join('; ')}`);
    return s;
  };
  const { total } = await expect(0, 'start');
  for (let i = 1; i < total; i++) { await p.click('[data-next]'); await expect(i, 'next'); }
  if (!(await p.isDisabled('[data-next]'))) throw new Error(tag + ': next not disabled on the last slide');
  if (opts.shots) await p.screenshot({ path: path.join(OUT, `carousel-${opts.shots}-slide${total}.png`) });
  for (let i = total - 2; i >= total - 4; i--) { await p.click('[data-prev]'); await expect(i, 'prev'); }
  if ((await state()).dotsShown) for (const i of [5, 0, 1, total - 1, 8]) { await p.click(`.carousel__dot[data-go="${i}"]`); await expect(i, 'dot'); }
  // keyboard: focus the active slide, then arrows / Home / End move it — and focus follows
  await p.click('[data-prev]'); await settle();
  let at = (await state()).act;
  await p.focus('.carousel__slide.is-active .carousel__shot');
  for (const [key, to] of [['ArrowRight', () => at + 1], ['ArrowRight', () => at + 1], ['ArrowLeft', () => at - 1], ['End', () => total - 1], ['Home', () => 0]]) {
    const want = Math.max(0, Math.min(total - 1, to()));
    await p.keyboard.press(key); await expect(want, key); at = want;
    const f = await p.evaluate(() => { const a = document.activeElement; return a.classList.contains('carousel__shot') && a.closest('.carousel__slide').classList.contains('is-active') && a.matches(':focus-visible'); });
    if (!f) throw new Error(`${tag}: after ${key} the keyboard focus is not on the active slide`);
  }
  if (opts.shots) {
    await p.screenshot({ path: path.join(OUT, `carousel-${opts.shots}-slide1.png`) });
    await p.click('[data-next]'); await expect(1, 'next');
    await p.mouse.move(5, 5);
    await p.screenshot({ path: path.join(OUT, `carousel-${opts.shots}-slide2.png`) });
  }
  if (opts.touch) {
    // back to the first slide (the previous button is rightly disabled when already there)
    if (!(await p.isDisabled('[data-prev]'))) { await p.click('[data-prev]'); }
    await expect(0, 'back to start');
    const cdp = await p.context().newCDPSession(p);
    const swipe = async (from, to) => {
      const r = await p.evaluate(() => { const t = document.querySelector('.carousel__track').getBoundingClientRect(); return { y: Math.round(t.top + t.height / 3) }; });
      const pt = (x) => [{ x, y: r.y, id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from) });
      for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(Math.round(from + (to - from) * k / 12)) }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await swipe(320, 60); await expect(1, 'swipe left');
    await swipe(320, 60); await expect(2, 'swipe left');
    await swipe(60, 320); await expect(1, 'swipe right');
  }
}
for (const [w, h, scheme, extra] of [[1440, 900, 'dark', { shots: '1440-dark' }], [1440, 900, 'light', {}], [1280, 800, 'dark', {}], [1280, 800, 'light', { shots: '1280-light' }],
  [390, 844, 'dark', { touch: true, shots: '390-dark' }], [390, 844, 'light', { touch: true }], [1440, 900, 'dark', { reduced: true }]]) {
  const tag = `carousel ${w} ${scheme}${extra.reduced ? ' reduced-motion' : ''}`;
  await interact(tag, '/products/driftly.html', (p) => carouselCheck(p, tag, extra), { w, h, scheme, ...extra });
}
await interact('carousel lightbox', '/products/driftly.html', async (p) => {
  await p.evaluate(() => document.querySelector('#screenshots').scrollIntoView());
  await p.waitForTimeout(400);
  await p.click('.carousel__slide.is-active .carousel__shot');
  await p.waitForSelector('dialog.lightbox[open]');
  if ((await p.textContent('.lightbox__title')) !== 'Home') throw new Error('lightbox opened ' + (await p.textContent('.lightbox__title')));
  if (!/home-dark-1440\.webp$/.test(await p.getAttribute('.lightbox__img', 'src'))) throw new Error('lightbox image');
  await p.keyboard.press('ArrowRight');
  if ((await p.textContent('.lightbox__title')) !== 'Changes') throw new Error('lightbox next');
  await p.screenshot({ path: path.join(OUT, 'interaction-carousel-lightbox.png') });
  await p.keyboard.press('Escape');
});
await interact('stats reduced motion', '/products/driftly.html', async (p) => {
  await p.evaluate(() => document.querySelector('.stats-band').scrollIntoView());
  await p.waitForTimeout(400);
  const pairs = await p.evaluate(() => [...document.querySelectorAll('.stats-band .statrow__item')].map((it) => it.querySelector('.statrow__vis').innerText.replace(/\s+/g, ' ').trim()));
  const want = ['8 tools. One desk.', '5 code exports. Playwright to Puppeteer.', '4 CI formats. JUnit, SARIF, Markdown, JSON.', '0 accounts. It runs on your computer.'];
  if (JSON.stringify(pairs) !== JSON.stringify(want)) throw new Error('pairs ' + JSON.stringify(pairs));
  const stream = await p.evaluate(() => document.querySelector('.stats-band').textContent.replace(/\s+/g, ' '));
  if (!/8 tools\. One desk\./.test(stream) || /tools\. One desk\. 8 code/.test(stream)) throw new Error('DOM text order: ' + stream.slice(0, 200));
  await p.screenshot({ path: path.join(OUT, 'interaction-stats.png') });
}, { reduced: true });
await interact('keyboard focus', '/', async (p) => {
  await p.keyboard.press('Tab');
  const skip = await p.evaluate(() => document.activeElement.className);
  if (skip !== 'skip') throw new Error('first Tab does not reach the skip link');
  await p.screenshot({ path: path.join(OUT, 'interaction-skip-link.png'), clip: { x: 0, y: 0, width: 600, height: 120 } });
  for (let i = 0; i < 3; i++) await p.keyboard.press('Tab');
  await p.screenshot({ path: path.join(OUT, 'interaction-focus.png'), clip: { x: 0, y: 0, width: 1440, height: 120 } });
});

/* ---------------------------------------------------------------- links found after rendering */
if (!ONLY) {
  for (const [href, from] of linkSet) {
    if (!href.startsWith(ORIGIN)) {
      if (!/^mailto:/.test(href) && !href.startsWith('https://delog.example')) issue(from, 'external link: ' + href);
      continue;
    }
    const u = new URL(href);
    const status = await head(u.pathname);
    if (status >= 400 && !u.pathname.startsWith('/downloads/') && u.pathname !== '/no-such-page') issue(from, `broken link ${status}: ${u.pathname}${u.search}`);
  }
}

/* ---------------------------------------------------------------- file:// smoke test */
if (!ONLY || ONLY.split(',').includes('file')) {
  for (const f of ['index.html', 'products/driftly.html', 'product.html', 'download.html']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    const q = f === 'product.html' ? '?id=driftly' : f === 'download.html' ? '?product=driftly' : '';
    await page.goto(pathToFileURL(path.join(ROOT, f)).href + q);
    await page.waitForTimeout(600);
    const ok = await page.evaluate(() => !!document.querySelector('.dl-cta, .dl-card, .p-hero'));
    const font = await page.evaluate(() => document.fonts.check('16px Geist'));
    if (!ok) issue('file:// ' + f, 'content did not render');
    for (const e of errs) issue('file:// ' + f, 'page error: ' + e);
    report.pages.push({ tag: 'file:// ' + f, rendered: ok, geistLoaded: font });
    await page.screenshot({ path: path.join(OUT, `file-${f.replace(/\W+/g, '-')}.png`) });
    await ctx.close();
  }
}

await browser.close();
server.kill();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(`Reviewed ${report.pages.length} page views. Screenshots in .review/`);
if (report.issues.length) { console.log(`\n${report.issues.length} issue(s):\n  ` + report.issues.join('\n  ')); process.exitCode = 1; }
else console.log('No issues found.');

function waitFor(url) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      http.get(url, (r) => { r.resume(); resolve(); }).on('error', () => (Date.now() - t0 > 8000 ? reject(new Error('server did not start')) : setTimeout(poll, 150)));
    })();
  });
}
function head(p) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: encodeURI(decodeURI(p)), method: 'HEAD' }, (r) => { r.resume(); resolve(r.statusCode); });
    req.on('error', () => resolve(0)); req.end();
  });
}
