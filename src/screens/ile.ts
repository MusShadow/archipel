// Écran d'une île dessinée (livraison 2) : le décor couvre l'écran, chaque lieu ouvre son activité, l'étiquette du
// lieu (pastille) est posée par-dessus à sa taille réelle, Plume vole près de l'activité qu'elle conseille.
// Utilisé par l'appli (île des Nombres) et par la vitrine. Le modèle des îles est dans src/iles.ts.
import { ACTIVITY_BY_ID } from "../activities/index";
import { boutonRond, bullePlume, pastille, ruban } from "../design/composants";
import type { IleId } from "../design/jetons";
import { CADRE, echelle, versEcran, type Ile, type Point } from "../iles";
import { urlImage } from "../images";
import { PERSONNAGES, type Boite, type ImageCadree } from "../illustrations";
import { h, wobble } from "../ui";

export const imgIllustration = (im: ImageCadree, cls = "", alt = "") =>
  h("img", { class: cls, src: urlImage(`illustrations/${im.fichier}`), alt, draggable: "false" }) as HTMLImageElement;
const poser = (el: HTMLElement, [x, y, l, ht]: number[], k = 1) => {
  el.style.cssText += `;position:absolute;left:${x * k}px;top:${y * k}px;width:${l * k}px;height:${ht * k}px`;
  return el;
};

// Plume en pièces : corps et ailes alignés, battement d'ailes lent et souple (le guide est l'élément le plus calme).
// echelle : taille de Plume (0,58 sur une île) ; le cadre rendu fait 360 x 300 à l'échelle 0,9, ancré en (170, 160).
export const PLUME_CADRE = { l: 360, h: 300, ax: 170, ay: 160 } as const;
const PLUME_ECHELLE = 0.58; // taille de Plume sur une île
const F = PLUME_ECHELLE / 0.9; // le cadre de rendu de Plume est à l'échelle 0,9
export function plumeAnime(_echelle?: number): HTMLElement {
  // Pièces placées en pourcentage du cadre de rendu de Plume : la taille vient du conteneur (ou du style posé par
  // l'appelant), à n'importe quelle échelle.
  const cadre = h("div", { class: "plume-vol", "aria-hidden": "true" });
  for (const nom of ["piece-aile-ar", "piece-corps", "piece-aile-av"]) {
    const p = PERSONNAGES[`plume-${nom}`];
    const [x, y, l, ht] = p.boite;
    const el = imgIllustration(p, nom.startsWith("piece-aile") ? "plume-aile" : "plume-corps");
    el.style.cssText = `position:absolute;left:${(x / PLUME_CADRE.l) * 100}%;top:${(y / PLUME_CADRE.h) * 100}%;width:${(l / PLUME_CADRE.l) * 100}%;height:${(ht / PLUME_CADRE.h) * 100}%`;
    if (p.pivot) el.style.transformOrigin = `${p.pivot[0] * 100}% ${p.pivot[1] * 100}%`;
    cadre.appendChild(el);
  }
  return cadre;
}

// Où Plume vole pour conseiller un lieu : à sa gauche, un peu au-dessus, tournée vers lui.
export function pointPlume(boite: Boite | undefined, defaut: [number, number]): Point {
  if (!boite) return { x: defaut[0], y: defaut[1] };
  const [x, y] = boite;
  return { x: Math.min(CADRE.l - 160, Math.max(110, x + 30)), y: Math.min(CADRE.h - 220, Math.max(160, y + 12)) };
}

// Ce que dit Plume en arrivant sur une île dessinée (avant de présenter les lieux et de donner son conseil).
const BIENVENUE: Record<IleId, string> = {
  nombres: "Bienvenue sur l'île des Nombres !", mots: "Bienvenue sur l'île des Mots !", port: "Bienvenue au Port des Voyages !",
  enigmes: "Bienvenue sur l'île des Énigmes !", decouvertes: "Bienvenue sur l'île des Découvertes !", atelier: "Bienvenue sur l'île de l'Atelier !",
  coeur: "Bienvenue sur l'île du Cœur !",
};
const HOTE_PARLE: Partial<Record<IleId, string>> = { nombres: "Basile", mots: "Mona", enigmes: "Rico", decouvertes: "Octave", atelier: "Kiki", coeur: "Pico" };
export const bienvenueIle = (id: IleId): string[] => [BIENVENUE[id], ...(HOTE_PARLE[id] ? [`${HOTE_PARLE[id]} te fait coucou !`] : [])];

