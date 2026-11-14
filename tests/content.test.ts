import { describe, expect, test } from "bun:test";
import { DEFIS, GRAPHEME_ORDER, READING_LEVELS, SAY_SYL, WORDS, decodable, knownSet, syllablesFor } from "../src/content";
import { FLAGS, TWINS, flagSVG } from "../src/flags";
import { READ_WORDS, SOUND_WORDS } from "../src/lexique";

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
    for (const id of ["marche", "nenuphars", "partage", "syllabes", "chants", "lis", "drapeau"]) expect(DEFIS[id]?.length).toBeGreaterThan(0);
  });
});

describe("lexique illustré", () => {
  test("mots à lire : syllabes, lettres muettes et sons cohérents", () => {
    for (const r of READ_WORDS) {
      expect(r.syl.join("")).toBe(r.w);
      expect(r.gp.join("")).toBe(r.w.slice(0, r.w.length - r.mute));
      for (const g of r.gp) expect(GRAPHEME_ORDER).toContain(g);
    }
  });
  test("mots à frapper : autant de morceaux que de syllabes", () => {
    for (const s of SOUND_WORDS) if (s.n > 0) expect(s.say.length).toBe(s.n);
    expect(new Set(SOUND_WORDS.map((s) => s.w)).size).toBe(SOUND_WORDS.length);
  });
  test("assez de rimes et de débuts communs pour jouer", () => {
    const groups = (k: "rime" | "debut") => Object.values(SOUND_WORDS.reduce((acc: Record<string, number>, s) => ({ ...acc, [s[k]]: (acc[s[k]] ?? 0) + 1 }), {})).filter((n) => n >= 2).length;
    expect(groups("rime")).toBeGreaterThanOrEqual(6);
    expect(groups("debut")).toBeGreaterThanOrEqual(6);
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
