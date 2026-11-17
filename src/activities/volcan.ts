// Île des Découvertes — « Le volcan d'Octave » : Octave enfile sa combinaison argentée ; avec lui, l'enfant devient
// apprenti volcanologue.
// 1. Dans le volcan : on touche les parties du volcan coupé en deux (poche de magma, cheminée, cratère, lave, cendres).
// 2. L'éruption : faire monter le magma jusqu'au cratère (au doigt), « et ensuite ? », l'étape qui manque.
// 3. La lave : très chaude, elle coule ; refroidie, elle devient pierre ; la pierre ponce flotte ; le sable noir.
// 4. Volcans rouges, volcans gris ; endormis ou réveillés.
// 5. Le métier de volcanologue : se protéger (combinaison, casque, masque), surveiller (sismomètre, thermomètre,
//    drone), prévenir (on s'éloigne avec les adultes).
// 6. Les volcans du monde, avec les drapeaux de leurs pays ; le geyser.
// Chaque phrase dite est écrite ici ; voiceLines() les donne toutes, pour la voix naturelle.
import type { Rng } from "../core";
import { FLAG_BY_CODE, TWINS, flagSVG } from "../flags";
import type { ActivityModule, Ctx, Item, View } from "../host";
import { emoji } from "../lexique";
import { sfx } from "../services";
import { glow, h, medallion } from "../ui";
import { CHIMNEY, COUPE_PARTS, FLOW_PATH, PART_LABEL, VART, coupeSVG, vartSVG, volcanStickerSVG, type CoupePart } from "./volcan_art";

const PARTIES = "DECOUV.VOLCAN.PARTIES", ERUPTION = "DECOUV.VOLCAN.ERUPTION", LAVE = "DECOUV.VOLCAN.LAVE",
  TYPES = "DECOUV.VOLCAN.TYPES", METIER = "DECOUV.VOLCAN.METIER", MONDE = "DECOUV.VOLCAN.MONDE";
type Kind = "partie" | "monte" | "suite" | "ordre" | "lave" | "type" | "metier" | "monde";
interface Opt { art: string; label: string; flag?: boolean }
export interface VolcanItem extends Item {
  kind: Kind; key: string; chap: string; target: string; choices: string[]; opts: Record<string, Opt>;
  scene: string[]; seq?: string[]; miss?: number; clue: string; why: string; win: string; retry: Record<string, string>;
}

// Image : un dessin maison (VART) ou un emoji du système.
const pic = (id: string, cls = "") => `<span class="wart${cls ? ` ${cls}` : ""}">${VART[id] ? vartSVG(id) : emoji(id)}</span>`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- 1. Dans le volcan ----------
export const PARTS: Record<CoupePart, { cest: string; clue: string; why: string; asks: { p: string; d: number }[] }> = {
  chambre: { cest: "Ça, c'est la poche de magma, tout au fond, sous le volcan.", clue: "Cherche tout en bas, sous la terre : c'est rouge, et très chaud.",
    why: "Le magma attend sous le volcan, dans une grande poche : la poche de magma.",
    asks: [{ p: "Touche la poche de magma, sous le volcan.", d: -0.6 }, { p: "Où est le magma, avant de sortir du volcan ? Touche le bon endroit.", d: 0.1 }] },
  cheminee: { cest: "Ça, c'est la cheminée, le tuyau qui monte au milieu du volcan.", clue: "Cherche le tuyau qui part de la poche de magma, et qui monte tout droit.",
    why: "Le magma monte par la cheminée, le tuyau au milieu du volcan.",
    asks: [{ p: "Touche la cheminée, le tuyau du volcan.", d: -0.3 }, { p: "Par où le magma monte-t-il ? Touche le bon endroit.", d: 0.3 }] },
  cratere: { cest: "Ça, c'est le cratère, le grand trou tout en haut.", clue: "Cherche tout en haut du volcan : c'est un grand trou.",
    why: "La lave sort par le cratère, le grand trou tout en haut du volcan.",
    asks: [{ p: "Touche le cratère, tout en haut du volcan.", d: -0.5 }, { p: "Par où la lave sort-elle du volcan ? Touche le bon endroit.", d: 0.2 }] },
  coulee: { cest: "Ça, c'est la lave qui coule sur le volcan.", clue: "Cherche la rivière orange, sur le côté du volcan.",
    why: "Dehors, le magma s'appelle la lave : elle coule sur le volcan, comme une rivière de feu.",
    asks: [{ p: "Touche la lave qui coule sur le volcan.", d: -0.6 }, { p: "Dehors, le magma s'appelle la lave. Où est-elle ? Touche-la.", d: 0.2 }] },
  cendres: { cest: "Ça, c'est le nuage de cendres, dans le ciel.", clue: "Cherche dans le ciel, au-dessus du volcan.",
    why: "Le volcan lance des cendres : elles font un grand nuage gris dans le ciel.",
    asks: [{ p: "Touche le nuage de cendres.", d: -0.6 }, { p: "Qu'est-ce qui monte tout gris dans le ciel ? Touche-le.", d: 0 }] },
};
const PART_RETRY = (k: CoupePart) => `${PARTS[k].cest} Cherche encore !`;
const PART_HINT3 = "Regarde bien : c'est par ici.";
const PART_HINT4 = (k: CoupePart) => `Regarde, ça brille ici. ${PARTS[k].why}`;

// ---------- 2. L'éruption ----------
export const MONTE = {
  prompt: "Le magma est très chaud : il veut sortir ! Fais-le monter : glisse ton doigt de la poche de magma jusqu'au cratère.",
  clue: "Pars de la poche de magma, tout en bas, et monte par la cheminée, le tuyau du milieu.",
  hint3: "Suis la flèche, du bas vers le haut.",
  hint4: "Je t'aide un peu… Pousse le magma jusqu'en haut !",
  why: "Le magma est monté par la cheminée jusqu'au cratère : c'est l'éruption ! Dehors, on l'appelle la lave.",
};