export interface OptionsIle {
  conseil?: string; // lieu conseillé par Plume
  disponible?: (id: string) => boolean; // un lieu fermé garde son étiquette, avec un cadenas
  onLieu?: (id: string, el: HTMLElement) => void;
  onRetour?: () => void;
  onEcoute?: () => void;
  onPlume?: () => void;
}

export function ecranIle(ile: Ile, o: OptionsIle = {}): { el: HTMLElement; ajuster: () => void } {
  const q = ile.quartiers[0];
  const d = q.decor;
  const cadre = h("div", { class: "ile-cadre", style: `width:${CADRE.l}px;height:${CADRE.h}px` });
  const dessus = h("div", { class: "ile-dessus" });
  const ancres: { el: HTMLElement; p: Point }[] = [];
  const ancrer = (el: HTMLElement, p: Point) => { const a = h("div", { class: "ile-ancre" }, el); dessus.appendChild(a); ancres.push({ el: a, p }); };
  let pp: Point | null = null, plume: HTMLElement | null = null, bulleAncre: HTMLElement | null = null;
  const toucher = (id: string, el: HTMLElement) => { if (o.onLieu) o.onLieu(id, el); else wobble(el); };
  if (d) {
    cadre.appendChild(poser(imgIllustration(d.base, "ile-base", ""), d.base.boite));
    for (const [e, r] of Object.entries(d.remplissages)) if (!q.lieux.some((l) => l.emplacement === e)) cadre.appendChild(poser(imgIllustration(r), r.boite));
    for (const a of Object.values(d.animes)) cadre.appendChild(poser(imgIllustration(a), a.boite));
    for (const l of q.lieux) {
      const id = l.ids[0];
      const im = d.lieux[id];
      if (!im) continue;
      // le lieu dessiné se touche aussi : c'est la plus grande cible de l'écran
      const lieu = poser(imgIllustration(im, "ile-lieu", ""), im.boite);
      lieu.dataset.lieu = id;
      lieu.addEventListener("click", () => toucher(id, lieu));
      cadre.appendChild(lieu);
    }
    const conseil = o.conseil ? d.lieux[o.conseil]?.boite : undefined;
    pp = pointPlume(conseil, d.plume);
    plume = plumeAnime(PLUME_ECHELLE);
    plume.style.cssText = `position:absolute;left:${pp.x - PLUME_CADRE.ax * F}px;top:${pp.y - PLUME_CADRE.ay * F}px;width:${PLUME_CADRE.l * F}px;height:${PLUME_CADRE.h * F}px`;
    cadre.appendChild(plume);
    const bulle = bullePlume({ queue: "gauche", onclick: () => (o.onPlume ? o.onPlume() : wobble(bulle)) });
    bulleAncre = h("div", { class: "ile-ancre" }, bulle);
    dessus.appendChild(bulleAncre);
  }
  for (const l of q.lieux) {
    const id = l.ids[0];
    const titre = ACTIVITY_BY_ID[id]?.title ?? id;
    const ouvert = o.disponible ? o.disponible(id) : true;
    const p = pastille({ titre, ile: ile.id, conseillee: id === o.conseil && ouvert, onclick: () => toucher(id, p) });
    p.dataset.act = id;
    if (!ouvert) { p.classList.add("fermee"); p.setAttribute("aria-label", `${titre}, pas encore ouverte`); }
    ancrer(p, l.pastille);
  }
  const ecran = h("section", { class: "ile-ecran", "aria-label": ile.nom }, cadre, dessus,
    h("div", { class: "ile-haut" },
      boutonRond({ icone: "map", etiquette: "Retour à la carte", onclick: o.onRetour }),
      ruban({ texte: ile.nom, ile: ile.id }),
      boutonRond({ icone: "ear", etiquette: "Écouter la consigne", onclick: o.onEcoute })));
  const ajuster = () => {
    const taille = { l: ecran.clientWidth, h: ecran.clientHeight };
    if (!taille.l || !taille.h) return;
    const k = echelle(taille);
    cadre.style.transform = `translate(-50%, -50%) scale(${k})`;
    for (const { el, p } of ancres) {
      const e = versEcran(p, taille);
      el.style.left = `${e.x}px`;
      el.style.top = `${e.y}px`;
    }
    // Plume et sa bulle restent dans la partie visible du dessin (portrait : le dessin est rogné sur les côtés)
    if (pp && plume && bulleAncre) {
      const gauche = (taille.l - CADRE.l * k) / 2;
      const x0 = Math.max(0, -gauche / k) + 6, x1 = Math.min(CADRE.l, (taille.l - gauche) / k) - 6;
      const ax = PLUME_CADRE.ax * F, w = PLUME_CADRE.l * F;
      const px = Math.min(Math.max(pp.x, x0 + ax), x1 - (w - ax));
      plume.style.left = `${px - ax}px`;
      const e = versEcran({ x: px + 132, y: pp.y - 64 }, taille);
      const demi = (bulleAncre.offsetWidth || 90) / 2 + 8;
      bulleAncre.style.left = `${Math.min(Math.max(e.x, demi), taille.l - demi)}px`;
      bulleAncre.style.top = `${e.y}px`;
    }
    // hors du dessin, le ciel et la mer continuent avec les couleurs de ses bords : aucun raccord visible
    const haut = (taille.h - CADRE.h * k) / 2;
    ecran.style.setProperty("--haut", `${haut}px`);
    ecran.style.setProperty("--bas", `${haut + CADRE.h * k}px`);
  };
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(ajuster).observe(ecran);
  requestAnimationFrame(ajuster);
  return { el: ecran, ajuster };
}

