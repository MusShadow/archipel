// Écrans de l'enfant : accueil, carte de l'archipel, gommettes, coin calme, carnet, coucher du soleil.
import { ACTIVITIES, ISLAND_SPOKEN, META_BY_ID, stickerArt } from "../activities";
import { app } from "../app";
import { FACES, ISLANDS } from "../art_static";
import { DEFIS, knownSet } from "../content";
import { makeRng, suggestMissions, type ActivityId, type DomainId } from "../core";
import { DRAWING_BY_ID, drawingSVG } from "../drawings";
import { emoji } from "../lexique";
import { FLAG_BY_CODE, cap, flagSVG } from "../flags";
import { activityScreen, isAvailable, type ActivityModule, type RoundSummary, type StickerSpec } from "../host";
import type { IleId } from "../design/jetons";
import { ilesV2 } from "../iles";
import { nav } from "../nav";
import { sfx, speech, voice, type Profile } from "../services";
import { ICON_PATHS, fly, h, icon, medallion, roundBtn, sleep, wobble } from "../ui";
import { longPress, parentGate, sheet } from "./common";
import { grandDepart } from "./depart";
import { PLUME_CADRE, bienvenueIle, ecranIle, plumeAnime } from "./ile";
import { compagnonHTML, imgEl, imgHTML, srcDe } from "../design/dessins";
import { bullePlume, ruban } from "../design/composants";
import { ELEMENTS, PERSONNAGES } from "../illustrations";
import { drawPicker, gallery, mirrorScreen, showDrawing } from "./draw";
import { storyShelf } from "./histoires";
import { myFlagSVG, myFlagScreen } from "./myflag";

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const MOON = '<svg viewBox="0 0 40 40" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="20" cy="20" r="19" fill="#273043"/><path d="M24 8 A13 13 0 1 0 32 28 A10 10 0 1 1 24 8 Z" fill="#FFC145"/></svg>';
const PICO = `<svg viewBox="0 0 84 84" aria-hidden="true" style="display:block;width:100%;height:100%">${FACES.pico ?? ""}</svg>`;

export function registerChildScreens() {
  nav.start = startScreen;
  nav.map = () => mapScreen();
}

