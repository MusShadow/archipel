import { imageImagier } from "../imagier";
import { urlImage } from "../images";
// Île des Mots — « Les chants de Mona » : frapper les syllabes, trouver la rime, entendre le début d'un mot.
// Activité orale : l'enfant ne lit pas, il écoute le mot et regarde l'image.
import type { Rng } from "../core";
import type { ActivityModule, Item, View } from "../host";
import { SOUND_WORDS, emoji, type SoundWord } from "../lexique";
import { sfx } from "../services";
import { esc, glow, h, icon } from "../ui";

type Kind = "frappe" | "rime" | "debut" | "son";
interface ChantItem extends Item { kind: Kind; word: SoundWord; target: string | number; choices: string[]; tricky?: boolean }

const BY = Object.fromEntries(SOUND_WORDS.map((w) => [w.w, w]));
const recent: string[] = [];
const fresh = (pool: SoundWord[], rng: Rng) => {
  const ok = pool.filter((w) => !recent.includes(w.w));
  const w = rng.pick(ok.length ? ok : pool);
  recent.push(w.w); if (recent.length > 4) recent.shift();
  return w;
};
const groupOf = (key: "rime" | "debut" | "son", w: SoundWord) => SOUND_WORDS.filter((x) => x !== w && x[key] !== null && x[key] === w[key]);
const naming = (words: string[]) => words.length > 1 ? `${words.slice(0, -1).join(", ")} ou ${words[words.length - 1]}` : words[0];
const morceaux = (n: number) => `${n} morceau${n > 1 ? "x" : ""}`;

function frappe(level: number, rng: Rng): ChantItem {
  const pool = SOUND_WORDS.filter((w) => w.n > 0 && (level <= 1 ? w.n <= 2 : true));
  const word = fresh(pool, rng);
  return { kind: "frappe", word, target: word.n, choices: [], skill: "LECT.PHONO.SYLLABES", difficulty: word.n <= 2 ? -0.6 : 0.1 + 0.2 * (word.n - 3), form: "manipulation", guess: 0.25, level,
    prompt: `Écoute : ${word.w}. Tape sur le tambour pour chaque morceau du mot, puis touche la coche.` };
}

function choice(kind: "rime" | "debut" | "son", level: number, rng: Rng, tricky = false): ChantItem {
  const keyOk = (w: SoundWord) => {
    const mates = groupOf(kind, w);
    if (kind === "son") return w.son !== null && mates.some((m) => m.debut !== w.debut);
    if (kind === "debut") return mates.some((m) => m.rime !== w.rime);
    return mates.length > 0;
  };
  const word = fresh(SOUND_WORDS.filter(keyOk), rng);
  let mates = groupOf(kind, word);
  if (kind === "son") mates = mates.filter((m) => m.debut !== word.debut);
  if (kind === "debut") mates = mates.filter((m) => m.rime !== word.rime);
  const right = rng.pick(mates);
  const others = SOUND_WORDS.filter((x) => x !== word && x[kind] !== word[kind] && x.rime !== right.rime && (kind === "rime" || x.son !== word.son));
  // Distracteur « piège » pour la rime : un mot qui commence comme la cible mais ne rime pas.
  const traps = tricky ? others.filter((x) => x.debut === word.debut || x.son === word.son) : [];
  const dis: SoundWord[] = [];
  for (const x of rng.shuffle(traps).concat(rng.shuffle(others))) { if (dis.length < 2 && !dis.includes(x)) dis.push(x); }
  const choices = rng.shuffle([right, ...dis]).map((x) => x.w);
  const skill = kind === "rime" ? "LECT.PHONO.RIME" : kind === "debut" ? "LECT.PHONO.ATTAQUE" : "LECT.PHONO.PHONEME";
  const difficulty = kind === "rime" ? (tricky ? 0.5 : 0) : kind === "debut" ? 0.4 : 0.9;
  const prompt = kind === "rime" ? `Qu'est-ce qui rime avec ${word.w} : ${naming(choices)} ?`
    : kind === "debut" ? `Qu'est-ce qui commence comme ${word.w} : ${naming(choices)} ?`
      : `Qu'est-ce qui commence par le même son que ${word.w} : ${naming(choices)} ?`;
  return { kind, word, target: right.w, choices, tricky, skill, difficulty, form: "image", guess: 1 / 3, level, prompt };
}

