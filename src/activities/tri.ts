// Île des Découvertes — « Le grand tri » : Basile revient du marché avec ses déchets ; avec Octave, l'enfant les
// glisse dans les bonnes poubelles. Couleurs nationales par défaut (emballages et papiers au bac jaune, verre au bac
// vert, restes de cuisine au bac marron, le reste au bac gris) ; le parent adapte à sa commune (Réglages).
// 1. Le bac jaune et le reste. 2. Le verre. 3. Les restes de cuisine. 4. Les papiers. 5. Les pièges. 6. Le grand tri.
// Chaque phrase dite est écrite ici ; voiceLines() les donne toutes, pour la voix naturelle.
import { app } from "../app";
import type { ActivityModule, Ctx, Item, View } from "../host";
import { defaultTri, type TriSettings } from "../services";
import { h, medallion } from "../ui";
import { sortBoard, type SortBoard } from "./glisser";
import { binSVG, composteurSVG, tartSVG, triStickerSVG, type BinLook } from "./tri_art";

const EMBALLAGES = "DECOUV.TRI.EMBALLAGES", VERRE = "DECOUV.TRI.VERRE", CUISINE = "DECOUV.TRI.CUISINE",
  PAPIERS = "DECOUV.TRI.PAPIERS", PIEGES = "DECOUV.TRI.PIEGES", EXPERT = "DECOUV.TRI.EXPERT";
