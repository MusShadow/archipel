// Dessins du « grand tri » : les poubelles (bac jaune, bleu, vert, blanc, marron, gris, composteur) et les déchets de
// Basile. Même style que la goutte et le volcan : trait encre, couleurs douces, carré de 100 × 100.
import { calqueSVG, image } from "../design/dessins";
const INK = "#273043";
const K = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const K2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;

// ---------- Les poubelles ----------
// teinte : le nom de la couleur, pour retrouver la poubelle dessinée par l'atelier (livraison 4, voir tri.ts)
export interface BinLook { body: string; lid: string; symbol: "recyclage" | "verre" | "cuisine" | "papier" | "reste"; teinte?: "jaune" | "bleu" | "vert" | "blanc" | "marron" | "gris" }
const SYMBOL: Record<BinLook["symbol"], string> = {
  recyclage: `<g transform="translate(50 58)" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M-9 -4 L-3 -14 Q0 -18 3 -14 L7 -8"/><path d="M4 -10 L7 -8 L9 -12"/><path d="M11 0 L5 10 Q3 13 -1 13 L-8 13"/><path d="M-5 10 L-8 13 L-5 16"/><path d="M-12 7 L-15 1 Q-16 -2 -13 -4 L-9 -4"/><path d="M-12 -7 L-9 -4 L-13 -2"/></g>`,
  verre: `<g transform="translate(50 58)"><path d="M-4 -16 H4 V-10 Q9 -6 9 2 V14 Q9 17 6 17 H-6 Q-9 17 -9 14 V2 Q-9 -6 -4 -10 Z" fill="#fff" ${K2}/></g>`,
  cuisine: `<g transform="translate(50 58)"><path d="M-12 12 Q-14 -10 13 -14 Q14 10 -12 12 Z" fill="#fff" ${K2}/><path d="M-12 12 Q-2 0 8 -8" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`,
  papier: `<g transform="translate(50 58)"><path d="M-10 -15 H5 L11 -9 V15 H-10 Z" fill="#fff" ${K2}/><path d="M-5 -6 H6 M-5 0 H6 M-5 6 H3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`,
  reste: `<g transform="translate(50 58)"><path d="M-10 -8 Q-12 14 0 15 Q12 14 10 -8 Z" fill="#fff" ${K2}/><path d="M-6 -8 Q-4 -15 0 -12 Q4 -15 6 -8" fill="#fff" ${K2}/></g>`,
};
export const binSVG = (b: BinLook) => `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">`
  + `<path d="M15 30 H85 L79 88 Q78.4 92 74 92 H26 Q21.6 92 21 88 Z" fill="${b.body}" ${K}/>`
  + `<path d="M21 40 H79 M23 76 H77" stroke="${INK}" stroke-width="2" opacity=".25"/>`
  + `<rect x="34" y="42" width="32" height="32" rx="9" fill="#fff" opacity=".9"/>${SYMBOL[b.symbol]}`
  + `<circle cx="27" cy="93" r="5" fill="${INK}"/><circle cx="73" cy="93" r="5" fill="${INK}"/>`
  + `<g class="lid"><path d="M12 30 L12 25 Q12 21 16 21 H84 Q88 21 88 25 L88 30 Z" fill="${b.lid}" ${K}/><rect x="40" y="15" width="20" height="7" rx="3.5" fill="${b.lid}" ${K2}/></g></svg>`;

// Le composteur : une caisse en planches, avec des feuilles.
export const composteurSVG = () => `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">`
  + `<rect x="14" y="32" width="72" height="58" rx="3" fill="#C8955F" ${K}/>`
  + `<path d="M14 46 H86 M14 61 H86 M14 76 H86" stroke="${INK}" stroke-width="2.4"/><path d="M30 32 V90 M70 32 V90" stroke="#9B6B43" stroke-width="3"/>`
  + `<path d="M24 32 Q30 22 38 30 Q44 20 52 30 Q60 22 66 31" fill="#8BCB78" ${K2}/>`
  + `<g class="lid"><path d="M10 32 L14 24 H86 L90 32 Z" fill="#A87A4C" ${K}/></g>`
  + `<rect x="36" y="50" width="28" height="24" rx="7" fill="#fff" opacity=".9"/>${SYMBOL.cuisine.replace('translate(50 58)', 'translate(50 62) scale(.75)')}</svg>`;

