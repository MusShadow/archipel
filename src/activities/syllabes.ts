// Île des Mots — « L'atelier des syllabes » : entendre, fabriquer, écrire et lire des syllabes et des mots.
import { SAY_SYL, SYL_CONSONANTS, SYL_VOWELS, WORDS, decodable, syllablesFor, type Word } from "../content";
import { flagSVG } from "../flags";
import type { ActivityModule, Ctx, Item, View } from "../host";
import { glow, h } from "../ui";

type Kind = "ecoute" | "fabrique" | "mot" | "lire";
interface SylItem extends Item { kind: Kind; target: string; word?: Word; choices: string[]; tiles?: string[]; vowels?: string[] }

const CUE_WORD: Record<string, string> = { m: "moto", l: "lama", r: "radio", s: "sofa", p: "piano", t: "tipi", f: "fumé", v: "vélo", n: "numéro", d: "domino" };
const say = (s: string) => SAY_SYL[s.toLowerCase()] ?? s.toLowerCase();
const sylLine = (syl: string[]) => syl.map(say).join(", ");

// Pictogrammes : le sens du mot, pour lire puis vérifier qu'on a compris.
const PICTO: Record<string, string> = {
  moto: '<circle cx="25" cy="70" r="14" fill="none" stroke="#273043" stroke-width="6"/><circle cx="75" cy="70" r="14" fill="none" stroke="#273043" stroke-width="6"/><path d="M25 70 L45 50 L65 50 L75 70" fill="none" stroke="#FF7F50" stroke-width="8" stroke-linejoin="round"/><rect x="40" y="40" width="26" height="9" rx="4" fill="#273043"/><path d="M65 50 L70 34 M62 34 H76" stroke="#273043" stroke-width="5" stroke-linecap="round"/>',
  vélo: '<circle cx="25" cy="70" r="14" fill="none" stroke="#273043" stroke-width="5"/><circle cx="75" cy="70" r="14" fill="none" stroke="#273043" stroke-width="5"/><path d="M25 70 L42 45 L62 70 Z M42 45 L68 45 L75 70" fill="none" stroke="#3D8BEA" stroke-width="6" stroke-linejoin="round"/><path d="M35 40 H49 M68 45 L66 33 M60 33 H72" stroke="#273043" stroke-width="5" stroke-linecap="round"/>',
  tipi: '<path d="M50 12 L42 3 M50 12 L58 3" stroke="#A0673F" stroke-width="4" stroke-linecap="round"/><polygon points="50,12 86,86 14,86" fill="#FFC145" stroke="#A0673F" stroke-width="4" stroke-linejoin="round"/><polygon points="50,56 63,86 37,86" fill="#A0673F"/>',
  lama: '<circle cx="22" cy="55" r="6" fill="#F1DDB5" stroke="#A0673F" stroke-width="2.5"/><path d="M28 70 V90 M38 72 V90 M54 72 V90 M64 70 V90" stroke="#A0673F" stroke-width="6" stroke-linecap="round"/><ellipse cx="45" cy="60" rx="24" ry="15" fill="#F1DDB5" stroke="#A0673F" stroke-width="2.5"/><rect x="58" y="22" width="12" height="40" rx="6" fill="#F1DDB5" stroke="#A0673F" stroke-width="2.5"/><ellipse cx="72" cy="24" rx="12" ry="8" fill="#F1DDB5" stroke="#A0673F" stroke-width="2.5"/><path d="M63 18 L62 7 L68 15 M69 17 L70 6 L74 15" fill="#F1DDB5" stroke="#A0673F" stroke-width="2.5" stroke-linejoin="round"/><circle cx="75" cy="22" r="2" fill="#273043"/><rect x="41" y="47" width="16" height="10" rx="3" fill="#E85D9A"/>',
  domino: '<rect x="30" y="10" width="40" height="80" rx="8" fill="#fff" stroke="#273043" stroke-width="4"/><path d="M30 50 H70" stroke="#273043" stroke-width="3"/><circle cx="42" cy="24" r="5" fill="#273043"/><circle cx="58" cy="38" r="5" fill="#273043"/><circle cx="40" cy="62" r="5" fill="#273043"/><circle cx="50" cy="72" r="5" fill="#273043"/><circle cx="60" cy="82" r="5" fill="#273043"/>',
  sofa: '<rect x="20" y="28" width="60" height="30" rx="8" fill="#A88BEB"/><rect x="12" y="50" width="76" height="26" rx="8" fill="#8C6BE0"/><rect x="6" y="42" width="16" height="36" rx="7" fill="#7A5AD0"/><rect x="78" y="42" width="16" height="36" rx="7" fill="#7A5AD0"/><rect x="16" y="76" width="6" height="10" rx="2" fill="#5B6475"/><rect x="78" y="76" width="6" height="10" rx="2" fill="#5B6475"/>',
  piano: '<rect x="8" y="28" width="84" height="52" rx="6" fill="#fff" stroke="#273043" stroke-width="4"/><path d="M22 28 V80 M36 28 V80 M50 28 V80 M64 28 V80 M78 28 V80" stroke="#273043" stroke-width="2.5"/><rect x="18" y="28" width="8" height="30" fill="#273043"/><rect x="32" y="28" width="8" height="30" fill="#273043"/><rect x="60" y="28" width="8" height="30" fill="#273043"/><rect x="74" y="28" width="8" height="30" fill="#273043"/>',
  radio: '<path d="M68 34 L84 14" stroke="#273043" stroke-width="4" stroke-linecap="round"/><circle cx="85" cy="13" r="4" fill="#273043"/><rect x="12" y="34" width="76" height="48" rx="10" fill="#3D8BEA"/><circle cx="34" cy="58" r="14" fill="#DCE9FB"/><circle cx="66" cy="50" r="6" fill="#fff"/><circle cx="66" cy="68" r="6" fill="#fff"/>',
  midi: '<circle cx="50" cy="52" r="38" fill="#fff" stroke="#273043" stroke-width="5"/><path d="M50 52 V20" stroke="#273043" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="52" r="5" fill="#273043"/><path d="M50 18 V22 M84 52 H80 M50 86 V82 M16 52 H20" stroke="#273043" stroke-width="4" stroke-linecap="round"/>',
};
const NAMED: Record<string, string> = { moto: "une moto", radio: "une radio", midi: "une horloge qui montre midi" };
// Noms de pays déchiffrables : leur drapeau sert d'image pour écrire le mot.
const COUNTRY_WORDS: Record<string, string> = { Mali: "ML", Panama: "PA", Togo: "TG", Cuba: "CU", Canada: "CA", Monaco: "MC" };
function pictureOf(w: string) {
  if (COUNTRY_WORDS[w]) return flagSVG(COUNTRY_WORDS[w], false);
  if (!PICTO[w]) return "";
  return `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%">${PICTO[w]}</svg>`;
}

