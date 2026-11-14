// Service worker d'Archipel (version e794627f7e) : garde l'appli disponible sans Internet.
// Le code de l'appli passe d'abord par le réseau (pour recevoir les mises à jour), sinon par la copie gardée.
const CACHE = "archipel-e794627f7e";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("archipel-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const keep = (request, response) => {
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy));
  return response;
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => (response.ok ? keep(request, response) : response))
        .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html"))),
    );
    return;
  }
  // Polices d'écriture : une fois téléchargées, elles restent disponibles hors ligne.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => keep(request, response))));
  }
});
