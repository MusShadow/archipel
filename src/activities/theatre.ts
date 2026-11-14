// Île du Cœur — « Le théâtre de Pico » : reconnaître les émotions, comprendre ce qui les cause, savoir aider,
// puis comprendre que chacun a ses goûts, qu'on peut se tromper (fausse croyance) et cacher ce qu'on ressent.
import type { Rng } from "../core";
import type { ActivityModule, Item, View } from "../host";
import { emoji } from "../lexique";
import { glow, h, medallion } from "../ui";
import { emojiStickerSVG } from "./chants";

type Emo = "joie" | "triste" | "colere" | "peur" | "surprise" | "decu";
type Who = "pico" | "basile" | "mona" | "rico" | "kiki" | "octave" | "plume";
type Kind = "visage" | "cause" | "aider" | "desir" | "croyance" | "contenu" | "cachee";
interface Opt { id: string; html: string; label: string }
interface TheatreItem extends Item { kind: Kind; who: Who; target: string; choices: string[]; opts: Record<string, Opt>; scene: string[]; line: string; why: string }

export const EMO: Record<Emo, { e: string; etat: [string, string]; qui: string }> = {
  joie: { e: "😄", etat: ["est content", "est contente"], qui: "qui est content" },
  triste: { e: "😢", etat: ["est triste", "est triste"], qui: "qui est triste" },
  colere: { e: "😠", etat: ["est en colère", "est en colère"], qui: "qui est en colère" },
  peur: { e: "😨", etat: ["a peur", "a peur"], qui: "qui a peur" },
  surprise: { e: "😲", etat: ["est surpris", "est surprise"], qui: "qui est surpris" },
  decu: { e: "😞", etat: ["est déçu", "est déçue"], qui: "qui est déçu" },
};
const NAME: Record<Who, string> = { pico: "Pico", basile: "Basile", mona: "Mona", rico: "Rico", kiki: "Kiki", octave: "Octave", plume: "Plume" };
const FEM: Record<Who, boolean> = { pico: false, basile: false, mona: true, rico: false, kiki: true, octave: false, plume: true };
const il = (w: Who) => (FEM[w] ? "elle" : "il");
const etat = (w: Who, e: Emo) => EMO[e].etat[FEM[w] ? 1 : 0];
const faceOpt = (e: Emo): Opt => ({ id: e, html: emoji(EMO[e].e), label: EMO[e].qui.replace(/^qui /, "") });

