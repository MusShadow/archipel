// Formes planes et solides dessinés en SVG (formes, motifs, traces des solides).

export type Shape2D = "cercle" | "ovale" | "carre" | "rectangle" | "triangle" | "losange" | "etoile" | "coeur" | "pentagone" | "hexagone";
export type Solid = "boule" | "cube" | "pave" | "cylindre" | "cone" | "pyramide";

export const SHAPES_BASIC: Shape2D[] = ["cercle", "carre", "triangle", "rectangle"];
export const SHAPES_ALL: Shape2D[] = ["cercle", "ovale", "carre", "rectangle", "triangle", "losange", "etoile", "coeur", "pentagone", "hexagone"];
export const SOLIDS: Solid[] = ["boule", "cube", "pave", "cylindre", "cone", "pyramide"];

export const SHAPE_NAME: Record<Shape2D, string> = {
  cercle: "le cercle", ovale: "l'ovale", carre: "le carré", rectangle: "le rectangle", triangle: "le triangle",
  losange: "le losange", etoile: "l'étoile", coeur: "le cœur", pentagone: "le pentagone", hexagone: "l'hexagone",
};
export const SHAPE_HINT: Record<Shape2D, string> = {
  cercle: "tout rond, sans aucun coin", ovale: "rond mais allongé, comme un œuf", carre: "4 côtés tous pareils et 4 coins",
  rectangle: "4 côtés : 2 longs et 2 courts", triangle: "3 côtés et 3 coins", losange: "4 côtés pareils, posé sur une pointe, comme un cerf-volant",
  etoile: "plein de branches pointues", coeur: "la forme qu'on dessine pour dire je t'aime", pentagone: "5 côtés", hexagone: "6 côtés, comme une case de ruche",
};
export const SIDES: Partial<Record<Shape2D, number>> = { triangle: 3, carre: 4, rectangle: 4, losange: 4, pentagone: 5, hexagone: 6 };

export const SOLID_NAME: Record<Solid, string> = { boule: "la boule", cube: "le cube", pave: "le pavé", cylindre: "le cylindre", cone: "le cône", pyramide: "la pyramide" };
export const SOLID_HINT: Record<Solid, string> = {
  boule: "toute ronde de tous les côtés, elle roule partout", cube: "6 faces carrées, comme un dé", pave: "comme une boîte en carton, avec des faces rectangles",
  cylindre: "rond en haut et en bas, droit sur le côté, comme une boîte de conserve", cone: "rond en bas et pointu en haut, comme un cornet de glace",
  pyramide: "un carré en bas et des triangles qui montent jusqu'à une pointe",
};
// Objets du quotidien (emoji) et trace laissée par chaque solide posé sur sa base.
export const SOLID_OBJECTS: Partial<Record<Solid, { e: string; nom: string }[]>> = {
  boule: [{ e: "⚽", nom: "le ballon" }, { e: "🍊", nom: "l'orange" }, { e: "🎱", nom: "la boule de billard" }],
  cube: [{ e: "🎲", nom: "le dé" }, { e: "🧊", nom: "le glaçon" }],
  pave: [{ e: "📦", nom: "le carton" }, { e: "🧱", nom: "la brique" }],
  cylindre: [{ e: "🥫", nom: "la boîte de conserve" }, { e: "🔋", nom: "la pile" }, { e: "🧻", nom: "le rouleau" }, { e: "🥁", nom: "le tambour" }],
  cone: [{ e: "🍦", nom: "le cornet de glace" }, { e: "🥕", nom: "la carotte" }, { e: "📣", nom: "le porte-voix" }],
};
export const SOLID_TRACE: Record<Solid, Shape2D> = { boule: "cercle", cube: "carre", pave: "rectangle", cylindre: "cercle", cone: "cercle", pyramide: "carre" };

const P = (pts: number[][]) => pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
const regular = (n: number, r: number, rot = -90) => P(Array.from({ length: n }, (_, i) => {
  const a = ((rot + (360 * i) / n) * Math.PI) / 180;
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
}));
const star = () => P(Array.from({ length: 10 }, (_, i) => {
  const a = ((-90 + 36 * i) * Math.PI) / 180, r = i % 2 ? 18 : 42;
  return [50 + r * Math.cos(a), 52 + r * Math.sin(a)];
}));

