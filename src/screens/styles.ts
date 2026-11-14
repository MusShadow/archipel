// Styles des écrans (carte, accueil, coin calme, carnet, fin de séance, espace parent).
export const SCREENS_CSS = `
.hint-cont{stroke:#FFC145!important;stroke-width:9px!important;animation:contglow 1s ease-in-out infinite}
@keyframes contglow{50%{opacity:.6}}
/* Accueil */
.start{align-items:center;justify-content:center;gap:max(10px,calc(var(--u) * 22));background:linear-gradient(180deg,var(--cream) 0,var(--cream) 82%,#BFE8EE 82%,#A6DCE5 100%)}
.start .plume-big{width:max(150px,calc(var(--u) * 300));height:max(122px,calc(var(--u) * 242))}
.start h1{font-size:max(40px,calc(var(--u) * 76));margin:0}
.start .sub{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(20px,calc(var(--u) * 32));margin:0;color:var(--grey)}
.kids{display:flex;gap:max(16px,calc(var(--u) * 40));flex-wrap:wrap;justify-content:center}
.kid{display:flex;flex-direction:column;align-items:center;gap:8px;border:none;background:none;cursor:pointer;padding:6px;position:relative}
.kid .av{width:max(96px,calc(var(--u) * 150));height:max(96px,calc(var(--u) * 150));transition:transform .15s}
.kid:active .av{transform:scale(.94)}
.kid .nm{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(20px,calc(var(--u) * 30))}
.kid .moon{position:absolute;top:2px;right:2px;width:max(34px,calc(var(--u) * 46));height:max(34px,calc(var(--u) * 46))}
.lockbtn{position:absolute;right:max(12px,calc(var(--u) * 24));bottom:max(12px,calc(var(--u) * 24));display:flex;align-items:center;gap:8px;border:none;background:none;cursor:pointer;padding:6px;color:#5B6475;font-size:13px;touch-action:none}
.lockbtn .ring{width:52px;height:52px;border-radius:50%;background:conic-gradient(var(--turq-d) calc(var(--p,0) * 1turn),#fff 0);display:flex;align-items:center;justify-content:center;border:2px solid var(--line)}
.lockbtn .ring>span{width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}
/* Carte */
.mapwrap{position:absolute;inset:0;background:#BFE8EE;overflow:hidden}
.mapwrap>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.isl{cursor:pointer;transform-box:fill-box;transform-origin:center}
.isl.sleep{opacity:.62}
.isl:focus{outline:none}
.isl.tapped{animation:islpop .35s ease}
@keyframes islpop{50%{transform:scale(1.03)}}
.ring{animation:ringmove 6s linear infinite}
@keyframes ringmove{to{stroke-dashoffset:-190}}
.zzz text{animation:zzz 3s ease-in-out infinite}
.zzz text:nth-child(2){animation-delay:1.2s}
@keyframes zzz{0%{opacity:0;transform:translate(0,6px)}40%{opacity:1}100%{opacity:0;transform:translate(6px,-14px)}}
.hud{position:absolute;top:max(8px,calc(var(--u) * 16));display:flex;gap:max(8px,calc(var(--u) * 14));z-index:5}
.hud.l{left:max(8px,calc(var(--u) * 20))}
.hud.r{right:max(8px,calc(var(--u) * 20))}
.hudbtn{display:flex;flex-direction:column;align-items:center;gap:4px;border:none;background:none;padding:0;cursor:pointer}
.hudbtn .round{pointer-events:none}
.cap{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(13px,calc(var(--u) * 16));background:rgba(255,247,234,.88);padding:0 8px;border-radius:999px;white-space:nowrap}
.maptip{position:absolute;left:50%;bottom:max(8px,calc(var(--u) * 14));transform:translateX(-50%);width:min(560px,60vw);z-index:4}
@media (max-height:600px){.maptip{display:none}}
/* Gommette */
.sticker-big{width:min(46vh,calc(var(--u) * 300));height:min(46vh,calc(var(--u) * 300));cursor:pointer;border:none;background:none;padding:0;filter:drop-shadow(0 6px 10px rgba(39,48,67,.18))}
/* Coin calme */
.calm{background:linear-gradient(180deg,#FBD9E7 0%,#FFF7EA 75%)}
.breath{position:relative;width:min(56vh,calc(var(--u) * 420));height:min(56vh,calc(var(--u) * 420));display:flex;align-items:center;justify-content:center}
.breath .halo{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(232,93,154,.30) 0,rgba(232,93,154,.12) 55%,rgba(232,93,154,0) 70%);transform:scale(.7);transition:transform 4s ease-in-out}
.breath.in .halo{transform:scale(1.05)}
.breath.out .halo{transition-duration:5s}
.breath .pico{width:46%;height:46%;transition:transform 4s ease-in-out}
.breath.in .pico{transform:scale(1.18)}
.breath.out .pico{transition-duration:5s}
.calm .word-big{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:max(28px,calc(var(--u) * 48));min-height:1.2em;margin:0}
/* Carnet */
.carnet{background:var(--cream)}
.carnet .scroll{flex:1;overflow:auto;padding:max(8px,calc(var(--u) * 12)) max(14px,calc(var(--u) * 40)) 28px;display:flex;flex-direction:column;gap:max(10px,calc(var(--u) * 18))}
.carnet h2{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:max(22px,calc(var(--u) * 32));margin:6px 0 0}
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(max(78px,calc(var(--u) * 112)),1fr));gap:max(8px,calc(var(--u) * 16))}
.sgrid button{border:none;background:none;padding:0;cursor:pointer;aspect-ratio:1}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(max(96px,calc(var(--u) * 150)),1fr));gap:max(8px,calc(var(--u) * 16))}
.fgrid button{border:2px solid var(--line);background:#fff;border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:center;cursor:pointer;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(14px,calc(var(--u) * 18))}
.fgrid .fl{width:100%;aspect-ratio:3/2;display:flex;align-items:center;justify-content:center}
.empty{color:var(--grey);font-size:max(15px,calc(var(--u) * 20));margin:0}
/* Fin de séance */
.sunset{background:linear-gradient(180deg,#FFD58A 0%,#FFB37A 38%,#F59AB0 62%,#BFE8EE 62.2%,#A6DCE5 100%);align-items:center;justify-content:center;gap:max(10px,calc(var(--u) * 18));text-align:center;padding:16px}
.sunset .sunball{position:absolute;left:90%;top:62%;width:max(120px,calc(var(--u) * 220));height:max(120px,calc(var(--u) * 220));border-radius:50%;background:#FFC145;transform:translate(-50%,-50%);clip-path:inset(0 0 50% 0);animation:setting 6s ease-in forwards;opacity:.9}
@keyframes setting{to{transform:translate(-50%,-20%)}}
.sunset .card-end{position:relative;z-index:2;background:rgba(255,247,234,.94);border-radius:28px;padding:max(14px,calc(var(--u) * 28)) max(18px,calc(var(--u) * 40));max-width:min(92vw,760px);display:flex;flex-direction:column;align-items:center;gap:max(8px,calc(var(--u) * 14))}
.sunset h1{font-size:max(26px,calc(var(--u) * 46));margin:0}
.defi{font-size:max(17px,calc(var(--u) * 24));line-height:1.35;margin:0}
/* Espace parent */
.skillrow .muted{white-space:nowrap}
/* Écrans étroits ou en portrait */
@media (orientation:portrait){:root{--u:min(calc(100vw / 860),calc(100vh / 1180))}.flagcard{width:min(40vw,calc(var(--u) * 250));height:min(27vw,calc(var(--u) * 180))}}
@media (max-height:500px){.stage{gap:6px;padding-top:0}}
.p-head{display:flex;align-items:center;gap:12px;padding:16px 24px 0;flex-wrap:wrap}
.p-head .grow{flex:1}
.kidchip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;border:1px solid #D8CDB8;background:#fff;font-weight:600;font-size:14px;cursor:pointer}
.kidchip.on{border-color:var(--turq-d);background:#E1F4F5}
.kidchip .mini{width:28px;height:28px}
.bars{display:flex;flex-direction:column;gap:10px}
.bar{display:grid;grid-template-columns:96px 1fr 64px;gap:10px;align-items:center;font-size:14px}
.bar .track{height:12px;border-radius:999px;background:#F1EADF;overflow:hidden}
.bar .fill{height:100%;border-radius:999px}
.kpis{display:flex;gap:12px;flex-wrap:wrap}
.kpi{flex:1;min-width:120px;background:#FBF8F2;border-radius:12px;padding:10px 12px}
.kpi b{display:block;font-size:22px}
.kpi span{font-size:12.5px;color:#5B6475}
.gchips{display:flex;flex-wrap:wrap;gap:6px}
.gchip{min-width:40px;padding:8px 10px;border-radius:10px;border:1px solid #D8CDB8;background:#fff;font-family:Andika,system-ui,sans-serif;font-size:18px;cursor:pointer}
.gchip.on{background:#FFE0D3;border-color:#FF7F50}
.p-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.p-list{display:flex;flex-direction:column;gap:8px}
.p-item{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #F0E8DA}
.p-item:first-child{border-top:none}
.p-item .grow{flex:1;min-width:0}
textarea.data{width:100%;min-height:140px;font:12px ui-monospace,Menlo,monospace;padding:10px;border-radius:10px;border:1px solid #D8CDB8;-webkit-user-select:text;user-select:text}
.note{background:#FFF4DC;border:1px solid #F2D9A2;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.45}
.swatches{display:flex;gap:10px;flex-wrap:wrap}
.swatch{width:40px;height:40px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #D8CDB8;cursor:pointer}
.swatch.on{box-shadow:0 0 0 3px var(--ink)}
.setup{background:#FBF8F2;align-items:center;overflow:auto}
.setup .box{width:min(640px,94vw);margin:max(16px,4vh) auto;background:#fff;border:1px solid #ECE3D3;border-radius:20px;padding:22px 24px;display:flex;flex-direction:column;gap:16px}
.setup h1{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-size:32px;margin:0}
.setup ul{margin:0;padding-left:20px;line-height:1.6;font-size:15px}
.pin-wrap{display:flex;flex-direction:column;gap:14px;align-items:center}
.pin-wrap.shake{animation:wobble .45s ease}
.linkbtn{border:none;background:none;color:var(--turq-d);font-size:14px;font-weight:600;text-decoration:underline;cursor:pointer;padding:8px;font-family:Inter,system-ui,sans-serif}
.adult-answer{font-size:22px;padding:10px 12px;width:150px;text-align:center;border-radius:10px;border:1px solid #D8CDB8;-webkit-user-select:text;user-select:text}
`;
