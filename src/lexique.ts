// Lexique illustré : mots du quotidien avec une image (emoji du système), pour les jeux de sons et de lecture.

// Jeux de sons (oral) : l'enfant ne lit pas, il entend le mot et voit l'image.
//  - say : morceaux à frapper, écrits pour que la synthèse vocale les prononce bien (homophones) ;
//  - n : nombre de syllabes frappées (0 = mot écarté du comptage, par exemple à cause d'un e muet discutable) ;
//  - rime : son de fin ; debut : syllabe du début ; son : premier son (null pour une voyelle).
export interface SoundWord { w: string; e: string; say: string[]; n: number; rime: string; debut: string; son: string | null }
const W = (w: string, e: string, say: string[], n: number, rime: string, debut: string, son: string | null): SoundWord => ({ w, e, say, n, rime, debut, son });

export const SOUND_WORDS: SoundWord[] = [
  W("chat", "🐱", ["chat"], 1, "a", "cha", "ch"),
  W("rat", "🐀", ["rat"], 1, "a", "ra", "r"),
  W("pain", "🍞", ["pain"], 1, "in", "pin", "p"),
  W("main", "✋", ["main"], 1, "in", "min", "m"),
  W("train", "🚂", ["train"], 1, "in", "trin", "t"),
  W("chien", "🐶", ["chien"], 1, "in", "chien", "ch"),
  W("fleur", "🌸", ["fleur"], 1, "eur", "fleur", "f"),
  W("cœur", "❤️", ["cœur"], 1, "eur", "keur", "k"),
  W("beurre", "🧈", ["beurre"], 1, "eur", "beur", "b"),
  W("clé", "🔑", ["clé"], 1, "é", "klé", "k"),
  W("nez", "👃", ["nez"], 1, "é", "né", "n"),
  W("pied", "🦶", ["pied"], 1, "é", "pié", "p"),
  W("loup", "🐺", ["loup"], 1, "ou", "lou", "l"),
  W("lit", "🛏️", ["lit"], 1, "i", "li", "l"),
  W("feu", "🔥", ["feu"], 1, "eu", "feu", "f"),
  W("seau", "🪣", ["seau"], 1, "o", "so", "s"),
  W("sac", "🎒", ["sac"], 1, "ac", "sa", "s"),
  W("lapin", "🐰", ["la", "pin"], 2, "in", "la", "l"),
  W("sapin", "🎄", ["sa", "pin"], 2, "in", "sa", "s"),
  W("raisin", "🍇", ["raie", "zin"], 2, "in", "rè", "r"),
  W("poussin", "🐤", ["pou", "saint"], 2, "in", "pou", "p"),
  W("dauphin", "🐬", ["dos", "fin"], 2, "in", "do", "d"),
  W("ballon", "🎈", ["bas", "long"], 2, "on", "ba", "b"),
  W("mouton", "🐑", ["mou", "ton"], 2, "on", "mou", "m"),
  W("citron", "🍋", ["si", "tronc"], 2, "on", "si", "s"),
  W("poisson", "🐟", ["pois", "son"], 2, "on", "poi", "p"),
  W("maison", "🏠", ["mais", "son"], 2, "on", "mè", "m"),
  W("cochon", "🐷", ["co", "chon"], 2, "on", "ko", "k"),
  W("bonbon", "🍬", ["bon", "bon"], 2, "on", "bon", "b"),
  W("camion", "🚚", ["ca", "mion"], 2, "on", "ka", "k"),
  W("bateau", "⛵", ["bas", "tôt"], 2, "o", "ba", "b"),
  W("gâteau", "🎂", ["gars", "tôt"], 2, "o", "ga", "g"),
  W("château", "🏰", ["chat", "tôt"], 2, "o", "cha", "ch"),
  W("chapeau", "🎩", ["chat", "pot"], 2, "o", "cha", "ch"),
  W("vélo", "🚲", ["vé", "lot"], 2, "o", "vé", "v"),
  W("moto", "🏍️", ["mot", "tôt"], 2, "o", "mo", "m"),
  W("robot", "🤖", ["rot", "beau"], 2, "o", "ro", "r"),
  W("cadeau", "🎁", ["ca", "dos"], 2, "o", "ka", "k"),
  W("marteau", "🔨", ["mare", "tôt"], 2, "o", "mar", "m"),
  W("souris", "🐭", ["sous", "riz"], 2, "i", "sou", "s"),
  W("kiwi", "🥝", ["qui", "oui"], 2, "i", "ki", "k"),
  W("fourmi", "🐜", ["four", "mie"], 2, "i", "four", "f"),
  W("tortue", "🐢", ["tort", "tu"], 2, "u", "tor", "t"),
  W("panda", "🐼", ["pan", "da"], 2, "a", "pan", "p"),
  W("lama", "🦙", ["la", "ma"], 2, "a", "la", "l"),
  W("canard", "🦆", ["ca", "nard"], 2, "ar", "ka", "k"),
  W("bébé", "👶", ["bé", "bé"], 2, "é", "bé", "b"),
  W("café", "☕", ["ca", "fée"], 2, "é", "ka", "k"),
  W("fusée", "🚀", ["fu", "zée"], 2, "é", "fu", "f"),
  W("soleil", "☀️", ["sol", "lèye"], 2, "eil", "so", "s"),
  W("voiture", "🚗", ["voix", "ture"], 2, "ur", "voi", "v"),
  W("tracteur", "🚜", ["trac", "teur"], 2, "eur", "trac", "t"),
  W("serpent", "🐍", ["serre", "pan"], 2, "an", "ser", "s"),
  W("radio", "📻", ["rat", "dit", "eau"], 3, "o", "ra", "r"),
  W("piano", "🎹", ["pie", "a", "nos"], 3, "o", "pi", "p"),
  W("kangourou", "🦘", ["quand", "goût", "roue"], 3, "ou", "kan", "k"),
  W("chocolat", "🍫", ["chaud", "co", "la"], 3, "a", "cho", "ch"),
  W("papillon", "🦋", ["pas", "pie", "yon"], 3, "on", "pa", "p"),
  W("parapluie", "☂️", ["pas", "rat", "pluie"], 3, "i", "pa", "p"),
  W("dinosaure", "🦕", ["dit", "nos", "sort"], 3, "or", "di", "d"),
  W("crocodile", "🐊", ["croc", "co", "dil"], 3, "il", "cro", "k"),
  W("télévision", "📺", ["thé", "lait", "vie", "zion"], 4, "on", "té", "t"),
  W("ordinateur", "🖥️", ["or", "dit", "na", "teur"], 4, "eur", "or", null),
  W("pomme", "🍎", ["pomme"], 0, "om", "po", "p"),
  W("poule", "🐔", ["poule"], 0, "oul", "pou", "p"),
  W("banane", "🍌", ["ba", "nane"], 0, "ane", "ba", "b"),
  W("cabane", "🛖", ["ca", "bane"], 0, "ane", "ka", "k"),
  W("tomate", "🍅", ["to", "mate"], 0, "at", "to", "t"),
  W("girafe", "🦒", ["ji", "rafe"], 0, "af", "ji", "j"),
  W("guitare", "🎸", ["gui", "tare"], 0, "ar", "gi", "g"),
  W("vache", "🐄", ["vache"], 0, "ach", "va", "v"),
  W("fraise", "🍓", ["fraise"], 0, "èz", "frè", "f"),
];
export const SOUND_BY_WORD: Record<string, SoundWord> = Object.fromEntries(SOUND_WORDS.map((s) => [s.w, s]));

