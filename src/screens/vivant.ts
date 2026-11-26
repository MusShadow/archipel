// Décor vivant des îles (livraison 4). Chaque île dessinée est livrée en calques (atelier : scripts/illustration/vivant.py
// et fabriquer.py) ; ici, on les pose et on les anime.
// - En continu et discret : les reflets de la mer ondulent, des étincelles s'allument, les nuages dérivent, la fumée du
//   volcan monte, les palmes se balancent, le bateau tangue, deux papillons volettent, l'hôte respire et cligne des yeux ;
//   Basile salue une fois, à l'arrivée.
// - Des surprises rares, une à la fois, toutes les 20 à 60 secondes : le dauphin, la baleine au loin, les oiseaux, et celle
//   de l'île (le poisson de l'étang et le saut de la grenouille, le souffle de Mona, le ballon de Rico, la grosse bouffée
//   du volcan, l'arc-en-ciel, les cœurs de Pico, le voilier du Port).
// - Le décor répond au toucher : l'hôte sautille, le palmier se secoue, le bateau tangue. Ce qui est posé sur un lieu (la
//   grenouille sur l'étang, la fumée au-dessus du petit volcan) ouvre ce lieu, comme le reste de son dessin.
// Garde-fous : Plume reste l'élément le plus calme (tout ce qui bouge en continu va moins vite qu'elle ; seules les
// surprises, courtes et rares, sont plus vives) ; aucune surprise pendant que Plume parle, et celle qui joue s'efface dès
// qu'elle prend la parole ; avec « Réduire les animations », le décor reste immobile et il n'y a pas de surprise ; quand
// l'appli passe en arrière-plan, tout se fige, la surprise en cours comprise, et reprend au retour ; l'île quittée, plus
// rien ne tourne.
import { MOUVEMENTS } from "../design/jetons";
import { ELEMENTS, type DecorIle, type ImageCadree } from "../illustrations";
import { urlImage } from "../images";
import { sfx, speech } from "../services";
import { h } from "../ui";

type Ou = "fond" | "haut";
interface Surprise { nom: string; el: HTMLElement; duree: number }
// Les minuteries du chef d'orchestre : la prochaine surprise, la fin de celle qui joue, et la veille pendant qu'elle joue
// (Plume se met-elle à parler ?).
export type Minuterie = "prochaine" | "fin" | "veille";
// Ce dont le chef d'orchestre des surprises dépend : le temps, la voix de Plume, l'appli au premier plan, le réglage
// « Réduire les animations », le hasard. Les tests le remplacent pour vérifier les garde-fous pas à pas.
export interface Environnement {
  attendre: (fn: () => void, ms: number, quoi: Minuterie) => unknown;
  annuler: (id: unknown) => void;
  maintenant: () => number;
  parle: () => boolean;
  cache: () => boolean;
  reduit: () => boolean;
  hasard: () => number;
}
export interface DecorVivant {
  fond: HTMLElement[]; // juste au-dessus du dessin de base : la mer, le ciel
  haut: HTMLElement[]; // au-dessus des lieux : palmes, hôte, bateau, papillons, surprises sur l'île
  demarrer: () => void; // à l'arrivée sur l'île : la première surprise vient au plus tôt 20 s plus tard
  surprises: string[]; // les surprises possibles sur cette île (vérifiées par les tests)
  jouer: (nom: string) => boolean; // pour les tests et la vitrine : lance une surprise tout de suite
  sansSurprises: () => void; // pour les tests et la vitrine : plus de surprise programmée (le décor continue de vivre)
  arreter: () => void; // l'île est quittée : plus rien ne tourne (minuteries, écoute de l'arrière-plan, surprise en cours)
  coucou: () => void; // l'hôte salue, au moment où Plume dit qu'il fait coucou (Basile agite le bras, les autres sautillent)
}
export interface OptionsVivant {
  ouvrir?: (lieu: string) => void; // ce qui est posé sur un lieu l'ouvre, comme le reste de son dessin
}
const VEILLE = 250; // ms : pendant une surprise, on regarde si Plume se met à parler
const EFFACE = 300; // ms : le fondu d'une surprise interrompue

