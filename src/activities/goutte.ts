// Île des Découvertes — « Le voyage de la goutte » : Ploc, une goutte d'eau, fait le grand tour, raconté avec Octave.
// 1. La ronde de la nature (qui a besoin d'eau, mer, vapeur, nuage, pluie ou neige, rivière ou nappe).
// 2. Le labo d'Octave (glace, eau, vapeur : ce que font le chaud et le froid).
// 3. De la source au robinet (pompe, usine d'eau potable, château d'eau ou réservoir sur la colline).
// 4. Du robinet à la station d'épuration (égouts, grilles, bassin à bulles, bassin calme, retour à la rivière).
// 5. Le grand tour (retrouver l'étape qui manque). 6. Les bons gestes (lingettes, robinet, douche).
// Chaque phrase dite est écrite ici ; voiceLines() les donne toutes, pour la voix naturelle.
import type { Rng } from "../core";
import type { ActivityModule, Ctx, Item } from "../host";
import { emoji } from "../lexique";
import { glow, h, medallion } from "../ui";
import { ART, artSVG, goutteStickerSVG } from "./goutte_art";

const CYCLE = "DECOUV.EAU.CYCLE", ETATS = "DECOUV.EAU.ETATS", ROBINET = "DECOUV.EAU.ROBINET",
  EPURATION = "DECOUV.EAU.EPURATION", TOUR = "DECOUV.EAU.TOUR", GESTES = "DECOUV.EAU.GESTES";
type Kind = "vie" | "suite" | "etat" | "haut" | "usine" | "boire" | "station" | "qui" | "ou" | "tour" | "geste";
interface Opt { art: string; label: string; big?: boolean }
export interface GoutteItem extends Item {
  kind: Kind; key: string; chap: string; target: string; choices: string[]; opts: Record<string, Opt>;
  scene: string[]; seq?: string[]; miss?: number; clue: string; why: string; win: string; retry: Record<string, string>;
}

// Image : un dessin maison (ART) ou un emoji du système.
export const pic = (id: string, cls = "") => `<span class="wart${cls ? ` ${cls}` : ""}">${ART[id] ? artSVG(id) : emoji(id)}</span>`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Les étapes du voyage ----------
type StepId = "mer" | "vapeur" | "nuage" | "pluie" | "neige" | "riviere" | "nappe" | "pompe" | "usine" | "chateau" | "colline"
  | "robinet" | "bain" | "egouts" | "station";
interface Step { nom: string; label: string; art: string; plur?: boolean }
export const STEPS: Record<StepId, Step> = {
  mer: { nom: "la mer", label: "La mer", art: "mer" },
  vapeur: { nom: "la vapeur qui monte", label: "La vapeur", art: "vapeur" },
  nuage: { nom: "le nuage", label: "Le nuage", art: "nuage" },
  pluie: { nom: "la pluie", label: "La pluie", art: "pluie" },
  neige: { nom: "la neige", label: "La neige", art: "neige" },
  riviere: { nom: "la rivière", label: "La rivière", art: "riviere" },
  nappe: { nom: "la nappe, l'eau cachée sous la terre", label: "La nappe", art: "nappe" },
  pompe: { nom: "la pompe", label: "La pompe", art: "pompe" },
  usine: { nom: "l'usine d'eau potable", label: "L'usine", art: "usine" },
  chateau: { nom: "le château d'eau", label: "Le château d'eau", art: "chateau" },
  colline: { nom: "le réservoir sur la colline", label: "Le réservoir", art: "colline" },
  robinet: { nom: "le robinet", label: "Le robinet", art: "robinet" },
  bain: { nom: "le bain", label: "Le bain", art: "🛁" },
  egouts: { nom: "les égouts", label: "Les égouts", art: "egouts", plur: true },
  station: { nom: "la station d'épuration", label: "La station d'épuration", art: "station" },
};
const NATURE: StepId[] = ["mer", "vapeur", "nuage", "pluie", "neige", "riviere", "nappe"];
const MAISON: StepId[] = ["pompe", "usine", "chateau", "colline", "robinet", "egouts", "station"];
const cest = (id: StepId) => `${STEPS[id].plur ? "Ça, ce sont" : "Ça, c'est"} ${STEPS[id].nom}.`;
const optOf = (id: StepId): Opt => ({ art: STEPS[id].art, label: STEPS[id].label });