// Ce que l'enfant connaît, avec un minimum pour que les exercices restent possibles.
function knownSyllables(ctx: Ctx) {
  const s = syllablesFor(ctx.known);
  return s.length >= 3 ? s : SYL_VOWELS.slice();
}
function buildingSet(ctx: Ctx) {
  const cons = SYL_CONSONANTS.filter((c) => ctx.known.has(c));
  const vows = SYL_VOWELS.filter((v) => ctx.known.has(v));
  return { cons: cons.length >= 3 ? cons : ["l", "m", "r"], vows: vows.length >= 3 ? vows : ["a", "i", "o"] };
}
function wordsFor(ctx: Ctx) {
  const ok = WORDS.filter((w) => decodable(w.gp, ctx.known));
  return ok.length >= 3 ? ok : WORDS.slice(0, 6);
}

// Cases à remplir + réserves de tuiles. Toucher une tuile la place ; toucher une case la vide.
// Avec plusieurs réserves, chaque réserve remplit sa propre case (consonne puis voyelle).
function slotBuilder(view: View, nSlots: number, banks: string[][], onFull: (built: string[], el: HTMLElement) => void) {
  const filled: (HTMLElement | null)[] = Array(nSlots).fill(null);
  const slots = h("div", { class: "row" });
  const slotEls: HTMLElement[] = [];
  const release = (i: number) => {
    const t = filled[i];
    if (t) t.classList.remove("used");
    filled[i] = null; slotEls[i].textContent = "";
  };
  for (let i = 0; i < nSlots; i++) {
    const s = h("button", { type: "button", class: "slot reading", "aria-label": `Case ${i + 1}` });
    s.addEventListener("click", () => release(i));
    slotEls.push(s); slots.appendChild(s);
  }
  view.stage.appendChild(h("div", { class: "panel" }, slots));
  const place = (tile: HTMLElement, text: string, onlySlot?: number) => {
    const i = onlySlot ?? filled.findIndex((x) => x === null);
    if (i < 0) return;
    if (filled[i]) release(i);
    filled[i] = tile; tile.classList.add("used"); slotEls[i].textContent = text;
    if (filled.every(Boolean)) {
      const built = slotEls.map((s) => s.textContent ?? "");
      setTimeout(() => onFull(built, slots), 150);
    }
  };
  banks.forEach((bank, bi) => {
    const row = h("div", { class: "row" });
    for (const t of bank) {
      const tile = h("button", { type: "button", class: "tile reading", "data-t": t }, t);
      tile.addEventListener("click", () => { if (!tile.classList.contains("used")) place(tile, t, banks.length > 1 ? bi : undefined); });
      row.appendChild(tile);
    }
    view.stage.appendChild(row);
  });
  const freeTile = (text: string) => Array.from(view.stage.querySelectorAll<HTMLElement>(".tile")).find((t) => t.dataset.t === text && !t.classList.contains("used"));
  return {
    reset: () => { for (let i = 0; i < nSlots; i++) release(i); },
    // Indice : pose la bonne tuile dans la case i (en retirant une mauvaise s'il y en a une).
    fillSlot: (i: number, text: string) => {
      if (slotEls[i].textContent === text) return;
      release(i);
      const tile = freeTile(text);
      if (tile) place(tile, text, i);
    },
    freeTile,
  };
}
type Builder = ReturnType<typeof slotBuilder>;
const builders = new WeakMap<SylItem, Builder>();

