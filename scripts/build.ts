// Construit dist/index.html : un seul fichier autonome (code et styles intégrés).
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

const root = join(import.meta.dir, "..");
// Pack de voix naturelle (public/voix, fabriqué par scripts/voix/generer.py) : l'appli connaît son index,
// le service worker garde tous ses fichiers pour le hors-ligne.
const voixDir = join(root, "public/voix");
const voixFiles = existsSync(voixDir) ? readdirSync(voixDir).filter((f) => /\.(json|mp3)$/.test(f)).sort() : [];
const voixIndex = voixFiles.find((f) => /^index-[0-9a-f]+\.json$/.test(f));
// Images de l'atelier d'illustration et de l'imagier : une empreinte par fichier. L'adresse d'une image porte son
// empreinte (?v=…) : le service worker garde les images d'une version à l'autre et ne retélécharge que celles qui changent.
const images: Record<string, string> = {};
for (const d of ["illustrations", "imagier"]) {
  const dir = join(root, "public", d);
  if (!existsSync(dir)) continue;
  for (const f of (readdirSync(dir, { recursive: true }) as string[]).sort()) {
    if (!/\.(webp|png|jpg|svg)$/.test(f)) continue;
    images[`${d}/${f.split(sep).join("/")}`] = createHash("sha256").update(readFileSync(join(dir, f))).digest("hex").slice(0, 10);
  }
}
const result = await Bun.build({
  entrypoints: [join(root, "src/main.ts")], format: "iife", target: "browser", minify: true,
  define: { __VOIX__: JSON.stringify(voixIndex ? `voix/${voixIndex}` : ""), __IMAGES__: JSON.stringify(images) },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
const js = (await result.outputs[0].text()).replace(/<\/script/gi, "<\\/script");
// Polices embarquées : l'adresse de chaque fichier porte son empreinte (?v=…), dans la page et dans le service worker,
// qui les garde d'une version à l'autre (l'alphabet latin dès l'installation, le latin étendu au premier usage).
const policesDir = join(root, "public/polices");
const policesToutes = readdirSync(policesDir).filter((f) => f.endsWith(".woff2")).sort();
const empreintePolice: Record<string, string> = Object.fromEntries(policesToutes.map((f) => [f, createHash("sha256").update(readFileSync(join(policesDir, f))).digest("hex").slice(0, 10)]));
const urlPolice = (f: string) => `polices/${f}?v=${empreintePolice[f]}`;
const template = readFileSync(join(root, "src/index.html"), "utf8")
  .replace(/polices\/([a-z0-9-]+\.woff2)/g, (m, f: string) => (empreintePolice[f] ? urlPolice(f) : m));
const html = template.replace("/*__APP__*/", () => js);
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
// Appli installable : icônes et manifeste, puis service worker (hors ligne) dont la version suit le contenu.
rmSync(join(root, "dist/voix"), { recursive: true, force: true });
cpSync(join(root, "public"), join(root, "dist"), { recursive: true });
const version = createHash("sha256").update(html).digest("hex").slice(0, 10);
const polices = policesToutes.filter((f) => /-latin-\d+-normal\.woff2$/.test(f));
const sw = readFileSync(join(root, "src/sw.js"), "utf8").replaceAll("__VERSION__", version)
  .replace("__VOIX_FILES__", JSON.stringify(voixFiles.map((f) => `./voix/${f}`)))
  .replace("__POLICES__", JSON.stringify(polices.map((f) => `./${urlPolice(f)}`)))
  .replace("__POLICES_TOUTES__", JSON.stringify(policesToutes.map((f) => `./${urlPolice(f)}`)))
  .replace("__IMAGES_FILES__", JSON.stringify(Object.entries(images).map(([f, v]) => `./${f}?v=${v}`)));
writeFileSync(join(root, "dist/sw.js"), sw);
const voixBytes = voixFiles.reduce((a, f) => a + readFileSync(join(voixDir, f)).byteLength, 0);
const imagesBytes = Object.keys(images).reduce((a, f) => a + readFileSync(join(root, "public", f)).byteLength, 0);
console.log(`dist/index.html : ${(html.length / 1024).toFixed(0)} Ko` + (voixIndex ? `, voix naturelle : ${voixFiles.length} fichiers, ${(voixBytes / 1e6).toFixed(1)} Mo` : ", sans voix naturelle")
  + `, images : ${Object.keys(images).length} fichiers, ${(imagesBytes / 1e6).toFixed(1)} Mo`);
