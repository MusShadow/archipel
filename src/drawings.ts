// Dessins à apprendre pas à pas : chaque dessin est une suite d'étapes (un ou deux traits par étape),
// dans un repère 0–100. Les traits servent à la fois de modèle, de démonstration animée et de guide de correction.

export type Prim =
  | { t: "path"; d: string } // commandes absolues M, L, Q, C, Z
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { t: "dot"; x: number; y: number };
export interface DrawStep { say: string; prims: Prim[] }
export interface Drawing { id: string; nom: string; un: string; e: string; stars: 1 | 2 | 3; steps: DrawStep[]; colors: Record<string, string> }
export type Pt = [number, number];

const P = (d: string): Prim => ({ t: "path", d });
const C = (cx: number, cy: number, r: number): Prim => ({ t: "circle", cx, cy, r });
const E = (cx: number, cy: number, rx: number, ry: number): Prim => ({ t: "ellipse", cx, cy, rx, ry });
const D = (x: number, y: number): Prim => ({ t: "dot", x, y });
const S = (say: string, ...prims: Prim[]): DrawStep => ({ say, prims });

// Spirale de l'escargot : du centre vers l'extérieur, elle finit en bas de la coquille.
function spiral(cx: number, cy: number, r0: number, r1: number, turns: number): string {
  const n = 70, end = turns * 2 * Math.PI;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (end * i) / n, r = r0 + ((r1 - r0) * i) / n;
    pts.push(`${(cx + r * Math.cos(th)).toFixed(1)} ${(cy - r * Math.sin(th)).toFixed(1)}`);
  }
  return `M${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(" ")}`;
}

