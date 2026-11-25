// Styles des écrans (carte, accueil, coin calme, carnet, fin de séance, espace parent).
export const SCREENS_CSS = `
.hint-cont{stroke:#FFC145!important;stroke-width:9px!important;animation:contglow 1s ease-in-out 3}
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
/* Images (emoji du système) et cartes à choisir */
.emo{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;line-height:1;display:inline-block}
.pic{width:max(84px,calc(var(--u) * 130));height:max(84px,calc(var(--u) * 130));border-radius:24px;background:#fff;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:max(52px,calc(var(--u) * 84))}
.pic.big{width:max(110px,calc(var(--u) * 180));height:max(110px,calc(var(--u) * 180));font-size:max(70px,calc(var(--u) * 120))}
.pickcard{width:max(110px,calc(var(--u) * 200));height:max(100px,calc(var(--u) * 176));font-size:max(56px,calc(var(--u) * 96))}
.pair{display:flex;gap:.08em;font-size:.82em}
.stack{display:flex;flex-direction:column;align-items:center;line-height:.9;font-size:.86em}
.numcard{width:max(76px,calc(var(--u) * 130));height:max(76px,calc(var(--u) * 130))}
.numcard .title{font-size:max(36px,calc(var(--u) * 64))}
.readline{flex-wrap:wrap;justify-content:center;gap:.28em;font-size:max(38px,calc(var(--u) * 76))}
.mute{color:#B4BBC8}
.w{white-space:nowrap}
.sight{border-bottom:max(2px,calc(var(--u) * 4)) dotted var(--turq);padding:0 .04em}
/* Tambour des chants de Mona */
.drum{width:max(120px,calc(var(--u) * 200));height:max(110px,calc(var(--u) * 184));border:none;background:none;padding:0;cursor:pointer}
.drum.hit{animation:drumhit .18s ease}
@keyframes drumhit{50%{transform:scale(.92)}}
.beats{display:flex;gap:max(10px,calc(var(--u) * 16));min-height:max(30px,calc(var(--u) * 44));align-items:center}
.beat{width:max(26px,calc(var(--u) * 40));height:max(26px,calc(var(--u) * 40));border-radius:50%;border:3px solid var(--coral)}
.beat.on{background:var(--coral)}
.beat.off{border-color:var(--line);border-style:dashed}
.beat.ghost{border-style:dashed;background:#FFE0D3}
/* Nénuphars */
.pond{position:relative;display:flex;gap:max(2px,calc(var(--u) * 6));padding:max(46px,calc(var(--u) * 80)) max(8px,calc(var(--u) * 18)) max(10px,calc(var(--u) * 18));background:#BFE8EE;border-radius:28px;max-width:100%}
.pad{position:relative;width:min(6.9vw,calc(var(--u) * 92));aspect-ratio:5/3;border:none;background:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pad:disabled{cursor:default}
.padnum{position:relative;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:max(18px,calc(var(--u) * 32));color:#1E4D2B}
.pad.glow{border-radius:50%}
.frog{position:absolute;left:0;top:0;width:min(7vw,calc(var(--u) * 84));height:min(6vw,calc(var(--u) * 72));transition:none;pointer-events:none;z-index:2}
.frog.ready{transition:transform .22s cubic-bezier(.3,.7,.3,1)}
.frog.hop>svg{animation:hop .26s ease}
@keyframes hop{40%{transform:translateY(-22%) scale(1.05)}}
/* Partage du goûter */
.cookies{flex-wrap:wrap;gap:6px;min-height:max(70px,calc(var(--u) * 110));max-width:min(92vw,calc(var(--u) * 820))}
.cookie{display:block;width:max(40px,calc(var(--u) * 64));height:max(40px,calc(var(--u) * 64))}
.cookie.small{width:max(30px,calc(var(--u) * 48));height:max(30px,calc(var(--u) * 48));cursor:grab}
.cookies.box .cookie,.dish .cookie{touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}
.cookie.wiggle{animation:wiggle .4s ease-in-out}
@keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg) scale(1.08)}75%{transform:rotate(12deg) scale(1.08)}}
.cookie.lifted{opacity:.25}
.cookie.ghost{position:fixed;z-index:60;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(39,48,67,.3))}
.cookies.box{border-style:dashed;background:#FFF7E8}
.cookies.over{border-color:var(--turq);background:#E1F4F5}
.plate.over .dish{border-color:var(--turq);background:#E1F4F5;transform:scale(1.05)}
.plates{gap:max(10px,calc(var(--u) * 22));align-items:stretch;--dishw:calc(var(--u) * 240);--dishh:calc(var(--u) * 150)}
.plates.z2{--dishw:calc(var(--u) * 320);--dishh:calc(var(--u) * 170)}
.plates.z3{--dishw:calc(var(--u) * 270);--dishh:calc(var(--u) * 160)}
.plates.z4{--dishw:calc(var(--u) * 225);--dishh:calc(var(--u) * 150)}
.plate{display:flex;flex-direction:column;align-items:center;gap:8px;border:none;background:none;cursor:pointer;padding:0}
.friend{display:block;width:max(56px,calc(var(--u) * 84));height:max(56px,calc(var(--u) * 84))}
.dish{display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:max(2px,calc(var(--u) * 5));width:max(130px,var(--dishw,calc(var(--u) * 240)));min-height:max(80px,var(--dishh,calc(var(--u) * 150)));padding:max(10px,calc(var(--u) * 18)) max(12px,calc(var(--u) * 24));transition:transform .15s,border-color .15s,background .15s;background:#fff;border:max(3px,calc(var(--u) * 5)) solid #E4D9C5;border-radius:50%}
.basket .dish{border-radius:18px;border-style:dashed;background:#FFF0C9}
/* Choix d'activité sur une île */
.actcards{display:flex;gap:max(10px,calc(var(--u) * 18));flex-wrap:wrap;justify-content:center}
.actcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:max(130px,calc(var(--u) * 190));padding:max(12px,calc(var(--u) * 18)) 10px;border-radius:22px;border:3px solid var(--line);background:#fff;cursor:pointer}
.actcard.advised{border-color:var(--turq-d);box-shadow:0 0 0 5px rgba(31,169,181,.25)}
.actcard.locked{opacity:.55}
.actart{font-size:max(48px,calc(var(--u) * 72));line-height:1;display:flex;align-items:center;justify-content:center;height:1.1em}
.acttitle{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(16px,calc(var(--u) * 21));line-height:1.15;text-align:center}
.advice{position:absolute;top:-12px;background:var(--turq-d);color:#fff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;white-space:nowrap}
.lockic{position:absolute;top:8px;right:8px;width:26px;height:26px;display:flex}
.goalbtn{border:none;background:none;font-size:20px;line-height:1;color:#C9A227;cursor:pointer;padding:2px 4px}
.goalbtn.on{color:#E0A400}
.depart h1{margin:0}
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

.screen>.scroll{flex:1;overflow:auto;padding:max(8px,calc(var(--u) * 12)) max(14px,calc(var(--u) * 40)) 28px}
/* Livraison 2 — Énigmes : formes */
.shapebox{padding:max(8px,calc(var(--u) * 14))}
.shapebox .side{stroke:#FF7F50;stroke-width:6;stroke-linecap:round;opacity:0;animation:sideOn .45s ease forwards}
.shapebox .sidenum{opacity:0;animation:sideOn .45s ease forwards}
@keyframes sideOn{to{opacity:1}}
.pickcard svg{max-height:100%}
/* Bip */
.bipgrid{position:relative;display:grid;gap:max(3px,calc(var(--u) * 6));width:max(220px,min(86vw,560px,calc((100vh - var(--btn) * 3.6 - 125px) * var(--ar))));padding:max(4px,calc(var(--u) * 8));background:#E6DEFA;border-radius:18px}
.bipcell{background:#fff;border:2px solid #D9CEF3;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:10%;min-width:0;min-height:0}
.bipcell.path{border:3px dashed var(--violet);background:#F3EEFF}
.bipbot{position:absolute;left:0;top:0;pointer-events:none;padding:4px;box-sizing:border-box;z-index:2}
.bipbot.ready{transition:transform .32s ease}
.bipbot.bump svg{animation:bump .45s ease}
@keyframes bump{25%{transform:translateX(-10%) rotate(-6deg)}75%{transform:translateX(10%) rotate(6deg)}}
.bipprog{display:flex;gap:max(4px,calc(var(--u) * 8));flex-wrap:wrap;justify-content:center;min-height:max(40px,calc(var(--u) * 56))}
.bipslot{width:max(40px,calc(var(--u) * 56));height:max(40px,calc(var(--u) * 56));border-radius:12px;border:2px dashed #CFC4EC;background:#fff;display:flex;align-items:center;justify-content:center;padding:0}
.bipslot.filled,button.bipslot{border-style:solid;border-color:var(--violet);background:#F3EEFF}
button.bipslot{cursor:pointer}
button.bipslot.right{border-color:var(--green);background:#E3F6EC}
.bippad .round.ok{background:var(--green);border-color:#26895B}
/* Motifs */
.motifseq{display:flex;flex-wrap:wrap;gap:max(4px,calc(var(--u) * 10));justify-content:center;max-width:min(92vw,calc(var(--u) * 1000))}
.motifgrid{display:grid;gap:max(6px,calc(var(--u) * 10))}
.tok{width:max(46px,calc(var(--u) * 78));height:max(46px,calc(var(--u) * 78));display:flex;align-items:center;justify-content:center;border-radius:14px;padding:6px;background:#fff;border:2px solid transparent;transition:background .2s}
button.tok{cursor:pointer;border-color:var(--line)}
.motifseq.long .tok{width:max(38px,calc(var(--u) * 62));height:max(38px,calc(var(--u) * 62));padding:4px}
.tok.hole{border:3px dashed var(--violet);background:#F3EEFF;color:var(--violet);font-size:max(26px,calc(var(--u) * 40))}
.tok.unit{background:#FFF4DC}
.tok.lit{background:#E6DEFA}
.tok.right{border-color:var(--green);background:#E3F6EC}
.tokcard{padding:max(14px,calc(var(--u) * 26))}
/* Théâtre de Pico */
.who{display:block;width:max(64px,calc(var(--u) * 104));height:max(64px,calc(var(--u) * 104))}
.scene{gap:max(10px,calc(var(--u) * 20));font-size:max(56px,calc(var(--u) * 96))}
.strip{display:flex;gap:max(8px,calc(var(--u) * 16));flex-wrap:wrap;justify-content:center}
.strippanel{position:relative;gap:6px;font-size:max(32px,calc(var(--u) * 54));padding:max(8px,calc(var(--u) * 14)) max(10px,calc(var(--u) * 18));min-width:max(120px,calc(var(--u) * 210))}
.strippanel .who{width:max(46px,calc(var(--u) * 72));height:max(46px,calc(var(--u) * 72))}
.strippanel .arrow{font-size:.6em;color:var(--grey)}
.strippanel .out{position:absolute;right:-10px;top:-12px;width:max(30px,calc(var(--u) * 44));height:max(30px,calc(var(--u) * 44));opacity:.35}
.emo.q{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;color:var(--violet)}
.lbox{position:relative;display:inline-block;line-height:1}
.lbox .badge{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);font-size:.42em;background:#fff;border-radius:8px;padding:2px 4px;border:2px solid #E4D9C5}
.lbox.open{transform:rotate(-12deg)}
.emo.pop{margin-left:-.2em;margin-top:-.6em}
.pickcard.labelled{flex-direction:column;gap:6px;height:auto;min-height:max(110px,calc(var(--u) * 190));width:max(128px,calc(var(--u) * 230))}
.lab{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(15px,calc(var(--u) * 21));line-height:1.15;text-align:center;color:var(--ink)}
.pickcard.labelled svg{height:max(60px,calc(var(--u) * 100))}
/* Flotte ou coule */
.bassin{position:relative;width:min(80vw,calc(var(--u) * 560));height:max(170px,calc(var(--u) * 280));border-radius:24px;overflow:hidden;border:3px solid var(--line);background:#FFF}
.eau{position:absolute;left:0;right:0;bottom:0;top:40%;background:linear-gradient(#9FDCE7,#3D9DC0);border-top:4px solid #3D8BEA}
.fobj{position:absolute;top:4%;transform:translateX(-50%);font-size:calc(max(48px,calc(var(--u) * 84)) * var(--s,1));line-height:1;transition:top 1.2s cubic-bezier(.3,.7,.4,1);z-index:1}
.fobj.floats{top:24%;animation:bob 1.8s ease-in-out 1.2s infinite}
.fobj.sinks{top:66%;transition:top 1.45s cubic-bezier(.5,0,.8,.6)}
@keyframes bob{50%{margin-top:6px}}
/* Voyage de la goutte */
.wart{display:flex;align-items:center;justify-content:center;width:max(64px,calc(var(--u) * 108));height:max(64px,calc(var(--u) * 108));font-size:max(50px,calc(var(--u) * 86));line-height:1;flex:0 0 auto}
.wart svg{display:block;width:100%;height:100%}
.wart.big{width:max(84px,calc(var(--u) * 150));height:max(84px,calc(var(--u) * 150));font-size:max(66px,calc(var(--u) * 120))}
.wart.scene{width:max(110px,calc(var(--u) * 190));height:max(96px,calc(var(--u) * 160))}
.wart.wq{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;color:var(--violet);border:max(3px,calc(var(--u) * 4)) dashed #CDBFF2;border-radius:22px;font-size:max(46px,calc(var(--u) * 80));background:#F8F5FF}
.wpanel{gap:max(10px,calc(var(--u) * 22));padding:max(10px,calc(var(--u) * 16)) max(14px,calc(var(--u) * 30))}
.warrow{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:max(26px,calc(var(--u) * 48));color:var(--grey);line-height:1}
.wstrip{display:flex;align-items:center;justify-content:center;gap:max(4px,calc(var(--u) * 10));flex-wrap:wrap;max-width:96vw}
.wstep{display:flex;flex-direction:column;align-items:center;gap:4px;padding:max(6px,calc(var(--u) * 10));border:max(2px,calc(var(--u) * 3)) solid var(--line);border-radius:18px;background:#fff}
.wstep.plain{border:none;padding:0;background:none}
.wstep .wart{width:max(56px,calc(var(--u) * 100));height:max(56px,calc(var(--u) * 100));font-size:max(44px,calc(var(--u) * 80))}
.wstep.plain .wart.big{width:max(84px,calc(var(--u) * 150));height:max(84px,calc(var(--u) * 150));font-size:max(66px,calc(var(--u) * 120))}
.wstep.miss{border-style:dashed;border-color:#CDBFF2;background:#F8F5FF}
.wstep.miss .wart.wq{border:none;background:none}
.wlab{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(13px,calc(var(--u) * 19));color:var(--grey);text-align:center;max-width:8.5em;line-height:1.1}
.wcard .wart{width:max(60px,calc(var(--u) * 104));height:max(60px,calc(var(--u) * 104))}
.wcard.wide{width:max(150px,calc(var(--u) * 260))}
.wcard.wide .wart.scene{width:max(110px,calc(var(--u) * 190));height:max(96px,calc(var(--u) * 160))}
.wwho{display:block;width:max(64px,calc(var(--u) * 104));height:max(64px,calc(var(--u) * 104))}
/* Le volcan d'Octave */
.vcoupe{position:relative;height:min(calc(100vh - var(--btn) * 2 - 170px),calc(92vw * .8));aspect-ratio:200/160;max-width:92vw;flex:0 0 auto}
.vfinger{position:absolute;left:50%;top:80%;font-size:max(40px,calc(var(--u) * 64));line-height:1;transform:translate(-30%,0);pointer-events:none;animation:vfinger 1.8s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(39,48,67,.25))}
@keyframes vfinger{0%{transform:translate(-30%,0);opacity:0}15%{opacity:1}70%{transform:translate(-30%,-180%);opacity:1}100%{transform:translate(-30%,-200%);opacity:0}}
.vcoupe svg{touch-action:none}
.vpart{cursor:pointer;-webkit-tap-highlight-color:transparent}
.vpart rect.hit{transition:fill .2s}
.vpart.hint rect.hit{fill:rgba(255,193,69,.22);stroke:#FFC145;stroke-width:2;stroke-dasharray:5 4}
.vpart.hint path.hit{stroke:#FFC145;stroke-opacity:.25}
.vpart.glowing rect.hit{fill:rgba(255,193,69,.35);stroke:#FFC145;stroke-width:3;animation:vpulse 1s ease-in-out infinite}
.vpart.glowing path.hit{stroke:#FFC145;stroke-opacity:.45;animation:vpulse 1s ease-in-out infinite}
.vpart.right rect.hit{fill:rgba(52,179,122,.25);stroke:#34B37A;stroke-width:3;animation:none}
.vpart.right path.hit{stroke:#34B37A;stroke-opacity:.4;animation:none}
@keyframes vpulse{50%{opacity:.4}}
.vmonte.hinted [data-t="chambre"] rect.hit{fill:rgba(255,193,69,.3);stroke:#FFC145;stroke-width:3;animation:vpulse 1s ease-in-out infinite}
.vshake svg{animation:vshake .08s linear 12 alternate}
@keyframes vshake{from{transform:translate(-.8%,0)}to{transform:translate(.8%,.4%)}}
.veruption .vjet{transform-box:fill-box;transform-origin:50% 100%;animation:vjet .55s cubic-bezier(.3,1.6,.5,1) both}
@keyframes vjet{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.veruption .vdrop{animation:vdrop .6s ease-out both}
@keyframes vdrop{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}
.varrow path{animation:varrow .8s linear infinite}
@keyframes varrow{to{stroke-dashoffset:-13}}
/* Le grand tri */
.tbasket{gap:max(8px,calc(var(--u) * 18));flex-wrap:wrap;max-width:94vw;min-height:max(100px,calc(var(--u) * 160))}
.twho{display:block;width:max(52px,calc(var(--u) * 84));height:max(52px,calc(var(--u) * 84));flex:0 0 auto;margin-right:max(4px,calc(var(--u) * 10))}
.titem{display:block;width:max(72px,min(14vw,15.5vh));height:max(72px,min(14vw,15.5vh));padding:max(4px,calc(var(--u) * 8));border-radius:20px;cursor:grab;touch-action:none;transition:transform .15s,opacity .15s,background .2s}
.titem svg{pointer-events:none}
.titem.selected{background:#FFF4CC;box-shadow:0 0 0 max(3px,calc(var(--u) * 5)) var(--yellow);transform:scale(1.06)}
.titem.lifted{opacity:.25}
.tghost{position:fixed;z-index:60;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(39,48,67,.3))}
.tbins{display:flex;justify-content:center;align-items:flex-end;gap:max(6px,calc(var(--u) * 20));width:100%;max-width:96vw}
.tbin{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;padding:max(4px,calc(var(--u) * 8)) max(4px,calc(var(--u) * 10));border-radius:22px;cursor:pointer;transition:transform .15s,background .2s}
.tbinart{display:block;width:max(84px,min(17vw,21vh));height:max(84px,min(17vw,21vh))}
.tbins.n5 .tbinart{width:max(72px,min(15vw,19vh));height:max(72px,min(15vw,19vh))}
.tbinart.small{width:max(56px,calc(var(--u) * 96));height:max(56px,calc(var(--u) * 96))}
.tbinart svg .lid{transform-box:fill-box;transform-origin:0% 100%;transition:transform .25s ease-out}
.tbin.open .lid{transform:rotate(-24deg)}
.tbin.over{background:#E1F4F5;transform:scale(1.07)}
.tbin.over .lid{transform:rotate(-16deg)}
.tbin.right{background:#E3F5EC}
.tlab{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(13px,calc(var(--u) * 19));color:var(--grey);line-height:1.1}
/* Le voyage des déchets */
.drue{position:relative;width:min(94vw,calc((100vh - var(--btn) * 2 - 150px) * 320 / 170));aspect-ratio:320/170;flex:0 0 auto;border-radius:24px;overflow:hidden;background:#DDF1FA;border:2px solid var(--line)}
.drue svg{position:absolute;inset:0;touch-action:none}
.drue .dtruck{transition:transform 1.3s ease-in,opacity .5s ease-in .8s}
.drue.dgo .dtruck{transform:translateX(190px);opacity:0}
.drue .dlift{transition:fill .2s}
.drue.hinted .dlift{fill:rgba(255,193,69,.28);stroke:#FFC145;stroke-width:3;stroke-dasharray:7 5}
.drue.over .dlift{fill:rgba(31,169,181,.25);stroke:var(--turq);stroke-width:3}
.dbin{position:absolute;display:block;z-index:2;touch-action:none;cursor:grab;border-radius:16px;filter:drop-shadow(0 5px 6px rgba(39,48,67,.18))}
.dbin svg{display:block;width:100%;height:100%;pointer-events:none}
.dbin.held{filter:drop-shadow(0 12px 12px rgba(39,48,67,.3));cursor:grabbing}
.dbin .lid{transform-box:fill-box;transform-origin:0% 100%;transition:transform .2s}
.dbin.open .lid{transform:rotate(-70deg)}
.dfinger{position:absolute;z-index:3;font-size:max(36px,calc(var(--u) * 58));line-height:1;pointer-events:none;transform:translate(-30%,0);filter:drop-shadow(0 4px 6px rgba(39,48,67,.25))}
.tbasket.dtapis{background:repeating-linear-gradient(90deg,#B7BDC9 0 30px,#A7AEBC 30px 33px);border:3px solid #6B7080;box-shadow:inset 0 -8px 0 rgba(39,48,67,.12);animation:dbelt 2.4s linear infinite}
@keyframes dbelt{to{background-position:33px 0}}
.wstrip.dlong{flex-wrap:nowrap;gap:max(3px,calc(var(--u) * 8))}
.wstrip.dlong .wstep{padding:max(4px,calc(var(--u) * 8))}
.wstrip.dlong .wstep .wart{width:max(50px,min(9.5vw,calc(var(--u) * 92)));height:max(50px,min(9.5vw,calc(var(--u) * 92)))}
.wstrip.dlong .warrow{font-size:max(20px,calc(var(--u) * 36))}
.wstrip.dlong .wlab{font-size:max(12px,calc(var(--u) * 16));max-width:6.5em}
.wcard.dwide{width:max(170px,calc(var(--u) * 280))}
.wcard.dwide .wart{width:max(90px,calc(var(--u) * 150));height:max(90px,calc(var(--u) * 150))}
.wcard.dwide .wart svg{height:100%}
/* Réponses proposées dites par Plume */
.hasay{position:relative}
.sayit{position:absolute;top:max(4px,calc(var(--u) * 8));right:max(4px,calc(var(--u) * 8));width:max(34px,calc(var(--u) * 46));height:max(34px,calc(var(--u) * 46));border-radius:50%;background:#fff;border:2px solid #A9DFE3;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2}
.sayit svg{width:68%!important;height:68%!important}
.saying{box-shadow:0 0 0 max(4px,calc(var(--u) * 7)) rgba(255,193,69,.9);transition:box-shadow .15s}
/* Atelier des drapeaux */
.flagrow{gap:max(14px,calc(var(--u) * 30))}
.flagmodel{width:max(140px,calc(var(--u) * 230));aspect-ratio:94/64;border-radius:8px;transition:opacity .3s}
.flagmodel.big{width:min(76vw,calc(var(--u) * 460))}
.flagmodel.hidden{background:#F4EEE3}
.flagmodel.hidden svg{opacity:0}
.flagpaint{width:min(70vw,calc(var(--u) * 430));aspect-ratio:94/64}
.flagpaint rect[data-b]{cursor:pointer}
.palette{display:flex;flex-wrap:wrap;gap:max(8px,calc(var(--u) * 14));justify-content:center;max-width:min(92vw,560px)}
.swatch{width:max(40px,calc(var(--u) * 56));height:max(40px,calc(var(--u) * 56));border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #CFC3AE;cursor:pointer;padding:0;transition:transform .12s}
.swatch.big{width:max(50px,calc(var(--u) * 70));height:max(50px,calc(var(--u) * 70))}
.swatch.on{box-shadow:0 0 0 4px var(--ink);transform:scale(1.1)}
.flagcard{width:max(150px,calc(var(--u) * 250));height:auto;aspect-ratio:94/64;padding:max(6px,calc(var(--u) * 10))}
/* Dessin pas à pas, miroir */
.drawstage{gap:max(6px,calc(var(--u) * 10));padding-top:0;padding-bottom:0}
.drawwrap{display:flex;gap:var(--gap);align-items:center;justify-content:center;width:100%;flex:1;min-height:0}
.board{position:relative;width:min(calc(100vh - var(--btn) * 2 - 120px),62vw);aspect-ratio:1;background:#fff;border-radius:24px;border:3px solid var(--line);overflow:hidden;touch-action:none;flex:0 0 auto;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.board .cv,.board .ov{position:absolute;inset:0;width:100%;height:100%;display:block}
.board .cv{touch-action:none}
.board .ov{pointer-events:none}
.drawtools{display:flex;flex-direction:column;gap:12px;align-items:center;max-width:min(300px,30vw)}
.drawsay{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(17px,calc(var(--u) * 26));margin:0;text-align:center;min-height:1.3em;max-width:92vw}
.guide path{fill:none;stroke:#8C6BE0;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:.1 3.4}
.guide .target{fill:#F3EEFF;stroke:#8C6BE0;stroke-width:1.1;stroke-dasharray:1 1.4}
.startdot{fill:#34B37A;stroke:#fff;stroke-width:.8}
.demo{color:#1FA9B5}
.demo path{fill:none;stroke:#1FA9B5;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.model{transition:opacity 1.3s ease}
.model.gone{opacity:0}
.axis{stroke:#B7AEA0;stroke-width:.5;stroke-dasharray:2 2;fill:none}
.drawmini{width:max(90px,calc(var(--u) * 130));aspect-ratio:1;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px}
.pensize{display:block;border-radius:50%;background:var(--ink)}
.drawpick{display:flex;flex-wrap:wrap;gap:max(10px,calc(var(--u) * 18));justify-content:center;padding:10px 0 24px}
.thumb{display:block;width:max(80px,calc(var(--u) * 120));height:max(80px,calc(var(--u) * 120))}
.stars{color:#E0A400;font-size:16px;letter-spacing:2px;line-height:1}
.doneic{position:absolute;top:8px;left:8px;width:26px;height:26px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center}
@media (orientation:portrait){
  .drawwrap{flex-direction:column}
  .board{width:min(92vw,calc(100vh - var(--btn) * 2 - 330px))}
  .drawtools{flex-direction:row;flex-wrap:wrap;max-width:92vw;justify-content:center}
  .myflag{width:86vw}
}
/* Carnet : dessins et drapeau de mon île */
.dgrid{display:flex;flex-wrap:wrap;gap:max(8px,calc(var(--u) * 14))}
.dgrid button{width:max(96px,calc(var(--u) * 140));aspect-ratio:1;padding:0;border-radius:16px;overflow:hidden;border:3px solid var(--line);background:#fff;cursor:pointer}
.dgrid img{width:100%;height:100%;display:block;object-fit:cover}
.myflagmini{width:max(110px,calc(var(--u) * 160));aspect-ratio:94/64;border:none;background:none;padding:0;cursor:pointer}
/* Drapeau de mon île */
.myflagstage{flex-direction:row;flex-wrap:wrap;gap:max(14px,calc(var(--u) * 30))}
.myflag{width:min(44vw,calc(var(--u) * 470));aspect-ratio:94/64;cursor:pointer}
.myflagtools{display:flex;flex-direction:column;gap:8px;align-items:center;max-width:min(560px,92vw)}
.steplabel{margin:4px 0 0;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(15px,calc(var(--u) * 20));color:var(--grey);text-align:center}
.pickrow{gap:max(6px,calc(var(--u) * 10))}
.pickrow .mini{width:max(56px,calc(var(--u) * 78));aspect-ratio:94/64;border:3px solid var(--line);border-radius:10px;background:#fff;padding:3px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pickrow .mini.sym{aspect-ratio:1;width:max(46px,calc(var(--u) * 62))}
.pickrow .mini.on{border-color:var(--turq-d);box-shadow:0 0 0 3px rgba(18,115,123,.22)}
/* Histoires */
.storypic{font-size:max(84px,calc(var(--u) * 150));line-height:1}
.storyline{display:flex;flex-wrap:wrap;justify-content:center;gap:.22em;max-width:min(92vw,calc(var(--u) * 1040));margin:0;font-size:max(30px,calc(var(--u) * 58))}
.wordbtn{font:inherit;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;background:none;border:none;border-radius:10px;padding:0 .06em;cursor:pointer;color:var(--ink);line-height:1.2}
.wordbtn:active{background:#FFE0D3}
.storyline.reading .wordbtn{color:var(--turq-d)}
.storyq{font-size:max(24px,calc(var(--u) * 38));text-align:center;margin:0;max-width:90vw}
.choices.col{flex-direction:column;align-items:center}
.choicecard{font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(20px,calc(var(--u) * 30));min-width:min(80vw,calc(var(--u) * 520));min-height:max(58px,calc(var(--u) * 84))}
.round.next{background:var(--turq-d);border-color:var(--turq-d)}
.round.next svg{stroke:#fff}
.plabel{margin:14px 0 6px;font-weight:700;font-size:14px}
.herochip{display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;border-radius:12px;border:1.5px solid #D8CDB8;background:#fff;font-size:13px;cursor:pointer}
.herochip.on{border-color:var(--turq-d);background:#E1F4F5;font-weight:700}
.draft{margin-top:14px;border-top:1px solid #F0E8DA;padding-top:12px;font-size:15px;line-height:1.5}
.draft h3{margin:0 0 6px;font-size:18px}
.draft mark{background:#FFE2B8;border-radius:4px;padding:0 2px}
.draft ol,.draft ul{margin:6px 0;padding-left:22px}
`;