// ---------- Accueil : qui part en voyage ? ----------
export function startScreen() {
  const d = app.data;
  if (!d.profiles.length) { nav.setup(); return; }
  if (app.session) app.endSession();
  const kids = h("div", { class: "kids" });
  const lock = h("button", { type: "button", class: "lockbtn", "aria-label": "Espace parent : maintenir appuyé" },
    h("span", { class: "ring" }, h("span", { style: "width:30px;height:30px;display:flex;align-items:center;justify-content:center", html: icon("lock", "#273043", 2.2) })),
    h("span", {}, "Parent : maintenir"));
  // La plage (livraison 2) : Plume accueille, chaque enfant retrouve son compagnon coiffé de son chapeau.
  const screen = h("div", { class: "screen start plage" },
    imgEl("accueil/plage", "plage-fond"),
    h("div", { class: "plage-plume" }, plumeAnime(0.74)),
    h("h1", { class: "title" }, "Archipel"),
    h("div", { class: "sub" }, ruban({ texte: "Qui part en voyage ?", ile: "port" })),
    kids, lock);
  for (const p of d.profiles) {
    const resting = (p.restUntil ?? 0) > Date.now();
    const b = h("button", { type: "button", class: "kid", "aria-label": resting ? `${p.name}, Plume se repose` : p.name },
      h("span", { class: "av", html: compagnonHTML(p.avatar, p.color) }),
      h("span", { class: "nm" }, p.name),
      resting ? h("span", { class: "moon", html: MOON }) : null);
    b.addEventListener("click", () => choose(p, resting));
    kids.appendChild(b);
  }
  longPress(lock, 1200, () => parentGate(screen, () => nav.parent()));

  function choose(p: Profile, resting: boolean) {
    sfx.unlock(true); sfx.tap();
    if (!resting) { begin(p); return; }
    const until = new Date(p.restUntil!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    speech.say(`Plume se repose, ${p.name}. On repart en voyage plus tard !`);
    const s = sheet(screen,
      h("div", { class: "sheet-perso", html: imgHTML("plume-pense") }),
      h("p", { class: "title", style: "font-size:max(24px,calc(var(--u) * 34));margin:0" }, "Plume se repose. On repart plus tard !"),
      h("p", { class: "muted", style: "margin:0" }, `Pause jusqu'à ${until}. Un adulte peut ouvrir une nouvelle séance.`),
      h("div", { class: "row" },
        h("button", { type: "button", class: "bigbtn alt", onclick: () => s.close() }, "D'accord"),
        h("button", {
          type: "button", class: "bigbtn", onclick: () => {
            s.close();
            parentGate(screen, () => { p.restUntil = undefined; app.save(); begin(p); }, "Nouvelle séance");
          },
        }, "Adulte : débloquer")));
  }
  function begin(p: Profile) {
    d.activeId = p.id;
    app.save();
    app.startSession();
    if (!p.departDone) grandDepart(p, () => mapScreen(), (back) => calmScreen(back));
    else mapScreen();
  }
  app.show(screen);
}

// ---------- Carte de l'archipel ----------
// En portrait, les îles sont redistribuées sur deux colonnes (même dessin, autre position).
const PORTRAIT: Record<string, [number, number]> = { mots: [410, 285], nombres: [215, 510], enigmes: [612, 500], coeur: [228, 740], atelier: [602, 750], port: [200, 975], decouvertes: [608, 965] };
const isPortrait = () => window.innerHeight > window.innerWidth * 1.1;
// Le soleil de la séance glisse sur son arc ; la lune attend au bout (livraison 2 : soleil et lune de l'atelier).
function sunSVG(f: number, portrait = false) {
  const SUN = { cx: portrait ? 430 : 590, cy: 92, rx: 120, ry: 62 };
  const a = Math.PI * (1 - f);
  const sx = SUN.cx + SUN.rx * Math.cos(a), sy = SUN.cy - SUN.ry * Math.sin(a);
  const P = (x: number) => x.toFixed(1);
  let s = "";
  if (f > 0.01) s += `<path d="M${SUN.cx - SUN.rx} ${SUN.cy} A${SUN.rx} ${SUN.ry} 0 0 1 ${P(sx)} ${P(sy)}" fill="none" stroke="#FFC145" stroke-width="6" stroke-linecap="round"/>`;
  if (f < 0.99) s += `<path d="M${P(sx)} ${P(sy)} A${SUN.rx} ${SUN.ry} 0 0 1 ${SUN.cx + SUN.rx} ${SUN.cy}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.1 12"/>`;
  const astre = (nom: string, x: number, y: number, k: number, cx: number, cy: number) => {
    const im = ELEMENTS[nom];
    if (!im) return "";
    const [bx, by, bw, bh] = im.boite;
    return `<image href="${srcDe(im)}" x="${P(x + (bx - cx) * k)}" y="${P(y + (by - cy) * k)}" width="${P(bw * k)}" height="${P(bh * k)}"/>`;
  };
  s += astre("carte/lune", SUN.cx + SUN.rx, SUN.cy, 0.42, 50, 50);
  s += astre("carte/soleil", sx, sy, 0.72, 50, 50);
  return s;
}

const CHECK = '<svg viewBox="0 0 34 34" aria-hidden="true" style="display:block;width:100%;height:100%"><circle cx="17" cy="17" r="15" fill="#34B37A" stroke="#fff" stroke-width="3"/><path d="M9 17 l5 5 l10 -10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const icone = (nom: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" class="a-ico">${ICON_PATHS[nom] ?? ""}</svg>`;

// Une île de la carte : son dessin (atelier), son nom, l'anneau de la mission, la coche d'une île visitée.
function ileCarte(isl: (typeof ISLANDS)[number], [cx, cy]: [number, number], o: { mission: boolean; sleeping: boolean; done: boolean }): HTMLElement {
  const im = ELEMENTS[`carte/ile-${isl.id}`];
  const [bx, by, bw, bh] = im.boite;
  const [fx, fy] = im.points!.centre;
  const x0 = cx - (bx + fx * bw) + bx, y0 = cy - (by + fy * bh) + by; // coin de l'image sur la carte
  const ox = fx * bw, oy = fy * bh; // centre de l'île dans le bouton
  const aria = `${isl.label}${o.sleeping ? ", endormie" : ""}${o.mission ? ", mission proposée" : ""}${o.done ? ", déjà visitée" : ""}`;
  const rx = isl.rx + 30, ry = isl.ry + 30;
  return h("button", { type: "button", class: `ile-carte${o.sleeping ? " sleep" : ""}${o.mission ? " mission" : ""}`, "data-isl": isl.id, "aria-label": aria,
    style: `left:${x0}px;top:${y0}px;width:${bw}px;height:${bh}px` },
    o.mission ? h("span", { class: "ile-anneau", style: `left:${ox - rx}px;top:${oy - ry + 10}px;width:${2 * rx}px;height:${2 * ry}px`,
      html: `<svg viewBox="0 0 ${2 * rx} ${2 * ry}" aria-hidden="true"><ellipse cx="${rx}" cy="${ry}" rx="${rx - 5}" ry="${ry - 5}"/></svg>` }) : null,
    h("img", { class: "ile-img", src: srcDe(im), alt: "", draggable: "false" }),
    o.done ? h("span", { class: "ile-fait", style: `left:${ox + isl.rx * 0.62}px;top:${oy - isl.ry * 0.95}px`, html: CHECK }) : null,
    o.sleeping ? h("span", { class: "zzz", style: `left:${ox - isl.rx * 0.6}px;top:${oy - isl.ry}px` }, h("i", null, "z"), h("i", null, "z")) : null,
    h("span", { class: "ile-nom", style: `left:${ox}px;top:${oy + isl.ry + 30}px` }, h("i", { style: `background:${isl.color}` }), isl.label));
}

// Ce qu'on trouve sur chaque île : les activités d'exercices, et quelques écrans à part (dessin, miroir,
// histoires, drapeau de son île, coin calme).
interface Entry {
  id: string; island: string; title: string; card: string; pitch: string;
  mod?: ActivityModule<any>; open?: (back: (sticker?: StickerSpec) => void) => void;
  available?: (p: Profile) => boolean; lockedReason?: string;
  plan?: { id: ActivityId; domain: DomainId; skills: string[] };
}
const MIRROR_CARD = `<svg viewBox="0 0 60 44" aria-hidden="true" style="display:block;width:1.3em;height:.95em"><path d="M30 4 V40" stroke="#5B6475" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/><path d="M28 22 C20 6 6 8 6 18 C6 28 18 30 28 26" fill="#8C6BE0" stroke="#273043" stroke-width="2"/><path d="M32 22 C40 6 54 8 54 18 C54 28 42 30 32 26" fill="#8C6BE0" stroke="#273043" stroke-width="2"/></svg>`;
function entries(p: Profile): Entry[] {
  const mods: Entry[] = ACTIVITIES.map((a) => ({ id: a.id, island: a.island, title: a.title, card: a.card, pitch: a.pitch, mod: a, available: a.available ? (q: Profile) => a.available!(q) : undefined, lockedReason: a.lockedReason, plan: { id: a.id, domain: a.domain, skills: a.skills } }));
  const flag = p.myFlag ?? { layout: "v3", colors: ["bleu", "jaune", "vert"], symbol: "etoile", symbolColor: "blanc" };
  return [...mods,
    { id: "dessin", island: "atelier", title: "Dessine pas à pas", card: `<span style="display:block;width:1.1em;height:1.1em">${drawingSVG(DRAWING_BY_ID.chat, { stroke: 3 })}</span>`, pitch: "Dessine pas à pas, pour apprendre à faire de vrais dessins avec Kiki.", open: (back) => drawPicker(back), plan: { id: "dessin", domain: "atelier", skills: META_BY_ID.dessin.skills } },
    { id: "miroir", island: "atelier", title: "Le miroir de Kiki", card: MIRROR_CARD, pitch: "Le miroir de Kiki, pour dessiner des deux côtés à la fois.", open: (back) => mirrorScreen(() => back()) },
    { id: "histoires", island: "mots", title: "Mes histoires", card: emoji("📖"), pitch: "Mes histoires, pour lire les histoires écrites rien que pour toi.", available: (q) => q.stories.length > 0, lockedReason: "Demande à un adulte de t'écrire une histoire, dans l'espace parent.", open: (back) => storyShelf(back), plan: { id: "histoires", domain: "lecture", skills: META_BY_ID.histoires.skills } },
    { id: "monDrapeau", island: "port", title: "Le drapeau de mon île", card: `<span style="display:block;width:1.3em;height:.9em">${myFlagSVG(flag)}</span>`, pitch: "Le drapeau de ton île, pour inventer ton propre drapeau.", open: (back) => myFlagScreen(() => back()) },
    { id: "calme", island: "coeur", title: "Le coin calme", card: `<span style="display:block;width:1em;height:1em">${PICO}</span>`, pitch: "Le coin calme, pour respirer avec Pico.", open: (back) => calmScreen(() => back()) },
  ];
}
const islandOf = (id: string) => META_BY_ID[id]?.island ?? "";
const ok = (e: Entry, p: Profile) => !e.available || e.available(p);

// Missions du jour : deux activités choisies par le planificateur (révisions dues, compétences « à la frontière »,
// équilibre entre domaines, objectifs du parent), sur deux îles différentes si possible.
function missionsFor(p: Profile): string[] {
  const list = entries(p).filter((e) => e.plan && ok(e, p));
  const plan = suggestMissions({
    activities: list.map((e) => e.plan!),
    skills: p.skills, minutesByDomain: app.minutesThisWeek(p), goals: p.goals, now: Date.now(),
  }, Math.random, list.length);
  const out: string[] = [];
  for (const id of plan) if (out.length < 2 && !out.some((o) => islandOf(o) === islandOf(id))) out.push(id);
  return out;
}

let lastLine = "";
function say(line: string) { lastLine = line; return speech.say(line); }

export function mapScreen(after?: { sticker?: StickerSpec }) {
  const p = app.profile;
  if (!p) { nav.start(); return; }
  if (!app.session) app.startSession();
  const s = app.session!;
  if (app.timeUp() && !after?.sticker) { sessionEnd(); return; }

  const all = entries(p);
  const active = new Set(all.map((e) => e.island));
  const missionActs = missionsFor(p);
  const missions = missionActs.map(islandOf);
  const visited = s.activities.map(islandOf);
  // La carte (livraison 2) : la mer, les sept îles dessinées à leur place, Plume qui vole vers la mission proposée.
  const wrap = h("div", { class: "mapwrap carte" });
  const mer = imgEl("carte/mer", "carte-mer");
  const cadre = h("div", { class: "carte-cadre" });
  wrap.append(mer, cadre);
  let portrait = isPortrait();
  let plumeVole: HTMLElement | null = null;
  const draw = () => {
    const [L, H] = portrait ? [820, 1180] : [1180, 820];
    cadre.style.width = `${L}px`; cadre.style.height = `${H}px`;
    const pos = (isl: (typeof ISLANDS)[number]): [number, number] => (portrait ? PORTRAIT[isl.id] : [isl.cx, isl.cy]);
    const iles = ISLANDS.map((isl) => ileCarte(isl, pos(isl), { mission: missions.includes(isl.id), sleeping: !active.has(isl.id), done: visited.includes(isl.id) }));
    const ciel = h("div", { class: "carte-ciel", "aria-hidden": "true",
      html: `<svg viewBox="0 0 ${L} ${H}" width="${L}" height="${H}"><g id="sun">${sunSVG(app.sessionFraction(), portrait)}</g></svg>` });
    // Plume part de son perchoir (en haut à gauche) et vole vers la première mission ; sa bulle la suit.
    // Elle se pose au-dessus de l'île (en haut à droite, sous le soleil pour l'île des Mots) : le nom reste lisible.
    const cible = ISLANDS.find((i) => i.id === missions[0]);
    const depart: [number, number] = portrait ? [150, 170] : [330, 150];
    const perche = (i: (typeof ISLANDS)[number]): [number, number] => {
      const [x, y] = pos(i);
      return i.id === "mots" && !portrait ? [x - i.rx * 0.9, y - i.ry] : [x + i.rx * 0.35, y - i.ry - 20];
    };
    const arrivee: [number, number] = cible ? perche(cible) : depart;
    const e = 0.42, f = e / (PERSONNAGES["plume-piece-corps"].echelle ?? 0.9);
    const vol = plumeAnime(e);
    vol.style.cssText = `position:absolute;left:${-PLUME_CADRE.ax * f}px;top:${-PLUME_CADRE.ay * f}px;width:${PLUME_CADRE.l * f}px;height:${PLUME_CADRE.h * f}px`;
    // la bulle se met du côté où il y a de la place (jamais sous les boutons du haut)
    const aDroite = arrivee[0] < L * 0.62;
    const bulle = bullePlume({ queue: aDroite ? "gauche" : "droite" });
    bulle.dataset.plume = "1";
    bulle.style.cssText = aDroite ? "position:absolute;left:52px;top:-96px" : "position:absolute;right:56px;top:-96px";
    plumeVole = h("div", { class: "carte-plume" }, vol, bulle);
    const placer = (x: number, y: number) => { plumeVole!.style.transform = `translate(${x}px,${y}px)`; };
    placer(...depart);
    cadre.replaceChildren(...iles, ciel, plumeVole);
    const reduit = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduit) placer(...arrivee);
    else requestAnimationFrame(() => requestAnimationFrame(() => { plumeVole?.classList.add("en-vol"); placer(...arrivee); }));
    ajuster();
  };
  const ajuster = () => {
    const W = wrap.clientWidth || window.innerWidth, H = wrap.clientHeight || window.innerHeight;
    const k = portrait ? Math.min(W / 820, H / 1180) : Math.min(W / 1180, H / 820);
    cadre.style.transform = `translate(-50%, -50%) scale(${k})`;
  };
  draw();
  const onResize = () => { if (isPortrait() !== portrait) { portrait = !portrait; draw(); } else ajuster(); };
  window.addEventListener("resize", onResize);
  requestAnimationFrame(ajuster);

  const hud = (cls: string, aria: string, rond: string, cap: string) =>
    h("button", { type: "button", class: `hudbtn ${cls}`, "aria-label": aria }, h("span", { class: "a-rond", html: rond }), h("span", { class: "cap" }, cap));
  const carnetBtn = hud("hud-carnet", "Ouvrir mon carnet d'explorateur", icone("book"), "Carnet");
  const calmBtn = hud("hud-calme", "Aller au coin calme", icone("leaf"), "Coin calme");
  const meBtn = hud("hud-moi", `${p.name} : arrêter le voyage`, compagnonHTML(p.avatar, p.color), p.name);
  const screen = h("div", { class: "screen" }, wrap,
    h("div", { class: "hud l" }, meBtn),
    h("div", { class: "hud r" }, carnetBtn, calmBtn),
    app.data.settings.accompanied ? h("div", { class: "tip maptip" }, h("span", { class: "ic", html: icon("sound", "#12737B", 2) }), h("span", { html: "<b>Astuce parent</b> : laissez-le choisir parmi les îles entourées ; Plume les annonce à voix haute." })) : null);

  let leaving = false;
  const timer = window.setInterval(() => {
    const sunG = wrap.querySelector("#sun");
    if (sunG) sunG.innerHTML = sunSVG(app.sessionFraction(), portrait);
    if (app.timeUp() && !leaving && !screen.querySelector(".overlay")) {
      leaving = true;
      say("Le soleil se couche sur l'archipel…").then(() => sleep(400)).then(() => sessionEnd());
    }
  }, 3000);

  const go = (fn: () => void) => { if (leaving) return; leaving = true; fn(); };
  wrap.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t.closest("[data-plume]")) { sfx.tap(); say(lastLine || "Choisis une île !"); return; }
    const g = t.closest("[data-isl]");
    if (g) tapIsland(g.getAttribute("data-isl")!, g);
  });
  carnetBtn.addEventListener("click", () => { sfx.tap(); go(() => carnetScreen(() => mapScreen())); });
  calmBtn.addEventListener("click", () => { sfx.tap(); go(() => calmScreen(() => mapScreen())); });
  meBtn.addEventListener("click", () => {
    sfx.tap();
    say(`Tu veux arrêter le voyage, ${p.name} ?`);
    const sh = sheet(screen,
      h("p", { class: "title", style: "font-size:max(24px,calc(var(--u) * 34));margin:0" }, "Arrêter le voyage ?"),
      h("div", { class: "row" },
        h("button", { type: "button", class: "bigbtn", onclick: () => { sh.close(); go(() => sessionEnd({ early: true })); } }, "Oui, on range"),
        h("button", { type: "button", class: "bigbtn alt", onclick: () => sh.close() }, "Non, je joue")));
  });

  function tapIsland(id: string, g: Element) {
    g.classList.remove("tapped"); void (g as HTMLElement).offsetWidth; g.classList.add("tapped");
    const acts = all.filter((e) => e.island === id);
    if (!acts.length) { sfx.soft(); say(`${cap(ISLAND_SPOKEN[id])} dort encore. Elle se réveillera bientôt !`); return; }
    sfx.tap();
    const advised = acts.find((a) => missionActs.includes(a.id)) ?? acts.find((a) => a.plan && ok(a, p!)) ?? acts.find((a) => ok(a, p!));
    // Île dessinée (livraison 2 : l'île des Nombres) : son écran, où chaque lieu ouvre son activité.
    if (dessinee(id, acts)) { go(() => islandScreen(id as IleId, acts, advised)); return; }
    if (acts.length === 1 && ok(acts[0], p!)) { go(() => open(acts[0])); return; }
    islandSheet(id, acts, advised);
  }

  // Une île, plusieurs activités : l'enfant choisit ; celle que Plume conseille est entourée.
  function islandSheet(id: string, acts: Entry[], advised: Entry | undefined) {
    const isl = ISLANDS.find((x) => x.id === id)!;
    const cards = acts.map((a) => {
      const can = ok(a, p!);
      const b = h("button", { type: "button", class: `actcard${can ? "" : " locked"}${a === advised ? " advised" : ""}`, "data-act": a.id, "aria-label": can ? a.title : `${a.title}, pas encore ouverte` },
        h("span", { class: "actart", html: a.card }),
        h("span", { class: "acttitle" }, a.title),
        a === advised ? h("span", { class: "advice" }, "Plume conseille") : null,
        can ? null : h("span", { class: "lockic", html: icon("lock", "#5B6475", 2.2) }));
      b.addEventListener("click", () => {
        if (!can) { sfx.soft(); say(a.lockedReason ?? "Cette activité s'ouvrira bientôt."); return; }
        sfx.tap(); sh.close(); go(() => open(a));
      });
      return b;
    });
    const sh = sheet(screen,
      h("div", { class: "row", style: "gap:12px" },
        h("span", { style: "width:max(56px,calc(var(--u) * 72));height:max(56px,calc(var(--u) * 72));display:block", html: medallion(isl.host) }),
        h("p", { class: "title", style: "font-size:max(24px,calc(var(--u) * 36));margin:0" }, isl.label)),
      h("div", { class: "actcards" }, ...cards),
      h("button", { type: "button", class: "bigbtn alt", onclick: () => { sh.close(); say("Choisis une île !"); } }, "Retour à la carte"));
    const pitches = acts.filter((a) => ok(a, p!)).map((a) => a.pitch).join(" ");
    say(`${cap(ISLAND_SPOKEN[id])} ! ${pitches}${advised ? ` Je te conseille : ${advised.title.toLowerCase()}.` : ""}`);
  }

  app.show(screen, () => { window.clearInterval(timer); window.removeEventListener("resize", onResize); });

  if (after?.sticker) {
    stickerRitual(screen, carnetBtn, after.sticker, () => {
      if (app.timeUp()) { leaving = true; sessionEnd(); return; }
      greet();
    });
  } else greet();

  function greet() {
    const names = missions.map((i) => ISLAND_SPOKEN[i]);
    let line: string;
    if (!s.greeted) {
      s.greeted = true;
      line = `Bonjour ${p!.name} ! Aujourd'hui, je te propose ${names.join(" ou ")}. Où veux-tu aller ?`;
      // Le mot enregistré par le parent passe d'abord, s'il existe.
      if (voice.has("bonjour")) { lastLine = line; voice.play("bonjour").then(() => { if (!leaving) speech.say(line); }); return; }
    } else if (app.sessionFraction() > 0.75 && !s.warned) {
      s.warned = true;
      line = "Le soleil commence à descendre : encore une petite mission, et on rentre !";
    } else {
      line = pick(["Où va-t-on maintenant ?", "Quelle île veux-tu visiter ?", `Je te propose ${names.join(" ou ")}.`]);
    }
    say(line);
  }
}

