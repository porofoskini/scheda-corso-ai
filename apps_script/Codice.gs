/**
 * Raccolta anonima delle schede. Da incollare in Google Apps Script (vedi README.md, passo 1).
 * Salva una riga per scheda in un foglio Google. Non registra IP né account.
 */
var ID_FOGLIO = '17dh1HIVWBuHCR7Sfp9f_LOaSzOTA7ITBmcjD-2pD5k8';   // foglio che riceve le schede
var NOME_FOGLIO = 'Risposte';
var INTESTAZIONE = ['ricevuta', 'fase', 'codice', 'versione', 'risposte_json'];

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.hp) { return risposta_(); }                         // trappola per i bot
  var fase = String(p.fase || '');
  var codice = String(p.codice || '').toUpperCase();
  if (['ingresso', 'uscita'].indexOf(fase) < 0 || !/^[A-Z0-9-]{3,20}$/.test(codice)) { return risposta_(); }
  var json = String(p.risposte || '');
  if (json.length > 8000) { return risposta_(); }
  try { JSON.parse(json); } catch (err) { return risposta_(); }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var f = SpreadsheetApp.openById(ID_FOGLIO).getSheetByName(NOME_FOGLIO) || SpreadsheetApp.openById(ID_FOGLIO).insertSheet(NOME_FOGLIO);
    if (f.getLastRow() === 0) { f.appendRow(INTESTAZIONE); }
    f.appendRow([new Date(), fase, "'" + codice, String(p.v || ''), "'" + json]);   // l'apice impedisce l'esecuzione di formule
  } finally { lock.releaseLock(); }
  return risposta_();
}

function doGet() { return ContentService.createTextOutput('ok'); }
function risposta_() { return ContentService.createTextOutput('ok'); }

/** Facoltativo: da eseguire a mano dopo il corso per cancellare le righe più vecchie di N giorni. */
function cancellaVecchie(giorni) {
  var f = SpreadsheetApp.openById(ID_FOGLIO).getSheetByName(NOME_FOGLIO); if (!f) return;
  var limite = new Date(Date.now() - (giorni || 90) * 86400000);
  var v = f.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) { if (v[i][0] instanceof Date && v[i][0] < limite) { f.deleteRow(i + 1); } }
}

/**
 * Riepilogo leggibile: esegui questa funzione dall'editor (Esegui) quando vuoi i numeri.
 * Crea/aggiorna il foglio «Riepilogo»: quante schede, e per ogni domanda quante persone hanno scelto ogni risposta,
 * poi i testi liberi. Se lo stesso codice ha inviato più volte la stessa fase, conta l'ultima.
 */
var TESTI = { q1: 'Insegno in', q2: 'Uso strumenti di IA', q3: 'Quali strumenti', q4: 'Per che cosa', q5: 'Quando ricevo una risposta', q6: 'Con gli alunni',
  q7: 'Dati di alunni inseriti in un servizio IA', q8: 'Chatbot vs agente', q9a: 'Fiducia (1-5)', q9b: 'Preoccupazione (1-5)',
  q10: 'Mi aspetto dal corso', q11: 'Mi preoccupa', q12: 'Per seguire meglio mi serve', q13: 'Che cosa è cambiato', q14: 'Proverò', q15: 'Domanda a casa' };
var LIBERE = ['q10', 'q11', 'q12', 'q13', 'q14', 'q15'];

function riepilogo() {
  var ss = SpreadsheetApp.openById(ID_FOGLIO);
  var src = ss.getSheetByName(NOME_FOGLIO); if (!src) { return; }
  var righe = src.getDataRange().getValues(), ultime = {};
  for (var i = 1; i < righe.length; i++) { ultime[righe[i][1] + '|' + String(righe[i][2])] = righe[i]; }   // ultima per fase+codice
  var conta = {}, libere = [], schede = { ingresso: 0, uscita: 0 };
  Object.keys(ultime).forEach(function (k) {
    var r = ultime[k], fase = r[1], o;
    try { o = JSON.parse(String(r[4]).replace(/^'/, '')); } catch (e) { return; }
    schede[fase] = (schede[fase] || 0) + 1;
    Object.keys(o).forEach(function (q) {
      if (q.slice(-6) === '_altro') { libere.push([fase, 'Altro (' + (TESTI[q.slice(0, -6)] || q) + ')', o[q]]); return; }
      if (LIBERE.indexOf(q) >= 0) { libere.push([fase, TESTI[q] || q, o[q]]); return; }
      [].concat(o[q]).forEach(function (v) { var c = fase + '|' + q + '|' + v; conta[c] = (conta[c] || 0) + 1; });
    });
  });
  var out = ss.getSheetByName('Riepilogo') || ss.insertSheet('Riepilogo'); out.clear();
  var tab = [['Schede ricevute (una per codice e fase)', '', '', ''], ['ingresso', schede.ingresso, '', ''], ['uscita', schede.uscita, '', ''], ['', '', '', ''], ['Fase', 'Domanda', 'Risposta', 'Quante']];
  Object.keys(conta).sort().forEach(function (c) { var a = c.split('|'); tab.push([a[0], TESTI[a[1]] || a[1], "'" + a[2], conta[c]]); });
  tab.push(['', '', '', ''], ['Fase', 'Testi liberi', '', '']);
  libere.forEach(function (l) { tab.push([l[0], l[1], "'" + l[2], '']); });
  out.getRange(1, 1, tab.length, 4).setValues(tab);
}
