# Delog website

The static website for **Delog** — tools for teams that ship websites — and its products:
**Driftly**, the all-in-one QA desk, **Tracemend**, the test recorder that writes self-healing
test code, and **Prism**, the API testing workspace. People come here to see what they do and download their installers. Plain HTML, CSS and JavaScript: no framework, no build step required, no server code,
no analytics, no cookies, no external CDNs or font services. Upload the folder to any static host.

Delog distributes **installers only**. Products may be open source, but the site never links to
or offers source code; open-source products get a license badge and their license text.

---

## The config file — fill these in, then run `node tools/build-pages.mjs`

Everything about the company lives in one file: **`site.config.js`** at the site root. Every page
reads it when it loads (terms, privacy, licenses, contact, footer, structured data), and
`tools/build-pages.mjs` bakes the same values into the static HTML so search engines and visitors
without JavaScript see them too. Leave a field empty (`''`) if you don't have it yet — the site
words around it (for example “the competent courts of India” without a city, or no email row). It
never shows placeholder text.

| Field | Used for | If empty |
|---|---|---|
| `companyName` | Brand name everywhere (default `Delog`) | `Delog` |
| `legalName` | Registered entity in Terms, EULA, Privacy, footer ©, structured data | `companyName` |
| `registeredAddress` | Address line in Terms, EULA, Privacy, Contact | Line hidden |
| `city`, `state` | Jurisdiction: “the courts at Chennai, Tamil Nadu, India” | “the competent courts of India” |
| `country` | Jurisdiction wording (governing law is always the laws of India) | `India` |
| `email.general` | Contact page, “Notify me” buttons, Organization structured data | Contact shows “inbox is being set up”; notify links hidden |
| `email.support` / `legal` / `security` / `privacy` / `sales` / `press` | Contact page, form topics, Terms/EULA/Privacy contact lines | Falls back to `general`; hidden when both empty |
| `contactForm` | `{ provider, endpoint, accessKey }` — see **Contact form** below | `mailto` |
| `baseUrl` | Canonical URLs, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt` | — (keep a value; now `https://delog.example`, a reserved test domain) |
| `hostingProvider` | Privacy Policy: who serves the site and keeps request logs | “the company that hosts this website” |
| `downloadHost` | Privacy Policy: who serves installers | “the same host that serves this website” |
| `termsLastUpdated` | “Last updated” on Terms of Use and the EULA (`YYYY-MM-DD`) | Line hidden |
| `privacyLastUpdated` | “Last updated” on the Privacy Policy | Line hidden |
| `eulaVersion` | Version shown on the Driftly EULA (Tracemend's and Prism's are `license.version` in `products.js`) | `1.0` |
| `social` | Optional footer links `[{ label, url }]` (never source-code hosts) | Hidden |
| `codeSigning.windows` / `.macos` | Truthful signing copy (FAQ, download notes, SmartScreen help) | `false` = “not code-signed yet” |
| `downloadBaseUrl`, `staticProductPages`, `defaultTheme`, `copyrightYear`, `tagline` | Site behaviour | Sensible defaults |

## Before you publish — checklist

