// Système de design d'Archipel 2 : chaque valeur visuelle est définie une seule fois, ici.
// Les écrans s'en servent par des variables CSS (--ile-mots-fonce, --texte-titre, --esp-4…) ; les tests vérifient
// les contrastes. La finition est celle de l'« album illustré » : papier crème, bord sable, ombre posée chaude,
// lumière venue d'en haut à gauche, formes rondes. Voir docs/design/systeme-de-design.md.

export type IleId = "nombres" | "mots" | "port" | "enigmes" | "decouvertes" | "atelier" | "coeur";

// Quatre tons par île : clair (fonds), vif (la couleur que l'enfant connaît), foncé (texte ou fond d'un texte blanc,
// contraste d'au moins 4,5 pour 1) et ombre (bord et ombre posée des éléments pleins).
export interface Tons { clair: string; vif: string; fonce: string; ombre: string }

export const ILES: Record<IleId, Tons> = {
  nombres: { clair: "#D3E5FB", vif: "#3D8BEA", fonce: "#236EC5", ombre: "#1B4D89" },
  mots: { clair: "#FFE0D3", vif: "#FF7F50", fonce: "#BB4816", ombre: "#833414" },
  port: { clair: "#CFEFF1", vif: "#1FA9B5", fonce: "#12737B", ombre: "#0D5A60" },
  enigmes: { clair: "#E6DEFA", vif: "#8C6BE0", fonce: "#7959C6", ombre: "#543F8A" },
  decouvertes: { clair: "#D5F0E1", vif: "#34B37A", fonce: "#007D4B", ombre: "#005532" },
  atelier: { clair: "#FFEDC2", vif: "#FFC145", fonce: "#976100", ombre: "#694400" },
  coeur: { clair: "#FBD9E7", vif: "#E85D9A", fonce: "#BC3C77", ombre: "#852D54" },
};
export const ORDRE_ILES: IleId[] = ["nombres", "mots", "port", "enigmes", "decouvertes", "atelier", "coeur"];

export const NEUTRES = {
  creme: "#FFF7EA", // fond des écrans de l'enfant
  papier: "#FFFDF8", // cartes, bulles, ce qu'on lit
  surface: "#FFF8EC", // boutons et pastilles « album »
  sable: "#F3E7D3", // second plan, revers des rubans
  bord: "#E2CBA6", // bord des éléments album
  trait: "#E4D9C5", // séparations, contours discrets (v1)
  encre: "#273043", // texte principal
  encreDouce: "#4A5468", // texte secondaire
  blanc: "#FFFFFF",
  mer: "#BFE8EE",
  voile: "rgba(39, 48, 67, 0.45)", // derrière une fenêtre
} as const;

// Pastille « Plume conseille » : couleur de Plume (foncé du Port), éclairée en haut ; le blanc y reste à 4,6 pour 1.
export const CONSEIL = { haut: "#16808A", bas: ILES.port.fonce, bord: ILES.port.ombre } as const;

// Réponses : jamais de rouge. Juste : anneau vert et halo ; essai : le balancement suffit, aucune couleur d'erreur.
export const RETOURS = { juste: ILES.decouvertes.vif, justeHalo: "rgba(52, 179, 122, 0.28)", choisi: ILES.port.vif } as const;

// Unité d'écran : 1 u = 1 px sur l'écran de référence 1180 × 820 (iPad Air en paysage) ; l'iPad Pro 11 donne 1,01.
// En portrait, la référence devient 860 × 1180 (les écrans de la v1 font de même).
export const UNITE = "min(calc(100vw / 1180), calc(100vh / 820))";
export const UNITE_PORTRAIT = "min(calc(100vw / 860), calc(100vh / 1180))";
const u = (n: number, min: number) => `max(${min}px, calc(var(--u) * ${n}))`;

export const POLICES = {
  titre: "'Baloo 2', ui-rounded, 'Avenir Next', system-ui, sans-serif", // titres, étiquettes, chiffres
  lecture: "Andika, 'Avenir Next', ui-rounded, system-ui, sans-serif", // tout ce que l'enfant lit
  adulte: "Inter, system-ui, -apple-system, sans-serif", // espace parent, astuces pour l'adulte
} as const;

export interface Texte { police: keyof typeof POLICES; graisse: number; u: number; min: number; interligne: number }
export const TEXTES: Record<string, Texte> = {
  titreEcran: { police: "titre", graisse: 800, u: 56, min: 32, interligne: 1.05 },
  titre: { police: "titre", graisse: 800, u: 40, min: 26, interligne: 1.08 },
  sousTitre: { police: "titre", graisse: 700, u: 30, min: 20, interligne: 1.15 },
  etiquette: { police: "titre", graisse: 700, u: 22, min: 16, interligne: 1.15 },
  lectureGrande: { police: "lecture", graisse: 400, u: 104, min: 44, interligne: 1 },
  lecture: { police: "lecture", graisse: 400, u: 40, min: 24, interligne: 1.3 },
  bulle: { police: "lecture", graisse: 400, u: 28, min: 19, interligne: 1.3 },
  adulte: { police: "adulte", graisse: 400, u: 15, min: 15, interligne: 1.45 },
  adulteTitre: { police: "adulte", graisse: 700, u: 24, min: 22, interligne: 1.2 },
};

// Espacements : 4, 8, 12, 16, 24, 32, 48, 64 u, avec un minimum pour les petits écrans.
export const ESPACES = [4, 8, 12, 16, 24, 32, 48, 64] as const;
export const RAYONS = { petit: u(14, 10), moyen: u(22, 14), grand: u(32, 20), pilule: "999px" } as const;

