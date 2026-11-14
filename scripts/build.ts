// Construit dist/index.html : un seul fichier autonome (code et styles intégrés).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const result = await Bun.build({ entrypoints: [join(root, "src/main.ts")], format: "iife", target: "browser", minify: true });
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
const js = (await result.outputs[0].text()).replace(/<\/script/gi, "<\\/script");
const template = readFileSync(join(root, "src/index.html"), "utf8");
const html = template.replace("/*__APP__*/", () => js);
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
console.log(`dist/index.html : ${(html.length / 1024).toFixed(0)} Ko`);