| # | What | Do this |
|---|---|---|
| 1 | `site.config.js` | Fill in the company, legal entity, address, city/state, emails, base URL and hosting fields above, choose the contact-form provider, then `node tools/build-pages.mjs`. |
| 2 | **Driftly installer** | The 0.1.0 entry points at `downloads/driftly/0.1.0/Driftly Setup 0.1.0.exe`, which does not exist yet (size and SHA-256 show “Published with the upload”). Build it in the Driftly repo (`npm run dist`), then `node tools/add-release.mjs driftly 0.1.0 "../what-changed-local/dist/Driftly Setup 0.1.0.exe"` and `node tools/build-pages.mjs`. |
| 3 | Driftly 0.1.0 `date` in `products.js` | Set to `2026-10-10`; `add-release.mjs` sets the day you run it (`--date` / `--keep-date` to control). |
| 4 | Legal review | `terms.html` (Website Terms of Use + Driftly EULA) and `privacy.html` are complete, professional texts written for this site and product — Indian governing law, free closed-source licence incl. commercial use, as-is, liability cap of INR 1,000, authorised-testing duty, data on device, optional network features. Have a lawyer review them before relying on them. |
| 5 | `_headers` | Uncomment `Strict-Transport-Security` once the site is on HTTPS at its final domain. |
| 6 | Driftly auto-update feed | Driftly's `electron-builder.yml` has `publish.url: https://downloads.example.com/driftly/`. If you use auto-update, host `latest.yml` + installer + `.blockmap` in one stable folder and point that URL at it. |
| 7 | Screenshots | Real Driftly screens of the local demo store, in light and dark. The main-window shots were taken with the user name set to “Alex” (`USER_NAME=Alex npx tsx scripts/main-look.ts …` in the Driftly repo, on a copy of the demo data; `STUDIO_CHANGE="Checkout page changed"` picks the change). Re-shoot the same way when the UI changes. |
| 8 | **Tracemend installer** | The 1.0.0 entry points at `downloads/tracemend/1.0.0/Tracemend Setup 1.0.0.exe`. Build it in the Tracemend repo (`npm run dist`, output in `release/`), then `node tools/add-release.mjs tracemend 1.0.0 "../release/Tracemend Setup 1.0.0.exe"` and `node tools/build-pages.mjs`. Check the “About 1 GB” disk-space line in its specs against the installed size. |
| 9 | Tracemend screenshots and notices | Real screens of the bundled demo shop (Northwind Supply, user “Alex”), served on `localhost` so no local path shows. Re-shoot with `scripts/site-shots.mjs` in the Tracemend repo (its header has every step); `npm run notices` there writes `THIRD-PARTY-NOTICES.txt` (it also runs on every `npm run dist`, which ships it beside the app); copy it to `licenses/tracemend/` whenever its dependencies change. |
| 10 | **Prism installer** | The 0.1.0 entry points at `downloads/prism/0.1.0/Prism Setup 0.1.0.exe`. Build it in the Prism repo (`npm run notices`, then `npm run dist`, output in `dist/`), then `node tools/add-release.mjs prism 0.1.0 "<Prism repo>/dist/Prism Setup 0.1.0.exe"` and `node tools/build-pages.mjs`. Check the “About 325 MB” disk-space line against the installed size. |
| 11 | Prism screenshots and notices | Real screens of a workspace against the Tracemend repo's demo shop API (`examples/sandbox-server.mjs`, on `localhost:4173`), opened from a `subst` drive so no local path shows. Regenerate `licenses/prism/THIRD-PARTY-NOTICES.txt` with `npm run notices` in the Prism repo whenever its dependencies change, and copy it here. |

---

## Folder structure

