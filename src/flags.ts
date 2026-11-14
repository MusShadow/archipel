// Drapeaux redessinés en SVG (symboles nationaux) et carte du monde simplifiée.

export type ContinentId = "europe" | "afrique" | "asie" | "amnord" | "amsud" | "oceanie";
export const CONTINENTS: { id: ContinentId; label: string; color: string }[] = [
  { id: "amnord", label: "Amérique du Nord", color: "#9ED7A3" },
  { id: "amsud", label: "Amérique du Sud", color: "#C9B2F2" },
  { id: "europe", label: "Europe", color: "#9BB8F0" },
  { id: "afrique", label: "Afrique", color: "#F6C177" },
  { id: "asie", label: "Asie", color: "#F29C8F" },
  { id: "oceanie", label: "Océanie", color: "#F5A3C7" },
];

export interface FlagDef {
  code: string; name: string; the: string; of: string; plural?: boolean;
  cont: ContinentId[]; lat: number; lon: number; ratio: number;
  desc: string; syl?: string[]; gp?: string[];
  draw: (W: number, H: number, uid: string) => string;
}

const f2 = (n: number) => +n.toFixed(2);
const rect = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${c}"/>`;
const circ = (cx: number, cy: number, r: number, c: string) => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${c}"/>`;
const bandsV = (cols: string[]) => (W: number, H: number) => cols.map((c, i) => rect((i * W) / cols.length, 0, W / cols.length + 0.6, H, c)).join("");
const bandsH = (cols: string[], weights?: number[]) => (W: number, H: number) => {
  const ws = weights ?? cols.map(() => 1);
  const tot = ws.reduce((a, b) => a + b, 0);
  let y = 0;
  return cols.map((c, i) => { const h = (H * ws[i]) / tot; const r = rect(0, y, W, h + 0.6, c); y += h; return r; }).join("");
};
export function starPoints(cx: number, cy: number, R: number, rotDeg = -90, inner = 0.382) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((rotDeg + i * 36) * Math.PI) / 180;
    const r = i % 2 === 0 ? R : R * inner;
    pts.push(`${f2(cx + r * Math.cos(a))},${f2(cy + r * Math.sin(a))}`);
  }
  return pts.join(" ");
}
const star = (cx: number, cy: number, R: number, c: string, rot = -90) => `<polygon points="${starPoints(cx, cy, R, rot)}" fill="${c}"/>`;
const both = (...fns: ((W: number, H: number, uid: string) => string)[]) => (W: number, H: number, uid: string) => fns.map((f) => f(W, H, uid)).join("");

// Feuille d'érable stylisée (11 pointes), dans une boîte de 100 × 100.
const LEAF_RIGHT: [number, number][] = [
  [55, 15], [62, 12], [59, 33], [75, 24], [79, 30], [94, 27], [88, 45], [92, 50], [70, 63], [73, 70], [53, 67], [52, 92],
];
const leafPoints = () => {
  const right = LEAF_RIGHT.map(([x, y]) => `${x},${y}`);
  const left = LEAF_RIGHT.slice().reverse().map(([x, y]) => `${100 - x},${y}`);
  return ["50,4", ...right, ...left].join(" ");
};