type StepId = "chauffe" | "monte" | "gronde" | "eruption" | "coulee" | "nuage" | "cendres" | "pierre" | "plantes" | "ile";
interface Step { nom: string; label: string; plur?: boolean }
export const STEPS: Record<StepId, Step> = {
  chauffe: { nom: "le magma qui chauffe sous la terre", label: "Le magma chauffe" },
  monte: { nom: "le magma qui monte dans la cheminée", label: "Le magma monte" },
  gronde: { nom: "le volcan qui gronde et qui fume", label: "Le volcan gronde" },
  eruption: { nom: "l'éruption", label: "L'éruption" },
  coulee: { nom: "la lave qui coule", label: "La lave coule" },
  nuage: { nom: "le nuage de cendres", label: "Le nuage de cendres" },
  cendres: { nom: "la pluie de cendres", label: "Les cendres tombent" },
  pierre: { nom: "la lave devenue pierre", label: "La pierre" },
  plantes: { nom: "les plantes qui poussent", label: "Les plantes", plur: true },
  ile: { nom: "la nouvelle terre dans la mer", label: "Une nouvelle terre" },
};
const cest = (id: StepId) => `${STEPS[id].plur ? "Ça, ce sont" : "Ça, c'est"} ${STEPS[id].nom}.`;
const optOf = (id: StepId): Opt => ({ art: id, label: STEPS[id].label });
interface Edge { from: StepId; to: StepId; d: number; prompt: string; clue: string; why: string; q: boolean }
const E = (from: StepId, to: StepId, d: number, prompt: string, clue: string, why: string, q = true): Edge => ({ from, to, d, prompt, clue, why, q });
export const EDGES: Edge[] = [
  E("chauffe", "monte", -0.3, "Sous la terre, le magma chauffe, chauffe… Il est plus léger que les roches autour. Que se passe-t-il ?",
    "Ce qui est plus léger monte, comme une bulle dans l'eau.", "Le magma monte dans la cheminée du volcan."),
  E("monte", "gronde", 0.2, "Le magma monte, et pousse très fort. Que se passe-t-il ?",
    "Quand le magma pousse, la terre bouge un peu, et le volcan fait du bruit.", "La terre tremble, le volcan gronde et se met à fumer : il se réveille !"),
  E("gronde", "eruption", -0.2, "Le volcan gronde de plus en plus fort. Que se passe-t-il ?",
    "Le magma est arrivé tout en haut : il va sortir !", "Boum ! C'est l'éruption : le magma sort par le cratère. Dehors, on l'appelle la lave."),
  E("eruption", "coulee", -0.1, "La lave rouge jaillit du cratère. Que fait-elle ensuite ?",
    "La lave est liquide, comme une soupe très épaisse : elle descend.", "La lave coule sur les pentes du volcan, comme une rivière de feu."),
  E("eruption", "nuage", 0.3, "Ce volcan-là explose très fort. Qu'est-ce qui monte dans le ciel ?",
    "Quand le volcan explose, il lance de la poussière de roche, toute grise.", "Un énorme nuage de cendres grises monte dans le ciel."),
  E("nuage", "cendres", 0.4, "Le nuage de cendres est très lourd. Que se passe-t-il ?",
    "Ce qui monte finit toujours par redescendre.", "Les cendres retombent partout, comme une neige grise."),
  E("coulee", "pierre", 0.3, "La lave coule loin du volcan, et elle refroidit. Que devient-elle ?",
    "Quand la lave refroidit, elle devient dure.", "En refroidissant, la lave devient dure : c'est de la pierre noire."),
  E("coulee", "ile", 0.7, "La lave coule jusqu'à la mer. Que fabrique-t-elle ?",
    "Dans l'eau, la lave refroidit tout de suite, et devient de la pierre.", "Elle refroidit dans la mer, et fabrique une nouvelle terre : l'île grandit !"),
  E("pierre", "plantes", 0.5, "Les années passent sur la lave refroidie. Que se passe-t-il ?",
    "Avec la pluie et le soleil, la vie revient.", "Petit à petit, des plantes poussent : la terre des volcans est très bonne pour elles."),
  E("cendres", "plantes", 0.6, "", "", "Petit à petit, des plantes repoussent dans les cendres.", false),
];
const succ = (id: StepId) => EDGES.filter((e) => e.from === id).map((e) => e.to);
const hasEdge = (a: StepId, b: StepId) => EDGES.some((e) => e.from === a && e.to === b);
// Étapes qu'un enfant pourrait confondre (deux suites possibles de l'éruption, la pierre et l'île faite de pierre).
const ALIKE: [StepId, StepId][] = [["coulee", "nuage"], ["pierre", "ile"], ["cendres", "nuage"]];
const alike = (a: StepId) => ALIKE.flatMap(([x, y]) => (x === a ? [y] : y === a ? [x] : []));
const ORDRE_PROMPT = "Il manque une étape dans l'éruption. Laquelle ?";
const ordreClue = (a: StepId, b: StepId) => `Avant, il y a ${STEPS[a].nom}. Après, il y a ${STEPS[b].nom}.`;

// ---------- 3. La lave ----------
interface Q { id: string; scene?: string; d: number; prompt: string; clue: string; why: string; target: string; opts: Record<string, Opt>; retry: Record<string, string> }
export const LAVE_Q: Q[] = [
  { id: "chaude", scene: "eruption", d: -0.6, prompt: "La lave sort du volcan. Est-elle très chaude, ou froide ?",
    clue: "Le magma vient de tout au fond, là où il fait si chaud que la roche fond.", why: "La lave est très, très chaude : si chaude que la roche fond !", target: "chaude",
    opts: { chaude: { art: "lave", label: "Très chaude" }, froide: { art: "🧊", label: "Froide" } },
    retry: { froide: "Oh non, pas froide du tout ! La lave, c'est de la roche fondue, bien plus chaude qu'un four." } },
  { id: "coule", scene: "eruption", d: -0.2, prompt: "Quand la lave sort du volcan, comment est-elle ?",
    clue: "Pense à une soupe très épaisse, qui déborde de la casserole.", why: "Elle coule, comme une soupe très épaisse et très chaude.", target: "coule",
    opts: { coule: { art: "lave", label: "Elle coule" }, dure: { art: "🪨", label: "Elle est dure" }, vole: { art: "☁️", label: "Elle s'envole" } },
    retry: { dure: "Pas encore ! Elle deviendra dure plus tard, en refroidissant. Pour l'instant, elle est liquide.",
      vole: "La lave est bien trop lourde pour s'envoler : elle coule le long du volcan." } },
  { id: "refroidit", scene: "coulee", d: 0.2, prompt: "La lave refroidit. Que devient-elle ?",
    clue: "Pense à l'eau qui gèle : elle devient dure. La lave fait pareil !", why: "En refroidissant, la lave devient dure : c'est de la pierre, comme l'eau qui gèle devient de la glace.", target: "pierre",
    opts: { pierre: { art: "pierre", label: "De la pierre" }, eau: { art: "💧", label: "De l'eau" }, fumee: { art: "fumee", label: "De la fumée" } },
    retry: { eau: "Non, la lave n'est pas de l'eau : c'est de la roche fondue. En refroidissant, elle redevient dure.",
      fumee: "La fumée s'envole, mais la lave est lourde : en refroidissant, elle devient dure." } },
  { id: "chaud", d: 0.2, prompt: "Qu'est-ce qui est le plus chaud ?",
    clue: "L'une de ces choses est si chaude qu'elle fait fondre la roche !", why: "La lave ! Elle est bien plus chaude que le four de la cuisine.", target: "lave",
    opts: { lave: { art: "lave", label: "La lave" }, four: { art: "four", label: "Le four" }, bain: { art: "🛁", label: "L'eau du bain" } },
    retry: { four: "Le four est très chaud, mais la lave l'est bien plus : elle fait fondre la roche !",
      bain: "L'eau du bain est juste tiède. La lave, elle, fait fondre la roche !" } },
  { id: "ponce", scene: "ponce", d: 0.8, prompt: "Voici une pierre de volcan pleine de petits trous : la pierre ponce. D'habitude, les pierres coulent… Et celle-ci, que fait-elle dans l'eau ?",
    clue: "Elle est pleine de petits trous remplis d'air, comme une éponge.", why: "Surprise : elle flotte ! Ses petits trous sont pleins d'air : elle est très légère.", target: "flotte",
    opts: { flotte: { art: "flotte_ponce", label: "Elle flotte" }, coule: { art: "coule_ponce", label: "Elle coule" } },
    retry: { coule: "Essaie encore : ses petits trous pleins d'air la rendent très légère…" } },
  { id: "sable", d: 0.6, prompt: "Près des volcans, la lave émiettée fait des plages. De quelle couleur est leur sable ?",
    clue: "Rappelle-toi : la lave refroidie devient une pierre toute noire.", why: "Noir ! Le sable des volcans, c'est de la lave refroidie, émiettée en tout petits grains.", target: "noir",
    opts: { noir: { art: "sable_noir", label: "Noir" }, dore: { art: "sable_dore", label: "Doré" } },
    retry: { dore: "Le sable doré vient d'autres plages. Près des volcans, il est fait de lave refroidie, toute noire !" } },
];

