// Île des Mots — « Lis et trouve » : lire un mot, deux mots, puis une petite phrase, et montrer l'image qui va avec.
// Seuls les mots déchiffrables avec les sons connus sont proposés ; les petits mots-outils sont soulignés.
import { decodable, knownSet } from "../content";
import type { Rng } from "../core";
import type { ActivityModule, Ctx, Item } from "../host";
import { READ_WORDS, emoji, sightHTML, wordHTML, type ReadWord } from "../lexique";
import { glow, h } from "../ui";
import { emojiStickerSVG } from "./chants";

type Kind = "mot" | "groupe" | "phrase";
interface Scene { a: ReadWord; b?: ReadWord; mode: "one" | "pair" | "stack" }
interface LisItem extends Item { kind: Kind; words: (ReadWord | string)[]; plain: string; target: string; choices: string[]; scenes: Record<string, Scene> }

const BY = Object.fromEntries(READ_WORDS.map((w) => [w.w, w]));
function readable(known: Set<string>) {
  const ok = READ_WORDS.filter((w) => decodable(w.gp, known));
  return ok.length >= 4 ? ok : READ_WORDS.slice(0, 6);
}
const sceneId = (s: Scene) => s.mode === "one" ? s.a.w : s.mode === "pair" ? `${s.a.w}+${s.b!.w}` : `${s.a.w}/${s.b!.w}`;
const withArt = (r: ReadWord): (ReadWord | string)[] => (r.art ? [r.art, r] : [r]);
const plainOf = (words: (ReadWord | string)[]) => words.map((x) => (typeof x === "string" ? x : x.w)).join(" ");
const recent: string[] = [];
function pickFresh(pool: ReadWord[], rng: Rng, avoid: ReadWord[] = []) {
  const ok = pool.filter((w) => !avoid.includes(w) && !recent.includes(w.w));
  const w = rng.pick(ok.length ? ok : pool.filter((x) => !avoid.includes(x)));
  recent.push(w.w); if (recent.length > 4) recent.shift();
  return w;
}

function make(kind: Kind, level: number, ctx: Ctx): LisItem {
  const r = ctx.rng;
  const pool = readable(ctx.known);
  const scenes: Record<string, Scene> = {};
  const add = (s: Scene) => { scenes[sceneId(s)] = s; return sceneId(s); };
  if (kind === "mot") {
    const a = pickFresh(pool, r);
    // Au niveau 2, les autres images ont un mot qui commence pareil : il faut lire jusqu'au bout.
    const similar = pool.filter((w) => w !== a && w.gp[0] === a.gp[0]);
    const rest = pool.filter((w) => w !== a && !similar.includes(w));
    const dis = (level >= 2 ? r.shuffle(similar).concat(r.shuffle(rest)) : r.shuffle(rest).concat(r.shuffle(similar))).slice(0, 2);
    const target = add({ a, mode: "one" });
    dis.forEach((d) => add({ a: d, mode: "one" }));
    const words = [a];
    return { kind, words, plain: a.w, target, choices: r.shuffle(Object.keys(scenes)), scenes, skill: "LECT.MOT.LIRE", difficulty: level >= 2 ? 1.6 : 1.4, form: "symbole", guess: 1 / 3, level, prompt: "Lis ce mot dans ta tête ou tout haut, puis touche la bonne image." };
  }
  const a = pickFresh(pool, r);
  const b = pickFresh(pool, r, [a]);
  const c = pickFresh(pool, r, [a, b]);
  if (kind === "groupe") {
    const words = [...withArt(a), "et", ...withArt(b)];
    const target = add({ a, b, mode: "pair" });
    add({ a, b: c, mode: "pair" });
    add({ a: c, b, mode: "pair" });
    return { kind, words, plain: plainOf(words), target, choices: r.shuffle(Object.keys(scenes)), scenes, skill: "LECT.GROUPE.LIRE", difficulty: 1.6, form: "symbole", guess: 1 / 3, level, prompt: "Lis, puis touche l'image qui montre les deux." };
  }
  const words = [...withArt(a), "est", "sur", ...withArt(b)];
  const target = add({ a, b, mode: "stack" });
  add({ a: b, b: a, mode: "stack" });
  add({ a: c, b, mode: "stack" });
  return { kind, words, plain: plainOf(words), target, choices: r.shuffle(Object.keys(scenes)), scenes, skill: "LECT.PHRASE.LIRE", difficulty: 2, form: "symbole", guess: 1 / 3, level, prompt: "Lis la phrase, puis touche la bonne image." };
}

