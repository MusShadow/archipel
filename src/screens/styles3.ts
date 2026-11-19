// Livraison 3 : styles des écrans redessinés (visages du théâtre, carnet, fin de séance, coin calme, gommette,
// espace parent). Dernière feuille de la cascade : elle s'appuie sur les jetons et les composants album.
export const STYLES_L3 = `
.pickcard .visage-choix{display:block;width:max(84px,calc(var(--u) * 140));height:max(84px,calc(var(--u) * 140));flex:none}
.strippanel .who .medaillon,.scene .who .medaillon{box-shadow:0 0 0 max(2px,calc(var(--u) * 3)) #FFFFFF,var(--ombre-posee)}
/* ---------- carnet d'explorateur : un carnet relié posé sur la table, qu'on feuillette ---------- */
.carnet2{background:radial-gradient(ellipse at 50% 38%,#F8E9CC 0%,#EBD3A8 62%,#DDBF8F 100%)}
.carnet2 .top{display:flex;align-items:center;justify-content:space-between;padding:var(--esp-5) var(--esp-5) 0}
.cn-onglets{display:flex;justify-content:center;gap:var(--esp-4);padding:var(--esp-3) var(--esp-4) 0;position:relative;z-index:1}
.cn-onglet{display:flex;align-items:center;gap:var(--esp-2);min-height:var(--cible-min);padding:var(--esp-2) var(--esp-5) var(--esp-2) var(--esp-2);
border:none;border-radius:var(--rayon-grand) var(--rayon-grand) var(--rayon-petit) var(--rayon-petit);background:var(--papier);color:var(--encre);
font:var(--texte-etiquette);box-shadow:var(--ombre-posee);cursor:pointer;
transition:transform var(--duree-court) var(--courbe-douce),background var(--duree-court)}
.cn-onglet:active{transform:scale(.97)}
.cn-onglet-img{display:block;width:max(52px,calc(var(--u) * 62));height:max(52px,calc(var(--u) * 62));flex:none}
.cn-onglet-img svg,.cn-onglet-img img{display:block;width:100%;height:100%;object-fit:contain}
.cn-onglet.o-gommettes{--o:var(--ile-atelier-vif);--o-clair:var(--ile-atelier-clair)}
.cn-onglet.o-dessins{--o:var(--ile-coeur-vif);--o-clair:var(--ile-coeur-clair)}
.cn-onglet.o-passeport{--o:var(--ile-port-vif);--o-clair:var(--ile-port-clair)}
.cn-onglet{box-shadow:inset 0 calc(-1 * max(5px,calc(var(--u) * 7))) 0 var(--o),var(--ombre-posee)}
.cn-onglet.actif{background:var(--o-clair);transform:translateY(max(3px,calc(var(--u) * 5)))}
.cn-table{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:var(--esp-3);padding:var(--esp-3) var(--esp-4) var(--esp-5)}
.cn-tourner{flex:none}
.cn-livre{position:relative;display:grid;grid-template-columns:1fr;height:min(100%,calc(var(--u) * 660));aspect-ratio:.74;max-width:calc(100% - 2 * var(--btn) - 2 * var(--esp-3));
padding:max(8px,calc(var(--u) * 12));border-radius:var(--rayon-grand);background:var(--ile-port-vif);box-shadow:0 max(6px,calc(var(--u) * 9)) 0 var(--ile-port-fonce),var(--ombre-haute);touch-action:pan-y}
.cn-livre.double{grid-template-columns:1fr 1fr;aspect-ratio:1.46}
.cn-page{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;gap:var(--esp-3);padding:var(--esp-5) var(--esp-5) var(--esp-6);overflow:hidden;
background:var(--papier);background-image:radial-gradient(rgba(39,48,67,.05) 1px,transparent 1.2px);background-size:max(14px,calc(var(--u) * 20)) max(14px,calc(var(--u) * 20))}
.cn-page.gauche{border-radius:var(--rayon-moyen) 3px 3px var(--rayon-moyen);box-shadow:inset calc(-1 * max(10px,calc(var(--u) * 18))) 0 max(12px,calc(var(--u) * 20)) calc(-1 * max(8px,calc(var(--u) * 14))) rgba(39,48,67,.22)}
.cn-page.droite{border-radius:3px var(--rayon-moyen) var(--rayon-moyen) 3px;box-shadow:inset max(10px,calc(var(--u) * 18)) 0 max(12px,calc(var(--u) * 20)) calc(-1 * max(8px,calc(var(--u) * 14))) rgba(39,48,67,.22)}
.cn-page.seule{border-radius:var(--rayon-moyen)}
.cn-page.blanche{background-image:none}
.cn-reliure{position:absolute;left:50%;top:max(8px,calc(var(--u) * 12));bottom:max(8px,calc(var(--u) * 12));width:2px;margin-left:-1px;background:rgba(39,48,67,.18);pointer-events:none}
.cn-entete{margin:0;font:var(--texte-sous-titre);font-weight:800;color:var(--encre);padding:0 var(--esp-4) var(--esp-1);
background:linear-gradient(to top,var(--o-ligne,rgba(255,193,69,.55)) 0 34%,transparent 34%)}
.cn-page.r-dessins .cn-entete{--o-ligne:rgba(232,93,154,.35)}
.cn-page.r-passeport .cn-entete{--o-ligne:rgba(31,169,181,.35)}
.cn-num{position:absolute;bottom:var(--esp-2);font-family:var(--police-titre);font-weight:700;font-size:max(13px,calc(var(--u) * 16));color:var(--encre-douce)}
.cn-page.gauche .cn-num,.cn-page.seule .cn-num{left:var(--esp-4)}
.cn-page.droite .cn-num{right:var(--esp-4)}
.cn-gommettes{flex:1;width:100%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:var(--esp-3);align-items:center;justify-items:center}
.cn-gommette{width:min(100%,max(78px,calc(var(--u) * 116)));aspect-ratio:1;border:none;background:none;padding:0;cursor:pointer;transform:rotate(var(--angle,0deg));
filter:drop-shadow(0 2px 2px rgba(39,48,67,.2))}
.cn-gommette svg,.cn-gommette img{display:block;width:100%;height:100%}
.cn-dessins{flex:1;width:100%;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:var(--esp-5);align-items:center;justify-items:center;padding-top:var(--esp-3)}
.cn-dessin{position:relative;width:min(100%,max(110px,calc(var(--u) * 170)));padding:max(5px,calc(var(--u) * 8)) max(5px,calc(var(--u) * 8)) max(12px,calc(var(--u) * 20));border:none;background:#FFFFFF;
box-shadow:0 2px 6px rgba(39,48,67,.2);transform:rotate(var(--angle,0deg));cursor:pointer}
.cn-dessin img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:#FFFFFF}
.cn-scotch{position:absolute;top:calc(-1 * max(7px,calc(var(--u) * 10)));left:50%;width:max(40px,calc(var(--u) * 56));height:max(14px,calc(var(--u) * 20));margin-left:calc(-1 * max(20px,calc(var(--u) * 28)));
background:rgba(255,239,186,.88);transform:rotate(-5deg);box-shadow:0 1px 2px rgba(39,48,67,.12)}
.cn-passeport{flex:1;width:100%;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,1fr);gap:var(--esp-4);align-items:center;justify-items:center}
.cn-tampon{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--esp-1);min-height:var(--cible-min);width:min(100%,max(110px,calc(var(--u) * 170)));
padding:var(--esp-2) var(--esp-2) var(--esp-1);border:2px dashed #C9B79A;border-radius:var(--rayon-petit);background:rgba(255,255,255,.7);transform:rotate(var(--angle,0deg));cursor:pointer;
font-family:var(--police-titre);font-weight:700;font-size:max(13px,calc(var(--u) * 16));color:var(--encre)}
.cn-fl{display:block;width:88%;aspect-ratio:3/2}
.cn-fl svg{display:block;width:100%;height:100%}
.cn-couverture{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--esp-3)}
.cn-titre{font:var(--texte-titre);color:var(--ile-port-fonce);text-align:center;line-height:1.1}
.cn-avatar{width:max(110px,calc(var(--u) * 168));aspect-ratio:1}
.cn-nom{font:var(--texte-titre);color:var(--encre);line-height:1}
.cn-mondrapeau{width:max(96px,calc(var(--u) * 132));aspect-ratio:94/64;border:none;background:none;padding:0;cursor:pointer;filter:drop-shadow(0 2px 3px rgba(39,48,67,.2))}
.cn-comptes{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--esp-3)}
.cn-compte{display:flex;align-items:center;gap:var(--esp-2);padding:var(--esp-1) var(--esp-4) var(--esp-1) var(--esp-1);border-radius:var(--rayon-pilule);background:#FFFFFF;box-shadow:var(--ombre-posee)}
.cn-compte-img{display:block;width:max(36px,calc(var(--u) * 46));height:max(36px,calc(var(--u) * 46))}
.cn-compte-img svg,.cn-compte-img img{display:block;width:100%;height:100%;object-fit:contain}
.cn-compte b{font:var(--texte-sous-titre);font-weight:800;color:var(--encre)}
.cn-vide{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--esp-4);text-align:center}
.cn-vide-img{display:block;width:max(96px,calc(var(--u) * 130));height:max(96px,calc(var(--u) * 130))}
.cn-vide p{margin:0;max-width:22ch;font:var(--texte-etiquette);color:var(--encre-douce)}
.cn-livre.tourne-avant .cn-page{animation:cn-avant var(--duree-moyen) var(--courbe-douce) both}
.cn-livre.tourne-arriere .cn-page{animation:cn-arriere var(--duree-moyen) var(--courbe-douce) both}
@keyframes cn-avant{from{opacity:.3;transform:translateX(4%)}to{opacity:1;transform:none}}
@keyframes cn-arriere{from{opacity:.3;transform:translateX(-4%)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.cn-livre .cn-page{animation:none!important}}
@media (orientation:portrait){.cn-livre{height:min(100%,calc(var(--u) * 900))}.cn-onglet{padding-right:var(--esp-3)}}
/* ---------- fin de séance : le coucher de soleil peint, le soleil qui descend, les gommettes du voyage ---------- */
.screen.fin{overflow:hidden;background:#FFD996}
.fin-cadre{position:absolute;left:50%;top:50%;width:1194px;height:834px;transform:translate(-50%,-50%);transform-origin:center;pointer-events:none}
.fin-fond{position:absolute;left:0;top:0;width:1194px;height:834px;display:block}
.fin-horizon{position:absolute;left:0;top:0;width:1194px;overflow:hidden}
.fin-soleil{position:absolute;width:240px;height:240px;display:block;animation:fin-coucher var(--duree-coucher-soleil) var(--courbe-calme) forwards}
@keyframes fin-coucher{from{transform:translateY(0)}to{transform:translateY(70px)}}
.fin-contenu{position:relative;z-index:1;height:100%;width:100%;display:flex;flex-direction:column;align-items:center;gap:var(--esp-4);padding:var(--esp-6) var(--esp-5) var(--esp-6)}
.fin-gommettes{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--esp-3);max-width:min(92vw,900px)}
.fin-gommette{display:block;width:max(64px,calc(var(--u) * 86));height:max(64px,calc(var(--u) * 86));transform:rotate(var(--angle,0deg));filter:drop-shadow(0 3px 3px rgba(78,58,104,.32));
animation:fin-gommette var(--duree-long) var(--courbe-rebond) both;animation-delay:calc(var(--i,0) * 120ms + 300ms)}
.fin-gommette svg,.fin-gommette img{display:block;width:100%;height:100%}
@keyframes fin-gommette{from{opacity:0;transform:translateY(12px) rotate(var(--angle,0deg)) scale(.8)}to{opacity:1;transform:rotate(var(--angle,0deg))}}
.fin-bas{display:flex;align-items:flex-end;gap:var(--esp-2);max-width:min(94vw,980px);margin-top:auto}
.screen.fin .fin-plume{width:max(130px,calc(var(--u) * 200));aspect-ratio:auto;flex:none;margin-bottom:calc(-1 * var(--esp-3))}
.fin-bulle{position:relative;display:flex;flex-direction:column;gap:var(--esp-1);margin-bottom:max(36px,calc(var(--u) * 60));padding:var(--esp-4) var(--esp-5);max-width:min(64vw,620px);
background:var(--papier);border-radius:var(--rayon-grand);box-shadow:var(--ombre-haute);font:var(--texte-bulle);color:var(--encre)}
.fin-bulle b{font-family:var(--police-titre);font-weight:800;color:var(--ile-coeur-fonce)}
.fin-bulle::before{content:"";position:absolute;left:calc(-1 * max(12px,calc(var(--u) * 18)));bottom:max(22px,calc(var(--u) * 34));border:max(12px,calc(var(--u) * 18)) solid transparent;border-right-color:var(--papier);border-left:0}
.fin-bouton{flex:none}
@media (prefers-reduced-motion:reduce){.fin-soleil{animation:none;transform:translateY(35px)}.fin-gommette{animation:none}}
@media (orientation:portrait){.fin-bas{flex-direction:column;align-items:center}.fin-bulle{max-width:88vw;margin-bottom:0}.fin-bulle::before{left:50%;top:calc(-1 * max(12px,calc(var(--u) * 18)));bottom:auto;margin-left:calc(-1 * max(12px,calc(var(--u) * 18)));border:max(12px,calc(var(--u) * 18)) solid transparent;border-bottom-color:var(--papier);border-top:0}.screen.fin .fin-plume{order:-1;margin-bottom:0}}
/* ---------- coin calme : Pico respire sur son tapis, un halo clair grandit et rapetisse derrière lui ---------- */
.screen.calme2{overflow:hidden;background:#FBD7DC}
.calme-cadre{position:absolute;left:50%;top:50%;width:1194px;height:834px;transform:translate(-50%,-50%);transform-origin:center;pointer-events:none}
.calme-fond{position:absolute;left:0;top:0;width:1194px;height:834px;display:block}
.calme-halo{position:absolute;left:357px;top:330px;width:480px;height:480px;border-radius:50%;
background:radial-gradient(circle,rgba(255,255,255,.85) 0%,rgba(255,250,246,.55) 38%,rgba(255,246,240,0) 70%);transform:scale(.72)}
.calme-pico{position:absolute;left:483px;top:468.5px;width:230.5px;height:253px;transform-origin:49.5% 96.2%}
.calme-pico img{position:absolute;inset:0;width:100%;height:100%;display:block}
.calme-pico .p-content{opacity:0}
.calme-cadre.fini .p-ferme{opacity:0}
.calme-cadre.fini .p-content{opacity:1}
.calme-pico img{transition:opacity var(--duree-long) var(--courbe-douce)}
.calme-cadre.in .calme-pico{transform:scale(1.05,1.08);transition:transform var(--duree-inspire) var(--courbe-calme)}
.calme-cadre.out .calme-pico{transform:scale(1);transition:transform var(--duree-souffle) var(--courbe-calme)}
.calme-cadre.in .calme-halo{transform:scale(1.1);transition:transform var(--duree-inspire) var(--courbe-calme)}
.calme-cadre.out .calme-halo{transform:scale(.72);transition:transform var(--duree-souffle) var(--courbe-calme)}
.calme-contenu{position:relative;z-index:1;height:100%;width:100%;display:flex;flex-direction:column;align-items:center;padding-bottom:var(--esp-6)}
.calme-contenu .top{width:100%;display:flex;align-items:center;justify-content:space-between;padding:var(--esp-5) var(--esp-5) 0}
.calme-mot{margin:var(--esp-6) 0 0;font-family:var(--police-titre);font-weight:800;font-size:max(36px,calc(var(--u) * 64));color:var(--ile-coeur-fonce);text-shadow:0 2px 0 rgba(255,255,255,.7);min-height:1.3em}
.calme-actions{margin-top:auto;gap:var(--esp-4)}
@media (prefers-reduced-motion:reduce){.calme-cadre.in .calme-pico,.calme-cadre.out .calme-pico{transform:none}.calme-cadre .calme-halo{transform:scale(.9)!important;transition:none!important}}
/* ---------- la gommette gagnée : un ruban, la gommette dans sa lumière (rayons fixes : rien ne tourne ni ne clignote) ---------- */
.overlay.gommette-rituel{flex-direction:column;gap:var(--esp-5);background:rgba(39,48,67,.5)}
.gommette-lumiere{position:relative;display:flex;align-items:center;justify-content:center}
.gommette-rayons{position:absolute;left:50%;top:50%;width:min(78vh,calc(var(--u) * 520));height:min(78vh,calc(var(--u) * 520));transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
background:radial-gradient(circle,rgba(255,236,190,.95) 0%,rgba(255,215,120,.55) 34%,rgba(255,215,120,0) 66%),
repeating-conic-gradient(from 8deg,rgba(255,231,160,.28) 0deg 10deg,rgba(255,231,160,0) 10deg 24deg);
-webkit-mask-image:radial-gradient(circle,#000 30%,transparent 68%);mask-image:radial-gradient(circle,#000 30%,transparent 68%)}
.gommette-rituel .sticker-big{position:relative;filter:drop-shadow(0 8px 12px rgba(39,48,67,.28))}
/* ---------- espace parent : les jetons de l'album, en version sobre (texte Inter, cartes papier, onglets en pilules) ---------- */
.parent{font-family:var(--police-adulte);background:var(--creme);color:var(--encre)}
.parent h1{font-family:var(--police-titre);font-weight:800;font-size:max(26px,calc(var(--u) * 34));line-height:1.1;color:var(--encre)}
.parent h2{font-family:var(--police-titre);font-weight:800;font-size:19px;line-height:1.2;color:var(--encre)}
.parent .p-head{padding:var(--esp-5) var(--esp-6) 0}
.parent .p-tabs{padding:var(--esp-4) var(--esp-6) var(--esp-1);gap:var(--esp-2)}
.parent .p-tab{min-height:44px;padding:10px 18px;border:none;border-radius:var(--rayon-pilule);background:var(--papier);box-shadow:var(--ombre-posee);color:var(--encre-douce);font-family:var(--police-adulte);font-weight:600}
.parent .p-tab.on{background:var(--ile-port-clair);color:var(--ile-port-ombre);box-shadow:inset 0 0 0 2px var(--ile-port-vif)}
.parent .p-wrap{padding:var(--esp-5) var(--esp-6) var(--esp-7);gap:var(--esp-5)}
.parent .p-card{background:var(--papier);border:none;border-radius:var(--rayon-moyen);box-shadow:var(--ombre-douce);padding:18px 20px}
.parent .pbtn{min-height:44px;border-radius:var(--rayon-pilule);background:var(--ile-port-fonce);font-family:var(--police-adulte);font-weight:600;box-shadow:0 3px 0 var(--ile-port-ombre);
transition:transform var(--duree-appui),box-shadow var(--duree-appui)}
.parent .pbtn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ile-port-ombre)}
.parent .pbtn.ghost{background:var(--papier);color:var(--ile-port-fonce);border:1.5px solid var(--ile-port-vif);box-shadow:var(--ombre-posee)}
.parent .pbtn.danger{background:var(--papier);box-shadow:var(--ombre-posee)}
.parent .p-item{border-top-color:var(--trait)}
.parent .kpi{background:var(--surface);border-radius:var(--rayon-petit);box-shadow:inset 0 0 0 1px var(--trait)}
.parent .kpi b{font-family:var(--police-titre);font-weight:800;font-size:26px;line-height:1.1}
.parent .kpi span,.parent .muted{color:var(--encre-douce)}
.parent .bar .track{background:var(--sable)}
.parent .note{background:#FFF4DC;border:none;border-radius:var(--rayon-petit);box-shadow:inset 0 0 0 1px #F2D9A2}
.parent .field input,.parent .field select,.parent .field textarea{border-radius:var(--rayon-petit);border-color:var(--bord);background:var(--papier)}
/* ---------- écrans à part (dessin, miroir, drapeau de mon île, histoires) : le cadre des activités ---------- */
.cadre-act.a-part .top{display:flex;align-items:center;justify-content:space-between;gap:var(--esp-3)}
.cadre-act.a-part .scroll{background:transparent}
.cadre-act.a-part .drawstage .board,.cadre-act.a-part .drawwrap>.board{box-shadow:var(--ombre-douce)}
/* ---------- nénuphars : le chiffre posé sur une pastille claire, lisible partout sur la feuille (contraste > 7:1) ---------- */
.pond.etang .padnum{display:inline-flex;align-items:center;justify-content:center;min-width:1.55em;height:1.55em;border-radius:50%;line-height:1;
background:radial-gradient(circle,rgba(248,255,240,.94) 0 56%,rgba(248,255,240,.6) 66%,rgba(248,255,240,0) 74%);text-shadow:none}
`;
