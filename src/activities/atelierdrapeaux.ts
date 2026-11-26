// Port des Voyages — « L'atelier des drapeaux » : colorier un drapeau d'après le modèle, puis de mémoire,
// puis repérer le vrai drapeau parmi des drapeaux à l'envers ou aux couleurs échangées.
import type { Rng } from "../core";
import { FLAG_BY_CODE, cap } from "../flags";
import type { ActivityModule, Item } from "../host";
import { sfx } from "../services";
import { glow, h, wobble } from "../ui";
import { flagStickerSVG } from "./drapeau";

export type Col = "bleu" | "blanc" | "rouge" | "vert" | "jaune" | "noir" | "orange";
export const COL: Record<Col, string> = { bleu: "#1F5FB8", blanc: "#FFFFFF", rouge: "#E1323B", vert: "#169B57", jaune: "#FCD116", noir: "#1D1D1B", orange: "#F7891F" };
export const COL_ORDER: Col[] = ["bleu", "blanc", "rouge", "vert", "jaune", "noir", "orange"];
interface Striped { code: string; dir: "v" | "h"; bands: Col[]; lvl: 1 | 2 | 3 }
export const STRIPED: Striped[] = [
  { code: "FR", dir: "v", bands: ["bleu", "blanc", "rouge"], lvl: 1 },
  { code: "IT", dir: "v", bands: ["vert", "blanc", "rouge"], lvl: 1 },
  { code: "DE", dir: "h", bands: ["noir", "rouge", "jaune"], lvl: 1 },
  { code: "BE", dir: "v", bands: ["noir", "jaune", "rouge"], lvl: 1 },
  { code: "PL", dir: "h", bands: ["blanc", "rouge"], lvl: 1 },
  { code: "UA", dir: "h", bands: ["bleu", "jaune"], lvl: 1 },
  { code: "ML", dir: "v", bands: ["vert", "jaune", "rouge"], lvl: 2 },
  { code: "IE", dir: "v", bands: ["vert", "blanc", "orange"], lvl: 2 },
  { code: "CI", dir: "v", bands: ["orange", "blanc", "vert"], lvl: 2 },
  { code: "RO", dir: "v", bands: ["bleu", "jaune", "rouge"], lvl: 2 },
  { code: "NL", dir: "h", bands: ["rouge", "blanc", "bleu"], lvl: 2 },
  { code: "RU", dir: "h", bands: ["blanc", "bleu", "rouge"], lvl: 2 },
  { code: "AT", dir: "h", bands: ["rouge", "blanc", "rouge"], lvl: 2 },
  { code: "HU", dir: "h", bands: ["rouge", "blanc", "vert"], lvl: 2 },
  { code: "GN", dir: "v", bands: ["rouge", "jaune", "vert"], lvl: 2 },
  { code: "NG", dir: "v", bands: ["vert", "blanc", "vert"], lvl: 2 },
  { code: "PE", dir: "v", bands: ["rouge", "blanc", "rouge"], lvl: 2 },
  { code: "ID", dir: "h", bands: ["rouge", "blanc"], lvl: 2 },
  { code: "BG", dir: "h", bands: ["blanc", "vert", "rouge"], lvl: 3 },
  { code: "LT", dir: "h", bands: ["jaune", "vert", "rouge"], lvl: 3 },
  { code: "GA", dir: "h", bands: ["vert", "jaune", "bleu"], lvl: 3 },
];
const BY_CODE = Object.fromEntries(STRIPED.map((s) => [s.code, s]));
const PLACE: Record<"v" | "h", string[][]> = {
  v: [[], [], ["gauche", "droite"], ["gauche", "milieu", "droite"]],
  h: [[], [], ["haut", "bas"], ["haut", "milieu", "bas"]],
};
const where = (dir: "v" | "h", n: number, i: number) => { const w = PLACE[dir][n][i]; return w === "milieu" ? "la bande du milieu" : `la bande ${w === "haut" || w === "bas" ? "du" : "de"} ${w}`; };

