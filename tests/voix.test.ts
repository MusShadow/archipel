import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ACTIVITIES, ISLAND_SPOKEN } from "../src/activities";
import { createProfile } from "../src/app";
import { DEFIS, PRAISE, PRAISE_AFTER_EFFORT, RETRY, knownSet } from "../src/content";
import { makeRng } from "../src/core";
import type { Ctx } from "../src/host";
import { elideName, finalize, keyOf, plan, planText, stretch, textKey, tokenize, type VoixIndex } from "../src/voix";

// Petit index fictif : chaque clé connue renvoie un clip.
const lookupOf = (keys: string[]) => {
  const set = new Set(keys);
  return (words: string, p: string) => (set.has(`${words}|${p}`) ? `${words}|${p}` : null);
};
const segKeys = (text: string, keys: string[]) => plan(finalize(tokenize(text)), lookupOf(keys))?.map((s) => s.key) ?? null;

describe("voix naturelle : texte → clés", () => {
  test("mots en minuscules, ponctuation rangée en quatre familles", () => {
    expect(tokenize("Qu'est-ce qui rime avec chat : rat, lapin ou main ?").map((t) => `${t.w}${t.p}`).join(" "))
      .toBe("qu'est-ce qui rime avec chat, rat, lapin ou main?");
    expect(textKey("Oui ! Tu as bien cherché.")).toBe("oui tu as bien cherché|.");
    expect(textKey("Tu veux revenir à la carte ?")).toBe("tu veux revenir à la carte|?");
    expect(textKey("Inspire…")).toBe("inspire|.");
    expect(keyOf(tokenize("chat,"))).toBe("chat|,");
    expect(textKey("Aujourd’hui, l’île")).toBe("aujourd'hui l'île|.");
  });

  test("le prénom n'est jamais dit par la voix naturelle", () => {
    expect(elideName("Bonjour Léa ! Aujourd'hui, je te propose l'île des Mots.", "Léa")).toBe("Bonjour ! Aujourd'hui, je te propose l'île des Mots.");
    expect(elideName("Tu veux arrêter le voyage, Léa ?", "Léa")).toBe("Tu veux arrêter le voyage ?");
    expect(elideName("Plume se repose, Léa. On repart en voyage plus tard !", "Léa")).toBe("Plume se repose. On repart en voyage plus tard !");
    expect(elideName("Voici le drapeau de l'île de Élise ! Il est dans ton carnet.", "Élise")).toBe("Voici le drapeau de ton île ! Il est dans ton carnet.");
    expect(elideName("Le soleil se couche. Bravo pour ce beau voyage, Noé ! Ton défi pour la maison : chante.", "Noé"))
      .toBe("Le soleil se couche. Bravo pour ce beau voyage ! Ton défi pour la maison : chante.");
    expect(elideName("Bravo Jean-Paul ! Tu as gagné ta première gommette.", "Jean-Paul")).toBe("Bravo ! Tu as gagné ta première gommette.");
    // Un prénom qui est aussi un mot n'est retiré qu'à sa place de prénom.
    expect(elideName("Le drapeau est rose et blanc.", "Rose")).toBe("Le drapeau est rose et blanc.");
  });
});

describe("voix naturelle : plan de lecture", () => {
  const keys = [
    "oui|.", "tu as bien cherché|.", "basile voudrait 7 pommes|.", "mets 7 pommes dans le panier puis touche la coche|.",
    "qu'est-ce qui rime avec chat|,", "rat|,", "lapin|", "ou main|?", "la moto|", "est sur le lit|.", "ça se lit|,",
    "le|", "rat|.", "a|", "vu|", "la lune|.", "pin|.", "la|,",
  ];
  test("phrase entière d'abord, puis morceaux séparés par la ponctuation", () => {
    expect(segKeys("Oui ! Tu as bien cherché.", keys)).toEqual(["oui|.", "tu as bien cherché|."]);
    expect(segKeys("Basile voudrait 7 pommes. Mets 7 pommes dans le panier, puis touche la coche.", keys))
      .toEqual(["basile voudrait 7 pommes|.", "mets 7 pommes dans le panier puis touche la coche|."]);
    expect(segKeys("Qu'est-ce qui rime avec chat : rat, lapin ou main ?", keys)).toEqual(["qu'est-ce qui rime avec chat|,", "rat|,", "lapin|", "ou main|?"]);
    expect(segKeys("Ça se lit : la moto est sur le lit.", keys)).toEqual(["ça se lit|,", "la moto|", "est sur le lit|."]);
  });
  test("jamais de lecture mot à mot sans ponctuation", () => {
    expect(segKeys("Le rat a vu la lune.", keys)).toBeNull();
    expect(segKeys("La… pin.", keys)).toEqual(["la|,", "pin|."]);
  });
  test("une question ne se lit jamais avec un clip d'affirmation", () => {
    expect(segKeys("Rat ?", keys)).toBeNull();
    expect(segKeys("Rat !", keys)).toEqual(["rat|."]);
  });
  test("pauses selon la ponctuation", () => {
    const segs = plan(finalize(tokenize("Qu'est-ce qui rime avec chat : rat, lapin ou main ?")), lookupOf(keys))!;
    expect(segs.map((s) => s.gapMs)).toEqual([170, 170, 40, 0]);
  });
});

