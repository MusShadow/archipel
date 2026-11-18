// Histoires sur mesure : préparation de la demande à Claude, lecture de la réponse, et repérage des mots
// probablement trop difficiles à déchiffrer pour l'enfant (selon les sons qu'il connaît).
import { CLES } from "./identite";
import { GRAPHEME_ORDER, knownSet } from "./content";
import { SIGHT_WORDS } from "./lexique";
import type { Story } from "./services";

export const HEROES: { id: string; nom: string; qui: string }[] = [
  { id: "plume", nom: "Plume", qui: "Plume, un petit colibri aventurier (elle)" },
  { id: "basile", nom: "Basile", qui: "Basile, un castor gourmand (il)" },
  { id: "mona", nom: "Mona", qui: "Mona, une baleine qui adore chanter (elle)" },
  { id: "octave", nom: "Octave", qui: "Octave, une pieuvre curieuse à lunettes (il)" },
  { id: "rico", nom: "Rico", qui: "Rico, un raton laveur malin (il)" },
  { id: "kiki", nom: "Kiki", qui: "Kiki, un caméléon artiste (elle)" },
  { id: "pico", nom: "Pico", qui: "Pico, un hérisson calme et doux (il)" },
];
export const THEMES = ["la mer", "la forêt", "l'espace", "les dinosaures", "la cuisine", "les pirates", "la ferme", "la neige", "un anniversaire", "un voyage en bateau"];
export const LENGTHS = [{ id: 3, label: "Très courte (3 phrases)" }, { id: 5, label: "Courte (5 phrases)" }, { id: 8, label: "Plus longue (8 phrases)" }];
// Mots-outils que l'enfant reconnaît « en entier », et quelques petits mots très fréquents à lire avec l'adulte.
export const ALLOWED_TOOLS = [...SIGHT_WORDS, "un", "une", "il", "elle", "a", "à", "de", "les", "des", "il y a"];

