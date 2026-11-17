// Île des Énigmes — « Le chemin de Bip » : programmer un petit robot avec des flèches, puis trouver le bug.
import type { Rng } from "../core";
import type { ActivityModule, Item, View } from "../host";
import { sfx } from "../services";
import { glow, h, icon, sleep } from "../ui";

type Dir = "haut" | "bas" | "gauche" | "droite";
type Kind = "prog" | "debug";
interface BipItem extends Item { kind: Kind; cols: number; rows: number; start: number; goal: number; rocks: number[]; solution: Dir[]; program: Dir[]; target: string; choices: string[]; fixes: Record<string, Dir> }

const DIRS: Dir[] = ["haut", "droite", "bas", "gauche"];
const VEC: Record<Dir, [number, number]> = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
const ROT: Record<Dir, number> = { droite: 0, bas: 90, gauche: 180, haut: 270 };
const arrowHTML = (d: Dir, color = "#273043") => `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;transform:rotate(${ROT[d]}deg)">${icon("arrow", color, 3)}</span>`;
export const BIP = `<svg viewBox="0 0 60 60" aria-hidden="true" style="display:block;width:100%;height:100%"><path d="M30 14 V6" stroke="#5B6475" stroke-width="3"/><circle cx="30" cy="5" r="4" fill="#FFC145"/><rect x="10" y="14" width="40" height="32" rx="9" fill="#8C6BE0" stroke="#5B3FB8" stroke-width="2.5"/><rect x="16" y="20" width="28" height="16" rx="6" fill="#E6DEFA"/><circle cx="24" cy="28" r="3.6" fill="#273043"/><circle cx="36" cy="28" r="3.6" fill="#273043"/><path d="M25 40 Q30 43 35 40" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="18" cy="50" r="5.5" fill="#273043"/><circle cx="42" cy="50" r="5.5" fill="#273043"/></svg>`;
const STAR = `<svg viewBox="0 0 60 60" aria-hidden="true" style="display:block;width:100%;height:100%"><polygon points="30,6 37,22 54,23 41,34 45,51 30,42 15,51 19,34 6,23 23,22" fill="#FFC145" stroke="#E0A400" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const ROCK = `<svg viewBox="0 0 60 60" aria-hidden="true" style="display:block;width:100%;height:100%"><path d="M10 46 Q8 30 20 22 Q28 12 40 18 Q54 24 52 40 Q50 50 30 50 Q14 51 10 46 Z" fill="#9AA3B5" stroke="#6B7385" stroke-width="2.5"/><path d="M22 30 Q28 26 34 30" stroke="#C9CED6" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

const step = (cell: number, d: Dir, cols: number, rows: number): number | null => {
  const x = cell % cols, y = Math.floor(cell / cols);
  const nx = x + VEC[d][0], ny = y + VEC[d][1];
  return nx < 0 || ny < 0 || nx >= cols || ny >= rows ? null : ny * cols + nx;
};
// Plus court chemin (largeur d'abord) : renvoie la suite de flèches, ou null.
export function shortest(cols: number, rows: number, start: number, goal: number, rocks: number[]): Dir[] | null {
  const prev = new Map<number, [number, Dir]>();
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    if (c === goal) break;
    for (const d of DIRS) {
      const n = step(c, d, cols, rows);
      if (n === null || seen.has(n) || rocks.includes(n)) continue;
      seen.add(n); prev.set(n, [c, d]); q.push(n);
    }
  }
  if (!seen.has(goal)) return null;
  const path: Dir[] = [];
  for (let c = goal; c !== start;) { const [p, d] = prev.get(c)!; path.unshift(d); c = p; }
  return path;
}
// Fait jouer un programme : case d'arrivée, ou null si Bip se cogne.
function simulate(prog: Dir[], cols: number, rows: number, start: number, rocks: number[]): number | null {
  let c: number | null = start;
  for (const d of prog) { c = step(c, d, cols, rows); if (c === null || rocks.includes(c)) return null; }
  return c;
}
const turns = (p: Dir[]) => p.filter((d, i) => i > 0 && d !== p[i - 1]).length;
const describe = (p: Dir[]) => {
  const parts: string[] = [];
  for (let i = 0; i < p.length;) { let j = i; while (j < p.length && p[j] === p[i]) j++; parts.push(`${j - i} ${j - i > 1 ? "flèches" : "flèche"} vers ${p[i] === "haut" || p[i] === "bas" ? "le " : "la "}${p[i]}`); i = j; }
  return parts.join(", puis ");
};