export type Cat = "emballages" | "verre" | "cuisine" | "papiers" | "reste";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Les déchets de Basile ----------
export interface Thing { id: string; nom: string; cat: Cat; matiere: string; plur?: boolean; trap?: boolean }
const T = (id: string, nom: string, cat: Cat, matiere: string, o: { plur?: boolean; trap?: boolean } = {}): Thing => ({ id, nom, cat, matiere, ...o });
export const THINGS: Thing[] = [
  T("bouteille", "la bouteille en plastique", "emballages", "La bouteille en plastique est un emballage : elle se recycle !"),
  T("canette", "la canette", "emballages", "La canette est un emballage en métal : elle se recycle !"),
  T("carton", "la boîte de céréales", "emballages", "La boîte de céréales est un emballage en carton : elle se recycle !"),
  T("brique", "la brique de lait", "emballages", "La brique de lait est un emballage : elle se recycle !"),
  T("conserve", "la boîte de conserve", "emballages", "La boîte de conserve est un emballage en métal : elle se recycle !"),
  T("yaourt", "le pot de yaourt", "emballages", "Le pot de yaourt est un emballage en plastique : il se recycle !"),
  T("mouchoir", "le mouchoir sale", "reste", "Le mouchoir sale ne se recycle pas."),
  T("couche", "la couche sale", "reste", "La couche sale ne se recycle pas."),
  T("brosse", "la vieille brosse à dents", "reste", "La vieille brosse à dents n'est pas un emballage : elle ne se recycle pas."),
  T("bouteille_verre", "la bouteille en verre", "verre", "La bouteille est en verre : elle se recycle sans fin !"),
  T("confiture", "le pot de confiture", "verre", "Le pot de confiture est en verre."),
  T("bocal", "le bocal de cornichons", "verre", "Le bocal de cornichons est en verre."),
  T("epluchures", "les épluchures", "cuisine", "Les épluchures sont des restes de cuisine : elles deviendront du compost !", { plur: true }),
  T("trognon", "le trognon de pomme", "cuisine", "Le trognon de pomme est un reste de cuisine."),
  T("banane", "la peau de banane", "cuisine", "La peau de banane est un reste de cuisine."),
  T("coquilles", "les coquilles d'œuf", "cuisine", "Les coquilles d'œuf sont des restes de cuisine.", { plur: true }),
  T("journal", "le journal", "papiers", "Le journal est en papier : il se recycle !"),
  T("prospectus", "le prospectus", "papiers", "Le prospectus est en papier : il se recycle !"),
  T("cahier", "le vieux cahier", "papiers", "Le vieux cahier est en papier : il se recycle !"),
  T("enveloppe", "l'enveloppe", "papiers", "L'enveloppe est en papier : elle se recycle !"),
  T("verre_casse", "le verre cassé", "reste", "Un verre à boire cassé n'est pas un emballage : il ne va pas avec les bouteilles.", { trap: true }),
  T("assiette", "l'assiette cassée", "reste", "L'assiette cassée, c'est de la vaisselle : elle ne se recycle pas.", { trap: true }),
  T("couvercle", "le couvercle du bocal", "emballages", "Le couvercle du bocal est en métal : c'est un emballage, il ne va pas avec le verre.", { trap: true }),
  T("film", "le film en plastique", "emballages", "Le film en plastique est un emballage : il se recycle !", { trap: true }),
  T("pizza", "la boîte à pizza", "emballages", "La boîte à pizza est un emballage en carton : elle se recycle, même un peu grasse !", { trap: true }),
  T("jouet", "le jouet cassé", "reste", "Le jouet cassé n'est pas un emballage : il ne va pas dans le bac jaune.", { trap: true }),
];
export const THING: Record<string, Thing> = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// ---------- Les poubelles, selon les réglages ----------
export interface Bin { id: string; nom: string; label: string; purpose: string; look: BinLook | "composteur"; cats: Cat[] }
export const triSettings = (): TriSettings => ({ ...defaultTri(), ...(app.data?.settings?.tri ?? {}) });
export function binsFor(t: TriSettings): Bin[] {
  const paris = t.couleurs === "paris";
  const out: Bin[] = [{
    id: "jaune", nom: "le bac jaune", label: "Bac jaune", look: { body: "#FFD23F", lid: "#E8B400", symbol: "recyclage" },
    cats: t.papiers === "jaune" ? ["emballages", "papiers"] : ["emballages"],
    purpose: t.papiers === "jaune" ? "Le bac jaune, c'est pour les emballages et les papiers." : "Le bac jaune, c'est pour les emballages : en plastique, en métal, en carton.",
  }];
  if (t.papiers === "bleu") out.push({ id: "bleu", nom: "le bac bleu", label: "Bac bleu", look: { body: "#3D8BEA", lid: "#2F6FC0", symbol: "papier" }, cats: ["papiers"], purpose: "Le bac bleu, c'est pour les papiers." });
  out.push({ id: "verre", nom: paris ? "le bac blanc" : "le bac vert", label: paris ? "Bac blanc" : "Bac vert", cats: ["verre"],
    look: paris ? { body: "#F4F1EA", lid: "#CFC8B8", symbol: "verre" } : { body: "#34B37A", lid: "#25915F", symbol: "verre" },
    purpose: `${paris ? "Le bac blanc" : "Le bac vert"}, c'est pour le verre : les bouteilles, les pots et les bocaux.` });
  out.push({ id: "cuisine", nom: t.cuisine === "compost" ? "le composteur" : "le bac marron", label: t.cuisine === "compost" ? "Composteur" : "Bac marron", cats: ["cuisine"],
    look: t.cuisine === "compost" ? "composteur" : { body: "#9B6B43", lid: "#7A5232", symbol: "cuisine" },
    purpose: `${t.cuisine === "compost" ? "Le composteur" : "Le bac marron"}, c'est pour les restes de cuisine.` });
  out.push({ id: "reste", nom: paris ? "le bac vert" : "le bac gris", label: paris ? "Bac vert" : "Bac gris", cats: ["reste"],
    look: paris ? { body: "#34B37A", lid: "#25915F", symbol: "reste" } : { body: "#8A8F9C", lid: "#6B7080", symbol: "reste" },
    purpose: `${paris ? "Le bac vert" : "Le bac gris"}, c'est pour ce qui ne se recycle pas.` });
  return out;
}
const binOf = (bins: Bin[], cat: Cat) => bins.find((b) => b.cats.includes(cat))!;
const goesTo = (t: Thing, b: Bin) => `${cap(t.nom)} ${t.plur ? "vont" : "va"} dans ${b.nom}.`;
const showMe = (t: Thing) => `Je te montre où ${t.plur ? "vont" : "va"} ${t.nom}.`;

