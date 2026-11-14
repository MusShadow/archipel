// Île des Énigmes — « Les formes de Rico » : formes planes (2D) puis solides (3D).
// Nommer, compter les côtés, retrouver un solide dans les objets, deviner la trace laissée par un solide.
import type { Rng } from "../core";
import type { ActivityModule, Item } from "../host";
import { emoji } from "../lexique";
import { PALETTE, SHAPES_ALL, SHAPES_BASIC, SHAPE_HINT, SHAPE_NAME, SIDES, SOLIDS, SOLID_HINT, SOLID_NAME, SOLID_OBJECTS, SOLID_TRACE, shapeBody, shapeSVG, sidesOverlay, solidSVG, type Shape2D, type Solid } from "../shapes";
import { glow, h } from "../ui";
import { emojiStickerSVG } from "./chants";

type Kind = "nom2d" | "cotes" | "nom3d" | "objet" | "trace";
interface Opt { id: string; html: string }
interface FormItem extends Item { kind: Kind; target: string; choices: string[]; opts: Record<string, Opt>; shape?: Shape2D; solid?: Solid; sides?: number }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const art = (n: string) => n.replace(/^(le |la |l')/, "");
const showShape = (s: Shape2D, r: Rng) => shapeSVG(s, r.pick(PALETTE), s === "cercle" ? 0 : r.pick([0, 0, 15, -20, 30, 90]), r.pick([0.8, 0.9, 1]));
const recent: string[] = [];
function fresh<T extends string>(pool: readonly T[], r: Rng): T {
  const ok = pool.filter((x) => !recent.includes(x));
  const v = r.pick(ok.length ? ok : pool);
  recent.push(v); if (recent.length > 3) recent.shift();
  return v;
}

function nom2d(level: number, r: Rng): FormItem {
  const pool = level <= 1 ? SHAPES_BASIC : SHAPES_ALL;
  const target = fresh(pool, r);
  // Pièges utiles : carré / rectangle / losange, cercle / ovale.
  const near: Partial<Record<Shape2D, Shape2D[]>> = { carre: ["rectangle", "losange"], rectangle: ["carre"], cercle: ["ovale"], ovale: ["cercle"], losange: ["carre"], pentagone: ["hexagone"], hexagone: ["pentagone"] };
  const others = r.shuffle(pool.filter((s) => s !== target));
  const tricky = level >= 2 ? (near[target] ?? []).filter((s) => pool.includes(s)) : [];
  const dis = Array.from(new Set([...tricky, ...others])).slice(0, 2);
  const choices = r.shuffle([target, ...dis]);
  const opts = Object.fromEntries(choices.map((c) => [c, { id: c, html: showShape(c, r) }]));
  return { kind: "nom2d", target, choices, opts, shape: target, skill: "GEO.FORMES2D.NOM", difficulty: level <= 1 ? -0.5 : 0, form: "image", guess: 1 / 3, level, prompt: `Montre-moi ${SHAPE_NAME[target]}.` };
}
function cotes(level: number, r: Rng): FormItem {
  const shape = fresh(["triangle", "carre", "rectangle", "losange", "pentagone", "hexagone"] as Shape2D[], r);
  const n = SIDES[shape]!;
  const choices = r.shuffle([n, n + 1, n - 1 >= 3 ? n - 1 : n + 2].map(String));
  const opts = Object.fromEntries(choices.map((c) => [c, { id: c, html: `<span class="title" style="font-size:1.1em">${c}</span>` }]));
  return { kind: "cotes", target: String(n), choices, opts, shape, sides: n, skill: "GEO.FORMES2D.COTES", difficulty: 0.3 + 0.1 * (n - 3), form: "image", guess: 1 / 3, level, prompt: "Combien de côtés a cette forme ? Compte-les avec ton doigt." };
}
function nom3d(level: number, r: Rng): FormItem {
  const pool: Solid[] = level <= 3 ? ["boule", "cube", "cylindre", "cone"] : SOLIDS;
  const target = fresh(pool, r);
  const choices = r.shuffle([target, ...r.shuffle(pool.filter((s) => s !== target)).slice(0, 2)]);
  const opts = Object.fromEntries(choices.map((c) => [c, { id: c, html: solidSVG(c as Solid, r.pick(PALETTE)) }]));
  return { kind: "nom3d", target, choices, opts, solid: target, skill: "GEO.FORMES3D.NOM", difficulty: level <= 3 ? 0.2 : 0.6, form: "image", guess: 1 / 3, level, prompt: `Montre-moi ${SOLID_NAME[target]}.` };
}
function objet(level: number, r: Rng): FormItem {
  const withObjects = (Object.keys(SOLID_OBJECTS) as Solid[]);
  const solid = fresh(withObjects, r);
  const right = r.pick(SOLID_OBJECTS[solid]!);
  const dis = r.shuffle(withObjects.filter((s) => s !== solid)).slice(0, 2).map((s) => r.pick(SOLID_OBJECTS[s]!));
  const all = [right, ...dis];
  const choices = r.shuffle(all.map((o) => o.nom));
  const opts = Object.fromEntries(all.map((o) => [o.nom, { id: o.nom, html: emoji(o.e) }]));
  return { kind: "objet", target: right.nom, choices, opts, solid, skill: "GEO.FORMES3D.OBJETS", difficulty: 0.7, form: "image", guess: 1 / 3, level,
    prompt: `Quel objet a la forme ${solid === "boule" ? "d'une boule" : `d'un ${art(SOLID_NAME[solid])}`} : ${all.map((o) => o.nom).join(", ")} ?`.replace("d'un pyramide", "d'une pyramide") };
}
function trace(level: number, r: Rng): FormItem {
  const solid = fresh(["cube", "cylindre", "cone", "pave", "pyramide"] as Solid[], r);
  const target = SOLID_TRACE[solid];
  const choices = r.shuffle([target, ...r.shuffle((["cercle", "carre", "triangle", "rectangle"] as Shape2D[]).filter((s) => s !== target)).slice(0, 2)]);
  const opts = Object.fromEntries(choices.map((c) => [c, { id: c, html: shapeSVG(c as Shape2D, "#5B6475", 0, 0.85) }]));
  return { kind: "trace", target, choices, opts, solid, skill: "GEO.FORMES3D.TRACES", difficulty: 1.2, form: "image", guess: 1 / 3, level,
    prompt: `On trempe ${SOLID_NAME[solid]} dans la peinture, posé sur sa base, puis on le pose sur la feuille. Quelle trace laisse-t-il ?` };
}

export const formes: ActivityModule<FormItem> = {
  id: "formes", title: "Les formes de Rico", domain: "enigmes", island: "enigmes", host: "rico",
  maxLevel: 5, items: 6,
  skills: ["GEO.FORMES2D.NOM", "GEO.FORMES2D.COTES", "GEO.FORMES3D.NOM", "GEO.FORMES3D.OBJETS", "GEO.FORMES3D.TRACES"],
  card: `<span style="display:flex;gap:.04em;width:1.6em;height:.8em"><span style="flex:1">${shapeSVG("triangle", "#8C6BE0")}</span><span style="flex:1">${solidSVG("cube", "#3D8BEA")}</span></span>`,
  pitch: "Les formes de Rico, pour reconnaître les formes plates et les solides.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    if (level <= 1) return nom2d(1, r);
    if (level === 2) return r.next() < 0.55 ? nom2d(2, r) : cotes(2, r);
    if (level === 3) return r.next() < 0.7 ? nom3d(3, r) : nom2d(3, r);
    if (level === 4) return r.next() < 0.55 ? objet(4, r) : nom3d(4, r);
    return r.next() < 0.55 ? trace(5, r) : objet(5, r);
  },

  render(item, view) {
    if (item.kind === "cotes" || item.kind === "trace") {
      const model = item.kind === "cotes" ? shapeSVG(item.shape!, "#FFE0D3") : solidSVG(item.solid!, "#3D8BEA");
      view.stage.appendChild(h("div", { class: "pic big shapebox", html: model }));
    }
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const b = h("button", { type: "button", class: `card pickcard${item.kind === "cotes" ? " numcard" : ""}`, "data-t": c, "aria-label": item.kind === "cotes" ? c : "Une forme", html: item.opts[c].html });
      b.addEventListener("click", () => {
        const ok = c === item.target;
        const named = item.kind === "nom2d" || item.kind === "trace" ? SHAPE_NAME[c as Shape2D] : item.kind === "nom3d" ? SOLID_NAME[c as Solid] : item.kind === "objet" ? c : `${c} côtés`;
        view.answer(ok, b, ok ? undefined : item.kind === "cotes" ? "Recompte en touchant chaque côté, un par un." : `Ça, c'est ${named}. Cherche encore.`);
      });
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
    if (step === 1) return item.prompt;
    if (step === 2) {
      if (item.kind === "nom2d") return `${cap(SHAPE_NAME[item.target as Shape2D])}, c'est ${SHAPE_HINT[item.target as Shape2D]}.`;
      if (item.kind === "cotes") return "Pose ton doigt sur un coin, puis suis chaque côté en comptant : un, deux, trois…";
      if (item.kind === "nom3d") return `${cap(SOLID_NAME[item.target as Solid])}, c'est ${SOLID_HINT[item.target as Solid]}.`;
      if (item.kind === "objet") return `${cap(SOLID_NAME[item.solid!])}, c'est ${SOLID_HINT[item.solid!]}.`;
      return "Regarde bien le dessous du solide, la partie qui touche la feuille.";
    }
    if (step === 3) {
      if (item.kind === "cotes") {
        const box = view.stage.querySelector<HTMLElement>(".shapebox");
        if (box) box.innerHTML = `<svg viewBox="-12 -12 124 124" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">${shapeBody(item.shape!, "#FFE0D3")}${sidesOverlay(item.shape!)}</svg>`;
        return "Regarde, les côtés s'allument un par un. Compte-les avec moi !";
      }
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return "Ce n'est pas celle-là. Regarde les deux qui restent.";
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return "C'est celle qui brille.";
  },

  success(item) {
    if (item.kind === "nom2d") return `Oui, ${SHAPE_NAME[item.target as Shape2D]} : ${SHAPE_HINT[item.target as Shape2D]} !`;
    if (item.kind === "cotes") return `Oui, ${item.sides} côtés !`;
    if (item.kind === "nom3d") return `Oui, ${SOLID_NAME[item.target as Solid]} !`;
    if (item.kind === "objet") return `Oui ! ${cap(item.target)} a la forme ${item.solid === "boule" ? "d'une boule" : item.solid === "pyramide" ? "d'une pyramide" : `d'un ${art(SOLID_NAME[item.solid!])}`}.`;
    return `Oui ! ${cap(SOLID_NAME[item.solid!])} laisse la trace d'${SHAPE_NAME[item.target as Shape2D].replace(/^(le |la |l')/, (m) => (m === "la " ? "une " : "un "))}.`;
  },

  sticker(summary) {
    const last = summary.last as FormItem | null;
    const is3d = last && (last.kind === "nom3d" || last.kind === "objet" || last.kind === "trace");
    return { kind: "forme", ref: is3d ? "🎲" : "🔷", reason: is3d ? "Celle-ci, c'est pour les solides que tu as reconnus." : "Celle-ci, c'est pour toutes les formes que tu as trouvées.", svg: emojiStickerSVG(is3d ? "🎲" : "🔷", "#E6DEFA") };
  },

  tip(item) {
    if (item.kind === "cotes") return "faites-lui suivre chaque côté avec le doigt, en comptant à voix haute.";
    if (item.kind === "objet") return "cherchez ensemble ce même solide dans la pièce : une boîte, un ballon, un verre…";
    if (item.kind === "trace") return "à la maison : trempez un gobelet ou un cube dans la peinture et regardez la trace.";
    if (item.kind === "nom3d") return "un solide se prend dans la main : faites-lui toucher de vrais objets de la même forme.";
    return "demandez-lui de dessiner la forme dans l'air avec son doigt.";
  },
};
