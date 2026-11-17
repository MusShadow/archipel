// Île des Nombres — « Les nénuphars » : la grenouille saute sur la ligne des nombres de 0 à 10.
// Repérer un nombre, trouver celui qui manque, avancer, reculer, puis sauter de 2 en 2.
import type { ActivityModule, Item, View } from "../host";
import { sfx } from "../services";
import { glow, h, sleep } from "../ui";

type Kind = "repere" | "manque" | "plus" | "moins" | "bonds";
interface PadItem extends Item { kind: Kind; start: number; steps: number; stride: number; target: number; hidden?: number; choices: number[] }

const MAX = 10;
export const FROG = `<svg viewBox="0 0 100 86" aria-hidden="true" style="display:block;width:100%;height:100%"><ellipse cx="50" cy="56" rx="38" ry="26" fill="#34B37A"/><ellipse cx="50" cy="64" rx="24" ry="15" fill="#B9EBC9"/><circle cx="30" cy="28" r="15" fill="#34B37A"/><circle cx="70" cy="28" r="15" fill="#34B37A"/><circle cx="30" cy="26" r="10" fill="#fff"/><circle cx="70" cy="26" r="10" fill="#fff"/><circle cx="32" cy="27" r="5" fill="#273043"/><circle cx="68" cy="27" r="5" fill="#273043"/><path d="M36 52 Q50 62 64 52" fill="none" stroke="#1E7A50" stroke-width="4" stroke-linecap="round"/><ellipse cx="22" cy="80" rx="12" ry="5" fill="#2A9A66"/><ellipse cx="78" cy="80" rx="12" ry="5" fill="#2A9A66"/></svg>`;
const PAD = `<svg viewBox="0 0 100 60" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"><path d="M50 30 L92 22 A44 26 0 1 1 86 14 Z" fill="#7BC67E"/><path d="M50 30 L20 38 M50 30 L30 18 M50 30 L64 50" stroke="#5BAE60" stroke-width="2"/></svg>`;
const bonds = (n: number) => `${n} bond${n > 1 ? "s" : ""}`;

