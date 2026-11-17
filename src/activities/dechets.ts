// Île des Découvertes — « Le voyage des déchets » : avec Octave, l'enfant suit le camion poubelle et les éboueurs, les
// héros de tous les jours, jusqu'au bout du voyage de nos déchets.
// 1. Le camion poubelle : glisser la poubelle jusqu'au camion ; les éboueurs ; rester sur le trottoir.
// 2. Où va chaque camion : centre de tri, usine du verre, compost, usine qui chauffe les maisons.
// 3. Au centre de tri : le tapis roulant (plastique, métal, papier et carton), le gros aimant.
// 4. Une nouvelle vie : une bouteille devient un pull, une canette un vélo… et le voyage en entier, dans l'ordre.
// 5. Ni dans le bac jaune ni dans le bac gris : piles, médicaments, vêtements, gros objets.
// 6. Faire moins de déchets : gourde, sac en tissu, réparer, donner…
// Les poubelles suivent les réglages du grand tri (couleurs de votre commune). Chaque phrase dite est écrite ici ;
// voiceLines() les donne toutes, pour la voix naturelle.
import type { Rng } from "../core";
import type { ActivityModule, Ctx, Item, View } from "../host";
import { emoji } from "../lexique";
import { sfx, type TriSettings } from "../services";
import { glow, h, medallion, sleep } from "../ui";
import { DART, RUE, dartSVG, dechetsStickerSVG, rueSVG } from "./dechets_art";
import { sortBoard, type SortBoard } from "./glisser";
import { THING, binArt, binsFor, triSettings, type Bin } from "./tri";
import { TART, tartSVG } from "./tri_art";

const CAMION = "DECOUV.DECHETS.CAMION", ROUTE = "DECOUV.DECHETS.ROUTE", CENTRE = "DECOUV.DECHETS.CENTRE",
  VIE = "DECOUV.DECHETS.VIE", AILLEURS = "DECOUV.DECHETS.AILLEURS", MOINS = "DECOUV.DECHETS.MOINS";
