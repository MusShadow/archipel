// Imagier : chaque emoji utilisé par l'appli a son image album, la licence MIT de la base est jointe,
// et le service worker garde tout hors ligne.
import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { IMAGIER, imageImagier, sansVariante } from "../src/imagier";

const root = join(import.meta.dir, "..");
const GENERES = new Set(["imagier.ts", "illustrations.ts", "art_static.ts"]);

function emojiDeLAppli(): Map<string, string> {
  const re = /(?:\p{Extended_Pictographic}(?:\uFE0F|\u20E3)?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)/gu;
  const vus = new Map<string, string>();
  const parcourir = (d: string) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) parcourir(p);
      else if (p.endsWith(".ts") && !GENERES.has(f.name)) for (const m of readFileSync(p, "utf8").matchAll(re)) vus.set(sansVariante(m[0]), p);
    }
  };
  parcourir(join(root, "src"));
  return vus;
}

test("chaque emoji de l'appli a son image dans l'imagier", () => {
  const vus = emojiDeLAppli();
  expect(vus.size).toBeGreaterThan(150);
  const sans = [...vus].filter(([e]) => !imageImagier(e)).map(([e, f]) => `${e} (${f.replace(root, "")})`);
  expect(sans).toEqual([]);
});

test("chaque image de l'imagier existe, en WebP de 320 x 320, et sert à l'appli", () => {
  const fichiers = new Set(readdirSync(join(root, "public/imagier")).filter((f) => f.endsWith(".webp")));
  const vus = emojiDeLAppli();
  for (const [e, im] of Object.entries(IMAGIER)) {
    const b = readFileSync(join(root, "public", im.fichier));
    expect(b.toString("ascii", 8, 12)).toBe("WEBP");
    expect(b.toString("ascii", 12, 16)).toBe("VP8X");
    expect([1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]).toEqual([320, 320]);
    expect(vus.has(e)).toBe(true);
    fichiers.delete(im.fichier.replace("imagier/", ""));
  }
  // aucune image orpheline
  expect([...fichiers]).toEqual([]);
});

test("la licence MIT de Fluent Emoji accompagne l'imagier", () => {
  const t = readFileSync(join(root, "public/imagier/LICENCE-fluentui-emoji.txt"), "utf8");
  expect(t).toContain("MIT License");
  expect(t).toContain("Copyright (c) Microsoft Corporation.");
  expect(t).toContain("https://github.com/microsoft/fluentui-emoji");
});

test("le service worker garde tout l'imagier hors ligne", () => {
  const sw = readFileSync(join(root, "dist/sw.js"), "utf8");
  for (const im of Object.values(IMAGIER)) {
    expect(existsSync(join(root, "dist", im.fichier))).toBe(true);
    expect(sw).toMatch(new RegExp(`"\\./${im.fichier.replace(/[.]/g, "\\.")}\\?v=[0-9a-f]{10}"`));
  }
});