// ---------- Les niveaux ----------
interface Lvl { chap: string; cats: Cat[]; n: number; need: Cat[]; traps: number; d: number; prompt: string }
const ALL: Cat[] = ["emballages", "papiers", "verre", "cuisine", "reste"];
const LEVELS: Lvl[] = [
  { chap: EMBALLAGES, cats: ["emballages", "reste"], n: 3, need: ["emballages", "reste"], traps: 0, d: -0.4,
    prompt: "Basile revient du marché. Aide-le à trier ses déchets : glisse chacun dans la bonne poubelle !" },
  { chap: VERRE, cats: ["emballages", "verre", "reste"], n: 3, need: ["verre"], traps: 0, d: -0.1,
    prompt: "Il y a aussi du verre ! Glisse chaque déchet dans la bonne poubelle." },
  { chap: CUISINE, cats: ["emballages", "verre", "cuisine", "reste"], n: 4, need: ["cuisine", "cuisine"], traps: 0, d: 0.2,
    prompt: "Basile a fait la cuisine. Trie ses déchets, et les restes de cuisine aussi !" },
  { chap: PAPIERS, cats: ALL, n: 4, need: ["papiers", "papiers"], traps: 0, d: 0.3,
    prompt: "Voici des papiers, avec les emballages. Glisse chaque déchet dans la bonne poubelle." },
  { chap: PIEGES, cats: ALL, n: 4, need: [], traps: 2, d: 0.9,
    prompt: "Attention aux pièges ! Glisse chaque déchet dans la bonne poubelle." },
  { chap: EXPERT, cats: ALL, n: 5, need: [], traps: 1, d: 1.0,
    prompt: "Le grand tri de Basile ! Glisse chaque déchet dans la bonne poubelle." },
];
const WIN = "Tout est bien trié : Basile est ravi !";
const WIN_EXPERT = "Le grand tri est fini : tout est à sa place !";

export interface TriItem extends Item {
  kind: "tri"; key: string; chap: string; things: string[]; bins: string[]; answers: Record<string, string>; target: string; win: string;
}

// Présentations des chapitres (une fois par séance, tant que c'est nouveau) : elles nomment les poubelles de chez vous.
export function introText(chap: string, t: TriSettings): string {
  const b = binsFor(t), of = (c: Cat) => binOf(b, c).nom;
  switch (chap) {
    case EMBALLAGES: return `Basile revient du marché avec plein d'emballages vides. Octave lui montre : les emballages vont dans le bac jaune, pour être recyclés. Ce qui ne se recycle pas va dans ${of("reste")}.`;
    case VERRE: return `Les bouteilles, les pots et les bocaux en verre vont dans ${of("verre")}. Le verre se recycle sans fin : on en refait des bouteilles !`;
    case CUISINE: return `Les restes de cuisine, comme les épluchures, vont dans ${of("cuisine")}. Ils deviennent du compost, une terre très bonne pour les plantes !`;
    case PAPIERS: return `On recycle aussi les papiers : les journaux, les cahiers, les prospectus… Ils vont dans ${of("papiers")}.`;
    case PIEGES: return "Attention aux pièges ! Un verre à boire cassé ne va pas avec les bouteilles, et le couvercle en métal d'un bocal va dans le bac jaune.";
    default: return "Tu connais toutes les poubelles ! Aide Basile à faire le grand tri.";
  }
}
const introShown = new WeakMap<Ctx, Set<string>>();

