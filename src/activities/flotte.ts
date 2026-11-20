// Île des Découvertes — « Flotte ou coule ? » : on prédit, on teste dans le bassin d'Octave, on comprend.
import type { Rng } from "../core";
import { calque, vignette } from "../design/dessins";
import type { ActivityModule, Item } from "../host";
import { ELEMENTS } from "../illustrations";
import { sfx } from "../services";
import { glow, h, sleep } from "../ui";
import { emojiStickerSVG } from "./chants";

interface Obj { e: string; nom: string; flotte: boolean; why: string; lvl: 1 | 2 | 3; s?: number }
interface FlotteItem extends Item { kind: "predire" | "comparer"; objs: Obj[]; target: string; choices: string[]; why: string }

export const OBJETS: Obj[] = [
  { e: "🪨", nom: "le caillou", flotte: false, lvl: 1, why: "Le caillou est lourd pour sa taille : il coule." },
  { e: "🦆", nom: "le canard en plastique", flotte: true, lvl: 1, why: "Le canard est creux, rempli d'air : il flotte." },
  { e: "🔑", nom: "la clé", flotte: false, lvl: 1, why: "La clé est en métal, lourde pour sa taille : elle coule." },
  { e: "🍃", nom: "la feuille", flotte: true, lvl: 1, why: "La feuille est toute légère : elle flotte." },
  { e: "🪶", nom: "la plume", flotte: true, lvl: 1, why: "La plume est si légère qu'elle reste sur l'eau. Comme Plume !" },
  { e: "⛵", nom: "le bateau", flotte: true, lvl: 1, why: "Un bateau est fait pour flotter : il pousse l'eau sous lui." },
  { e: "🪙", nom: "la pièce", flotte: false, lvl: 1, why: "La pièce est en métal : elle coule." },
  { e: "⚓", nom: "l'ancre", flotte: false, lvl: 1, why: "L'ancre est lourde : elle coule au fond, c'est fait pour ça !" },
  { e: "🏐", nom: "le ballon", flotte: true, lvl: 1, why: "Le ballon est rempli d'air : il flotte." },
  { e: "🍎", nom: "la pomme", flotte: true, lvl: 2, why: "Surprise : la pomme contient un peu d'air, alors elle flotte !" },
  { e: "🧽", nom: "l'éponge", flotte: true, lvl: 2, why: "L'éponge a plein de petits trous remplis d'air : elle flotte." },
  { e: "🥄", nom: "la cuillère en métal", flotte: false, lvl: 2, why: "La cuillère est en métal : elle coule." },
  { e: "🥥", nom: "la noix de coco", flotte: true, lvl: 2, why: "La noix de coco flotte : elle peut même voyager sur la mer jusqu'à une autre île !" },
  { e: "🔩", nom: "la vis", flotte: false, lvl: 2, why: "La vis est en métal : elle coule." },
  { e: "🪵", nom: "le morceau de bois", flotte: true, lvl: 2, why: "Le bois est léger pour sa taille : il flotte." },
  { e: "🧱", nom: "la brique", flotte: false, lvl: 2, why: "La brique est lourde pour sa taille : elle coule." },
  { e: "🎾", nom: "la balle de tennis", flotte: true, lvl: 2, why: "La balle de tennis est pleine d'air : elle flotte." },
  { e: "🧊", nom: "le glaçon", flotte: true, lvl: 3, why: "Surprise : la glace est un peu plus légère que l'eau, alors le glaçon flotte !" },
  { e: "🥚", nom: "l'œuf", flotte: false, lvl: 3, why: "Un œuf frais coule au fond de l'eau." },
  { e: "🍇", nom: "le grain de raisin", flotte: false, lvl: 3, why: "Même tout petit, le grain de raisin coule." },
  { e: "🍊", nom: "l'orange", flotte: true, lvl: 3, why: "L'orange flotte grâce à sa peau, pleine de minuscules bulles d'air." },
];
const PAIRES: { a: Obj; b: Obj; why: string }[] = [
  { a: { e: "🪵", nom: "la grosse bûche", flotte: true, lvl: 3, why: "", s: 1.3 }, b: { e: "🪨", nom: "le petit caillou", flotte: false, lvl: 3, why: "", s: 0.6 }, why: "Ce n'est pas la taille qui compte ! Le bois flotte, même très gros. La pierre coule, même toute petite." },
  { a: { e: "⛵", nom: "la pâte à modeler en forme de bateau", flotte: true, lvl: 3, why: "" }, b: { e: "🟤", nom: "la pâte à modeler en boule", flotte: false, lvl: 3, why: "" }, why: "C'est la même pâte ! En boule, elle coule. En forme de bateau, elle pousse beaucoup d'eau, et elle flotte." },
  { a: { e: "🍎", nom: "la grosse pomme", flotte: true, lvl: 3, why: "", s: 1.25 }, b: { e: "🍇", nom: "le petit grain de raisin", flotte: false, lvl: 3, why: "", s: 0.6 }, why: "La grosse pomme flotte et le petit raisin coule : ce n'est pas la taille qui compte." },
  { a: { e: "🚢", nom: "le grand bateau en métal", flotte: true, lvl: 3, why: "", s: 1.3 }, b: { e: "🔑", nom: "la petite clé en métal", flotte: false, lvl: 3, why: "", s: 0.6 }, why: "Les deux sont en métal ! Mais le bateau est creux, rempli d'air : il flotte. La clé coule." },
];
const recent: string[] = [];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const FEM = new Set(["la clé", "la feuille", "la plume", "la pièce", "l'ancre", "la pomme", "l'éponge", "la cuillère en métal", "la noix de coco", "la vis", "la brique", "la balle de tennis", "l'orange"]);
const pron = (o: Obj) => (FEM.has(o.nom) ? "elle" : "il");
// Livraison 4 : le bassin de verre d'Octave est dessiné (atelier : scripts/illustration/jeux_decouvertes.py). Les objets
// tombent entre son fond (l'eau, le sable, les plantes) et son devant (les bords de verre, le socle, un voile d'eau) ;
// la ligne d'eau et le dessus du sable viennent du dessin. Les deux réponses sont de petits bocaux dessinés.
const ICON_F = vignette("activites/flotte-oui", "fvign"), ICON_C = vignette("activites/flotte-non", "fvign");
const PC = (k: string, d: number) => `${+(Number(ELEMENTS["activites/bassin-fond"]?.infos?.[k] ?? d) * 100).toFixed(2)}%`;