export const syllabes: ActivityModule<SylItem> = {
  id: "syllabes", title: "L'atelier des syllabes", domain: "lecture", island: "mots", host: "mona",
  maxLevel: 5, items: 6,
  skills: ["LECT.SYL.ECOUTE", "LECT.SYL.FABRIQUE", "LECT.MOT.FABRIQUE", "LECT.MOT.LIRE"],
  card: `<span class="reading" style="font-size:.62em;font-weight:700;color:#FF7F50">ma</span>`, pitch: "L'atelier des syllabes, pour fabriquer des syllabes et des mots.",
  startLevel: () => 1,
  // Le même mot (« lama ») ou la même syllabe ne revient pas dans la séance, quel que soit l'exercice.
  identity: (it) => it.target,

  generate(level, ctx) {
    const r = ctx.rng;
    if (level <= 2) {
      // Entendre une syllabe et la retrouver parmi 3 (puis 4, avec des syllabes qui se ressemblent).
      const pool = knownSyllables(ctx);
      const target = r.pick(pool);
      const n = level === 1 ? 3 : 4;
      const similar = pool.filter((s) => s !== target && s.length > 1 && (s[0] === target[0] || s.slice(1) === target.slice(1)));
      const others = pool.filter((s) => s !== target && !similar.includes(s));
      const ordered = level === 2 ? r.shuffle(similar).concat(r.shuffle(others)) : r.shuffle(others).concat(r.shuffle(similar));
      return { kind: "ecoute", target, choices: r.shuffle([target, ...ordered.slice(0, n - 1)]), skill: "LECT.SYL.ECOUTE", difficulty: level === 1 ? -0.2 : 0.2, form: "symbole", guess: 1 / n, level, prompt: `Écoute bien : ${say(target)}. Touche ${say(target)}.` };
    }
    if (level === 3) {
      // Fabriquer une syllabe : une consonne, une voyelle.
      const { cons, vows } = buildingSet(ctx);
      const c = r.pick(cons), v = r.pick(vows), target = c + v;
      const cTiles = r.shuffle([c, ...r.shuffle(cons.filter((x) => x !== c)).slice(0, 2)]);
      const vTiles = r.shuffle([v, ...r.shuffle(vows.filter((x) => x !== v)).slice(0, 2)]);
      return { kind: "fabrique", target, choices: [], tiles: cTiles, vowels: vTiles, skill: "LECT.SYL.FABRIQUE", difficulty: 0.5, form: "manipulation", guess: 0, level, prompt: `Fabrique ${say(target)} avec deux lettres.` };
    }
    const words = wordsFor(ctx);
    if (level === 4) {
      // Écrire un mot entendu en rangeant ses syllabes.
      const word = r.pick(words);
      const lower = word.syl.map((x) => x.toLowerCase());
      const extra = r.shuffle(knownSyllables(ctx).filter((s) => !lower.includes(s))).slice(0, word.syl.length >= 3 ? 1 : 2);
      return { kind: "mot", target: word.w, word, choices: [], tiles: r.shuffle([...word.syl, ...extra]), skill: "LECT.MOT.FABRIQUE", difficulty: word.syl.length >= 3 ? 1.2 : 0.9, form: "manipulation", guess: 0, level, prompt: `Écoute : ${sylLine(word.syl)}. ${word.w}. Range les morceaux pour écrire ${word.w}.` };
    }
    // Lire un mot seul, puis montrer l'image qui va avec : on vérifie qu'il a compris ce qu'il a lu.
    const withPicture = (w: Word) => !!PICTO[w.w];
    const pool = words.filter(withPicture).length >= 3 ? words.filter(withPicture) : WORDS.filter(withPicture);
    const word = r.pick(pool);
    const dis = r.shuffle(Object.keys(PICTO).filter((k) => k !== word.w)).slice(0, 2);
    return { kind: "lire", target: word.w, word, choices: r.shuffle([word.w, ...dis]), skill: "LECT.MOT.LIRE", difficulty: 1.5, form: "symbole", guess: 1 / 3, level, prompt: "Lis ce mot dans ta tête ou tout haut, puis touche la bonne image." };
  },

  render(item, view) {
    if (item.kind === "ecoute") {
      const row = h("div", { class: "choices" });
      for (const s of item.choices) {
        const b = h("button", { type: "button", class: "tile reading", "data-t": s, "aria-label": s, style: "min-width:max(96px,calc(var(--u) * 170));height:max(84px,calc(var(--u) * 140));font-size:max(40px,calc(var(--u) * 76))" }, s);
        b.addEventListener("click", () => view.answer(s === item.target, b, s === item.target ? undefined : `Ça, c'est ${say(s)}. Écoute : ${say(item.target)}.`));
        row.appendChild(b);
      }
      view.stage.appendChild(row);
      return;
    }
    if (item.kind === "fabrique") {
      const b = slotBuilder(view, 2, [item.tiles!, item.vowels!], (built, el) => {
        const got = built.join("");
        const ok = got === item.target;
        view.answer(ok, el, ok ? undefined : `Tu as fabriqué ${say(got)}. On cherche ${say(item.target)}.`);
        if (!ok) setTimeout(() => b.reset(), 900);
      });
      builders.set(item, b);
      return;
    }
    if (item.kind === "mot") {
      const w = item.word!;
      const pic = pictureOf(w.w);
      if (pic) view.stage.appendChild(h("div", { style: "width:max(90px,calc(var(--u) * 150));height:max(70px,calc(var(--u) * 120))", html: pic }));
      const b = slotBuilder(view, w.syl.length, [item.tiles!], (built, el) => {
        const got = built.join("");
        const ok = got === w.syl.join("");
        view.answer(ok, el, ok ? undefined : `Écoute bien : ${sylLine(w.syl)}.`);
        if (!ok) setTimeout(() => b.reset(), 900);
      });
      builders.set(item, b);
      return;
    }
    const w = item.word!;
    view.stage.appendChild(h("div", { class: "panel" }, h("div", { class: "word reading", "aria-label": w.w, html: w.syl.map((s, i) => `<span class="syl${i % 2 ? " b" : ""}">${s}</span>`).join("") })));
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const b = h("button", { type: "button", class: "card", "data-t": c, "aria-label": "Une image", style: "width:max(110px,calc(var(--u) * 200));height:max(96px,calc(var(--u) * 170))", html: pictureOf(c) });
      b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : `Ça, c'est ${NAMED[c] ?? `un ${c}`}. Relis le mot.`));
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const choiceEl = (t: string) => Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]")).find((e) => e.dataset.t === t && !e.classList.contains("used"));
    const b = builders.get(item);
    if (item.kind === "ecoute") {
      if (step === 1) return item.prompt;
      if (step === 2) { const cue = CUE_WORD[item.target[0]]; return cue ? `${say(item.target)}, ça commence comme ${cue}.` : `Écoute encore : ${say(item.target)}.`; }
      if (step === 3) {
        const wrong = item.choices.filter((c) => c !== item.target).map(choiceEl).filter((e): e is HTMLElement => !!e && e.style.opacity !== "0.25");
        if (wrong[0]) { wrong[0].style.opacity = "0.25"; wrong[0].style.pointerEvents = "none"; }
        return `Ce n'est pas celle-là. Écoute : ${say(item.target)}.`;
      }
      const right = choiceEl(item.target); if (right) glow(right);
      return `C'est celle qui brille : ${say(item.target)}.`;
    }
    if (item.kind === "fabrique") {
      if (step === 1) return item.prompt;
      if (step === 2) { const cue = CUE_WORD[item.target[0]]; return cue ? `Le premier son, c'est celui du début de ${cue}.` : item.prompt; }
      b?.fillSlot(0, item.target[0]);
      if (step === 3) return "Je pose la première lettre. Cherche la deuxième.";
      const v = b?.freeTile(item.target.slice(1)); if (v) glow(v);
      return `Touche la lettre qui brille pour finir ${say(item.target)}.`;
    }
    if (item.kind === "mot") {
      const w = item.word!;
      if (step === 1) return `Écoute les morceaux : ${sylLine(w.syl)}.`;
      if (step === 2) return `${w.w} commence par ${say(w.syl[0])}.`;
      b?.fillSlot(0, w.syl[0]);
      if (step === 3) return "Je pose le début. À toi pour la suite.";
      const t = b?.freeTile(w.syl[1]); if (t) glow(t);
      return `La suite, c'est ${say(w.syl[1])}.`;
    }
    const w = item.word!;
    if (step === 1) return "Lis chaque morceau, puis colle-les ensemble.";
    if (step === 2) return `Ça commence par ${say(w.syl[0])}.`;
    if (step === 3) return `Ça se lit : ${w.w}.`;
    const right = choiceEl(item.target); if (right) glow(right);
    return "C'est l'image qui brille.";
  },

  success(item) {
    if (item.kind === "ecoute") return `Oui, ${say(item.target)} !`;
    if (item.kind === "fabrique") return `Oui, tu as fabriqué ${say(item.target)} !`;
    if (item.kind === "mot") return `Oui ! ${sylLine(item.word!.syl)} : ${item.word!.w} !`;
    return `Oui, ${item.word!.w} !`;
  },

  sticker(summary) {
    const last = summary.last as SylItem | null;
    const text = last ? (last.word?.syl.join("") ?? last.target) : "ma";
    const reason = last?.kind === "lire" ? "Celle-ci, c'est pour les mots que tu as lus."
      : last?.kind === "mot" ? "Celle-ci, c'est pour les mots que tu as écrits."
        : "Celle-ci, c'est pour les syllabes que tu as fabriquées.";
    return { kind: "syllabe", ref: text, reason, svg: syllableStickerSVG(text) };
  },

  tip(item) {
    if (item.kind === "ecoute") return "faites-lui répéter la syllabe à voix haute avant de toucher.";
    if (item.kind === "fabrique") return "demandez-lui de dire chaque son puis de les coller : mmm… o… mo.";
    if (item.kind === "mot") return "il peut taper dans ses mains les morceaux du mot avant de les ranger.";
    return "laissez-le lire à voix haute, même lentement : c'est lui qui doit trouver.";
  },
};

export function syllableStickerSVG(text: string) {
  const size = text.length > 5 ? 15 : text.length > 3 ? 19 : 24;
  const safe = text.replace(/[<>&"]/g, "");
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#FFE0D3"/><text x="35" y="${(35 + size / 3).toFixed(1)}" text-anchor="middle" style="font-family:Andika,ui-rounded,system-ui,sans-serif;font-size:${size}px;fill:#273043">${safe}</text></svg>`;
}