function puzzle(level: number, r: Rng): { cols: number; rows: number; start: number; goal: number; rocks: number[]; solution: Dir[] } {
  const cols = 5, rows = level >= 4 ? 5 : 4;
  for (let tries = 0; tries < 400; tries++) {
    const start = r.int(0, cols * rows - 1);
    if (level === 1) {
      const d = r.pick(DIRS), len = r.int(2, 3);
      let c: number | null = start; for (let i = 0; i < len && c !== null; i++) c = step(c, d, cols, rows);
      if (c !== null) return { cols, rows, start, goal: c, rocks: [], solution: Array(len).fill(d) };
      continue;
    }
    const nRocks = level === 2 ? 0 : level === 3 ? 3 : 5;
    const goal = r.int(0, cols * rows - 1);
    if (goal === start) continue;
    const rocks: number[] = [];
    while (rocks.length < nRocks) { const k = r.int(0, cols * rows - 1); if (k !== start && k !== goal && !rocks.includes(k)) rocks.push(k); }
    const sol = shortest(cols, rows, start, goal, rocks);
    if (!sol) continue;
    const [lo, hi] = level === 2 ? [3, 5] : level === 3 ? [4, 6] : [5, 8];
    if (sol.length < lo || sol.length > hi || turns(sol) < 1 || (level >= 3 && turns(sol) > 3)) continue;
    // Les rochers doivent compter : sans eux, le chemin serait plus court ou différent.
    if (level >= 3 && shortest(cols, rows, start, goal, [])!.length === sol.length && r.next() < 0.7) continue;
    return { cols, rows, start, goal, rocks, solution: sol };
  }
  return { cols, rows, start: 0, goal: 3, rocks: [], solution: ["droite", "droite", "droite"] };
}