export const flotte: ActivityModule<FlotteItem> = {
  id: "flotte", title: "Flotte ou coule ?", domain: "decouvertes", island: "decouvertes", host: "octave",
  maxLevel: 3, items: 6,
  skills: ["DECOUV.FLOTTE"],
  card: `<span class="emo">🦆</span>`, pitch: "Flotte ou coule, pour deviner ce qui flotte dans le bassin d'Octave.",
  startLevel: () => 1,
  identity: (it) => `${it.kind}:${it.objs.map((o) => o.e).sort().join("+")}`,

  generate(level, ctx) {
    const r: Rng = ctx.rng;
    if (level >= 3 && r.next() < 0.4) {
      const p = r.pick(PAIRES);
      const objs = r.shuffle([p.a, p.b]);
      return { kind: "comparer", objs, target: p.a.e, choices: objs.map((o) => o.e), why: p.why, skill: "DECOUV.FLOTTE", difficulty: 1, form: "recit", guess: 1 / 2, level,
        prompt: `Lequel va flotter : ${objs[0].nom}, ou ${objs[1].nom} ?` };
    }
    const pool = OBJETS.filter((o) => (level <= 1 ? o.lvl === 1 : level === 2 ? o.lvl <= 2 : o.lvl >= 2) && !recent.includes(o.e));
    const o = r.pick(pool.length ? pool : OBJETS);
    recent.push(o.e); if (recent.length > 5) recent.shift();
    return { kind: "predire", objs: [o], target: o.flotte ? "flotte" : "coule", choices: ["flotte", "coule"], why: o.why, skill: "DECOUV.FLOTTE",
      difficulty: o.lvl === 1 ? -0.6 : o.lvl === 2 ? 0.2 : 0.8, form: "image", guess: 1 / 2, level,
      prompt: `${cap(o.nom)} : est-ce qu'${pron(o)} flotte, ou est-ce qu'${pron(o)} coule ?` };
  },

  render(item, view) {
    const left = (i: number) => (item.objs.length === 1 ? 50 : 30 + 40 * i);
    const objs = item.objs.map((o, i) => h("span", { class: "fobj", "data-o": o.e, style: `left:${left(i)}%;--s:${o.s ?? 1}`, html: `<span class="emo">${o.e}</span>` }));
    const basin = h("div", { class: "bassin verre", style: `--eau:${PC("eau", 0.44)};--sable:${PC("sable", 0.8)}`, "aria-hidden": "true",
      html: calque("activites/bassin-fond") }, ...objs);
    basin.insertAdjacentHTML("beforeend", calque("activites/bassin-devant", "devant"));
    view.stage.appendChild(basin);
    let dropped = false, busy = false;
    const drop = async () => {
      if (dropped) return;
      dropped = true;
      sfx.hop();
      item.objs.forEach((o, i) => {
        objs[i].classList.add(o.flotte ? "floats" : "sinks");
        // une onde à la surface, quand l'objet touche l'eau
        const onde = h("span", { class: "onde", style: `left:${left(i)}%;animation-delay:${o.flotte ? 320 : 520}ms` });
        basin.appendChild(onde);
        window.setTimeout(() => onde.remove(), 1400);
      });
      await sleep(1500);
    };
    const row = h("div", { class: "choices" });
    const opts = item.kind === "predire"
      ? [{ id: "flotte", html: ICON_F, label: "Il flotte" }, { id: "coule", html: ICON_C, label: "Il coule" }].map((o) => ({ ...o, label: o.id === "flotte" ? `${cap(pron(item.objs[0]))} flotte` : `${cap(pron(item.objs[0]))} coule` }))
      : item.objs.map((o) => ({ id: o.e, html: `<span class="emo">${o.e}</span>`, label: o.nom }));
    for (const o of opts) {
      const b = h("button", { type: "button", class: "card pickcard labelled", "data-t": o.id, "aria-label": o.label, html: `${o.html}<span class="lab">${o.label}</span>` });
      b.addEventListener("click", async () => {
        if (busy) return;
        busy = true;
        const ok = o.id === item.target;
        await drop();
        busy = false;
        view.answer(ok, b, ok ? undefined : `Surprise ! ${item.why} Touche ce qui s'est vraiment passé.`);
      });
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    if (step === 1) return item.prompt;
    if (step === 2) return item.kind === "comparer" ? "Attention, ce n'est pas forcément le plus petit qui flotte !" : "Est-ce que c'est lourd ou léger pour sa taille ? Est-ce qu'il y a de l'air dedans ?";
    if (step === 3) return item.why;
    const right = view.stage.querySelector<HTMLElement>(`[data-t="${item.target}"]`); if (right) glow(right);
    return "C'est celle qui brille.";
  },

  success(item) { return `Oui ! ${item.why}`; },

  sticker(summary) {
    const cmp = (summary.last as FlotteItem | null)?.kind === "comparer";
    return { kind: "flotte", ref: cmp ? "⛵" : "🦆", reason: cmp ? "Celle-ci, c'est parce que tu as compris que ce n'est pas la taille qui compte." : "Celle-ci, c'est pour toutes tes expériences dans le bassin d'Octave.", svg: emojiStickerSVG(cmp ? "⛵" : "🦆", "#D5F0E1") };
  },

  tip(item) {
    if (item.kind === "comparer") return "à la maison : une boule de pâte à modeler coule… aplatie en barque, elle flotte !";
    return "au bain : faites deviner avant chaque essai (une cuillère, une pomme, un bouchon…).";
  },
};