// ---------- Les déchets ----------
const label = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" ${K2}/>`;
export const TART: Record<string, string> = {
  // Emballages.
  bouteille: `<path d="M44 8 H56 V16 Q66 22 66 34 V86 Q66 92 60 92 H40 Q34 92 34 86 V34 Q34 22 44 16 Z" fill="#CFEFFA" ${K}/><rect x="42" y="4" width="16" height="9" rx="2" fill="#3D8BEA" ${K2}/>`
    + label(34, 46, 32, 18, "#3D8BEA") + `<path d="M40 28 Q38 40 40 52" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M34 74 Q50 70 66 74" fill="none" stroke="#9BD3EA" stroke-width="2"/>`,
  canette: `<path d="M32 18 Q32 12 50 12 Q68 12 68 18 V84 Q68 90 50 90 Q32 90 32 84 Z" fill="#E85D5D" ${K}/><ellipse cx="50" cy="16" rx="18" ry="5" fill="#D7DCE4" ${K2}/>`
    + `<path d="M46 15 Q50 12 54 15" fill="none" stroke="${INK}" stroke-width="2"/><path d="M32 30 Q50 36 68 30 M32 76 Q50 82 68 76" fill="none" stroke="#fff" stroke-width="3"/><circle cx="50" cy="54" r="9" fill="#fff" opacity=".9"/><path d="M38 40 V70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
  carton: `<path d="M26 14 H70 L76 20 V92 H32 L26 86 Z" fill="#E6B566" ${K}/><path d="M70 14 V86 L76 92 M70 86 H26" fill="none" ${K2}/><rect x="32" y="22" width="32" height="12" rx="3" fill="#E85D9A" ${K2}/>`
    + `<path d="M34 60 Q48 76 62 60 Z" fill="#fff" ${K2}/><circle cx="42" cy="56" r="3" fill="#E6A23C" ${K2}/><circle cx="50" cy="54" r="3" fill="#E6A23C" ${K2}/><circle cx="57" cy="57" r="3" fill="#E6A23C" ${K2}/>`,
  brique: `<path d="M30 30 L38 12 H62 L70 30 V90 H30 Z" fill="#fff" ${K}/><path d="M38 12 L46 30 H30 M46 30 H70 M46 30 V90" fill="none" ${K2}/><path d="M30 52 H70 V66 H30 Z" fill="#3D8BEA"/><path d="M30 52 H70 M30 66 H70" ${K2}/>`
    + `<path d="M54 38 C54 38 50 43 50 46 A4 4 0 0 0 58 46 C58 43 54 38 54 38 Z" fill="#8FD3F0" ${K2}/>`,
  conserve: `<path d="M28 22 Q28 16 50 16 Q72 16 72 22 V82 Q72 88 50 88 Q28 88 28 82 Z" fill="#C9CED8" ${K}/><ellipse cx="50" cy="21" rx="22" ry="5.5" fill="#E6E8EE" ${K2}/>`
    + `<path d="M28 36 H72 V70 H28 Z" fill="#34B37A"/><path d="M28 36 H72 M28 70 H72" ${K2}/><circle cx="50" cy="53" r="8" fill="#FFC145" ${K2}/><path d="M28 78 Q50 82 72 78" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".5"/>`,
  yaourt: `<path d="M28 30 H72 L66 88 Q65 92 61 92 H39 Q35 92 34 88 Z" fill="#fff" ${K}/><ellipse cx="50" cy="29" rx="24" ry="6" fill="#D7DCE4" ${K}/>`
    + `<path d="M40 58 C40 50 60 50 60 58 C60 68 50 72 50 72 C50 72 40 68 40 58 Z" fill="#E85D9A" ${K2}/><path d="M46 50 L50 46 L54 50" fill="none" stroke="#34B37A" stroke-width="2.6" stroke-linecap="round"/>`,
  film: `<path d="M18 40 C24 22 44 26 50 18 C58 30 78 22 84 40 C90 56 76 60 80 74 C68 86 52 76 44 86 C34 78 18 84 16 68 C12 58 22 52 18 40 Z" fill="#DDF1FA" opacity=".9" ${K}/>`
    + `<path d="M30 42 C38 46 46 40 54 46 M36 62 C46 58 56 66 66 60 M58 32 C64 36 70 34 74 40" fill="none" stroke="#9BD3EA" stroke-width="2.6" stroke-linecap="round"/>`,
  pizza: `<path d="M12 40 L50 26 L88 40 L50 54 Z" fill="#E6B566" ${K}/><path d="M12 40 V62 L50 76 V54 M88 40 V62 L50 76" fill="#D9A04F" ${K}/>`
    + `<path d="M30 40 L50 33 L70 40 L50 47 Z" fill="#FFC145" ${K2}/><circle cx="44" cy="40" r="2.6" fill="#E85D5D"/><circle cx="54" cy="38" r="2.6" fill="#E85D5D"/><circle cx="52" cy="43" r="2.2" fill="#34B37A"/>`,
  couvercle: `<ellipse cx="50" cy="56" rx="34" ry="14" fill="#9AA3B5" ${K}/><path d="M16 56 V46 Q16 34 50 34 Q84 34 84 46 V56" fill="#C9CED8" ${K}/><ellipse cx="50" cy="44" rx="30" ry="10" fill="#E6E8EE" ${K2}/>`
    + `<path d="M22 54 V60 M30 57 V64 M40 59 V66 M50 60 V67 M60 59 V66 M70 57 V64 M78 54 V60" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    + `<ellipse cx="50" cy="43" rx="11" ry="3.6" fill="#C9CED8" ${K2}/><path d="M28 40 Q50 32 72 40" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
  // Le reste.
  mouchoir: `<path d="M22 46 C18 30 34 22 44 28 C50 18 70 22 70 34 C84 34 86 52 76 58 C82 70 66 82 56 74 C48 84 28 80 30 66 C16 66 14 52 22 46 Z" fill="#fff" ${K}/>`
    + `<path d="M36 40 C42 46 50 42 54 48 M44 60 C50 56 58 60 62 56 M60 36 C64 40 66 38 70 42" fill="none" stroke="#C9CED8" stroke-width="2.6" stroke-linecap="round"/>`,
  couche: `<path d="M14 30 H86 L82 44 Q66 50 62 66 Q58 80 50 80 Q42 80 38 66 Q34 50 18 44 Z" fill="#fff" ${K}/><path d="M14 30 H86 V38 H14 Z" fill="#8FD3F0" ${K2}/>`
    + `<rect x="14" y="30" width="12" height="12" rx="3" fill="#FFC145" ${K2}/><rect x="74" y="30" width="12" height="12" rx="3" fill="#FFC145" ${K2}/><circle cx="50" cy="56" r="4" fill="#FFB0C0"/>`,
  brosse: `<path d="M18 74 L70 30" stroke="#3D8BEA" stroke-width="9" stroke-linecap="round"/><path d="M18 74 L70 30" stroke="${INK}" stroke-width="1.6" opacity=".3"/>`
    + `<rect x="62" y="16" width="22" height="14" rx="3" transform="rotate(-40 73 23)" fill="#E6E8EE" ${K2}/>`
    + `<path d="M64 14 L58 4 M70 10 L68 0 M76 8 L80 -1 M82 10 L90 4 M86 16 L95 14" stroke="#C9CED8" stroke-width="3" stroke-linecap="round"/>`,
  jouet: `<path d="M14 62 Q14 50 26 48 L34 38 Q38 32 46 32 H62 Q70 32 74 40 L80 48 Q88 50 88 60 V66 H14 Z" fill="#E85D5D" ${K}/><path d="M38 46 L44 38 H54 V48 Z M58 38 H64 L70 48 H58 Z" fill="#CFEFFA" ${K2}/>`
    + `<circle cx="30" cy="68" r="8" fill="${INK}"/><circle cx="30" cy="68" r="3" fill="#C9CED8"/><circle cx="80" cy="86" r="8" fill="${INK}"/><circle cx="80" cy="86" r="3" fill="#C9CED8"/>`
    + `<path d="M66 64 L70 70 L66 74" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M90 76 l4 -3 M93 84 l5 0" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  verre_casse: `<path d="M30 14 H70 L64 84 Q63 88 59 88 H41 Q37 88 36 84 Z" fill="#E6F4F8" ${K}/><path d="M48 14 L44 34 L54 46 L48 62" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M36 26 L40 70" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M74 78 L82 72 L84 82 Z M18 84 L26 80 L24 90 Z M80 92 L88 90 L86 96 Z" fill="#E6F4F8" ${K2}/>`,
  assiette: `<path d="M50 20 A32 32 0 0 0 46 84 L52 66 L44 56 L54 44 L48 30 Z" fill="#fff" ${K}/><path d="M58 22 A32 32 0 0 1 56 84 L62 66 L54 56 L64 44 L56 30 Z" fill="#fff" ${K}/>`
    + `<path d="M50 30 A22 22 0 0 0 46 74 M60 31 A22 22 0 0 1 58 73" fill="none" stroke="#8FD3F0" stroke-width="2.4"/>`,
  // Le verre.
  bouteille_verre: `<path d="M44 6 H56 V26 Q68 34 68 48 V86 Q68 92 62 92 H38 Q32 92 32 86 V48 Q32 34 44 26 Z" fill="#5FB57A" ${K}/><rect x="43" y="4" width="14" height="6" rx="2" fill="#C9A227" ${K2}/>`
    + label(32, 54, 36, 20, "#FFF2D6") + `<path d="M40 38 Q37 46 38 52" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>`,
  confiture: `<path d="M28 34 Q26 30 30 30 H70 Q74 30 72 34 V84 Q72 90 66 90 H34 Q28 90 28 84 Z" fill="#E6F4F8" ${K}/><path d="M31 44 H69 V84 Q69 87 66 87 H34 Q31 87 31 84 Z" fill="#E85D5D"/>`
    + `<path d="M26 22 H74 V32 H26 Z" fill="#fff" ${K}/><path d="M26 22 H74 V32 H26 Z" fill="none" stroke="#E85D5D" stroke-width="2" stroke-dasharray="4 4"/>` + label(38, 54, 24, 14, "#FFF2D6"),
  bocal: `<path d="M26 30 Q24 26 28 26 H72 Q76 26 74 30 V84 Q74 90 68 90 H32 Q26 90 26 84 Z" fill="#E6F4F8" ${K}/><rect x="30" y="16" width="40" height="10" rx="3" fill="#C9CED8" ${K2}/>`
    + [[38, 52, -20], [52, 48, 15], [62, 62, -10], [44, 70, 25], [56, 76, -5]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="11" transform="rotate(${r} ${x} ${y})" fill="#7FB86B" ${K2}/>`).join(""),
  // Les restes de cuisine.
  epluchures: `<path d="M16 60 C24 40 40 50 34 64 C30 74 44 80 50 70" fill="none" stroke="#FF8C42" stroke-width="7" stroke-linecap="round"/><path d="M16 60 C24 40 40 50 34 64 C30 74 44 80 50 70" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="M52 36 C64 24 84 34 76 50 C70 62 84 70 80 80" fill="none" stroke="#C9A06A" stroke-width="7" stroke-linecap="round"/><path d="M52 36 C64 24 84 34 76 50 C70 62 84 70 80 80" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".4"/>`
    + `<path d="M30 30 C36 22 46 24 48 30" fill="none" stroke="#34B37A" stroke-width="4" stroke-linecap="round"/>`,
  trognon: `<path d="M36 18 Q50 26 64 18 Q60 34 56 42 Q52 50 56 60 Q60 72 64 84 Q50 78 36 84 Q40 72 44 60 Q48 50 44 42 Q40 34 36 18 Z" fill="#FFF2D6" ${K}/>`
    + `<path d="M36 18 Q50 26 64 18 Q50 12 36 18 Z M36 84 Q50 78 64 84 Q50 92 36 84 Z" fill="#E85D5D" ${K2}/><path d="M50 16 L52 6" ${K2}/><path d="M52 8 Q60 4 62 10 Q56 12 52 8 Z" fill="#34B37A" ${K2}/>`
    + `<ellipse cx="48" cy="50" rx="2.4" ry="4" fill="#5B3A29"/><ellipse cx="54" cy="56" rx="2.4" ry="4" fill="#5B3A29"/>`,
  banane: `<path d="M50 30 C46 52 30 66 16 72 C30 72 44 64 50 52 C56 64 70 72 84 72 C70 66 54 52 50 30 Z" fill="#FFD23F" ${K}/><path d="M50 52 C50 64 48 78 44 88 C52 86 56 72 54 52" fill="#F2C12E" ${K}/>`
    + `<path d="M47 24 H53 V32 H47 Z" fill="#8D6E4C" ${K2}/><path d="M30 68 l3 -2 M70 68 l-3 -2" stroke="#8D6E4C" stroke-width="2" stroke-linecap="round"/>`,
  coquilles: `<path d="M14 66 Q16 40 36 40 Q54 40 56 66 L50 60 L44 68 L38 60 L32 68 L26 60 L20 68 Z" fill="#FFF2D6" ${K}/>`
    + `<path d="M48 76 Q52 52 70 52 Q88 52 90 76 L84 70 L78 78 L72 70 L66 78 L60 70 L54 78 Z" fill="#FFF2D6" ${K}/><path d="M24 50 Q30 46 36 48" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
  // Les papiers.
  journal: `<path d="M16 22 H76 V84 Q76 88 72 88 H22 Q16 88 16 82 Z" fill="#F4F1EA" ${K}/><path d="M76 34 H84 V82 Q84 88 78 88 H72" fill="#E6E2D8" ${K}/>`
    + `<rect x="22" y="28" width="48" height="8" fill="${INK}"/><rect x="22" y="42" width="22" height="18" fill="#9AA3B5"/><path d="M48 44 H70 M48 50 H70 M48 56 H66 M22 66 H70 M22 72 H70 M22 78 H58" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
  prospectus: `<rect x="20" y="14" width="60" height="76" rx="3" fill="#fff" ${K}/><rect x="20" y="14" width="60" height="22" rx="3" fill="#E85D9A" ${K2}/>`
    + `<circle cx="64" cy="54" r="12" fill="#FFC145" ${K2}/><path d="M59 59 L69 49 M59 50 h0.1 M69 58 h0.1" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M28 50 H48 M28 58 H46 M28 70 H72 M28 78 H62" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
  cahier: `<rect x="22" y="12" width="58" height="78" rx="4" fill="#3D8BEA" ${K}/><rect x="40" y="30" width="32" height="16" rx="3" fill="#fff" ${K2}/>`
    + [20, 32, 44, 56, 68, 80].map((y) => `<circle cx="22" cy="${y}" r="3.4" fill="#fff" ${K2}/>`).join("") + `<path d="M44 36 H68 M44 41 H62" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  enveloppe: `<rect x="12" y="26" width="76" height="52" rx="4" fill="#FFF2D6" ${K}/><path d="M12 30 L50 58 L88 30" fill="none" ${K}/>`
    + `<rect x="66" y="32" width="14" height="16" rx="2" fill="#E85D9A" ${K2}/><path d="M18 72 L40 54 M82 72 L60 54" stroke="${INK}" stroke-width="2" opacity=".4"/>`,
};

export const tartSVG = (id: string) => `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">${TART[id] ?? ""}</svg>`;

// Gommettes : le bac jaune, ou la médaille du grand trieur (trois bacs). Les poubelles sont celles du jeu, dessinées
// (atelier : scripts/illustration/jeux_decouvertes.py) : le corps et son couvercle, dans leur cadre de 120 × 120 ; le
// tracé reste en secours si un dessin manque.
export const triStickerSVG = (ref?: string) => {
  const dessinee = (teinte: string, symbole: string, cx: number, bas: number, k: number) =>
    image(`activites/poubelle-${teinte}-${symbole}`) && image(`activites/couvercle-${teinte}`)
      ? calqueSVG(`activites/poubelle-${teinte}-${symbole}`, cx - 63.25 * k, bas - 120 * k, k) + calqueSVG(`activites/couvercle-${teinte}`, cx - 63.25 * k, bas - 120 * k, k)
      : null;
  const one = (x: number, b: BinLook, sc: number) => `<g transform="translate(${x} ${18 + (1 - sc) * 30}) scale(${sc * 0.4})">${binSVG(b).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
  const inner = ref === "expert"
    ? (dessinee("vert", "verre", 22, 54, 0.3) ?? one(9, { body: "#34B37A", lid: "#25915F", symbol: "verre" }, 0.8))
      + (dessinee("marron", "cuisine", 48, 54, 0.3) ?? one(39, { body: "#9B6B43", lid: "#7A5232", symbol: "cuisine" }, 0.8))
      + (dessinee("jaune", "recyclage", 35, 60, 0.38) ?? one(24, { body: "#FFD23F", lid: "#E8B400", symbol: "recyclage" }, 1))
    : dessinee("jaune", "recyclage", 35, 56, 0.4) ?? one(15, { body: "#FFD23F", lid: "#E8B400", symbol: "recyclage" }, 1.05);
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#FFF4CC"/>${inner}</svg>`;
};
