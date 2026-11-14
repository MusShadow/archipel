// Registre des activités de la livraison 1 et de leurs îles.
import type { ActivityModule } from "../host";
import { drapeau, flagStickerSVG } from "./drapeau";
import { appleStickerSVG, marche } from "./marche";
import { syllabes, syllableStickerSVG } from "./syllabes";

export const ACTIVITIES: ActivityModule<any>[] = [marche, syllabes, drapeau];
export const ACTIVITY_BY_ISLAND: Record<string, ActivityModule<any>> = { nombres: marche, mots: syllabes, port: drapeau };
export const ISLAND_SPOKEN: Record<string, string> = {
  nombres: "l'île des Nombres", mots: "l'île des Mots", port: "le Port des Voyages", enigmes: "l'île des Énigmes",
  decouvertes: "l'île des Découvertes", atelier: "l'île de l'Atelier", coeur: "l'île du Cœur",
};

// Les gommettes sont stockées sans dessin (type + référence) et redessinées à l'affichage.
export function stickerArt(kind: string, ref?: string): string {
  if (kind === "drapeau" && ref) return flagStickerSVG(ref);
  if (kind === "syllabe") return syllableStickerSVG(ref ?? "ma");
  return appleStickerSVG();
}