// Chemins de l'eau. « q » : posé en question « et ensuite ? » ; sinon l'étape sert seulement au grand tour.
interface Edge { from: StepId; to: StepId; skill: string; prompt: string; clue: string; why: string; d: number; q: boolean }
const E = (from: StepId, to: StepId, skill: string, d: number, prompt: string, clue: string, why: string, q = true): Edge => ({ from, to, skill, d, prompt, clue, why, q });
export const EDGES: Edge[] = [
  E("mer", "vapeur", CYCLE, -0.6, "Ploc nage dans la mer. Le soleil chauffe très fort. Que se passe-t-il ?",
    "Quand le soleil chauffe l'eau, elle devient si légère qu'elle s'envole.", "Le soleil chauffe la mer : Ploc s'envole dans le ciel, en vapeur."),
  E("vapeur", "nuage", CYCLE, -0.4, "Ploc monte, monte dans le ciel. Là-haut, il fait froid. Que se passe-t-il ?",
    "Dans le froid, tout là-haut, les gouttes se serrent les unes contre les autres.", "Ploc retrouve d'autres gouttes : ensemble, elles forment un nuage."),
  E("nuage", "pluie", CYCLE, -0.6, "Le nuage est plein de gouttes. Il devient très lourd. Que se passe-t-il ?",
    "Quand le nuage est trop lourd, les gouttes tombent.", "Le nuage est trop lourd : les gouttes tombent. C'est la pluie !"),
  E("nuage", "neige", CYCLE, -0.2, "Le nuage passe au-dessus de la montagne, où il fait très, très froid. Que tombe-t-il ?",
    "Quand il fait très froid, les gouttes gèlent avant de tomber.", "Il fait si froid que les gouttes gèlent : c'est la neige !"),
  E("pluie", "riviere", CYCLE, -0.3, "Ploc tombe sur la colline. Il glisse, il glisse… Où va-t-il ?",
    "L'eau qui glisse sur la terre finit dans un cours d'eau.", "Il coule jusqu'à la rivière."),
  E("pluie", "nappe", CYCLE, 0, "Ploc tombe dans le champ. Il s'enfonce dans la terre, tout au fond… Où arrive-t-il ?",
    "Sous la terre, il y a de l'eau cachée.", "Il arrive dans la nappe, l'eau cachée sous la terre."),
  E("neige", "riviere", CYCLE, 0, "Le printemps arrive. Le soleil chauffe la neige. Où va Ploc ?",
    "Au soleil, la neige fond, et l'eau coule vers le bas.", "La neige fond, et l'eau coule jusqu'à la rivière."),
  E("riviere", "mer", CYCLE, -0.5, "Ploc suit la rivière, qui coule, qui coule… Où arrive-t-il ?",
    "Toutes les rivières finissent par arriver au même endroit, tout en bas.", "La rivière se jette dans la mer. Ploc est revenu chez Octave !"),
  E("nappe", "pompe", ROBINET, 0.5, "Ploc est dans la nappe, sous la terre. Qu'est-ce qui va le chercher pour la maison ?",
    "Il faut une machine qui aspire l'eau, comme avec une paille.", "Une pompe aspire l'eau de la nappe, et l'envoie à l'usine."),
  E("riviere", "pompe", ROBINET, 0.5, "Pour la maison, on va chercher de l'eau dans la rivière. Qu'est-ce qui l'aspire ?",
    "Il faut une machine qui aspire l'eau, comme avec une paille.", "Une pompe aspire l'eau de la rivière, et l'envoie à l'usine."),
  E("pompe", "usine", ROBINET, 0.6, "La pompe a aspiré l'eau, mais elle n'est pas encore bonne à boire. Où va-t-elle ?",
    "Il faut un endroit où l'on nettoie l'eau.", "À l'usine, on fait des bulles, on enlève les saletés et on chasse les microbes : l'eau devient bonne à boire."),
  E("usine", "chateau", ROBINET, 0.7, "L'eau est propre. Maintenant, elle monte tout en haut d'une grande tour. Laquelle ?",
    "Une grande tour, avec un gros réservoir tout en haut.", "C'est le château d'eau. De là-haut, l'eau descendra toute seule jusqu'aux maisons."),
  E("usine", "colline", ROBINET, 0.7, "L'eau est propre. On la pompe tout en haut de la colline. Où va-t-elle ?",
    "Un grand réservoir, tout en haut de la colline.", "Dans le réservoir sur la colline. De là-haut, l'eau descendra toute seule jusqu'aux maisons."),
  E("chateau", "robinet", ROBINET, 0.5, "L'eau descend du château d'eau, dans les tuyaux sous la rue. Où arrive-t-elle ?",
    "À la maison, on l'ouvre, et l'eau coule !", "Elle arrive au robinet de la maison. On peut la boire !"),
  E("colline", "robinet", ROBINET, 0.5, "L'eau descend de la colline, dans les tuyaux sous la rue. Où arrive-t-elle ?",
    "À la maison, on l'ouvre, et l'eau coule !", "Elle arrive au robinet de la maison. On peut la boire !"),
  E("robinet", "bain", EPURATION, 0.6, "", "", "On ouvre le robinet pour remplir le bain.", false),
  E("bain", "egouts", EPURATION, 0.7, "", "", "Après le bain, l'eau sale part dans les égouts.", false),
  E("egouts", "station", EPURATION, 0.8, "L'eau sale coule dans les égouts. Où va-t-elle ?",
    "Il faut un endroit où l'on nettoie l'eau sale.", "Elle va à la station d'épuration, où on la nettoie."),
  E("station", "riviere", EPURATION, 0.8, "La station d'épuration a nettoyé l'eau sale. Où va-t-elle ensuite ?",
    "Elle retourne dans la nature, là où vivent les poissons.", "Elle retourne à la rivière, sans gêner les poissons."),
];
const succ = (id: StepId) => EDGES.filter((e) => e.from === id).map((e) => e.to);
// Étapes qui pourraient se remplacer aux yeux d'un enfant (la neige comme la pluie, le réservoir comme le château d'eau…) :
// jamais l'une comme mauvaise réponse quand l'autre est attendue.
const ALIKE: [StepId, StepId][] = [["pluie", "neige"], ["chateau", "colline"], ["riviere", "nappe"], ["riviere", "mer"]];
const alike = (a: StepId) => ALIKE.flatMap(([x, y]) => (x === a ? [y] : y === a ? [x] : []));
const hasEdge = (a: StepId, b: StepId) => EDGES.some((e) => e.from === a && e.to === b);

// ---------- Contenus des autres exercices ----------
const VIVANTS = [
  { e: "🌻", nom: "la fleur" }, { e: "🐱", nom: "le chat" }, { e: "🐟", nom: "le poisson" }, { e: "🌳", nom: "l'arbre" },
  { e: "🐄", nom: "la vache" }, { e: "🐦", nom: "l'oiseau" }, { e: "🧒", nom: "l'enfant" },
];
const CHOSES = [
  { e: "🪨", nom: "le caillou", f: false }, { e: "🚗", nom: "la voiture", f: true }, { e: "⚽", nom: "le ballon", f: false },
  { e: "🪑", nom: "la chaise", f: true }, { e: "🔑", nom: "la clé", f: true }, { e: "✏️", nom: "le crayon", f: false },
];
const vieRetry = (c: { nom: string; f: boolean }) => `${cap(c.nom)} n'est pas ${c.f ? "vivante" : "vivant"} : ${c.f ? "elle" : "il"} n'a pas besoin de boire.`;

