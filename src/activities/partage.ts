// Île des Nombres — « Le partage du goûter » : distribuer des biscuits équitablement entre des amis.
// Parts égales, puis partage avec un reste (pour le panier de Basile), puis « combien chacun ? » sans manipuler.
import type { ActivityModule, Item, View } from "../host";
import { sfx } from "../services";
import { glow, h, icon, medallion } from "../ui";

type Kind = "egal" | "reste" | "combien";
interface ShareItem extends Item { kind: Kind; total: number; friends: string[]; target: number; rest: number; choices: number[] }

const NAMES: Record<string, string> = { mona: "Mona", octave: "Octave", kiki: "Kiki", rico: "Rico", pico: "Pico" };
export const COOKIE = `<svg viewBox="0 0 40 40" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="20" cy="20" r="17" fill="#D9A877" stroke="#B9834F" stroke-width="2"/><circle cx="14" cy="14" r="2.6" fill="#6B3E22"/><circle cx="25" cy="12" r="2.2" fill="#6B3E22"/><circle cx="27" cy="23" r="2.6" fill="#6B3E22"/><circle cx="15" cy="26" r="2.2" fill="#6B3E22"/><circle cx="21" cy="19" r="1.8" fill="#6B3E22"/></svg>`;
const biscuits = (n: number) => `${n} biscuit${n > 1 ? "s" : ""}`;
const listNames = (f: string[]) => f.map((x) => NAMES[x]).join(f.length > 2 ? ", " : " et ").replace(/, ([^,]*)$/, " et $1");

