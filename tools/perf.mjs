#!/usr/bin/env node
/*
 * Delog — performance budget check (development only). Starts tools/serve.mjs, loads every page
 * in Microsoft Edge at 1440×900 and 390×844 with the CPU throttled 4×, and reports per page:
 * requests, transfer size, JS / CSS / image / font bytes (uncompressed), LCP, CLS (load and a
 * full scroll) and long tasks. Exits 1 when a budget is broken.
 *
 *   node tools/perf.mjs --playwright <path to node_modules/playwright-core>
 *
 * Budgets: JS ≤ 120 KB on product pages, ≤ 100 KB elsewhere · CSS ≤ 110 KB · LCP ≤ 2.5 s · CLS ≤ 0.02
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const pwPath = arg('--playwright') || process.env.PLAYWRIGHT_CORE;
const { chromium } = pwPath ? createRequire(path.join(path.resolve(pwPath), 'package.json'))(path.resolve(pwPath)) : await import('playwright-core');
const PORT = 4181, ORIGIN = `http://127.0.0.1:${PORT}`;
const PAGES = [['index', '/'], ['driftly', '/products/driftly.html'], ['products', '/products.html'], ['download', '/download.html?product=driftly'],
  ['changelog', '/changelog.html'], ['licenses', '/licenses.html'], ['privacy', '/privacy.html'], ['terms', '/terms.html'], ['contact', '/contact.html'], ['404', '/nope']];
const KB = 1024, BUDGET = { jsProduct: 120 * KB, js: 100 * KB, css: 110 * KB, lcp: 2500, cls: 0.02 };

const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((res, rej) => { const t0 = Date.now(); (function poll() { http.get(ORIGIN + '/', (r) => { r.resume(); res(); }).on('error', () => (Date.now() - t0 > 8000 ? rej(new Error('server')) : setTimeout(poll, 150))); })(); });
const browser = await chromium.launch({ channel: 'msedge' });
const rows = [], fails = [];

for (const [name, url] of PAGES) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // observers run before any page script (CSP doesn't apply to the test harness)
    await page.addInitScript(() => {
      window.__perf = { lcp: 0, cls: 0, clsLoad: 0, long: 0, longMs: 0, loaded: false };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { (window.__perf.shifts = window.__perf.shifts || []).push([+e.value.toFixed(4), (e.sources || []).map((x) => x.node ? (x.node.className || x.node.nodeName) + '' : '?').join(' | ')]); window.__perf.cls += e.value; if (!window.__perf.loaded) window.__perf.clsLoad += e.value; } }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__perf.long++; window.__perf.longMs += e.duration - 50; } }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(ORIGIN + url, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const load = await page.evaluate(() => {
      window.__perf.loaded = true;
      window.__perf.lcpLoad = window.__perf.lcp; // before any scrolling
      window.__perf.shifts = window.__perf.shifts || [];
      const res = performance.getEntriesByType('resource'), nav = performance.getEntriesByType('navigation')[0];
      const sum = (f) => res.filter(f).reduce((a, r) => a + (r.decodedBodySize || 0), 0);
      const ext = (r, re) => re.test(new URL(r.name).pathname);
      return {
        requests: res.length + 1,
        transfer: res.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav ? nav.transferSize : 0),
        js: sum((r) => ext(r, /\.m?js$/)), css: sum((r) => ext(r, /\.css$/)),
        img: sum((r) => ext(r, /\.(avif|webp|png|jpe?g|svg|ico)$/)), font: sum((r) => ext(r, /\.woff2?$/)),
        html: nav ? nav.decodedBodySize : 0
      };
    });
    // scroll the whole page to include scroll-time layout shifts
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => window.__perf);
    const row = { page: name, vp: w, ...load, lcp: Math.round(m.lcpLoad), clsLoad: +m.clsLoad.toFixed(4), cls: +m.cls.toFixed(4), longTasks: m.long, blockingMs: Math.round(m.longMs), shifts: m.shifts };
    rows.push(row);
    const jsBudget = name === 'driftly' ? BUDGET.jsProduct : BUDGET.js;
    if (row.js > jsBudget) fails.push(`${name} ${w}: JS ${(row.js / KB).toFixed(1)} KB > ${jsBudget / KB} KB`);
    if (row.css > BUDGET.css) fails.push(`${name} ${w}: CSS ${(row.css / KB).toFixed(1)} KB > ${BUDGET.css / KB} KB`);
    if (row.lcp > BUDGET.lcp) fails.push(`${name} ${w}: LCP ${row.lcp} ms > ${BUDGET.lcp} ms`);
    if (row.cls > BUDGET.cls) fails.push(`${name} ${w}: CLS ${row.cls} > ${BUDGET.cls}`);
    await ctx.close();
  }
}
await browser.close();
server.kill();

const k = (n) => (n / KB).toFixed(1);
console.log('page        vp    req  transfer  html    js     css    img     font   LCP ms  CLS load/scroll  long tasks');
for (const r of rows) console.log(`${r.page.padEnd(11)} ${String(r.vp).padEnd(5)} ${String(r.requests).padStart(3)}  ${k(r.transfer).padStart(7)}  ${k(r.html).padStart(5)}  ${k(r.js).padStart(5)}  ${k(r.css).padStart(5)}  ${k(r.img).padStart(6)}  ${k(r.font).padStart(5)}  ${String(r.lcp).padStart(6)}  ${String(r.clsLoad).padStart(6)} / ${String(r.cls).padEnd(6)}  ${r.longTasks} (${r.blockingMs} ms)`);
fs.mkdirSync(path.join(ROOT, '.review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.review', 'perf.json'), JSON.stringify(rows, null, 2));
console.log('(KB, uncompressed except transfer; CPU throttled 4×; local server)');
if (fails.length) { console.log('\nOver budget:\n  ' + fails.join('\n  ')); process.exitCode = 1; } else console.log('\nAll pages within budget.');
