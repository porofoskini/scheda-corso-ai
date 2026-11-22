/* Service worker: precache dei file statici, mai delle richieste di invio. Cambia VERSIONE a ogni pubblicazione. */
var VERSIONE = 'scheda-v2';
var FILE = ['./', 'index.html', 'privacy.html', 'style.css', 'app.js', 'config.js', 'domande.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSIONE).then(function (c) { return c.addAll(FILE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== VERSIONE; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) { var copia = res.clone(); caches.open(VERSIONE).then(function (c) { c.put(r, copia); }); return res; }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('index.html'); }); }));
});
