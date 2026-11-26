import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Retours de l'essai sur l'iPad (novembre 2026), lot A : la voix (consonnes finales, lettres seules, phrases sans voix),
// les exercices qui reviennent d'un jour à l'autre, les points de progression, l'arrivée sur une île.
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
afterAll(() => dom?.unregister());

const root = join(import.meta.dir, "..");
const { freshItem, identityOf, memoireExercices, MEMOIRE } = await import("../src/host");
const { normalize } = await import("../src/services");
const { planText, syllabeSeule } = await import("../src/voix");
const { makeRng } = await import("../src/core");
const atelier = await import("../src/activities/atelierdrapeaux");
const { syllabes } = await import("../src/activities/syllabes");
const { createProfile } = await import("../src/app");
const { knownSet } = await import("../src/content");
import type { ActivityModule, Ctx, Item } from "../src/host";

const index = (() => {
  const dir = join(root, "public/voix");
  const f = readdirSync(dir).find((x) => x.startsWith("index-") && x.endsWith(".json"))!;
  return JSON.parse(readFileSync(join(dir, f), "utf8"));
})();

// Une activité de test : dix questions au niveau 2, dix autres au niveau 1.
const petit: ActivityModule<Item & { n: number }> = {
  id: "petit", items: 6, maxLevel: 2,
  generate: (level: number, ctx: Ctx) => { const n = Math.floor(ctx.rng.next() * 10); return { n, prompt: `q${level}-${n}`, target: "", skill: "X", difficulty: 0, form: "symbole", guess: 0.5, level } as any; },
} as any;
const ctxDe = (s: number): Ctx => ({ profile: {} as any, rng: makeRng(s), known: knownSet(15), now: Date.now() });

describe("les exercices ne reviennent pas d'un jour à l'autre", () => {
  test("une deuxième séance évite ce que la première a montré, tant qu'il reste du nouveau, au même niveau", () => {
    const p: any = {};
    const s1: Record<string, number> = {};
    const debut1 = Date.now() - 86_400_000;
    const retenir1 = memoireExercices(p, "petit", s1);
    const vus1 = new Set<string>();
    for (let i = 0; i < 6; i++) { const it = freshItem(petit, 2, ctxDe(i), s1, 80, debut1); vus1.add(identityOf(petit, it)); retenir1(); }
    expect(vus1.size).toBe(6);
    expect(Object.keys(p.vus.petit).length).toBe(6);
    // le lendemain : une nouvelle séance (sa propre mémoire de séance), le profil se souvient
    const s2: Record<string, number> = {};
    const retenir2 = memoireExercices(p, "petit", s2);
    // la séance du lendemain commence après tout ce que la veille a noté (les dates de la mémoire)
    const debut2 = Math.max(Date.now(), ...(Object.values(p.vus.petit) as number[])) + 1;
    const vus2: string[] = [];
    for (let i = 0; i < 4; i++) { const it = freshItem(petit, 2, ctxDe(100 + i), s2, 80, debut2); vus2.push(identityOf(petit, it)); retenir2(); }
    for (const v of vus2) expect(vus1.has(v)).toBe(false); // les 4 qui restaient
    // tout le niveau 2 a été vu : on reprend le plus ancien de la veille, au même niveau (pas une révision du niveau 1)
    const it = freshItem(petit, 2, ctxDe(999), s2, 80, debut2);
    expect((it as any).prompt.startsWith("q2-")).toBe(true);
    expect(vus1.has(identityOf(petit, it))).toBe(true);
  });
  test("tout le niveau vu dans cette séance, les niveaux du dessous vus avant : une révision plutôt qu'une répétition", () => {
    const p: any = {};
    const avant = Date.now() - 86_400_000;
    // les séances passées ont tout montré, aux deux niveaux
    const vieux: Record<string, number> = {};
    for (let i = 0; i < 400; i++) { for (const lv of [1, 2]) { const it = petit.generate(lv, ctxDe(i)); vieux[identityOf(petit, it)] = avant - 1000 + i; } }
    memoireExercices(p, "petit", vieux)();
    // aujourd'hui : le niveau 2 en entier, puis encore un exercice
    const s: Record<string, number> = {};
    memoireExercices(p, "petit", s);
    const debut = Date.now() - 10;
    for (let i = 0; i < 10; i++) freshItem(petit, 2, ctxDe(1000 + i), s, 200, debut);
    const vusAujourdhui = new Set(Object.entries(s).filter(([, t]) => t >= debut).map(([k]) => k));
    const it = freshItem(petit, 2, ctxDe(2000), s, 200, debut);
    expect((it as any).prompt.startsWith("q1-")).toBe(true); // une révision du niveau 1…
    expect(vusAujourdhui.has(identityOf(petit, it))).toBe(false); // …pas une question déjà posée aujourd'hui
  });
  test("tout vu dans la séance même : une révision au niveau du dessous, comme avant", () => {
    const s: Record<string, number> = {};
    const debut = Date.now() - 1000;
    for (let i = 0; i < 10; i++) freshItem(petit, 2, ctxDe(i), s, 200, debut);
    const it = freshItem(petit, 2, ctxDe(500), s, 200, debut);
    expect((it as any).prompt.startsWith("q1-")).toBe(true);
  });
  test("la mémoire reste légère (empreintes, les plus récentes seulement) et survit au rechargement du profil", () => {
    const p: any = {};
    const s: Record<string, number> = {};
    for (let i = 0; i < MEMOIRE + 40; i++) s[`k${i}`] = 1000 + i;
    memoireExercices(p, "x", s)();
    expect(Object.keys(p.vus.x).length).toBe(MEMOIRE);
    expect(p.vus.x[`k${MEMOIRE + 39}`]).toBeDefined();
    expect(p.vus.x.k0).toBeUndefined();
    expect(identityOf(petit, { prompt: "Une très longue consigne d'exercice, avec beaucoup de mots dedans." } as any).length).toBeLessThan(10);
    const d = normalize({ profiles: [{ id: "a", name: "Lou", vus: { x: { k1: 5 } }, ilesPresentees: { mots: "2026-11-26" } }] });
    expect(d.profiles[0].vus).toEqual({ x: { k1: 5 } });
    expect(d.profiles[0].ilesPresentees).toEqual({ mots: "2026-11-26" });
    // une sauvegarde abîmée ne fait rien planter : on ne garde que des dates
    const abime = normalize({ profiles: [{ id: "b", name: "Lou", vus: { syllabes: 5, tri: [1, 2], goutte: { a: 3, b: "x" } }, ilesPresentees: [1] }] });
    expect(abime.profiles[0].vus).toEqual({ goutte: { a: 3 } });
    expect(abime.profiles[0].ilesPresentees).toEqual({});
  });
});