// ---------- Écran d'une île dessinée : chaque lieu ouvre son activité ----------
// L'île n'a son écran que si chacune de ses activités y a son lieu dessiné ; sinon, la fenêtre de la v1.
function dessinee(id: string, acts: Entry[]): boolean {
  const q = ilesV2()[id as IleId]?.quartiers[0];
  return !!q?.decor && acts.every((a) => q.lieux.some((l) => l.ids.includes(a.id)));
}

function islandScreen(id: IleId, acts: Entry[], advised: Entry | undefined) {
  const p = app.profile!;
  const byId = new Map(acts.map((a) => [a.id, a]));
  let leaving = false, run = 0;
  const go = (fn: () => void) => { if (leaving) return; leaving = true; run++; fn(); };
  const conseil = advised ? `Je te conseille : ${advised.title.toLowerCase()}.` : "";
  const choisir = (actId: string, el: HTMLElement) => {
    const e = byId.get(actId);
    if (!e || leaving) return;
    if (!ok(e, p)) { sfx.soft(); wobble(el); run++; say(e.lockedReason ?? "Cette activité s'ouvrira bientôt."); return; }
    sfx.tap();
    go(() => open(e));
  };
  const { el } = ecranIle(ilesV2()[id], {
    conseil: advised?.id,
    disponible: (a) => { const e = byId.get(a); return !!e && ok(e, p); },
    onLieu: choisir,
    onRetour: () => { sfx.tap(); go(() => mapScreen()); },
    onEcoute: () => { sfx.tap(); accueil(); },
    onPlume: () => { sfx.tap(); run++; say(conseil || "Touche un lieu pour commencer."); },
  });
  el.classList.add("screen");
  // Le soleil se couche pendant qu'on regarde l'île : comme sur la carte, on rentre.
  const timer = window.setInterval(() => {
    if (!app.timeUp() || leaving) return;
    leaving = true; run++;
    say("Le soleil se couche sur l'archipel…").then(() => sleep(400)).then(() => sessionEnd());
  }, 3000);
  app.show(el, () => { leaving = true; run++; window.clearInterval(timer); });
  accueil();

  // Plume souhaite la bienvenue, présente chaque lieu (son étiquette brille pendant qu'elle en parle), puis conseille.
  async function accueil() {
    const r = ++run;
    const pills = new Map(Array.from(el.querySelectorAll<HTMLElement>(".a-pastille[data-act]")).map((b) => [b.dataset.act!, b]));
    const lignes = [
      ...bienvenueIle(id).map((t) => ({ t, act: "" })),
      ...acts.filter((a) => ok(a, p)).map((a) => ({ t: a.pitch, act: a.id })),
      ...(conseil ? [{ t: conseil, act: "" }] : []),
    ];
    for (const l of lignes) {
      if (r !== run) return;
      const b = pills.get(l.act);
      b?.classList.add("saying");
      await say(l.t);
      b?.classList.remove("saying");
    }
  }
}

