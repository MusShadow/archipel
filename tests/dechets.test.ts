import { describe, expect, test } from "bun:test";
import { createProfile } from "../src/app";
import { _dechetsData, CAMION_TXT, INTROS, MATIERE, PICK_HINT3, dechets, ordreItem, pickHint4, tapisGoes, tapisShow, vieItem, voiceLines, type DechetsItem } from "../src/activities/dechets";
import { DART } from "../src/activities/dechets_art";
import { binsFor } from "../src/activities/tri";
import { TART } from "../src/activities/tri_art";
import { knownSet } from "../src/content";
import { SKILL_BY_ID, makeRng } from "../src/core";
import type { Ctx } from "../src/host";
import type { TriSettings } from "../src/services";

const { byLevel, voyages, SOURCES, PRODUCTS, PLACES, ROUTE_TO, AILLEURS_Q, MOINS_Q } = _dechetsData;
const p = createProfile({ name: "E", ageMonths: 54, color: "#FFC145", readingK: 5, countTo: 20, flags: 0 });
const ctx: Ctx = { profile: p, rng: makeRng(31), known: knownSet(5), now: Date.now() };
const SETTINGS: TriSettings[] = [];
for (const papiers of ["jaune", "bleu"] as const) for (const cuisine of ["marron", "compost"] as const) for (const couleurs of ["nationales", "paris"] as const)
  SETTINGS.push({ papiers, cuisine, couleurs });
const spoken = new Set(voiceLines().map((x) => x.text));
const items: DechetsItem[] = [];
for (let level = 1; level <= dechets.maxLevel; level++) for (let n = 0; n < 300; n++) items.push(dechets.generate(level, ctx));
// Tous les réglages des poubelles, tous les niveaux.
const r0 = makeRng(9);
const all: DechetsItem[] = [...items];
for (const s of SETTINGS) for (let lv = 1; lv <= 6; lv++) for (let n = 0; n < 120; n++) all.push(byLevel(lv, r0, s));

