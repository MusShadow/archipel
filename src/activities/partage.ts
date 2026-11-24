// Île des Nombres — « Le partage du goûter » : distribuer des biscuits équitablement entre des amis.
// Parts égales, puis partage avec un reste (pour le panier de Basile), puis « combien chacun ? » sans manipuler.
import type { ActivityModule, Item, View } from "../host";
import { imageImagier } from "../imagier";
import { imgImagier } from "../lexique";
import { sfx } from "../services";
import { glow, h, icon, medallion, wobble } from "../ui";
import { emojiStickerSVG } from "./chants";

type Kind = "egal" | "reste" | "combien";
interface ShareItem extends Item { kind: Kind; total: number; friends: string[]; target: number; rest: number; choices: number[] }

const NAMES: Record<string, string> = { mona: "Mona", octave: "Octave", kiki: "Kiki", rico: "Rico", pico: "Pico" };
// Livraison 4 : le biscuit de l'imagier ; assiettes en faïence, boîte en fer et panier d'osier sont dessinés (styles4.ts).
export const COOKIE = imgImagier(imageImagier("🍪")!.fichier);
const biscuits = (n: number) => `${n} biscuit${n > 1 ? "s" : ""}`;
const listNames = (f: string[]) => f.map((x) => NAMES[x]).join(f.length > 2 ? ", " : " et ").replace(/, ([^,]*)$/, " et $1");
const deNames = (f: string[]) => { const s = listNames(f); return /^[AEIOUYÉ]/.test(s) ? `d'${s}` : `de ${s}`; }; // « d'Octave »

