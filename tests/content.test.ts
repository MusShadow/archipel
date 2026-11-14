import { describe, expect, test } from "bun:test";
import { DEFIS, GRAPHEME_ORDER, READING_LEVELS, SAY_SYL, WORDS, decodable, knownSet, syllablesFor } from "../src/content";
import { FLAGS, TWINS, flagSVG } from "../src/flags";

describe("contenus de lecture", () => {
  test("chaque mot est cohérent : syllabes et sons recomposent le mot", () => {
    for (const w of WORDS) {
      expect(w.syl.join("")).toBe(w.w);
      expect(w.gp.join("")).toBe(w.w.toLowerCase());
      for (const g of w.gp) expect(GRAPHEME_ORDER).toContain(g);
    }
  });
  test("toutes les syllabes fabriquées ont une prononciation", () => {
    for (const s of syllablesFor(new Set(GRAPHEME_ORDER))) expect(SAY_SYL[s]).toBeTruthy();
  });
  test("les niveaux de lecture sont croissants et donnent des mots déchiffrables", () => {
    const ks = READING_LEVELS.map((r) => r.k);
    expect([...ks].sort((a, b) => a - b)).toEqual(ks);
    const atSyllables = knownSet(11);
    expect(WORDS.filter((w) => decodable(w.gp, atSyllables)).length).toBeGreaterThanOrEqual(3);
  });
  test("un défi hors écran pour chaque activité", () => {
    for (const id of ["marche", "syllabes", "drapeau"]) expect(DEFIS[id]?.length).toBeGreaterThan(0);
  });
});

describe("drapeaux", () => {
  test("codes uniques, dessin valide, au moins un continent", () => {
    const codes = new Set<string>();
    for (const f of FLAGS) {
      expect(codes.has(f.code)).toBe(false);
      codes.add(f.code);
      expect(f.cont.length).toBeGreaterThan(0);
      const svg = flagSVG(f.code);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).not.toContain("undefined");
      expect(svg).not.toContain("NaN");
    }
    expect(FLAGS.length).toBeGreaterThanOrEqual(45);
  });
  test("les noms lisibles ont leurs syllabes", () => {
    for (const f of FLAGS) if (f.gp) { expect(f.syl?.join("").toLowerCase()).toBe(f.gp.join("")); }
  });
  test("les paires de jumeaux existent", () => {
    const codes = new Set(FLAGS.map((f) => f.code));
    for (const [a, b] of TWINS) { expect(codes.has(a)).toBe(true); expect(codes.has(b)).toBe(true); }
  });
});