// ---------- 4. Volcans rouges, volcans gris ; endormis ou réveillés ----------
const TYPE_PROMPT = "Regarde bien ce volcan. Est-ce un volcan rouge, ou un volcan gris ?";
const TYPE_CLUE = "Un volcan rouge laisse couler sa lave. Un volcan gris lance un grand nuage de cendres.";
const TYPE_WHY = { rouge: "C'est un volcan rouge : sa lave est liquide, elle coule et jaillit.", gris: "C'est un volcan gris : il explose, et lance des cendres et des pierres très haut." };
const TYPE_RETRY = { rouge: "Regarde : la lave coule, et il n'y a pas de grand nuage gris.", gris: "Regarde : un grand nuage gris monte dans le ciel, et la lave ne coule pas." };
const TYPE_OPTS: Record<string, Opt> = { rouge: { art: "icone_rouge", label: "Volcan rouge" }, gris: { art: "icone_gris", label: "Volcan gris" } };
export const TYPE_SCENES = [
  { id: "fontaine", art: "rouge_fontaine", to: "rouge", d: 0.4 }, { id: "rivieres", art: "rouge_rivieres", to: "rouge", d: 0.4 },
  { id: "lac", art: "rouge_lac", to: "rouge", d: 0.7 }, { id: "panache", art: "gris_panache", to: "gris", d: 0.4 },
  { id: "pluie", art: "gris_pluie", to: "gris", d: 0.6 }, { id: "bombes", art: "gris_bombes", to: "gris", d: 0.6 },
] as const;
const SOMMEIL_PROMPT = "Regarde bien ce volcan. Est-il endormi, ou réveillé ?";
const SOMMEIL_CLUE = "Un volcan réveillé fume et gronde. Un volcan endormi est tout calme : des arbres poussent sur ses pentes.";
const SOMMEIL_WHY = { endormi: "Il est endormi : ni fumée, ni lave. Des arbres ont poussé, et parfois un lac remplit son cratère.",
  reveille: "Il est réveillé : il fume, il gronde, et le magma n'est pas loin." };
const SOMMEIL_RETRY = { endormi: "Regarde : pas de fumée, pas de lave… il est tout calme.", reveille: "Regarde bien : il fume ! Un volcan qui fume ne dort pas." };
const SOMMEIL_OPTS: Record<string, Opt> = { endormi: { art: "icone_endormi", label: "Endormi" }, reveille: { art: "icone_reveille", label: "Réveillé" } };
export const SOMMEIL_SCENES = [
  { id: "lac", art: "endormi_lac", to: "endormi", d: 0.5 }, { id: "foret", art: "endormi_foret", to: "endormi", d: 0.5 },
  { id: "fumee", art: "reveille_fume", to: "reveille", d: 0.5 }, { id: "lueur", art: "reveille_lueur", to: "reveille", d: 0.6 },
] as const;
export const AUVERGNE = {
  prompt: "Les volcans d'Auvergne, en France, n'ont pas craché de lave depuis des milliers d'années. Sont-ils endormis, ou réveillés ?",
  clue: "Des milliers d'années sans lave… c'est un très, très long sommeil !",
  why: "Ils sont endormis depuis très longtemps : on peut même se promener dessus !",
  retry: "Pas de lave depuis des milliers d'années : ils sont profondément endormis !",
};

