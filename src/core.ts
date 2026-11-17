// Moteur pédagogique : référentiel de compétences, modèle de l'enfant (Elo), planificateur.
// Module pur, sans DOM : testable par simulation (voir tests/).

export type DomainId = "lecture" | "nombres" | "voyages" | "enigmes" | "decouvertes" | "atelier" | "coeur";
export type Form = "manipulation" | "image" | "symbole" | "recit" | "corrige";
export type ActivityId = "drapeau" | "marche" | "syllabes" | "chants" | "lis" | "nenuphars" | "partage"
  | "formes" | "bip" | "motifs" | "theatre" | "flotte" | "goutte" | "volcan" | "tri" | "dechets" | "atelierdrapeaux" | "dessin" | "histoires";
export type Mastery = "nouveau" | "decouverte" | "en-cours" | "acquise" | "consolidee";

export interface DomainDef { id: DomainId; label: string; color: string; island: string }
export const DOMAINS: DomainDef[] = [
  { id: "lecture", label: "Lecture", color: "#FF7F50", island: "mots" },
  { id: "nombres", label: "Nombres", color: "#3D8BEA", island: "nombres" },
  { id: "voyages", label: "Voyages", color: "#1FA9B5", island: "port" },
  { id: "enigmes", label: "Énigmes", color: "#8C6BE0", island: "enigmes" },
  { id: "decouvertes", label: "Découvertes", color: "#34B37A", island: "decouvertes" },
  { id: "atelier", label: "Atelier", color: "#FFC145", island: "atelier" },
  { id: "coeur", label: "Cœur", color: "#E85D9A", island: "coeur" },
];

