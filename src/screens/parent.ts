// Espace parent (protégé par code) et premier lancement.
import { META, META_BY_ID } from "../activities";
import { app, createProfile, type Intake } from "../app";
import { DEFIS, GRAPHEME_ORDER, READING_LEVELS } from "../content";
import { DAY, DOMAINS, MASTERY_LABEL, SKILLS, masteryOf, type DomainId, type Mastery } from "../core";
import { FLAG_BY_CODE, FLAGS } from "../flags";
import { nav } from "../nav";
import { VOICE_SLOTS, defaultData, frenchVoiceLabel, normalize, saveData, speech, storageFailed, voice, type Profile } from "../services";
import { avatarSVG, h, plumeSVG } from "../ui";
import { pinPad, sheet } from "./common";
import { gallery } from "./draw";
import { storiesTab } from "./histoires";

export function registerParentScreens() {
  nav.parent = parentSpace;
  nav.setup = setupFlow;
}

const COLORS = ["#FFC145", "#FF7F50", "#E85D9A", "#8C6BE0", "#3D8BEA", "#1FA9B5", "#34B37A"];
const MASTERY_STYLE: Record<Mastery, string> = {
  "nouveau": "background:#EEE8DD;color:#5B6475",
  "decouverte": "background:#FFF0C9;color:#7A5600",
  "en-cours": "background:#DCE9FB;color:#2F6FC0",
  "acquise": "background:#D5F0E1;color:#1E7A50",
  "consolidee": "background:#1E7A50;color:#fff",
};
const ageLabel = (m: number) => `${Math.floor(m / 12)} ans${m % 12 ? ` ${m % 12} mois` : ""}`;
const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();
const fmtDate = (t: number) => new Date(t).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const round = (x: number) => Math.round(x);

// Groupe d'options exclusives (boutons), pour éviter les listes déroulantes sur tablette.
function opts<T>(choices: { label: string; value: T }[], current: T, onChange: (v: T) => void) {
  const wrap = h("div", { class: "opts", role: "radiogroup" });
  const draw = (cur: T) => {
    wrap.replaceChildren(...choices.map((c) => h("button", {
      type: "button", class: `opt${c.value === cur ? " on" : ""}`, role: "radio", "aria-checked": String(c.value === cur),
      onclick: () => { draw(c.value); onChange(c.value); },
    }, c.label)));
  };
  draw(current);
  return wrap;
}
const field = (label: string, ...inner: (HTMLElement | string)[]) => h("div", { class: "field" }, h("span", {}, label), ...inner);

// ---------- Questionnaire de repères (création d'un profil) ----------
function intakeForm(o: { submitLabel: string; onSubmit: (i: Intake) => void; onCancel?: () => void }) {
  const i: Intake = { name: "", ageMonths: 54, color: COLORS[0], readingK: 11, countTo: 20, flags: 1 };
  const name = h("input", { type: "text", maxlength: "20", autocomplete: "off", placeholder: "Prénom", "aria-label": "Prénom" }) as HTMLInputElement;
  const years = h("select", { "aria-label": "Âge en années" }, ...[3, 4, 5, 6, 7, 8].map((y) => h("option", { value: y, selected: y === 4 }, `${y} ans`))) as HTMLSelectElement;
  const months = h("select", { "aria-label": "Mois en plus" }, ...Array.from({ length: 12 }, (_, m) => h("option", { value: m, selected: m === 6 }, `${m} mois`))) as HTMLSelectElement;
  const sw = h("div", { class: "swatches" });
  const drawSw = () => sw.replaceChildren(...COLORS.map((c) => h("button", { type: "button", class: `swatch${c === i.color ? " on" : ""}`, style: `background:${c}`, "aria-label": `Couleur ${c}`, onclick: () => { i.color = c; drawSw(); } })));
  drawSw();
  const err = h("p", { class: "muted", style: "color:#B42318;min-height:1em" });
  const form = h("div", { style: "display:flex;flex-direction:column;gap:14px" },
    field("Prénom de l'enfant", name),
    field("Âge", h("div", { class: "p-row" }, years, months)),
    field("Sa couleur", sw),
    field("En lecture, il ou elle…", opts(READING_LEVELS.map((r) => ({ label: r.label, value: r.k })), i.readingK, (v) => { i.readingK = v; })),
    field("Il ou elle compte (sans se tromper) jusqu'à…", opts([5, 10, 20, 30, 60, 100].map((n) => ({ label: String(n), value: n })), i.countTo, (v) => { i.countTo = v; })),
    field("Drapeaux du monde", opts([{ label: "Pas encore", value: 0 as const }, { label: "Quelques-uns", value: 1 as const }, { label: "Beaucoup", value: 2 as const }], i.flags, (v) => { i.flags = v; })),
    h("p", { class: "muted" }, "Ces repères servent seulement de point de départ : l'appli s'ajuste ensuite toute seule, en douceur."),
    err,
    h("div", { class: "p-row" },
      h("button", {
        type: "button", class: "pbtn", onclick: () => {
          i.name = name.value.trim();
          if (!i.name) { err.textContent = "Indiquez un prénom (ou un surnom)."; name.focus(); return; }
          i.ageMonths = Number(years.value) * 12 + Number(months.value);
          o.onSubmit({ ...i });
        },
      }, o.submitLabel),
      o.onCancel ? h("button", { type: "button", class: "pbtn ghost", onclick: () => o.onCancel!() }, "Annuler") : null));
  return form;
}

