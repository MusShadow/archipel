// Hôte d'activité : enchaîne les exercices, gère indices, preuves, escalier de difficulté et fin d'activité.
import { app } from "./app";
import { PRAISE, PRAISE_AFTER_EFFORT, RETRY, knownSet } from "./content";
import { applyEvidence, makeRng, newSkill, stepStaircase, type ActivityId, type DomainId, type Form, type Rng } from "./core";
import { sfx, speech, voice, type Profile } from "./services";
import { celebrate } from "./fete";
import { accent, boutonRond } from "./design/composants";
import { MOUVEMENTS, type IleId } from "./design/jetons";
import { DECORS_ILES, PERSONNAGES } from "./illustrations";
import { urlImage } from "./images";
import { dots, h, icon, sleep, wobble } from "./ui";
import { imagerEmojis } from "./lexique";

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
  // Ce qui fait qu'un exercice est « le même » (le mot « lama », la question du camion…) : un exercice déjà fait ne
  // revient pas dans la séance. Par défaut, sa clé, sinon sa consigne.
  identity?(item: I): string;
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

// Un exercice ne revient pas tant que l'activité en a d'autres : ni dans la même séance, ni d'une séance à l'autre (les
// exercices vus sont gardés dans le profil, voir memoireExercices). On en tire plusieurs, et on garde le premier jamais
// vu. Si tout a déjà été vu à ce niveau, on reprend celui qui a été vu il y a le plus longtemps, s'il date d'une séance
// précédente ; s'il date de celle-ci (peu de mots connus, par exemple), on cherche un exercice nouveau aux niveaux en
// dessous (une révision), sinon on reprend le plus ancien.
let seenStamp = 0;
const tampon = () => (seenStamp = Math.max(Date.now(), seenStamp + 1)); // une date, toujours croissante
// L'identité d'un exercice, en court (une empreinte) : la mémoire des séances passées reste légère dans le profil.
const empreinte = (s: string) => { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193); return (x >>> 0).toString(36); };
export const identityOf = (mod: ActivityModule<any>, it: Item) => empreinte(String(mod.identity?.(it) ?? (it as { key?: string }).key ?? it.prompt));
export function freshItem<I extends Item>(mod: ActivityModule<I>, level: number, ctx: Ctx, seen: Record<string, number>, tries = 80, debutSeance = 0): I {
  let best: I | null = null, bestAt = Infinity;
  const keep = (it: I) => { seen[identityOf(mod, it)] = tampon(); return it; };
  for (let lv = level; lv >= 1; lv--) {
    for (let t = 0; t < (lv === level ? tries : 40); t++) {
      const it = mod.generate(lv, ctx);
      const at = seen[identityOf(mod, it)];
      if (at === undefined) return keep(it);
      if (lv === level && at < bestAt) { best = it; bestAt = at; }
    }
    // tout ce niveau a déjà été vu, mais le plus ancien date d'une séance précédente : on le reprend, au même niveau
    if (lv === level && best && bestAt < debutSeance) return keep(best);
  }
  return keep(best!);
}
// Mémoire des exercices vus, d'une séance à l'autre : pour chaque activité, les MEMOIRE plus récents (empreinte → date).
export const MEMOIRE = 160;
export function memoireExercices(p: { vus?: Record<string, Record<string, number>> }, id: string, seen: Record<string, number>) {
  const m = ((p.vus ??= {})[id] ??= {});
  for (const [k, t] of Object.entries(m)) if (!(k in seen)) seen[k] = t;
  return () => {
    for (const [k, t] of Object.entries(seen)) if ((m[k] ?? 0) < t) m[k] = t;
    const cles = Object.keys(m);
    if (cles.length > MEMOIRE) for (const k of cles.sort((a, b) => m[a] - m[b]).slice(0, cles.length - MEMOIRE)) delete m[k];
  };
}

