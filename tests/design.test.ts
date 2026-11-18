// Système de design : contrastes, couleurs d'îles inchangées, variables complètes, mouvements dans les repères.
import { expect, test } from "bun:test";
import { DOMAINS } from "../src/core";
import { ISLANDS } from "../src/art_static";
import { CSS_COMPOSANTS } from "../src/design/composants";
import { CIBLES, ILES, MOUVEMENTS, NEUTRES, ORDRE_ILES, POLICES, RETOURS, TEXTES, contraste, pairesDeTexte, variablesCSS } from "../src/design/jetons";

test("chaque texte atteint un contraste d'au moins 4,5 pour 1 sur son fond", () => {
  const faibles = pairesDeTexte().filter((p) => contraste(p.texte, p.fond) < 4.5).map((p) => `${p.nom} : ${contraste(p.texte, p.fond).toFixed(2)}`);
  expect(faibles).toEqual([]);
  // l'encre sur le crème reste au niveau de la v1 (environ 12 pour 1)
  expect(contraste(NEUTRES.encre, NEUTRES.creme)).toBeGreaterThan(12);
});

test("le calcul de contraste suit la norme (noir sur blanc : 21 pour 1)", () => {
  expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  expect(contraste("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
});

test("les couleurs d'îles sont celles que l'enfant connaît, en quatre tons", () => {
  expect(ORDRE_ILES.length).toBe(7);
  for (const isl of ISLANDS) {
    const t = ILES[isl.id as keyof typeof ILES];
    expect(t.vif).toBe(isl.color);
    expect(t.clair).toBe(isl.tint);
  }
  for (const d of DOMAINS) expect(ILES[d.island as keyof typeof ILES].vif).toBe(d.color);
  for (const id of ORDRE_ILES) {
    for (const c of Object.values(ILES[id])) expect(c).toMatch(/^#[0-9A-F]{6}$/);
    // du plus clair au plus sombre : clair, vif, foncé, ombre
    const L = (h: string) => contraste(h, "#000000");
    const t = ILES[id];
    expect(L(t.clair)).toBeGreaterThan(L(t.vif));
    expect(L(t.vif)).toBeGreaterThan(L(t.fonce));
    expect(L(t.fonce)).toBeGreaterThan(L(t.ombre));
  }
});

test("chaque police a son rôle : Andika pour lire, Baloo 2 pour les titres, Inter pour l'adulte", () => {
  expect(POLICES.lecture.startsWith("Andika")).toBe(true);
  expect(POLICES.titre.startsWith("'Baloo 2'")).toBe(true);
  expect(POLICES.adulte.startsWith("Inter")).toBe(true);
  for (const [nom, t] of Object.entries(TEXTES)) {
    if (nom.startsWith("lecture") || nom === "bulle") expect(t.police).toBe("lecture");
    expect(t.min).toBeGreaterThanOrEqual(12);
  }
});

// L'appui (120 ms) est l'écho immédiat du doigt, comme dans la v1 ; les animations de l'interface durent de 200 à 400 ms.
test("les mouvements d'interface durent de 200 à 400 ms (120 ms pour l'écho d'un appui) ; seuls ceux d'ambiance sont plus lents", () => {
  expect(MOUVEMENTS.appui).toBe(120);
  for (const k of ["court", "moyen", "long", "ecran"] as const) expect(MOUVEMENTS[k]).toBeGreaterThanOrEqual(200);
  for (const k of ["appui", "court", "moyen", "long", "ecran"] as const) {
    expect(MOUVEMENTS[k]).toBeGreaterThanOrEqual(120);
    expect(MOUVEMENTS[k]).toBeLessThanOrEqual(400);
  }
  // le battement d'ailes de Plume reste lent : plus d'une seconde par aller
  expect(MOUVEMENTS.battementPlume).toBeGreaterThanOrEqual(1000);
});

test("les cibles tactiles visent 1,5 cm sur l'iPad, en paysage comme en portrait, et jamais moins de 44 px", () => {
  expect(CIBLES.min).toBe("max(58px, calc(var(--u) * 84))");
  // 1,5 cm à 132 px par pouce = 78 px ; en portrait sur l'iPad Pro 11, 1 u = 834 / 860 px
  expect(84 * (834 / 860)).toBeGreaterThan(78);
  for (const c of Object.values(CIBLES)) expect(Number(/max\((\d+)px/.exec(c)![1])).toBeGreaterThanOrEqual(44);
});

test("les composants n'utilisent que des variables définies par le système", () => {
  const definies = new Set(Object.keys(variablesCSS()));
  const locales = new Set(["--accent", "--accent-fonce", "--accent-ombre", "--accent-clair"]);
  const utilisees = [...CSS_COMPOSANTS.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
  expect(utilisees.length).toBeGreaterThan(20);
  const inconnues = [...new Set(utilisees)].filter((v) => !definies.has(v) && !locales.has(v));
  expect(inconnues).toEqual([]);
  // jamais de rouge dans les composants (les erreurs ne sont pas signalées en rouge) : aucune couleur écrite dans leur
  // style ni dans les retours n'a la teinte d'un rouge (345° à 15°) bien saturé
  const couleurs = [...CSS_COMPOSANTS.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0]).concat(Object.values(RETOURS).filter((c) => c.startsWith("#")));
  expect(couleurs.length).toBeGreaterThan(5);
  expect(couleurs.filter(estRouge)).toEqual([]);
  expect(estRouge("#E8504A")).toBe(true);
  expect(estRouge("#FF0000")).toBe(true);
  expect(estRouge(ILES.coeur.vif)).toBe(false);
});

function estRouge(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return false;
  const sat = d / (1 - Math.abs(2 * l - 1));
  let teinte = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  teinte = (teinte * 60 + 360) % 360;
  return (teinte >= 345 || teinte <= 15) && sat > 0.45 && l > 0.2 && l < 0.8;
}

test("chaque île donne ses quatre variables CSS", () => {
  const v = variablesCSS();
  for (const id of ORDRE_ILES) for (const ton of ["clair", "vif", "fonce", "ombre"]) expect(v[`--ile-${id}-${ton}`]).toBe(ILES[id][ton as "vif"]);
  expect(v["--texte-titre"]).toContain("'Baloo 2'");
  expect(v["--esp-4"]).toBe("max(10px, calc(var(--u) * 16))");
});
