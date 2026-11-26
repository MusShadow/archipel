// Port des Voyages — « Le drapeau mystère » : reconnaître, lire, distinguer, situer.
import { decodable } from "../content";
import type { Profile } from "../services";
import { CONTINENTS, FLAGS, FLAG_BY_CODE, TWINS, cap, continentPath, flagSVG, isIn, project, type FlagDef } from "../flags";
import type { ActivityModule, Ctx, Item, View } from "../host";
import { glow, h } from "../ui";
import { calqueSVG, image } from "../design/dessins";

type Kind = "ecoute" | "lire" | "jumeaux" | "carte";
interface FlagItem extends Item { kind: Kind; target: string; choices: string[]; isNew: boolean }

const INTRO_ORDER = ["FR", "JP", "IT", "CA", "US", "GB", "CH", "ML", "CN", "DE", "BE", "MA", "SN", "VN", "IN", "SE", "DK", "GR", "NL", "PE", "CU", "PA", "TG",
  "NO", "FI", "IE", "CI", "RU", "AT", "PL", "UA", "RO", "TD", "GN", "NG", "CM", "CO", "CL", "BD", "LA", "ID", "MC", "LU", "HU", "BG", "LT", "GA", "SO", "CZ", "PW"];
const CAT: Record<string, string> = {};
for (const c of ["FR", "IT", "BE", "IE", "RO", "TD", "CI", "ML", "GN", "NG", "PE"]) CAT[c] = "bandesV";
for (const c of ["DE", "NL", "LU", "RU", "AT", "HU", "BG", "LT", "GA"]) CAT[c] = "bandesH";
for (const c of ["PL", "MC", "ID", "UA"]) CAT[c] = "deux";
for (const c of ["CH", "DK", "SE", "NO", "FI", "GR", "GB"]) CAT[c] = "croix";
for (const c of ["JP", "BD", "LA", "PW"]) CAT[c] = "rond";
for (const c of ["SN", "CM", "SO", "VN", "CN", "MA", "TG", "CU", "PA", "CL", "US"]) CAT[c] = "etoile";
for (const c of ["CZ", "CO", "IN", "CA"]) CAT[c] = "autre";

const stat = (p: Profile, code: string) => p.flags[code] ?? { seen: 0, ok: 0, last: 0 };
const readable = (fl: FlagDef, known: Set<string>) => !!fl.gp && decodable(fl.gp, known);

// Derniers drapeaux montrés : on évite de redemander le même juste après.
const recent: string[] = [];
const remember = (code: string) => { recent.push(code); if (recent.length > 3) recent.shift(); return code; };

function chooseTarget(ctx: Ctx, allowNew: boolean, filter?: (f: FlagDef) => boolean): { code: string; isNew: boolean } {
  const p = ctx.profile;
  const fresh = (c: string) => !recent.includes(c);
  const seenAll = INTRO_ORDER.filter((c) => stat(p, c).seen > 0 && (!filter || filter(FLAG_BY_CODE[c])));
  const seen = seenAll.filter(fresh).length ? seenAll.filter(fresh) : seenAll;
  const unseen = INTRO_ORDER.filter((c) => stat(p, c).seen === 0 && (!filter || filter(FLAG_BY_CODE[c])));
  const learning = seen.filter((c) => { const s = stat(p, c); return s.ok < 3 || s.ok / s.seen < 0.7; });
  const wantNew = allowNew && unseen.length > 0 && (learning.length < 3 || ctx.rng.next() < 0.3);
  if (wantNew) return { code: remember(unseen[0]), isNew: true };
  if (learning.length > 0 && ctx.rng.next() < 0.75) return { code: remember(ctx.rng.pick(learning)), isNew: false };
  if (seen.length > 0) {
    // révision espacée : les drapeaux les moins récemment vus d'abord
    const oldest = seen.slice().sort((a, b) => stat(p, a).last - stat(p, b).last).slice(0, 4);
    return { code: remember(ctx.rng.pick(oldest)), isNew: false };
  }
  return { code: remember(unseen[0] ?? "FR"), isNew: true };
}

