// Vitrine d'Archipel 2 : page cachée (adresse …/v2/#vitrine) qui montre le système de design en taille réelle,
// pour le juger sur l'iPad : l'île des Nombres comme elle sera au pilote, les couleurs, les textes, les composants,
// les personnages et l'imagier. Rien n'y est enregistré ; elle ne sert qu'à regarder.
import { ACTIVITY_BY_ID } from "./activities/index";
import { boutonRond, bullePlume, carte, etatCarte, pastille, ruban } from "./design/composants";
import { ILES, MOUVEMENTS, NEUTRES, ORDRE_ILES, TEXTES, contraste, fontTexte } from "./design/jetons";
import { CADRE, ILES_V2, echelle, type Ile } from "./iles";
import { urlImage } from "./images";
import { IMAGIER, sansVariante } from "./imagier";
import { READ_WORDS, SOUND_WORDS } from "./lexique";
import { PERSONNAGES, type ImageCadree } from "./illustrations";
import { h, wobble } from "./ui";

const HORIZON = 236; // ligne d'horizon des décors d'île (repère 1194 x 834)
const img = (im: ImageCadree, cls = "", alt = "") => h("img", { class: cls, src: urlImage(`illustrations/${im.fichier}`), alt, draggable: "false" });
const poser = (el: HTMLElement, [x, y, l, ht]: number[], k = 1) => {
  el.style.cssText += `;position:absolute;left:${x * k}px;top:${y * k}px;width:${l * k}px;height:${ht * k}px`;
  return el;
};

// Plume en pièces : corps et ailes alignés, battement d'ailes lent et souple (le guide est l'élément le plus calme).
export function plumeAnime(echelle: number): HTMLElement {
  const corps = PERSONNAGES["plume-piece-corps"];
  const f = echelle / (corps.echelle ?? 0.9);
  const cadre = h("div", { class: "v-plume", "aria-hidden": "true" });
  for (const nom of ["piece-aile-ar", "piece-corps", "piece-aile-av"]) {
    const p = PERSONNAGES[`plume-${nom}`];
    const el = poser(img(p, nom.startsWith("piece-aile") ? "v-aile" : "v-corps"), p.boite, f);
    if (p.pivot) el.style.transformOrigin = `${p.pivot[0] * 100}% ${p.pivot[1] * 100}%`;
    cadre.appendChild(el);
  }
  return cadre;
}

// Un écran d'île : le dessin couvre l'écran (comme object-fit: cover), les étiquettes suivent leurs lieux.
export function ecranIle(ile: Ile, conseil?: string): HTMLElement {
  const q = ile.quartiers[0];
  const d = q.decor;
  const cadre = h("div", { class: "v-cadre", style: `width:${CADRE.l}px;height:${CADRE.h}px` });
  if (d) {
    cadre.appendChild(poser(img(d.base, "", `${ile.nom} : décor`), d.base.boite));
    for (const r of Object.values(d.remplissages)) cadre.appendChild(poser(img(r), r.boite));
    for (const a of Object.values(d.animes)) cadre.appendChild(poser(img(a), a.boite));
    for (const [act, l] of Object.entries(d.lieux)) cadre.appendChild(poser(img(l, "v-lieu", ACTIVITY_BY_ID[act]?.title ?? act), l.boite));
    // Plume vole près de l'activité qu'il conseille
    const [px, py] = d.plume;
    const corps = PERSONNAGES["plume-piece-corps"];
    const e = 0.58, f = e / (corps.echelle ?? 0.9);
    const [ax, ay] = [170, 160]; // point d'ancrage de Plume dans son cadre de rendu (fabriquer.py)
    const plume = plumeAnime(e);
    plume.style.cssText = `position:absolute;left:${px - ax * f}px;top:${py - ay * f}px;width:${360 * f}px;height:${300 * f}px`;
    cadre.appendChild(plume);
    const bulle = bullePlume({ queue: "gauche", onclick: () => wobble(bulle) });
    bulle.style.cssText = "position:absolute;left:820px;top:236px";
    cadre.appendChild(bulle);
  }
  for (const l of q.lieux) {
    const id = l.ids[0];
    const titre = ACTIVITY_BY_ID[id]?.title ?? id;
    const p = pastille({ titre, ile: ile.id, conseillee: id === conseil, onclick: () => wobble(p) });
    cadre.appendChild(h("div", { class: "v-ancre", style: `left:${l.pastille.x}px;top:${l.pastille.y}px` }, p));
  }
  const ecran = h("section", { class: "v-ile", "aria-label": ile.nom }, cadre,
    h("div", { class: "v-haut" },
      boutonRond({ icone: "map", etiquette: "Retour à la carte" }),
      ruban({ texte: ile.nom, ile: ile.id }),
      boutonRond({ icone: "ear", etiquette: "Écouter la consigne" })));
  const ajuster = () => {
    const k = echelle({ l: ecran.clientWidth, h: ecran.clientHeight });
    cadre.style.transform = `translate(-50%, -50%) scale(${k})`;
    // hors du dessin, le ciel et la mer continuent de part et d'autre de l'horizon
    ecran.style.setProperty("--horizon", `${(ecran.clientHeight - CADRE.h * k) / 2 + HORIZON * k}px`);
  };
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(ajuster).observe(ecran);
  requestAnimationFrame(ajuster);
  return ecran;
}

