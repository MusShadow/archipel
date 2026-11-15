// Couverture du pack de voix : part des énoncés d'un inventaire que la voix naturelle dit en entier.
// À lancer sur un inventaire tiré avec une autre graine que celui qui a servi à fabriquer le pack :
//   SEED=42 ITEMS=40 OUT=/tmp/inv.json bun scripts/voix/inventaire.ts && bun scripts/voix/couverture.ts /tmp/inv.json
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SENTINEL_NAME, planText, type VoixIndex } from "../../src/voix";

const dir = join(import.meta.dir, "../../public/voix");
const index: VoixIndex = JSON.parse(readFileSync(join(dir, readdirSync(dir).find((f) => /^index-.*\.json$/.test(f))!), "utf8"));
const inv: { text: string; src: string[] }[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const miss: Record<string, string[]> = {};
let ok = 0;
for (const e of inv) {
  if (e.src.every((s) => s === "mots")) continue;
  if (planText(e.text, index, SENTINEL_NAME)) ok++;
  else (miss[e.src[0]] ??= []).push(e.text);
}
const total = ok + Object.values(miss).reduce((a, l) => a + l.length, 0);
console.log(`couverture : ${ok} / ${total} énoncés (${((100 * ok) / total).toFixed(2)} %)`);
for (const [f, l] of Object.entries(miss).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${f} : ${l.length}, par exemple ${l.slice(0, 3).join(" | ")}`);
