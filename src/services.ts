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
  departDone?: boolean;
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
    departDone: p.departDone === true || (Array.isArray(p.log) && p.log.length > 30),
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

// ---------- Voix du parent (studio voix) ----------
// Courts enregistrements gardés à part (clé distincte), hors de la sauvegarde texte.
export const VOICE_SLOTS: { id: string; label: string; idea: string }[] = [
  { id: "bonjour", label: "Au début d'une séance", idea: "Bonjour mon explorateur, bon voyage sur l'archipel !" },
  { id: "bravo", label: "Après une bonne réponse", idea: "Bravo, tu as bien cherché !" },
  { id: "effort", label: "Après une réponse trouvée avec de l'aide", idea: "Tu n'as rien lâché, c'est comme ça qu'on apprend !" },
  { id: "aurevoir", label: "À la fin de la séance", idea: "Bravo pour ce voyage, à demain !" },
];
const VOICE_KEY = "archipel.voix";
class Voice {
  private clips: Record<string, string> = {};
  private audio: HTMLAudioElement | null = null;
  constructor() {
    try { this.clips = JSON.parse(localStorage.getItem(VOICE_KEY) ?? "{}") ?? {}; } catch { this.clips = {}; }
  }
  has(slot: string) { return typeof this.clips[slot] === "string"; }
  set(slot: string, dataUrl: string) {
    this.clips[slot] = dataUrl;
    try { localStorage.setItem(VOICE_KEY, JSON.stringify(this.clips)); return true; } catch { delete this.clips[slot]; return false; }
  }
  remove(slot: string) {
    delete this.clips[slot];
    try { localStorage.setItem(VOICE_KEY, JSON.stringify(this.clips)); } catch { /* rien */ }
  }
  play(slot: string): Promise<void> {
    const src = this.clips[slot];
    if (!src || typeof Audio === "undefined") return Promise.resolve();
    speech.stop();
    this.audio?.pause();
    const a = new Audio(src);
    this.audio = a;
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      a.onended = finish; a.onerror = finish;
      setTimeout(finish, 8000);
      a.play().catch(finish);
    });
  }
  // Enregistrement : micro de l'appareil, arrêt automatique après quelques secondes.
  get canRecord() { return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof (window as any).MediaRecorder !== "undefined"; }
  async record(maxMs = 6000, onStart?: (stop: () => void) => void): Promise<string> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const MR = (window as any).MediaRecorder;
    const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((t) => MR.isTypeSupported?.(t));
    const rec = new MR(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e: BlobEvent) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise<void>((r) => { rec.onstop = () => r(); });
    const stop = () => { if (rec.state !== "inactive") rec.stop(); };
    rec.start();
    onStart?.(stop);
    const timer = setTimeout(stop, maxMs);
    await stopped;
    clearTimeout(timer);
    stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    const blob = new Blob(chunks, { type: rec.mimeType || type || "audio/webm" });
    return await new Promise<string>((resolve, reject) => { const fr = new FileReader(); fr.onload = () => resolve(String(fr.result)); fr.onerror = () => reject(fr.error); fr.readAsDataURL(blob); });
  }
}
export const voice = new Voice();

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
  drum() { this.tone(150, 0, 0.16, "triangle", 0.16); this.tone(95, 0.01, 0.22, "sine", 0.12); }
  hop() { this.tone(520, 0, 0.09, "sine", 0.07); this.tone(780, 0.07, 0.1, "sine", 0.06); }
}
export const sfx = new Sfx();