function distractors(ctx: Ctx, target: string, n: number, sameCategory: boolean, exclude: string[] = []): string[] {
  const p = ctx.profile;
  const banned = new Set([target, ...exclude]);
  const pool = FLAGS.map((f) => f.code).filter((c) => !banned.has(c) && (sameCategory ? CAT[c] === CAT[target] : CAT[c] !== CAT[target]));
  const known = pool.filter((c) => stat(p, c).seen > 0);
  const ordered = ctx.rng.shuffle(known).concat(ctx.rng.shuffle(pool.filter((c) => !known.includes(c))));
  const out: string[] = [];
  for (const c of ordered) { if (out.length >= n) break; out.push(c); }
  if (out.length < n) for (const c of ctx.rng.shuffle(FLAGS.map((f) => f.code))) if (!banned.has(c) && !out.includes(c) && out.length < n) out.push(c);
  return out;
}

function kindsFor(level: number, ctx: Ctx): Kind[] {
  const canRead = FLAGS.some((f) => readable(f, ctx.known) && stat(ctx.profile, f.code).seen > 0);
  const k: Kind[] = [];
  if (level <= 1) k.push("ecoute");
  if (level === 2) k.push("ecoute", "ecoute", "carte");
  if (level === 3) k.push("ecoute", "carte", ...(canRead ? ["lire" as Kind, "lire" as Kind] : []));
  if (level === 4) k.push("carte", "jumeaux", ...(canRead ? ["lire" as Kind] : ["ecoute" as Kind]));
  if (level >= 5) k.push("jumeaux", "jumeaux", "carte", ...(canRead ? ["lire" as Kind] : []));
  return k;
}

function flagButton(code: string, onclick: (el: HTMLElement) => void) {
  const fl = FLAG_BY_CODE[code];
  const b = h("button", { type: "button", class: "card flagcard", "aria-label": fl.name, "data-code": code, html: flagSVG(code, false) });
  b.addEventListener("click", () => onclick(b));
  return b;
}
function sylHTML(syl: string[]) {
  return syl.map((s, i) => `<span class="syl${i % 2 ? " b" : ""}">${s}</span>`).join("");
}