function textHTML(item: LisItem, colored: boolean) {
  return item.words.map((x) => (typeof x === "string" ? sightHTML(x) : wordHTML(x, colored))).join(" ");
}
function sceneHTML(s: Scene) {
  if (s.mode === "one") return emoji(s.a.pic);
  if (s.mode === "pair") return `<span class="pair">${emoji(s.a.pic)}${emoji(s.b!.pic)}</span>`;
  return `<span class="stack">${emoji(s.a.pic, ".72em")}${emoji(s.b!.pic)}</span>`;
}

export const lis: ActivityModule<LisItem> = {
  id: "lis", title: "Lis et trouve", domain: "lecture", island: "mots", host: "mona",
  maxLevel: 4, items: 6,
  skills: ["LECT.MOT.LIRE", "LECT.GROUPE.LIRE", "LECT.PHRASE.LIRE"],
  card: emoji("📖"), pitch: "Lis et trouve, pour lire des mots et des petites phrases.",
  available: (p) => READ_WORDS.filter((w) => decodable(w.gp, knownSet(p.knownK))).length >= 4,
  lockedReason: "Lis et trouve s'ouvrira quand tu connaîtras quelques sons de plus.",
  startLevel: () => 1,
  identity: (it) => it.plain,

  generate(level, ctx) {
    const kind: Kind = level <= 2 ? "mot" : level === 3 ? (ctx.rng.next() < 0.7 ? "groupe" : "mot") : (ctx.rng.next() < 0.7 ? "phrase" : "groupe");
    return make(kind, level, ctx);
  },

  render(item, view) {
    view.stage.appendChild(h("div", { class: "panel" }, h("div", { class: "word reading readline", "aria-label": item.plain, html: textHTML(item, false) })));
    const row = h("div", { class: "choices" });
    for (const id of item.choices) {
      const b = h("button", { type: "button", class: "card pickcard", "data-t": id, "aria-label": "Une image", html: sceneHTML(item.scenes[id]) });
      b.addEventListener("click", () => view.answer(id === item.target, b, id === item.target ? undefined : "Regarde bien l'image, et relis doucement."));
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const line = view.stage.querySelector<HTMLElement>(".readline");
    if (line) line.innerHTML = textHTML(item, true);
    const first = item.words.find((x): x is ReadWord => typeof x !== "string")!;
    if (step === 1) return item.kind === "mot" ? "Lis chaque morceau de couleur, puis colle-les ensemble." : "Lis les mots un par un. Les mots soulignés, ce sont des petits mots qu'on connaît par cœur.";
    if (step === 2) {
      if (item.kind === "mot") return `Ça commence par « ${first.syl[0]} ».`;
      const sight = item.words.filter((x): x is string => typeof x === "string");
      return `Les petits mots soulignés se lisent : ${sight.join(", ")}.`;
    }
    if (step === 3) return `Ça se lit : ${item.plain}.`;
    const right = view.stage.querySelector<HTMLElement>(`[data-t="${item.target}"]`); if (right) glow(right);
    return "C'est l'image qui brille.";
  },

  success(item) {
    const p = item.plain;
    return `Oui ! ${p.charAt(0).toUpperCase()}${p.slice(1)}.`;
  },

  sticker(summary) {
    const last = summary.last as LisItem | null;
    const a = last ? last.scenes[last.target]?.a : BY.lama;
    const reason = last?.kind === "phrase" ? "Celle-ci, c'est pour les phrases que tu as lues." : "Celle-ci, c'est pour les mots que tu as lus tout seul.";
    return { kind: "livre", ref: a?.pic ?? "📖", reason, svg: emojiStickerSVG(a?.pic ?? "📖", "#FFE0D3") };
  },

  tip(item) {
    if (item.kind === "mot") return "laissez-le lire seul, même lentement ; les lettres grises ne se prononcent pas.";
    return "les mots soulignés en pointillés sont des mots-outils (le, la, et, est, sur) : on les apprend par cœur.";
  },
};
