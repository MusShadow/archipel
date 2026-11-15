import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SOUND_WORDS } from "../src/lexique";

// Prononciation de chaque mot (eSpeak), écrite par scripts/verif_sons.py : à relancer après avoir ajouté un mot.
const api: Record<string, { rime: string; debut: string; son: string | null }> = JSON.parse(readFileSync(join(import.meta.dir, "fixtures/sons.json"), "utf8"));

describe("jeux de sons : les clés suivent la prononciation", () => {
  test("chaque mot a sa prononciation (sinon relancer scripts/verif_sons.py)", () => {
    for (const w of SOUND_WORDS) expect(api[w.w]).toBeDefined();
  });
  for (const key of ["rime", "debut", "son"] as const) {
    test(`${key} : une clé = un son, un son = une clé`, () => {
      const soundsOf = new Map<string, Set<string>>(), keysOf = new Map<string, Set<string>>();
      for (const w of SOUND_WORDS) {
        const k = w[key];
        if (k === null) continue;
        const s = String(api[w.w][key]);
        (soundsOf.get(k) ?? soundsOf.set(k, new Set()).get(k)!).add(s);
        (keysOf.get(s) ?? keysOf.set(s, new Set()).get(s)!).add(k);
      }
      for (const [k, s] of soundsOf) expect([k, [...s]]).toEqual([k, [...s].slice(0, 1)]);
      for (const [s, k] of keysOf) expect([s, [...k]]).toEqual([s, [...k].slice(0, 1)]);
    });
  }
  test("banane rime avec cabane, pas avec serpent", () => {
    const by = Object.fromEntries(SOUND_WORDS.map((w) => [w.w, w]));
    expect(by.banane.rime).toBe(by.cabane.rime);
    expect(by.banane.rime).not.toBe(by.serpent.rime);
  });
});
