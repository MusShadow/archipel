// Construit dist/index.html : un seul fichier autonome (code et styles intégrés).
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
// Appli installable : icônes et manifeste, puis service worker (hors ligne) dont la version suit le contenu.
cpSync(join(root, "public"), join(root, "dist"), { recursive: true });
const version = createHash("sha256").update(html).digest("hex").slice(0, 10);
writeFileSync(join(root, "dist/sw.js"), readFileSync(join(root, "src/sw.js"), "utf8").replaceAll("__VERSION__", version));
console.log(`dist/index.html : ${(html.length / 1024).toFixed(0)} Ko`);
