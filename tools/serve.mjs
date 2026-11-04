#!/usr/bin/env node
/*
 * Delog — tiny static server for local preview. Plain Node, no dependencies.
 * Serves the site folder, applies the rules in _headers (so the Content-Security-Policy is
 * exercised locally exactly as on Netlify / Cloudflare Pages), and answers unknown paths
 * with 404.html.
 *
 *   node tools/serve.mjs [port]        (default 4173; binds to 127.0.0.1 only)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif','.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.exe': 'application/vnd.microsoft.portable-executable', '.msi': 'application/x-msi', '.dmg': 'application/x-apple-diskimage',
  '.zip': 'application/zip', '.appimage': 'application/octet-stream', '.deb': 'application/vnd.debian.binary-package',
  '.rpm': 'application/x-rpm', '.gz': 'application/gzip'
};

// Parse _headers (Netlify / Cloudflare Pages format): a path line, then indented "Name: value" lines.
function loadHeaders() {
  const file = path.join(ROOT, '_headers');
  if (!fs.existsSync(file)) return [];
  const rules = [];
  let cur = null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) { cur = { pattern: raw.trim(), headers: [] }; rules.push(cur); continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(raw);
    if (m && cur) cur.headers.push([m[1].trim(), m[2].trim()]);
  }
  return rules.map((r) => ({ ...r, re: new RegExp('^' + r.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$') }));
}

// Files under OneDrive / Dropbox (or being rewritten by build-pages) can be locked for a moment.
// Retry briefly instead of failing, and never let one bad read take the whole server down.
const BUSY = new Set(['EBUSY', 'EPERM', 'EACCES', 'EAGAIN', 'UNKNOWN']);
async function readWithRetry(file, tries = 8) {
  for (let i = 0; ; i++) {
    try { return await fs.promises.readFile(file); }
    catch (err) { if (i >= tries || !BUSY.has(err.code)) throw err; await new Promise((r) => setTimeout(r, 60 * (i + 1))); }
  }
}

const BIG = 16 * 1024 * 1024; // installers stream; everything else is read whole (and retried)

const server = http.createServer(async (req, res) => {
  try {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    let file = path.normalize(path.join(ROOT, pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    let status = 200;
    if (!fs.existsSync(file)) { status = 404; file = path.join(ROOT, '404.html'); }

    const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' };
    for (const rule of loadHeaders()) if (rule.re.test(pathname)) for (const [k, v] of rule.headers) headers[k] = v;
    if (status === 404) delete headers['Content-Disposition'];
    // Local preview only: always fresh (so edits show on refresh), and plain http can't be upgraded.
    headers['Cache-Control'] = 'no-store';
    if (headers['Content-Security-Policy']) headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');

    if (fs.statSync(file).size > BIG) {
      res.writeHead(status, headers);
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).on('error', (err) => { console.error(`  ${pathname}: ${err.code || err.message}`); res.destroy(); }).pipe(res);
      return;
    }
    const body = await readWithRetry(file);
    res.writeHead(status, { ...headers, 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    console.error(`  ${req.url}: ${err.code || err.message}`);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Could not read this file - try again.');
  }
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use - the site may already be running at http://127.0.0.1:${PORT}/ (or pass another port: node tools/serve.mjs 4174)`);
  else console.error(err);
  process.exit(1);
});
process.on('uncaughtException', (err) => console.error('  error:', err.message));
server.listen(PORT, '127.0.0.1', () => console.log(`Delog site on http://127.0.0.1:${PORT}/  (Ctrl+C to stop)`));
