// Fêtes de réussite. Après une bonne réponse, une petite scène qui change à chaque fois — feu d'artifice, ballons à
// éclater, voiture, fusée, camion de pompiers, volcan — avec un grand message qui contient le prénom de l'enfant.
// Le prénom est seulement affiché : la voix naturelle ne le dit jamais (il n'est pas dans le pack de voix publié).
// La dernière réussite d'une activité a droit à la grande fête. Réglage « réduire les animations » : le message seul.
// Tout est dessiné ici (SVG, sons synthétisés) : aucun fichier à télécharger, l'appli reste utilisable hors ligne.
import { sfx } from "./services";
import { h } from "./ui";

export type Scene = "feu" | "ballons" | "voiture" | "fusee" | "pompiers" | "volcan";
export const SCENES: Scene[] = ["feu", "ballons", "voiture", "fusee", "pompiers", "volcan"];
const COLORS = ["#FFC145", "#1FA9B5", "#E85D9A", "#3D8BEA", "#34B37A", "#FF7F50", "#8C6BE0"];
const INKS = ["#E85D9A", "#1FA9B5", "#3D8BEA", "#34B37A", "#FF7F50", "#8C6BE0"]; // lettres : sans le jaune, trop pâle

// Les scènes passent à tour de rôle : jamais deux fois la même d'affilée, et une activité les fait presque toutes voir.
let turn = -1;
export function nextScene(skip: Scene[] = [], r: () => number = Math.random): Scene {
  if (turn < 0) turn = Math.floor(r() * SCENES.length);
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[turn % SCENES.length];
    turn++;
    if (!skip.includes(s)) return s;
  }
  return "feu";
}

const CHEERS = ["Bravo", "Super", "Génial", "Bien joué", "Youpi", "Trop fort", "Magnifique", "Formidable", "Waouh"];
const EFFORT = ["Tu as réussi", "Bien cherché", "Bravo"];
// « Bravo, Lou ! » — espace insécable avant le point d'exclamation : il ne part jamais seul à la ligne.
export function cheer(name: string | null | undefined, o: { firstTry?: boolean; final?: boolean } = {}, r: () => number = Math.random) {
  const n = (name ?? "").trim();
  const pool = o.firstTry === false ? EFFORT : CHEERS;
  const w = o.final ? "Bravo" : pool[Math.floor(r() * pool.length)];
  return `${w}${n ? `, ${n}` : ""} !`;
}

// ---------- Outils ----------
interface Ctx { layer: HTMLElement; W: number; H: number; u: number; later: (ms: number, f: () => void) => void }
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const anim = (el: Element, frames: Keyframe[], o: KeyframeAnimationOptions): Animation | null =>
  typeof (el as any).animate === "function" ? el.animate(frames, o) : null;
// Une particule (cachée tant que son animation n'a pas commencé).
function dot(c: Ctx, x: number, y: number, size: number, bg: string, radius = "50%") {
  const p = h("span", { class: "p", style: `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;background:${bg};border-radius:${radius}` });
  c.layer.appendChild(p);
  return p;
}
// Vol en cloche : vitesse de départ (px/s), pesanteur (px/s²), durée (ms).
function arc(p: Element, vx: number, vy: number, g: number, T: number, delay: number, spin = 0) {
  const frames: Keyframe[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = (T * k) / 8 / 1000;
    frames.push({ transform: `translate(${vx * t}px,${vy * t + 0.5 * g * t * t}px) rotate(${(spin * k) / 8}deg)`, opacity: k === 8 ? 0 : 1 });
  }
  anim(p, frames, { duration: T, delay, easing: "linear", fill: "forwards" });
}
const STAR = (fill: string) => `<svg viewBox="0 0 24 24" style="display:block;width:100%;height:100%"><path d="M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z" fill="${fill}"/></svg>`;

function message(text: string, cls = "", sub = "") {
  const el = h("div", { class: `fete-msg ${cls}` });
  let i = 0;
  for (const word of text.split(" ")) {
    const w = h("span", { class: "w" });
    for (const ch of word) {
      w.appendChild(h("span", { class: "l", style: `color:${INKS[i % INKS.length]};animation-delay:${i * 55}ms` }, ch));
      i++;
    }
    el.append(w, " ");
  }
  if (sub) el.appendChild(h("div", { class: "sous" }, sub));
  return el;
}

