// Îles extensibles : chaque activité a son lieu, six emplacements par écran, quartiers au-delà, dessins présents.
import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { META } from "../src/activities/index";
import { CADRE, ECRANS_A_PART, EMPLACEMENTS_PAR_QUARTIER, echelle, ilesV2, lieuDe, placer, verifier, versEcran } from "../src/iles";

const ILES_V2 = ilesV2();
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
  // les étiquettes ne se chevauchent pas : largeur estimée large (14 px par lettre et 60 px de marges), hauteur 82 px
  // avec la zone de toucher (le test de la vitrine mesure les vraies boîtes)
  const titres: Record<string, string> = { marche: "Le marché de Basile", nenuphars: "Les nénuphars", partage: "Le partage du goûter" };
  const boites = q.lieux.map((l) => { const w = titres[l.ids[0]].length * 14 + 60; return { x0: l.pastille.x - w / 2, x1: l.pastille.x + w / 2, y0: l.pastille.y - 41, y1: l.pastille.y + 41 }; });
  for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
    const a = boites[i], b = boites[j];
    expect(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0).toBe(true);
  }
  for (const b of boites) { expect(b.x0).toBeGreaterThan(0); expect(b.x1).toBeLessThan(CADRE.l); expect(b.y1).toBeLessThan(CADRE.h); }
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

test("du repère des dessins à l'écran : l'iPad en paysage est couvert, les autres écrans gardent les lieux visibles", () => {
  expect(versEcran({ x: 0, y: 0 }, { l: 1194, h: 834 })).toEqual({ x: 0, y: 0 });
  expect(echelle({ l: 1194, h: 834 })).toBe(1);
  const c = versEcran({ x: 597, y: 417 }, { l: 1180, h: 820 });
  expect(c.x).toBeCloseTo(590, 5);
  expect(c.y).toBeCloseTo(410, 5);
  // iPad Air en paysage : couvert aussi (rognage minime)
  expect(echelle({ l: 1180, h: 820 })).toBeCloseTo(Math.max(1180 / 1194, 820 / 834), 6);
  // en portrait, et sur un téléphone en paysage : chaque lieu et chaque étiquette de l'île des Nombres reste à l'écran
  // iPad Pro 11 récent (1210 x 834), iPad Air en portrait, iPad Pro 11 en portrait, téléphone en paysage, iPad 13
  for (const ecran of [{ l: 1210, h: 834 }, { l: 820, h: 1180 }, { l: 834, h: 1194 }, { l: 932, h: 430 }, { l: 1366, h: 1024 }]) {
    const q = ILES_V2.nombres.quartiers[0];
    for (const l of q.lieux) {
      const [x, y, w, h] = q.decor!.lieux[l.ids[0]].boite;
      for (const p of [{ x, y }, { x: x + w, y: y + h }, l.pastille]) {
        const e = versEcran(p, ecran);
        expect(e.x).toBeGreaterThanOrEqual(-1);
        expect(e.x).toBeLessThanOrEqual(ecran.l + 1);
        expect(e.y).toBeGreaterThanOrEqual(-1);
        expect(e.y).toBeLessThanOrEqual(ecran.h + 1);
      }
    }
  }
});
