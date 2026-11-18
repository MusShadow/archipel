// Service worker d'Archipel 2 (version __VERSION__) : garde l'appli disponible sans Internet.
// Le code de l'appli passe d'abord par le réseau (pour recevoir les mises à jour), sinon par la copie gardée.
// La voix naturelle de Plume (index et paquets audio, noms à empreinte) est gardée à part, d'une version à l'autre :
// seuls les fichiers nouveaux sont téléchargés. Les polices sont embarquées et gardées de même : aucun appel extérieur.
const CACHE = "archipel2-__VERSION__";
const VOIX = "archipel2-voix";
// Illustrations et imagier : adresses à empreinte (?v=…), gardées à part d'une version à l'autre, comme la voix.
const IMAGES = "archipel2-images";
const IMAGES_FILES = __IMAGES_FILES__;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
// Polices (adresses à empreinte) : l'alphabet latin est gardé dès l'installation ; les variantes « latin-ext », rares,
// au premier usage. Toutes restent dans leur cache d'une version à l'autre.
const POLICES_CACHE = "archipel2-polices";
const POLICES = __POLICES__;
const POLICES_TOUTES = __POLICES_TOUTES__;
const VOIX_FILES = __VOIX_FILES__;

// Garde les fichiers qui manquent, six à la fois.
const keepAll = async (name, files) => {
  const cache = await caches.open(name);
  const missing = [];
  for (const f of files) if (!(await cache.match(f))) missing.push(f);
  for (let i = 0; i < missing.length; i += 6) {
    await Promise.all(missing.slice(i, i + 6).map(async (f) => {
      const response = await fetch(f);
      if (response.ok) await cache.put(f, response);
    }));
  }
};
const keepVoice = () => keepAll(VOIX, VOIX_FILES);
const keepImages = () => keepAll(IMAGES, IMAGES_FILES);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE))
      .then(() => keepAll(POLICES_CACHE, POLICES))
      .then(() => keepVoice().catch(() => { /* la voix sera gardée au fil des écoutes */ }))
      .then(() => keepImages().catch(() => { /* les images seront gardées au fil de l'affichage */ }))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const wanted = new Set([...VOIX_FILES, ...IMAGES_FILES, ...POLICES_TOUTES].map((f) => new URL(f, self.location).href));
  const prune = (name) => caches.open(name).then((cache) => cache.keys().then((reqs) => Promise.all(reqs.filter((r) => !wanted.has(r.url)).map((r) => cache.delete(r)))));
  const kept = new Set([CACHE, VOIX, IMAGES, POLICES_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("archipel2-") && !kept.has(k)).map((k) => caches.delete(k))))
      .then(() => Promise.all([prune(VOIX), prune(IMAGES), prune(POLICES_CACHE)]))
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
    // Voix, images et polices : fichiers qui ne changent jamais (leur adresse change avec leur contenu) → copie gardée d'abord.
    const fixe = url.pathname.includes("/voix/") ? VOIX
      : url.pathname.includes("/illustrations/") || url.pathname.includes("/imagier/") ? IMAGES
      : url.pathname.includes("/polices/") ? POLICES_CACHE : null;
    if (fixe) {
      event.respondWith(caches.open(fixe).then((cache) => cache.match(request).then((hit) => hit || fetch(request).then((response) => {
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
  }
});
