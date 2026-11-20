// Livraison 4 : styles des jeux redessinés (marché de Basile, partage du goûter…) et du vol de Plume sur la carte.
// Dernière feuille de la cascade : elle s'appuie sur les jetons et sur la matière album des activités, et garde les
// états propres aux activités (assiette ou boîte survolée pendant un glisser) au-dessus de son habillage.
import { ELEMENTS } from "../illustrations";
import { urlImage } from "../images";

const url = (nom: string) => `url("${urlImage(`illustrations/${ELEMENTS[nom]?.fichier ?? `${nom}.webp`}`)}")`;
// La boîte à biscuits est posée en neuf morceaux (border-image) : la tranche de son bord, en pixels de l'image.
const BORD_BOITE = 2 * Number(ELEMENTS["activites/boite-biscuits"]?.infos?.bord ?? 40);

export const STYLES_L4 = `
:root{--img-assiette:${url("activites/assiette")};--img-corbeille:${url("activites/corbeille")};--img-boite:${url("activites/boite-biscuits")}}
/* ---------- objets dessinés de l'imagier : la pomme et le biscuit remplissent leur place, comme les emoji ---------- */
.pomme img,.cookie img{display:block;width:122%;height:122%;margin:-11%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-select:none}
/* ---------- le marché de Basile ---------- */
.panier-osier{--l:min(88vw,calc(var(--u) * 780));position:relative;box-sizing:border-box;display:flex;flex-wrap:wrap-reverse;align-content:flex-start;align-items:flex-end;justify-content:center;
gap:max(4px,calc(var(--u) * 8));width:var(--l);min-height:calc(var(--l) * 249 / 991);padding:calc(var(--l) * .03) calc(var(--l) * .1) calc(var(--l) * .085);
background:center bottom/100% auto no-repeat}
.corbeille{position:relative;width:max(190px,calc(var(--u) * 330));aspect-ratio:383/341.5;background:center/100% 100% no-repeat}
.cagette{position:relative;width:max(300px,calc(var(--u) * 470));aspect-ratio:548.5/263;background:center/100% 100% no-repeat}
.cagette .cell{position:absolute;width:13.2%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%}
.ardoise-compteur{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:max(86px,calc(var(--u) * 140));aspect-ratio:220/144.5;padding:0 max(12px,calc(var(--u) * 22));
background:center/100% 100% no-repeat;color:#FFFDF4;font-family:var(--police-titre);font-weight:800;font-size:max(24px,calc(var(--u) * 40));line-height:1;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.sac10{position:relative;display:block;width:100%;height:100%}
.sac10 img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-select:none}
.sac10 b{position:absolute;transform:translate(-50%,-50%);font-family:var(--police-titre);font-weight:800;font-size:calc(var(--sac,80px) * .3);line-height:1;color:var(--encre)}
.sac-btn,.sac-pose{--sac:max(52px,calc(var(--u) * 96));display:block;flex:none;width:var(--sac);height:calc(var(--sac) * 1.25);border:none;background:none;padding:0}
.sac-btn{cursor:pointer;touch-action:manipulation}
.card .sac10{--sac:max(48px,calc(var(--u) * 84));width:var(--sac);height:calc(var(--sac) * 1.25);max-height:92%}
/* ---------- le partage du goûter : assiettes en faïence, boîte à biscuits en fer, panier d'osier, nappe vichy ---------- */
.cadre-act .panel.cookies{border:max(14px,calc(var(--u) * 24)) solid transparent;border-image:var(--img-boite) ${BORD_BOITE} fill/auto stretch;background:none;
border-radius:max(12px,calc(var(--u) * 20));box-shadow:var(--ombre-posee);padding:max(4px,calc(var(--u) * 8)) max(8px,calc(var(--u) * 14))}
.cadre-act .panel.cookies.over{box-shadow:0 0 0 max(4px,calc(var(--u) * 7)) rgba(31,169,181,.55),var(--ombre-posee)}
.cadre-act .panel.cookies .muted{color:var(--encre)}
.cadre-act .plates{padding:max(10px,calc(var(--u) * 18)) max(14px,calc(var(--u) * 28));border-radius:var(--rayon-grand);box-shadow:var(--ombre-posee);
background-color:#FFFDF6;background-image:linear-gradient(90deg,rgba(61,139,234,.16) 50%,transparent 50%),linear-gradient(0deg,rgba(61,139,234,.16) 50%,transparent 50%);
background-size:max(28px,calc(var(--u) * 44)) max(28px,calc(var(--u) * 44))}
.cadre-act .plate .dish{background:var(--img-assiette) center/100% 100% no-repeat;border-color:transparent}
.cadre-act .plate.basket .dish{background:var(--img-corbeille) center/100% 100% no-repeat;border-color:transparent;border-radius:50%}
.cadre-act .plate.over .dish{border-color:transparent;box-shadow:0 0 0 max(4px,calc(var(--u) * 7)) rgba(31,169,181,.55);transform:scale(1.05)}
`;