const reduit = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const ENV: Environnement = {
  attendre: (fn, ms) => setTimeout(fn, ms), annuler: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  maintenant: () => Date.now(), parle: () => speech.parle, cache: () => typeof document !== "undefined" && document.hidden, reduit, hasard: Math.random,
};
const src = (im: ImageCadree) => urlImage(`illustrations/${im.fichier}`);
const px = (v: number) => `${Math.round(v * 10) / 10}px`;
const poser = <T extends HTMLElement>(el: T, [x, y, l, ht]: number[]): T => {
  el.style.cssText += `;left:${px(x)};top:${px(y)};width:${px(l)};height:${px(ht)}`;
  return el;
};
const img = (im: ImageCadree, cls: string) => h("img", { class: cls, src: src(im), alt: "", draggable: "false" }) as HTMLImageElement;
// Un calque de l'île, à sa place ; s'il tourne, autour de son pivot.
function calque(im: ImageCadree, cls: string): HTMLElement {
  const el = poser(img(im, `viv ${cls}`), im.boite);
  if (im.pivot) el.style.transformOrigin = `${im.pivot[0] * 100}% ${im.pivot[1] * 100}%`;
  return el;
}
// Un calque que l'on peut toucher : un bouton à sa place, l'image dedans (le bouton réagit, l'image vit sa vie). Il
// s'enfonce à l'appui (120 ms) et réagit en 400 ms ; avec « Réduire les animations », il ne bouge pas mais fait son son.
function touchable(im: ImageCadree, cls: string, etiquette: string, reaction: string, son: () => void): HTMLElement {
  const b = poser(h("button", { type: "button", class: `viv viv-touche ${cls}`, "aria-label": etiquette }) as HTMLButtonElement, im.boite);
  const i = img(im, "viv-img");
  if (im.pivot) b.style.transformOrigin = i.style.transformOrigin = `${im.pivot[0] * 100}% ${im.pivot[1] * 100}%`;
  b.appendChild(i);
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    son();
    if (!reduit()) { b.classList.remove(reaction); void b.offsetWidth; b.classList.add(reaction); }
  });
  b.addEventListener("animationend", (e) => { if (e.target === b) b.classList.remove(reaction); });
  return b;
}
// Ce qui est posé sur un lieu (la grenouille sur l'étang) ou juste au-dessus (la fumée du petit volcan) : le toucher
// ouvre ce lieu, comme le reste de son dessin. Ce n'est pas un bouton de plus pour les lecteurs d'écran : l'étiquette
// du lieu l'est déjà.
function relais(el: HTMLElement, lieu: string, o: OptionsVivant, avant?: () => void): HTMLElement {
  el.classList.add("viv-relais");
  el.dataset.relais = lieu;
  el.setAttribute("aria-hidden", "true");
  el.tabIndex = -1;
  el.addEventListener("click", (e) => { e.stopPropagation(); avant?.(); o.ouvrir?.(lieu); });
  return el;
}
// Un petit sujet (élément vivant/…), le milieu de son cadre en (x, y), à l'échelle k.
function sujet(nom: string, x: number, y: number, k = 1, cls = ""): HTMLElement {
  const im = ELEMENTS[`vivant/${nom}`];
  const [bx, by, bl, bh] = im.boite;
  const [W, H] = im.cadre ?? [bl, bh];
  return poser(img(im, `viv ${cls}`), [x + (bx - W / 2) * k, y + (by - H / 2) * k, bl * k, bh * k]);
}
const boiteVide = (cls: string, b: number[]) => poser(h("div", { class: `viv ${cls}` }), b);
const croise = (a: number[], b: number[]) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