export function shapeBody(s: Shape2D, fill: string, stroke = "#273043") {
  const a = `fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"`;
  switch (s) {
    case "cercle": return `<circle cx="50" cy="50" r="38" ${a}/>`;
    case "ovale": return `<ellipse cx="50" cy="50" rx="44" ry="27" ${a}/>`;
    case "carre": return `<rect x="17" y="17" width="66" height="66" rx="2" ${a}/>`;
    case "rectangle": return `<rect x="6" y="28" width="88" height="44" rx="2" ${a}/>`;
    case "triangle": return `<polygon points="50,10 92,86 8,86" ${a}/>`;
    case "losange": return `<polygon points="50,6 84,50 50,94 16,50" ${a}/>`;
    case "etoile": return `<polygon points="${star()}" ${a}/>`;
    case "coeur": return `<path d="M50 86 C12 62 8 30 30 22 C41 18 48 25 50 32 C52 25 59 18 70 22 C92 30 88 62 50 86 Z" ${a}/>`;
    case "pentagone": return `<polygon points="${regular(5, 42)}" ${a}/>`;
    case "hexagone": return `<polygon points="${regular(6, 42, 0)}" ${a}/>`;
  }
}
// Sommets des formes à côtés droits (repère 0–100, sans rotation) : pour faire s'allumer les côtés un par un.
export function polygonVertices(s: Shape2D): [number, number][] | null {
  const reg = (n: number, r: number, rot: number) => Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 * i) / n) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as [number, number];
  });
  switch (s) {
    case "carre": return [[17, 17], [83, 17], [83, 83], [17, 83]];
    case "rectangle": return [[6, 28], [94, 28], [94, 72], [6, 72]];
    case "triangle": return [[50, 10], [92, 86], [8, 86]];
    case "losange": return [[50, 6], [84, 50], [50, 94], [16, 50]];
    case "pentagone": return reg(5, 42, -90);
    case "hexagone": return reg(6, 42, 0);
    default: return null;
  }
}
export function sidesOverlay(s: Shape2D, step = 0.8): string {
  const v = polygonVertices(s);
  if (!v) return "";
  let out = "";
  v.forEach(([x1, y1], i) => {
    const [x2, y2] = v[(i + 1) % v.length];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = mx - 50, dy = my - 50, d = Math.hypot(dx, dy) || 1;
    const nx = mx + (dx / d) * 13, ny = my + (dy / d) * 13;
    const delay = `animation-delay:${(i * step).toFixed(2)}s`;
    out += `<line class="side" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="${delay}"/>`;
    out += `<g class="sidenum" style="${delay}"><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="8.5" fill="#FF7F50"/><text x="${nx.toFixed(1)}" y="${(ny + 4.2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" style="font-family:'Baloo 2',ui-rounded,system-ui,sans-serif">${i + 1}</text></g>`;
  });
  return out;
}

// Forme plane, avec une rotation et une taille variables pour ne pas apprendre une seule image « type ».
export function shapeSVG(s: Shape2D, fill: string, rot = 0, scale = 1) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible"><g transform="rotate(${rot} 50 50) translate(50 50) scale(${scale}) translate(-50 -50)">${shapeBody(s, fill)}</g></svg>`;
}

// Teintes d'une couleur : clair (dessus), moyen, foncé (côté à l'ombre).
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
let gid = 0;
export function solidSVG(s: Solid, color: string) {
  const L = shade(color, 0.45), M = color, D = shade(color, -0.3);
  const id = `sg${++gid}`;
  const line = `stroke="#273043" stroke-width="2.5" stroke-linejoin="round"`;
  let body = "";
  switch (s) {
    case "boule":
      body = `<defs><radialGradient id="${id}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${shade(color, 0.7)}"/><stop offset=".55" stop-color="${M}"/><stop offset="1" stop-color="${D}"/></radialGradient></defs><ellipse cx="62" cy="108" rx="34" ry="6" fill="#273043" opacity=".12"/><circle cx="60" cy="60" r="42" fill="url(#${id})" ${line}/>`; break;
    case "cube":
      body = `<polygon points="60,16 100,36 60,56 20,36" fill="${L}" ${line}/><polygon points="20,36 60,56 60,104 20,84" fill="${M}" ${line}/><polygon points="60,56 100,36 100,84 60,104" fill="${D}" ${line}/>`; break;
    case "pave":
      body = `<polygon points="10,44 72,26 110,44 48,62" fill="${L}" ${line}/><polygon points="10,44 48,62 48,98 10,80" fill="${M}" ${line}/><polygon points="48,62 110,44 110,80 48,98" fill="${D}" ${line}/>`; break;
    case "cylindre":
      body = `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${D}"/><stop offset=".35" stop-color="${L}"/><stop offset="1" stop-color="${D}"/></linearGradient></defs><path d="M28 26 L28 94 A32 11 0 0 0 92 94 L92 26" fill="url(#${id})" ${line}/><ellipse cx="60" cy="26" rx="32" ry="11" fill="${L}" ${line}/>`; break;
    case "cone":
      body = `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${D}"/><stop offset=".38" stop-color="${L}"/><stop offset="1" stop-color="${D}"/></linearGradient></defs><path d="M24 92 L60 12 L96 92 A36 12 0 0 1 24 92 Z" fill="url(#${id})" ${line}/>`; break;
    case "pyramide":
      body = `<polygon points="60,10 16,82 54,102" fill="${M}" ${line}/><polygon points="60,10 54,102 104,80" fill="${D}" ${line}/>`; break;
  }
  return `<svg viewBox="0 0 120 120" aria-hidden="true" style="display:block;width:100%;height:100%">${body}</svg>`;
}

export const PALETTE = ["#FF7F50", "#3D8BEA", "#34B37A", "#FFC145", "#8C6BE0", "#E85D9A", "#1FA9B5"];