// ---------- Dessins ----------
const balloonSVG = (c: string) => `<svg viewBox="0 0 60 100" style="display:block;width:100%;height:100%"><path d="M30 69 q-7 9 0 17 t0 14" fill="none" stroke="#8A8F9C" stroke-width="1.6"/><path d="M26 63 L34 63 L31 70 L29 70 Z" fill="${c}"/><ellipse cx="30" cy="34" rx="26" ry="31" fill="${c}"/><ellipse cx="20" cy="22" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(-20 20 22)"/></svg>`;

const wheel = (x: number, y: number, r: number, inv = false) => `<g class="roue${inv ? " inv" : ""}"><circle cx="${x}" cy="${y}" r="${r}" fill="#273043"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#E4D9C5"/><path d="M${x - r * 0.42} ${y} H${x + r * 0.42} M${x} ${y - r * 0.42} V${y + r * 0.42}" stroke="#8A8F9C" stroke-width="2"/></g>`;

// Petite voiture de course, vue de côté, qui roule vers la droite.
const carSVG = () => `<svg viewBox="0 0 160 84" style="display:block;width:100%;height:100%;overflow:visible"><ellipse cx="82" cy="79" rx="64" ry="4.5" fill="rgba(39,48,67,.16)"/><path d="M12 58 Q10 42 30 39 L50 36 Q62 15 86 15 L102 15 Q118 15 128 34 L144 38 Q153 41 153 52 L153 58 Q153 65 146 65 L19 65 Q12 65 12 58Z" fill="#FF6B57"/><path d="M60 36 Q68 21 84 21 L87 21 L87 36Z" fill="#BFE8EE"/><path d="M93 21 L101 21 Q114 21 121 36 L93 36Z" fill="#BFE8EE"/><circle cx="75" cy="31" r="7" fill="#FFC145"/><circle cx="77" cy="30" r="1.3" fill="#273043"/><rect x="17" y="46" width="130" height="5" rx="2.5" fill="#fff" opacity=".85"/><circle cx="147" cy="46" r="3.6" fill="#FFF3C4"/><rect x="8" y="49" width="7" height="9" rx="2" fill="#5B6475"/>${wheel(42, 65, 13)}${wheel(124, 65, 13)}</svg>`;

