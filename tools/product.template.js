/*
 * Template for a new product. Copy this object into the array in assets/js/products.js (after
 * Driftly, separated by a comma), fill it in, add its icon and screenshots, then run
 * node tools/build-pages.mjs. The field reference is in README.md → "Product data reference".
 * Screenshot "src" values have no theme or extension: provide <src>-dark|light-800|1440.webp
 * (and .avif). Not loaded by the site.
 */
// eslint-disable-next-line no-unused-vars
const product = {
    id: 'example-tool',
    name: 'Example Tool',
    tagline: 'One sentence about what it does for the user.',
    description: 'Two or three sentences for cards and search results.',
    category: 'Developer tools',
    status: 'coming-soon',                       // shows "Notify me" instead of downloads
    price: { amount: 0, currency: 'USD' },       // or omit if not decided
    platforms: { windows: 'coming-soon', macos: 'coming-soon', linux: 'coming-soon' },
    license: {
      kind: 'open-source',
      name: 'MIT',
      file: 'licenses/example-tool/LICENSE.txt'  // or text: 'MIT License\n\nCopyright …'
    },
    accent: { dark: '#a78bfa', light: '#6d28d9' },
    icon: 'assets/products/example-tool/icon-256.png',
    hero: { src: 'assets/products/example-tool/screens/main', alt: '…' },
    screenshots: [ { src: 'assets/products/example-tool/screens/main', title: '…', alt: '…' } ],
    // launch: { … }                            // optional cinematic product page (see Driftly)
    sections: [ { title: '…', body: ['…'] } ],
    features: [ { icon: 'spark', title: '…', text: '…' } ],
    requirements: [ { label: 'Operating system', value: '…' } ],
    install: [],
    releases: [
      // @releases example-tool — tools/add-release.mjs inserts new releases below this line
    ]
  };
