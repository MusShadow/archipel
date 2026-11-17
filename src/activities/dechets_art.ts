// Dessins du « voyage des déchets » : le camion poubelle et les éboueurs, les endroits où vont les déchets (centre de
// tri, usine du verre, compost, usine qui chauffe, déchetterie…), ce qu'ils deviennent, et les gestes pour en faire
// moins. Même style que le grand tri : trait encre, couleurs douces, carré de 100 × 100.
import { TART, binSVG } from "./tri_art";

const INK = "#273043";
const K = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const K2 = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const inner = (svg: string) => svg.replace(/^<svg[^>]*>|<\/svg>$/g, "");
const sparkle = (x: number, y: number, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7 Z" fill="#FFC145" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
const ground = (y = 90) => `<path d="M4 ${y} H96" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>`;

// ---------- Le camion poubelle (de profil, l'arrière à gauche) ----------
const TRUCK = `<path d="M10 34 Q10 28 16 28 H64 V74 H10 Z" fill="#34B37A" ${K}/><path d="M11 60 H63" stroke="#fff" stroke-width="4"/>`
  + `<circle cx="36" cy="44" r="9" fill="#fff"/><path d="M31 49 Q30 39 41 38 Q42 48 31 49 Z M31 49 L38 42" fill="#8BCB78" ${K2}/>`
  + `<path d="M10 38 H5 Q2 38 2 41 V70 Q2 74 6 74 H10" fill="#5B6475" ${K2}/><path d="M2 52 H10" stroke="#9AA3B5" stroke-width="2"/>`
  + `<path d="M64 40 H82 Q86 40 88 44 L95 58 V74 H64 Z" fill="#F4F1EA" ${K}/><path d="M70 45 H81 Q83 45 84 47 L89 57 H70 Z" fill="#CFEFFA" ${K2}/>`
  + `<rect x="72" y="34" width="8" height="6" rx="2" fill="#FF8C42" ${K2}/><path d="M3 76 H97" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  + `<circle cx="24" cy="78" r="9" fill="${INK}"/><circle cx="24" cy="78" r="3.5" fill="#C9CED8"/><circle cx="78" cy="78" r="9" fill="${INK}"/><circle cx="78" cy="78" r="3.5" fill="#C9CED8"/>`;

// ---------- Les personnages (même gabarit, tenues différentes) ----------
interface Outfit { skin: string; body: string; stripe?: string; legs: string; hat: string; extra?: string }
const person = (o: Outfit) => `<path d="M40 72 V91 H48 V72 Z M52 72 V91 H60 V72 Z" fill="${o.legs}" ${K2}/><path d="M37 93 H49 M51 93 H63" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
  + `<path d="M28 58 Q22 66 24 76" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M28 58 Q22 66 24 76" fill="none" stroke="${o.body}" stroke-width="6" stroke-linecap="round"/>`
  + `<path d="M72 58 Q78 66 76 76" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M72 58 Q78 66 76 76" fill="none" stroke="${o.body}" stroke-width="6" stroke-linecap="round"/>`
  + `<path d="M30 76 Q29 46 50 46 Q71 46 70 76 Z" fill="${o.body}" ${K}/>`
  + (o.stripe ? `<path d="M31 63 H69 M30.5 70 H69.5" stroke="${o.stripe}" stroke-width="3.4"/>` : "")
  + `<circle cx="24" cy="78" r="4.5" fill="${o.skin}" ${K2}/><circle cx="76" cy="78" r="4.5" fill="${o.skin}" ${K2}/>`
  + `<circle cx="50" cy="32" r="13" fill="${o.skin}" ${K}/><circle cx="45.5" cy="31.5" r="1.7" fill="${INK}"/><circle cx="54.5" cy="31.5" r="1.7" fill="${INK}"/>`
  + `<path d="M45 37 Q50 41 55 37" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` + o.hat + (o.extra ?? "");
const EBOUEUR = person({ skin: "#D9A273", body: "#FF8C42", stripe: "#E6E8EE", legs: "#3D4B66",
  hat: `<path d="M37 27 Q37 15 50 15 Q63 15 63 27 Z" fill="#FF8C42" ${K2}/><path d="M60 26 H69" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  extra: `<circle cx="24" cy="78" r="5" fill="#5B6475" ${K2}/><circle cx="76" cy="78" r="5" fill="#5B6475" ${K2}/>` });
const POMPIER = person({ skin: "#F2C9A0", body: "#2F3B5C", stripe: "#FFD23F", legs: "#2F3B5C",
  hat: `<path d="M35 31 Q34 13 50 13 Q66 13 65 31 Z" fill="#E6E8EE" ${K2}/><path d="M50 13 V31" stroke="${INK}" stroke-width="2"/><path d="M36 28 Q50 24 64 28" fill="none" stroke="#FFC145" stroke-width="3"/>` });
const BOULANGER = person({ skin: "#F2C9A0", body: "#F4F1EA", legs: "#9AA3B5",
  hat: `<path d="M39 24 Q33 13 41 11 Q44 4 51 8 Q58 4 61 11 Q68 13 62 24 Z" fill="#fff" ${K2}/>`,
  extra: `<path d="M38 52 H62 V76 H38 Z" fill="#fff" ${K2}/><path d="M64 46 L84 86" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M64 46 L84 86" stroke="#D9A04F" stroke-width="5.6" stroke-linecap="round"/><path d="M69 54 l4 -1 M73 62 l4 -1 M77 70 l4 -1" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` });
const FACTEUR = person({ skin: "#B97A50", body: "#3D8BEA", stripe: "#FFD23F", legs: "#2F3B5C",
  hat: `<path d="M37 27 Q37 15 50 15 Q63 15 63 27 Z" fill="#3D8BEA" ${K2}/><path d="M37 25 H63" stroke="#FFD23F" stroke-width="3"/><path d="M60 26 H69" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  extra: `<path d="M34 50 L66 72" stroke="#8D6E4C" stroke-width="3"/><rect x="58" y="66" width="22" height="18" rx="3" fill="#FFD23F" ${K2}/><path d="M62 70 H76 V80 H62 Z M62 70 L69 76 L76 70" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` });

// ---------- Les endroits ----------
const RECYCLE = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M-9 -4 L-3 -14 Q0 -18 3 -14 L7 -8"/><path d="M4 -10 L7 -8 L9 -12"/><path d="M11 0 L5 10 Q3 13 -1 13 L-8 13"/><path d="M-5 10 L-8 13 L-5 16"/><path d="M-12 7 L-15 1 Q-16 -2 -13 -4 L-9 -4"/><path d="M-12 -7 L-9 -4 L-13 -2"/></g>`;
const smoke = (x: number, y: number) => `<g fill="#fff" stroke="${INK}" stroke-width="2" opacity=".95"><circle cx="${x}" cy="${y}" r="5"/><circle cx="${x + 6}" cy="${y - 8}" r="6"/><circle cx="${x + 1}" cy="${y - 17}" r="7"/></g>`;
const HOUSE = (x: number, y: number) => `<g transform="translate(${x} ${y})"><path d="M0 36 V14 L14 2 L28 14 V36 Z" fill="#FFF2D6" ${K}/><path d="M-4 16 L14 0 L32 16" fill="none" stroke="#E85D5D" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="18" width="10" height="9" rx="1.5" fill="#FFC145" ${K2}/></g>`;
const HEAT = (x: number, y: number) => `<path transform="translate(${x} ${y})" d="M0 0 Q-3 -4 0 -8 Q3 -12 0 -16 M8 0 Q5 -4 8 -8 Q11 -12 8 -16 M16 0 Q13 -4 16 -8 Q19 -12 16 -16" fill="none" stroke="#FF7F50" stroke-width="2.6" stroke-linecap="round"/>`;
const BATTERY = (x: number, y: number, r: number, c: string) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-8" y="-20" width="16" height="40" rx="3" fill="${c}" ${K2}/><rect x="-8" y="-20" width="16" height="12" rx="3" fill="#C98A3A" ${K2}/><rect x="-3.5" y="-25" width="7" height="5" rx="1" fill="#C9CED8" ${K2}/><path d="M-3 6 H3 M0 3 V9" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
const SHIRT = (x: number, y: number, s: number, c: string) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-12 -16 L-4 -19 Q0 -14 4 -19 L12 -16 L20 -6 L13 -1 L10 -4 V18 H-10 V-4 L-13 -1 L-20 -6 Z" fill="${c}" ${K2}/>`;
const CRATE = (body: string, symbol: string) => `<path d="M12 36 H88 L83 90 H17 Z" fill="${body}" ${K}/><path d="M15 54 H85 M16 72 H84" stroke="${INK}" stroke-width="2" opacity=".35"/>`
  + `<rect x="33" y="44" width="34" height="34" rx="9" fill="#fff" opacity=".95"/><g transform="translate(50 61) scale(.32) translate(-50 -50)">${symbol}</g>`;
const MAGNET = `<path d="M30 20 V54 Q30 80 50 80 Q70 80 70 54 V20 H57 V54 Q57 66 50 66 Q43 66 43 54 V20 Z" fill="#E85D5D" ${K}/><path d="M30 20 H43 V31 H30 Z M57 20 H70 V31 H57 Z" fill="#E6E8EE" ${K2}/>`;

export const DART: Record<string, string> = {
  camion: TRUCK,
  eboueur: EBOUEUR, pompier: POMPIER, boulanger: BOULANGER, facteur: FACTEUR,
  centre_tri: `<path d="M6 46 Q50 18 94 46 V90 H6 Z" fill="#9AC7E8" ${K}/><path d="M28 90 V62 H72 V90" fill="#5B6475" ${K2}/>`
    + `<rect x="30" y="74" width="40" height="5" fill="#C9CED8" stroke="${INK}" stroke-width="1.6"/><rect x="34" y="68" width="7" height="6" fill="#FFD23F"/><rect x="47" y="69" width="6" height="5" fill="#E85D5D"/><rect x="59" y="67" width="8" height="7" fill="#9AC7E8" stroke="#fff" stroke-width="1"/>`
    + `<circle cx="50" cy="44" r="11" fill="#fff" ${K2}/>${RECYCLE(50, 44, 0.62)}` + ground(),
  verrerie: `<path d="M8 90 V50 L24 40 V50 L40 40 V50 L56 40 V90 Z" fill="#E6B566" ${K}/><rect x="70" y="16" width="11" height="40" fill="#C96A4A" ${K2}/>${smoke(76, 12)}`
    + `<path d="M56 90 V52 H92 V90 Z" fill="#F4E3C6" ${K}/><path d="M64 90 V74 Q74 62 84 74 V90 Z" fill="#FF8C42" ${K2}/><path d="M68 90 V78 Q74 70 80 78 V90" fill="#FFD23F"/>`
    + `<g transform="translate(32 72) scale(.34) translate(-50 -50)">${TART.bouteille_verre}</g>` + ground(),
  compost: `<path d="M8 88 Q20 54 50 52 Q80 54 92 88 Z" fill="#8B5E3C" ${K}/>`
    + `<g fill="#B5835A"><circle cx="30" cy="76" r="3"/><circle cx="46" cy="66" r="2.5"/><circle cx="62" cy="78" r="3"/><circle cx="72" cy="68" r="2.4"/><circle cx="40" cy="82" r="2.2"/></g>`
    + `<path d="M24 74 q4 -5 9 -2 M58 64 q5 -3 8 1" fill="none" stroke="#FFD23F" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="M50 52 V36" stroke="#34B37A" stroke-width="3" stroke-linecap="round"/><path d="M50 42 Q40 34 36 40 Q42 46 50 42 Z M50 38 Q58 28 64 34 Q58 42 50 38 Z" fill="#8BCB78" ${K2}/>`
    + `<path d="M22 46 q-3 -5 0 -10 M80 46 q3 -5 0 -10" fill="none" stroke="#C9CED8" stroke-width="2.4" stroke-linecap="round"/>` + ground(),
  usine_chaleur: `<rect x="6" y="48" width="46" height="42" fill="#C9CED8" ${K}/><rect x="34" y="14" width="11" height="36" fill="#9AA3B5" ${K2}/><path d="M34 20 H45 M34 26 H45" stroke="#E85D5D" stroke-width="3"/>${smoke(39, 10)}`
    + `<path d="M12 66 H24 V78 H12 Z" fill="#FF8C42" ${K2}/><path d="M15 76 Q18 69 21 76" fill="#FFD23F"/><path d="M52 76 H66" stroke="#E85D5D" stroke-width="5" stroke-linecap="round"/>`
    + HOUSE(64, 54) + HEAT(70, 50) + ground(),
  maison_chaude: `<g transform="translate(26 30) scale(1.7)">${HOUSE(0, 0)}</g>` + HEAT(34, 26) + HEAT(52, 26).replace('stroke="#FF7F50"', 'stroke="#E85D5D"') + ground(),
  magasin: `<rect x="10" y="40" width="80" height="50" fill="#FFF2D6" ${K}/><path d="M6 40 L12 24 H88 L94 40 Z" fill="#fff" ${K}/>`
    + `<path d="M22 24 L18 40 M36 24 L34 40 M50 24 V40 M64 24 L66 40 M78 24 L82 40" stroke="#34B37A" stroke-width="7"/><path d="M6 40 L12 24 H88 L94 40 Z" fill="none" ${K}/>`
    + `<rect x="18" y="56" width="22" height="34" fill="#9AC7E8" ${K2}/><rect x="50" y="52" width="32" height="26" rx="4" fill="#34B37A" ${K2}/>`
    + BATTERY(66, 66, 0, "#5B6475").replace("translate(66 66)", "translate(66 66) scale(.5)") + ground(),
  pharmacie: `<rect x="12" y="38" width="76" height="52" fill="#F4F1EA" ${K}/><path d="M8 40 L50 16 L92 40 Z" fill="#9AA3B5" ${K}/>`
    + `<path d="M42 40 H58 V50 H68 V66 H58 V76 H42 V66 H32 V50 H42 Z" fill="#34B37A" ${K2}/><rect x="20" y="66" width="12" height="24" fill="#9AC7E8" ${K2}/><rect x="68" y="66" width="12" height="24" fill="#9AC7E8" ${K2}/>` + ground(),
  borne_textile: `<path d="M24 90 V30 Q24 16 38 16 H62 Q76 16 76 30 V90 Z" fill="#8BCB78" ${K}/><rect x="36" y="28" width="28" height="7" rx="3.5" fill="${INK}"/>`
    + SHIRT(50, 60, 1.05, "#E85D9A") + `<path d="M24 82 H76" stroke="${INK}" stroke-width="2" opacity=".35"/>` + ground(),
  dechetterie: `<path d="M4 90 V56 M96 90 V56 M4 60 H96 M4 72 H96" stroke="#9AA3B5" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M10 90 L14 62 H48 L52 90 Z" fill="#3D8BEA" ${K}/><path d="M54 90 L58 62 H92 L96 90 Z" fill="#FF8C42" ${K}/>`
    + `<path d="M22 62 L26 48 M26 48 L36 48 M36 48 L34 62" fill="none" stroke="#8D6E4C" stroke-width="3.4" stroke-linecap="round"/><path d="M64 62 Q70 44 80 50 Q86 54 82 62" fill="#34B37A" ${K2}/>` + ground(),
  // Ce que deviennent les déchets.
  pull: `<path d="M30 20 L42 15 Q50 24 58 15 L70 20 Q84 26 88 44 L92 80 L80 82 L74 50 V88 H26 V50 L20 82 L8 80 L12 44 Q16 26 30 20 Z" fill="#3D8BEA" ${K}/><path d="M42 15 Q50 26 58 15" fill="none" ${K2}/>`
    + `<path d="M26 80 H74 M9 74 L20 76 M91 74 L80 76" stroke="${INK}" stroke-width="2" opacity=".45"/>`
    + `<g fill="none" stroke="#9AC7E8" stroke-width="2.4" stroke-linecap="round"><path d="M38 40 q3 -3 6 0 q3 3 6 0"/><path d="M48 56 q3 -3 6 0 q3 3 6 0"/><path d="M36 68 q3 -3 6 0 q3 3 6 0"/></g>`,
  ours: `<circle cx="32" cy="22" r="9" fill="#C8955F" ${K2}/><circle cx="68" cy="22" r="9" fill="#C8955F" ${K2}/><ellipse cx="50" cy="70" rx="24" ry="22" fill="#C8955F" ${K}/>`
    + `<ellipse cx="50" cy="72" rx="13" ry="12" fill="#F2D3B0"/><circle cx="50" cy="36" r="20" fill="#C8955F" ${K}/><ellipse cx="50" cy="43" rx="9" ry="7" fill="#F2D3B0" ${K2}/>`
    + `<circle cx="43" cy="32" r="2.2" fill="${INK}"/><circle cx="57" cy="32" r="2.2" fill="${INK}"/><ellipse cx="50" cy="40" rx="3" ry="2.2" fill="${INK}"/>`
    + `<circle cx="27" cy="64" r="7" fill="#C8955F" ${K2}/><circle cx="73" cy="64" r="7" fill="#C8955F" ${K2}/><circle cx="36" cy="90" r="8" fill="#C8955F" ${K2}/><circle cx="64" cy="90" r="8" fill="#C8955F" ${K2}/>`,
  velo: `<circle cx="24" cy="66" r="17" fill="none" ${K}/><circle cx="76" cy="66" r="17" fill="none" ${K}/><circle cx="24" cy="66" r="2.6" fill="${INK}"/><circle cx="76" cy="66" r="2.6" fill="${INK}"/>`
    + `<path d="M24 66 L40 40 H68 L76 66 M40 40 L52 66 L68 40 M52 66 H24" fill="none" stroke="#E85D5D" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M38 32 H48" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M40 40 L38 32" stroke="#E85D5D" stroke-width="4" stroke-linecap="round"/><path d="M68 40 L66 28 L74 26" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  bouteilles_neuves: `<g transform="translate(6 10) scale(.62)">${TART.bouteille_verre}</g><g transform="translate(32 6) scale(.68)">${TART.bouteille_verre.replace(/#5FB57A/g, "#C98A3A")}</g><g transform="translate(58 10) scale(.62)">${TART.bouteille_verre.replace(/#5FB57A/g, "#CFEFFA")}</g>${sparkle(18, 14)}${sparkle(88, 22, 0.8)}`,
  cahier_neuf: `<g transform="translate(6 4) scale(.92)">${TART.cahier}</g>${sparkle(84, 16)}${sparkle(14, 84, 0.8)}`,
  papier_toilette: `<path d="M22 36 V80 Q22 88 44 88 Q66 88 66 80 V36" fill="#fff" ${K}/><ellipse cx="44" cy="36" rx="22" ry="9" fill="#fff" ${K}/><ellipse cx="44" cy="36" rx="7" ry="3" fill="#C9CED8" ${K2}/>`
    + `<path d="M66 44 H84 V86 L80 82 L76 86 L72 82 L68 86 L66 84" fill="#fff" ${K2}/><path d="M70 58 H80 M70 70 H80" stroke="#C9CED8" stroke-width="2" stroke-dasharray="2 3"/>${sparkle(86, 24, 0.8)}`,
  carton_neuf: `<path d="M14 40 L50 28 L86 40 V80 L50 92 L14 80 Z" fill="#E6B566" ${K}/><path d="M14 40 L50 52 L86 40 M50 52 V92" fill="none" ${K2}/><path d="M32 34 L68 46" stroke="#C98A3A" stroke-width="6"/>${sparkle(86, 20)}`,
  legumes: `<path d="M28 34 L40 88 L52 34 Z" fill="#FF8C42" ${K}/><path d="M32 46 h6 M36 58 h7 M38 70 h5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M34 34 Q28 16 36 12 M40 34 Q40 14 44 10 M46 34 Q52 16 58 18" fill="none" stroke="#34B37A" stroke-width="4" stroke-linecap="round"/>`
    + `<circle cx="72" cy="72" r="16" fill="#E85D5D" ${K}/><path d="M66 58 L72 62 L78 58 L74 56 L72 52 L70 56 Z" fill="#34B37A" ${K2}/>` + `<path d="M64 66 q4 -4 8 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
  // Les objets qui ne vont dans aucune poubelle de la maison.
  piles: BATTERY(38, 54, -12, "#5B6475") + BATTERY(64, 56, 10, "#3D8BEA"),
  medicaments: `<rect x="16" y="34" width="34" height="50" rx="5" fill="#fff" ${K}/><rect x="14" y="24" width="38" height="12" rx="3" fill="#E85D5D" ${K2}/><path d="M24 52 H42 M24 62 H42" stroke="#9AA3B5" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="54" y="40" width="34" height="44" rx="5" fill="#E6E8EE" ${K}/>` + [[63, 52], [79, 52], [63, 66], [79, 66]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="#FFC145" ${K2}/>`).join(""),
  vetements: SHIRT(36, 46, 1.25, "#E85D9A") + `<path d="M58 42 H86 V54 L82 90 H74 L72 60 L70 90 H62 L58 54 Z" fill="#3D8BEA" ${K2}/>`,
  chaise_cassee: `<path d="M30 12 V58 H70 V12" fill="none" stroke="#8D6E4C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 26 H70 M30 40 H70" stroke="#8D6E4C" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M24 58 H76" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M24 58 H76" stroke="#C8955F" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M30 62 V88 M70 62 V74" stroke="#8D6E4C" stroke-width="6" stroke-linecap="round"/><path d="M76 84 L90 92" stroke="#8D6E4C" stroke-width="6" stroke-linecap="round"/><path d="M68 76 l4 -2 M72 80 l5 0" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  branches: `<path d="M10 80 L90 40 M30 70 L40 50 M52 59 L70 66 M66 51 L72 34" stroke="#8D6E4C" stroke-width="5" stroke-linecap="round"/>`
    + [[40, 48, -30], [72, 32, 10], [72, 68, 60], [90, 38, -10], [20, 74, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="10" transform="rotate(${r} ${x} ${y})" fill="#8BCB78" ${K2}/>`).join(""),
  peinture: `<path d="M24 34 H76 V82 Q76 90 68 90 H32 Q24 90 24 82 Z" fill="#C9CED8" ${K}/><ellipse cx="50" cy="34" rx="26" ry="7" fill="#3D8BEA" ${K}/>`
    + `<path d="M30 36 Q32 50 30 56 Q28 62 33 62 Q37 62 35 54 Q34 46 38 38" fill="#3D8BEA" ${K2}/><rect x="36" y="52" width="28" height="18" rx="3" fill="#fff" ${K2}/><path d="M40 61 L50 56 L60 61" fill="none" stroke="#E85D5D" stroke-width="2.4"/>`
    + `<path d="M24 46 Q12 30 30 22" fill="none" stroke="${INK}" stroke-width="2.4"/>`,
  // Faire moins de déchets.
  gourde: `<path d="M38 22 H62 V30 Q72 36 72 48 V84 Q72 92 62 92 H38 Q28 92 28 84 V48 Q28 36 38 30 Z" fill="#1FA9B5" ${K}/><rect x="40" y="10" width="20" height="14" rx="4" fill="#5B6475" ${K2}/>`
    + `<path d="M60 14 Q74 10 70 24" fill="none" stroke="${INK}" stroke-width="3"/><path d="M36 50 Q34 64 36 76" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".7" fill="none"/>`
    + `<path d="M46 62 Q50 52 58 54 Q58 64 46 62 Z M46 62 L54 56" fill="#8BCB78" ${K2}/>`,
  sac_tissu: `<path d="M36 34 Q36 14 50 14 Q64 14 64 34" fill="none" stroke="#C8955F" stroke-width="5" stroke-linecap="round"/><path d="M20 34 H80 L76 90 H24 Z" fill="#F2E2C4" ${K}/>`
    + `<path d="M40 62 Q50 46 62 50 Q62 66 40 62 Z M40 62 L56 54" fill="#8BCB78" ${K2}/><path d="M26 40 H74" stroke="#C8955F" stroke-width="2" stroke-dasharray="3 3"/>`,
  sac_plastique: `<path d="M24 26 Q22 12 32 12 Q38 12 38 26 M62 26 Q62 12 68 12 Q78 12 76 26" fill="none" ${K2}/><path d="M22 26 H38 Q50 34 62 26 H78 L82 86 Q66 92 50 88 Q34 92 18 86 Z" fill="#F7F9FC" ${K}/>`
    + `<path d="M32 46 L38 70 M58 44 L54 64 M68 56 L72 76" stroke="#C9CED8" stroke-width="2.4" stroke-linecap="round"/>`,
  reparer: `<g transform="translate(-6 8) scale(.9)">${TART.jouet.replace(/<path d="M66 64 L70 70 L66 74"[^>]*\/>/, "").replace(/<path d="M90 76[^>]*\/>/, "")}</g>`
    + `<path d="M58 30 L84 56" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M58 30 L84 56" stroke="#9AA3B5" stroke-width="5" stroke-linecap="round"/><path d="M52 20 Q46 30 54 36 Q62 38 64 30 L58 30 L56 24 Z" fill="#9AA3B5" ${K2}/>${sparkle(18, 22)}`,
  jeter_jouet: `<g transform="translate(8 6) scale(.84)">${inner(binSVG({ body: "#8A8F9C", lid: "#6B7080", symbol: "reste" }))}</g><g transform="translate(18 -4) scale(.6) rotate(-14 50 50)">${TART.jouet}</g>`,
  donner: `<path d="M14 46 H86 V88 H14 Z" fill="#E6B566" ${K}/><path d="M14 46 L24 34 H76 L86 46" fill="#F2D3A0" ${K2}/>${SHIRT(40, 40, 0.9, "#E85D9A")}${SHIRT(60, 38, 0.8, "#FFD23F")}`
    + `<path d="M50 80 C50 80 36 72 36 63 C36 57 43 54 50 60 C57 54 64 57 64 63 C64 72 50 80 50 80 Z" fill="#E85D5D" ${K2}/>`,
  jeter_habits: `<g transform="translate(8 6) scale(.84)">${inner(binSVG({ body: "#8A8F9C", lid: "#6B7080", symbol: "reste" }))}</g>${SHIRT(52, 16, 0.85, "#E85D9A").replace("translate(52 16)", "translate(52 16) rotate(-18)")}`,
  boite_gouter: `<path d="M12 52 H88 V82 Q88 90 80 90 H20 Q12 90 12 82 Z" fill="#34B37A" ${K}/><path d="M12 52 L18 30 H82 L88 52" fill="#8BCB78" ${K2}/>`
    + `<path d="M24 52 Q30 38 40 42 Q48 46 44 52 Z" fill="#E85D5D" ${K2}/><path d="M50 52 V42 H74 V52" fill="#E6B566" ${K2}/><circle cx="57" cy="47" r="1.4" fill="${INK}"/><circle cx="66" cy="47" r="1.4" fill="${INK}"/>`,
  paquets: [[14, 22, -8, "#E85D9A"], [44, 18, 6, "#3D8BEA"], [70, 26, -4, "#FFD23F"], [22, 56, 4, "#FF8C42"], [52, 58, -6, "#34B37A"]].map(([x, y, r, c]) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 4 L4 0 L8 4 L12 0 L16 4 L20 0 L24 4 V22 L20 26 L16 22 L12 26 L8 22 L4 26 L0 22 Z" fill="${c}" ${K2}/><rect x="5" y="9" width="14" height="8" rx="2" fill="#fff" opacity=".85"/></g>`).join(""),
  carafe: `<path d="M34 18 H58 L54 30 Q72 44 70 66 Q68 90 46 90 Q24 90 24 66 Q22 44 40 30 Z" fill="#E6F4F8" ${K}/><path d="M27 58 Q46 52 67 58 Q68 88 46 88 Q26 88 27 58 Z" fill="#8FD3F0"/>`
    + `<path d="M34 18 H58 L54 30 Q72 44 70 66 Q68 90 46 90 Q24 90 24 66 Q22 44 40 30 Z" fill="none" ${K}/><path d="M58 18 Q68 16 66 26" fill="none" ${K2}/><path d="M34 46 Q30 58 32 70" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`
    + `<path d="M74 60 H90 L88 88 H76 Z" fill="#E6F4F8" ${K2}/><path d="M75 70 H89 L88 88 H76 Z" fill="#8FD3F0"/>`,
  bouteilles_eau: [8, 30, 52].map((x) => `<g transform="translate(${x} 12) scale(.5 .8)">${TART.bouteille}</g>`).join("")
    + `<path d="M6 50 H94 V84 H6 Z" fill="#DDF1FA" opacity=".55" ${K2}/><path d="M40 50 Q50 40 60 50" fill="none" ${K2}/>`,
  // Le centre de tri : les caisses et l'aimant.
  caisse_plastique: CRATE("#3D8BEA", TART.bouteille),
  caisse_metal: CRATE("#9AA3B5", MAGNET),
  caisse_papier: CRATE("#C8955F", TART.carton),
  aimant: MAGNET,
  // Gommettes.
  sticker_boucle: `<circle cx="50" cy="50" r="38" fill="#D5F0E1" ${K}/>${RECYCLE(50, 52, 1.9)}`,
};

export const dartSVG = (id: string) => `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">${DART[id] ?? ""}</svg>`;

// La rue : le trottoir, la route, le camion (l'arrière à gauche) et l'éboueur. La zone du lève-conteneur reçoit la
// poubelle glissée par l'enfant.
export const RUE = { w: 320, h: 170, lift: { x: 146, y: 54, w: 60, h: 76 }, bin: { x: 16, y: 58, s: 62 } };
export const rueSVG = () => `<svg viewBox="0 0 ${RUE.w} ${RUE.h}" aria-hidden="true" style="display:block;width:100%;height:100%;overflow:visible">`
  + `<g opacity=".55"><path d="M6 112 V70 L30 50 L54 70 V112 Z" fill="#FFF2D6" ${K2}/><rect x="22" y="84" width="16" height="28" fill="#C8955F" ${K2}/><path d="M62 112 V60 H104 V112 Z" fill="#E6E2D8" ${K2}/><rect x="70" y="70" width="10" height="10" fill="#9AC7E8"/><rect x="86" y="70" width="10" height="10" fill="#9AC7E8"/></g>`
  + `<rect x="0" y="112" width="${RUE.w}" height="14" fill="#E6E2D8"/><path d="M0 126 H${RUE.w}" stroke="${INK}" stroke-width="2.4"/>`
  + `<rect x="0" y="126" width="${RUE.w}" height="44" fill="#B7BDC9"/><path d="M8 150 H${RUE.w}" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/>`
  + `<g class="dtruck"><g transform="translate(176 25) scale(1.25)">${TRUCK.replace(/stroke-width="3"/g, 'stroke-width="2.4"')}</g>`
  + `<path d="M162 98 H178 V126 H162 Z" fill="#9AA3B5" ${K2}/><path d="M164 105 H176 M164 113 H176" stroke="${INK}" stroke-width="1.6"/></g>`
  + `<g transform="translate(100 66) scale(.62)">${EBOUEUR}</g>`
  + `<rect class="dlift" x="${RUE.lift.x}" y="${RUE.lift.y}" width="${RUE.lift.w}" height="${RUE.lift.h}" rx="10" fill="rgba(255,193,69,.0)" stroke="none"/>`
  + `</svg>`;

// Gommettes : le camion poubelle, la boucle du recyclage, la gourde.
export const dechetsStickerSVG = (ref?: string) => {
  const art = ref === "boucle" ? DART.sticker_boucle : ref === "gourde" ? DART.gourde : TRUCK;
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#E3F5EC"/><g transform="translate(13 13) scale(.44)">${art}</g></svg>`;
};
