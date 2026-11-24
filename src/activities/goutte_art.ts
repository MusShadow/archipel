// Dessins du « voyage de la goutte » : Ploc, les étapes du cycle de l'eau (nature et maison), le labo, les bons gestes.
// Formes simples, trait encre, couleurs douces ; carré de 100 × 100. L'imagier complète (🛁, 🚽, 🧻…).
// Livraison 4 bis : l'appli montre ces dessins repeints par l'atelier (scripts/illustration/pictos.py, qui les lit
// ici) ; le tracé reste leur source, et le secours si une image manque.
import { image, picto, pictoSVG } from "../design/dessins";
const K = `stroke="#273043" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const K2 = `stroke="#273043" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const WATER = "#7CC6E8", WATER_D = "#4FA9DA", MUD = "#8D6E4C", DIRTY = "#B9A483", SOIL = "#D9B48C", GRASS = "#8BCB78";

const drop = (x: number, y: number, s = 1, fill = WATER) =>
  `<path d="M${x} ${y - 7 * s} C${x} ${y - 7 * s} ${x - 5 * s} ${y - 1 * s} ${x - 5 * s} ${y + 2 * s} A${5 * s} ${5 * s} 0 0 0 ${x + 5 * s} ${y + 2 * s} C${x + 5 * s} ${y - 1 * s} ${x} ${y - 7 * s} ${x} ${y - 7 * s} Z" fill="${fill}" ${K2}/>`;
const waves = (y: number, x0 = 12, n = 6, w = 12, color = "#fff") =>
  `<path d="M${x0} ${y}${Array.from({ length: n }, (_, i) => ` q${w / 2} ${i % 2 ? 4 : -4} ${w} 0`).join("")}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
const sun = (cx: number, cy: number, r = 10) =>
  `${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(cx + c * (r + 4)).toFixed(1)} ${(cy + s * (r + 4)).toFixed(1)} L${(cx + c * (r + 9)).toFixed(1)} ${(cy + s * (r + 9)).toFixed(1)}" stroke="#E0A400" stroke-width="3" stroke-linecap="round"/>`; }).join("")}<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFC145" ${K}/>`;
const cloud = (dx = 0, dy = 0, fill = "#fff", s = 1) =>
  `<path transform="translate(${dx} ${dy}) scale(${s})" d="M24 58 H76 A15 15 0 0 0 74 28 A21 21 0 0 0 35 25 A16 16 0 0 0 24 58 Z" fill="${fill}" ${K}/>`;