export function makeTri(lv: number, r: { next: () => number; pick: <T>(a: T[]) => T; shuffle: <T>(a: T[]) => T[] }, t: TriSettings): TriItem {
  const L = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, lv - 1))];
  const bins = binsFor(t);
  const shown = bins.filter((b) => b.cats.some((c) => L.cats.includes(c)));
  const ok = (x: Thing) => L.cats.includes(x.cat) && (L.traps > 0 || !x.trap);
  const chosen: Thing[] = [];
  const take = (pool: Thing[]) => { const c = r.shuffle(pool.filter((x) => !chosen.includes(x))); if (c.length) chosen.push(c[0]); };
  for (let k = 0; k < L.traps; k++) take(THINGS.filter((x) => x.trap));
  for (const c of L.need) take(THINGS.filter((x) => x.cat === c && !x.trap));
  while (chosen.length < L.n) take(THINGS.filter(ok));
  const things = r.shuffle(chosen).map((x) => x.id);
  const answers = Object.fromEntries(things.map((id) => [id, binOf(bins, THING[id].cat).id]));
  return { kind: "tri", key: `tri:${things.join(",")}`, chap: L.chap, skill: L.chap, difficulty: L.d, form: "manipulation",
    guess: Math.pow(1 / shown.length, things.length), level: lv, things, bins: shown.map((b) => b.id), answers, target: things[0],
    prompt: L.prompt, win: L.chap === EXPERT ? WIN_EXPERT : WIN };
}

// ---------- Le plateau : les déchets de Basile en haut, les poubelles en bas (on glisse vers le bas, comme on jette) ----------
export const binArt = (b: Bin) => b.look === "composteur" ? composteurSVG() : binSVG(b.look);
function renderTri(item: TriItem, view: View) {
  const all = binsFor(triSettings());
  const bins = all.filter((b) => item.bins.includes(b.id));
  (view.stage as any)._tri = sortBoard(view, {
    zones: bins.map((b) => ({ id: b.id, label: b.label, art: binArt(b), say: b.purpose })),
    things: item.things.map((id) => ({ id, art: tartSVG(id), name: cap(THING[id].nom) })),
    answers: item.answers, head: medallion("basile", true),
    wrong: (id, binId) => `${all.find((x) => x.id === binId)!.purpose} ${THING[id].matiere}`,
  });
}

const recent: string[] = [];