// ---------- 5. Le métier de volcanologue ----------
export const METIER_Q: Q[] = [
  { id: "combinaison", d: 0, prompt: "La volcanologue s'approche de la lave. Quel habit la protège de la chaleur ?",
    clue: "Il faut un habit brillant, qui renvoie la chaleur comme un miroir.", why: "La combinaison argentée renvoie la chaleur, comme un miroir renvoie la lumière.", target: "argent",
    opts: { argent: { art: "combinaison", label: "La combinaison argentée" }, maillot: { art: "🩱", label: "Le maillot de bain" }, short: { art: "🩳", label: "Le short" } },
    retry: { maillot: "Avec un maillot de bain, elle aurait bien trop chaud ! Cherche un habit brillant.",
      short: "Un short ne protège pas de la chaleur de la lave. Cherche un habit brillant." } },
  { id: "casque", d: -0.4, prompt: "Des petites pierres peuvent tomber du ciel. Que met-elle sur la tête ?",
    clue: "Il faut quelque chose de très solide sur la tête.", why: "Un casque bien solide protège sa tête des pierres qui tombent.", target: "casque",
    opts: { casque: { art: "⛑️", label: "Un casque" }, casquette: { art: "🧢", label: "Une casquette" }, couronne: { art: "👑", label: "Une couronne" } },
    retry: { casquette: "Une casquette protège du soleil, pas des pierres ! Cherche quelque chose de très solide.",
      couronne: "Une couronne, c'est joli, mais ça ne protège pas la tête !" } },
  { id: "masque", d: 0.3, prompt: "Le volcan souffle des gaz qui piquent le nez et la gorge. Que met-elle sur le visage ?",
    clue: "Il faut un masque qui nettoie l'air qu'on respire.", why: "Le masque à gaz nettoie l'air : elle peut respirer sans tousser.", target: "masque",
    opts: { masque: { art: "masque", label: "Un masque à gaz" }, lunettes: { art: "🕶️", label: "Des lunettes de soleil" }, carnaval: { art: "🎭", label: "Un masque de carnaval" } },
    retry: { lunettes: "Les lunettes de soleil protègent les yeux, pas le nez ni la gorge.",
      carnaval: "Un masque de carnaval, c'est pour faire la fête : il ne nettoie pas l'air !" } },
  { id: "sismometre", d: 0.6, prompt: "Quel appareil sent la terre trembler ?",
    clue: "Cherche l'appareil qui dessine des zigzags quand la terre bouge.", why: "Le sismomètre sent la terre trembler, et dessine des zigzags. Beaucoup de zigzags : le volcan se réveille !", target: "sismo",
    opts: { sismo: { art: "sismometre", label: "Le sismomètre" }, radio: { art: "📻", label: "La radio" }, tele: { art: "📺", label: "La télévision" } },
    retry: { radio: "La radio fait de la musique ! Cherche l'appareil qui dessine des zigzags.",
      tele: "La télévision montre des images, mais elle ne sent pas la terre trembler." } },
  { id: "thermometre", d: -0.2, prompt: "Comment la volcanologue sait-elle si la lave est très chaude ?",
    clue: "Un appareil mesure la chaleur, sans toucher.", why: "Avec un thermomètre spécial, de loin. On ne touche jamais la lave !", target: "thermo",
    opts: { thermo: { art: "🌡️", label: "Avec un thermomètre" }, main: { art: "✋", label: "En la touchant" }, langue: { art: "👅", label: "En la goûtant" } },
    retry: { main: "Surtout pas ! La lave brûle : on ne la touche jamais.", langue: "Beurk, surtout pas ! La lave brûle : on ne la goûte jamais !" } },
  { id: "drone", d: 0.5, prompt: "Comment regarder au fond du cratère, sans s'approcher ?",
    clue: "Il faut quelque chose qui vole au-dessus du cratère.", why: "Le drone vole au-dessus du cratère et prend des photos : la volcanologue reste à l'abri.", target: "drone",
    opts: { drone: { art: "drone", label: "Avec un drone" }, loupe: { art: "🔍", label: "Avec une loupe" }, echelle: { art: "🪜", label: "Avec une échelle" } },
    retry: { loupe: "La loupe montre les petites choses, tout près. Le cratère est grand, et bien trop dangereux !",
      echelle: "Avec une échelle, il faudrait s'approcher : bien trop dangereux ! Cherche ce qui vole." } },
  { id: "partir", d: -0.2, prompt: "Le volcan se réveille. Que font les gens qui habitent tout près ?",
    clue: "Les volcanologues préviennent tout le monde : il faut aller loin du volcan.", why: "Les volcanologues préviennent tout le monde à temps : on s'éloigne avec les adultes, et on est en sécurité.", target: "partir",
    opts: { partir: { art: "partir", label: "Ils s'éloignent avec les adultes" }, voir: { art: "lave", label: "Ils vont voir la lave" }, lit: { art: "🛏️", label: "Ils se cachent sous le lit" } },
    retry: { voir: "Surtout pas ! La lave est bien trop dangereuse. On s'éloigne, avec les adultes.",
      lit: "Sous le lit, on serait encore tout près du volcan ! On s'éloigne, avec les adultes." } },
  { id: "metier", d: -0.5, prompt: "Que fait une volcanologue ?",
    clue: "Dans son nom, on entend le mot volcan !", why: "Elle étudie et surveille les volcans, pour prévenir les gens quand ils se réveillent.", target: "volcans",
    opts: { volcans: { art: "volcanologue", label: "Elle surveille les volcans" }, animaux: { art: "🐾", label: "Elle soigne les animaux" }, bus: { art: "🚌", label: "Elle conduit le bus" } },
    retry: { animaux: "Ça, c'est le métier de vétérinaire ! La volcanologue, elle, s'occupe des volcans.",
      bus: "Ça, c'est le métier de chauffeur de bus ! La volcanologue, elle, s'occupe des volcans." } },
];

// ---------- 6. Les volcans du monde ----------
export const MONDE_V = [
  { id: "fuji", code: "JP", label: "Le mont Fuji", d: 0.6, prompt: "Voici le mont Fuji, un volcan endormi au chapeau de neige. Il est au Japon : touche le drapeau du Japon." },
  { id: "etna", code: "IT", label: "L'Etna", d: 0.7, prompt: "Voici l'Etna, un volcan rouge qui se réveille très souvent. Il est en Italie : touche le drapeau de l'Italie." },
  { id: "stromboli", code: "IT", label: "Le Stromboli", d: 0.9, prompt: "Voici le Stromboli, une petite île volcan qui lance des étincelles toutes les quelques minutes. Il est en Italie : touche le drapeau de l'Italie." },
  { id: "fournaise", code: "FR", label: "Le piton de la Fournaise", d: 0.6, prompt: "Voici le piton de la Fournaise, un volcan rouge sur l'île de La Réunion, loin dans l'océan. La Réunion, c'est la France : touche le drapeau de la France." },
  { id: "puy", code: "FR", label: "Le puy de Dôme", d: 0.5, prompt: "Voici le puy de Dôme et ses voisins, des volcans endormis depuis très longtemps. Ils sont en France : touche le drapeau de la France." },
  { id: "hawai", code: "US", label: "Hawaï", d: 1.0, prompt: "Voici un volcan d'Hawaï, où la lave coule jusqu'à la mer. Hawaï, ce sont des îles des États-Unis : touche le drapeau des États-Unis." },
  { id: "geyser", code: "US", label: "Yellowstone", d: 1.0, prompt: "À Yellowstone, aux États-Unis, la chaleur du volcan fait jaillir des geysers d'eau chaude. Touche le drapeau des États-Unis." },
  { id: "indonesie", code: "ID", label: "L'Indonésie", d: 1.1, prompt: "L'Indonésie est le pays qui a le plus de volcans réveillés au monde ! Touche le drapeau de l'Indonésie." },
  { id: "santorin", code: "GR", label: "Santorin", d: 1.1, prompt: "Voici une île en forme de croissant, fabriquée par un volcan. Elle est en Grèce : touche le drapeau de la Grèce." },
  { id: "andes", code: "CL", label: "Les Andes", d: 1.2, prompt: "Au Chili, des volcans se dressent tout le long de grandes montagnes, les Andes. Touche le drapeau du Chili." },
  { id: "cameroun", code: "CM", label: "Le mont Cameroun", d: 1.2, prompt: "Voici le mont Cameroun, un volcan d'Afrique qui se réveille de temps en temps. Touche le drapeau du Cameroun." },
];
// Drapeaux proposés à côté : bien différents (ni jumeaux, ni trop proches du bon).
export const FLAG_POOL = ["FR", "IT", "JP", "US", "ID", "GR", "CL", "CM", "GB", "DE", "CA", "CN", "IN", "BE", "MA", "SE"];
const CLOSE: [string, string][] = [["CL", "US"], ["FR", "GB"], ["ID", "JP"], ["IT", "MA"]];
const tooClose = (a: string, b: string) => [...TWINS, ...CLOSE].some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const flagWhy = (code: string) => `C'est le drapeau ${FLAG_BY_CODE[code].of} : ${FLAG_BY_CODE[code].desc}.`;
const flagClue = (code: string) => `Le drapeau ${FLAG_BY_CODE[code].of} : ${FLAG_BY_CODE[code].desc}.`;
const flagRetry = (w: string, t: string) => `Ça, c'est le drapeau ${FLAG_BY_CODE[w].of}. Cherche le drapeau ${FLAG_BY_CODE[t].of}.`;
const flagHint4 = (code: string) => `Le drapeau ${FLAG_BY_CODE[code].of}, c'est celui qui brille.`;
export const GEYSER_Q: Q = {
  id: "geyser", scene: "chauffe", d: 0.4, prompt: "Sous la terre, le volcan rend l'eau très chaude. Qu'est-ce qui jaillit du sol ?",
  clue: "L'eau chauffée par le volcan devient si chaude qu'elle jaillit, comme une fontaine.", why: "Un geyser : de l'eau chaude et de la vapeur jaillissent très haut, comme une fontaine !", target: "geyser",
  opts: { geyser: { art: "geyser", label: "Un geyser d'eau chaude" }, neige: { art: "❄️", label: "De la neige" }, chocolat: { art: "☕", label: "Du chocolat chaud" } },
  retry: { neige: "La neige, c'est quand il fait froid ! Ici, le volcan chauffe l'eau.", chocolat: "Ha ha ! Du chocolat chaud, ce serait bien… mais non : c'est de l'eau chaude qui jaillit !" },
};

