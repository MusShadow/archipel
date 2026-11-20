// Île des Nombres — « Le marché de Basile » : quantités, compléments à 10, dizaines et unités.
import type { ActivityModule, Item, View } from "../host";
import { imageImagier } from "../imagier";
import { urlImage } from "../images";
import { ELEMENTS } from "../illustrations";
import { imgImagier } from "../lexique";
import { glow, h, icon } from "../ui";
import { emojiStickerSVG } from "./chants";

type Kind = "voir" | "donner" | "complement" | "dizaines" | "preparer";
interface MarketItem extends Item { kind: Kind; n: number; have?: number; tens?: number; units?: number; choices?: number[] }

// Livraison 4 : les objets du marché sont dessinés (atelier : scripts/illustration/jeux.py), comme les nénuphars.
// La pomme est celle de l'imagier ; le sac de dix est en toile de jute, l'appli écrit « 10 » sur son étiquette.
const POMME = imgImagier(imageImagier("🍎")!.fichier);
const dessin = (nom: string) => urlImage(`illustrations/${ELEMENTS[nom].fichier}`);
const pc = (f: number) => `${Math.round(f * 10000) / 100}%`;
function sacHTML() {
  const [ex, ey] = ELEMENTS["activites/sac-10"].points?.etiquette ?? [0.5, 0.69];
  return `<span class="sac10" aria-hidden="true"><img src="${dessin("activites/sac-10")}" alt="" draggable="false"><b style="left:${pc(ex)};top:${pc(ey)}">10</b></span>`;
}
// Où poser les pommes dans la corbeille ronde : le milieu du fond, et jusqu'où l'on peut s'en écarter (fractions de l'image).
function fondCorbeille() {
  const e = ELEMENTS["activites/corbeille"];
  const [cx, cy] = e.points?.centre ?? [0.5, 0.41];
  return { cx, cy, dx: 0.3, dy: 0.25 };
}
// Dispositions de dé pour voir sans compter.
const DICE: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]],
};

function appleEl(size: string) { return h("span", { class: "pomme", style: `display:block;width:${size};height:${size}`, html: POMME }); }
function numberChoice(n: number, onclick: (el: HTMLElement) => void) {
  const b = h("button", { type: "button", class: "card", "data-n": n, "aria-label": String(n), style: "width:max(76px,calc(var(--u) * 130));height:max(76px,calc(var(--u) * 130))" },
    h("span", { class: "title", style: "font-size:max(36px,calc(var(--u) * 64))" }, String(n)));
  b.addEventListener("click", () => onclick(b));
  return b;
}
function checkButton(onclick: (el: HTMLElement) => void) {
  const b = h("button", { type: "button", class: "round ok", "aria-label": "C'est prêt", html: icon("check", "#fff", 3) });
  b.addEventListener("click", () => onclick(b));
  return b;
}
// le compteur est écrit à la craie sur une petite ardoise
const counter = (n: number) => h("div", { class: "ardoise-compteur", style: `background-image:url("${dessin("activites/ardoise")}")`, "aria-live": "polite" }, String(n));

