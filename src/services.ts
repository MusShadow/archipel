// Services : stockage local, voix (synthèse vocale de l'appareil), sons synthétisés.
import type { ActivityId, Form, SkillState, Staircase } from "./core";

// ---------- Données ----------
export interface LogEntry { t: number; activity: ActivityId; level: number; skill: string; correct: boolean; hints: number; form: Form; ms: number }
export interface Sticker { t: number; kind: string; ref?: string; reason: string }
export interface SessionRecord { start: number; end: number; minutes: Partial<Record<string, number>>; activities: ActivityId[] }
export interface FlagStat { seen: number; ok: number; last: number }
export interface Profile {
  id: string; name: string; ageMonths: number; color: string; createdAt: number;
  knownK: number;
  skills: Record<string, SkillState>;
  stairs: Partial<Record<ActivityId, Staircase>>;
  flags: Record<string, FlagStat>;
  log: LogEntry[];
  stickers: Sticker[];
  sessions: SessionRecord[];
  goals: string[];
  restUntil?: number;
}
export interface Settings { sessionMinutes: number; accompanied: boolean; voiceURI: string | null; rate: number; sessionsPerWeek: number }
export interface AppData { version: 1; pin: string | null; settings: Settings; profiles: Profile[]; activeId: string | null }

const KEY = "archipel.v1";
export const defaultSettings = (): Settings => ({ sessionMinutes: 12, accompanied: true, voiceURI: null, rate: 0.9, sessionsPerWeek: 3 });
export const defaultData = (): AppData => ({ version: 1, pin: null, settings: defaultSettings(), profiles: [], activeId: null });

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch { /* stockage indisponible : on repart d'un état vide */ }
  return defaultData();
}
export function normalize(d: any): AppData {
  const base = defaultData();
  if (!d || typeof d !== "object") return base;
  const profiles: Profile[] = Array.isArray(d.profiles) ? d.profiles.map((p: any) => ({
    id: String(p.id), name: String(p.name ?? "Enfant"), ageMonths: Number(p.ageMonths ?? 54), color: String(p.color ?? "#FFC145"),
    createdAt: Number(p.createdAt ?? Date.now()), knownK: Number(p.knownK ?? 11), skills: p.skills ?? {}, stairs: p.stairs ?? {},
    flags: p.flags ?? {}, log: Array.isArray(p.log) ? p.log : [], stickers: Array.isArray(p.stickers) ? p.stickers : [],
    sessions: Array.isArray(p.sessions) ? p.sessions : [], goals: Array.isArray(p.goals) ? p.goals : [],
    restUntil: typeof p.restUntil === "number" ? p.restUntil : undefined,
  })) : [];
  return { version: 1, pin: typeof d.pin === "string" ? d.pin : null, settings: { ...base.settings, ...(d.settings ?? {}) }, profiles, activeId: d.activeId ?? null };
}
let saveFailed = false;
export function saveData(d: AppData): boolean {
  for (const p of d.profiles) if (p.log.length > 4000) p.log = p.log.slice(-4000);
  try { localStorage.setItem(KEY, JSON.stringify(d)); saveFailed = false; return true; } catch { saveFailed = true; return false; }
}
export const storageFailed = () => saveFailed;

// ---------- Voix ----------
const PREFERRED = ["amélie", "amelie", "audrey", "aurélie", "aurelie", "marie", "thomas", "google français", "denise", "henri", "julie"];
class Speech {
  voice: SpeechSynthesisVoice | null = null;
  rate = 0.9;
  private token = 0;
  get available() { return typeof window !== "undefined" && "speechSynthesis" in window; }
  frenchVoices(): SpeechSynthesisVoice[] {
    if (!this.available) return [];
    return speechSynthesis.getVoices().filter((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("fr"));
  }
  init(preferredURI: string | null) {
    if (!this.available) return;
    const pick = () => {
      const vs = this.frenchVoices();
      const chosen = vs.find((v) => v.voiceURI === preferredURI);
      if (chosen) { this.voice = chosen; return; }
      const score = (v: SpeechSynthesisVoice) => {
        const n = v.name.toLowerCase();
        let s = (v.lang || "").toLowerCase().replace("_", "-") === "fr-fr" ? 4 : 0;
        if (PREFERRED.some((p) => n.includes(p))) s += 3;
        if (/(enhanced|premium|améliorée|amelioree|natural|neural)/.test(n)) s += 3;
        if (v.localService) s += 1;
        return s;
      };
      this.voice = vs.sort((a, b) => score(b) - score(a))[0] ?? null;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  }
  say(text: string, rate?: number): Promise<void> {
    if (!this.available || !text) return Promise.resolve();
    const my = ++this.token;
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice?.lang ?? "fr-FR";
      if (this.voice) u.voice = this.voice;
      u.rate = rate ?? this.rate;
      u.pitch = 1.05;
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      u.onend = finish;
      u.onerror = finish;
      // Certains navigateurs n'émettent pas toujours « end » : filet de sécurité.
      setTimeout(finish, 900 + text.length * 85);
      if (my === this.token) speechSynthesis.speak(u);
    });
  }
  stop() { if (this.available) { this.token++; if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } }
}
export const speech = new Speech();
export const frenchVoiceLabel = (v: SpeechSynthesisVoice) => `${v.name.replace(/\s*\(.*\)\s*/g, " ").trim()} · ${v.lang}`;

// ---------- Sons (synthétisés, aucun fichier) ----------
class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  unlock() {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    } catch { this.ctx = null; }
  }
  private tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  tap() { this.tone(660, 0, 0.08, "triangle", 0.06); }
  success() { [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, i * 0.09, 0.35, "triangle", 0.1)); }
  soft() { this.tone(392, 0, 0.18, "sine", 0.07); this.tone(349.23, 0.14, 0.25, "sine", 0.06); }
  sticker() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => this.tone(f, i * 0.06, 0.25, "sine", 0.05)); }
  sunset() { [659.25, 587.33, 523.25, 392].forEach((f, i) => this.tone(f, i * 0.22, 0.5, "triangle", 0.08)); }
  breathIn() { this.tone(330, 0, 1.2, "sine", 0.03); }
}
export const sfx = new Sfx();
