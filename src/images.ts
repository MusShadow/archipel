// Adresse des images embarquées (atelier d'illustration, imagier) : chaque adresse porte l'empreinte du fichier,
// calculée à la construction (scripts/build.ts). Le service worker garde ces images hors ligne, d'une version à l'autre.
declare const __IMAGES__: Record<string, string>;
const EMPREINTES: Record<string, string> = typeof __IMAGES__ !== "undefined" ? __IMAGES__ : {};

export function urlImage(chemin: string): string {
  const v = EMPREINTES[chemin];
  return v ? `${chemin}?v=${v}` : chemin;
}
export const imageConnue = (chemin: string) => chemin in EMPREINTES;
