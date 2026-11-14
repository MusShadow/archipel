// Contenus : progression des sons, mots déchiffrables, phrases de Plume, défis hors écran.

// Ordre d'introduction des graphèmes (voyelles, consonnes qui se prolongent, puis occlusives et sons complexes).
export const GRAPHEME_ORDER = [
  "a", "i", "o", "u", "é", "l", "m", "r", "s", "p", "t", "f", "v", "n", "d",
  "ch", "j", "ou", "on", "e", "b", "c", "g", "an", "in", "oi",
];
export const READING_LEVELS = [
  { label: "Ne lit pas encore", k: 0 },
  { label: "Connaît des lettres", k: 5 },
  { label: "Lit des syllabes", k: 11 },
  { label: "Lit des mots courts", k: 15 },
  { label: "Lit des phrases", k: 21 },
];
export const knownSet = (k: number) => new Set(GRAPHEME_ORDER.slice(0, Math.max(0, Math.min(k, GRAPHEME_ORDER.length))));
export const decodable = (gp: readonly string[], known: Set<string>) => gp.every((g) => known.has(g));

// Syllabes CV sûres pour la synthèse vocale : consonnes continues et occlusives simples, voyelles a i o u é.
export const SYL_CONSONANTS = ["l", "m", "r", "s", "p", "t", "f", "v", "n", "d"];
export const SYL_VOWELS = ["a", "i", "o", "u", "é"];
// Prononciation : un homophone que la synthèse vocale lit correctement (« mo » → « mot »).
export const SAY_SYL: Record<string, string> = {
  ma: "ma", mi: "mie", mo: "mot", mu: "mu", "mé": "mes",
  la: "la", li: "lit", lo: "lot", lu: "lu", "lé": "les",
  ra: "rat", ri: "riz", ro: "rot", ru: "rue", "ré": "ré",
  sa: "sa", si: "si", so: "seau", su: "su", "sé": "ces",
  pa: "pas", pi: "pie", po: "pot", pu: "pu", "pé": "pé",
  ta: "ta", ti: "ti", to: "tôt", tu: "tu", "té": "thé",
  fa: "fa", fi: "fi", fo: "faux", fu: "fût", "fé": "fée",
  va: "va", vi: "vie", vo: "veau", vu: "vu", "vé": "vé",
  na: "na", ni: "nid", no: "nos", nu: "nu", "né": "né",
  da: "da", di: "dit", do: "dos", du: "du", "dé": "dé",
};
export const syllablesFor = (known: Set<string>) => {
  const out: string[] = [];
  for (const c of SYL_CONSONANTS) for (const v of SYL_VOWELS) if (known.has(c) && known.has(v)) out.push(c + v);
  return out;
};

export interface Word { w: string; syl: string[]; gp: string[] }
export const WORDS: Word[] = [
  { w: "moto", syl: ["mo", "to"], gp: ["m", "o", "t", "o"] },
  { w: "vélo", syl: ["vé", "lo"], gp: ["v", "é", "l", "o"] },
  { w: "lama", syl: ["la", "ma"], gp: ["l", "a", "m", "a"] },
  { w: "sofa", syl: ["so", "fa"], gp: ["s", "o", "f", "a"] },
  { w: "tipi", syl: ["ti", "pi"], gp: ["t", "i", "p", "i"] },
  { w: "papi", syl: ["pa", "pi"], gp: ["p", "a", "p", "i"] },
  { w: "ami", syl: ["a", "mi"], gp: ["a", "m", "i"] },
  { w: "midi", syl: ["mi", "di"], gp: ["m", "i", "d", "i"] },
  { w: "salé", syl: ["sa", "lé"], gp: ["s", "a", "l", "é"] },
  { w: "fumé", syl: ["fu", "mé"], gp: ["f", "u", "m", "é"] },
  { w: "radio", syl: ["ra", "di", "o"], gp: ["r", "a", "d", "i", "o"] },
  { w: "piano", syl: ["pi", "a", "no"], gp: ["p", "i", "a", "n", "o"] },
  { w: "salami", syl: ["sa", "la", "mi"], gp: ["s", "a", "l", "a", "m", "i"] },
  { w: "domino", syl: ["do", "mi", "no"], gp: ["d", "o", "m", "i", "n", "o"] },
  { w: "numéro", syl: ["nu", "mé", "ro"], gp: ["n", "u", "m", "é", "r", "o"] },
  { w: "Mali", syl: ["Ma", "li"], gp: ["m", "a", "l", "i"] },
  { w: "Panama", syl: ["Pa", "na", "ma"], gp: ["p", "a", "n", "a", "m", "a"] },
  { w: "tuba", syl: ["tu", "ba"], gp: ["t", "u", "b", "a"] },
  { w: "judo", syl: ["ju", "do"], gp: ["j", "u", "d", "o"] },
  { w: "Togo", syl: ["To", "go"], gp: ["t", "o", "g", "o"] },
  { w: "Cuba", syl: ["Cu", "ba"], gp: ["c", "u", "b", "a"] },
  { w: "Canada", syl: ["Ca", "na", "da"], gp: ["c", "a", "n", "a", "d", "a"] },
  { w: "Monaco", syl: ["Mo", "na", "co"], gp: ["m", "o", "n", "a", "c", "o"] },
];

// Retours centrés sur la démarche (jamais « tu es intelligent »).
export const PRAISE = [
  "Oui ! Tu as bien cherché.",
  "Bravo, tu as trouvé !",
  "C'est ça ! Tu as bien regardé.",
  "Super, tu as pris ton temps.",
  "Oui ! Tu as essayé et tu as réussi.",
  "Exactement !",
];
export const PRAISE_AFTER_EFFORT = [
  "Tu n'as rien lâché, et tu as trouvé !",
  "Tu as essayé une autre façon, et ça a marché !",
  "Bravo, tu as continué à chercher.",
];
export const RETRY = ["Hmm, regarde encore.", "Presque ! Essaie encore.", "On cherche ensemble ?"];

export const NUMBER_WORDS = (n: number) => String(n);

export const DEFIS: Record<string, string[]> = {
  marche: [
    "Compte les marches de l'escalier avec un adulte.",
    "Mets 10 cuillères sur la table, puis enlèves-en 3. Combien en reste-t-il ?",
    "Range tes petites voitures par paquets de 10.",
  ],
  syllabes: [
    "Tape dans tes mains les syllabes de ton prénom.",
    "Cherche dans la maison un objet dont le nom commence par « ma ».",
    "Trouve un mot qui rime avec « moto ».",
  ],
  drapeau: [
    "Cherche un drapeau dans un livre ou sur un emballage.",
    "Plie une feuille en trois et colorie un drapeau à trois bandes.",
    "Montre sur un globe ou une carte le pays de ton drapeau préféré.",
  ],
};
