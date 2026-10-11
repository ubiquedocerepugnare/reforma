// Service worker da página "Reforma": guarda uma cópia para abrir sem internet.
// Só trata dos ficheiros "reforma*"; o resto do sítio (aulas, etc.) não é afetado.
var CACHE = "reforma-v1";
var FICHEIROS = [
  "reforma.html",
  "reforma.webmanifest",
  "reforma-192.png",
  "reforma-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FICHEIROS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.map(function (n) {
        if (n.indexOf("reforma-") === 0 && n !== CACHE) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  var nome = url.pathname.split("/").pop();
  if (FICHEIROS.indexOf(nome) === -1) return;

  // Com internet: vai buscar a versão mais recente e atualiza a cópia.
  // Sem internet: usa a cópia guardada.
  e.respondWith(
    fetch(e.request).then(function (resposta) {
      if (resposta.ok) {
        var copia = resposta.clone();
        caches.open(CACHE).then(function (c) { c.put(nome, copia); });
      }
      return resposta;
    }).catch(function () {
      return caches.match(nome);
    })
  );
});
