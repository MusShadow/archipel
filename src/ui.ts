// Interface : petit utilitaire DOM, feuille de style, composants partagés.
import { FACES, PLUME_B, TINTS } from "./art_static";

export type Child = Node | string | number | null | undefined | false | Child[];
export function h(tag: string, props?: Record<string, any> | null, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = String(v);
      else if (k === "html") el.innerHTML = String(v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
  }
  appendChildren(el, children);
  return el;
}
function appendChildren(el: Node, children: Child[]) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
}
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------- Icônes (traits) ----------
const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3.5 11 L12 4 L20.5 11"/><path d="M5.5 9.5 V20 H10 V14.5 H14 V20 H18.5 V9.5"/>',
  ear: '<path d="M6.5 9 A5.75 5.75 0 1 1 18 9 C18 12.5 15 13.5 14.5 16 C14 18.5 12.5 20.5 10.2 20.5 C8.6 20.5 7.4 19.6 6.8 18.3"/><path d="M9.8 9.4 A2.4 2.4 0 0 1 14.6 9.4 C14.6 11 13 11.6 12.6 13"/>',
  book: '<path d="M4 5.5 C6.5 4.5 9.5 4.5 12 6 C14.5 4.5 17.5 4.5 20 5.5 V19 C17.5 18 14.5 18 12 19.5 C9.5 18 6.5 18 4 19 Z"/><path d="M12 6 V19.5"/>',
  leaf: '<path d="M5 19 C5 10 11 5 19 5 C19 13 14 19 5 19 Z"/><path d="M5 19 L13 11"/>',
  check: '<path d="M5 12.5 L10 17 L19 7.5"/>',
  lock: '<path d="M7.5 11 V8 A4.5 4.5 0 0 1 16.5 8 V11"/><rect x="5" y="11" width="14" height="10" rx="2"/>',
  sound: '<path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z"/><path d="M15.5 9 C17 10.5 17 13.5 15.5 15 M18 6.5 C21 9.5 21 14.5 18 17.5"/>',
  arrow: '<path d="M5 12 H19 M13 6 L19 12 L13 18"/>',
  back: '<path d="M19 12 H5 M11 6 L5 12 L11 18"/>',
  close: '<path d="M6 6 L18 18 M18 6 L6 18"/>',
  undo: '<path d="M9 7 L4 12 L9 17"/><path d="M4 12 H14 A6 6 0 0 1 14 24"/>',
  plus: '<path d="M12 5 V19 M5 12 H19"/>',
  trash: '<path d="M5 7 H19 M10 7 V5 H14 V7 M7 7 L8 20 H16 L17 7"/>',
};
export function icon(name: string, color = "#273043", sw = 2.2) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:58%;height:58%;fill:none;stroke:${color};stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round">${ICON_PATHS[name] ?? ""}</svg>`;
}

// ---------- Personnages ----------
export function medallion(name: string, ring = false) {
  const face = `<g transform="translate(42 42) scale(0.9) translate(-42 -42)">${FACES[name] ?? ""}</g>`;
  return `<svg viewBox="0 0 84 84" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="42" cy="42" r="41" fill="${TINTS[name] ?? "#FFF7EA"}"/>${face}${ring ? '<circle cx="42" cy="42" r="40" fill="none" stroke="#fff" stroke-width="4"/>' : ""}</svg>`;
}
export function plumeSVG() {
  return `<svg viewBox="26 40 276 222" aria-hidden="true" style="display:block;width:100%;height:100%">${PLUME_B}</svg>`;
}
export function avatarSVG(initial: string, color: string) {
  return `<svg viewBox="0 0 80 80" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="40" cy="40" r="38" fill="#FFF7EA" stroke="${color}" stroke-width="5"/>`
    + `<text x="40" y="53" text-anchor="middle" style="font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;font-size:38px;fill:#273043">${esc(initial)}</text></svg>`;
}