type Etat = "glace" | "eau" | "vapeur";
const ETAT_OPTS: Record<Etat, Opt> = { glace: { art: "🧊", label: "De la glace" }, eau: { art: "💧", label: "De l'eau" }, vapeur: { art: "vapeur_seule", label: "De la vapeur" } };
const LABO: { id: string; obj: string; act: string; to: Etat; d: number; prompt: string; clue: string; why: string }[] = [
  { id: "glacon", obj: "🧊", act: "☀️", to: "eau", d: -0.2, prompt: "Octave pose un glaçon au soleil. Que devient-il : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Pense à une glace au chocolat en plein soleil…", why: "Il fait chaud : la glace fond, et redevient de l'eau." },
  { id: "bonhomme", obj: "⛄", act: "☀️", to: "eau", d: 0, prompt: "Le soleil brille sur le bonhomme de neige. Que devient la neige : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Au soleil, la neige ne reste pas longtemps…", why: "La neige fond au soleil : elle devient de l'eau." },
  { id: "congelateur", obj: "💧", act: "❄️", to: "glace", d: 0, prompt: "Octave met de l'eau dans le congélateur, où il fait très froid. Que devient-elle : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Dans le congélateur, tout devient dur et froid.", why: "Dans le froid, l'eau gèle : elle devient de la glace, toute dure." },
  { id: "gel", obj: "flaque", act: "❄️", to: "glace", d: 0.2, prompt: "Cette nuit, il a gelé très fort. Que devient la flaque d'eau : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Quand il gèle, l'eau devient dure.", why: "Quand il gèle, l'eau de la flaque devient de la glace. Attention, ça glisse !" },
  { id: "flaque", obj: "flaque", act: "☀️", to: "vapeur", d: 0.6, prompt: "Le soleil chauffe la flaque toute la journée. Que devient l'eau : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Le soir, la flaque a disparu. Où est partie l'eau ? Elle s'est envolée…", why: "L'eau s'envole en vapeur, si légère qu'on ne la voit pas : la flaque sèche !" },
  { id: "linge", obj: "👕", act: "☀️", to: "vapeur", d: 0.6, prompt: "Le linge mouillé sèche au soleil. Que devient l'eau du linge : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Le linge devient sec : l'eau s'est envolée dans l'air.", why: "L'eau du linge s'envole en vapeur : le linge sèche." },
  { id: "casserole", obj: "casserole", act: "🔥", to: "vapeur", d: 0.4, prompt: "Un adulte fait chauffer de l'eau dans une casserole, très fort. Que devient l'eau : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Au-dessus de la casserole, quelque chose monte vers le plafond…", why: "L'eau bout, et s'envole en vapeur. Attention, ça brûle : on regarde de loin !" },
  { id: "miroir", obj: "🪞", act: "🚿", to: "eau", d: 0.9, prompt: "Après la douche, la vapeur touche le miroir froid. Que devient-elle : de la glace, de l'eau, ou de la vapeur ?",
    clue: "Regarde le miroir après la douche : il est couvert de petites gouttes.", why: "La vapeur redevient de petites gouttes d'eau sur le miroir : c'est la buée !" },
];
function etatRetry(l: (typeof LABO)[number], c: Etat): string {
  if (c === "glace") return l.id === "miroir" ? "Le miroir est froid, mais pas assez pour faire de la glace." : "Non, la glace, c'est quand il fait très froid. Ici, ça chauffe !";
  if (c === "vapeur" && l.to === "glace") return "Non, la vapeur, c'est quand ça chauffe. Ici, il fait très froid !";
  if (c === "eau" && l.to === "glace") return "Il fait si froid que l'eau ne reste pas comme ça… Elle devient toute dure !";
  if (c === "eau" && l.to === "vapeur") return "Regarde bien : à la fin, il n'y a plus d'eau du tout. Elle s'est envolée !";
  return l.id === "miroir" ? "C'était déjà de la vapeur. En touchant le miroir froid, elle change !" : "Pas si vite ! D'abord, la glace fond, et devient de l'eau.";
}

const HAUT = [
  { id: "reservoir", d: 0.6, prompt: "Où faut-il mettre le réservoir, pour que l'eau arrive toute seule au robinet ?",
    opts: { haut: { art: "res_haut", label: "En haut de la colline", big: true }, bas: { art: "res_bas", label: "Dans un trou, en bas", big: true } },
    clue: "L'eau descend toujours. Elle ne monte jamais toute seule.", why: "En haut ! L'eau descend toute seule, et elle pousse fort jusqu'au robinet.",
    retry: "L'eau ne monte pas toute seule : elle descend toujours. Mets le réservoir plus haut que la maison !" },
  { id: "tour", d: 0.9, prompt: "Avec quel château d'eau l'eau sortira-t-elle le plus fort du robinet ?",
    opts: { haut: { art: "tour_haute", label: "Le grand château d'eau", big: true }, bas: { art: "tour_basse", label: "Le petit château d'eau", big: true } },
    clue: "Plus l'eau tombe de haut, plus elle pousse fort.", why: "Plus le château d'eau est haut, plus l'eau pousse fort dans les tuyaux !",
    retry: "Celui-là est tout petit : l'eau pousse moins fort. Cherche le plus haut !" },
];
const USINE = [
  { id: "sortie", target: "clair", d: 0.4, prompt: "Voici l'usine d'eau potable. Touche le verre d'eau qui en sort.",
    why: "À l'usine, on fait des bulles, on enlève les saletés et on chasse les microbes : l'eau devient claire et bonne à boire.",
    retry: "Celle-là est encore sale : elle n'est pas passée par l'usine." },
  { id: "entree", target: "trouble", d: 0.5, prompt: "Voici l'usine d'eau potable. Touche l'eau qui arrive, avant d'être nettoyée.",
    why: "Elle est encore trouble : l'usine va la nettoyer.", retry: "Celle-là est déjà propre : elle sort de l'usine !" },
];
const USINE_CLUE = "À l'usine, on nettoie l'eau : elle devient claire.";
const BOIRE = [
  { id: "robinet", art: "robinet", ok: true, skill: ROBINET, d: 0.2, prompt: "Voici l'eau du robinet, à la maison. Est-ce qu'on peut la boire ?",
    clue: "D'où vient l'eau du robinet ? Elle est passée par l'usine.", why: "Elle sort de l'usine : elle est propre, et contrôlée très souvent." },
  { id: "riviere", art: "riviere", ok: false, skill: ROBINET, d: 0.7, prompt: "Voici l'eau de la rivière. Est-ce qu'on peut la boire tout de suite ?",
    clue: "Est-ce que l'eau de la rivière est déjà passée par l'usine ?", why: "Elle peut avoir des microbes : elle doit d'abord passer par l'usine." },
  { id: "mer", art: "mer", ok: false, skill: ROBINET, d: 0.3, prompt: "Voici l'eau de la mer. Est-ce qu'on peut la boire ?",
    clue: "As-tu déjà goûté l'eau de la mer ? Elle a un drôle de goût…", why: "L'eau de mer est bien trop salée." },
  { id: "flaque", art: "flaque", ok: false, skill: ROBINET, d: 0.1, prompt: "Voici l'eau d'une flaque. Est-ce qu'on peut la boire ?",
    clue: "La flaque est par terre, au milieu du chemin…", why: "Elle est sale, et pleine de microbes." },
  { id: "station", art: "station", ok: false, skill: EPURATION, d: 1.0, prompt: "Voici l'eau qui sort de la station d'épuration. Est-ce qu'on peut la boire ?",
    clue: "Où va l'eau de la station d'épuration ? Pas à l'usine, mais à la rivière.", why: "Elle est assez propre pour la rivière et ses poissons, mais pas pour boire." },
];
const BOIRE_OPTS: Record<string, Opt> = { oui: { art: "boire_oui", label: "On peut la boire" }, non: { art: "boire_non", label: "On ne la boit pas" } };