export const DRAWINGS: Drawing[] = [
  {
    id: "soleil", nom: "le soleil", un: "un soleil", e: "☀️", stars: 1, colors: { fond: "#FFC145" },
    steps: [
      S("D'abord, un grand rond pour le soleil.", C(50, 50, 18)),
      S("Un rayon tout droit vers le haut.", P("M50 27 L50 14")),
      S("Un rayon vers le bas.", P("M50 73 L50 86")),
      S("Un rayon à gauche, et un rayon à droite.", P("M27 50 L14 50"), P("M73 50 L86 50")),
      S("Deux petits rayons en biais, en haut.", P("M34 34 L25 25"), P("M66 34 L75 25")),
      S("Et deux en bas.", P("M34 66 L25 75"), P("M66 66 L75 75")),
      S("Deux points pour les yeux.", D(44, 46), D(56, 46)),
      S("Et un grand sourire !", P("M42 54 Q50 62 58 54")),
    ],
  },
  {
    id: "maison", nom: "la maison", un: "une maison", e: "🏠", stars: 1, colors: {},
    steps: [
      S("D'abord, un grand rectangle pour les murs.", P("M24 52 L76 52 L76 88 L24 88 Z")),
      S("Un triangle pour le toit.", P("M18 52 L50 24 L82 52 Z")),
      S("Une porte, en bas au milieu.", P("M43 88 L43 70 L57 70 L57 88")),
      S("Une fenêtre carrée à gauche.", P("M29 58 L39 58 L39 68 L29 68 Z")),
      S("Une autre fenêtre à droite.", P("M61 58 L71 58 L71 68 L61 68 Z")),
      S("Une cheminée sur le toit.", P("M62 34.5 L62 24 L70 24 L70 41.5")),
      S("Un point pour la poignée de la porte.", D(54, 80)),
      S("Et de la fumée qui sort de la cheminée.", P("M66 20 Q61 15 66 11 Q71 7 66 3")),
    ],
  },
  {
    id: "fleur", nom: "la fleur", un: "une fleur", e: "🌸", stars: 1, colors: {},
    steps: [
      S("Un petit rond, pour le cœur de la fleur.", C(50, 34, 7)),
      S("Un pétale rond en haut, et un en bas.", C(50, 19, 8), C(50, 49, 8)),
      S("Un pétale à gauche, et un à droite.", C(35, 34, 8), C(65, 34, 8)),
      S("La tige, tout droit vers le bas.", P("M50 57 L50 90")),
      S("Une feuille d'un côté.", P("M50 76 Q62 62 73 67 Q63 80 50 76")),
      S("Une feuille de l'autre côté.", P("M50 84 Q38 70 27 75 Q37 88 50 84")),
      S("Et le sol.", P("M12 90 L88 90")),
    ],
  },
  {
    id: "arbre", nom: "l'arbre", un: "un arbre", e: "🌳", stars: 1, colors: {},
    steps: [
      S("Le tronc : deux grands traits.", P("M44 90 L44 64"), P("M56 90 L56 64")),
      S("Le feuillage, comme un gros nuage tout bosselé.", P("M44 64 Q24 68 22 54 Q10 44 22 33 Q20 15 38 16 Q46 4 61 12 Q79 10 78 28 Q92 36 82 50 Q84 66 56 64")),
      S("Trois petits ronds pour les pommes.", C(37, 38, 4), C(57, 26, 4), C(64, 47, 4)),
      S("Et l'herbe, en bas.", P("M12 90 L88 90")),
    ],
  },
  {
    id: "poisson", nom: "le poisson", un: "un poisson", e: "🐟", stars: 2, colors: {},
    steps: [
      S("Un grand ovale pour le corps.", E(45, 50, 26, 16)),
      S("Un triangle pour la queue.", P("M71 50 L88 36 L88 64 Z")),
      S("Un point pour l'œil.", D(30, 46)),
      S("Une nageoire sur le dos.", P("M38 35 Q46 23 56 36")),
      S("Une petite bouche qui sourit.", P("M21 55 Q24 58 28 55")),
      S("Des écailles, comme des petites lunes.", P("M44 45 Q49 50 44 55"), P("M53 45 Q58 50 53 55")),
      S("Et des bulles !", C(13, 31, 3), C(8, 20, 2.2)),
    ],
  },
  {
    id: "chat", nom: "le chat", un: "un chat", e: "🐱", stars: 2, colors: {},
    steps: [
      S("Un rond pour la tête.", C(50, 36, 16)),
      S("Une oreille pointue.", P("M37 27 L36 12 L46 21")),
      S("L'autre oreille.", P("M54 21 L64 12 L63 27")),
      S("Deux points pour les yeux.", D(44, 34), D(56, 34)),
      S("Le nez, et la bouche en forme de vague.", D(50, 39), P("M44 43 Q47 47 50 42 Q53 47 56 43")),
      S("Les moustaches d'un côté.", P("M40 40 L26 37"), P("M40 43 L26 46")),
      S("Les moustaches de l'autre côté.", P("M60 40 L74 37"), P("M60 43 L74 46")),
      S("Le corps, comme une grosse poire.", P("M41 49 Q28 70 36 90 L64 90 Q72 70 59 49")),
      S("Une longue queue qui remonte.", P("M64 86 Q86 86 82 66 Q80 56 87 52")),
      S("Et deux pattes devant.", P("M45 90 L45 80"), P("M55 90 L55 80")),
    ],
  },
  {
    id: "bateau", nom: "le bateau", un: "un bateau", e: "⛵", stars: 2, colors: {},
    steps: [
      S("La coque du bateau.", P("M16 62 L84 62 L72 78 L28 78 Z")),
      S("Le mât, tout droit vers le haut.", P("M50 62 L50 10")),
      S("Une grande voile en triangle.", P("M53 18 L53 58 L80 58 Z")),
      S("Une petite voile de l'autre côté.", P("M47 26 L47 58 L28 58 Z")),
      S("Un petit drapeau en haut du mât.", P("M50 10 L40 14 L50 18")),
      S("Deux hublots ronds.", C(38, 70, 3), C(62, 70, 3)),
      S("Et les vagues.", P("M8 85 Q15 79 22 85 Q29 91 36 85 Q43 79 50 85 Q57 91 64 85 Q71 79 78 85 Q85 91 92 85")),
    ],
  },
  {
    id: "escargot", nom: "l'escargot", un: "un escargot", e: "🐌", stars: 2, colors: {},
    steps: [
      S("Le corps de l'escargot, tout allongé.", P("M14 78 Q14 72 24 72 L66 72 Q72 72 74 64 L76 52 Q77 46 82 46 Q88 46 88 52 L86 66 Q84 78 70 78 Z")),
      S("La coquille : une spirale qui tourne, tourne, tourne…", P(spiral(45, 50, 2, 21, 1.75))),
      S("Deux antennes.", P("M79 47 L75 34"), P("M86 47 L90 34")),
      S("Une petite boule au bout de chaque antenne.", D(75, 32), D(90, 32)),
      S("Un œil et un sourire.", D(83, 53), P("M79 59 Q83 62 86 59")),
    ],
  },
  {
    id: "lapin", nom: "le lapin", un: "un lapin", e: "🐰", stars: 2, colors: {},
    steps: [
      S("Un rond pour la tête.", C(50, 52, 15)),
      S("Une grande oreille.", E(43, 24, 5, 14)),
      S("L'autre grande oreille.", E(57, 24, 5, 14)),
      S("Deux points pour les yeux.", D(45, 49), D(55, 49)),
      S("Un petit nez, et la bouche.", D(50, 55), P("M46 59 Q50 63 54 59")),
      S("Les moustaches.", P("M44 56 L31 54"), P("M56 56 L69 54")),
      S("Le corps, un ovale sous la tête.", E(50, 79, 13, 12)),
      S("Et une petite queue toute ronde.", C(65, 85, 4)),
    ],
  },
  {
    id: "papillon", nom: "le papillon", un: "un papillon", e: "🦋", stars: 3, colors: {},
    steps: [
      S("Le corps : un ovale tout fin.", E(50, 52, 3.5, 20)),
      S("Une grande aile, en haut à gauche.", P("M47 42 Q34 14 18 24 Q8 36 26 46 Q38 50 47 46")),
      S("La même aile, de l'autre côté. C'est comme un miroir !", P("M53 42 Q66 14 82 24 Q92 36 74 46 Q62 50 53 46")),
      S("Une petite aile, en bas à gauche.", P("M47 54 Q30 52 26 64 Q26 76 40 72 Q46 68 47 60")),
      S("Et la même en bas à droite.", P("M53 54 Q70 52 74 64 Q74 76 60 72 Q54 68 53 60")),
      S("Deux antennes qui frisent.", P("M48 33 Q44 22 38 18"), P("M52 33 Q56 22 62 18")),
      S("Un rond sur chaque grande aile.", C(29, 34, 5), C(71, 34, 5)),
      S("Et un point sur chaque petite aile.", D(36, 64), D(64, 64)),
    ],
  },
  {
    id: "voiture", nom: "la voiture", un: "une voiture", e: "🚗", stars: 3, colors: {},
    steps: [
      S("La carrosserie de la voiture.", P("M10 68 L10 54 L26 52 L36 38 L66 38 L78 52 L90 54 L90 68 Z")),
      S("Une roue bien ronde.", C(28, 70, 9)),
      S("L'autre roue.", C(72, 70, 9)),
      S("Une fenêtre.", P("M39 50 L44 42 L49 42 L49 50 Z")),
      S("L'autre fenêtre.", P("M53 50 L53 42 L63 42 L69 50 Z")),
      S("Un phare et une poignée.", D(86, 58), P("M53 57 L59 57")),
      S("Et la route.", P("M4 79 L96 79")),
    ],
  },
  {
    id: "oiseau", nom: "l'oiseau", un: "un oiseau", e: "🐦", stars: 3, colors: {},
    steps: [
      S("Un gros ovale pour le corps.", E(46, 56, 22, 16)),
      S("Un rond pour la tête.", C(68, 38, 11)),
      S("Le bec : un petit triangle.", P("M78 34 L88 38 L78 42")),
      S("Un point pour l'œil.", D(70, 35)),
      S("Une aile sur le corps.", P("M34 52 Q46 44 57 54 Q46 64 34 52")),
      S("La queue, derrière.", P("M25 52 L8 44 L12 58 L25 60")),
      S("Deux pattes toutes fines.", P("M42 72 L40 85"), P("M51 72 L53 85")),
      S("Et la branche où il est posé.", P("M18 86 L84 86")),
    ],
  },
];
export const DRAWING_BY_ID: Record<string, Drawing> = Object.fromEntries(DRAWINGS.map((d) => [d.id, d]));