// Camion de pompiers, vu de côté, cabine à gauche (il roule vers la gauche) ; gyrophare bleu qui clignote.
const truckSVG = () => `<svg viewBox="0 0 220 110" style="display:block;width:100%;height:100%;overflow:visible"><ellipse cx="112" cy="104" rx="98" ry="5" fill="rgba(39,48,67,.16)"/><circle class="halo" cx="40" cy="27" r="15" fill="#7FB6F5"/><rect class="gyro" x="33" y="24" width="14" height="9" rx="3" fill="#3D8BEA"/><path d="M14 90 L14 54 Q14 38 30 36 L66 36 L72 40 L72 90 Z" fill="#E8504A"/><path d="M23 46 Q25 42 31 42 L62 42 L62 59 L21 59 Z" fill="#BFE8EE"/><rect x="72" y="42" width="138" height="48" rx="6" fill="#E8504A"/><rect x="80" y="48" width="36" height="24" rx="3" fill="#C9433D"/><rect x="122" y="48" width="36" height="24" rx="3" fill="#C9433D"/><circle cx="186" cy="60" r="11" fill="#FFC145" stroke="#D99A1C" stroke-width="3"/><rect x="14" y="74" width="196" height="6" fill="#fff" opacity=".9"/><circle cx="17" cy="66" r="4" fill="#FFF3C4"/><g fill="#C9CED8"><rect x="74" y="28" width="132" height="4" rx="2"/><rect x="74" y="37" width="132" height="4" rx="2"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${80 + i * 15}" y="28" width="3" height="13"/>`).join("")}</g><rect x="200" y="20" width="8" height="12" rx="2" fill="#5B6475"/>${wheel(42, 90, 13, true)}${wheel(146, 90, 13, true)}${wheel(182, 90, 13, true)}</svg>`;

const rocketSVG = () => `<svg viewBox="0 0 60 130" style="display:block;width:100%;height:100%;overflow:visible"><g class="flamme"><path d="M20 98 Q30 136 40 98 Z" fill="#FFC145"/><path d="M25 98 Q30 120 35 98 Z" fill="#FF7F50"/></g><path d="M16 70 L3 99 L19 95 Z" fill="#E8504A"/><path d="M44 70 L57 99 L41 95 Z" fill="#E8504A"/><path d="M30 3 Q51 24 46 62 L44 100 L16 100 L14 62 Q9 24 30 3 Z" fill="#F7F3EA" stroke="#E4D9C5" stroke-width="2"/><path d="M30 3 Q42 14 45 28 L15 28 Q18 14 30 3 Z" fill="#E8504A"/><circle cx="30" cy="50" r="9" fill="#3D8BEA" stroke="#fff" stroke-width="3"/><circle cx="27" cy="47" r="2.5" fill="#fff" opacity=".7"/><rect x="15" y="80" width="30" height="6" fill="#E8504A"/></svg>`;

// Un volcan rigolo (il sourit) dont le cratère crache des confettis.
const volcanoSVG = () => `<svg viewBox="0 0 200 120" style="display:block;width:100%;height:100%;overflow:visible"><ellipse class="lave" cx="100" cy="24" rx="30" ry="12" fill="#FFC145" opacity=".5"/><path d="M8 120 L76 28 Q100 18 124 28 L192 120 Z" fill="#9B6B43"/><path d="M76 28 Q100 18 124 28 L116 40 Q110 52 104 40 Q98 56 92 40 Q86 50 82 38 Z" fill="#FF7F50"/><ellipse cx="100" cy="26" rx="22" ry="6" fill="#E8504A"/><circle cx="86" cy="74" r="5" fill="#273043"/><circle cx="114" cy="74" r="5" fill="#273043"/><circle cx="87.5" cy="72.5" r="1.6" fill="#fff"/><circle cx="115.5" cy="72.5" r="1.6" fill="#fff"/><path d="M88 88 Q100 99 112 88" fill="none" stroke="#273043" stroke-width="4" stroke-linecap="round"/><circle cx="76" cy="86" r="5" fill="#E85D9A" opacity=".35"/><circle cx="124" cy="86" r="5" fill="#E85D9A" opacity=".35"/><path d="M0 120 Q18 106 36 114 Q52 104 70 116 L130 116 Q148 104 164 114 Q182 106 200 120 Z" fill="#34B37A"/></svg>`;

// ---------- Scènes (chacune rend la durée, en ms, à laisser avant l'exercice suivant) ----------
function feu(c: Ctx, rockets = 3, t0 = 0): number {
  const span = t0 + (rockets - 1) * 300 + 620 + 1250;
  c.layer.prepend(h("div", { class: "nuit", style: `animation-duration:${span + 250}ms` }));
  for (let i = 0; i < rockets; i++) {
    const x = c.W * (0.14 + (0.72 * (i + rnd(0.2, 0.8))) / rockets);
    const y = c.H * rnd(0.17, 0.42);
    const t = t0 + i * 300 + rnd(0, 120), rise = 620;
    const trail = dot(c, x, c.H + 8, 7 * c.u + 3, "#FFF3C4");
    anim(trail, [{ opacity: 1, transform: "translate(0,0)" }, { opacity: 1, transform: `translate(0,${y - c.H - 8}px)`, offset: 0.95 }, { opacity: 0, transform: `translate(0,${y - c.H - 8}px)` }],
      { duration: rise, delay: t, easing: "cubic-bezier(.25,.6,.4,1)", fill: "forwards" });
    c.later(t, () => sfx.whistle());
    c.later(t + rise, () => sfx.bang());
    const flash = dot(c, x, y, 90 * c.u + 30, "radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0) 70%)");
    anim(flash, [{ opacity: 1, transform: "scale(.3)" }, { opacity: 0, transform: "scale(1.7)" }], { duration: 400, delay: t + rise, fill: "forwards", easing: "ease-out" });
    const a1 = COLORS[(i * 3) % COLORS.length], a2 = COLORS[(i * 3 + 2) % COLORS.length];
    const R = rnd(130, 185) * Math.max(0.7, c.u);
    for (const [n, f, size, col] of [[24, 1, 12, a1], [10, 0.5, 9, "#FFF3C4"]] as [number, number, number, string][]) {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rnd(0, 0.15), r = R * f * rnd(0.8, 1);
        const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
        const col2 = f === 1 && k % 4 === 0 ? a2 : col;
        const p = dot(c, x, y, size * c.u + 4, col2);
        if (f === 1) p.style.boxShadow = `0 0 ${10 * c.u + 4}px ${col2}`;
        anim(p, [{ opacity: 1, transform: "translate(0,0) scale(1)" }, { opacity: 1, transform: `translate(${dx * 0.86}px,${dy * 0.86}px) scale(1)`, offset: 0.5 },
          { opacity: 0.8, transform: `translate(${dx * 0.97}px,${dy + 30 * c.u}px) scale(.7)`, offset: 0.8 }, { opacity: 0, transform: `translate(${dx}px,${dy + 60 * c.u}px) scale(.3)` }],
          { duration: rnd(1150, 1400), delay: t + rise, easing: "cubic-bezier(.15,.75,.35,1)", fill: "forwards" });
      }
    }
  }
  return span;
}

function popAt(c: Ctx, x: number, y: number, color: string) {
  const flash = dot(c, x, y, 50 * c.u + 26, "radial-gradient(circle,#fff 0 30%,rgba(255,255,255,0) 70%)");
  anim(flash, [{ opacity: 1, transform: "scale(.4)" }, { opacity: 0, transform: "scale(1.6)" }], { duration: 320, fill: "forwards" });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2, r = rnd(45, 80) * Math.max(0.8, c.u);
    const p = dot(c, x, y, 9 * c.u + 4, color, k % 2 ? "2px" : "50%");
    anim(p, [{ opacity: 1, transform: "translate(0,0) rotate(0deg)" }, { opacity: 0, transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 24}px) rotate(${rnd(180, 360)}deg)` }],
      { duration: 520, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
  }
  const word = h("span", { class: "pop-mot", style: `left:${x}px;top:${y}px;color:${color}` }, "Pop !");
  c.layer.appendChild(word);
  anim(word, [{ opacity: 0, transform: "translate(-50%,-50%) scale(.4) rotate(-12deg)" }, { opacity: 1, transform: "translate(-50%,-90%) scale(1.15) rotate(-6deg)", offset: 0.3 }, { opacity: 0, transform: "translate(-50%,-140%) scale(1) rotate(0deg)" }],
    { duration: 650, easing: "ease-out", fill: "forwards" });
}

