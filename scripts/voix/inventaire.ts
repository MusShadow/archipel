// Inventaire de tout ce que dit Plume, pour le pack de voix naturelle.
// Fait tourner chaque activité à tous les niveaux dans un DOM simulé (happy-dom) : consignes, présentations,
// indices 1 à 4, phrases de réussite, et réponses aux erreurs obtenues en touchant au hasard les éléments de l'écran.
// Ajoute les phrases des écrans (carte, coin calme, carnet, fin de séance, grand départ, dessin, histoires…).
// Usage : bun scripts/voix/inventaire.ts  →  voix/inventaire.json
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
const realTimeout = globalThis.setTimeout.bind(globalThis);
// Temps accéléré : les minuteries des activités (animations, remises à zéro) passent 100 fois plus vite.
(globalThis as any).setTimeout = (fn: any, ms = 0, ...a: any[]) => realTimeout(fn, Math.max(0, Number(ms) || 0) / 100, ...a);
(globalThis as any).requestAnimationFrame = (fn: any) => realTimeout(() => fn(performance.now()), 1);
(window as any).setTimeout = (globalThis as any).setTimeout;
(window as any).requestAnimationFrame = (globalThis as any).requestAnimationFrame;
if (!(Element.prototype as any).animate) (Element.prototype as any).animate = () => ({ finished: Promise.resolve(), cancel() {}, onfinish: null });
const pause = (ms: number) => new Promise<void>((r) => realTimeout(r, ms));
process.on("unhandledRejection", () => {});
window.addEventListener("error", (e: any) => e.preventDefault?.());

const root = join(import.meta.dir, "../..");
const { speech } = await import("../../src/services");
const { app, createProfile } = await import("../../src/app");
const { ACTIVITIES, ISLAND_SPOKEN } = await import("../../src/activities");
const { PRAISE, PRAISE_AFTER_EFFORT, RETRY, DEFIS, knownSet, SAY_SYL, WORDS } = await import("../../src/content");
const { makeRng } = await import("../../src/core");
const { FLAGS, CONTINENTS, cap } = await import("../../src/flags");
const { DRAWINGS } = await import("../../src/drawings");
const { LAYOUTS, SYMBOLS } = await import("../../src/screens/myflag");
const { SOUND_WORDS, READ_WORDS } = await import("../../src/lexique");
const { SENTINEL_NAME } = await import("../../src/voix");

// ---------- Collecte ----------
type Entry = { text: string; src: Set<string> };
const found = new Map<string, Entry>();
let where = "";
function add(text: string | null | undefined, src = where) {
  if (!text) return;
  const t = String(text).replace(/\s+/g, " ").trim();
  if (!t) return;
  const e = found.get(t) ?? { text: t, src: new Set<string>() };
  e.src.add(src);
  found.set(t, e);
}
(speech as any).say = (t: string) => { add(t); return Promise.resolve(); };
(speech as any).stop = () => {};

// ---------- Activités ----------
const profiles = [0, 5, 11, 15, 26].map((k, i) => createProfile({ name: SENTINEL_NAME, ageMonths: 54, color: "#FFC145", readingK: k, countTo: 20, flags: (i % 3) as 0 | 1 | 2 }));
for (const c of ["FR", "JP", "IT", "CA", "US", "ML", "PA"]) profiles[3].flags[c] = { seen: 3, ok: 2, last: 1 };
for (const p of profiles.slice(2)) for (const f of FLAGS) p.flags[f.code] ??= { seen: 2, ok: 1, last: 1 };

const ITEMS = Number(process.env.ITEMS ?? 60);
const rnd = makeRng(Number(process.env.SEED ?? 20261115));
async function fuzz(stage: HTMLElement, rounds: number) {
  for (let r = 0; r < rounds; r++) {
    const els = Array.from(stage.querySelectorAll<HTMLElement>("button, [data-t], [data-i], .tile, .slot, .cell, .pad, .swatch, .card, [role=button]"));
    if (!els.length) return;
    for (let k = 0; k < 6; k++) {
      const el = els[Math.floor(rnd.next() * els.length)];
      try {
        el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 }));
        el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 10, clientY: 10 }));
        el.click();
      } catch { /* geste non géré par le DOM simulé */ }
    }
    await pause(4);
  }
}

