// Système de design : contrastes, couleurs d'îles inchangées, variables complètes, mouvements dans les repères.
import { expect, test } from "bun:test";
import { DOMAINS } from "../src/core";
import { ISLANDS } from "../src/art_static";
import { CSS_COMPOSANTS } from "../src/design/composants";
import { CIBLES, ILES, MOUVEMENTS, NEUTRES, ORDRE_ILES, POLICES, TEXTES, contraste, pairesDeTexte, variablesCSS } from "../src/design/jetons";

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

test("les mouvements d'interface durent de 120 à 400 ms ; seuls les mouvements d'ambiance sont plus lents", () => {
  for (const k of ["appui", "court", "moyen", "long", "ecran"] as const) {
    expect(MOUVEMENTS[k]).toBeGreaterThanOrEqual(120);
    expect(MOUVEMENTS[k]).toBeLessThanOrEqual(400);
  }
  // le battement d'ailes de Plume reste lent : plus d'une seconde par aller
  expect(MOUVEMENTS.battementPlume).toBeGreaterThanOrEqual(1000);
});

test("les cibles tactiles visent 1,5 cm sur l'iPad et jamais moins de 44 px", () => {
  expect(CIBLES.min).toBe("max(58px, calc(var(--u) * 80))");
  for (const c of Object.values(CIBLES)) expect(Number(/max\((\d+)px/.exec(c)![1])).toBeGreaterThanOrEqual(44);
});

test("les composants n'utilisent que des variables définies par le système", () => {
  const definies = new Set(Object.keys(variablesCSS()));
  const locales = new Set(["--accent", "--accent-fonce", "--accent-ombre", "--accent-clair"]);
  const utilisees = [...CSS_COMPOSANTS.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
  expect(utilisees.length).toBeGreaterThan(20);
  const inconnues = [...new Set(utilisees)].filter((v) => !definies.has(v) && !locales.has(v));
  expect(inconnues).toEqual([]);
  // jamais de rouge dans les composants (les erreurs ne sont pas signalées en rouge)
  expect(CSS_COMPOSANTS).not.toMatch(/#(E8504A|B42318|FF0000|D92D20)/i);
});

test("chaque île donne ses quatre variables CSS", () => {
  const v = variablesCSS();
  for (const id of ORDRE_ILES) for (const ton of ["clair", "vif", "fonce", "ombre"]) expect(v[`--ile-${id}-${ton}`]).toBe(ILES[id][ton as "vif"]);
  expect(v["--texte-titre"]).toContain("'Baloo 2'");
  expect(v["--esp-4"]).toBe("max(10px, calc(var(--u) * 16))");
});
