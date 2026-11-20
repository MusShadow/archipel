// Carnet d'explorateur (livraison 3) : un vrai carnet qu'on feuillette. La couverture, puis les pages des gommettes,
// des dessins et du passeport ; deux pages côte à côte en paysage, une seule en portrait. On tourne les pages avec
// les flèches ou d'un glissement du doigt ; les onglets mènent droit à une rubrique.
import { stickerArt } from "../activities";
import { app } from "../app";
import { DRAWING_BY_ID } from "../drawings";
import { FLAG_BY_CODE, cap, flagSVG } from "../flags";
import { sfx, speech } from "../services";
import { h, portraitHTML, wobble } from "../ui";
import { boutonRond, ruban } from "../design/composants";
import { compagnonHTML } from "../design/dessins";
import { gallery, showDrawing } from "./draw";
import { myFlagSVG } from "./myflag";

type Rubrique = "couverture" | "gommettes" | "dessins" | "passeport";
interface Page { rubrique: Rubrique; contenu: HTMLElement }

// Ce qui tient sur une page : neuf gommettes, quatre dessins, six drapeaux.
const PAR_PAGE: Record<Exclude<Rubrique, "couverture">, number> = { gommettes: 9, dessins: 4, passeport: 6 };
const TITRES: Record<Rubrique, string> = { couverture: "", gommettes: "Mes gommettes", dessins: "Mes dessins", passeport: "Mon passeport" };
// Ce que Plume dit en arrivant sur une rubrique (une fois par visite).
export const PAROLES_CARNET: Record<Exclude<Rubrique, "couverture">, string> = {
  gommettes: "Tes gommettes. Touche une gommette pour savoir pourquoi tu l'as gagnée.",
  dessins: "Tes dessins. Touche un dessin pour le regarder en grand.",
  passeport: "Ton passeport : les drapeaux que tu as découverts. Touche un drapeau pour entendre son nom.",
};
// Ce que montre (et dit) une rubrique encore vide : l'enfant ne lit pas, Plume le lui dit.
export const VIDES_CARNET: Record<Exclude<Rubrique, "couverture">, string> = {
  gommettes: "Ton carnet attend ses premières gommettes !",
  dessins: "Va sur l'île de l'Atelier pour dessiner avec Kiki.",
  passeport: "Va au Port des Voyages pour découvrir tes premiers drapeaux.",
};
const paquets = <T,>(liste: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < liste.length; i += n) out.push(liste.slice(i, i + n));
  return out.length ? out : [[]];
};
// Une gommette n'est jamais collée tout à fait droite : un petit angle, toujours le même pour la même case.
const angle = (i: number) => ((i * 37) % 9) - 4;

