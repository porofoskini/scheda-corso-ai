/* Scheda d'ingresso e d'uscita · PWA senza dipendenze. Dati: solo sul dispositivo, a meno di consenso all'invio anonimo. */
(function () {
  'use strict';
  var S = window.SCHEMA, C = window.CONFIG || {};
  var app = document.getElementById('app');
  var statoEl = document.getElementById('stato');
  var K = {
    codice: 'scheda:v1:codice',
    rec: function (c, f) { return 'scheda:v1:rec:' + c + ':' + f; },
    bozza: function (c, f) { return 'scheda:v1:bozza:' + c + ':' + f; },
    coda: 'scheda:v1:coda'
  };
  var memoria = {}; // ripiego se localStorage non è disponibile
  function leggi(k) { try { var v = window.localStorage.getItem(k); return v === null ? (memoria[k] || null) : v; } catch (e) { return memoria[k] || null; } }
  function scrivi(k, v) { memoria[k] = v; try { window.localStorage.setItem(k, v); } catch (e) { /* nessuno spazio: resta in memoria */ } }
  function togli(k) { delete memoria[k]; try { window.localStorage.removeItem(k); } catch (e) {} }
  function jget(k, d) { try { var v = leggi(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, o) { scrivi(k, JSON.stringify(o)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function annuncia(t) { statoEl.textContent = ''; setTimeout(function () { statoEl.textContent = t; }, 50); }

  function normalizza(c) { return String(c || '').trim().toUpperCase().replace(/\s+/g, '-'); }
  function codiceValido(c) { return /^[A-Z0-9-]{3,20}$/.test(c); }
  function codiceCorrente() { return normalizza(leggi(K.codice) || ''); }

  /* ---------- invio anonimo ---------- */
  function inCoda() { return jget(K.coda, []); }
  function metti(c, f) { var q = inCoda(); var id = c + '|' + f; if (q.indexOf(id) < 0) q.push(id); jset(K.coda, q); }
  function levaDallaCoda(id) { jset(K.coda, inCoda().filter(function (x) { return x !== id; })); }
  function invia(c, f) {
    var rec = jget(K.rec(c, f), null);
    if (!rec || !rec.consenso || !C.ENDPOINT) return Promise.resolve(false);
    var corpo = new URLSearchParams({ fase: f, codice: c, v: S.versione, risposte: JSON.stringify(rec.risposte), hp: '' });
    return fetch(C.ENDPOINT, { method: 'POST', mode: 'no-cors', body: corpo }).then(function () {
      rec.inviato = new Date().toISOString(); jset(K.rec(c, f), rec); levaDallaCoda(c + '|' + f); return true;
    }).catch(function () { return false; });
  }
  function svuotaCoda() {
    if (!C.ENDPOINT || !navigator.onLine) return Promise.resolve();
    return inCoda().reduce(function (p, id) { var a = id.split('|'); return p.then(function () { return invia(a[0], a[1]); }); }, Promise.resolve());
  }

  /* ---------- schermate ---------- */
  function titolo(t) { return '<h1 id="titolo" tabindex="-1">' + esc(t) + '</h1>'; }
  function mostra(html, titoloTesto) {
    app.innerHTML = html;
    document.title = (titoloTesto ? titoloTesto + ' · ' : '') + "Scheda corso IA";
    var h = document.getElementById('titolo'); if (h) { h.focus(); }
    window.scrollTo(0, 0);
  }
  function statoFase(c, f) {
    var rec = c ? jget(K.rec(c, f), null) : null;
    if (!rec) return '<span class="badge">Da compilare</span>';
    var inv = rec.inviato ? 'inviata in forma anonima' : (rec.consenso && C.ENDPOINT ? 'in attesa di invio' : 'solo su questo dispositivo');
    return '<span class="badge ok">Compilata</span> <span class="nota">' + esc(inv) + '</span>';
  }

  function home() {
    var c = codiceCorrente();
    mostra(
      titolo("Scheda d'ingresso e d'uscita") +
      '<p>Una scheda <strong>anonima</strong> per capire da dove partite e che cosa cambia. Non è una verifica. Rispondete solo a ciò che volete.</p>' +
      '<form id="f-codice" class="riquadro" novalidate>' +
      '<label class="campo" for="codice">Il mio codice</label>' +
      '<p class="nota" id="aiuto-codice">Inventatelo e ricordatelo: per esempio le iniziali di un animale e un numero (GATTO-7). Serve per ritrovare la scheda alla fine. Da 3 a 20 lettere, numeri o trattini. Niente nome o cognome.</p>' +
      '<input type="text" id="codice" name="codice" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-describedby="aiuto-codice errore-codice" value="' + esc(c) + '">' +
      '<p id="errore-codice" class="nota" role="alert"></p>' +
      '<button class="btn secondario" type="submit">Salva il codice</button></form>' +
      '<div class="riquadro"><div class="stato-scheda"><h2 class="zero">Scheda d\'ingresso</h2><span id="s-ingresso">' + statoFase(c, 'ingresso') + '</span></div>' +
      '<p class="nota">Da compilare all\'inizio del corso.</p><a class="btn" href="#/ingresso" data-richiede="1">Compila la scheda d\'ingresso</a></div>' +
      '<div class="riquadro"><div class="stato-scheda"><h2 class="zero">Scheda d\'uscita</h2><span id="s-uscita">' + statoFase(c, 'uscita') + '</span></div>' +
      '<p class="nota">Da compilare alla fine, con lo stesso codice.</p><a class="btn" href="#/uscita" data-richiede="1">Compila la scheda d\'uscita</a></div>' +
      (C.ENDPOINT ? '' : '<p class="avviso">L\'invio al formatore non è attivo: le risposte restano solo su questo dispositivo.</p>'),
      "Inizio");
    var form = document.getElementById('f-codice');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = normalizza(document.getElementById('codice').value);
      if (!codiceValido(v)) { document.getElementById('errore-codice').textContent = 'Il codice deve avere da 3 a 20 lettere, numeri o trattini.'; return; }
      scrivi(K.codice, v); document.getElementById('errore-codice').textContent = '';
      annuncia('Codice salvato: ' + v); home();
    });
    Array.prototype.forEach.call(app.querySelectorAll('[data-richiede]'), function (a) {
      a.addEventListener('click', function (e) {
        if (!codiceValido(codiceCorrente())) { e.preventDefault(); document.getElementById('errore-codice').textContent = 'Prima scrivi e salva il tuo codice.'; document.getElementById('codice').focus(); }
      });
    });
  }

  function campoDomanda(d, val, altro) {
    var h = '';
    if (d.tipo === 'testo') {
      h += '<fieldset><legend>' + esc(d.testo) + '</legend><textarea name="' + d.id + '" maxlength="300" aria-label="' + esc(d.testo) + '">' + esc(val || '') + '</textarea><p class="contatore" aria-hidden="true"></p></fieldset>';
      return h;
    }
    h += '<fieldset' + (d.tipo === 'scala' ? ' class="scala-f"' : '') + '><legend>' + esc(d.testo) + '</legend>';
    h += d.tipo === 'scala' ? '<div class="scala">' : '';
    d.opzioni.forEach(function (o) {
      var tipo = d.tipo === 'multi' ? 'checkbox' : 'radio';
      var sel = d.tipo === 'multi' ? (val || []).indexOf(o) >= 0 : val === o;
      h += '<label class="opz"><input type="' + tipo + '" name="' + d.id + '" value="' + esc(o) + '"' + (sel ? ' checked' : '') + '> <span>' + esc(o) + '</span></label>';
    });
    h += d.tipo === 'scala' ? '</div>' : '';
    if (d.altro) h += '<label class="campo sopra" for="' + d.id + '_altro">Se hai scelto «' + esc(d.altro) + '», scrivi quale</label><input type="text" id="' + d.id + '_altro" name="' + d.id + '_altro" maxlength="80" value="' + esc(altro || '') + '">';
    return h + '</fieldset>';
  }

  function raccogli(form, fase) {
    var out = {};
    S.domande.forEach(function (d) {
      if (d.solo && d.solo !== fase) return;
      if (d.tipo === 'testo') { var t = (form.elements[d.id].value || '').trim().slice(0, 300); if (t) out[d.id] = t; return; }
      if (d.tipo === 'multi') {
        var vals = Array.prototype.filter.call(form.querySelectorAll('input[name="' + d.id + '"]'), function (i) { return i.checked; }).map(function (i) { return i.value; });
        if (vals.length) out[d.id] = vals;
        if (d.altro) { var a = (form.elements[d.id + '_altro'].value || '').trim().slice(0, 80); if (a) out[d.id + '_altro'] = a; }
        return;
      }
      var r = form.querySelector('input[name="' + d.id + '"]:checked'); if (r) out[d.id] = r.value;
    });
    return out;
  }

  function scheda(fase) {
    var c = codiceCorrente();
    if (!codiceValido(c)) { location.hash = '#/'; return; }
    var rec = jget(K.rec(c, fase), null);
    var ris = (jget(K.bozza(c, fase), null) || (rec && rec.risposte) || {});
    var nome = fase === 'ingresso' ? "Scheda d'ingresso" : "Scheda d'uscita";
    var h = titolo(nome) + '<p class="nota">Codice: <strong>' + esc(c) + '</strong> · <a href="#/">cambia</a>. Rispondete solo a ciò che volete: la scheda si salva da sola mentre scrivete.</p>' +
      '<form id="scheda" novalidate>';
    S.domande.forEach(function (d) { if (!d.solo || d.solo === fase) h += campoDomanda(d, ris[d.id], ris[d.id + '_altro']); });
    h += '<p class="avviso"><strong>Attenzione:</strong> nelle risposte scritte non inserite nomi o dati di alunni o di colleghi.</p>';
    h += '<fieldset><legend>Invio al formatore (facoltativo)</legend>' +
      (C.ENDPOINT
        ? '<label class="opz"><input type="checkbox" name="consenso"' + (rec && rec.consenso ? ' checked' : '') + '> <span>Voglio inviare le mie risposte, in forma anonima, al formatore. Il formatore le usa per adattare il corso e per vedere cosa cambia. <a href="privacy.html" target="_blank" rel="noopener">Leggi come vengono trattate</a>.</span></label>'
        : '<p class="nota">L\'invio non è attivo: le risposte restano solo su questo dispositivo.</p>') +
      '</fieldset>';
    h += '<div class="trappola" aria-hidden="true"><label>Non compilare <input type="text" name="hp" tabindex="-1" autocomplete="off"></label></div>';
    h += '<button class="btn" type="submit">Salva la scheda</button><a class="btn secondario" href="#/">Torna all\'inizio</a></form>';
    mostra(h, nome);
    var form = document.getElementById('scheda');
    function salvaBozza() { jset(K.bozza(c, fase), raccogli(form, fase)); }
    form.addEventListener('input', salvaBozza); form.addEventListener('change', salvaBozza);
    Array.prototype.forEach.call(form.querySelectorAll('textarea'), function (ta) {
      var cont = ta.parentNode.querySelector('.contatore');
      function agg() { cont.textContent = ta.value.length + ' / 300'; } ta.addEventListener('input', agg); agg();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.hp && form.elements.hp.value) return;
      var risposte = raccogli(form, fase);
      var consenso = !!(form.elements.consenso && form.elements.consenso.checked) && !!C.ENDPOINT;
      var r = { v: S.versione, fase: fase, codice: c, risposte: risposte, ts: new Date().toISOString(), consenso: consenso, inviato: null };
      jset(K.rec(c, fase), r); togli(K.bozza(c, fase));
      if (consenso) { metti(c, fase); invia(c, fase).then(function (ok) { var el = document.getElementById('esito-invio'); if (el && ok) el.textContent = 'Inviata in forma anonima. Grazie.'; }); }
      location.hash = '#/grazie/' + fase;
    });
  }

  function testoValore(v) { return Array.isArray(v) ? v.join(', ') : (v == null || v === '' ? '—' : v); }
  function confronto(c) {
    var i = jget(K.rec(c, 'ingresso'), null), u = jget(K.rec(c, 'uscita'), null);
    if (!i || !u) return '<p class="nota">Per vedere il confronto compila anche la scheda d\'ingresso con lo stesso codice.</p>';
    var righe = '';
    S.domande.forEach(function (d) {
      if (d.tipo === 'testo') return;
      var a = testoValore(i.risposte[d.id]), b = testoValore(u.risposte[d.id]);
      var cambia = a !== b;
      righe += '<tr><th scope="row">' + esc(d.testo) + '</th><td>' + esc(a) + '</td><td>' + esc(b) + '</td><td class="' + (cambia ? 'cambiata' : '') + '">' + (cambia ? 'Cambiata' : 'Uguale') + '</td></tr>';
    });
    return '<h2>Cosa è cambiato</h2><div class="scorri"><table><caption class="sr-only">Confronto tra ingresso e uscita</caption><thead><tr><th scope="col">Domanda</th><th scope="col">Ingresso</th><th scope="col">Uscita</th><th scope="col">Esito</th></tr></thead><tbody>' + righe + '</tbody></table></div>';
  }

  function grazie(fase) {
    var c = codiceCorrente(); var rec = jget(K.rec(c, fase), null);
    var msg = !rec ? 'Nessuna scheda salvata.' : (rec.inviato ? 'Inviata in forma anonima. Grazie.' : (rec.consenso ? 'Salvata. L\'invio parte appena c\'è connessione.' : 'Salvata solo su questo dispositivo. Grazie.'));
    mostra(titolo('Grazie') + '<p id="esito-invio" class="riquadro" role="status">' + esc(msg) + '</p>' +
      (fase === 'uscita' ? confronto(c) : '<p>Conservate il vostro codice: <strong>' + esc(c) + '</strong>. Vi servirà alla fine del corso.</p>') +
      '<a class="btn" href="#/">Torna all\'inizio</a><a class="btn secondario" href="#/' + fase + '">Rivedi o modifica</a>', 'Grazie');
    annuncia(msg);
  }

  function dati() {
    var c = codiceCorrente();
    mostra(titolo('I miei dati') +
      '<p>Le schede sono salvate <strong>solo su questo dispositivo</strong>. Se hai scelto l\'invio anonimo, il formatore ne ha una copia, senza il tuo nome.</p>' +
      '<p>Codice: <strong>' + esc(c || '—') + '</strong></p>' +
      '<button class="btn secondario" id="esporta" type="button">Scarica le mie risposte (file)</button>' +
      '<button class="btn secondario" id="cancella" type="button">Cancella tutto da questo dispositivo</button>' +
      '<p class="nota">Per far cancellare anche la copia ricevuta dal formatore scrivi al contatto indicato nella pagina <a href="privacy.html">Privacy</a>, dicendo il tuo codice.</p>' +
      '<a class="btn" href="#/">Torna all\'inizio</a>', 'I miei dati');
    document.getElementById('esporta').addEventListener('click', function () {
      var tutto = { codice: c, ingresso: jget(K.rec(c, 'ingresso'), null), uscita: jget(K.rec(c, 'uscita'), null) };
      var blob = new Blob([JSON.stringify(tutto, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mie-risposte-' + (c || 'scheda') + '.json'; document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById('cancella').addEventListener('click', function () {
      if (!window.confirm('Cancellare codice e schede da questo dispositivo? Non si può annullare.')) return;
      try { Object.keys(window.localStorage).filter(function (k) { return k.indexOf('scheda:v1:') === 0; }).forEach(function (k) { window.localStorage.removeItem(k); }); } catch (e) {}
      memoria = {}; annuncia('Dati cancellati da questo dispositivo.'); location.hash = '#/'; home();
    });
  }

  function instrada() {
    var p = (location.hash || '#/').replace(/^#/, '').split('/').filter(Boolean);
    if (p[0] === 'ingresso' || p[0] === 'uscita') return scheda(p[0]);
    if (p[0] === 'grazie' && (p[1] === 'ingresso' || p[1] === 'uscita')) return grazie(p[1]);
    if (p[0] === 'dati') return dati();
    home();
  }

  /* ---------- installazione e offline ---------- */
  var promptInstalla = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstalla = e; var b = document.getElementById('installa'); b.hidden = false; });
  document.getElementById('installa').addEventListener('click', function () { if (promptInstalla) { promptInstalla.prompt(); promptInstalla = null; this.hidden = true; } });
  window.addEventListener('online', svuotaCoda);
  window.addEventListener('hashchange', instrada);
  if (C.CORSO) document.getElementById('nome-corso').textContent = C.CORSO;
  if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }); }
  instrada(); svuotaCoda();
})();