// Réponses proposées que l'enfant ne sait pas lire : l'étiquette écrite sous l'image d'une carte (ou d'une poubelle), ou
// un mot donné par l'activité (data-say). Plume les dit après la consigne, chacune brille quand elle est dite ; le petit
// haut-parleur d'une carte la fait réentendre. Rien à redire quand la consigne les nomme déjà.
export const optionText = (t: string) => {
  const s = t.replace(/\s+/g, " ").trim();
  const c = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?…]$/.test(c) ? c : `${c}.`;
};
const norm = (t: string) => t.toLowerCase().replace(/[.!?…,;:'’]/g, " ").replace(/\s+/g, " ").trim();
export interface SpokenOption { el: HTMLElement; text: string; card: boolean }
export function spokenOptions(stage: HTMLElement): SpokenOption[] {
  const out: SpokenOption[] = [];
  for (const el of Array.from(stage.querySelectorAll<HTMLElement>("[data-t], [data-bin]"))) {
    const said = el.dataset.say ?? el.querySelector(".lab, .tlab")?.textContent ?? "";
    if (said.trim().length > 1) out.push({ el, text: optionText(said), card: el.hasAttribute("data-t") });
  }
  return out;
}
export const optionsInPrompt = (opts: SpokenOption[], prompt: string) => opts.length > 0 && opts.every((o) => ` ${norm(prompt)} `.includes(` ${norm(o.text)} `));

export type ExitReason = "done" | "early" | "calm";
export function activityScreen(mod: ActivityModule<any>, onExit: (summary: RoundSummary | null, reason: ExitReason) => void, opts: RoundOptions = {}): { el: HTMLElement; cleanup: () => void } {
  const total = opts.items ?? mod.items;
  const p = app.profile!;
  // Graine du hasard des exercices ; les tests de bout en bout peuvent la fixer pour rejouer une séance à l'identique.
  const graine = (globalThis as { __archipelTest?: { graine?: number } }).__archipelTest?.graine;
  const rng = makeRng((graine ?? (Date.now() ^ Math.floor(Math.random() * 1e9))) >>> 0);
  const ctx: Ctx = { profile: p, rng, known: knownSet(p.knownK), now: Date.now() };
  let stair = p.stairs[mod.id] ?? { level: mod.startLevel(p), up: 0, down: 0 };
  const summary: RoundSummary = { items: 0, firstTry: 0, helped: 0, errors: 0, last: null, learned: [] };
  // Les exercices déjà faits dans la séance, pour cette activité (sans séance : pour cet écran), et ceux des séances
  // précédentes, gardés dans le profil.
  const seen: Record<string, number> = app.session ? (app.session.seen[mod.id] ??= {}) : {};
  const debutSeance = app.session?.start ?? Date.now();
  const retenir = memoireExercices(p, mod.id, seen);
  const t0 = Date.now();
  let index = 0, attempts = 0, hints = 0, errorsInRow = 0, recorded = false, locked = false, itemStart = 0;
  let current: Item | null = null;
  let alive = true;

  const stage = h("div", { class: "stage" });
  const dotsHost = h("div", {});
  const tipText = h("span", {});
  const tip = h("div", { class: "tip", style: app.data.settings.accompanied ? "" : "visibility:hidden" }, h("span", { class: "ic", html: icon("sound", "#12737B", 2) }), tipText);
  // Cadre habité (livraison 2) : l'hôte de l'île à côté du jeu, qui réagit ; Plume, toujours calme, donne les indices.
  const hote = hoteActivite(mod.host);
  const plumeBtn = boutonRond({ icone: "", etiquette: "Demander un indice à Plume", taille: "grand", onclick: () => giveHint(), html: imgPerso("plume-vol") });
  plumeBtn.classList.add("indice");
  const screen = h("div", { class: "screen cadre-act", "data-ile": mod.island, style: accent(mod.island as IleId) },
    decorActivite(mod.island),
    h("div", { class: "top" },
      boutonRond({ icone: "map", etiquette: "Retour à la carte", onclick: () => askExit() }),
      dotsHost,
      boutonRond({ icone: "ear", etiquette: "Réécouter la consigne", onclick: () => { if (current) sayPrompt(); } })),
    stage,
    h("div", { class: "bottom" }, hote?.el ?? null, tip, plumeBtn));

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
    const item = freshItem(mod, stair.level, ctx, seen, 80, debutSeance);
    retenir();
    current = item;
    // Crochet pour les tests de bout en bout (inexistant en usage normal).
    (globalThis as any).__archipelTest?.onItem?.(item, mod.id);
    attempts = 0; hints = 0; recorded = false; locked = false;
    hote?.expr("content");
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
    imagerEmojis(stage);
    options = spokenOptions(stage);
    for (const o of options) if (o.card) addSpeaker(o);
    sayPrompt();
  }

  // Les réponses proposées, dites l'une après l'autre (on s'arrête dès que l'enfant touche l'écran ou répond).
  let options: SpokenOption[] = [];
  let reading = 0, readingOptions = false;
  const stopReading = () => { reading++; readingOptions = false; stage.querySelectorAll(".saying").forEach((e) => e.classList.remove("saying")); };
  function sayPrompt() {
    if (!current) return;
    stopReading();
    const run = reading;
    const list = optionsInPrompt(options, current.prompt) ? [] : options;
    speech.say(current.prompt).then(async () => {
      if (run !== reading) return;
      readingOptions = true;
      for (const o of list) {
        if (run !== reading || !alive || locked || !o.el.isConnected) break;
        o.el.classList.add("saying");
        await speech.say(o.text);
        o.el.classList.remove("saying");
      }
      if (run === reading) readingOptions = false;
    });
  }
  function addSpeaker(o: SpokenOption) {
    const b = h("span", { class: "sayit", role: "button", "aria-label": `Écouter : ${o.text}`, html: icon("sound", "#12737B", 2.4) });
    const hear = (e: Event) => {
      e.stopPropagation(); e.preventDefault();
      if (locked) return;
      stopReading(); sfx.tap();
      o.el.classList.add("saying");
      const run = reading;
      speech.say(o.text).then(() => { if (run === reading) o.el.classList.remove("saying"); });
    };
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", hear);
    o.el.classList.add("hasay");
    o.el.appendChild(b);
  }
  // Ce que l'activité ajoute plus tard (une réponse dévoilée, une étape) prend aussi les images de l'imagier.
  if (typeof MutationObserver !== "undefined") new MutationObserver(() => { if (alive) imagerEmojis(stage); }).observe(stage, { childList: true, subtree: true });
  // Un geste de l'enfant pendant la lecture des réponses l'arrête (sauf le haut-parleur, qui relance la sienne).
  stage.addEventListener("pointerdown", () => { if (readingOptions) { stopReading(); speech.stop(); } });

  function answer(correct: boolean, el: Element | null, retry?: string) {
    if (!alive || locked || !current) return; // écran quitté : une animation en retard ne répond plus à sa place
    stopReading();
    speech.stop();
    if (!recorded) { record(correct); recorded = true; }
    if (correct) {
      locked = true;
      // le point de cet exercice se remplit tout de suite (le dernier aussi, avant la fin de l'activité)
      dotsHost.replaceChildren(dots(total, index + 1));
      sfx.success();
      hote?.expr("rieur", true);
      if (el) el.classList.add("right");
      const firstTry = attempts === 0 && hints === 0;
      // Petite fête (une scène différente à chaque fois) ; la grande pour la dernière réussite de l'activité.
      const party = celebrate(screen, { name: p.name, firstTry, final: !opts.fast && index + 1 >= total, quick: opts.fast, hote: mod.host });
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
      hote?.expr("doux", false, 1800);
      if (errorsInRow >= 4) { errorsInRow = 0; offerCalm(); return; }
      if (attempts >= 3) giveHint(4);
      else if (attempts === 2) giveHint(Math.max(hints + 1, 2));
      else speech.say(retry ?? pick(RETRY));
    }
  }

  function giveHint(target?: number) {
    if (!alive || !current || locked) return;
    stopReading();
    hints = Math.min(4, target ?? hints + 1);
    const text = mod.hint(current, hints, view);
    hote?.expr("pensif", false, 2600);
    if (text) speech.say(text);
  }

  function offerCalm() {
    const ov = h("div", { class: "overlay" },
      h("div", { class: "sheet" },
        h("div", { class: "sheet-perso", html: imgPerso("plume-pense") }),
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
  return { el: screen, cleanup: () => { alive = false; hote?.fin(); } };
}

// ---------- Cadre habité : hôte, décor léger ----------
const imgPerso = (nom: string, cls = "") => {
  const im = PERSONNAGES[nom];
  return im ? `<img class="${cls}" src="${urlImage(`illustrations/${im.fichier}`)}" alt="" draggable="false">` : "";
};
export type Expression = "content" | "rieur" | "doux" | "pensif";
const EXPRESSIONS: Expression[] = ["content", "rieur", "doux", "pensif"];
// L'hôte de l'activité (Plume sur le Port : elle est déjà le bouton d'indice, on ne la montre pas deux fois).
export function hoteActivite(nom: string): { el: HTMLElement; expr: (e: Expression, saut?: boolean, ms?: number) => void; fin: () => void } | null {
  if (nom === "plume" || !PERSONNAGES[`${nom}-content`]) return null;
  // livraison 4 : l'hôte respire doucement et cligne des yeux (le calme « yeux fermés » passe un instant par-dessus)
  const el = h("div", { class: "hote", "data-hote": nom, "data-expr": "content", "aria-hidden": "true",
    html: EXPRESSIONS.map((e) => imgPerso(`${nom}-${e}`, `hote-${e}`)).join("") + imgPerso(`${nom}-cligne`, "hote-cligne") });
  let retour: ReturnType<typeof setTimeout> | undefined;
  const expr = (e: Expression, saut = false, ms = 0) => {
    clearTimeout(retour);
    el.dataset.expr = e;
    const cls = saut ? "saute" : e === "doux" ? "penche" : "";
    el.classList.remove("saute", "penche");
    if (cls) { void el.offsetWidth; el.classList.add(cls); }
    if (ms) retour = setTimeout(() => { el.dataset.expr = "content"; }, ms);
  };
  return { el, expr, fin: () => clearTimeout(retour) };
}
// Décor léger derrière le jeu : l'île dessinée, très voilée ; sinon la couleur claire de l'île.
// Les écrans à part (dessin, miroir, drapeau de mon île, histoires) prennent le même cadre que les activités :
// la couleur et le dessin estompé de leur île, la matière album des cartes et des boutons (livraison 3).
export function habillerEcran(screen: HTMLElement, ile: IleId): HTMLElement {
  screen.classList.add("cadre-act", "a-part");
  screen.dataset.ile = ile;
  const a = accent(ile);
  if (a) screen.style.cssText += `;${a}`;
  screen.prepend(decorActivite(ile));
  return screen;
}
export function decorActivite(ile: string): HTMLElement {
  const d = DECORS_ILES[ile];
  const fond = d ? `background-image:linear-gradient(180deg,rgba(255,247,234,.80) 0%,rgba(255,247,234,.90) 55%,rgba(255,247,234,.94) 100%),url("${urlImage(`illustrations/${d.base.fichier}`)}")` : "";
  return h("div", { class: `cadre-decor${d ? " dessine" : ""}`, "aria-hidden": "true", style: fond || null });
}

// Matière album des éléments de jeu dans le cadre (cartes, tuiles, panneaux, boutons, fenêtres). Spécificité d'une
// seule classe (:where) et placée AVANT les styles des écrans (main.ts) : les états des activités (carte lue « saying »,
// boîte survolée, tapis roulant…) gardent toujours le dessus.
export const PEAU_ACTIVITE_CSS = `
:where(.cadre-act) .card,:where(.cadre-act) .tile,:where(.cadre-act) .panel,:where(.cadre-act) .speak{border-color:var(--bord);box-shadow:var(--ombre-douce),var(--ombre-reflet)}
:where(.cadre-act) .card,:where(.cadre-act) .tile,:where(.cadre-act) .speak{background:linear-gradient(180deg,#FFFFFF 0%,var(--papier) 70%,#FBF3E4 100%)}
:where(.cadre-act) .panel{background:var(--papier)}
:where(.cadre-act) .card.right,:where(.cadre-act) .tile.right{border-color:var(--juste);box-shadow:0 0 0 max(4px,calc(var(--u) * 6)) var(--juste-halo),var(--ombre-douce)}
:where(.cadre-act) .slot{border-color:var(--bord);background:rgba(255,253,248,.6)}
:where(.cadre-act) .bigbtn{background:linear-gradient(180deg,${"#16808A"} 0%,var(--ile-port-fonce) 60%);box-shadow:0 3px 0 rgba(13,90,96,.35);transition:transform var(--duree-moyen) var(--courbe-rebond)}
:where(.cadre-act) .bigbtn:active{transform:translateY(2px) scale(.97);transition-duration:var(--duree-appui)}
:where(.cadre-act) .bigbtn.alt{background:linear-gradient(180deg,#FFFFFF 0%,var(--surface) 60%);color:var(--encre);border:2.5px solid var(--bord);box-shadow:var(--ombre-posee)}
:where(.cadre-act) .sheet{background:var(--papier);border:3px solid var(--bord);box-shadow:var(--ombre-haute);border-radius:var(--rayon-grand)}
`;

export const CADRE_CSS = `
.fondu{position:absolute;inset:0;z-index:100;pointer-events:none}
.garde-appui{position:fixed;inset:0;z-index:2147483000;background:transparent;touch-action:none;-webkit-tap-highlight-color:transparent}
.cadre-act{isolation:isolate;background:var(--creme)}
.cadre-decor{position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,var(--accent-clair,var(--creme)) 0%,var(--creme) 62%)}
.cadre-decor.dessine{background-size:cover;background-position:center 40%}
.cadre-act .top{padding-top:max(10px,calc(var(--u) * 18))}
.cadre-act .bottom{position:relative;min-height:calc(var(--cible-bouton) * 1.22);align-items:flex-end}
.cadre-act .dot{background:var(--sable);box-shadow:inset 0 2px 0 rgba(122,86,50,.18)}
.cadre-act .dot.done{background:var(--accent,var(--ile-port-vif));box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
.cadre-act .dot.cur{background:var(--papier);border-color:var(--accent,var(--ile-port-vif));box-shadow:var(--ombre-posee)}
.cadre-act .tip{background:var(--papier);border:2px solid var(--bord);border-radius:var(--rayon-moyen);box-shadow:var(--ombre-posee);color:var(--encre);font:var(--texte-adulte);margin-left:calc(var(--u) * 150)}
.a-rond.indice{overflow:visible;background:radial-gradient(circle at 34% 28%,#FFFFFF 0%,var(--ile-port-clair) 62%,#B8E6EA 100%);border-color:#A9DFE3}
.a-rond.indice img{width:128%;height:auto;margin:-6% -4% 0 0;pointer-events:none}
.hote{position:absolute;left:0;bottom:max(6px,calc(var(--u) * 10));height:max(110px,calc(var(--u) * 168));aspect-ratio:var(--hote-ratio,0.78);pointer-events:none;transform-origin:50% 100%}
.hote img{position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;opacity:0;transition:opacity var(--duree-court) var(--courbe-douce)}
.hote[data-expr=content] .hote-content,.hote[data-expr=rieur] .hote-rieur,.hote[data-expr=doux] .hote-doux,.hote[data-expr=pensif] .hote-pensif{opacity:1}
.hote.saute{animation:hote-saute var(--duree-long) var(--courbe-rebond)}
.hote.penche{animation:hote-penche var(--duree-long) var(--courbe-douce)}
@keyframes hote-saute{0%,100%{transform:translateY(0)}45%{transform:translateY(-6%) scale(1.02)}}
@keyframes hote-penche{0%,100%{transform:rotate(0)}40%{transform:rotate(-3.5deg)}75%{transform:rotate(1.5deg)}}
.hote img{transform-origin:50% 100%;animation:hote-respire ${MOUVEMENTS.respiration}ms ${MOUVEMENTS.courbes.calme} infinite alternate}
@keyframes hote-respire{from{transform:scale(1,1)}to{transform:scale(1.008,1.018)}}
.hote .hote-cligne{transition:none}
.hote[data-expr=content] .hote-cligne{animation:hote-respire ${MOUVEMENTS.respiration}ms ${MOUVEMENTS.courbes.calme} infinite alternate,hote-cligne ${MOUVEMENTS.clignement}ms steps(1,end) -2.4s infinite}
@keyframes hote-cligne{0%,96.9%{opacity:0}97%,99.4%{opacity:1}99.5%,100%{opacity:0}}
.hote[data-hote=mona]{--hote-ratio:1.3}.hote[data-hote=kiki]{--hote-ratio:1.2}.hote[data-hote=octave],.hote[data-hote=pico]{--hote-ratio:0.87}.hote[data-hote=bip]{--hote-ratio:0.83}
.sheet-perso{width:max(110px,calc(var(--u) * 150));aspect-ratio:245/234}
.sheet-perso img{width:100%;height:100%;object-fit:contain}
.a-rond,.a-pastille,.a-carte,.a-bulle{transition:transform var(--duree-moyen) var(--courbe-rebond),box-shadow var(--duree-appui) var(--courbe-douce)}
.a-rond:active,.a-pastille:active,.a-carte:active,.a-bulle:active{transition-duration:var(--duree-appui);transition-timing-function:var(--courbe-douce)}
`;

export function stickerFor(mod: ActivityModule<any>, s: RoundSummary, ctx: Ctx) { return mod.sticker(s, ctx); }
