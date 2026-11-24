// Île des Énigmes — « Les motifs de Rico » : continuer une suite, trouver l'erreur, compléter un trou,
// puis remplir un tableau à double entrée (une forme par ligne, une couleur par colonne).
import type { Rng } from "../core";
import { vignette } from "../design/dessins";
import type { ActivityModule, Item } from "../host";
import { shapeSVG, type Shape2D } from "../shapes";
import { glow, h } from "../ui";
import { emojiStickerSVG } from "./chants";

type Kind = "suite" | "erreur" | "trou" | "matrice";
interface Tok { s: Shape2D; c: string }
interface MotifItem extends Item { kind: Kind; seq: (Tok | null)[]; cols?: number; target: string; choices: string[]; toks: Record<string, Tok>; unit: number }

export const COLORS: Record<string, string> = { rouge: "#E5483B", bleu: "#3D8BEA", jaune: "#FFC145", vert: "#34B37A" };
export const SHAPES: Shape2D[] = ["cercle", "carre", "triangle", "etoile", "coeur"];
const SAY_SHAPE: Partial<Record<Shape2D, string>> = { cercle: "rond", carre: "carré", triangle: "triangle", etoile: "étoile", coeur: "cœur" };
const key = (t: Tok) => `${t.s}-${t.c}`;
const sayTok = (t: Tok) => `${SAY_SHAPE[t.s]} ${t.c}`;
// Livraison 4 : chaque motif est une perle en bois laqué (atelier : scripts/illustration/jeux_enigmes.py), enfilée sur
// un cordon ; le tableau à double entrée est un plateau en bois à alvéoles.
const tokHTML = (t: Tok) => vignette(`activites/perle-${t.s}-${t.c}`, "perle");

function unitFor(level: number, r: Rng): Tok[] {
  const pattern = level <= 1 ? "AB" : r.pick(level === 2 ? ["AAB", "ABB", "ABC"] : ["AAB", "ABB", "ABC", "AABB", "ABAC"]);
  const letters = Array.from(new Set(pattern.split("")));
  // Ce qui change : la forme, la couleur, ou les deux.
  const mode = r.pick(level <= 1 ? ["forme", "couleur"] : ["forme", "couleur", "deux"]);
  const shapes = r.shuffle(SHAPES).slice(0, letters.length);
  const colors = r.shuffle(Object.keys(COLORS)).slice(0, letters.length);
  const fixedS = r.pick(SHAPES), fixedC = r.pick(Object.keys(COLORS));
  const tokOf: Record<string, Tok> = {};
  letters.forEach((l, i) => { tokOf[l] = { s: mode === "couleur" ? fixedS : shapes[i], c: mode === "forme" ? fixedC : colors[i] }; });
  return pattern.split("").map((l) => tokOf[l]);
}
function distract(right: Tok, unit: Tok[], r: Rng): Tok[] {
  const pool: Tok[] = [];
  for (const t of unit) if (key(t) !== key(right) && !pool.some((p) => key(p) === key(t))) pool.push(t);
  pool.push({ s: right.s, c: r.pick(Object.keys(COLORS).filter((c) => c !== right.c)) });
  pool.push({ s: r.pick(SHAPES.filter((s) => s !== right.s)), c: right.c });
  const out: Tok[] = [];
  for (const t of r.shuffle(pool)) if (out.length < 2 && key(t) !== key(right) && !out.some((o) => key(o) === key(t))) out.push(t);
  return out;
}

