// Écrans d'île d'Archipel 2 : un modèle qui peut grandir (voir docs/design/systeme-de-design.md, « Îles »).
// Une île a un ou plusieurs quartiers (un écran chacun). Un quartier a un décor de base et six emplacements ; chaque
// lieu (une activité, ou un écran à part comme le coin calme) occupe un emplacement, avec son étiquette (pastille).
// Ajouter une activité, c'est ajouter une ligne ici (île pas encore dessinée) ou dans l'atelier (île dessinée, voir
// scripts/illustration/iles.py) et dessiner son lieu : l'île n'est jamais redessinée.
// Au-delà de six lieux, un deuxième quartier ; ensuite, des activités proches peuvent partager un lieu ; enfin, un
// thème qui grandit devient une nouvelle île. Les îles dessinées (atelier d'illustration) apportent leur décor.
import type { IleId } from "./design/jetons";
import { DECORS_ILES, type DecorIle } from "./illustrations";

export const CADRE = { l: 1194, h: 834 } as const; // repère des dessins : iPad Pro 11 en paysage
export const EMPLACEMENTS_PAR_QUARTIER = 6;

export interface Point { x: number; y: number }
export interface Emplacement extends Point { id: string }
// ids : ce que le lieu ouvre (une activité, ou plusieurs activités proches qui partagent le lieu).
export interface Lieu { ids: string[]; emplacement: string; pastille: Point }
export interface Quartier { emplacements: Emplacement[]; lieux: Lieu[]; decor?: DecorIle }
export interface Ile { id: IleId; nom: string; hote: string; quartiers: Quartier[] }

// Écrans à part qui ont aussi leur lieu sur une île (en plus des activités suivies par le moteur).
export const ECRANS_A_PART: Record<string, IleId> = { miroir: "atelier", monDrapeau: "port", calme: "coeur" };

// Disposition générique, en attendant le dessin d'une île : six emplacements répartis sur une île ovale,
// l'étiquette sous chaque lieu.
const GENERIQUE: Emplacement[] = [
  { id: "A", x: 318, y: 470 }, { id: "B", x: 842, y: 496 }, { id: "C", x: 560, y: 660 },
  { id: "D", x: 590, y: 398 }, { id: "E", x: 990, y: 640 }, { id: "F", x: 232, y: 652 },
];
const pastilleSous = (e: Point): Point => ({ x: e.x, y: Math.min(e.y + 128, CADRE.h - 56) });

function quartierDessine(decor: DecorIle): Quartier {
  const emplacements = Object.entries(decor.emplacements).map(([id, [x, y]]) => ({ id, x, y })).sort((a, b) => a.id.localeCompare(b.id));
  const lieux = Object.entries(decor.lieuxEmplacement).map(([act, emp]) => {
    const [x, y] = decor.pastilles[act];
    return { ids: [act], emplacement: emp, pastille: { x, y } };
  });
  return { emplacements, lieux, decor };
}
function quartierGenerique(ids: string[]): Quartier {
  if (ids.length > EMPLACEMENTS_PAR_QUARTIER) throw new Error("un quartier a six emplacements au plus");
  return { emplacements: GENERIQUE.map((e) => ({ ...e })), lieux: ids.map((id, i) => ({ ids: [id], emplacement: GENERIQUE[i].id, pastille: pastilleSous(GENERIQUE[i]) })) };
}

// Les îles sont construites à la première demande (et non au chargement de l'appli) : une erreur de données ne
// peut pas empêcher l'appli de démarrer, et les tests l'attrapent avant.
let iles: Record<IleId, Ile> | null = null;
export function ilesV2(): Record<IleId, Ile> {
  return iles ??= {
    nombres: { id: "nombres", nom: "Île des Nombres", hote: "basile", quartiers: [quartierDessine(DECORS_ILES.nombres)] },
    mots: { id: "mots", nom: "Île des Mots", hote: "mona", quartiers: [quartierGenerique(["syllabes", "chants", "lis", "histoires"])] },
    port: { id: "port", nom: "Port des Voyages", hote: "plume", quartiers: [quartierGenerique(["drapeau", "atelierdrapeaux", "monDrapeau"])] },
    enigmes: { id: "enigmes", nom: "Île des Énigmes", hote: "rico", quartiers: [quartierGenerique(["formes", "bip", "motifs"])] },
    decouvertes: { id: "decouvertes", nom: "Île des Découvertes", hote: "octave", quartiers: [quartierGenerique(["flotte", "goutte", "volcan", "tri", "dechets"])] },
    atelier: { id: "atelier", nom: "Île de l'Atelier", hote: "kiki", quartiers: [quartierGenerique(["dessin", "miroir"])] },
    coeur: { id: "coeur", nom: "Île du Cœur", hote: "pico", quartiers: [quartierGenerique(["theatre", "calme"])] },
  };
}

