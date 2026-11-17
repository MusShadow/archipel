import { describe, expect, test } from "bun:test";
import { createProfile } from "../src/app";
import { ACTIVITIES } from "../src/activities";
import { syllabes } from "../src/activities/syllabes";
import { knownSet } from "../src/content";
import { makeRng } from "../src/core";
import { freshItem, identityOf, optionText, optionsInPrompt, type ActivityModule, type Ctx, type Item } from "../src/host";

const profileFor = (readingK: number) => {
  const p = createProfile({ name: "E", ageMonths: 54, color: "#FFC145", readingK, countTo: 30, flags: 2 });
  for (const c of ["FR", "JP", "IT", "CA", "US", "ML", "PA", "BE", "DE", "ES"]) p.flags[c] = { seen: 3, ok: 2, last: 1 };
  return p;
};

describe("une séance sans répétition", () => {
  test("l'atelier des syllabes : un mot (« lama ») ou une syllabe ne revient pas", () => {
    for (const k of [11, 15, 26]) {
      const p = profileFor(k);
      const ctx: Ctx = { profile: p, rng: makeRng(k), known: knownSet(k), now: Date.now() };
      for (let level = 1; level <= syllabes.maxLevel; level++) {
        const pool = new Set(Array.from({ length: 300 }, () => identityOf(syllabes, syllabes.generate(level, ctx))));
        const seen: Record<string, number> = {};
        const got = Array.from({ length: Math.min(6, pool.size) }, () => identityOf(syllabes, freshItem(syllabes, level, ctx, seen)));
        expect(new Set(got).size).toBe(got.length);
      }
    }
  });

  test("toutes les activités : pas deux fois le même exercice tant qu'il en reste de nouveaux", () => {
    const p = profileFor(15);
    const ctx: Ctx = { profile: p, rng: makeRng(7), known: knownSet(15), now: Date.now() };
    const short: string[] = [];
    for (const mod of ACTIVITIES) for (let level = 1; level <= mod.maxLevel; level++) {
      const pool = new Set(Array.from({ length: 300 }, () => identityOf(mod, mod.generate(level, ctx))));
      // Une séance : deux tours de la même activité (12 exercices), ou moins s'il y a moins d'exercices possibles.
      const n = Math.min(12, pool.size);
      const seen: Record<string, number> = {};
      const got = Array.from({ length: n }, () => identityOf(mod, freshItem(mod, level, ctx, seen)));
      expect(new Set(got).size).toBe(n);
      if (pool.size < 6) short.push(`${mod.id} ${level} : ${pool.size}`);
    }
    // Les petits niveaux à peu d'exercices possibles (ils reviennent alors le plus tard possible).
    expect(short.length).toBeLessThan(12);
  });

  test("quand tout a déjà été vu, revient celui vu il y a le plus longtemps", () => {
    const ids = ["a", "b", "c"];
    let i = 0;
    const mod = { generate: () => ({ prompt: ids[i++ % 3] }) } as unknown as ActivityModule<Item>;
    const ctx = {} as Ctx;
    const seen: Record<string, number> = {};
    const got = Array.from({ length: 7 }, () => freshItem(mod, 1, ctx, seen).prompt);
    expect(got.slice(0, 3).sort()).toEqual(["a", "b", "c"]);
    expect(got.slice(3, 6)).toEqual(got.slice(0, 3));
  });
});

describe("les réponses proposées dites par Plume", () => {
  test("le texte dit : l'étiquette telle qu'elle est écrite, avec un point", () => {
    expect(optionText("Centre de tri")).toBe("Centre de tri.");
    expect(optionText("  la  clé ")).toBe("La clé.");
    expect(optionText("Coucou !")).toBe("Coucou !");
  });

  test("rien à redire quand la consigne nomme déjà les réponses", () => {
    const o = (text: string) => ({ el: null as any, text: optionText(text), card: true });
    expect(optionsInPrompt([o("la pomme"), o("la clé")], "Lequel va flotter : la pomme, ou la clé ?")).toBe(true);
    expect(optionsInPrompt([o("Elle flotte"), o("Elle coule")], "La pomme : est-ce qu'elle flotte, ou est-ce qu'elle coule ?")).toBe(true);
    expect(optionsInPrompt([o("sapin"), o("pin")], "Qu'est-ce qui rime avec lapin : sapin, maison ou bateau ?")).toBe(false);
    expect(optionsInPrompt([o("Centre de tri"), o("Compost")], "Le camion du bac jaune est plein d'emballages. Où va-t-il ?")).toBe(false);
    expect(optionsInPrompt([], "Une consigne")).toBe(false);
  });
});