```
site.config.js        THE configuration file (company, legal, emails, hosting, dates)  ← edit
index.html            Home: Delog intro + Apple-style product tiles
products.html         All products with filters (all / available / beta / coming soon / open source)
product.html          Product page rendered from data: product.html?id=driftly  (noindex — see below)
products/<id>.html    Pre-rendered static product pages, driftly and tracemend (generated, crawlable, works without JS)
download.html         Smart download page: download.html?product=driftly[&platform=macos]
changelog.html        Release notes across products, newest first, product filter (?product=driftly)
licenses.html         Product licenses, third-party notices, website fonts
terms.html            Website Terms of Use + the Driftly, Tracemend and Prism End User Licence Agreements
privacy.html  contact.html  404.html
assets/
  css/site.css        All styles (design tokens at the top; light + dark)
  css/accents.css     Generated: per-product accent colours
  js/products.js      Product catalogue + cinematic launch content  ← edit (one object per product)
  js/render.js        Core HTML renderers (every page; also used by tools/build-pages.mjs)
  js/render-product.js  Product-page renderers: launch layout, stats, screenshots carousel, tech specs, licence
  js/render-pages.js  Listing renderers: product cards, changelog, licenses page
  js/app.js           Core behaviour: theme, header/menu, OS detection, regions, copy, lightbox, reveal
  js/app-product.js   Product page: product bar + scrollspy, count-up stats, carousel, reveal fallback, slider, terminal
  js/app-pages.js     Download page and list filters
  js/contact.js       Contact form (validation, spam checks, sending per provider)
                      (tools/build-pages.mjs writes each page's <script> list: product pages load
                      the *-product files, the contact page contact.js, listing pages the *-pages files)
                      *-product files, every other page the *-pages files — ~114 KB / ~97 KB of JS)
  js/theme.js         Tiny <head> script that applies the saved theme before first paint
  fonts/              Geist + IBM Plex Mono (OFL-1.1, self-hosted)
  img/                Favicon set, Open Graph images (og-default.png, og-<product>.png)
  products/driftly/   Icon, screenshots (<name>-dark|light-800|1440.webp), compare/ before-after pair
  products/tracemend/ Icon, screenshots
downloads/<product>/<version>/   Installer files (filled by tools/add-release.mjs)
licenses/             License texts (fonts, Driftly, Tracemend and Prism third-party notices)
favicon.ico  site.webmanifest  robots.txt  sitemap.xml  _headers  _redirects
tools/                Development tools (Node 18+, no dependencies unless noted) — not needed at runtime
  build-pages.mjs     Bakes site.config.js in, stamps head/header/footer, pre-renders data, product pages, sitemap
  add-release.mjs     Publishes a release: copies files, computes size + SHA-256, edits products.js
  check-links.mjs     Static link checker
  serve.mjs           Local preview server that applies _headers (so CSP is tested locally)
  review.mjs          Browser review: screenshots, console/network/overflow/link/placeholder checks,
                      reveal frames, slider, product bar, terminal, reduced-motion tests (needs playwright-core)
  make-images.mjs     Renders favicons + Open Graph images (needs playwright-core)
  perf.mjs            Performance budget check in Edge (transfer size, requests, JS/CSS/images, LCP, CLS, long tasks)
  contact-worker.example.js  Example Cloudflare Worker for contactForm.provider 'custom'
  partials/           head / header / footer / scripts templates
.review/              Review screenshots (git-ignored; never deploy)
```

## Contact form

