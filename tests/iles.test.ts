// Îles extensibles : chaque activité a son lieu, six emplacements par écran, quartiers au-delà, dessins présents.
import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { META } from "../src/activities/index";
import { CADRE, ECRANS_A_PART, EMPLACEMENTS_PAR_QUARTIER, ILES_V2, lieuDe, placer, verifier, versEcran } from "../src/iles";
import { DECORS_ILES, PERSONNAGES } from "../src/illustrations";

const root = join(import.meta.dir, "..");

test("chaque activité et chaque écran à part a un lieu, et un seul, sur la bonne île", () => {
  const attendus = [...META.map((m) => ({ id: m.id as string, ile: m.island })), ...Object.entries(ECRANS_A_PART).map(([id, ile]) => ({ id, ile }))];
  const places = Object.values(ILES_V2).flatMap((i) => i.quartiers.flatMap((q) => q.lieux.flatMap((l) => l.ids)));
  for (const a of attendus) {
    expect(places.filter((p) => p === a.id).length).toBe(1);
    expect(lieuDe(a.id)?.ile.id).toBe(a.ile as never);
  }
  // aucun lieu n'ouvre une activité inconnue
  expect(places.sort()).toEqual(attendus.map((a) => a.id).sort());
});

test("les lieux suivent la liste de l'écran de choix de la v1 (écrans à part compris)", () => {
  const src = readFileSync(join(root, "src/screens/child.ts"), "utf8");
  const aPart = [...src.matchAll(/\{ id: "(\w+)", island: "(\w+)"/g)].map((m) => [m[1], m[2]]);
  for (const [id, ile] of aPart) expect(lieuDe(id)?.ile.id).toBe(ile as never);
});

test("chaque île est valide : six emplacements par quartier, un lieu par emplacement au plus", () => {
  for (const ile of Object.values(ILES_V2)) {
    expect(verifier(ile)).toEqual([]);
    for (const q of ile.quartiers) expect(q.lieux.length).toBeLessThanOrEqual(EMPLACEMENTS_PAR_QUARTIER);
  }
});

test("au-delà de six lieux, l'île passe en quartiers sans rien redessiner", () => {
  let ile = ILES_V2.decouvertes;
  expect(ile.quartiers[0].lieux.length).toBe(5);
  ile = placer(ile, "nouvelle1");
  expect(ile.quartiers.length).toBe(1);
  expect(ile.quartiers[0].lieux.length).toBe(6);
  ile = placer(ile, "nouvelle2");
  expect(ile.quartiers.length).toBe(2);
  expect(ile.quartiers[1].lieux.map((l) => l.ids[0])).toEqual(["nouvelle2"]);
  expect(verifier(ile)).toEqual([]);
  // l'île d'origine n'a pas bougé
  expect(ILES_V2.decouvertes.quartiers[0].lieux.length).toBe(5);
});

test("l'île des Nombres est dessinée : décor, lieux, remplissages, tous présents et bien posés", () => {
  const d = DECORS_ILES.nombres;
  const q = ILES_V2.nombres.quartiers[0];
  expect(q.decor).toBe(d);
  expect(Object.keys(d.lieux).sort()).toEqual(["marche", "nenuphars", "partage"]);
  expect(Object.keys(d.remplissages).sort()).toEqual(["D", "E", "F"]);
  const images = [d.base, ...Object.values(d.lieux), ...Object.values(d.remplissages), ...Object.values(d.animes)];
  for (const im of images) {
    expect(existsSync(join(root, "public/illustrations", im.fichier))).toBe(true);
    const [x, y, l, h] = im.boite;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + l).toBeLessThanOrEqual(CADRE.l);
    expect(y + h).toBeLessThanOrEqual(CADRE.h);
  }
  // chaque lieu est dessiné autour de son emplacement, son étiquette juste en dessous
  for (const l of q.lieux) {
    const [x, y, w, h] = d.lieux[l.ids[0]].boite;
    const e = q.emplacements.find((p) => p.id === l.emplacement)!;
    expect(e.x).toBeGreaterThan(x);
    expect(e.x).toBeLessThan(x + w);
    expect(e.y).toBeGreaterThan(y);
    expect(e.y).toBeLessThan(y + h);
    expect(Math.abs(l.pastille.x - (x + w / 2))).toBeLessThan(w / 2);
    expect(l.pastille.y).toBeGreaterThan(e.y);
  }
  // les étiquettes ne se chevauchent pas (largeur d'une pastille : 260 px au plus)
  const p = q.lieux.map((l) => l.pastille);
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
    expect(Math.abs(p[i].x - p[j].x) > 260 || Math.abs(p[i].y - p[j].y) > 70).toBe(true);
  }
});

test("l'hôte de chaque île a ses dessins (cinq expressions et le salut)", () => {
  for (const ile of Object.values(ILES_V2)) {
    for (const v of ["content", "rieur", "surpris", "pensif", "doux", "salut"]) {
      const nom = ile.hote === "plume" ? null : `${ile.hote}-${v}`;
      if (nom) expect(PERSONNAGES[nom]?.fichier).toBe(`personnages/${nom}.webp`);
    }
  }
  for (const v of ["vol", "salut", "montre", "pense", "fete", "piece-aile-ar", "piece-corps", "piece-aile-av"]) {
    expect(existsSync(join(root, "public/illustrations", PERSONNAGES[`plume-${v}`].fichier))).toBe(true);
  }
  expect(PERSONNAGES["plume-piece-aile-av"].pivot).toBeDefined();
});

test("du repère des dessins à l'écran : l'image couvre l'écran, centrée", () => {
  expect(versEcran({ x: 0, y: 0 }, { l: 1194, h: 834 })).toEqual({ x: 0, y: 0 });
  const c = versEcran({ x: 597, y: 417 }, { l: 1180, h: 820 });
  expect(c.x).toBeCloseTo(590, 5);
  expect(c.y).toBeCloseTo(410, 5);
  // écran plus haut que large (portrait) : l'image est rognée sur les côtés, jamais en haut ni en bas
  const k = 1180 / 834;
  const g = versEcran({ x: 0, y: 0 }, { l: 820, h: 1180 });
  expect(g.y).toBeCloseTo(0, 5);
  expect(g.x).toBeCloseTo((820 - 1194 * k) / 2, 5);
});