const PARTS: Record<string, { nom: string; opt: Opt; role: string; plur?: boolean }> = {
  grilles: { nom: "les grilles", opt: { art: "grilles", label: "Les grilles" }, role: "Les grilles attrapent les gros déchets.", plur: true },
  bulles: { nom: "le bassin à bulles", opt: { art: "bulles", label: "Le bassin à bulles" }, role: "Dans le bassin à bulles, de minuscules bactéries mangent la saleté." },
  calme: { nom: "le bassin calme", opt: { art: "calme", label: "Le bassin calme" }, role: "Dans le bassin calme, la boue tombe tout au fond." },
};
const partCest = (k: string) => `${PARTS[k].plur ? "Ça, ce sont" : "Ça, c'est"} ${PARTS[k].nom}. ${PARTS[k].role}`;
const STATION_Q = [
  { target: "grilles", d: 0.7, prompt: "Dans la station d'épuration, qu'est-ce qui attrape les gros déchets, comme un filet ?", clue: "Des barreaux, comme une passoire géante." },
  { target: "bulles", d: 0.9, prompt: "Dans quel bassin les bactéries mangent-elles la saleté ?", clue: "Les bactéries ont besoin d'air : cherche les bulles." },
  { target: "calme", d: 1.0, prompt: "Dans quel bassin la boue tombe-t-elle tout au fond ?", clue: "Quand l'eau ne bouge plus, la saleté descend tout doucement." },
];
const QUI = {
  prompt: "Dans le bassin à bulles, qui mange la saleté ?", clue: "Ce sont des êtres vivants tout petits, si petits qu'on ne les voit pas.",
  why: "De minuscules bactéries mangent la saleté. Les bulles leur donnent de l'air.",
  opts: { bacteries: { art: "bacteries", label: "Des bactéries" }, poissons: { art: "🐟", label: "Des poissons" }, canards: { art: "🦆", label: "Des canards" } } as Record<string, Opt>,
  retry: { poissons: "Les poissons vivent dans la rivière, pas dans la station ! Cherche de tout petits êtres vivants.",
    canards: "Les canards vivent sur l'étang, pas dans la station ! Cherche de tout petits êtres vivants." } as Record<string, string>,
};
const OU = [
  { id: "bain", art: "🛁", prompt: "Le bain est fini. On enlève le bouchon : glouglou ! Où va l'eau sale ?" },
  { id: "vaisselle", art: "🍽️", prompt: "La vaisselle est finie. Où va l'eau sale de l'évier ?" },
  { id: "chasse", art: "🚽", prompt: "On tire la chasse d'eau. Où va l'eau sale ?" },
];
const OU_WHY = "Elle part dans les égouts, jusqu'à la station d'épuration.";
const OU_CLUE = "L'eau sale part sous la rue, dans de grands tuyaux.";
const OU_RETRY: Record<string, string> = {
  chateau: "Le château d'eau garde l'eau propre, pour boire. Pas l'eau sale !",
  usine: "L'usine fabrique l'eau propre, pour boire. L'eau sale, elle, part ailleurs !",
};
const GESTES_Q: { id: string; scene: string; d: number; prompt: string; clue: string; why: string; target: string; opts: Record<string, Opt>; retry: Record<string, string> }[] = [
  { id: "lingette", scene: "lingette", d: 0.4, prompt: "Ploc a utilisé une lingette. Où faut-il la jeter ?",
    clue: "Une lingette ne se défait pas dans l'eau, et elle ne se recycle pas.",
    why: "Dans la poubelle ! Dans les toilettes, les lingettes bouchent les tuyaux et les grilles de la station.", target: "poubelle",
    opts: { poubelle: { art: "🗑️", label: "La poubelle" }, toilettes: { art: "🚽", label: "Les toilettes" }, bacjaune: { art: "bacjaune", label: "Le bac jaune" } },
    retry: { toilettes: "Surtout pas ! Les lingettes ne se défont pas dans l'eau : elles bouchent les tuyaux.", bacjaune: "Non, une lingette ne se recycle pas : elle va dans la poubelle." } },
  { id: "toilettes", scene: "🚽", d: 0.6, prompt: "Qu'est-ce qu'on peut jeter dans les toilettes ?",
    clue: "Dans les toilettes, seulement ce qui se défait dans l'eau.",
    why: "Dans les toilettes, seulement le pipi, le caca et le papier toilette : il se défait dans l'eau.", target: "papier",
    opts: { papier: { art: "🧻", label: "Le papier toilette" }, lingette: { art: "lingette", label: "La lingette" }, coton: { art: "cotontige", label: "Le coton-tige" } },
    retry: { lingette: "Non ! La lingette ne se défait pas : elle bouche les tuyaux. Elle va à la poubelle.", coton: "Non ! Le coton-tige bouche les tuyaux. Il va à la poubelle." } },
  { id: "dents", scene: "🪥", d: 0.2, prompt: "Tu te brosses les dents. Que fais-tu du robinet ?",
    clue: "Pendant qu'on se brosse les dents, on n'a pas besoin d'eau.",
    why: "On le ferme pendant qu'on se brosse les dents : l'eau ne coule pas pour rien.", target: "ferme",
    opts: { ferme: { art: "robinet_ferme", label: "Je le ferme" }, ouvert: { art: "robinet_ouvert", label: "Je le laisse couler" } },
    retry: { ouvert: "Oh, toute cette eau qui coule pour rien ! On ferme le robinet pendant le brossage." } },
  { id: "douche", scene: "🧼", d: 0.5, prompt: "Pour se laver, qu'est-ce qui utilise le moins d'eau ?",
    clue: "Il faut beaucoup d'eau pour remplir toute une baignoire.",
    why: "Une douche rapide utilise bien moins d'eau qu'un grand bain.", target: "douche",
    opts: { douche: { art: "🚿", label: "Une douche rapide" }, bain: { art: "🛁", label: "Un grand bain" } },
    retry: { bain: "Un grand bain, il faut le remplir tout entier : ça fait beaucoup d'eau !" } },
];

