import { describe, expect, test } from "bun:test";
import { createProfile } from "../src/app";
import { _triData, introText, tri, voiceLines, type TriItem } from "../src/activities/tri";
import { TART } from "../src/activities/tri_art";
import { knownSet } from "../src/content";
import { SKILL_BY_ID, makeRng } from "../src/core";
import type { Ctx } from "../src/host";
import { defaultTri, normalize, type TriSettings } from "../src/services";

const { THINGS, LEVELS, binsFor, makeTri } = _triData;
const p = createProfile({ name: "E", ageMonths: 54, color: "#FFC145", readingK: 5, countTo: 20, flags: 0 });
const ctx: Ctx = { profile: p, rng: makeRng(23), known: knownSet(5), now: Date.now() };
const SETTINGS: TriSettings[] = [];
for (const papiers of ["jaune", "bleu"] as const) for (const cuisine of ["marron", "compost"] as const) for (const couleurs of ["nationales", "paris"] as const)
  SETTINGS.push({ papiers, cuisine, couleurs });
const spoken = new Set(voiceLines().map((x) => x.text));

describe("le grand tri", () => {
  test("chaque déchet a son dessin, et chaque poubelle sa catégorie", () => {
    for (const t of THINGS) expect(TART[t.id]).toBeTruthy();
    for (const s of SETTINGS) {
      const bins = binsFor(s);
      for (const c of ["emballages", "papiers", "verre", "cuisine", "reste"] as const) expect(bins.filter((b) => b.cats.includes(c)).length).toBe(1);
      expect(bins.length).toBe(s.papiers === "bleu" ? 5 : 4);
    }
  });

  test("les consignes de tri françaises : couleurs nationales et réglages", () => {
    const at = (s: TriSettings, id: string) => binsFor(s).find((b) => b.cats.includes(_triData.THINGS.find((t) => t.id === id)!.cat))!;
    const nat = defaultTri();
    expect(at(nat, "canette").nom).toBe("le bac jaune");
    expect(at(nat, "journal").nom).toBe("le bac jaune");
    expect(at(nat, "bocal").nom).toBe("le bac vert");
    expect(at(nat, "epluchures").nom).toBe("le bac marron");
    expect(at(nat, "mouchoir").nom).toBe("le bac gris");
    // Les pièges : le couvercle en métal va avec les emballages ; le verre à boire et la vaisselle ne vont pas avec le verre.
    expect(at(nat, "couvercle").nom).toBe("le bac jaune");
    expect(at(nat, "verre_casse").nom).toBe("le bac gris");
    expect(at(nat, "assiette").nom).toBe("le bac gris");
    expect(at(nat, "pizza").nom).toBe("le bac jaune");
    const paris: TriSettings = { papiers: "jaune", cuisine: "marron", couleurs: "paris" };
    expect(at(paris, "bocal").nom).toBe("le bac blanc");
    expect(at(paris, "mouchoir").nom).toBe("le bac vert");
    expect(at({ ...nat, papiers: "bleu" }, "journal").nom).toBe("le bac bleu");
    expect(at({ ...nat, cuisine: "compost" }, "trognon").nom).toBe("le composteur");
  });

  test("les manches : les bons déchets, les bonnes poubelles, toujours possibles", () => {
    const r = makeRng(5);
    for (const s of SETTINGS) for (let lv = 1; lv <= 6; lv++) for (let n = 0; n < 150; n++) {
      const it = makeTri(lv, r, s);
      const L = LEVELS[lv - 1];
      expect(it.things.length).toBe(L.n);
      expect(new Set(it.things).size).toBe(L.n);
      for (const id of it.things) {
        expect(it.bins).toContain(it.answers[id]);
        expect(L.cats).toContain(THINGS.find((t) => t.id === id)!.cat);
      }
      const traps = it.things.filter((id) => THINGS.find((t) => t.id === id)!.trap).length;
      if (L.traps === 0) expect(traps).toBe(0); else expect(traps).toBeGreaterThanOrEqual(L.traps);
      if (lv === 1) expect(it.bins).toEqual(["jaune", "reste"]);
      if (lv >= 4) expect(it.bins.length).toBe(binsFor(s).length);
    }
  });

  test("tous les chapitres et toutes les compétences sortent", () => {
    const items: TriItem[] = [];
    for (let level = 1; level <= tri.maxLevel; level++) for (let n = 0; n < 200; n++) items.push(tri.generate(level, ctx));
    expect(new Set(items.map((x) => x.skill))).toEqual(new Set(tri.skills));
    for (const s of tri.skills) expect(SKILL_BY_ID[s]?.activity).toBe("tri");
    const seen = new Set(items.flatMap((x) => x.things));
    expect(seen).toEqual(new Set(THINGS.map((t) => t.id)));
  });

  test("tout ce que Plume peut dire est dans la liste des phrases enregistrées", () => {
    const missing = new Set<string>();
    const check = (t: string) => { if (t && !spoken.has(t)) missing.add(t); };
    for (const L of LEVELS) check(L.prompt);
    for (const s of SETTINGS) {
      for (const chap of tri.skills) check(introText(chap, s));
      const bins = binsFor(s);
      for (const t of THINGS) {
        const right = bins.find((b) => b.cats.includes(t.cat))!;
        check(`${t.nom.charAt(0).toUpperCase()}${t.nom.slice(1)} ${t.plur ? "vont" : "va"} dans ${right.nom}.`);
        for (const b of bins) if (b !== right) check(`${b.purpose} ${t.matiere}`);
      }
    }
    const view = { stage: { querySelector: () => null } as any, rng: ctx.rng, answer() {}, say: async () => {}, hintStep: () => 0 } as any;
    for (let level = 1; level <= tri.maxLevel; level++) for (let n = 0; n < 40; n++) {
      const it = tri.generate(level, ctx);
      for (const step of [1, 2, 3]) check(tri.hint(it, step, view));
      check(tri.success!(it));
    }
    expect([...missing]).toEqual([]);
  });

  test("les phrases sont bien élidées et les accords justes", () => {
    for (const t of spoken) {
      // (« le pot de yaourt » : pas d'élision devant le y.)
      expect(t).not.toMatch(/\b(de|que|le|la) (?=[aeiouéèêAEIOUÉ])/);
      expect(t).not.toMatch(/\bles [a-zé' ]+ va\b/i);
    }
  });

  test("gommettes : le bac jaune, ou la médaille du grand tri", () => {
    const refs = new Set<string>();
    for (let level = 1; level <= tri.maxLevel; level++) {
      const it = tri.generate(level, ctx);
      const s = tri.sticker({ items: 6, firstTry: 6, helped: 0, errors: 0, last: it, learned: [] }, ctx);
      expect(s.reason.startsWith("Celle-ci")).toBe(true);
      expect(s.kind).toBe("tri");
      refs.add(s.ref!);
    }
    expect(refs.size).toBeGreaterThanOrEqual(1);
  });

  test("les anciens réglages reçoivent les couleurs nationales", () => {
    const d = normalize({ settings: { sessionMinutes: 15 }, profiles: [] });
    expect(d.settings.tri).toEqual(defaultTri());
    const e = normalize({ settings: { tri: { papiers: "bleu" } }, profiles: [] });
    expect(e.settings.tri).toEqual({ papiers: "bleu", cuisine: "marron", couleurs: "nationales" });
  });
});