// Où se trouve un lieu : île, quartier, lieu.
export function lieuDe(id: string): { ile: Ile; quartier: number; lieu: Lieu } | null {
  for (const ile of Object.values(ilesV2())) {
    for (const [q, quartier] of ile.quartiers.entries()) {
      const lieu = quartier.lieux.find((l) => l.ids.includes(id));
      if (lieu) return { ile, quartier: q, lieu };
    }
  }
  return null;
}

// Ajoute une activité sur une île : premier emplacement libre du dernier quartier, sinon un nouveau quartier.
// (Le dessin du lieu suit dans l'atelier d'illustration ; en attendant, la pastille seule le représente.)
export function placer(ile: Ile, id: string): Ile {
  const quartiers = ile.quartiers.map((q) => ({ ...q, lieux: [...q.lieux] }));
  const dernier = quartiers[quartiers.length - 1];
  const libre = dernier.emplacements.find((e) => !dernier.lieux.some((l) => l.emplacement === e.id));
  if (libre) dernier.lieux.push({ ids: [id], emplacement: libre.id, pastille: pastilleSous(libre) });
  else quartiers.push(quartierGenerique([id]));
  return { ...ile, quartiers };
}

// Ce qui ne va pas dans une île (liste vide : tout va bien).
export function verifier(ile: Ile): string[] {
  const pb: string[] = [];
  const dans = (p: Point) => p.x >= 0 && p.x <= CADRE.l && p.y >= 0 && p.y <= CADRE.h;
  ile.quartiers.forEach((q, i) => {
    const nom = `${ile.id}, quartier ${i + 1}`;
    if (q.emplacements.length !== EMPLACEMENTS_PAR_QUARTIER) pb.push(`${nom} : ${q.emplacements.length} emplacements au lieu de 6`);
    if (new Set(q.emplacements.map((e) => e.id)).size !== q.emplacements.length) pb.push(`${nom} : emplacements en double`);
    for (const e of q.emplacements) if (!dans(e)) pb.push(`${nom} : emplacement ${e.id} hors de l'écran`);
    if (q.lieux.length > EMPLACEMENTS_PAR_QUARTIER) pb.push(`${nom} : plus de six lieux`);
    const pris = new Set<string>();
    for (const l of q.lieux) {
      if (!q.emplacements.some((e) => e.id === l.emplacement)) pb.push(`${nom} : ${l.ids.join("+")} sur un emplacement inconnu`);
      if (pris.has(l.emplacement)) pb.push(`${nom} : emplacement ${l.emplacement} pris deux fois`);
      pris.add(l.emplacement);
      if (!l.ids.length) pb.push(`${nom} : un lieu n'ouvre rien`);
      if (!dans(l.pastille)) pb.push(`${nom} : pastille de ${l.ids.join("+")} hors de l'écran`);
    }
    if (q.decor) {
      for (const l of q.lieux) for (const id of l.ids) if (!q.decor.lieux[id]) pb.push(`${nom} : ${id} n'a pas son dessin`);
      for (const e of q.emplacements) if (!pris.has(e.id) && !q.decor.remplissages[e.id]) pb.push(`${nom} : emplacement libre ${e.id} sans remplissage`);
    }
  });
  return pb;
}

// Du repère des dessins (1194 x 834) à l'écran. Sur l'iPad en paysage, le dessin couvre tout l'écran (comme
// object-fit: cover). Ailleurs, on rogne au plus 12 % de sa largeur et 6 % de sa hauteur de chaque côté, pour que
// les lieux et leurs étiquettes restent visibles ; le reste de l'écran prolonge le ciel et la mer.
export const ROGNAGE_MAX = { l: 0.12, h: 0.06 } as const;
export function echelle(ecran: { l: number; h: number }): number {
  const couvre = Math.max(ecran.l / CADRE.l, ecran.h / CADRE.h);
  return Math.min(couvre, ecran.l / (CADRE.l * (1 - 2 * ROGNAGE_MAX.l)), ecran.h / (CADRE.h * (1 - 2 * ROGNAGE_MAX.h)));
}
export function versEcran(p: Point, ecran: { l: number; h: number }): Point {
  const k = echelle(ecran);
  return { x: (ecran.l - CADRE.l * k) / 2 + p.x * k, y: (ecran.h - CADRE.h * k) / 2 + p.y * k };
}
