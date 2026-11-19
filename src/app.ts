// État de l'application : données, profil actif, séance en cours, navigation entre écrans.
import { compagnonLibre, estCompagnon } from "./compagnons";
import { DOMAINS, SKILLS, newSkill, type ActivityId, type DomainId } from "./core";
import { loadData, saveData, speech, type AppData, type Profile, type SessionRecord, type Sticker } from "./services";

export interface Session {
  start: number; pausedMs: number; pauseStart: number | null;
  minutes: Partial<Record<DomainId, number>>; activities: ActivityId[]; stickers: Sticker[]; greeted: boolean; warned: boolean; ended: boolean;
  // Exercices déjà faits pendant la séance, par activité (pour ne pas reposer deux fois la même question).
  seen: Record<string, Record<string, number>>;
}

class App {
  data: AppData = loadData();
  root!: HTMLElement;
  session: Session | null = null;
  private cleanup: (() => void) | null = null;

  get profile(): Profile | null {
    return this.data.profiles.find((p) => p.id === this.data.activeId) ?? this.data.profiles[0] ?? null;
  }
  save() { saveData(this.data); }

  show(el: HTMLElement, cleanup?: () => void) {
    if (this.cleanup) { try { this.cleanup(); } catch { /* écran déjà détruit */ } }
    this.cleanup = cleanup ?? null;
    speech.stop();
    const ancien = Array.from(this.root.children).find((c) => !c.classList.contains("fondu")) as HTMLElement | undefined;
    this.root.replaceChildren(el);
    if (ancien && ancien !== el) fondu(this.root, ancien);
  }

  // ----- Séance -----
  // Le temps de séance est suspendu au coin calme et quand l'appli passe en arrière-plan.
  private pauses = new Set<string>();
  startSession() {
    this.pauses.clear();
    this.session = { start: Date.now(), pausedMs: 0, pauseStart: null, minutes: {}, activities: [], stickers: [], greeted: false, warned: false, ended: false, seen: {} };
  }
  pause(reason = "pause") {
    const s = this.session;
    this.pauses.add(reason);
    if (s && s.pauseStart == null) s.pauseStart = Date.now();
  }
  resume(reason = "pause") {
    const s = this.session;
    this.pauses.delete(reason);
    if (s && s.pauseStart != null && this.pauses.size === 0) { s.pausedMs += Date.now() - s.pauseStart; s.pauseStart = null; }
  }
  elapsedMs() {
    const s = this.session;
    if (!s) return 0;
    const paused = s.pausedMs + (s.pauseStart != null ? Date.now() - s.pauseStart : 0);
    return Math.max(0, Date.now() - s.start - paused);
  }
  sessionFraction() { return Math.min(1, this.elapsedMs() / (this.data.settings.sessionMinutes * 60_000)); }
  timeUp() { return !!this.session && this.sessionFraction() >= 1; }
  // Enregistré au fil de l'eau : une séance interrompue (appli fermée) reste dans l'historique.
  addMinutes(domain: DomainId, ms: number, activity: ActivityId) {
    const s = this.session;
    const p = this.profile;
    if (!s) return;
    s.minutes[domain] = (s.minutes[domain] ?? 0) + ms / 60_000;
    if (!s.activities.includes(activity)) s.activities.push(activity);
    if (p) {
      const rec: SessionRecord = { start: s.start, end: Date.now(), minutes: { ...s.minutes }, activities: [...s.activities] };
      const i = p.sessions.findIndex((x) => x.start === s.start);
      if (i >= 0) p.sessions[i] = rec; else p.sessions.push(rec);
      if (p.sessions.length > 400) p.sessions = p.sessions.slice(-400);
      this.save();
    }
  }
  endSession(rest = false) {
    const s = this.session;
    const p = this.profile;
    if (!s || s.ended) return;
    s.ended = true;
    if (p && rest) p.restUntil = Date.now() + 60 * 60_000;
    this.save();
    this.session = null;
  }
  minutesThisWeek(p: Profile): Partial<Record<DomainId, number>> {
    const since = Date.now() - 7 * 86_400_000;
    const out: Partial<Record<DomainId, number>> = {};
    for (const s of p.sessions) if (s.start >= since) for (const [d, m] of Object.entries(s.minutes)) out[d as DomainId] = (out[d as DomainId] ?? 0) + (m ?? 0);
    return out;
  }
}
export const app = new App();

// Passage d'un écran à l'autre (350 ms) : le nouvel écran est en place tout de suite (on peut le toucher, les tests et
// VoiceOver ne voient que lui) ; l'ancien, rangé dans une ombre fermée (shadow DOM) avec une copie des styles, s'efface
// par-dessus. Réglage « Réduire les animations » de l'iPad : pas de fondu.
const DUREE_FONDU = 350;
let styles = { n: -1, texte: "" };
function feuilles(): string {
  const els = document.querySelectorAll("head style");
  if (els.length !== styles.n) styles = { n: els.length, texte: Array.from(els).map((e) => e.textContent ?? "").join("\n") };
  return styles.texte;
}
function fondu(root: HTMLElement, ancien: HTMLElement) {
  try {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const voile = document.createElement("div");
    if (!voile.attachShadow || !voile.animate) return;
    voile.className = "fondu";
    voile.setAttribute("aria-hidden", "true");
    voile.setAttribute("inert", "");
    const ombre = voile.attachShadow({ mode: "closed" });
    const st = document.createElement("style");
    st.textContent = feuilles();
    ombre.append(st, ancien);
    root.appendChild(voile);
    let fini = false;
    const fin = () => { if (!fini) { fini = true; voile.remove(); } };
    const a = voile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUREE_FONDU, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)", fill: "forwards" });
    a.onfinish = fin;
    a.oncancel = fin;
    setTimeout(fin, DUREE_FONDU + 250);
  } catch { /* sans fondu */ }
}