function pictureCard(w: SoundWord, big = false) {
  return h("div", { class: `pic${big ? " big" : ""}`, html: emoji(w.e) });
}

export const chants: ActivityModule<ChantItem> = {
  id: "chants", title: "Les chants de Mona", domain: "lecture", island: "mots", host: "mona",
  maxLevel: 5, items: 6,
  skills: ["LECT.PHONO.SYLLABES", "LECT.PHONO.RIME", "LECT.PHONO.ATTAQUE", "LECT.PHONO.PHONEME"],
  card: emoji("🎵"), pitch: "Les chants de Mona, pour jouer avec les sons des mots.",
  startLevel: () => 1,
  identity: (it) => it.word.w,

  generate(level, ctx) {
    const r = ctx.rng;
    if (level <= 1) return frappe(1, r);
    if (level === 2) return r.next() < 0.6 ? choice("rime", 2, r) : frappe(2, r);
    if (level === 3) return r.next() < 0.5 ? choice("rime", 3, r, true) : frappe(3, r);
    if (level === 4) return r.next() < 0.7 ? choice("debut", 4, r) : choice("rime", 4, r, true);
    return r.next() < 0.7 ? choice("son", 5, r) : choice("debut", 5, r);
  },

  render(item, view) {
    if (item.kind === "frappe") return renderDrum(item, view);
    view.stage.appendChild(h("div", { class: "row", style: "gap:max(10px,calc(var(--u) * 18))" },
      pictureCard(item.word, true),
      h("div", { class: "title", style: "font-size:max(24px,calc(var(--u) * 40))" }, item.word.w)));
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const w = BY[c];
      const b = h("button", { type: "button", class: "card pickcard", "data-t": c, "data-say": c, "aria-label": c, html: emoji(w.e) });
      b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : `${c}… et ${item.word.w}. Écoute bien : ${item.kind === "rime" ? "la fin" : "le début"} n'est pas pareil.`));
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const w = item.word;
    if (item.kind === "frappe") {
      if (step === 1) return item.prompt;
      if (step === 2) return `Écoute les morceaux : ${w.say.join("… ")}.`;
      const beats = view.stage.querySelector<HTMLElement>(".beats");
      if (beats) { beats.dataset.ghost = String(w.n); beats.dispatchEvent(new Event("redraw")); }
      if (step === 3) return `${w.say.join("… ")}. Compte avec tes doigts.`;
      const drum = view.stage.querySelector<HTMLElement>(".drum"); if (drum) glow(drum);
      return `Il y a ${morceaux(w.n)} : tape ${w.n} fois, puis touche la coche.`;
    }
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
    if (step === 1) return item.prompt;
    if (step === 2) {
      const part = item.kind === "rime" ? "la fin" : item.kind === "debut" ? "le début" : "le tout premier son";
      return `Écoute bien ${part} de chaque mot : ${w.w}… ${item.choices.join("… ")}.`;
    }
    if (step === 3) {
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return `Ce n'est pas ${wrong?.dataset.t ?? "celui-là"}. ${item.prompt}`;
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return `Écoute : ${w.w}, ${item.target}. C'est celui qui brille.`;
  },

  success(item) {
    const w = item.word;
    if (item.kind === "frappe") return `Oui ! ${w.say.join(", ")} : ${morceaux(w.n)}.`;
    if (item.kind === "rime") return `Oui ! ${w.w}, ${item.target} : ça rime !`;
    return `Oui ! ${w.w}, ${item.target} : ils commencent pareil.`;
  },

  sticker(summary) {
    const last = summary.last as ChantItem | null;
    const e = last?.word.e ?? "🎵";
    const reason = last?.kind === "frappe" ? "Celle-ci, c'est pour tous les mots que tu as frappés en rythme."
      : last?.kind === "rime" ? "Celle-ci, c'est pour les rimes que tu as entendues." : "Celle-ci, c'est parce que tu as bien écouté le début des mots.";
    return { kind: "chant", ref: e, reason, svg: emojiStickerSVG(e, "#FFE0D3") };
  },

  tip(item) {
    if (item.kind === "frappe") return "tapez dans vos mains ensemble en disant le mot lentement, un morceau à la fois.";
    if (item.kind === "rime") return "dites les mots en insistant sur la fin : bat-eau, gât-eau.";
    if (item.kind === "debut") return "insistez sur le début des mots : ba-teau, ba-llon.";
    return "faites durer le premier son : mmmoto, mmmaison.";
  },
};