export function carnetScreen(back: () => void) {
  const p = app.profile!;
  const pages: Page[] = [];
  const stickers = p.stickers.slice().reverse();
  const dessins = gallery.list(p.id).slice().reverse();
  const drapeaux = Object.entries(p.flags).filter(([c, s]) => s.seen > 0 && FLAG_BY_CODE[c]).sort((a, b) => b[1].last - a[1].last).map(([c]) => c);
  let ecran: HTMLElement;

  // ---------- couverture : le compagnon, le prénom, le drapeau de son île, ce que contient le carnet
  {
    const compteur = (html: string, n: number, etiquette: string) =>
      h("span", { class: "cn-compte", "aria-label": `${n} ${etiquette}` }, h("span", { class: "cn-compte-img", html }), h("b", {}, String(n)));
    const monDrapeau = p.myFlag ? h("button", { type: "button", class: "cn-mondrapeau", "aria-label": "Le drapeau de mon île", html: myFlagSVG(p.myFlag) }) : null;
    monDrapeau?.addEventListener("click", () => { sfx.tap(); wobble(monDrapeau); speech.say(`Le drapeau de l'île de ${p.name} !`); });
    pages.push({ rubrique: "couverture", contenu: h("div", { class: "cn-couverture" },
      h("div", { class: "cn-titre" }, "Carnet d'explorateur"),
      h("div", { class: "cn-avatar", html: compagnonHTML(p.avatar, p.color) }),
      h("div", { class: "cn-nom" }, p.name),
      monDrapeau,
      h("div", { class: "cn-comptes" },
        compteur(stickers[0] ? stickerArt(stickers[0].kind, stickers[0].ref) : "", stickers.length, stickers.length > 1 ? "gommettes" : "gommette"),
        compteur(portraitHTML("kiki"), dessins.length, dessins.length > 1 ? "dessins" : "dessin"),
        compteur(drapeaux[0] ? flagSVG(drapeaux[0], false) : "", drapeaux.length, drapeaux.length > 1 ? "drapeaux" : "drapeau"))) });
  }
  // ---------- gommettes : neuf par page, collées de travers
  paquets(stickers, PAR_PAGE.gommettes).forEach((paquet, k) => {
    const grille = h("div", { class: "cn-gommettes" });
    paquet.forEach((st, i) => {
      const b = h("button", { type: "button", class: "cn-gommette", "aria-label": st.reason, style: `--angle:${angle(k * 9 + i)}deg`, html: stickerArt(st.kind, st.ref) });
      b.addEventListener("click", () => { sfx.tap(); wobble(b); speech.say(st.reason); });
      grille.appendChild(b);
    });
    pages.push({ rubrique: "gommettes", contenu: paquet.length ? grille : vide(portraitHTML("plume"), VIDES_CARNET.gommettes) });
  });
  // ---------- dessins : quatre par page, comme des photos scotchées
  paquets(dessins, PAR_PAGE.dessins).forEach((paquet, k) => {
    const grille = h("div", { class: "cn-dessins" });
    paquet.forEach((g, i) => {
      const b = h("button", { type: "button", class: "cn-dessin", style: `--angle:${angle(k * 4 + i + 3) * 0.6}deg`, "aria-label": DRAWING_BY_ID[g.id]?.nom ?? "Dessin au miroir" },
        h("img", { src: g.img, alt: "" }), h("span", { class: "cn-scotch", "aria-hidden": "true" }));
      b.addEventListener("click", () => { sfx.tap(); showDrawing(ecran, g); });
      grille.appendChild(b);
    });
    pages.push({ rubrique: "dessins", contenu: paquet.length ? grille : vide(portraitHTML("kiki"), VIDES_CARNET.dessins) });
  });
  // ---------- passeport : six drapeaux par page, comme des tampons
  paquets(drapeaux, PAR_PAGE.passeport).forEach((paquet, k) => {
    const grille = h("div", { class: "cn-passeport" });
    paquet.forEach((code, i) => {
      const fl = FLAG_BY_CODE[code];
      const b = h("button", { type: "button", class: "cn-tampon", style: `--angle:${angle(k * 6 + i + 5) * 0.5}deg`, "aria-label": fl.name },
        h("span", { class: "cn-fl", html: flagSVG(code, false) }), h("span", { class: "cn-flnom" }, fl.name));
      b.addEventListener("click", () => { sfx.tap(); wobble(b); speech.say(cap(fl.the)); });
      grille.appendChild(b);
    });
    pages.push({ rubrique: "passeport", contenu: paquet.length ? grille : vide(portraitHTML("plume"), VIDES_CARNET.passeport) });
  });
  function vide(image: string, texte: string) {
    return h("div", { class: "cn-vide" }, h("span", { class: "cn-vide-img", html: image }), h("p", {}, texte));
  }

  // ---------- le carnet ouvert : une double page (paysage) ou une page (portrait)
  const livre = h("div", { class: "cn-livre" });
  const prec = boutonRond({ icone: "back", etiquette: "Page précédente", onclick: () => tourner(-1) });
  const suiv = boutonRond({ icone: "arrow", etiquette: "Page suivante", onclick: () => tourner(1) });
  prec.classList.add("cn-tourner", "prec");
  suiv.classList.add("cn-tourner", "suiv");
  const onglets = (["gommettes", "dessins", "passeport"] as const).map((r) => {
    const image = r === "gommettes" ? (stickers[0] ? stickerArt(stickers[0].kind, stickers[0].ref) : portraitHTML("plume")) : r === "dessins" ? portraitHTML("kiki") : (drapeaux[0] ? flagSVG(drapeaux[0], false) : portraitHTML("plume"));
    const b = h("button", { type: "button", class: `cn-onglet o-${r}`, "aria-label": TITRES[r], "data-rubrique": r },
      h("span", { class: "cn-onglet-img", html: image }), h("span", { class: "cn-onglet-txt" }, TITRES[r]));
    b.addEventListener("click", () => { sfx.tap(); aller(pages.findIndex((pg) => pg.rubrique === r)); });
    return b;
  });
  const portrait = () => window.innerHeight > window.innerWidth * 1.1;
  let debut = 0; // première page affichée
  const parVue = () => (portrait() ? 1 : 2);
  // Plume nomme chaque rubrique qui apparaît (une fois par visite), ou dit ce qu'il faut faire quand elle est vide ;
  // sur une double page, les deux, l'une après l'autre. Une nouvelle page ou un autre écran coupe la suite.
  const dejaDit = new Set<Rubrique>();
  const vides: Record<Exclude<Rubrique, "couverture">, boolean> = { gommettes: !stickers.length, dessins: !dessins.length, passeport: !drapeaux.length };
  let parole = 0;
  const dire = (phrases: string[]) => {
    const mien = ++parole;
    phrases.reduce<Promise<unknown>>((suite, t) => suite.then(() => (mien === parole && ecran.isConnected ? speech.say(t) : undefined)), Promise.resolve());
  };
  const nouvelles = (vues: Page[]) => {
    const out: string[] = [];
    for (const r of vues.map((v) => v.rubrique)) {
      if (r === "couverture" || dejaDit.has(r)) continue;
      dejaDit.add(r);
      out.push(vides[r] ? VIDES_CARNET[r] : PAROLES_CARNET[r]);
    }
    return out;
  };
  function afficher(sens = 0) {
    const n = parVue();
    debut = Math.max(0, Math.min(debut - (debut % n), pages.length - 1));
    const vues = pages.slice(debut, debut + n);
    livre.classList.toggle("double", n === 2);
    livre.replaceChildren(...vues.map((pg, i) => {
      const num = debut + i;
      return h("section", { class: `cn-page ${n === 2 ? (i === 0 ? "gauche" : "droite") : "seule"} r-${pg.rubrique}`, "aria-label": pg.rubrique === "couverture" ? "Couverture" : TITRES[pg.rubrique] },
        pg.rubrique !== "couverture" ? h("h2", { class: "cn-entete" }, TITRES[pg.rubrique]) : null,
        pg.contenu,
        h("span", { class: "cn-num", "aria-hidden": "true" }, String(num + 1)));
    }), n === 2 ? h("span", { class: "cn-reliure", "aria-hidden": "true" }) : "");
    if (n === 2 && vues.length === 1) livre.appendChild(h("section", { class: "cn-page droite blanche", "aria-hidden": "true" }));
    prec.style.visibility = debut > 0 ? "visible" : "hidden";
    suiv.style.visibility = debut + n < pages.length ? "visible" : "hidden";
    const visibles = new Set(vues.map((v) => v.rubrique));
    for (const o of onglets) o.classList.toggle("actif", visibles.has(o.dataset.rubrique as Rubrique));
    if (sens) {
      livre.classList.remove("tourne-avant", "tourne-arriere");
      void livre.offsetWidth; // relance l'animation
      livre.classList.add(sens > 0 ? "tourne-avant" : "tourne-arriere");
      const aDire = nouvelles(vues);
      if (aDire.length) dire(aDire);
    }
  }
  function tourner(d: number) {
    const n = parVue();
    const cible = debut + d * n;
    if (cible < 0 || cible >= pages.length) return;
    sfx.tap();
    debut = cible;
    afficher(d);
  }
  function aller(i: number) {
    if (i < 0) return;
    const n = parVue();
    const cible = i - (i % n);
    const d = Math.sign(cible - debut);
    debut = cible;
    afficher(d || 1);
  }
  // glisser le doigt pour tourner la page (un simple toucher reste un toucher)
  let x0: number | null = null;
  livre.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  livre.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 60) tourner(dx < 0 ? 1 : -1);
  });
  livre.addEventListener("pointercancel", () => { x0 = null; });

  ecran = h("div", { class: "screen carnet2" },
    h("div", { class: "top" },
      boutonRond({ icone: "map", etiquette: "Retour à la carte", onclick: () => back() }),
      ruban({ texte: "Mon carnet d'explorateur", ile: "port" }),
      h("div", { style: "width:var(--btn)" })),
    h("div", { class: "cn-onglets" }, ...onglets),
    h("div", { class: "cn-table" }, prec, livre, suiv));
  let orientation = portrait();
  const surRedim = () => { if (portrait() !== orientation) { orientation = portrait(); afficher(); } };
  window.addEventListener("resize", surRedim);
  afficher();
  app.show(ecran, () => window.removeEventListener("resize", surRedim));
  // à l'ouverture : en paysage, la couverture et la première page des gommettes ; en portrait, la couverture seule
  if (parVue() === 2 && stickers.length) { dejaDit.add("gommettes"); dire(["Voici ton carnet. Touche une gommette pour savoir pourquoi tu l'as gagnée."]); }
  else dire(["Voici ton carnet d'explorateur.", ...nouvelles(pages.slice(debut, debut + parVue()))]);
}