function open(e: Entry) {
  if (e.mod) { launch(e.mod); return; }
  e.open?.((sticker) => mapScreen({ sticker }));
}
function launch(mod: ActivityModule<any>) {
  const p = app.profile!;
  const { el, cleanup } = activityScreen(mod, (summary, reason) => {
    if (reason === "calm") { calmScreen(() => mapScreen()); return; }
    const sticker = summary && reason === "done" && deservesSticker(p, mod, summary) ? mod.sticker(summary, ctxFor(p)) : undefined;
    mapScreen({ sticker });
  });
  app.show(el, cleanup);
}

// Gommette : jamais promise à l'avance ; elle dit ce qui a été fait (découverte, persévérance…).
function deservesSticker(p: Profile, mod: ActivityModule<any>, s: RoundSummary) {
  if (s.items < Math.min(3, mod.items)) return false;
  const firstOfKind = !p.stickers.some((st) => st.kind === mod.sticker(s, ctxFor(p)).kind);
  return firstOfKind || s.learned.length > 0 || s.helped >= 2 || Math.random() < 0.5;
}
const ctxFor = (p: Profile) => ({ profile: p, rng: makeRng(Date.now() >>> 0), known: knownSet(p.knownK), now: Date.now() });

function stickerRitual(host: HTMLElement, target: HTMLElement, spec: StickerSpec, done: () => void) {
  const p = app.profile!;
  const art = h("button", { type: "button", class: "sticker-big pop", "aria-label": "Ranger la gommette dans mon carnet", html: spec.svg });
  const ov = h("div", { class: "overlay", style: "flex-direction:column;gap:max(12px,calc(var(--u) * 22))" },
    h("p", { class: "title", style: "color:#fff;font-size:max(26px,calc(var(--u) * 42));margin:0;text-shadow:0 2px 8px rgba(0,0,0,.25);text-align:center" }, "Une gommette pour ton carnet !"),
    art,
    h("button", { type: "button", class: "bigbtn", onclick: () => store() }, h("span", { style: "width:34px;height:34px;display:flex;align-items:center;justify-content:center", html: icon("book", "#fff", 2.4) }), "Dans mon carnet"));
  host.appendChild(ov);
  sfx.sticker();
  say(`${spec.reason} Touche-la pour la ranger dans ton carnet.`);
  art.addEventListener("click", () => store());
  let stored = false;
  async function store() {
    if (stored) return;
    stored = true;
    const st = { t: Date.now(), kind: spec.kind, ref: spec.ref, reason: spec.reason };
    p.stickers.push(st);
    app.session?.stickers.push(st);
    app.save();
    sfx.tap();
    ov.style.background = "transparent";
    await fly(art, target, 650);
    ov.remove();
    done();
  }
}