// Ballons qui montent ; on les éclate du doigt. Fini quand ils sont tous éclatés ou partis (ou au bout de 4,5 s).
function ballons(c: Ctx, interactive: boolean, settle: () => void): number {
  const n = 7;
  let left = n;
  const bw = Math.max(58, 100 * c.u), bh = bw * (100 / 60);
  const colors = [...COLORS].sort(() => Math.random() - 0.5);
  const gone = () => { if (--left <= 0) setTimeout(settle, 350); };
  for (let i = 0; i < n; i++) {
    const color = colors[i % colors.length];
    const x = c.W * (0.06 + (0.88 * (i + 0.5)) / n) - bw / 2 + rnd(-0.2, 0.2) * bw;
    const b = h("span", { class: `ballon${interactive ? "" : " inerte"}`, style: `left:${x}px;top:${c.H}px;width:${bw}px;height:${bh}px`, html: `<span class="sway" style="animation-delay:${-rnd(0, 1.6)}s">${balloonSVG(color)}</span>` });
    c.layer.appendChild(b);
    const dur = rnd(3500, 4700), delay = i * 130 + rnd(0, 220);
    let out = false;
    const leave = () => { if (out) return; out = true; gone(); };
    const a = anim(b, [{ transform: "translateY(0)" }, { transform: `translateY(${-(c.H + bh * 1.25)}px)` }], { duration: dur, delay, easing: "cubic-bezier(.35,.15,.65,1)", fill: "both" });
    if (a) a.onfinish = () => { b.remove(); leave(); };
    else c.later(dur + delay, () => { b.remove(); leave(); });
    if (interactive) b.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (out) return;
      const r = b.getBoundingClientRect(), hr = c.layer.getBoundingClientRect();
      a?.cancel(); b.remove(); sfx.pop();
      popAt(c, r.left - hr.left + r.width / 2, r.top - hr.top + r.width * 0.55, color);
      leave();
    });
  }
  return 4500;
}

