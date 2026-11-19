// Port des Voyages — « Invente le drapeau de ton île » : une forme, des couleurs, un symbole.
import { COL, COL_ORDER, type Col } from "../activities/atelierdrapeaux";
import { app } from "../app";
import { sfx, speech, type MyFlag } from "../services";
import { burst, h, medallion, roundBtn, sleep } from "../ui";
import { habillerEcran } from "../host";
import { ruban } from "../design/composants";

export const LAYOUTS: { id: string; nom: string; parts: number }[] = [
  { id: "v3", nom: "trois bandes debout", parts: 3 },
  { id: "h3", nom: "trois bandes couchées", parts: 3 },
  { id: "h2", nom: "deux bandes", parts: 2 },
  { id: "croix", nom: "une croix", parts: 2 },
  { id: "diag", nom: "deux triangles", parts: 2 },
  { id: "cadre", nom: "un cadre", parts: 2 },
];
export const SYMBOLS: { id: string; nom: string; d: string }[] = [
  { id: "aucun", nom: "pas de symbole", d: "" },
  { id: "etoile", nom: "une étoile", d: "M45 15 L49.4 25.9 L61 26.6 L52 34 L55 45.3 L45 39 L35 45.3 L38 34 L29 26.6 L40.6 25.9 Z" },
  { id: "coeur", nom: "un cœur", d: "M45 44 C30 35 27 24 35 20 C40 18 44 21 45 25 C46 21 50 18 55 20 C63 24 60 35 45 44 Z" },
  { id: "soleil", nom: "un soleil", d: "M45 22 A8 8 0 1 1 44.9 22 Z M45 13 L45 18 M45 42 L45 47 M28 30 L33 30 M57 30 L62 30 M33 18 L36.5 21.5 M57 18 L53.5 21.5 M33 42 L36.5 38.5 M57 42 L53.5 38.5" },
  { id: "lune", nom: "une lune", d: "M50 16 A14 14 0 1 0 58 40 A11 11 0 1 1 50 16 Z" },
  { id: "rond", nom: "un rond", d: "M45 18 A12 12 0 1 1 44.9 18 Z" },
  { id: "poisson", nom: "un poisson", d: "M30 30 Q40 19 52 30 Q40 41 30 30 Z M52 30 L61 23 L61 37 Z" },
];

export function myFlagSVG(f: MyFlag | { layout: string; colors: (string | null)[]; symbol: string; symbolColor: string | null }, interactive = false): string {
  const c = (i: number) => { const v = f.colors[i] as Col | null; return v ? COL[v] ?? v : "url(#mfhatch)"; };
  const part = (i: number, shape: string) => shape.replace(/^<(\w+)/, `<$1 data-p="${i}" fill="${c(i)}"${interactive ? ' role="button"' : ""}`);
  let body = "";
  switch (f.layout) {
    case "h3": body = [0, 1, 2].map((i) => part(i, `<rect x="0" y="${i * 20}" width="90" height="20.3"/>`)).join(""); break;
    case "h2": body = [0, 1].map((i) => part(i, `<rect x="0" y="${i * 30}" width="90" height="30.3"/>`)).join(""); break;
    case "croix": body = part(0, `<rect x="0" y="0" width="90" height="60"/>`) + part(1, `<path d="M24 0 H36 V24 H90 V36 H36 V60 H24 V36 H0 V24 H24 Z"/>`); break;
    case "diag": body = part(0, `<path d="M0 0 H90 L0 60 Z"/>`) + part(1, `<path d="M90 0 V60 H0 Z"/>`); break;
    case "cadre": body = part(0, `<rect x="0" y="0" width="90" height="60"/>`) + part(1, `<rect x="9" y="9" width="72" height="42"/>`); break;
    default: body = [0, 1, 2].map((i) => part(i, `<rect x="${i * 30}" y="0" width="30.3" height="60"/>`)).join("");
  }
  const sym = SYMBOLS.find((s) => s.id === f.symbol);
  const symColor = f.symbolColor ? COL[f.symbolColor as Col] ?? f.symbolColor : "#FFFFFF";
  const symSVG = sym && sym.d ? `<path data-p="s" d="${sym.d}" fill="${symColor}" stroke="${f.symbol === "soleil" ? symColor : "#273043"}" stroke-width="${f.symbol === "soleil" ? 3 : 1.2}" stroke-linecap="round" stroke-linejoin="round"${interactive ? ' role="button"' : ""}/>` : "";
  return `<svg viewBox="-2 -2 94 64" aria-hidden="true" style="display:block;width:100%;height:100%"><defs><pattern id="mfhatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#F4EEE3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#E0D5C2" stroke-width="2"/></pattern></defs>${body}${symSVG}<rect x="0" y="0" width="90" height="60" fill="none" stroke="#273043" stroke-width="1.6" rx="1.5"/></svg>`;
}