// ---------- Présentations des chapitres (une fois par séance, tant que c'est nouveau) ----------
export const INTROS: Record<string, { text: string; art: string }> = {
  [CYCLE]: { art: "mer", text: "Voici Ploc, une petite goutte d'eau. Il fait un très grand voyage : de la mer au ciel, du ciel à la terre… et il revient toujours. Suivons-le !" },
  [ETATS]: { art: "🧊", text: "Bienvenue dans le labo d'Octave ! L'eau peut être dure comme un glaçon, couler comme de l'eau, ou s'envoler en vapeur. Tout dépend du chaud et du froid." },
  [ROBINET]: { art: "chateau", text: "Ploc demande : « Octave, comment l'eau arrive-t-elle dans le robinet ? » Octave répond : « Suis-moi : une pompe, une usine, un château d'eau… et voilà la maison ! »" },
  [EPURATION]: { art: "station", text: "Ploc demande : « Et l'eau sale, où va-t-elle ? » Octave répond : « Dans les égouts, jusqu'à la station d'épuration. Là-bas, on la nettoie, avant de la rendre à la rivière. »" },
  [TOUR]: { art: "ploc", text: "Le grand tour de Ploc ! De la mer au nuage, du nuage au robinet, et du robinet à la mer. Il manque des étapes : à toi de les retrouver !" },
  [GESTES]: { art: "robinet_ferme", text: "Ploc a besoin de toi pour garder l'eau propre, et ne pas la gaspiller. Voici les bons gestes !" },
};
const introShown = new WeakMap<Ctx, Set<string>>();

// ---------- Fabriques d'exercices ----------
const base = (kind: Kind, key: string, chap: string, skill: string, d: number, form: Item["form"], n: number) =>
  ({ kind, key, chap, skill, difficulty: d, form, guess: 1 / n, level: 0 });

function makeVie(r: Rng): GoutteItem {
  const v = r.pick(VIVANTS), c = r.shuffle(CHOSES).slice(0, 2);
  const opts: Record<string, Opt> = { [v.e]: { art: v.e, label: cap(v.nom) } };
  for (const x of c) opts[x.e] = { art: x.e, label: cap(x.nom) };
  return { ...base("vie", `vie:${v.e}`, CYCLE, CYCLE, -0.8, "image", 3), target: v.e, choices: r.shuffle([v.e, ...c.map((x) => x.e)]), opts,
    scene: ["ploc"], prompt: "Qui a besoin d'eau pour vivre ?", clue: "Ce qui est vivant a besoin d'eau : les plantes, les animaux, et toi !",
    why: `${cap(v.nom)} a besoin d'eau pour vivre, comme toi.`, win: `Oui ! ${cap(v.nom)} a besoin d'eau pour vivre, comme toi.`,
    retry: Object.fromEntries(c.map((x) => [x.e, vieRetry(x)])) };
}

function makeSuite(r: Rng, edge: Edge, easy: boolean): GoutteItem {
  const nature = NATURE.includes(edge.from) && NATURE.includes(edge.to);
  const no = new Set<StepId>([edge.from, ...succ(edge.from), ...alike(edge.to)]);
  // Au début, on évite aussi l'étape d'après l'étape suivante (trop proche pour un petit).
  if (easy) for (const s of succ(edge.to)) no.add(s);
  const pool = (nature ? NATURE : [...MAISON, ...NATURE]).filter((s) => !no.has(s));
  const wrong = r.shuffle(pool).slice(0, 2);
  const choices = r.shuffle([edge.to, ...wrong]);
  return { ...base("suite", `suite:${edge.from}>${edge.to}`, edge.skill, edge.skill, edge.d, "recit", 3), target: edge.to, choices,
    opts: Object.fromEntries(choices.map((c) => [c, optOf(c)])), scene: [STEPS[edge.from].art], prompt: edge.prompt, clue: edge.clue,
    why: edge.why, win: `Oui ! ${edge.why}`, retry: Object.fromEntries(wrong.map((w) => [w, `${cest(w)} Ce n'est pas ce qui vient juste après.`])) };
}

function makeEtat(r: Rng): GoutteItem {
  const l = r.pick(LABO);
  const choices = r.shuffle<Etat>(["glace", "eau", "vapeur"]);
  return { ...base("etat", `etat:${l.id}`, ETATS, ETATS, l.d, "image", 3), target: l.to, choices, opts: { ...ETAT_OPTS }, scene: [l.obj, l.act],
    prompt: l.prompt, clue: l.clue, why: l.why, win: `Oui ! ${l.why}`,
    retry: Object.fromEntries(choices.filter((c) => c !== l.to).map((c) => [c, etatRetry(l, c)])) };
}