type Kind = "camion" | "qui" | "rue" | "route" | "tapis" | "aimant" | "vie" | "ordre" | "ailleurs" | "moins";
interface Opt { art: string; label: string }
export interface DechetsItem extends Item {
  kind: Kind; key: string; chap: string; target: string; choices: string[]; opts: Record<string, Opt>;
  scene: string[]; labels: string[]; bin?: string; things?: string[]; answers?: Record<string, string>;
  clue: string; why: string; win: string; retry: Record<string, string>;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const du = (nom: string) => nom.replace(/^le /, "du ");
const bare = (nom: string) => cap(nom.replace(/^(le |la |les |l')/, ""));
const Q = "?";

// Image : la poubelle de chez vous (bac_<id>), un dessin maison, un déchet du grand tri, ou un emoji du système.
const BAC = "bac_";
function artOf(id: string): string {
  if (id.startsWith(BAC)) { const b = binsFor(triSettings()).find((x) => x.id === id.slice(BAC.length)); return b ? binArt(b) : ""; }
  if (DART[id]) return dartSVG(id);
  if (TART[id]) return tartSVG(id);
  return emoji(id);
}
const pic = (id: string, cls = "") => `<span class="wart${cls ? ` ${cls}` : ""}">${artOf(id)}</span>`;
const binOf = (s: TriSettings, id: string) => binsFor(s).find((b) => b.id === id)!;
const truckBins = (s: TriSettings) => binsFor(s).filter((b) => b.look !== "composteur");

// ---------- 1. Le camion poubelle et les éboueurs ----------
export const CAMION_TXT = {
  prompt: (b: Bin) => `Le camion poubelle arrive ! Glisse ${b.nom} jusqu'au camion.`,
  clue: "Pose la poubelle à l'arrière du camion : l'éboueur va la vider.",
  hint3: "Regarde : je te montre le chemin.",
  hint4: "Je t'aide : hop, dans le camion !",
  tap: "Maintenant, touche le camion !",
  loin: "Encore un peu plus loin, jusqu'au camion !",
  win: (b: Bin) => `Merci ! Le camion vide ${b.nom}.`,
};
const PEOPLE: Record<string, { label: string; retry: string }> = {
  eboueur: { label: "Éboueur", retry: "" },
  pompier: { label: "Pompier", retry: "Le pompier, lui, éteint le feu et sauve les gens." },
  boulanger: { label: "Boulanger", retry: "Le boulanger, lui, fait le pain." },
  facteur: { label: "Facteur", retry: "Le facteur, lui, apporte le courrier." },
};
export const QUI = { prompt: "Qui ramasse nos poubelles avec le camion ?", clue: "Cherche la personne avec un gilet orange, qui brille dans la nuit.",
  why: "Ce sont les éboueurs : leur métier, c'est de ramasser nos poubelles. Merci, les éboueurs !" };
export const RUE_Q = {
  prompt: "Le camion poubelle passe dans la rue. Que fais-tu ?", clue: "Le camion est grand et lourd : on reste loin de lui.",
  why: "On reste sur le trottoir, et on fait coucou aux éboueurs !",
  opts: { coucou: { art: "👋", label: "Coucou !" }, courir: { art: "🏃", label: "Courir derrière" }, grimper: { art: "🧗", label: "Grimper dessus" } } as Record<string, Opt>,
  retry: { courir: "Non ! Derrière un camion, c'est dangereux : le chauffeur ne te voit pas.", grimper: "Non ! On ne grimpe pas sur les poubelles : on pourrait tomber." } as Record<string, string>,
};

// ---------- 2. Où va chaque camion ----------
export const PLACES: Record<string, { label: string; cest: string }> = {
  centre_tri: { label: "Centre de tri", cest: "Le centre de tri, c'est pour les emballages et les papiers." },
  verrerie: { label: "Usine du verre", cest: "L'usine du verre, c'est pour le verre." },
  compost: { label: "Compost", cest: "Le compost, c'est pour les restes de cuisine." },
  usine_chaleur: { label: "Usine qui chauffe", cest: "L'usine qui chauffe brûle les déchets qu'on ne recycle pas." },
};
const ROUTE_TO: Record<string, string> = { jaune: "centre_tri", bleu: "centre_tri", verre: "verrerie", cuisine: "compost", reste: "usine_chaleur" };
export function routeTxt(b: Bin, s: TriSettings) {
  const truck = `Le camion ${du(b.nom)}`;
  switch (b.id) {
    case "jaune": return { prompt: `${truck} est plein ${s.papiers === "jaune" ? "d'emballages et de papiers" : "d'emballages"}. Où va-t-il ?`,
      clue: "Il faut d'abord séparer les emballages, sur un grand tapis.", why: `${truck} va au centre de tri : là-bas, on sépare les emballages pour les recycler.` };
    case "bleu": return { prompt: `${truck} est plein de papiers. Où va-t-il ?`, clue: "Les papiers vont d'abord là où on trie.",
      why: `${truck} va au centre de tri : les papiers deviendront du papier neuf.` };
    case "verre": return { prompt: `${truck} est plein de bouteilles et de bocaux. Où va-t-il ?`, clue: "Pour refaire des bouteilles, on fait fondre le verre dans un four.",
      why: "Le verre va à l'usine du verre : on le fait fondre pour fabriquer de nouvelles bouteilles." };
    case "cuisine": return { prompt: `${truck} est plein de restes de cuisine. Où va-t-il ?`, clue: "Les restes de cuisine deviennent une terre pour les plantes.",
      why: "Les restes de cuisine vont au compost : ils deviennent une terre très bonne pour les plantes." };
    default: return { prompt: `${truck} est plein de déchets qu'on ne recycle pas. Où va-t-il, le plus souvent ?`, clue: "Ces déchets, on les brûle, et ça fait de la chaleur.",
      why: "Le plus souvent, ces déchets vont à l'usine qui les brûle : sa chaleur chauffe des maisons." };
  }
}

// ---------- 3. Au centre de tri ----------
export const CRATES: Record<string, { label: string; art: string; say: string; de: string }> = {
  plastique: { label: "Plastique", art: "caisse_plastique", say: "Cette caisse, c'est pour le plastique.", de: "du plastique" },
  metal: { label: "Métal", art: "caisse_metal", say: "Cette caisse, c'est pour le métal.", de: "du métal" },
  papier: { label: "Papier et carton", art: "caisse_papier", say: "Cette caisse, c'est pour le papier et le carton.", de: "du papier et du carton" },
};
export const MATIERE: Record<string, { crate: string; line: string }> = {
  bouteille: { crate: "plastique", line: "La bouteille est en plastique." },
  yaourt: { crate: "plastique", line: "Le pot de yaourt est en plastique." },
  film: { crate: "plastique", line: "Le film est en plastique." },
  canette: { crate: "metal", line: "La canette est en métal." },
  conserve: { crate: "metal", line: "La boîte de conserve est en métal." },
  couvercle: { crate: "metal", line: "Le couvercle est en métal." },
  carton: { crate: "papier", line: "La boîte de céréales est en carton." },
  pizza: { crate: "papier", line: "La boîte à pizza est en carton." },
  journal: { crate: "papier", line: "Le journal est en papier." },
  prospectus: { crate: "papier", line: "Le prospectus est en papier." },
};
export const TAPIS = {
  prompt: "Au centre de tri, le tapis roulant apporte les emballages. Glisse chacun dans la bonne caisse !",
  win: "Bravo ! Tout est trié : les emballages peuvent partir à l'usine.",
};
export const tapisShow = (id: string) => `Je te montre où ${THING[id].plur ? "vont" : "va"} ${THING[id].nom}.`;
export const tapisGoes = (id: string) => `${cap(THING[id].nom)} ${THING[id].plur ? "vont" : "va"} dans la caisse ${CRATES[MATIERE[id].crate].de}.`;
export const AIMANT = {
  prompt: "Au centre de tri, un gros aimant attrape certains déchets. Lequel ?", clue: "L'aimant attrape ce qui est en fer.",
  why: "L'aimant attrape la boîte de conserve : elle est en fer !",
  retry: { bouteille: "La bouteille est en plastique : l'aimant ne l'attrape pas.", yaourt: "Le pot de yaourt est en plastique : l'aimant ne l'attrape pas.",
    journal: "Le journal est en papier : l'aimant ne l'attrape pas.", carton: "La boîte de céréales est en carton : l'aimant ne l'attrape pas." } as Record<string, string>,
};

// ---------- 4. Une nouvelle vie ----------
type Group = "plastique" | "metal" | "verre" | "papier" | "cuisine";
interface Src { id: string; label: string; group: Group; fwd: string; clue: string; devient: string }
interface Prod { id: string; label: string; src: string; rev: string; why: string; origine: string }
export const SOURCES: Src[] = [
  { id: "bouteille", label: "Bouteilles en plastique", group: "plastique", fwd: "Les bouteilles en plastique ont une nouvelle vie ! Que peut-on fabriquer avec ?",
    clue: "Le plastique peut devenir un tissu très doux.", devient: "Les bouteilles en plastique, elles, deviennent des pulls ou des peluches." },
  { id: "canette", label: "Canettes", group: "metal", fwd: "Les canettes ont une nouvelle vie ! Que peut-on fabriquer avec ?",
    clue: "Avec le métal des canettes, on peut faire un cadre très solide.", devient: "Les canettes, elles, deviennent des vélos." },
  { id: "bouteille_verre", label: "Bouteilles en verre", group: "verre", fwd: "Les bouteilles en verre ont une nouvelle vie ! Que devient le verre ?",
    clue: "Le verre fondu redevient du verre.", devient: "Le verre, lui, devient de nouvelles bouteilles." },
  { id: "journal", label: "Journaux", group: "papier", fwd: "Les vieux journaux ont une nouvelle vie ! Que peut-on fabriquer avec ?",
    clue: "Le papier redevient du papier.", devient: "Les journaux, eux, deviennent du papier neuf." },
  { id: "brique", label: "Briques de lait", group: "papier", fwd: "Les briques de lait ont une nouvelle vie ! Que peut-on fabriquer avec ?",
    clue: "Les briques sont surtout en carton : elles redeviennent du papier.", devient: "Les briques de lait, elles, deviennent du papier toilette." },
  { id: "carton", label: "Cartons", group: "papier", fwd: "Les boîtes en carton ont une nouvelle vie ! Que peut-on fabriquer avec ?",
    clue: "Le carton redevient du carton.", devient: "Les cartons, eux, deviennent des cartons neufs." },
  { id: "epluchures", label: "Épluchures", group: "cuisine", fwd: "Les épluchures deviennent du compost. Que fait-il pousser ?",
    clue: "Le compost aide les plantes à pousser.", devient: "Les épluchures, elles, deviennent du compost." },
];
export const PRODUCTS: Prod[] = [
  { id: "pull", label: "Pull", src: "bouteille", rev: "Ce pull tout doux est fait avec des déchets recyclés. Lesquels ?",
    why: "Avec des bouteilles en plastique recyclées, on fabrique des pulls tout doux !", origine: "Le pull, on le fabrique avec des bouteilles en plastique." },
  { id: "ours", label: "Ours en peluche", src: "bouteille", rev: "Cet ours en peluche est rempli avec des déchets recyclés. Lesquels ?",
    why: "Avec des bouteilles en plastique recyclées, on remplit des ours en peluche !", origine: "L'ours en peluche, on le remplit avec des bouteilles en plastique." },
  { id: "velo", label: "Vélo", src: "canette", rev: "Ce vélo est fait avec des déchets recyclés. Lesquels ?",
    why: "Avec des canettes recyclées, on peut fabriquer un vélo !", origine: "Le vélo, on le fabrique avec des canettes." },
  { id: "bouteilles_neuves", label: "Bouteilles neuves", src: "bouteille_verre", rev: "Ces bouteilles neuves sont faites avec des déchets recyclés. Lesquels ?",
    why: "Le verre recyclé devient de nouvelles bouteilles, encore et encore !", origine: "Les bouteilles neuves, on les fabrique avec du verre." },
  { id: "cahier_neuf", label: "Cahier neuf", src: "journal", rev: "Ce cahier neuf est fait avec des déchets recyclés. Lesquels ?",
    why: "Les vieux papiers recyclés deviennent du papier neuf, pour faire des cahiers !", origine: "Le cahier, on le fabrique avec de vieux papiers." },
  { id: "papier_toilette", label: "Papier toilette", src: "brique", rev: "Ce papier toilette est fait avec des déchets recyclés. Lesquels ?",
    why: "Les briques de lait recyclées deviennent du papier toilette !", origine: "Le papier toilette, on le fabrique avec des briques de lait." },
  { id: "carton_neuf", label: "Carton neuf", src: "carton", rev: "Ce carton neuf est fait avec des déchets recyclés. Lesquels ?",
    why: "Les vieux cartons recyclés deviennent des cartons neufs !", origine: "Le carton neuf, on le fabrique avec de vieux cartons." },
  { id: "legumes", label: "Légumes", src: "epluchures", rev: "Ces légumes ont poussé grâce au compost. Avec quoi fait-on le compost ?",
    why: "Les épluchures deviennent du compost, qui aide les légumes à pousser !", origine: "Pour faire pousser les légumes, on utilise le compost des épluchures." },
];
const SRC: Record<string, Src> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
const PROD: Record<string, Prod> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
// Un mauvais choix ne doit jamais être juste aussi : un produit d'une autre matière (et jamais des bouteilles neuves pour
// le plastique, qui peut aussi redevenir une bouteille).
const fitsProd = (src: string, p: string) => PROD[p].src === src;
const distractProd = (src: string, p: string) => SRC[PROD[p].src].group !== SRC[src].group && !(SRC[src].group === "plastique" && p === "bouteilles_neuves");
const distractSrc = (prod: string, s: string) => SRC[s].group !== SRC[PROD[prod].src].group && !(PROD[prod].id === "bouteilles_neuves" && SRC[s].group === "plastique");

// Le voyage en entier : il manque une étape (la poubelle, ou l'endroit où va le camion).
export interface Voyage { id: string; steps: string[]; prompt: string; thing: string }
export function voyages(s: TriSettings): Voyage[] {
  const compost = s.cuisine === "compost";
  return [
    { id: "plastique", thing: "bouteille", steps: ["bouteille", "bac_jaune", "camion", "centre_tri", "pull"], prompt: "Voici le voyage d'une bouteille en plastique. Qu'est-ce qui manque ?" },
    { id: "verre", thing: "bouteille_verre", steps: ["bouteille_verre", "bac_verre", "camion", "verrerie", "bouteilles_neuves"], prompt: "Voici le voyage d'une bouteille en verre. Qu'est-ce qui manque ?" },
    { id: "papier", thing: "journal", steps: ["journal", s.papiers === "bleu" ? "bac_bleu" : "bac_jaune", "camion", "centre_tri", "cahier_neuf"], prompt: "Voici le voyage d'un vieux journal. Qu'est-ce qui manque ?" },
    { id: "cuisine", thing: "epluchures", steps: compost ? ["epluchures", "bac_cuisine", "compost", "legumes"] : ["epluchures", "bac_cuisine", "camion", "compost", "legumes"], prompt: "Voici le voyage des épluchures. Qu'est-ce qui manque ?" },
    { id: "reste", thing: "mouchoir", steps: ["mouchoir", "bac_reste", "camion", "usine_chaleur", "maison_chaude"], prompt: "Voici le voyage d'un mouchoir sale. Qu'est-ce qui manque ?" },
  ];
}
export const ORDRE = {
  clueBin: (thing: string) => `Dans quelle poubelle ${THING[thing].plur ? "vont" : "va"} ${THING[thing].nom} ?`,
  cluePlace: "Où le camion emporte-t-il ces déchets ?",
  clueCompost: "Dans le composteur, que deviennent les épluchures ?",
  whyCompost: "Dans le composteur, les épluchures deviennent du compost.",
  whyPapier: "Les papiers vont au centre de tri : ils deviendront du papier neuf.",
};
const STEP_LABEL: Record<string, string> = {
  camion: "Camion", centre_tri: "Centre de tri", verrerie: "Usine du verre", compost: "Compost", usine_chaleur: "Usine qui chauffe",
  pull: "Pull", bouteilles_neuves: "Bouteilles neuves", cahier_neuf: "Cahier neuf", legumes: "Légumes", maison_chaude: "Maisons chauffées",
  bouteille: "Bouteille", bouteille_verre: "Bouteille en verre", journal: "Journal", epluchures: "Épluchures", mouchoir: "Mouchoir",
};

// ---------- 5. Ni dans le bac jaune, ni dans le bac gris ----------
export const DROP_OFF: Record<string, { label: string; cest: string }> = {
  magasin: { label: "Magasin", cest: "Le magasin reprend les piles usées." },
  pharmacie: { label: "Pharmacie", cest: "La pharmacie reprend les vieux médicaments." },
  borne_textile: { label: "Borne à vêtements", cest: "La borne à vêtements, c'est pour les habits et les chaussures." },
  dechetterie: { label: "Déchetterie", cest: "La déchetterie, c'est pour les gros objets." },
};
export const AILLEURS_Q: { obj: string; label: string; place: string; others: string[]; prompt: string; clue: string; why: string; bin: string }[] = [
  { obj: "piles", label: "Piles usées", place: "magasin", others: ["pharmacie", "bac_reste"], prompt: "Les piles usées ne vont dans aucune poubelle de la maison. Où les rapporte-t-on ?",
    clue: "On les rapporte là où on les achète.", why: "Les piles usées vont dans la boîte à piles du magasin : dans la nature, elles sont dangereuses.",
    bin: "Non, pas dans la poubelle : les piles sont dangereuses pour la nature." },
  { obj: "medicaments", label: "Vieux médicaments", place: "pharmacie", others: ["magasin", "bac_reste"], prompt: "Où rapporte-t-on les vieux médicaments ?",
    clue: "On les rapporte au pharmacien.", why: "On rapporte les vieux médicaments à la pharmacie.",
    bin: "Non, pas dans la poubelle : on rapporte les médicaments." },
  { obj: "vetements", label: "Habits trop petits", place: "borne_textile", others: ["pharmacie", "bac_jaune"], prompt: "Ces vêtements sont trop petits. Où les apporte-t-on, pour qu'un autre enfant les porte ?",
    clue: "Cherche la grande boîte avec un habit dessiné dessus.", why: "Les vêtements vont dans la borne à vêtements : ils seront donnés ou recyclés.",
    bin: "Les vêtements ne sont pas des emballages : pas dans le bac jaune." },
  { obj: "chaise_cassee", label: "Chaise cassée", place: "dechetterie", others: ["borne_textile", "bac_reste"], prompt: "La vieille chaise est cassée. Où l'emporte-t-on ?",
    clue: "Elle est bien trop grande pour la poubelle.", why: "La chaise cassée va à la déchetterie, avec les gros objets.",
    bin: "La chaise est bien trop grande pour la poubelle." },
  { obj: "branches", label: "Grosses branches", place: "dechetterie", others: ["pharmacie", "bac_jaune"], prompt: "Où emporte-t-on ces grosses branches du jardin ?",
    clue: "Elles sont bien trop grandes pour la poubelle.", why: "Les grosses branches vont à la déchetterie : elles y deviennent du compost.",
    bin: "Les branches ne sont pas des emballages : pas dans le bac jaune." },
  { obj: "peinture", label: "Pot de peinture", place: "dechetterie", others: ["pharmacie", "bac_reste"], prompt: "Où apporte-t-on ce vieux pot de peinture ?",
    clue: "La peinture est dangereuse pour la nature : elle ne va pas dans la poubelle.", why: "La peinture va à la déchetterie : elle est dangereuse pour la nature.",
    bin: "Non, pas dans la poubelle : la peinture abîme la nature." },
];

// ---------- 6. Faire moins de déchets ----------
export const MOINS_Q: { good: string; bad: string; labels: [string, string]; prompt: string; clue: string; why: string; retry: string }[] = [
  { good: "gourde", bad: "bouteille", labels: ["Gourde", "Bouteille en plastique"], prompt: "Pour la promenade, qu'emporte-t-on pour faire moins de déchets ?",
    clue: "Cherche ce qui se remplit encore et encore.", why: "La gourde se remplit encore et encore : pas de déchet !", retry: "La bouteille en plastique finit à la poubelle quand elle est vide." },
  { good: "sac_tissu", bad: "sac_plastique", labels: ["Sac en tissu", "Sac en plastique"], prompt: "Basile va au marché. Quel sac fait le moins de déchets ?",
    clue: "Cherche le sac qui sert encore et encore.", why: "Le sac en tissu sert encore et encore !", retry: "Le sac en plastique finit vite à la poubelle." },
  { good: "reparer", bad: "jeter_jouet", labels: ["Le réparer", "Le jeter"], prompt: "Ce jouet est cassé. Que fait-on pour faire moins de déchets ?",
    clue: "Un jouet réparé, ça peut encore servir.", why: "On le répare : il pourra encore servir !", retry: "Si on le jette, c'est un déchet de plus." },
  { good: "donner", bad: "jeter_habits", labels: ["Les donner", "Les jeter"], prompt: "Ces habits sont trop petits, mais encore beaux. Que fait-on ?",
    clue: "Des habits donnés, ça peut encore servir.", why: "On les donne : un autre enfant pourra les porter !", retry: "Ils sont encore beaux : ce serait dommage de les jeter." },
  { good: "boite_gouter", bad: "paquets", labels: ["Boîte à goûter", "Petits paquets"], prompt: "Pour le goûter, qu'est-ce qui fait le moins de déchets ?",
    clue: "Cherche ce qui se lave et sert encore.", why: "La boîte à goûter se lave et sert encore : pas d'emballage à jeter !", retry: "Tous ces petits paquets, ce sont des emballages à jeter." },
  { good: "carafe", bad: "bouteilles_eau", labels: ["Eau du robinet", "Bouteilles d'eau"], prompt: "Pour boire de l'eau à la maison, qu'est-ce qui fait le moins de déchets ?",
    clue: "Cherche l'eau qui arrive sans emballage.", why: "L'eau du robinet arrive sans emballage !", retry: "Les bouteilles d'eau font beaucoup d'emballages." },
];

// Phrases communes des indices de choix (déjà dites par le volcan).
export const PICK_HINT3 = "Ce n'est pas celle-là. Regarde ce qui reste.";
export const pickHint4 = (why: string) => `C'est celle qui brille. ${why}`;

// ---------- Fabrication des exercices ----------
function base(o: Partial<DechetsItem> & { kind: Kind; key: string; chap: string; prompt: string; d: number }): DechetsItem {
  const n = o.choices?.length ?? 0;
  return { skill: o.chap, difficulty: o.d, form: o.kind === "camion" || o.kind === "tapis" ? "manipulation" : "image", guess: n ? 1 / n : 0.5, level: 1,
    target: "", choices: [], opts: {}, scene: [], labels: [], clue: "", why: "", win: "", retry: {}, ...o } as DechetsItem;
}
const binOpt = (s: TriSettings, id: string): Opt => ({ art: `${BAC}${id}`, label: binOf(s, id).label });

export function camionItem(r: Rng, s: TriSettings): DechetsItem {
  const b = r.pick(truckBins(s));
  return base({ kind: "camion", key: `camion:${b.id}`, chap: CAMION, d: -0.6, bin: b.id, prompt: CAMION_TXT.prompt(b), clue: CAMION_TXT.clue, win: CAMION_TXT.win(b) });
}
export function quiItem(r: Rng): DechetsItem {
  const choices = r.shuffle(["eboueur", ...r.shuffle(["pompier", "boulanger", "facteur"]).slice(0, 2)]);
  return base({ kind: "qui", key: `qui:${choices.join(",")}`, chap: CAMION, d: -0.4, target: "eboueur", choices,
    opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: PEOPLE[c].label }])), scene: ["camion"], labels: [""],
    prompt: QUI.prompt, clue: QUI.clue, why: QUI.why, win: QUI.why, retry: Object.fromEntries(choices.filter((c) => c !== "eboueur").map((c) => [c, PEOPLE[c].retry])) });
}
export function rueItem(r: Rng): DechetsItem {
  const choices = r.shuffle(Object.keys(RUE_Q.opts));
  return base({ kind: "rue", key: `rue:${choices.join(",")}`, chap: CAMION, d: -0.3, target: "coucou", choices, opts: RUE_Q.opts, scene: ["camion"], labels: [""],
    prompt: RUE_Q.prompt, clue: RUE_Q.clue, why: RUE_Q.why, win: RUE_Q.why, retry: RUE_Q.retry });
}
export function routeItem(r: Rng, s: TriSettings, binId?: string): DechetsItem {
  const b = binId ? binOf(s, binId) : r.pick(truckBins(s));
  const target = ROUTE_TO[b.id];
  const choices = r.shuffle([target, ...r.shuffle(Object.keys(PLACES).filter((p) => p !== target)).slice(0, 2)]);
  const t = routeTxt(b, s);
  return base({ kind: "route", key: `route:${b.id}`, chap: ROUTE, d: 0.2, target, choices,
    opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: PLACES[c].label }])), scene: [`${BAC}${b.id}`, "camion", Q], labels: [b.label, "Camion", Q],
    prompt: t.prompt, clue: t.clue, why: t.why, win: t.why, retry: Object.fromEntries(choices.filter((c) => c !== target).map((c) => [c, PLACES[c].cest])) });
}
export function tapisItem(r: Rng): DechetsItem {
  const pool = Object.keys(MATIERE);
  const things: string[] = [];
  for (const c of r.shuffle(Object.keys(CRATES))) things.push(r.pick(pool.filter((id) => MATIERE[id].crate === c)));
  things.push(r.pick(pool.filter((id) => !things.includes(id))));
  const order = r.shuffle(things);
  return base({ kind: "tapis", key: `tapis:${order.join(",")}`, chap: CENTRE, d: 0.3, things: order, answers: Object.fromEntries(order.map((id) => [id, MATIERE[id].crate])),
    prompt: TAPIS.prompt, win: TAPIS.win, guess: Math.pow(1 / 3, order.length) } as any);
}
export function aimantItem(r: Rng): DechetsItem {
  const choices = r.shuffle(["conserve", ...r.shuffle(Object.keys(AIMANT.retry)).slice(0, 2)]);
  return base({ kind: "aimant", key: `aimant:${choices.join(",")}`, chap: CENTRE, d: 0.4, target: "conserve", choices,
    opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: bare(THING[c].nom) }])), scene: ["aimant"], labels: [""],
    prompt: AIMANT.prompt, clue: AIMANT.clue, why: AIMANT.why, win: AIMANT.why, retry: Object.fromEntries(choices.filter((c) => c !== "conserve").map((c) => [c, AIMANT.retry[c]])) });
}
export function vieItem(r: Rng, fwd = r.next() < 0.5, id?: string): DechetsItem {
  if (fwd) {
    const s = id ? SRC[id] : r.pick(SOURCES);
    const right = r.pick(PRODUCTS.filter((p) => fitsProd(s.id, p.id)));
    const others = r.shuffle(PRODUCTS.filter((p) => distractProd(s.id, p.id))).slice(0, 2).map((p) => p.id);
    const choices = r.shuffle([right.id, ...others]);
    return base({ kind: "vie", key: `vie:${s.id}>${right.id}`, chap: VIE, d: 0.5, target: right.id, choices,
      opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: PROD[c].label }])), scene: [s.id, Q], labels: [s.label, Q],
      prompt: s.fwd, clue: s.clue, why: right.why, win: right.why, retry: Object.fromEntries(others.map((c) => [c, PROD[c].origine])) });
  }
  const p = id ? PROD[id] : r.pick(PRODUCTS);
  const others = r.shuffle(SOURCES.filter((s) => distractSrc(p.id, s.id))).slice(0, 2).map((s) => s.id);
  const choices = r.shuffle([p.src, ...others]);
  return base({ kind: "vie", key: `vie:${p.id}<${p.src}`, chap: VIE, d: 0.6, target: p.src, choices,
    opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: SRC[c].label }])), scene: [Q, p.id], labels: [Q, p.label],
    prompt: p.rev, clue: SRC[p.src].clue, why: p.why, win: p.why, retry: Object.fromEntries(others.map((c) => [c, SRC[c].devient])) });
}
const BIN_FOR: Record<string, string> = { bouteille: "jaune", bouteille_verre: "verre", epluchures: "cuisine", mouchoir: "reste" };
export function ordreItem(r: Rng, s: TriSettings, v = r.pick(voyages(s)), miss?: number): DechetsItem {
  const placeAt = v.steps.findIndex((x) => x in PLACES);
  const m = miss ?? r.pick([1, placeAt]);
  const target = v.steps[m];
  let choices: string[], opts: Record<string, Opt>, retry: Record<string, string>, clue: string, why: string;
  if (m === 1) {
    const right = target.slice(BAC.length);
    const others = r.shuffle(["jaune", "verre", "cuisine", "reste"].filter((b) => b !== right && !(v.id === "papier" && b === "jaune"))).slice(0, 2);
    choices = r.shuffle([target, ...others.map((b) => `${BAC}${b}`)]);
    opts = Object.fromEntries(choices.map((c) => [c, binOpt(s, c.slice(BAC.length))]));
    retry = Object.fromEntries(others.map((b) => [`${BAC}${b}`, binOf(s, b).purpose]));
    clue = ORDRE.clueBin(v.thing);
    why = `${cap(THING[v.thing].nom)} ${THING[v.thing].plur ? "vont" : "va"} dans ${binOf(s, right).nom}.`;
  } else {
    const others = r.shuffle(Object.keys(PLACES).filter((p) => p !== target)).slice(0, 2);
    choices = r.shuffle([target, ...others]);
    opts = Object.fromEntries(choices.map((c) => [c, { art: c, label: PLACES[c].label }]));
    retry = Object.fromEntries(others.map((c) => [c, PLACES[c].cest]));
    const compost = v.id === "cuisine" && !v.steps.includes("camion");
    clue = compost ? ORDRE.clueCompost : ORDRE.cluePlace;
    why = compost ? ORDRE.whyCompost : v.id === "papier" ? ORDRE.whyPapier : routeTxt(binOf(s, BIN_FOR[v.thing]), s).why;
  }
  return base({ kind: "ordre", key: `ordre:${v.id}:${m}`, chap: VIE, d: 0.7, target, choices, opts,
    scene: v.steps.map((x, i) => (i === m ? Q : x)), labels: v.steps.map((x, i) => (i === m ? Q : x.startsWith(BAC) ? binOf(s, x.slice(BAC.length)).label : STEP_LABEL[x] ?? "")),
    prompt: v.prompt, clue, why, win: why, retry });
}
export function ailleursItem(r: Rng, s: TriSettings, q = r.pick(AILLEURS_Q)): DechetsItem {
  const choices = r.shuffle([q.place, ...q.others]);
  const opts = Object.fromEntries(choices.map((c) => [c, c.startsWith(BAC) ? binOpt(s, c.slice(BAC.length)) : { art: c, label: DROP_OFF[c].label }]));
  return base({ kind: "ailleurs", key: `ailleurs:${q.obj}`, chap: AILLEURS, d: 0.9, target: q.place, choices, opts, scene: [q.obj, Q], labels: [q.label, Q],
    prompt: q.prompt, clue: q.clue, why: q.why, win: q.why, retry: Object.fromEntries(q.others.map((c) => [c, c.startsWith(BAC) ? q.bin : DROP_OFF[c].cest])) });
}
export function moinsItem(r: Rng, q = r.pick(MOINS_Q)): DechetsItem {
  const choices = r.shuffle([q.good, q.bad]);
  return base({ kind: "moins", key: `moins:${q.good}`, chap: MOINS, d: 0.3, target: q.good, choices,
    opts: { [q.good]: { art: q.good, label: q.labels[0] }, [q.bad]: { art: q.bad, label: q.labels[1] } }, prompt: q.prompt, clue: q.clue, why: q.why, win: q.why, retry: { [q.bad]: q.retry } });
}