export function decorVivant(d: DecorIle, cadre: HTMLElement, env: Partial<Environnement> = {}, o: OptionsVivant = {}): DecorVivant {
  const E: Environnement = { ...ENV, ...env };
  const v = d.vivant ?? {};
  const fond: HTMLElement[] = [], haut: HTMLElement[] = [];
  const lieux = Object.values(d.lieux).map((l) => l.boite);
  // le lieu sur lequel une boîte est posée (celui qu'elle recouvre le plus), s'il y en a un
  const recouvre = (a: number[], b: number[]) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const lieuSous = (b: number[]) => Object.entries(d.lieux).map(([id, l]) => [id, recouvre(b, l.boite)] as const).filter(([, s]) => s > 0).sort((x, y) => y[1] - x[1])[0]?.[0];
  const animes = Object.entries(d.animes);
  // ---- au fond : la mer et le ciel
  for (const [, a] of animes.filter(([, a]) => a.role === "reflets")) fond.push(calque(a, `viv-reflets ${fond.length % 2 ? "b" : "a"}`));
  (v.etincelles ?? []).forEach(([x, y], i) => { const e = sujet("etincelle", x, y, 0.8, "viv-etincelle"); e.style.animationDelay = `${-i * 1.07}s`; fond.push(e); });
  animes.filter(([, a]) => a.role === "nuage").forEach(([, a], i) => fond.push(calque(a, `viv-nuage n${(i % 3) + 1}`)));
  for (const [x, y] of v.fumees ?? []) for (let i = 0; i < 3; i++) {
    const e = sujet("bouffee", x, y, 0.55, "viv-fumee loin");
    e.style.animationDelay = `${-i * 2}s`;
    e.style.setProperty("--rx", `${[0, 8, 20][i]}px`); e.style.setProperty("--ry", `${[0, -14, -28][i]}px`); e.style.setProperty("--rs", `${[0.8, 1, 1.2][i]}`);
    fond.push(e);
  }
  // ---- au-dessus des lieux : l'île
  for (const [x, y] of v.fumeeLieu ?? []) {
    for (let i = 0; i < 3; i++) {
      const e = sujet("bouffee", x, y, 0.9, "viv-fumee lieu");
      e.style.animationDelay = `${-i * 2}s`;
      e.style.setProperty("--rx", `${4 + i * 12}px`); e.style.setProperty("--ry", `${-18 - i * 22}px`); e.style.setProperty("--rs", `${0.9 + i * 0.25}`);
      haut.push(e);
    }
    // la fumée fait partie du volcan : la toucher ouvre le volcan (la zone couvre la fumée, du cratère jusqu'en haut)
    const zone = [x - 56, y - 86, 112, 92];
    const lieu = lieuSous([x - 4, y, 8, 8]) ?? lieuSous(zone);
    if (lieu) haut.push(relais(boiteVide("viv-zone", zone), lieu, o));
  }
  animes.filter(([, a]) => a.role === "palmes").forEach(([, a], i) => {
    // un palmier dont les palmes passent au-dessus d'un lieu ne se touche pas (le lieu reste entier sous le doigt)
    const libre = !lieux.some((b) => croise(a.boite, b));
    haut.push(libre ? touchable(a, `viv-palmes p${i + 1}`, "Le palmier", "secoue", () => sfx.tap()) : calque(a, `viv-palmes p${i + 1}`));
  });
  const bateau = animes.find(([, a]) => a.role === "bateau");
  if (bateau) haut.push(touchable(bateau[1], "viv-bateau", "Le bateau", "secoue", () => sfx.cloche()));
  const bras = animes.find(([, a]) => a.role === "bras");
  const brasEl = bras ? calque(bras[1], "viv-bras") : null;
  if (brasEl) { haut.push(brasEl); brasEl.addEventListener("animationend", () => brasEl.classList.remove("salue")); }
  const hote = animes.find(([, a]) => a.role === "hote");
  const cligne = animes.find(([, a]) => a.role === "cligne");
  let hoteEl: HTMLElement | null = null;
  if (hote) {
    // l'hôte respire (son cadre), cligne des yeux (le calque « yeux fermés » par-dessus), sautille quand on le touche
    const b = touchable(hote[1], "viv-hote", hote[0].charAt(0).toUpperCase() + hote[0].slice(1), "saute", () => sfx.hop());
    if (cligne) { const c = img(cligne[1], "viv-cligne"); b.appendChild(c); }
    haut.push(b);
    hoteEl = b;
  } else if (cligne) haut.push(calque(cligne[1], "viv-cligne seul")); // Basile, à son étal : seuls ses yeux se ferment
  // la grenouille est posée sur l'étang : la toucher ouvre l'étang (elle saute en même temps) ; de temps en temps, elle
  // saute d'elle-même (c'est une des surprises de l'île)
  const grenouille = animes.find(([, a]) => a.role === "grenouille");
  let grenouilleEl: HTMLElement | null = null;
  if (grenouille) {
    const a = grenouille[1];
    const lieu = lieuSous(a.boite);
    const b = poser(h("div", { class: "viv viv-grenouille" }), a.boite);
    const i = img(a, "viv-img");
    if (a.pivot) b.style.transformOrigin = i.style.transformOrigin = `${a.pivot[0] * 100}% ${a.pivot[1] * 100}%`;
    b.appendChild(i);
    const saute = () => { if (!reduit()) { b.classList.remove("saute"); void b.offsetWidth; b.classList.add("saute"); } };
    b.addEventListener("animationend", (e) => { if (e.target === b) b.classList.remove("saute"); });
    haut.push(lieu ? relais(b, lieu, o, saute) : b);
    grenouilleEl = b;
  }
  (v.papillons ?? []).forEach(([x, y], i) => {
    const p = boiteVide(`viv-papillon v${i + 1}`, [x - 16, y - 16, 32, 32]);
    p.appendChild(sujet(i % 2 ? "papillon-rose" : "papillon-jaune", 16, 16, 0.8, "viv-ailes"));
    haut.push(p);
  });

  // ---- les surprises : une à la fois, toutes les 20 à 60 secondes
  const surprises: Surprise[] = [];
  const ajouter = (s: Surprise, ou?: Ou) => { s.el.dataset.surprise = s.nom; surprises.push(s); if (ou) (ou === "fond" ? fond : haut).push(s.el); };
  if (v.dauphin) {
    const [x, y] = v.dauphin;
    const el = boiteVide("viv-surprise viv-dauphin", [x - 120, y - 130, 240, 150]);
    const clip = boiteVide("viv-clip", [0, 0, 240, 130]);
    clip.appendChild(sujet("dauphin", 120, 130, 0.62, "d"));
    el.append(clip, sujet("gerbe", 120 - 72, 132, 0.7, "g1"), sujet("gerbe", 120 + 72, 132, 0.7, "g2"));
    ajouter({ nom: "dauphin", el, duree: 2600 }, "fond");
  }
  if (v.baleine) {
    const [x, y] = v.baleine;
    const el = boiteVide("viv-surprise viv-baleine", [x - 45, y - 46, 90, 52]);
    const clip = boiteVide("viv-clip", [0, 0, 90, 47]);
    clip.appendChild(sujet("baleine", 45, 42, 0.8, "dos"));
    el.append(clip, sujet("souffle", 48, 22, 0.7, "jet"));
    ajouter({ nom: "baleine", el, duree: 6000 }, "fond");
  }
  {
    const el = boiteVide("viv-surprise viv-oiseaux", [1200, 96, 140, 70]);
    [[20, 20, 0.9, 0], [70, 40, 0.75, 0.25], [104, 8, 0.65, 0.5]].forEach(([x, y, k, dl]) => {
      const o = boiteVide("o", [x - 30 * k, y - 16 * k, 60 * k, 32 * k]);
      o.style.animationDelay = `${-dl}s`;
      const a = sujet("oiseau-0", 30 * k, 16 * k, k, "a0"), b2 = sujet("oiseau-1", 30 * k, 16 * k, k, "a1");
      a.style.animationDelay = b2.style.animationDelay = `${-dl}s`;
      o.append(a, b2);
      el.appendChild(o);
    });
    ajouter({ nom: "oiseaux", el, duree: 12000 }, "fond");
  }
  const sp = v.surprise;
  if (sp) {
    const [x, y] = sp.point;
    if (sp.type === "poisson") {
      const el = boiteVide("viv-surprise viv-poisson", [x - 50, y - 60, 100, 70]);
      const clip = boiteVide("viv-clip", [0, 0, 100, 60]);
      clip.appendChild(sujet("poisson", 50, 60, 0.9, "f"));
      el.append(clip, boiteVide("rond r1", [24, 54, 26, 10]), boiteVide("rond r2", [52, 54, 26, 10]));
      ajouter({ nom: "poisson", el, duree: 2400 }, "haut");
    } else if (sp.type === "souffle") {
      const el = boiteVide("viv-surprise viv-souffle", [x - 40, y - 80, 80, 80]);
      el.appendChild(sujet("souffle", 40, 46, 1.6, "jet"));
      ajouter({ nom: "souffle", el, duree: 2600 }, "haut");
    } else if (sp.type === "ballon") {
      const el = boiteVide("viv-surprise viv-ballon", [x - 30, y - 104, 60, 104]);
      el.appendChild(sujet("ballon", 30, 52, 1, "b"));
      ajouter({ nom: "ballon", el, duree: 9000 }, "haut");
    } else if (sp.type === "volcan") {
      const el = boiteVide("viv-surprise viv-volcan", [x - 60, y - 140, 120, 150]);
      [0, 1, 2].forEach((i) => { const e = sujet("bouffee", 60, 130, 1.7, `p p${i + 1}`); el.appendChild(e); });
      ajouter({ nom: "volcan", el, duree: 4200 }, "haut");
    } else if (sp.type === "arc-en-ciel") {
      // l'arc apparaît et s'efface (son image) ; la boîte autour peut s'effacer plus vite si Plume se met à parler
      const im = ELEMENTS["vivant/arc-en-ciel"];
      const el = boiteVide("viv-surprise viv-arc", [x + im.boite[0], y + im.boite[1], im.boite[2], im.boite[3]]);
      el.appendChild(poser(img(im, "viv a"), [0, 0, im.boite[2], im.boite[3]]));
      ajouter({ nom: "arc-en-ciel", el, duree: 8000 }, "fond");
    } else if (sp.type === "coeurs") {
      const el = boiteVide("viv-surprise viv-coeurs", [x - 50, y - 130, 100, 140]);
      [[34, 0], [60, 0.5], [46, 1.0]].forEach(([cx, dl], i) => { const c = sujet("coeur", cx, 120, 0.7 + i * 0.1, `c c${i + 1}`); c.style.animationDelay = `${dl}s`; el.appendChild(c); });
      ajouter({ nom: "coeurs", el, duree: 4200 }, "haut");
    } else if (sp.type === "voilier") {
      const el = boiteVide("viv-surprise viv-voilier", [1250, y - 52, 56, 54]);
      el.appendChild(sujet("voilier", 28, 27, 0.6, "b"));
      ajouter({ nom: "voilier", el, duree: 16000 }, "fond");
    }
  }
  if (grenouilleEl) ajouter({ nom: "grenouille", el: grenouilleEl, duree: 1400 }); // elle est déjà posée sur l'île

  // ---- le chef d'orchestre des surprises : une à la fois, toutes les 20 à 60 secondes
  let prochaineId: unknown, finId: unknown, veilleId: unknown;
  // la surprise qui joue : quand elle doit finir, et le temps qu'il lui restait si l'appli est passée en arrière-plan
  let enCours: { s: Surprise; fin: number; reste: number | null } | null = null;
  let derniere = "", auto = true, fini = false, ecoute = false;
  const vivant = () => cadre.isConnected;
  const annuler = (...ids: unknown[]) => { for (const id of ids) if (id !== undefined) E.annuler(id); };
  const programmer = (ms: number) => { annuler(prochaineId); prochaineId = auto && !fini ? E.attendre(lancer, ms, "prochaine") : undefined; };
  const prochaine = () => programmer(MOUVEMENTS.surpriseMin + E.hasard() * (MOUVEMENTS.surpriseMax - MOUVEMENTS.surpriseMin));
  // la surprise s'efface : à la fin de son mouvement, ou plus tôt (fondu court) si Plume se met à parler
  function terminer() {
    annuler(finId, veilleId); finId = veilleId = undefined;
    enCours?.s.el.classList.remove("joue", "efface");
    enCours = null;
  }
  function suivre(ms: number) {
    annuler(finId, veilleId);
    finId = E.attendre(terminer, ms, "fin");
    veilleId = E.attendre(veiller, VEILLE, "veille");
  }
  function veiller() {
    veilleId = undefined;
    if (!enCours) return;
    if (!E.parle()) { veilleId = E.attendre(veiller, VEILLE, "veille"); return; }
    enCours.s.el.classList.add("efface");
    enCours.fin = E.maintenant() + EFFACE;
    annuler(finId);
    finId = E.attendre(terminer, EFFACE, "fin");
  }
  function jouer(nom: string): boolean {
    const s = surprises.find((x) => x.nom === nom);
    if (!s || fini || E.reduit()) return false;
    if (enCours) terminer(); // jamais deux à la fois
    derniere = nom;
    s.el.classList.remove("joue", "efface"); void s.el.offsetWidth; s.el.classList.add("joue");
    enCours = { s, fin: E.maintenant() + s.duree + 200, reste: null };
    suivre(s.duree + 200);
    return true;
  }
  function lancer() {
    prochaineId = undefined;
    if (!vivant()) return arreter();
    if (fini || !auto || E.reduit() || !surprises.length) return;
    // jamais pendant que Plume parle, ni quand l'appli est en arrière-plan, ni par-dessus une autre surprise :
    // on réessaie un peu plus tard
    if (E.parle() || E.cache() || enCours) return programmer(4000);
    const choix = surprises.filter((s) => s.nom !== derniere);
    jouer(choix[Math.min(choix.length - 1, Math.floor(E.hasard() * choix.length))]?.nom ?? surprises[0].nom);
    prochaine();
  }
  // en arrière-plan, tout se fige : le décor, la surprise en cours (son mouvement et sa fin), la prochaine ; au retour,
  // tout repart d'où il en était
  const visibilite = () => {
    if (!vivant()) return arreter();
    const cache = E.cache();
    cadre.classList.toggle("viv-pause", cache);
    if (cache) {
      annuler(prochaineId); prochaineId = undefined;
      if (enCours && enCours.reste === null) {
        annuler(finId, veilleId); finId = veilleId = undefined;
        enCours.reste = Math.max(0, enCours.fin - E.maintenant());
      }
      return;
    }
    if (enCours && enCours.reste !== null) {
      const reste = enCours.reste;
      enCours.reste = null;
      enCours.fin = E.maintenant() + reste;
      suivre(reste);
    }
    prochaine();
  };
  function arreter() {
    fini = true;
    terminer();
    annuler(prochaineId); prochaineId = undefined;
    cadre.classList.remove("viv-pause");
    if (ecoute && typeof document !== "undefined") document.removeEventListener("visibilitychange", visibilite);
    ecoute = false;
  }
  // le salut de l'hôte : rejoué à chaque fois que Plume dit qu'il fait coucou (rien avec « réduire les animations »)
  const coucou = () => {
    if (E.reduit() || fini) return;
    const el = brasEl ? { el: brasEl, cls: "salue" } : hoteEl ? { el: hoteEl, cls: "saute" } : null;
    if (!el) return;
    el.el.classList.remove(el.cls); void el.el.offsetWidth; el.el.classList.add(el.cls);
  };
  return {
    fond, haut, surprises: surprises.map((s) => s.nom), jouer, arreter, coucou,
    sansSurprises: () => { auto = false; annuler(prochaineId); prochaineId = undefined; },
    demarrer: () => {
      if (E.reduit() || fini) return;
      if (!ecoute) { document.addEventListener("visibilitychange", visibilite); ecoute = true; }
      prochaine();
    },
  };
}