function makeHaut(r: Rng): GoutteItem {
  const q = r.pick(HAUT);
  return { ...base("haut", `haut:${q.id}`, ROBINET, ROBINET, q.d, "image", 2), target: "haut", choices: r.shuffle(["haut", "bas"]), opts: q.opts,
    scene: [], prompt: q.prompt, clue: q.clue, why: q.why, win: `Oui ! ${q.why}`, retry: { bas: q.retry } };
}

function makeUsine(r: Rng): GoutteItem {
  const q = r.pick(USINE);
  const opts = { clair: { art: "verre_clair", label: "L'eau claire" }, trouble: { art: "verre_trouble", label: "L'eau trouble" } };
  const other = q.target === "clair" ? "trouble" : "clair";
  return { ...base("usine", `usine:${q.id}`, ROBINET, ROBINET, q.d, "image", 2), target: q.target, choices: r.shuffle(["clair", "trouble"]), opts,
    scene: ["usine"], prompt: q.prompt, clue: USINE_CLUE, why: q.why, win: `Oui ! ${q.why}`, retry: { [other]: q.retry } };
}

function makeBoire(r: Rng, skill: string): GoutteItem {
  const q = r.pick(BOIRE.filter((b) => b.skill === skill));
  const target = q.ok ? "oui" : "non", other = q.ok ? "non" : "oui";
  return { ...base("boire", `boire:${q.id}`, skill, skill, q.d, "image", 2), target, choices: ["oui", "non"], opts: BOIRE_OPTS, scene: [q.art],
    prompt: q.prompt, clue: q.clue, why: q.why, win: q.ok ? `Oui, on peut la boire ! ${q.why}` : `Bien vu, on ne la boit pas ! ${q.why}`,
    retry: { [other]: q.ok ? `Si, on peut la boire ! ${q.why}` : `Attention ! ${q.why}` } };
}

function makeStation(r: Rng): GoutteItem {
  const q = r.pick(STATION_Q);
  const choices = r.shuffle(Object.keys(PARTS));
  return { ...base("station", `station:${q.target}`, EPURATION, EPURATION, q.d, "image", 3), target: q.target, choices,
    opts: Object.fromEntries(choices.map((c) => [c, PARTS[c].opt])), scene: ["station"], prompt: q.prompt, clue: q.clue,
    why: PARTS[q.target].role, win: `Oui ! ${PARTS[q.target].role}`,
    retry: Object.fromEntries(choices.filter((c) => c !== q.target).map((c) => [c, partCest(c)])) };
}

function makeQui(r: Rng): GoutteItem {
  return { ...base("qui", "qui", EPURATION, EPURATION, 0.8, "image", 3), target: "bacteries", choices: r.shuffle(Object.keys(QUI.opts)), opts: QUI.opts,
    scene: ["bulles"], prompt: QUI.prompt, clue: QUI.clue, why: QUI.why, win: `Oui ! ${QUI.why}`, retry: QUI.retry };
}

function makeOu(r: Rng): GoutteItem {
  const q = r.pick(OU);
  const choices = r.shuffle(["egouts", "chateau", "usine"] as StepId[]);
  return { ...base("ou", `ou:${q.id}`, EPURATION, EPURATION, 0.7, "recit", 3), target: "egouts", choices,
    opts: Object.fromEntries(choices.map((c) => [c, optOf(c)])), scene: [q.art], prompt: q.prompt, clue: OU_CLUE, why: OU_WHY,
    win: `Oui ! ${OU_WHY}`, retry: OU_RETRY };
}

// Le grand tour : quatre étapes qui se suivent, l'une cachée ; les mauvaises réponses ne peuvent pas aller à sa place.
function walk(r: Rng): StepId[] {
  for (let t = 0; t < 50; t++) {
    const seq: StepId[] = [r.pick(Object.keys(STEPS) as StepId[])];
    while (seq.length < 4) {
      const next = succ(seq[seq.length - 1]).filter((s) => !seq.includes(s));
      if (!next.length) break;
      seq.push(r.pick(next));
    }
    if (seq.length === 4) return seq;
  }
  return ["nuage", "pluie", "riviere", "mer"];
}
export function tourItem(seq: StepId[], miss: number, r: Rng): GoutteItem {
  const prev = seq[miss - 1], next = seq[miss + 1], target = seq[miss];
  const fits = (s: StepId) => hasEdge(prev, s) && hasEdge(s, next);
  const pool = (Object.keys(STEPS) as StepId[]).filter((s) => !seq.includes(s) && !fits(s) && !alike(target).includes(s));
  const wrong = r.shuffle(pool).slice(0, 2);
  const choices = r.shuffle([target, ...wrong]);
  const why = EDGES.find((e) => e.from === prev && e.to === target)!.why;
  return { ...base("tour", `tour:${seq.join(">")}:${miss}`, TOUR, TOUR, 1.3, "recit", 3), target, choices, seq, miss,
    opts: Object.fromEntries(choices.map((c) => [c, optOf(c)])), scene: [], prompt: "Il manque une étape dans le voyage de Ploc. Laquelle ?",
    clue: `Avant, il y a ${STEPS[prev].nom}. Après, il y a ${STEPS[next].nom}.`, why, win: `Oui ! ${why}`,
    retry: Object.fromEntries(wrong.map((w) => [w, `${cest(w)} Regarde ce qui vient avant, et ce qui vient après.`])) };
}
function makeTour(r: Rng): GoutteItem { return tourItem(walk(r), r.next() < 0.5 ? 1 : 2, r); }

function makeGeste(r: Rng): GoutteItem {
  const q = r.pick(GESTES_Q);
  const choices = r.shuffle(Object.keys(q.opts));
  return { ...base("geste", `geste:${q.id}`, GESTES, GESTES, q.d, "image", choices.length), target: q.target, choices, opts: q.opts,
    scene: [q.scene], prompt: q.prompt, clue: q.clue, why: q.why, win: `Oui ! ${q.why}`, retry: q.retry };
}

