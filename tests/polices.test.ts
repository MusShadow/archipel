// Les polices sont embarquées dans l'appli : aucun appel à Google, licences jointes, gardées hors ligne.
import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const dist = (f: string) => readFileSync(join(root, "dist", f), "utf8");
const faces = () => [...readFileSync(join(root, "src/index.html"), "utf8").matchAll(/@font-face\{font-family:'([^']+)';[^}]*font-weight:(\d+);[^}]*src:url\(polices\/([^)]+)\)/g)]
  .map((m) => ({ famille: m[1], graisse: Number(m[2]), fichier: m[3] }));

test("la page et le service worker construits n'appellent aucun service de polices extérieur", () => {
  for (const f of ["index.html", "sw.js"]) {
    const s = dist(f);
    expect(s).not.toContain("googleapis");
    expect(s).not.toContain("gstatic");
  }
});

test("chaque police déclarée existe, en alphabet latin et latin étendu", () => {
  const liste = faces();
  // Andika 400/700, Baloo 2 600/700/800, Inter 400/600/700 : les graisses utilisées par l'appli
  const attendu = { Andika: [400, 700], "Baloo 2": [600, 700, 800], Inter: [400, 600, 700] } as Record<string, number[]>;
  for (const [famille, graisses] of Object.entries(attendu)) {
    for (const g of graisses) {
      const fichiers = liste.filter((x) => x.famille === famille && x.graisse === g).map((x) => x.fichier);
      expect(fichiers.some((f) => /-latin-\d+-normal/.test(f))).toBe(true);
      expect(fichiers.some((f) => /-latin-ext-\d+-normal/.test(f))).toBe(true);
    }
  }
  for (const x of liste) {
    expect(existsSync(join(root, "public/polices", x.fichier))).toBe(true);
    expect(existsSync(join(root, "dist/polices", x.fichier))).toBe(true);
  }
});

test("la licence SIL Open Font accompagne chaque famille", () => {
  for (const f of ["OFL-Andika.txt", "OFL-Baloo2.txt", "OFL-Inter.txt"]) {
    const texte = readFileSync(join(root, "public/polices", f), "utf8");
    expect(texte).toContain("SIL Open Font License, Version 1.1");
  }
});

test("le service worker garde les polices dans leur propre cache, à adresse à empreinte", () => {
  const sw = dist("sw.js");
  const html = dist("index.html");
  const toutes = readdirSync(join(root, "public/polices")).filter((f) => f.endsWith(".woff2"));
  const latines = toutes.filter((f) => /-latin-\d+-normal\.woff2$/.test(f));
  expect(latines.length).toBe(8);
  expect(toutes.length).toBe(16);
  const liste = (nom: string) => JSON.parse(new RegExp(`const ${nom} = (\\[[^\\]]*\\])`).exec(sw)![1]) as string[];
  const polices = liste("POLICES"), policesToutes = liste("POLICES_TOUTES");
  // l'alphabet latin dès l'installation, toutes les variantes gardées d'une version à l'autre
  expect(polices.map((u) => u.replace(/^\.\/polices\//, "").replace(/\?v=[0-9a-f]{10}$/, "")).sort()).toEqual(latines.sort());
  expect(policesToutes.length).toBe(16);
  expect(sw).toContain('const POLICES_CACHE = "archipel2-polices"');
  expect(sw).toContain("keepAll(POLICES_CACHE, POLICES)");
  // la page appelle exactement les adresses que garde le service worker
  for (const u of policesToutes) expect(html).toContain(u.replace(/^\.\//, ""));
  expect(html).not.toMatch(/polices\/[a-z0-9-]+\.woff2[)"]/);
});