const bacterium = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="9" ry="7" fill="#86D9A6" ${K2}/><circle cx="-3" cy="-1.5" r="1.6" fill="#273043"/><circle cx="3" cy="-1.5" r="1.6" fill="#273043"/><path d="M-3 2.5 Q0 5 3 2.5" fill="none" stroke="#273043" stroke-width="1.6" stroke-linecap="round"/><path d="M-9 -2 l-4 -2 M9 -2 l4 -2 M-8 4 l-4 2 M8 4 l4 2" stroke="#273043" stroke-width="1.6" stroke-linecap="round"/></g>`;
const house = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 14 L16 0 L32 14 Z" fill="#FF7F50" ${K2}/><rect x="3" y="14" width="26" height="20" fill="#FFF2D6" ${K2}/><rect x="12" y="22" width="8" height="12" fill="#FFC145" ${K2}/></g>`;
const glass = (fill: string, specks = false) =>
  `<path d="M27 16 L33 87 Q33.5 92 38.5 92 H61.5 Q66.5 92 67 87 L73 16 Z" fill="#F4FAFC" ${K}/>`
  + `<path d="M29.4 40 L34.6 86 Q35 89 38.6 89 H61.4 Q65 89 65.4 86 L70.6 40 Z" fill="${fill}"/>`
  + (specks ? `<circle cx="42" cy="58" r="2.6" fill="${MUD}"/><circle cx="56" cy="70" r="3" fill="${MUD}"/><circle cx="48" cy="80" r="2.2" fill="${MUD}"/><circle cx="60" cy="52" r="2" fill="${MUD}"/>` : "")
  + `<path d="M40 46 L43.5 80" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
const tap = (flow: "aucun" | "filet" | "fort") =>
  `<rect x="6" y="20" width="14" height="28" rx="3" fill="#DDE3EA" ${K}/>`
  + `<path d="M20 28 H60 Q72 28 72 40 V50 H60 V42 Q60 40 58 40 H20 Z" fill="#C9D2DC" ${K}/>`
  + `<rect x="36" y="14" width="7" height="14" fill="#C9D2DC" ${K}/><rect x="27" y="8" width="25" height="7" rx="3.5" fill="#3D8BEA" ${K}/>`
  + (flow === "filet" ? `<path d="M66 53 Q67.5 70 66 88" stroke="${WATER}" stroke-width="7" stroke-linecap="round" fill="none"/>` : "")
  + (flow === "fort" ? `<path d="M66 53 Q68 72 66 90" stroke="${WATER}" stroke-width="12" stroke-linecap="round" fill="none"/>${drop(52, 86, 0.8)}${drop(80, 84, 0.8)}${drop(86, 70, 0.6)}${drop(46, 72, 0.6)}` : "");

export const ART: Record<string, string> = {
  // Ploc, la petite goutte d'eau.
  ploc: `<path d="M50 6 C50 6 18 46 18 65 A32 32 0 0 0 82 65 C82 46 50 6 50 6 Z" fill="#8FD3F0" stroke="#273043" stroke-width="3.5" stroke-linejoin="round"/>`
    + `<path d="M30 54 Q26 64 30 74" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>`
    + `<circle cx="40" cy="62" r="4.5" fill="#273043"/><circle cx="60" cy="62" r="4.5" fill="#273043"/><circle cx="41.6" cy="60.4" r="1.5" fill="#fff"/><circle cx="61.6" cy="60.4" r="1.5" fill="#fff"/>`
    + `<path d="M42 73 Q50 80 58 73" fill="none" stroke="#273043" stroke-width="3" stroke-linecap="round"/>`
    + `<circle cx="32" cy="71" r="4" fill="#FF9DB0" opacity=".75"/><circle cx="68" cy="71" r="4" fill="#FF9DB0" opacity=".75"/>`,
  // ---------- Nature ----------
  mer: `<rect x="6" y="44" width="88" height="48" rx="10" fill="#5BB8E6" ${K}/>${waves(60, 12, 6, 12.6)}${waves(76, 12, 6, 12.6)}`
    + `<path d="M40 44 H66 L62 52 H44 Z" fill="#FF7F50" ${K2}/><path d="M53 44 V16 L68 40 Z" fill="#fff" ${K2}/><path d="M53 20 L42 40 H53" fill="#FFF2D6" ${K2}/>`,
  vapeur: `${sun(76, 20, 10)}<path d="M6 72 H94 V86 Q94 93 87 93 H13 Q6 93 6 86 Z" fill="#5BB8E6" ${K}/>${waves(82, 12, 6, 12.6)}`
    + `<path d="M22 66 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="${WATER}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M42 66 q-6 -8 0 -16 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="${WATER}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M62 66 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="${WATER}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M30 30 l4 -6 l4 6 M50 20 l4 -6 l4 6" fill="none" stroke="#3D8BEA" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  nuage: `${cloud(-9, 2, "#fff", 1.18)}${drop(38, 52, 0.75)}${drop(52, 47, 0.75)}${drop(65, 53, 0.75)}`,
  pluie: `${cloud(0, -4, "#DCE3EC")}`
    + `<path d="M32 62 l-5 12 M48 62 l-5 12 M64 62 l-5 12 M40 78 l-5 12 M56 78 l-5 12 M72 78 l-5 12" stroke="#3D8BEA" stroke-width="4" stroke-linecap="round"/>`,
  neige: `<path d="M8 92 L36 50 L50 66 L62 46 L92 92 Z" fill="#C9D2DC" ${K}/><path d="M36 50 L28 62 L36 60 L42 64 Z M62 46 L54 58 L62 56 L70 60 Z" fill="#fff" ${K2}/>`
    + `${cloud(0, -18, "#DCE3EC", 1)}`
    + [[22, 46], [80, 40], [48, 30], [74, 64]].map(([x, y]) => `<path d="M${x - 5} ${y} H${x + 5} M${x} ${y - 5} V${y + 5} M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x - 3.5} ${y + 3.5} L${x + 3.5} ${y - 3.5}" stroke="#3D8BEA" stroke-width="2.4" stroke-linecap="round"/>`).join(""),
  riviere: `<rect x="6" y="6" width="88" height="88" rx="12" fill="#BFE6A8"/>`
    + `<path d="M40 7.5 C26 30 66 42 48 60 C34 74 46 86 54 92.5 H78 C66 84 58 74 70 60 C88 42 52 28 62 7.5 Z" fill="#5BB8E6" ${K}/>`
    + `<path d="M50 20 q3 4 6 0 M54 48 q3 4 6 0 M58 76 q3 4 6 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M18 70 V82 M82 26 V38" stroke="#7A5A3A" stroke-width="3"/><circle cx="18" cy="64" r="9" fill="#5DAE4F" ${K2}/><circle cx="82" cy="20" r="9" fill="#5DAE4F" ${K2}/>`
    + `<rect x="6" y="6" width="88" height="88" rx="12" fill="none" ${K}/>`,
  nappe: `<rect x="6" y="6" width="88" height="88" rx="12" fill="${SOIL}"/>`
    + `<path d="M18 7.5 H82 Q92.5 7.5 92.5 18 V30 H7.5 V18 Q7.5 7.5 18 7.5 Z" fill="#D5F1F3"/>`
    + `<path d="M7.5 31 H92.5" stroke="#5DAE4F" stroke-width="6"/><path d="M20 28 l2 -6 l2 6 M70 28 l2 -6 l2 6" stroke="#5DAE4F" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M30 12 l-3 8 M44 12 l-3 8 M58 12 l-3 8" stroke="#3D8BEA" stroke-width="3" stroke-linecap="round"/>`
    + `<ellipse cx="24" cy="46" rx="7" ry="4.5" fill="#B08A64"/><ellipse cx="74" cy="50" rx="8" ry="5" fill="#B08A64"/><ellipse cx="60" cy="58" rx="5" ry="3.5" fill="#B08A64"/>`
    + `${drop(44, 42, 0.6)}${drop(44, 54, 0.6)}`
    + `<path d="M7.5 68 q10.6 -6 21.25 0 q10.6 6 21.25 0 q10.6 -6 21.25 0 q10.6 6 21.25 0 V82 Q92.5 92.5 82 92.5 H18 Q7.5 92.5 7.5 82 Z" fill="${WATER_D}"/>`
    + `${waves(80, 16, 6, 11.3)}<rect x="6" y="6" width="88" height="88" rx="12" fill="none" ${K}/>`,
  // ---------- Maison : de la nappe au robinet ----------
  pompe: `<rect x="6" y="40" width="88" height="54" rx="10" fill="${SOIL}"/>`
    + `<path d="M7.5 74 q10.6 -5 21.25 0 q10.6 5 21.25 0 q10.6 -5 21.25 0 q10.6 5 21.25 0 V84 Q92.5 92.5 84 92.5 H16 Q7.5 92.5 7.5 84 Z" fill="${WATER_D}"/>`
    + `<path d="M6 41 H94" stroke="#5DAE4F" stroke-width="6" stroke-linecap="round"/>`
    + `<rect x="45" y="38" width="10" height="46" fill="#AEB6C2" ${K2}/>`
    + `<rect x="30" y="20" width="40" height="22" rx="3" fill="#FFF2D6" ${K}/><path d="M26 22 L50 8 L74 22 Z" fill="#FF7F50" ${K}/>`
    + `<circle cx="50" cy="31" r="6" fill="#C9D2DC" ${K2}/><path d="M50 31 l4 -3" stroke="#273043" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M72 80 V56 M65 63 L72 56 L79 63" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<rect x="6" y="40" width="88" height="54" rx="10" fill="none" ${K}/>`,
  usine: `<path d="M10 88 V40 L28 28 V40 L46 28 V40 L64 28 V40 H90 V88 Z" fill="#E6F4F8" ${K}/>`
    + `<rect x="68" y="16" width="10" height="24" fill="#C9D2DC" ${K2}/>`
    + `<path d="M50 44 C50 44 37 59 37 67 A13 13 0 0 0 63 67 C63 59 50 44 50 44 Z" fill="#5BB8E6" ${K}/><path d="M44 66 L48.5 70.5 L57 61" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<rect x="16" y="64" width="12" height="24" rx="2" fill="#FFC145" ${K2}/><rect x="72" y="52" width="12" height="10" rx="2" fill="#fff" ${K2}/>`
    + `<circle cx="82" cy="10" r="3.5" fill="none" stroke="${WATER_D}" stroke-width="2.4"/><circle cx="90" cy="18" r="2.5" fill="none" stroke="${WATER_D}" stroke-width="2.4"/><circle cx="62" cy="12" r="3" fill="none" stroke="${WATER_D}" stroke-width="2.4"/>`
    + `<path d="M4 88 H96" ${K}/>`,
  chateau: `<path d="M8 92 H92" ${K}/><path d="M41 92 L44.5 48 H55.5 L59 92 Z" fill="#F1E3C8" ${K}/><path d="M47 92 V84 A3 3 0 0 1 53 84 V92" fill="#C9A27C" ${K2}/>`
    + `<path d="M20 26 Q20 11 50 9 Q80 11 80 26 V36 Q80 50 50 52 Q20 50 20 36 Z" fill="#CDEFF5" ${K}/>`
    + `<path d="M20.5 31 Q50 37 79.5 31" fill="none" ${K2}/>${drop(50, 42, 0.75, "#5BB8E6")}`,
  colline: `<path d="M3 93 Q24 34 50 32 Q76 34 97 93 Z" fill="#9BD18A" ${K}/>`
    + `<path d="M30 33 H70 V24 Q70 16 50 16 Q30 16 30 24 Z" fill="#CDEFF5" ${K}/><path d="M31 27 H69" stroke="#273043" stroke-width="2.4"/>`
    + `${drop(50, 26, 0.6, "#5BB8E6")}<path d="M66 40 Q76 62 88 90" fill="none" stroke="#9AA3B5" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M24 74 q4 -6 8 0 M64 70 q4 -6 8 0" stroke="#5DAE4F" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  robinet: tap("filet") + `<path d="M50 76 L54 94 H78 L82 76 Z" fill="#F4FAFC" ${K}/><path d="M51.6 83 L54.6 92 H77.4 L80.4 83 Z" fill="${WATER}"/>`,
  robinet_ferme: tap("aucun"),
  robinet_ouvert: tap("fort"),
  // ---------- Maison : du robinet à la station d'épuration ----------
  egouts: `<rect x="6" y="8" width="88" height="20" rx="5" fill="#B9C0CA" ${K}/><ellipse cx="50" cy="18" rx="13" ry="5.5" fill="#8B94A3" ${K2}/>`
    + `<path d="M40 18 H60 M44 15.5 H56 M44 20.5 H56" stroke="#5B6475" stroke-width="1.6"/>`
    + `<path d="M6 28 H94 V86 Q94 93 87 93 H13 Q6 93 6 86 Z" fill="${SOIL}" ${K}/>`
    + `<rect x="45" y="28" width="10" height="24" fill="#AEB6C2" ${K2}/>`
    + `<rect x="9" y="50" width="82" height="34" rx="17" fill="#AEB6C2" ${K}/>`
    + `<path d="M14 69 q7 -4 14 0 q7 4 14 0 q7 -4 14 0 q7 4 14 0 q7 -4 14 0 V72 Q86 80 74 80 H26 Q14 80 14 72 Z" fill="${MUD}"/>`
    + `<path d="M30 60 H66 M60 55 L66 60 L60 65" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  station: `<rect x="6" y="14" width="88" height="76" rx="12" fill="#D5EDC7" ${K}/>`
    + `<circle cx="32" cy="42" r="19" fill="${DIRTY}" ${K}/>`
    + [[24, 36], [34, 32], [40, 44], [28, 48], [36, 52], [22, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="#fff"/>`).join("")
    + `<circle cx="68" cy="42" r="19" fill="#8FD3F0" ${K}/>${waves(42, 56, 4, 6, "#fff")}`
    + `<path d="M51 42 H49" ${K}/><path d="M68 61 V76 H90" fill="none" stroke="#9AA3B5" stroke-width="5" stroke-linecap="round"/>`
    + `<rect x="14" y="68" width="30" height="16" rx="2" fill="#FFF2D6" ${K2}/><path d="M12 69 L29 60 L46 69 Z" fill="#FF7F50" ${K2}/>`,
  grilles: `<rect x="8" y="22" width="84" height="62" rx="8" fill="${DIRTY}" ${K}/>`
    + `<path d="M20 30 h10 v14 h-10 z" fill="#E85D5D" ${K2}/><path d="M14 62 q8 -12 16 0 q-8 8 -16 0 z" fill="#5DAE4F" ${K2}/><rect x="12" y="46" width="14" height="9" rx="2" fill="#fff" ${K2}/>`
    + `<path d="M36 14 V92 M50 14 V92 M64 14 V92 M78 14 V92" stroke="#5B6475" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M34 16 H80" stroke="#5B6475" stroke-width="4" stroke-linecap="round"/>`,
  bulles: `<path d="M8 32 H92 V82 Q92 90 84 90 H16 Q8 90 8 82 Z" fill="${DIRTY}" ${K}/>`
    + [[18, 76], [30, 64], [44, 78], [58, 60], [70, 74], [82, 58], [24, 46], [50, 44], [76, 42], [64, 84], [38, 52], [86, 80]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2.4 + (i % 3)}" fill="#fff" opacity=".9"/>`).join("")
    + `${bacterium(34, 64, 1)}${bacterium(66, 52, 0.9)}${bacterium(50, 78, 0.8)}`
    + `<path d="M4 32 H96" ${K}/>`,
  calme: `<path d="M8 32 H92 V82 Q92 90 84 90 H16 Q8 90 8 82 Z" fill="#8FD3F0" ${K}/>`
    + `<path d="M9.5 72 q10 -4 20 0 q10 4 20 0 q10 -4 20 0 q10 4 21 0 V82 Q90.5 88.5 84 88.5 H16 Q9.5 88.5 9.5 82 Z" fill="${MUD}"/>`
    + `<path d="M30 42 v14 M50 38 v18 M70 42 v14" stroke="${MUD}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6"/>`
    + `<path d="M26 54 l4 4 l4 -4 M46 54 l4 4 l4 -4 M66 54 l4 4 l4 -4" fill="none" stroke="${MUD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    + `${waves(40, 14, 6, 12, "#fff")}<path d="M4 32 H96" ${K}/>`,
  bacteries: `${bacterium(30, 40, 1.7)}${bacterium(68, 34, 1.3)}${bacterium(52, 70, 1.5)}`,
  // ---------- Labo et expériences ----------
  flaque: `<path d="M8 74 H92" ${K}/><path d="M16 70 Q14 58 34 58 Q48 52 64 58 Q88 58 84 70 Q80 80 50 80 Q20 80 16 70 Z" fill="#8FD3F0" ${K}/>`
    + `<path d="M30 66 Q40 62 52 64" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  casserole: `<path d="M14 46 H86" stroke="#273043" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M20 46 H80 V76 Q80 86 70 86 H30 Q20 86 20 76 Z" fill="#C9D2DC" ${K}/><path d="M20 52 H8 M80 52 H92" stroke="#273043" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M23 52 H77" stroke="${WATER_D}" stroke-width="4"/>`
    + `<path d="M36 38 q-5 -7 0 -14 q5 -7 0 -14 M52 38 q-5 -7 0 -14 q5 -7 0 -14 M68 38 q-5 -7 0 -14" fill="none" stroke="#9FC6D8" stroke-width="4" stroke-linecap="round"/>`,
  vapeur_seule: `<path d="M28 88 q-9 -11 0 -22 q9 -11 0 -22 q-9 -11 0 -22" fill="none" stroke="#9FC6D8" stroke-width="7" stroke-linecap="round"/>`
    + `<path d="M50 92 q-9 -11 0 -22 q9 -11 0 -22 q-9 -11 0 -22 q9 -11 0 -18" fill="none" stroke="#9FC6D8" stroke-width="7" stroke-linecap="round"/>`
    + `<path d="M72 88 q-9 -11 0 -22 q9 -11 0 -22 q-9 -11 0 -22" fill="none" stroke="#9FC6D8" stroke-width="7" stroke-linecap="round"/>`,
  verre_clair: glass(WATER),
  verre_trouble: glass(DIRTY, true),
  boire_oui: glass(WATER) + `<circle cx="74" cy="72" r="17" fill="#34B37A" ${K}/><path d="M65 72 L71.5 78.5 L83 66" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  boire_non: glass("#A9C9D9") + `<circle cx="74" cy="72" r="17" fill="#E85D5D" ${K}/><path d="M67 65 L81 79 M81 65 L67 79" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>`,
  // ---------- Bons gestes ----------
  lingette: `<path d="M28 34 L74 26 L82 70 L36 78 Z" fill="#E6F4F8" ${K}/><path d="M20 30 L66 22 L74 66 L28 74 Z" fill="#fff" ${K}/>`
    + `<path d="M24 52 L70 44" stroke="#C9D2DC" stroke-width="2.4"/>`
    + [[34, 36], [50, 33], [38, 62], [56, 58], [44, 48], [62, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#8FD3F0"/>`).join(""),
  cotontige: `<path d="M26 74 L74 26" stroke="#8FD3F0" stroke-width="6" stroke-linecap="round"/><path d="M26 74 L74 26" stroke="#273043" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>`
    + `<ellipse cx="22" cy="78" rx="11" ry="7" transform="rotate(-45 22 78)" fill="#fff" ${K}/><ellipse cx="78" cy="22" rx="11" ry="7" transform="rotate(-45 78 22)" fill="#fff" ${K}/>`,
  bacjaune: `<path d="M22 30 H78 L72 86 H28 Z" fill="#FFD23F" ${K}/><rect x="18" y="20" width="64" height="12" rx="4" fill="#F2B705" ${K}/>`
    + `<path d="M40 20 V15 H60 V20" fill="none" ${K2}/><circle cx="32" cy="88" r="5" fill="#5B6475" ${K2}/><circle cx="68" cy="88" r="5" fill="#5B6475" ${K2}/>`
    + `<path d="M34 44 H66 M33 58 H67" stroke="#E0A400" stroke-width="3" stroke-linecap="round"/>`,
  // ---------- Le château d'eau : où mettre le réservoir ? ----------
  res_haut: `<path d="M3 93 Q14 40 32 38 Q50 40 62 93 Z" fill="#9BD18A" ${K}/>`
    + `<path d="M18 38 H46 V30 Q46 24 32 24 Q18 24 18 30 Z" fill="#CDEFF5" ${K}/>`
    + `<path d="M40 44 Q56 70 70 82" fill="none" stroke="#9AA3B5" stroke-width="5" stroke-linecap="round"/>${house(64, 58, 0.95)}<path d="M93 93 H3" ${K}/>`,
  res_bas: `<path d="M3 58 H16 V90 H52 V58 H97 V94 H3 Z" fill="${SOIL}" ${K}/>`
    + `<path d="M21 88 H47 V80 Q47 73 34 73 Q21 73 21 80 Z" fill="#CDEFF5" ${K}/>`
    + `<path d="M44 76 C58 76 54 50 66 50" fill="none" stroke="#9AA3B5" stroke-width="5" stroke-linecap="round"/>${house(62, 25, 0.95)}`,
  tour_haute: `<path d="M4 92 H96" ${K}/><path d="M28 92 L31 30 H41 L44 92 Z" fill="#F1E3C8" ${K}/>`
    + `<path d="M18 18 Q18 8 36 7 Q54 8 54 18 V24 Q54 33 36 34 Q18 33 18 24 Z" fill="#CDEFF5" ${K}/>${house(62, 58, 0.95)}`
    + `<path d="M44 86 H70" stroke="#9AA3B5" stroke-width="4" stroke-linecap="round"/>`,
  tour_basse: `<path d="M4 92 H96" ${K}/><path d="M29 92 L31 74 H41 L43 92 Z" fill="#F1E3C8" ${K}/>`
    + `<path d="M18 64 Q18 56 36 55 Q54 56 54 64 V68 Q54 75 36 76 Q18 75 18 68 Z" fill="#CDEFF5" ${K}/>${house(62, 58, 0.95)}`
    + `<path d="M43 86 H70" stroke="#9AA3B5" stroke-width="4" stroke-linecap="round"/>`,
};

export const artSVG = (id: string) => image(`goutte/${id}`) ? picto(`goutte/${id}`)
  : `<svg viewBox="0 0 100 100" aria-hidden="true" style="display:block;width:100%;height:100%">${ART[id] ?? ""}</svg>`;

// Gommettes : Ploc, ou le château d'eau, sur une pastille.
export const goutteStickerSVG = (ref?: string) => {
  const id = ref === "chateau" ? "chateau" : "ploc";
  const inner = image(`goutte/${id}`) ? pictoSVG(`goutte/${id}`, 12, 12, 0.46) : `<g transform="translate(12 12) scale(0.46)">${ART[id]}</g>`;
  return `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="${ref === "gestes" ? "#DDF3E6" : "#D7EFF8"}"/>${inner}</svg>`;
};