// Situations : qui, quoi (dessin), ce qui arrive, l'émotion attendue et des émotions clairement différentes.
const CAUSES: { who: Who; e: string; s: string; emo: Emo; not: Emo[]; why: string }[] = [
  { who: "basile", e: "🍦", s: "Basile a fait tomber sa glace par terre.", emo: "triste", not: ["joie", "surprise"], why: "Sa glace est perdue : ça rend triste." },
  { who: "mona", e: "🎂", s: "C'est l'anniversaire de Mona. Tous ses amis chantent pour elle.", emo: "joie", not: ["triste", "peur"], why: "Une fête avec ses amis, ça rend content." },
  { who: "pico", e: "🐕", s: "Un très gros chien aboie fort devant Pico.", emo: "peur", not: ["joie", "colere"], why: "Un gros chien qui aboie, ça peut faire peur." },
  { who: "rico", e: "🧱", s: "Rico a construit une tour. Quelqu'un la fait tomber exprès.", emo: "colere", not: ["joie", "peur"], why: "Quand on casse exprès ce qu'on a fait, on se met en colère." },
  { who: "kiki", e: "🎁", s: "Kiki ouvre une boîte… et un clown en sort d'un coup : boing !", emo: "surprise", not: ["triste", "colere"], why: "Quelque chose d'inattendu, ça surprend." },
  { who: "octave", e: "🧸", s: "Octave ne trouve plus son doudou.", emo: "triste", not: ["joie", "surprise"], why: "Perdre son doudou, ça rend triste." },
  { who: "plume", e: "⛈️", s: "Pendant la nuit, il y a un orage avec un énorme tonnerre.", emo: "peur", not: ["joie", "colere"], why: "Le tonnerre très fort, ça peut faire peur." },
  { who: "mona", e: "🎨", s: "Mona a fait un beau dessin, et tout le monde l'applaudit.", emo: "joie", not: ["triste", "peur"], why: "On est content et fier quand on a réussi quelque chose." },
  { who: "basile", e: "⚽", s: "Basile joue au ballon. Un copain le lui arrache des mains.", emo: "colere", not: ["joie", "surprise"], why: "Quand on nous prend nos affaires, on se met en colère." },
  { who: "pico", e: "🎈", s: "Pico trouve un ballon rouge caché sous son oreiller.", emo: "surprise", not: ["triste", "colere"], why: "Il ne s'y attendait pas : c'est une surprise." },
  { who: "octave", e: "🌧️", s: "Octave voulait aller au parc, mais il pleut trop fort.", emo: "decu", not: ["joie", "peur"], why: "Quand ce qu'on espérait n'arrive pas, on est déçu." },
];
const HELP: { who: Who; e: string; s: string; emo: Emo; good: [string, string]; bad: [string, string][]; why: string }[] = [
  { who: "octave", e: "🧸", s: "Octave est triste : il a perdu son doudou.", emo: "triste", good: ["🔎", "l'aider à le chercher"], bad: [["😝", "se moquer de lui"], ["🏃", "partir jouer sans lui"]], why: "Chercher avec lui, ça le console." },
  { who: "mona", e: "🩹", s: "Mona est tombée. Elle s'est fait mal au genou.", emo: "triste", good: ["🤗", "lui faire un câlin et appeler un adulte"], bad: [["😂", "rire"], ["🙈", "faire semblant de ne rien voir"]], why: "Un câlin et un adulte pour soigner, c'est ce qui aide." },
  { who: "rico", e: "🧱", s: "Rico est en colère : sa tour est tombée.", emo: "colere", good: ["🤝", "proposer de la reconstruire ensemble"], bad: [["🦶", "donner un coup de pied dans les cubes"], ["😝", "se moquer de lui"]], why: "Reconstruire ensemble, ça calme la colère." },
  { who: "pico", e: "🌙", s: "Pico a peur du noir.", emo: "peur", good: ["🔦", "lui prêter une lampe de poche"], bad: [["👻", "faire « bouh » pour lui faire peur"], ["🚪", "fermer la porte et partir"]], why: "Avec de la lumière, on a moins peur." },
  { who: "kiki", e: "🛝", s: "Kiki est toute seule dans la cour. Elle a l'air triste.", emo: "triste", good: ["🙋", "l'inviter à jouer"], bad: [["🙈", "faire comme si on ne la voyait pas"], ["🙅", "lui dire qu'elle ne peut pas jouer"]], why: "L'inviter à jouer, c'est gentil : elle ne sera plus seule." },
  { who: "basile", e: "🍦", s: "Basile pleure : sa glace est tombée.", emo: "triste", good: ["🍪", "partager son goûter avec lui"], bad: [["😋", "manger sa glace devant lui"], ["😂", "rire très fort"]], why: "Partager, ça console." },
];
// Goûts différents : on répond selon ce que le personnage aime, pas selon ce que l'enfant aime.
const DESIRS: { who: Who; aime: [string, string]; autre: [string, string]; nAime?: boolean; s: string }[] = [
  { who: "pico", aime: ["🪱", "les vers de terre"], autre: ["🍰", "le gâteau"], s: "Pico le hérisson adore les vers de terre ! Toi, tu préfères sûrement le gâteau… Pico a faim : que va-t-il choisir ?" },
  { who: "plume", aime: ["🌺", "le nectar des fleurs"], autre: ["🍕", "la pizza"], s: "Plume le colibri adore boire le nectar des fleurs. Toi, tu préfères peut-être la pizza. Plume a faim : que va-t-elle choisir ?" },
  { who: "basile", aime: ["🪵", "les branches à ronger"], autre: ["🍫", "le chocolat"], s: "Basile le castor adore ronger des branches, et il n'aime pas le chocolat. Que va-t-il prendre pour le goûter ?" },
  { who: "kiki", aime: ["🚂", "le petit train"], autre: ["🧸", "le nounours"], s: "Kiki préfère les trains aux nounours. Elle peut prendre un jouet : lequel va-t-elle prendre ?" },
  { who: "rico", aime: ["🍎", "la pomme"], autre: ["🍌", "la banane"], nAime: true, s: "Rico n'aime pas du tout les bananes. Il a le choix entre une banane et une pomme. Que va-t-il prendre ?" },
  { who: "mona", aime: ["🌧️", "la pluie"], autre: ["☀️", "le soleil"], s: "Mona la baleine adore quand il pleut sur la mer. Quel temps veut-elle pour sa promenade ?" },
  { who: "octave", aime: ["🐚", "les coquillages"], autre: ["🦋", "les papillons"], s: "Octave la pieuvre collectionne les coquillages. Il peut regarder un livre : celui des coquillages ou celui des papillons. Lequel va-t-il choisir ?" },
];
// Fausse croyance (tâche « Sally et Anne ») : où le personnage va-t-il chercher en premier ?
const OBJETS: { e: string; sa: string; la: string }[] = [
  { e: "⚽", sa: "sa balle", la: "la balle" }, { e: "🧸", sa: "son doudou", la: "le doudou" },
  { e: "🍪", sa: "son biscuit", la: "le biscuit" }, { e: "🚗", sa: "sa petite voiture", la: "la petite voiture" },
];
const CACHETTES: { e: string; nom: string; dans: string }[] = [
  { e: "🧺", nom: "le panier", dans: "dans le panier" }, { e: "📦", nom: "la boîte", dans: "dans la boîte" }, { e: "🗄️", nom: "le tiroir", dans: "dans le tiroir" },
];
// Contenu inattendu (tâche « des bonbons dans la boîte de crayons »).
const CONTENUS: { box: [string, string]; inside: [string, string] }[] = [
  { box: ["🖍️", "des crayons"], inside: ["🍬", "des bonbons"] },
  { box: ["🍪", "des biscuits"], inside: ["🧦", "des chaussettes"] },
  { box: ["🥚", "des œufs"], inside: ["🧩", "des pièces de puzzle"] },
];
// Émotion cachée : on sourit, mais dans son cœur…
const CACHEES: { who: Who; e: string; s: string; emo: Emo; not: Emo[] }[] = [
  { who: "mona", e: "🧦", s: "Mona reçoit des chaussettes en cadeau. Elle voulait un jouet. Elle sourit pour être gentille avec sa mamie. Mais dans son cœur, comment se sent-elle ?", emo: "decu", not: ["joie", "peur"] },
  { who: "basile", e: "🌙", s: "Basile a un peu peur du noir. Devant ses copains, il fait le courageux. Mais dans son cœur, comment se sent-il ?", emo: "peur", not: ["joie", "colere"] },
  { who: "kiki", e: "🎲", s: "Kiki a perdu au jeu. Elle dit « bravo » à son amie avec un sourire. Mais dans son cœur, comment se sent-elle ?", emo: "decu", not: ["joie", "peur"] },
  { who: "rico", e: "💉", s: "Rico va chez le docteur pour un vaccin. Il ne pleure pas et il dit que tout va bien. Mais dans son cœur, comment se sent-il ?", emo: "peur", not: ["joie", "colere"] },
  { who: "octave", e: "🎂", s: "Octave n'est pas invité à l'anniversaire de son copain. Il dit « pas grave ». Mais dans son cœur, comment se sent-il ?", emo: "triste", not: ["joie", "surprise"] },
];