// Une voiture traverse l'écran en tirant une banderole avec le message ; elle s'arrête au milieu et klaxonne.
function voiture(c: Ctx, text: string): number {
  const cw = Math.max(150, 230 * c.u);
  const car = h("span", { class: "auto", style: `width:${cw}px;height:${(cw * 84) / 160}px`, html: `<i class="fumee"></i><i class="fumee" style="animation-delay:.2s"></i><i class="fumee" style="animation-delay:.4s"></i>${carSVG()}` });
  const banner = message(text, "banniere");
  const convoi = h("div", { class: "convoi", style: `top:${c.H * 0.46}px` }, banner, h("span", { class: "corde" }), car);
  c.layer.appendChild(convoi);
  // Banderole trop longue (long prénom, iPad en hauteur) : on réduit le texte pour que tout tienne à l'arrêt.
  let gw = convoi.getBoundingClientRect().width;
  if (gw > c.W * 0.94) {
    const fs = parseFloat(getComputedStyle(banner).fontSize) || 40;
    banner.style.fontSize = `${Math.max(18, fs * (1 - (gw - c.W * 0.94) / Math.max(1, banner.getBoundingClientRect().width)))}px`;
    gw = convoi.getBoundingClientRect().width;
  }
  if (!gw) gw = cw * 3;
  const mid = (c.W - gw) / 2;
  anim(convoi, [{ transform: `translateX(${-gw - 30}px)`, easing: "cubic-bezier(.2,.7,.3,1)" }, { transform: `translateX(${mid}px)`, offset: 0.3 },
    { transform: `translateX(${mid + 12}px)`, offset: 0.66, easing: "cubic-bezier(.6,0,.9,.5)" }, { transform: `translateX(${c.W + 30}px)` }], { duration: 3000, fill: "both" });
  sfx.vroom();
  c.later(1150, () => sfx.honk());
  c.later(2000, () => sfx.vroom());
  return 2700;
}

// Le camion de pompiers arrive (pin-pon !), s'arrête, arrose en arc de cercle, et repart.
function pompiers(c: Ctx): number {
  const tw = Math.max(210, 340 * c.u), th = (tw * 110) / 220;
  const top = c.H * 0.5;
  const truck = h("span", { class: "camion", style: `top:${top}px;width:${tw}px;height:${th}px`, html: truckSVG() });
  c.layer.appendChild(truck);
  const mid = (c.W - tw) / 2;
  anim(truck, [{ transform: `translateX(${c.W + 30}px)`, easing: "cubic-bezier(.2,.7,.3,1)" }, { transform: `translateX(${mid}px)`, offset: 0.3 },
    { transform: `translateX(${mid - 12}px)`, offset: 0.68, easing: "cubic-bezier(.6,0,.9,.5)" }, { transform: `translateX(${-tw - 30}px)` }], { duration: 3100, fill: "both" });
  sfx.pinpon();
  // La lance est au bout de l'échelle (à droite) : l'eau part vers le haut et retombe en pluie.
  const nx = mid + tw * 0.93, ny = top + th * 0.2, g = 1500 * c.u;
  for (let k = 0; k < 56; k++) {
    const p = dot(c, nx, ny, rnd(8, 13) * c.u + 3, k % 5 ? "#3D8BEA" : "#BFE8EE");
    const ang = (-118 + rnd(-4, 4)) * (Math.PI / 180), v = rnd(770, 820) * c.u;
    arc(p, Math.cos(ang) * v, Math.sin(ang) * v, g, 1050, 950 + k * 17);
  }
  c.later(950, () => sfx.whoosh());
  return 2800;
}