export const motifs: ActivityModule<MotifItem> = {
  id: "motifs", title: "Les motifs de Rico", domain: "enigmes", island: "enigmes", host: "rico",
  maxLevel: 5, items: 6,
  skills: ["ENIG.MOTIFS", "ENIG.MATRICES"],
  card: `<span style="display:flex;width:1.5em;height:.6em"><span style="flex:1">${shapeSVG("cercle", COLORS.rouge)}</span><span style="flex:1">${shapeSVG("carre", COLORS.bleu)}</span><span style="flex:1">${shapeSVG("cercle", COLORS.rouge)}</span></span>`,
  pitch: "Les motifs de Rico, pour trouver ce qui vient après.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${JSON.stringify(it.seq)}`,

  generate(level, ctx) {
    const r = ctx.rng;
    const kind: Kind = level <= 2 ? "suite" : level === 3 ? r.pick(["erreur", "suite", "trou"] as Kind[]) : level === 4 ? r.pick(["trou", "erreur"] as Kind[]) : (r.next() < 0.7 ? "matrice" : "trou");
    if (kind === "matrice") {
      const n = 3;
      const shapes = r.shuffle(SHAPES).slice(0, n), colors = r.shuffle(Object.keys(COLORS)).slice(0, n);
      const seq: (Tok | null)[] = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) seq.push({ s: shapes[i], c: colors[j] });
      const hole = r.int(0, n * n - 1);
      const right = seq[hole]!;
      seq[hole] = null;
      const dis = [{ s: right.s, c: r.pick(colors.filter((c) => c !== right.c)) }, { s: r.pick(shapes.filter((s) => s !== right.s)), c: right.c }];
      const all = [right, ...dis];
      return { kind, seq, cols: n, target: key(right), choices: r.shuffle(all.map(key)), toks: Object.fromEntries(all.map((t) => [key(t), t])), unit: n,
        skill: "ENIG.MATRICES", difficulty: 1.3, form: "image", guess: 1 / 3, level, prompt: "Dans chaque ligne, une seule forme. Dans chaque colonne, une seule couleur. Qu'est-ce qui manque ?" };
    }
    const unit = unitFor(Math.min(level, 4), r);
    const reps = unit.length <= 2 ? 4 : 3;
    const full: Tok[] = Array.from({ length: unit.length * reps }, (_, i) => unit[i % unit.length]);
    if (kind === "suite") {
      const right = full[full.length - 1];
      const seq: (Tok | null)[] = [...full.slice(0, -1), null];
      const all = [right, ...distract(right, unit, r)];
      return { kind, seq, target: key(right), choices: r.shuffle(all.map(key)), toks: Object.fromEntries(all.map((t) => [key(t), t])), unit: unit.length,
        skill: "ENIG.MOTIFS", difficulty: level <= 1 ? -0.4 : 0.1 + 0.1 * unit.length, form: "image", guess: 1 / 3, level, prompt: "Qu'est-ce qui vient à la place du point d'interrogation ?" };
    }
    if (kind === "trou") {
      const hole = r.int(unit.length, full.length - 2);
      const right = full[hole];
      const seq: (Tok | null)[] = full.map((t, i) => (i === hole ? null : t));
      const all = [right, ...distract(right, unit, r)];
      return { kind, seq, target: key(right), choices: r.shuffle(all.map(key)), toks: Object.fromEntries(all.map((t) => [key(t), t])), unit: unit.length,
        skill: "ENIG.MOTIFS", difficulty: 0.6 + 0.1 * unit.length, form: "image", guess: 1 / 3, level, prompt: "Il manque un morceau dans la suite. Lequel ?" };
    }
    const bad = r.int(unit.length, full.length - 1);
    const wrong = distract(full[bad], unit, r)[0];
    const seq: (Tok | null)[] = full.map((t, i) => (i === bad ? wrong : t));
    return { kind: "erreur", seq, target: String(bad), choices: seq.map((_, i) => String(i)), toks: {}, unit: unit.length,
      skill: "ENIG.MOTIFS", difficulty: 0.5 + 0.1 * unit.length, form: "image", guess: 1 / seq.length, level, prompt: "Rico s'est trompé dans sa suite ! Touche ce qui n'est pas à sa place." };
  },

  render(item, view) {
    const isGrid = item.kind === "matrice";
    const seqEl = h("div", { class: isGrid ? "motifgrid" : `motifseq${item.seq.length > 10 ? " long" : ""}${item.kind === "erreur" ? " erreur" : ""}`, style: isGrid ? `grid-template-columns:repeat(${item.cols},1fr)` : "" });
    // Les perles sont enfilées morceau par morceau (le motif qui se répète) : si la suite ne tient pas sur une ligne, elle
    // passe à la ligne entre deux morceaux, jamais au milieu d'un motif.
    let unite: HTMLElement | null = null;
    item.seq.forEach((t, i) => {
      const cell = item.kind === "erreur"
        ? h("button", { type: "button", class: "tok", "data-t": String(i), "data-i": i, "aria-label": `${sayTok(t!)}`, html: tokHTML(t!) })
        : h("div", { class: `tok${t ? "" : " hole"}`, "data-i": i, html: t ? tokHTML(t) : '<span class="title">?</span>' });
      if (item.kind === "erreur") cell.addEventListener("click", () => view.answer(String(i) === item.target, cell, String(i) === item.target ? undefined : "Celui-là est bien à sa place. Dis la suite à voix haute pour trouver l'erreur."));
      if (isGrid) { seqEl.appendChild(cell); return; }
      if (i % item.unit === 0) { unite = h("div", { class: "motif-unite" }); seqEl.appendChild(unite); }
      unite!.appendChild(cell);
    });
    view.stage.appendChild(h("div", { class: `panel ${isGrid ? "motif-plateau" : `motif-cordon${item.kind === "erreur" ? " serre" : ""}`}` }, seqEl));
    if (item.kind === "erreur") return;
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const b = h("button", { type: "button", class: "card pickcard tokcard", "data-t": c, "aria-label": sayTok(item.toks[c]), html: tokHTML(item.toks[c]) });
      b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : `${sayTok(item.toks[c])} ? Regarde bien ce qui se répète.`));
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const cells = Array.from(view.stage.querySelectorAll<HTMLElement>(".tok"));
    if (step === 1) return item.prompt;
    if (item.kind === "matrice") {
      if (step === 2) return "Regarde la ligne du point d'interrogation : quelle forme ? Puis sa colonne : quelle couleur ?";
      const hole = item.seq.indexOf(null), n = item.cols!;
      cells.forEach((c, i) => { if (Math.floor(i / n) === Math.floor(hole / n) || i % n === hole % n) c.classList.add("lit"); });
      if (step === 3) return "Les cases qui s'allument sont sur la même ligne et la même colonne.";
    } else {
      const known = item.seq.slice(0, item.unit).filter((t): t is Tok => !!t);
      if (step === 2) return `Dis la suite à voix haute : ${known.map(sayTok).join(", ")}, et ça recommence.`;
      cells.forEach((c, i) => c.classList.toggle("unit", Math.floor(i / item.unit) % 2 === 0));
      if (step === 3) return "Les morceaux qui se répètent sont regroupés par couleur de fond.";
    }
    const right = view.stage.querySelector<HTMLElement>(`[data-t="${item.target}"]`); if (right) glow(right);
    return "C'est celui qui brille.";
  },

  success(item) {
    if (item.kind === "erreur") return "Bravo, tu as trouvé l'erreur de Rico !";
    const t = item.toks[item.target];
    return `Oui, ${sayTok(t)} !`;
  },

  sticker(summary) {
    const grid = (summary.last as MotifItem | null)?.kind === "matrice";
    return { kind: "motif", ref: grid ? "🧩" : "🔁", reason: grid ? "Celle-ci, c'est pour les tableaux que tu as complétés." : "Celle-ci, c'est pour les suites que tu as devinées.", svg: emojiStickerSVG(grid ? "🧩" : "🔁", "#E6DEFA") };
  },

  tip(item) {
    if (item.kind === "matrice") return "faites-lui lire une ligne (même forme), puis une colonne (même couleur).";
    if (item.kind === "erreur") return "dites la suite en rythme ensemble : l'erreur « sonne faux ».";
    return "à la maison : faites des colliers de perles ou des suites de couverts (fourchette, cuillère, fourchette…).";
  },
};
