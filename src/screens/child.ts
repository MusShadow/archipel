// Écrans de l'enfant : accueil, carte de l'archipel, gommettes, coin calme, carnet, coucher du soleil.
import { ACTIVITIES, ACTIVITIES_BY_ISLAND, ACTIVITY_BY_ID, ISLAND_SPOKEN, stickerArt } from "../activities";
import { app } from "../app";
import { FACES, ISLANDS, ISLAND_SHAPES, LANDMARKS, MAP_WAVES, MEDALS, PLUME_B } from "../art_static";
import { DEFIS, knownSet } from "../content";
import { makeRng, suggestMissions } from "../core";
import { FLAG_BY_CODE, cap, flagSVG } from "../flags";
import { activityScreen, isAvailable, type ActivityModule, type RoundSummary, type StickerSpec } from "../host";
import { nav } from "../nav";
import { sfx, speech, voice, type Profile } from "../services";
import { avatarSVG, esc, fly, h, icon, medallion, plumeSVG, roundBtn, sleep } from "../ui";
import { longPress, parentGate, sheet } from "./common";
import { grandDepart } from "./depart";

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();
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
  const screen = h("div", { class: "screen start" },
    h("div", { class: "plume-big", html: plumeSVG() }),
    h("h1", { class: "title" }, "Archipel"),
    h("p", { class: "sub" }, "Qui part en voyage ?"),
    kids, lock);
  for (const p of d.profiles) {
    const resting = (p.restUntil ?? 0) > Date.now();
    const b = h("button", { type: "button", class: "kid", "aria-label": resting ? `${p.name}, Plume se repose` : p.name },
      h("span", { class: "av", html: avatarSVG(initial(p.name), p.color) }),
      h("span", { class: "nm" }, p.name),
      resting ? h("span", { class: "moon", html: MOON }) : null);
    b.addEventListener("click", () => choose(p, resting));
    kids.appendChild(b);
  }
  longPress(lock, 1200, () => parentGate(screen, () => nav.parent()));

  function choose(p: Profile, resting: boolean) {
    sfx.unlock(); sfx.tap();
    if (!resting) { begin(p); return; }
    const until = new Date(p.restUntil!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    speech.say(`Plume se repose, ${p.name}. On repart en voyage plus tard !`);
    const s = sheet(screen,
      h("div", { style: "width:130px;height:105px", html: plumeSVG() }),
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
const PORTRAIT_WAVES = [[60, 860], [520, 880], [90, 1120], [420, 1100], [700, 1150], [740, 640]].map(([x, y]) => `<path d="M${x} ${y} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`).join("");
const isPortrait = () => window.innerHeight > window.innerWidth * 1.1;
function sunSVG(f: number, portrait = false) {
  const SUN = { cx: portrait ? 430 : 590, cy: 92, rx: 120, ry: 62 };
  const a = Math.PI * (1 - f);
  const sx = SUN.cx + SUN.rx * Math.cos(a), sy = SUN.cy - SUN.ry * Math.sin(a);
  const P = (x: number) => x.toFixed(1);
  let s = "";
  if (f > 0.01) s += `<path d="M${SUN.cx - SUN.rx} ${SUN.cy} A${SUN.rx} ${SUN.ry} 0 0 1 ${P(sx)} ${P(sy)}" fill="none" stroke="#FFC145" stroke-width="6" stroke-linecap="round"/>`;
  if (f < 0.99) s += `<path d="M${P(sx)} ${P(sy)} A${SUN.rx} ${SUN.ry} 0 0 1 ${SUN.cx + SUN.rx} ${SUN.cy}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="0.1 12"/>`;
  for (let k = 0; k < 8; k++) {
    const b = (k * Math.PI) / 4;
    s += `<line x1="${P(sx + 20 * Math.cos(b))}" y1="${P(sy + 20 * Math.sin(b))}" x2="${P(sx + 26 * Math.cos(b))}" y2="${P(sy + 26 * Math.sin(b))}" stroke="#FFC145" stroke-width="3" stroke-linecap="round"/>`;
  }
  s += `<circle cx="${P(sx)}" cy="${P(sy)}" r="15" fill="#FFC145" stroke="#E9A800" stroke-width="2"/>`;
  s += `<circle cx="${SUN.cx + SUN.rx}" cy="${SUN.cy}" r="10" fill="#C9D3E8"/><circle cx="${SUN.cx + SUN.rx + 5}" cy="${SUN.cy - 4}" r="9" fill="#BFE8EE"/>`;
  return s;
}

function islandSVG(isl: (typeof ISLANDS)[number], o: { mission: boolean; sleeping: boolean; done: boolean }) {
  const { id, cx, cy, rx, ry, color, label } = isl;
  let g = "";
  if (o.mission) {
    g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 28}" ry="${ry + 26}" fill="none" stroke="#fff" stroke-width="14" opacity=".35"/>`;
    g += `<ellipse class="ring" cx="${cx}" cy="${cy}" rx="${rx + 28}" ry="${ry + 26}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round"/>`;
  }
  g += ISLAND_SHAPES[id] + LANDMARKS[id] + ((MEDALS as Record<string, string>)[id] ?? "");
  if (o.sleeping) {
    const x = cx - rx * 0.62, y = cy - ry * 0.42;
    g += `<g class="zzz" style="font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:800;fill:#5B6475"><text x="${x}" y="${y}" font-size="22">z</text><text x="${x + 14}" y="${y - 12}" font-size="17">z</text></g>`;
  }
  if (o.done) {
    const x = cx + rx * 0.62, y = cy - ry * 0.7;
    g += `<circle cx="${x}" cy="${y}" r="17" fill="#34B37A" stroke="#fff" stroke-width="3"/><path d="M${x - 8} ${y} l5 5 l10 -10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const w = Math.round(label.length * 9 + 46), y = cy + ry + 12;
  g += `<g transform="translate(${cx} ${y})"><rect x="${-w / 2}" y="0" width="${w}" height="32" rx="16" fill="#FFF7EA" stroke="${color}" stroke-width="2"/><circle cx="${-w / 2 + 18}" cy="16" r="6" fill="${color}"/><text x="9" y="22" text-anchor="middle" style="font-family:'Baloo 2',ui-rounded,system-ui,sans-serif;font-weight:700;font-size:17px;fill:#273043">${esc(label)}</text></g>`;
  const aria = `${label}${o.sleeping ? ", endormie" : ""}${o.mission ? ", mission proposée" : ""}${o.done ? ", déjà visitée" : ""}`;
  return `<g class="isl${o.sleeping ? " sleep" : ""}" data-isl="${id}" tabindex="0" role="button" aria-label="${esc(aria)}">${g}</g>`;
}

// Missions du jour : deux activités choisies par le planificateur (révisions dues, compétences « à la frontière »,
// équilibre entre domaines, objectifs du parent), sur deux îles différentes si possible.
function missionsFor(p: Profile): string[] {
  const plan = suggestMissions({
    activities: ACTIVITIES.filter((a) => isAvailable(a, p)).map((a) => ({ id: a.id, domain: a.domain, skills: a.skills })),
    skills: p.skills, minutesByDomain: app.minutesThisWeek(p), goals: p.goals, now: Date.now(),
  }, Math.random, ACTIVITIES.length);
  const out: string[] = [];
  for (const id of plan) if (out.length < 2 && !out.some((o) => ACTIVITY_BY_ID[o].island === ACTIVITY_BY_ID[id].island)) out.push(id);
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

  const active = new Set([...Object.keys(ACTIVITIES_BY_ISLAND), "coeur"]);
  const missionActs = missionsFor(p);
  const missions = missionActs.map((id) => ACTIVITY_BY_ID[id].island);
  const visited = s.activities.map((id) => ACTIVITIES.find((a) => a.id === id)?.island ?? "");
  const plume = `<g class="plume-map" data-plume="1" role="button" tabindex="0" aria-label="Réécouter Plume" style="cursor:pointer">`
    + `<rect x="262" y="94" width="72" height="50" rx="16" fill="#fff" stroke="#D8CDB8" stroke-width="1.5"/><polygon points="330,124 348,136 333,114" fill="#fff"/>`
    + `<g transform="translate(281 102) scale(1.4)" fill="none" stroke="#273043" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z"/><path d="M15.5 9 C17 10.5 17 13.5 15.5 15 M18 6.5 C21 9.5 21 14.5 18 17.5"/></g>`
    + `<g transform="translate(330 70) scale(0.36)">${PLUME_B}</g></g>`;
  const wrap = h("div", { class: "mapwrap" });
  let portrait = isPortrait();
  const draw = () => {
    const islands = ISLANDS.map((isl) => {
      const g = islandSVG(isl, { mission: missions.includes(isl.id), sleeping: !active.has(isl.id), done: visited.includes(isl.id) });
      if (!portrait) return g;
      const [x, y] = PORTRAIT[isl.id];
      // Le ballon du port passe entre les deux colonnes pour ne pas cacher l'île du Cœur.
      const art = isl.id === "port" ? g.replace("translate(175 560)", "translate(330 585)") : g;
      return `<g transform="translate(${x - isl.cx} ${y - isl.cy})">${art}</g>`;
    }).join("");
    wrap.innerHTML = `<svg viewBox="${portrait ? "0 0 820 1180" : "0 0 1180 820"}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Carte de l'archipel">`
      + `<rect x="-600" y="-600" width="2400" height="2400" fill="#BFE8EE"/>${MAP_WAVES}${portrait ? PORTRAIT_WAVES : ""}${islands}`
      + `${portrait ? `<g transform="translate(-170 0)">${plume}</g>` : plume}<g id="sun" aria-hidden="true">${sunSVG(app.sessionFraction(), portrait)}</g></svg>`;
  };
  draw();
  const onResize = () => { if (isPortrait() !== portrait) { portrait = !portrait; draw(); } };
  window.addEventListener("resize", onResize);

  const carnetBtn = h("button", { type: "button", class: "hudbtn", "aria-label": "Ouvrir mon carnet d'explorateur" }, h("span", { class: "round", html: icon("book") }), h("span", { class: "cap" }, "Carnet"));
  const calmBtn = h("button", { type: "button", class: "hudbtn", "aria-label": "Aller au coin calme" }, h("span", { class: "round", html: icon("leaf", "#26895B") }), h("span", { class: "cap" }, "Coin calme"));
  const meBtn = h("button", { type: "button", class: "hudbtn", "aria-label": `${p.name} : arrêter le voyage` },
    h("span", { class: "round", style: `border-color:${p.color};background:#FFF7EA;overflow:hidden`, html: avatarSVG(initial(p.name), p.color) }),
    h("span", { class: "cap" }, p.name));
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
  wrap.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const g = (e.target as Element).closest("[data-isl]");
    if (g) { e.preventDefault(); tapIsland(g.getAttribute("data-isl")!, g); }
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
    g.classList.remove("tapped"); void (g as SVGGraphicsElement).getBBox?.(); g.classList.add("tapped");
    if (id === "coeur") { sfx.tap(); go(() => calmScreen(() => mapScreen())); return; }
    const acts = ACTIVITIES_BY_ISLAND[id];
    if (!acts) { sfx.soft(); say(`${cap(ISLAND_SPOKEN[id])} dort encore. Elle se réveillera bientôt !`); return; }
    sfx.tap();
    if (acts.length === 1) { go(() => launch(acts[0])); return; }
    islandSheet(id, acts);
  }

  // Une île, plusieurs activités : l'enfant choisit ; celle que Plume conseille est entourée.
  function islandSheet(id: string, acts: ActivityModule<any>[]) {
    const isl = ISLANDS.find((x) => x.id === id)!;
    const advised = acts.find((a) => missionActs.includes(a.id)) ?? acts.find((a) => isAvailable(a, p!));
    const cards = acts.map((a) => {
      const ok = isAvailable(a, p!);
      const b = h("button", { type: "button", class: `actcard${ok ? "" : " locked"}${a === advised ? " advised" : ""}`, "data-act": a.id, "aria-label": ok ? a.title : `${a.title}, pas encore ouverte` },
        h("span", { class: "actart", html: a.card }),
        h("span", { class: "acttitle" }, a.title),
        a === advised ? h("span", { class: "advice" }, "Plume conseille") : null,
        ok ? null : h("span", { class: "lockic", html: icon("lock", "#5B6475", 2.2) }));
      b.addEventListener("click", () => {
        if (!ok) { sfx.soft(); say(a.lockedReason ?? "Cette activité s'ouvrira bientôt."); return; }
        sfx.tap(); sh.close(); go(() => launch(a));
      });
      return b;
    });
    const sh = sheet(screen,
      h("div", { class: "row", style: "gap:12px" },
        h("span", { style: "width:max(56px,calc(var(--u) * 72));height:max(56px,calc(var(--u) * 72));display:block", html: medallion(isl.host) }),
        h("p", { class: "title", style: "font-size:max(24px,calc(var(--u) * 36));margin:0" }, isl.label)),
      h("div", { class: "actcards" }, ...cards),
      h("button", { type: "button", class: "bigbtn alt", onclick: () => { sh.close(); say("Choisis une île !"); } }, "Retour à la carte"));
    const pitches = acts.filter((a) => isAvailable(a, p!)).map((a) => a.pitch).join(" ");
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
  const screen = h("div", { class: "screen carnet" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => back() }),
      h("div", { class: "title", style: "font-size:max(22px,calc(var(--u) * 38))" }, "Mon carnet d'explorateur"),
      h("div", { style: "width:var(--btn)" })),
    h("div", { class: "scroll" },
      h("h2", {}, `Mes gommettes${p.stickers.length ? ` (${p.stickers.length})` : ""}`),
      p.stickers.length ? sg : h("p", { class: "empty" }, "Ton carnet attend ses premières gommettes !"),
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
      h("div", { style: "width:max(110px,calc(var(--u) * 170));height:max(88px,calc(var(--u) * 136))", html: plumeSVG() }),
      h("h1", { class: "title" }, title),
      stickers.length ? h("div", { class: "row", "aria-label": "Gommettes gagnées pendant ce voyage" }, ...stickers.map((st) => h("span", { style: "width:max(52px,calc(var(--u) * 72));height:max(52px,calc(var(--u) * 72));display:block", html: stickerArt(st.kind, st.ref) }))) : null,
      h("p", { class: "defi" }, h("b", {}, "Ton défi pour la maison : "), defi),
      h("button", { type: "button", class: "bigbtn", onclick: () => { sfx.tap(); nav.start(); } }, "Au revoir Plume !")));
  app.show(screen);
  sfx.sunset();
  const words = `${opts.early ? "Merci pour ce voyage" : "Le soleil se couche. Bravo pour ce beau voyage"}, ${p.name} ! Ton défi pour la maison : ${defi}`;
  speech.say(words).then(() => (voice.has("aurevoir") ? voice.play("aurevoir") : undefined));
}
