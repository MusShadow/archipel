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
  // Comment la dernière phrase a été dite (diagnostic de l'espace parent).
  lastPath: "" | "naturelle" | "lecteur" | "appareil" = "";
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
      if (segs && segs.length) {
        const factor = Math.min(1.3, Math.max(0.75, NORMAL_RATE / (rate ?? this.rate)));
        const alive = () => my === this.token;
        const ctx = sfx.context;
        // Moteur audio d'abord ; sur iPad, s'il ne répond pas, le lecteur audio ; en dernier, la voix de l'appareil.
        const audio = ctx && ctx.state !== "closed" ? natural.play(ctx, segs, factor, alive) : Promise.resolve(false);
        return audio
          .then((ok) => {
            if (ok) { this.lastPath = "naturelle"; return true; }
            if (!alive()) return true;
            return natural.playElement(segs, factor, alive).then((ok2) => { if (ok2) this.lastPath = "lecteur"; return ok2; });
          })
          .then((ok) => (ok || !alive() ? undefined : this.device(text, rate, my)));
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
    this.lastPath = "appareil";
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
// Chaque clip commence par une étiquette ID3 (ajoutée par l'encodeur) : retirée avant le décodage, que certains
// décodeurs supportent mal ; le MP3 commence juste après.
export function stripID3(b: ArrayBuffer): ArrayBuffer {
  const u = new Uint8Array(b);
  if (u.length > 10 && u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) {
    const skip = 10 + (((u[6] & 0x7f) << 21) | ((u[7] & 0x7f) << 14) | ((u[8] & 0x7f) << 7) | (u[9] & 0x7f)) + (u[5] & 0x10 ? 10 : 0);
    if (skip < u.length) return b.slice(skip);
  }
  return b;
}
// iPad et iPhone (l'iPad se présente comme un Mac à écran tactile).
const appleTouch = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && (navigator.maxTouchPoints ?? 0) > 1));
// Silence de 0,1 s : joué par le lecteur audio pendant un contact, il le déverrouille (iPad).
const SILENCE = "data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
// Safari (iPad, iPhone) range le son des pages parmi les sons d'ambiance : il est coupé en mode silencieux, alors que
// la voix de l'appareil continue. Une lecture déclarée « playback » (API Audio Session, Safari 16.4 et plus) l'en sort.
export function audioPlayback() {
  try { const s = (navigator as any).audioSession; if (s && s.type !== "playback") s.type = "playback"; } catch { /* navigateur sans cette API */ }
}
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
  // Dernière raison d'échec (diagnostic de l'espace parent).
  lastError = "";
  // Lecteur audio de secours (iPad) : la même phrase, clip par clip, quand le moteur Web Audio ne répond pas.
  private el: HTMLAudioElement | null = null;
  private elReady = false;
  private elPending = false;
  private elClip = false;
  private urls = new Map<string, string>();
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
    let buf = await decodeClip(ctx, stripID3(pack.slice(off, off + len)));
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
  // Déverrouille le lecteur de secours : un silence joué pendant un contact de l'enfant (iPad seulement).
  unlockElement() {
    if (this.elReady || this.elPending || typeof Audio === "undefined" || !appleTouch()) return;
    try {
      const a = this.el ?? (this.el = new Audio());
      this.elPending = true;
      a.src = SILENCE;
      const p = a.play();
      // Lecture acceptée pendant le contact : le lecteur est déverrouillé, même si elle est coupée aussitôt (AbortError).
      const done = (ok: boolean) => { this.elPending = false; if (ok) this.elReady = true; };
      if (p && typeof p.then === "function") p.then(() => done(true), (e: unknown) => done((e as { name?: string })?.name === "AbortError"));
      else done(true);
    } catch { this.elPending = false; }
  }
  private async clipURL(key: string): Promise<string | null> {
    const hit = this.urls.get(key);
    if (hit) return hit;
    const [pi, off, len] = this.index!.clips[key];
    const pack = this.packs[pi] ?? await withTimeout(this.pack(pi), 4000, null);
    if (!pack) return null;
    const url = URL.createObjectURL(new Blob([pack.slice(off, off + len)], { type: "audio/mpeg" }));
    this.urls.set(key, url);
    if (this.urls.size > 200) { const [k, u] = this.urls.entries().next().value!; URL.revokeObjectURL(u); this.urls.delete(k); }
    return url;
  }
  async playElement(segs: Seg[], factor: number, alive: () => boolean): Promise<boolean> {
    const a = this.el;
    if (!a || !this.elReady || !this.index) return false;
    this.stop();
    for (let i = 0; i < segs.length; i++) {
      if (!alive()) return true;
      const url = await this.clipURL(segs[i].key);
      if (!url) { this.lastError = "paquet de voix absent"; return false; }
      if (!alive()) return true;
      const ok = await new Promise<boolean>((resolve) => {
        let done = false;
        const fin = (v: boolean) => {
          if (done) return;
          done = true; this.elClip = false; a.onended = null; a.onerror = null; clearTimeout(timer);
          if (this.ending === stopper) this.ending = null;
          resolve(v);
        };
        const stopper = () => { try { a.pause(); } catch { /* rien */ } this.elClip = false; fin(true); };
        const timer = setTimeout(() => fin(true), 15000);
        a.onended = () => fin(true);
        a.onerror = () => fin(false);
        this.ending = stopper;
        this.elClip = true;
        a.src = url;
        try { (a as any).preservesPitch = true; (a as any).webkitPreservesPitch = true; } catch { /* rien */ }
        a.defaultPlaybackRate = a.playbackRate = 1 / factor;
        a.play().then(undefined, () => fin(false));
      });
      if (!ok) { this.lastError = "lecteur audio refusé"; return i > 0; }
      if (i < segs.length - 1 && segs[i].gapMs) await new Promise((r) => setTimeout(r, segs[i].gapMs * factor));
    }
    return true;
  }
  // Joue les clips à la suite (avec les pauses de la ponctuation). false : impossible, la voix de l'appareil prend le relais.
  async play(ctx: AudioContext, segs: Seg[], factor: number, alive: () => boolean): Promise<boolean> {
    const bufs: AudioBuffer[] = [];
    try {
      for (const s of segs) {
        const b = await this.buffer(ctx, s.key, Math.abs(factor - 1) < 0.02 ? 1 : factor);
        if (!b) { this.lastError = "paquet de voix absent"; return false; }
        bufs.push(b);
      }
    } catch { this.lastError = "décodage impossible"; return false; }
    if (!alive()) return true;
    // Juste après le premier contact, le contexte audio peut être encore en train de démarrer.
    if (ctx.state !== "running") await withTimeout(ctx.resume().then(() => true, () => false), 500, false);
    if (!alive()) return true;
    if (ctx.state !== "running") { this.lastError = (ctx.state as string) === "interrupted" ? "moteur audio interrompu" : "moteur audio en pause"; return false; }
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
    if (this.el && this.elClip && !this.el.paused) { try { this.el.pause(); } catch { /* rien */ } }
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
    audioPlayback();
    const blob = new Blob(chunks, { type: rec.mimeType || type || "audio/webm" });
    return await new Promise<string>((resolve, reject) => { const fr = new FileReader(); fr.onload = () => resolve(String(fr.result)); fr.onerror = () => reject(fr.error); fr.readAsDataURL(blob); });
  }
}
export const voice = new Voice();