export interface SkillDef { id: string; domain: DomainId; label: string; palier: 1 | 2 | 3 | 4; dRef: number; activity?: ActivityId }
export const SKILLS: SkillDef[] = [
  { id: "LECT.SYL.ECOUTE", domain: "lecture", label: "Reconnaître une syllabe entendue", palier: 2, dRef: 0, activity: "syllabes" },
  { id: "LECT.SYL.FABRIQUE", domain: "lecture", label: "Fabriquer une syllabe : consonne et voyelle", palier: 2, dRef: 0.5, activity: "syllabes" },
  { id: "LECT.MOT.FABRIQUE", domain: "lecture", label: "Écrire un mot entendu avec des syllabes", palier: 2, dRef: 1, activity: "syllabes" },
  { id: "LECT.MOT.LIRE", domain: "lecture", label: "Lire un mot court en entier", palier: 3, dRef: 1.5, activity: "syllabes" },
  { id: "LECT.PHONO.SYLLABES", domain: "lecture", label: "Frapper les syllabes d'un mot", palier: 1, dRef: -0.6, activity: "chants" },
  { id: "LECT.PHONO.RIME", domain: "lecture", label: "Entendre deux mots qui riment", palier: 1, dRef: 0, activity: "chants" },
  { id: "LECT.PHONO.ATTAQUE", domain: "lecture", label: "Entendre la même syllabe au début", palier: 2, dRef: 0.4, activity: "chants" },
  { id: "LECT.PHONO.PHONEME", domain: "lecture", label: "Entendre le premier son d'un mot", palier: 2, dRef: 0.9, activity: "chants" },
  { id: "LECT.GROUPE.LIRE", domain: "lecture", label: "Lire deux mots reliés par « et »", palier: 3, dRef: 1.6, activity: "lis" },
  { id: "LECT.PHRASE.LIRE", domain: "lecture", label: "Lire une petite phrase et la comprendre", palier: 3, dRef: 2, activity: "lis" },
  { id: "NUM.VOIR.4", domain: "nombres", label: "Voir 1 à 4 objets sans compter", palier: 1, dRef: -1, activity: "marche" },
  { id: "NUM.COMPTE.10", domain: "nombres", label: "Constituer une collection jusqu'à 10", palier: 1, dRef: -0.3, activity: "marche" },
  { id: "NUM.COMPTE.20", domain: "nombres", label: "Constituer une collection jusqu'à 20", palier: 2, dRef: 0.3, activity: "marche" },
  { id: "NUM.COMPLEMENT.10", domain: "nombres", label: "Compléter à 10", palier: 2, dRef: 0.8, activity: "marche" },
  { id: "NUM.DIZAINES.LIRE", domain: "nombres", label: "Dizaines et unités : combien en tout ?", palier: 3, dRef: 1.3, activity: "marche" },
  { id: "NUM.DIZAINES.FAIRE", domain: "nombres", label: "Dizaines et unités : préparer un nombre", palier: 3, dRef: 1.7, activity: "marche" },
  { id: "NUM.LIGNE.REPERE", domain: "nombres", label: "Trouver un nombre sur la ligne", palier: 1, dRef: -0.4, activity: "nenuphars" },
  { id: "NUM.LIGNE.ORDRE", domain: "nombres", label: "Trouver le nombre qui manque", palier: 1, dRef: 0.1, activity: "nenuphars" },
  { id: "NUM.LIGNE.PLUS", domain: "nombres", label: "Avancer de quelques bonds (+)", palier: 2, dRef: 0.6, activity: "nenuphars" },
  { id: "NUM.LIGNE.MOINS", domain: "nombres", label: "Reculer de quelques bonds (−)", palier: 2, dRef: 0.9, activity: "nenuphars" },
  { id: "NUM.LIGNE.BONDS", domain: "nombres", label: "Avancer par bonds de 2", palier: 3, dRef: 1.4, activity: "nenuphars" },
  { id: "NUM.PARTAGE.EGAL", domain: "nombres", label: "Partager en parts égales", palier: 1, dRef: -0.2, activity: "partage" },
  { id: "NUM.PARTAGE.RESTE", domain: "nombres", label: "Partager quand il en reste", palier: 2, dRef: 0.7, activity: "partage" },
  { id: "NUM.PARTAGE.COMBIEN", domain: "nombres", label: "Dire combien chacun aura", palier: 3, dRef: 1.3, activity: "partage" },
  { id: "VOY.DRAPEAU.ECOUTE", domain: "voyages", label: "Reconnaître un drapeau dont on entend le nom", palier: 1, dRef: -0.5, activity: "drapeau" },
  { id: "VOY.CARTE.CONTINENT", domain: "voyages", label: "Placer un pays sur son continent", palier: 2, dRef: 0.6, activity: "drapeau" },
  { id: "VOY.DRAPEAU.LIRE", domain: "voyages", label: "Lire le nom d'un pays et trouver son drapeau", palier: 2, dRef: 0.8, activity: "drapeau" },
  { id: "VOY.DRAPEAU.JUMEAUX", domain: "voyages", label: "Distinguer des drapeaux presque jumeaux", palier: 3, dRef: 1.2, activity: "drapeau" },
  { id: "VOY.DRAPEAU.CONSTRUIRE", domain: "voyages", label: "Reproduire un drapeau : bandes, sens, couleurs", palier: 2, dRef: 0.6, activity: "atelierdrapeaux" },
  { id: "VOY.DRAPEAU.MIROIR", domain: "voyages", label: "Repérer un drapeau à l'envers", palier: 3, dRef: 1.2, activity: "atelierdrapeaux" },
  { id: "GEO.FORMES2D.NOM", domain: "enigmes", label: "Reconnaître les formes planes", palier: 1, dRef: -0.4, activity: "formes" },
  { id: "GEO.FORMES2D.COTES", domain: "enigmes", label: "Compter les côtés d'une forme", palier: 2, dRef: 0.5, activity: "formes" },
  { id: "GEO.FORMES3D.NOM", domain: "enigmes", label: "Reconnaître les solides", palier: 2, dRef: 0.4, activity: "formes" },
  { id: "GEO.FORMES3D.OBJETS", domain: "enigmes", label: "Retrouver un solide dans les objets", palier: 2, dRef: 0.7, activity: "formes" },
  { id: "GEO.FORMES3D.TRACES", domain: "enigmes", label: "Associer un solide à la trace qu'il laisse", palier: 3, dRef: 1.2, activity: "formes" },
  { id: "ENIG.PROGRAMMES", domain: "enigmes", label: "Programmer Bip avec des flèches", palier: 2, dRef: 0.5, activity: "bip" },
  { id: "ENIG.DEBUG", domain: "enigmes", label: "Trouver l'erreur dans un programme", palier: 3, dRef: 1.3, activity: "bip" },
  { id: "ENIG.MOTIFS", domain: "enigmes", label: "Continuer et corriger des suites", palier: 1, dRef: 0, activity: "motifs" },
  { id: "ENIG.MATRICES", domain: "enigmes", label: "Compléter un tableau à double entrée", palier: 3, dRef: 1.3, activity: "motifs" },
  { id: "DECOUV.FLOTTE", domain: "decouvertes", label: "Prédire, tester : flotte ou coule ?", palier: 1, dRef: 0.2, activity: "flotte" },
  { id: "DECOUV.EAU.CYCLE", domain: "decouvertes", label: "Le voyage de l'eau dans la nature : mer, vapeur, nuage, pluie, rivière", palier: 1, dRef: -0.3, activity: "goutte" },
  { id: "DECOUV.EAU.ETATS", domain: "decouvertes", label: "Glace, eau, vapeur : ce que font le chaud et le froid", palier: 2, dRef: 0.3, activity: "goutte" },
  { id: "DECOUV.EAU.ROBINET", domain: "decouvertes", label: "D'où vient l'eau du robinet : pompe, usine, château d'eau", palier: 2, dRef: 0.6, activity: "goutte" },
  { id: "DECOUV.EAU.EPURATION", domain: "decouvertes", label: "Où va l'eau sale : égouts, station d'épuration", palier: 2, dRef: 0.9, activity: "goutte" },
  { id: "DECOUV.EAU.TOUR", domain: "decouvertes", label: "Tout le voyage de l'eau, de la mer au robinet et retour", palier: 3, dRef: 1.3, activity: "goutte" },
  { id: "DECOUV.EAU.GESTES", domain: "decouvertes", label: "Les bons gestes pour l'eau : lingettes, robinet, douche", palier: 2, dRef: 0.4, activity: "goutte" },
  { id: "DECOUV.VOLCAN.PARTIES", domain: "decouvertes", label: "Dans le volcan : poche de magma, cheminée, cratère, lave, cendres", palier: 1, dRef: -0.3, activity: "volcan" },
  { id: "DECOUV.VOLCAN.ERUPTION", domain: "decouvertes", label: "L'éruption, dans l'ordre : le magma monte, le volcan gronde, la lave sort et coule", palier: 2, dRef: 0.2, activity: "volcan" },
  { id: "DECOUV.VOLCAN.LAVE", domain: "decouvertes", label: "La lave : très chaude, elle coule, puis refroidit et devient pierre", palier: 2, dRef: 0.2, activity: "volcan" },
  { id: "DECOUV.VOLCAN.TYPES", domain: "decouvertes", label: "Volcans rouges et volcans gris, endormis ou réveillés", palier: 2, dRef: 0.5, activity: "volcan" },
  { id: "DECOUV.VOLCAN.METIER", domain: "decouvertes", label: "Le métier de volcanologue : se protéger, surveiller, prévenir", palier: 2, dRef: 0.1, activity: "volcan" },
  { id: "DECOUV.VOLCAN.MONDE", domain: "decouvertes", label: "Des volcans du monde et les drapeaux de leurs pays", palier: 3, dRef: 0.9, activity: "volcan" },
  { id: "DECOUV.TRI.EMBALLAGES", domain: "decouvertes", label: "Trier : les emballages au bac jaune, le reste à part", palier: 1, dRef: -0.4, activity: "tri" },
  { id: "DECOUV.TRI.VERRE", domain: "decouvertes", label: "Trier le verre : bouteilles, pots et bocaux", palier: 1, dRef: -0.1, activity: "tri" },
  { id: "DECOUV.TRI.CUISINE", domain: "decouvertes", label: "Trier les restes de cuisine (bac marron ou composteur)", palier: 2, dRef: 0.2, activity: "tri" },
  { id: "DECOUV.TRI.PAPIERS", domain: "decouvertes", label: "Trier les papiers : journaux, cahiers, prospectus", palier: 2, dRef: 0.3, activity: "tri" },
  { id: "DECOUV.TRI.PIEGES", domain: "decouvertes", label: "Déjouer les pièges du tri : vaisselle, verre cassé, couvercle en métal", palier: 3, dRef: 0.9, activity: "tri" },
  { id: "DECOUV.TRI.EXPERT", domain: "decouvertes", label: "Le grand tri : toutes les poubelles à la fois", palier: 3, dRef: 1.0, activity: "tri" },
  { id: "DECOUV.DECHETS.CAMION", domain: "decouvertes", label: "Le camion poubelle et les éboueurs (et rester sur le trottoir)", palier: 1, dRef: -0.5, activity: "dechets" },
  { id: "DECOUV.DECHETS.ROUTE", domain: "decouvertes", label: "Où va chaque camion : centre de tri, usine du verre, compost, usine qui chauffe", palier: 2, dRef: 0.2, activity: "dechets" },
  { id: "DECOUV.DECHETS.CENTRE", domain: "decouvertes", label: "Au centre de tri : plastique, métal, papier et carton ; l'aimant", palier: 2, dRef: 0.35, activity: "dechets" },
  { id: "DECOUV.DECHETS.VIE", domain: "decouvertes", label: "La nouvelle vie des déchets recyclés, et leur voyage dans l'ordre", palier: 2, dRef: 0.6, activity: "dechets" },
  { id: "DECOUV.DECHETS.AILLEURS", domain: "decouvertes", label: "Piles, médicaments, vêtements, gros objets : où les rapporter", palier: 3, dRef: 0.9, activity: "dechets" },
  { id: "DECOUV.DECHETS.MOINS", domain: "decouvertes", label: "Faire moins de déchets : gourde, sac en tissu, réparer, donner", palier: 2, dRef: 0.3, activity: "dechets" },
  { id: "COEUR.EMOTIONS", domain: "coeur", label: "Reconnaître et nommer les émotions", palier: 1, dRef: -0.6, activity: "theatre" },
  { id: "COEUR.CAUSES", domain: "coeur", label: "Comprendre pourquoi on ressent une émotion", palier: 1, dRef: 0, activity: "theatre" },
  { id: "COEUR.AIDER", domain: "coeur", label: "Choisir une façon d'aider", palier: 1, dRef: -0.2, activity: "theatre" },
  { id: "COEUR.DESIRS", domain: "coeur", label: "Comprendre que chacun a ses goûts", palier: 2, dRef: 0.5, activity: "theatre" },
  { id: "COEUR.CROYANCE", domain: "coeur", label: "Comprendre que quelqu'un peut se tromper (fausse croyance)", palier: 3, dRef: 1.1, activity: "theatre" },
  { id: "COEUR.CACHEE", domain: "coeur", label: "Deviner une émotion cachée", palier: 3, dRef: 1.6, activity: "theatre" },
  { id: "ART.TRACE", domain: "atelier", label: "Suivre un tracé au doigt", palier: 1, dRef: -0.2, activity: "dessin" },
  { id: "ART.ETAPES", domain: "atelier", label: "Dessiner un modèle étape par étape", palier: 2, dRef: 0.6, activity: "dessin" },
  { id: "LECT.TEXTE.COMPRENDRE", domain: "lecture", label: "Lire une petite histoire et la comprendre", palier: 3, dRef: 1.8, activity: "histoires" },
];
export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// ---------- Hasard reproductible ----------
export interface Rng { next(): number; int(lo: number, hi: number): number; pick<T>(a: readonly T[]): T; shuffle<T>(a: readonly T[]): T[] }
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const b = arr.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
  };
}