export const drapeau: ActivityModule<FlagItem> = {
  id: "drapeau", title: "Le drapeau mystère", domain: "voyages", island: "port", host: "plume",
  maxLevel: 5, items: 6,
  skills: ["VOY.DRAPEAU.ECOUTE", "VOY.CARTE.CONTINENT", "VOY.DRAPEAU.LIRE", "VOY.DRAPEAU.JUMEAUX"],
  card: `<span style="display:block;width:1.3em;height:.87em">${flagSVG("FR", false)}</span>`, pitch: "Le drapeau mystère, pour découvrir les pays du monde.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.target}`,

  generate(stairLevel, ctx) {
    // Le niveau suit l'escalier, mais reste plafonné par le nombre de drapeaux déjà rencontrés :
    // pas de « jumeaux » tant que l'enfant ne connaît que deux ou trois drapeaux.
    const known = Object.values(ctx.profile.flags).filter((s) => s.seen > 0).length;
    const level = Math.min(stairLevel, known < 3 ? 2 : known < 6 ? 3 : known < 10 ? 4 : 5);
    const kind = ctx.rng.pick(kindsFor(level, ctx));
    if (kind === "lire") {
      const t = chooseTarget(ctx, false, (f) => readable(f, ctx.known));
      return { kind, target: t.code, isNew: false, choices: ctx.rng.shuffle([t.code, ...distractors(ctx, t.code, 2, false)]), skill: "VOY.DRAPEAU.LIRE", difficulty: 0.8, form: "symbole", guess: 1 / 3, level, prompt: "Lis le nom du pays, puis touche son drapeau." };
    }
    if (kind === "jumeaux") {
      const seenTw = TWINS.filter(([a, b]) => stat(ctx.profile, a).seen > 0 || stat(ctx.profile, b).seen > 0);
      const pair = ctx.rng.pick(seenTw.length ? seenTw : TWINS);
      const target = ctx.rng.next() < 0.5 ? pair[0] : pair[1];
      const other = target === pair[0] ? pair[1] : pair[0];
      const fl = FLAG_BY_CODE[target];
      const isNew = stat(ctx.profile, target).seen === 0;
      return { kind, target, isNew, choices: ctx.rng.shuffle([target, other, ...distractors(ctx, target, 1, false, [other])]), skill: "VOY.DRAPEAU.JUMEAUX", difficulty: 1.2, form: "image", guess: 1 / 2, level, prompt: `Attention, deux drapeaux se ressemblent ! Montre-moi le drapeau ${fl.of}.` };
    }
    if (kind === "carte") {
      const t = chooseTarget(ctx, true, (f) => f.cont.length === 1 || f.code === "RU");
      const fl = FLAG_BY_CODE[t.code];
      return { kind, target: t.code, isNew: false, choices: [], skill: "VOY.CARTE.CONTINENT", difficulty: 0.6, form: "image", guess: 1 / 6, level, prompt: `Où se trouve ${fl.the} ? Touche son continent sur la carte.` };
    }
    const n = level <= 1 ? 1 : level === 2 ? 2 : 3;
    const t = chooseTarget(ctx, true);
    const fl = FLAG_BY_CODE[t.code];
    return { kind: "ecoute", target: t.code, isNew: t.isNew, choices: ctx.rng.shuffle([t.code, ...distractors(ctx, t.code, n, level >= 4)]), skill: "VOY.DRAPEAU.ECOUTE", difficulty: -0.5 + 0.35 * (n - 1), form: "image", guess: 1 / (n + 1), level, prompt: `Montre-moi le drapeau ${fl.of}.` };
  },

  intro(item) {
    if (!item.isNew) return null;
    const fl = FLAG_BY_CODE[item.target];
    const el = h("div", { class: "pop", style: "display:flex;flex-direction:column;align-items:center;gap:max(10px,calc(var(--u) * 18))" },
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 34))" }, "Nouveau drapeau !"),
      h("div", { style: "width:min(46vw,calc(var(--u) * 420));height:min(30vw,calc(var(--u) * 280))", html: flagSVG(item.target) }),
      h("div", { class: "title", style: "font-size:max(26px,calc(var(--u) * 44))" }, fl.name));
    return { text: `Voici le drapeau ${fl.of}. ${cap(fl.desc)}.`, el };
  },

  render(item, view) {
    const fl = FLAG_BY_CODE[item.target];
    if (item.kind === "carte") {
      const card = h("div", { style: "display:flex;align-items:center;gap:max(10px,calc(var(--u) * 18))" },
        h("div", { style: "width:max(90px,calc(var(--u) * 150));height:max(60px,calc(var(--u) * 100))", html: flagSVG(item.target) }),
        h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 36))" }, cap(fl.the)));
      view.stage.appendChild(card);
      view.stage.appendChild(worldMap(item, view));
      return;
    }
    if (item.kind === "lire") {
      view.stage.appendChild(h("div", { class: "panel" }, h("div", { class: "word reading", "aria-label": fl.name, html: sylHTML(fl.syl!) })));
    }
    const row = h("div", { class: "choices" });
    for (const code of item.choices) row.appendChild(flagButton(code, (b) => view.answer(code === item.target, b)));
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const fl = FLAG_BY_CODE[item.target];
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-code]"));
    const right = cards.find((c) => c.dataset.code === item.target);
    if (item.kind === "carte") {
      const cont = CONTINENTS.find((c) => c.id === fl.cont[0])!;
      const shape = view.stage.querySelector<SVGElement>(`[data-cont="${cont.id}"]`);
      if (step === 1) return item.prompt;
      if (step === 2) return `Petit indice : ${fl.the} ${fl.plural ? "sont" : "est"} en ${cont.label}.`;
      if (shape) shape.classList.add("hint-cont");
      return step === 3 ? `Cherche ${cont.label}, je te la montre.` : `Touche ${cont.label}, qui brille.`;
    }
    if (step === 1) return item.kind === "lire" ? `Ça commence par : « ${fl.syl![0]} ».` : item.prompt;
    if (step === 2) return item.kind === "lire" ? `Ça se lit « ${fl.name} ».` : `Le drapeau ${fl.of}, c'est ${fl.desc}.`;
    if (step === 3) {
      const wrong = cards.filter((c) => c.dataset.code !== item.target && c.style.opacity !== "0.25");
      if (wrong[0]) { wrong[0].style.opacity = "0.25"; wrong[0].style.pointerEvents = "none"; }
      return `Ce n'est pas celui-là. Le drapeau ${fl.of}, c'est ${fl.desc}.`;
    }
    if (right) glow(right);
    return `Le drapeau ${fl.of}, c'est celui qui brille.`;
  },

  onResult(item, firstTry, ctx, summary) {
    const s = stat(ctx.profile, item.target);
    ctx.profile.flags[item.target] = { seen: s.seen + 1, ok: s.ok + (firstTry ? 1 : 0), last: Date.now() };
    if (item.isNew) summary.learned.push(item.target);
  },

  sticker(summary, ctx) {
    const code = summary.learned[summary.learned.length - 1] ?? (summary.last as FlagItem | null)?.target ?? "FR";
    const fl = FLAG_BY_CODE[code];
    const reason = summary.learned.length > 0
      ? `Celle-ci, c'est pour le drapeau ${fl.of}, que tu as découvert aujourd'hui.`
      : summary.firstTry >= summary.items - 1
        ? "Celle-ci, c'est pour tous les drapeaux que tu as reconnus."
        : "Celle-ci, c'est parce que tu as continué à chercher.";
    void ctx;
    return { kind: "drapeau", ref: code, reason, svg: flagStickerSVG(code) };
  },

  success(item) {
    const fl = FLAG_BY_CODE[item.target];
    if (item.kind === "carte") return `Oui ! ${isIn(fl)}`;
    if (item.kind === "lire") return `Oui, ${fl.name} !`;
    return `Oui, c'est le drapeau ${fl.of} !`;
  },

  tip(item) {
    if (item.kind === "lire") return "laissez-le lire le nom syllabe par syllabe, sans le souffler ; Plume peut aider.";
    if (item.kind === "jumeaux") return "ces drapeaux se ressemblent : demandez-lui de montrer la différence avec le doigt.";
    if (item.kind === "carte") return item.target === "FR" ? "demandez-lui de montrer où vous habitez, puis un pays où il aimerait aller." : "cherchez aussi la France sur la carte : ce pays est-il loin ou près de chez nous ?";
    return "demandez-lui ce qui l'aide à reconnaître ce drapeau : les couleurs, les bandes, un symbole ?";
  },
};