const t0 = Date.now();
const ONLY = process.env.ONLY?.split(",");
for (const mod of ACTIVITIES.filter((m) => !ONLY || ONLY.includes(m.id))) {
  for (const p of profiles) {
    app.data.profiles = [p]; app.data.activeId = p.id;
    const ctx = { profile: p, rng: makeRng(Math.floor(rnd.next() * 1e9)), known: knownSet(p.knownK), now: Date.now() };
    where = `${mod.id}`;
    add(mod.pitch, `${mod.id}:pitch`);
    if (mod.lockedReason) add(mod.lockedReason, `${mod.id}:verrou`);
    for (let level = 1; level <= mod.maxLevel; level++) {
      for (let n = 0; n < ITEMS; n++) {
        let item: any;
        try { item = mod.generate(level, ctx); } catch (e) { console.error(mod.id, level, e); continue; }
        where = `${mod.id}:consigne`; add(item.prompt);
        try { const intro = mod.intro?.(item, ctx); if (intro) { where = `${mod.id}:intro`; add(intro.text); } } catch { /* rien */ }
        const stage = document.createElement("div");
        document.body.replaceChildren(stage);
        let hints = 0;
        const view = {
          stage, rng: ctx.rng, hintStep: () => hints,
          say: (t: string) => { add(t, `${mod.id}:rendu`); return Promise.resolve(); },
          answer: (_c: boolean, _el: any, retry?: string) => { if (retry) add(retry, `${mod.id}:erreur`); },
        };
        try { where = `${mod.id}:rendu`; mod.render(item, view as any); } catch (e) { /* DOM simulé incomplet */ }
        await pause(2);
        if (n % 2 === 0) await fuzz(stage, 3);
        for (let s = 1; s <= 4; s++) {
          hints = s;
          try { where = `${mod.id}:indice`; add(mod.hint(item, s, view as any)); } catch { /* rien */ }
        }
        try { where = `${mod.id}:reussite`; add(mod.success?.(item)); } catch { /* rien */ }
        // Explications d'erreur préparées avec l'exercice (une par mauvaise réponse possible).
        if (item.retry && typeof item.retry === "object") for (const t of Object.values(item.retry)) if (typeof t === "string") add(t, `${mod.id}:erreur`);
        // Gommette : la raison change selon le déroulé (tout trouvé du premier coup, avec de l'aide, drapeau découvert…).
        for (const sum of [
          { items: 6, firstTry: 6, helped: 0, errors: 0, last: item, learned: [] },
          { items: 6, firstTry: 2, helped: 4, errors: 3, last: item, learned: [] },
          { items: 6, firstTry: 5, helped: 1, errors: 1, last: item, learned: item.target ? [item.target] : [] },
        ]) {
          try {
            where = `${mod.id}:gommette`;
            const spec = mod.sticker(sum as any, ctx as any);
            add(spec.reason); add(`${spec.reason} Touche-la pour la ranger dans ton carnet.`, "carte:gommette");
          } catch { /* rien */ }
        }
      }
    }
  }
  console.error(`${mod.id} : ${found.size} phrases (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// ---------- Phrases à trous dont toutes les valeurs ne sortent pas forcément au hasard ----------
// Le voyage de la goutte : la liste complète de ses phrases.
{
  const { voiceLines } = await import("../../src/activities/goutte");
  if (!ONLY || ONLY.includes("goutte")) for (const x of voiceLines()) add(x.text, x.fam);
}
// Le partage du goûter : ce que dit Plume selon l'état du plateau (boîte vide, assiettes inégales, panier trop plein).
where = "partage:indice";
for (const x of ["Je glisse un biscuit vers l'assiette qui en a le moins.", "Je redonne un biscuit du panier à chacun.",
  "Tout le monde en a autant : touche la coche !", "Je donne un biscuit à chacun. Continue comme ça !"]) add(x);
where = "partage:rendu";
add("Il n'y a plus de biscuits dans la boîte. Tu peux glisser un biscuit d'une assiette à l'autre.");
for (let n = 1; n <= 10; n++) add(`Il reste ${n} biscuit${n > 1 ? "s" : ""} à partager.`);
where = "syllabes:erreur";
const SYLS = [...new Set(Object.values(SAY_SYL))];
for (const a of SYLS) { add(`Tu as fabriqué ${a}. On cherche ${a}.`); add(`Ça, c'est ${a}. Écoute : ${a}.`); }
for (const v of ["a", "i", "o", "u", "é"]) { add(`Ça, c'est ${v}. Écoute : ${v}.`); add(`Écoute bien : ${v}. Touche ${v}.`); add(`Oui, ${v} !`); }
where = "drapeau:intro";
for (const f of FLAGS as any[]) add(`Voici le drapeau ${f.of}. ${cap(f.desc)}.`);
where = "drapeau:erreur";
for (const c of CONTINENTS) add(`Ça, c'est l'${c.label}. Cherche encore !`);
where = "lis:indice";
const art = (r: any) => (r.art ? `${r.art} ${r.w}` : r.w);
READ_WORDS.forEach((a: any, i: number) => {
  const b: any = READ_WORDS[(i + 1) % READ_WORDS.length], c: any = READ_WORDS[(i + 7) % READ_WORDS.length];
  for (const [x, y] of [[a, b], [b, a], [a, c]]) {
    add(`Ça se lit : ${art(x)} est sur ${art(y)}.`, "lis:indice"); add(`Ça se lit : ${art(x)} et ${art(y)}.`, "lis:indice");
    const s1 = `${art(x)} est sur ${art(y)}`, s2 = `${art(x)} et ${art(y)}`;
    add(`Oui ! ${s1.charAt(0).toUpperCase()}${s1.slice(1)}.`, "lis:reussite"); add(`Oui ! ${s2.charAt(0).toUpperCase()}${s2.slice(1)}.`, "lis:reussite");
  }
});

// ---------- Hôte des activités ----------
where = "hote";
for (const x of [...PRAISE, ...PRAISE_AFTER_EFFORT, ...RETRY]) add(x);
add("Ce n'est pas facile ! On fait une petite pause avec Pico, ou tu continues ?");
add("Tu veux revenir à la carte ?");

// ---------- Écrans ----------
const N = SENTINEL_NAME;
const islands = Object.keys(ISLAND_SPOKEN);
where = "carte";
add(`Plume se repose, ${N}. On repart en voyage plus tard !`);
add("Le soleil se couche sur l'archipel…");
add("Choisis une île !");
add(`Tu veux arrêter le voyage, ${N} ?`);
add("Cette activité s'ouvrira bientôt.");
add("Le soleil commence à descendre : encore une petite mission, et on rentre !");
add("Où va-t-on maintenant ?"); add("Quelle île veux-tu visiter ?");
const extra = [
  { island: "atelier", title: "Dessine pas à pas", pitch: "Dessine pas à pas, pour apprendre à faire de vrais dessins avec Kiki." },
  { island: "atelier", title: "Le miroir de Kiki", pitch: "Le miroir de Kiki, pour dessiner des deux côtés à la fois." },
  { island: "mots", title: "Mes histoires", pitch: "Mes histoires, pour lire les histoires écrites rien que pour toi." },
  { island: "port", title: "Le drapeau de mon île", pitch: "Le drapeau de ton île, pour inventer ton propre drapeau." },
  { island: "coeur", title: "Le coin calme", pitch: "Le coin calme, pour respirer avec Pico." },
];
add("Demande à un adulte de t'écrire une histoire, dans l'espace parent.");
const entries = [...ACTIVITIES.map((a) => ({ island: a.island, title: a.title, pitch: a.pitch })), ...extra];
for (const id of islands) {
  const I = cap(ISLAND_SPOKEN[id]);
  add(`${I} dort encore. Elle se réveillera bientôt !`);
  const here = entries.filter((e) => e.island === id);
  // Toutes les sous-listes d'activités présentées (certaines peuvent être fermées), puis le conseil.
  const subsets = (1 << here.length);
  for (let m = 1; m < subsets; m++) {
    const pitches = here.filter((_, i) => m & (1 << i)).map((e) => e.pitch).join(" ");
    add(`${I} ! ${pitches}`);
  }
  for (const e of here) add(`Je te conseille : ${e.title.toLowerCase()}.`);
  for (const id2 of islands) {
    if (id2 === id) continue;
    const pair = `${ISLAND_SPOKEN[id]} ou ${ISLAND_SPOKEN[id2]}`;
    add(`Bonjour ${N} ! Aujourd'hui, je te propose ${pair}. Où veux-tu aller ?`);
    add(`Je te propose ${pair}.`);
  }
  add(`Bonjour ${N} ! Aujourd'hui, je te propose ${ISLAND_SPOKEN[id]}. Où veux-tu aller ?`);
  add(`Je te propose ${ISLAND_SPOKEN[id]}.`);
}
where = "coin-calme";
add("Inspire doucement par le nez, comme pour sentir une fleur."); add("Inspire…");
add("Et souffle tout doucement, comme pour faire danser une bougie."); add("Souffle…");
add("Ça va mieux ?"); add("Bienvenue dans le coin calme. On respire avec Pico.");
where = "carnet";
for (const f of FLAGS) add(cap(f.the));
add(`Le drapeau de l'île de ${N} !`);
add("Voici ton carnet. Touche une gommette pour savoir pourquoi tu l'as gagnée."); add("Voici ton carnet d'explorateur.");
add("Celle-ci, c'est ton passeport d'explorateur : tu as réussi le grand départ !");
where = "fin";
for (const list of Object.values(DEFIS)) for (const defi of list) {
  add(`Merci pour ce voyage, ${N} ! Ton défi pour la maison : ${defi}`);
  add(`Le soleil se couche. Bravo pour ce beau voyage, ${N} ! Ton défi pour la maison : ${defi}`);
}
where = "depart";
add(`Bienvenue sur l'archipel, ${N} ! Avant le grand départ, j'ai trois petits jeux pour mieux te connaître. Tu es prêt ?`);
for (const x of ["Basile a besoin d'aide à son marché.", "Mona veut jouer avec les mots.", "On prépare le voyage avec les drapeaux du monde."]) add(x);
add(`Bravo ${N} ! Tu as gagné ta première gommette : ton passeport d'explorateur. En route pour l'archipel !`);
where = "dessin";
for (const d of DRAWINGS as any[]) {
  add(`Qu'est-ce que tu veux dessiner avec Kiki ? Je te conseille ${d.nom}.`);
  add(`Voici ${d.un} ! Regarde-le bien… Il va disparaître, et on va le dessiner ensemble, étape par étape.`);
  for (const st of d.steps) { add(st.say); add(`Regarde : ${st.say.charAt(0).toLowerCase()}${st.say.slice(1)}`); }
  add(`Tadaa ! Tu as dessiné ${d.un} ! Regarde, il ressemble au modèle. Tu veux le colorier ? Choisis une couleur, puis touche une partie de ton dessin.`);
  add(`Celle-ci, c'est pour ${d.un} que tu as dessiné, étape par étape.`);
  add(`Celle-ci, c'est pour ${d.un} que tu as dessiné, étape par étape. Touche-la pour la ranger dans ton carnet.`);
  add(`Ton dessin : ${d.nom}.`);
}
for (const x of ["Essaie de passer sur les petits points.", "Regarde bien où Kiki a dessiné, et essaie encore.", "Continue, il manque encore un morceau.",
  "Bien !", "Super !", "Joli !", "Bravo !", "Très bien !", "Je te remontre. Regarde bien où passe le crayon.",
  "Deux miroirs ! Ce que tu dessines apparaît quatre fois, comme dans un kaléidoscope.", "Un seul miroir : ton dessin apparaît deux fois.",
  "Dessine d'abord quelque chose !", "Ton dessin est rangé dans ton carnet ! Tu peux en commencer un autre.",
  "Bienvenue dans le miroir de Kiki ! Tout ce que tu dessines d'un côté apparaît aussi de l'autre côté. Essaie !", "Ton dessin au miroir."]) add(x);
where = "histoires";
for (const x of ["Une nouvelle histoire t'attend ! Choisis une histoire.", "Choisis une histoire à lire.", "Oui, bravo ! Tu as bien compris l'histoire.",
  "C'est celle qui brille. Tu veux relire l'histoire une autre fois ?", "Pas tout à fait. Repense à l'histoire, et essaie encore."]) add(x);
where = "mon-drapeau";
add("Choisis d'abord une couleur."); add("Choisis d'abord une couleur, en bas.");
for (const l of LAYOUTS) add(l.nom);
for (const s of SYMBOLS) add(s.nom);
add(`Voici le drapeau de l'île de ${N} ! Il est dans ton carnet.`);
add("Tu veux changer le drapeau de ton île ?"); add("Invente le drapeau de ton île ! Choisis une forme, des couleurs, et un symbole.");
where = "parent";
add("Bonjour ! Je suis Plume. On part en voyage ?");

// ---------- Mots isolés (lus seuls, ou pour compléter une phrase à trous) ----------
where = "mots";
for (let n = 0; n <= 100; n++) add(String(n));
for (const s of Object.values(SAY_SYL)) add(s);
for (const w of SOUND_WORDS) { add(w.w); for (const s of w.say) add(s); }
for (const w of READ_WORDS) { add(w.w); if (w.art) add(`${w.art} ${w.w}`); for (const s of w.syl) add(s); }
for (const w of WORDS) add(w.w);
for (const f of FLAGS) { add(f.name); add(f.the); }
for (const c of CONTINENTS) add(c.label);

// ---------- Sortie ----------
const out = [...found.values()].map((e) => ({ text: e.text, src: [...e.src].sort() })).sort((a, b) => a.text.localeCompare(b.text, "fr"));
mkdirSync(join(root, "voix"), { recursive: true });
writeFileSync(process.env.OUT ?? join(root, "voix/inventaire.json"), JSON.stringify(out, null, 1));
console.error(`Total : ${out.length} énoncés distincts (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(0);
