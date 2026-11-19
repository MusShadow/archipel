// Compagnons de voyage (livraison 2) : chaque enfant a un bébé animal, coiffé d'un chapeau d'explorateur de sa couleur.
// Aucun n'est un hôte des îles. Rien n'est envoyé : le choix est rangé avec le profil, sur l'appareil.
export const COMPAGNONS = ["renard", "lapin", "ourson", "chaton", "panda", "lionceau", "pingouin", "elephant"] as const;
export type Compagnon = (typeof COMPAGNONS)[number];
export const NOM_COMPAGNON: Record<Compagnon, string> = {
  renard: "le petit renard", lapin: "le petit lapin", ourson: "l'ourson", chaton: "le chaton",
  panda: "le petit panda", lionceau: "le lionceau", pingouin: "le petit pingouin", elephant: "le petit éléphant",
};
export const estCompagnon = (x: unknown): x is Compagnon => typeof x === "string" && (COMPAGNONS as readonly string[]).includes(x);

// Couleurs de profil (celles des îles) et chapeau correspondant ; une couleur inconnue prend le chapeau le plus proche.
export const CHAPEAUX: Record<string, string> = {
  "#FFC145": "jaune", "#FF7F50": "corail", "#E85D9A": "rose", "#8C6BE0": "violet", "#3D8BEA": "bleu", "#1FA9B5": "turquoise", "#34B37A": "vert",
};
export function chapeauDe(couleur: string): string {
  const c = couleur.toUpperCase();
  if (CHAPEAUX[c]) return CHAPEAUX[c];
  const rgb = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) || 0);
  const [r, g, b] = rgb(/^#[0-9A-F]{6}$/.test(c) ? c : "#FFC145");
  let best = "jaune", d = Infinity;
  for (const [k, v] of Object.entries(CHAPEAUX)) {
    const [r2, g2, b2] = rgb(k);
    const e = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (e < d) { d = e; best = v; }
  }
  return best;
}

// Premier compagnon libre (pour un nouveau profil) ; les profils d'avant la livraison 2 en reçoivent un, toujours le
// même pour un profil donné, sans doublon tant qu'il en reste.
export function compagnonLibre(pris: Iterable<string | undefined>, depart = 0): Compagnon {
  const p = new Set(pris);
  for (let k = 0; k < COMPAGNONS.length; k++) { const c = COMPAGNONS[(depart + k) % COMPAGNONS.length]; if (!p.has(c)) return c; }
  return COMPAGNONS[depart % COMPAGNONS.length];
}
export function attribuerCompagnons(profils: { id: string; avatar?: string }[]) {
  const pris = new Set<string>(profils.map((p) => p.avatar).filter(estCompagnon));
  for (const p of profils) {
    if (estCompagnon(p.avatar)) continue;
    let h = 0;
    for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    p.avatar = compagnonLibre(pris, h % COMPAGNONS.length);
    pris.add(p.avatar);
  }
}