const W = 300;
export const FLAGS: FlagDef[] = [
  { code: "FR", name: "France", the: "la France", of: "de la France", cont: ["europe"], lat: 46.6, lon: 2.4, ratio: 1.5, desc: "trois bandes verticales : bleu, blanc et rouge", draw: bandsV(["#0055A4", "#FFFFFF", "#EF4135"]) },
  { code: "IT", name: "Italie", the: "l'Italie", of: "de l'Italie", cont: ["europe"], lat: 42.8, lon: 12.5, ratio: 1.5, desc: "trois bandes verticales : vert, blanc et rouge", draw: bandsV(["#009246", "#FFFFFF", "#CE2B37"]) },
  { code: "BE", name: "Belgique", the: "la Belgique", of: "de la Belgique", cont: ["europe"], lat: 50.6, lon: 4.6, ratio: 15 / 13, desc: "trois bandes verticales : noir, jaune et rouge", draw: bandsV(["#000000", "#FAE042", "#ED2939"]) },
  { code: "DE", name: "Allemagne", the: "l'Allemagne", of: "de l'Allemagne", cont: ["europe"], lat: 51.1, lon: 10.4, ratio: 5 / 3, desc: "trois bandes horizontales : noir, rouge et jaune", draw: bandsH(["#000000", "#DD0000", "#FFCE00"]) },
  { code: "IE", name: "Irlande", the: "l'Irlande", of: "de l'Irlande", cont: ["europe"], lat: 53.2, lon: -8.2, ratio: 2, desc: "trois bandes verticales : vert, blanc et orange", draw: bandsV(["#169B62", "#FFFFFF", "#FF883E"]) },
  { code: "NL", name: "Pays-Bas", the: "les Pays-Bas", of: "des Pays-Bas", plural: true, cont: ["europe"], lat: 52.2, lon: 5.3, ratio: 1.5, desc: "trois bandes horizontales : rouge, blanc et bleu", draw: bandsH(["#AE1C28", "#FFFFFF", "#21468B"]) },
  { code: "LU", name: "Luxembourg", the: "le Luxembourg", of: "du Luxembourg", cont: ["europe"], lat: 49.8, lon: 6.1, ratio: 5 / 3, desc: "trois bandes horizontales : rouge, blanc et bleu clair", draw: bandsH(["#ED2939", "#FFFFFF", "#00A1DE"]) },
  { code: "RU", name: "Russie", the: "la Russie", of: "de la Russie", cont: ["europe", "asie"], lat: 55.8, lon: 37.6, ratio: 1.5, desc: "trois bandes horizontales : blanc, bleu et rouge", draw: bandsH(["#FFFFFF", "#0039A6", "#D52B1E"]) },
  { code: "AT", name: "Autriche", the: "l'Autriche", of: "de l'Autriche", cont: ["europe"], lat: 47.6, lon: 14.1, ratio: 1.5, desc: "rouge, blanc, rouge, en bandes horizontales", draw: bandsH(["#ED2939", "#FFFFFF", "#ED2939"]) },
  { code: "PL", name: "Pologne", the: "la Pologne", of: "de la Pologne", cont: ["europe"], lat: 52, lon: 19.4, ratio: 1.6, desc: "blanc en haut, rouge en bas", draw: bandsH(["#FFFFFF", "#DC143C"]) },
  { code: "MC", name: "Monaco", the: "Monaco", of: "de Monaco", cont: ["europe"], lat: 43.7, lon: 7.4, ratio: 1.25, desc: "rouge en haut, blanc en bas", syl: ["Mo", "na", "co"], gp: ["m", "o", "n", "a", "c", "o"], draw: bandsH(["#CE1126", "#FFFFFF"]) },
  { code: "UA", name: "Ukraine", the: "l'Ukraine", of: "de l'Ukraine", cont: ["europe"], lat: 49, lon: 31.4, ratio: 1.5, desc: "bleu en haut, jaune en bas", draw: bandsH(["#0057B7", "#FFD700"]) },
  { code: "RO", name: "Roumanie", the: "la Roumanie", of: "de la Roumanie", cont: ["europe"], lat: 45.9, lon: 25, ratio: 1.5, desc: "trois bandes verticales : bleu, jaune et rouge", draw: bandsV(["#002B7F", "#FCD116", "#CE1126"]) },
  { code: "HU", name: "Hongrie", the: "la Hongrie", of: "de la Hongrie", cont: ["europe"], lat: 47.2, lon: 19.5, ratio: 2, desc: "trois bandes horizontales : rouge, blanc et vert", draw: bandsH(["#CE2939", "#FFFFFF", "#477050"]) },
  { code: "BG", name: "Bulgarie", the: "la Bulgarie", of: "de la Bulgarie", cont: ["europe"], lat: 42.7, lon: 25.5, ratio: 5 / 3, desc: "trois bandes horizontales : blanc, vert et rouge", draw: bandsH(["#FFFFFF", "#00966E", "#D62612"]) },
  { code: "LT", name: "Lituanie", the: "la Lituanie", of: "de la Lituanie", cont: ["europe"], lat: 55.2, lon: 23.9, ratio: 5 / 3, desc: "trois bandes horizontales : jaune, vert et rouge", draw: bandsH(["#FDB913", "#006A44", "#C1272D"]) },
  {
    code: "CH", name: "Suisse", the: "la Suisse", of: "de la Suisse", cont: ["europe"], lat: 46.8, lon: 8.2, ratio: 1, desc: "une croix blanche sur un drapeau rouge tout carré",
    draw: (w, h) => { const u = w / 32; return rect(0, 0, w, h, "#DA291C") + rect(13 * u, 6 * u, 6 * u, 20 * u, "#FFFFFF") + rect(6 * u, 13 * u, 20 * u, 6 * u, "#FFFFFF"); },
  },
  {
    code: "DK", name: "Danemark", the: "le Danemark", of: "du Danemark", cont: ["europe"], lat: 56, lon: 10, ratio: 37 / 28, desc: "une croix blanche sur un fond rouge",
    draw: (w, h) => rect(0, 0, w, h, "#C8102E") + rect((12 / 37) * w, 0, (4 / 37) * w, h, "#FFFFFF") + rect(0, (12 / 28) * h, w, (4 / 28) * h, "#FFFFFF"),
  },
  {
    code: "SE", name: "Suède", the: "la Suède", of: "de la Suède", cont: ["europe"], lat: 62, lon: 16, ratio: 1.6, desc: "une croix jaune sur un fond bleu",
    draw: (w, h) => rect(0, 0, w, h, "#006AA7") + rect((5 / 16) * w, 0, (2 / 16) * w, h, "#FECC00") + rect(0, (4 / 10) * h, w, (2 / 10) * h, "#FECC00"),
  },
  {
    code: "NO", name: "Norvège", the: "la Norvège", of: "de la Norvège", cont: ["europe"], lat: 62, lon: 9, ratio: 22 / 16, desc: "une croix bleue bordée de blanc sur un fond rouge",
    draw: (w, h) => rect(0, 0, w, h, "#BA0C2F") + rect((6 / 22) * w, 0, (4 / 22) * w, h, "#FFFFFF") + rect(0, (6 / 16) * h, w, (4 / 16) * h, "#FFFFFF")
      + rect((7 / 22) * w, 0, (2 / 22) * w, h, "#00205B") + rect(0, (7 / 16) * h, w, (2 / 16) * h, "#00205B"),
  },
  {
    code: "FI", name: "Finlande", the: "la Finlande", of: "de la Finlande", cont: ["europe"], lat: 64, lon: 26, ratio: 18 / 11, desc: "une croix bleue sur un fond blanc",
    draw: (w, h) => rect(0, 0, w, h, "#FFFFFF") + rect((5 / 18) * w, 0, (3 / 18) * w, h, "#003580") + rect(0, (4 / 11) * h, w, (3 / 11) * h, "#003580"),
  },
  {
    code: "GR", name: "Grèce", the: "la Grèce", of: "de la Grèce", cont: ["europe"], lat: 39, lon: 22, ratio: 1.5, desc: "des rayures bleues et blanches, avec une croix blanche",
    draw: (w, h) => {
      const s = h / 9;
      let out = "";
      for (let i = 0; i < 9; i++) out += rect(0, i * s, w, s + 0.6, i % 2 === 0 ? "#0D5EAF" : "#FFFFFF");
      return out + rect(0, 0, 5 * s, 5 * s, "#0D5EAF") + rect(2 * s, 0, s, 5 * s, "#FFFFFF") + rect(0, 2 * s, 5 * s, s, "#FFFFFF");
    },
  },
  {
    code: "GB", name: "Royaume-Uni", the: "le Royaume-Uni", of: "du Royaume-Uni", cont: ["europe"], lat: 54, lon: -2.5, ratio: 2, desc: "des croix rouges et blanches sur un fond bleu",
    draw: (w, h, uid) => {
      const k = w / 60;
      return `<g transform="scale(${f2(k)})"><clipPath id="s${uid}"><path d="M0,0 v30 h60 v-30 z"/></clipPath>`
        + `<clipPath id="t${uid}"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>`
        + `<g clip-path="url(#s${uid})"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/>`
        + `<path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6"/>`
        + `<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t${uid})" stroke="#C8102E" stroke-width="4"/>`
        + `<path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" stroke-width="10"/>`
        + `<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></g>`;
    },
  },
  {
    code: "CZ", name: "Tchéquie", the: "la Tchéquie", of: "de la Tchéquie", cont: ["europe"], lat: 49.8, lon: 15.5, ratio: 1.5, desc: "blanc et rouge, avec un triangle bleu",
    draw: (w, h) => bandsH(["#FFFFFF", "#D7141A"])(w, h) + `<polygon points="0,0 ${f2(w / 2)},${f2(h / 2)} 0,${f2(h)}" fill="#11457E"/>`,
  },
  { code: "CI", name: "Côte d'Ivoire", the: "la Côte d'Ivoire", of: "de la Côte d'Ivoire", cont: ["afrique"], lat: 7.5, lon: -5.5, ratio: 1.5, desc: "trois bandes verticales : orange, blanc et vert", draw: bandsV(["#F77F00", "#FFFFFF", "#009E60"]) },
  { code: "ML", name: "Mali", the: "le Mali", of: "du Mali", cont: ["afrique"], lat: 17.6, lon: -4, ratio: 1.5, desc: "trois bandes verticales : vert, jaune et rouge", syl: ["Ma", "li"], gp: ["m", "a", "l", "i"], draw: bandsV(["#14B53A", "#FCD116", "#CE1126"]) },
  { code: "GN", name: "Guinée", the: "la Guinée", of: "de la Guinée", cont: ["afrique"], lat: 10.4, lon: -10.9, ratio: 1.5, desc: "trois bandes verticales : rouge, jaune et vert", draw: bandsV(["#CE1126", "#FCD116", "#009460"]) },
  { code: "TD", name: "Tchad", the: "le Tchad", of: "du Tchad", cont: ["afrique"], lat: 15.5, lon: 18.7, ratio: 1.5, desc: "trois bandes verticales : bleu foncé, jaune et rouge", draw: bandsV(["#002664", "#FECB00", "#C60C30"]) },
  { code: "NG", name: "Nigeria", the: "le Nigeria", of: "du Nigeria", cont: ["afrique"], lat: 9, lon: 8.7, ratio: 2, desc: "vert, blanc, vert, en bandes verticales", draw: bandsV(["#008751", "#FFFFFF", "#008751"]) },
  { code: "SN", name: "Sénégal", the: "le Sénégal", of: "du Sénégal", cont: ["afrique"], lat: 14.5, lon: -14.5, ratio: 1.5, desc: "vert, jaune et rouge, avec une étoile verte au milieu", draw: both(bandsV(["#00853F", "#FDEF42", "#E31B23"]), (w, h) => star(w / 2, h / 2, h * 0.16, "#00853F")) },
  { code: "CM", name: "Cameroun", the: "le Cameroun", of: "du Cameroun", cont: ["afrique"], lat: 5.7, lon: 12.4, ratio: 1.5, desc: "vert, rouge et jaune, avec une étoile jaune au milieu", draw: both(bandsV(["#007A5E", "#CE1126", "#FCD116"]), (w, h) => star(w / 2, h / 2, h * 0.16, "#FCD116")) },
  { code: "GA", name: "Gabon", the: "le Gabon", of: "du Gabon", cont: ["afrique"], lat: -0.8, lon: 11.6, ratio: 4 / 3, desc: "trois bandes horizontales : vert, jaune et bleu", draw: bandsH(["#009E60", "#FCD116", "#3A75C4"]) },
  { code: "SO", name: "Somalie", the: "la Somalie", of: "de la Somalie", cont: ["afrique"], lat: 5.2, lon: 46.2, ratio: 1.5, desc: "une étoile blanche sur un fond bleu ciel", draw: (w, h) => rect(0, 0, w, h, "#4189DD") + star(w / 2, h / 2, h * 0.22, "#FFFFFF") },
  {
    code: "MA", name: "Maroc", the: "le Maroc", of: "du Maroc", cont: ["afrique"], lat: 31.8, lon: -7.1, ratio: 1.5, desc: "une étoile verte dessinée sur un fond rouge",
    draw: (w, h) => {
      const R = h * 0.26, cx = w / 2, cy = h / 2;
      const v = [0, 2, 4, 1, 3].map((i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return `${f2(cx + R * Math.cos(a))},${f2(cy + R * Math.sin(a))}`; });
      return rect(0, 0, w, h, "#C1272D") + `<polygon points="${v.join(" ")}" fill="none" stroke="#006233" stroke-width="${f2(h * 0.035)}" stroke-linejoin="miter"/>`;
    },
  },
  {
    code: "TG", name: "Togo", the: "le Togo", of: "du Togo", cont: ["afrique"], lat: 8.6, lon: 1, ratio: 1.618, desc: "des rayures vertes et jaunes, avec une étoile blanche sur du rouge", syl: ["To", "go"], gp: ["t", "o", "g", "o"],
    draw: (w, h) => { const s = h / 5; return bandsH(["#006A4E", "#FFCE00", "#006A4E", "#FFCE00", "#006A4E"])(w, h) + rect(0, 0, 3 * s, 3 * s, "#D21034") + star(1.5 * s, 1.5 * s, s * 0.95, "#FFFFFF"); },
  },
  { code: "JP", name: "Japon", the: "le Japon", of: "du Japon", cont: ["asie"], lat: 36.2, lon: 138.3, ratio: 1.5, desc: "un rond rouge sur un fond blanc", syl: ["Ja", "pon"], gp: ["j", "a", "p", "on"], draw: (w, h) => rect(0, 0, w, h, "#FFFFFF") + circ(w / 2, h / 2, h * 0.3, "#BC002D") },
  { code: "BD", name: "Bangladesh", the: "le Bangladesh", of: "du Bangladesh", cont: ["asie"], lat: 23.7, lon: 90.4, ratio: 5 / 3, desc: "un rond rouge sur un fond vert", draw: (w, h) => rect(0, 0, w, h, "#006A4E") + circ(w * 0.45, h / 2, w * 0.2, "#F42A41") },
  { code: "VN", name: "Viêt Nam", the: "le Viêt Nam", of: "du Viêt Nam", cont: ["asie"], lat: 14.1, lon: 108.3, ratio: 1.5, desc: "une étoile jaune sur un fond rouge", draw: (w, h) => rect(0, 0, w, h, "#DA251D") + star(w / 2, h / 2, h * 0.3, "#FFCD00") },
  {
    code: "CN", name: "Chine", the: "la Chine", of: "de la Chine", cont: ["asie"], lat: 35.9, lon: 104.2, ratio: 1.5, desc: "une grande étoile jaune et quatre petites, sur un fond rouge",
    draw: (w, h) => {
      const u = w / 30;
      const small = [[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => star(x * u, y * u, u, "#FFDE00", (Math.atan2(5 - y, 5 - x) * 180) / Math.PI)).join("");
      return rect(0, 0, w, h, "#EE1C25") + star(5 * u, 5 * u, 3 * u, "#FFDE00") + small;
    },
  },
  {
    code: "IN", name: "Inde", the: "l'Inde", of: "de l'Inde", cont: ["asie"], lat: 21, lon: 78, ratio: 1.5, desc: "orange, blanc et vert, avec une roue bleue au milieu",
    draw: (w, h) => {
      const r = h / 8, cx = w / 2, cy = h / 2;
      let spokes = "";
      for (let i = 0; i < 24; i++) { const a = (i * 15 * Math.PI) / 180; spokes += `M${f2(cx)} ${f2(cy)} L${f2(cx + r * Math.cos(a))} ${f2(cy + r * Math.sin(a))} `; }
      return bandsH(["#FF9933", "#FFFFFF", "#138808"])(w, h)
        + `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="none" stroke="#000080" stroke-width="${f2(r * 0.14)}"/>`
        + `<path d="${spokes}" stroke="#000080" stroke-width="${f2(r * 0.06)}"/>` + circ(cx, cy, r * 0.18, "#000080");
    },
  },
  { code: "LA", name: "Laos", the: "le Laos", of: "du Laos", cont: ["asie"], lat: 19.9, lon: 102.5, ratio: 1.5, desc: "rouge, bleu, rouge, avec un rond blanc au milieu", draw: both(bandsH(["#CE1126", "#002868", "#CE1126"], [1, 2, 1]), (w, h) => circ(w / 2, h / 2, h * 0.2, "#FFFFFF")) },
  { code: "ID", name: "Indonésie", the: "l'Indonésie", of: "de l'Indonésie", cont: ["asie"], lat: -2.5, lon: 118, ratio: 1.5, desc: "rouge en haut, blanc en bas", draw: bandsH(["#CE1126", "#FFFFFF"]) },
  {
    code: "US", name: "États-Unis", the: "les États-Unis", of: "des États-Unis", plural: true, cont: ["amnord"], lat: 39, lon: -98, ratio: 1.9, desc: "des rayures rouges et blanches, et des étoiles blanches sur du bleu",
    draw: (w, h) => {
      const s = h / 13;
      let out = "";
      for (let i = 0; i < 13; i++) out += rect(0, i * s, w, s + 0.6, i % 2 === 0 ? "#B22234" : "#FFFFFF");
      const cw = w * 0.4, ch = 7 * s;
      out += rect(0, 0, cw, ch, "#3C3B6E");
      for (let row = 0; row < 9; row++) {
        const y = (ch * (row + 1)) / 10;
        for (let j = row % 2 === 0 ? 1 : 2; j <= 11; j += 2) out += star((cw * j) / 12, y, h * 0.0308, "#FFFFFF");
      }
      return out;
    },
  },
  {
    code: "CA", name: "Canada", the: "le Canada", of: "du Canada", cont: ["amnord"], lat: 56, lon: -106, ratio: 2, desc: "une feuille d'érable rouge au milieu", syl: ["Ca", "na", "da"], gp: ["c", "a", "n", "a", "d", "a"],
    draw: (w, h) => {
      const k = (h * 0.8) / 100;
      return rect(0, 0, w, h, "#FFFFFF") + rect(0, 0, w / 4, h, "#D80621") + rect((3 * w) / 4, 0, w / 4, h, "#D80621")
        + `<polygon transform="translate(${f2(w / 2 - 50 * k)} ${f2(h / 2 - 48 * k)}) scale(${f2(k)})" points="${leafPoints()}" fill="#D80621"/>`;
    },
  },
  {
    code: "CU", name: "Cuba", the: "Cuba", of: "de Cuba", cont: ["amnord"], lat: 21.5, lon: -78, ratio: 2, desc: "des rayures bleues et blanches, avec une étoile sur un triangle rouge", syl: ["Cu", "ba"], gp: ["c", "u", "b", "a"],
    draw: (w, h) => bandsH(["#002A8F", "#FFFFFF", "#002A8F", "#FFFFFF", "#002A8F"])(w, h)
      + `<polygon points="0,0 ${f2(h * 0.866)},${f2(h / 2)} 0,${f2(h)}" fill="#CF142B"/>` + star((h * 0.866) / 3, h / 2, h * 0.15, "#FFFFFF"),
  },
  {
    code: "PA", name: "Panama", the: "le Panama", of: "du Panama", cont: ["amnord"], lat: 8.5, lon: -80.8, ratio: 1.5, desc: "quatre carrés : deux étoiles, du rouge et du bleu", syl: ["Pa", "na", "ma"], gp: ["p", "a", "n", "a", "m", "a"],
    draw: (w, h) => rect(0, 0, w, h, "#FFFFFF") + rect(w / 2, 0, w / 2, h / 2, "#DA121A") + rect(0, h / 2, w / 2, h / 2, "#072357")
      + star(w / 4, h / 4, h * 0.12, "#072357") + star((3 * w) / 4, (3 * h) / 4, h * 0.12, "#DA121A"),
  },
  { code: "PE", name: "Pérou", the: "le Pérou", of: "du Pérou", cont: ["amsud"], lat: -9.2, lon: -75, ratio: 1.5, desc: "rouge, blanc, rouge, en bandes verticales", syl: ["Pé", "rou"], gp: ["p", "é", "r", "ou"], draw: bandsV(["#D91023", "#FFFFFF", "#D91023"]) },
  { code: "CO", name: "Colombie", the: "la Colombie", of: "de la Colombie", cont: ["amsud"], lat: 4.6, lon: -74.3, ratio: 1.5, desc: "une grande bande jaune, puis du bleu et du rouge", draw: bandsH(["#FCD116", "#003893", "#CE1126"], [2, 1, 1]) },
  {
    code: "CL", name: "Chili", the: "le Chili", of: "du Chili", cont: ["amsud"], lat: -35.7, lon: -71.5, ratio: 1.5, desc: "blanc et rouge, avec une étoile blanche sur un carré bleu", syl: ["Chi", "li"], gp: ["ch", "i", "l", "i"],
    draw: (w, h) => bandsH(["#FFFFFF", "#D52B1E"])(w, h) + rect(0, 0, h / 2, h / 2, "#0039A6") + star(h / 4, h / 4, h * 0.1, "#FFFFFF"),
  },
  { code: "PW", name: "Palaos", the: "les Palaos", of: "des Palaos", plural: true, cont: ["oceanie"], lat: 7.5, lon: 134.6, ratio: 1.6, desc: "un rond jaune sur un fond bleu ciel", draw: (w, h) => rect(0, 0, w, h, "#4AADD6") + circ(w * 0.45, h / 2, h * 0.3, "#FFDE00") },
];
export const FLAG_BY_CODE: Record<string, FlagDef> = Object.fromEntries(FLAGS.map((f) => [f.code, f]));

// Paires de drapeaux qui se ressemblent (miroir, couleurs proches, bandes tournées).
export const TWINS: [string, string][] = [
  ["IE", "CI"], ["ML", "GN"], ["ID", "PL"], ["NL", "LU"], ["FR", "NL"], ["DK", "CH"], ["SE", "FI"],
  ["SN", "ML"], ["VN", "CN"], ["JP", "BD"], ["PE", "AT"], ["BE", "DE"], ["ID", "MC"],
];

let uidCounter = 0;
export function flagSVG(code: string, label = true): string {
  const fl = FLAG_BY_CODE[code];
  const h = W / fl.ratio;
  const uid = `f${code}${++uidCounter}`;
  const aria = label ? `role="img" aria-label="Drapeau ${fl.of}"` : `aria-hidden="true"`;
  return `<svg viewBox="0 0 ${W} ${f2(h)}" ${aria} preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%">`
    + fl.draw(W, h, uid)
    + `<rect x="0.75" y="0.75" width="${W - 1.5}" height="${f2(h - 1.5)}" fill="none" stroke="#D8CDB8" stroke-width="1.5"/></svg>`;
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const isIn = (fl: FlagDef) => `${cap(fl.the)} ${fl.plural ? "sont" : "est"} en ${CONTINENTS.find((c) => c.id === fl.cont[0])!.label}.`;

// ---------- Carte du monde simplifiée (équirectangulaire, 1000 × 500) ----------
export const project = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * 1000, ((85 - lat) / 145) * 500];
type LL = [number, number];
const NA: LL[] = [[-168, 66], [-162, 70], [-150, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-92, 69], [-82, 68], [-80, 63], [-86, 58], [-92, 57], [-80, 52], [-78, 58], [-70, 60], [-62, 58], [-56, 52], [-60, 47], [-66, 44], [-70, 42], [-75, 38], [-76, 35], [-81, 31], [-80, 26], [-82, 26], [-84, 30], [-90, 30], [-97, 28], [-97, 22], [-92, 19], [-88, 21], [-87, 16], [-83, 15], [-83, 10], [-79, 9], [-78, 8], [-81, 7], [-85, 10], [-87, 13], [-92, 15], [-96, 16], [-105, 20], [-106, 23], [-110, 27], [-112, 31], [-117, 32], [-120, 34], [-123, 38], [-124, 42], [-124, 47], [-127, 50], [-132, 54], [-137, 58], [-145, 60], [-152, 59], [-158, 57], [-164, 55], [-160, 59], [-165, 62]];
const GREENLAND: LL[] = [[-55, 60], [-45, 60], [-40, 65], [-25, 70], [-20, 75], [-20, 81], [-35, 83], [-55, 82], [-65, 79], [-70, 77], [-60, 75], [-55, 70], [-52, 65]];
const CUBA: LL[] = [[-85, 21.9], [-82, 23.1], [-79, 22.6], [-75, 20.5], [-74.2, 20.1], [-77.5, 19.9], [-80.5, 21.8], [-84, 21.9]];
const SA: LL[] = [[-77, 9], [-72, 12], [-62, 11], [-55, 6], [-50, 1], [-44, -2], [-35, -6], [-39, -14], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-63, -41], [-65, -46], [-68, -51], [-70, -55], [-74, -52], [-74, -44], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, -1], [-78, 2]];
const EU: LL[] = [[-10, 36], [-9, 39], [-9, 43], [-2, 43.5], [-1, 46], [-4, 48], [-1, 49.5], [2, 51], [4, 52], [8, 54], [8, 57], [10, 59], [5, 58], [5, 62], [10, 64], [15, 68], [20, 70], [26, 71], [31, 70], [36, 69], [41, 67], [50, 68], [60, 69], [60, 55], [56, 51], [49, 46], [46, 43.5], [41.5, 41.5], [36, 41.6], [31.5, 41.2], [29, 41], [28, 43], [26, 40], [23, 40], [23, 37], [21, 38], [19, 41], [19, 42], [15, 45], [13, 45], [17, 41], [16, 38], [15.5, 38], [12, 42], [10, 44], [7, 44], [3, 43], [0, 40], [-1, 37], [-5, 36]];
const GBR: LL[] = [[-5.7, 50], [1.5, 51], [1.7, 53], [-0.2, 54.5], [-2, 56], [-1.8, 57.6], [-4, 58.6], [-6, 58.3], [-5.5, 56.5], [-6, 55.5], [-3, 54.5], [-4.5, 53.3], [-4.7, 51.7]];
const IRL: LL[] = [[-10, 51.6], [-6, 52], [-6, 54], [-8, 55.3], [-10, 54]];
const ISL: LL[] = [[-24, 64], [-22, 66], [-16, 66.5], [-13.5, 65], [-18, 63.4]];
const AF: LL[] = [[-17, 21], [-16, 26], [-13, 28], [-9, 30], [-9, 33], [-6, 35.8], [0, 35.8], [10, 37], [11, 33], [20, 31], [25, 32], [32, 31.5], [34, 28], [38, 22], [43, 12], [51, 12], [51, 10], [48, 5], [42, -1], [40, -10], [40, -15], [35, -23], [33, -27], [30, -31], [27, -33.8], [20, -35], [18, -32], [17, -29], [15, -26], [12, -17], [13, -10], [12, -5], [9, -1], [9, 4], [5, 4.5], [1, 6], [-4, 5], [-8, 4.5], [-11, 6.5], [-13, 9], [-15, 11], [-17, 14]];
const MDG: LL[] = [[49, -12], [50, -15.5], [47.5, -25], [45, -25], [43.5, -22], [44, -17], [46, -15.5]];
const AS: LL[] = [[60, 69], [70, 73], [80, 73], [90, 76], [100, 78], [112, 76], [125, 73], [140, 72], [155, 71], [170, 70], [180, 68], [180, 65], [175, 62], [165, 60], [163, 57], [156, 51], [156, 58], [150, 59.5], [142, 59], [137, 55], [141, 52.5], [140, 48], [136, 44], [131, 42.5], [129, 40], [129.5, 35.5], [126.5, 34.5], [126, 37.5], [124.5, 40], [121.5, 40.5], [122, 37], [119, 35], [121.5, 31], [119.5, 25.5], [116, 22.8], [110, 21], [108, 21.5], [106, 18.8], [108.8, 15.2], [109.2, 11.5], [105, 8.6], [103, 10.6], [100.8, 12.6], [100, 9], [103.5, 1.4], [101.3, 2.9], [98.3, 7.9], [98.6, 13.5], [97.6, 16.5], [94.3, 18.5], [92.3, 21], [89, 21.8], [87, 21], [85, 19.4], [81, 15.7], [80.2, 13], [79.8, 10], [77.5, 8], [76.3, 10], [74.5, 14], [72.8, 19], [72.5, 21.5], [70, 22.6], [67.5, 24.5], [62, 25], [57.5, 25.8], [56.5, 27], [54, 26.5], [51.5, 27.8], [50, 30], [48, 29.5], [48, 28], [50, 26], [51.5, 24.2], [54, 24], [56, 26], [57, 23.7], [59.8, 22.5], [58.5, 20.5], [55, 17], [52, 15.5], [48.5, 14], [45, 12.8], [43.3, 12.8], [42.8, 15], [41.3, 19], [39, 22], [36.6, 26], [34.8, 28], [34.5, 29.5], [35, 32], [35.7, 34], [36, 36], [32, 36.2], [29, 36.6], [27, 37], [26.3, 39.5], [26.5, 40.5], [29, 41], [31.5, 41.2], [36, 41.6], [41.5, 41.5], [46, 43.5], [49, 46], [56, 51], [60, 55]];
const JPN: LL[] = [[130, 31], [132, 34], [136, 34], [140, 35], [141.5, 38], [142, 41], [141, 43], [145, 44], [145.5, 43], [143, 42], [141.2, 41.4], [140, 39], [139.5, 36], [137, 37], [136, 35.5], [133, 35.5], [131, 34]];
const SUMATRA: LL[] = [[95.3, 5.6], [98, 4], [103.5, -1], [106, -3], [106, -6], [104, -5.5], [101, -2], [98, 1]];
const JAVA: LL[] = [[105.5, -6.5], [108, -6.3], [112, -6.8], [114.5, -7.8], [110, -8.3], [106, -7.6]];
const BORNEO: LL[] = [[109, 1.5], [111, 2], [113.5, 3.5], [116, 6.8], [119, 5.2], [118, 1], [116.5, -1.5], [116, -4], [113, -3.2], [110, -3], [109, -1]];
const SULAWESI: LL[] = [[119, -1], [121, 1], [125, 1.5], [123, -0.8], [121, -2], [122.5, -5], [120.5, -5.5], [119.5, -3]];
const PHIL: LL[] = [[120, 18.5], [122, 18.5], [124, 13], [126, 9], [126, 6.5], [123, 7], [121, 10], [120, 14]];
const NGUINEA: LL[] = [[131, -1], [135, -3.5], [138, -1.5], [141, -2.6], [145, -4], [147.5, -6], [150, -10.5], [147, -10], [143.5, -9], [141, -9], [138, -8], [137, -5], [134, -4], [132, -2.5]];
const AUS: LL[] = [[113.5, -22], [114, -26], [115, -34], [118, -35], [123, -34], [129, -31.6], [131, -31.5], [135, -34.5], [138, -35], [140, -38], [144, -38.5], [147, -38], [150, -37], [151, -34], [153, -31], [153.5, -28], [153, -25], [149, -20], [146, -18.5], [145.5, -15], [143.5, -14], [142.5, -10.7], [141.5, -13], [141.5, -17], [140, -17.5], [137, -15.5], [135.5, -14.5], [136.5, -12], [132, -11.3], [130, -13], [129, -15], [126, -14], [123, -17], [121, -19.5], [116, -20.8]];
const NZN: LL[] = [[172.7, -34.4], [174.5, -36.5], [176, -37.5], [178.5, -37.7], [177, -39.5], [175, -41.5], [174.5, -41.2], [173.8, -39.2], [174.5, -38]];
const NZS: LL[] = [[172.7, -40.5], [174.3, -41.7], [173, -43], [171.2, -44.5], [170.5, -46], [168.3, -46.6], [166.5, -46], [167, -45], [168.3, -44], [170.5, -42.8], [172, -41]];

export const CONTINENT_SHAPES: Record<ContinentId, LL[][]> = {
  amnord: [NA, GREENLAND, CUBA],
  amsud: [SA],
  europe: [EU, GBR, IRL, ISL],
  afrique: [AF, MDG],
  asie: [AS, JPN, SUMATRA, JAVA, BORNEO, SULAWESI, PHIL],
  oceanie: [AUS, NGUINEA, NZN, NZS],
};
export function continentPath(id: ContinentId) {
  return CONTINENT_SHAPES[id].map((poly) => "M" + poly.map(([lon, lat]) => project(lon, lat).map((v) => f2(v)).join(" ")).join(" L") + " Z").join(" ");
}