// ---------- Sons (synthétisés, aucun fichier) ----------
class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  private stale = false;
  // Contexte audio partagé avec la voix naturelle. Safari ne le laisse démarrer que pendant une fin d'appui ou un
  // clic (gesture = true), et peut l'interrompre (autre appli, veille, voix de l'appareil) : il est relancé à chaque
  // contact, et recréé au contact suivant s'il reste bloqué.
  get context() { return this.ctx; }
  unlock(gesture = false) {
    try {
      audioPlayback();
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (this.ctx && this.stale && gesture) { try { void this.ctx.close(); } catch { /* déjà fermé */ } this.ctx = null; this.stale = false; }
      if (!this.ctx) {
        if (!gesture) return;
        this.ctx = new AC() as AudioContext;
        this.ctx.onstatechange = () => this.revive();
      }
      const ctx = this.ctx;
      const st = ctx.state as string;
      if (st === "suspended" || st === "interrupted") {
        ctx.resume().catch(() => { /* au prochain contact */ });
        if (gesture) setTimeout(() => { if (this.ctx === ctx && (ctx.state as string) !== "running") this.stale = true; }, 600);
      }
      if (gesture) {
        // Un échantillon de silence joué pendant le contact : déverrouille le son sur les anciens iPad.
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        src.connect(ctx.destination);
        src.start(0);
        natural.unlockElement();
      }
    } catch { this.ctx = null; }
  }
  // Contexte interrompu ou mis en pause par le système : on tente de le relancer (permis s'il a déjà joué).
  private revive() {
    const ctx = this.ctx;
    const st = ctx ? (ctx.state as string) : "";
    if (ctx && (st === "interrupted" || st === "suspended") && !document.hidden) ctx.resume().catch(() => { /* au prochain contact */ });
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

  // ---------- Bruits des fêtes de réussite (synthétisés : aucun fichier) ----------
  private noiseBuf: AudioBuffer | null = null;
  private sweep(f0: number, f1: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.05) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.05, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private noise(start: number, dur: number, gain: number, type: BiquadFilterType, f0: number, f1 = f0) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    if (!this.noiseBuf || this.noiseBuf.sampleRate !== ctx.sampleRate) {
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    const t0 = ctx.currentTime + start;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noiseBuf; src.loop = true;
    f.type = type;
    f.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  pop() { this.noise(0, 0.08, 0.3, "bandpass", 1800); this.tone(220, 0, 0.06, "square", 0.03); }
  whistle() { this.sweep(700, 1600, 0, 0.55, "sine", 0.025); }
  bang() { this.noise(0, 0.4, 0.22, "lowpass", 1400, 300); for (let i = 0; i < 6; i++) this.noise(0.12 + i * 0.07 + Math.random() * 0.04, 0.03, 0.06, "highpass", 4000); }
  honk() { [0, 0.22].forEach((t) => { this.tone(392, t, 0.16, "square", 0.025); this.tone(494, t, 0.16, "square", 0.02); }); }
  vroom() { this.sweep(70, 160, 0, 0.7, "sawtooth", 0.025); }
  pinpon() { for (let i = 0; i < 4; i++) this.tone(i % 2 ? 488 : 435, i * 0.38, 0.36, "triangle", 0.055); }
  rumble(dur = 0.7) { this.noise(0, dur, 0.25, "lowpass", 180, 120); }
  whoosh() { this.noise(0, 0.9, 0.12, "bandpass", 300, 2400); }
  fanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.12, i === 3 ? 0.7 : 0.2, "triangle", 0.09)); }
}
export const sfx = new Sfx();