// ---------- Modèle de l'enfant ----------
export interface SkillState {
  theta: number; n: number; firstSeen: number; lastSeen: number;
  forms: Form[]; streak: number; nextReview: number; delayedSuccess: boolean;
}
export interface Evidence { skill: string; correct: boolean; hints: number; guess: number; difficulty: number; form: Form }

export const DAY = 86_400_000;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const pCorrect = (theta: number, d: number, g: number) => g + (1 - g) * sigmoid(theta - d);
export const pIndependent = (s: SkillState, d: number) => sigmoid(s.theta - d);

export function newSkill(theta = -1): SkillState {
  return { theta, n: 0, firstSeen: 0, lastSeen: 0, forms: [], streak: 0, nextReview: 0, delayedSuccess: false };
}

// Poids d'une réussite selon le nombre d'indices utilisés : une réussite aidée prouve moins.
export const HINT_WEIGHT = [1, 0.7, 0.5, 0.3, 0.15];
// Intervalles de révision (jours) après des réussites seules successives.
export const INTERVALS = [1, 3, 7, 14, 30];

export function applyEvidence(s: SkillState, e: Evidence, now: number): SkillState {
  const st: SkillState = { ...s, forms: [...s.forms] };
  const p = pCorrect(st.theta, e.difficulty, e.guess);
  const k = Math.max(0.25, 0.9 / (1 + 0.12 * st.n));
  const w = e.correct ? HINT_WEIGHT[Math.min(e.hints, 4)] : 1;
  st.theta = clamp(st.theta + k * w * ((e.correct ? 1 : 0) - p), -4, 5);
  const independent = e.correct && e.hints === 0;
  if (independent) {
    if (st.lastSeen && now - st.lastSeen >= 2 * DAY) st.delayedSuccess = true;
    if (!st.forms.includes(e.form)) st.forms.push(e.form);
    st.streak += 1;
  } else {
    st.streak = 0;
  }
  st.n += 1;
  if (!st.firstSeen) st.firstSeen = now;
  st.lastSeen = now;
  const days = independent ? INTERVALS[Math.min(st.streak - 1, INTERVALS.length - 1)] : 0.5;
  st.nextReview = now + days * DAY;
  return st;
}

