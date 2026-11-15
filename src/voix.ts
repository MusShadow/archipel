// Voix naturelle de Plume : un « pack de voix » de phrases pré-enregistrées (voix neuronale libre, générée à l'avance),
// lu à la place de la synthèse vocale de l'appareil chaque fois que c'est possible.
// Ce fichier contient la partie texte (sans DOM, testée) : découpage en mots, clés, prénom de l'enfant, plan de lecture.
// Le lecteur audio (AudioContext) est dans services.ts.

// Prénom fictif utilisé par l'inventaire des phrases : il ne doit jamais rester dans un clip.
export const SENTINEL_NAME = "Zéphyrine";

// Ponctuation qui suit un mot : "" (rien), "," (petite pause), "." (fin de phrase, ou « ! »), "?" (question).
export type Punct = "" | "," | "." | "?";
export interface Tok { w: string; p: Punct }

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

// Mots en minuscules, apostrophes droites ; la ponctuation qui suit chaque mot est gardée à part.
export function tokenize(text: string): Tok[] {
  const s = text.normalize("NFC");
  const toks: Tok[] = [];
  let last = 0;
  const flush = (gap: string) => {
    if (!toks.length) return;
    const t = toks[toks.length - 1];
    const p = /\?/.test(gap) ? "?" : /[.!]/.test(gap.replace(/…/g, "")) ? "." : /[,;:…()–—]|\s-\s/.test(gap) ? "," : "";
    if (rank(p) > rank(t.p)) t.p = p;
  };
  for (const m of s.matchAll(WORD)) {
    flush(s.slice(last, m.index));
    toks.push({ w: m[0].toLowerCase().replace(/’/g, "'"), p: "" });
    last = m.index! + m[0].length;
  }
  flush(s.slice(last));
  return toks;
}
const rank = (p: Punct) => (p === "" ? 0 : p === "," ? 1 : p === "." ? 2 : 3);
// Fin d'un énoncé complet : la dernière ponctuation compte comme une fin de phrase (sauf une question).
export function finalize(toks: Tok[]): Tok[] {
  if (toks.length && toks[toks.length - 1].p !== "?") toks[toks.length - 1].p = ".";
  return toks;
}

// Clé d'un clip : les mots, puis la ponctuation finale (une question et une affirmation ne se disent pas pareil).
export const keyOf = (toks: Tok[]) => `${toks.map((t) => t.w).join(" ")}|${toks.length ? toks[toks.length - 1].p : "."}`;
export const textKey = (text: string) => keyOf(finalize(tokenize(text)));

// Le prénom de l'enfant n'est jamais enregistré : la voix naturelle dit la phrase sans lui
// (« Bonjour Léa ! » → « Bonjour ! », « l'île de Léa » → « ton île »). Il reste affiché à l'écran.
export function elideName(text: string, name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return text;
  const q = n.normalize("NFC").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const B = "(?<![\\p{L}\\p{N}])", E = "(?![\\p{L}\\p{N}])";
  let s = text.normalize("NFC");
  s = s.replace(new RegExp(`l['’]île de ${q}${E}`, "giu"), "ton île");
  s = s.replace(new RegExp(`\\s*,\\s*${q}${E}(?=\\s*[!?.,;:…]|\\s*$)`, "giu"), "");
  s = s.replace(new RegExp(`${B}(Bonjour|Bravo|Merci|Coucou|Salut)\\s+${q}${E}`, "giu"), "$1");
  return s.replace(/\s+([!?.,;:…])/g, (_m, p) => (p === "!" || p === "?" || p === ":" ? ` ${p}` : p)).replace(/\s{2,}/g, " ").trim();
}

// ---------- Plan de lecture ----------
// Trouve la suite de clips qui couvre tout le texte, en préférant les clips longs (phrase entière),
// puis les morceaux séparés par la ponctuation. Deux morceaux peuvent se suivre sans ponctuation seulement s'ils ont
// chacun au moins deux mots (« la moto » + « est sur le lit ») : jamais de lecture mot à mot, qui sonnerait faux.
export interface Seg { key: string; from: number; to: number; gapMs: number }
export type Lookup = (words: string, p: Punct) => string | null;

// Clip le plus proche pour une ponctuation donnée (une virgule peut se lire comme une fin de phrase, pas l'inverse).
const FALLBACK: Record<Punct, [Punct, number][]> = {
  "": [["", 0], [",", 0.4], [".", 1.2]],
  ",": [[",", 0], ["", 0.4], [".", 0.6]],
  ".": [[".", 0], [",", 0.8], ["", 1.5]],
  "?": [["?", 0]],
};
export const GAP_MS: Record<Punct, number> = { "": 40, ",": 170, ".": 360, "?": 400 };
// Débuts de morceau qui se recollent à un seul mot : fins de liste (« rat, lapin | ou main ») et petites phrases
// à lire (« papi | est sur la lune »), qui se disent naturellement en deux temps.
const OPENERS = [["ou"], ["et"], ["est", "sur"]];
const opens = (toks: Tok[], i: number) => OPENERS.some((o) => o.every((w, k) => toks[i + k]?.w === w));

