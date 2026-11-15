// Services : stockage local, voix (pack de voix naturelle, sinon synthèse vocale de l'appareil), sons synthétisés.
import type { ActivityId, Form, SkillState, Staircase } from "./core";
import { planText, stretch, type Seg, type VoixIndex } from "./voix";

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
  stories: Story[];
  myFlag?: MyFlag;
}
export interface Story {
  id: string; t: number; titre: string; phrases: string[]; question: { texte: string; choix: string[]; bonne: number }; k: number;
  emoji?: string; images?: string[]; theme?: string; heros?: string; lu?: number;
}
export interface MyFlag { layout: string; colors: string[]; symbol: string; symbolColor: string }
// voix : « naturelle » (pack enregistré, voix de l'appareil en secours) ou « appareil » (synthèse de l'appareil seule).
export type VoixMode = "naturelle" | "appareil";
export interface Settings { sessionMinutes: number; accompanied: boolean; voiceURI: string | null; rate: number; sessionsPerWeek: number; voix: VoixMode }
export interface AppData { version: 1; pin: string | null; settings: Settings; profiles: Profile[]; activeId: string | null }

const KEY = "archipel.v1";
export const defaultSettings = (): Settings => ({ sessionMinutes: 12, accompanied: true, voiceURI: null, rate: 0.9, sessionsPerWeek: 3, voix: "naturelle" });
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
    stories: Array.isArray(p.stories) ? p.stories : [],
    myFlag: p.myFlag && typeof p.myFlag === "object" ? p.myFlag : undefined,
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
// Une seule entrée : speech.say(texte, débit?) → promesse tenue à la fin de la phrase (les activités s'enchaînent dessus).
// La voix naturelle (pack de clips enregistrés) est essayée d'abord ; ce qu'elle ne sait pas dire en entier
// (histoires sur mesure, phrase nouvelle…) passe par la synthèse vocale de l'appareil.
const PREFERRED = ["amélie", "amelie", "audrey", "aurélie", "aurelie", "marie", "thomas", "google français", "denise", "henri", "julie"];
const NORMAL_RATE = 0.9;
class Speech {
  voice: SpeechSynthesisVoice | null = null;
  rate = NORMAL_RATE;
  mode: VoixMode = "naturelle";
  // Prénom de l'enfant actif : la voix naturelle dit les phrases sans lui (il n'est jamais enregistré).
  childName: () => string | null = () => null;
  // Phrases dites par la voix de l'appareil faute de clip (pour vérifier la couverture du pack).
  readonly misses: string[] = [];
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
    if (!text) return Promise.resolve();
    const my = ++this.token;
    this.halt();
    if (this.mode === "naturelle" && natural.state === "prête") {
      const segs = natural.plan(text, this.childName());
      const ctx = sfx.context;
      if (segs && segs.length && ctx && ctx.state !== "closed") {
        const factor = Math.min(1.3, Math.max(0.75, NORMAL_RATE / (rate ?? this.rate)));
        return natural.play(ctx, segs, factor, () => my === this.token)
          .then((ok) => (ok || my !== this.token ? undefined : this.device(text, rate, my)));
      }
      if (!segs) this.miss(text);
    }
    return this.device(text, rate, my);
  }
  private miss(text: string) {
    if (!this.misses.includes(text)) { this.misses.push(text); if (this.misses.length > 300) this.misses.shift(); }
  }
  private device(text: string, rate: number | undefined, my: number): Promise<void> {
    if (!this.available) return Promise.resolve();
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
  private halt() {
    natural.stop();
    if (this.available && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  }
  stop() { this.token++; this.halt(); }
}

// ---------- Voix naturelle : pack de clips (MP3) servi avec l'appli et gardé pour le hors-ligne ----------
declare const __VOIX__: string | undefined;
export type VoixState = "absente" | "chargement" | "prête" | "erreur";
const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
function decodeClip(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Ancienne forme à rappels (Safari) et forme à promesse : la première réponse compte.
    const p = ctx.decodeAudioData(data, resolve, reject) as unknown as Promise<AudioBuffer> | undefined;
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}
class NaturalVoice {
  index: VoixIndex | null = null;
  state: VoixState = "absente";
  loadedBytes = 0;
  onchange: (() => void) | null = null;
  private base = "";
  private packs: (ArrayBuffer | null)[] = [];
  private loads = new Map<number, Promise<ArrayBuffer | null>>();
  private cache = new Map<string, AudioBuffer>();
  private sources: AudioBufferSourceNode[] = [];
  private ending: (() => void) | null = null;
  get url() { return typeof __VOIX__ === "string" ? __VOIX__ : ""; }
  get complete() { return !!this.index && this.packs.every(Boolean); }
  async init(url = this.url) {
    if (!url || typeof fetch === "undefined" || this.state === "chargement" || this.state === "prête") return;
    // Fichier ouvert directement (file://) : rien à télécharger, la voix de l'appareil suffit.
    if (typeof location !== "undefined" && location.protocol === "file:") { this.state = "erreur"; return; }
    this.state = "chargement"; this.onchange?.();
    try {
      const raw = await this.file(url);
      if (!raw) throw new Error("index");
      const index = JSON.parse(new TextDecoder().decode(raw)) as VoixIndex;
      this.base = url.slice(0, url.lastIndexOf("/") + 1);
      this.packs = index.paquets.map(() => null);
      this.index = index;
      if (!(await this.pack(0))) throw new Error("paquet commun");
      this.state = "prête"; this.onchange?.();
      // Les paquets des îles suivent, un par un. Si le service worker est en train de les garder (premier lancement,
      // nouvelle version), on attend qu'il ait fini : ils sont alors lus dans sa copie, sans second téléchargement.
      await this.workerInstalled();
      for (let i = 1; i < this.packs.length; i++) await this.pack(i);
    } catch {
      if (this.state !== "prête") { this.state = "erreur"; this.index = null; }
    }
    this.onchange?.();
  }
  // Fichier du pack : la copie gardée par le service worker d'abord (noms à empreinte : elle est toujours juste).
  private async file(url: string): Promise<ArrayBuffer | null> {
    try {
      if (typeof caches !== "undefined") {
        const hit = await (await caches.open("archipel-voix")).match(new URL(url, location.href).href);
        if (hit) return await hit.arrayBuffer();
      }
    } catch { /* stockage indisponible (cadre isolé) : réseau */ }
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  }
  private async workerInstalled() {
    const sw = typeof navigator !== "undefined" && window.top === window ? navigator.serviceWorker : undefined;
    if (!sw) return;
    if (document.readyState !== "complete") await new Promise((r) => window.addEventListener("load", r, { once: true }));
    await new Promise((r) => setTimeout(r, 2500));
    const reg = await withTimeout(sw.getRegistration().catch(() => undefined), 3000, undefined);
    const w = reg?.installing;
    if (w) await withTimeout(new Promise<void>((r) => w.addEventListener("statechange", () => { if (w.state !== "installing") r(); })), 180000, undefined);
  }
  private pack(i: number): Promise<ArrayBuffer | null> {
    const have = this.packs[i];
    if (have) return Promise.resolve(have);
    let p = this.loads.get(i);
    if (!p) {
      p = this.file(this.base + this.index!.paquets[i].nom)
        .then((b) => { if (b) { this.packs[i] = b; this.loadedBytes += b.byteLength; this.onchange?.(); } return b; })
        .catch(() => null)
        .finally(() => this.loads.delete(i));
      this.loads.set(i, p);
    }
    return p;
  }
  plan(text: string, name: string | null): Seg[] | null {
    return this.index ? planText(text, this.index, name) : null;
  }
  private async buffer(ctx: AudioContext, key: string, factor: number): Promise<AudioBuffer | null> {
    const id = factor === 1 ? key : `${key}@${factor.toFixed(3)}`;
    const hit = this.cache.get(id);
    if (hit) { this.cache.delete(id); this.cache.set(id, hit); return hit; }
    const [pi, off, len] = this.index!.clips[key];
    const pack = this.packs[pi] ?? await withTimeout(this.pack(pi), 4000, null);
    if (!pack) return null;
    let buf = await decodeClip(ctx, pack.slice(off, off + len));
    if (factor !== 1) {
      const y = stretch(buf.getChannelData(0), buf.sampleRate, factor);
      const out = ctx.createBuffer(1, Math.max(1, y.length), buf.sampleRate);
      out.copyToChannel(y as Float32Array<ArrayBuffer>, 0);
      buf = out;
    }
    this.cache.set(id, buf);
    if (this.cache.size > 120) this.cache.delete(this.cache.keys().next().value!);
    return buf;
  }
  // Joue les clips à la suite (avec les pauses de la ponctuation). false : impossible, la voix de l'appareil prend le relais.
  async play(ctx: AudioContext, segs: Seg[], factor: number, alive: () => boolean): Promise<boolean> {
    const bufs: AudioBuffer[] = [];
    try {
      for (const s of segs) {
        const b = await this.buffer(ctx, s.key, Math.abs(factor - 1) < 0.02 ? 1 : factor);
        if (!b) return false;
        bufs.push(b);
      }
    } catch { return false; }
    if (!alive()) return true;
    // Juste après le premier contact, le contexte audio peut être encore en train de démarrer.
    if (ctx.state !== "running") await withTimeout(ctx.resume().then(() => true, () => false), 500, false);
    if (!alive()) return true;
    if (ctx.state !== "running") return false;
    this.stop();
    return new Promise<boolean>((resolve) => {
      let t = ctx.currentTime + 0.03;
      const srcs = bufs.map((b, i) => {
        const src = ctx.createBufferSource();
        src.buffer = b;
        src.connect(ctx.destination);
        src.start(t);
        t += b.duration + (segs[i].gapMs / 1000) * factor;
        return src;
      });
      this.sources = srcs;
      let done = false;
      const timer = setTimeout(() => finish(), (t - ctx.currentTime) * 1000 + 1500);
      const finish = () => { if (!done) { done = true; clearTimeout(timer); if (this.ending === finish) this.ending = null; resolve(true); } };
      this.ending = finish;
      srcs[srcs.length - 1].onended = finish;
    });
  }
  stop() {
    for (const s of this.sources) { try { s.onended = null; s.stop(); } catch { /* déjà fini */ } }
    this.sources = [];
    const e = this.ending; this.ending = null; e?.();
  }
}
export const natural = new NaturalVoice();
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
  // Contexte audio partagé avec la voix naturelle (déverrouillé au premier contact de l'enfant).
  get context() { return this.ctx; }
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
