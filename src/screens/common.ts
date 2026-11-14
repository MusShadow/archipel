// Éléments partagés : feuilles de confirmation, appui long, pavé du code parent.
import { app } from "../app";
import { sfx } from "../services";
import { h, wobble } from "../ui";

// Feuille posée au-dessus de l'écran courant. Renvoie de quoi la fermer.
export function sheet(host: HTMLElement, ...content: (HTMLElement | string)[]) {
  const ov = h("div", { class: "overlay" }, h("div", { class: "sheet pop" }, ...content));
  host.appendChild(ov);
  return { el: ov, close: () => ov.remove() };
}

// Appui long (adulte) : la bague se remplit pendant l'appui ; relâcher trop tôt annule.
export function longPress(el: HTMLElement, ms: number, onDone: () => void) {
  let t0 = 0, raf = 0;
  const stop = () => { cancelAnimationFrame(raf); t0 = 0; el.style.setProperty("--p", "0"); };
  const tick = () => {
    if (!t0) return;
    const p = Math.min(1, (performance.now() - t0) / ms);
    el.style.setProperty("--p", p.toFixed(3));
    if (p >= 1) { stop(); onDone(); return; }
    raf = requestAnimationFrame(tick);
  };
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(tick); });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) el.addEventListener(ev, stop);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  // Clavier : Entrée maintenue n'existe pas, on accepte un double appui rapide sur Entrée.
  let lastKey = 0;
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastKey < 600) onDone();
    lastKey = now;
  });
}

// Pavé numérique à 4 chiffres. check() renvoie true si le code est accepté.
export function pinPad(opts: { title: string; subtitle?: string; check: (pin: string) => boolean; onCancel?: () => void }) {
  let pin = "";
  const dotsEl = h("div", { class: "pin-dots", "aria-live": "polite" });
  const sub = h("p", { class: "muted", style: "margin:0;text-align:center" }, opts.subtitle ?? "");
  const wrap = h("div", { class: "pin-wrap parent" });
  const draw = () => { dotsEl.replaceChildren(...[0, 1, 2, 3].map((i) => h("span", { class: i < pin.length ? "f" : "" }))); dotsEl.setAttribute("aria-label", `${pin.length} chiffres saisis sur 4`); };
  const press = (d: string) => {
    if (pin.length >= 4) return;
    sfx.tap();
    pin += d; draw();
    if (pin.length === 4) {
      const ok = opts.check(pin);
      if (!ok) { setTimeout(() => { pin = ""; draw(); wobble(wrap); }, 180); }
    }
  };
  const pad = h("div", { class: "pin" });
  for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) pad.appendChild(h("button", { type: "button", onclick: () => press(d) }, d));
  pad.appendChild(h("button", { type: "button", "aria-label": "Annuler", style: "font-size:15px;font-weight:600", onclick: () => opts.onCancel?.() }, "Annuler"));
  pad.appendChild(h("button", { type: "button", onclick: () => press("0") }, "0"));
  pad.appendChild(h("button", { type: "button", "aria-label": "Effacer", onclick: () => { pin = pin.slice(0, -1); draw(); } }, "⌫"));
  wrap.append(h("h1", { style: "font-size:22px;margin:0;font-family:Inter,system-ui,sans-serif" }, opts.title), sub, dotsEl, pad);
  draw();
  return { el: wrap, setSubtitle: (t: string) => { sub.textContent = t; }, reset: () => { pin = ""; draw(); } };
}

// Barrière parent : demande le code avant d'ouvrir quelque chose de réservé aux adultes.
export function parentGate(host: HTMLElement, onOK: () => void, title = "Espace parent") {
  if (!app.data.pin) { onOK(); return; }
  let s: { close: () => void } | null = null;
  const pad = pinPad({
    title, subtitle: "Entrez votre code à 4 chiffres.",
    check: (pin) => { if (pin === app.data.pin) { s?.close(); onOK(); return true; } pad.setSubtitle("Ce n'est pas le bon code. Réessayez."); return false; },
    onCancel: () => s?.close(),
  });
  s = sheet(host, pad.el);
}