// Panier : on touche une pomme du tas pour la mettre dans le panier, une pomme du panier pour la reprendre.
function basketBuilder(view: View, opts: { target: number; withBags: boolean; onCheck: (count: number, el: HTMLElement) => void }) {
  let apples = 0, bags = 0;
  const appleSize = "max(30px,calc(var(--u) * 54))";
  // le grand panier d'osier : les pommes et les sacs s'y posent au fond, puis s'empilent par-dessus le bord
  const basket = h("div", { class: "panier-osier", style: `background-image:url("${dessin("activites/panier")}")`, "aria-label": "Panier" });
  const count = counter(0);
  const refresh = () => {
    basket.replaceChildren();
    for (let i = 0; i < bags; i++) {
      const b = h("button", { type: "button", class: "sac-btn", "aria-label": "Reprendre un sac de 10", html: sacHTML() });
      b.addEventListener("click", () => { bags--; refresh(); });
      basket.appendChild(b);
    }
    for (let i = 0; i < apples; i++) {
      const a = h("button", { type: "button", "aria-label": "Reprendre une pomme", style: `border:none;background:none;padding:0;cursor:pointer;width:${appleSize};height:${appleSize}` }, appleEl(appleSize));
      a.addEventListener("click", () => { apples--; refresh(); });
      basket.appendChild(a);
    }
    count.textContent = String(bags * 10 + apples);
  };
  const addApple = h("button", { type: "button", class: "card", "aria-label": "Ajouter une pomme", style: "width:max(76px,calc(var(--u) * 120));height:max(76px,calc(var(--u) * 120))" }, appleEl("80%"));
  addApple.addEventListener("click", () => { if (bags * 10 + apples < 99) { apples++; refresh(); } });
  const pile = h("div", { class: "row" }, addApple);
  if (opts.withBags) {
    const addBag = h("button", { type: "button", class: "card", "aria-label": "Ajouter un sac de 10 pommes", style: "width:max(76px,calc(var(--u) * 120));height:max(76px,calc(var(--u) * 120))", html: sacHTML() });
    addBag.addEventListener("click", () => { if (bags < 9) { bags++; refresh(); } });
    pile.appendChild(addBag);
  }
  const check = checkButton((el) => opts.onCheck(bags * 10 + apples, el));
  pile.appendChild(count);
  pile.appendChild(check);
  refresh();
  view.stage.appendChild(basket);
  view.stage.appendChild(pile);
  return { basket, add: (n: number) => { apples += n; refresh(); }, setBags: (n: number) => { bags = n; refresh(); } };
}

