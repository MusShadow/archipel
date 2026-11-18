// Île de l'Atelier — « Dessine pas à pas » avec Kiki, « Le miroir de Kiki », et la galerie des dessins.
// Le dessin terminé est montré d'abord, puis il disparaît ; on le refait ensemble, un trait après l'autre.
import { CLES } from "../identite";
import { app } from "../app";
import { applyEvidence, newSkill, stepStaircase } from "../core";
import { DRAWINGS, DRAWING_BY_ID, drawingStickerSVG, drawingSVG, primD, primPolylines, primSVG, scoreStep, type Drawing, type Prim, type Pt } from "../drawings";
import type { StickerSpec } from "../host";
import { sfx, speech } from "../services";
import { celebrate } from "../fete";
import { burst, dots, h, icon, medallion, plumeSVG, roundBtn, sleep, wobble } from "../ui";
import { sheet } from "./common";

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export const PENS = ["#273043", "#E5483B", "#FF7F50", "#FFC145", "#34B37A", "#1FA9B5", "#3D8BEA", "#8C6BE0", "#E85D9A", "#8B5A2B"];
const FILLS = ["#E5483B", "#FF9F6E", "#FFD45C", "#7ED39B", "#6FCFDA", "#7FB0F0", "#B39BEB", "#F29BC4", "#C8935F", "#FFFFFF"];