// Mots à lire : seuls comptent les sons prononcés (gp) ; les lettres muettes de la fin s'affichent en gris.
export interface ReadWord { w: string; art: "le" | "la" | ""; syl: string[]; mute: number; gp: string[]; pic: string }
const R = (w: string, art: ReadWord["art"], syl: string[], mute: number, gp: string[], pic: string): ReadWord => ({ w, art, syl, mute, gp, pic });
export const READ_WORDS: ReadWord[] = [
  R("moto", "la", ["mo", "to"], 0, ["m", "o", "t", "o"], "🏍️"),
  R("lama", "le", ["la", "ma"], 0, ["l", "a", "m", "a"], "🦙"),
  R("rat", "le", ["rat"], 1, ["r", "a"], "🐀"),
  R("lit", "le", ["lit"], 1, ["l", "i"], "🛏️"),
  R("riz", "le", ["riz"], 1, ["r", "i"], "🍚"),
  R("mur", "le", ["mur"], 0, ["m", "u", "r"], "🧱"),
  R("papi", "", ["pa", "pi"], 0, ["p", "a", "p", "i"], "👴"),
  R("tomate", "la", ["to", "ma", "te"], 1, ["t", "o", "m", "a", "t"], "🍅"),
  R("tulipe", "la", ["tu", "li", "pe"], 1, ["t", "u", "l", "i", "p"], "🌷"),
  R("plume", "la", ["plu", "me"], 1, ["p", "l", "u", "m"], "🪶"),
  R("sofa", "le", ["so", "fa"], 0, ["s", "o", "f", "a"], "🛋️"),
  R("fée", "la", ["fée"], 1, ["f", "é"], "🧚"),
  R("vélo", "le", ["vé", "lo"], 0, ["v", "é", "l", "o"], "🚲"),
  R("olive", "la", ["o", "li", "ve"], 1, ["o", "l", "i", "v"], "🫒"),
  R("lune", "la", ["lu", "ne"], 1, ["l", "u", "n"], "🌙"),
  R("radio", "la", ["ra", "di", "o"], 0, ["r", "a", "d", "i", "o"], "📻"),
  R("dé", "le", ["dé"], 0, ["d", "é"], "🎲"),
  R("nid", "le", ["nid"], 1, ["n", "i"], "🪹"),
  R("salade", "la", ["sa", "la", "de"], 1, ["s", "a", "l", "a", "d"], "🥗"),
  R("piano", "le", ["pi", "a", "no"], 0, ["p", "i", "a", "n", "o"], "🎹"),
  R("vache", "la", ["va", "che"], 1, ["v", "a", "ch"], "🐄"),
  R("chat", "le", ["chat"], 1, ["ch", "a"], "🐱"),
  R("judo", "le", ["ju", "do"], 0, ["j", "u", "d", "o"], "🥋"),
  R("loup", "le", ["loup"], 1, ["l", "ou"], "🐺"),
  R("mouton", "le", ["mou", "ton"], 0, ["m", "ou", "t", "on"], "🐑"),
  R("lion", "le", ["li", "on"], 0, ["l", "i", "on"], "🦁"),
  R("robot", "le", ["ro", "bot"], 1, ["r", "o", "b", "o"], "🤖"),
  R("banane", "la", ["ba", "na", "ne"], 1, ["b", "a", "n", "a", "n"], "🍌"),
  R("cabane", "la", ["ca", "ba", "ne"], 1, ["c", "a", "b", "a", "n"], "🛖"),
];
// Mots-outils : appris globalement, affichés soulignés en pointillés.
export const SIGHT_WORDS = ["le", "la", "et", "est", "sur"];

export const emoji = (e: string, size = "1em") => `<span class="emo" style="font-size:${size}" aria-hidden="true">${e}</span>`;

// Mot écrit : syllabes (coloriées en alternance si demandé), lettres muettes en gris.
export function wordHTML(r: ReadWord, colored = false) {
  const full = r.syl.join("");
  const keep = full.length - r.mute;
  let pos = 0;
  const inner = r.syl.map((s, i) => {
    let out = "";
    for (const ch of s) { out += pos >= keep ? `<span class="mute">${ch}</span>` : ch; pos++; }
    return colored ? `<span class="syl${i % 2 ? " b" : ""}">${out}</span>` : out;
  }).join("");
  return `<span class="w">${inner}</span>`;
}
export const sightHTML = (w: string) => `<span class="sight">${w}</span>`;