// Drapeau à bandes, dans un cadre 3:2 commun à tous (le modèle et le dessin ont la même forme).
export function stripedSVG(dir: "v" | "h", bands: (Col | null)[], opts: { stroke?: boolean; grid?: boolean } = {}) {
  const n = bands.length, W = 90, H = 60;
  const rects = bands.map((b, i) => {
    const x = dir === "v" ? (i * W) / n : 0, y = dir === "h" ? (i * H) / n : 0, w = dir === "v" ? W / n + 0.3 : W, hh = dir === "h" ? H / n + 0.3 : H;
    return `<rect data-b="${i}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${hh.toFixed(2)}" fill="${b ? COL[b] : "url(#hatch)"}"/>`;
  }).join("");
  // Pour colorier : des pointillés séparent les bandes, pour qu'on les voie même vides.
  const lines = opts.grid ? Array.from({ length: n - 1 }, (_, k) => {
    const t = ((k + 1) * (dir === "v" ? W : H)) / n;
    return dir === "v" ? `<line x1="${t.toFixed(2)}" y1="0" x2="${t.toFixed(2)}" y2="60"/>` : `<line x1="0" y1="${t.toFixed(2)}" x2="90" y2="${t.toFixed(2)}"/>`;
  }).join("") : "";
  return `<svg viewBox="-2 -2 94 64" aria-hidden="true" style="display:block;width:100%;height:100%"><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#F4EEE3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#E0D5C2" stroke-width="2"/></pattern></defs>${rects}${lines ? `<g stroke="#8A8173" stroke-width="0.9" stroke-dasharray="2.2 1.8" pointer-events="none">${lines}</g>` : ""}<rect x="0" y="0" width="90" height="60" fill="none" stroke="#273043" stroke-width="${opts.stroke === false ? 0 : 1.6}" rx="1.5" pointer-events="none"/></svg>`;
}

type Kind = "modele" | "memoire" | "intrus";
interface AtelierItem extends Item { kind: Kind; code: string; dir: "v" | "h"; bands: Col[]; palette: Col[]; target: string; choices: string[]; variants: Record<string, { dir: "v" | "h"; bands: Col[] }> }

function flagPool(level: number, seen: Set<string>, r: Rng): Striped {
  const max = level <= 1 ? 1 : level === 2 ? 2 : 3;
  const pool = STRIPED.filter((s) => s.lvl <= max);
  const known = pool.filter((s) => seen.has(s.code));
  // On colorie surtout des drapeaux déjà croisés au Port, avec un peu de nouveauté.
  return r.pick(known.length >= 3 && r.next() < 0.7 ? known : pool);
}
function intrusVariants(s: Striped, r: Rng) {
  const out: { dir: "v" | "h"; bands: Col[] }[] = [];
  const key = (v: { dir: string; bands: Col[] }) => `${v.dir}${v.bands.join()}`;
  const push = (v: { dir: "v" | "h"; bands: Col[] }) => { if (key(v) !== key(s) && !out.some((o) => key(o) === key(v))) out.push(v); };
  push({ dir: s.dir, bands: s.bands.slice().reverse() });
  push({ dir: s.dir === "v" ? "h" : "v", bands: s.bands.slice() });
  for (let k = 0; k < 6 && out.length < 3; k++) {
    const b = s.bands.slice(); const i = r.int(0, b.length - 1);
    b[i] = r.pick(COL_ORDER.filter((c) => !s.bands.includes(c)));
    push({ dir: s.dir, bands: b });
  }
  return r.shuffle(out).slice(0, 2);
}