export const partage: ActivityModule<ShareItem> = {
  id: "partage", title: "Le partage du goûter", domain: "nombres", island: "nombres", host: "basile",
  maxLevel: 4, items: 5,
  skills: ["NUM.PARTAGE.EGAL", "NUM.PARTAGE.RESTE", "NUM.PARTAGE.COMBIEN"],
  card: `<span style="display:block;width:1em;height:1em">${COOKIE}</span>`, pitch: "Le partage du goûter, pour partager les biscuits entre les amis.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    const pickFriends = (k: number) => r.shuffle(Object.keys(NAMES)).slice(0, k);
    if (level <= 2) {
      const three = level === 2 && r.next() < 0.5;
      const k = three ? 3 : 2;
      const total = three ? r.pick([3, 6]) : level === 1 ? r.pick([2, 4, 6]) : r.pick([8, 10]);
      const friends = pickFriends(k);
      return { kind: "egal", total, friends, target: total / k, rest: 0, choices: [], skill: "NUM.PARTAGE.EGAL", difficulty: -0.3 + 0.15 * (total / k) + (three ? 0.3 : 0), form: "manipulation", guess: 0, level,
        prompt: `Basile a ${biscuits(total)} pour le goûter. Partage-les entre ${listNames(friends)} : chacun doit en avoir autant. Puis touche la coche.` };
    }
    if (level === 3 || r.next() < 0.4) {
      const k = r.next() < 0.6 ? 2 : 3;
      const total = k === 2 ? r.pick([3, 5, 7]) : r.pick([4, 5, 7, 8]);
      const friends = pickFriends(k);
      return { kind: "reste", total, friends, target: Math.floor(total / k), rest: total % k, choices: [], skill: "NUM.PARTAGE.RESTE", difficulty: 0.6 + 0.1 * k, form: "manipulation", guess: 0, level,
        prompt: `Partage ${biscuits(total)} entre ${listNames(friends)}, pour que chacun en ait autant. S'il en reste, mets-les dans le panier de Basile. Puis touche la coche.` };
    }
    const k = r.next() < 0.6 ? 2 : 3;
    const total = k === 2 ? r.pick([4, 6, 8, 10]) : r.pick([6, 9]);
    const target = total / k;
    // Distracteurs : le total (erreur fréquente : « tous les biscuits »), puis une unité de plus.
    const choices = Array.from(new Set([target, total, target + 1, target - 1])).filter((x) => x > 0).slice(0, 3);
    const friends = pickFriends(k);
    return { kind: "combien", total, friends, target, rest: 0, choices: r.shuffle(choices), skill: "NUM.PARTAGE.COMBIEN", difficulty: 1.2 + 0.05 * total, form: "image", guess: 1 / 3, level,
      prompt: `Il y a ${biscuits(total)} pour ${listNames(friends)}. Si on partage bien, combien de biscuits aura chacun ?` };
  },

  render(item, view) {
    if (item.kind === "combien") {
      view.stage.appendChild(h("div", { class: "panel cookies" }, ...Array.from({ length: item.total }, () => h("span", { class: "cookie", html: COOKIE }))));
      view.stage.appendChild(h("div", { class: "row" }, ...item.friends.map((f) => h("span", { class: "friend", html: medallion(f, true) }))));
      const row = h("div", { class: "choices" });
      for (const c of item.choices) {
        const b = h("button", { type: "button", class: "card numcard", "data-c": c, "aria-label": String(c) }, h("span", { class: "title" }, String(c)));
        b.addEventListener("click", () => view.answer(c === item.target, b, c === item.target ? undefined : c === item.total ? "Ça, c'est tous les biscuits ! Combien pour un seul ami ?" : `Si chacun en a ${c}, est-ce que ça fait bien ${item.total} ?`));
        row.appendChild(b);
      }
      view.stage.appendChild(row);
      return;
    }
    shareBoard(item, view);
  },

  hint(item, step, view) {
    const board = (view.stage as any)._share as ShareBoard | undefined;
    if (step === 1) return item.prompt;
    if (item.kind === "combien") {
      if (step === 2) return "Imagine qu'on les distribue : un pour toi, un pour moi, chacun son tour.";
      if (step === 3) return `Il y a ${biscuits(item.total)} pour ${item.friends.length} amis.`;
      const c = view.stage.querySelector<HTMLElement>(`[data-c="${item.target}"]`); if (c) glow(c);
      return `Chacun en aura ${item.target}.`;
    }
    if (step === 2) return item.kind === "reste"
      ? "Donne un biscuit à chacun, chacun son tour. Quand il n'y en a plus assez pour tout le monde, le reste va dans le panier de Basile."
      : "Donne un biscuit à chacun, chacun son tour.";
    if (step === 3) { board?.dealRound(); return "Je donne un biscuit à chacun. Continue comme ça !"; }
    board?.showLow();
    return item.kind === "reste" ? `Chacun doit en avoir ${item.target}, et il en reste ${item.rest} pour Basile.` : `Chacun doit en avoir ${item.target}.`;
  },

  success(item) {
    if (item.kind === "combien") return `Oui, ${item.target} chacun !`;
    if (item.kind === "reste") return `Oui ! Chacun a ${biscuits(item.target)}, et il en reste ${item.rest} pour Basile.`;
    return `Oui ! Chacun a ${biscuits(item.target)} : c'est juste.`;
  },

  sticker(summary) {
    const reason = summary.helped > 0 ? "Celle-ci, c'est parce que tu as cherché jusqu'à ce que ce soit juste pour tout le monde." : "Celle-ci, c'est pour tes partages bien justes.";
    return { kind: "biscuit", reason, svg: cookieStickerSVG() };
  },

  tip(item) {
    if (item.kind === "combien") return "s'il hésite, sortez de vrais objets et partagez-les ensemble : un pour toi, un pour moi.";
    if (item.kind === "reste") return "demandez-lui : « peut-on encore en donner un à chacun ? » avant de mettre dans le panier.";
    return "laissez-le distribuer un par un, puis demandez : « est-ce que c'est juste ? »";
  },
};

