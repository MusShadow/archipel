import { describe, expect, test } from "bun:test";
import { DAY, SKILL_BY_ID, applyEvidence, makeRng, masteryOf, newSkill, pCorrect, stepStaircase, suggestMissions, type Evidence } from "../src/core";

const ev = (o: Partial<Evidence> = {}): Evidence => ({ skill: "NUM.COMPTE.10", correct: true, hints: 0, guess: 0, difficulty: 0, form: "manipulation", ...o });

describe("modèle de l'enfant", () => {
  test("une réussite fait monter, une erreur fait descendre", () => {
    const s = newSkill(0);
    expect(applyEvidence(s, ev(), 1).theta).toBeGreaterThan(0);
    expect(applyEvidence(s, ev({ correct: false }), 1).theta).toBeLessThan(0);
  });
  test("une réussite aidée compte moins qu'une réussite seule", () => {
    const s = newSkill(0);
    const alone = applyEvidence(s, ev(), 1).theta;
    const helped = applyEvidence(s, ev({ hints: 3 }), 1).theta;
    expect(helped).toBeGreaterThan(0);
    expect(helped).toBeLessThan(alone);
  });
  test("deviner au hasard rapporte moins quand il y a peu de choix", () => {
    const s = newSkill(0);
    expect(applyEvidence(s, ev({ guess: 0.5 }), 1).theta).toBeLessThan(applyEvidence(s, ev({ guess: 0 }), 1).theta);
  });
  test("révisions espacées : l'intervalle grandit avec les réussites seules", () => {
    let s = newSkill(0);
    let now = 1_000;
    const gaps: number[] = [];
    for (let i = 0; i < 4; i++) { s = applyEvidence(s, ev(), now); gaps.push(s.nextReview - now); now = s.nextReview; }
    expect(gaps.map((g) => g / DAY)).toEqual([1, 3, 7, 14]);
    s = applyEvidence(s, ev({ correct: false }), now);
    expect((s.nextReview - now) / DAY).toBe(0.5);
  });
  test("maîtrise : acquise puis consolidée (deux formes, réussite différée)", () => {
    const def = SKILL_BY_ID["NUM.COMPTE.10"];
    let s = newSkill(0);
    expect(masteryOf(def, s)).toBe("nouveau");
    let now = 1_000;
    for (let i = 0; i < 8; i++) { s = applyEvidence(s, ev({ difficulty: 0.5 }), now); now += 60_000; }
    expect(["acquise", "consolidee"]).toContain(masteryOf(def, s));
    expect(masteryOf(def, s)).toBe("acquise");
    now += 3 * DAY;
    s = applyEvidence(s, ev({ difficulty: 0.5, form: "image" }), now);
    expect(masteryOf(def, s)).toBe("consolidee");
  });
  test("l'estimation rejoint le niveau réel d'un enfant simulé", () => {
    const rng = makeRng(42);
    for (const truth of [-1.5, 0, 1.5]) {
      let s = newSkill(-1);
      for (let i = 0; i < 160; i++) {
        const d = s.theta + (rng.next() - 0.5);
        const correct = rng.next() < pCorrect(truth, d, 0);
        s = applyEvidence(s, ev({ correct, difficulty: d }), i * 1000);
      }
      expect(Math.abs(s.theta - truth)).toBeLessThan(0.9);
    }
  });
});

describe("escalier de difficulté", () => {
  test("2 réussites seules : un cran plus dur", () => {
    let s = { level: 1, up: 0, down: 0 };
    s = stepStaircase(s, true, false, 5);
    expect(s.level).toBe(1);
    s = stepStaircase(s, true, false, 5);
    expect(s.level).toBe(2);
  });
  test("2 erreurs au premier essai : un cran plus facile, jamais sous 1", () => {
    let s = { level: 2, up: 0, down: 0 };
    s = stepStaircase(s, false, true, 5);
    s = stepStaircase(s, false, true, 5);
    expect(s.level).toBe(1);
    s = stepStaircase(stepStaircase(s, false, true, 5), false, true, 5);
    expect(s.level).toBe(1);
  });
  test("une réussite aidée remet le compteur de montée à zéro", () => {
    let s = { level: 1, up: 0, down: 0 };
    s = stepStaircase(s, true, false, 5);
    s = stepStaircase(s, false, false, 5);
    s = stepStaircase(s, true, false, 5);
    expect(s.level).toBe(1);
  });
  test("plafond au niveau maximal", () => {
    let s = { level: 5, up: 1, down: 0 };
    s = stepStaircase(s, true, false, 5);
    expect(s.level).toBe(5);
  });
});

describe("planificateur", () => {
  const acts = [
    { id: "marche" as const, domain: "nombres" as const, skills: ["NUM.COMPTE.10"] },
    { id: "syllabes" as const, domain: "lecture" as const, skills: ["LECT.SYL.ECOUTE"] },
    { id: "drapeau" as const, domain: "voyages" as const, skills: ["VOY.DRAPEAU.ECOUTE"] },
  ];
  test("une révision due passe en premier", () => {
    const now = 10 * DAY;
    const due = { ...newSkill(3), n: 5, nextReview: now - 1 };
    const out = suggestMissions({ activities: acts, skills: { "LECT.SYL.ECOUTE": due }, minutesByDomain: {}, goals: [], now }, () => 0.5, 2);
    expect(out[0]).toBe("syllabes");
    expect(out.length).toBe(2);
  });
  test("équilibre : un domaine déjà beaucoup travaillé recule", () => {
    const out = suggestMissions({ activities: acts, skills: {}, minutesByDomain: { nombres: 60 }, goals: [], now: 0 }, () => 0, 3);
    expect(out[2]).toBe("marche");
  });
});