// ---------- Coin calme : respirer avec Pico ----------
export function calmScreen(back: () => void) {
  app.pause("calme");
  let alive = true;
  const word = h("p", { class: "word-big", "aria-live": "polite" }, "");
  const breath = h("div", { class: "breath" }, h("div", { class: "halo" }), h("div", { class: "pico", html: PICO }));
  const actions = h("div", { class: "row", style: "min-height:var(--btn)" });
  const leave = () => { if (!alive) return; alive = false; app.resume("calme"); back(); };
  const screen = h("div", { class: "screen calm" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => leave() }),
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 36))" }, "Le coin calme de Pico"),
      h("div", { style: "width:var(--btn)" })),
    h("div", { class: "stage" }, breath, word, actions));

  async function cycles(n: number) {
    for (let i = 0; i < n && alive; i++) {
      breath.className = "breath in"; word.textContent = "Inspire…"; sfx.breathIn();
      speech.say(i === 0 ? "Inspire doucement par le nez, comme pour sentir une fleur." : "Inspire…", 0.8);
      await sleep(4300);
      if (!alive) return;
      breath.className = "breath out"; word.textContent = "Souffle…";
      speech.say(i === 0 ? "Et souffle tout doucement, comme pour faire danser une bougie." : "Souffle…", 0.8);
      await sleep(5300);
    }
    if (!alive) return;
    breath.className = "breath";
    word.textContent = "Ça va mieux ?";
    speech.say("Ça va mieux ?");
    actions.replaceChildren(
      h("button", { type: "button", class: "bigbtn", onclick: () => leave() }, "Oui, je repars !"),
      h("button", { type: "button", class: "bigbtn alt", onclick: () => { actions.replaceChildren(); cycles(3); } }, "Encore un peu"));
  }
  app.show(screen, () => { alive = false; app.resume("calme"); });
  speech.say("Bienvenue dans le coin calme. On respire avec Pico.").then(() => { if (alive) cycles(3); });
}

