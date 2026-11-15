// Service worker d'Archipel (version d23fc367ed) : garde l'appli disponible sans Internet.
// Le code de l'appli passe d'abord par le réseau (pour recevoir les mises à jour), sinon par la copie gardée.
// La voix naturelle de Plume (index et paquets audio, noms à empreinte) est gardée à part, d'une version à l'autre :
// seuls les fichiers nouveaux sont téléchargés.
const CACHE = "archipel-d23fc367ed";
const VOIX = "archipel-voix";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
const VOIX_FILES = ["./voix/atelier-2cb7735a18.mp3","./voix/coeur-67a3be792e.mp3","./voix/commun-3568ee742c.mp3","./voix/decouvertes-228113ee3a.mp3","./voix/enigmes-4ede5c03ce.mp3","./voix/index-97032287d4.json","./voix/mots-9f4a01bc0e.mp3","./voix/nombres-c202f2b603.mp3","./voix/port-23b9ff1e5c.mp3"];

const keepVoice = async () => {
  const cache = await caches.open(VOIX);
  for (const f of VOIX_FILES) {
    if (await cache.match(f)) continue;
    const response = await fetch(f);
    if (response.ok) await cache.put(f, response);
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE))
      .then(() => keepVoice().catch(() => { /* la voix sera gardée au fil des écoutes */ }))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const wanted = new Set(VOIX_FILES.map((f) => new URL(f, self.location).href));
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("archipel-") && k !== CACHE && k !== VOIX).map((k) => caches.delete(k))))
      .then(() => caches.open(VOIX))
      .then((cache) => cache.keys().then((reqs) => Promise.all(reqs.filter((r) => !wanted.has(r.url)).map((r) => cache.delete(r)))))
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
    // Voix : fichiers qui ne changent jamais (leur nom change à chaque nouvelle version) → copie gardée d'abord.
    if (url.pathname.includes("/voix/")) {
      event.respondWith(caches.open(VOIX).then((cache) => cache.match(request).then((hit) => hit || fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }))));
      return;
    }
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