function section(titre: string, texte: string, ...enfants: (HTMLElement | null)[]) {
  return h("section", { class: "v-section" }, h("h2", null, titre), h("p", { class: "v-texte" }, texte), ...enfants);
}

function couleurs() {
  const tons = ["clair", "vif", "fonce", "ombre"] as const;
  const noms = { clair: "clair", vif: "vif", fonce: "foncé", ombre: "ombre" };
  const lignes = ORDRE_ILES.map((id) => h("div", { class: "v-ligne" },
    h("div", { class: "v-ligne-nom" }, ILES_V2[id].nom),
    ...tons.map((t) => {
      const c = ILES[id][t];
      const blanc = contraste("#FFFFFF", c), encre = contraste(NEUTRES.encre, c);
      const texte = blanc >= encre ? "#FFFFFF" : NEUTRES.encre;
      return h("div", { class: "v-nuance", style: `background:${c};color:${texte}` },
        h("b", null, noms[t]), h("span", null, c), h("span", null, `Aa ${Math.max(blanc, encre).toFixed(1).replace(".", ",")}:1`));
    })));
  const neutres = h("div", { class: "v-ligne" }, h("div", { class: "v-ligne-nom" }, "Neutres"),
    ...(["creme", "papier", "surface", "sable", "bord", "encreDouce", "encre"] as const).map((k) => {
      const c = NEUTRES[k];
      const sombre = contraste("#FFFFFF", c) > 4.5;
      return h("div", { class: "v-nuance", style: `background:${c};color:${sombre ? "#FFFFFF" : NEUTRES.encre}` }, h("b", null, k), h("span", null, c));
    }));
  return section("Couleurs", "Les sept couleurs d'îles, celles que votre fils connaît, en quatre tons : clair pour les fonds, vif pour reconnaître l'île, foncé pour un texte ou un fond de texte blanc, ombre pour les bords. Chaque texte atteint au moins 4,5 pour 1 (le chiffre indique le contraste du texte posé sur la couleur).", ...lignes, neutres);
}

function textes() {
  const exemples: Record<string, string> = {
    titreEcran: "Qui part en voyage ?", titre: "Île des Nombres", sousTitre: "Le marché de Basile", etiquette: "Les nénuphars",
    lectureGrande: "maman", lecture: "le chat est sur le lit", bulle: "Touche le nénuphar numéro 3.", adulte: "Votre enfant a joué 12 minutes aujourd'hui.", adulteTitre: "Suivi de la semaine",
  };
  return section("Textes", "Andika pour tout ce que l'enfant lit, Baloo 2 pour les titres et les étiquettes, Inter pour l'adulte. Les tailles suivent l'écran, avec un minimum sur les petits écrans.",
    ...Object.entries(TEXTES).map(([k, t]) => h("div", { class: "v-texte-ex" },
      h("div", { class: "v-texte-nom" }, k, h("small", null, ` ${t.graisse} · ${t.u} u`)),
      h("div", { style: `font:${fontTexte(t)};color:${NEUTRES.encre}` }, exemples[k] ?? k))));
}

