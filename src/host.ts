// Hôte d'activité : enchaîne les exercices, gère indices, preuves, escalier de difficulté et fin d'activité.
import { app } from "./app";
import { PRAISE, PRAISE_AFTER_EFFORT, RETRY, knownSet } from "./content";
import { applyEvidence, makeRng, newSkill, stepStaircase, type ActivityId, type DomainId, type Form, type Rng } from "./core";
import { sfx, speech, voice, type Profile } from "./services";
import { celebrate } from "./fete";
import { dots, h, icon, plumeSVG, roundBtn, sleep, wobble } from "./ui";

export interface Item { skill: string; difficulty: number; form: Form; guess: number; prompt: string; level: number }
export interface Ctx { profile: Profile; rng: Rng; known: Set<string>; now: number }
export interface View { stage: HTMLElement; rng: Rng; answer: (correct: boolean, el?: Element | null, retry?: string) => void; say: (t: string) => Promise<void>; hintStep: () => number }
export interface RoundSummary { items: number; firstTry: number; helped: number; errors: number; last: Item | null; learned: string[] }
export interface StickerSpec { kind: string; ref?: string; reason: string; svg: string }
export interface ActivityModule<I extends Item = Item> {
  id: ActivityId; title: string; domain: DomainId; island: string; host: string;
  maxLevel: number; items: number; skills: string[];
  startLevel(p: Profile): number;
  generate(level: number, ctx: Ctx): I;
  render(item: I, view: View): void;
  hint(item: I, step: number, view: View): string;
  intro?(item: I, ctx: Ctx): { text: string; el: HTMLElement } | null;
  onResult?(item: I, firstTry: boolean, ctx: Ctx, summary: RoundSummary): void;
  sticker(summary: RoundSummary, ctx: Ctx): StickerSpec;
  tip(item: I): string;
  // Phrase dite après une bonne réponse : elle redit ce qui a été trouvé (« Oui, c'est le drapeau du Japon ! »).
  success?(item: I): string;
  // Carte de l'activité sur son île : petite illustration et phrase de présentation dite par Plume.
  card: string;
  pitch: string;
  // Activité accessible à cet enfant ? (par exemple : lire des phrases demande de connaître assez de sons)
  available?(p: Profile): boolean;
  lockedReason?: string;
}
export const isAvailable = (mod: ActivityModule<any>, p: Profile) => !mod.available || mod.available(p);

