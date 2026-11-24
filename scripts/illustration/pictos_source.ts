// Livraison 4 bis : les dessins au trait de l'appli, tels qu'elle les écrit (src/activities/*_art.ts, les mots du jeu
// des syllabes sans emoji, src/flags.ts),
// pour que l'atelier les repeigne dans la finition album (scripts/illustration/pictos.py). Le contenu de chaque image
// ne change pas : seule sa matière change.
// Usage : bun scripts/illustration/pictos_source.ts <sortie.json>
import { writeFileSync } from "node:fs";
import { ART } from "../../src/activities/goutte_art";
import { DART, RUE, rueTrace } from "../../src/activities/dechets_art";
import { TART } from "../../src/activities/tri_art";
import { VART } from "../../src/activities/volcan_art";
import { PICTO } from "../../src/activities/syllabes";
import { CONTINENTS, continentPath } from "../../src/flags";

interface Source { svg: string; vb: [number, number, number, number]; S: number; cacher?: string[]; seul?: string }
const out: Record<string, Source> = {};
// Une image de 100 × 100, et une marge de 5 tout autour (certains dessins débordent un peu de leur carré).
const carre = (corps: string): Source => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 110 110">${corps}</svg>`, vb: [-5, -5, 110, 110], S: 3 });
for (const [id, corps] of Object.entries(ART)) out[`goutte/${id}`] = carre(corps);
for (const [id, corps] of Object.entries(DART)) out[`dechets/${id}`] = carre(corps);
for (const [id, corps] of Object.entries(TART)) out[`tri/${id}`] = carre(corps);
for (const [id, corps] of Object.entries(VART)) out[`volcan/${id}`] = carre(corps);
// les mots du jeu des syllabes qui n'ont pas d'image dans l'imagier (pas d'emoji pour eux)
for (const id of ["tipi", "domino"]) out[`mots/${id}`] = carre(PICTO[id]);

// La rue du camion poubelle, en trois calques du même cadre : le fond (avec un ciel et deux nuages, qui ne sont que
// dans le dessin peint), le camion (il repart), l'éboueur.
const rue = rueTrace().replace(/<svg [^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RUE.w} ${RUE.h}">`);
const ciel = `<g class="dciel"><rect x="0" y="0" width="${RUE.w}" height="114" fill="#DDF1FA"/>`
  + `<path d="M222 30 H262 A10 10 0 0 0 260 12 A14 14 0 0 0 236 11 A11 11 0 0 0 222 30 Z" fill="#FFFFFF"/>`
  + `<path d="M58 24 H88 A8 8 0 0 0 86 10 A11 11 0 0 0 68 9 A9 9 0 0 0 58 24 Z" fill="#FFFFFF"/>`
  + `<path d="M118 112 V86" stroke="#7A5A3A" stroke-width="4"/><circle cx="118" cy="78" r="13" fill="#7CC26A"/><circle cx="110" cy="86" r="9" fill="#6BB45B"/><circle cx="127" cy="85" r="9" fill="#6BB45B"/></g>`;
const fond = rue.replace('<g class="dfond">', `${ciel}<g class="dfond">`);
out["dechets/rue-fond"] = { svg: fond, vb: [0, 0, RUE.w, RUE.h], S: 5, cacher: [".dtruck", ".deboueur", ".dlift"] };
out["dechets/rue-camion"] = { svg: rue, vb: [0, 0, RUE.w, RUE.h], S: 5, seul: ".dtruck" };
out["dechets/rue-eboueur"] = { svg: rue, vb: [0, 0, RUE.w, RUE.h], S: 5, seul: ".deboueur" };

// La carte du monde du Port : la mer, quelques vagues (seulement dans le dessin peint), les continents et leur côte.
const vagues = [[90, 330], [160, 420], [380, 300], [430, 455], [700, 440], [760, 330], [930, 250], [240, 190], [620, 30], [860, 470]]
  .map(([x, y]) => `<path d="M${x - 16} ${y} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`).join("");
const continents = CONTINENTS.map((c) => `<path d="${continentPath(c.id)}" fill="${c.color}" stroke="#FFF6E2" stroke-width="3.5" stroke-linejoin="round"/>`).join("");
out["monde/carte"] = { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500"><rect width="1000" height="500" rx="24" fill="#9FD9E6"/>${vagues}${continents}</svg>`, vb: [0, 0, 1000, 500], S: 2 };

writeFileSync(process.argv[2] ?? "/dev/stdout", JSON.stringify(out));
console.error(`${Object.keys(out).length} dessins`);