// ---------- Rendu SVG ----------
export function primD(p: Prim): string {
  if (p.t === "path") return p.d;
  if (p.t === "circle") return `M${p.cx} ${p.cy - p.r} A${p.r} ${p.r} 0 1 1 ${p.cx} ${p.cy + p.r} A${p.r} ${p.r} 0 1 1 ${p.cx} ${p.cy - p.r}`;
  if (p.t === "ellipse") return `M${p.cx} ${p.cy - p.ry} A${p.rx} ${p.ry} 0 1 1 ${p.cx} ${p.cy + p.ry} A${p.rx} ${p.ry} 0 1 1 ${p.cx} ${p.cy - p.ry}`;
  return `M${p.x} ${p.y} L${p.x + 0.01} ${p.y}`;
}
export function primSVG(p: Prim, attrs = ""): string {
  if (p.t === "dot") return `<circle cx="${p.x}" cy="${p.y}" r="1.9" fill="currentColor" ${attrs}/>`;
  return `<path d="${primD(p)}" fill="none" stroke="currentColor" ${attrs}/>`;
}
// Le dessin terminé (modèle), en traits sombres.
export function drawingSVG(d: Drawing, opts: { upTo?: number; stroke?: number; color?: string } = {}): string {
  const n = opts.upTo ?? d.steps.length;
  const body = d.steps.slice(0, n).flatMap((s) => s.prims).map((p) => primSVG(p)).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;color:${opts.color ?? "#273043"}"><g stroke-width="${opts.stroke ?? 2.4}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}