// ---------- Galerie (sur l'appareil, par profil) ----------
export interface GalleryItem { t: number; id: string; img: string }
const GKEY = CLES.dessins;
export const gallery = {
  list(pid: string): GalleryItem[] {
    try { const v = JSON.parse(localStorage.getItem(GKEY(pid)) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  },
  add(pid: string, it: GalleryItem) {
    let all = [...this.list(pid), it].slice(-12);
    for (let k = 0; k < 6; k++) {
      try { localStorage.setItem(GKEY(pid), JSON.stringify(all)); return true; } catch { all = all.slice(1); if (!all.length) return false; }
    }
    return false;
  },
  remove(pid: string, t: number) {
    try { localStorage.setItem(GKEY(pid), JSON.stringify(this.list(pid).filter((g) => g.t !== t))); } catch { /* rien */ }
  },
  clear(pid: string) { try { localStorage.removeItem(GKEY(pid)); } catch { /* rien */ } },
};

// ---------- Planche à dessin : deux toiles (couleurs dessous, traits dessus) et un calque de guides ----------
interface Stroke { pts: Pt[]; color: string; width: number; mirror: 0 | 2 | 4 }
interface Fill { x: number; y: number; color: string }
class Board {
  el: HTMLElement;
  ov: SVGSVGElement;
  private color: HTMLCanvasElement;
  private ink: HTMLCanvasElement;
  strokes: Stroke[] = [];
  fills: Fill[] = [];
  enabled = false;
  fillMode: string | null = null;
  pen = { color: "#273043", width: 2.4 };
  mirror: 0 | 2 | 4 = 0;
  onStrokeEnd?: (s: Stroke) => void;
  onStrokeStart?: () => void;
  onFill?: () => void;
  private cur: Stroke | null = null;
  private pid: number | null = null;
  private px = 0;
  private ro: ResizeObserver | null = null;

  constructor() {
    this.color = h("canvas", { class: "cv" }) as HTMLCanvasElement;
    this.ink = h("canvas", { class: "cv" }) as HTMLCanvasElement;
    this.el = h("div", { class: "board" }, this.color, this.ink);
    this.ov = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.ov.setAttribute("viewBox", "0 0 100 100");
    this.ov.setAttribute("class", "ov");
    this.ov.setAttribute("aria-hidden", "true");
    this.el.appendChild(this.ov);
    const ink = this.ink;
    ink.addEventListener("pointerdown", (e) => this.down(e));
    ink.addEventListener("pointermove", (e) => this.move(e));
    for (const ev of ["pointerup", "pointercancel"]) ink.addEventListener(ev, (e) => this.up(e as PointerEvent));
    if (typeof ResizeObserver !== "undefined") { this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.el); }
    else (window as Window).addEventListener("resize", () => this.fit());
    requestAnimationFrame(() => this.fit());
  }
  destroy() { this.ro?.disconnect(); }
  private toPt(e: PointerEvent): Pt {
    const r = this.ink.getBoundingClientRect();
    return [Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)), Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))];
  }
  private down(e: PointerEvent) {
    if (this.pid !== null) return;
    e.preventDefault();
    if (this.fillMode) { if (this.enabled) { const p = this.toPt(e); this.fills.push({ x: p[0], y: p[1], color: this.fillMode }); this.floodAt(this.fills[this.fills.length - 1]); this.onFill?.(); } return; }
    if (!this.enabled) return;
    this.pid = e.pointerId;
    try { this.ink.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.cur = { pts: [this.toPt(e)], color: this.pen.color, width: this.pen.width, mirror: this.mirror };
    this.onStrokeStart?.();
    this.paintStroke(this.cur, true);
  }
  private move(e: PointerEvent) {
    if (e.pointerId !== this.pid || !this.cur) return;
    const evs = (e as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
    for (const ev of evs && evs.length ? evs : [e]) {
      const p = this.toPt(ev), last = this.cur.pts[this.cur.pts.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.35) continue;
      this.cur.pts.push(p);
      this.paintSegment(this.cur, last, p);
    }
  }
  private up(e: PointerEvent) {
    if (e.pointerId !== this.pid || !this.cur) return;
    const s = this.cur;
    this.cur = null; this.pid = null;
    this.strokes.push(s);
    this.onStrokeEnd?.(s);
  }
  private copies(p: Pt, m: 0 | 2 | 4): Pt[] {
    if (m === 0) return [p];
    if (m === 2) return [p, [100 - p[0], p[1]]];
    return [p, [100 - p[0], p[1]], [p[0], 100 - p[1]], [100 - p[0], 100 - p[1]]];
  }
  private ctxInk() {
    const c = this.ink.getContext("2d")!;
    c.lineCap = "round"; c.lineJoin = "round";
    return c;
  }
  private paintSegment(s: Stroke, a: Pt, b: Pt) {
    const c = this.ctxInk(), k = this.px / 100;
    c.strokeStyle = s.color; c.lineWidth = s.width * k;
    const A = this.copies(a, s.mirror), B = this.copies(b, s.mirror);
    c.beginPath();
    A.forEach((pa, i) => { c.moveTo(pa[0] * k, pa[1] * k); c.lineTo(B[i][0] * k, B[i][1] * k); });
    c.stroke();
  }
  private paintStroke(s: Stroke, start = false) {
    const c = this.ctxInk(), k = this.px / 100;
    c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.width * k;
    for (let m = 0; m < (s.mirror || 1); m++) {
      const pts = s.pts.map((p) => this.copies(p, s.mirror)[m]);
      if (pts.length === 1 || start) {
        c.beginPath(); c.arc(pts[0][0] * k, pts[0][1] * k, (s.width * k) / 2 * 1.15, 0, Math.PI * 2); c.fill();
        if (start) continue;
      }
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0] * k, p[1] * k) : c.moveTo(p[0] * k, p[1] * k)));
      c.stroke();
    }
  }
  fit() {
    const w = this.el.clientWidth;
    if (!w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.round(w * dpr);
    if (px === this.px) return;
    this.px = px;
    for (const cv of [this.color, this.ink]) { cv.width = px; cv.height = px; }
    this.redraw();
  }
  redraw() {
    this.ink.getContext("2d")!.clearRect(0, 0, this.px, this.px);
    this.color.getContext("2d")!.clearRect(0, 0, this.px, this.px);
    for (const s of this.strokes) this.paintStroke(s);
    for (const f of this.fills) this.floodAt(f);
  }
  removeStroke(s: Stroke) { this.strokes = this.strokes.filter((x) => x !== s); this.redraw(); }
  clear() { this.strokes = []; this.fills = []; this.redraw(); }
  undoFill() { this.fills.pop(); this.redraw(); }
  // Remplissage « pot de peinture » : la zone est délimitée par les traits (légèrement épaissis pour boucher
  // les petits trous), la couleur est posée sous les traits.
  private floodAt(f: Fill) {
    const W = this.px;
    if (!W) return;
    const S = Math.max(1, Math.round(W / 360)); // calcul sur une grille réduite, plus rapide
    const n = Math.ceil(W / S);
    const src = this.ink.getContext("2d")!.getImageData(0, 0, W, W).data;
    const wall = new Uint8Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = ((Math.min(W - 1, y * S + (S >> 1))) * W + Math.min(W - 1, x * S + (S >> 1))) * 4;
      if (src[i + 3] > 70) wall[y * n + x] = 1;
    }
    // Épaissit les murs d'une case pour fermer les petites fentes.
    const thick = wall.slice();
    for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) if (wall[y * n + x]) { thick[y * n + x - 1] = 1; thick[y * n + x + 1] = 1; thick[(y - 1) * n + x] = 1; thick[(y + 1) * n + x] = 1; }
    const sx = Math.min(n - 1, Math.floor((f.x / 100) * n)), sy = Math.min(n - 1, Math.floor((f.y / 100) * n));
    if (thick[sy * n + sx]) return;
    const seen = new Uint8Array(n * n);
    const stack = [sy * n + sx];
    seen[sy * n + sx] = 1;
    while (stack.length) {
      const i = stack.pop()!, x = i % n, y = (i - x) / n;
      const nb = [x > 0 ? i - 1 : -1, x < n - 1 ? i + 1 : -1, y > 0 ? i - n : -1, y < n - 1 ? i + n : -1];
      for (const j of nb) if (j >= 0 && !seen[j] && !thick[j]) { seen[j] = 1; stack.push(j); }
    }
    // Ajoute la bordure (sous les traits) pour ne pas laisser de liseré blanc.
    const c = this.color.getContext("2d")!;
    c.fillStyle = f.color;
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        const inside = (xx: number) => seen[y * n + xx] || (thick[y * n + xx] && ((xx > 0 && seen[y * n + xx - 1]) || (xx < n - 1 && seen[y * n + xx + 1]) || (y > 0 && seen[(y - 1) * n + xx]) || (y < n - 1 && seen[(y + 1) * n + xx])));
        if (!inside(x)) { x++; continue; }
        const x0 = x;
        while (x < n && inside(x)) x++;
        c.fillRect(x0 * S, y * S, (x - x0) * S, S);
      }
    }
  }
  snapshot(size = 360): string {
    const cv = document.createElement("canvas");
    cv.width = size; cv.height = size;
    const c = cv.getContext("2d")!;
    c.fillStyle = "#fff"; c.fillRect(0, 0, size, size);
    c.drawImage(this.color, 0, 0, size, size);
    c.drawImage(this.ink, 0, 0, size, size);
    try { return cv.toDataURL("image/jpeg", 0.82); } catch { return ""; }
  }
}
const svgEl = (html: string) => { const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.innerHTML = html; return g; };