const QUIZ = EDGES.filter((e) => e.q);
function byLevel(lv: number, r: Rng): GoutteItem {
  const x = r.next();
  if (lv <= 1) return x < 0.35 ? makeVie(r) : makeSuite(r, r.pick(QUIZ.filter((e) => e.skill === CYCLE)), true);
  if (lv === 2) return makeEtat(r);
  if (lv === 3) {
    if (x < 0.35) return makeSuite(r, r.pick(QUIZ.filter((e) => e.skill === ROBINET)), false);
    if (x < 0.55) return makeHaut(r);
    if (x < 0.75) return makeUsine(r);
    return makeBoire(r, ROBINET);
  }
  if (lv === 4) {
    if (x < 0.3) return makeSuite(r, r.pick(QUIZ.filter((e) => e.skill === EPURATION)), false);
    if (x < 0.55) return makeStation(r);
    if (x < 0.7) return makeQui(r);
    if (x < 0.85) return makeOu(r);
    return makeBoire(r, EPURATION);
  }
  if (lv === 5) return makeTour(r);
  return makeGeste(r);
}

const recent: string[] = [];
const art = (id: string, cls = "") => pic(id, cls);

export const goutte: ActivityModule<GoutteItem> = {
  id: "goutte", title: "Le voyage de la goutte", domain: "decouvertes", island: "decouvertes", host: "octave",
  maxLevel: 6, items: 6,
  skills: [CYCLE, ETATS, ROBINET, EPURATION, TOUR, GESTES],
  card: `<span style="display:block;width:1.1em;height:1.1em">${artSVG("ploc")}</span>`,
  pitch: "Le voyage de la goutte, pour suivre Ploc, de la mer jusqu'au robinet.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    let it: GoutteItem | null = null;
    for (let t = 0; t < 6; t++) {
      // Un exercice sur trois revient sur un chapitre déjà vu.
      const lv = level > 1 && r.next() < 0.3 ? 1 + Math.floor(r.next() * (level - 1)) : level;
      it = byLevel(lv, r);
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
      h("span", { class: "wart big", html: artSVG("ploc") }),
      h("span", { class: "wwho", html: medallion("octave") }),
      x.art === "ploc" ? null : h("span", { html: art(x.art, "big") }));
    return { text: x.text, el };
  },

  render(item, view) {
    const st = view.stage;
    let slot: HTMLElement | null = null;
    const q = () => (slot = h("span", { class: "wart wq" }, "?"));
    if (item.kind === "tour") {
      const parts: HTMLElement[] = [];
      item.seq!.forEach((s, i) => {
        if (i) parts.push(h("span", { class: "warrow" }, "➜"));
        const step = STEPS[s as StepId];
        parts.push(i === item.miss
          ? h("div", { class: "wstep miss" }, q(), h("span", { class: "wlab" }, "?"))
          : h("div", { class: "wstep" }, h("span", { html: art(step.art) }), h("span", { class: "wlab" }, step.label)));
      });
      st.appendChild(h("div", { class: "wstrip" }, ...parts));
    } else if (item.kind === "suite") {
      const from = Object.values(STEPS).find((s) => s.art === item.scene[0])!;
      st.appendChild(h("div", { class: "panel wpanel" },
        h("div", { class: "wstep plain" }, h("span", { html: art(item.scene[0], "big") }), h("span", { class: "wlab" }, from.label)),
        h("span", { class: "warrow" }, "➜"), q()));
    } else if (item.kind === "etat") {
      st.appendChild(h("div", { class: "panel wpanel" }, h("span", { html: art(item.scene[0], "big") }), h("span", { class: "warrow" }, "+"),
        h("span", { html: art(item.scene[1]) }), h("span", { class: "warrow" }, "➜"), q()));
    } else if (item.kind === "vie") {
      st.appendChild(h("div", { class: "panel wpanel" }, h("span", { html: art("ploc", "big") }), h("span", { class: "warrow" }, "➜"), q()));
    } else if (item.scene.length) {
      st.appendChild(h("div", { class: "panel wpanel" }, h("span", { html: art(item.scene[0], "big") })));
    }
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const o = item.opts[c];
      const b = h("button", { type: "button", class: `card pickcard labelled wcard${o.big ? " wide" : ""}`, "data-t": c, "aria-label": o.label,
        html: `${art(o.art, o.big ? "scene" : "")}<span class="lab">${o.label}</span>` });
      b.addEventListener("click", () => {
        const ok = c === item.target;
        if (ok && slot) {
          slot.classList.remove("wq"); slot.classList.add("pop"); slot.innerHTML = ART[o.art] ? artSVG(o.art) : emoji(o.art);
          const lab = slot.parentElement?.querySelector(".wlab"); if (lab && item.kind === "tour") lab.textContent = o.label;
        }
        view.answer(ok, b, ok ? undefined : item.retry[c] ?? "Regarde bien, et écoute encore.");
      });
      row.appendChild(b);
    }
    st.appendChild(row);
  },

  hint(item, step, view) {
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
    if (step === 1) return item.prompt;
    if (step === 2) return item.clue;
    if (step === 3) {
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return "Ce n'est pas celle-là. Regarde ce qui reste.";
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return `C'est celle qui brille. ${item.why}`;
  },

  success(item) { return item.win; },

  sticker(summary) {
    const chap = (summary.last as GoutteItem | null)?.chap;
    if (chap === ROBINET || chap === EPURATION || chap === TOUR)
      return { kind: "goutte", ref: "chateau", reason: "Celle-ci, c'est parce que tu sais d'où vient l'eau du robinet, et où elle repart.", svg: goutteStickerSVG("chateau") };
    if (chap === GESTES)
      return { kind: "goutte", ref: "gestes", reason: "Celle-ci, c'est pour tous les bons gestes qui protègent l'eau.", svg: goutteStickerSVG("gestes") };
    return { kind: "goutte", ref: "ploc", reason: "Celle-ci, c'est pour le grand voyage de Ploc, de la mer jusqu'au nuage.", svg: goutteStickerSVG("ploc") };
  },

  tip(item) {
    switch (item.kind) {
      case "vie": return "arrosez une plante ensemble, puis observez-la les jours suivants ; oubliez-en une autre (pas trop longtemps !).";
      case "suite": return item.chap === CYCLE ? "dessinez ensemble la ronde de l'eau : mer, vapeur, nuage, pluie, rivière… et on recommence !"
        : item.chap === ROBINET ? "en promenade, cherchez le château d'eau du quartier : il est souvent sur un point haut."
        : "après le bain, écoutez l'eau partir dans les tuyaux : où va-t-elle ensuite ?";
      case "etat": return "mettez un glaçon au soleil et un autre à l'ombre : lequel fond le plus vite ?";
      case "haut": return "avec un entonnoir et un tuyau : plus on lève l'entonnoir, plus l'eau gicle loin. C'est le principe du château d'eau.";
      case "usine": return "laissez reposer un bocal d'eau boueuse : la terre tombe au fond, l'eau s'éclaircit (sans devenir potable pour autant).";
      case "boire": return "l'eau du robinet est l'un des aliments les plus contrôlés en France.";
      case "station": case "qui": return "certaines stations d'épuration se visitent lors de journées portes ouvertes.";
      case "ou": return "montrez une plaque d'égout dans la rue : en dessous coulent les eaux usées des maisons.";
      case "tour": return "regardez ensemble une histoire animée sur le cycle de l'eau, par exemple « Le cycle de l'eau » (8 minutes, pour la maternelle).";
      default: return "à la maison, montrez la poubelle de la salle de bains : les lingettes et les cotons-tiges vont là.";
    }
  },
};

