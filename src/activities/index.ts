// Registre des activités et de leurs îles.
import type { ActivityId, DomainId } from "../core";
import { drawingStickerSVG } from "../drawings";
import type { ActivityModule } from "../host";
import { medallion } from "../ui";
import { atelierdrapeaux } from "./atelierdrapeaux";
import { bip, bipStickerSVG } from "./bip";
import { chants, emojiStickerSVG } from "./chants";
import { drapeau, flagStickerSVG } from "./drapeau";
import { flotte } from "./flotte";
import { formes } from "./formes";
import { goutte } from "./goutte";
import { goutteStickerSVG } from "./goutte_art";
import { lis } from "./lis";
import { appleStickerSVG, marche } from "./marche";
import { motifs } from "./motifs";
import { frogStickerSVG, nenuphars } from "./nenuphars";
import { cookieStickerSVG, partage } from "./partage";
import { syllabes, syllableStickerSVG } from "./syllabes";
import { theatre } from "./theatre";
import { volcan } from "./volcan";
import { volcanStickerSVG } from "./volcan_art";

export const ACTIVITIES: ActivityModule<any>[] = [marche, nenuphars, partage, syllabes, chants, lis, drapeau, atelierdrapeaux, formes, bip, motifs, flotte, goutte, volcan, theatre];
export const ACTIVITY_BY_ID: Record<string, ActivityModule<any>> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const ACTIVITIES_BY_ISLAND: Record<string, ActivityModule<any>[]> = {};
for (const a of ACTIVITIES) (ACTIVITIES_BY_ISLAND[a.island] ??= []).push(a);

// Toutes les activités suivies (modules d'exercices + écrans à part : dessin pas à pas, histoires).
export interface ActivityMeta { id: ActivityId; title: string; domain: DomainId; island: string; maxLevel: number; skills: string[] }
export const META: ActivityMeta[] = [
  ...ACTIVITIES.map((a) => ({ id: a.id, title: a.title, domain: a.domain, island: a.island, maxLevel: a.maxLevel, skills: a.skills })),
  { id: "dessin", title: "Dessine pas à pas", domain: "atelier", island: "atelier", maxLevel: 3, skills: ["ART.TRACE", "ART.ETAPES"] },
  { id: "histoires", title: "Mes histoires", domain: "lecture", island: "mots", maxLevel: 1, skills: ["LECT.TEXTE.COMPRENDRE"] },
];
export const META_BY_ID: Record<string, ActivityMeta> = Object.fromEntries(META.map((m) => [m.id, m]));

export const ISLAND_SPOKEN: Record<string, string> = {
  nombres: "l'île des Nombres", mots: "l'île des Mots", port: "le Port des Voyages", enigmes: "l'île des Énigmes",
  decouvertes: "l'île des Découvertes", atelier: "l'île de l'Atelier", coeur: "l'île du Cœur",
};

// Les gommettes sont stockées sans dessin (type + référence) et redessinées à l'affichage.
export function stickerArt(kind: string, ref?: string): string {
  if (kind === "drapeau" && ref) return flagStickerSVG(ref);
  if (kind === "syllabe") return syllableStickerSVG(ref ?? "ma");
  if (kind === "chant" || kind === "livre") return emojiStickerSVG(ref ?? "🎵", "#FFE0D3");
  if (kind === "grenouille") return frogStickerSVG();
  if (kind === "biscuit") return cookieStickerSVG();
  if (kind === "depart") return departStickerSVG();
  if (kind === "forme" || kind === "motif") return emojiStickerSVG(ref ?? "🔷", "#E6DEFA");
  if (kind === "bip") return bipStickerSVG();
  if (kind === "theatre") return emojiStickerSVG(ref ?? "🎭", "#FBD9E7");
  if (kind === "flotte") return emojiStickerSVG(ref ?? "🦆", "#D5F0E1");
  if (kind === "goutte") return goutteStickerSVG(ref);
  if (kind === "volcan") return volcanStickerSVG(ref);
  if (kind === "dessin") return drawingStickerSVG(ref);
  return appleStickerSVG();
}
export const departStickerSVG = () => `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><g transform="translate(9 9) scale(0.62)">${medallion("plume").replace('style="display:block;width:100%;height:100%"', 'width="84" height="84"')}</g></svg>`;