describe("la voix", () => {
  test("les consonnes finales qui se prononcent : corrections écrites pour la voix", () => {
    const pron = JSON.parse(readFileSync(join(root, "voix/prononciation.json"), "utf8"));
    // (les remplacements sont écrits pour Python : « \\1 » ; en JavaScript, « $1 »)
    const fix = (s: string) => { for (const [a, b] of pron.corrections) s = s.replace(new RegExp(a, "gi"), b.replace(/\\(\d)/g, "$$$1")); return s; };
    expect(fix("Kiki préfère les trains aux nounours.")).toContain("nounourse");
    expect(fix("Cet ours en peluche.")).toContain("ourse");
    expect(fix("La vis est en métal.")).toBe("La visse est en métal.");
    expect(fix("Les coquilles d'œuf.")).toContain("d'œuffe");
    expect(fix("Un masque à gaz.")).toContain("gaze");
    expect(fix("Le tronc.")).toContain("tron.");
  });
  test("une lettre ou une syllabe seule est dite à part, après une pause : jamais avalée dans une phrase", () => {
    expect(syllabeSeule("Touche : u.", "syllabes:consigne")).toBe(true);
    expect(syllabeSeule("Oui, u !", "syllabes:reussite")).toBe(true);
    expect(syllabeSeule("Ça, c'est une moto.", "syllabes:reussite")).toBe(false);
    for (const t of ["Écoute bien : u. Touche : u.", "Ça, c'est : i. Écoute : u.", "Oui, u !", "Tu as fabriqué : pu. On cherche : du."]) {
      const segs = planText(t, index)!;
      expect(segs ? t : `${t} : pas de voix`).toBe(t);
      // aucun morceau ne colle la lettre à un autre mot
      for (const s of segs) if (s.to > s.from) expect(s.key).not.toMatch(/(^| )[a-zéèêô]{1,3}\|/);
    }
    const p = createProfile({ name: "Lou", ageMonths: 54, color: "#FFC145", readingK: 30, countTo: 20, flags: 0 });
    for (let i = 0; i < 60; i++) {
      const it: any = syllabes.generate(1, { profile: p, rng: makeRng(i), known: knownSet(30), now: Date.now() });
      if (it.kind === "ecoute") expect(it.prompt).toMatch(/Touche : [^.]+\.$/);
    }
  });
  test("chaque phrase écrite en toutes lettres dans les activités a sa voix enregistrée (comme « Regarde bien le modèle »)", () => {
    // toutes les phrases écrites telles quelles (entre guillemets, apostrophes ou accents graves, sans morceau variable),
    // où qu'elles soient : dans say(…), answer(…), une liste de constantes (BANDES_FAUSSES)… Les dessins (*_art.ts) à part.
    const LIT = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\$]|\\.)*)`/g;
    const manque: string[] = [];
    let n = 0;
    for (const f of readdirSync(join(root, "src/activities")).filter((x) => x.endsWith(".ts") && !x.endsWith("_art.ts"))) {
      const src = readFileSync(join(root, "src/activities", f), "utf8");
      for (const m of src.matchAll(LIT)) {
        const t = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\\'/g, "'");
        if (!/^[A-ZÀÂÉÈÊÎÔÙÇ«]/.test(t) || t.split(" ").length < 3 || !/[.!?…]$/.test(t) || /[<>{}=]/.test(t)) continue;
        n++;
        if (!planText(t, index)) manque.push(`${f} : ${t}`);
      }
    }
    expect(n).toBeGreaterThan(60);
    for (const x of atelier.voiceLines()) if (!planText(x.text, index)) manque.push(`atelierdrapeaux : ${x.text}`);
    expect(manque).toEqual([]);
  });
});
