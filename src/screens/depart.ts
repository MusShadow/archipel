// « Le grand départ » : la première aventure de l'enfant. Trois mini-parcours de 3 exercices
// (nombres, mots, drapeaux) dont la difficulté bouge à chaque réponse, pour régler le point de départ en jouant.
import { ACTIVITY_BY_ID, departStickerSVG } from "../activities";
import { app } from "../app";
import { activityScreen } from "../host";
import { sfx, speech, type Profile } from "../services";
import { h, icon, medallion, plumeSVG } from "../ui";

interface Stage { mod: string; host: string; intro: string }
const stagesFor = (p: Profile): Stage[] => [
  { mod: "marche", host: "basile", intro: "Basile a besoin d'aide à son marché." },
  { mod: p.knownK >= 11 ? "syllabes" : "chants", host: "mona", intro: "Mona veut jouer avec les mots." },
  { mod: "drapeau", host: "plume", intro: "On prépare le voyage avec les drapeaux du monde." },
];

export function grandDepart(p: Profile, done: () => void, calm: (back: () => void) => void) {
  const stages = stagesFor(p);
  let i = 0;

  const go = (label: string, onclick: () => void) =>
    h("button", { type: "button", class: "bigbtn", onclick: () => { sfx.tap(); onclick(); } }, label, h("span", { style: "width:30px;height:30px;display:flex;align-items:center;justify-content:center", html: icon("arrow", "#fff", 2.6) }));

  function intro() {
    const screen = h("div", { class: "screen start depart" },
      h("div", { class: "plume-big", html: plumeSVG() }),
      h("h1", { class: "title" }, "Le grand départ"),
      h("p", { class: "sub" }, "Trois petits jeux pour que Plume te connaisse."),
      go("C'est parti !", () => stage()));
    app.show(screen);
    speech.say(`Bienvenue sur l'archipel, ${p.name} ! Avant le grand départ, j'ai trois petits jeux pour mieux te connaître. Tu es prêt ?`);
  }

  function stage() {
    if (i >= stages.length) { finale(); return; }
    const st = stages[i];
    const screen = h("div", { class: "screen start depart" },
      h("div", { style: "width:max(110px,calc(var(--u) * 180));height:max(110px,calc(var(--u) * 180))", html: medallion(st.host, true) }),
      h("p", { class: "sub" }, `Étape ${i + 1} sur ${stages.length}`),
      h("h1", { class: "title", style: "font-size:max(26px,calc(var(--u) * 46));text-align:center;max-width:90vw" }, st.intro),
      go("On y va !", () => run(st)));
    app.show(screen);
    speech.say(st.intro);
  }

  function run(st: Stage) {
    const mod = ACTIVITY_BY_ID[st.mod];
    const { el, cleanup } = activityScreen(mod, (_summary, reason) => {
      i++;
      // Retour à la carte demandé : on arrête l'évaluation là, les niveaux de départ restent ceux du questionnaire.
      if (reason === "early") { p.departDone = true; app.save(); done(); return; }
      // Pause demandée après plusieurs erreurs : coin calme, puis on reprend à l'étape suivante.
      if (reason === "calm") { calm(() => stage()); return; }
      stage();
    }, { items: 3, fast: true });
    app.show(el, cleanup);
  }

  function finale() {
    p.departDone = true;
    const st = { t: Date.now(), kind: "depart", reason: "Celle-ci, c'est ton passeport d'explorateur : tu as réussi le grand départ !" };
    p.stickers.push(st);
    app.session?.stickers.push(st);
    app.save();
    sfx.sticker();
    const screen = h("div", { class: "screen start depart" },
      h("div", { class: "sticker-big pop", html: departStickerSVG() }),
      h("h1", { class: "title", style: "text-align:center" }, "Ton passeport est prêt !"),
      go("Vers l'archipel", () => done()));
    app.show(screen);
    speech.say(`Bravo ${p.name} ! Tu as gagné ta première gommette : ton passeport d'explorateur. En route pour l'archipel !`);
  }

  intro();
}