export function masteryOf(def: SkillDef, s: SkillState | undefined): Mastery {
  if (!s || s.n === 0) return "nouveau";
  const p = pIndependent(s, def.dRef);
  if (p >= 0.85 && s.n >= 5) return s.forms.length >= 2 && s.delayedSuccess ? "consolidee" : "acquise";
  if (p >= 0.5) return "en-cours";
  return "decouverte";
}

export const MASTERY_LABEL: Record<Mastery, string> = {
  "nouveau": "Pas encore vue",
  "decouverte": "Découverte",
  "en-cours": "En cours",
  "acquise": "Acquise",
  "consolidee": "Consolidée",
};

// ---------- Escalier de difficulté dans une activité ----------
export interface Staircase { level: number; up: number; down: number }
// 2 réussites seules d'affilée : un cran plus dur ; 2 erreurs d'affilée : un cran plus facile.
export function stepStaircase(s: Staircase, independentSuccess: boolean, firstAttemptWrong: boolean, maxLevel: number): Staircase {
  const n = { ...s };
  if (independentSuccess) {
    n.up += 1; n.down = 0;
    if (n.up >= 2 && n.level < maxLevel) { n.level += 1; n.up = 0; }
  } else if (firstAttemptWrong) {
    n.down += 1; n.up = 0;
    if (n.down >= 2 && n.level > 1) { n.level -= 1; n.down = 0; }
  } else {
    n.up = 0;
  }
  return n;
}