// La fusée tremble, crache sa fumée, puis décolle dans un ciel d'étoiles.
function fusee(c: Ctx): number {
  const rw = Math.max(64, 104 * c.u), rh = (rw * 130) / 60;
  const x = c.W * rnd(0.4, 0.6) - rw / 2, y = c.H - rh - 12 * c.u;
  const rocket = h("span", { class: "fusee", style: `left:${x}px;top:${y}px;width:${rw}px;height:${rh}px`, html: `<span class="tremble">${rocketSVG()}</span>` });
  c.layer.appendChild(rocket);
  const D = y + rh + 60, launch = 520, T = 1400;
  c.layer.prepend(h("div", { class: "nuit", style: `animation-duration:${launch + T + 500}ms` }));
  const frames: Keyframe[] = [];
  for (let k = 0; k <= 10; k++) frames.push({ transform: `translateY(${-D * (k / 10) ** 2}px)` });
  anim(rocket, frames, { duration: T, delay: launch, easing: "linear", fill: "forwards" });
  sfx.rumble(0.6);
  c.later(launch, () => sfx.whoosh());
  const bx = x + rw / 2, by = y + rh * 0.86;
  for (let k = 0; k < 10; k++) { // fumée au sol, de chaque côté
    const p = dot(c, bx, by, rnd(30, 46) * c.u + 10, k % 2 ? "#F4F1EA" : "#C9CED8");
    const dir = k % 2 ? 1 : -1;
    anim(p, [{ opacity: 0.95, transform: "translate(0,0) scale(.4)" }, { opacity: 0, transform: `translate(${dir * rnd(50, 130) * c.u}px,${-rnd(0, 26)}px) scale(1.5)` }],
      { duration: 900, delay: k * 50, easing: "ease-out", fill: "forwards" });
  }
  for (const f of [0.12, 0.24, 0.36, 0.48, 0.6, 0.72]) { // traînée
    const p = dot(c, bx, by - D * f * f, rnd(22, 32) * c.u + 8, f < 0.4 ? "#F4F1EA" : "#C9CED8");
    anim(p, [{ opacity: 0.9, transform: "scale(.5)" }, { opacity: 0, transform: "scale(1.6)" }], { duration: 800, delay: launch + T * f, easing: "ease-out", fill: "forwards" });
  }
  for (let k = 0; k < 18; k++) { // étoiles qui scintillent
    const s = rnd(18, 34) * c.u + 6;
    const p = h("span", { class: "p", style: `left:${rnd(0.05, 0.95) * c.W - s / 2}px;top:${rnd(0.05, 0.6) * c.H - s / 2}px;width:${s}px;height:${s}px`, html: STAR(COLORS[k % COLORS.length]) });
    c.layer.appendChild(p);
    anim(p, [{ opacity: 0, transform: "scale(0) rotate(0deg)" }, { opacity: 1, transform: "scale(1.2) rotate(45deg)", offset: 0.4 }, { opacity: 0, transform: "scale(0) rotate(90deg)" }],
      { duration: 900, delay: rnd(250, 1500), easing: "ease-in-out", fill: "forwards" });
  }
  return 2200;
}

// Le volcan sort de terre, gronde, et crache des confettis, des bonbons et des étoiles.
function volcan(c: Ctx): number {
  const vw = Math.max(220, 360 * c.u), vh = (vw * 120) / 200;
  const x = (c.W - vw) / 2, y = c.H - vh;
  const v = h("span", { class: "volcan", style: `left:${x}px;top:${y}px;width:${vw}px;height:${vh}px`, html: `<span class="tremble">${volcanoSVG()}</span>` });
  c.layer.appendChild(v);
  anim(v, [{ transform: `translateY(${vh}px)` }, { transform: "translateY(0)", offset: 0.13 }, { transform: "translateY(0)", offset: 0.87 }, { transform: `translateY(${vh}px)` }],
    { duration: 2800, easing: "ease-in-out", fill: "both" });
  c.later(250, () => sfx.rumble(0.7));
  c.later(750, () => sfx.bang());
  const cx = x + vw / 2, cy = y + vh * 0.2, g = 1700 * c.u;
  for (let k = 0; k < 48; k++) {
    const kind = k % 3, color = COLORS[k % COLORS.length], s = rnd(10, 18) * c.u + 5;
    const p = kind === 2
      ? h("span", { class: "p", style: `left:${cx - s}px;top:${cy - s}px;width:${s * 2}px;height:${s * 2}px`, html: STAR(color) })
      : dot(c, cx, cy, s, color, kind ? "3px" : "50%");
    if (kind === 2) c.layer.appendChild(p);
    const hgt = rnd(0.32, 0.72) * c.H, vy = -Math.sqrt(2 * g * hgt), vx = rnd(-0.42, 0.42) * c.W;
    arc(p, vx, vy, g, rnd(1400, 1750), 750 + rnd(0, 500), rnd(-540, 540));
  }
  return 2600;
}