// ---------- Carnet d'explorateur : gommettes et passeport des drapeaux ----------
export function carnetScreen(back: () => void) {
  const p = app.profile!;
  const sg = h("div", { class: "sgrid" });
  for (const st of p.stickers.slice().reverse()) {
    const b = h("button", { type: "button", "aria-label": st.reason, html: stickerArt(st.kind, st.ref) });
    b.addEventListener("click", () => { sfx.tap(); speech.say(st.reason); });
    sg.appendChild(b);
  }
  const fg = h("div", { class: "fgrid" });
  const seen = Object.entries(p.flags).filter(([c, s]) => s.seen > 0 && FLAG_BY_CODE[c]).sort((a, b) => b[1].last - a[1].last);
  for (const [code] of seen) {
    const fl = FLAG_BY_CODE[code];
    const b = h("button", { type: "button", "aria-label": fl.name }, h("span", { class: "fl", html: flagSVG(code, false) }), h("span", {}, fl.name));
    b.addEventListener("click", () => { sfx.tap(); speech.say(cap(fl.the)); });
    fg.appendChild(b);
  }
  const art = gallery.list(p.id).slice().reverse();
  const dg = h("div", { class: "dgrid" });
  for (const g of art) {
    const b = h("button", { type: "button", "aria-label": DRAWING_BY_ID[g.id]?.nom ?? "Dessin au miroir" }, h("img", { src: g.img, alt: "" }));
    b.addEventListener("click", () => { sfx.tap(); showDrawing(screen, g); });
    dg.appendChild(b);
  }
  const myFlag = p.myFlag ? h("button", { type: "button", class: "myflagmini", "aria-label": "Le drapeau de mon île", html: myFlagSVG(p.myFlag) }) : null;
  myFlag?.addEventListener("click", () => { sfx.tap(); speech.say(`Le drapeau de l'île de ${p.name} !`); });
  const screen = h("div", { class: "screen carnet" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => back() }),
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 38))" }, "Mon carnet d'explorateur"),
      h("div", { style: "width:var(--btn)" })),
    h("div", { class: "scroll" },
      myFlag ? h("div", { class: "row", style: "justify-content:flex-start;gap:16px" }, myFlag, h("h2", { style: "margin:0" }, "Le drapeau de mon île")) : null,
      h("h2", {}, `Mes gommettes${p.stickers.length ? ` (${p.stickers.length})` : ""}`),
      p.stickers.length ? sg : h("p", { class: "empty" }, "Ton carnet attend ses premières gommettes !"),
      h("h2", {}, `Mes dessins${art.length ? ` (${art.length})` : ""}`),
      art.length ? dg : h("p", { class: "empty" }, "Va sur l'île de l'Atelier pour dessiner avec Kiki."),
      h("h2", {}, `Mon passeport : ${seen.length} drapeau${seen.length > 1 ? "x" : ""}`),
      seen.length ? fg : h("p", { class: "empty" }, "Va au Port des Voyages pour découvrir tes premiers drapeaux.")));
  app.show(screen);
  speech.say(p.stickers.length ? "Voici ton carnet. Touche une gommette pour savoir pourquoi tu l'as gagnée." : "Voici ton carnet d'explorateur.");
}