// ----- Création d'un profil à partir du questionnaire de repères -----
export interface Intake { name: string; ageMonths: number; color: string; readingK: number; countTo: number; flags: 0 | 1 | 2; avatar?: string }
export function createProfile(i: Intake): Profile {
  const p: Profile = {
    id: Math.random().toString(36).slice(2, 10), name: i.name.trim() || "Enfant", ageMonths: i.ageMonths, color: i.color, createdAt: Date.now(),
    knownK: i.readingK, skills: {}, stairs: {}, flags: {}, log: [], stickers: [], sessions: [], goals: [], departDone: false, stories: [],
    avatar: estCompagnon(i.avatar) ? i.avatar : compagnonLibre(app.data.profiles.map((q) => q.avatar)),
  };
  applyPriors(p, i);
  return p;
}
// Point de départ : on suppose acquis ce qui est en dessous du niveau déclaré, en cours ce qui est au niveau.
export function applyPriors(p: Profile, i: Intake) {
  const set = (id: string, theta: number) => { p.skills[id] = { ...newSkill(theta) }; };
  const readLevel = i.readingK >= 15 ? 3 : i.readingK >= 11 ? 2 : i.readingK >= 5 ? 1 : 0;
  set("LECT.SYL.ECOUTE", [-1.5, -0.3, 1.2, 2][readLevel]);
  set("LECT.SYL.FABRIQUE", [-2, -0.8, 0.3, 1.3][readLevel]);
  set("LECT.MOT.FABRIQUE", [-2.5, -1.5, 0, 0.8][readLevel]);
  set("LECT.MOT.LIRE", [-3, -2, -0.5, 1][readLevel]);
  const c = i.countTo;
  set("NUM.VOIR.4", c >= 5 ? 1 : -0.5);
  set("NUM.COMPTE.10", c >= 10 ? 1.2 : -0.5);
  set("NUM.COMPTE.20", c >= 20 ? 1.4 : c >= 10 ? 0 : -1);
  set("NUM.COMPLEMENT.10", c >= 30 ? 0.6 : c >= 20 ? 0 : -1);
  set("NUM.DIZAINES.LIRE", c >= 60 ? 1 : c >= 30 ? 0 : -1.5);
  set("NUM.DIZAINES.FAIRE", c >= 60 ? 0.8 : -1.5);
  set("VOY.DRAPEAU.ECOUTE", [-0.6, 0.4, 1.2][i.flags]);
  set("VOY.CARTE.CONTINENT", [-0.5, 0, 0.6][i.flags]);
  set("VOY.DRAPEAU.LIRE", readLevel >= 2 ? 0 : -1.5);
  set("VOY.DRAPEAU.JUMEAUX", [-1.5, -0.5, 0.5][i.flags]);
  set("LECT.PHONO.SYLLABES", [-0.6, 0.4, 1.2, 1.8][readLevel]);
  set("LECT.PHONO.RIME", [-0.8, 0, 0.8, 1.4][readLevel]);
  set("LECT.PHONO.ATTAQUE", [-1, -0.2, 0.6, 1.2][readLevel]);
  set("LECT.PHONO.PHONEME", [-1.5, -0.6, 0.4, 1][readLevel]);
  set("LECT.GROUPE.LIRE", [-3.5, -3, -1, 0.4][readLevel]);
  set("LECT.PHRASE.LIRE", [-4, -3.5, -1.5, 0][readLevel]);
  set("NUM.LIGNE.REPERE", c >= 10 ? 0.6 : -0.6);
  set("NUM.LIGNE.ORDRE", c >= 20 ? 0.6 : c >= 10 ? 0 : -1);
  set("NUM.LIGNE.PLUS", c >= 20 ? 0.2 : -1);
  set("NUM.LIGNE.MOINS", c >= 30 ? 0.2 : -1.2);
  set("NUM.LIGNE.BONDS", c >= 60 ? 0.6 : -1.5);
  set("NUM.PARTAGE.EGAL", c >= 10 ? 0.2 : -0.6);
  set("NUM.PARTAGE.RESTE", c >= 20 ? -0.2 : -1.2);
  set("NUM.PARTAGE.COMBIEN", c >= 30 ? 0 : -1.5);
  p.stairs.syllabes = { level: [1, 1, 2, 4][readLevel], up: 0, down: 0 };
  p.stairs.chants = { level: [1, 2, 3, 3][readLevel], up: 0, down: 0 };
  p.stairs.lis = { level: readLevel >= 3 ? 2 : 1, up: 0, down: 0 };
  p.stairs.nenuphars = { level: c >= 30 ? 3 : c >= 10 ? 2 : 1, up: 0, down: 0 };
  p.stairs.partage = { level: c >= 20 ? 2 : 1, up: 0, down: 0 };
  p.stairs.marche = { level: c >= 60 ? 4 : c >= 30 ? 4 : c >= 20 ? 3 : c >= 10 ? 2 : 1, up: 0, down: 0 };
  p.stairs.drapeau = { level: [1, 2, 3][i.flags], up: 0, down: 0 };
  for (const s of Object.values(p.skills)) { s.n = 0; }
}
export const domainOf = (id: string) => DOMAINS.find((d) => d.id === SKILLS.find((s) => s.id === id)?.domain);