describe("voix naturelle : débit", () => {
  const sr = 24000;
  const tone = new Float32Array(sr).map((_, i) => Math.sin((2 * Math.PI * 220 * i) / sr) * 0.5);
  const crossings = (x: Float32Array) => { let n = 0; for (let i = 1; i < x.length; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) n++; return n; };
  test("plus lent ou plus rapide, sans changer la hauteur", () => {
    for (const f of [1.125, 0.9]) {
      const y = stretch(tone, sr, f);
      expect(Math.abs(y.length - Math.round(sr * f))).toBeLessThanOrEqual(1);
      const pitch = crossings(y) / (y.length / sr) / 2;
      expect(Math.abs(pitch - 220)).toBeLessThan(6);
      const rms = Math.sqrt(y.slice(2000, -2000).reduce((a, v) => a + v * v, 0) / (y.length - 4000));
      expect(Math.abs(rms - 0.5 / Math.SQRT2)).toBeLessThan(0.05);
    }
    expect(stretch(tone, sr, 1)).toBe(tone);
  });
});

// Couverture du pack de voix réellement publié (public/voix).
const dir = join(import.meta.dir, "../public/voix");
const indexFile = existsSync(dir) ? readdirSync(dir).find((f) => /^index-.*\.json$/.test(f)) : undefined;
describe.skipIf(!indexFile)("pack de voix : couverture", () => {
  const index: VoixIndex = indexFile ? JSON.parse(readFileSync(join(dir, indexFile), "utf8")) : ({} as VoixIndex);
  const covered = (t: string, name: string | null = null) => planText(t, index, name) !== null;

  test("index cohérent avec ses paquets", () => {
    expect(index.paquets.length).toBeGreaterThan(1);
    index.paquets.forEach((p, i) => {
      const size = readFileSync(join(dir, p.nom)).byteLength;
      expect(size).toBe(p.octets);
      for (const [pi, off, len, ms] of Object.values(index.clips)) if (pi === i) { expect(off + len).toBeLessThanOrEqual(size); expect(ms).toBeGreaterThan(50); }
    });
  });

  test("phrases fixes de Plume et phrases avec le prénom", () => {
    for (const t of [...PRAISE, ...PRAISE_AFTER_EFFORT, ...RETRY, "Tu veux revenir à la carte ?", "Bonjour ! Je suis Plume. On part en voyage ?",
      "Ce n'est pas facile ! On fait une petite pause avec Pico, ou tu continues ?", "Inspire doucement par le nez, comme pour sentir une fleur."]) expect(covered(t)).toBe(true);
    const names = Object.values(ISLAND_SPOKEN);
    expect(covered(`Bonjour Léa ! Aujourd'hui, je te propose ${names[0]} ou ${names[2]}. Où veux-tu aller ?`, "Léa")).toBe(true);
    expect(covered("Le drapeau de l'île de Léa !", "Léa")).toBe(true);
    expect(covered(`Merci pour ce voyage, Léa ! Ton défi pour la maison : ${DEFIS.marche[0]}`, "Léa")).toBe(true);
  });

  test("consignes, indices et réussites des activités, à tous les niveaux", () => {
    const profiles = [0, 11, 26].map((k, i) => createProfile({ name: "Léa", ageMonths: 54, color: "#FFC145", readingK: k, countTo: 20, flags: (i % 3) as 0 | 1 | 2 }));
    const stage: any = { querySelector: () => null, querySelectorAll: () => [], appendChild: () => null, dataset: {}, style: {} };
    const misses: string[] = [];
    let total = 0;
    for (const mod of ACTIVITIES) for (const p of profiles) {
      const ctx: Ctx = { profile: p, rng: makeRng(11), known: knownSet(p.knownK), now: Date.now() };
      for (let level = 1; level <= mod.maxLevel; level++) for (let n = 0; n < 12; n++) {
        const it: any = mod.generate(level, ctx);
        const view: any = { stage, rng: ctx.rng, say: () => Promise.resolve(), answer: () => {}, hintStep: () => 1 };
        const texts = [it.prompt, mod.success?.(it)];
        for (const s of [1, 2]) { try { texts.push(mod.hint(it, s, view)); } catch { /* indice qui touche l'écran */ } }
        for (const t of texts) if (t) { total++; if (!covered(t)) misses.push(`${mod.id} : ${t}`); }
      }
    }
    if (misses.length) console.log(`${misses.length} / ${total} phrases sans voix naturelle, par exemple :\n${[...new Set(misses)].slice(0, 12).join("\n")}`);
    expect(misses.length / total).toBeLessThan(0.01);
  });
});
