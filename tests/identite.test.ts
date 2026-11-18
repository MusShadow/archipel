// Archipel 2 cohabite avec la v1 sur le même site : mêmes stockage et caches du navigateur.
// Ces tests vérifient que la v2 a bien son nom, ses clés et ses caches, et qu'elle ne touche pas à ceux de la v1.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { CACHE_VOIX, CLE_V1, CLES, NOM_APPLI, PREFIXE_CACHES } from "../src/identite";

const root = join(import.meta.dir, "..");
const dist = (f: string) => readFileSync(join(root, "dist", f), "utf8");

test("les clés et les caches de la v2 ont leur propre préfixe", () => {
  expect(NOM_APPLI).toBe("Archipel 2");
  for (const k of [CLES.donnees, CLES.voix, CLES.cleApi, CLES.dessins("p1")]) expect(k.startsWith("archipel2.")).toBe(true);
  expect(CACHE_VOIX.startsWith(PREFIXE_CACHES)).toBe(true);
  expect(PREFIXE_CACHES).toBe("archipel2-");
  // le service worker de la v1 efface les caches « archipel-… » qu'il ne connaît pas : ceux de la v2 n'en sont pas
  expect(PREFIXE_CACHES.startsWith("archipel-")).toBe(false);
});

test("le service worker construit n'utilise et ne nettoie que les caches archipel2-", () => {
  const sw = dist("sw.js");
  expect(sw).toContain('const CACHE = "archipel2-');
  expect(sw).toContain(`const VOIX = "${CACHE_VOIX}"`);
  expect(sw).toContain('k.startsWith("archipel2-")');
  expect(sw).not.toContain('"archipel-');
});

test("la page et le manifeste portent le nom Archipel 2", () => {
  const html = dist("index.html");
  expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Archipel 2">');
  expect(html).toContain("<title>Archipel 2</title>");
  expect(JSON.parse(dist("manifest.webmanifest")).name).toBe("Archipel 2");
});

test("la page construite ne nomme aucune clé ni aucun cache de la v1, sauf archipel.v1 en lecture", () => {
  const html = dist("index.html");
  for (const v1 of ["archipel.voix", "archipel.cleapi", "archipel.dessins", "archipel-voix"]) expect(html).not.toContain(v1);
  expect(html.split(CLE_V1).length - 1).toBe(1);
});

test("reprendre la v1 lit archipel.v1 sans jamais l'écrire", async () => {
  // DOM simulé le temps de ce test seulement (les tests des fêtes enregistrent le leur de leur côté)
  const mine = !GlobalRegistrator.isRegistered;
  if (mine) GlobalRegistrator.register({ url: "https://archipel.local/v2/", width: 1180, height: 820 });
  try {
    localStorage.clear();
    const { readV1, saveData, loadData } = await import("../src/services");
    const v1 = JSON.stringify({ version: 1, pin: "1234", settings: {}, profiles: [{ id: "p1", name: "Lou" }], activeId: "p1" });
    localStorage.setItem(CLE_V1, v1);
    expect(loadData().profiles.length).toBe(0);              // la v2 démarre vide
    const d = readV1();
    expect(d?.profiles.map((p) => p.name)).toEqual(["Lou"]);
    saveData(d!);
    expect(localStorage.getItem(CLE_V1)).toBe(v1);            // la v1 est intacte
    expect(JSON.parse(localStorage.getItem(CLES.donnees)!).profiles[0].name).toBe("Lou");
    localStorage.clear();
  } finally {
    if (mine) await GlobalRegistrator.unregister();
  }
});