const recent: string[] = [];
function fresh<T>(pool: readonly T[], keyOf: (t: T) => string, r: Rng): T {
  const ok = pool.filter((x) => !recent.includes(keyOf(x)));
  const v = r.pick(ok.length ? ok : pool);
  recent.push(keyOf(v)); if (recent.length > 4) recent.shift();
  return v;
}
const who = (w: Who) => `<span class="who">${medallion(w)}</span>`;

function visage(level: number, r: Rng): TheatreItem {
  const pool: Emo[] = level <= 1 ? ["joie", "triste", "colere", "peur"] : ["joie", "triste", "colere", "peur", "surprise"];
  const target = fresh(pool, (x) => x, r);
  const choices = r.shuffle([target, ...r.shuffle(pool.filter((e) => e !== target)).slice(0, 2)]);
  return { kind: "visage", who: "pico", target, choices, opts: Object.fromEntries(choices.map((c) => [c, faceOpt(c as Emo)])), scene: [], line: "", why: "",
    skill: "COEUR.EMOTIONS", difficulty: level <= 1 ? -0.8 : -0.3, form: "image", guess: 1 / 3, level, prompt: `Touche le visage ${EMO[target].qui}.` };
}
function cause(level: number, r: Rng): TheatreItem {
  const c = fresh(CAUSES, (x) => x.s, r);
  const choices = r.shuffle([c.emo, ...c.not] as string[]);
  return { kind: "cause", who: c.who, target: c.emo, choices, opts: Object.fromEntries(choices.map((x) => [x, faceOpt(x as Emo)])), scene: [c.e], line: c.s, why: c.why,
    skill: "COEUR.CAUSES", difficulty: 0, form: "recit", guess: 1 / 3, level, prompt: `${c.s} Comment se sent ${NAME[c.who]} ?` };
}
function aider(level: number, r: Rng): TheatreItem {
  const c = fresh(HELP, (x) => x.s, r);
  const all: Opt[] = [{ id: "bien", html: emoji(c.good[0]), label: c.good[1] }, ...c.bad.map(([e, l], i) => ({ id: `non${i}`, html: emoji(e), label: l }))];
  const choices = r.shuffle(all.map((o) => o.id));
  const opts = Object.fromEntries(all.map((o) => [o.id, o]));
  return { kind: "aider", who: c.who, target: "bien", choices, opts, scene: [c.e], line: c.s, why: c.why,
    skill: "COEUR.AIDER", difficulty: -0.2, form: "recit", guess: 1 / 3, level,
    prompt: `${c.s} Que peux-tu faire pour l'aider ? ${cap(choices.map((id) => opts[id].label).join(", ou "))} ?` };
}
function desir(level: number, r: Rng): TheatreItem {
  const d = fresh(DESIRS, (x) => x.s, r);
  const all: Opt[] = [{ id: "aime", html: emoji(d.aime[0]), label: d.aime[1] }, { id: "autre", html: emoji(d.autre[0]), label: d.autre[1] }];
  const choices = r.shuffle(all.map((o) => o.id));
  return { kind: "desir", who: d.who, target: "aime", choices, opts: Object.fromEntries(all.map((o) => [o.id, o])), scene: d.nAime ? [`❌${d.autre[0]}`] : [`❤️${d.aime[0]}`], line: d.s,
    why: d.nAime ? `${NAME[d.who]} n'aime pas ${d.autre[1]} : ${il(d.who)} prend ${d.aime[1]}.` : `${NAME[d.who]} aime ${d.aime[1]}, même si toi, tu préfères peut-être autre chose.`,
    skill: "COEUR.DESIRS", difficulty: 0.5, form: "recit", guess: 1 / 2, level, prompt: d.s };
}
function croyance(level: number, r: Rng): TheatreItem {
  const [a, b] = r.shuffle(["rico", "kiki", "basile", "mona", "octave"] as Who[]).slice(0, 2);
  const obj = r.pick(OBJETS);
  const [c1, c2] = r.shuffle(CACHETTES).slice(0, 2);
  const s = `${NAME[a]} range ${obj.sa} ${c1.dans}, puis ${il(a)} sort jouer dehors. Pendant ce temps, ${NAME[b]} met ${obj.la} ${c2.dans}. ${NAME[a]} revient. Où va-t-${il(a)} chercher ${obj.sa} en premier ?`;
  const all: Opt[] = [{ id: "avant", html: emoji(c1.e), label: c1.nom }, { id: "apres", html: emoji(c2.e), label: c2.nom }];
  const choices = r.shuffle(all.map((o) => o.id));
  return { kind: "croyance", who: a, target: "avant", choices, opts: Object.fromEntries(all.map((o) => [o.id, o])), scene: [obj.e, c1.e, c2.e, b], line: s,
    why: `${NAME[a]} n'a pas vu qu'on avait déplacé ${obj.sa}. ${cap(il(a))} croit que c'est toujours ${c1.dans}.`,
    skill: "COEUR.CROYANCE", difficulty: 1.1, form: "recit", guess: 1 / 2, level, prompt: s };
}
const de = (x: string) => (/^[aeiouyéèœh]/i.test(x) ? `d'${x}` : `de ${x}`);
const que = (n: string) => (/^[AEIOUYÉ]/.test(n) ? `qu'${n}` : `que ${n}`);
function contenu(level: number, r: Rng): TheatreItem {
  const c = r.pick(CONTENUS);
  const w = r.pick(["octave", "pico", "rico", "basile"] as Who[]);
  const s = `Voici une boîte ${de(c.box[1].replace(/^des /, ""))}. On regarde dedans… surprise : ce sont ${c.inside[1]} ! ${NAME[w]} arrive. ${cap(il(w))} n'a pas regardé dedans. Qu'est-ce ${que(NAME[w])} croit qu'il y a dans la boîte ?`;
  const all: Opt[] = [{ id: "boite", html: emoji(c.box[0]), label: c.box[1] }, { id: "dedans", html: emoji(c.inside[0]), label: c.inside[1] }];
  const choices = r.shuffle(all.map((o) => o.id));
  return { kind: "contenu", who: w, target: "boite", choices, opts: Object.fromEntries(all.map((o) => [o.id, o])), scene: [c.box[0], c.inside[0]], line: s,
    why: `${NAME[w]} n'a pas regardé dedans : ${il(w)} croit qu'il y a ${c.box[1]}, comme sur le dessin de la boîte.`,
    skill: "COEUR.CROYANCE", difficulty: 1.2, form: "recit", guess: 1 / 2, level, prompt: s };
}
function cachee(level: number, r: Rng): TheatreItem {
  const c = fresh(CACHEES, (x) => x.s, r);
  const choices = r.shuffle([c.emo, ...c.not] as string[]);
  return { kind: "cachee", who: c.who, target: c.emo, choices, opts: Object.fromEntries(choices.map((x) => [x, faceOpt(x as Emo)])), scene: [c.e], line: c.s,
    why: `${cap(il(c.who))} sourit, mais dans son cœur, ${il(c.who)} ${etat(c.who, c.emo)}.`,
    skill: "COEUR.CACHEE", difficulty: 1.6, form: "recit", guess: 1 / 3, level, prompt: c.s };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const theatre: ActivityModule<TheatreItem> = {
  id: "theatre", title: "Le théâtre de Pico", domain: "coeur", island: "coeur", host: "pico",
  maxLevel: 5, items: 5,
  skills: ["COEUR.EMOTIONS", "COEUR.CAUSES", "COEUR.AIDER", "COEUR.DESIRS", "COEUR.CROYANCE", "COEUR.CACHEE"],
  card: emoji("🎭"), pitch: "Le théâtre de Pico, pour comprendre ce que ressentent les autres.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    if (level <= 1) return visage(1, r);
    if (level === 2) return r.next() < 0.5 ? cause(2, r) : r.next() < 0.6 ? aider(2, r) : visage(2, r);
    if (level === 3) return r.next() < 0.5 ? desir(3, r) : r.next() < 0.5 ? aider(3, r) : cause(3, r);
    if (level === 4) return r.next() < 0.65 ? (r.next() < 0.6 ? croyance(4, r) : contenu(4, r)) : desir(4, r);
    return r.next() < 0.6 ? cachee(5, r) : r.next() < 0.5 ? croyance(5, r) : contenu(5, r);
  },

  render(item, view) {
    const sc = item.scene;
    if (item.kind === "croyance") {
      // Bande dessinée en trois cases : on range, quelqu'un déplace, on revient.
      const [obj, c1, c2, other] = sc;
      view.stage.appendChild(h("div", { class: "strip" },
        h("div", { class: "panel strippanel", html: `${who(item.who)}<span class="emo">${obj}</span><span class="arrow">➜</span><span class="emo">${c1}</span>` }),
        h("div", { class: "panel strippanel", html: `${who(other as Who)}<span class="emo">${obj}</span><span class="arrow">➜</span><span class="emo">${c2}</span><span class="out">${medallion(item.who)}</span>` }),
        h("div", { class: "panel strippanel", html: `${who(item.who)}<span class="emo q">?</span>` })));
    } else if (item.kind === "contenu") {
      // Une boîte avec son étiquette (ce qu'elle devrait contenir), puis ouverte (ce qu'elle contient vraiment).
      const box = (open: boolean) => `<span class="lbox${open ? " open" : ""}"><span class="emo">📦</span><span class="badge emo">${sc[0]}</span></span>`;
      view.stage.appendChild(h("div", { class: "strip" },
        h("div", { class: "panel strippanel", html: box(false) }),
        h("div", { class: "panel strippanel", html: `${box(true)}<span class="emo pop">${sc[1]}</span>` }),
        h("div", { class: "panel strippanel", html: `${who(item.who)}${box(false)}<span class="emo q">?</span>` })));
    } else if (item.kind !== "visage") {
      const extra = item.kind === "cachee" ? `<span class="emo">😊</span><span class="emo">💭</span>` : "";
      view.stage.appendChild(h("div", { class: "panel scene", html: `${who(item.who)}<span class="emo">${sc[0]}</span>${extra}` }));
    }
    const row = h("div", { class: "choices" });
    for (const c of item.choices) {
      const o = item.opts[c];
      const withLabel = item.kind === "aider" || item.kind === "desir" || item.kind === "croyance" || item.kind === "contenu";
      const b = h("button", { type: "button", class: `card pickcard${withLabel ? " labelled" : ""}`, "data-t": c, "aria-label": o.label, html: `${o.html}${withLabel ? `<span class="lab">${o.label}</span>` : ""}` });
      b.addEventListener("click", () => {
        const ok = c === item.target;
        view.answer(ok, b, ok ? undefined : retry(item, c));
      });
      row.appendChild(b);
    }
    view.stage.appendChild(row);
  },

  hint(item, step, view) {
    const cards = Array.from(view.stage.querySelectorAll<HTMLElement>("[data-t]"));
    if (step === 1) return item.prompt;
    if (step === 2) {
      if (item.kind === "visage") return hintFace(item.target as Emo);
      if (item.kind === "aider") return "Pense à ce qui te ferait du bien, à toi, si ça t'arrivait.";
      if (item.kind === "desir") return `Ce n'est pas toi qui choisis : c'est ${NAME[item.who]}. Qu'est-ce qu'${il(item.who)} aime ?`;
      if (item.kind === "croyance") return `${NAME[item.who]} était dehors : ${il(item.who)} n'a pas vu ce qui s'est passé. Où croit-${il(item.who)} que c'est ?`;
      if (item.kind === "contenu") return `${NAME[item.who]} n'a pas vu dedans. ${cap(il(item.who))} ne voit que le dessin sur la boîte.`;
      if (item.kind === "cachee") return "Le sourire, c'est pour les autres. Mais à l'intérieur, qu'est-ce qu'on ressent ?";
      return `Et toi, si ça t'arrivait, tu te sentirais comment ?`;
    }
    if (step === 3) {
      const wrong = cards.find((c) => c.dataset.t !== item.target && c.style.opacity !== "0.25");
      if (wrong) { wrong.style.opacity = "0.25"; wrong.style.pointerEvents = "none"; }
      return "Ce n'est pas celle-là. Regarde ce qui reste.";
    }
    const right = cards.find((c) => c.dataset.t === item.target); if (right) glow(right);
    return item.why || "C'est celle qui brille.";
  },

  success(item) {
    if (item.kind === "visage") return `Oui, ce visage ${EMO[item.target as Emo].qui.replace(/^qui /, "")} !`;
    if (item.kind === "cause") return `Oui, ${NAME[item.who]} ${etat(item.who, item.target as Emo)}. ${item.why}`;
    return `Oui ! ${item.why}`;
  },

  sticker(summary) {
    const k = (summary.last as TheatreItem | null)?.kind;
    const deep = k === "croyance" || k === "contenu" || k === "cachee" || k === "desir";
    return { kind: "theatre", ref: deep ? "💭" : "🎭", reason: deep ? "Celle-ci, c'est parce que tu as compris ce que pensent les autres." : "Celle-ci, c'est pour toutes les émotions que tu as reconnues.", svg: emojiStickerSVG(deep ? "💭" : "🎭", "#FBD9E7") };
  },

  tip(item) {
    if (item.kind === "visage") return "faites ensemble la grimace de l'émotion devant un miroir.";
    if (item.kind === "cause" || item.kind === "cachee") return "demandez-lui : « Et toi, quand est-ce que tu as ressenti ça ? »";
    if (item.kind === "aider") return "racontez une fois où quelqu'un vous a aidé quand vous étiez triste.";
    if (item.kind === "desir") return "jouez à « qu'est-ce que papa/maman préfère ? » avec de vrais goûts de la famille.";
    return "rejouez la scène avec deux peluches et une boîte : c'est souvent plus clair avec de vrais objets.";
  },
};

