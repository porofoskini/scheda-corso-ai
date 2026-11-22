# Scheda d'ingresso e d'uscita · PWA del corso

App statica (HTML/CSS/JS, nessuna dipendenza, nessuna libreria esterna). Funziona offline dopo la prima apertura, si installa sul telefono, ha le stesse 15 domande della scheda cartacea. Le risposte restano sul dispositivo; l'invio anonimo al formatore è **facoltativo** e va attivato.

## Stato
- Provata: compilazione, salvataggio, confronto ingresso/uscita, schermo 390 px (browser desktop, da file).
- **Non provata:** service worker/offline e installazione (servono https), invio vero al foglio, lettori di schermo, telefoni reali.

## Passo 1 · Raccolta anonima (Google Apps Script) — lo fa il formatore
1. Crea un Foglio Google nuovo (es. «Schede corso»), menu Estensioni → Apps Script.
2. Incolla `apps_script/Codice.gs`, salva.
3. Distribuisci → Nuova distribuzione → tipo «App web»; esegui come **te**; chi ha accesso: **Chiunque**. Autorizza.
4. Copia l'URL che finisce con `/exec` in `config.js` → `ENDPOINT`.
5. Il foglio riceve una riga per scheda (fase, codice, JSON delle risposte). L'invio usa `no-cors`: l'app non vede l'esito, quindi «Inviata» significa «richiesta partita». **Controlla il foglio con una scheda di prova.**

## Passo 2 · Compila `config.js`
`TITOLARE`, `CONTATTO`, `GIORNI_CONSERVAZIONE`. Compaiono nella pagina Privacy. Prima dell'uso fai verificare il testo privacy con la scuola (i testi liberi possono contenere dati personali; l'app avvisa di non scrivere nomi).

## Passo 3 · Pubblica (GitHub Pages)
1. Crea un repository (anche pubblico: il codice non contiene dati; `ENDPOINT` sì, è un URL che accetta solo POST in quel formato).
2. Carica **il contenuto di questa cartella** (non la cartella stessa) nella radice, escludi `README.md` se vuoi.
3. Settings → Pages → «Deploy from a branch» → `main` / `(root)`.
4. L'indirizzo sarà `https://<utente>.github.io/<repo>/`. Fai un QR code e mettilo nella prima slide.
5. A ogni modifica ai file cambia `VERSIONE` in `sw.js`, altrimenti i telefoni tengono la copia vecchia.

## Provare in locale
`python3 -m http.server 8000` dentro la cartella, poi http://localhost:8000 (il service worker funziona su localhost).

## Da sapere
- Il codice (soprannome) non è un'identità: chi lo condivide o lo dimentica perde il confronto. Si può reinserire.
- Sullo stesso dispositivo più persone condividono i dati: dire di usare il proprio telefono o «I miei dati → Cancella».
- Ogni modifica alle domande va fatta in `domande.js`; se cambi gli id, aggiorna `versione`.
- Cancellazione dei dati ricevuti: a mano dal foglio, o `cancellaVecchie(90)` in Apps Script.