function confettis(c: Ctx, n: number) {
  for (let k = 0; k < n; k++) {
    const w = rnd(9, 15) * c.u + 4;
    const p = dot(c, rnd(0, 1) * c.W, -20, w, COLORS[k % COLORS.length], "2px");
    p.style.height = `${w * 0.55}px`;
    const sway = rnd(30, 80) * c.u;
    anim(p, [{ opacity: 1, transform: "translate(0,0) rotate(0deg)" }, { opacity: 1, transform: `translate(${sway}px,${c.H * 0.5}px) rotate(${rnd(200, 400)}deg)` }, { opacity: 0.9, transform: `translate(${-sway}px,${c.H + 40}px) rotate(${rnd(500, 800)}deg)` }],
      { duration: rnd(2200, 3100), delay: rnd(0, 900), easing: "ease-in", fill: "forwards" });
  }
}

// ---------- La fête ----------
export interface Party { scene: Scene | "finale" | "message"; done: Promise<void>; end: () => void }
export interface PartyOptions { name?: string | null; firstTry?: boolean; final?: boolean; quick?: boolean }

export function celebrate(host: HTMLElement, o: PartyOptions = {}): Party {
  const T = (globalThis as any).__archipelTest;
  const instant = !!T && !T.fetes; // tests de bout en bout : la fête s'affiche sans retarder l'exercice suivant
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forced = T?.scene as Party["scene"] | undefined; // tests : imposer la prochaine scène
  if (forced) T.scene = undefined;
  const scene: Party["scene"] = reduced ? "message" : forced ?? (o.final ? "finale" : nextScene(o.quick || instant ? ["ballons"] : []));
  const layer = h("div", { class: "fete", "aria-hidden": "true", "data-scene": scene });
  host.appendChild(layer);
  const W = host.clientWidth || window.innerWidth || 1180, H = host.clientHeight || window.innerHeight || 820;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let ended = false;
  const c: Ctx = { layer, W, H, u: Math.max(0.55, Math.min(W / 1180, H / 820)),
    later: (ms, f) => { timers.push(setTimeout(() => { if (!ended && layer.isConnected) f(); }, ms)); } };
  const text = cheer(o.name, o);
  let settle: () => void = () => {};
  const settled = new Promise<void>((r) => { settle = r; });
  let min = 1500, life = 2000;
  try {
    if (scene !== "voiture") layer.appendChild(message(text, o.final ? "grand" : "", o.final ? "Mission accomplie !" : ""));
    if (scene === "finale") { sfx.fanfare(); min = feu(c, 4, 200) - 200; confettis(c, 50); life = min + 700; }
    else if (scene === "feu") { min = feu(c, 3); life = min + 300; }
    else if (scene === "ballons") { min = ballons(c, !instant || !!forced, () => settle()); life = 6000; }
    else if (scene === "voiture") { min = voiture(c, text); life = 3100; }
    else if (scene === "pompiers") { min = pompiers(c); life = 3200; }
    else if (scene === "fusee") { min = fusee(c); life = 2600; }
    else if (scene === "volcan") { min = volcan(c); life = 2900; }
  } catch { /* une fête ratée ne doit jamais bloquer l'exercice */ }
  setTimeout(() => settle(), o.quick ? Math.min(min, 1400) : min);
  const end = () => {
    if (ended) return;
    ended = true;
    timers.forEach(clearTimeout);
    layer.classList.add("fin");
    setTimeout(() => layer.remove(), 300);
  };
  setTimeout(end, life + 200);
  return { scene, done: instant ? Promise.resolve() : settled, end };
}