// ---------- Premier lancement ----------
function setupFlow() {
  const box = h("div", { class: "box" });
  const screen = h("div", { class: "screen setup parent" }, box);
  app.show(screen);
  welcome();

  function welcome() {
    box.replaceChildren(
      h("div", { style: "display:flex;align-items:center;gap:14px" }, h("div", { style: "width:92px;height:74px;flex:0 0 auto", html: plumeSVG() }), h("h1", {}, "Bienvenue dans Archipel")),
      h("p", { style: "margin:0;font-size:15px;line-height:1.5" }, "Deux minutes de réglages pour l'adulte, avant le premier voyage :"),
      h("ul", {}, h("li", {}, "un code parent à 4 chiffres, qui protège les réglages ;"), h("li", {}, "le profil de votre enfant, avec quelques repères pour bien démarrer.")),
      h("div", { class: "note" }, "Pas de publicité, pas d'achat, pas de compte, pas d'inconnus. Les progrès restent sur cet appareil : rien n'est envoyé."),
      h("div", { class: "p-row" }, h("button", { type: "button", class: "pbtn", onclick: () => pinStep() }, "Commencer")));
  }
  function pinStep() {
    let first = "";
    const pad = pinPad({
      title: "Choisissez un code parent",
      subtitle: "4 chiffres, faciles à retenir pour vous.",
      check: (pin) => {
        if (!first) { first = pin; pad.setSubtitle("Saisissez-le une seconde fois pour confirmer."); pad.reset(); return true; }
        if (pin === first) { app.data.pin = pin; app.save(); profileStep(); return true; }
        first = ""; pad.setSubtitle("Les deux codes ne correspondent pas. Recommencez."); return false;
      },
      onCancel: () => welcome(),
    });
    box.replaceChildren(pad.el);
  }
  function profileStep() {
    box.replaceChildren(h("h1", {}, "Le profil de votre enfant"),
      intakeForm({ submitLabel: "Créer le profil", onSubmit: (i) => { const p = createProfile(i); app.data.profiles.push(p); app.data.activeId = p.id; app.save(); doneStep(p); } }));
  }
  function doneStep(p: Profile) {
    box.replaceChildren(
      h("h1", {}, "Tout est prêt !"),
      h("ul", {},
        h("li", {}, `Une séance dure ${app.data.settings.sessionMinutes} minutes : le soleil de la carte se couche à la fin.`),
        h("li", {}, "Pour revenir ici, maintenez le petit cadenas de l'accueil, puis tapez votre code."),
        h("li", {}, "Montez le son : Plume lit toutes les consignes à voix haute.")),
      h("div", { class: "p-row" }, h("button", { type: "button", class: "pbtn", onclick: () => nav.start() }, `C'est parti pour ${p.name} !`)));
  }
}

// ---------- Espace parent ----------
type Tab = "suivi" | "histoires" | "profils" | "reglages" | "voix" | "donnees";
const TABS: { id: Tab; label: string }[] = [
  { id: "suivi", label: "Suivi" }, { id: "histoires", label: "Histoires" }, { id: "profils", label: "Profils" }, { id: "reglages", label: "Réglages" }, { id: "voix", label: "Studio voix" }, { id: "donnees", label: "Données" },
];