// ---------- Présentations des chapitres (une fois par séance, tant que c'est nouveau) ----------
export const INTROS: Record<string, { text: string; art: string }> = {
  [PARTIES]: { art: "combinaison", text: "Octave enfile sa combinaison argentée : aujourd'hui, il est volcanologue ! Regarde : il a coupé un volcan en deux, comme une pomme, pour voir ce qu'il y a dedans." },
  [ERUPTION]: { art: "eruption", text: "Tout au fond, sous le volcan, il fait si chaud que la roche fond : c'est le magma. Quand il monte et qu'il sort par le cratère, c'est l'éruption !" },
  [LAVE]: { art: "lave", text: "La lave, c'est de la roche fondue, plus chaude qu'un four ! Elle coule comme une soupe épaisse… puis elle refroidit, et devient de la pierre." },
  [TYPES]: { art: "icone_rouge", text: "Il y a des volcans rouges, qui laissent couler leur lave, et des volcans gris, qui explosent en lançant des cendres. Et certains volcans sont endormis depuis très longtemps…" },
  [METIER]: { art: "sismometre", text: "Les volcanologues surveillent les volcans, avec des habits et des appareils spéciaux. Quand un volcan se réveille, ils préviennent tout le monde. À toi d'essayer !" },
  [MONDE]: { art: "fuji", text: "Il y a des volcans partout dans le monde : au Japon, en Italie, en France… Partons les voir, avec les drapeaux de leurs pays !" },
};
const introShown = new WeakMap<Ctx, Set<string>>();

// ---------- Fabriques d'exercices ----------
const base = (kind: Kind, key: string, chap: string, d: number, form: Item["form"], guess: number) =>
  ({ kind, key, chap, skill: chap, difficulty: d, form, guess, level: 0 });

function makePartie(r: Rng): VolcanItem {
  const target = r.pick([...COUPE_PARTS]);
  const ask = r.pick(PARTS[target].asks);
  return { ...base("partie", `partie:${target}:${PARTS[target].asks.indexOf(ask)}`, PARTIES, ask.d, "image", 1 / 5), target, choices: [...COUPE_PARTS],
    opts: Object.fromEntries(COUPE_PARTS.map((k) => [k, { art: "", label: PART_LABEL[k] }])), scene: ["coupe"], prompt: ask.p, clue: PARTS[target].clue,
    why: PARTS[target].why, win: `Oui ! ${PARTS[target].why}`, retry: Object.fromEntries(COUPE_PARTS.filter((k) => k !== target).map((k) => [k, PART_RETRY(k)])) };
}

function makeMonte(): VolcanItem {
  return { ...base("monte", "monte", ERUPTION, -0.2, "manipulation", 0.5), target: "cratere", choices: [], opts: {}, scene: ["coupe"],
    prompt: MONTE.prompt, clue: MONTE.clue, why: MONTE.why, win: `Bravo ! ${MONTE.why}`, retry: {} };
}

function makeSuite(r: Rng, edge: Edge, easy: boolean): VolcanItem {
  const no = new Set<StepId>([edge.from, ...succ(edge.from), ...alike(edge.to)]);
  if (easy) for (const s of succ(edge.to)) no.add(s);
  const wrong = r.shuffle((Object.keys(STEPS) as StepId[]).filter((s) => !no.has(s))).slice(0, 2);
  const choices = r.shuffle([edge.to, ...wrong]);
  return { ...base("suite", `suite:${edge.from}>${edge.to}`, ERUPTION, edge.d, "recit", 1 / 3), target: edge.to, choices,
    opts: Object.fromEntries(choices.map((c) => [c, optOf(c)])), scene: [edge.from], prompt: edge.prompt, clue: edge.clue,
    why: edge.why, win: `Oui ! ${edge.why}`, retry: Object.fromEntries(wrong.map((w) => [w, `${cest(w)} Ce n'est pas ce qui vient juste après.`])) };
}

// L'étape qui manque : quatre étapes qui se suivent, l'une cachée ; les mauvaises réponses ne peuvent pas aller à sa place.
export function walks(): StepId[][] {
  const out: StepId[][] = [];
  const go = (seq: StepId[]) => {
    if (seq.length === 4) { out.push(seq); return; }
    for (const n of succ(seq[seq.length - 1])) if (!seq.includes(n)) go([...seq, n]);
  };
  for (const s of Object.keys(STEPS) as StepId[]) go([s]);
  return out;
}
export function ordreItem(seq: StepId[], miss: number, r: Rng): VolcanItem {
  const prev = seq[miss - 1], next = seq[miss + 1], target = seq[miss];
  const fits = (s: StepId) => hasEdge(prev, s) && hasEdge(s, next);
  const pool = (Object.keys(STEPS) as StepId[]).filter((s) => !seq.includes(s) && !fits(s) && !alike(target).includes(s));
  const wrong = r.shuffle(pool).slice(0, 2);
  const choices = r.shuffle([target, ...wrong]);
  const why = EDGES.find((e) => e.from === prev && e.to === target)!.why;
  return { ...base("ordre", `ordre:${seq.join(">")}:${miss}`, ERUPTION, 0.9, "recit", 1 / 3), target, choices, seq, miss,
    opts: Object.fromEntries(choices.map((c) => [c, optOf(c)])), scene: [], prompt: ORDRE_PROMPT, clue: ordreClue(prev, next), why, win: `Oui ! ${why}`,
    retry: Object.fromEntries(wrong.map((w) => [w, `${cest(w)} Regarde ce qui vient avant, et ce qui vient après.`])) };
}
const makeOrdre = (r: Rng) => ordreItem(r.pick(walks()), r.next() < 0.5 ? 1 : 2, r);

