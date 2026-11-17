import { describe, expect, test } from "bun:test";
import { createProfile } from "../src/app";
import { _volcanData, volcan, voiceLines, INTROS, PARTS, type VolcanItem } from "../src/activities/volcan";
import { COUPE_PARTS } from "../src/activities/volcan_art";
import { knownSet } from "../src/content";
import { SKILL_BY_ID, makeRng } from "../src/core";
import { FLAG_BY_CODE, TWINS } from "../src/flags";
import type { Ctx } from "../src/host";

const { EDGES, succ, hasEdge, ordreItem, walks, MONDE_V, tooClose } = _volcanData;
const p = createProfile({ name: "E", ageMonths: 54, color: "#FFC145", readingK: 5, countTo: 20, flags: 0 });
const ctx: Ctx = { profile: p, rng: makeRng(17), known: knownSet(5), now: Date.now() };
const items: VolcanItem[] = [];
for (let level = 1; level <= volcan.maxLevel; level++) for (let n = 0; n < 400; n++) items.push(volcan.generate(level, ctx));
const spoken = new Set(voiceLines().map((x) => x.text));

describe("le volcan d'Octave", () => {
  test("chaque mauvaise réponse a sa phrase d'explication", () => {
    for (const it of items) {
      if (it.kind === "monte") { expect(it.choices).toEqual([]); continue; }
      expect(it.choices).toContain(it.target);
      for (const c of it.choices) {
        expect(it.opts[c]).toBeDefined();
        if (c !== it.target) expect(it.retry[c]).toBeTruthy();
      }
    }
  });

  test("le volcan coupé en deux : les cinq parties sont touchables", () => {
    const parts = items.filter((x) => x.kind === "partie");
    expect(new Set(parts.map((x) => x.target))).toEqual(new Set(COUPE_PARTS));
    for (const it of parts) expect(it.choices).toEqual([...COUPE_PARTS]);
  });

  test("« et ensuite ? » : une seule étape possible parmi les choix", () => {
    for (const it of items.filter((x) => x.kind === "suite")) {
      const [from, to] = it.key.slice("suite:".length).split(">") as any[];
      expect(it.target).toBe(to);
      expect(succ(from)).toContain(to);
      for (const c of it.choices) if (c !== to) expect(succ(from)).not.toContain(c);
    }
  });

  test("l'étape qui manque : seule la bonne étape va dans le trou", () => {
    const r = makeRng(3);
    expect(walks().length).toBeGreaterThan(5);
    for (const w of walks()) for (const miss of [1, 2]) {
      for (let i = 0; i + 1 < w.length; i++) expect(hasEdge(w[i], w[i + 1])).toBe(true);
      const it = ordreItem(w, miss, r);
      const fit = it.choices.filter((c) => hasEdge(w[miss - 1], c as any) && hasEdge(c as any, w[miss + 1]));
      expect(fit).toEqual([it.target]);
      expect(it.choices.length).toBe(3);
    }
  });

  test("les volcans du monde : de vrais drapeaux, jamais deux qui se ressemblent", () => {
    for (const v of MONDE_V) expect(FLAG_BY_CODE[v.code]).toBeDefined();
    for (const it of items.filter((x) => x.kind === "monde" && x.opts[x.target]?.flag)) {
      for (const c of it.choices) {
        expect(FLAG_BY_CODE[c]).toBeDefined();
        if (c !== it.target) {
          expect(tooClose(c, it.target)).toBe(false);
          expect(TWINS.some(([a, b]) => (a === c && b === it.target) || (b === c && a === it.target))).toBe(false);
        }
      }
    }
  });

  test("tous les chapitres et toutes les compétences sortent", () => {
    expect(new Set(items.map((x) => x.kind))).toEqual(new Set(["partie", "monte", "suite", "ordre", "lave", "type", "metier", "monde"]));
    expect(new Set(items.map((x) => x.skill))).toEqual(new Set(volcan.skills));
    for (const s of volcan.skills) expect(SKILL_BY_ID[s]).toBeDefined();
    expect(new Set(items.filter((x) => x.kind === "suite").map((x) => x.key)).size).toBe(EDGES.filter((e) => e.q).length);
    expect(Object.keys(INTROS).sort()).toEqual([...volcan.skills].sort());
  });

  test("tout ce que Plume peut dire est dans la liste des phrases enregistrées", () => {
    const missing = new Set<string>();
    const check = (t: string) => { if (!spoken.has(t)) missing.add(t); };
    for (const it of items) {
      check(it.prompt); check(it.clue); check(it.win);
      for (const t of Object.values(it.retry)) check(t);
    }
    for (const x of Object.values(INTROS)) check(x.text);
    for (const k of COUPE_PARTS) check(`Regarde, ça brille ici. ${PARTS[k].why}`);
    expect([...missing]).toEqual([]);
  });

  test("gommettes : une raison pour chaque chapitre", () => {
    const reasons = new Set<string>();
    for (const it of items) reasons.add(volcan.sticker({ items: 6, firstTry: 6, helped: 0, errors: 0, last: it, learned: [] }, ctx).reason);
    expect(reasons.size).toBe(4);
    for (const r of reasons) expect(r.startsWith("Celle-ci")).toBe(true);
  });
});
