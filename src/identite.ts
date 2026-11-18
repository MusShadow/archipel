// Identité d'Archipel 2. Les deux applis vivent sur le même site (musshadow.github.io/archipel/ et …/archipel/v2/)
// et partagent donc le stockage du navigateur : la v2 a ses propres clés et ses propres caches, et n'écrit jamais
// dans ceux de la v1 (« archipel.… » et « archipel-… »). Elle lit seulement archipel.v1, quand on le lui demande,
// pour reprendre les progrès de la v1 sur un appareil où le stockage est partagé (Safari, ordinateur, Android).
export const NOM_APPLI = "Archipel 2";
export const CLES = {
  donnees: "archipel2.donnees",
  voix: "archipel2.voix",
  cleApi: "archipel2.cleapi",
  dessins: (pid: string) => `archipel2.dessins.${pid}`,
} as const;
export const CACHE_VOIX = "archipel2-voix";          // même nom dans src/sw.js
export const PREFIXE_CACHES = "archipel2-";          // le service worker de la v2 ne nettoie que ceux-là
export const CLE_V1 = "archipel.v1";                 // lecture seule
