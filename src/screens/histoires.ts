// Histoires sur mesure : l'adulte les fait écrire par Claude (avec sa propre clé), les relit, les valide ;
// l'enfant les lit sur l'île des Mots (mots touchables, phrase lue à voix haute, petite question à la fin).
import { emojiStickerSVG } from "../activities/chants";
import { app } from "../app";
import { applyEvidence, newSkill } from "../core";
import { habillerEcran, type StickerSpec } from "../host";
import { ruban } from "../design/composants";
import { emoji } from "../lexique";
import { sfx, speech, type Profile, type Story } from "../services";
import { HEROES, LENGTHS, STORY_ERRORS, THEMES, apiKey, difficultWords, requestStory } from "../stories";
import { celebrate } from "../fete";
import { esc, glow, h, medallion, roundBtn, sleep, wobble } from "../ui";

const NAMES = HEROES.map((x) => x.nom);

// ---------- Espace parent : onglet « Histoires » ----------
export function storiesTab(p: Profile, rerender: () => void): HTMLElement[] {
  let theme = THEMES[0], hero = "plume", len = 5, custom = "";
  let draft: Story | null = null;
  const status = h("p", { class: "muted", "aria-live": "polite", style: "margin:8px 0 0" });
  const draftBox = h("div", {});

  // Clé
  const keyIn = h("input", { type: "password", placeholder: "sk-ant-…", value: apiKey.get(), autocomplete: "off", style: "width:min(420px,100%);font-size:16px;padding:10px 12px;border-radius:12px;border:1.5px solid #D8CDB8" }) as HTMLInputElement;
  const keyCard = h("div", { class: "p-card" },
    h("h2", {}, "Clé de l'API Claude"),
    h("p", { class: "muted" }, "Les histoires sont écrites par Claude avec votre propre clé (console.anthropic.com → API Keys). La clé reste sur cet appareil : elle n'est ni exportée ni envoyée ailleurs qu'à Anthropic. Le prénom de l'enfant n'est jamais envoyé."),
    h("div", { class: "p-row", style: "margin-top:10px" }, keyIn,
      h("button", { type: "button", class: "pbtn", onclick: () => { apiKey.set(keyIn.value.trim()); status.textContent = keyIn.value.trim() ? "Clé enregistrée sur cet appareil." : "Clé effacée."; } }, "Enregistrer"),
      apiKey.get() ? h("button", { type: "button", class: "pbtn danger", onclick: () => { apiKey.set(""); keyIn.value = ""; status.textContent = "Clé effacée."; } }, "Effacer la clé") : null));

  // Commande
  const chips = (vals: { label: string; value: string | number }[], cur: () => string | number, set: (v: any) => void) => {
    const row = h("div", { class: "p-row", style: "gap:6px" });
    const draw = () => row.replaceChildren(...vals.map((v) => h("button", { type: "button", class: `opt${cur() === v.value ? " on" : ""}`, onclick: () => { set(v.value); draw(); } }, v.label)));
    draw();
    return row;
  };
  const customIn = h("input", { type: "text", placeholder: "ou un autre thème : les trains, un jardin…", style: "width:min(420px,100%);font-size:16px;padding:10px 12px;border-radius:12px;border:1.5px solid #D8CDB8;margin-top:8px" }) as HTMLInputElement;
  customIn.addEventListener("input", () => { custom = customIn.value.trim(); });
  const heroRow = h("div", { class: "p-row", style: "gap:8px" });
  const drawHeroes = () => heroRow.replaceChildren(...HEROES.map((x) => h("button", { type: "button", class: `herochip${hero === x.id ? " on" : ""}`, "aria-label": x.nom, title: x.qui, onclick: () => { hero = x.id; drawHeroes(); } },
    h("span", { style: "width:40px;height:40px;display:block", html: medallion(x.id) }), x.nom)));
  drawHeroes();
  const goBtn = h("button", { type: "button", class: "pbtn", "data-write": "1" }, "Écrire l'histoire");
  goBtn.addEventListener("click", () => write());
  const level = p.knownK <= 0 ? "ne lit pas encore : l'histoire sera surtout lue à voix haute" : `connaît ${p.knownK} sons ; Claude utilisera surtout des mots déchiffrables avec ces sons`;
  const orderCard = h("div", { class: "p-card" },
    h("h2", {}, `Une histoire pour ${p.name}`),
    h("p", { class: "muted" }, `${p.name} ${level}. Les mots probablement trop difficiles seront signalés : vous pourrez réécrire l'histoire ou la lire ensemble.`),
    h("p", { class: "plabel" }, "Thème"), chips(THEMES.map((t) => ({ label: t, value: t })), () => theme, (v) => { theme = v; }), customIn,
    h("p", { class: "plabel" }, "Héros"), heroRow,
    h("p", { class: "plabel" }, "Longueur"), chips(LENGTHS.map((l) => ({ label: l.label, value: l.id })), () => len, (v) => { len = v; }),
    h("div", { class: "p-row", style: "margin-top:14px" }, goBtn), status, draftBox);

  async function write() {
    const key = apiKey.get();
    if (!key) { status.textContent = "Enregistrez d'abord une clé API (ci-dessus)."; keyIn.focus(); return; }
    goBtn.setAttribute("disabled", "true");
    status.textContent = "Claude écrit l'histoire…";
    draftBox.replaceChildren();
    try {
      const fetcher = ((globalThis as any).__archipelTest?.fetch as typeof fetch | undefined) ?? fetch;
      draft = await requestStory(key, { k: p.knownK, theme: custom || theme, hero, phrases: len }, fetcher);
      status.textContent = "";
      showDraft();
    } catch (e: any) {
      const code = e?.message && STORY_ERRORS[e.message] ? e.message : e instanceof TypeError ? "reseau" : e instanceof SyntaxError ? "format" : "";
      status.textContent = code ? STORY_ERRORS[code] : `Échec de l'écriture (${String(e?.message ?? e)}).`;
    } finally { goBtn.removeAttribute("disabled"); }
  }
  function showDraft() {
    if (!draft) return;
    const d = draft;
    const hard = difficultWords([d.titre, ...d.phrases].join(" "), p.knownK, NAMES);
    const mark = (s: string) => esc(s).replace(/[A-Za-zÀ-ÿœŒ]+/g, (w) => (hard.includes(w.toLowerCase()) ? `<mark>${w}</mark>` : w));
    draftBox.replaceChildren(h("div", { class: "draft" },
      h("h3", { html: `${d.emoji ? `${d.emoji} ` : ""}${mark(d.titre)}` }),
      h("ol", {}, ...d.phrases.map((s, i) => h("li", { html: `${d.images?.[i] ? `${d.images[i]} ` : ""}${mark(s)}` }))),
      h("p", {}, h("b", {}, "Question : "), d.question.texte),
      h("ul", {}, ...d.question.choix.map((c, i) => h("li", { style: i === d.question.bonne ? "font-weight:700" : "" }, `${c}${i === d.question.bonne ? " (bonne réponse)" : ""}`))),
      h("p", { class: "muted" }, hard.length ? `Mots probablement difficiles pour ${p.name} (surlignés) : ${hard.join(", ")}. Ce repérage est approximatif.` : `Tous les mots semblent déchiffrables pour ${p.name}.`),
      h("div", { class: "p-row" },
        h("button", { type: "button", class: "pbtn", "data-validate": "1", onclick: () => { p.stories.push(d); app.save(); draft = null; status.textContent = `« ${d.titre} » est dans la bibliothèque de ${p.name}, sur l'île des Mots.`; draftBox.replaceChildren(); rerender(); } }, "Valider"),
        h("button", { type: "button", class: "pbtn ghost", onclick: () => write() }, "Réécrire"),
        h("button", { type: "button", class: "pbtn ghost", onclick: () => { draft = null; draftBox.replaceChildren(); status.textContent = "Histoire jetée."; } }, "Jeter"))));
  }

  // Bibliothèque
  const list = p.stories.slice().reverse();
  const libCard = h("div", { class: "p-card" },
    h("h2", {}, `Bibliothèque de ${p.name} (${p.stories.length})`),
    list.length ? h("div", { class: "p-list" }, ...list.map((s) => h("div", { class: "p-item" },
      h("span", { style: "font-size:26px" }, s.emoji ?? "📖"),
      h("div", { class: "grow" }, h("b", {}, s.titre), h("div", { class: "muted" }, `${s.phrases.length} phrases · lue ${s.lu ?? 0} fois · ${new Date(s.t).toLocaleDateString("fr-FR")}`)),
      h("button", { type: "button", class: "pbtn danger", onclick: () => { if (confirm(`Supprimer « ${s.titre} » ?`)) { p.stories = p.stories.filter((x) => x.id !== s.id); app.save(); rerender(); } } }, "Supprimer"))))
      : h("p", { class: "muted" }, "Aucune histoire validée pour l'instant."));

  return [keyCard, orderCard, libCard];
}

