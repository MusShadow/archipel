// Registre des activités et de leurs îles.
import type { ActivityModule } from "../host";
import { medallion } from "../ui";
import { chants, emojiStickerSVG } from "./chants";
import { drapeau, flagStickerSVG } from "./drapeau";
import { lis } from "./lis";
import { appleStickerSVG, marche } from "./marche";
import { frogStickerSVG, nenuphars } from "./nenuphars";
import { cookieStickerSVG, partage } from "./partage";
import { syllabes, syllableStickerSVG } from "./syllabes";

export const ACTIVITIES: ActivityModule<any>[] = [marche, nenuphars, partage, syllabes, chants, lis, drapeau];
export const ACTIVITY_BY_ID: Record<string, ActivityModule<any>> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const ACTIVITIES_BY_ISLAND: Record<string, ActivityModule<any>[]> = {};
for (const a of ACTIVITIES) (ACTIVITIES_BY_ISLAND[a.island] ??= []).push(a);
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
  return appleStickerSVG();
}
export const departStickerSVG = () => `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><g transform="translate(9 9) scale(0.62)">${medallion("plume").replace('style="display:block;width:100%;height:100%"', 'width="84" height="84"')}</g></svg>`;