describe("le voyage des déchets", () => {
  test("chaque image existe, chaque mauvaise réponse a son explication", () => {
    for (const it of all) {
      if (it.kind === "camion" || it.kind === "tapis") continue;
      expect(it.choices).toContain(it.target);
      expect(new Set(it.choices).size).toBe(it.choices.length);
      for (const c of it.choices) {
        const art = it.opts[c].art;
        expect(art.startsWith("bac_") || !!DART[art] || !!TART[art] || /\p{Extended_Pictographic}/u.test(art)).toBe(true);
        if (c !== it.target) expect(it.retry[c]).toBeTruthy();
      }
      for (const x of it.scene) if (x !== "?") expect(x.startsWith("bac_") || !!DART[x] || !!TART[x]).toBe(true);
    }
  });

  test("chaque camion va au bon endroit", () => {
    expect(ROUTE_TO).toEqual({ jaune: "centre_tri", bleu: "centre_tri", verre: "verrerie", cuisine: "compost", reste: "usine_chaleur" });
    for (const it of all.filter((x) => x.kind === "route")) {
      const bin = it.key.slice("route:".length);
      expect(it.target).toBe(ROUTE_TO[bin]);
      for (const c of it.choices) expect(PLACES[c]).toBeDefined();
    }
  });

  test("le camion n'emporte jamais le composteur", () => {
    for (const it of all.filter((x) => x.kind === "camion")) expect(it.bin).toBeDefined();
    const r = makeRng(4);
    const { camionItem } = require("../src/activities/dechets");
    for (let n = 0; n < 200; n++) expect(camionItem(r, { papiers: "jaune", cuisine: "compost", couleurs: "nationales" }).bin).not.toBe("cuisine");
  });

  test("le centre de tri : une caisse par matière, chaque caisse sert", () => {
    for (const it of all.filter((x) => x.kind === "tapis")) {
      expect(it.things!.length).toBe(4);
      expect(new Set(Object.values(it.answers!))).toEqual(new Set(["plastique", "metal", "papier"]));
      for (const id of it.things!) expect(it.answers![id]).toBe(MATIERE[id].crate);
    }
  });

  test("une nouvelle vie : un seul bon choix (jamais deux produits de la même matière)", () => {
    const r = makeRng(12);
    const group = (src: string) => SOURCES.find((s) => s.id === src)!.group;
    for (const s of SOURCES) for (let n = 0; n < 40; n++) {
      const it = vieItem(r, true, s.id);
      const ok = it.choices.filter((c) => PRODUCTS.find((p) => p.id === c)!.src === s.id);
      expect(ok).toEqual([it.target]);
      for (const c of it.choices) if (c !== it.target) {
        expect(group(PRODUCTS.find((p) => p.id === c)!.src)).not.toBe(s.group);
        if (s.group === "plastique") expect(c).not.toBe("bouteilles_neuves");
      }
    }
    for (const pr of PRODUCTS) for (let n = 0; n < 40; n++) {
      const it = vieItem(r, false, pr.id);
      expect(it.target).toBe(pr.src);
      for (const c of it.choices) if (c !== it.target) expect(group(c)).not.toBe(group(pr.src));
    }
  });

  test("le voyage en entier : la bonne poubelle et le bon endroit, pour tous les réglages", () => {
    const r = makeRng(21);
    for (const s of SETTINGS) {
      const bins = binsFor(s);
      for (const v of voyages(s)) {
        const placeAt = v.steps.findIndex((x) => x in PLACES);
        expect(placeAt).toBeGreaterThan(1);
        for (const m of [1, placeAt]) {
          const it = ordreItem(r, s, v, m);
          expect(it.scene[m]).toBe("?");
          expect(it.choices).toContain(v.steps[m]);
          if (m === 1) {
            const right = bins.find((b) => b.id === v.steps[1].slice(4))!;
            expect(right.cats.length).toBeGreaterThan(0);
            for (const c of it.choices) if (c !== it.target) expect(bins.find((b) => b.id === c.slice(4))).toBeDefined();
          }
        }
      }
      // Avec un composteur, les épluchures ne prennent pas le camion.
      const cuisine = voyages(s).find((v) => v.id === "cuisine")!;
      expect(cuisine.steps.includes("camion")).toBe(s.cuisine !== "compost");
      expect(voyages(s).find((v) => v.id === "papier")!.steps[1]).toBe(s.papiers === "bleu" ? "bac_bleu" : "bac_jaune");
    }
  });

  test("tous les chapitres et toutes les compétences sortent", () => {
    expect(new Set(items.map((x) => x.kind))).toEqual(new Set(["camion", "qui", "rue", "route", "tapis", "aimant", "vie", "ordre", "ailleurs", "moins"]));
    expect(new Set(items.map((x) => x.skill))).toEqual(new Set(dechets.skills));
    for (const s of dechets.skills) expect(SKILL_BY_ID[s]?.activity).toBe("dechets");
    expect(Object.keys(INTROS).sort()).toEqual([...dechets.skills].sort());
    expect(new Set(all.filter((x) => x.kind === "ailleurs").map((x) => x.key)).size).toBe(AILLEURS_Q.length);
    expect(new Set(all.filter((x) => x.kind === "moins").map((x) => x.key)).size).toBe(MOINS_Q.length);
  });

  test("tout ce que Plume peut dire est dans la liste des phrases enregistrées", () => {
    const missing = new Set<string>();
    const check = (t: string) => { if (t && !spoken.has(t)) missing.add(t); };
    for (const it of all) {
      check(it.prompt); check(it.clue); check(it.win);
      for (const t of Object.values(it.retry)) check(t);
      if (it.kind === "tapis") for (const id of it.things!) { check(MATIERE[id].line); check(tapisShow(id)); check(tapisGoes(id)); }
      else if (it.kind !== "camion") check(pickHint4(it.why));
    }
    for (const x of Object.values(INTROS)) check(x.text);
    for (const k of ["clue", "hint3", "hint4", "tap", "loin"] as const) check(CAMION_TXT[k]);
    check(PICK_HINT3);
    expect([...missing]).toEqual([]);
  });

  test("les phrases sont bien élidées", () => {
    for (const t of spoken) expect(t).not.toMatch(/\b(de|que|le|la) (?=[aeiouéèêAEIOUÉ])/);
    for (const t of spoken) expect(t).not.toMatch(/\bdu (bac|composteur) .*\bdu\b.*\bdu\b/);
  });

  test("gommettes : le camion, la boucle du recyclage, la gourde", () => {
    const refs = new Set<string>();
    for (const it of items) {
      const s = dechets.sticker({ items: 6, firstTry: 6, helped: 0, errors: 0, last: it, learned: [] }, ctx);
      expect(s.reason.startsWith("Celle-ci")).toBe(true);
      refs.add(s.ref!);
    }
    expect(refs).toEqual(new Set(["camion", "boucle", "gourde"]));
  });
});