interface ShareBoard { dealRound: () => void; showLow: () => void }
function shareBoard(item: ShareItem, view: View) {
  let pile = item.total;
  const plates = item.friends.map(() => 0);
  let basket = 0;
  const pileEl = h("div", { class: "panel cookies", "aria-live": "polite" });
  const plateEls: HTMLElement[] = [];
  const drawPile = () => {
    pileEl.replaceChildren(...Array.from({ length: pile }, () => h("span", { class: "cookie", html: COOKIE })));
    if (!pile) pileEl.appendChild(h("span", { class: "muted", style: "font-size:max(14px,calc(var(--u) * 20))" }, "Plus de biscuits à partager"));
    pileEl.setAttribute("aria-label", `${pile} biscuits à partager`);
  };
  const drawPlate = (i: number) => {
    const el = plateEls[i];
    const count = i < plates.length ? plates[i] : basket;
    const dish = el.querySelector(".dish")!;
    dish.replaceChildren(...Array.from({ length: count }, () => {
      const c = h("span", { class: "cookie small", role: "button", "aria-label": "Reprendre un biscuit", html: COOKIE });
      c.addEventListener("click", (e) => { e.stopPropagation(); if (i < plates.length) plates[i]--; else basket--; pile++; sfx.tap(); drawAll(); });
      return c;
    }));
    el.setAttribute("aria-label", `${i < plates.length ? NAMES[item.friends[i]] : "Panier de Basile"} : ${count}`);
  };
  const drawAll = () => { drawPile(); plateEls.forEach((_, i) => drawPlate(i)); };
  const give = (i: number) => {
    if (!pile) return;
    pile--; if (i < plates.length) plates[i]++; else basket++;
    sfx.tap(); drawAll();
  };
  const row = h("div", { class: "row plates" });
  item.friends.forEach((f, i) => {
    const el = h("button", { type: "button", class: "plate", "data-i": i },
      h("span", { class: "friend", html: medallion(f, true) }), h("span", { class: "dish" }));
    el.addEventListener("click", () => give(i));
    plateEls.push(el); row.appendChild(el);
  });
  if (item.kind === "reste") {
    const el = h("button", { type: "button", class: "plate basket", "data-i": plates.length },
      h("span", { class: "friend", html: medallion("basile", true) }), h("span", { class: "dish" }));
    el.addEventListener("click", () => give(plates.length));
    plateEls.push(el); row.appendChild(el);
  }
  const ok = h("button", { type: "button", class: "round ok", "aria-label": "C'est prêt", html: icon("check", "#fff", 3) });
  ok.addEventListener("click", () => {
    if (pile > 0) { view.say(`Il reste ${biscuits(pile)} à partager.`); return; }
    const equal = plates.every((x) => x === plates[0]);
    const right = equal && plates[0] === item.target && basket === item.rest;
    const msg = !equal ? "Regarde bien : est-ce que tout le monde en a autant ?" : basket >= plates.length ? "Il y en a assez dans le panier pour en redonner un à chacun !" : undefined;
    view.answer(right, ok, msg);
  });
  view.stage.appendChild(pileEl);
  view.stage.appendChild(row);
  view.stage.appendChild(h("div", { class: "row" }, ok));
  drawAll();
  const board: ShareBoard = {
    dealRound: () => { for (let i = 0; i < plates.length && pile > 0; i++) give(i); },
    showLow: () => { const min = Math.min(...plates); const i = plates.indexOf(min); if (plateEls[i] && min < item.target) glow(plateEls[i]); },
  };
  (view.stage as any)._share = board;
}

export const cookieStickerSVG = () => `<svg viewBox="0 0 72 72" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="37" cy="38" r="33" fill="#E6DAC4"/><circle cx="35" cy="35" r="33" fill="#fff" stroke="#E4D9C5" stroke-width="1.5"/><circle cx="35" cy="35" r="27" fill="#FFF0C9"/><g transform="translate(15 15)">${COOKIE.replace('style="display:block;width:100%;height:100%"', 'width="40" height="40"')}</g></svg>`;