// ---------------------------------------------------------------------------- les mouvements
const M = MOUVEMENTS;
// L'arc d'un saut (dauphin, poisson) : il sort de l'eau à gauche, monte, et replonge à droite, le nez dans le sens du saut.
function arc(nom: string, dx: number, haut: number, base: number, rot = 0.6): string {
  const k: string[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = -dx + 2 * dx * t, y = base - 4 * haut * t * (1 - t);
    const a = (Math.atan2(-4 * haut * (1 - 2 * t), 2 * dx) * 180) / Math.PI * rot;
    k.push(`${Math.round(10 + t * 80)}%{opacity:1;transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg)}`);
  }
  return `@keyframes ${nom}{0%,9%{opacity:0;transform:translate(${-dx}px,${base}px)}${k.join("")}91%,100%{opacity:0;transform:translate(${dx}px,${base}px)}}`;
}

export const VIVANT_CSS = `
.ile-cadre .viv{position:absolute;display:block;pointer-events:none;user-select:none;-webkit-user-select:none}
.ile-cadre .viv-touche,.ile-cadre .viv-relais{pointer-events:auto;padding:0;margin:0;border:none;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:scale ${M.appui}ms ease-out}
.ile-cadre .viv-touche:active,.ile-cadre .viv-grenouille:active{scale:.95}
.ile-cadre .viv-touche .viv-img,.ile-cadre .viv-hote .viv-cligne{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.ile-cadre .viv-clip{overflow:hidden}
.viv-pause .viv,.viv-pause .viv *{animation-play-state:paused!important}
/* en continu, et discret */
@keyframes viv-houle{from{transform:translateX(-9px);opacity:.35}to{transform:translateX(9px);opacity:1}}
.viv-reflets.a{animation:viv-houle ${M.houle}ms ${M.courbes.calme} infinite alternate}
.viv-reflets.b{animation:viv-houle ${M.houle}ms ${M.courbes.calme} ${-M.houle / 2}ms infinite alternate-reverse}
@keyframes viv-brille{0%,100%{opacity:0;transform:scale(.3)}45%{opacity:.9;transform:scale(1)}70%{opacity:0;transform:scale(.6)}}
.viv-etincelle{opacity:0;animation:viv-brille ${M.etincelle}ms ease-in-out infinite}
@keyframes viv-derive{from{transform:translateX(-26px)}to{transform:translateX(34px)}}
.viv-nuage.n1{animation:viv-derive ${M.nuages}ms ${M.courbes.calme} infinite alternate}
.viv-nuage.n2{animation:viv-derive ${Math.round(M.nuages * 0.83)}ms ${M.courbes.calme} -12s infinite alternate-reverse}
.viv-nuage.n3{animation:viv-derive ${Math.round(M.nuages * 1.17)}ms ${M.courbes.calme} -20s infinite alternate}
@keyframes viv-fume{0%{opacity:0;transform:translate(0,12px) scale(.4)}15%{opacity:.95}100%{opacity:0;transform:translate(18px,-52px) scale(1.6)}}
@keyframes viv-fume-loin{0%{opacity:0;transform:translate(0,6px) scale(.4)}15%{opacity:.8}100%{opacity:0;transform:translate(8px,-26px) scale(1.5)}}
.viv-fumee{opacity:0;animation:viv-fume 6s ease-out infinite}
.viv-fumee.loin{animation-name:viv-fume-loin}
@keyframes viv-balance{from{transform:rotate(-1.8deg)}to{transform:rotate(1.8deg)}}
.viv-palmes .viv-img,img.viv-palmes{animation:viv-balance ${M.palmes}ms ${M.courbes.calme} infinite alternate}
.viv-palmes.p2 .viv-img,img.viv-palmes.p2{animation-duration:${Math.round(M.palmes * 1.15)}ms;animation-delay:-1.7s;animation-direction:alternate-reverse}
@keyframes viv-tangue{from{transform:rotate(-2.4deg) translateY(0)}to{transform:rotate(2.4deg) translateY(2px)}}
.viv-bateau .viv-img{animation:viv-tangue ${M.bateau}ms ${M.courbes.calme} infinite alternate}
/* Basile salue quand Plume dit qu'il fait coucou (classe « salue », posée par coucou()) */
@keyframes viv-salue{0%,100%{transform:rotate(0)}16%{transform:rotate(-16deg)}36%{transform:rotate(9deg)}56%{transform:rotate(-14deg)}76%{transform:rotate(6deg)}90%{transform:rotate(0)}}
.viv-bras.salue{animation:viv-salue ${M.salut}ms ease-in-out 1 both}
@keyframes viv-respire{from{transform:scale(1,1)}to{transform:scale(1.008,1.02)}}
.viv-hote{transform-origin:50% 100%}
.viv-hote .viv-img,.viv-hote .viv-cligne{transform-origin:50% 100%;animation:viv-respire ${M.respiration}ms ${M.courbes.calme} infinite alternate}
@keyframes viv-cligne{0%,96.9%{opacity:0}97%,99.4%{opacity:1}99.5%,100%{opacity:0}}
.viv-hote .viv-cligne,.viv-cligne.seul{opacity:0;animation:viv-respire ${M.respiration}ms ${M.courbes.calme} infinite alternate,viv-cligne ${M.clignement}ms steps(1,end) -1.3s infinite}
.viv-cligne.seul{animation:viv-cligne ${Math.round(M.clignement * 1.1)}ms steps(1,end) -2.1s infinite}
/* la grenouille saute quand on la touche, et parfois d'elle-même (deux petits sauts : c'est une surprise) */
@keyframes viv-hop{0%,100%{transform:translateY(0) scale(1,1)}15%{transform:translateY(1px) scale(1.08,.9)}45%{transform:translateY(-12px) scale(.94,1.07)}75%{transform:translateY(0) scale(1.07,.93)}90%{transform:scale(1,1)}}
.viv-grenouille.saute{animation:viv-hop ${M.long}ms ${M.courbes.douce}}
.viv-grenouille.joue{animation:viv-hop 600ms ease-in-out 100ms 2 both}
@keyframes viv-volj{0%{transform:translate(0,0)}20%{transform:translate(38px,-26px)}45%{transform:translate(92px,-8px)}70%{transform:translate(52px,20px)}100%{transform:translate(0,0)}}
@keyframes viv-volv{0%{transform:translate(0,0)}30%{transform:translate(-54px,-30px)}60%{transform:translate(-96px,6px)}100%{transform:translate(0,0)}}
.viv-papillon.v1{animation:viv-volj 13s ease-in-out infinite}
.viv-papillon.v2{animation:viv-volv 16s ease-in-out infinite}
@keyframes viv-ailes{from{transform:scaleX(1)}to{transform:scaleX(.45)}}
.viv-papillon .viv-ailes{animation:viv-ailes ${M.papillon}ms ${M.courbes.calme} infinite alternate}
/* quand on touche */
@keyframes viv-saute{0%,100%{transform:translateY(0) scale(1,1)}20%{transform:translateY(1px) scale(1.06,.92)}50%{transform:translateY(-14%) scale(.96,1.05)}80%{transform:translateY(0) scale(1.04,.96)}}
.viv-touche.saute{animation:viv-saute ${M.long}ms ${M.courbes.douce}}
@keyframes viv-secoue{0%,100%{transform:rotate(0)}20%{transform:rotate(-4deg)}45%{transform:rotate(3deg)}70%{transform:rotate(-2deg)}}
.viv-touche.secoue{animation:viv-secoue ${M.long}ms ease-in-out}
/* les surprises : invisibles, jusqu'à ce qu'elles jouent ; celle que Plume interrompt en parlant s'efface en 300 ms */
.viv-surprise{opacity:0}
.viv-surprise.joue{opacity:1}
.viv-surprise.joue.efface{opacity:0;transition:opacity ${EFFACE}ms ease-out}
.viv-dauphin .d,.viv-dauphin .g1,.viv-dauphin .g2,.viv-poisson .f,.viv-poisson .rond{opacity:0}
${arc("viv-saut", 66, 70, 34)}
.viv-dauphin.joue .d{animation:viv-saut 2400ms linear both}
@keyframes viv-gerbe{0%{opacity:0;transform:scale(.4)}15%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.25)}}
.viv-dauphin .g1,.viv-dauphin .g2,.viv-poisson .rond{transform-origin:50% 80%}
.viv-dauphin.joue .g1{animation:viv-gerbe 700ms ease-out 150ms both}
.viv-dauphin.joue .g2{animation:viv-gerbe 700ms ease-out 2050ms both}
@keyframes viv-dos{0%,100%{transform:translateY(16px)}25%,70%{transform:translateY(0)}}
.viv-baleine.joue .dos{animation:viv-dos 6000ms ease-in-out both}
@keyframes viv-jet{0%,30%{opacity:0;transform:scaleY(.2)}36%{opacity:1;transform:scaleY(1)}52%{opacity:.9;transform:scaleY(1.08)}62%,100%{opacity:0;transform:scaleY(1.15) translateY(-4px)}}
.viv-baleine .jet,.viv-souffle .jet{opacity:0;transform-origin:50% 100%}
.viv-baleine.joue .jet{animation:viv-jet 6000ms ease-out both}
@keyframes viv-souffle{0%{opacity:0;transform:scaleY(.2)}20%{opacity:1;transform:scaleY(1)}65%{opacity:.9;transform:scaleY(1.08)}100%{opacity:0;transform:scaleY(1.2) translateY(-8px)}}
.viv-souffle.joue .jet{animation:viv-souffle 2600ms ease-out both}
@keyframes viv-passe{from{transform:translateX(0)}to{transform:translateX(-1560px)}}
.viv-oiseaux.joue{animation:viv-passe 12000ms linear both}
@keyframes viv-plane{from{transform:translateY(-3px)}to{transform:translateY(3px)}}
.viv-oiseaux .o{animation:viv-plane 1.7s ease-in-out infinite alternate}
@keyframes viv-pose0{0%{opacity:1}50%,100%{opacity:0}}
@keyframes viv-pose1{0%{opacity:0}50%,100%{opacity:1}}
.viv-oiseaux .a0{animation:viv-pose0 1.4s steps(1,end) infinite}
.viv-oiseaux .a1{opacity:0;animation:viv-pose1 1.4s steps(1,end) infinite}
${arc("viv-bond", 18, 34, 22)}
.viv-poisson.joue .f{animation:viv-bond 1800ms linear both}
@keyframes viv-rond{0%{opacity:0;transform:scale(.3)}10%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(2.2)}}
.viv-poisson .rond{border:2px solid rgba(255,255,255,.9);border-radius:50%}
.viv-poisson.joue .r1{animation:viv-rond 900ms ease-out 150ms both}
.viv-poisson.joue .r2{animation:viv-rond 900ms ease-out 1550ms both}
@keyframes viv-monte{0%{opacity:0;transform:translate(0,0) rotate(-4deg)}10%{opacity:1}50%{transform:translate(10px,-180px) rotate(4deg)}85%{opacity:1}100%{opacity:0;transform:translate(-6px,-360px) rotate(-3deg)}}
.viv-ballon.joue .b{animation:viv-monte 9000ms ease-in-out both}
@keyframes viv-bouffe{0%{opacity:0;transform:translate(0,10px) scale(.4)}20%{opacity:1}100%{opacity:0;transform:translate(6px,-120px) scale(1.7)}}
.viv-volcan .p{opacity:0}
.viv-volcan.joue .p1{animation:viv-bouffe 2800ms ease-out both}
.viv-volcan.joue .p2{animation:viv-bouffe 2800ms ease-out 600ms both}
.viv-volcan.joue .p3{animation:viv-bouffe 2800ms ease-out 1200ms both}
@keyframes viv-parait{0%{opacity:0}18%,75%{opacity:.85}100%{opacity:0}}
.viv-arc .a{opacity:0}
.viv-arc.joue .a{animation:viv-parait 8000ms ease-in-out both}
@keyframes viv-coeur{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:1;transform:translate(-6px,-28px) scale(1)}100%{opacity:0;transform:translate(-30px,-112px) scale(1.1)}}
.viv-coeurs .c{opacity:0}
.viv-coeurs.joue .c{animation:viv-coeur 3000ms ease-out both}
@keyframes viv-croise{from{transform:translateX(0)}to{transform:translateX(-1380px)}}
.viv-voilier.joue{animation:viv-croise 16000ms linear both}
/* « Réduire les animations » : le décor reste immobile (la règle générale arrête tout) ; la fumée des volcans reste
   visible, posée ; les surprises ne jouent pas */
@media (prefers-reduced-motion:reduce){.viv-fumee{opacity:.85;transform:translate(var(--rx),var(--ry)) scale(var(--rs))}.viv-surprise{display:none}}
`;