function byLevel(lv: number, r: Rng, s: TriSettings): DechetsItem {
  const x = r.next();
  switch (lv) {
    case 1: return x < 0.6 ? camionItem(r, s) : x < 0.8 ? quiItem(r) : rueItem(r);
    case 2: return routeItem(r, s);
    case 3: return x < 0.65 ? tapisItem(r) : aimantItem(r);
    case 4: return x < 0.6 ? vieItem(r) : ordreItem(r, s);
    case 5: return ailleursItem(r, s);
    default: return moinsItem(r);
  }
}

// ---------- Présentations des chapitres ----------
export const INTROS: Record<string, { text: string; art: string[] }> = {
  [CAMION]: { text: "Voici le camion poubelle, et les éboueurs ! Chaque semaine, le camion passe vider nos poubelles. Suis le voyage des déchets avec Octave !", art: ["camion", "eboueur"] },
  [ROUTE]: { text: "Chaque camion va à un endroit différent : le centre de tri, l'usine du verre, le compost, ou l'usine qui chauffe les maisons.", art: ["centre_tri", "verrerie", "compost", "usine_chaleur"] },
  [CENTRE]: { text: "Au centre de tri, des machines et des agents de tri font le tri, sur un grand tapis : le plastique, le métal, le papier et le carton.", art: ["centre_tri", "aimant"] },
  [VIE]: { text: "Une fois triés, nos déchets ont une nouvelle vie : une bouteille peut devenir un pull, une canette un vélo !", art: ["bouteille", "pull", "canette", "velo"] },
  [AILLEURS]: { text: "Certains déchets ne vont dans aucune poubelle de la maison : les piles, les médicaments, les vieux habits, les gros objets.", art: ["piles", "medicaments", "vetements", "chaise_cassee"] },
  [MOINS]: { text: "Le meilleur déchet, c'est celui qu'on ne fait pas ! Aide Basile à faire moins de déchets.", art: ["gourde", "sac_tissu"] },
};
const introShown = new WeakMap<Ctx, Set<string>>();

