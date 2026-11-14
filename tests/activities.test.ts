import { describe, expect, test } from "bun:test";
import { ACTIVITIES } from "../src/activities";
import { createProfile } from "../src/app";
import { knownSet } from "../src/content";
import { SKILL_BY_ID, makeRng } from "../src/core";
import { FLAG_BY_CODE } from "../src/flags";
import type { Ctx } from "../src/host";

const profiles = [0, 5, 11, 15, 26].map((k, i) => createProfile({ name: `E${i}`, ageMonths: 54, color: "#FFC145", readingK: k, countTo: 20, flags: (i % 3) as 0 | 1 | 2 }));
// Un profil qui a déjà vu des drapeaux.
for (const c of ["FR", "JP", "IT", "CA", "US", "ML", "PA"]) profiles[3].flags[c] = { seen: 3, ok: 2, last: 1 };

describe("générateurs d'exercices", () => {
  for (const mod of ACTIVITIES) {
    test(`${mod.title} : exercices valides à tous les niveaux`, () => {
      const rng = makeRng(7);
      for (const p of profiles) {
        const ctx: Ctx = { profile: p, rng, known: knownSet(p.knownK), now: Date.now() };
        for (let level = 1; level <= mod.maxLevel; level++) {
          for (let n = 0; n < 40; n++) {
            const it: any = mod.generate(level, ctx);
            expect(SKILL_BY_ID[it.skill]).toBeDefined();
            expect(mod.skills).toContain(it.skill);
            expect(it.prompt.length).toBeGreaterThan(5);
            expect(it.guess).toBeGreaterThanOrEqual(0);
            expect(it.guess).toBeLessThan(1);
            expect(Number.isFinite(it.difficulty)).toBe(true);
            if (Array.isArray(it.choices) && it.choices.length) {
              expect(new Set(it.choices).size).toBe(it.choices.length);
              const answer = mod.id === "marche" ? it.n : it.target;
              expect(it.choices).toContain(answer);
            }
            if (mod.id === "marche") {
              expect(it.n).toBeGreaterThan(0);
              expect(it.n).toBeLessThan(100);
            }
            if (mod.id === "syllabes" && it.kind === "mot") for (const s of it.word.syl) expect(it.tiles).toContain(s);
            if (mod.id === "syllabes" && it.kind === "fabrique") { expect(it.tiles).toContain(it.target[0]); expect(it.vowels).toContain(it.target.slice(1)); }
            if (mod.id === "drapeau") expect(FLAG_BY_CODE[it.target]).toBeDefined();
          }
        }
      }
    });
  }
  test("le drapeau mystère présente d'abord des drapeaux nouveaux, un par un", () => {
    const p = createProfile({ name: "N", ageMonths: 54, color: "#FFC145", readingK: 11, countTo: 20, flags: 0 });
    const ctx: Ctx = { profile: p, rng: makeRng(3), known: knownSet(11), now: Date.now() };
    const drapeau = ACTIVITIES.find((a) => a.id === "drapeau")!;
    const it: any = drapeau.generate(1, ctx);
    expect(it.isNew).toBe(true);
    expect(it.target).toBe("FR");
  });
});
