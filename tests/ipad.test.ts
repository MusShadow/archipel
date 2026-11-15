import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stripID3 } from "../src/services";

const dir = join(import.meta.dir, "../public/voix");
const indexFile = readdirSync(dir).find((f) => f.startsWith("index-") && f.endsWith(".json"))!;
const index = JSON.parse(readFileSync(join(dir, indexFile), "utf8"));
const packs = index.paquets.map((p: { nom: string }) => readFileSync(join(dir, p.nom)));

describe("voix naturelle sur iPad", () => {
  test("chaque clip, sans son étiquette ID3, commence par une trame MP3", () => {
    let n = 0;
    for (const [key, [pi, off, len]] of Object.entries(index.clips) as [string, number[]][]) {
      const b = packs[pi];
      const clip = b.buffer.slice(b.byteOffset + off, b.byteOffset + off + len);
      const u = new Uint8Array(stripID3(clip));
      if (u[0] !== 0xff || (u[1] & 0xe0) !== 0xe0) throw new Error(`clip ${key} : pas de trame MP3 au début`);
      expect(u.length).toBeGreaterThan(100);
      n++;
    }
    expect(n).toBe(Object.keys(index.clips).length);
  });

  test("un fichier sans étiquette ID3 est laissé tel quel", () => {
    const raw = new Uint8Array([0xff, 0xf3, 0x84, 0xc0, 1, 2, 3]).buffer;
    expect(stripID3(raw)).toBe(raw);
  });
});
