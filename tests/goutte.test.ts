import { describe, expect, test } from "bun:test";
import { createProfile } from "../src/app";
import { _goutteData, goutte, voiceLines, type GoutteItem } from "../src/activities/goutte";
import { knownSet } from "../src/content";
import { makeRng } from "../src/core";
import type { Ctx } from "../src/host";

const { EDGES, succ, hasEdge, tourItem } = _goutteData;
const p = createProfile({ name: "E", ageMonths: 54, color: "#FFC145", readingK: 5, countTo: 20, flags: 0 });
const ctx: Ctx = { profile: p, rng: makeRng(11), known: knownSet(5), now: Date.now() };
const items: GoutteItem[] = [];
for (let level = 1; level <= goutte.maxLevel; level++) for (let n = 0; n < 400; n++) items.push(goutte.generate(level, ctx));
const spoken = new Set(voiceLines().map((x) => x.text));

describe("le voyage de la goutte", () => {
  test("chaque mauvaise réponse a sa phrase d'explication", () => {
    for (const it of items) {
      for (const c of it.choices) {
        expect(it.opts[c]).toBeDefined();
        if (c !== it.target) expect(it.retry[c]).toBeTruthy();
      }
    }
  });

  test("« et ensuite ? » : une seule étape possible parmi les choix", () => {
    for (const it of items.filter((x) => x.kind === "suite")) {
      const [from, to] = it.key.slice("suite:".length).split(">") as any[];
      expect(it.target).toBe(to);
      expect(succ(from)).toContain(to);
      for (const c of it.choices) if (c !== to) expect(succ(from)).not.toContain(c);
    }
  });

  test("le grand tour : seule la bonne étape va dans le trou", () => {
    const r = makeRng(5);
    let n = 0;
    for (const it of items.filter((x) => x.kind === "tour")) {
      const seq = it.seq!, k = it.miss!;
      for (let i = 0; i + 1 < seq.length; i++) expect(hasEdge(seq[i] as any, seq[i + 1] as any)).toBe(true);
      const fit = it.choices.filter((c) => hasEdge(seq[k - 1] as any, c as any) && hasEdge(c as any, seq[k + 1] as any));
      expect(fit).toEqual([it.target]);
      n++;
    }
    expect(n).toBeGreaterThan(50);
    // Le tour de la maison : du robinet à la station d'épuration.
    const it = tourItem(["robinet", "bain", "egouts", "station"], 2, r);
    expect(it.target).toBe("egouts");
  });

  test("tous les chapitres et toutes les compétences sortent", () => {
    expect(new Set(items.map((x) => x.kind)).size).toBe(11);
    expect(new Set(items.map((x) => x.skill))).toEqual(new Set(goutte.skills));
    expect(new Set(items.filter((x) => x.kind === "suite").map((x) => x.key)).size).toBe(EDGES.filter((e) => e.q).length);
  });

  test("tout ce que Plume peut dire est dans la liste des phrases enregistrées", () => {
    const missing = new Set<string>();
    const check = (t: string) => { if (!spoken.has(t)) missing.add(t); };
    for (const it of items) {
      check(it.prompt); check(it.clue); check(it.win); check(`C'est celle qui brille. ${it.why}`);
      for (const t of Object.values(it.retry)) check(t);
    }
    expect([...missing]).toEqual([]);
  });
});
