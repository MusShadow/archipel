// Images de l'atelier d'illustration, prêtes à poser : une balise <img>, un compagnon coiffé de son chapeau.
import { chapeauDe, estCompagnon, NOM_COMPAGNON, type Compagnon } from "../compagnons";
import { ELEMENTS, PERSONNAGES, type ImageCadree } from "../illustrations";
import { urlImage } from "../images";
import { h } from "../ui";

export const image = (nom: string): ImageCadree | undefined => ELEMENTS[nom] ?? PERSONNAGES[nom];
export const srcDe = (im: ImageCadree) => urlImage(`illustrations/${im.fichier}`);
const pc = (n: number) => `${Math.round(n * 1000) / 1000}%`;

export function imgHTML(nom: string, cls = "", style = ""): string {
  const im = image(nom);
  return im ? `<img class="${cls}" src="${srcDe(im)}" alt="" draggable="false"${style ? ` style="${style}"` : ""}>` : "";
}
export function imgEl(nom: string, cls = "", alt = ""): HTMLImageElement {
  const im = image(nom);
  return h("img", { class: cls, src: im ? srcDe(im) : "", alt, draggable: "false" }) as HTMLImageElement;
}

// Livraison 4 : le « calque », une image recadrée replacée à sa place dans son cadre de rendu (le parent, positionné, a
// la forme du cadre : aspect-ratio donné par rapport()). Des calques du même cadre se superposent exactement : le fond
// et le devant du bassin, le corps et le couvercle d'une poubelle. La vignette : le cadre entier, à la même échelle
// d'une image à l'autre (les deux réponses de « Flotte ou coule ? »).
const cadreDe = (im: ImageCadree): [number, number] => im.cadre ?? [im.boite[2], im.boite[3]];
export const rapport = (nom: string) => { const im = image(nom); const [W, H] = im ? cadreDe(im) : [1, 1]; return `${W}/${H}`; };
export function calque(nom: string, cls = ""): string {
  const im = image(nom);
  if (!im) return "";
  const [W, H] = cadreDe(im), [x, y, l, ht] = im.boite;
  return `<img class="calque${cls ? ` ${cls}` : ""}" src="${srcDe(im)}" alt="" draggable="false" `
    + `style="left:${pc((x / W) * 100)};top:${pc((y / H) * 100)};width:${pc((l / W) * 100)};height:${pc((ht / H) * 100)}">`;
}
// Une image de l'atelier dans un dessin SVG (les gommettes) : son cadre de rendu posé en (x, y), à l'échelle k.
const r1 = (n: number) => Math.round(n * 10) / 10;
export function calqueSVG(nom: string, x: number, y: number, k: number): string {
  const im = image(nom);
  if (!im) return "";
  const [bx, by, bl, bh] = im.boite;
  return `<image href="${srcDe(im)}" x="${r1(x + bx * k)}" y="${r1(y + by * k)}" width="${r1(bl * k)}" height="${r1(bh * k)}" preserveAspectRatio="none"/>`;
}
// Livraison 4 bis : les dessins au trait des jeux, repeints par l'atelier (scripts/illustration/pictos.py). Chacun est
// un carré de 100 dont le cadre déborde de 5 de chaque côté. L'image se pose dans un SVG de 100 × 100, comme l'ancien
// dessin : même boîte, même centrage dans une boîte qui n'est pas carrée, et ce qui dépasse (une fumée) reste visible.
export const picto = (nom: string, cls = "") =>
  image(nom) ? `<svg class="picto${cls ? ` ${cls}` : ""}" viewBox="0 0 100 100" aria-hidden="true" `
    + `style="display:block;width:100%;height:100%;overflow:visible">${calqueSVG(nom, -5, -5, 1)}</svg>` : "";
// Le même dans un dessin SVG (les gommettes) : le carré de 100 posé en (x, y), à l'échelle k.
export const pictoSVG = (nom: string, x: number, y: number, k: number) => calqueSVG(nom, x - 5 * k, y - 5 * k, k);
export const vignette = (nom: string, cls = "") =>
  `<span class="vignette${cls ? ` ${cls}` : ""}" style="aspect-ratio:${rapport(nom)}" aria-hidden="true">${calque(nom)}</span>`;

// Un compagnon dans son cercle (la bague prend la couleur de l'enfant) ; le chapeau et les oreilles peuvent dépasser.
// Les positions sont en pourcentage du cercle : l'avatar garde ses proportions à toutes les tailles.
export function compagnonHTML(animal: string | undefined, couleur: string): string {
  const a: Compagnon = estCompagnon(animal) ? animal : "renard";
  const im = ELEMENTS[`accueil/compagnon-${a}`], ch = ELEMENTS[`accueil/chapeau-${chapeauDe(couleur)}`];
  if (!im || !ch || !im.points || !ch.points || !im.infos || !ch.infos) return "";
  const [bx, by, bw, bh] = im.boite;
  const r = Number(im.infos.rayon);
  const [dx, dy] = im.points.disque;
  const X0 = bx + dx * bw - r, Y0 = by + dy * bh - r, D = 2 * r;
  const [hbx, hby, hbw, hbh] = ch.boite;
  void hbx; void hby;
  const s = Number(im.infos.chapeauLargeur) / Number(ch.infos.largeur);
  const [fx, fy] = ch.points.base;
  const [px, py] = im.points.chapeau;
  const ax = bx + px * bw, ay = by + py * bh;
  const hl = ax - fx * hbw * s, ht = ay - fy * hbh * s;
  return `<span class="compagnon" style="--bague:${couleur}" data-compagnon="${a}">`
    + `<img class="cp-animal" src="${srcDe(im)}" alt="" draggable="false" style="left:${pc(((bx - X0) / D) * 100)};top:${pc(((by - Y0) / D) * 100)};width:${pc((bw / D) * 100)};height:${pc((bh / D) * 100)}">`
    + `<img class="cp-chapeau" src="${srcDe(ch)}" alt="" draggable="false" style="left:${pc(((hl - X0) / D) * 100)};top:${pc(((ht - Y0) / D) * 100)};width:${pc(((hbw * s) / D) * 100)};height:${pc(((hbh * s) / D) * 100)};transform-origin:${pc(fx * 100)} ${pc(fy * 100)};transform:rotate(${Number(im.infos.chapeauAngle)}deg)">`
    + `</span>`;
}
export const nomCompagnon = (animal: string | undefined) => NOM_COMPAGNON[estCompagnon(animal) ? animal : "renard"];

export const DESSINS_CSS = `
.medaillon{position:relative;display:block;width:100%;height:100%;border-radius:50%;overflow:hidden;box-shadow:inset 0 -3px 0 rgba(39,48,67,.06)}
.medaillon img{position:absolute;display:block;max-width:none;pointer-events:none;user-select:none;-webkit-user-select:none}
.medaillon.anneau::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 max(3px,calc(var(--u) * 5)) #FFFFFF;pointer-events:none}
.compagnon{position:relative;display:block;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 38% 30%,#FFFFFF 0%,var(--creme) 60%,#F6E8CF 100%);
box-shadow:inset 0 0 0 max(3px,calc(var(--u) * 6)) var(--bague,var(--bord)),var(--ombre-posee)}
.compagnon img{position:absolute;display:block;max-width:none;pointer-events:none;user-select:none;-webkit-user-select:none}
.compagnon::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 max(3px,calc(var(--u) * 6)) var(--bague,var(--bord));clip-path:inset(52% 0 0 0);pointer-events:none}
`;