// ---------- Planificateur : quelles missions proposer ? ----------
export interface PlanActivity { id: ActivityId; domain: DomainId; skills: string[] }
export interface PlanInput {
  activities: PlanActivity[];
  skills: Record<string, SkillState>;
  minutesByDomain: Partial<Record<DomainId, number>>;
  goals: string[];
  now: number;
}
export function suggestMissions(inp: PlanInput, rnd: () => number, max = 3): ActivityId[] {
  const scored = inp.activities.map((a) => {
    const due = a.skills.some((id) => {
      const s = inp.skills[id];
      return !!s && s.n > 0 && s.nextReview <= inp.now;
    });
    const frontier = a.skills.some((id) => {
      const s = inp.skills[id];
      const def = SKILL_BY_ID[id];
      if (!s || !def) return false;
      const p = pIndependent(s, def.dRef);
      return p > 0.3 && p < 0.85;
    });
    const minutes = inp.minutesByDomain[a.domain] ?? 0;
    const balance = 1 / (1 + minutes / 10);
    const goal = a.skills.some((id) => inp.goals.includes(id)) ? 1 : 0;
    return { id: a.id, score: (due ? 1 : 0) + (frontier ? 0.8 : 0) + 0.6 * balance + 0.7 * goal + 0.3 * rnd() };
  });
  return scored.sort((x, y) => y.score - x.score).slice(0, max).map((x) => x.id);
}
