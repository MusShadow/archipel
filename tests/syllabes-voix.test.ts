import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SAY_SYL, SYL_CONSONANTS, SYL_VOWELS, WORDS } from "../src/content";
import { finalize, planText, tokenize } from "../src/voix";

// Retours de l'essai (lot A) : dans le jeu des syllabes, une lettre ou une syllabe dite seule (après « : », « , », ou
// en liste) a toujours son propre clip, après une pause : jamais avalée ni recollée au mot d'avant dans un clip de
// plusieurs mots (« c'est a| »). On fabrique toutes les phrases du jeu, comme le jeu les écrit, et on lit leur plan.
// (Vérification proposée par la relecture indépendante du lot A.)
const root = join(import.meta.dir, "..");
const index = (() => {
  const dir = join(root, "public/voix");
  const f = readdirSync(dir).find((x) => x.startsWith("index-") && x.endsWith(".json"))!;
  return JSON.parse(readFileSync(join(dir, f), "utf8"));
})();
const say = (s: string) => SAY_SYL[s.toLowerCase()] ?? s.toLowerCase();
const CUE_WORD: Record<string, string> = { m: "moto", l: "lama", r: "radio", s: "sofa", p: "piano", t: "tipi", f: "fumé", v: "vélo", n: "numéro", d: "domino" };
const PICTO = ["moto", "vélo", "tipi", "lama", "domino", "sofa", "piano", "radio", "midi"];
const CV = SYL_CONSONANTS.flatMap((c) => SYL_VOWELS.map((v) => c + v));
const V = SYL_VOWELS.slice();

// Une phrase écrite avec S (la syllabe dite) : fabriquée avec les vraies syllabes et avec des marqueurs, pour savoir
// quels mots sont des syllabes.
type T = (S: (x: string) => string) => string;
const phrases: { forme: string; texte: string; syl: Set<number> }[] = [];
function ajoute(forme: string, t: T) {
  let n = 0;
  const marque = tokenize(t(() => `zzq${n++}`));
  const texte = t(say);
  const syl = new Set<number>();
  marque.forEach((k, i) => { if (/^zzq\d+$/.test(k.w)) syl.add(i); });
  phrases.push({ forme, texte, syl });
}
const ligne = (syl: string[], S: (x: string) => string) => syl.map(S).join(", ");
for (const pool of [CV, V]) for (const t of pool) {
  ajoute("ecoute.consigne", (S) => `Écoute bien : ${S(t)}. Touche : ${S(t)}.`);
  ajoute("ecoute.reussite", (S) => `Oui, ${S(t)} !`);
  const cue = CUE_WORD[t[0]];
  ajoute("ecoute.indice2", (S) => (cue ? `${S(t)}, ça commence comme ${cue}.` : `Écoute encore : ${S(t)}.`));
  ajoute("ecoute.indice3", (S) => `Ce n'est pas celle-là. Écoute : ${S(t)}.`);
  ajoute("ecoute.indice4", (S) => `C'est celle qui brille : ${S(t)}.`);
  for (const s of pool) if (s !== t) ajoute("ecoute.erreur", (S) => `Ça, c'est : ${S(s)}. Écoute : ${S(t)}.`);
}
for (const t of CV) {
  for (const g of CV) if (g !== t) ajoute("fabrique.erreur", (S) => `Tu as fabriqué : ${S(g)}. On cherche : ${S(t)}.`);
  ajoute("fabrique.indice4", (S) => `Touche la lettre qui brille pour finir : ${S(t)}.`);
  ajoute("fabrique.reussite", (S) => `Oui, tu as fabriqué : ${S(t)} !`);
}
for (const w of WORDS) {
  ajoute("mot.consigne", (S) => `Écoute : ${ligne(w.syl, S)}. ${w.w}. Range les morceaux pour écrire ${w.w}.`);
  ajoute("mot.erreur", (S) => `Écoute bien : ${ligne(w.syl, S)}.`);
  ajoute("mot.indice1", (S) => `Écoute les morceaux : ${ligne(w.syl, S)}.`);
  ajoute("mot.indice2", (S) => `${w.w} commence par : ${S(w.syl[0])}.`);
  ajoute("mot.indice4", (S) => `La suite, c'est : ${S(w.syl[1])}.`);
  ajoute("mot.reussite", (S) => `Oui ! ${ligne(w.syl, S)} : ${w.w} !`);
  if (PICTO.includes(w.w)) ajoute("lire.indice2", (S) => `Ça commence par : ${S(w.syl[0])}.`);
}

test("le jeu des syllabes : chaque phrase a sa voix, et une syllabe dite seule n'est jamais dans un clip de plusieurs mots", () => {
  const sansVoix: string[] = [], recollees: string[] = [];
  for (const p of phrases) {
    const segs = planText(p.texte, index);
    if (!segs) { sansVoix.push(p.texte); continue; }
    for (const s of segs) {
      if (s.to > s.from && [...p.syl].some((i) => i >= s.from && i <= s.to)) recollees.push(`${p.forme} : ${p.texte} → ${s.key}`);
    }
  }
  expect(phrases.length).toBeGreaterThan(4000);
  expect(sansVoix.slice(0, 5)).toEqual([]);
  expect(recollees.slice(0, 5)).toEqual([]);
});

test("les syllabes du jeu, dans la bouche de Plume : même écrite seule, chacune a son clip", () => {
  for (const s of [...CV, ...V]) {
    const toks = finalize(tokenize(`${say(s)}.`));
    expect(planText(`${say(s)}.`, index) ? s : `${s} : pas de clip`).toBe(s);
    expect(toks.length).toBe(1);
  }
});
