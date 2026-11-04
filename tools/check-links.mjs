#!/usr/bin/env node
/*
 * Delog — static link checker. Plain Node, no dependencies.
 * Reads every .html file (site root and products/), resolves each href / src / srcset,
 * and reports internal links to files that don't exist, #anchors that don't exist, and the
 * list of external links (there should be none to source-code hosts).
 * Installer files under downloads/ that aren't uploaded yet are reported as warnings.
 *
 *   node tools/check-links.mjs        exit 1 on broken links
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'products')).filter((f) => f.endsWith('.html')).map((f) => 'products/' + f)
];
const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const broken = [], missingDownloads = new Set(), external = new Set();
const BASE = (/baseUrl:\s*'([^']*)'/.exec(fs.readFileSync(path.join(ROOT, 'site.config.js'), 'utf8')) || [])[1] || '';
let own = 0;
let checked = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const dir = path.posix.dirname(file);
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (let ref of refs) {
    ref = ref.replace(/&amp;/g, '&');
    if (!ref || /^(mailto:|tel:|javascript:|data:)/i.test(ref)) continue;
    if (BASE && ref.startsWith(BASE)) { own++; continue; } // canonical / Open Graph URLs
    if (/^(https?:)?\/\//i.test(ref)) { external.add(ref); continue; }
    checked++;
    const [pathPart, hash] = ref.split('#');
    const clean = decodeURIComponent(pathPart.split('?')[0]);
    let target;
    if (!clean) target = file;
    else if (clean.startsWith('/')) target = clean.slice(1) || 'index.html';
    else target = path.posix.normalize(path.posix.join(dir, clean));
    if (target.endsWith('/')) target += 'index.html';
    const abs = path.join(ROOT, target);
    if (!fs.existsSync(abs)) {
      if (target.startsWith('downloads/')) missingDownloads.add(target);
      else broken.push(`${file}: ${ref}  →  ${target} (missing)`);
      continue;
    }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
      // Pages rendered in the browser (product.html, download.html) create their ids at runtime.
      if (!['product.html', 'download.html'].includes(target)) broken.push(`${file}: ${ref}  →  #${hash} not found in ${target}`);
    }
  }
}

console.log(`Checked ${checked} internal references in ${files.length} pages (+${own} canonical/Open Graph URLs on ${BASE}).`);
if (external.size) console.log(`\nExternal links (${external.size}):\n  ` + [...external].join('\n  '));
if (missingDownloads.size) console.log(`\nWarning — installers not uploaded yet (run tools/add-release.mjs):\n  ` + [...missingDownloads].join('\n  '));
if (broken.length) { console.log(`\nBroken (${broken.length}):\n  ` + broken.join('\n  ')); process.exit(1); }
console.log('\nNo broken links.');