// ---------- Choisir un dessin ----------
export function drawPicker(back: (sticker?: StickerSpec) => void) {
  const p = app.profile!;
  const level = p.stairs.dessin?.level ?? 1;
  const done = new Set(gallery.list(p.id).map((g) => g.id));
  const fits = DRAWINGS.filter((d) => d.stars === Math.min(3, level));
  const advised = fits.find((d) => !done.has(d.id)) ?? pick(fits);
  const grid = h("div", { class: "drawpick" });
  for (const d of DRAWINGS) {
    const b = h("button", { type: "button", class: `actcard${d === advised ? " advised" : ""}`, "data-draw": d.id, "aria-label": `${d.nom}${d === advised ? ", Kiki conseille" : ""}` },
      h("span", { class: "thumb", html: drawingSVG(d) }),
      h("span", { class: "acttitle" }, cap(d.nom)),
      h("span", { class: "stars", "aria-hidden": "true" }, "★".repeat(d.stars)),
      d === advised ? h("span", { class: "advice" }, "Kiki conseille") : null,
      done.has(d.id) ? h("span", { class: "doneic", html: icon("check", "#fff", 3) }) : null);
    b.addEventListener("click", () => { sfx.tap(); drawLesson(d, back); });
    grid.appendChild(b);
  }
  const screen = h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => back() }),
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 36))" }, "Dessine pas à pas"),
      h("span", { style: "width:var(--btn);height:var(--btn);display:block", html: medallion("kiki") })),
    h("div", { class: "scroll" }, grid));
  app.show(screen);
  speech.say(`Qu'est-ce que tu veux dessiner avec Kiki ? Je te conseille ${advised.nom}.`);
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- La leçon : modèle, puis étapes ----------
function drawLesson(d: Drawing, back: (sticker?: StickerSpec) => void) {
  const p = app.profile!;
  const stair = p.stairs.dessin ?? { level: 1, up: 0, down: 0 };
  const level = Math.max(1, Math.min(3, stair.level));
  const tol = level === 1 ? 7 : level === 2 ? 8 : 10;
  const need = level === 1 ? 0.8 : level === 2 ? 0.75 : 0.68;
  const t0 = Date.now();
  let alive = true, stepIdx = -1, misses = 0, stepMisses = 0, hintsUsed = 0, autoHelps = 0, recorded = false;
  let stepStrokes: Stroke[] = [];
  let nudge = 0;

  const board = new Board();
  const dotsHost = h("div", {});
  const sayLine = h("p", { class: "drawsay", "aria-live": "polite" }, "");
  const undoBtn = roundBtn({ icon: "undo", label: "Effacer mon dernier trait", onclick: () => undo() });
  const tools = h("div", { class: "drawtools" }, undoBtn);
  const tipText = h("span", { html: `<b>Astuce parent</b> : ${level === 1 ? "laissez-le suivre les pointillés à son rythme ; un trait peut se faire en plusieurs fois." : level === 2 ? "Kiki montre le trait, puis le guide s'efface presque : encouragez-le à regarder d'abord." : "Kiki montre le trait, puis il disparaît : c'est un vrai dessin de mémoire."}` });
  const tip = h("div", { class: "tip", style: app.data.settings.accompanied ? "" : "visibility:hidden" }, h("span", { class: "ic", html: icon("sound", "#12737B", 2) }), tipText);
  const plumeBtn = roundBtn({ label: "Demander de l'aide à Plume", cls: "plume", html: plumeSVG(), onclick: () => help(false) });
  const screen = h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "home", label: "Retour à la carte", onclick: () => askExit() }),
      dotsHost,
      roundBtn({ icon: "ear", label: "Réécouter", onclick: () => speech.say(sayLine.textContent ?? "") })),
    h("div", { class: "stage drawstage" }, h("div", { class: "drawwrap" }, board.el, tools), sayLine),
    h("div", { class: "bottom" }, tip, plumeBtn));

  const layer = (cls: string) => { const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", cls); board.ov.appendChild(g); return g; };
  const modelG = layer("model");
  const guideG = layer("guide");
  const demoG = layer("demo");
  const startG = layer("start");
  const say = (t: string) => { sayLine.textContent = t; return speech.say(t); };

  async function intro() {
    modelG.appendChild(svgEl(`<g stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="color:#273043">${d.steps.flatMap((s) => s.prims).map((x) => primSVG(x)).join("")}</g>`));
    dotsHost.replaceChildren(dots(d.steps.length, 0));
    await say(`Voici ${d.un} ! Regarde-le bien… Il va disparaître, et on va le dessiner ensemble, étape par étape.`);
    await sleep(600);
    if (!alive) return;
    modelG.classList.add("gone");
    await sleep(1400);
    if (!alive) return;
    modelG.replaceChildren();
    nextStep();
  }

  function showGuide(strength: "fort" | "leger" | "aucun") {
    const s = d.steps[stepIdx];
    guideG.replaceChildren(); startG.replaceChildren();
    guideG.setAttribute("opacity", strength === "fort" ? "1" : strength === "leger" ? "0.3" : "0");
    guideG.appendChild(svgEl(s.prims.map((x) => (x.t === "dot" ? `<circle class="target" cx="${x.x}" cy="${x.y}" r="3.2"/>` : `<path d="${primD(x)}"/>`)).join("")));
    // Un point vert indique où commencer chaque trait.
    startG.appendChild(svgEl(s.prims.filter((x) => x.t !== "dot").map((x) => { const st = firstPoint(x); return `<circle class="startdot" cx="${st[0]}" cy="${st[1]}" r="2.3"/>`; }).join("")));
  }
  async function demo() {
    const s = d.steps[stepIdx];
    demoG.replaceChildren();
    const g = svgEl(s.prims.map((x) => primSVG(x)).join(""));
    demoG.appendChild(g);
    const pencil = svgEl(`<circle r="2.6" fill="#FF7F50" stroke="#fff" stroke-width="0.8"/>`);
    demoG.appendChild(pencil);
    for (const el of Array.from(g.children) as SVGGeometryElement[]) {
      if (!alive) return;
      if (el.tagName === "circle") { el.style.opacity = "0"; el.animate?.([{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(1)" }], { duration: 350, fill: "forwards" }); el.style.opacity = "1"; await sleep(380); continue; }
      const L = el.getTotalLength?.() ?? 0;
      if (!L) continue;
      el.style.strokeDasharray = `${L} ${L}`;
      el.style.strokeDashoffset = `${L}`;
      const ms = Math.min(1600, 450 + L * 14);
      const tStart = performance.now();
      await new Promise<void>((res) => {
        const tick = () => {
          if (!alive) return res();
          const k = Math.min(1, (performance.now() - tStart) / ms);
          el.style.strokeDashoffset = `${L * (1 - k)}`;
          const pt = el.getPointAtLength(L * k);
          pencil.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
          if (k < 1) requestAnimationFrame(tick); else res();
        };
        requestAnimationFrame(tick);
      });
    }
    pencil.remove();
    await sleep(350);
    demoG.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: "forwards" });
    await sleep(460);
    demoG.replaceChildren();
    demoG.getAnimations?.().forEach((a) => a.cancel());
  }

  async function nextStep() {
    stepIdx++;
    stepStrokes = []; stepMisses = 0;
    if (stepIdx >= d.steps.length) return finish();
    dotsHost.replaceChildren(dots(d.steps.length, stepIdx));
    // Crochet pour les tests de bout en bout (inexistant en usage normal).
    (globalThis as any).__archipelTest?.onDrawStep?.(d.steps[stepIdx].prims.map((x) => primPolylines(x)), d.id, stepIdx);
    board.enabled = false;
    showGuide(level === 1 ? "fort" : "aucun");
    const spoken = say(d.steps[stepIdx].say);
    await demo();
    if (!alive) return;
    showGuide(level === 1 ? "fort" : level === 2 ? "leger" : "aucun");
    board.enabled = true;
    (globalThis as any).__archipelTest?.onDrawReady?.();
    void spoken;
  }

  board.onStrokeStart = () => { window.clearTimeout(nudge); };
  board.onStrokeEnd = (s) => {
    if (stepIdx < 0 || stepIdx >= d.steps.length) return;
    stepStrokes.push(s);
    const prims = d.steps[stepIdx].prims;
    const all = scoreStep(prims, stepStrokes.map((x) => x.pts), tol);
    const last = scoreStep(prims, [s.pts], tol);
    if (all.recall >= need && all.precision >= 0.55) { stepDone(); return; }
    if (last.precision < 0.35) {
      // Trait trop loin du modèle : il s'efface doucement, sans gronder.
      stepStrokes = stepStrokes.filter((x) => x !== s);
      setTimeout(() => board.removeStroke(s), 250);
      misses++; stepMisses++;
      sfx.soft();
      if (stepMisses >= 3) { help(true); return; }
      say(level === 1 ? "Essaie de passer sur les petits points." : "Regarde bien où Kiki a dessiné, et essaie encore.");
      return;
    }
    window.clearTimeout(nudge);
    nudge = window.setTimeout(() => { if (alive && stepIdx < d.steps.length) say("Continue, il manque encore un morceau."); }, 3500);
  };

  function stepDone() {
    window.clearTimeout(nudge);
    board.enabled = false;
    sfx.hop();
    guideG.replaceChildren(); startG.replaceChildren();
    if (stepIdx === d.steps.length - 1) { nextStep(); return; }
    speech.say(pick(["Bien !", "Super !", "Joli !", "Bravo !", "Très bien !"])).then(() => sleep(150)).then(() => { if (alive) nextStep(); });
  }

  function undo() {
    const s = stepStrokes.pop();
    if (s) { board.removeStroke(s); sfx.tap(); }
    else if (stepIdx >= d.steps.length) board.undoFill();
  }

  async function help(auto: boolean) {
    if (stepIdx < 0 || stepIdx >= d.steps.length || !board.enabled) return;
    if (auto) autoHelps++; else hintsUsed++;
    board.enabled = false;
    showGuide("fort");
    say(auto ? "Je te remontre. Regarde bien où passe le crayon." : `Regarde : ${d.steps[stepIdx].say.charAt(0).toLowerCase()}${d.steps[stepIdx].say.slice(1)}`);
    await demo();
    if (!alive) return;
    showGuide("fort");
    board.enabled = true;
    (globalThis as any).__archipelTest?.onDrawReady?.();
  }

  async function finish() {
    board.enabled = false;
    record();
    sfx.success(); celebrate(screen, { name: p.name });
    dotsHost.replaceChildren(dots(d.steps.length, d.steps.length));
    const mini = h("div", { class: "drawmini", "aria-label": "Le modèle", html: drawingSVG(d) });
    const palette = h("div", { class: "palette" });
    for (const c of FILLS) {
      const b = h("button", { type: "button", class: "swatch", style: `background:${c}`, "data-c": c, "aria-label": "Couleur" });
      b.addEventListener("click", () => { sfx.tap(); board.fillMode = c; board.enabled = true; palette.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x === b)); });
      palette.appendChild(b);
    }
    const doneBtn = h("button", { type: "button", class: "bigbtn", "data-done": "1" }, h("span", { style: "width:30px;height:30px;display:flex", html: icon("check", "#fff", 3) }), "J'ai fini");
    doneBtn.addEventListener("click", () => { sfx.tap(); leave(true); });
    tools.replaceChildren(mini, palette, h("div", { class: "row" }, undoBtn, doneBtn));
    board.onFill = () => sfx.tap();
    await say(`Tadaa ! Tu as dessiné ${d.un} ! Regarde, il ressemble au modèle. Tu veux le colorier ? Choisis une couleur, puis touche une partie de ton dessin.`);
  }

  function record() {
    if (recorded) return;
    recorded = true;
    const skill = level <= 1 ? "ART.TRACE" : "ART.ETAPES";
    const hints = Math.min(4, hintsUsed + autoHelps);
    const correct = misses <= Math.max(1, Math.floor(d.steps.length / 4)) && autoHelps === 0;
    const now = Date.now();
    p.skills[skill] = applyEvidence(p.skills[skill] ?? newSkill(), { skill, correct, hints, guess: 0, difficulty: -0.4 + 0.35 * (d.stars - 1) + 0.35 * (level - 1), form: "manipulation" }, now);
    p.log.push({ t: now, activity: "dessin", level, skill, correct, hints, form: "manipulation", ms: now - t0 });
    p.stairs.dessin = stepStaircase(stair, correct && hints === 0, !correct, 3);
    app.save();
  }

  function leave(completed: boolean) {
    if (!alive) return;
    alive = false;
    window.clearTimeout(nudge);
    app.addMinutes("atelier", Date.now() - t0, "dessin");
    let sticker: StickerSpec | undefined;
    if (completed) {
      gallery.add(p.id, { t: Date.now(), id: d.id, img: board.snapshot() });
      const first = !p.stickers.some((s) => s.kind === "dessin" && s.ref === d.id);
      if (first || Math.random() < 0.4) sticker = { kind: "dessin", ref: d.id, reason: `Celle-ci, c'est pour ${d.un} que tu as dessiné, étape par étape.`, svg: drawingStickerSVG(d.id) };
    }
    board.destroy();
    back(sticker);
  }

  function askExit() {
    if (stepIdx >= d.steps.length) { leave(true); return; }
    const s = sheet(screen,
      h("p", { class: "title", style: "font-size:28px;margin:0" }, "Revenir à la carte ?"),
      h("div", { class: "row" },
        h("button", { type: "button", class: "bigbtn", onclick: () => { s.close(); leave(false); } }, "Oui"),
        h("button", { type: "button", class: "bigbtn alt", onclick: () => s.close() }, "Non, je dessine")));
    speech.say("Tu veux revenir à la carte ?");
  }

  app.show(screen, () => { alive = false; window.clearTimeout(nudge); board.destroy(); });
  intro();
}
function firstPoint(x: Prim): Pt {
  if (x.t === "dot") return [x.x, x.y];
  if (x.t === "circle") return [x.cx, x.cy - x.r];
  if (x.t === "ellipse") return [x.cx, x.cy - x.ry];
  const m = x.d.match(/M\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
}

// ---------- Le miroir de Kiki : dessin libre symétrique ----------
export function mirrorScreen(back: () => void) {
  const p = app.profile!;
  const t0 = Date.now();
  const board = new Board();
  board.enabled = true;
  board.mirror = 2;
  board.pen = { color: PENS[1], width: 2.6 };
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "g");
  board.ov.appendChild(axis);
  const drawAxis = () => { axis.innerHTML = `<path d="M50 0 V100" class="axis"/>${board.mirror === 4 ? '<path d="M0 50 H100" class="axis"/>' : ""}`; };
  drawAxis();
  const pens = h("div", { class: "palette" });
  PENS.forEach((c, i) => {
    const b = h("button", { type: "button", class: `swatch${i === 1 ? " on" : ""}`, style: `background:${c}`, "aria-label": "Crayon de couleur" });
    b.addEventListener("click", () => { sfx.tap(); board.pen = { ...board.pen, color: c }; pens.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x === b)); });
    pens.appendChild(b);
  });
  const sizeBtn = roundBtn({ label: "Crayon fin ou épais", html: `<span class="pensize" style="width:30%;height:30%"></span>`, onclick: () => {
    board.pen = { ...board.pen, width: board.pen.width > 3 ? 2.6 : 5 };
    (sizeBtn.firstElementChild as HTMLElement).style.cssText = board.pen.width > 3 ? "width:46%;height:46%" : "width:30%;height:30%";
    sfx.tap();
  } });
  const modeBtn = h("button", { type: "button", class: "bigbtn alt", "aria-label": "Changer de miroir" }, "1 miroir");
  modeBtn.addEventListener("click", () => {
    board.mirror = board.mirror === 2 ? 4 : 2;
    modeBtn.textContent = board.mirror === 2 ? "1 miroir" : "2 miroirs";
    drawAxis(); sfx.tap();
    speech.say(board.mirror === 4 ? "Deux miroirs ! Ce que tu dessines apparaît quatre fois, comme dans un kaléidoscope." : "Un seul miroir : ton dessin apparaît deux fois.");
  });
  const clearBtn = roundBtn({ icon: "trash", label: "Nouvelle feuille", onclick: () => { board.clear(); sfx.soft(); } });
  const undoBtn = roundBtn({ icon: "undo", label: "Effacer le dernier trait", onclick: () => { const s = board.strokes[board.strokes.length - 1]; if (s) board.removeStroke(s); } });
  const keepBtn = h("button", { type: "button", class: "bigbtn", "data-keep": "1" }, h("span", { style: "width:30px;height:30px;display:flex", html: icon("book", "#fff", 2.4) }), "Garder");
  keepBtn.addEventListener("click", () => {
    if (!board.strokes.length) { speech.say("Dessine d'abord quelque chose !"); wobble(board.el); return; }
    gallery.add(p.id, { t: Date.now(), id: "miroir", img: board.snapshot() });
    sfx.sticker(); burst(screen);
    speech.say("Ton dessin est rangé dans ton carnet ! Tu peux en commencer un autre.");
    board.clear();
  });
  const screen = h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "home", label: "Retour à la carte", onclick: () => leave() }),
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 36))" }, "Le miroir de Kiki"),
      h("span", { style: "width:var(--btn);height:var(--btn);display:block", html: medallion("kiki") })),
    h("div", { class: "stage drawstage" }, h("div", { class: "drawwrap" }, board.el, h("div", { class: "drawtools" }, pens, h("div", { class: "row" }, sizeBtn, undoBtn, clearBtn), modeBtn, keepBtn))));
  let alive = true;
  function leave() {
    if (!alive) return;
    alive = false;
    app.addMinutes("atelier", Date.now() - t0, "dessin");
    board.destroy();
    back();
  }
  app.show(screen, () => { if (alive) { alive = false; app.addMinutes("atelier", Date.now() - t0, "dessin"); } board.destroy(); });
  speech.say("Bienvenue dans le miroir de Kiki ! Tout ce que tu dessines d'un côté apparaît aussi de l'autre côté. Essaie !");
}

// ---------- Voir un dessin de la galerie ----------
export function showDrawing(host: HTMLElement, g: GalleryItem, onDelete?: () => void) {
  const d = DRAWING_BY_ID[g.id];
  const when = new Date(g.t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const s = sheet(host,
    h("img", { src: g.img, alt: d ? cap(d.nom) : "Dessin au miroir", style: "width:min(70vw,60vh);height:auto;border-radius:18px;border:3px solid var(--line);background:#fff" }),
    h("p", { class: "title", style: "font-size:24px;margin:0" }, `${d ? cap(d.nom) : "Mon dessin au miroir"}, le ${when}`),
    h("div", { class: "row" },
      h("button", { type: "button", class: "bigbtn", onclick: () => s.close() }, "Fermer"),
      onDelete ? h("button", { type: "button", class: "bigbtn alt", onclick: () => { s.close(); onDelete(); } }, "Enlever") : null));
  speech.say(d ? `Ton dessin : ${d.nom}.` : "Ton dessin au miroir.");
}