// ---------- Fin de séance : le soleil se couche, un défi pour la maison ----------
export function sessionEnd(opts: { early?: boolean } = {}) {
  const p = app.profile;
  if (!p) { nav.start(); return; }
  const s = app.session;
  const done = s?.activities ?? [];
  const pool = done.flatMap((id) => DEFIS[id] ?? []);
  const defi = pick(pool.length ? pool : [...DEFIS.syllabes, ...DEFIS.marche]);
  const stickers = s?.stickers ?? [];
  const rest = !opts.early && app.timeUp();
  app.endSession(rest);
  const title = opts.early ? "À bientôt sur l'archipel !" : "Le soleil se couche sur l'archipel";
  const screen = h("div", { class: "screen sunset" },
    h("div", { class: "sunball", "aria-hidden": "true" }),
    h("div", { class: "card-end pop" },
      h("div", { class: "fin-plume", html: imgHTML("plume-salut") }),
      h("h1", { class: "title" }, title),
      stickers.length ? h("div", { class: "row", "aria-label": "Gommettes gagnées pendant ce voyage" }, ...stickers.map((st) => h("span", { style: "width:max(52px,calc(var(--u) * 72));height:max(52px,calc(var(--u) * 72));display:block", html: stickerArt(st.kind, st.ref) }))) : null,
      h("p", { class: "defi" }, h("b", {}, "Ton défi pour la maison : "), defi),
      h("button", { type: "button", class: "bigbtn", onclick: () => { sfx.tap(); nav.start(); } }, "Au revoir Plume !")));
  app.show(screen);
  sfx.sunset();
  const words = `${opts.early ? "Merci pour ce voyage" : "Le soleil se couche. Bravo pour ce beau voyage"}, ${p.name} ! Ton défi pour la maison : ${defi}`;
  speech.say(words).then(() => (voice.has("aurevoir") ? voice.play("aurevoir") : undefined));
}
