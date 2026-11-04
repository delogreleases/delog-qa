/*
 * Delog — contact form. Provider from site.config.js → contactForm.provider:
 *   mailto     opens the visitor's email app, prefilled and addressed to the topic's email
 *   netlify    POSTs the form to Netlify Forms (same origin)
 *   formspree  POSTs JSON to the Formspree endpoint
 *   web3forms  POSTs JSON (with the access key) to Web3Forms
 *   custom     POSTs JSON to your own endpoint (e.g. tools/contact-worker.example.js)
 * Spam: a hidden honeypot field and a minimum time on the page. One send per 30 seconds.
 */
(function () {
  'use strict';
  var form = document.querySelector('[data-contact-form]');
  if (!form || !window.DelogRender) return;
  var SITE = window.DELOG_SITE || {}, C = window.DelogRender.cfg(SITE);
  var cf = SITE.contactForm || {}, provider = C.formProvider;
  var status = form.querySelector('[data-form-status]'), submit = form.querySelector('.cform__submit');
  var opened = Date.now(), WAIT = 30000, MIN_TIME = 3000, memLast = 0;
  var TOPIC = { general: 'General', support: 'Support', sales: 'Sales', security: 'Security', press: 'Press' };

  if (provider === 'mailto') {
    var copy = form.querySelector('[data-copy-option]');
    if (copy) copy.hidden = false; // the visitor's own email app can copy them (Cc)
    if (!C['email.general']) Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
  } else {
    var note = form.querySelector('[data-form-note]');
    if (note) note.textContent = 'Your message is sent securely to ' + ({ netlify: 'our host', formspree: 'our form service', web3forms: 'our form service', custom: 'our form service' }[provider] || 'us') + ' — see the Privacy Policy.';
  }

  function last() { try { return Number(localStorage.getItem('delog-contact-at')) || memLast; } catch (e) { return memLast; } }
  function stamp() { memLast = Date.now(); try { localStorage.setItem('delog-contact-at', String(memLast)); } catch (e) { /* private mode */ } }

  function field(name) { return form.elements[name]; }
  function setError(name, msg) {
    var el = field(name), err = document.getElementById('cf-' + name + '-err');
    if (!el || !err) return;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.textContent = msg || '';
    err.hidden = !msg;
  }
  function validate() {
    var bad = [];
    var name = field('name').value.trim(), email = field('email').value.trim(), msg = field('message').value.trim();
    setError('name', name ? '' : 'Please enter your name.'); if (!name) bad.push('name');
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setError('email', !email ? 'Please enter your email address, so we can reply.' : okEmail ? '' : 'That doesn’t look like an email address — please check it.');
    if (!okEmail) bad.push('email');
    setError('message', msg.length >= 10 ? '' : msg ? 'Please write a little more (at least 10 characters).' : 'Please write your message.');
    if (msg.length < 10) bad.push('message');
    return bad;
  }
  ['name', 'email', 'message'].forEach(function (n) {
    field(n).addEventListener('blur', function () { if (field(n).value) validate(); });
    field(n).addEventListener('input', function () { if (field(n).getAttribute('aria-invalid') === 'true') validate(); });
  });

  function say(kind, html) {
    status.className = 'cform__status cform__status--' + kind;
    status.innerHTML = html;
    status.hidden = false;
    status.focus();
  }
  function data() {
    var product = field('product');
    return {
      name: field('name').value.trim(),
      email: field('email').value.trim(),
      topic: TOPIC[field('topic').value] || 'General',
      product: product.value ? product.options[product.selectedIndex].text : '',
      message: field('message').value.trim()
    };
  }
  function subjectOf(d) { return '[' + d.topic + '] ' + (d.product ? d.product + ' — ' : '') + 'message from ' + d.name; }
  function fallbackLink() {
    var to = C['email.' + field('topic').value] || C['email.general'];
    return to ? ' You can also email <a href="mailto:' + to + '">' + to + '</a>.' : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.hidden = true;
    var bad = validate();
    if (bad.length) { field(bad[0]).focus(); return; }
    if (field('company').value) { form.reset(); say('ok', '<strong>Thanks — your message is on its way.</strong>'); return; } // honeypot: drop quietly
    if (Date.now() - opened < MIN_TIME) { say('error', 'That was quick! Please check your message and press Send again.'); opened = 0; return; }
    var wait = WAIT - (Date.now() - last());
    if (wait > 0) { say('error', 'Please wait ' + Math.ceil(wait / 1000) + ' seconds before sending another message.'); return; }
    var d = data();

    if (provider === 'mailto') {
      var to = C['email.' + field('topic').value] || C['email.general'];
      var body = d.message + '\n\n— ' + d.name + ' <' + d.email + '>' + (d.product ? '\nProduct: ' + d.product : '');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subjectOf(d)) + '&body=' + encodeURIComponent(body) +
        (field('copy') && field('copy').checked ? '&cc=' + encodeURIComponent(d.email) : '');
      stamp();
      window.location.href = href;
      say('ok', '<strong>Your email app should open with your message.</strong> Send it from there to reach us. Nothing opened? Email <a href="mailto:' + to + '">' + to + '</a>.');
      return;
    }

    var url, init;
    if (provider === 'netlify') {
      var p = new URLSearchParams();
      p.append('form-name', 'contact');
      Object.keys(d).forEach(function (k) { p.append(k, d[k]); });
      url = '/'; init = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() };
    } else {
      var payload = { name: d.name, email: d.email, topic: d.topic, product: d.product, message: d.message, subject: subjectOf(d) };
      if (provider === 'web3forms') { payload.access_key = cf.accessKey || ''; payload.from_name = d.name; payload.botcheck = ''; }
      if (provider === 'formspree') payload._subject = payload.subject;
      url = C.formEndpoint;
      init = { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) };
    }
    if (!url) { say('error', 'The form isn’t set up yet.' + fallbackLink()); return; }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    fetch(url, init).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      stamp();
      form.reset();
      say('ok', '<strong>Thanks — your message is on its way.</strong> We’ll reply to ' + d.email.replace(/[<>&"]/g, '') + '.');
    }).catch(function () {
      say('error', '<strong>Sorry — the message couldn’t be sent.</strong> Please try again in a moment.' + fallbackLink());
    }).then(function () { submit.disabled = false; submit.textContent = 'Send message'; });
  });
})();