function hintFace(e: Emo) {
  return {
    joie: "Un visage content a un grand sourire.",
    triste: "Un visage triste a la bouche vers le bas, et parfois une larme.",
    colere: "Un visage en colère a les sourcils froncés.",
    peur: "Un visage qui a peur a les yeux grands ouverts et la bouche tremblante.",
    surprise: "Un visage surpris a la bouche ronde comme un O.",
    decu: "Un visage déçu regarde vers le bas.",
  }[e];
}
function retry(item: TheatreItem, c: string): string {
  if (item.kind === "visage") return `Ce visage-là ${EMO[c as Emo].qui.replace(/^qui /, "")}. Cherche celui ${EMO[item.target as Emo].qui}.`;
  if (item.kind === "aider") return `${cap(item.opts[c].label)} ? Ça ne l'aiderait pas. Cherche ce qui lui ferait du bien.`;
  if (item.kind === "desir") return `C'est peut-être ce que toi, tu choisirais. Mais ${NAME[item.who]}, qu'est-ce qu'${il(item.who)} aime ?`;
  if (item.kind === "croyance") return `C'est là que c'est vraiment. Mais ${NAME[item.who]} ne l'a pas vu !`;
  if (item.kind === "contenu") return `C'est ce qu'il y a vraiment. Mais ${NAME[item.who]} n'a pas regardé dedans !`;
  return "Regarde bien la scène, et écoute encore l'histoire.";
}
export const _theatreData = { CAUSES, HELP, DESIRS, CACHEES };
