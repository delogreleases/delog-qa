#!/usr/bin/env node
/*
 * Delog — renders the favicon set and Open Graph images (1200×630) with a headless browser.
 * Optional, development-only. Needs playwright-core and Microsoft Edge or Google Chrome:
 *
 *   node tools/make-images.mjs --playwright <path to node_modules/playwright-core>
 *
 * (Without --playwright it tries `import('playwright-core')`.) Outputs:
 *   favicon.ico, assets/img/{icon-192,icon-512,apple-touch-icon}.png,
 *   assets/img/og-default.png, assets/img/og-<product>.png for every product with a hero screenshot.
 * Run tools/build-pages.mjs afterwards so product pages pick up their og image.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
let pw;
const pwPath = arg('--playwright') || process.env.PLAYWRIGHT_CORE;
if (pwPath) pw = createRequire(path.join(path.resolve(pwPath), 'package.json'))(path.resolve(pwPath));
else pw = await import('playwright-core');
const { chromium } = pw;

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['site.config.js', 'assets/js/products.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox);
const SITE = sandbox.window.DELOG_SITE;
const COMPANY = SITE.companyName || 'Delog';
const PRODUCTS = sandbox.window.DELOG_PRODUCTS;

const markSvg = fs.readFileSync(path.join(ROOT, 'assets/img/favicon.svg'), 'utf8');
const tmpDir = path.join(ROOT, '.review', '_images');
fs.mkdirSync(tmpDir, { recursive: true });
const assetUrl = (p) => pathToFileURL(path.join(ROOT, p)).href;

const css = `
@font-face { font-family: Geist; src: url("${assetUrl('assets/fonts/geist-latin-wght-normal.woff2')}") format("woff2"); font-weight: 100 900; }
@font-face { font-family: Plex; src: url("${assetUrl('assets/fonts/ibm-plex-mono-latin-400-normal.woff2')}") format("woff2"); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { background: #060709; color: #eef0f6; font-family: Geist, system-ui, sans-serif; position: relative; }
.glow { position: absolute; inset: 0; background:
  radial-gradient(520px 340px at 12% 0%, rgba(124,128,255,.30), transparent 70%),
  radial-gradient(560px 380px at 95% 100%, var(--g2, rgba(45,212,191,.22)), transparent 70%); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 60px 60px; -webkit-mask-image: radial-gradient(ellipse 70% 80% at 30% 30%, #000 20%, transparent 75%); }
.left { position: absolute; left: 72px; top: 72px; bottom: 72px; width: 560px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 640; letter-spacing: -0.045em; }
.brand svg, .brand img { width: 48px; height: 48px; }
.brand img { border-radius: 12px; }
.eyebrow { margin-top: auto; font-family: Plex, monospace; font-size: 17px; letter-spacing: .14em; text-transform: uppercase; color: #8b91a3; }
h1 { margin-top: 18px; font-size: 62px; line-height: 1.0; letter-spacing: -0.05em; font-weight: 620; }
.grad { background: linear-gradient(100deg, #a5a8ff, #5eead4); -webkit-background-clip: text; color: transparent; }
.by { margin-top: 26px; font-family: Plex, monospace; font-size: 17px; color: #8b91a3; }
.shot { position: absolute; left: 660px; top: 92px; width: 860px; border-radius: 16px; padding: 0 6px 6px;
  background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 60px 120px -30px #000; }
.shot .bar { height: 26px; }
.shot img { display: block; width: 100%; border-radius: 10px; border: 1px solid rgba(255,255,255,.06); }
`;

function page(body, g2) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--g2:${g2 || 'rgba(45,212,191,.22)'}"><div class="glow"></div><div class="grid"></div>${body}</body></html>`;
}

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' }));
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function shoot(html, out, w, h, transparent) {
  const f = path.join(tmpDir, 'render.html');
  fs.writeFileSync(f, html);
  await pg.setViewportSize({ width: w, height: h });
  await pg.goto(pathToFileURL(f).href);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: path.join(ROOT, out), omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('wrote ' + out);
}

// favicons
const iconHtml = (s) => `<!doctype html><html><head><style>html,body{margin:0;background:transparent;width:${s}px;height:${s}px}svg{width:${s}px;height:${s}px;display:block}</style></head><body>${markSvg}</body></html>`;
for (const [s, out] of [[192, 'assets/img/icon-192.png'], [512, 'assets/img/icon-512.png'], [180, 'assets/img/apple-touch-icon.png'], [16, '.review/_images/fav-16.png'], [32, '.review/_images/fav-32.png'], [48, '.review/_images/fav-48.png']]) {
  await shoot(iconHtml(s), out, s, s, true);
}
// favicon.ico: an ICO container holding PNG images (supported by every current browser and Windows).
{
  const pngs = [16, 32, 48].map((s) => [s, fs.readFileSync(path.join(tmpDir, `fav-${s}.png`))]);
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const dir = []; const data = [];
  for (const [s, buf] of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
    offset += buf.length; dir.push(e); data.push(buf);
  }
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([header, ...dir, ...data]));
  console.log('wrote favicon.ico');
}

// Open Graph: the company card, featuring the first available product's screenshot.
const featured = PRODUCTS.find((p) => p.status !== 'coming-soon' && p.hero) || PRODUCTS[0];
await shoot(page(`
  <div class="left">
    <div class="brand">${markSvg}<span>delog</span></div>
    <p class="eyebrow">${COMPANY} · tools for teams that ship websites</p>
    <h1>The QA desk for <span class="grad">teams that ship websites.</span></h1>
  </div>
  ${featured && featured.hero ? `<div class="shot"><div class="bar"></div><img src="${assetUrl(featured.hero.src + '-dark-1440.webp')}"></div>` : ''}
`), 'assets/img/og-default.png', 1200, 630);

for (const p of PRODUCTS) {
  if (!p.hero) continue;
  const g2 = p.accent && p.accent.dark ? hexA(p.accent.dark, 0.26) : undefined;
  await shoot(page(`
    <div class="left">
      <div class="brand"><img src="${assetUrl(p.icon)}"><span>${esc(p.name)}</span></div>
      <p class="eyebrow">${esc(p.category)}</p>
      <h1>${esc(p.tagline)}</h1>
      <p class="by">by ${esc(COMPANY)}</p>
    </div>
    <div class="shot"><div class="bar"></div><img src="${assetUrl(p.hero.src + '-dark-1440.webp')}"></div>
  `, g2), `assets/img/og-${p.id}.png`, 1200, 630);
}
await browser.close();

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : undefined;
}