// Options du grand départ : peu d'exercices, et un escalier qui bouge à chaque réponse pour situer vite l'enfant.
export interface RoundOptions { items?: number; fast?: boolean }
function fastStep(s: { level: number; up: number; down: number }, independentSuccess: boolean, firstAttemptWrong: boolean, maxLevel: number) {
  if (independentSuccess) return { level: Math.min(maxLevel, s.level + 1), up: 0, down: 0 };
  if (firstAttemptWrong) return { level: Math.max(1, s.level - 1), up: 0, down: 0 };
  return { ...s, up: 0 };
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export type ExitReason = "done" | "early" | "calm";
export function activityScreen(mod: ActivityModule<any>, onExit: (summary: RoundSummary | null, reason: ExitReason) => void, opts: RoundOptions = {}): { el: HTMLElement; cleanup: () => void } {
  const total = opts.items ?? mod.items;
  const p = app.profile!;
  const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  const ctx: Ctx = { profile: p, rng, known: knownSet(p.knownK), now: Date.now() };
  let stair = p.stairs[mod.id] ?? { level: mod.startLevel(p), up: 0, down: 0 };
  const summary: RoundSummary = { items: 0, firstTry: 0, helped: 0, errors: 0, last: null, learned: [] };
  const t0 = Date.now();
  let index = 0, attempts = 0, hints = 0, errorsInRow = 0, recorded = false, locked = false, itemStart = 0;
  let current: Item | null = null;
  let alive = true;

  const stage = h("div", { class: "stage" });
  const dotsHost = h("div", {});
  const tipText = h("span", {});
  const tip = h("div", { class: "tip", style: app.data.settings.accompanied ? "" : "visibility:hidden" }, h("span", { class: "ic", html: icon("sound", "#12737B", 2) }), tipText);
  const plumeBtn = roundBtn({ label: "Demander un indice à Plume", cls: "plume", html: plumeSVG(), onclick: () => giveHint() });
  const screen = h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "home", label: "Retour à la carte", onclick: () => askExit() }),
      dotsHost,
      roundBtn({ icon: "ear", label: "Réécouter la consigne", onclick: () => current && speech.say(current.prompt) })),
    stage,
    h("div", { class: "bottom" }, tip, plumeBtn));

  const view: View = { stage, rng, say: (t) => speech.say(t), answer: (c, el, retry) => answer(c, el ?? null, retry), hintStep: () => hints };

  function record(correct: boolean) {
    if (!current) return;
    const ev = { skill: current.skill, correct, hints, guess: current.guess, difficulty: current.difficulty, form: current.form };
    const now = Date.now();
    p.skills[current.skill] = applyEvidence(p.skills[current.skill] ?? newSkill(), ev, now);
    p.log.push({ t: now, activity: mod.id, level: current.level, skill: current.skill, correct, hints, form: current.form, ms: now - itemStart });
    stair = (opts.fast ? fastStep : stepStaircase)(stair, correct && hints === 0, !correct, mod.maxLevel);
    p.stairs[mod.id] = stair;
    app.save();
  }

  async function next() {
    if (!alive) return;
    if (index >= total || (!opts.fast && app.timeUp())) return finish();
    dotsHost.replaceChildren(dots(total, index));
    const item = mod.generate(stair.level, ctx);
    current = item;
    // Crochet pour les tests de bout en bout (inexistant en usage normal).
    (globalThis as any).__archipelTest?.onItem?.(item, mod.id);
    attempts = 0; hints = 0; recorded = false; locked = false;
    tipText.innerHTML = `<b>Astuce parent</b> : ${mod.tip(item)}`;
    stage.replaceChildren();
    const intro = mod.intro?.(item, ctx);
    if (intro) {
      stage.appendChild(intro.el);
      const go = h("button", { type: "button", class: "bigbtn", "aria-label": "Continuer", html: icon("arrow", "#fff", 2.6) });
      go.style.width = "var(--btn)"; go.style.justifyContent = "center"; go.style.padding = "0";
      stage.appendChild(go);
      const spoken = speech.say(intro.text);
      await new Promise<void>((res) => { go.onclick = () => { sfx.tap(); res(); }; });
      void spoken;
      if (!alive) return;
      stage.replaceChildren();
    }
    itemStart = Date.now();
    mod.render(item, view);
    speech.say(item.prompt);
  }

  function answer(correct: boolean, el: Element | null, retry?: string) {
    if (locked || !current) return;
    speech.stop();
    if (!recorded) { record(correct); recorded = true; }
    if (correct) {
      locked = true;
      sfx.success();
      if (el) el.classList.add("right");
      const firstTry = attempts === 0 && hints === 0;
      // Petite fête (une scène différente à chaque fois) ; la grande pour la dernière réussite de l'activité.
      const party = celebrate(screen, { name: p.name, firstTry, final: !opts.fast && index + 1 >= total, quick: opts.fast });
      summary.items++; summary.last = current;
      if (firstTry) summary.firstTry++; else summary.helped++;
      errorsInRow = 0;
      mod.onResult?.(current, attempts === 0, ctx, summary);
      app.save();
      const line = mod.success?.(current);
      const pool = firstTry ? PRAISE : PRAISE_AFTER_EFFORT;
      const praise = pick(line ? pool.filter((x) => !/^(Oui|Exactement)/.test(x)) : pool);
      // La voix enregistrée par le parent remplace parfois l'encouragement de Plume.
      const clip = firstTry ? "bravo" : "effort";
      const parent = voice.has(clip) && Math.random() < 0.5;
      const text = parent ? (line ?? "") : !line ? praise : firstTry && Math.random() < 0.6 ? line : `${line} ${praise}`;
      const spoken = speech.say(text).then(() => (parent ? voice.play(clip) : undefined));
      Promise.all([spoken, party.done]).then(() => { party.end(); return sleep(250); }).then(() => { index++; next(); });
    } else {
      attempts++; summary.errors++; errorsInRow++;
      sfx.soft();
      if (el) wobble(el);
      if (errorsInRow >= 4) { errorsInRow = 0; offerCalm(); return; }
      if (attempts >= 3) giveHint(4);
      else if (attempts === 2) giveHint(Math.max(hints + 1, 2));
      else speech.say(retry ?? pick(RETRY));
    }
  }

  function giveHint(target?: number) {
    if (!current || locked) return;
    hints = Math.min(4, target ?? hints + 1);
    const text = mod.hint(current, hints, view);
    if (text) speech.say(text);
  }

  function offerCalm() {
    const ov = h("div", { class: "overlay" },
      h("div", { class: "sheet" },
        h("div", { style: "width:120px;height:110px", html: plumeSVG() }),
        h("p", { class: "title", style: "font-size:28px;margin:0" }, "On fait une petite pause avec Pico ?"),
        h("div", { class: "row" },
          h("button", { type: "button", class: "bigbtn", onclick: () => { ov.remove(); exit(summary.items > 0 ? summary : null, "calm"); } }, "Oui, une pause"),
          h("button", { type: "button", class: "bigbtn alt", onclick: () => { ov.remove(); giveHint(Math.max(hints + 1, 2)); } }, "Je continue"))));
    screen.appendChild(ov);
    speech.say("Ce n'est pas facile ! On fait une petite pause avec Pico, ou tu continues ?");
  }

  function askExit() {
    const ov = h("div", { class: "overlay" },
      h("div", { class: "sheet" },
        h("p", { class: "title", style: "font-size:28px;margin:0" }, "Revenir à la carte ?"),
        h("div", { class: "row" },
          h("button", { type: "button", class: "bigbtn", onclick: () => { ov.remove(); finish(true); } }, "Oui"),
          h("button", { type: "button", class: "bigbtn alt", onclick: () => ov.remove() }, "Non, je reste"))));
    screen.appendChild(ov);
    speech.say("Tu veux revenir à la carte ?");
  }

  let finished = false;
  function finish(early = false) {
    if (finished) return;
    finished = true;
    exit(summary.items > 0 ? summary : null, early ? "early" : "done");
  }
  function exit(s: RoundSummary | null, why: ExitReason) {
    alive = false;
    app.addMinutes(mod.domain, Date.now() - t0, mod.id);
    p.stairs[mod.id] = stair;
    app.save();
    onExit(s, why);
  }

  queueMicrotask(next);
  return { el: screen, cleanup: () => { alive = false; } };
}

export function stickerFor(mod: ActivityModule<any>, s: RoundSummary, ctx: Ctx) { return mod.sticker(s, ctx); }
