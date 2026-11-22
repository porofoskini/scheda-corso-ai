/**
 * Raccolta anonima delle schede. Da incollare in Google Apps Script (vedi README.md, passo 1).
 * Salva una riga per scheda in un foglio Google. Non registra IP né account.
 */
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
    var f = SpreadsheetApp.getActive().getSheetByName(NOME_FOGLIO) || SpreadsheetApp.getActive().insertSheet(NOME_FOGLIO);
    if (f.getLastRow() === 0) { f.appendRow(INTESTAZIONE); }
    f.appendRow([new Date(), fase, "'" + codice, String(p.v || ''), "'" + json]);   // l'apice impedisce l'esecuzione di formule
  } finally { lock.releaseLock(); }
  return risposta_();
}

function doGet() { return ContentService.createTextOutput('ok'); }
function risposta_() { return ContentService.createTextOutput('ok'); }

/** Facoltativo: da eseguire a mano dopo il corso per cancellare le righe più vecchie di N giorni. */
function cancellaVecchie(giorni) {
  var f = SpreadsheetApp.getActive().getSheetByName(NOME_FOGLIO); if (!f) return;
  var limite = new Date(Date.now() - (giorni || 90) * 86400000);
  var v = f.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) { if (v[i][0] instanceof Date && v[i][0] < limite) { f.deleteRow(i + 1); } }
}
