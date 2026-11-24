// Dessins du « volcan d'Octave » : le volcan coupé en deux (touchable), les étapes de l'éruption, volcans rouges et
// gris, endormis ou réveillés, la lave, le matériel des volcanologues, des volcans du monde, les gommettes.
// Même style que la goutte : trait encre, couleurs douces, carré de 100 × 100 (le volcan coupé : 200 × 160).
import { image, srcDe } from "../design/dessins";
const INK = "#273043";
const K = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const K2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const LAVA = "#FF7F50", LAVA_D = "#E8504A", LAVA_L = "#FFC145", ROCK = "#A77B56", ROCK_IN = "#C49A6C", BASALT = "#4A4E5C",
  ASH = "#9AA3B5", ASH_L = "#C9CED8", SOIL = "#D9B48C", GRASS = "#8BCB78", TREE = "#34B37A", WATER = "#7CC6E8", SEA = "#5BB8E6";

// ---------- Petits morceaux ----------
const waves = (y: number, x0 = 6, n = 7, w = 13, color = "#fff") =>
  `<path d="M${x0} ${y}${Array.from({ length: n }, (_, i) => ` q${w / 2} ${i % 2 ? 3.4 : -3.4} ${w} 0`).join("")}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
const tree = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.4" y="-3" width="2.8" height="5" fill="#8D6E4C"/><path d="M0 -15 L6 -3 H-6 Z" fill="${TREE}" ${K2}/></g>`;
const puff = (x: number, y: number, r: number, fill = ASH_L) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${K2}/>`;
const zz = (x: number, y: number, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 H7 L0 8 H7" fill="none" ${K2}/>`;
const house = (x: number, y: number, s = 1, roof = "#FF7F50", wall = "#FFF2D6") =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 12 L13 0 L26 12 Z" fill="${roof}" ${K2}/><rect x="3" y="12" width="20" height="15" fill="${wall}" ${K2}/><rect x="10" y="18" width="6" height="9" fill="${LAVA_L}" ${K2}/></g>`;
const star4 = (x: number, y: number, r: number, fill = LAVA_L) =>
  `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z" fill="${fill}"/>`;