// Ce que Plume dit quand des bandes sont fausses (une, ou plusieurs) : ces phrases n'arrivent qu'après un coloriage
// complet, que l'inventaire de la voix ne fait pas tout seul ; voiceLines() les lui donne.
const BANDES_FAUSSES = {
  memoire: ["Une bande n'a pas la bonne couleur. Elle s'est effacée : essaie encore !", "Quelques bandes n'ont pas la bonne couleur. Elles se sont effacées : essaie encore !"],
  modele: ["Regarde bien le modèle : une bande n'a pas la bonne couleur.", "Regarde bien le modèle : quelques bandes n'ont pas la bonne couleur."],
};
export const voiceLines = () => [
  ...[...BANDES_FAUSSES.memoire, ...BANDES_FAUSSES.modele].map((text) => ({ text, fam: "atelierdrapeaux:erreur" })),
  { text: "Choisis d'abord une couleur, en bas.", fam: "atelierdrapeaux:rendu" },
  ...Object.keys(COL).map((c) => ({ text: c, fam: "atelierdrapeaux:rendu" })),
];

export const atelierdrapeaux: ActivityModule<AtelierItem> = {
  id: "atelierdrapeaux", title: "L'atelier des drapeaux", domain: "voyages", island: "port", host: "plume",
  maxLevel: 4, items: 4,
  skills: ["VOY.DRAPEAU.CONSTRUIRE", "VOY.DRAPEAU.MIROIR"],
  card: `<span style="display:block;width:1.3em;height:.9em">${stripedSVG("v", ["bleu", null, "rouge"])}</span>`,
  pitch: "L'atelier des drapeaux, pour colorier les drapeaux du monde.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.code}`,

  generate(level, ctx) {
    const r = ctx.rng;
    const seen = new Set(Object.entries(ctx.profile.flags).filter(([, s]) => s.seen > 0).map(([c]) => c));
    const kind: Kind = level <= 2 ? "modele" : level === 3 ? "memoire" : r.next() < 0.55 ? "intrus" : "memoire";
    let s = flagPool(level, seen, r);
    if (kind === "intrus") {
      while (new Set(s.bands).size === 1 || s.bands.join() === s.bands.slice().reverse().join()) s = r.pick(STRIPED.filter((x) => x.lvl <= 3));
      const vs = intrusVariants(s, r);
      const variants: AtelierItem["variants"] = { vrai: { dir: s.dir, bands: s.bands } };
      vs.forEach((v, i) => { variants[`faux${i}`] = v; });
      const fl = FLAG_BY_CODE[s.code];
      return { kind, code: s.code, dir: s.dir, bands: s.bands, palette: [], target: "vrai", choices: r.shuffle(Object.keys(variants)), variants,
        skill: "VOY.DRAPEAU.MIROIR", difficulty: 1.2, form: "image", guess: 1 / 3, level, prompt: `Attention, des drapeaux sont à l'envers ou se trompent de couleur ! Touche le vrai drapeau ${fl.of}.` };
    }
    const need = Array.from(new Set(s.bands));
    const extra = r.shuffle(COL_ORDER.filter((c) => !need.includes(c)));
    const palette = level <= 1 ? r.shuffle([...need, ...extra.slice(0, Math.max(1, 4 - need.length))]) : COL_ORDER.slice();
    const fl = FLAG_BY_CODE[s.code];
    return { kind, code: s.code, dir: s.dir, bands: s.bands, palette, target: s.bands.join("-"), choices: [], variants: {},
      skill: "VOY.DRAPEAU.CONSTRUIRE", difficulty: kind === "memoire" ? 1 : level <= 1 ? -0.3 : 0.2, form: "manipulation", guess: 0, level,
      prompt: kind === "memoire" ? `Colorie le drapeau ${fl.of}, de mémoire ! Choisis une couleur, puis touche une bande.` : `Colorie le drapeau ${fl.of} comme le modèle. Choisis une couleur, puis touche une bande.` };
  },

  intro(item) {
    if (item.kind !== "memoire") return null;
    const fl = FLAG_BY_CODE[item.code];
    return { text: `Regarde bien le drapeau ${fl.of}. Quand tu l'as bien en tête, touche la flèche : il va se cacher !`, el: h("div", { class: "flagmodel big", html: stripedSVG(item.dir, item.bands) }) };
  },

  render(item, view) {
    if (item.kind === "intrus") {
      const row = h("div", { class: "choices" });
      for (const c of item.choices) {
        const v = item.variants[c];
        const b = h("button", { type: "button", class: "card pickcard flagcard", "data-t": c, "aria-label": "Un drapeau", html: stripedSVG(v.dir, v.bands) });
        b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : explain(item, c)));
        row.appendChild(b);
      }
      view.stage.appendChild(row);
      return;
    }
    const fill: (Col | null)[] = item.bands.map(() => null);
    let pen: Col | null = null;
    const frame = h("div", { class: "flagpaint" });
    const draw = () => {
      frame.innerHTML = stripedSVG(item.dir, fill, { grid: true });
      const svg = frame.querySelector("svg")!;
      // Les bandes portent leur numéro (data-b) : le motif hachuré des bandes vides est aussi un rectangle, et compter
      // les rectangles décalait tout d'un cran (toucher une bande coloriait sa voisine).
      svg.querySelectorAll<SVGRectElement>("rect[data-b]").forEach((rect) => {
        const i = Number(rect.getAttribute("data-b"));
        rect.setAttribute("role", "button");
        rect.setAttribute("aria-label", `${cap(where(item.dir, item.bands.length, i))}${fill[i] ? `, ${fill[i]}` : ", pas encore coloriée"}`);
      });
    };
    frame.addEventListener("click", (e) => {
      const t = (e.target as Element).closest("[data-b]");
      if (!t) return;
      const i = Number(t.getAttribute("data-b"));
      if (!pen) { view.say("Choisis d'abord une couleur, en bas."); glow(palette); setTimeout(() => glow(palette, false), 1600); return; }
      fill[i] = pen; sfx.tap(); draw();
      if (fill.every((f) => f)) check();
    });
    const check = () => {
      const wrong = fill.map((f, i) => (f !== item.bands[i] ? i : -1)).filter((i) => i >= 0);
      if (!wrong.length) { view.answer(true, frame); return; }
      // Les bandes fausses s'effacent : l'enfant les recolorie (on ne compte pas une erreur à chaque toucher).
      wrong.forEach((i) => { fill[i] = null; });
      wobble(frame);
      setTimeout(draw, 350);
      view.answer(false, null, BANDES_FAUSSES[item.kind === "memoire" ? "memoire" : "modele"][wrong.length > 1 ? 1 : 0]);
    };
    const palette = h("div", { class: "palette" });
    for (const c of item.palette) {
      const b = h("button", { type: "button", class: "swatch big", "data-c": c, style: `background:${COL[c]}`, "aria-label": c });
      b.addEventListener("click", () => { pen = c; sfx.tap(); view.say(c); palette.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x === b)); });
      palette.appendChild(b);
    }
    (frame as any)._fill = fill; (frame as any)._draw = draw;
    draw();
    const row = h("div", { class: "row flagrow" });
    if (item.kind === "modele") row.appendChild(h("div", { class: "flagmodel", "aria-label": "Le modèle", html: stripedSVG(item.dir, item.bands) }));
    else row.appendChild(h("div", { class: "flagmodel hidden", "aria-label": "Le modèle est caché", html: stripedSVG(item.dir, item.bands) }));
    row.appendChild(frame);
    view.stage.appendChild(row);
    view.stage.appendChild(palette);
  },

  hint(item, step, view) {
    if (step === 1) return item.prompt;
    if (item.kind === "intrus") {
      const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
      if (step === 2) return describe(item);
      if (step === 3) { const w = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25"); if (w) { w.style.opacity = "0.25"; w.style.pointerEvents = "none"; } return "Ce n'est pas celui-là. Regarde les deux qui restent."; }
      const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
      return "C'est celui qui brille.";
    }
    const frame = view.stage.querySelector<HTMLElement>(".flagpaint");
    const fill = (frame as any)?._fill as (Col | null)[] | undefined;
    const model = view.stage.querySelector<HTMLElement>(".flagmodel");
    if (item.kind === "memoire" && model) { model.classList.remove("hidden"); setTimeout(() => model.classList.add("hidden"), step >= 3 ? 4000 : 2500); }
    const i = fill ? fill.findIndex((f, k) => f !== item.bands[k]) : 0;
    const k = Math.max(0, i);
    if (step === 2) return item.kind === "memoire" ? `Je te remontre le modèle. ${describe(item)}` : `${cap(where(item.dir, item.bands.length, k))} est ${item.bands[k]}.`;
    const sw = view.stage.querySelector<HTMLElement>(`.swatch[data-c="${item.bands[k]}"]`);
    if (sw) glow(sw);
    if (step === 4 && fill && frame) {
      item.bands.forEach((b, j) => { if (j !== k) fill[j] = b; });
      (frame as any)._draw?.();
      return `Il ne reste que ${where(item.dir, item.bands.length, k)} : touche le ${item.bands[k]} qui brille, puis la bande.`;
    }
    return `${cap(where(item.dir, item.bands.length, k))} est ${item.bands[k]}. Touche la couleur qui brille, puis la bande.`;
  },

  success(item) {
    const fl = FLAG_BY_CODE[item.code];
    return item.kind === "intrus" ? `Oui, c'est le vrai drapeau ${fl.of} !` : `Bravo, c'est bien le drapeau ${fl.of} !`;
  },

  onResult(item, firstTry, ctx) {
    // Un drapeau colorié entre aussi dans le passeport du carnet.
    const st = ctx.profile.flags[item.code] ?? { seen: 0, ok: 0, last: 0 };
    ctx.profile.flags[item.code] = { seen: st.seen + 1, ok: st.ok + (firstTry ? 1 : 0), last: Date.now() };
  },

  sticker(summary) {
    const it = summary.last as AtelierItem | null;
    const code = it?.code ?? "FR";
    return { kind: "drapeau", ref: code, reason: it?.kind === "intrus" ? "Celle-ci, c'est parce que tu as reconnu les vrais drapeaux, même à l'envers." : "Celle-ci, c'est pour les drapeaux que tu as coloriés.", svg: flagStickerSVG(code) };
  },

  tip(item) {
    if (item.kind === "intrus") return "faites-lui décrire le vrai drapeau avant de choisir (« bleu à gauche… »).";
    if (item.kind === "memoire") return "avant de cacher le modèle, faites-lui dire les couleurs dans l'ordre.";
    return "nommez ensemble les couleurs, de gauche à droite ou de haut en bas.";
  },
};

function describe(item: { dir: "v" | "h"; bands: Col[] }) {
  const n = item.bands.length;
  return `${item.bands.map((b, i) => `${PLACE[item.dir][n][i] === "milieu" ? "au milieu" : `${PLACE[item.dir][n][i] === "haut" || PLACE[item.dir][n][i] === "bas" ? "en" : "à"} ${PLACE[item.dir][n][i]}`}, ${b}`).join(" ; ")}.`.replace(/^./, (c) => c.toUpperCase());
}
function explain(item: AtelierItem, c: string) {
  const v = item.variants[c];
  if (v.dir !== item.dir) return "Celui-là a les bandes dans l'autre sens. Cherche encore !";
  if (v.bands.join() === item.bands.slice().reverse().join()) {
    const twin = STRIPED.find((s) => s.dir === v.dir && s.bands.join() === v.bands.join());
    return twin ? `Celui-là, c'est le drapeau ${FLAG_BY_CODE[twin.code].of} ! Il ressemble beaucoup, mais à l'envers.` : "Celui-là est à l'envers, comme dans un miroir. Cherche encore !";
  }
  return "Celui-là a une couleur qui se trompe. Cherche encore !";
}
export { BY_CODE as STRIPED_BY_CODE };