export const tri: ActivityModule<TriItem> = {
  id: "tri", title: "Le grand tri", domain: "decouvertes", island: "decouvertes", host: "octave",
  maxLevel: 6, items: 6,
  skills: [EMBALLAGES, VERRE, CUISINE, PAPIERS, PIEGES, EXPERT],
  card: `<span style="display:block;width:1.05em;height:1.05em">${binSVG({ body: "#FFD23F", lid: "#E8B400", symbol: "recyclage" })}</span>`,
  pitch: "Le grand tri, pour aider Basile à mettre chaque déchet dans la bonne poubelle.",
  startLevel: () => 1,

  generate(level, ctx) {
    const r = ctx.rng;
    let it: TriItem | null = null;
    for (let t = 0; t < 6; t++) {
      // Une manche sur trois revient sur un chapitre déjà vu.
      const lv = level > 1 && r.next() < 0.3 ? 1 + Math.floor(r.next() * (level - 1)) : level;
      it = makeTri(lv, r, triSettings());
      if (!recent.includes(it.key)) break;
    }
    recent.push(it!.key); if (recent.length > 4) recent.shift();
    return { ...it!, level };
  },

  intro(item, ctx) {
    const seen = introShown.get(ctx) ?? new Set<string>();
    introShown.set(ctx, seen);
    if (seen.has(item.chap) || (ctx.profile.skills[item.chap]?.n ?? 0) >= 6) return null;
    seen.add(item.chap);
    const bins = binsFor(triSettings());
    const show: Record<string, Cat[]> = { [EMBALLAGES]: ["emballages", "reste"], [VERRE]: ["verre"], [CUISINE]: ["cuisine"], [PAPIERS]: ["papiers"], [PIEGES]: ["emballages", "verre"], [EXPERT]: ["emballages", "verre", "cuisine", "reste"] };
    const el = h("div", { class: "panel wpanel wintro" },
      h("span", { class: "wwho", html: medallion("octave") }), h("span", { class: "wwho", html: medallion("basile") }),
      ...[...new Set((show[item.chap] ?? []).map((c) => binOf(bins, c)))].map((b) => h("span", { class: "tbinart small", html: binArt(b) })));
    return { text: introText(item.chap, triSettings()), el };
  },

  render(item, view) { renderTri(item, view); },

  hint(item, step, view) {
    const board = (view.stage as any)._tri as SortBoard | undefined;
    const id = board?.current() ?? item.things[0];
    const t = THING[id];
    if (step === 1) return item.prompt;
    if (step === 2) return t.matiere;
    if (step === 3) { board?.show(id); return showMe(t); }
    // On range le déchet en le disant ; si c'était le dernier, la fête attend la fin de la phrase.
    const said = view.say(goesTo(t, binOf(binsFor(triSettings()), t.cat)));
    board?.place(id, said);
    return "";
  },

  success(item) { return item.win; },

  sticker(summary) {
    const chap = (summary.last as TriItem | null)?.chap;
    if (chap === PIEGES || chap === EXPERT)
      return { kind: "tri", ref: "expert", reason: "Celle-ci, c'est la médaille du grand tri : tu as déjoué tous les pièges !", svg: triStickerSVG("expert") };
    return { kind: "tri", ref: "jaune", reason: "Celle-ci, c'est parce que tu sais choisir la bonne poubelle.", svg: triStickerSVG() };
  },

  tip(item) {
    switch (item.chap) {
      case EMBALLAGES: return "pas besoin de laver les emballages : il suffit de bien les vider avant de les trier.";
      case VERRE: return "le verre se recycle sans fin ; mais la vaisselle, les verres à boire et les miroirs ne vont pas avec le verre.";
      case CUISINE: return "depuis 2024, chaque commune propose une solution pour les restes de cuisine : bac marron ou composteur.";
      case PAPIERS: return "depuis 2023, tous les emballages et tous les papiers se trient, partout en France.";
      case PIEGES: return "en cas de doute, l'application gratuite Guide du tri, de Citeo, donne les consignes de votre commune.";
      default: return "ce soir, faites trier ensemble les déchets du dîner : c'est le meilleur entraînement !";
    }
  },
};

// Toutes les phrases que l'activité peut dire (pour la voix naturelle), pour tous les réglages possibles.
export function voiceLines(): { fam: string; text: string }[] {
  const seen = new Set<string>(), out: { fam: string; text: string }[] = [];
  const add = (fam: string, text: string) => { if (!seen.has(text)) { seen.add(text); out.push({ fam: `tri:${fam}`, text }); } };
  for (const L of LEVELS) add("consigne", L.prompt);
  add("reussite", WIN); add("reussite", WIN_EXPERT);
  for (const t of THINGS) { add("rendu", `${cap(t.nom)}.`); add("indice", t.matiere); add("indice", showMe(t)); }
  for (const papiers of ["jaune", "bleu"] as const) for (const cuisine of ["marron", "compost"] as const) for (const couleurs of ["nationales", "paris"] as const) {
    const s: TriSettings = { papiers, cuisine, couleurs };
    const bins = binsFor(s);
    for (const chap of [EMBALLAGES, VERRE, CUISINE, PAPIERS, PIEGES, EXPERT]) add("intro", introText(chap, s));
    for (const b of bins) add("rendu", b.purpose);
    for (const t of THINGS) {
      add("indice", goesTo(t, binOf(bins, t.cat)));
      for (const b of bins) if (!b.cats.includes(t.cat)) add("erreur", `${b.purpose} ${t.matiere}`);
    }
  }
  return out;
}
export const _triData = { THINGS, LEVELS, binsFor, binOf, makeTri };