export const marche: ActivityModule<MarketItem> = {
  id: "marche", title: "Le marché de Basile", domain: "nombres", island: "nombres", host: "basile",
  maxLevel: 6, items: 6,
  skills: ["NUM.VOIR.4", "NUM.COMPTE.10", "NUM.COMPTE.20", "NUM.COMPLEMENT.10", "NUM.DIZAINES.LIRE", "NUM.DIZAINES.FAIRE"],
  card: `<span style="display:block;width:1em;height:1em">${POMME}</span>`, pitch: "Le marché de Basile, pour compter les pommes.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.n}:${it.have ?? ""}`,

  generate(level, ctx) {
    const r = ctx.rng;
    if (level <= 1) {
      const n = r.int(1, 4);
      return { kind: "voir", n, choices: r.shuffle([n, ...near(n, 1, 5, r.next).slice(0, 2)]), skill: "NUM.VOIR.4", difficulty: -1, form: "image", guess: 1 / 3, level, prompt: "Combien de pommes vois-tu ? Touche le bon nombre." };
    }
    if (level === 2) {
      const n = r.int(3, 7);
      return { kind: "donner", n, skill: "NUM.COMPTE.10", difficulty: -0.3 + (n - 3) * 0.1, form: "manipulation", guess: 0, level, prompt: `Basile voudrait ${n} pommes. Mets ${n} pommes dans le panier, puis touche la coche.` };
    }
    if (level === 3) {
      const n = r.int(8, 15);
      return { kind: "donner", n, skill: n <= 10 ? "NUM.COMPTE.10" : "NUM.COMPTE.20", difficulty: n <= 10 ? 0 : 0.3, form: "manipulation", guess: 0, level, prompt: `Basile voudrait ${n} pommes. Mets ${n} pommes dans le panier, puis touche la coche.` };
    }
    if (level === 4) {
      const have = r.int(3, 8), n = 10 - have;
      return { kind: "complement", n, have, choices: r.shuffle([n, ...near(n, 1, 9, r.next).slice(0, 2)]), skill: "NUM.COMPLEMENT.10", difficulty: 0.8, form: "image", guess: 1 / 3, level, prompt: `Il y a ${have} pommes dans le panier. Combien en faut-il encore pour en avoir 10 ?` };
    }
    if (level === 5) {
      const tens = r.int(1, 5), units = r.int(0, 9), n = tens * 10 + units;
      const swap = units > 0 && units <= 6 ? units * 10 + tens : n + 10;
      // Distracteurs typiques : chiffres inversés (34 / 43), oubli des unités, erreur d'une unité.
      const wrong = r.shuffle(uniq([swap, n + (r.next() < 0.5 ? 1 : -1), tens * 10]).filter((x) => x !== n && x > 0)).slice(0, 2);
      return { kind: "dizaines", n, tens, units, choices: r.shuffle([n, ...wrong]), skill: "NUM.DIZAINES.LIRE", difficulty: 1.3, form: "image", guess: 1 / 3, level, prompt: "Chaque sac contient 10 pommes. Combien de pommes en tout ?" };
    }
    const n = r.int(2, 6) * 10 + r.int(1, 9);
    return { kind: "preparer", n, skill: "NUM.DIZAINES.FAIRE", difficulty: 1.7, form: "manipulation", guess: 0, level, prompt: `Prépare ${n} pommes pour Basile. Un sac, c'est 10 pommes.` };
  },

  render(item, view) {
    const big = "max(52px,calc(var(--u) * 92))";
    if (item.kind === "voir") {
      // les pommes au fond de la corbeille ronde, rangées comme sur un dé
      const board = h("div", { class: "corbeille", style: `background-image:url("${dessin("activites/corbeille")}")` });
      const f = fondCorbeille();
      for (const [x, y] of DICE[item.n]) {
        const a = appleEl(big);
        a.style.position = "absolute";
        a.style.left = `calc(${pc(f.cx + ((x - 50) / 50) * f.dx)} - ${big} / 2)`;
        a.style.top = `calc(${pc(f.cy + ((y - 50) / 50) * f.dy)} - ${big} / 2)`;
        board.appendChild(a);
      }
      view.stage.appendChild(board);
      const row = h("div", { class: "choices" });
      for (const c of item.choices!) row.appendChild(numberChoice(c, (el) => view.answer(c === item.n, el)));
      view.stage.appendChild(row);
      return;
    }
    if (item.kind === "complement" || item.kind === "dizaines") {
      if (item.kind === "complement") {
        // la cagette à dix places : une pomme par trou, les trous vides se voient (et brillent à l'indice)
        const e = ELEMENTS["activites/cagette-10"];
        const frame = h("div", { class: "cagette", style: `background-image:url("${dessin("activites/cagette-10")}")`, "aria-label": `Cagette de 10 places, ${item.have} pommes` });
        for (let i = 0; i < 10; i++) {
          const [x, y] = e.points?.[`c${i}`] ?? [0.1 + (i % 5) * 0.2, i < 5 ? 0.33 : 0.67];
          const cell = h("div", { class: "cell", style: `left:${pc(x)};top:${pc(y)}` });
          if (i < item.have!) cell.appendChild(appleEl("100%"));
          frame.appendChild(cell);
        }
        view.stage.appendChild(frame);
      } else {
        // les sacs de dix et les pommes, posés dans le grand panier
        const board = h("div", { class: "panier-osier", style: `background-image:url("${dessin("activites/panier")}")` });
        for (let i = 0; i < item.tens!; i++) board.appendChild(h("span", { class: "sac-pose", html: sacHTML() }));
        for (let i = 0; i < item.units!; i++) board.appendChild(appleEl("max(30px,calc(var(--u) * 54))"));
        view.stage.appendChild(board);
      }
      const row = h("div", { class: "choices" });
      for (const c of item.choices!) row.appendChild(numberChoice(c, (el) => view.answer(c === item.n, el)));
      view.stage.appendChild(row);
      return;
    }
    view.stage.appendChild(h("div", { class: "title", style: "font-size:max(30px,calc(var(--u) * 56))", "aria-hidden": "true" }, String(item.n)));
    basketBuilder(view, { target: item.n, withBags: item.kind === "preparer", onCheck: (count, el) => view.answer(count === item.n, el) });
  },

  hint(item, step, view) {
    if (step === 1) return item.prompt;
    if (item.kind === "voir") {
      if (step === 2) return "Compte les pommes avec ton doigt, une par une.";
      const right = view.stage.querySelector<HTMLElement>(`[data-n="${item.n}"]`);
      if (step === 4 && right) glow(right);
      return step === 3 ? `Regarde : c'est comme sur un dé. Il y a ${item.n === 1 ? "une seule pomme" : `${item.n} pommes`}.` : `C'est ${item.n}. Touche le nombre qui brille.`;
    }
    if (item.kind === "complement") {
      if (step === 2) return "Compte les cases vides du panier.";
      if (step === 3) { view.stage.querySelectorAll<HTMLElement>(".cell").forEach((c) => { if (!c.firstChild) glow(c); }); return "Les cases qui brillent sont vides. Compte-les."; }
      const right = view.stage.querySelector<HTMLElement>(`[data-n="${item.n}"]`);
      if (right) glow(right);
      return `${item.have} et ${item.n}, ça fait 10. Touche ${item.n}.`;
    }
    if (item.kind === "dizaines") {
      if (step === 2) return "Compte les sacs de dix : dix, vingt, trente… puis ajoute les pommes.";
      if (step === 3) return `Il y a ${item.tens} sac${item.tens! > 1 ? "s" : ""}, donc ${item.tens! * 10}. Puis ${item.units} pomme${item.units! > 1 ? "s" : ""}.`;
      const right = view.stage.querySelector<HTMLElement>(`[data-n="${item.n}"]`);
      if (right) glow(right);
      return `En tout, ça fait ${item.n}.`;
    }
    if (item.kind === "preparer") {
      const t = Math.floor(item.n / 10), u = item.n % 10;
      if (step === 2) return `${item.n}, c'est ${t} sacs de dix et ${u} pomme${u > 1 ? "s" : ""}.`;
      if (step === 3) return `Mets d'abord ${t} sacs, puis ${u} pomme${u > 1 ? "s" : ""}.`;
      return `${t} sacs et ${u} pomme${u > 1 ? "s" : ""}, puis touche la coche.`;
    }
    if (step === 2) return "Compte à voix haute en ajoutant les pommes une par une.";
    if (step === 3) return `Arrête-toi quand tu arrives à ${item.n}.`;
    const check = view.stage.querySelector<HTMLElement>(".round.ok");
    if (check) glow(check);
    return `Quand il y a ${item.n} pommes, touche la coche.`;
  },

  sticker(summary) {
    const reason = summary.firstTry >= summary.items - 1 ? "Celle-ci, c'est pour avoir compté avec soin." : "Celle-ci, c'est parce que tu as continué à compter jusqu'au bout.";
    return { kind: "pomme", reason, svg: appleStickerSVG() };
  },

  success(item) {
    if (item.kind === "complement") return `Oui ! ${item.have} et ${item.n}, ça fait 10.`;
    if (item.kind === "voir") return item.n === 1 ? "Oui, une pomme !" : `Oui, ${item.n} pommes !`;
    return `Oui, ${item.n} pommes !`;
  },

  tip(item) {
    if (item.kind === "voir") return "laissez-le répondre vite, sans compter : on cherche à « voir » les petites quantités.";
    if (item.kind === "complement") return `s'il compte sur ses doigts, c'est très bien : demandez-lui ensuite « ${item.have} et combien font 10 ? ».`;
    if (item.kind === "dizaines" || item.kind === "preparer") return "faites-le compter les sacs de dix à voix haute : dix, vingt, trente…";
    return "encouragez-le à compter à voix haute en touchant chaque pomme.";
  },
};

function uniq(a: number[]) { return Array.from(new Set(a)); }
function near(n: number, lo: number, hi: number, rnd: () => number) {
  const c = [n - 1, n + 1, n + 2, n - 2].filter((x) => x >= lo && x <= hi && x !== n);
  return c.sort(() => rnd() - 0.5).slice(0, 3);
}

// la gommette du marché : la pomme de l'imagier, comme les autres gommettes à image
export const appleStickerSVG = () => emojiStickerSVG("🍎", "#DCE9FB");
