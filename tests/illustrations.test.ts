// Atelier d'illustration : chaque image du catalogue existe, au bon format et à la bonne taille, et le service
// worker la garde hors ligne avec son empreinte.
import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DECORS_ILES, ELEMENTS, PERSONNAGES, type ImageCadree } from "../src/illustrations";

const root = join(import.meta.dir, "..");
const toutes = (): ImageCadree[] => [
  ...Object.values(PERSONNAGES),
  ...Object.values(DECORS_ILES).flatMap((d) => [d.base, ...Object.values(d.lieux), ...Object.values(d.remplissages), ...Object.values(d.animes)]),
  ...Object.values(ELEMENTS),
];

// Taille d'une image WebP (en-têtes VP8, VP8L ou VP8X).
function tailleWebp(b: Buffer): [number, number] {
  expect(b.toString("ascii", 0, 4)).toBe("RIFF");
  expect(b.toString("ascii", 8, 12)).toBe("WEBP");
  const bloc = b.toString("ascii", 12, 16);
  if (bloc === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (bloc === "VP8L") { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}

test("chaque image du catalogue existe en WebP, rendue à l'échelle 2 de sa boîte", () => {
  const images = toutes();
  expect(images.length).toBeGreaterThan(60);
  for (const im of images) {
    const f = join(root, "public/illustrations", im.fichier);
    expect(existsSync(f)).toBe(true);
    const [l, h] = tailleWebp(readFileSync(f));
    expect(Math.abs(l - im.boite[2] * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(h - im.boite[3] * 2)).toBeLessThanOrEqual(1);
    if (im.ancre) for (const v of im.ancre) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    for (const pt of Object.values(im.points ?? {})) for (const v of pt) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  }
});

test("aucune image orpheline dans public/illustrations (le service worker garderait tout)", () => {
  const catalogue = new Set(toutes().map((im) => im.fichier));
  const fichiers = (readdirSync(join(root, "public/illustrations"), { recursive: true }) as string[])
    .filter((f) => f.endsWith(".webp")).map((f) => f.split("\\").join("/"));
  expect(fichiers.filter((f) => !catalogue.has(f))).toEqual([]);
  expect(fichiers.length).toBe(catalogue.size);
});

test("le catalogue de l'appli est celui de l'atelier (src/illustrations.ts suit catalogue.json)", () => {
  const cat = JSON.parse(readFileSync(join(root, "scripts/illustration/catalogue.json"), "utf8"));
  expect(PERSONNAGES).toEqual(cat.personnages);
  expect(DECORS_ILES).toEqual(cat.iles);
  const sansModule = Object.fromEntries(Object.entries(cat.elements as Record<string, Record<string, unknown>>).map(([k, e]) => [k, Object.fromEntries(Object.entries(e).filter(([c]) => c !== "module"))]));
  expect(ELEMENTS).toEqual(sansModule as typeof ELEMENTS);
});

test("le service worker garde chaque image hors ligne, avec son empreinte", () => {
  const sw = readFileSync(join(root, "dist/sw.js"), "utf8");
  expect(sw).toContain('const IMAGES = "archipel2-images"');
  for (const im of toutes()) {
    expect(existsSync(join(root, "dist/illustrations", im.fichier))).toBe(true);
    expect(sw).toMatch(new RegExp(`"\\./illustrations/${im.fichier.replace(/[.]/g, "\\.")}\\?v=[0-9a-f]{10}"`));
  }
});

test("Plume garde ses signes et son calme : cinq poses, quatre expressions en vol, trois pièces alignées", () => {
  const poses = ["vol", "salut", "montre", "pense", "fete"].map((p) => PERSONNAGES[`plume-${p}`]);
  for (const p of poses) expect(p.echelle).toBe(0.9);
  for (const e of ["rieur", "surpris", "pensif", "doux"]) expect(PERSONNAGES[`plume-vol-${e}`].boite).toEqual(PERSONNAGES["plume-vol"].boite);
  // les pièces se superposent exactement dans le même cadre que Plume entier
  const corps = PERSONNAGES["plume-piece-corps"].boite;
  const entier = PERSONNAGES["plume-vol"].boite;
  expect(corps[0]).toBeGreaterThanOrEqual(entier[0]);
  expect(corps[1]).toBeGreaterThanOrEqual(entier[1]);
  for (const aile of ["plume-piece-aile-ar", "plume-piece-aile-av"]) expect(PERSONNAGES[aile].pivot).toBeDefined();
});