export const bip: ActivityModule<BipItem> = {
  id: "bip", title: "Le chemin de Bip", domain: "enigmes", island: "enigmes", host: "rico",
  maxLevel: 5, items: 5,
  skills: ["ENIG.PROGRAMMES", "ENIG.DEBUG"],
  card: `<span style="display:block;width:1em;height:1em">${BIP}</span>`, pitch: "Le chemin de Bip, pour programmer un petit robot avec des flèches.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.cols}x${it.rows}:${it.start}>${it.goal}:${[...it.rocks].sort((a, b) => a - b).join(",")}`,

  generate(level, ctx) {
    const r = ctx.rng;
    const debug = level >= 4 && r.next() < (level === 4 ? 0.6 : 0.4);
    const p = puzzle(debug ? 3 : level, r);
    if (!debug) {
      return { kind: "prog", ...p, program: [], target: "goal", choices: [], fixes: {}, skill: "ENIG.PROGRAMMES", difficulty: -0.4 + 0.25 * p.solution.length + 0.2 * turns(p.solution), form: "manipulation", guess: 0, level,
        prompt: "Aide Bip à aller jusqu'à l'étoile. Ajoute des flèches, puis appuie sur le bouton vert pour le faire avancer." };
    }
    const program = p.solution.slice();
    const i = r.int(0, program.length - 1);
    program[i] = r.pick(DIRS.filter((d) => d !== program[i]));
    // Toute flèche qu'on peut changer pour que Bip arrive sur l'étoile est une bonne réponse.
    const fixes: Record<string, Dir> = {};
    program.forEach((_, k) => {
      for (const d of DIRS) {
        if (d === program[k]) continue;
        const trial = program.slice(); trial[k] = d;
        if (simulate(trial, p.cols, p.rows, p.start, p.rocks) === p.goal) { fixes[String(k)] = d; break; }
      }
    });
    return { kind: "debug", ...p, program, target: String(i), choices: program.map((_, k) => String(k)), fixes, skill: "ENIG.DEBUG", difficulty: 1.2 + 0.05 * program.length, form: "symbole", guess: 1 / program.length, level,
      prompt: "Oh non, une flèche du programme de Bip se trompe ! Fais avancer Bip dans ta tête, et touche la flèche qui n'est pas bonne." };
  },

  render(item, view) {
    const grid = h("div", { class: "bipgrid", style: `grid-template-columns:repeat(${item.cols},1fr);grid-template-rows:repeat(${item.rows},1fr);aspect-ratio:${item.cols}/${item.rows};--ar:${(item.cols / item.rows).toFixed(3)}` });
    const cells: HTMLElement[] = [];
    for (let c = 0; c < item.cols * item.rows; c++) {
      const cell = h("div", { class: "bipcell", "data-c": c, html: c === item.goal ? STAR : item.rocks.includes(c) ? ROCK : "" });
      cells.push(cell); grid.appendChild(cell);
    }
    const robot = h("div", { class: "bipbot", html: BIP });
    grid.appendChild(robot);
    let at = item.start;
    const place = (c: number) => { const el = cells[c]; robot.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`; robot.style.width = `${el.offsetWidth}px`; robot.style.height = `${el.offsetHeight}px`; };
    requestAnimationFrame(() => { place(at); robot.classList.add("ready"); });
    const onResize = () => { if (!grid.isConnected) { window.removeEventListener("resize", onResize); return; } place(at); };
    window.addEventListener("resize", onResize);

    const run = async (prog: Dir[]): Promise<"ok" | "bump" | "short"> => {
      at = item.start; place(at); await sleep(250);
      for (const d of prog) {
        const n = step(at, d, item.cols, item.rows);
        if (n === null || item.rocks.includes(n)) { robot.classList.remove("bump"); void robot.offsetWidth; robot.classList.add("bump"); sfx.soft(); return "bump"; }
        at = n; place(at); sfx.hop(); await sleep(380);
      }
      return at === item.goal ? "ok" : "short";
    };

    const slots = h("div", { class: "bipprog", "aria-label": "Programme de Bip" });
    view.stage.appendChild(grid);
    view.stage.appendChild(slots);

    if (item.kind === "debug") {
      item.program.forEach((d, k) => {
        const b = h("button", { type: "button", class: "bipslot", "data-t": String(k), "aria-label": `Flèche ${k + 1} : ${d}`, html: arrowHTML(d) });
        b.addEventListener("click", async () => {
          const fix = item.fixes[String(k)];
          const ok = !!fix;
          if (ok) { const fixed = item.program.slice(); fixed[k] = fix; b.innerHTML = arrowHTML(fix, "#1E7A50"); await run(fixed); }
          view.answer(ok, b, ok ? undefined : "Celle-là est bonne. Fais avancer Bip flèche par flèche, et regarde où il se trompe.");
        });
        slots.appendChild(b);
      });
      const play = h("button", { type: "button", class: "round", "aria-label": "Essayer le programme", html: icon("arrow", "#12737B", 3) });
      play.addEventListener("click", () => { void run(item.program); });
      view.stage.appendChild(h("div", { class: "row" }, play));
      return;
    }

    const prog: Dir[] = [];
    const max = item.solution.length + 3;
    const draw = () => {
      slots.replaceChildren(...prog.map((d) => h("span", { class: "bipslot filled", html: arrowHTML(d) })),
        ...Array.from({ length: Math.max(0, Math.min(max, item.solution.length) - prog.length) }, () => h("span", { class: "bipslot" })));
    };
    const pad = h("div", { class: "row bippad" });
    for (const d of ["gauche", "haut", "bas", "droite"] as Dir[]) {
      const b = h("button", { type: "button", class: "round", "aria-label": `Flèche vers ${d === "haut" || d === "bas" ? "le " : "la "}${d}`, "data-dir": d, html: arrowHTML(d) });
      b.addEventListener("click", () => { if (prog.length < max) { prog.push(d); sfx.tap(); draw(); } });
      pad.appendChild(b);
    }
    const undo = h("button", { type: "button", class: "round", "aria-label": "Enlever la dernière flèche", html: icon("undo") });
    undo.addEventListener("click", () => { prog.pop(); draw(); at = item.start; place(at); });
    const go = h("button", { type: "button", class: "round ok", "aria-label": "Lancer le programme", html: `<span style="display:flex;width:60%;height:60%"><svg viewBox="0 0 24 24" style="width:100%;height:100%"><path d="M7 4 L20 12 L7 20 Z" fill="#fff"/></svg></span>` });
    let running = false;
    go.addEventListener("click", async () => {
      if (!prog.length || running) return;
      running = true;
      const res = await run(prog);
      running = false;
      if (res === "ok") view.answer(true, go);
      else view.answer(false, go, res === "bump" ? "Oups, Bip s'est cogné ! Regarde où, et change la flèche." : "Bip ne s'est pas arrêté sur l'étoile. Ajoute ou enlève une flèche.");
    });
    pad.append(undo, go);
    view.stage.appendChild(pad);
    draw();
    (grid as any)._fill = (dirs: Dir[]) => { prog.splice(0, prog.length, ...dirs); draw(); };
  },

  hint(item, step, view) {
    const cell = (c: number) => view.stage.querySelector<HTMLElement>(`.bipcell[data-c="${c}"]`);
    const pathCells: number[] = [];
    let c = item.start;
    for (const d of item.solution) { c = (c + (VEC[d][0] + VEC[d][1] * item.cols)); pathCells.push(c); }
    if (step === 1) return item.prompt;
    if (item.kind === "debug") {
      if (step === 2) return "Fais avancer Bip dans ta tête, flèche après flèche, en suivant le programme.";
      const k = Number(item.target);
      if (step === 3) { const bad = pathCells[k]; const el = cell(bad); if (el) glow(el); return "C'est à partir d'ici que Bip ne va plus vers l'étoile."; }
      const el = view.stage.querySelector<HTMLElement>(`[data-t="${item.target}"]`); if (el) glow(el);
      return "C'est la flèche qui brille qui se trompe.";
    }
    if (step === 2) return `Commence par ${describe(item.solution.slice(0, item.solution.findIndex((d) => d !== item.solution[0]) === -1 ? item.solution.length : item.solution.findIndex((d) => d !== item.solution[0])))}.`;
    if (step === 3) { pathCells.forEach((pc) => cell(pc)?.classList.add("path")); return "Les cases en pointillés montrent le chemin. Compte-les."; }
    (view.stage.querySelector(".bipgrid") as any)?._fill?.(item.solution);
    const go = view.stage.querySelector<HTMLElement>(".round.ok"); if (go) glow(go);
    return `Le programme, c'est : ${describe(item.solution)}. Appuie sur le bouton vert.`;
  },

  success(item) {
    if (item.kind === "debug") return "Bravo, tu as trouvé le bug ! Bip arrive sur l'étoile.";
    return "Bravo, Bip est arrivé sur l'étoile !";
  },

  sticker(summary) {
    const debug = (summary.last as BipItem | null)?.kind === "debug";
    return { kind: "bip", reason: debug ? "Celle-ci, c'est pour les bugs que tu as trouvés, comme une vraie informaticienne ou un vrai informaticien." : "Celle-ci, c'est pour tes programmes : Bip est arrivé au bout !", svg: bipStickerSVG() };
  },

  tip(item) {
    if (item.kind === "debug") return "faites « jouer » le programme avec le doigt sur la grille, flèche par flèche.";
    return "s'il hésite, faites-lui d'abord compter les cases avec le doigt, puis ajouter les flèches une par une.";
  },
};

export const bipStickerSVG = () => `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#E6DEFA"/><g transform="translate(15 13) scale(0.67)">${BIP.replace('style="display:block;width:100%;height:100%"', 'width="60" height="60"')}</g></svg>`;
