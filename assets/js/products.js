/*
 * Delog — product catalogue: every page renders from this file. Field reference and a template
 * for new products: README.md → "Product data reference" and tools/product.template.js.
 * Publish releases with tools/add-release.mjs; keep its "@release" marker comments.
 */
window.DELOG_PRODUCTS = [
  {
    id: 'driftly',
    name: 'Driftly',
    tagline: 'The all-in-one QA desk for teams that ship websites.',
    description:
      'Driftly catches every visual and content change on your sites with before/after screenshots and plain-language explanations — then reviews security, tests performance, APIs and recorded flows, and gives you one GO / NO-GO before you release. Free for Windows; it runs on your own computer.',
    category: 'Website QA & release checks',
    status: 'available',
    platforms: { windows: 'available', macos: 'coming-soon', linux: 'coming-soon' },
    // Free to download and use, including commercially; closed source (proprietary freeware).
    price: { amount: 0, currency: 'USD' },
    license: {
      kind: 'proprietary',
      name: 'Driftly End User Licence Agreement',
      url: 'terms.html#eula',
      // Plain-language summary shown on the product and licenses pages. The EULA is the binding text.
      summary: [
        { icon: 'check', text: 'Free to download, install and use — including for commercial work.' },
        { icon: 'lock', text: 'Closed source: Driftly’s source code is not distributed or licensed.' },
        { icon: 'box', text: 'No redistribution, resale, reverse engineering or decompiling, except where the law expressly allows.' }
      ],
      thirdParty: 'licenses/driftly/THIRD-PARTY-NOTICES.txt'
    },
    accent: { dark: '#2dd4bf', light: '#0f766e' },
    icon: 'assets/products/driftly/icon-256.png',
    // Screenshot paths have no theme or size: the site loads <src>-dark|light-800|1440.webp.
    hero: {
      src: 'assets/products/driftly/screens/home',
      alt: 'Driftly Home: summary tiles for changes to review, critical changes, pages watched and the last check; a radial site map of the watched website with the pages that need attention glowing; and a list of changes that need review.'
    },
    // The cinematic product page (products/<id>.html). Screenshot paths have no theme or size.
    // Chapter layouts: center · split · split-rev · bleed · verdict · terminal.
    // Visual types: shot · compare · verdict · terminal.
    launch: {
      headline: 'Know before you ship.',
      // "Driftly or Tracemend?" on each product page: its job, and who it is for.
      job: 'Know if a release is safe to ship.',
      role: 'Watches your live sites — visual changes, security, speed and APIs — and gives one GO or NO-GO before each release. Its recorder replays a few key flows inside those checks.',
      line: 'The all-in-one QA desk for teams that ship websites. Free for Windows.',
      tour: 'Take the tour',
      reveal: {
        caption: 'Every site you watch, at a glance — on your own computer.'
      },
      // Floating status chips around the window in the reveal (states shown in the demo screens).
      chips: [
        { text: '36 changes to review', tone: 'warn' },
        { text: 'Release v2.4.0 · NO-GO', tone: 'bad' },
        { text: 'Security grade C · passive', tone: 'ok' }
      ],
      stats: [
        { value: '8', label: 'tools.', sub: 'One desk.' },
        { value: '5', label: 'code exports.', sub: 'Playwright to Puppeteer.' },
        { value: '4', label: 'CI formats.', sub: 'JUnit, SARIF, Markdown, JSON.' },
        { value: '0', label: 'accounts.', sub: 'It runs on your computer.' }
      ],
      chapters: [
        {
          id: 'changes', layout: 'center', eyebrow: 'Change detection',
          title: 'Every change. Explained.',
          text: 'Driftly snapshots every page on a schedule and tells you, in plain language, what changed since last time — and why it matters. Drag to compare a real check of the demo store.',
          visual: {
            type: 'compare',
            before: 'assets/products/driftly/compare/home-before', beforeLabel: 'Before · version 1',
            after: 'assets/products/driftly/compare/home-after', afterLabel: 'After · version 2',
            alt: 'The demo store’s home page before and after a release: the headline changed from “Ship faster with confidence” to “Release with total confidence”, a sale banner appeared, the button changed from “Browse products” to “Start shopping”, and the navigation was renamed.'
          },
          points: ['Headline rewritten', 'Sale banner added', '“Browse products” → “Start shopping”', 'Navigation renamed']
        },
        {
          id: 'security', layout: 'split', eyebrow: 'Security',
          title: 'Security without the noise.',
          text: 'A passive review of what a visitor’s browser received — headers, cookies, forms and scripts — graded, explained as attack paths, with the fix. Nothing is attacked.',
          visual: { type: 'shot', src: 'assets/products/driftly/screens/security', alt: 'Driftly security radar: the website’s pages, assets and API endpoints on rings with signals glowing, a C grade and a list of signals such as “No Content Security Policy”.' }
        },
        {
          id: 'performance', layout: 'bleed', eyebrow: 'Performance',
          title: 'Speed you can see.',
          text: 'Lab tests on phone, tablet or desktop profiles: Core Web Vitals, waterfall, filmstrip, budgets — and the fixes that matter most.',
          visual: { type: 'shot', src: 'assets/products/driftly/screens/performance', alt: 'Driftly performance results on a mobile profile: gauges for LCP, FCP, Speed Index, TTFB, TBT, INP, CLS and load time around a phone preview, with the network timeline below.' }
        },
        {
          id: 'api', layout: 'split-rev', eyebrow: 'API testing',
          title: 'Your site’s APIs, in every check.',
          text: 'Start from the calls your site already makes. Chain them into flows — log in, pass the token, add to cart — assert every step, and export to Postman, OpenAPI or test code.',
          more: { href: 'products/prism.html', label: 'Testing an API in depth? Meet Prism' },
          visual: { type: 'shot', src: 'assets/products/driftly/screens/api-flow', alt: 'A Driftly API flow graph: log-in and product requests feeding a token and product id into who-am-I, cart and add-to-cart requests, with one request failing.' }
        },
        {
          id: 'recorder', layout: 'center', eyebrow: 'Recorder',
          title: 'Your key flows, in every check.',
          text: 'Record the flows that matter — sign in, add to cart, check out — and Driftly replays them on every check, repairs locators that drift and tells you what it healed. Export them as Playwright, Selenium, Cypress, WebdriverIO or Puppeteer code when you need to.',
          more: { href: 'products/tracemend.html', label: 'Building a whole test suite? Meet Tracemend' },
          visual: { type: 'shot', src: 'assets/products/driftly/screens/recorder', alt: 'Driftly Recorder replaying a “Sign in and browse products” flow, paused at step 6 of 7, with an assertion outlined on the page and a filmstrip of every step.' }
        },
        {
          id: 'bugs', layout: 'split-rev', eyebrow: 'Bug reports',
          title: 'Bugs, written for you.',
          text: 'Press Report bug on any change, finding, failed request or test. Driftly writes the steps, expected and actual, attaches screenshots, console errors and failed requests — and files it to Jira, GitHub, Linear or Azure DevOps.',
          visual: { type: 'shot', src: 'assets/products/driftly/screens/bugs', alt: 'A Driftly bug report filed to Jira as QA-128: severity, priority and status, a summary, three steps to reproduce with screenshots, and the tracker, re-check and history panels.' }
        },
        {
          id: 'release', layout: 'verdict', eyebrow: 'Release checks',
          title: 'One answer: GO or NO‑GO.',
          text: 'Before you ship, one run across visual, security, performance, API and recorded tests — with every blocking rule, its evidence, and a comparison with the last release.',
          visual: { type: 'verdict', word: 'NO-GO', src: 'assets/products/driftly/screens/release', alt: 'Driftly release check for v2.4.0 with a NO-GO verdict: three rules block the release and two raise warnings, each with a link to its evidence.' }
        },
        {
          id: 'monitoring', layout: 'split', eyebrow: 'Monitoring',
          title: 'Always watching.',
          text: 'Schedule API runs, replays, performance tests, security reviews and release checks — hourly, after every check or at set times — and hear about it the moment one starts failing.',
          visual: { type: 'shot', src: 'assets/products/driftly/screens/monitoring', alt: 'Driftly Monitoring: six scheduled monitors, each with a 14-day run strip, its pass rate and its next run.' }
        },
        {
          id: 'ci', layout: 'terminal', eyebrow: 'CI',
          title: 'Gate every merge.',
          text: '`driftly ci` runs the same release check on your runner and fails the build on a NO-GO — with JUnit, SARIF, Markdown and JSON for your pipeline.',
          visual: {
            type: 'terminal',
            // Real output of `driftly ci` against the demo store (abridged).
            command: 'driftly ci "Demo Store" --release "Standard release" --out ci-out',
            lines: [
              { s: 'bad', t: '✘ Visual & content      Failed    6 pages changed · 2 critical · 3 high' },
              { s: 'ok', t: '✔ Security review       Passed    Grade C · no new serious findings' },
              { s: 'bad', t: '✘ Performance test      Failed    1 budget exceeded · Mobile' },
              { s: 'bad', t: '✘ API collections       Failed    3/4 requests passed (75%)' },
              { s: 'warn', t: '! Recorder tests        Warning   1/1 tests passed · 1 healed step' }
            ],
            verdict: 'NO-GO — exit 1 (the gate failed)',
            artifacts: 'Artifacts in ci-out: junit.xml · security.sarif · summary.md · result.json'
          }
        },
        {
          id: 'share', layout: 'center', eyebrow: 'Read-only dashboards',
          title: 'Share without sharing.',
          text: 'Hand stakeholders one self-contained HTML file — no server, no network requests, secrets redacted, optional password.',
          visual: { type: 'shot', src: 'assets/products/driftly/screens/shared-dashboard', alt: 'A read-only dashboard exported from Driftly, opened as a single HTML file: sections with item counts, severity filters, overview tiles and a 14-day change chart.' }
        }
      ],
      // "Everything in one place" — each tile has a small CSS animation (anim).
      bento: [
        { size: 'l', anim: 'diff', title: 'Change detection', text: 'Visual, content, structure, form and flow changes — in plain words.' },
        { size: 's', anim: 'radar', title: 'Passive security', text: 'Graded, explained, fixed. Nothing attacked.' },
        { size: 's', anim: 'budget', title: 'Budgets', text: 'Every test flags pages that go over.' },
        { size: 's', anim: 'verdict', title: 'Release checks', text: 'GO, warnings or NO-GO.' },
        { size: 's', anim: 'locator', title: 'Self-healing locators', text: 'Replays repair drifting selectors — and tell you.' },
        { size: 'l', anim: 'strip', title: 'Scheduled monitors', text: '14 days of runs at a glance.' },
        { size: 's', anim: 'noise', title: 'Noise control', text: 'Clocks and counters set aside. Prices never.' },
        { size: 's', anim: 'bell', title: 'Alerts', text: 'Desktop, Slack, Teams, email, webhooks, Jira.' },
        { size: 's', anim: 'api', title: 'API testing', text: 'Collections, flows, assertions, data files.' },
        { size: 's', anim: 'ask', title: 'Ask Driftly', text: 'Answers from your own history. Works offline.' },
        { size: 'l', anim: 'ci', title: 'CI gating', text: 'The same verdict on your runner, with JUnit and SARIF.' },
        { size: 's', anim: 'share', title: 'Shareable', text: 'One HTML file. Nothing uploaded.' },
        { size: 's', anim: 'bug', title: 'Bug reports', text: 'Steps, expected and actual — filed for you.' }
      ],
      // Tech specs: groups → rows. A row is { label?, value } or { label?, list: [...] }.
      // value 'release:size' / 'release:version' / 'release:date' is filled from the latest release.
      specs: [
        { group: 'Version', rows: [
          { label: 'Latest', value: 'release:version' },
          { label: 'Released', value: 'release:date' }
        ] },
        { group: 'Platform', rows: [
          { label: 'Operating system', value: 'Windows 10 or Windows 11, 64-bit (x64)' },
          { label: 'Processor', value: 'Any 64-bit (x64) PC that runs Windows 10 or 11' },
          { label: 'Browser', value: 'Microsoft Edge (included with Windows) or Google Chrome — Driftly drives a browser that is already installed' },
          { label: 'Disk space', value: 'About 410 MB for the app, plus room for your snapshots' },
          { label: 'macOS and Linux', value: 'Coming soon' }
        ] },
        { group: 'Installer', rows: [
          { label: 'Type', value: 'Windows installer — for you only, or for everyone on the computer; you choose the folder' },
          { label: 'Download size', value: 'release:size' },
          { label: 'Verification', value: 'SHA-256 checksum published for every file' },
          { label: 'Updates', value: 'Automatic updates are off until you turn them on' }
        ] },
        { group: 'Licence', rows: [
          { value: 'Free · closed source' },
          { value: 'Free for personal and commercial use, under the Driftly EULA' }
        ] },
        { group: 'Your data', rows: [
          { label: 'Location', value: 'Your Documents\\Driftly folder, on your computer' },
          { label: 'Privacy', value: 'No accounts, analytics or telemetry; offline mode on at first install' },
          { label: 'Secrets', value: 'Passwords and tokens encrypted with your Windows account' },
          { label: 'Backup', value: 'One-file backup and restore; packs to move chosen tools and websites' }
        ] },
        { group: 'AI', rows: [
          { label: 'On your computer', value: 'Built-in engine, or a local Ollama model' },
          { label: 'Optional', value: 'A cloud provider (OpenAI) with your own key — blocked in offline mode' }
        ] },
        { group: 'Exports', rows: [
          { label: 'Test code', list: ['Playwright', 'Selenium', 'Cypress', 'WebdriverIO', 'Puppeteer'] },
          { label: 'API', list: ['Postman', 'OpenAPI', 'Test code'] },
          { label: 'Reports', list: ['PDF', 'Web page', 'Markdown', 'JSON', 'JUnit XML'] },
          { label: 'Dashboards', value: 'Read-only, as one self-contained HTML file or a ZIP, with an optional password' },
          { label: 'Bug reports', list: ['Markdown', 'Jira', 'Plain text', 'Web page', 'PDF', 'ZIP'] }
        ] },
        { group: 'CI', rows: [
          { label: 'Command', value: '`driftly ci` — exit codes 0, 1 and 2' },
          { label: 'Outputs', list: ['junit.xml', 'security.sarif', 'summary.md', 'result.json'] },
          { label: 'Templates', list: ['GitHub Actions', 'Azure DevOps', 'GitLab CI', 'Jenkins'] }
        ] },
        { group: 'Integrations', rows: [
          { label: 'Alerts', list: ['Desktop notifications', 'Slack', 'Microsoft Teams', 'Email (SMTP)', 'Signed webhooks', 'Jira'] },
          { label: 'Bug trackers', list: ['Jira', 'GitHub', 'Linear', 'Azure DevOps'] },
          { label: 'Test suites', list: ['Selenium', 'Playwright', 'Cypress'] },
          { label: 'Real-user data', value: 'Chrome UX Report, optional' }
        ] },
        { group: 'Accessibility & appearance', rows: [
          { label: 'Themes', list: ['Match system', 'Light', 'Dark', 'Pure black'] },
          { label: 'Accent colours', value: 'Tide, Aurora, Ocean, Forest, Sunset, Orchid, Graphite or custom' },
          { label: 'Interface size', value: 'Auto, or 85% to 120%' },
          { label: 'Keyboard', value: 'Shortcuts for every main screen; a command palette (Ctrl+K)' }
        ] },
        { group: 'Language', rows: [
          { value: 'English' }
        ] }
      ]
    },
    // Every screenshot, in tour order — shown in the product page's gallery (light + dark).
    screenshots: [
      { src: 'assets/products/driftly/screens/home', title: 'Home', alt: 'Driftly Home: summary tiles for changes to review, critical changes, pages watched and the last check; a radial site map with the pages that need attention glowing; and the changes that need review.' },
      { src: 'assets/products/driftly/screens/changes-feed', title: 'Changes', alt: 'Driftly’s Changes feed: tabs for needs review, all and reviewed, a severity strip with counts, and changes grouped by day, each with a zoomed thumbnail, importance and a one-line summary.' },
      { src: 'assets/products/driftly/screens/changes', title: 'Reviewing a change', alt: 'Driftly reviewing “Checkout page changed”: before and after screenshots side by side, a filmstrip of the page’s snapshots, and an inspector listing what changed in plain language.' },
      { src: 'assets/products/driftly/screens/release', title: 'Release check', alt: 'Driftly release check for version 2.4.0 with a NO-GO verdict: three rules block the release and two raise warnings, each with a link to its evidence, compared with v2.3.0.' },
      { src: 'assets/products/driftly/screens/monitoring', title: 'Scheduled monitoring', alt: 'Driftly Monitoring: six scheduled monitors, each with a 14-day run strip, pass rate and next run.' },
      { src: 'assets/products/driftly/screens/ci', title: 'CI & automation', alt: 'Driftly CI and automation: the release check and lanes a pipeline runs, the fail-the-build rule, report formats and output folder, with exit codes and an “Export pack for CI” button.' },
      { src: 'assets/products/driftly/screens/security', title: 'Security radar', alt: 'Driftly Security radar: the website’s pages, assets and API endpoints on rings with signals glowing, a C grade, attack-surface counts and a list of signals.' },
      { src: 'assets/products/driftly/screens/attack-paths', title: 'Attack paths', alt: 'Driftly attack path for clickjacking on /checkout: entry, page, click and impact laid out as a chain, the blast radius, and the configuration that breaks the path.' },
      { src: 'assets/products/driftly/screens/performance', title: 'Performance lab', alt: 'Driftly performance results for a mobile test: gauges for LCP, FCP, Speed Index, TTFB, TBT, INP, CLS and load time around a phone preview, with the network timeline below.' },
      { src: 'assets/products/driftly/screens/budgets', title: 'Performance budgets', alt: 'Driftly performance budgets for Largest Contentful Paint, Total Blocking Time, layout shift, page weight, requests and JavaScript, each showing how many pages pass.' },
      { src: 'assets/products/driftly/screens/api', title: 'API testing', alt: 'Driftly API testing: collections including APIs discovered from website checks, and a GET request to /api/me failing with 401 Unauthorized.' },
      { src: 'assets/products/driftly/screens/api-flow', title: 'API flows', alt: 'Driftly API flow graph: log-in and product requests feeding a token and product id into who-am-I, cart and add-to-cart requests, with one request failing.' },
      { src: 'assets/products/driftly/screens/recorder', title: 'Recorder', alt: 'Driftly Recorder replaying a “Sign in and browse products” flow, paused at step 6 of 7, with a filmstrip of every step and the step’s check settings.' },
      { src: 'assets/products/driftly/screens/bugs', title: 'Bug report', alt: 'A Driftly bug report filed to Jira as QA-128, with severity, priority, status, a summary, steps to reproduce with screenshots, and the tracker, re-check and history panels.' },
      { src: 'assets/products/driftly/screens/bug-annotate', title: 'Marking up a screenshot', alt: 'Driftly’s screenshot editor over a close-up of a change: boxes, an arrow and a “This moved” label in red, with tools for boxes, arrows, text, highlight and blur.' },
      { src: 'assets/products/driftly/screens/reports', title: 'Reports', alt: 'Driftly Reports: live cards for changes, security, performance, API, Recorder and release checks, and a shelf of saved reports.' },
      { src: 'assets/products/driftly/screens/shared-dashboard', title: 'Read-only dashboard', alt: 'A read-only dashboard exported from Driftly as one HTML file: sections with item counts, severity filters, overview tiles and a 14-day change chart.' },
      { src: 'assets/products/driftly/screens/settings', title: 'Settings', alt: 'Driftly Settings: tiles for appearance with accent colours, storage, AI assistant, privacy with offline mode, advanced, alerts and integrations, backup and transfer, and general.' }
    ],
    install: [
      'Run the installer. Choose to install just for you (no administrator rights needed) or for everyone on the computer, and pick the folder.',
      'Start Driftly from the Start menu or the desktop shortcut, then click “Try a sample site” to see a check end to end.',
      'Uninstalling never deletes your data in Documents\\Driftly.'
    ],
    releases: [
      // @releases driftly — tools/add-release.mjs inserts new releases below this line
      /* @release driftly 0.1.0 */ {
        version: '0.1.0',
        date: '2026-10-10', // PLACEHOLDER: set to the real release date (add-release.mjs sets today's date)
        notes: [
          'First public release, for Windows 10 and 11 (x64).',
          'Website change monitoring with plain-language summaries, noise control, approved baselines and a time machine for every page.',
          'Security, Performance, API and Recorder testing windows.',
          'Release checks with a GO / NO-GO verdict, scheduled monitoring and `driftly ci` for pipelines.',
          'Bug reports from any change, finding or failed test: steps, expected and actual written for you, marked-up screenshots, capture mode, duplicate warnings and filing to Jira, GitHub, Linear or Azure DevOps.',
          'Read-only dashboards exported as a single offline HTML file.',
          'Automatic updates are off until you turn them on in Settings.'
        ],
        files: [
          {
            platform: 'windows',
            arch: 'x64',
            kind: 'installer',
            filename: 'Driftly Setup 0.1.0.exe',
            url: 'downloads/driftly/0.1.0/Driftly%20Setup%200.1.0.exe',
            size: null,
            sha256: null
          }
        ]
      } /* @end-release */
    ]
  },
  {
    id: 'tracemend',
    name: 'Tracemend',
    tagline: 'Record a flow. Get a test suite that heals itself.',
    description:
      'Tracemend records what you do in a real browser and writes it as test code for Playwright, Selenium, Cypress or WebdriverIO — with ranked fallback locators that heal when the page changes. Replay it, compare runs, check accessibility on desktops and phones, and run the suite from CI. Free for Windows; it runs on your own computer.',
    category: 'Test recording & automation',
    status: 'available',
    platforms: { windows: 'available', macos: 'coming-soon', linux: 'coming-soon' },
    // Free to download and use, including commercially; closed source (proprietary freeware).
    price: { amount: 0, currency: 'USD' },
    license: {
      kind: 'proprietary',
      name: 'Tracemend End User Licence Agreement',
      url: 'terms.html#eula-tracemend',
      version: '1.0', // its own EULA version — site.config.js → eulaVersion is Driftly's
      summary: [
        { icon: 'check', text: 'Free to download, install and use — including for commercial work.' },
        { icon: 'lock', text: 'Closed source: Tracemend’s source code is not distributed or licensed. The test code it generates for you is yours.' },
        { icon: 'box', text: 'No redistribution, resale, reverse engineering or decompiling, except where the law expressly allows.' }
      ],
      thirdParty: 'licenses/tracemend/THIRD-PARTY-NOTICES.txt'
    },
    accent: { dark: '#f472b6', light: '#be185d' },
    icon: 'assets/products/tracemend/icon-256.png',
    hero: {
      src: 'assets/products/tracemend/screens/recorder',
      alt: 'The Tracemend Recorder on the board: the “Place an order” test pinned step by step on the Northwind demo’s sign-in page, its ten steps listed beside it, and step 5, “Click Sign in”, marked moved — with its ranked locators and Keep new spot or Reject.'
    },
    launch: {
      headline: 'Your test suite, recorded.',
      line: 'Record a flow in the browser. Get Playwright, Selenium, Cypress or WebdriverIO code your team owns — and that heals when the page changes. Free for Windows.',
      job: 'Build the test suite you keep.',
      role: 'Turns flows you record into Playwright, Selenium, Cypress or WebdriverIO code your team owns — with page objects, accessibility checks, phones and tablets, and a CLI for CI — and keeps it healing as the site changes.',
      tour: 'Take the tour',
      shotsLead: 'Every screen, testing a local demo shop.',
      reveal: {
        caption: 'Every step, pinned on the page it happened on — on your own computer.'
      },
      // States shown in the demo screens.
      chips: [
        { text: 'Pin 5 moved · mended', tone: 'warn' },
        { text: 'Order reference · failed at step 10', tone: 'bad' },
        { text: 'Locator health 91%', tone: 'ok' }
      ],
      stats: [
        { value: '4', label: 'frameworks.', sub: 'Playwright to WebdriverIO.' },
        { value: '5', label: 'languages.', sub: 'TypeScript to C#.' },
        { value: '7', label: 'screens.', sub: 'Desktop, phones and tablets.' },
        { value: '0', label: 'accounts.', sub: 'It runs on your computer.' }
      ],
      chapters: [
        {
          id: 'record', layout: 'center', eyebrow: 'Recorder',
          title: 'Record it once.',
          text: 'Use the site in a real browser. Every click, keystroke and check lands as a step — with its screenshot, and every way Tracemend found to reach the element, ranked by how reliable it is.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/steps', alt: 'The Tracemend Recorder as a list: ten steps of “Place an order”, each with the locator it uses and how long it took, step 5 marked mended, and the inspector showing the step’s picture and its mend card.' },
          points: ['Clicks, typing, checks and waits', 'Branches, loops and reusable flows', 'Data from CSV or JSON', 'Variables and secrets kept apart']
        },
        {
          id: 'heal', layout: 'split', eyebrow: 'Self-healing',
          title: 'When the page moves, the test follows.',
          text: 'Each step keeps its ranked locators. When the one in use stops matching, Tracemend finds the same element by similarity, carries on, and asks you to keep or reject the move — recorded and found, side by side.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/heals', alt: 'Tracemend Heals: “The Sign in button moved” — the recorded and replayed pictures of the page, a 0.66 match, the old and new locator, and Keep new spot or Reject.' }
        },
        {
          id: 'code', layout: 'bleed', eyebrow: 'Generated code',
          title: 'Your framework. Your language.',
          text: 'Export Playwright, Selenium, Cypress or WebdriverIO in TypeScript, JavaScript, Python, Java or C# — with page objects, Gherkin, a CI pipeline, an Allure or JUnit report, and the healing resolver built into the code.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/code', alt: 'Tracemend Code: the generated Playwright project in TypeScript — its files beside the editor, a page object with each locator’s fallbacks, and what to generate: this test, its suite or the whole project, self-healing, page objects, Gherkin, a CI pipeline and the report.' }
        },
        {
          id: 'runs', layout: 'split-rev', eyebrow: 'Runs',
          title: 'See exactly where it broke.',
          text: 'Every run keeps each step’s status, time and picture. A failed check says what it expected and what the page had, on the screen it happened on.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/run-failed', alt: 'A Tracemend run that failed at step 10: every step as a bar, and the failed check — expected NW-0001, on the page NW-4821 — beside the page with the step’s pin.' }
        },
        {
          id: 'compare', layout: 'center', eyebrow: 'Compare runs',
          title: 'What changed since yesterday?',
          text: 'Put two runs side by side — outcome, steps, time, the screen they ran on — and open both pictures of any step.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/compare', alt: 'Tracemend comparing two runs of “Place an order”: a desktop run and an iPhone 15 run, their steps, time, accessibility problems and screen side by side.' }
        },
        {
          id: 'devices', layout: 'split', eyebrow: 'Phones and tablets',
          title: 'Desktop. iPhone. Pixel. iPad.',
          text: 'Record and replay on seven screens, emulated with Playwright’s own descriptors — or run every test on several at once and compare them.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/screens', alt: 'Tracemend’s screen menu beside Replay: record and replay on the desktop, iPhone 15, iPhone 15 Pro Max, Pixel 8, Galaxy S24, iPad or iPad Pro 11, replay just once on another, or check accessibility.' }
        },
        {
          id: 'a11y', layout: 'split-rev', eyebrow: 'Accessibility',
          title: 'Tests that audit as they go.',
          text: 'Turn on accessibility checks and every screen a test reaches is scanned for WCAG 2.2 A and AA problems — each ringed on the step’s picture, with how to fix it.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/a11y', alt: 'A Tracemend run’s accessibility results: three screens checked, one serious problem — text below the minimum colour contrast — ringed on the order-confirmation screen.' }
        },
        {
          id: 'assistant', layout: 'center', eyebrow: 'Assistant',
          title: 'Ask why it failed.',
          text: 'The Assistant reads the run on screen and answers from your project — the failed step, the likely cause, a steadier locator — with a button that does it. It works offline.',
          visual: { type: 'shot', src: 'assets/products/tracemend/screens/assistant', alt: 'Tracemend’s Assistant beside a failed run, answering “Why did step 10 fail?”: the check expected NW-0001 and found NW-4821, with the step’s picture and buttons to open the step or replay.' }
        },
        {
          id: 'ci', layout: 'terminal', eyebrow: 'CI',
          title: 'Run it headless.',
          text: '`tracemend --cli run` runs the same suite on your runner — workers, shards, retries and tags — with JUnit or JSON for your pipeline, and exit code 1 when a test fails.',
          visual: {
            type: 'terminal',
            // Real output of the command against the demo shop (abridged).
            command: 'tracemend --cli run "Northwind Supply" --workers 4',
            label: 'tracemend --cli run output',
            caption: 'Output of tracemend --cli run for the demo shop.',
            lines: [
              { s: 'dim', t: 'Running 6 test(s) on 4 workers' },
              { s: 'ok', t: 'ok    Place an order          10 passed' },
              { s: 'ok', t: 'ok    Order needs approval     8 passed' },
              { s: 'ok', t: 'ok    Sign-in validation       4 passed' },
              { s: 'bad', t: 'FAIL  Order reference          9 passed, 1 failed' },
              { s: 'bad', t: '      Expected text to contain "NW-0001" but found "NW-4821"' }
            ],
            verdict: '5/6 passed, 1 failed — exit 1',
            artifacts: 'Add --reporter junit --out junit.xml for your pipeline'
          }
        }
      ],
      // "Everything in one place" — each tile has a small CSS animation (anim), with its own words (say).
      bento: [
        { size: 'l', anim: 'locator', say: ["getByTestId('signin-submit')", 'healed'], title: 'Self-healing locators', text: 'Ranked fallbacks, a similarity search — and your say on every move.' },
        { size: 's', anim: 'diff', say: ['click button.primary', 'Click “Sign in”'], title: 'Steps in plain words', text: 'Named as you record; rename them with AI.' },
        { size: 's', anim: 'radar', title: 'Accessibility', text: 'WCAG 2.2 A and AA, ringed on the picture.' },
        { size: 's', anim: 'budget', say: ['Locator health · 91%'], title: 'Locator health', text: 'Every locator scored. The weakest first.' },
        { size: 's', anim: 'bug', say: ['NW-0001', 'NW-4821', 'step 10 · failed'], title: 'Checks that explain', text: 'Expected and found, side by side.' },
        { size: 'l', anim: 'strip', title: 'Scheduled runs', text: 'Nightly, hourly or weekly — every test, or a tag.' },
        { size: 's', anim: 'api', say: ['POST /api/session', '201', '409'], title: 'API tests', text: 'The calls your recording made, as requests.' },
        { size: 's', anim: 'ask', say: ['Why did step 10 fail?', 'It expected NW-0001 and found NW-4821.'], title: 'Ask Assistant', text: 'Answers from your project. Works offline.' },
        { size: 's', anim: 'bell', title: 'Results where you work', text: 'Slack, email, webhooks, GitHub, Jira, TestRail, Xray.' },
        { size: 'l', anim: 'ci', say: ['tracemend --cli run', '5/6 passed — exit 1'], title: 'Headless CLI', text: 'Workers, shards, retries and tags, with JUnit or JSON.' }
      ],
      // Tech specs: groups → rows. A row is { label?, value } or { label?, list: [...] }.
      specs: [
        { group: 'Version', rows: [
          { label: 'Latest', value: 'release:version' },
          { label: 'Released', value: 'release:date' }
        ] },
        { group: 'Platform', rows: [
          { label: 'Operating system', value: 'Windows 10 or Windows 11, 64-bit (x64)' },
          { label: 'Browsers', value: 'Chromium is included. Microsoft Edge and Google Chrome use the copy already installed.' },
          { label: 'Disk space', value: 'About 1 GB, including its own Chromium, plus room for screenshots and run artifacts' },
          { label: 'macOS and Linux', value: 'Coming soon' }
        ] },
        { group: 'Installer', rows: [
          { label: 'Type', value: 'Windows installer, for you only — no administrator rights needed; you choose the folder' },
          { label: 'Download size', value: 'release:size' },
          { label: 'Verification', value: 'SHA-256 checksum published for every file' },
          { label: 'Updates', value: 'Automatic updates are off until you turn them on' }
        ] },
        { group: 'Licence', rows: [
          { value: 'Free · closed source' },
          { value: 'Free for personal and commercial use, under the Tracemend EULA. The test code it generates is yours.' }
        ] },
        { group: 'Your data', rows: [
          { label: 'Location', value: 'Your %APPDATA%\\Tracemend folder, on your computer' },
          { label: 'Privacy', value: 'No accounts, analytics or telemetry; crash reports stay on your computer unless you choose to send them' },
          { label: 'Secrets', value: 'Passwords, tokens and saved sign-ins encrypted with your Windows account' },
          { label: 'Moving projects', value: 'One project file to export and import, or a git-friendly project folder' }
        ] },
        { group: 'Recording', rows: [
          { label: 'Captures', list: ['Clicks', 'Typing', 'Selects', 'Checkboxes', 'Uploads and downloads', 'Key presses', 'Dialogs', 'Navigation', 'Iframes and shadow DOM'] },
          { label: 'You add', list: ['Checks', 'Waits', 'Branches and loops', 'Reusable flows', 'Scripts', 'One-time codes (TOTP)'] }
        ] },
        { group: 'Exports', rows: [
          { label: 'Frameworks', list: ['Playwright', 'Selenium', 'Cypress', 'WebdriverIO'] },
          { label: 'Languages', list: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C#'] },
          { label: 'Included', list: ['Self-healing resolver', 'Page objects', 'Gherkin', 'CI pipeline', 'Test data'] },
          { label: 'Reports', list: ['Built-in', 'Allure', 'JUnit XML'] },
          { label: 'Documents', value: 'A walkthrough of any test as one HTML file, and its screenshots as a ZIP' }
        ] },
        { group: 'Running', rows: [
          { label: 'Parallel', value: 'Up to 32 workers, shards split by measured duration, step and test retries' },
          { label: 'Screens', list: ['Desktop', 'iPhone 15', 'iPhone 15 Pro Max', 'Pixel 8', 'Galaxy S24', 'iPad', 'iPad Pro 11'] },
          { label: 'Checks', list: ['Visual comparison', 'Accessibility (WCAG 2.2 A and AA)'] },
          { label: 'Setup', list: ['Environments', 'Sign-in roles', 'Network mocks', 'Trace, video and HAR'] }
        ] },
        { group: 'CI', rows: [
          { label: 'Command', value: '`tracemend --cli run <project>` — exit codes 0, 1 and 2' },
          { label: 'Outputs', list: ['Line', 'JUnit XML', 'JSON'] },
          { label: 'Pipelines', list: ['GitHub Actions', 'Azure Pipelines', 'Jenkins'] }
        ] },
        { group: 'Integrations', rows: [
          { label: 'Results to', list: ['GitHub checks', 'Jira', 'TestRail', 'Xray', 'OpenTelemetry', 'Webhooks'] },
          { label: 'Notifications', list: ['Slack', 'Email (SMTP)'] }
        ] },
        { group: 'AI', rows: [
          { label: 'On your computer', value: 'The Assistant answers from the built-in guide and your project, offline' },
          { label: 'Optional', value: 'An OpenAI-compatible API key you supply, for step names and longer answers' }
        ] },
        { group: 'Accessibility & appearance', rows: [
          { label: 'Themes', list: ['Aurora', 'Ocean', 'Sunset', 'Midnight', 'Pure black', 'Daylight'] },
          { label: 'Accent colours', value: 'Pink to violet, Teal to blue, Amber to coral or Lime to emerald' },
          { label: 'Interface size', value: 'Fits the window, or 80% to 125%' },
          { label: 'Keyboard', value: 'Shortcuts for every main screen (? lists them); a command palette (Ctrl+K)' }
        ] },
        { group: 'Language', rows: [
          { value: 'English' }
        ] }
      ]
    },
    // Every screenshot, in tour order — shown in the product page's gallery (light + dark).
    screenshots: [
      { src: 'assets/products/tracemend/screens/recorder', title: 'Recorder', alt: 'The Tracemend Recorder on the board: “Place an order” pinned step by step on the demo’s sign-in page, its steps beside it, and step 5 marked moved, with its ranked locators.' },
      { src: 'assets/products/tracemend/screens/steps', title: 'Steps and the inspector', alt: 'The Recorder as a list: ten steps with their locators and timings, step 5 mended, and the inspector with the step’s picture and its mend card.' },
      { src: 'assets/products/tracemend/screens/locators', title: 'Locators', alt: 'A step’s locators in the inspector, each with its reliability, the one in use marked, and the locator playground.' },
      { src: 'assets/products/tracemend/screens/heals', title: 'Heals', alt: 'Tracemend Heals: “The Sign in button moved”, with the recorded and replayed pictures, a 0.66 match and Keep new spot or Reject.' },
      { src: 'assets/products/tracemend/screens/code', title: 'Generated code', alt: 'The generated Playwright project in TypeScript: its files, a page object with each locator’s fallbacks, and what to generate.' },
      { src: 'assets/products/tracemend/screens/runs', title: 'Runs', alt: 'Tracemend Runs: the run history by day, and a passed run with one mended step — every step as a bar and the mended step on its page.' },
      { src: 'assets/products/tracemend/screens/run-failed', title: 'A failed run', alt: 'A run that failed at step 10: the check expected NW-0001 and the page had NW-4821.' },
      { src: 'assets/products/tracemend/screens/compare', title: 'Comparing runs', alt: 'Two runs of “Place an order” side by side — desktop and iPhone 15 — with their outcome, steps, time and screen.' },
      { src: 'assets/products/tracemend/screens/screens', title: 'Phones and tablets', alt: 'The screen menu beside Replay: the desktop, three phones and two tablets, a one-off replay on another screen, and accessibility checks.' },
      { src: 'assets/products/tracemend/screens/a11y', title: 'Accessibility', alt: 'A run’s accessibility results: three screens checked and one serious colour-contrast problem, ringed on the step’s picture.' },
      { src: 'assets/products/tracemend/screens/assistant', title: 'Ask Assistant', alt: 'The Assistant beside a failed run, explaining why step 10 failed with the step’s picture.' },
      { src: 'assets/products/tracemend/screens/api', title: 'API calls caught while recording', alt: 'The calls the “Place an order” recording made — config, catalogue, session, orders — each with its status and time, ready to become API tests.' },
      { src: 'assets/products/tracemend/screens/insights', title: 'Insights', alt: 'Tracemend Insights: pass rate, pins moved, average run and locator health, the next scheduled run, and accessibility across the suite.' },
      { src: 'assets/products/tracemend/screens/settings', title: 'Settings', alt: 'Tracemend Settings on Healing: heal during replay, the similarity threshold, and how replay runs.' }
    ],
    install: [
      'Run the installer. It installs just for you — no administrator rights needed — and you choose the folder.',
      'Start Tracemend from the Start menu, then press “Try the demo” to record, replay and export against a sample shop.',
      'Uninstalling never deletes your projects in %APPDATA%\\Tracemend.'
    ],
    releases: [
      // @releases tracemend — tools/add-release.mjs inserts new releases below this line
      /* @release tracemend 1.0.0 */ {
        version: '1.0.0',
        date: '2026-10-20', // PLACEHOLDER: set to the real release date (add-release.mjs sets today's date)
        notes: [
          'First public release, for Windows 10 and 11 (x64).',
          'Record in a real browser: every step with its screenshot and ranked locators, pinned on the page it happened on.',
          'Self-healing replay, with every move kept for you to accept or reject on Heals.',
          'Generated code for Playwright, Selenium, Cypress and WebdriverIO in five languages — with page objects, Gherkin, a CI pipeline and the healing resolver.',
          'Runs with workers, shards and retries; schedules; side-by-side run comparison.',
          'Accessibility checks (WCAG 2.2 A and AA) and phone and tablet emulation.',
          'The Assistant: answers from your project and the fixes they point to, offline.',
          '`tracemend --cli run` for CI, with JUnit and JSON reports.',
          'Automatic updates are off until you turn them on in Settings.'
        ],
        files: [
          {
            platform: 'windows',
            arch: 'x64',
            kind: 'installer',
            filename: 'Tracemend Setup 1.0.0.exe',
            url: 'downloads/tracemend/1.0.0/Tracemend%20Setup%201.0.0.exe',
            size: null,
            sha256: null
          }
        ]
      } /* @end-release */
    ]
  },
  {
    id: 'prism',
    name: 'Prism',
    tagline: 'Chain your API calls into flows. Test every step.',
    description:
      'Prism is a desktop workspace for API testing: build requests, chain the values one captures into the next, check every response and run the whole flow — on your desktop or in CI. It imports Postman collections, OpenAPI documents, HAR files and cURL, load-tests, mocks, and exports tests to 15 targets. Free for Windows; it runs on your own computer.',
    category: 'API testing',
    status: 'available',
    platforms: { windows: 'available', macos: 'coming-soon', linux: 'coming-soon' },
    // Free to download and use, including commercially; closed source (proprietary freeware).
    price: { amount: 0, currency: 'USD' },
    license: {
      kind: 'proprietary',
      name: 'Prism End User Licence Agreement',
      url: 'terms.html#eula-prism',
      version: '1.0', // its own EULA version — site.config.js → eulaVersion is Driftly's
      summary: [
        { icon: 'check', text: 'Free to download, install and use — including for commercial work.' },
        { icon: 'lock', text: 'Closed source: Prism’s source code is not distributed or licensed. The workspaces, reports and code you make with it are yours.' },
        { icon: 'box', text: 'No redistribution, resale, reverse engineering or decompiling, except where the law expressly allows.' }
      ],
      thirdParty: 'licenses/prism/THIRD-PARTY-NOTICES.txt'
    },
    accent: { dark: '#fb923c', light: '#c2410c' },
    icon: 'assets/products/prism/icon-256.png',
    hero: {
      src: 'assets/products/prism/screens/map',
      alt: 'Prism’s map of the Northwind Supply API: the Checkout flow drawn as an orange line through six requests — Sign in, List products, Place order, Get order, Change quantity and Cancel order — and the Catalogue flow as a teal line, with Get order picked and one of its three checks failed: status was “placed”, expected “confirmed”.'
    },
    launch: {
      headline: 'Your API, tested as flows.',
      line: 'Chain requests so each one hands its values to the next, check every response, and run the whole flow on your desktop or in CI. Imports Postman, OpenAPI, HAR and cURL. Free for Windows.',
      job: 'Test your API, flow by flow.',
      role: 'A workspace for API testing: requests chained into flows, checks on every response, load tests, a mock server and code in 15 formats — with a command-line runner for CI.',
      tour: 'Take the tour',
      shotsLead: 'Every screen, testing a local demo shop’s API.',
      reveal: {
        caption: 'Each flow a line, each request a stop — on your own computer.'
      },
      // States shown in the demo screens.
      chips: [
        { text: 'Get order · 1 check failed', tone: 'bad' },
        { text: 'token → Place order', tone: 'ok' },
        { text: 'Load test · p95 8 ms', tone: 'ok' }
      ],
      stats: [
        { value: '15', label: 'export targets.', sub: 'cURL to REST Assured.' },
        { value: '11', label: 'kinds of check.', sub: 'Status to JSON Schema.' },
        { value: '4', label: 'ways in.', sub: 'Postman, OpenAPI, HAR, cURL.' },
        { value: '0', label: 'accounts.', sub: 'It runs on your computer.' }
      ],
      chapters: [
        {
          id: 'flows', layout: 'center', eyebrow: 'Flows',
          title: 'Chain it once.',
          text: 'When one request captures a value — a token, an order id — and another uses it, Prism draws the connection and runs them in that order. No wiring step: the flow is the test, and Run flow reports every stop on a departure board.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/board', alt: 'A Prism run of the Checkout flow on its departure board: six requests, five on time and Get order delayed with two of three checks passed, over the flow’s map.' },
          points: ['Captures from the body or a header', 'Auth set once on a collection or flow', 'Conditions, waits, loops and polling', 'Pre-request and test scripts with Postman’s pm']
        },
        {
          id: 'checks', layout: 'split', eyebrow: 'Checks',
          title: 'Check what came back.',
          text: 'Eleven kinds of check and over forty ways to compare — status, time, headers, JSON paths with wildcards, formats, JSON Schema, cookies. Each one says what it saw, beside the response it saw it in.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/tests', alt: 'Prism’s Place order request opened wide: four checks — status 201, a location header, a reference matching NW- and digits, and status “placed” — all passed, beside the 201 response body.' }
        },
        {
          id: 'generate', layout: 'split-rev', eyebrow: 'Generate',
          title: 'Tests read off a real response.',
          text: 'Generate proposes checks from the last response — types, formats and shape rather than today’s values — and runs each one against it before offering it. Or pick from a library of 55.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/generate', alt: 'Prism generating tests for Place order: eight of ten suggestions picked — content type, a 500 ms budget and the type of every body field — with “All 8 pass against this response”.' }
        },
        {
          id: 'export', layout: 'bleed', eyebrow: 'Export',
          title: 'Code that keeps its checks.',
          text: 'Export to 15 targets — cURL, Python, pytest, fetch, axios, Playwright, Java, REST Assured, C#, Go, PHP, Postman and OpenAPI — with every check written out. A token never lands in a file: it comes out as an environment variable.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/export', alt: 'Prism’s export of Place order as a Playwright test: the POST with its token read from process.env.TOKEN, and each of its four checks as an expect.soft line.' }
        },
        {
          id: 'timeline', layout: 'split', eyebrow: 'Run timeline',
          title: 'What changed since the last run?',
          text: 'Every run of a flow is kept. Pick any two and Prism says what broke, what was fixed, what got slower and which fields appeared, vanished or changed type.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/timeline', alt: 'Prism’s run timeline for Checkout: six runs, five with one failure and the newest passing, and the comparison of the last two — one changed, one fixed: Get order failed before and passes now.' }
        },
        {
          id: 'load', layout: 'split-rev', eyebrow: 'Load test',
          title: 'How much can it take?',
          text: 'Send a flow with up to 50 users at once, with a ramp-up and think time. Watch requests per second, p50, p95 and errors as it runs — and set a budget it either keeps or doesn’t.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/load', alt: 'A Prism load test of Checkout: 20 users for 20 seconds, 3,047 requests at 151.6 per second, p50 4 ms, p95 8 ms and no errors — within budget — with a chart of requests per second and every request’s percentiles.' }
        },
        {
          id: 'mock', layout: 'center', eyebrow: 'Mock server',
          title: 'An API before the API.',
          text: 'Prism answers in your API’s place at 127.0.0.1 — from frozen baselines, the last responses and your OpenAPI examples — so a front end can work while the back end isn’t ready. Only your computer can reach it.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/mock', alt: 'Prism’s mock server running at http://127.0.0.1:4010, answering ten routes of the Northwind Supply API from their last responses, with the calls it has served.' }
        },
        {
          id: 'console', layout: 'split', eyebrow: 'Console',
          title: 'See exactly what went out.',
          text: 'Every request as it was sent and as it came back — headers, bodies, status and time — with script logs and errors beside it. Credentials stay masked until you ask.',
          visual: { type: 'shot', src: 'assets/products/prism/screens/console', alt: 'Prism’s console under the map: the POST to /api/orders opened, its Authorization header masked, the request body and the 201 response headers.' }
        },
        {
          id: 'ci', layout: 'terminal', eyebrow: 'CI',
          title: 'Run it headless.',
          text: 'Started with `--cli`, Prism runs the same workspace file on your runner — with data files, iterations and an HTML, JUnit or JSON report — and exits 1 when a check fails.',
          visual: {
            type: 'terminal',
            // Real output of the command against the demo shop (abridged: five more requests passed).
            command: 'Prism.exe --cli northwind.prism.json --env CI',
            label: 'Prism --cli output',
            caption: 'Output of Prism --cli for the demo shop’s API.',
            lines: [
              { s: 'ok', t: '  ✓ Sign in  200 75ms' },
              { s: 'ok', t: '  ✓ List products  200 2ms' },
              { s: 'ok', t: '  ✓ Place order  201 1ms' },
              { s: 'bad', t: '  ✕ Get order  200 1ms' },
              { s: 'bad', t: '      status equals confirmed: status is "placed", expected confirmed' }
            ],
            verdict: '9 passed, 1 failed — exit 1',
            artifacts: 'Add --reporter junit --out results.xml for your pipeline'
          }
        }
      ],
      // "Everything in one place" — each tile has a small CSS animation (anim), with its own words (say).
      bento: [
        { size: 'l', anim: 'api', say: ['POST /api/orders', '201', '401'], title: 'Every protocol you test', text: 'HTTP, GraphQL, WebSocket, Server-Sent Events and gRPC.' },
        { size: 's', anim: 'diff', say: ['status equals confirmed', 'status is “placed”'], title: 'Checks that explain', text: 'Expected and found, side by side.' },
        { size: 's', anim: 'radar', title: 'OpenAPI contract', text: 'Every response checked against the spec.' },
        { size: 's', anim: 'budget', say: ['p95 8 ms · budget 50 ms'], title: 'Load budgets', text: 'Up to 50 users, with p95 and error limits.' },
        { size: 's', anim: 'bug', say: ['confirmed', 'placed', 'Get order · failed'], title: 'Drift from a baseline', text: 'Freeze a response; see when the shape moves.' },
        { size: 'l', anim: 'strip', title: 'Data-driven runs', text: 'One iteration per row of a CSV or JSON file — or rows generated from the schema.' },
        { size: 's', anim: 'locator', say: ['{{token}}', 'masked'], title: 'Secrets stay secret', text: 'Never in a file, an export or a backup.' },
        { size: 's', anim: 'ask', say: ['Why did Get order fail?', 'It expected “confirmed” and got “placed”.'], title: 'Optional AI', text: 'Off by default. Your key, or Ollama locally.' },
        { size: 's', anim: 'bell', title: 'Schedules', text: 'A flow on a timer, with a notice when it fails.' },
        { size: 'l', anim: 'ci', say: ['Prism.exe --cli', '9 passed, 1 failed — exit 1'], title: 'Headless CLI', text: 'The same workspace file, with HTML, JUnit or JSON.' }
      ],
      // Tech specs: groups → rows. A row is { label?, value } or { label?, list: [...] }.
      specs: [
        { group: 'Version', rows: [
          { label: 'Latest', value: 'release:version' },
          { label: 'Released', value: 'release:date' }
        ] },
        { group: 'Platform', rows: [
          { label: 'Operating system', value: 'Windows 10 or Windows 11, 64-bit (x64)' },
          { label: 'Disk space', value: 'About 325 MB installed' },
          { label: 'macOS and Linux', value: 'Coming soon' }
        ] },
        { group: 'Installer', rows: [
          { label: 'Type', value: 'Windows installer, for you only — no administrator rights needed; you choose the folder' },
          { label: 'Download size', value: 'release:size' },
          { label: 'Verification', value: 'SHA-256 checksum published for every file' },
          { label: 'Updates', value: 'No automatic updates or update checks — new versions are published here' }
        ] },
        { group: 'Licence', rows: [
          { value: 'Free · closed source' },
          { value: 'Free for personal and commercial use, under the Prism EULA. The workspaces, reports and code you make with it are yours.' }
        ] },
        { group: 'Your data', rows: [
          { label: 'Location', value: 'Your workspace files, wherever you save them; settings and backups in %APPDATA%\\Prism' },
          { label: 'Privacy', value: 'No accounts, analytics, telemetry or update checks — the only traffic is the requests you send' },
          { label: 'Secrets', value: 'A secret’s value is never written to a workspace, a backup or an export; in CI it comes from PRISM_<NAME>' },
          { label: 'For Git', value: 'One .prism.json file, or a folder with a file per request' }
        ] },
        { group: 'Requests', rows: [
          { label: 'Protocols', list: ['HTTP', 'GraphQL', 'WebSocket', 'Server-Sent Events', 'gRPC (unary and server streaming)'] },
          { label: 'Auth', list: ['Bearer', 'Basic', 'API key', 'OAuth 2.0', 'JWT', 'Inherited from the collection or flow'] },
          { label: 'Scripts', value: 'Pre-request and test scripts in JavaScript with Postman’s pm object — sandboxed, with no network, stopped after 5 seconds' },
          { label: 'Logic', list: ['Run only if', 'Wait', 'Repeat for each', 'Repeat until', 'Stop the flow'] }
        ] },
        { group: 'Checks', rows: [
          { label: 'Subjects', list: ['Status', 'Time', 'Size', 'Content type', 'Headers', 'Body', 'JSON paths', 'JSON Schema', 'Cookies', 'Redirects', 'Transport'] },
          { label: 'Also', list: ['Over 40 operators', 'A library of 55 checks', 'Generated from a response', 'OpenAPI contract', 'Baselines and drift'] }
        ] },
        { group: 'Imports', rows: [
          { list: ['Postman collection v2.1 and v2.0', 'Postman environment', 'OpenAPI 3 and Swagger 2 (JSON or YAML)', 'HAR', 'cURL', 'Prism workspace'] }
        ] },
        { group: 'Exports', rows: [
          { label: 'Code', list: ['cURL', 'Python requests', 'JavaScript fetch', 'axios', 'Node undici', 'Java HttpClient', 'C# HttpClient', 'Go net/http', 'PHP cURL'] },
          { label: 'Tests', list: ['pytest', 'Playwright', 'REST Assured'] },
          { label: 'Collections', list: ['Postman', 'OpenAPI 3.1', 'Prism flow'] }
        ] },
        { group: 'Running', rows: [
          { label: 'Runner', value: 'A collection or flow, once per row of a CSV or JSON file, with a Prism HTML, JUnit or JSON report' },
          { label: 'Load test', value: 'Up to 50 users for up to five minutes, with p50, p95, p99 and a budget' },
          { label: 'Schedules', value: 'Every minute to once a day while Prism is open, with a desktop notification' },
          { label: 'Also', list: ['Mock server', 'Compare environments', 'Spec coverage', 'Run timeline'] }
        ] },
        { group: 'CI', rows: [
          { label: 'Command', value: '`Prism.exe --cli <workspace>` — exit codes 0 and 1' },
          { label: 'Outputs', list: ['Text', 'JSON', 'JUnit XML', 'HTML'] },
          { label: 'Options', list: ['--env', '--flow', '--data', '--iterations', '--bail', '--no-spec'] }
        ] },
        { group: 'AI', rows: [
          { label: 'Optional', value: 'Off by default. Explains failures and suggests checks, with Anthropic or an OpenAI-compatible key you supply, or Ollama on your computer' },
          { label: 'What it sends', value: 'Shown in full before you ask, with credentials and secrets masked' }
        ] },
        { group: 'Accessibility & appearance', rows: [
          { label: 'Themes', list: ['Follow the system', 'Dark', 'Light', 'Pure black'] },
          { label: 'Interface size', list: ['Automatic', 'Compact', 'Default', 'Large'] },
          { label: 'Keyboard', value: 'A command palette (Ctrl+K), help on F1, and shortcuts for the map' }
        ] },
        { group: 'Language', rows: [
          { value: 'English' }
        ] }
      ]
    },
    // Every screenshot, in tour order — shown in the product page's gallery (light + dark).
    screenshots: [
      { src: 'assets/products/prism/screens/map', title: 'The map', alt: 'Prism’s map: the Checkout and Catalogue flows as lines through their requests, with Get order’s failed check open.' },
      { src: 'assets/products/prism/screens/board', title: 'Departure board', alt: 'A run of Checkout on the departure board: five requests on time and Get order delayed.' },
      { src: 'assets/products/prism/screens/tests', title: 'Checks', alt: 'Place order opened wide: four passing checks beside the 201 response.' },
      { src: 'assets/products/prism/screens/generate', title: 'Generated tests', alt: 'Ten checks proposed from Place order’s response, eight picked, all passing against it.' },
      { src: 'assets/products/prism/screens/overview', title: 'Overview', alt: 'Prism’s overview of the Northwind Supply workspace: ten requests, two flows, 90% passing, each flow’s pass bar and recent activity.' },
      { src: 'assets/products/prism/screens/environments', title: 'Environments', alt: 'The Local environment: base_url, email and a secret password, with which requests use each one.' },
      { src: 'assets/products/prism/screens/export', title: 'Export', alt: 'Place order exported as a Playwright test, its token read from an environment variable.' },
      { src: 'assets/products/prism/screens/timeline', title: 'Run timeline', alt: 'Six runs of Checkout and the last two compared: Get order failed before and passes now.' },
      { src: 'assets/products/prism/screens/load', title: 'Load test', alt: 'A 20-user load test: 3,047 requests, p95 8 ms, no errors, within budget.' },
      { src: 'assets/products/prism/screens/mock', title: 'Mock server', alt: 'The mock server at 127.0.0.1:4010 answering ten routes, with the calls it served.' },
      { src: 'assets/products/prism/screens/console', title: 'Console', alt: 'The console with a request opened: headers with the token masked, the body and the response headers.' },
      { src: 'assets/products/prism/screens/about', title: 'About', alt: 'Prism’s About page: local first, secrets stay secret, no account, runs in CI — what it will not do, and its licence.' }
    ],
    install: [
      'Run the installer. It installs just for you — no administrator rights needed — and you choose the folder.',
      'Start Prism from the Start menu, then import a Postman collection, an OpenAPI document, a HAR file or a cURL command — or start with a blank request.',
      'Save your workspace as a .prism.json file next to your code. Uninstalling never deletes it.'
    ],
    releases: [
      // @releases prism — tools/add-release.mjs inserts new releases below this line
      /* @release prism 0.1.0 */ {
        version: '0.1.0',
        date: '2026-10-20', // PLACEHOLDER: set to the real release date (add-release.mjs sets today's date)
        notes: [
          'First public release, for Windows 10 and 11 (x64).',
          'Requests chained into flows on a map, with captures, inherited auth, conditions, loops and polling.',
          'Eleven kinds of check, generated tests and a library of 55; OpenAPI contract checks on every response.',
          'HTTP, GraphQL, WebSocket, Server-Sent Events and gRPC.',
          'The Runner with data files and HTML, JUnit and JSON reports; load tests, schedules, a mock server and a run timeline.',
          'Imports Postman, OpenAPI, HAR and cURL; exports to 15 targets with every check written out.',
          'A command-line runner for CI: `Prism.exe --cli`.'
        ],
        files: [
          {
            platform: 'windows',
            arch: 'x64',
            kind: 'installer',
            filename: 'Prism Setup 0.1.0.exe',
            url: 'downloads/prism/0.1.0/Prism%20Setup%200.1.0.exe',
            size: null,
            sha256: null
          }
        ]
      } /* @end-release */
    ]
  }
];