export const nenuphars: ActivityModule<PadItem> = {
  id: "nenuphars", title: "Les nénuphars", domain: "nombres", island: "nombres", host: "basile",
  maxLevel: 5, items: 6,
  skills: ["NUM.LIGNE.REPERE", "NUM.LIGNE.ORDRE", "NUM.LIGNE.PLUS", "NUM.LIGNE.MOINS", "NUM.LIGNE.BONDS"],
  card: `<span style="display:block;width:1.15em;height:1em">${FROG}</span>`, pitch: "Les nénuphars, pour faire sauter la grenouille sur les nombres.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.start}:${it.steps}:${it.stride}:${it.target}`,

  generate(level, ctx) {
    const r = ctx.rng;
    const kind: Kind = level <= 1 ? "repere" : level === 2 ? (r.next() < 0.6 ? "manque" : "repere")
      : level === 3 ? "plus" : level === 4 ? (r.next() < 0.6 ? "moins" : "plus") : (r.next() < 0.6 ? "bonds" : "moins");
    if (kind === "repere") {
      const target = r.int(1, MAX);
      let start = r.int(0, MAX); if (start === target) start = 0;
      return { kind, start, steps: 0, stride: 1, target, choices: [], skill: "NUM.LIGNE.REPERE", difficulty: target > 5 ? -0.2 : -0.5, form: "image", guess: 1 / 11, level, prompt: `Fais sauter la grenouille sur le ${target}.` };
    }
    if (kind === "manque") {
      const hidden = r.int(1, MAX - 1);
      const near = r.shuffle([hidden - 1, hidden + 1, hidden + 2, hidden - 2].filter((x) => x >= 0 && x <= MAX)).slice(0, 2);
      return { kind, start: 0, steps: 0, stride: 1, target: hidden, hidden, choices: r.shuffle([hidden, ...near]), skill: "NUM.LIGNE.ORDRE", difficulty: 0.1, form: "symbole", guess: 1 / 3, level, prompt: "Un nombre se cache sous le point d'interrogation. Lequel ?" };
    }
    if (kind === "plus") {
      const steps = r.int(1, level >= 4 ? 4 : 3), start = r.int(0, MAX - steps);
      return { kind, start, steps, stride: 1, target: start + steps, choices: [], skill: "NUM.LIGNE.PLUS", difficulty: 0.4 + 0.1 * steps, form: "image", guess: 1 / 11, level, prompt: `La grenouille est sur le ${start}. Elle fait ${bonds(steps)} en avant. Touche le nénuphar où elle arrive.` };
    }
    if (kind === "moins") {
      const steps = r.int(1, 3), start = r.int(steps + 1, MAX);
      return { kind, start, steps, stride: 1, target: start - steps, choices: [], skill: "NUM.LIGNE.MOINS", difficulty: 0.7 + 0.1 * steps, form: "image", guess: 1 / 11, level, prompt: `La grenouille est sur le ${start}. Elle fait ${bonds(steps)} en arrière. Touche le nénuphar où elle arrive.` };
    }
    const steps = r.int(2, 4), start = r.next() < 0.7 ? 0 : 1;
    const target = Math.min(MAX, start + 2 * steps);
    const n = (target - start) / 2;
    return { kind, start, steps: n, stride: 2, target, choices: [], skill: "NUM.LIGNE.BONDS", difficulty: 1.3 + (start ? 0.3 : 0), form: "image", guess: 1 / 11, level, prompt: `La grenouille saute de 2 en 2, en partant du ${start}. Où arrive-t-elle après ${bonds(n)} ?` };
  },

  render(item, view) {
    const pond = h("div", { class: "pond" });
    const pads: HTMLElement[] = [];
    for (let n = 0; n <= MAX; n++) {
      const hiddenHere = item.hidden === n;
      const pad = h("button", { type: "button", class: "pad", "data-n": n, "aria-label": hiddenHere ? "Nombre caché" : String(n), html: `${PAD}<span class="padnum">${hiddenHere ? "?" : n}</span>` });
      if (item.kind === "manque") (pad as HTMLButtonElement).disabled = true;
      pads.push(pad);
      pond.appendChild(pad);
    }
    const frog = h("div", { class: "frog", html: FROG });
    pond.appendChild(frog);
    view.stage.appendChild(pond);
    let at = item.start, busy = false;
    const place = (n: number) => {
      const p = pads[n];
      frog.style.transform = `translate(${p.offsetLeft + p.offsetWidth / 2 - frog.offsetWidth / 2}px, ${p.offsetTop - frog.offsetHeight * 0.9}px)`;
    };
    requestAnimationFrame(() => { place(at); frog.classList.add("ready"); });
    // L'iPad tourne : on replace la grenouille ; l'écouteur se retire quand l'exercice a disparu.
    const onResize = () => { if (!pond.isConnected) { window.removeEventListener("resize", onResize); return; } place(at); };
    window.addEventListener("resize", onResize);
    const hopTo = async (n: number) => {
      const dir = n > at ? 1 : -1;
      const stride = item.kind === "bonds" && (n - at) % 2 === 0 ? 2 : 1;
      while (at !== n) {
        at += dir * Math.min(stride, Math.abs(n - at));
        place(at); sfx.hop();
        frog.classList.remove("hop"); void frog.offsetWidth; frog.classList.add("hop");
        await sleep(item.kind === "repere" ? 120 : 260);
      }
    };
    if (item.kind === "manque") {
      const row = h("div", { class: "choices" });
      for (const c of item.choices) {
        const b = h("button", { type: "button", class: "card numcard", "data-c": c, "aria-label": String(c) }, h("span", { class: "title" }, String(c)));
        b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : `${c} ? Regarde le nombre juste avant le point d'interrogation.`));
        row.appendChild(b);
      }
      view.stage.appendChild(row);
      return;
    }
    pads.forEach((pad, n) => pad.addEventListener("click", async () => {
      if (busy || n === at) return;
      busy = true;
      const from = at;
      await hopTo(n);
      const ok = n === item.target;
      view.answer(ok, pad, ok ? undefined : `La grenouille est sur le ${n}. On cherchait un autre nénuphar.`);
      if (!ok) { await sleep(700); at = from; place(at); }
      busy = false;
    }));
  },

  hint(item, step, view) {
    const pad = (n: number) => view.stage.querySelector<HTMLElement>(`.pad[data-n="${n}"]`);
    if (step === 1) return item.prompt;
    if (item.kind === "repere") {
      if (step === 2) return `Cherche le ${item.target} : compte depuis le 0, en montrant chaque nénuphar.`;
      if (step === 3) { const p = pad(item.target - 1); if (p) glow(p); return `Le ${item.target}, c'est juste après le ${item.target - 1}.`; }
      const p = pad(item.target); if (p) glow(p); return `C'est le nénuphar qui brille.`;
    }
    if (item.kind === "manque") {
      const hi = item.hidden!;
      if (step === 2) return `Lis les nombres juste avant et juste après : ${hi - 1}… ? … ${hi + 1}.`;
      if (step === 3) return `Qu'est-ce qui vient après ${hi - 1} ?`;
      const c = view.stage.querySelector<HTMLElement>(`[data-c="${item.target}"]`); if (c) glow(c);
      return `C'est ${item.target}.`;
    }
    const path: number[] = [];
    const dir = item.kind === "moins" ? -1 : 1;
    for (let i = 1; i <= item.steps; i++) path.push(item.start + dir * i * item.stride);
    if (step === 2) return item.kind === "bonds" ? `De 2 en 2 : ${[item.start, ...path.slice(0, 2)].join(", ")}…` : `Compte les bonds avec ton doigt : ${Array.from({ length: item.steps }, (_, i) => ["un", "deux", "trois", "quatre"][i]).join(", ")}.`;
    if (step === 3) { path.slice(0, -1).forEach((n) => { const p = pad(n); if (p) glow(p); }); return "Les nénuphars qui brillent sont les premiers bonds. Encore un !"; }
    const p = pad(item.target); if (p) glow(p);
    return `La grenouille arrive sur le ${item.target}.`;
  },

  success(item) {
    if (item.kind === "repere") return `Oui, le ${item.target} !`;
    if (item.kind === "manque") return `Oui, c'est ${item.target} !`;
    if (item.kind === "plus") return `Oui ! ${item.start} et encore ${bonds(item.steps)}, ça fait ${item.target}.`;
    if (item.kind === "moins") return `Oui ! ${item.start}, puis ${bonds(item.steps)} en arrière : ${item.target}.`;
    const seq = Array.from({ length: item.steps + 1 }, (_, i) => item.start + 2 * i);
    return `Oui ! ${seq.join(", ")} : la grenouille arrive sur le ${item.target}.`;
  },

  sticker(summary) {
    const reason = summary.firstTry >= summary.items - 1 ? "Celle-ci, c'est pour tous les sauts bien comptés." : "Celle-ci, c'est parce que tu as recompté jusqu'à trouver.";
    return { kind: "grenouille", reason, svg: frogStickerSVG() };
  },

  tip(item) {
    if (item.kind === "repere") return "demandez-lui de compter à voix haute en montrant chaque nénuphar.";
    if (item.kind === "manque") return "récitez ensemble la suite des nombres jusqu'au point d'interrogation.";
    if (item.kind === "bonds") return "comptez de 2 en 2 en chuchotant le nombre sauté : 0, (1), 2, (3), 4…";
    return "comptez les bonds sur vos doigts, sans recompter depuis le début : « 3… 4, 5 ».";
  },
};

export const frogStickerSVG = () => `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#D5F0E1"/><g transform="translate(14 16) scale(0.42)">${FROG.replace('style="display:block;width:100%;height:100%"', 'width="100" height="86"')}</g></svg>`;