`contact.html` has a real form: name, email, topic (General / Support / Sales / Security / Press,
each sent to the matching `email.*` address), product and message. It validates in the browser
with accessible inline errors, has a hidden honeypot field and a minimum time on the page against
spam, and allows one send per 30 seconds. Choose how it sends in `site.config.js`, then run
`node tools/build-pages.mjs` — the build sets up the `<form>`, the Content-Security-Policy in
`_headers` (it allows only that provider's origin) and the Privacy Policy wording.

| `contactForm.provider` | What happens | Set up |
|---|---|---|
| `mailto` (default) | Opens the visitor's email app with the message filled in, addressed to the topic's email. Nothing is sent by the site, so the Privacy Policy keeps "This website collects nothing". Offers "Send me a copy" (Cc). | Fill in `email.general` (and the topic emails). |
| `netlify` | Netlify Forms: the form is detected at deploy (`data-netlify`, `netlify-honeypot`), submissions appear in the Netlify dashboard and can be emailed to you. | Host on Netlify; enable form detection in Site settings → Forms. |
| `formspree` | JSON POST to your Formspree form. | Create a form at formspree.io; set `endpoint: 'https://formspree.io/f/…'`. |
| `web3forms` | JSON POST to Web3Forms with your access key. | Get a key at web3forms.com; set `accessKey`. |
| `custom` | JSON POST to your own endpoint (`name, email, topic, product, message, subject`). | e.g. a Cloudflare Worker — copy `tools/contact-worker.example.js`; set `endpoint`. |

Without JavaScript the form still works for `mailto` (plain `mailto:` form), `netlify`, `formspree`
and `web3forms` (regular POST).

## Preview locally

```bash
node tools/serve.mjs            # http://127.0.0.1:4173 — applies _headers, serves 404.html
# or any static server:
npx serve .                     # or: python -m http.server 8000
```

Opening `index.html` directly from disk (`file://`) also works: data comes from JS files, not
`fetch()`. (Browsers may log a manifest warning on `file://`; the 404 page needs a server.)

## Add a product

1. Put its icon at `assets/products/<id>/icon-256.png` (and `icon-128.png`), and screenshots in both
   themes as `assets/products/<id>/screens/<name>-dark-1440.webp`, `-dark-800.webp`, `-light-1440.webp`
   and `-light-800.webp`. Optionally add a `launch` object for the cinematic page (see Design).
2. In `assets/js/products.js`, copy the commented-out template at the bottom of the array and fill
   it in. `status: 'coming-soon'` shows **Notify me** (a mailto) instead of downloads.
   Keep the `// @releases <id>` marker as the first line of its `releases` array.
3. Run `node tools/build-pages.mjs` → creates `products/<id>.html`, updates the nav, footer,
   accent colours, home/products grids, changelog, licenses page and sitemap.
4. Optional: `node tools/make-images.mjs --playwright <path>/node_modules/playwright-core` for its
   Open Graph image, then build again.

Price: `price: { amount: 0, currency: 'USD' }` shows a **Free** badge and adds a $0 offer to the
structured data (omit `price` if undecided).

Open-source products: `license: { kind: 'open-source', name: 'MIT', file: 'licenses/<id>/LICENSE.txt' }`
(or `text: '…'`). The site shows an “Open source · MIT” badge, the license text, and the note that
only installers are distributed. Never add source links.

## Product data reference

Fields of each product object in `assets/js/products.js` (copy `tools/product.template.js` to add one):

```
id            url-safe id, used in product.html?id=<id> and /products/<id>.html
status        'available' | 'beta' | 'coming-soon'
platforms     per platform: 'available' | 'beta' | 'coming-soon' | absent (not planned)
price         { amount, currency } — amount 0 shows a "Free" badge and goes into structured data
license       { kind: 'proprietary' | 'open-source', name, url?, file?, text?, summary?: [bullets] }
              Delog distributes installers only — never source code, open source or not.
accent        { dark, light } — product colour; `light` must reach 4.5:1 on white.
releases      newest first. Each file: { platform: 'windows'|'macos'|'linux', arch, kind,
              filename, url (relative to the site, or absolute), size (bytes), sha256 }
              size/sha256 null = not uploaded yet (tools/add-release.mjs fills them in).
hero          { src, alt } — main screenshot; launch { … } — optional cinematic page (see Design)
screenshots   [{ src, title, alt }] — every screenshot; the product page shows them all in a carousel
```

## Publish a release

```bash
node tools/add-release.mjs driftly 0.2.0 "path/to/Driftly Setup 0.2.0.exe" "path/to/Driftly-0.2.0-arm64.dmg" \
     --notes "What changed, one bullet per --notes" --notes "Another change"
node tools/build-pages.mjs
node tools/check-links.mjs
```

- Copies each file to `downloads/driftly/0.2.0/`, computes size and SHA-256, detects
  platform / arch / kind from the file name (`.exe .msi .dmg .pkg .AppImage .deb .rpm .zip .tar.gz`,
  `arm64`/`x64`/`universal` in the name; override with `--platform --arch --kind`).
- Adds the release at the top of the product's `releases` (or fills in an existing version —
  that's how the 0.1.0 placeholder gets its real size and checksum).
- `--url-base https://dl.example.com/driftly/0.2.0` hosts binaries elsewhere: nothing is copied,
  each file's `url` becomes absolute. `--notes-file notes.md`, `--date`, `--keep-date`, `--dry-run`.
- `.blockmap` / `latest.yml` (auto-update feed files) are copied but not listed.
- A platform with files in the latest release automatically shows as available.

## Deploy

The deployable site is this folder. **Exclude `.review/`** (and optionally `tools/`, `README.md`).
`_redirects` already returns 404 for `/tools/*` and `/.review/*` on Netlify and Cloudflare Pages.

- **Netlify** — drag the folder onto app.netlify.com/drop, or connect a repo with *Publish
  directory* = the folder and *Build command* empty (or `node tools/build-pages.mjs`). `_headers`,
  `_redirects` and `404.html` work out of the box.
- **Cloudflare Pages** — *Framework preset: None*, build command empty (or the build above), output
  directory `/`. `_headers`, `_redirects`, `404.html` supported. **Max 25 MiB per file**, so host
  installers elsewhere (e.g. R2) with `--url-base`.
- **GitHub Pages** — push the folder; it serves `404.html` but **ignores `_headers`** (no CSP or
  download headers). Files over 100 MB are rejected by GitHub. For a project site under
  `/<repo>/`, set `data-base="/<repo>/"` on `404.html`'s `<body>` and rebuild.
- **S3 / any web host** — upload the folder. Set the headers from `_headers` in your host/CDN
  config (at least the CSP and `Content-Disposition: attachment` for `/downloads/*`). Make sure the
  host serves `404.html` for missing pages.

### Large installer files

Desktop installers are big (Driftly's unpacked app is ~410 MB; its installer is much larger than
typical web assets). Static hosts limit file sizes — GitHub Pages rejects files over 100 MB,
Cloudflare Pages allows 25 MiB per file, and other hosts have plan limits. Recommended: keep the
site on the static host and put binaries in a release bucket/CDN (Cloudflare R2, S3 + CloudFront,
Backblaze B2, Bunny…). Use `add-release.mjs --url-base <bucket URL>`, or set
`downloadBaseUrl` in `site.config.js` to serve every relative `downloads/…` URL from the bucket. Keep
`Content-Disposition: attachment` and long caching on the bucket; the CSP doesn't need changing
(downloads are navigations, not fetches).

### Code signing

Unsigned Windows installers trigger SmartScreen (“Windows protected your PC”), and unsigned/
un-notarised macOS apps are blocked by Gatekeeper. Sign Driftly by setting `CSC_LINK` and
`CSC_KEY_PASSWORD` before `npm run dist` (see Driftly's README); an EV or reputable OV certificate
reduces SmartScreen warnings. When signed, set `codeSigning.windows: true` in `site.config.js` — the site
then states that installers are code-signed and drops the SmartScreen instructions.

## Development tools

```bash
node tools/build-pages.mjs [--check]      # --check: exit 1 if anything is out of date (CI)
node tools/check-links.mjs                # broken internal links / anchors; lists external links
node tools/review.mjs --playwright ../what-changed-local/node_modules/playwright-core
node tools/make-images.mjs --playwright ../what-changed-local/node_modules/playwright-core
node tools/perf.mjs --playwright ../what-changed-local/node_modules/playwright-core
```

How pages are put together: each HTML page holds marker comments that `build-pages.mjs` fills —
`<!-- @meta {json} -->` (title, description, canonical, Open Graph), `@head`, `@header`, `@footer`,
`@scripts` (from `tools/partials/`), and `data-render="…"` regions pre-rendered from
`products.js`. The browser re-renders those regions from the data on load (skipping ones that
are unchanged), so pages stay correct even if you edit `products.js` and forget to rebuild —
the build is for no-JS visitors, crawlers and Open Graph.

`product.html?id=…` is marked `noindex` because `products/<id>.html` is the canonical, static
version. If you set `staticProductPages: false`, links go to `product.html?id=…` instead.

## Design

"Cinematic product launch", in the spirit of Apple product pages. The home page is a short
Delog intro followed by product tiles. Driftly's page (`products/driftly.html`, from
`products.js` → `launch`) has:

- a thin global header, plus a product bar (Overview · Tools · Release · Tech specs · Download)
  that slides in once you scroll past the hero;
- a near-empty hero with an enormous headline and a gradient sheen;
- the reveal: the Driftly window starts tilted, small and glowing, then rotates flat and scales up
  while pinned, and the UI cross-fades in. It uses CSS scroll-driven animations
  (`animation-timeline`), with a small JS fallback (`--p`) for browsers without them;
- giant fact numbers — each number, label and detail in one element, in reading order;
- one chapter per idea, with alternating layouts. The visuals include a draggable, keyboard-operable
  before/after slider built from two real snapshots of the demo store, a huge NO-GO verdict, and a
  terminal that types real `driftly ci` output;
- a bento of twelve tiles, each with a small CSS animation;
- "Screenshots": every product screenshot in a scroll-snap carousel (prev/next, dots, arrow keys,
  swipe, lightbox) — built from `products.js` → `screenshots`, so every product gets one;
- an Apple-style tech-specs table (group labels left, labelled rows right), downloads, release
  notes, and the licence ("Free. Closed source.", three plain-language points, links, EULA version);
- "Download Driftly. It's free." and a fine-print footer.

The theme is black (dark) or white (light) with one accent glow per section, in Geist (self-hosted).
Motion uses transform/opacity only. With `prefers-reduced-motion` the reveal is a static image, the
terminal is printed and nothing animates. Every page shares one navigation: a floating frosted "pill" (logo, links with a sliding
highlight, theme, Download). It compacts while you scroll down and expands when you scroll up; on
product pages it switches to the product's sections after the hero (with scrollspy). On phones
it is a logo + menu button opening a full-screen sheet (focus trap, Escape).

Depth, in pure CSS 3D (no WebGL, no libraries; JS only feeds pointer positions with rAF and
pauses work off-screen or in a hidden tab; static with reduced motion):
floating status chips at three depths around the reveal window (pointer parallax), chapter
visuals rising in with a 3D tilt (scroll-driven), bento and home tiles that tilt toward the
pointer with a light sheen, the release verdict as a card that flips from GO to NO-GO, a fanned
3D stack of screenshots beside the Screenshots heading, and the app icon in a slowly turning
3D orbit above the final download button.

Performance budgets (checked by `node tools/perf.mjs --playwright <path>`, Edge, CPU 4× slower):
JavaScript ≤ 120 KB on product pages and ≤ 100 KB elsewhere, CSS ≤ 110 KB, LCP ≤ 2.5 s,
CLS ≤ 0.02. Screenshots ship as AVIF with WebP fallback, lazy-loaded with width/height and
srcset; long sections use `content-visibility: auto`; fonts are Latin subsets with the display
weight preloaded and `font-display: swap`.

To add a cinematic page for another product, give it a `launch` object like Driftly's:
headline, line, stats, chapters (layouts `center`, `split`, `split-rev`, `bleed`, `verdict`,
`terminal`; visuals `shot`, `compare`, `verdict`, `terminal` — a terminal takes its own `label`
and `caption`), bento (`anim` names are in `render-product.js` → `ANIM`; a tile's `say: [...]`
puts its own words in the animation, as Tracemend's tiles do) and specs. Tracemend's page is the
second example. A chapter can link elsewhere with `more: { href, label }` (Driftly's Recorder
chapter points to Tracemend, its API chapter to Prism). Give each launch page a `job` (one line) and a `role` (two sentences):
once two or more products have them, every product page shows a "which one?" section ("Driftly or Tracemend?" for two, "Which one do you need?" for more)
with each one's job side by side, its own marked, so visitors pick the right tool. Without `launch`, a product gets the simpler page.

Security: a strict Content-Security-Policy (`default-src 'none'`, scripts/styles/fonts/images from
the site only, no inline scripts or styles), `nosniff`, `frame-ancestors 'none'`, and no
third-party requests of any kind.