function fromQ(kind: Kind, chap: string, q: Q, r: Rng): VolcanItem {
  const choices = r.shuffle(Object.keys(q.opts));
  return { ...base(kind, `${kind}:${q.id}`, chap, q.d, "image", 1 / choices.length), target: q.target, choices, opts: q.opts,
    scene: q.scene ? [q.scene] : [], prompt: q.prompt, clue: q.clue, why: q.why, win: `Oui ! ${q.why}`, retry: q.retry };
}

function makeType(r: Rng): VolcanItem {
  const s = r.pick([...TYPE_SCENES]);
  const other = s.to === "rouge" ? "gris" : "rouge";
  return { ...base("type", `type:${s.id}`, TYPES, s.d, "image", 1 / 2), target: s.to, choices: r.shuffle(["rouge", "gris"]), opts: TYPE_OPTS,
    scene: [s.art], prompt: TYPE_PROMPT, clue: TYPE_CLUE, why: TYPE_WHY[s.to], win: `Oui ! ${TYPE_WHY[s.to]}`, retry: { [other]: TYPE_RETRY[s.to] } };
}
function makeSommeil(r: Rng): VolcanItem {
  const s = r.pick([...SOMMEIL_SCENES]);
  const other = s.to === "endormi" ? "reveille" : "endormi";
  return { ...base("type", `sommeil:${s.id}`, TYPES, s.d, "image", 1 / 2), target: s.to, choices: r.shuffle(["endormi", "reveille"]), opts: SOMMEIL_OPTS,
    scene: [s.art], prompt: SOMMEIL_PROMPT, clue: SOMMEIL_CLUE, why: SOMMEIL_WHY[s.to], win: `Oui ! ${SOMMEIL_WHY[s.to]}`, retry: { [other]: SOMMEIL_RETRY[s.to] } };
}
function makeAuvergne(r: Rng): VolcanItem {
  return { ...base("type", "sommeil:auvergne", TYPES, 0.8, "recit", 1 / 2), target: "endormi", choices: r.shuffle(["endormi", "reveille"]), opts: SOMMEIL_OPTS,
    scene: ["puy"], prompt: AUVERGNE.prompt, clue: AUVERGNE.clue, why: AUVERGNE.why, win: `Oui ! ${AUVERGNE.why}`, retry: { reveille: AUVERGNE.retry } };
}

function makeMonde(r: Rng): VolcanItem {
  const v = r.pick(MONDE_V);
  const wrong = r.shuffle(FLAG_POOL.filter((c) => c !== v.code && !tooClose(c, v.code))).slice(0, 2);
  const choices = r.shuffle([v.code, ...wrong]);
  return { ...base("monde", `monde:${v.id}`, MONDE, v.d, "symbole", 1 / 3), target: v.code, choices,
    opts: Object.fromEntries(choices.map((c) => [c, { art: c, label: FLAG_BY_CODE[c].name, flag: true }])), scene: [v.id, v.label],
    prompt: v.prompt, clue: flagClue(v.code), why: flagWhy(v.code), win: `Oui ! ${flagWhy(v.code)}`,
    retry: Object.fromEntries(wrong.map((w) => [w, flagRetry(w, v.code)])) };
}

function byLevel(lv: number, r: Rng): VolcanItem {
  const x = r.next();
  if (lv <= 1) return makePartie(r);
  if (lv === 2) return x < 0.3 ? makeMonte() : x < 0.75 ? makeSuite(r, r.pick(EDGES.filter((e) => e.q)), true) : makeOrdre(r);
  if (lv === 3) return fromQ("lave", LAVE, r.pick(LAVE_Q), r);
  if (lv === 4) return x < 0.5 ? makeType(r) : x < 0.85 ? makeSommeil(r) : makeAuvergne(r);
  if (lv === 5) return fromQ("metier", METIER, r.pick(METIER_Q), r);
  return x < 0.8 ? makeMonde(r) : fromQ("monde", MONDE, GEYSER_Q, r);
}

// ---------- Le volcan coupé en deux : toucher une partie ----------
function renderCoupe(item: VolcanItem, view: View) {
  const wrap = h("div", { class: "vcoupe", html: coupeSVG() });
  wrap.querySelectorAll<SVGGElement>("[data-t]").forEach((g) => {
    g.addEventListener("click", () => {
      const t = g.getAttribute("data-t")!;
      const ok = t === item.target;
      view.answer(ok, g, ok ? undefined : item.retry[t] ?? "Regarde bien, et écoute encore.");
    });
  });
  view.stage.appendChild(wrap);
}