// Ombres chaudes (brun du papier, jamais de gris froid) ; la lumière vient d'en haut à gauche.
export const OMBRES = {
  posee: "0 3px 0 rgba(122, 86, 50, 0.20)", // l'élément est posé sur la page (bouton, pastille, carte)
  douce: "0 3px 0 rgba(122, 86, 50, 0.14), 0 10px 24px rgba(122, 86, 50, 0.14)", // carte qui se détache
  haute: "0 18px 42px rgba(74, 52, 30, 0.24)", // fenêtre au-dessus de l'écran
  reflet: "inset 0 2px 0 rgba(255, 255, 255, 0.65)", // arête éclairée en haut
} as const;

// Mouvement : 200 à 400 ms, jamais de clignotement. Le personnage-guide est l'élément le plus calme de l'écran.
export const MOUVEMENTS = {
  appui: 120, court: 200, moyen: 300, long: 400, ecran: 350, // ms
  battementPlume: 1100, respiration: 3200, volPlume: 1200, // ms, mouvements d'ambiance lents (Plume vole vers la mission)
  courbes: {
    douce: "cubic-bezier(0.3, 0.7, 0.3, 1)", // arrivée qui ralentit
    rebond: "cubic-bezier(0.34, 1.4, 0.64, 1)", // léger dépassement, pour une réussite
    calme: "cubic-bezier(0.45, 0, 0.55, 1)", // aller-retour d'ambiance
  },
} as const;

// Cibles tactiles : au moins 1,5 cm sur l'iPad, en paysage comme en portrait (84 u ≈ 1,6 cm ; 1,5 cm = 78 px à
// 132 px par pouce), jamais moins de 58 px. « petit » (≈ 1,1 cm) est réservé aux actions de l'adulte.
export const CIBLES = { min: u(84, 58), bouton: u(86, 58), petit: u(56, 44) } as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
export const fontTexte = (t: Texte) => `${t.graisse} ${u(t.u, t.min)}/${t.interligne} ${POLICES[t.police]}`;

// Toutes les variables CSS du système, à poser une fois sur :root.
export function variablesCSS(): Record<string, string> {
  const v: Record<string, string> = { "--u": UNITE };
  for (const id of ORDRE_ILES) for (const [ton, c] of Object.entries(ILES[id])) v[`--ile-${id}-${ton}`] = c;
  for (const [k, c] of Object.entries(NEUTRES)) v[`--${kebab(k)}`] = c;
  v["--juste"] = RETOURS.juste;
  v["--juste-halo"] = RETOURS.justeHalo;
  for (const [k, p] of Object.entries(POLICES)) v[`--police-${k}`] = p;
  for (const [k, t] of Object.entries(TEXTES)) v[`--texte-${kebab(k)}`] = fontTexte(t);
  ESPACES.forEach((n, i) => { v[`--esp-${i + 1}`] = u(n, Math.max(2, Math.round(n * 0.6))); });
  for (const [k, r] of Object.entries(RAYONS)) v[`--rayon-${k}`] = r;
  for (const [k, o] of Object.entries(OMBRES)) v[`--ombre-${k}`] = o;
  for (const k of ["appui", "court", "moyen", "long", "ecran", "battementPlume", "respiration", "volPlume"] as const) v[`--duree-${kebab(k)}`] = `${MOUVEMENTS[k]}ms`;
  for (const [k, c] of Object.entries(MOUVEMENTS.courbes)) v[`--courbe-${k}`] = c;
  for (const [k, c] of Object.entries(CIBLES)) v[`--cible-${k}`] = c;
  return v;
}
export const cssVariables = () => `:root{${Object.entries(variablesCSS()).map(([k, val]) => `${k}:${val}`).join(";")}}`
  + `@media (orientation:portrait){:root{--u:${UNITE_PORTRAIT}}}`;

// ---------- Contraste (WCAG 2) : utilisé par les tests et par la vitrine ----------
const canal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => canal(parseInt(n.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Paires texte / fond utilisées par les composants : chacune doit atteindre 4,5 pour 1.
export function pairesDeTexte(): { nom: string; texte: string; fond: string }[] {
  const p: { nom: string; texte: string; fond: string }[] = [];
  for (const fond of ["creme", "papier", "surface", "sable"] as const) {
    p.push({ nom: `encre sur ${fond}`, texte: NEUTRES.encre, fond: NEUTRES[fond] });
    p.push({ nom: `encre douce sur ${fond}`, texte: NEUTRES.encreDouce, fond: NEUTRES[fond] });
  }
  p.push({ nom: "blanc sur la pastille conseillée (haut du dégradé)", texte: NEUTRES.blanc, fond: CONSEIL.haut });
  p.push({ nom: "foncé du Port sur le badge « Plume conseille »", texte: ILES.port.fonce, fond: NEUTRES.papier });
  for (const id of ORDRE_ILES) {
    const t = ILES[id];
    p.push({ nom: `blanc sur ${id} foncé`, texte: NEUTRES.blanc, fond: t.fonce });
    p.push({ nom: `${id} foncé sur crème`, texte: t.fonce, fond: NEUTRES.creme });
    p.push({ nom: `${id} foncé sur papier`, texte: t.fonce, fond: NEUTRES.papier });
    p.push({ nom: `encre sur ${id} clair`, texte: NEUTRES.encre, fond: t.clair });
  }
  return p;
}