// Toutes les phrases que l'activité peut dire (pour la voix naturelle) : famille → textes.
export function voiceLines(): { fam: string; text: string }[] {
  const out: { fam: string; text: string }[] = [];
  const add = (fam: string, text: string) => out.push({ fam: `goutte:${fam}`, text });
  for (const x of Object.values(INTROS)) add("intro", x.text);
  for (const e of QUIZ) { add("consigne", e.prompt); add("indice", e.clue); add("indice", `C'est celle qui brille. ${e.why}`); add("reussite", `Oui ! ${e.why}`); }
  for (const e of EDGES) { add("reussite", `Oui ! ${e.why}`); add("indice", `C'est celle qui brille. ${e.why}`); }
  for (const s of Object.keys(STEPS) as StepId[]) {
    add("erreur", `${cest(s)} Ce n'est pas ce qui vient juste après.`);
    add("erreur", `${cest(s)} Regarde ce qui vient avant, et ce qui vient après.`);
  }
  for (const a of Object.keys(STEPS) as StepId[]) for (const b of Object.keys(STEPS) as StepId[]) {
    if (a !== b && EDGES.some((e1) => e1.from === a && EDGES.some((e2) => e2.from === e1.to && e2.to === b))) add("indice", `Avant, il y a ${STEPS[a].nom}. Après, il y a ${STEPS[b].nom}.`);
  }
  add("consigne", "Il manque une étape dans le voyage de Ploc. Laquelle ?");
  add("consigne", "Qui a besoin d'eau pour vivre ?"); add("indice", "Ce qui est vivant a besoin d'eau : les plantes, les animaux, et toi !");
  for (const v of VIVANTS) { const w = `${cap(v.nom)} a besoin d'eau pour vivre, comme toi.`; add("reussite", `Oui ! ${w}`); add("indice", `C'est celle qui brille. ${w}`); }
  for (const c of CHOSES) add("erreur", vieRetry(c));
  for (const l of LABO) {
    add("consigne", l.prompt); add("indice", l.clue); add("reussite", `Oui ! ${l.why}`); add("indice", `C'est celle qui brille. ${l.why}`);
    for (const c of ["glace", "eau", "vapeur"] as Etat[]) if (c !== l.to) add("erreur", etatRetry(l, c));
  }
  for (const q of HAUT) { add("consigne", q.prompt); add("indice", q.clue); add("reussite", `Oui ! ${q.why}`); add("indice", `C'est celle qui brille. ${q.why}`); add("erreur", q.retry); }
  for (const q of USINE) { add("consigne", q.prompt); add("reussite", `Oui ! ${q.why}`); add("indice", `C'est celle qui brille. ${q.why}`); add("erreur", q.retry); }
  add("indice", USINE_CLUE);
  for (const q of BOIRE) {
    add("consigne", q.prompt); add("indice", q.clue); add("indice", `C'est celle qui brille. ${q.why}`);
    add("reussite", q.ok ? `Oui, on peut la boire ! ${q.why}` : `Bien vu, on ne la boit pas ! ${q.why}`);
    add("erreur", q.ok ? `Si, on peut la boire ! ${q.why}` : `Attention ! ${q.why}`);
  }
  for (const q of STATION_Q) { add("consigne", q.prompt); add("indice", q.clue); add("reussite", `Oui ! ${PARTS[q.target].role}`); add("indice", `C'est celle qui brille. ${PARTS[q.target].role}`); }
  for (const k of Object.keys(PARTS)) add("erreur", partCest(k));
  add("consigne", QUI.prompt); add("indice", QUI.clue); add("reussite", `Oui ! ${QUI.why}`); add("indice", `C'est celle qui brille. ${QUI.why}`);
  for (const t of Object.values(QUI.retry)) add("erreur", t);
  for (const q of OU) add("consigne", q.prompt);
  add("indice", OU_CLUE); add("reussite", `Oui ! ${OU_WHY}`); add("indice", `C'est celle qui brille. ${OU_WHY}`);
  for (const t of Object.values(OU_RETRY)) add("erreur", t);
  for (const q of GESTES_Q) {
    add("consigne", q.prompt); add("indice", q.clue); add("reussite", `Oui ! ${q.why}`); add("indice", `C'est celle qui brille. ${q.why}`);
    for (const t of Object.values(q.retry)) add("erreur", t);
  }
  add("indice", "Ce n'est pas celle-là. Regarde ce qui reste.");
  add("erreur", "Regarde bien, et écoute encore.");
  return out;
}
export const _goutteData = { EDGES, STEPS, LABO, BOIRE, GESTES_Q, succ, hasEdge, tourItem, walk };
