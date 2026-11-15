// Construit dist/index.html : un seul fichier autonome (code et styles intégrés).
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
// Pack de voix naturelle (public/voix, fabriqué par scripts/voix/generer.py) : l'appli connaît son index,
// le service worker garde tous ses fichiers pour le hors-ligne.
const voixDir = join(root, "public/voix");
const voixFiles = existsSync(voixDir) ? readdirSync(voixDir).filter((f) => /\.(json|mp3)$/.test(f)).sort() : [];
const voixIndex = voixFiles.find((f) => /^index-[0-9a-f]+\.json$/.test(f));
const result = await Bun.build({
  entrypoints: [join(root, "src/main.ts")], format: "iife", target: "browser", minify: true,
  define: { __VOIX__: JSON.stringify(voixIndex ? `voix/${voixIndex}` : "") },
});
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
rmSync(join(root, "dist/voix"), { recursive: true, force: true });
cpSync(join(root, "public"), join(root, "dist"), { recursive: true });
const version = createHash("sha256").update(html).digest("hex").slice(0, 10);
const sw = readFileSync(join(root, "src/sw.js"), "utf8").replaceAll("__VERSION__", version)
  .replace("__VOIX_FILES__", JSON.stringify(voixFiles.map((f) => `./voix/${f}`)));
writeFileSync(join(root, "dist/sw.js"), sw);
const voixBytes = voixFiles.reduce((a, f) => a + readFileSync(join(voixDir, f)).byteLength, 0);
console.log(`dist/index.html : ${(html.length / 1024).toFixed(0)} Ko` + (voixIndex ? `, voix naturelle : ${voixFiles.length} fichiers, ${(voixBytes / 1e6).toFixed(1)} Mo` : ", sans voix naturelle"));
