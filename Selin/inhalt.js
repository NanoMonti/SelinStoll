// Füllt die Seite mit den Texten aus inhalt.json.
// Alle sichtbaren Texte kommen aus dieser Datei, damit sie später über das
// Admin-Panel geändert werden können. Platzhalter in [eckigen Klammern]
// werden gelb markiert, bis Selin den richtigen Text liefert.
(function () {
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function mark(s) {
    return esc(s).replace(/\[([^\]]+)\]/g, '<mark class="offen">[$1]</mark>');
  }
  function fill(data) {
    document.title = get(data, 'seite.titel') || document.title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', get(data, 'seite.beschreibung') || '');

    document.querySelectorAll('[data-t]').forEach(function (el) {
      var v = get(data, el.dataset.t);
      if (v == null || v === '') { if (el.hasAttribute('data-optional')) el.hidden = true; return; }
      el.innerHTML = mark(v);
    });
    document.querySelectorAll('[data-ps]').forEach(function (el) {
      el.innerHTML = (get(data, el.dataset.ps) || []).map(function (p) { return '<p>' + mark(p) + '</p>'; }).join('');
    });
    document.querySelectorAll('[data-list]').forEach(function (el) {
      el.innerHTML = (get(data, el.dataset.list) || []).map(function (p) { return '<li>' + mark(p) + '</li>'; }).join('');
    });
    document.querySelectorAll('[data-angaben]').forEach(function (el) {
      el.innerHTML = (get(data, el.dataset.angaben) || []).map(function (a) {
        return '<div><dt>' + mark(a.label) + '</dt><dd>' + mark(a.wert) + '</dd></div>';
      }).join('');
    });
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.innerHTML = (get(data, el.dataset.nav) || []).map(function (n) {
        return '<a href="' + esc(n.ziel) + '">' + esc(n.text) + '</a>';
      }).join('');
    });
    document.querySelectorAll('[data-opts]').forEach(function (el) {
      el.innerHTML = (get(data, el.dataset.opts) || []).map(function (o) {
        return '<option>' + esc(o) + '</option>';
      }).join('');
    });
    document.querySelectorAll('[data-href]').forEach(function (el) {
      var href = get(data, el.dataset.href);
      // data-optional: Knopf ausblenden, solange kein Link eingetragen ist
      if (!href && el.hasAttribute('data-optional')) { (el.closest('p') || el).hidden = true; return; }
      el.setAttribute('href', href || '#');
    });
    // nur anzeigen, solange das genannte Feld leer ist (z. B. Termin-Link fehlt noch)
    document.querySelectorAll('[data-wenn-leer]').forEach(function (el) {
      if (get(data, el.dataset.wennLeer)) el.hidden = true;
    });
    // Werte für versteckte Formularfelder (z. B. welcher Kurs gebucht wird)
    document.querySelectorAll('[data-val]').forEach(function (el) {
      el.value = get(data, el.dataset.val) || '';
    });
    document.querySelectorAll('[data-foto]').forEach(function (el) {
      var src = get(data, el.dataset.foto);
      if (src) { el.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(get(data, 'leitung.foto_alt') || '') + '">'; el.classList.add('hat-foto'); }
    });
  }
  fetch('/inhalt.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(fill)
    .catch(function (e) { console.error('inhalt.json konnte nicht geladen werden', e); });

  // Lokal (localhost) sendet das Formular nichts; online übernimmt Netlify Forms.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    document.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Lokale Vorschau – das Formular wird erst online (Netlify) verschickt.');
    });
  }

  // Links aus E-Mails von Netlify Identity (Einladung, Passwort zurücksetzen)
  // landen auf der Startseite: dann das Login-Fenster laden und danach ins Admin.
  if (/(invite|recovery|confirmation|email_change)_token=/.test(location.hash)) {
    var s = document.createElement('script');
    s.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
    s.onload = function () {
      window.netlifyIdentity.on('login', function () { location.href = '/admin/'; });
    };
    document.head.appendChild(s);
  }
})();