function composants() {
  const rangee = (...e: HTMLElement[]) => h("div", { class: "v-rangee" }, ...e);
  const cartes = (["red-apple", "duck", "cat-face"] as const).map((nom, i) => {
    const im = Object.values(IMAGIER).find((x) => x.fichier === `imagier/${nom}.webp`)!;
    const c = carte({
      contenu: h("img", { src: urlImage(im.fichier), alt: "", draggable: "false" }), etiquette: im.nom, ile: "nombres",
      onclick: () => { if (i === 0) etatCarte(c, "juste"); else if (i === 1) wobble(c); else etatCarte(c, c.classList.contains("choisie") ? "normal" : "choisie"); },
    });
    return c;
  });
  return section("Composants", "Dans la finition album : papier crème, bord sable, ombre posée, lumière d'en haut à gauche. Touchez-les : la pomme est la bonne réponse (anneau vert), le canard un essai (il balance, jamais de rouge), le chat se choisit.",
    rangee(boutonRond({ icone: "home", etiquette: "Maison" }), boutonRond({ icone: "ear", etiquette: "Écouter" }), boutonRond({ icone: "map", etiquette: "Carte", taille: "grand" }),
      boutonRond({ icone: "book", etiquette: "Carnet", ile: "mots" }), boutonRond({ icone: "leaf", etiquette: "Coin calme", ile: "decouvertes", taille: "petit" })),
    rangee(pastille({ titre: "Le marché de Basile", ile: "nombres" }), pastille({ titre: "Les nénuphars", ile: "nombres", conseillee: true })),
    rangee(...ORDRE_ILES.slice(0, 4).map((id) => ruban({ texte: ILES_V2[id].nom, ile: id }))),
    rangee(...ORDRE_ILES.slice(4).map((id) => ruban({ texte: ILES_V2[id].nom, ile: id }))),
    rangee(bullePlume({}), bullePlume({ texte: "Bravo, tu as trouvé le nénuphar numéro 3 !", queue: "gauche" })),
    rangee(...cartes));
}

function personnages() {
  const hotes = ["basile", "mona", "rico", "bip", "octave", "kiki", "pico"];
  const variantes = ["salut", "content", "rieur", "surpris", "pensif", "doux"];
  const grille = h("div", { class: "v-persos" });
  for (const n of hotes) {
    grille.appendChild(h("div", { class: "v-perso-nom" }, n[0].toUpperCase() + n.slice(1)));
    for (const v of variantes) {
      const p = PERSONNAGES[`${n}-${v}`];
      grille.appendChild(h("figure", null, img(p, "", `${n}, ${v}`), h("figcaption", null, v)));
    }
  }
  const plumes = h("div", { class: "v-rangee" }, ...["vol", "salut", "montre", "pense", "fete", "vol-rieur", "vol-surpris", "vol-pensif", "vol-doux"].map((v) =>
    h("figure", { class: "v-plume-fig" }, img(PERSONNAGES[`plume-${v}`], "", `Plume, ${v}`), h("figcaption", null, v.replace("vol-", "")))));
  const vol = h("div", { class: "v-plume-vol" }, plumeAnime(1.1));
  return section("Personnages", "Plume et les hôtes des îles, redessinés en gardant leurs signes. Chacun a cinq expressions et un salut. Plume vole en trois pièces : ses ailes battent lentement, plus lentement que tout le reste de l'écran.",
    h("div", { class: "v-rangee" }, vol), plumes, grille);
}

function imagier() {
  // le mot français quand le lexique le connaît, sinon le nom de l'image d'origine (en anglais, en gris)
  const fr = new Map<string, string>();
  for (const w of SOUND_WORDS) fr.set(sansVariante(w.e), w.w);
  for (const w of READ_WORDS) fr.set(sansVariante(w.pic), w.w);
  const liste = Object.entries(IMAGIER).map(([e, im]) => ({ ...im, fr: fr.get(e) })).sort((a, b) => (a.fr ?? a.nom).localeCompare(b.fr ?? b.nom, "fr"));
  return section("Imagier", `Les ${liste.length} images d'exercice, une par emoji utilisé aujourd'hui, dans la même finition. Base : Fluent Emoji (Microsoft, licence MIT). Elles remplaceront les emoji île par île. Sous chaque image : le mot du lexique, ou en gris le nom de l'image d'origine.`,
    h("div", { class: "v-imagier" }, ...liste.map((im) => h("figure", null, h("img", { src: urlImage(im.fichier), alt: im.fr ?? im.nom, loading: "lazy", draggable: "false" }),
      h("figcaption", { class: im.fr ? "fr" : "" }, im.fr ?? im.nom)))));
}

function mouvements() {
  const d = MOUVEMENTS;
  return section("Mouvements", `Appui ${d.appui} ms, réponses ${d.court} à ${d.long} ms, changement d'écran ${d.ecran} ms ; battement d'ailes de Plume ${d.battementPlume} ms par aller. Jamais de clignotement. Le réglage « Réduire les animations » de l'iPad arrête tout.`);
}