// ---------- Faire monter le magma : glisser le doigt de la poche jusqu'au cratère (ou toucher la poche) ----------
interface Monte { help: () => void; arrow: () => void }
function renderMonte(view: View) {
  const wrap = h("div", { class: "vcoupe vmonte", html: coupeSVG({ flow: false, cloud: false, level: 0.06 }) });
  const finger = h("span", { class: "vfinger", "aria-hidden": "true" }, "👆");
  wrap.appendChild(finger);
  view.stage.appendChild(wrap);
  const svg = wrap.querySelector("svg")!;
  const magma = svg.querySelector<SVGRectElement>(".vmagma"), shine = svg.querySelector<SVGRectElement>(".vmagma-l");
  const crater = svg.querySelector<SVGPathElement>('[data-t="cratere"] path');
  let level = 0.06, done = false, track = false, moved = false, x0 = 0, y0 = 0;
  const H = CHIMNEY.bottom - CHIMNEY.top;
  const setLevel = (v: number) => {
    level = Math.max(level, Math.min(1, v));
    const top = CHIMNEY.bottom - level * H;
    for (const el of [magma, shine]) { el?.setAttribute("y", top.toFixed(1)); el?.setAttribute("height", (CHIMNEY.bottom - top).toFixed(1)); }
    if (level >= 0.97) erupt();
  };
  const toSvg = (e: PointerEvent): DOMPoint | null => {
    try {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(m.inverse());
    } catch { return null; } // navigateur (ou DOM simulé) sans géométrie SVG
  };
  const inChamber = (p: DOMPoint) => ((p.x - 100) / 46) ** 2 + ((p.y - 138) / 18) ** 2 <= 1;
  const inChimney = (p: DOMPoint) => Math.abs(p.x - CHIMNEY.x) <= 20 && p.y >= CHIMNEY.top - 12 && p.y <= CHIMNEY.bottom + 4;
  svg.addEventListener("pointerdown", (e) => {
    if (done) return;
    const p = toSvg(e);
    if (!p || !(inChamber(p) || inChimney(p))) return;
    e.preventDefault();
    track = true; moved = false; x0 = e.clientX; y0 = e.clientY;
    wrap.classList.remove("hinted"); finger.remove();
    try { svg.setPointerCapture(e.pointerId); } catch { /* ancien navigateur */ }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!track || done) return;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > 6) moved = true;
    const p = toSvg(e);
    if (!p || Math.abs(p.x - CHIMNEY.x) > 20) return; // hors de la cheminée : le magma attend
    const v = (CHIMNEY.bottom - p.y) / H;
    if (v > level && v <= level + 0.45) setLevel(v);
  });
  const end = () => {
    if (!track) return;
    track = false;
    // Un simple toucher pousse aussi le magma, un peu à chaque fois.
    if (!moved && !done) { setLevel(level + 0.17); sfx.drum(); }
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", () => { track = false; });
  function erupt() {
    if (done) return;
    done = true;
    crater?.setAttribute("fill", "#FF7F50");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "veruption");
    g.innerHTML = `<path class="vflow" d="${FLOW_PATH}" fill="none" stroke="#E8504A" stroke-width="10" stroke-linecap="round"/>`
      + `<path class="vflow" d="${FLOW_PATH}" fill="none" stroke="#FFC145" stroke-width="3.4" stroke-linecap="round"/>`
      + `<path class="vjet" d="M90 40 C84 28 88 16 95 8 C96 16 98 19 100 12 C102 19 104 16 105 8 C112 16 116 28 110 40 Z" fill="#FF7F50" stroke="#273043" stroke-width="2.4" stroke-linejoin="round"/>`
      + `<path class="vjet" d="M95 40 C93 31 96 24 100 20 C104 24 107 31 105 40 Z" fill="#FFC145"/>`
      + [[82, 14], [118, 12], [76, 26], [124, 24], [100, 2]].map(([x, y], i) => `<circle class="vdrop" style="animation-delay:${0.1 + i * 0.07}s" cx="${x}" cy="${y}" r="3.4" fill="#FF7F50" stroke="#273043" stroke-width="2"/>`).join("");
    svg.appendChild(g);
    g.querySelectorAll<SVGPathElement>(".vflow").forEach((p) => {
      const L = typeof p.getTotalLength === "function" ? p.getTotalLength() : 0;
      if (!L || typeof p.animate !== "function") return;
      p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`;
      p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1300, delay: 250, easing: "ease-out", fill: "forwards" });
    });
    wrap.classList.add("vshake");
    sfx.rumble(0.5);
    setTimeout(() => sfx.bang(), 250);
    setTimeout(() => { if (view.stage.isConnected) view.answer(true, wrap); }, 1100);
  }
  const ctl: Monte = {
    help: () => { if (!done) { const from = level; const t0 = performance.now(); const step = (t: number) => { const k = Math.min(1, (t - t0) / 900); setLevel(from + (0.8 - from) * k); if (k < 1 && !done) requestAnimationFrame(step); }; requestAnimationFrame(step); } },
    arrow: () => {
      if (svg.querySelector(".varrow")) return;
      const a = document.createElementNS("http://www.w3.org/2000/svg", "g");
      a.setAttribute("class", "varrow");
      a.innerHTML = `<path d="M100 130 V52" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/><path d="M91 60 L100 48 L109 60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      svg.appendChild(a);
    },
  };
  (view.stage as any)._monte = ctl;
}

const recent: string[] = [];

export const volcan: ActivityModule<VolcanItem> = {
  id: "volcan", title: "Le volcan d'Octave", domain: "decouvertes", island: "decouvertes", host: "octave",
  maxLevel: 6, items: 6,
  skills: [PARTIES, ERUPTION, LAVE, TYPES, METIER, MONDE],
  card: `<span style="display:block;width:1.1em;height:1.1em">${vartSVG("sticker_volcan")}</span>`,
  pitch: "Le volcan d'Octave, pour devenir volcanologue et découvrir ce qui se cache dans un volcan.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    let it: VolcanItem | null = null;
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
      h("span", { class: "wwho", html: medallion("octave") }),
      h("span", { html: pic(x.art, "big") }));
    return { text: x.text, el };
  },

  render(item, view) {
    const st = view.stage;
    if (item.kind === "partie") { renderCoupe(item, view); return; }
    if (item.kind === "monte") { renderMonte(view); return; }
    let slot: HTMLElement | null = null;
    const q = () => (slot = h("span", { class: "wart wq" }, "?"));
    if (item.kind === "ordre") {
      const parts: HTMLElement[] = [];
      item.seq!.forEach((s, i) => {
        if (i) parts.push(h("span", { class: "warrow" }, "➜"));
        parts.push(i === item.miss
          ? h("div", { class: "wstep miss" }, q(), h("span", { class: "wlab" }, "?"))
          : h("div", { class: "wstep" }, h("span", { html: pic(s) }), h("span", { class: "wlab" }, STEPS[s as StepId].label)));
      });
      st.appendChild(h("div", { class: "wstrip" }, ...parts));
    } else if (item.kind === "suite") {
      const from = item.scene[0] as StepId;
      st.appendChild(h("div", { class: "panel wpanel" },
        h("div", { class: "wstep plain" }, h("span", { html: pic(from, "big") }), h("span", { class: "wlab" }, STEPS[from].label)),
        h("span", { class: "warrow" }, "➜"), q()));
    } else if (item.kind === "monde" && item.opts[item.target]?.flag) {
      st.appendChild(h("div", { class: "panel wpanel" },
        h("div", { class: "wstep plain" }, h("span", { html: pic(item.scene[0], "big") }), h("span", { class: "wlab" }, item.scene[1]))));
    } else if (item.scene.length) {
      st.appendChild(h("div", { class: "panel wpanel" }, h("span", { html: pic(item.scene[0], "big") })));
    }
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const o = item.opts[c];
      const b = o.flag
        ? h("button", { type: "button", class: "card flagcard", "data-t": c, "aria-label": o.label, html: flagSVG(c, false) })
        : h("button", { type: "button", class: "card pickcard labelled wcard", "data-t": c, "aria-label": o.label, html: `${pic(o.art)}<span class="lab">${o.label}</span>` });
      b.addEventListener("click", () => {
        const ok = c === item.target;
        if (ok && slot) {
          slot.classList.remove("wq"); slot.classList.add("pop"); slot.innerHTML = VART[o.art] ? vartSVG(o.art) : emoji(o.art);
          const lab = slot.parentElement?.querySelector(".wlab"); if (lab && item.kind === "ordre") lab.textContent = o.label;
        }
        view.answer(ok, b, ok ? undefined : item.retry[c] ?? "Regarde bien, et écoute encore.");
      });
      row.appendChild(b);
    }
    st.appendChild(row);
  },

  hint(item, step, view) {
    if (step === 1) return item.prompt;
    if (item.kind === "monte") {
      const m = (view.stage as any)._monte as Monte | undefined;
      const wrap = view.stage.querySelector(".vmonte");
      if (step === 2) { wrap?.classList.add("hinted"); return item.clue; }
      if (step === 3) { m?.arrow(); return MONTE.hint3; }
      m?.help(); return MONTE.hint4;
    }
    if (step === 2) return item.clue;
    if (item.kind === "partie") {
      const g = view.stage.querySelector(`[data-t="${item.target}"]`);
      g?.classList.add(step === 3 ? "hint" : "glowing");
      return step === 3 ? PART_HINT3 : PART_HINT4(item.target as CoupePart);
    }
    const flags = !!item.opts[item.target]?.flag;
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
    if (step === 3) {
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return flags ? "Ce n'est pas celui-là. Regarde ce qui reste." : "Ce n'est pas celle-là. Regarde ce qui reste.";
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return flags ? flagHint4(item.target) : `C'est celle qui brille. ${item.why}`;
  },

  success(item) { return item.win; },

  sticker(summary) {
    const chap = (summary.last as VolcanItem | null)?.chap;
    if (chap === METIER) return { kind: "volcan", ref: "badge", reason: "Celle-ci, c'est ta médaille d'apprenti volcanologue !", svg: volcanStickerSVG("badge") };
    if (chap === MONDE) return { kind: "volcan", ref: "monde", reason: "Celle-ci, c'est pour ton grand voyage autour des volcans du monde.", svg: volcanStickerSVG("monde") };
    if (chap === LAVE || chap === TYPES)
      return { kind: "volcan", ref: "volcan", reason: "Celle-ci, c'est pour tout ce que tu sais sur la lave, et sur les volcans rouges et gris.", svg: volcanStickerSVG() };
    return { kind: "volcan", ref: "volcan", reason: "Celle-ci, c'est parce que tu sais ce qui se passe dans un volcan, de la poche de magma jusqu'au cratère.", svg: volcanStickerSVG() };
  },

  tip(item) {
    switch (item.kind) {
      case "partie": return "dessinez ensemble un volcan coupé en deux, et nommez chaque partie : poche de magma, cheminée, cratère, lave, cendres.";
      case "monte": case "suite": case "ordre": return "secouez doucement une bouteille d'eau gazeuse fermée, puis ouvrez-la au-dessus de l'évier : le gaz pousse le liquide vers le haut, comme le magma.";
      case "lave": return "faites fondre un carré de chocolat, puis laissez-le refroidir : liquide quand il est chaud, dur en refroidissant, comme la lave.";
      case "type": return "le parc Vulcania, en Auvergne, fait découvrir les volcans aux enfants ; la chaîne des Puys se visite à pied.";
      case "metier": return "cherchez ensemble des photos de volcanologues en combinaison argentée : c'est un vrai métier !";
      default: return "sur une carte ou un globe, cherchez ensemble le Japon, l'Italie, Hawaï et l'île de La Réunion.";
    }
  },
};