function parentSpace(tab?: string) {
  let current: Tab = (TABS.find((t) => t.id === tab)?.id) ?? "suivi";
  let pid = app.profile?.id ?? null;
  const goalMsg = h("span", { style: "display:block;color:#B42318;margin-top:4px" });
  const body = h("div", { class: "p-wrap" });
  const tabsEl = h("div", { class: "p-tabs", role: "tablist" });
  const kidsEl = h("div", { class: "p-row" });
  const screen = h("div", { class: "screen parent" },
    h("div", { class: "p-head" },
      h("h1", {}, "Espace parent"),
      h("div", { class: "grow" }),
      kidsEl,
      h("button", { type: "button", class: "pbtn", onclick: () => nav.start() }, "Retour au jeu")),
    tabsEl, body);
  app.show(screen);
  render();

  function prof(): Profile | null { return app.data.profiles.find((p) => p.id === pid) ?? app.data.profiles[0] ?? null; }
  function render() {
    tabsEl.replaceChildren(...TABS.map((t) => h("button", { type: "button", role: "tab", "aria-selected": String(t.id === current), class: `p-tab${t.id === current ? " on" : ""}`, onclick: () => { current = t.id; render(); } }, t.label)));
    kidsEl.replaceChildren(...app.data.profiles.map((p) => h("button", {
      type: "button", class: `kidchip${p.id === prof()?.id ? " on" : ""}`, onclick: () => { pid = p.id; app.data.activeId = p.id; app.save(); render(); },
    }, h("span", { class: "mini", html: avatarSVG(initial(p.name), p.color) }), p.name)));
    const p = prof();
    body.replaceChildren();
    if (current === "suivi") body.append(...(p ? suivi(p) : [h("p", {}, "Aucun profil.")]));
    if (current === "histoires") body.append(...(p ? storiesTab(p, render) : [h("p", {}, "Aucun profil.")]));
    if (current === "profils") body.append(...profils());
    if (current === "reglages") body.append(...reglages(p));
    if (current === "voix") body.append(...studio());
    if (current === "donnees") body.append(...donnees());
    body.scrollTop = 0;
  }

  // ----- Suivi -----
  function suivi(p: Profile): HTMLElement[] {
    const st = app.data.settings;
    const since = Date.now() - 7 * DAY;
    const week = app.minutesThisWeek(p);
    const sessions = p.sessions.filter((s) => s.start >= since);
    const total = Object.values(week).reduce<number>((a, b) => a + (b ?? 0), 0);
    const logs = p.log.filter((l) => l.t >= since);
    const alone = logs.filter((l) => l.correct && l.hints === 0).length;
    const helped = logs.filter((l) => l.hints > 0).length;
    const goal = st.sessionsPerWeek * st.sessionMinutes;

    const kpis = h("div", { class: "kpis" },
      kpi(`${round(total)} min`, `cette semaine (repère : ${goal} min)`),
      kpi(String(sessions.length), `séance${sessions.length > 1 ? "s" : ""} sur 7 jours`),
      kpi(String(logs.length), "exercices faits"),
      kpi(logs.length ? `${round((100 * alone) / logs.length)} %` : "–", "réussis seul, du premier coup"));
    const usedDomains: DomainId[] = DOMAINS.filter((d) => META.some((m) => m.domain === d.id)).map((d) => d.id);
    const maxMin = Math.max(5, ...usedDomains.map((d) => week[d] ?? 0));
    const bars = h("div", { class: "bars" }, ...usedDomains.map((d) => {
      const def = DOMAINS.find((x) => x.id === d)!;
      const m = week[d] ?? 0;
      return h("div", { class: "bar" }, h("span", {}, def.label), h("div", { class: "track" }, h("div", { class: "fill", style: `width:${(100 * m) / maxMin}%;background:${def.color}` })), h("span", { class: "muted" }, `${round(m)} min`));
    }));
    const week1 = h("div", { class: "p-card" }, h("h2", {}, "Cette semaine"), kpis, h("div", { style: "height:14px" }), bars,
      helped / Math.max(1, logs.length) > 0.4 ? h("p", { class: "muted", style: "margin-top:12px" }, "Plume aide souvent en ce moment : c'est normal quand on découvre. L'appli propose des exercices un peu plus simples tant que c'est le cas.") : null);

    const skillCards = usedDomains.map((d) => {
      const def = DOMAINS.find((x) => x.id === d)!;
      const acts = META.filter((a) => a.domain === d && a.maxLevel > 1);
      const rows = SKILLS.filter((s) => s.domain === d && s.activity).map((s) => {
        const m = masteryOf(s, p.skills[s.id]);
        const n = p.skills[s.id]?.n ?? 0;
        const goal = p.goals.includes(s.id);
        const star = h("button", { type: "button", class: `goalbtn${goal ? " on" : ""}`, "aria-pressed": String(goal), "aria-label": goal ? `Retirer l'objectif : ${s.label}` : `Choisir comme objectif : ${s.label}`, title: "Objectif de la semaine" }, goal ? "★" : "☆");
        star.addEventListener("click", () => {
          if (goal) p.goals = p.goals.filter((g) => g !== s.id);
          else if (p.goals.length >= 3) { goalMsg.textContent = "Trois objectifs au plus : retirez-en un d'abord."; return; }
          else p.goals.push(s.id);
          app.save(); render();
        });
        return h("div", { class: "skillrow" }, h("span", { class: "p-row", style: "gap:6px;flex-wrap:nowrap" }, star, h("span", {}, s.label)), h("span", { class: "p-row", style: "gap:8px;flex-wrap:nowrap" }, n ? h("span", { class: "muted" }, `${n} essai${n > 1 ? "s" : ""}`) : null, h("span", { class: "chip", style: MASTERY_STYLE[m] }, MASTERY_LABEL[m])));
      });
      const levels = acts.map((a) => `${a.title} : niveau ${p.stairs[a.id]?.level ?? 1} sur ${a.maxLevel}`).join(" · ");
      return h("div", { class: "p-card" }, h("h2", { style: `color:${def.color}` }, def.label), ...rows, h("p", { class: "muted", style: "margin-top:8px" }, levels));
    });

    const flagsSeen = Object.entries(p.flags).filter(([c, s]) => s.seen > 0 && FLAG_BY_CODE[c]);
    const solid = flagsSeen.filter(([, s]) => s.ok >= 3 && s.ok / s.seen >= 0.7);
    const toReview = flagsSeen.filter(([, s]) => !(s.ok >= 3 && s.ok / s.seen >= 0.7)).sort((a, b) => a[1].ok / a[1].seen - b[1].ok / b[1].seen).slice(0, 8);
    const flagsCard = h("div", { class: "p-card" }, h("h2", {}, "Drapeaux"),
      h("p", {}, `${flagsSeen.length} découvert${flagsSeen.length > 1 ? "s" : ""} sur ${FLAGS.length}, dont ${solid.length} bien reconnu${solid.length > 1 ? "s" : ""}.`),
      toReview.length ? h("p", { class: "muted", style: "margin-top:6px" }, `À revoir : ${toReview.map(([c]) => FLAG_BY_CODE[c].name).join(", ")}.`) : null);

    const ideas: string[] = [];
    for (const a of META) {
      const states = a.skills.map((id) => masteryOf(SKILLS.find((s) => s.id === id)!, p.skills[id]));
      if (states.includes("en-cours")) ideas.push(`${a.title} : en bonne voie. À la maison : ${(DEFIS[a.id] ?? [])[0]?.toLowerCase() ?? ""}`);
    }
    if (!sessions.length) ideas.push("Pas encore de séance cette semaine : une séance courte suffit pour garder le fil.");
    const ideasCard = h("div", { class: "p-card" }, h("h2", {}, "Pistes pour la semaine"),
      ideas.length ? h("ul", { style: "margin:0;padding-left:18px;line-height:1.55;font-size:14px" }, ...ideas.slice(0, 4).map((t) => h("li", {}, t))) : h("p", { class: "muted" }, "Les pistes apparaîtront après quelques séances."));

    const last = p.sessions.slice(-6).reverse();
    const hist = h("div", { class: "p-card" }, h("h2", {}, "Dernières séances"),
      last.length ? h("div", { class: "p-list" }, ...last.map((s) => {
        const mins = Object.values(s.minutes).reduce<number>((a, b) => a + (b ?? 0), 0);
        const names = s.activities.map((id) => META_BY_ID[id]?.title ?? id).join(", ");
        return h("div", { class: "p-item" }, h("div", { class: "grow" }, h("b", {}, fmtDate(s.start)), h("div", { class: "muted" }, names || "—")), h("span", { class: "muted" }, `${Math.max(1, round(mins))} min`));
      })) : h("p", { class: "muted" }, "Aucune séance pour l'instant."));

    const goalNames = p.goals.map((g) => SKILLS.find((s) => s.id === g)?.label).filter(Boolean);
    return [
      h("p", { class: "muted" }, `${p.name}, ${ageLabel(p.ageMonths)}. Les compétences passent par : découverte, en cours, acquise, puis consolidée (réussie seul, sous deux formes, et encore quelques jours plus tard).`),
      h("div", { class: "note", style: "background:#F2F7FF;border-color:#C9DAF5" },
        h("b", {}, "Objectifs : "), goalNames.length ? `${goalNames.join(" · ")}. ` : "aucun pour l'instant. ",
        "Touchez l'étoile d'une compétence (trois au plus) : Plume proposera plus souvent les activités qui la travaillent.", goalMsg),
      h("div", { class: "p-grid" }, week1, ideasCard),
      h("div", { class: "p-grid" }, ...skillCards, flagsCard),
      hist,
    ];
  }
  function kpi(v: string, label: string) { return h("div", { class: "kpi" }, h("b", {}, v), h("span", {}, label)); }

  // ----- Profils -----
  function profils(): HTMLElement[] {
    const list = h("div", { class: "p-list" }, ...app.data.profiles.map((p) => h("div", { class: "p-item" },
      h("span", { style: "width:44px;height:44px;flex:0 0 auto", html: avatarSVG(initial(p.name), p.color) }),
      h("div", { class: "grow" }, h("b", {}, p.name), h("div", { class: "muted" }, `${ageLabel(p.ageMonths)} · ${p.stickers.length} gommette${p.stickers.length > 1 ? "s" : ""} · profil créé le ${new Date(p.createdAt).toLocaleDateString("fr-FR")}`)),
      h("button", { type: "button", class: "pbtn ghost", onclick: () => editProfile(p) }, "Modifier"),
      h("button", { type: "button", class: "pbtn ghost", title: "La prochaine séance commencera par le grand départ", onclick: (e: Event) => { p.departDone = false; app.save(); (e.currentTarget as HTMLElement).textContent = "Prévu à la prochaine séance"; } }, p.departDone === false ? "Grand départ prévu" : "Refaire le grand départ"),
      h("button", { type: "button", class: "pbtn danger", onclick: () => deleteProfile(p) }, "Supprimer"))));
    const addCard = h("div", { class: "p-card" });
    const showAdd = () => addCard.replaceChildren(h("h2", {}, "Ajouter un enfant"), intakeForm({
      submitLabel: "Créer le profil",
      onSubmit: (i) => { const p = createProfile(i); app.data.profiles.push(p); app.save(); pid = p.id; render(); },
      onCancel: () => addCard.replaceChildren(addBtn),
    }));
    const addBtn = h("button", { type: "button", class: "pbtn", onclick: showAdd }, "Ajouter un enfant");
    addCard.appendChild(addBtn);
    return [h("div", { class: "p-card" }, h("h2", {}, "Enfants"), list), addCard];
  }
  function editProfile(p: Profile) {
    const name = h("input", { type: "text", maxlength: "20", value: p.name, "aria-label": "Prénom" }) as HTMLInputElement;
    const years = h("select", { "aria-label": "Âge en années" }, ...[3, 4, 5, 6, 7, 8].map((y) => h("option", { value: y, selected: y === Math.floor(p.ageMonths / 12) }, `${y} ans`))) as HTMLSelectElement;
    const months = h("select", { "aria-label": "Mois en plus" }, ...Array.from({ length: 12 }, (_, m) => h("option", { value: m, selected: m === p.ageMonths % 12 }, `${m} mois`))) as HTMLSelectElement;
    let color = p.color;
    const sw = h("div", { class: "swatches" });
    const drawSw = () => sw.replaceChildren(...COLORS.map((c) => h("button", { type: "button", class: `swatch${c === color ? " on" : ""}`, style: `background:${c}`, "aria-label": `Couleur ${c}`, onclick: () => { color = c; drawSw(); } })));
    drawSw();
    const s = sheet(screen, h("div", { class: "parent", style: "display:flex;flex-direction:column;gap:14px;text-align:left;min-width:min(80vw,420px)" },
      h("h1", {}, `Modifier le profil`),
      field("Prénom", name), field("Âge", h("div", { class: "p-row" }, years, months)), field("Couleur", sw),
      h("div", { class: "p-row" },
        h("button", { type: "button", class: "pbtn", onclick: () => { p.name = name.value.trim() || p.name; p.ageMonths = Number(years.value) * 12 + Number(months.value); p.color = color; app.save(); s.close(); render(); } }, "Enregistrer"),
        h("button", { type: "button", class: "pbtn ghost", onclick: () => s.close() }, "Annuler"))));
  }
  function deleteProfile(p: Profile) {
    const s = sheet(screen, h("div", { class: "parent", style: "display:flex;flex-direction:column;gap:14px;max-width:440px" },
      h("h1", {}, `Supprimer le profil de ${p.name} ?`),
      h("p", { class: "muted" }, "Ses progrès, ses gommettes et son historique seront effacés de cet appareil. Pensez à exporter les données avant, si besoin."),
      h("div", { class: "p-row", style: "justify-content:center" },
        h("button", { type: "button", class: "pbtn danger", onclick: () => {
          app.data.profiles = app.data.profiles.filter((x) => x.id !== p.id);
          if (app.data.activeId === p.id) app.data.activeId = app.data.profiles[0]?.id ?? null;
          app.save(); s.close();
          if (!app.data.profiles.length) { nav.setup(); return; }
          pid = app.data.activeId; render();
        } }, "Supprimer"),
        h("button", { type: "button", class: "pbtn ghost", onclick: () => s.close() }, "Annuler"))));
  }

  // ----- Réglages -----
  function reglages(p: Profile | null): HTMLElement[] {
    const st = app.data.settings;
    const save = () => app.save();
    const session = h("div", { class: "p-card" }, h("h2", {}, "Séances"),
      field("Durée d'une séance", opts([8, 10, 12, 15, 20].map((n) => ({ label: `${n} min`, value: n })), st.sessionMinutes, (v) => { st.sessionMinutes = v; save(); })),
      h("div", { style: "height:12px" }),
      field("Repère : séances par semaine", opts([2, 3, 4, 5, 7].map((n) => ({ label: String(n), value: n })), st.sessionsPerWeek, (v) => { st.sessionsPerWeek = v; save(); })),
      h("div", { style: "height:12px" }),
      field("Astuces pour l'adulte pendant les activités", opts([{ label: "Afficher (mode accompagné)", value: true }, { label: "Masquer", value: false }], st.accompanied, (v) => { st.accompanied = v; save(); })),
      h("p", { class: "muted", style: "margin-top:10px" }, "À la fin d'une séance complète, Plume se repose une heure. Vous pouvez débloquer une nouvelle séance avec votre code."));

    const voices = speech.frenchVoices();
    const sel = h("select", { "aria-label": "Voix de Plume" },
      h("option", { value: "" }, "Automatique (meilleure voix française)"),
      ...voices.map((v) => h("option", { value: v.voiceURI, selected: v.voiceURI === st.voiceURI }, frenchVoiceLabel(v)))) as HTMLSelectElement;
    sel.addEventListener("change", () => { st.voiceURI = sel.value || null; speech.init(st.voiceURI); save(); });
    const voice = h("div", { class: "p-card" }, h("h2", {}, "Voix de Plume"),
      voices.length ? field("Voix", sel) : h("p", { class: "muted" }, "Aucune voix française trouvée sur cet appareil pour l'instant. Sur iPad : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis téléchargez une voix « améliorée »."),
      h("div", { style: "height:12px" }),
      field("Débit", opts([{ label: "Lent", value: 0.8 }, { label: "Normal", value: 0.9 }, { label: "Rapide", value: 1 }], st.rate, (v) => { st.rate = v; speech.rate = v; save(); })),
      h("div", { class: "p-row", style: "margin-top:12px" }, h("button", { type: "button", class: "pbtn ghost", onclick: () => speech.say("Bonjour ! Je suis Plume. On part en voyage ?") }, "Écouter Plume")));

    const cards = [session, voice];
    if (p) {
      const chips = h("div", { class: "gchips" });
      const known = h("p", { class: "muted", style: "margin-top:8px" });
      const draw = () => {
        chips.replaceChildren(...GRAPHEME_ORDER.map((g, i) => h("button", { type: "button", class: `gchip${i < p.knownK ? " on" : ""}`, "aria-pressed": String(i < p.knownK), onclick: () => { p.knownK = i + 1 === p.knownK ? i : i + 1; save(); draw(); } }, g)));
        known.textContent = p.knownK ? `Sons connus : ${GRAPHEME_ORDER.slice(0, p.knownK).join(", ")}.` : "Aucun son sélectionné : l'appli propose d'abord les voyelles.";
      };
      draw();
      cards.push(h("div", { class: "p-card" }, h("h2", {}, `Lecture de ${p.name}`),
        h("p", { class: "muted", style: "margin-bottom:10px" }, "Les syllabes et les mots proposés n'utilisent que les sons déjà connus. Touchez le dernier son appris (dans l'ordre de la méthode)."),
        chips, known));
    }
    const pinCard = h("div", { class: "p-card" }, h("h2", {}, "Code parent"),
      h("p", { class: "muted", style: "margin-bottom:10px" }, "C'est une barrière pour les petites mains, pas un coffre-fort : il est enregistré sur cet appareil."),
      h("button", { type: "button", class: "pbtn ghost", onclick: () => changePin() }, "Changer le code"));
    cards.push(pinCard);
    return [h("div", { class: "p-grid" }, ...cards)];
  }
  // ----- Studio voix -----
  function studio(): HTMLElement[] {
    const intro = h("div", { class: "p-card" }, h("h2", {}, "Votre voix dans Archipel"),
      h("p", { class: "muted" }, "Enregistrez quelques phrases courtes : Archipel les fait entendre de temps en temps, à la place de Plume. Encouragez l'effort plutôt que le talent (« tu as bien cherché » plutôt que « tu es fort »). Les enregistrements restent sur cet appareil et ne sont pas dans la sauvegarde texte."));
    if (!voice.canRecord) {
      return [intro, h("div", { class: "note" }, "Le micro n'est pas disponible ici. Ouvrez Archipel par son icône sur l'iPad (pas depuis la page Claude), puis revenez dans ce studio.")];
    }
    const rows = VOICE_SLOTS.map((slot) => {
      const status = h("span", { class: "muted" }, voice.has(slot.id) ? "Enregistré" : "Pas encore enregistré");
      const rec = h("button", { type: "button", class: "pbtn" }, voice.has(slot.id) ? "Réenregistrer" : "Enregistrer");
      const play = h("button", { type: "button", class: "pbtn ghost", disabled: !voice.has(slot.id) }, "Écouter");
      const del = h("button", { type: "button", class: "pbtn danger", disabled: !voice.has(slot.id), "aria-label": `Supprimer : ${slot.label}` }, "Supprimer");
      let stopNow: (() => void) | null = null;
      rec.addEventListener("click", async () => {
        if (stopNow) { stopNow(); return; }
        try {
          rec.textContent = "Arrêter";
          status.textContent = "Parlez maintenant… (6 secondes au plus)";
          const data = await voice.record(6000, (stop) => { stopNow = stop; });
          stopNow = null;
          status.textContent = voice.set(slot.id, data) ? "Enregistré" : "Mémoire pleine : enregistrement non gardé";
          render();
        } catch {
          stopNow = null;
          rec.textContent = "Enregistrer";
          status.textContent = "Micro refusé ou indisponible. Autorisez le micro pour cette page dans Safari, puis réessayez.";
        }
      });
      play.addEventListener("click", () => voice.play(slot.id));
      del.addEventListener("click", () => { voice.remove(slot.id); render(); });
      return h("div", { class: "p-item" },
        h("div", { class: "grow" }, h("b", {}, slot.label), h("div", { class: "muted" }, `Idée : « ${slot.idea} »`), status),
        rec, play, del);
    });
    return [intro, h("div", { class: "p-card" }, h("div", { class: "p-list" }, ...rows))];
  }

  function changePin() {
    let first = "";
    let s: { close: () => void } | null = null;
    const pad = pinPad({
      title: "Nouveau code parent", subtitle: "Choisissez 4 chiffres.",
      check: (pin) => {
        if (!first) { first = pin; pad.setSubtitle("Saisissez-le une seconde fois."); pad.reset(); return true; }
        if (pin === first) { app.data.pin = pin; app.save(); s?.close(); return true; }
        first = ""; pad.setSubtitle("Les deux codes ne correspondent pas. Recommencez."); return false;
      },
      onCancel: () => s?.close(),
    });
    s = sheet(screen, pad.el);
  }

  // ----- Données -----
  function donnees(): HTMLElement[] {
    const out = h("textarea", { class: "data", readonly: true, "aria-label": "Sauvegarde au format texte" }) as HTMLTextAreaElement;
    const copied = h("span", { class: "muted" });
    const exportCard = h("div", { class: "p-card" }, h("h2", {}, "Sauvegarder"),
      h("p", { class: "muted", style: "margin-bottom:10px" }, "La sauvegarde est un texte : copiez-le dans une note ou un e-mail à vous-même, puis collez-le ici pour restaurer."),
      h("div", { class: "p-row" },
        h("button", { type: "button", class: "pbtn", onclick: async () => {
          out.value = JSON.stringify(app.data);
          out.style.display = "";
          out.select();
          try { await navigator.clipboard.writeText(out.value); copied.textContent = "Copié."; } catch { copied.textContent = "Sélectionnez le texte puis copiez-le."; }
        } }, "Copier la sauvegarde"), copied),
      out);
    out.style.display = "none";
    const input = h("textarea", { class: "data", placeholder: "Collez ici une sauvegarde…", "aria-label": "Sauvegarde à importer" }) as HTMLTextAreaElement;
    const file = h("input", { type: "file", accept: "application/json,.json,.txt", "aria-label": "Fichier de sauvegarde" }) as HTMLInputElement;
    file.addEventListener("change", async () => { const f = file.files?.[0]; if (f) input.value = await f.text(); });
    const msg = h("p", { class: "muted", style: "min-height:1em" });
    const importCard = h("div", { class: "p-card" }, h("h2", {}, "Restaurer"), input, h("div", { style: "height:8px" }), file, h("div", { style: "height:10px" }),
      h("div", { class: "p-row" }, h("button", { type: "button", class: "pbtn ghost", onclick: () => {
        let parsed: unknown;
        try { parsed = JSON.parse(input.value); } catch { msg.textContent = "Ce texte n'est pas une sauvegarde Archipel valide."; return; }
        const d = normalize(parsed);
        if (!d.profiles.length) { msg.textContent = "Aucun profil trouvé dans cette sauvegarde."; return; }
        const s = sheet(screen, h("div", { class: "parent", style: "display:flex;flex-direction:column;gap:14px;max-width:440px" },
          h("h1", {}, "Remplacer les données actuelles ?"),
          h("p", { class: "muted" }, `La sauvegarde contient ${d.profiles.length} profil${d.profiles.length > 1 ? "s" : ""} : ${d.profiles.map((p) => p.name).join(", ")}.`),
          h("div", { class: "p-row", style: "justify-content:center" },
            h("button", { type: "button", class: "pbtn", onclick: () => { const oldPin = app.data.pin; app.data = d; if (!d.pin) d.pin = oldPin; app.save(); s.close(); pid = d.activeId; render(); } }, "Remplacer"),
            h("button", { type: "button", class: "pbtn ghost", onclick: () => s.close() }, "Annuler"))));
      } }, "Restaurer cette sauvegarde")), msg);
    const resetCard = h("div", { class: "p-card" }, h("h2", {}, "Tout effacer"),
      h("p", { class: "muted", style: "margin-bottom:10px" }, "Supprime les profils, les progrès, les réglages et le code parent de cet appareil."),
      h("button", { type: "button", class: "pbtn danger", onclick: () => {
        const s = sheet(screen, h("div", { class: "parent", style: "display:flex;flex-direction:column;gap:14px;max-width:420px" },
          h("h1", {}, "Tout effacer ?"), h("p", { class: "muted" }, "Cette action est définitive."),
          h("div", { class: "p-row", style: "justify-content:center" },
            h("button", { type: "button", class: "pbtn danger", onclick: () => { app.data = defaultData(); saveData(app.data); s.close(); nav.setup(); } }, "Oui, tout effacer"),
            h("button", { type: "button", class: "pbtn ghost", onclick: () => s.close() }, "Annuler"))));
      } }, "Tout effacer"));
    const privacy = h("div", { class: "note" },
      "Où sont les données ? Uniquement sur cet appareil, dans le stockage du navigateur. Aucun compte, aucune mesure d'audience. ",
      "Seule exception : quand vous demandez une histoire, la demande (thème, héros, sons connus, sans le prénom) part chez Anthropic avec votre clé. ",
      "La sauvegarde contient les progrès et les histoires, mais pas les dessins (gardés sur l'appareil) ni la clé API. ",
      "Dans la version d'essai ouverte depuis Claude, ce stockage peut être vidé par le navigateur : copiez une sauvegarde de temps en temps.");
    const drawCards = app.data.profiles.map((p) => {
      const n = gallery.list(p.id).length;
      return h("div", { class: "p-item" }, h("div", { class: "grow" }, h("b", {}, `Dessins de ${p.name}`), h("div", { class: "muted" }, `${n} dessin${n > 1 ? "s" : ""} gardé${n > 1 ? "s" : ""} (les 12 derniers)`)),
        n ? h("button", { type: "button", class: "pbtn danger", onclick: () => { if (confirm(`Effacer les dessins de ${p.name} ?`)) { gallery.clear(p.id); render(); } } }, "Effacer") : null);
    });
    const drawCard = h("div", { class: "p-card" }, h("h2", {}, "Galerie de dessins"), h("div", { class: "p-list" }, ...drawCards));
    const warn = storageFailed() ? h("div", { class: "note", style: "background:#FDECEA;border-color:#F4B4AE" }, "Attention : l'enregistrement échoue sur cet appareil (navigation privée ou stockage plein). Les progrès seront perdus à la fermeture.") : null;
    return [privacy, ...(warn ? [warn] : []), h("div", { class: "p-grid" }, exportCard, importCard), drawCard, resetCard];
  }
}