export function myFlagScreen(back: () => void) {
  const p = app.profile!;
  const t0 = Date.now();
  const cur = p.myFlag ? { ...p.myFlag, colors: p.myFlag.colors.slice() as (string | null)[], symbolColor: p.myFlag.symbolColor as string | null } : { layout: "v3", colors: [null, null, null] as (string | null)[], symbol: "aucun", symbolColor: null as string | null };
  let pen: Col | null = null;
  const preview = h("div", { class: "myflag" });
  const draw = () => { preview.innerHTML = myFlagSVG(cur, true); };
  preview.addEventListener("click", (e) => {
    const t = (e.target as Element).closest("[data-p]");
    if (!t) return;
    if (!pen) { speech.say("Choisis d'abord une couleur."); return; }
    const k = t.getAttribute("data-p")!;
    if (k === "s") cur.symbolColor = pen; else cur.colors[Number(k)] = pen;
    sfx.tap(); draw();
  });
  const layouts = h("div", { class: "row pickrow" });
  for (const l of LAYOUTS) {
    const b = h("button", { type: "button", class: `mini${cur.layout === l.id ? " on" : ""}`, "data-layout": l.id, "aria-label": l.nom, html: myFlagSVG({ layout: l.id, colors: ["bleu", "jaune", "rouge"], symbol: "aucun", symbolColor: null }) });
    b.addEventListener("click", () => {
      sfx.tap(); speech.say(l.nom);
      cur.layout = l.id;
      cur.colors = Array.from({ length: l.parts }, (_, i) => cur.colors[i] ?? null);
      layouts.querySelectorAll(".mini").forEach((x) => x.classList.toggle("on", x === b));
      draw();
    });
    layouts.appendChild(b);
  }
  const palette = h("div", { class: "palette" });
  for (const c of COL_ORDER) {
    const b = h("button", { type: "button", class: "swatch", "data-c": c, style: `background:${COL[c]}`, "aria-label": c });
    b.addEventListener("click", () => { pen = c; sfx.tap(); speech.say(c); palette.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x === b)); });
    palette.appendChild(b);
  }
  const symbols = h("div", { class: "row pickrow" });
  for (const s of SYMBOLS) {
    const b = h("button", { type: "button", class: `mini sym${cur.symbol === s.id ? " on" : ""}`, "data-sym": s.id, "aria-label": s.nom, html: s.d ? `<svg viewBox="22 10 46 40" style="display:block;width:100%;height:100%"><path d="${s.d}" fill="#FFC145" stroke="${s.id === "soleil" ? "#FFC145" : "#273043"}" stroke-width="${s.id === "soleil" ? 3 : 1.4}" stroke-linecap="round"/></svg>` : `<span class="title" style="font-size:22px;color:#5B6475">∅</span>` });
    b.addEventListener("click", () => {
      sfx.tap(); speech.say(s.nom);
      cur.symbol = s.id;
      if (s.d && !cur.symbolColor) cur.symbolColor = pen ?? "jaune";
      symbols.querySelectorAll(".mini").forEach((x) => x.classList.toggle("on", x === b));
      draw();
    });
    symbols.appendChild(b);
  }
  const save = h("button", { type: "button", class: "bigbtn", "data-save": "1" }, "C'est mon drapeau !");
  save.addEventListener("click", async () => {
    p.myFlag = { layout: cur.layout, colors: cur.colors.map((c) => c ?? "blanc"), symbol: cur.symbol, symbolColor: cur.symbolColor ?? "blanc" };
    app.save();
    cur.colors = p.myFlag.colors.slice();
    draw();
    sfx.sticker(); burst(screen);
    await speech.say(`Voici le drapeau de l'île de ${p.name} ! Il est dans ton carnet.`);
    await sleep(300);
    leave();
  });
  const screen = habillerEcran(h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => leave() }),
      ruban({ texte: "Le drapeau de mon île", ile: "port" }),
      h("span", { style: "width:var(--btn);height:var(--btn);display:block", html: medallion("plume") })),
    h("div", { class: "stage myflagstage" },
      preview,
      h("div", { class: "myflagtools" },
        h("p", { class: "steplabel" }, "1. La forme"), layouts,
        h("p", { class: "steplabel" }, "2. Les couleurs : choisis, puis touche ton drapeau"), palette,
        h("p", { class: "steplabel" }, "3. Le symbole"), symbols,
        save))), "port");
  let alive = true;
  function leave() { if (!alive) return; alive = false; app.addMinutes("voyages", Date.now() - t0, "atelierdrapeaux"); back(); }
  draw();
  app.show(screen, () => { if (alive) { alive = false; app.addMinutes("voyages", Date.now() - t0, "atelierdrapeaux"); } });
  speech.say(p.myFlag ? "Tu veux changer le drapeau de ton île ?" : "Invente le drapeau de ton île ! Choisis une forme, des couleurs, et un symbole.");
}