// ---------- Composants ----------
export function roundBtn(opts: { icon?: string; html?: string; label: string; onclick: (e: Event) => void; cls?: string; color?: string }) {
  return h("button", { type: "button", class: `round ${opts.cls ?? ""}`, "aria-label": opts.label, onclick: opts.onclick, html: opts.html ?? icon(opts.icon ?? "home", opts.color) });
}
export function dots(total: number, current: number) {
  const wrap = h("div", { class: "dots", role: "img", "aria-label": `Question ${Math.min(current + 1, total)} sur ${total}` });
  for (let i = 0; i < total; i++) wrap.appendChild(h("span", { class: i < current ? "dot done" : i === current ? "dot cur" : "dot" }));
  return wrap;
}
export function wobble(el: Element) {
  el.classList.remove("wobble");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("wobble");
}
export function glow(el: Element, on = true) { el.classList.toggle("glow", on); }
export function fly(el: HTMLElement, target: HTMLElement, ms = 450): Promise<void> {
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  if (!el.animate) return Promise.resolve();
  const anim = el.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx}px,${dy}px) scale(0.6)` }], { duration: ms, easing: "cubic-bezier(.3,.7,.3,1)" });
  return new Promise((r) => { anim.onfinish = () => r(); anim.oncancel = () => r(); });
}
export function burst(host: HTMLElement) {
  const colors = ["#FFC145", "#1FA9B5", "#E85D9A", "#3D8BEA", "#34B37A"];
  const layer = h("div", { class: "burst", "aria-hidden": "true" });
  for (let i = 0; i < 14; i++) {
    const s = h("span", { style: `background:${colors[i % colors.length]};--a:${(i * 360) / 14}deg;--d:${80 + (i % 3) * 30}px` });
    layer.appendChild(s);
  }
  host.appendChild(layer);
  setTimeout(() => layer.remove(), 900);
}

export const CSS = `
:root{--cream:#FFF7EA;--ink:#273043;--grey:#5B6475;--line:#E4D9C5;--turq:#1FA9B5;--turq-d:#12737B;--blue:#3D8BEA;--blue-d:#2F6FC0;--coral:#FF7F50;--green:#34B37A;--violet:#8C6BE0;--yellow:#FFC145;--pink:#E85D9A;--sea:#BFE8EE;
--u:min(calc(100vw / 1180),calc(100vh / 820));--btn:max(58px,calc(var(--u) * 86));--gap:max(10px,calc(var(--u) * 24))}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:var(--cream);color:var(--ink);font-family:Inter,system-ui,-apple-system,sans-serif;overscroll-behavior:none;touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
button{font:inherit;color:inherit}
#app{position:fixed;inset:0;overflow:hidden}
.screen{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--cream)}
.title{font-family:'Baloo 2',ui-rounded,'Avenir Next',system-ui,sans-serif;font-weight:800;line-height:1.05}
.reading{font-family:Andika,'Avenir Next',ui-rounded,system-ui,sans-serif}
.round{width:var(--btn);height:var(--btn);flex:0 0 auto;border-radius:50%;border:3px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;transition:transform .12s}
.round:active{transform:scale(.93)}
.round.plume{width:calc(var(--btn) * 1.2);height:calc(var(--btn) * 1.2);background:#D5F1F3;border-color:#A9DFE3;overflow:hidden}
.round.small{width:max(44px,calc(var(--u) * 52));height:max(44px,calc(var(--u) * 52));border-width:2px;opacity:.75}
.top{display:flex;align-items:center;justify-content:space-between;gap:var(--gap);padding:max(10px,calc(var(--u) * 22)) max(12px,calc(var(--u) * 28)) 0}
.bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--gap);padding:0 max(12px,calc(var(--u) * 28)) max(10px,calc(var(--u) * 22))}
.stage{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:max(10px,calc(var(--u) * 26));padding:max(6px,calc(var(--u) * 10)) max(12px,calc(var(--u) * 40))}
.dots{display:flex;gap:max(8px,calc(var(--u) * 12));align-items:center}
.dot{width:max(12px,calc(var(--u) * 18));height:max(12px,calc(var(--u) * 18));border-radius:50%;background:var(--line)}
.dot.done{background:var(--turq)}
.dot.cur{background:#fff;border:max(3px,calc(var(--u) * 4)) solid var(--turq)}
.tip{flex:1;max-width:900px;display:flex;align-items:center;gap:10px;padding:max(8px,calc(var(--u) * 12)) max(12px,calc(var(--u) * 18));border-radius:14px;background:#fff;border:1px solid #D8CDB8;font-size:max(12px,calc(var(--u) * 15));line-height:1.4}
.tip b{font-weight:700}
.tip .ic{width:max(18px,calc(var(--u) * 22));height:max(18px,calc(var(--u) * 22));flex:0 0 auto}
.card{border:max(2px,calc(var(--u) * 3)) solid var(--line);background:#fff;border-radius:max(14px,calc(var(--u) * 22));display:flex;align-items:center;justify-content:center;padding:max(8px,calc(var(--u) * 14));cursor:pointer;transition:transform .12s,border-color .2s}
.card:active{transform:scale(.97)}
.card.right{border-color:var(--green);box-shadow:0 0 0 max(4px,calc(var(--u) * 6)) rgba(52,179,122,.25)}
.choices{display:flex;flex-wrap:wrap;justify-content:center;gap:max(10px,calc(var(--u) * 24));width:100%}
.flagcard{width:min(24vw,calc(var(--u) * 250));height:min(17vw,calc(var(--u) * 180))}
.word{font-size:max(44px,calc(var(--u) * 104));line-height:1;display:flex;gap:max(4px,calc(var(--u) * 8))}
.syl{display:inline-block;padding:0 max(4px,calc(var(--u) * 8)) max(6px,calc(var(--u) * 12));border-bottom:max(3px,calc(var(--u) * 5)) solid #9AA3B5;border-radius:0 0 48px 48px / 0 0 26px 26px}
.syl.b{color:var(--blue-d)}
.panel{background:#fff;border:2px solid var(--line);border-radius:max(16px,calc(var(--u) * 28));padding:max(10px,calc(var(--u) * 22)) max(14px,calc(var(--u) * 36));display:flex;align-items:center;justify-content:center}
.tile{min-width:max(60px,calc(var(--u) * 104));height:max(56px,calc(var(--u) * 96));padding:0 max(8px,calc(var(--u) * 14));border-radius:max(12px,calc(var(--u) * 18));border:max(2px,calc(var(--u) * 3)) solid var(--line);background:#fff;font-size:max(30px,calc(var(--u) * 56));display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .12s}
.tile:active{transform:scale(.95)}
.tile.used{visibility:hidden}
.slot{min-width:max(60px,calc(var(--u) * 104));height:max(56px,calc(var(--u) * 96));border-radius:max(12px,calc(var(--u) * 18));border:max(2px,calc(var(--u) * 3)) dashed #B9AE9A;background:rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center}
.row{display:flex;gap:max(8px,calc(var(--u) * 16));align-items:center;justify-content:center;flex-wrap:wrap}
.speak{width:max(64px,calc(var(--u) * 110));height:max(64px,calc(var(--u) * 110));border-radius:50%;border:max(2px,calc(var(--u) * 3)) solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.ok{background:var(--turq-d)!important;border-color:var(--turq-d)!important}
.wobble{animation:wobble .45s ease}
@keyframes wobble{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
.pop{animation:pop .35s ease-out}
@keyframes pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
.glow{animation:glow 1s ease-in-out infinite}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(255,193,69,.0)}50%{box-shadow:0 0 0 max(6px,calc(var(--u) * 10)) rgba(255,193,69,.75)}}
.burst{position:absolute;left:50%;top:45%;width:0;height:0;pointer-events:none;z-index:50}
.burst span{position:absolute;width:12px;height:12px;border-radius:50%;animation:burst .85s ease-out forwards}
@keyframes burst{0%{transform:rotate(var(--a)) translateY(0) scale(1);opacity:1}100%{transform:rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(.4);opacity:0}}
.overlay{position:absolute;inset:0;background:rgba(39,48,67,.45);display:flex;align-items:center;justify-content:center;z-index:40}
.sheet{background:var(--cream);border-radius:24px;padding:max(16px,calc(var(--u) * 32));max-width:min(92vw,720px);max-height:90vh;overflow:auto;display:flex;flex-direction:column;gap:16px;align-items:center;text-align:center}
.bigbtn{min-height:max(52px,calc(var(--u) * 72));padding:0 max(18px,calc(var(--u) * 30));border-radius:999px;border:none;background:var(--turq-d);color:#fff;font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:max(18px,calc(var(--u) * 26));display:inline-flex;align-items:center;gap:10px;cursor:pointer}
.bigbtn.alt{background:#fff;color:var(--ink);border:3px solid var(--line)}
.parent{font-family:Inter,system-ui,sans-serif;background:#FBF8F2;-webkit-user-select:text;user-select:text}
.parent h1{font-size:24px;margin:0}
.parent h2{font-size:16px;margin:0 0 10px}
.parent p{margin:0}
.p-wrap{flex:1;overflow:auto;padding:20px 24px 32px;display:flex;flex-direction:column;gap:16px}
.p-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:14px 24px 0;align-items:center}
.p-tab{padding:10px 14px;border-radius:12px;border:1px solid transparent;background:transparent;font-weight:600;font-size:15px;cursor:pointer;color:#3B4558}
.p-tab.on{background:#fff;border-color:#E1D6C3;color:var(--ink)}
.p-card{background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:16px 18px}
.p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:12.5px;font-weight:600;white-space:nowrap}
.skillrow{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid #F0E8DA;font-size:14px}
.skillrow:first-of-type{border-top:none}
.muted{color:#5B6475;font-size:13.5px;line-height:1.45}
.field{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600;text-align:left}
.field input,.field select,.field textarea{font:inherit;font-weight:400;padding:10px 12px;border-radius:10px;border:1px solid #D8CDB8;background:#fff;-webkit-user-select:text;user-select:text}
.opts{display:flex;flex-wrap:wrap;gap:8px}
.opt{padding:9px 12px;border-radius:10px;border:1px solid #D8CDB8;background:#fff;font-size:14px;cursor:pointer}
.opt.on{border-color:var(--turq-d);background:#E1F4F5;font-weight:600}
.pbtn{padding:10px 14px;border-radius:10px;border:none;background:var(--turq-d);color:#fff;font-weight:600;font-size:14.5px;cursor:pointer}
.pbtn.ghost{background:#fff;color:var(--turq-d);border:1.5px solid var(--turq-d)}
.pbtn.danger{background:#fff;color:#B42318;border:1.5px solid #B42318}
.pin{display:grid;grid-template-columns:repeat(3,max(64px,calc(var(--u) * 84)));gap:12px;justify-content:center}
.pin button{height:max(56px,calc(var(--u) * 72));border-radius:16px;border:2px solid var(--line);background:#fff;font-size:24px;font-weight:700;cursor:pointer}
.pin-dots{display:flex;gap:14px;justify-content:center}
.pin-dots span{width:16px;height:16px;border-radius:50%;border:2px solid var(--ink)}
.pin-dots span.f{background:var(--ink)}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
`;
