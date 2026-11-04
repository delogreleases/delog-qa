#!/usr/bin/env node
/*
 * Delog — publish a release in one command. Plain Node (18+), no dependencies.
 *
 *   node tools/add-release.mjs <product-id> <version> <file…> [options]
 *
 * For each file: copies it to downloads/<product>/<version>/, measures its size, computes its
 * SHA-256, and works out platform / arch / kind from the file name. Then it adds the release at
 * the top of that product's `releases` in assets/js/products.js — or, if the version is already
 * there, fills in / replaces its files (e.g. the 0.1.0 entry whose size and checksum are blank).
 *
 * Options
 *   --notes "text"        a release-note bullet (repeat for several). Default for a new release:
 *                         one bullet you should edit. Existing notes are kept unless given.
 *   --notes-file <file>   one bullet per non-empty line ("- " prefixes are stripped)
 *   --date YYYY-MM-DD     release date (default: today)
 *   --keep-date           don't change the date of an existing release
 *   --url-base <url>      host the binaries elsewhere (bucket/CDN): don't copy them; set each
 *                         file's url to <url-base>/<file name>. Implies --no-copy.
 *   --no-copy             don't copy files (they're already in place or hosted elsewhere)
 *   --platform/--arch/--kind <value>   override detection (applies to every file given)
 *   --dry-run             print the result without writing anything
 *
 * Files ending in .blockmap or .yml (electron-builder's auto-update feed) are copied next to
 * the installers but not listed on the site.
 *
 * After it runs: `node tools/build-pages.mjs` to refresh the static pages and sitemap.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'assets/js/products.js');

/* ---------------------------------------------------------------- arguments */
const argv = process.argv.slice(2);
const opts = { notes: [], files: [] };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => { if (i + 1 >= argv.length) die(`${a} needs a value`); return argv[++i]; };
  if (a === '--notes') opts.notes.push(next());
  else if (a === '--notes-file') opts.notes.push(...fs.readFileSync(next(), 'utf8').split(/\r?\n/).map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean));
  else if (a === '--date') opts.date = next();
  else if (a === '--keep-date') opts.keepDate = true;
  else if (a === '--url-base') { opts.urlBase = next().replace(/\/+$/, ''); opts.noCopy = true; }
  else if (a === '--no-copy') opts.noCopy = true;
  else if (a === '--platform') opts.platform = next();
  else if (a === '--arch') opts.arch = next();
  else if (a === '--kind') opts.kind = next();
  else if (a === '--dry-run') opts.dryRun = true;
  else if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else if (a.startsWith('--')) die(`unknown option ${a}`);
  else positional.push(a);
}
const [productId, version, ...files] = positional;
if (!productId || !version || !files.length) { usage(); process.exit(1); }
if (!/^[0-9A-Za-z.+-]+$/.test(version)) die(`version "${version}" should look like 1.2.3 or 1.2.3-beta.1`);
if (opts.date && !/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) die('--date must be YYYY-MM-DD');
if (opts.platform && !['windows', 'macos', 'linux'].includes(opts.platform)) die('--platform must be windows, macos or linux');

/* ---------------------------------------------------------------- load catalogue */
let source = fs.readFileSync(DATA, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const products = sandbox.window.DELOG_PRODUCTS || [];
const product = products.find((p) => p.id === productId);
if (!product) die(`no product "${productId}" in products.js (have: ${products.map((p) => p.id).join(', ') || 'none'})`);

/* ---------------------------------------------------------------- files */
const destDir = path.join(ROOT, 'downloads', productId, version);
const entries = [];
for (const f of files) {
  const abs = path.resolve(f);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) die(`file not found: ${f}`);
  const name = path.basename(abs);
  const auxiliary = /\.(blockmap|ya?ml)$/i.test(name);
  if (!opts.noCopy) {
    if (!opts.dryRun) {
      fs.mkdirSync(destDir, { recursive: true });
      if (path.resolve(path.join(destDir, name)) !== abs) fs.copyFileSync(abs, path.join(destDir, name));
    }
    console.log(`${opts.dryRun ? 'would copy' : 'copied'}  ${name}  →  downloads/${productId}/${version}/`);
  }
  if (auxiliary) { console.log(`  (${name} is an update-feed file: copied, not listed)`); continue; }
  const size = fs.statSync(abs).size;
  const sha256 = await sha(abs);
  const d = detect(name);
  entries.push({
    platform: opts.platform || d.platform,
    arch: opts.arch || d.arch,
    kind: opts.kind || d.kind,
    filename: name,
    url: opts.urlBase ? `${opts.urlBase}/${encodeURIComponent(name)}` : `downloads/${productId}/${version}/${encodeURIComponent(name)}`,
    size,
    sha256
  });
  console.log(`  ${name}: ${(size / 1e6).toFixed(1)} MB · sha256 ${sha256.slice(0, 16)}… · ${opts.platform || d.platform}/${opts.arch || d.arch}/${opts.kind || d.kind}`);
}
if (!entries.length) die('no installer files given (only update-feed files)');

