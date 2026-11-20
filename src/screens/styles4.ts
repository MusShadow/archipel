// Livraison 4 : styles des jeux redessinés (marché de Basile, partage du goûter…) et du vol de Plume sur la carte.
// Dernière feuille de la cascade : elle s'appuie sur les jetons et sur la matière album des activités, et garde les
// états propres aux activités (assiette ou boîte survolée pendant un glisser) au-dessus de son habillage.
import { ELEMENTS } from "../illustrations";
import { urlImage } from "../images";

const url = (nom: string) => `url("${urlImage(`illustrations/${ELEMENTS[nom]?.fichier ?? `${nom}.webp`}`)}")`;
// La boîte à biscuits est posée en neuf morceaux (border-image) : la tranche de son bord, en pixels de l'image.
const BORD_BOITE = 2 * Number(ELEMENTS["activites/boite-biscuits"]?.infos?.bord ?? 40);
// Le potager de Bip aussi (cadre en planches) : l'épaisseur des planches, en pixels de l'image.
const BORD_POTAGER = 2 * Number(ELEMENTS["activites/potager"]?.infos?.bord ?? 22);

export const STYLES_L4 = `
:root{--img-assiette:${url("activites/assiette")};--img-corbeille:${url("activites/corbeille")};--img-boite:${url("activites/boite-biscuits")};
--img-plateau-perles:${url("activites/plateau-perles")};--img-alveole:${url("activites/alveole")};--img-potager:${url("activites/potager")}}
/* ---------- objets dessinés des jeux : calques posés dans leur cadre (activities/dessins.ts), vignettes ---------- */
.calque{position:absolute;display:block;max-width:none;pointer-events:none;user-select:none;-webkit-user-select:none}
.vignette{position:relative;display:block;flex:none}
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
/* ---------- Flotte ou coule : le bassin de verre d'Octave (les objets tombent entre le fond et le devant) ---------- */
.bassin.verre{--l:min(84vw,calc(var(--u) * 600));width:var(--l);height:auto;aspect-ratio:600/300;border:none;border-radius:0;overflow:visible;background:none}
.bassin.verre .calque.devant{z-index:2}
.bassin.verre .fobj{top:7%;font-size:calc(var(--l) * .13 * var(--s,1))}
.bassin.verre .fobj.floats{top:calc(var(--eau) - .55em)}
.bassin.verre .fobj.sinks{top:calc(var(--sable) - .97em)}
.bassin.verre .onde{position:absolute;top:var(--eau);width:calc(var(--l) * .2);aspect-ratio:4/1;box-sizing:border-box;border:max(2px,calc(var(--u) * 3)) solid rgba(255,255,255,.95);
border-radius:50%;z-index:2;pointer-events:none;opacity:0;transform:translate(-50%,-50%) scale(.3);animation:onde .4s ease-out both}
@keyframes onde{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}15%{opacity:.95}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}
@media (orientation:portrait){.bassin.verre{--l:min(88vw,calc(var(--u) * 820))}}
.pickcard.labelled .fvign{height:max(60px,calc(var(--u) * 100));width:auto}
/* ---------- Les motifs de Rico : des perles en bois enfilées sur un cordon ; le tableau, un plateau à alvéoles ---------- */
.motifseq{--ecart:max(4px,calc(var(--u) * 10));gap:var(--ecart)}
.motifseq .tok{position:relative;background:none;border-color:transparent;padding:max(2px,calc(var(--u) * 3))}
.motifseq .tok::before{content:"";position:absolute;z-index:0;left:calc(var(--ecart) * -.5 - 1px);right:calc(var(--ecart) * -.5 - 1px);top:50%;
height:max(5px,calc(var(--u) * 8));transform:translateY(-50%);border-radius:99px;background:repeating-linear-gradient(115deg,#E8D5AB 0 4px,#C6AA7A 4px 7px);
box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 1px 1px rgba(39,48,67,.2)}
.tok .vignette.perle{position:relative;z-index:1;width:118%;height:118%;margin:-9%}
.motifseq .tok.hole{border-color:var(--violet);background:#F3EEFF;border-radius:50%}
.tok.hole .title{position:relative;z-index:1}
.motifseq .tok.unit,.motifseq .tok.lit,.motifseq .tok.right{border-radius:16px}
.motifseq .tok.unit{background:#FFF0CF}
.motifseq .tok.right{border-color:var(--green);background:#E3F6EC}
.panel.motif-plateau{background:none;box-shadow:none;border:none;padding:0}
.motifgrid{padding:max(12px,calc(var(--u) * 20));background:var(--img-plateau-perles) center/100% 100% no-repeat}
.motifgrid .tok{width:max(56px,calc(var(--u) * 100));height:max(56px,calc(var(--u) * 100));background:var(--img-alveole) center/100% 100% no-repeat;border-color:transparent;padding:max(5px,calc(var(--u) * 8))}
.motifgrid .tok.hole{border:3px dashed var(--violet);border-radius:18px;background:#F3EEFF}
.motifgrid .tok.lit{box-shadow:inset 0 0 0 999px rgba(140,107,224,.26);border-radius:18px}
.motifgrid .tok.right{box-shadow:inset 0 0 0 999px rgba(52,179,122,.28);border-color:var(--green);border-radius:18px}
.tokcard .vignette.perle{width:max(64px,calc(var(--u) * 116));height:max(64px,calc(var(--u) * 116))}
/* ---------- Le chemin de Bip : un potager en cases ---------- */
.bipgrid{border:max(10px,calc(var(--u) * 18)) solid transparent;border-image:var(--img-potager) ${BORD_POTAGER} fill/auto stretch;background:none;border-radius:0;
padding:max(3px,calc(var(--u) * 5));filter:drop-shadow(0 4px 6px rgba(39,48,67,.22))}
.bipcell{border:none;border-radius:12%;background:center/100% 100% no-repeat;padding:8%}
.bipcell .vignette{width:100%;height:100%}
.bipcell.path{border:3px dashed var(--violet);box-shadow:inset 0 0 0 999px rgba(243,238,255,.45)}
.bipgrid .bipbot{padding:0}
.bipbot img{display:block;width:110%;height:110%;margin:-5%;object-fit:contain;pointer-events:none}
.bipbot.bump img{animation:bump .45s ease}
/* ---------- Le grand tri : des poubelles dessinées ; le couvercle se soulève autour de sa charnière, en arrière ---------- */
.poubelle{position:relative;display:block;width:100%;height:100%}
.poubelle .lid{transform-origin:5% 72%;transition:transform .25s ease-out}
`;