export function flagStickerSVG(code: string) {
  const fl = FLAG_BY_CODE[code];
  const w = 44, hgt = Math.min(34, w / fl.ratio);
  const inner = flagSVG(code, false).replace('style="display:block;width:100%;height:100%"', `x="${36 - w / 2}" y="${36 - hgt / 2}" width="${w}" height="${hgt}"`);
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#DCE9FB"/><g transform="translate(-1 -1)">${inner}</g></svg>`;
}

function worldMap(item: FlagItem, view: View) {
  const fl = FLAG_BY_CODE[item.target];
  const [px, py] = project(fl.lon, fl.lat);
  // Livraison 4 bis : la carte est peinte par l'atelier (mer, continents en relief) ; les continents à toucher restent
  // les mêmes formes, transparentes, posées par-dessus (le bon continent se cerne quand on l'a trouvé).
  const peinte = !!image("monde/carte");
  const fond = peinte ? calqueSVG("monde/carte", 0, 0, 1) : `<rect width="1000" height="500" rx="24" fill="#BFE8EE"/>`;
  // (transparents, mais pas « none » : le trait répond au doigt comme avant, côte comprise)
  const paths = CONTINENTS.map((c) => `<path data-cont="${c.id}" d="${continentPath(c.id)}" fill="${peinte ? "transparent" : c.color}" stroke="${peinte ? "transparent" : "#ffffff"}" stroke-width="2" stroke-linejoin="round" style="cursor:pointer"><title>${c.label}</title></path>`).join("");
  const wrap = h("div", { class: "monde", style: "width:min(100%,calc(var(--u) * 1000));aspect-ratio:2/1;max-height:min(62vh,calc(100vh - 240px));position:relative" });
  wrap.innerHTML = `<svg viewBox="0 0 1000 500" role="img" aria-label="Carte du monde simplifiée" style="display:block;width:100%;height:100%">${fond}${paths}<g class="pin" style="display:none"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="11" fill="#273043" stroke="#fff" stroke-width="4"/></g></svg>`;
  const svg = wrap.querySelector("svg")!;
  svg.querySelectorAll<SVGPathElement>("[data-cont]").forEach((path) => {
    path.addEventListener("click", () => {
      const ok = fl.cont.includes(path.dataset.cont as any);
      if (ok) {
        (svg.querySelector(".pin") as SVGGElement).style.display = "";
        path.setAttribute("stroke", "#273043"); path.setAttribute("stroke-width", "4");
      }
      const tapped = CONTINENTS.find((c) => c.id === path.dataset.cont);
      view.answer(ok, ok ? null : wrap, ok || !tapped ? undefined : `Ça, c'est l'${tapped.label}. Cherche encore !`);
    });
  });
  return wrap;
}