/* ---------------------------------------------------------------- release object */
const today = new Date().toISOString().slice(0, 10);
const existing = (product.releases || []).find((r) => r.version === version);
let release;
if (existing) {
  const keep = (existing.files || []).filter((f) => !entries.some((e) => e.filename === f.filename || (e.platform === f.platform && e.arch === f.arch && e.kind === f.kind && !f.sha256)));
  release = {
    ...existing,
    date: opts.keepDate ? existing.date : (opts.date || today),
    notes: opts.notes.length ? opts.notes : existing.notes,
    files: [...keep, ...entries]
  };
} else {
  release = {
    version,
    date: opts.date || today,
    notes: opts.notes.length ? opts.notes : [`${product.name} ${version}. EDIT ME: describe what changed in this release.`],
    files: entries
  };
}
release.files.sort((a, b) => ['windows', 'macos', 'linux'].indexOf(a.platform) - ['windows', 'macos', 'linux'].indexOf(b.platform));

/* ---------------------------------------------------------------- write products.js */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockRe = new RegExp(`([ \\t]*)/\\* @release ${esc(productId)} ${esc(version)} \\*/[\\s\\S]*?/\\* @end-release \\*/`);
const listRe = new RegExp(`^([ \\t]*)// @releases ${esc(productId)}\\b.*$`, 'm');
const m = blockRe.exec(source);
if (m) {
  source = source.slice(0, m.index) + m[1] + block(release, m[1]) + source.slice(m.index + m[0].length);
} else {
  const l = listRe.exec(source);
  if (!l) die(`couldn't find the "// @releases ${productId}" marker inside ${productId}'s releases array in products.js — add it as the first line of the array.`);
  const at = l.index + l[0].length;
  source = source.slice(0, at) + '\n' + l[1] + block(release, l[1]) + ',' + source.slice(at);
}
// sanity: the edited file must still evaluate and contain the release
const check = { window: {} };
vm.createContext(check);
try { vm.runInContext(source, check); } catch (e) { die('internal error, products.js would not parse: ' + e.message); }
const got = check.window.DELOG_PRODUCTS.find((p) => p.id === productId).releases.find((r) => r.version === version);
if (!got || got.files.length !== release.files.length) die('internal error: release not found after editing');

if (opts.dryRun) { console.log('\n--dry-run: products.js would get\n\n' + block(release, '      ')); process.exit(0); }
fs.writeFileSync(DATA, source);
console.log(`\n${existing ? 'Updated' : 'Added'} ${product.name} ${version} in assets/js/products.js (${release.files.length} file${release.files.length > 1 ? 's' : ''}).`);
if (!existing && !opts.notes.length) console.log('Edit the release notes in products.js — they currently say "EDIT ME".');
console.log('Next: node tools/build-pages.mjs');

/* ---------------------------------------------------------------- helpers */
function block(r, indent) {
  return `/* @release ${productId} ${r.version} */ ${toJs(r, indent)} /* @end-release */`;
}
function toJs(v, indent) {
  const pad = indent + '  ';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map((x) => pad + toJs(x, pad)).join(',\n') + '\n' + indent + ']';
  }
  const keys = Object.keys(v).filter((k) => v[k] !== undefined);
  return '{\n' + keys.map((k) => pad + (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`) + ': ' + toJs(v[k], pad)).join(',\n') + '\n' + indent + '}';
}
function sha(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(file).on('data', (d) => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });
}
function detect(name) {
  const n = name.toLowerCase();
  let platform = 'windows', kind = 'installer';
  if (/\.(exe|msi|msix|appx)$/.test(n)) { platform = 'windows'; kind = n.endsWith('.msi') ? 'msi' : /portable/.test(n) ? 'portable' : 'installer'; }
  else if (n.endsWith('.dmg')) { platform = 'macos'; kind = 'dmg'; }
  else if (n.endsWith('.pkg')) { platform = 'macos'; kind = 'pkg'; }
  else if (n.endsWith('.appimage')) { platform = 'linux'; kind = 'AppImage'; }
  else if (n.endsWith('.deb')) { platform = 'linux'; kind = 'deb'; }
  else if (n.endsWith('.rpm')) { platform = 'linux'; kind = 'rpm'; }
  else if (n.endsWith('.snap')) { platform = 'linux'; kind = 'snap'; }
  else if (/\.(tar\.gz|tgz)$/.test(n)) { platform = /mac|darwin|osx/.test(n) ? 'macos' : 'linux'; kind = 'tar.gz'; }
  else if (n.endsWith('.zip')) { platform = /mac|darwin|osx/.test(n) ? 'macos' : /linux/.test(n) ? 'linux' : 'windows'; kind = 'zip'; }
  else console.warn(`  warning: can't tell what ${name} is — pass --platform/--kind`);
  const arch = /arm64|aarch64/.test(n) ? 'arm64' : /universal/.test(n) ? 'universal' : /(ia32|i386|x86(?!_64))/.test(n) ? 'x86' : 'x64';
  return { platform, arch, kind };
}
function usage() {
  console.log(`Usage: node tools/add-release.mjs <product-id> <version> <file…> [--notes "…"] [--notes-file f] [--date YYYY-MM-DD]
       [--keep-date] [--url-base https://dl.example.com/path] [--no-copy] [--platform p] [--arch a] [--kind k] [--dry-run]
Example: node tools/add-release.mjs driftly 0.1.0 "../what-changed-local/dist/Driftly Setup 0.1.0.exe"`);
}
function die(msg) { console.error('add-release: ' + msg); process.exit(1); }
