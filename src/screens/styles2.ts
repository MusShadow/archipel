// Styles des écrans redessinés de la livraison 2 : la plage d'accueil, la carte, les boutons de la carte, le coucher
// du soleil. Ils lisent les variables du système de design (jetons.ts) ; les styles de la v1 (styles.ts) restent pour
// les écrans pas encore redessinés.
export const STYLES_L2 = `
.start.plage{isolation:isolate;justify-content:flex-start;padding-top:max(8px,calc(var(--u) * 20));gap:max(4px,calc(var(--u) * 8));background:#EAF6F2}
.plage-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 100%;z-index:-1;pointer-events:none;user-select:none;-webkit-user-select:none}
.plage-plume{position:relative;flex:0 0 auto;width:max(170px,calc(var(--u) * 260));aspect-ratio:360/300}
.start.plage h1{color:var(--encre);margin:max(-30px,calc(var(--u) * -34)) 0 0;text-shadow:0 3px 0 #fff,0 -3px 0 #fff,3px 0 0 #fff,-3px 0 0 #fff,2px 2px 0 #fff,-2px 2px 0 #fff,0 8px 20px rgba(39,48,67,.18)}
.start.plage .sub{margin:0}
.start.plage .kids{margin-top:auto;margin-bottom:max(56px,calc(var(--u) * 96))}
.kid{transition:transform var(--duree-moyen) var(--courbe-rebond)}
.kid:active{transform:scale(.95);transition-duration:var(--duree-appui)}
.kid .av{display:block}
.start.plage .kid .nm{background:var(--papier);border:2px solid var(--bord);border-radius:var(--rayon-pilule);padding:0 .65em;box-shadow:var(--ombre-posee);color:var(--encre);margin-top:max(4px,calc(var(--u) * 6))}
.start.plage .lockbtn>span:last-child{background:rgba(255,253,248,.92);border-radius:999px;padding:2px 10px;color:var(--encre-douce)}
.mapwrap.carte{background:#8FD3DC}
.carte-mer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none;-webkit-user-select:none}
.carte-cadre{position:absolute;left:50%;top:50%;transform-origin:center}
.ile-carte{position:absolute;padding:0;margin:0;border:none;background:none;cursor:pointer;pointer-events:none}
.ile-zone{position:absolute;border-radius:50%;pointer-events:auto}
.ile-carte .ile-img{transform-origin:50% 62%;transition:transform var(--duree-moyen) var(--courbe-rebond)}
.ile-carte:active .ile-img{transform:scale(.97);transition-duration:var(--duree-appui)}
.ile-carte:focus-visible{outline:4px solid var(--ile-port-fonce);outline-offset:-20px;border-radius:40%}
.ile-carte.tapped .ile-img{animation:islpop .35s ease}
.ile-carte .ile-img{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;-webkit-user-select:none}
.ile-carte.sleep .ile-img{opacity:.62}
.ile-nom{position:absolute;transform:translateX(-50%);display:inline-flex;align-items:center;gap:8px;white-space:nowrap;padding:2px 14px 2px 10px;border-radius:999px;background:var(--papier);
border:2px solid var(--bord);box-shadow:var(--ombre-posee);font:700 17px/1.3 var(--police-titre);color:var(--encre);pointer-events:auto;z-index:2}
.ile-nom i{width:12px;height:12px;border-radius:50%;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
.ile-anneau{position:absolute;pointer-events:none}
.ile-anneau svg{display:block;width:100%;height:100%;overflow:visible}
.ile-anneau ellipse{fill:rgba(255,255,255,.14);stroke:#fff;stroke-width:5;stroke-dasharray:12 11;stroke-linecap:round;animation:anneau-tourne 9s linear infinite}
@keyframes anneau-tourne{to{stroke-dashoffset:-230}}
.ile-fait{position:absolute;width:34px;height:34px;transform:translate(-50%,-50%);pointer-events:none}
.ile-carte .zzz{position:absolute;display:flex;gap:2px;font:800 22px/1 var(--police-titre);color:var(--encre-douce);pointer-events:none}
.ile-carte .zzz i{font-style:normal;animation:zzz 3s ease-in-out infinite}
.ile-carte .zzz i+i{animation-delay:1.2s;font-size:.8em}
.carte-ciel{position:absolute;left:0;top:0;pointer-events:none}
.carte-ciel svg{display:block;overflow:visible}
.carte-plume{position:absolute;left:0;top:0;width:0;height:0;z-index:3}
.carte-plume.en-vol{transition:transform var(--duree-vol-plume) var(--courbe-douce)}
.hudbtn{transition:transform var(--duree-moyen) var(--courbe-rebond)}
.hudbtn:active{transform:scale(.95);transition-duration:var(--duree-appui)}
.hudbtn .a-rond{pointer-events:none}
.hudbtn.hud-calme .a-ico{stroke:var(--ile-decouvertes-fonce)}
.hudbtn.hud-carnet .a-ico{stroke:var(--ile-mots-fonce)}
.hudbtn.hud-moi .a-rond{background:none;border:none;box-shadow:none;overflow:visible}
.hudbtn .cap{font:700 max(14px,calc(var(--u) * 17))/1.3 var(--police-titre);color:var(--encre);background:rgba(255,253,248,.92);border-radius:999px;padding:0 10px;margin-top:2px}
.pond.etang{background:var(--etang) center/100% 100% no-repeat;border-radius:0;padding:max(54px,calc(var(--u) * 84)) max(26px,calc(var(--u) * 46)) max(30px,calc(var(--u) * 46));gap:max(1px,calc(var(--u) * 4))}
.pond.etang .pad{width:min(7.4vw,calc(var(--u) * 92));aspect-ratio:126/81}
.pad-img{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;user-select:none;-webkit-user-select:none}
.pond.etang .pad::after{content:"";position:absolute;left:0;right:0;top:min(-12px,calc(var(--u) * -16));bottom:min(-12px,calc(var(--u) * -14))}
.pond.etang .padnum{color:#173F22;text-shadow:0 0 5px rgba(232,248,220,.95),0 0 2px rgba(232,248,220,.95),0 1px 0 rgba(255,255,255,.5);font-size:max(19px,calc(var(--u) * 32));transform:translateY(-4%)}
.pond.etang .pad{transition:transform var(--duree-moyen) var(--courbe-rebond)}
.pond.etang .pad:active{transform:scale(.94);transition-duration:var(--duree-appui)}
.pond.etang .pad.right{filter:drop-shadow(0 0 max(4px,calc(var(--u) * 6)) rgba(52,179,122,.9))}
.pond.etang .frog{width:min(7.8vw,calc(var(--u) * 96));height:min(7.8vw,calc(var(--u) * 96))}
.frog img{position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;pointer-events:none}
.frog .gr-saut{opacity:0}
.frog.hop .gr-saut{animation:gr-saut .26s ease}
.frog.hop .gr-assise{animation:gr-assise .26s ease}
@media (orientation:portrait){
.pond.etang{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));justify-items:center;align-items:center;width:100%;background-image:var(--etang-haut,var(--etang));
padding:max(70px,calc(var(--u) * 92)) max(22px,calc(var(--u) * 30)) max(34px,calc(var(--u) * 44));row-gap:max(64px,calc(var(--u) * 84));column-gap:max(4px,calc(var(--u) * 8))}
.pond.etang .pad{width:min(100%,calc(var(--u) * 124))}
.pond.etang .frog{width:max(72px,calc(var(--u) * 104));height:max(72px,calc(var(--u) * 104))}
}
@keyframes gr-saut{0%,100%{opacity:0}20%,75%{opacity:1;transform:translateY(-22%)}}
@keyframes gr-assise{0%,100%{opacity:1}20%,75%{opacity:0}}
.compagnons{display:flex;flex-wrap:wrap;gap:12px;padding-top:10px}
.cp-choix{width:60px;height:60px;padding:0;border:none;background:none;border-radius:50%;cursor:pointer;margin-top:6px}
.cp-choix.on{outline:3px solid var(--ile-port-fonce);outline-offset:3px}
.kidchip .mini .compagnon,.p-item .compagnon{--u:0.5px}
.emo.emo-img{width:1em;height:1em;line-height:1;vertical-align:-0.12em}
.emo.emo-img img{display:block;width:122%;height:122%;margin:-11%;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-select:none}
.emo.emo-img.emo-suite{width:auto;display:inline-flex;align-items:center;gap:.14em}
.emo.emo-img.emo-suite img{flex:none;width:1.22em;height:1.22em;margin:-.11em}
.fin-plume{width:max(120px,calc(var(--u) * 180));aspect-ratio:245/238}
.fin-plume img,.sheet-perso img{display:block;width:100%;height:100%;object-fit:contain}
`;
