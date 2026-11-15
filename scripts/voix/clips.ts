// Liste des clips à enregistrer, à partir de l'inventaire (voix/inventaire.json).
// - le prénom de l'enfant est retiré (la voix naturelle ne le dit jamais) ;
// - chaque énoncé est coupé en phrases ; pour les familles de phrases très combinatoires (listes de mots, programmes
//   de Bip, suites de motifs…), on enregistre plutôt les morceaux séparés par la ponctuation et les fins de liste
//   (« … ou main ? »), que la lecture recolle ;
// - chaque clip va dans un paquet (commun, ou celui d'une île) : l'appli ne charge que ce dont elle a besoin.
// Usage : bun scripts/voix/clips.ts  →  voix/clips.json
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACTIVITIES } from "../../src/activities";
import { SENTINEL_NAME, clauses, elideName, finalize, keyOf, sentences, tokenize } from "../../src/voix";

const root = join(import.meta.dir, "../..");
const inv: { text: string; src: string[] }[] = JSON.parse(readFileSync(process.env.INV ?? join(root, "voix/inventaire.json"), "utf8"));

// Paquet de chaque famille d'énoncés.
const ISLAND: Record<string, string> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.island]));
Object.assign(ISLAND, { dessin: "atelier", histoires: "mots", "mon-drapeau": "port" });
const packOf = (src: string) => ISLAND[src.split(":")[0]] ?? "commun";

// Fins de liste et petites phrases à lire (« la moto | est sur le lit ») : on coupe avant « ou », « et », « est sur ».
const fragments = (clause: string) => clause.split(/\s+(?=(?:ou|et|est sur)\s)/u);

interface Clip { key: string; text: string; packs: Set<string>; fams: Set<string> }
const clips = new Map<string, Clip>();
function addClip(text: string, final: boolean, src: string) {
  const toks = tokenize(text);
  if (!toks.length) return;
  const key = keyOf(final ? finalize(toks) : toks);
  const c = clips.get(key) ?? { key, text, packs: new Set<string>(), fams: new Set<string>() };
  // Même clé, plusieurs écritures : on garde celle qui s'exclame (« Oui ! » plutôt que « Oui. »).
  if (/!/.test(text) && !/!/.test(c.text)) c.text = text;
  c.packs.add(packOf(src)); c.fams.add(src);
  clips.set(key, c);
}

// Familles : phrases entières, ou morceaux si les phrases entières coûteraient beaucoup plus cher.
const fam = new Map<string, { S: Map<string, number>; F: Map<string, number> }>();
const units = inv.map((e) => ({ src: e.src, sents: sentences(elideName(e.text, SENTINEL_NAME)) }));
for (const u of units) {
  const x = fam.get(u.src[0]) ?? { S: new Map(), F: new Map() };
  fam.set(u.src[0], x);
  for (const s of u.sents) {
    x.S.set(s, s.length);
    for (const c of clauses(s)) for (const g of fragments(c)) x.F.set(g, g.length);
  }
}
const minutes = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b + 6, 0) / 13 / 60;
const mode = new Map<string, "S" | "F">();
for (const [f, x] of fam) mode.set(f, minutes(x.S) > 3 && minutes(x.S) > 1.6 * minutes(x.F) ? "F" : "S");

for (const u of units) {
  const f = u.src[0];
  for (const s of u.sents) {
    if (s.includes(SENTINEL_NAME)) throw new Error(`Prénom resté dans « ${s} »`);
    if (mode.get(f) === "S") { addClip(s, true, f); continue; }
    const cl = clauses(s);
    cl.forEach((c, ci) => {
      const fr = fragments(c);
      fr.forEach((g, gi) => addClip(g, ci === cl.length - 1 && gi === fr.length - 1, f));
    });
  }
}

// Nombres en lettres, avec le bon genre (« 1 flèche » → « une flèche »).
const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const TENS = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
function numberWords(n: number): string {
  if (n <= 16) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  if (n < 70) { const t = Math.floor(n / 10), u = n % 10; return u === 0 ? TENS[t] : u === 1 ? `${TENS[t]} et un` : `${TENS[t]}-${UNITS[u]}`; }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${numberWords(n - 60)}`;
  if (n < 100) return n === 80 ? "quatre-vingts" : `quatre-vingt-${numberWords(n - 80)}`;
  if (n === 100) return "cent";
  return String(n);
}
const FEMININE = /^(flèches?|pommes?|fois|cuillères?|faces?|parts?|cases?|bandes?|étoiles?|minutes?)\b/i;
export function spoken(text: string): string {
  return text
    .replace(/[«»“”"]/g, "")
    .replace(/\b(\d{1,3})\b(\s+)(\S+)?/g, (_m, d: string, sp: string, next?: string) => {
      let w = numberWords(Number(d));
      if (next && FEMININE.test(next) && /(^|[ -])un$/.test(w)) w = w.replace(/un$/, "une");
      return `${w}${sp}${next ?? ""}`;
    })
    .replace(/\b(\d{1,3})\b/g, (_m, d: string) => numberWords(Number(d)))
    .replace(/\s+([.,])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

// L'inventaire tire les exercices au hasard : une phrase rare peut ne pas sortir cette fois-ci. Les clips de la liste
// précédente sont donc gardés (KEEP=0 pour repartir de zéro, avec un inventaire très complet).
const OUT = process.env.OUT ?? join(root, "voix/clips.json");
const previous: { key: string; text: string; say: string; pack: string; words: number; fams: string[] }[] = (() => {
  try { return process.env.KEEP === "0" ? [] : JSON.parse(readFileSync(OUT, "utf8")); } catch { return []; }
})();
// Sauf pour les activités qui donnent la liste complète de leurs phrases (voiceLines) : un clip absent y est périmé.
const COMPLETE = ["goutte:"];
const kept = previous.filter((c) => !clips.has(c.key) && !c.fams.every((f) => COMPLETE.some((x) => f.startsWith(x))));
const out = [...kept.map((c) => ({ ...c })), ...[...clips.values()].map((c) => ({
  key: c.key, text: c.text, say: spoken(c.text),
  pack: c.packs.size === 1 ? [...c.packs][0] : "commun",
  words: c.key.split("|")[0].split(" ").length,
  fams: [...c.fams].sort(),
}))].sort((a, b) => a.pack.localeCompare(b.pack) || a.key.localeCompare(b.key, "fr"));
writeFileSync(OUT, JSON.stringify(out, null, 1));
if (kept.length) console.log(`${kept.length} clips gardés de la liste précédente (phrases rares pas tirées cette fois)`);
const byPack: Record<string, { n: number; min: number }> = {};
for (const c of out) { const b = (byPack[c.pack] ??= { n: 0, min: 0 }); b.n++; b.min += (c.say.length + 6) / 13 / 60; }
console.log(`${out.length} clips`, Object.entries(byPack).map(([k, v]) => `${k}: ${v.n} (${v.min.toFixed(0)} min)`).join(", "));
console.log("familles en morceaux :", [...mode].filter(([, m]) => m === "F").map(([f]) => f).join(", "));