export const VITRINE_CSS = `
.v-page{overflow-y:auto;-webkit-overflow-scrolling:touch;background:var(--creme);display:block}
.v-ile{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:linear-gradient(to bottom,#BBE9EF 0,#E1F0E8 var(--horizon,30%),#8FD7DF var(--horizon,30%),#32A6B5 100%)}
.v-cadre{position:absolute;left:50%;top:50%;transform-origin:center}
.v-cadre img{display:block;user-select:none;-webkit-user-select:none;pointer-events:none}
.v-ancre{position:absolute;transform:translate(-50%,-50%)}
.v-haut{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;padding:var(--esp-5) var(--esp-5) 0}
.v-plume img{position:absolute}
.v-aile{animation:v-battement var(--duree-battement-plume) var(--courbe-calme) infinite alternate}
.v-plume{animation:v-flotte calc(var(--duree-battement-plume) * 2) var(--courbe-calme) infinite alternate}
@keyframes v-battement{from{transform:rotate(3deg)}to{transform:rotate(-16deg)}}
@keyframes v-flotte{from{translate:0 -2px}to{translate:0 2px}}
.v-section{max-width:1100px;margin:0 auto;padding:var(--esp-7) var(--esp-6);display:flex;flex-direction:column;gap:var(--esp-4)}
.v-section h2{font:var(--texte-titre);color:var(--encre);margin:0}
.v-texte{font:var(--texte-adulte);color:var(--encre-douce);margin:0;max-width:760px}
.v-intro{font:var(--texte-adulte);color:var(--encre-douce)}
.v-ligne{display:grid;grid-template-columns:150px repeat(auto-fit,minmax(90px,1fr));gap:8px;align-items:stretch}
.v-ligne-nom{font:700 15px/1.2 var(--police-adulte);color:var(--encre);align-self:center}
.v-nuance{border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:2px;font:13px/1.3 var(--police-adulte);min-height:76px;box-shadow:var(--ombre-posee)}
.v-texte-ex{display:grid;grid-template-columns:170px 1fr;gap:16px;align-items:center;padding:8px 0;border-top:1px solid var(--trait)}
.v-texte-nom{font:600 14px/1.3 var(--police-adulte);color:var(--encre)}
.v-texte-nom small{font-weight:400;color:var(--encre-douce)}
.v-rangee{display:flex;flex-wrap:wrap;gap:var(--esp-5);align-items:center;padding:var(--esp-3) var(--esp-2)}
.v-persos{display:grid;grid-template-columns:90px repeat(6,1fr);gap:10px;align-items:end}
.v-perso-nom{font:700 16px/1.2 var(--police-titre);color:var(--encre);align-self:center}
.v-persos figure,.v-plume-fig,.v-imagier figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:4px}
.v-persos img{width:100%;height:150px;object-fit:contain}
.v-plume-fig img{height:120px;width:auto}
.v-persos figcaption,.v-plume-fig figcaption,.v-imagier figcaption{font:12px/1.2 var(--police-adulte);color:var(--encre-douce);text-align:center}
.v-plume-vol{position:relative;width:${360 * 1.1 / 0.9}px;height:${300 * 1.1 / 0.9}px}
.v-plume-vol .v-plume{position:absolute;inset:0}
.v-imagier{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:14px}
.v-imagier img{width:84px;height:84px}
.v-imagier figcaption.fr{font:600 14px/1.2 var(--police-lecture);color:var(--encre)}
.v-fin{display:flex;justify-content:center;padding:var(--esp-6) 0 var(--esp-8)}
`;

export function pageVitrine(): HTMLElement {
  if (!document.getElementById("vitrine-css")) document.head.appendChild(h("style", { id: "vitrine-css" }, VITRINE_CSS));
  const retour = h("button", { type: "button", class: "pbtn", onclick: () => { location.hash = ""; location.reload(); } }, "Revenir à l'appli");
  const page = h("div", { class: "screen v-page" },
    ecranIle(ILES_V2.nombres, "nenuphars"),
    h("section", { class: "v-section" },
      h("h2", null, "Vitrine d'Archipel 2"),
      h("p", { class: "v-texte" }, "Cette page cachée montre les fondations de la nouvelle version en taille réelle : l'île des Nombres telle qu'elle sera au pilote (au-dessus), puis les couleurs, les textes, les composants, les personnages et l'imagier. Rien n'est enregistré ; l'appli de votre fils ne change pas.")),
    couleurs(), textes(), composants(), personnages(), imagier(), mouvements(),
    h("div", { class: "v-fin" }, retour));
  return page;
}

export const estVitrine = () => location.hash === "#vitrine";