export const drawingStickerSVG = (id?: string) => {
  const d = DRAWING_BY_ID[id ?? ""];
  const art = d ? drawingSVG(d, { stroke: 3.2 }).replace('style="display:block;width:100%;height:100%;', 'width="40" height="40" style="') : "";
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#FFEDC2"/><g transform="translate(15 15)">${art}</g></svg>`;
};

// ---------- Échantillonnage des traits (pour corriger) ----------
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function quad(a: Pt, c: Pt, b: Pt, t: number): Pt { return lerp(lerp(a, c, t), lerp(c, b, t), t); }
function cubic(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt { return quad(lerp(a, c1, t), lerp(c1, c2, t), lerp(c2, b, t), t); }
// Découpe un chemin en sous-tracés (polylignes denses).
export function pathPolylines(d: string): Pt[][] {
  const tok = d.match(/[MLQCZ]|-?\d*\.?\d+/gi) ?? [];
  const out: Pt[][] = [];
  let cur: Pt[] = [], pos: Pt = [0, 0], start: Pt = [0, 0], i = 0;
  const num = () => Number(tok[i++]);
  let cmd = "";
  while (i < tok.length) {
    if (/^[MLQCZ]$/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "M") { if (cur.length > 1) out.push(cur); pos = [num(), num()]; start = pos; cur = [pos]; cmd = "L"; }
    else if (cmd === "L") { const b: Pt = [num(), num()]; cur.push(b); pos = b; }
    else if (cmd === "Q") { const c: Pt = [num(), num()], b: Pt = [num(), num()]; for (let k = 1; k <= 16; k++) cur.push(quad(pos, c, b, k / 16)); pos = b; }
    else if (cmd === "C") { const c1: Pt = [num(), num()], c2: Pt = [num(), num()], b: Pt = [num(), num()]; for (let k = 1; k <= 20; k++) cur.push(cubic(pos, c1, c2, b, k / 20)); pos = b; }
    else if (cmd === "Z") { cur.push(start); pos = start; cmd = ""; }
    else i++;
  }
  if (cur.length > 1) out.push(cur);
  return out;
}
function resample(poly: Pt[], step: number): Pt[] {
  if (poly.length < 2) return poly.slice();
  const out: Pt[] = [poly[0]];
  let carry = 0;
  for (let k = 1; k < poly.length; k++) {
    const a = poly[k - 1], b = poly[k];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = step - carry;
    while (t <= len) { out.push(lerp(a, b, t / len)); t += step; }
    carry = len - (t - step);
  }
  const last = poly[poly.length - 1], prev = out[out.length - 1];
  if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > step * 0.3) out.push(last);
  return out;
}
export function primPolylines(p: Prim): Pt[][] {
  if (p.t === "path") return pathPolylines(p.d);
  if (p.t === "dot") return [[[p.x, p.y]]];
  const rx = p.t === "circle" ? p.r : p.rx, ry = p.t === "circle" ? p.r : p.ry;
  const n = 64, pts: Pt[] = [];
  for (let k = 0; k <= n; k++) { const a = -Math.PI / 2 + (2 * Math.PI * k) / n; pts.push([p.cx + rx * Math.cos(a), p.cy + ry * Math.sin(a)]); }
  return [pts];
}
export function samplePrims(prims: Prim[], step = 1.5): Pt[] {
  return prims.flatMap((p) => primPolylines(p).flatMap((poly) => resample(poly, step)));
}
export const resamplePolyline = resample;

// Compare les traits de l'enfant à l'étape attendue : part du modèle couverte (rappel) et part des traits
// de l'enfant posée sur le modèle (précision). Les points (yeux, nez…) se valident d'un simple toucher.
export function scoreStep(prims: Prim[], strokes: Pt[][], tol: number): { recall: number; precision: number } {
  // Couverture mesurée un peu plus serré (un rond à moitié fait ne passe pas), précision plus large (on ne
  // reproche pas un trait un peu à côté). Les points (yeux, nez…) gardent toute la tolérance.
  const lines = samplePrims(prims.filter((p) => p.t !== "dot"), 1.5);
  const dots = samplePrims(prims.filter((p) => p.t === "dot"), 1.5);
  const guide = [...lines, ...dots];
  const ink = strokes.flatMap((s) => (s.length === 1 ? s : resample(s, 1)));
  if (!guide.length || !ink.length) return { recall: 0, precision: 0 };
  const near = (p: Pt, set: Pt[], t: number) => { const t2 = t * t; for (const q of set) { const dx = p[0] - q[0], dy = p[1] - q[1]; if (dx * dx + dy * dy <= t2) return true; } return false; };
  const covered = lines.filter((g) => near(g, ink, tol * 0.8)).length + dots.filter((g) => near(g, ink, tol)).length;
  const precision = ink.filter((c) => near(c, guide, tol * 1.35)).length / ink.length;
  return { recall: covered / guide.length, precision };
}