// ---------- Côté enfant : la bibliothèque ----------
export function storyShelf(back: (sticker?: StickerSpec) => void) {
  const p = app.profile!;
  const grid = h("div", { class: "drawpick" });
  const stories = p.stories.slice().reverse();
  for (const s of stories) {
    const b = h("button", { type: "button", class: `actcard${(s.lu ?? 0) === 0 ? " advised" : ""}`, "data-story": s.id, "aria-label": s.titre },
      h("span", { class: "actart", html: emoji(s.emoji ?? "📖") }),
      h("span", { class: "acttitle" }, s.titre),
      (s.lu ?? 0) === 0 ? h("span", { class: "advice" }, "Nouvelle !") : null);
    b.addEventListener("click", () => { sfx.tap(); storyReader(s, back); });
    grid.appendChild(b);
  }
  const screen = habillerEcran(h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "back", label: "Retour à la carte", onclick: () => back() }),
      ruban({ texte: "Mes histoires", ile: "mots" }),
      h("span", { style: "width:var(--btn);height:var(--btn);display:block", html: medallion("mona") })),
    h("div", { class: "scroll" }, grid)), "mots");
  app.show(screen);
  speech.say(stories.some((s) => !s.lu) ? "Une nouvelle histoire t'attend ! Choisis une histoire." : "Choisis une histoire à lire.");
}