export const partage: ActivityModule<ShareItem> = {
  id: "partage", title: "Le partage du goûter", domain: "nombres", island: "nombres", host: "basile",
  maxLevel: 4, items: 5,
  skills: ["NUM.PARTAGE.EGAL", "NUM.PARTAGE.RESTE", "NUM.PARTAGE.COMBIEN"],
  card: `<span style="display:block;width:1em;height:1em">${COOKIE}</span>`, pitch: "Le partage du goûter, pour partager les biscuits entre les amis.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.total}:${it.friends.length}`,

  generate(level, ctx) {
    const r = ctx.rng;
    const pickFriends = (k: number) => r.shuffle(Object.keys(NAMES)).slice(0, k);
    if (level <= 2) {
      const three = level === 2 && r.next() < 0.5;
      const k = three ? 3 : 2;
      const total = three ? r.pick([3, 6]) : level === 1 ? r.pick([2, 4, 6]) : r.pick([8, 10]);
      const friends = pickFriends(k);
      return { kind: "egal", total, friends, target: total / k, rest: 0, choices: [], skill: "NUM.PARTAGE.EGAL", difficulty: -0.3 + 0.15 * (total / k) + (three ? 0.3 : 0), form: "manipulation", guess: 0, level,
        prompt: `Basile a ${biscuits(total)} pour le goûter. Glisse-les dans les assiettes ${deNames(friends)} : chacun doit en avoir autant. Puis touche la coche.` };
    }
    if (level === 3 || r.next() < 0.4) {
      const k = r.next() < 0.6 ? 2 : 3;
      const total = k === 2 ? r.pick([3, 5, 7]) : r.pick([4, 5, 7, 8]);
      const friends = pickFriends(k);
      return { kind: "reste", total, friends, target: Math.floor(total / k), rest: total % k, choices: [], skill: "NUM.PARTAGE.RESTE", difficulty: 0.6 + 0.1 * k, form: "manipulation", guess: 0, level,
        prompt: `Partage ${biscuits(total)} entre ${listNames(friends)}, pour que chacun en ait autant. S'il en reste, glisse-les dans le panier de Basile. Puis touche la coche.` };
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
    if (step === 3) {
      const done = board?.helpRound() ?? "donne";
      if (done === "egalise") return "Je glisse un biscuit vers l'assiette qui en a le moins.";
      if (done === "panier") return "Je redonne un biscuit du panier à chacun.";
      if (done === "pret") return "Tout le monde en a autant : touche la coche !";
      return "Je donne un biscuit à chacun. Continue comme ça !";
    }
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
    return "laissez-le glisser les biscuits un par un, puis demandez : « est-ce que c'est juste ? » Un biscuit se déplace aussi d'une assiette à l'autre.";
  },
};

interface ShareBoard { pile: () => number; helpRound: () => "donne" | "egalise" | "panier" | "pret" ; showLow: () => void }
// Plateau de partage. Lieux : -1 = la boîte de biscuits, 0…n-1 = les assiettes des amis, n = le panier de Basile.
// On glisse un biscuit d'un lieu à un autre : de la boîte vers une assiette, d'une assiette à l'autre, ou on le remet
// dans la boîte. Toucher une assiette y pose un biscuit de la boîte ; toucher un biscuit d'une assiette le remet dans
// la boîte (comme avant le glisser-déposer : les deux gestes marchent).
function shareBoard(item: ShareItem, view: View) {
  const n = item.friends.length;
  const counts = [...item.friends.map(() => 0), 0];
  let pile = item.total;
  const get = (k: number) => (k < 0 ? pile : counts[k]);
  const add = (k: number, d: number) => { if (k < 0) pile += d; else counts[k] += d; };
  const plates = () => counts.slice(0, n);
  const basket = () => counts[n];
  const pileEl = h("div", { class: "panel cookies box", "data-k": "-1" });
  const plateEls: HTMLElement[] = [];
  const zoneEl = (k: number) => (k < 0 ? pileEl : plateEls[k]);
  const holder = (k: number) => (k < 0 ? pileEl : plateEls[k].querySelector<HTMLElement>(".dish")!);
  // Le clic que le navigateur envoie juste après un glisser (ou un toucher de biscuit), au même endroit, ne compte pas
  // pour l'assiette : sinon elle recevrait en plus un biscuit de la boîte.
  let lastUp = { t: -1e9, x: NaN, y: NaN };
  const echo = (e: MouseEvent) => e.timeStamp - lastUp.t < 350 && Math.hypot(e.clientX - lastUp.x, e.clientY - lastUp.y) < 4;
  let toldEmpty = false;

  const cookie = (k: number) => {
    const c = h("span", { class: `cookie${k < 0 ? "" : " small"}`, "data-from": String(k), html: COOKIE });
    c.addEventListener("pointerdown", (e) => startDrag(e as PointerEvent, c, k));
    return c;
  };
  const draw = (k: number) => {
    const el = holder(k);
    el.replaceChildren(...Array.from({ length: get(k) }, () => cookie(k)));
    if (k < 0 && !pile) el.appendChild(h("span", { class: "etiquette-vide", style: "font-size:max(14px,calc(var(--u) * 20))" }, "Plus de biscuits à partager"));
    zoneEl(k).setAttribute("aria-label", k < 0 ? `${pile} biscuits à partager` : `${k < n ? NAMES[item.friends[k]] : "Panier de Basile"} : ${get(k)}`);
  };
  const drawAll = () => { draw(-1); plateEls.forEach((_, k) => draw(k)); };
  const pop = (k: number) => holder(k).querySelector(".cookie:last-of-type")?.classList.add("pop");

  // Un biscuit qui s'envole d'un lieu à un autre (toucher, ou l'aide de Plume).
  const flyFrom = (from: Element, to: Element) => {
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width || !b.width || !document.body.animate) return;
    const g = h("span", { class: "cookie ghost", html: COOKIE, style: `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px` });
    document.body.appendChild(g);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = g.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 50}px) scale(1.1)` }, { transform: `translate(${dx}px,${dy}px) scale(0.75)`, opacity: 0.6 }], { duration: 380, easing: "ease-in-out" });
    anim.onfinish = anim.oncancel = () => g.remove();
  };
  const move = (from: number, to: number, animate = true) => {
    if (from === to || get(from) <= 0) return false;
    const src = holder(from).querySelector(".cookie:last-of-type");
    if (animate && src) flyFrom(src, holder(to));
    add(from, -1); add(to, 1);
    sfx.tap(); drawAll(); pop(to);
    return true;
  };

  // Glisser-déposer au doigt (ou à la souris). Les écouteurs sont sur la fenêtre : ils survivent au redessin du plateau.
  function startDrag(e: PointerEvent, src: HTMLElement, from: number) {
    if (e.button > 0 || !e.isPrimary) return;
    e.preventDefault();
    const id = e.pointerId;
    const r = src.getBoundingClientRect();
    const size = r.width * 1.2;
    const ghost = h("span", { class: "cookie ghost", html: COOKIE, style: `width:${size}px;height:${size}px;visibility:hidden` });
    document.body.appendChild(ghost);
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false, over: number | null = null;
    const zoneAt = (x: number, y: number) => {
      const t = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-k]");
      return t && view.stage.contains(t) ? Number(t.dataset.k) : null;
    };
    const mark = (k: number | null) => {
      if (k === over) return;
      if (over !== null) zoneEl(over)?.classList.remove("over");
      over = k;
      if (over !== null && over !== from) zoneEl(over)?.classList.add("over");
    };
    const place = (x: number, y: number) => { ghost.style.left = `${x - size / 2}px`; ghost.style.top = `${y - size / 2}px`; };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      if (!moved) { moved = true; ghost.style.visibility = "visible"; src.classList.add("lifted"); }
      place(ev.clientX, ev.clientY);
      mark(zoneAt(ev.clientX, ev.clientY));
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      ghost.remove(); src.classList.remove("lifted"); mark(null);
      if (!view.stage.isConnected) return;
      lastUp = { t: ev.timeStamp, x: ev.clientX, y: ev.clientY };
      if (!moved) {
        // Simple toucher : un biscuit d'une assiette retourne dans la boîte ; un biscuit de la boîte frétille.
        if (from >= 0) move(from, -1);
        else { src.classList.remove("wiggle"); void src.offsetWidth; src.classList.add("wiggle"); }
        return;
      }
      const to = ev.type === "pointercancel" ? null : zoneAt(ev.clientX, ev.clientY);
      if (to === null || to === from || !move(from, to, false)) drawAll();
    };
    place(x0, y0);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  const zones = item.kind === "reste" ? n + 1 : n;
  const row = h("div", { class: `row plates z${zones}` });
  for (let k = 0; k < zones; k++) {
    const who = k < n ? item.friends[k] : "basile";
    const el = h("button", { type: "button", class: `plate${k === n ? " basket" : ""}`, "data-i": k, "data-k": k },
      h("span", { class: "friend", html: medallion(who, true) }), h("span", { class: "dish" }));
    el.addEventListener("click", (e) => {
      if (echo(e)) return;
      if (pile) { move(-1, k); return; }
      if (!toldEmpty) { toldEmpty = true; view.say("Il n'y a plus de biscuits dans la boîte. Tu peux glisser un biscuit d'une assiette à l'autre."); }
      wobble(pileEl);
    });
    plateEls.push(el); row.appendChild(el);
  }
  const ok = h("button", { type: "button", class: "round ok", "aria-label": "C'est prêt", html: icon("check", "#fff", 3) });
  ok.addEventListener("click", () => {
    if (pile > 0) { view.say(`Il reste ${biscuits(pile)} à partager.`); return; }
    const p = plates();
    const equal = p.every((x) => x === p[0]);
    const right = equal && p[0] === item.target && basket() === item.rest;
    const msg = !equal ? "Regarde bien : est-ce que tout le monde en a autant ?" : basket() >= n ? "Il y en a assez dans le panier pour en redonner un à chacun !" : undefined;
    view.answer(right, ok, msg);
  });
  view.stage.appendChild(pileEl);
  view.stage.appendChild(row);
  view.stage.appendChild(h("div", { class: "row" }, ok));
  drawAll();
  const later = (fns: (() => void)[]) => fns.forEach((f, i) => setTimeout(() => { if (view.stage.isConnected) f(); }, i * 260));
  const board: ShareBoard = {
    pile: () => pile,
    // Aide de Plume (indice 3) : elle fait un tour à la place de l'enfant, selon où il en est.
    helpRound: () => {
      const p = plates();
      if (pile > 0) { later(p.map((_, k) => () => { if (pile > 0) move(-1, k); })); return "donne"; }
      const max = Math.max(...p), min = Math.min(...p);
      if (max !== min) { move(p.indexOf(max), p.indexOf(min)); return "egalise"; }
      if (item.kind === "reste" && basket() >= n) { later(p.map((_, k) => () => { if (basket() > 0) move(n, k); })); return "panier"; }
      glow(ok);
      return "pret";
    },
    showLow: () => { const p = plates(); const min = Math.min(...p); const k = p.indexOf(min); if (plateEls[k] && min < item.target) glow(plateEls[k]); },
  };
  (view.stage as any)._share = board;
}

export const cookieStickerSVG = () => emojiStickerSVG("🍪", "#FFF0C9");