// ---------- Découpage en graphèmes (approximation suffisante pour repérer les mots difficiles) ----------
const MULTI = ["eaux", "eau", "ain", "ein", "oin", "ille", "ch", "ph", "gn", "qu", "gu", "ou", "oi", "on", "om", "an", "am", "en", "em", "in", "im", "un", "um", "ai", "ei", "au", "eu", "œu", "ss", "ll", "mm", "nn", "tt", "rr", "pp", "ff"];
const SAME: Record<string, string> = { ss: "s", ll: "l", mm: "m", nn: "n", tt: "t", rr: "r", pp: "p", ff: "f", om: "on" };
const VOWELS = "aeiouyéèêëàâîïôûù";
export function graphemes(word: string): { gp: string[]; mute: number } {
  const w = word.toLowerCase().replace(/[^a-zàâäéèêëîïôöûùüçœ]/g, "");
  const gp: string[] = [];
  let i = 0;
  while (i < w.length) {
    let g = "";
    for (const m of MULTI) {
      if (!w.startsWith(m, i)) continue;
      // « on », « an », « in »… ne font un son nasal que s'ils ne sont pas suivis d'une voyelle (« lune », « âne »).
      const nx = w[i + m.length];
      if (nx && /^(on|om|an|am|en|em|in|im|un|um|ain|ein|oin)$/.test(m) && VOWELS.includes(nx)) continue;
      if (nx && /^(on|om|an|am|en|em|in|im|un|um)$/.test(m) && "nm".includes(nx)) continue;
      g = m; break;
    }
    if (!g) {
      const c = w[i];
      if ((c === "c" || c === "g") && w[i + 1] && "eéèêiîy".includes(w[i + 1])) g = `${c}~`; // c et g « doux »
      else g = c;
    }
    gp.push(SAME[g] ?? g);
    i += g.replace("~", "").length;
  }
  // Lettres finales muettes : le « s » ou « x » du pluriel, puis un « e » final (« lune », « petite »)
  // ou une consonne finale muette (« chat », « nid », « loup », « nez »).
  let mute = 0, end = gp.length;
  if (end > 2 && (gp[end - 1] === "s" || gp[end - 1] === "x")) { mute++; end--; }
  if (end > 2 && gp[end - 1] === "e") mute++;
  else if (end > 2 && ["t", "d", "p", "z"].includes(gp[end - 1])) mute++;
  return { gp, mute };
}
// Un mot est déchiffrable si tous ses graphèmes (hors lettres muettes finales) sont connus.
export function decodableWord(word: string, known: Set<string>): boolean {
  const low = word.toLowerCase().replace(/[’']/g, "'");
  if (ALLOWED_TOOLS.includes(low)) return true;
  const { gp, mute } = graphemes(low);
  const core = gp.slice(0, gp.length - mute);
  return core.length > 0 && core.every((g) => known.has(g) || (g === "è" && known.has("é")));
}
export function difficultWords(text: string, k: number, names: string[] = []): string[] {
  const known = knownSet(k);
  const out: string[] = [];
  for (const raw of text.split(/[\s,.;:!?«»"()—–-]+/)) {
    if (!raw) continue;
    // « l'âne » → « l' » + « âne » : l'article élidé se lit avec le mot.
    const parts = raw.split(/['’]/).filter(Boolean);
    for (const w of parts) {
      if (names.some((n) => n.toLowerCase() === w.toLowerCase())) continue;
      if (/^[a-zàâäéèêëîïôöûùüçœ]+$/i.test(w) && w.length > 1 && !decodableWord(w, known) && !out.includes(w.toLowerCase())) out.push(w.toLowerCase());
      if (w.length === 1 && !"aàyl".includes(w.toLowerCase()) && !decodableWord(w, known) && !out.includes(w.toLowerCase())) out.push(w.toLowerCase());
    }
  }
  return out;
}

// ---------- Demande à Claude ----------
export const STORY_MODEL = "claude-sonnet-5-5";
export function buildPrompt(o: { k: number; theme: string; hero: string; phrases: number }): { system: string; user: string } {
  const known = GRAPHEME_ORDER.slice(0, Math.max(0, o.k));
  const hero = HEROES.find((x) => x.id === o.hero) ?? HEROES[0];
  const system = [
    "Tu écris de toutes petites histoires en français pour un enfant de 4 à 6 ans qui apprend à lire avec une méthode syllabique.",
    "Règles :",
    "- Phrases très courtes (3 à 8 mots), au présent, une idée par phrase, vocabulaire concret et bienveillant (pas de peur, pas de violence).",
    known.length
      ? `- Utilise le plus possible des mots que l'enfant peut déchiffrer avec les sons qu'il connaît : ${known.join(", ")}. Les lettres muettes en fin de mot (e, s, t) sont permises.`
      : "- L'enfant ne lit pas encore : l'histoire lui sera lue à voix haute. Garde des phrases très simples.",
    `- Mots-outils permis même s'ils ne sont pas déchiffrables : ${ALLOWED_TOOLS.join(", ")}. Évite les autres mots difficiles quand un mot plus simple existe.`,
    "- Pas de prénom d'enfant réel, pas de marque, pas de personnage connu.",
    "- Pour chaque phrase, propose un seul émoji qui l'illustre.",
    "- Ajoute une question de compréhension avec trois réponses courtes (une seule juste), dont la réponse se trouve dans l'histoire.",
    "Réponds uniquement avec un objet JSON, sans texte autour, de la forme :",
    '{"titre": "…", "emoji": "🐳", "phrases": ["…"], "images": ["🐳"], "question": {"texte": "…", "choix": ["…", "…", "…"], "bonne": 0}}',
  ].join("\n");
  const user = `Écris une histoire de ${o.phrases} phrases. Héros : ${hero.qui}. Thème : ${o.theme}.`;
  return { system, user };
}
// Extrait l'objet JSON de la réponse et vérifie sa forme.
export function parseStory(text: string, o: { k: number; theme: string; hero: string }): Story {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("format");
  const j = JSON.parse(text.slice(a, b + 1));
  const phrases = Array.isArray(j.phrases) ? j.phrases.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 12) : [];
  const q = j.question ?? {};
  const choix = Array.isArray(q.choix) ? q.choix.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 3) : [];
  const bonne = Number(q.bonne);
  if (!j.titre || phrases.length < 2 || choix.length < 2 || !(bonne >= 0 && bonne < choix.length) || !q.texte) throw new Error("format");
  const images = Array.isArray(j.images) ? j.images.map((x: unknown) => String(x).slice(0, 8)) : [];
  return {
    id: `h${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, t: Date.now(),
    titre: String(j.titre).trim().slice(0, 80), phrases, question: { texte: String(q.texte).trim(), choix, bonne }, k: o.k,
    emoji: j.emoji ? String(j.emoji).slice(0, 8) : images[0], images: phrases.map((_: string, i: number) => images[i] ?? ""), theme: o.theme, heros: o.hero, lu: 0,
  };
}
// Appel direct depuis l'appareil : la clé reste sur l'appareil et ne sert qu'ici.
export async function requestStory(key: string, o: { k: number; theme: string; hero: string; phrases: number }, fetcher: typeof fetch = fetch): Promise<Story> {
  const { system, user } = buildPrompt(o);
  const res = await fetcher("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: STORY_MODEL, max_tokens: 1200, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) {
    const err = new Error(res.status === 401 || res.status === 403 ? "cle" : res.status === 429 ? "limite" : res.status >= 500 ? "serveur" : `http${res.status}`);
    throw err;
  }
  const data = await res.json();
  const text = Array.isArray(data?.content) ? data.content.filter((c: any) => c?.type === "text").map((c: any) => c.text).join("") : "";
  return parseStory(text, o);
}
export const STORY_ERRORS: Record<string, string> = {
  cle: "La clé n'est pas acceptée. Vérifiez-la (elle commence par « sk-ant- »).",
  limite: "Trop de demandes d'un coup : réessayez dans une minute.",
  serveur: "Le service est momentanément indisponible : réessayez plus tard.",
  format: "La réponse reçue n'a pas la bonne forme : appuyez sur « Réécrire ».",
  reseau: "Pas de connexion : écrire une histoire demande internet (la lire, non).",
};

const KEYNAME = CLES.cleApi;
export const apiKey = {
  get(): string { try { return localStorage.getItem(KEYNAME) ?? ""; } catch { return ""; } },
  set(v: string) { try { if (v) localStorage.setItem(KEYNAME, v); else localStorage.removeItem(KEYNAME); } catch { /* rien */ } },
};
