/*
 * Example backend for the contact form (site.config.js → contactForm.provider: 'custom').
 * A Cloudflare Worker that accepts the form's JSON POST and forwards it by email through an
 * email API. Not used by the site itself — copy it into a Worker project:
 *
 *   npm create cloudflare@latest delog-contact     (choose "Hello World" Worker)
 *   replace src/index.js with this file
 *   npx wrangler secret put RESEND_API_KEY          (or adapt send() to your email provider)
 *   set ALLOWED_ORIGIN, TO_EMAIL and FROM_EMAIL in wrangler.toml [vars]
 *   npx wrangler deploy
 *
 * Then in site.config.js: contactForm: { provider: 'custom', endpoint: 'https://delog-contact.<you>.workers.dev' }
 * and run node tools/build-pages.mjs (it adds that origin to the Content-Security-Policy).
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      Vary: 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || origin !== env.ALLOWED_ORIGIN) return new Response('Not allowed', { status: 403, headers: cors });

    let d;
    try { d = await request.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    const clean = (v, max) => String(v || '').slice(0, max).trim();
    const name = clean(d.name, 100), email = clean(d.email, 200), message = clean(d.message, 5000);
    const topic = clean(d.topic, 20) || 'General', product = clean(d.product, 60);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) return new Response('Invalid', { status: 422, headers: cors });
    if (d.company) return new Response('{"ok":true}', { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }); // honeypot

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: env.TO_EMAIL,
        reply_to: email,
        subject: `[${topic}] ${product ? product + ' — ' : ''}message from ${name}`,
        text: `${message}\n\n— ${name} <${email}>${product ? `\nProduct: ${product}` : ''}`
      })
    });
    return new Response(JSON.stringify({ ok: r.ok }), { status: r.ok ? 200 : 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