export function plan(toks: Tok[], lookup: Lookup, maxWords = 48): Seg[] | null {
  const n = toks.length;
  if (!n) return [];
  const cost = new Array<number>(n + 1).fill(Infinity);
  const back: { i: number; key: string; len: number }[] = new Array(n + 1);
  const lastLen = new Array<number>(n + 1).fill(0);
  cost[0] = 0;
  for (let i = 0; i < n; i++) {
    if (cost[i] === Infinity) continue;
    let words = "";
    for (let j = i; j < Math.min(n, i + maxWords); j++) {
      words = j === i ? toks[j].w : `${words} ${toks[j].w}`;
      const len = j - i + 1;
      // Jonction sans ponctuation : il faut deux morceaux d'au moins deux mots (ou une fin de liste « ou… », « et… »).
      if (i > 0 && toks[i - 1].p === "") {
        const listy = opens(toks, i);
        if (!listy && (len < 2 || lastLen[i] < 2)) continue;
      }
      let best: { key: string; extra: number } | null = null;
      for (const [p, extra] of FALLBACK[toks[j].p]) {
        const key = lookup(words, p);
        if (key) { best = { key, extra }; break; }
      }
      if (!best) continue;
      const c = cost[i] + 1 + best.extra + (i > 0 && toks[i - 1].p === "" ? 0.5 : 0);
      if (c < cost[j + 1]) { cost[j + 1] = c; back[j + 1] = { i, key: best.key, len }; lastLen[j + 1] = len; }
    }
  }
  if (cost[n] === Infinity) return null;
  const segs: Seg[] = [];
  for (let j = n; j > 0; j = back[j].i) {
    const b = back[j];
    segs.unshift({ key: b.key, from: b.i, to: j - 1, gapMs: j < n ? GAP_MS[toks[j - 1].p] : 0 });
  }
  return segs;
}

// Découpage de l'inventaire : phrases (fin à . ! ?) et propositions (pauses , : ; …).
export function sentences(text: string): string[] {
  return text.normalize("NFC").split(/(?<=[.!?])\s+|(?<=…)\s+(?=[\p{Lu}\p{N}«(])/u).map((s) => s.trim()).filter(Boolean);
}
export function clauses(sentence: string): string[] {
  return sentence.split(/(?<=[,;:…])\s+/u).map((s) => s.trim()).filter(Boolean);
}

// ---------- Index du pack de voix ----------
// clips : clé → [paquet, début, longueur (octets), durée (ms)]. Les paquets sont des MP3 mis bout à bout.
export interface VoixIndex {
  v: number; voix: string; vitesse: number; octets: number; secondes: number;
  paquets: { nom: string; octets: number }[];
  clips: Record<string, [number, number, number, number]>;
}

// Plan de lecture d'un texte (null : la voix naturelle ne peut pas le dire en entier).
export function planText(text: string, index: VoixIndex, name?: string | null): Seg[] | null {
  const toks = finalize(tokenize(elideName(text, name)));
  if (!toks.length) return null;
  return plan(toks, (words, p) => {
    const k = `${words}|${p}`;
    return index.clips[k] ? k : null;
  });
}

// ---------- Débit ----------
// Les clips sont enregistrés au débit « normal » ; pour « lent » ou « rapide », on étire ou on resserre le son
// sans changer la hauteur de la voix (WSOLA : fenêtres de 30 ms recollées là où elles se ressemblent le plus).
export function stretch(x: Float32Array, sr: number, factor: number): Float32Array {
  if (!(factor > 0) || Math.abs(factor - 1) < 0.02 || x.length < sr * 0.06) return x;
  const N = Math.round(sr * 0.03), Hs = N >> 1, Ha = Hs / factor, tol = Math.round(sr * 0.008);
  const outLen = Math.round(x.length * factor);
  const y = new Float32Array(outLen + N), norm = new Float32Array(outLen + N);
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / N);
  let next = 0;
  for (let k = 0; k * Hs < outLen; k++) {
    const target = Math.round(k * Ha);
    let pos = Math.min(Math.max(0, target), Math.max(0, x.length - N));
    if (k > 0) {
      // Fenêtre dont le début ressemble le plus à la suite naturelle de la précédente.
      let bestC = -Infinity;
      for (let d = -tol; d <= tol; d++) {
        const s = target + d;
        if (s < 0 || s + N > x.length || next + N > x.length) continue;
        let c = 0;
        for (let i = 0; i < N; i += 3) c += x[s + i] * x[next + i];
        if (c > bestC) { bestC = c; pos = s; }
      }
    }
    const o = k * Hs;
    for (let i = 0; i < N && pos + i < x.length; i++) { y[o + i] += x[pos + i] * w[i]; norm[o + i] += w[i]; }
    next = Math.min(pos + Hs, Math.max(0, x.length - N));
  }
  for (let i = 0; i < outLen; i++) if (norm[i] > 1e-3) y[i] /= norm[i];
  return y.subarray(0, outLen);
}