export const FETE_CSS = `
.fete{position:absolute;inset:0;pointer-events:none;z-index:35;overflow:hidden;transition:opacity .28s}
.fete.fin{opacity:0}
.fete .p{position:absolute;left:0;top:0;opacity:0}
.fete .nuit{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(36,48,120,.78),rgba(12,16,48,.9));opacity:0;animation:fete-nuit 2.4s ease-in-out both}
@keyframes fete-nuit{0%,100%{opacity:0}12%,82%{opacity:1}}
.fete-msg{position:absolute;left:50%;top:10.5%;width:max-content;max-width:92%;text-align:center;font-family:'Baloo 2',ui-rounded,'Avenir Next',system-ui,sans-serif;font-weight:800;font-size:max(38px,calc(var(--u) * 80));line-height:1.12;z-index:2;transform:translateX(-50%);
text-shadow:0 4px 0 #fff,0 -4px 0 #fff,4px 0 0 #fff,-4px 0 0 #fff,3px 3px 0 #fff,-3px 3px 0 #fff,3px -3px 0 #fff,-3px -3px 0 #fff,0 10px 22px rgba(39,48,67,.28);animation:fete-in .55s cubic-bezier(.3,1.6,.5,1) both}
.fete-msg.grand{font-size:max(44px,calc(var(--u) * 96));top:12%}
.fete-msg .sous{font-size:.5em;color:#FFC145;margin-top:.15em;text-shadow:0 3px 0 #273043,0 -2px 0 #273043,3px 0 0 #273043,-3px 0 0 #273043,0 8px 18px rgba(0,0,0,.35)}
.fete-msg .w{display:inline-block;white-space:nowrap}
.fete-msg .l{display:inline-block;animation:fete-hop 1s ease-in-out infinite}
@keyframes fete-in{0%{transform:translateX(-50%) scale(.3);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes fete-hop{0%,55%,100%{transform:translateY(0)}25%{transform:translateY(-16%)}}
.fete .ballon{position:absolute;pointer-events:auto;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.fete .ballon.inerte{pointer-events:none}
.fete .ballon .sway{display:block;width:100%;height:100%;transform-origin:50% 90%;animation:fete-sway 1.6s ease-in-out infinite alternate}
@keyframes fete-sway{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
.fete .pop-mot{position:absolute;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:max(24px,calc(var(--u) * 40));opacity:0;white-space:nowrap;text-shadow:0 3px 0 #fff,0 -3px 0 #fff,3px 0 0 #fff,-3px 0 0 #fff}
.fete .convoi{position:absolute;left:0;display:flex;align-items:flex-end;will-change:transform}
.fete-msg.banniere{position:relative;left:auto;top:auto;transform:none;max-width:none;font-size:max(30px,calc(var(--u) * 58));background:#fff;border:max(3px,calc(var(--u) * 5)) solid #273043;border-radius:max(12px,calc(var(--u) * 20));padding:max(4px,calc(var(--u) * 8)) max(14px,calc(var(--u) * 26));margin-bottom:max(16px,calc(var(--u) * 26));text-shadow:none;box-shadow:0 8px 18px rgba(39,48,67,.18);transform-origin:100% 50%;animation:fete-flag .5s ease-in-out infinite alternate}
@keyframes fete-flag{from{transform:skewY(-2deg) rotate(-1deg)}to{transform:skewY(2deg) rotate(1deg)}}
.fete .corde{width:max(18px,calc(var(--u) * 34));height:3px;background:#273043;margin-bottom:max(36px,calc(var(--u) * 58));flex:0 0 auto}
.fete .auto{position:relative;display:block;flex:0 0 auto;animation:fete-bump .26s ease-in-out infinite alternate}
@keyframes fete-bump{from{transform:translateY(0)}to{transform:translateY(-3%)}}
.fete .fumee{position:absolute;left:-4%;bottom:22%;width:15%;aspect-ratio:1;border-radius:50%;background:rgba(160,166,180,.6);animation:fete-puff .6s ease-out infinite}
@keyframes fete-puff{0%{transform:translateX(0) scale(.3);opacity:.9}100%{transform:translateX(-130%) scale(1.3);opacity:0}}
.fete .roue{transform-box:fill-box;transform-origin:center;animation:fete-spin .45s linear infinite}
.fete .roue.inv{animation-direction:reverse}
@keyframes fete-spin{to{transform:rotate(360deg)}}
.fete .camion{position:absolute;left:0;will-change:transform}
.fete .gyro{animation:fete-blink .32s linear infinite}
.fete .halo{animation:fete-halo .32s linear infinite}
@keyframes fete-halo{0%,49%{opacity:.55}50%,100%{opacity:0}}
.fete .lave{animation:fete-blink .45s linear infinite}
@keyframes fete-blink{0%,49%{opacity:1}50%,100%{opacity:.2}}
.fete .fusee,.fete .volcan{position:absolute;will-change:transform}
.fete .tremble{display:block;width:100%;height:100%;animation:fete-shake .07s linear 9 alternate}
.fete .volcan .tremble{animation-delay:.3s;animation-iteration-count:12}
@keyframes fete-shake{from{transform:translate(-2%,0)}to{transform:translate(2%,1%)}}
.fete .flamme{transform-box:fill-box;transform-origin:50% 0;animation:fete-flame .12s ease-in-out infinite alternate}
@keyframes fete-flame{from{transform:scaleY(.75)}to{transform:scaleY(1.3)}}
`;