function renderDrum(item: ChantItem, view: View) {
  let count = 0;
  const beats = h("div", { class: "beats", "aria-live": "polite", "data-count": "0" });
  const draw = () => {
    beats.dataset.count = String(count);
    const ghost = Number(beats.dataset.ghost ?? 0);
    const n = Math.max(count, ghost, 1);
    beats.replaceChildren(...Array.from({ length: Math.min(6, n) }, (_, i) => h("span", { class: `beat${i < count ? " on" : i < ghost ? " ghost" : " off"}` })));
    beats.setAttribute("aria-label", `${count} coup${count > 1 ? "s" : ""}`);
  };
  const drum = h("button", { type: "button", class: "drum", "aria-label": "Tambour", html: DRUM });
  drum.addEventListener("click", () => {
    if (count >= 6) return;
    count++; draw();
    drum.classList.remove("hit"); void drum.offsetWidth; drum.classList.add("hit");
    sfx.drum();
  });
  beats.addEventListener("redraw", draw);
  const undo = h("button", { type: "button", class: "round", "aria-label": "Recommencer", html: icon("undo") });
  undo.addEventListener("click", () => { count = 0; draw(); });
  const ok = h("button", { type: "button", class: "round ok", "aria-label": "C'est prêt", html: icon("check", "#fff", 3) });
  ok.addEventListener("click", () => {
    if (count === 0) return;
    const right = count === item.word.n;
    view.answer(right, ok, right ? undefined : `Tu as tapé ${count} fois. Écoute : ${item.word.say.join("… ")}.`);
    if (!right) { count = 0; setTimeout(draw, 600); }
  });
  draw();
  view.stage.appendChild(h("div", { class: "row", style: "gap:max(14px,calc(var(--u) * 30))" }, pictureCard(item.word, true), drum));
  view.stage.appendChild(beats);
  view.stage.appendChild(h("div", { class: "row" }, undo, ok));
}

const DRUM = `<svg viewBox="0 0 120 110" aria-hidden="true" style="display:block;width:100%;height:100%"><ellipse cx="60" cy="88" rx="46" ry="14" fill="#C2410C"/><rect x="14" y="34" width="92" height="54" fill="#FF7F50"/><path d="M14 40 L34 86 M34 40 L54 86 M54 40 L74 86 M74 40 L94 86 M94 40 L106 70" stroke="#FFE0D3" stroke-width="4" fill="none"/><ellipse cx="60" cy="34" rx="46" ry="14" fill="#FFF7EA" stroke="#C2410C" stroke-width="4"/><path d="M84 6 L66 30" stroke="#A0673F" stroke-width="6" stroke-linecap="round"/><circle cx="86" cy="5" r="6" fill="#FFC145"/></svg>`;

// Gommette ronde : bord blanc, disque de la couleur de l'île, l'image de l'imagier au milieu (l'emoji s'il n'en a pas).
export const emojiStickerSVG = (e: string, tint: string) => {
  const im = imageImagier(e);
  const motif = im ? `<image href="${urlImage(im.fichier)}" x="14" y="14" width="42" height="42"/>` : `<text x="35" y="45" text-anchor="middle" style="font-size:30px">${esc(e)}</text>`;
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="39" r="33" fill="#E6DAC4" opacity=".8"/><circle cx="35" cy="35" r="33" fill="#FFFDF8" stroke="#E2CBA6" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="${tint}"/>${motif}</svg>`;
};