// Toutes les phrases que l'activité peut dire (pour la voix naturelle) : famille → textes.
export function voiceLines(): { fam: string; text: string }[] {
  const out: { fam: string; text: string }[] = [];
  const add = (fam: string, text: string) => out.push({ fam: `volcan:${fam}`, text });
  for (const x of Object.values(INTROS)) add("intro", x.text);
  for (const k of COUPE_PARTS) {
    const p = PARTS[k];
    for (const a of p.asks) add("consigne", a.p);
    add("indice", p.clue); add("reussite", `Oui ! ${p.why}`); add("indice", PART_HINT4(k)); add("erreur", PART_RETRY(k));
  }
  add("indice", PART_HINT3);
  add("consigne", MONTE.prompt); add("indice", MONTE.clue); add("indice", MONTE.hint3); add("indice", MONTE.hint4); add("reussite", `Bravo ! ${MONTE.why}`);
  for (const e of EDGES) {
    if (e.q) { add("consigne", e.prompt); add("indice", e.clue); }
    add("reussite", `Oui ! ${e.why}`); add("indice", `C'est celle qui brille. ${e.why}`);
  }
  for (const s of Object.keys(STEPS) as StepId[]) {
    add("erreur", `${cest(s)} Ce n'est pas ce qui vient juste après.`);
    add("erreur", `${cest(s)} Regarde ce qui vient avant, et ce qui vient après.`);
  }
  add("consigne", ORDRE_PROMPT);
  const clues = new Set<string>();
  for (const w of walks()) for (const m of [1, 2]) clues.add(ordreClue(w[m - 1], w[m + 1]));
  for (const c of clues) add("indice", c);
  for (const q of [...LAVE_Q, ...METIER_Q, GEYSER_Q]) {
    add("consigne", q.prompt); add("indice", q.clue); add("reussite", `Oui ! ${q.why}`); add("indice", `C'est celle qui brille. ${q.why}`);
    for (const t of Object.values(q.retry)) add("erreur", t);
  }
  add("consigne", TYPE_PROMPT); add("indice", TYPE_CLUE);
  for (const k of ["rouge", "gris"] as const) { add("reussite", `Oui ! ${TYPE_WHY[k]}`); add("indice", `C'est celle qui brille. ${TYPE_WHY[k]}`); add("erreur", TYPE_RETRY[k]); }
  add("consigne", SOMMEIL_PROMPT); add("indice", SOMMEIL_CLUE);
  for (const k of ["endormi", "reveille"] as const) { add("reussite", `Oui ! ${SOMMEIL_WHY[k]}`); add("indice", `C'est celle qui brille. ${SOMMEIL_WHY[k]}`); add("erreur", SOMMEIL_RETRY[k]); }
  add("consigne", AUVERGNE.prompt); add("indice", AUVERGNE.clue); add("reussite", `Oui ! ${AUVERGNE.why}`); add("indice", `C'est celle qui brille. ${AUVERGNE.why}`); add("erreur", AUVERGNE.retry);
  const codes = new Set(MONDE_V.map((v) => v.code));
  for (const v of MONDE_V) add("consigne", v.prompt);
  for (const c of codes) {
    add("indice", flagClue(c)); add("reussite", `Oui ! ${flagWhy(c)}`); add("indice", flagHint4(c));
    for (const w of FLAG_POOL) if (w !== c && !tooClose(w, c)) add("erreur", flagRetry(w, c));
  }
  add("indice", "Ce n'est pas celle-là. Regarde ce qui reste.");
  add("indice", "Ce n'est pas celui-là. Regarde ce qui reste.");
  add("erreur", "Regarde bien, et écoute encore.");
  return out;
}
export const _volcanData = { EDGES, STEPS, succ, hasEdge, ordreItem, walks, MONDE_V, FLAG_POOL, tooClose };