function storyReader(s: Story, back: (sticker?: StickerSpec) => void) {
  const p = app.profile!;
  const t0 = Date.now();
  let page = 0, alive = true;
  const pic = h("div", { class: "storypic", "aria-hidden": "true" });
  const line = h("p", { class: "storyline readline" });
  const count = h("div", { class: "muted", style: "font-size:16px" });
  const prev = roundBtn({ icon: "back", label: "Page précédente", onclick: () => go(page - 1) });
  const next = roundBtn({ icon: "arrow", label: "Page suivante", cls: "next", onclick: () => go(page + 1) });
  const listen = roundBtn({ icon: "sound", label: "Écouter la phrase", onclick: () => readPage() });
  const stage = h("div", { class: "stage" }, pic, line, h("div", { class: "row" }, prev, listen, next), count);
  const screen = habillerEcran(h("div", { class: "screen" },
    h("div", { class: "top" },
      roundBtn({ icon: "home", label: "Retour à la carte", onclick: () => leave(false) }),
      ruban({ texte: s.titre, ile: "mots", cls: "ruban-long" }),
      roundBtn({ icon: "book", label: "Toutes mes histoires", onclick: () => { alive = false; storyShelf(back); } })),
    stage), "mots");
  function draw() {
    pic.innerHTML = emoji(s.images?.[page] || s.emoji || "📖");
    line.replaceChildren(...s.phrases[page].split(/\s+/).map((w) => {
      const clean = w.replace(/[.,;:!?«»"]/g, "");
      const b = h("button", { type: "button", class: "wordbtn" }, w);
      b.addEventListener("click", () => { sfx.tap(); if (clean) speech.say(clean); });
      return b;
    }));
    count.textContent = `${page + 1} / ${s.phrases.length}`;
    prev.style.visibility = page === 0 ? "hidden" : "visible";
  }
  async function readPage() {
    line.classList.add("reading");
    await speech.say(s.phrases[page], 0.85);
    line.classList.remove("reading");
  }
  function go(i: number) {
    if (i < 0) return;
    if (i >= s.phrases.length) { question(); return; }
    page = i; sfx.tap(); draw();
    // L'enfant essaie d'abord de lire ; la voix ne lit que si l'enfant ne lit pas encore, ou sur demande.
    if (p.knownK < 15) readPage();
  }
  function question() {
    let tries = 0;
    const cards = s.question.choix.map((c, i) => {
      const b = h("button", { type: "button", class: "card choicecard", "data-t": String(i) }, c);
      b.addEventListener("click", () => {
        const ok = i === s.question.bonne;
        if (tries === 0) {
          const now = Date.now();
          const ev = { skill: "LECT.TEXTE.COMPRENDRE", correct: ok, hints: 0, guess: 1 / s.question.choix.length, difficulty: 1.4 + Math.min(0.6, s.phrases.length * 0.06), form: "recit" as const };
          p.skills[ev.skill] = applyEvidence(p.skills[ev.skill] ?? newSkill(), ev, now);
          p.log.push({ t: now, activity: "histoires", level: 1, skill: ev.skill, correct: ok, hints: 0, form: "recit", ms: now - t0 });
          app.save();
        }
        tries++;
        if (ok) {
          b.classList.add("right"); sfx.success();
          const party = celebrate(screen, { name: p.name, firstTry: tries === 1 });
          Promise.all([speech.say("Oui, bravo ! Tu as bien compris l'histoire."), party.done]).then(() => { party.end(); return sleep(300); }).then(() => leave(true));
        } else {
          sfx.soft(); wobble(b);
          if (tries >= 2) { const r = cards[s.question.bonne]; if (r) glow(r); speech.say("C'est celle qui brille. Tu veux relire l'histoire une autre fois ?"); }
          else speech.say("Pas tout à fait. Repense à l'histoire, et essaie encore.");
        }
      });
      return b;
    });
    stage.replaceChildren(
      h("div", { class: "storypic", html: emoji("❓") }),
      h("p", { class: "storyq title" }, s.question.texte),
      h("div", { class: "choices col" }, ...cards));
    speech.say(`${s.question.texte} ${s.question.choix.map((c, i) => (i === s.question.choix.length - 1 ? `ou ${c}` : c)).join(", ")} ?`);
  }
  function leave(done: boolean) {
    if (!alive) return;
    alive = false;
    app.addMinutes("lecture", Date.now() - t0, "histoires");
    let sticker: StickerSpec | undefined;
    if (done) {
      s.lu = (s.lu ?? 0) + 1;
      app.save();
      if (s.lu === 1) sticker = { kind: "livre", ref: s.emoji ?? "📖", reason: `Celle-ci, c'est pour l'histoire « ${s.titre} », que tu as lue jusqu'au bout.`, svg: emojiStickerSVG(s.emoji ?? "📖", "#FFE0D3") };
    }
    back(sticker);
  }
  app.show(screen, () => { if (alive) { alive = false; app.addMinutes("lecture", Date.now() - t0, "histoires"); } });
  draw();
  speech.say(`${s.titre}.`).then(() => { if (alive && p.knownK < 15) readPage(); });
}