export const ILE_CSS = `
.ile-ecran{position:relative;width:100%;height:100%;overflow:hidden;background:linear-gradient(to bottom,#A9DFEC 0,#BBE9EF var(--haut,0px),#31A6B5 var(--bas,100%),#2A9AAD 100%)}
.ile-cadre img.ile-base{-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 14px,#000 calc(100% - 14px),transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 14px,#000 calc(100% - 14px),transparent 100%)}
.ile-cadre{position:absolute;left:50%;top:50%;transform-origin:center}
.ile-cadre img{display:block;user-select:none;-webkit-user-select:none;pointer-events:none}
.ile-cadre img.ile-lieu{pointer-events:auto;cursor:pointer}
.ile-dessus{position:absolute;inset:0;pointer-events:none}
.ile-ancre{position:absolute;transform:translate(-50%,-50%);pointer-events:auto}
.ile-haut{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;padding:var(--esp-5) var(--esp-5) 0}
.a-pastille.fermee{opacity:.72}
.ile-ecran .a-pastille.saying{box-shadow:0 0 0 var(--esp-2) rgba(255,193,69,.75),var(--ombre-posee);transform:scale(1.06)}
.ile-cadre img.ile-lieu{transition:transform var(--duree-moyen) var(--courbe-rebond),filter var(--duree-appui);transform-origin:50% 90%}
.ile-cadre img.ile-lieu:active{transform:scale(.98);filter:brightness(1.06);transition-duration:var(--duree-appui)}
.plume-vol{position:absolute;inset:0;pointer-events:none}
.plume-vol img{position:absolute}
.plume-aile{animation:plume-battement var(--duree-battement-plume) var(--courbe-calme) infinite alternate}
.plume-vol{animation:plume-flotte calc(var(--duree-battement-plume) * 2) var(--courbe-calme) infinite alternate}
@keyframes plume-battement{from{transform:rotate(3deg)}to{transform:rotate(-16deg)}}
@keyframes plume-flotte{from{translate:0 -2px}to{translate:0 2px}}
`;