// ---------- 1. La rue : glisser la poubelle jusqu'au camion ----------
interface Rue { help: () => Promise<void>; show: () => void; hint: () => void }
const animate = (el: HTMLElement, frames: Keyframe[], ms: number, easing = "ease-in-out") => new Promise<void>((res) => {
  el.style.transform = String(frames[frames.length - 1].transform ?? "");
  if (!el.animate) { res(); return; }
  const a = el.animate(frames, { duration: ms, easing });
  a.onfinish = a.oncancel = () => res();
});
function renderCamion(item: DechetsItem, view: View) {
  const s = triSettings();
  const b = binOf(s, item.bin!);
  const wrap = h("div", { class: "drue", html: rueSVG() });
  const bin = h("span", { class: "dbin", role: "button", "aria-label": b.label, html: binArt(b) });
  bin.style.left = `${(RUE.bin.x / RUE.w) * 100}%`; bin.style.top = `${(RUE.bin.y / RUE.h) * 100}%`;
  bin.style.width = `${(RUE.bin.s / RUE.w) * 100}%`; bin.style.height = `${(RUE.bin.s / RUE.h) * 100}%`;
  wrap.appendChild(bin);
  view.stage.appendChild(wrap);
  const lift = wrap.querySelector<SVGElement>(".dlift")!, truck = wrap.querySelector<SVGElement>(".dtruck")!;
  let dx = 0, dy = 0, busy = false, done = false, selected = false;
  let lastUp = { t: -1e9, x: NaN, y: NaN };
  const inside = (r: DOMRect, x: number, y: number, m = 0) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
  const onTruck = (x: number, y: number) => inside(lift.getBoundingClientRect(), x, y, 12) || inside(truck.getBoundingClientRect(), x, y);
  async function empty(after?: Promise<unknown>) {
    if (done) return;
    done = busy = true;
    glow(bin, false); wrap.classList.remove("hinted"); wrap.querySelector(".dfinger")?.remove();
    const br = bin.getBoundingClientRect(), lr = lift.getBoundingClientRect();
    const tx = dx + (lr.left + lr.width * 0.36 - (br.left + br.width / 2)), ty = dy + (lr.bottom - lr.height * 0.08 - br.bottom);
    await animate(bin, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${tx}px,${ty}px)` }], 380);
    if (!view.stage.isConnected) return;
    sfx.whoosh();
    bin.style.transformOrigin = "100% 0%";
    const up = `translate(${tx + br.width * 0.25}px,${ty - br.height * 0.62}px) rotate(112deg)`;
    await animate(bin, [{ transform: `translate(${tx}px,${ty}px) rotate(0deg)` }, { transform: up }], 700);
    bin.classList.add("open"); sfx.rumble(0.5);
    await sleep(380);
    bin.classList.remove("open");
    await animate(bin, [{ transform: up }, { transform: `translate(${tx}px,${ty}px) rotate(0deg)` }], 520);
    if (!view.stage.isConnected) return;
    // L'éboueur repose la poubelle vide sur le trottoir ; le camion repart.
    wrap.classList.add("dgo"); sfx.vroom(); sfx.honk();
    void animate(bin, [{ transform: `translate(${tx}px,${ty}px)` }, { transform: "translate(0px,0px)" }], 600);
    await Promise.all([sleep(1150), after]);
    if (view.stage.isConnected) view.answer(true, null);
  }
  bin.addEventListener("pointerdown", (e: PointerEvent) => {
    if (busy || e.button > 0 || !e.isPrimary) return;
    e.preventDefault();
    const pid = e.pointerId, x0 = e.clientX, y0 = e.clientY, ox = dx, oy = dy;
    let moved = false;
    bin.classList.add("held");
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      moved = true;
      dx = ox + ev.clientX - x0; dy = oy + ev.clientY - y0;
      bin.style.transform = `translate(${dx}px,${dy}px)`;
      wrap.classList.toggle("over", onTruck(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      bin.classList.remove("held"); wrap.classList.remove("over");
      lastUp = { t: ev.timeStamp, x: ev.clientX, y: ev.clientY };
      if (!view.stage.isConnected || done) return;
      if (!moved) { sfx.tap(); selected = true; glow(bin); view.say(CAMION_TXT.tap); return; }
      if (ev.type !== "pointercancel" && onTruck(ev.clientX, ev.clientY)) { void empty(); return; }
      // Pas assez loin : la poubelle revient sur le trottoir.
      const far = Math.hypot(dx, dy) > 30;
      const from = `translate(${dx}px,${dy}px)`;
      dx = 0; dy = 0;
      void animate(bin, [{ transform: from }, { transform: "translate(0px,0px)" }], 320);
      if (far) view.say(CAMION_TXT.loin);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
  // Toucher la poubelle, puis le camion.
  wrap.addEventListener("click", (e) => {
    if (busy || done || e.timeStamp - lastUp.t < 350 && Math.hypot(e.clientX - lastUp.x, e.clientY - lastUp.y) < 4) return;
    if (!onTruck(e.clientX, e.clientY)) return;
    if (selected) void empty();
    else { sfx.tap(); view.say(CAMION_TXT.clue); }
  });
  const ctl: Rue = {
    help: () => empty(),
    show: () => wrap.classList.add("hinted"),
    hint: () => {
      wrap.classList.add("hinted");
      if (wrap.querySelector(".dfinger") || !document.body.animate) return;
      const f = h("span", { class: "dfinger", "aria-hidden": "true" }, "👆");
      wrap.appendChild(f);
      const a = `${((RUE.bin.x + RUE.bin.s / 2) / RUE.w) * 100}%`, c = `${((RUE.lift.x + RUE.lift.w * 0.36) / RUE.w) * 100}%`;
      f.animate([{ left: a, top: "62%", opacity: 0 }, { left: a, top: "62%", opacity: 1, offset: 0.15 }, { left: c, top: "60%", opacity: 1, offset: 0.8 }, { left: c, top: "60%", opacity: 0 }],
        { duration: 1700, iterations: 3 }).onfinish = () => f.remove();
    },
  };
  (view.stage as any)._rue = ctl;
}

// ---------- Les exercices à choisir ----------
function renderChoice(item: DechetsItem, view: View) {
  const st = view.stage;
  let slot: HTMLElement | null = null;
  if (item.scene.length > 1) {
    const parts: HTMLElement[] = [];
    item.scene.forEach((x, i) => {
      if (i) parts.push(h("span", { class: "warrow" }, "➜"));
      if (x === Q) {
        slot = h("span", { class: "wart wq" }, "?");
        parts.push(h("div", { class: "wstep miss" }, slot, h("span", { class: "wlab" }, "?")));
      } else parts.push(h("div", { class: "wstep" }, h("span", { html: pic(x) }), item.labels[i] ? h("span", { class: "wlab" }, item.labels[i]) : null));
    });
    st.appendChild(h("div", { class: `wstrip${item.scene.length > 4 ? " dlong" : ""}` }, ...parts));
  } else if (item.scene.length === 1) {
    st.appendChild(h("div", { class: "panel wpanel" }, h("span", { html: pic(item.scene[0], "big") })));
  }
  const row = h("div", { class: "choices" });
  for (const c of item.choices) {
    const o = item.opts[c];
    const b = h("button", { type: "button", class: `card pickcard labelled wcard${item.kind === "moins" ? " dwide" : ""}`, "data-t": c, "aria-label": o.label, html: `${pic(o.art)}<span class="lab">${o.label}</span>` });
    b.addEventListener("click", () => {
      const ok = c === item.target;
      if (ok && slot) {
        slot.classList.remove("wq"); slot.classList.add("pop"); slot.innerHTML = artOf(o.art);
        const lab = slot.parentElement?.querySelector(".wlab"); if (lab) lab.textContent = o.label;
      }
      view.answer(ok, b, ok ? undefined : item.retry[c] ?? "Regarde bien, et écoute encore.");
    });
    row.appendChild(b);
  }
  st.appendChild(row);
}

function renderTapis(item: DechetsItem, view: View) {
  (view.stage as any)._tapis = sortBoard(view, {
    zones: Object.entries(CRATES).map(([id, c]) => ({ id, label: c.label, art: dartSVG(c.art), say: c.say })),
    things: item.things!.map((id) => ({ id, art: tartSVG(id), name: cap(THING[id].nom) })),
    answers: item.answers!, head: medallion("octave", true), trayCls: "dtapis", zonesCls: "dcaisses",
    wrong: (id, z) => `${CRATES[z].say} ${MATIERE[id].line}`,
  });
}

const recent: string[] = [];

export const dechets: ActivityModule<DechetsItem> = {
  id: "dechets", title: "Le voyage des déchets", domain: "decouvertes", island: "decouvertes", host: "octave",
  maxLevel: 6, items: 6,
  skills: [CAMION, ROUTE, CENTRE, VIE, AILLEURS, MOINS],
  card: `<span style="display:block;width:1.15em;height:1.15em">${dartSVG("camion")}</span>`,
  pitch: "Le voyage des déchets, pour suivre le camion poubelle et découvrir ce que deviennent nos déchets.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng, s = triSettings();
    let it: DechetsItem | null = null;
    for (let t = 0; t < 6; t++) {
      // Un exercice sur trois revient sur un chapitre déjà vu.
      const lv = level > 1 && r.next() < 0.3 ? 1 + Math.floor(r.next() * (level - 1)) : level;
      it = byLevel(lv, r, s);
      if (!recent.includes(it.key)) break;
    }
    recent.push(it!.key); if (recent.length > 4) recent.shift();
    return { ...it!, level };
  },

  intro(item, ctx) {
    const seen = introShown.get(ctx) ?? new Set<string>();
    introShown.set(ctx, seen);
    if (seen.has(item.chap) || (ctx.profile.skills[item.chap]?.n ?? 0) >= 6) return null;
    seen.add(item.chap);
    const x = INTROS[item.chap];
    const el = h("div", { class: "panel wpanel wintro" },
      h("span", { class: "wwho", html: medallion("octave") }), ...x.art.map((a) => h("span", { html: pic(a) })));
    return { text: x.text, el };
  },

  render(item, view) {
    if (item.kind === "camion") { renderCamion(item, view); return; }
    if (item.kind === "tapis") { renderTapis(item, view); return; }
    renderChoice(item, view);
  },

  hint(item, step, view) {
    if (step === 1) return item.prompt;
    if (item.kind === "camion") {
      const c = (view.stage as any)._rue as Rue | undefined;
      if (step === 2) { c?.show(); return item.clue; }
      if (step === 3) { c?.hint(); return CAMION_TXT.hint3; }
      void c?.help();
      return CAMION_TXT.hint4;
    }
    if (item.kind === "tapis") {
      const board = (view.stage as any)._tapis as SortBoard | undefined;
      const id = board?.current() ?? item.things![0];
      if (step === 2) return MATIERE[id].line;
      if (step === 3) { board?.show(id); return tapisShow(id); }
      // On range l'objet en le disant ; si c'était le dernier, la fête attend la fin de la phrase.
      board?.place(id, view.say(tapisGoes(id)));
      return "";
    }
    if (step === 2) return item.clue;
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>(".choices [data-t]"));
    if (step === 3) {
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return PICK_HINT3;
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return pickHint4(item.why);
  },

  success(item) { return item.win; },

  sticker(summary) {
    const chap = (summary.last as DechetsItem | null)?.chap;
    if (chap === MOINS) return { kind: "dechets", ref: "gourde", reason: "Celle-ci, c'est parce que tu sais faire moins de déchets !", svg: dechetsStickerSVG("gourde") };
    if (chap === CENTRE || chap === VIE || chap === AILLEURS)
      return { kind: "dechets", ref: "boucle", reason: "Celle-ci, c'est parce que tu sais ce que deviennent nos déchets.", svg: dechetsStickerSVG("boucle") };
    return { kind: "dechets", ref: "camion", reason: "Celle-ci, c'est pour ton voyage avec le camion poubelle. Merci, les éboueurs !", svg: dechetsStickerSVG("camion") };
  },

  tip(item) {
    switch (item.chap) {
      case CAMION: return "regardez ensemble passer le camion poubelle, depuis le trottoir, et faites coucou aux éboueurs : leur métier nous rend service chaque semaine.";
      case ROUTE: return "beaucoup de centres de tri et d'usines se visitent lors de journées portes ouvertes : renseignez-vous auprès de votre commune.";
      case CENTRE: return "avec un aimant de frigo, testez ensemble : il colle à une boîte de conserve (en acier), pas à une canette en aluminium !";
      case VIE: return "le verre se recycle sans fin ; les bouteilles en plastique, elles, deviennent des fibres pour les pulls polaires ou les peluches.";
      case AILLEURS: return "les magasins qui vendent des piles les reprennent gratuitement ; les pharmacies reprennent les médicaments non utilisés.";
      default: return "au prochain marché, emportez ensemble un sac en tissu ; et pour la promenade, une gourde.";
    }
  },
};

// Toutes les phrases que l'activité peut dire (pour la voix naturelle), pour tous les réglages possibles.
export function voiceLines(): { fam: string; text: string }[] {
  const seen = new Set<string>(), out: { fam: string; text: string }[] = [];
  const add = (fam: string, text: string) => { if (text && !seen.has(text)) { seen.add(text); out.push({ fam: `dechets:${fam}`, text }); } };
  const choiceLines = (q: { prompt: string; clue: string; why: string }, retry: Record<string, string>) => {
    add("consigne", q.prompt); add("indice", q.clue); add("reussite", q.why); add("indice", pickHint4(q.why));
    for (const t of Object.values(retry)) add("erreur", t);
  };
  for (const x of Object.values(INTROS)) add("intro", x.text);
  for (const k of ["clue", "hint3", "hint4", "tap", "loin"] as const) add("indice", CAMION_TXT[k]);
  choiceLines(QUI, Object.fromEntries(Object.entries(PEOPLE).filter(([k]) => k !== "eboueur").map(([k, v]) => [k, v.retry])));
  choiceLines(RUE_Q, RUE_Q.retry);
  for (const p of Object.values(PLACES)) add("erreur", p.cest);
  add("consigne", TAPIS.prompt); add("reussite", TAPIS.win);
  for (const [id, m] of Object.entries(MATIERE)) {
    add("rendu", `${cap(THING[id].nom)}.`); add("indice", m.line); add("indice", tapisShow(id)); add("indice", tapisGoes(id));
    for (const c of Object.values(CRATES)) if (c !== CRATES[m.crate]) add("erreur", `${c.say} ${m.line}`);
  }
  for (const c of Object.values(CRATES)) add("rendu", c.say);
  choiceLines(AIMANT, AIMANT.retry);
  for (const sr of SOURCES) { add("consigne", sr.fwd); add("indice", sr.clue); add("erreur", sr.devient); }
  for (const p of PRODUCTS) { add("consigne", p.rev); add("reussite", p.why); add("indice", pickHint4(p.why)); add("erreur", p.origine); }
  add("indice", ORDRE.cluePlace); add("indice", ORDRE.clueCompost);
  for (const w of [ORDRE.whyCompost, ORDRE.whyPapier]) { add("reussite", w); add("indice", pickHint4(w)); }
  for (const q of AILLEURS_Q) { choiceLines(q, { bin: q.bin }); }
  for (const d of Object.values(DROP_OFF)) add("erreur", d.cest);
  for (const q of MOINS_Q) choiceLines(q, { [q.bad]: q.retry });
  add("indice", PICK_HINT3); add("erreur", "Regarde bien, et écoute encore.");
  for (const papiers of ["jaune", "bleu"] as const) for (const cuisine of ["marron", "compost"] as const) for (const couleurs of ["nationales", "paris"] as const) {
    const s: TriSettings = { papiers, cuisine, couleurs };
    for (const b of truckBins(s)) {
      add("consigne", CAMION_TXT.prompt(b)); add("reussite", CAMION_TXT.win(b));
      const t = routeTxt(b, s);
      choiceLines(t, {});
    }
    for (const b of binsFor(s)) add("erreur", b.purpose);
    for (const v of voyages(s)) {
      add("consigne", v.prompt); add("indice", ORDRE.clueBin(v.thing));
      const right = v.steps[1].slice(BAC.length);
      const why = `${cap(THING[v.thing].nom)} ${THING[v.thing].plur ? "vont" : "va"} dans ${binOf(s, right).nom}.`;
      add("reussite", why); add("indice", pickHint4(why));
    }
  }
  return out;
}
export const _dechetsData = { byLevel, voyages, SOURCES, PRODUCTS, PLACES, ROUTE_TO, MATIERE, CRATES, AILLEURS_Q, MOINS_Q, distractProd, distractSrc };
