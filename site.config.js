/*
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  Delog website — THE configuration file.
 *
 *  Fill these in, then run:   node tools/build-pages.mjs
 *
 *  Every page reads these values when it loads (terms, privacy, licenses, contact, footer,
 *  structured data), and the build bakes them into the static HTML so search engines and
 *  visitors without JavaScript see the same text.
 *
 *  Leave a field empty ('') if you don't have it yet: the site words around it (for example
 *  "the courts of India" without a city, or no email row) — it never shows placeholder text.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
window.DELOG_SITE = {
  /* ── Company ─────────────────────────────────────────────────────────────────────────────── */
  companyName: 'Delog',                 // brand name shown across the site
  legalName: '',                        // registered legal entity, e.g. 'Delog Technologies Private Limited'
  registeredAddress: '',                // one line, e.g. '12 Example Road, Adyar, Chennai 600020'
  city: '',                             // city whose courts have jurisdiction (Terms, EULA), e.g. 'Chennai'
  state: '',                            // e.g. 'Tamil Nadu'
  country: 'India',                     // governing law is the law of India

  /* ── Contact (each falls back to `general` when empty; empty everywhere = no email shown) ── */
  email: {
    general: '',                        // e.g. 'hello@your-domain.com'
    support: '',                        // help installing or using a product
    legal: '',                          // terms and licensing questions
    security: '',                       // vulnerability reports
    privacy: '',                        // privacy questions and requests
    sales: '',                          // the contact form's "Sales" topic
    press: ''                           // the contact form's "Press" topic
  },

  /* ── Contact form ──────────────────────────────────────────────────────────────────────────
     provider:
       'mailto'    (default) opens the visitor's own email app with the message filled in —
                   no third party, nothing is sent by this website
       'netlify'   Netlify Forms (only when the site is hosted on Netlify)
       'formspree' endpoint: 'https://formspree.io/f/xxxxxxx'
       'web3forms' accessKey: your Web3Forms access key (endpoint defaults to their API)
       'custom'    endpoint: your own HTTPS endpoint that accepts a JSON POST, e.g. a Cloudflare
                   Worker (see tools/contact-worker.example.js)
     After changing it, run node tools/build-pages.mjs — it updates the form, the
     Content-Security-Policy in _headers and the Privacy Policy text. */
  contactForm: { provider: 'mailto', endpoint: '', accessKey: '' },

  /* ── Website and hosting ─────────────────────────────────────────────────────────────────── */
  baseUrl: 'https://delog.example',     // public address, no trailing slash (used for canonical/OG/sitemap)
  hostingProvider: '',                  // who serves this website, e.g. 'Netlify' or 'Cloudflare Pages'
  downloadHost: '',                     // who serves installers if not the same host, e.g. 'Cloudflare R2'

  /* ── Legal documents ─────────────────────────────────────────────────────────────────────── */
  termsLastUpdated: '2026-10-11',       // YYYY-MM-DD — Terms of Use and EULA
  privacyLastUpdated: '2026-10-11',     // YYYY-MM-DD — Privacy Policy
  eulaVersion: '1.0',                   // version of the Driftly End User Licence Agreement

  /* ── Social links (optional) — e.g. { label: 'LinkedIn', url: 'https://…' } ──────────────── */
  social: [],

  /* ── Site behaviour (rarely changed) ─────────────────────────────────────────────────────── */
  tagline: 'Tools for teams that ship websites.',
  // Serve every relative download URL ("downloads/…") from a bucket/CDN instead, e.g.
  // 'https://dl.your-domain.com/'. Leave '' to serve installers from this site.
  downloadBaseUrl: '',
  // Be truthful: set windows: true only once Windows installers are Authenticode-signed,
  // macos: true once macOS builds are notarised. Site copy and the FAQ follow these.
  codeSigning: { windows: false, macos: false },
  // Link products to the pre-rendered /products/<id>.html pages (true) or product.html?id=<id>.
  staticProductPages: true,
  // 'system' follows the visitor's OS setting; 'light' or 'dark' forces a default.
  defaultTheme: 'system',
  copyrightYear: 2026
};