// ---------- Le volcan, en options ----------
interface V {
  fill?: string; snow?: boolean; trees?: boolean; lake?: boolean; glow?: boolean; rivers?: boolean; fountain?: boolean;
  smoke?: boolean; plume?: boolean; ashfall?: boolean; bombs?: boolean; sea?: boolean; face?: "dort" | "eveil"; ground?: boolean; small?: boolean;
}
const CONE = "M10 90 L40 36 Q50 31 60 36 L90 90 Z", CONE_LAC = "M10 90 L33 46 Q50 38 67 46 L90 90 Z";
function volcano(o: V = {}): string {
  let s = "";
  if (o.plume) s += `<path d="M28 31 C19 30 19 17 29 16 C28 6 41 2 46 8 C50 0 64 1 65 10 C75 9 80 21 71 25 C73 33 62 36 57 32 L54 37 H46 L43 32 C38 36 29 36 28 31 Z" fill="${ASH}" ${K}/>`
    + `<path d="M34 22 C36 16 42 15 44 19 M54 14 C58 11 63 13 63 17 M44 30 C46 26 51 26 52 29" fill="none" stroke="${ASH_L}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (o.sea) s += `<path d="M0 82 H100 V100 H0 Z" fill="${SEA}"/>${waves(91, 2, 8, 12.4)}`;
  s += `<path d="${o.lake ? CONE_LAC : CONE}" fill="${o.fill ?? ROCK}" ${K}/>`;
  if (!o.snow && !o.trees && (o.fill ?? ROCK) === ROCK) s += `<path d="M32 60 Q40 57 46 61 M55 70 Q62 67 70 71 M24 78 Q31 75 37 79" fill="none" stroke="${ROCK_IN}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (o.snow) s += `<path d="M40 36 Q50 31 60 36 L66.6 47.9 Q62 45 58 49 Q54 44.5 50 49 Q46 44.5 42 49 Q38 45 33.4 47.9 Z" fill="#fff" ${K2}/>`;
  if (o.trees) s += tree(30, 76, 0.9) + tree(40, 64, 0.8) + tree(62, 66, 0.8) + tree(70, 78, 0.9) + tree(52, 84, 0.9);
  s += o.lake ? `<path d="M33 46 Q50 38 67 46 Q50 53 33 46 Z" fill="${WATER}" ${K2}/><path d="M40 46 Q46 44 52 46" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M40 36 Q50 31 60 36 Q50 40.5 40 36 Z" fill="#6B4A30" ${K2}/>`;
  if (o.glow) s += `<ellipse cx="50" cy="29" rx="15" ry="8" fill="${LAVA_L}" opacity=".45"/><path d="M42 36 Q50 33 58 36 Q50 39 42 36 Z" fill="${LAVA}"/>`;
  if (o.rivers) s += [`M45 37 C43 48 38 52 36 60 C34 68 28 76 25 89`, `M55 37 C57 47 61 54 63 62 C66 70 70 78 74 89`]
    .map((d) => `<path d="${d}" fill="none" stroke="${LAVA_D}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${LAVA_L}" stroke-width="2.6" stroke-linecap="round"/>`).join("");
  if (o.fountain) s += `<path d="M43 36 C38 27 40 18 45 11 C46 18 48 21 50 14 C52 21 54 18 55 11 C60 18 62 27 57 36 Z" fill="${LAVA}" ${K2}/>`
    + `<path d="M46.5 36 C45 29 47 23 50 19 C53 23 55 29 53.5 36 Z" fill="${LAVA_L}"/>`
    + [[36, 16, 2.6], [64, 14, 2.8], [31, 25, 2.2], [69, 24, 2.4], [50, 5, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LAVA}" ${K2}/>`).join("");
  if (o.smoke) s += puff(50, 25, 6) + puff(44, 16, 5) + puff(55, 10, 6.5) + puff(48, 3.5, 3.6);
  if (o.ashfall) s += [[18, 40], [24, 52], [14, 62], [80, 42], [76, 54], [86, 60], [22, 30], [78, 30], [30, 46], [70, 46], [12, 50], [88, 50]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#7D8597"/>`).join("");
  if (o.bombs) s += [[24, 18, -1], [76, 14, 1], [16, 34, -1], [84, 32, 1]].map(([x, y, d]) =>
    `<path d="M${x - d * 9} ${y + 9} L${x - d * 3} ${y + 3}" stroke="${ASH}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x - 4} ${y - 1} L${x - 1} ${y - 4} L${x + 4} ${y - 3} L${x + 4} ${y + 2} L${x} ${y + 4} L${x - 4} ${y + 2} Z" fill="${BASALT}" ${K2}/>`).join("");
  if (o.face) {
    s += o.face === "dort"
      ? `<path d="M39 64 Q43 67.5 47 64 M53 64 Q57 67.5 61 64" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${zz(70, 18)}${zz(80, 8, 0.75)}`
      : `<circle cx="43" cy="63" r="3.8" fill="${INK}"/><circle cx="57" cy="63" r="3.8" fill="${INK}"/><circle cx="44.3" cy="61.6" r="1.3" fill="#fff"/><circle cx="58.3" cy="61.6" r="1.3" fill="#fff"/>`;
    s += o.face === "dort" ? `<path d="M46 75 Q50 77.5 54 75" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
      : `<ellipse cx="50" cy="75" rx="4" ry="3.2" fill="${INK}"/>`;
    s += `<circle cx="36" cy="72" r="3.6" fill="#FF9DB0" opacity=".7"/><circle cx="64" cy="72" r="3.6" fill="#FF9DB0" opacity=".7"/>`;
  }
  if (o.ground !== false && !o.sea) s += `<path d="M2 90 H98" ${K}/>`;
  return s;
}

// ---------- Le volcan coupé en deux (200 × 160), parties touchables ----------
// Chaque partie est un groupe data-t avec une zone de toucher généreuse (class « hit »), pour de petits doigts.
// Livraison 4 : le volcan est dessiné (atelier : scripts/illustration/jeux_decouvertes.py), dans le même repère, trois
// fois plus grand : la terre en couches, la poche de magma, la cheminée vide et le cratère forment le fond ; la lave du
// cratère, la coulée, le nuage de cendres et le jet de l'éruption sont posés par-dessus. Le magma qui monte dans la
// cheminée reste tracé ici (son niveau suit le doigt).
export const COUPE_PARTS = ["chambre", "cheminee", "cratere", "coulee", "cendres"] as const;
export type CoupePart = (typeof COUPE_PARTS)[number];
export const CHIMNEY = { x: 100, top: 42, bottom: 126, w: 13 };
export const FLOW_PATH = "M113 41 C122 48 132 58 142 69 C152 80 162 92 171 103";
const FLOW_HIT = "M127 54 C135 62 144 71 152 80 C159 88 165 95 170 101";
/** Une image de l'atelier à sa place dans le repère du volcan coupé (sa boîte, divisée par l'échelle du dessin).
 *  Elle ne prend jamais le doigt (une image SVG se touche sur tout son rectangle, même transparent) : seules les zones
 *  « hit » répondent, comme avant. */
export function imageCoupe(nom: string, cls = "", extra = ""): string {
  const im = image(`activites/volcan-${nom}`);
  if (!im) return "";
  const k = Number(image("activites/volcan-coupe")?.infos?.echelle ?? 3);
  const [x, y, l, ht] = im.boite.map((v) => (v / k).toFixed(2));
  return `<image${cls ? ` class="${cls}"` : ""} href="${srcDe(im)}" x="${x}" y="${y}" width="${l}" height="${ht}" preserveAspectRatio="none" pointer-events="none"${extra}/>`;
}
// Le magma de la cheminée : rouge sur les bords, jaune au cœur.
const MAGMA_DEFS = `<defs><linearGradient id="vmagma-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${LAVA_D}"/>`
  + `<stop offset=".42" stop-color="${LAVA}"/><stop offset=".5" stop-color="${LAVA_L}"/><stop offset=".58" stop-color="${LAVA}"/><stop offset="1" stop-color="${LAVA_D}"/></linearGradient></defs>`;
export function coupeSVG(o: { flow?: boolean; cloud?: boolean; level?: number; tappable?: boolean } = {}): string {
  const flow = o.flow ?? true, cloud = o.cloud ?? true, level = o.level ?? 1;
  const g = (id: CoupePart, inner: string, hit: string) =>
    o.tappable === false ? inner : `<g data-t="${id}" class="vpart" role="button" aria-label="${PART_LABEL[id]}">${inner}${hit}</g>`;
  const top = CHIMNEY.bottom - level * (CHIMNEY.bottom - CHIMNEY.top);
  let s = MAGMA_DEFS + imageCoupe("coupe");
  // La poche de magma (dessinée dans le fond).
  s += g("chambre", "", `<rect class="hit" x="54" y="122" width="92" height="34" rx="14" fill="none" pointer-events="all"/>`);
  // Le magma qui monte dans la cheminée (niveau 0 à 1).
  const x0 = CHIMNEY.x - CHIMNEY.w / 2;
  s += g("cheminee", `<rect class="vmagma" x="${x0 + 1.4}" y="${top.toFixed(1)}" width="${CHIMNEY.w - 2.8}" height="${(CHIMNEY.bottom - top).toFixed(1)}" fill="url(#vmagma-grad)"/>`
    + `<rect class="vmagma-l" x="${x0 + 5.6}" y="${top.toFixed(1)}" width="1.8" height="${(CHIMNEY.bottom - top).toFixed(1)}" fill="#FFE07A" opacity=".55"/>`,
    `<rect class="hit" x="${CHIMNEY.x - 15}" y="52" width="30" height="${CHIMNEY.bottom - 54}" fill="none" pointer-events="all"/>`);
  // Le cratère : la lave y brille quand le magma est arrivé en haut.
  s += g("cratere", imageCoupe("cratere-lave", "vcratere-lave", level >= 1 ? "" : ` style="opacity:0"`),
    `<rect class="hit" x="80" y="29" width="40" height="26" rx="8" fill="none" pointer-events="all"/>`); // 78 px de haut sur l'iPad
  // La lave qui coule sur la pente.
  if (flow) s += g("coulee", imageCoupe("coulee"),
    `<path class="hit" d="${FLOW_HIT}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="30" stroke-linecap="round" pointer-events="stroke"/>`);
  // Le nuage de cendres.
  if (cloud) s += g("cendres", `<g class="vcloud">${imageCoupe("nuage")}</g>`,
    `<rect class="hit" x="58" y="0" width="84" height="29" rx="10" fill="none" pointer-events="all"/>`);
  return `<svg viewBox="0 0 200 160" aria-label="Un volcan coupé en deux" style="display:block;width:100%;height:100%;overflow:visible">${s}</svg>`;
}
export const PART_LABEL: Record<CoupePart, string> = {
  chambre: "La poche de magma", cheminee: "La cheminée", cratere: "Le cratère", coulee: "La lave", cendres: "Le nuage de cendres",
};

// ---------- Dessins 100 × 100 ----------
const basin = (inner: string) => `<path d="M10 40 H90 L84 88 Q83 92 79 92 H21 Q17 92 16 88 Z" fill="#EAF6FB" ${K}/><path d="M12.6 50 H87.4 L84 86 Q83.5 89 80 89 H20 Q16.5 89 16 86 Z" fill="${WATER}"/>${waves(56, 14, 6, 12)}${inner}`;
const pumice = (x: number, y: number, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16 -2 C-15 -10 -6 -13 2 -12 C10 -12 17 -7 16 1 C15 9 6 12 -3 11 C-11 10 -17 6 -16 -2 Z" fill="#D8D2C4" ${K2}/>`
  + [[-8, -4, 2.2], [0, -7, 1.6], [7, -3, 2.4], [-3, 3, 1.8], [5, 5, 1.6], [11, 0, 1.3], [-11, 3, 1.4]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#9B9488"/>`).join("") + `</g>`;
const sand = (color: string, dots: string) => `<path d="M0 8 H100 V44 H0 Z" fill="${SEA}"/>${waves(22, 4, 8, 12)}<path d="M0 44 Q30 36 60 42 T100 40 V100 H0 Z" fill="${color}" ${K}/>`
  + [[18, 62], [40, 74], [64, 60], [80, 80], [30, 88], [56, 90], [86, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${dots}"/>`).join("")
  + `<path d="M0 44 Q30 36 60 42 T100 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;

export const VART: Record<string, string> = {
  // Étapes de l'éruption.
  chauffe: `<path d="M4 30 H96 V92 Q96 96 92 96 H8 Q4 96 4 92 Z" fill="${SOIL}" ${K}/><path d="M28 30 L44 12 Q50 9 56 12 L72 30 Z" fill="${ROCK}" ${K2}/>`
    + `<path d="M4 30 H28 M72 30 H96" ${K}/><ellipse cx="50" cy="72" rx="34" ry="15" fill="${LAVA_D}" ${K}/><ellipse cx="46" cy="69" rx="20" ry="6" fill="${LAVA}"/>`
    + `<path d="M34 50 q3 -4 0 -8 M50 48 q3 -4 0 -8 M66 50 q3 -4 0 -8" fill="none" stroke="${LAVA_D}" stroke-width="2.6" stroke-linecap="round"/>`,
  monte: `<path d="M6 92 L40 30 Q50 25 60 30 L94 92 Z" fill="${ROCK}" ${K}/><rect x="45" y="30" width="10" height="62" fill="#6B4A30" ${K2}/>`
    + `<rect x="46.4" y="54" width="7.2" height="37" fill="${LAVA_D}"/><path d="M50 14 V24 M44 19 L50 13 L56 19" fill="none" stroke="${LAVA_D}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M2 92 H98" ${K}/>`,
  gronde: volcano({ smoke: true }) + `<path d="M4 66 l4 4 l-4 4 l4 4 M96 66 l-4 4 l4 4 l-4 4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  eruption: volcano({ fountain: true }),
  coulee: volcano({ rivers: true, glow: true }),
  nuage: volcano({ plume: true }),
  cendres: `<path d="M8 22 C2 22 2 12 9 11 C9 3 19 0 23 5 C27 -1 38 0 39 7 C47 6 50 15 44 18 C46 24 37 26 34 23 C30 26 12 27 8 22 Z" fill="${ASH}" ${K2}/>`
    + `<path d="M58 22 C52 22 52 12 59 11 C59 3 69 0 73 5 C77 -1 88 0 89 7 C97 6 100 15 94 18 C96 24 87 26 84 23 C80 26 62 27 58 22 Z" fill="${ASH}" ${K2}/>`
    + house(16, 58, 1.1, "#B9BFCC", "#E6E8EE") + tree(66, 82, 1.2) + tree(80, 84, 1.0)
    + `<path d="M2 88 H98 V96 H2 Z" fill="${ASH_L}" ${K2}/>`
    + [[12, 34], [22, 44], [34, 36], [46, 48], [58, 34], [70, 44], [84, 36], [92, 50], [40, 62], [56, 56], [86, 64], [8, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#7D8597"/>`).join(""),
  pierre: `<path d="M10 76 C8 60 20 48 36 44 C48 40 64 42 76 48 C90 55 94 70 88 80 C82 90 62 92 44 91 C26 90 12 88 10 76 Z" fill="${BASALT}" ${K}/>`
    + `<path d="M30 56 L40 66 L36 78 M58 50 L62 62 L74 68 M48 72 L60 80" fill="none" stroke="#2B2F3A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M24 56 Q30 50 38 49" fill="none" stroke="#7D8597" stroke-width="3" stroke-linecap="round"/>`,
  plantes: `<path d="M4 70 C20 64 40 66 52 70 C66 74 84 66 96 70 V94 H4 Z" fill="${BASALT}" ${K}/>`
    + `<path d="M24 70 C22 58 16 52 10 50 M24 70 C26 58 32 52 38 51 M24 70 V48" fill="none" stroke="${TREE}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M66 72 V52 M66 60 C60 54 56 54 52 56 M66 58 C72 50 78 50 82 52" fill="none" stroke="${TREE}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<circle cx="66" cy="48" r="5" fill="${LAVA_L}" ${K2}/><circle cx="44" cy="62" r="4" fill="#E85D9A" ${K2}/><path d="M44 66 V72" stroke="${TREE}" stroke-width="3" stroke-linecap="round"/>`,
  ile: `<path d="M0 62 H100 V100 H0 Z" fill="${SEA}"/>${waves(84, 40, 5, 12)}<path d="M-2 62 L18 24 Q26 20 34 24 L58 62 Z" fill="${ROCK}" ${K}/>`
    + `<path d="M18 24 Q26 20 34 24 Q26 27 18 24 Z" fill="${LAVA}" ${K2}/>`
    + `<path d="M30 25 C36 38 44 48 54 58 C60 64 66 68 72 70" fill="none" stroke="${LAVA_D}" stroke-width="7" stroke-linecap="round"/><path d="M30 25 C36 38 44 48 54 58 C60 64 66 68 72 70" fill="none" stroke="${LAVA_L}" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="M54 62 Q66 60 78 66 Q76 74 60 74 Q52 72 50 66 Z" fill="${BASALT}" ${K2}/>` + puff(80, 56, 5, "#fff") + puff(88, 48, 6, "#fff") + puff(82, 40, 4, "#fff"),
  // Volcans rouges, volcans gris, endormis, réveillés (scènes et icônes).
  rouge_fontaine: volcano({ fountain: true, rivers: true }),
  rouge_rivieres: volcano({ rivers: true, glow: true }),
  rouge_lac: `<path d="M2 90 H98" ${K}/><path d="M6 90 L30 52 Q50 44 70 52 L94 90 Z" fill="${ROCK}" ${K}/><path d="M30 52 Q50 44 70 52 Q50 61 30 52 Z" fill="${LAVA}" ${K2}/>`
    + `<path d="M38 52 Q44 49 50 52 M54 54 Q60 51 64 53" fill="none" stroke="${LAVA_L}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="50" cy="44" rx="24" ry="9" fill="${LAVA_L}" opacity=".35"/>`
    + [[40, 40, 2.2], [58, 38, 2.6], [50, 32, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LAVA}" ${K2}/>`).join(""),
  gris_panache: volcano({ plume: true }),
  gris_pluie: volcano({ plume: true, ashfall: true, fill: "#9C8F84" }),
  gris_bombes: volcano({ plume: true, bombs: true }),
  endormi_lac: volcano({ fill: "#7FB86B", trees: true, lake: true }),
  endormi_foret: volcano({ fill: "#7FB86B", trees: true }) + `<path d="M70 18 q3 -3 6 0 q3 -3 6 0 M20 26 q2.6 -2.6 5.2 0 q2.6 -2.6 5.2 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  reveille_fume: volcano({ smoke: true }),
  reveille_lueur: volcano({ glow: true, smoke: true }),
  icone_rouge: volcano({ fountain: true, rivers: true }),
  icone_gris: volcano({ plume: true, fill: "#9C8F84" }),
  icone_endormi: volcano({ fill: "#7FB86B", face: "dort" }),
  icone_reveille: volcano({ smoke: true, face: "eveil", glow: true }),
  // La lave.
  lave: `<path d="M8 36 C20 30 30 40 42 36 C54 32 62 22 76 26 C88 30 92 42 90 54 C88 68 78 80 62 84 C44 88 22 86 12 74 C4 64 2 44 8 36 Z" fill="${LAVA_D}" ${K}/>`
    + `<path d="M18 46 C28 42 36 50 46 46 C56 42 64 36 76 40 C82 44 82 54 76 60 C66 68 50 72 34 70 C24 68 14 58 18 46 Z" fill="${LAVA}"/>`
    + `<path d="M30 52 C38 50 44 56 52 52 M58 48 C64 46 70 48 72 52" fill="none" stroke="${LAVA_L}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<circle cx="40" cy="62" r="3" fill="${LAVA_L}"/><circle cx="62" cy="64" r="2.4" fill="${LAVA_L}"/><circle cx="70" cy="56" r="1.8" fill="${LAVA_L}"/>`,
  fumee: puff(46, 70, 14) + puff(60, 54, 12) + puff(42, 44, 10) + puff(54, 28, 9) + puff(46, 14, 6),
  four: `<rect x="12" y="14" width="76" height="76" rx="8" fill="#E6E8EE" ${K}/><rect x="20" y="34" width="60" height="44" rx="5" fill="#5B6475" ${K2}/>`
    + `<rect x="26" y="40" width="48" height="32" rx="3" fill="${LAVA}" opacity=".85"/><path d="M30 64 H70" stroke="${LAVA_L}" stroke-width="3" stroke-linecap="round"/>`
    + `<circle cx="28" cy="24" r="4" fill="#fff" ${K2}/><circle cx="44" cy="24" r="4" fill="#fff" ${K2}/><rect x="56" y="21" width="24" height="6" rx="3" fill="#C9CED8" ${K2}/>`,
  ponce: pumice(50, 52, 2.2),
  flotte_ponce: basin(pumice(50, 50, 1.05)),
  coule_ponce: basin(`<path d="M38 86 C36 80 42 75 50 75 C58 75 64 80 62 86 Z" fill="#8A8F9C" ${K2}/>`),
  sable_noir: sand("#3E4250", "#9AA3B5"),
  sable_dore: sand("#F1D49A", "#D9A877"),
  // Le métier de volcanologue.
  combinaison: `<path d="M34 24 C34 12 66 12 66 24 V36 H34 Z" fill="#D7DCE4" ${K}/><rect x="39" y="22" width="22" height="12" rx="5" fill="#3D4A63" ${K2}/>`
    + `<path d="M42 25 L48 25" stroke="#8FD3F0" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M30 38 Q50 32 70 38 L74 70 H26 Z" fill="#D7DCE4" ${K}/><path d="M30 40 L18 64 L24 67 L36 48 M70 40 L82 64 L76 67 L64 48" fill="#C3C9D3" ${K2}/>`
    + `<path d="M30 70 L32 92 H46 L48 74 M52 74 L54 92 H68 L70 70" fill="#D7DCE4" ${K}/><rect x="30" y="86" width="17" height="7" rx="2" fill="#5B6475" ${K2}/><rect x="53" y="86" width="17" height="7" rx="2" fill="#5B6475" ${K2}/>`
    + `<path d="M36 46 L44 60 M60 44 L66 56" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
  masque: `<path d="M24 30 C24 18 76 18 76 30 V54 C76 70 64 80 50 80 C36 80 24 70 24 54 Z" fill="#5B6475" ${K}/>`
    + `<ellipse cx="38" cy="40" rx="9" ry="8" fill="#8FD3F0" ${K2}/><ellipse cx="62" cy="40" rx="9" ry="8" fill="#8FD3F0" ${K2}/>`
    + `<circle cx="28" cy="70" r="10" fill="${LAVA_L}" ${K2}/><circle cx="72" cy="70" r="10" fill="${LAVA_L}" ${K2}/><circle cx="50" cy="68" r="8" fill="#C9CED8" ${K2}/>`
    + `<path d="M24 34 L10 30 M76 34 L90 30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  sismometre: `<rect x="8" y="30" width="84" height="52" rx="6" fill="#E6E8EE" ${K}/><rect x="16" y="38" width="68" height="30" rx="3" fill="#fff" ${K2}/>`
    + `<path d="M18 53 H30 L33 46 L37 60 L41 42 L45 64 L49 44 L53 60 L57 50 L60 55 H82" fill="none" stroke="${LAVA_D}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`
    + `<circle cx="22" cy="75" r="3" fill="#34B37A"/><circle cx="32" cy="75" r="3" fill="${LAVA_L}"/><rect x="60" y="72" width="22" height="6" rx="3" fill="#C9CED8" ${K2}/>`
    + `<path d="M50 30 V20 M50 20 L60 14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="61" cy="13" r="3" fill="#E85D9A" ${K2}/>`,
  drone: `<path d="M22 40 L40 50 M78 40 L60 50 M22 70 L40 60 M78 70 L60 60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    + [[22, 40], [78, 40], [22, 70], [78, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y - 5}" rx="13" ry="3" fill="#C9CED8" ${K2}/><rect x="${x - 2}" y="${y - 5}" width="4" height="6" fill="${INK}"/>`).join("")
    + `<rect x="36" y="46" width="28" height="18" rx="7" fill="#3D8BEA" ${K}/><circle cx="50" cy="70" r="6" fill="#5B6475" ${K2}/><circle cx="50" cy="70" r="2.4" fill="#8FD3F0"/>`,
  partir: `<path d="M2 62 L18 32 Q24 28 30 32 L46 62 Z" fill="${ROCK}" ${K2}/><path d="M18 32 Q24 28 30 32 Q24 35 18 32 Z" fill="${LAVA}" ${K2}/>` + puff(24, 22, 4.5) + puff(30, 14, 4)
    + `<path d="M0 62 H100 V100 H0 Z" fill="${GRASS}"/><path d="M0 74 H100 V88 H0 Z" fill="#9AA3B5"/><path d="M6 81 H16 M26 81 H36 M46 81 H56 M66 81 H76 M86 81 H96" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M56 74 L58 64 Q60 60 64 60 H78 Q82 60 84 64 L88 70 H92 Q95 70 95 73 V76 H56 Z" fill="${LAVA_L}" ${K2}/><path d="M64 63 H72 V69 H61 Z M75 63 H80 L83 69 H75 Z" fill="#CDEFF5" ${K2}/>`
    + `<circle cx="64" cy="77" r="4.4" fill="${INK}"/><circle cx="86" cy="77" r="4.4" fill="${INK}"/>`
    + `<path d="M40 66 H50 M36 71 H48" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  volcanologue: volcano({ smoke: true, ground: true }) + `<g transform="translate(58 46) scale(0.45)"><path d="M34 24 C34 12 66 12 66 24 V36 H34 Z" fill="#D7DCE4" ${K}/><rect x="39" y="22" width="22" height="12" rx="5" fill="#3D4A63" ${K2}/><path d="M30 38 Q50 32 70 38 L74 70 H26 Z" fill="#D7DCE4" ${K}/><path d="M30 70 L32 92 H46 L48 74 M52 74 L54 92 H68 L70 70" fill="#D7DCE4" ${K}/></g>`,
  geyser: `<path d="M2 78 C20 72 36 76 50 74 C64 72 80 76 98 72 V98 H2 Z" fill="#C9B79A" ${K}/>`
    + `<path d="M44 76 C42 56 44 34 46 14 Q50 8 54 14 C56 34 58 56 56 76 Z" fill="${WATER}" ${K2}/><path d="M49 70 C48 54 49 34 50 18" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>`
    + puff(36, 20, 7, "#fff") + puff(64, 18, 8, "#fff") + puff(50, 6, 6, "#fff") + puff(30, 32, 5, "#fff") + puff(70, 30, 5, "#fff")
    + `<ellipse cx="50" cy="77" rx="16" ry="4" fill="${WATER}" ${K2}/>`,
  // Volcans du monde.
  fuji: volcano({ snow: true, fill: "#7C8DB5" }) + `<path d="M2 90 Q20 84 36 88" fill="none" stroke="${TREE}" stroke-width="3" stroke-linecap="round"/>`,
  etna: volcano({ rivers: true, glow: true, smoke: true }),
  stromboli: `<path d="M0 74 H100 V100 H0 Z" fill="${SEA}"/>${waves(88, 4, 8, 12)}<path d="M14 76 L42 34 Q50 30 58 34 L86 76 Z" fill="${ROCK}" ${K}/>`
    + `<path d="M42 34 Q50 30 58 34 Q50 37.5 42 34 Z" fill="${LAVA}" ${K2}/>` + star4(40, 20, 6) + star4(60, 16, 7, LAVA) + star4(50, 8, 5) + star4(32, 28, 4, LAVA),
  fournaise: volcano({ sea: true, rivers: true, glow: true }) + `<g transform="translate(84 70)"><path d="M0 14 C0 6 1 -2 3 -8" fill="none" stroke="#8D6E4C" stroke-width="2.6" stroke-linecap="round"/><path d="M3 -8 C-4 -12 -9 -8 -10 -4 M3 -8 C10 -12 14 -8 14 -3 M3 -8 C2 -15 6 -18 10 -17" fill="none" stroke="${TREE}" stroke-width="3" stroke-linecap="round"/></g>`,
  puy: `<path d="M2 90 H98" ${K}/><path d="M4 90 C10 66 30 62 38 90 Z" fill="#7FB86B" ${K2}/><path d="M30 90 C36 52 64 52 70 90 Z" fill="#8BCB78" ${K}/>`
    + `<path d="M62 90 C68 64 90 64 96 90 Z" fill="#7FB86B" ${K2}/><path d="M44 62 Q50 59 56 62" fill="none" ${K2}/><path d="M14 72 Q20 69 26 72 M74 72 Q80 69 86 72" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    + tree(48, 86, 0.8) + tree(20, 88, 0.7) + tree(82, 88, 0.7),
  hawai: volcano({ sea: true, rivers: true }) + `<path d="M74 82 Q80 78 88 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` + puff(84, 72, 4, "#fff") + puff(90, 66, 4.5, "#fff"),
  indonesie: `<path d="M0 70 H100 V100 H0 Z" fill="${SEA}"/>${waves(88, 4, 8, 12)}<path d="M2 72 L18 44 Q22 41 26 44 L42 72 Z" fill="${ROCK}" ${K2}/><path d="M34 72 L54 34 Q60 30 66 34 L86 72 Z" fill="${ROCK}" ${K}/>`
    + `<path d="M74 72 L86 52 Q89 50 92 52 L100 66 V72 Z" fill="${ROCK}" ${K2}/>` + puff(22, 34, 4) + puff(26, 26, 3.4) + puff(60, 24, 5) + puff(54, 14, 4.4) + puff(62, 6, 3.4) + puff(89, 42, 3.4)
    + `<path d="M18 44 Q22 41 26 44 Q22 46 18 44 Z M54 34 Q60 30 66 34 Q60 37 54 34 Z" fill="${LAVA}"/>`,
  santorin: `<rect x="2" y="2" width="96" height="96" rx="14" fill="${SEA}"/>${waves(20, 10, 6, 13)}${waves(84, 14, 5, 13)}`
    + `<path d="M64 14 C84 22 92 46 84 66 C76 84 54 90 36 82 C46 80 56 74 62 66 C70 54 72 36 64 14 Z" fill="#E9D9B4" ${K}/>`
    + `<circle cx="42" cy="48" r="7" fill="#C9B79A" ${K2}/>` + [[70, 40], [74, 52], [64, 72], [72, 64]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#fff" ${K2}/>`).join("")
    + `<path d="M72 52 m-3 -3 q3 -4 6 0" fill="#3D8BEA"/>`,
  andes: `<path d="M2 90 H98" ${K}/><path d="M0 90 L16 52 L28 66 L44 30 L56 54 L66 40 L82 62 L92 50 L100 64 V90 Z" fill="#9C8F84" ${K}/>`
    + `<path d="M38 44 L44 30 L50 42 Q47 40 44 43 Q41 40 38 44 Z M12 62 L16 52 L20 60 Z M62 46 L66 40 L70 46 Z" fill="#fff" ${K2}/>` + puff(44, 22, 4.4) + puff(48, 13, 4) + puff(44, 5, 3),
  cameroun: volcano({ fill: "#8E7A5E", glow: true, smoke: true }) + tree(18, 90, 1.1) + tree(28, 90, 0.9) + tree(74, 90, 0.9) + tree(84, 90, 1.1),
  // Gommettes.
  sticker_volcan: volcano({ fountain: true, face: "eveil" }),
};

export const vartSVG = (id: string) => `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">${VART[id] ?? ""}</svg>`;

// Gommettes : le volcan rigolo, le badge de volcanologue (la combinaison), ou le mont Fuji.
export const volcanStickerSVG = (ref?: string) => {
  const inner = VART[ref === "badge" ? "combinaison" : ref === "monde" ? "fuji" : "sticker_volcan"];
  const bg = ref === "badge" ? "#E6E8EE" : ref === "monde" ? "#D7EFF8" : "#FFE6D6";
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="${bg}"/><g transform="translate(12 12) scale(0.46)">${inner}</g></svg>`;
};
