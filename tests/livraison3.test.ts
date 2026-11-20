import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Livraison 3 de la refonte : visages dessinés (médaillons et théâtre de Pico), carnet qu'on feuillette, fin de séance
// et coin calme peints, écrans à part dans le cadre des activités. Les îles dessinées sont testées dans iles.test.ts.
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
afterAll(() => dom?.unregister());
const withDom = test.skipIf(!dom);

const root = join(import.meta.dir, "..");
const { ELEMENTS } = await import("../src/illustrations");
const { FACES, TINTS } = await import("../src/art_static");
const { medallion, portraitHTML, portraitSVG } = await import("../src/ui");
const { MOUVEMENTS, variablesCSS } = await import("../src/design/jetons");
const { ACTIVITIES } = await import("../src/activities");

const EMOTIONS = ["joie", "triste", "colere", "peur", "surprise", "decu"];
const fichier = (nom: string) => join(root, "public/illustrations", ELEMENTS[nom].fichier);

describe("visages dessinés", () => {
  test("chaque personnage des médaillons a son portrait, content et avec les six émotions du théâtre", () => {
    for (const nom of Object.keys(FACES)) {
      for (const e of ["content", ...EMOTIONS]) {
        const im = ELEMENTS[`visages/${nom}-${e}`];
        expect(im).toBeDefined();
        expect(existsSync(fichier(`visages/${nom}-${e}`))).toBe(true);
        const [x, y, l, h] = im.boite; // cadrés pareil pour tous, dans un carré de 160
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + l).toBeLessThanOrEqual(160);
        expect(y + h).toBeLessThanOrEqual(160);
      }
    }
  });
  test("le médaillon montre le portrait dessiné sur la teinte du personnage ; inconnu : le visage simple de la v1", () => {
    const m = medallion("pico", true);
    expect(m).toContain("visages/pico-content");
    expect(m).toContain("medaillon anneau");
    expect(m).toContain(TINTS.pico);
    expect(medallion("personne")).toContain("<svg");
    expect(portraitHTML("mona", "triste")).toContain("visages/mona-triste");
    expect(portraitHTML("personne")).toBe("");
  });
  test("dans une gommette (dessin SVG), le portrait est une image découpée en rond, chaque découpe a son nom", () => {
    const a = portraitSVG("plume"), b = portraitSVG("plume");
    expect(a).toContain("<image");
    expect(a).toContain("clip-path");
    const id = (s: string) => /clipPath id="([^"]+)"/.exec(s)![1];
    expect(id(a)).not.toBe(id(b));
  });
  test("le théâtre de Pico propose des visages dessinés : ceux du personnage de la scène, une émotion chacun", async () => {
    const mod = ACTIVITIES.find((m) => m.id === "theatre")!;
    const { makeRng } = await import("../src/core");
    let vus = 0;
    for (let s = 1; s <= 60; s++) {
      for (const level of [1, 2, 5]) {
        const item = mod.generate(level, { rng: makeRng(s), profile: {} as never, known: new Set(), now: 0 } as never) as never as { kind: string; who: string; choices: string[]; opts: Record<string, { html: string }> };
        if (!["visage", "cause", "cachee"].includes(item.kind)) continue;
        for (const c of item.choices) {
          expect(EMOTIONS).toContain(c);
          expect(item.opts[c].html).toContain(`visages/${item.kind === "visage" ? "pico" : item.who}-${c}`);
        }
        vus++;
      }
    }
    expect(vus).toBeGreaterThan(20);
  });
  test("à la taille de la carte, deux émotions qu'un même exercice peut montrer se distinguent nettement", async () => {
    // relecture de la livraison 3 : « peur » et « surprise » ne différaient que de quelques pixels. Les écarts sont mesurés
    // par l'atelier (scripts/illustration/visages.py) sur les images publiées, à 140 px.
    const { readFileSync, statSync } = await import("node:fs");
    const { _theatreData, VISAGES_PICO } = await import("../src/activities/theatre");
    const mesures = JSON.parse(readFileSync(join(root, "scripts/illustration/visages-ecarts.json"), "utf8")) as { octets: Record<string, number>; ecarts: Record<string, Record<string, number>> };
    // les mesures sont bien celles des images publiées
    for (const [nom, n] of Object.entries(mesures.octets)) expect(statSync(join(root, "public/illustrations/visages", `${nom}.webp`)).size).toBe(n);
    const paires: [string, string, string][] = [];
    const ajouter = (qui: string, emos: string[]) => {
      for (let i = 0; i < emos.length; i++) for (let j = i + 1; j < emos.length; j++) paires.push([qui, emos[i], emos[j]]);
    };
    ajouter("pico", VISAGES_PICO[2]);
    for (const c of [..._theatreData.CAUSES, ..._theatreData.CACHEES]) ajouter(c.who, [c.emo, ...c.not]);
    expect(paires.length).toBeGreaterThan(30);
    for (const [qui, a, b] of paires) {
      const v = mesures.ecarts[qui][`${a}/${b}`] ?? mesures.ecarts[qui][`${b}/${a}`];
      expect({ qui, paire: `${a}/${b}`, ecart: v >= 5 }).toEqual({ qui, paire: `${a}/${b}`, ecart: true });
    }
  });
});

describe("écrans peints de la livraison 3", () => {
  test("fin de séance : le fond et le soleil, qui connaît l'horizon du fond", () => {
    expect(existsSync(fichier("fin/coucher"))).toBe(true);
    expect(ELEMENTS["fin/coucher"].boite).toEqual([0, 0, 1194, 834]);
    const s = ELEMENTS["fin/soleil"];
    expect(Number(s.infos?.horizon)).toBeGreaterThan(300);
    expect(Number(s.infos?.horizon)).toBeLessThan(600);
    expect(existsSync(fichier("fin/soleil"))).toBe(true);
  });
  test("coin calme : le décor, et Pico deux fois (les yeux fermés, puis content), cadré pareil pour passer de l'un à l'autre", () => {
    for (const n of ["calme/fond", "calme/pico", "calme/pico-content"]) expect(existsSync(fichier(n))).toBe(true);
    expect(ELEMENTS["calme/pico"].boite).toEqual(ELEMENTS["calme/pico-content"].boite);
  });
  test("mouvements lents documentés : le coucher du soleil, l'inspiration et l'expiration de Pico", () => {
    const v = variablesCSS();
    expect(v["--duree-coucher-soleil"]).toBe(`${MOUVEMENTS.coucherSoleil}ms`);
    expect(v["--duree-inspire"]).toBe(`${MOUVEMENTS.inspire}ms`);
    expect(v["--duree-souffle"]).toBe(`${MOUVEMENTS.souffle}ms`);
    // la respiration reste lente et calme : plusieurs secondes, l'expiration plus longue que l'inspiration
    expect(MOUVEMENTS.inspire).toBeGreaterThanOrEqual(3000);
    expect(MOUVEMENTS.souffle).toBeGreaterThan(MOUVEMENTS.inspire);
  });
});

describe("carnet qu'on feuillette", () => {
  withDom("couverture, puis neuf gommettes par page ; deux pages côte à côte en paysage ; les flèches tournent les pages", async () => {
    const { app } = await import("../src/app");
    const { carnetScreen, PAROLES_CARNET } = await import("../src/screens/carnet");
    expect(Object.keys(PAROLES_CARNET).sort()).toEqual(["dessins", "gommettes", "passeport"]);
    const stickers = Array.from({ length: 11 }, (_, i) => ({ t: i, kind: "forme", ref: "🔺", reason: `Gommette ${i}` }));
    (app as any).data = { version: 1, pin: "1234", activeId: "p1", settings: { sessionMinutes: 20, accompanied: false, voiceURI: null, rate: 0.9, sessionsPerWeek: 3 },
      profiles: [{ id: "p1", name: "Lou", ageMonths: 54, color: "#FFC145", avatar: "renard", createdAt: 0, knownK: 15, skills: {}, flags: { FR: { seen: 1, ok: 1, last: 1 } }, log: [], stickers, sessions: [], goals: [], departDone: true, stories: [], stairs: {} }] };
    const shown: HTMLElement[] = [];
    const show = (app as any).show;
    (app as any).show = (el: HTMLElement) => { shown.push(el); document.body.replaceChildren(el); };
    try {
      carnetScreen(() => {});
      const ecran = shown[0];
      const pages = () => Array.from(ecran.querySelectorAll(".cn-page:not(.blanche)"));
      expect(ecran.querySelector(".cn-livre.double")).not.toBeNull();
      expect(pages().length).toBe(2);
      expect(ecran.querySelector(".cn-couverture")).not.toBeNull();
      expect(ecran.querySelector(".cn-nom")?.textContent).toBe("Lou");
      expect(pages()[1].querySelectorAll(".cn-gommette").length).toBe(9);
      (ecran.querySelector(".cn-tourner.suiv") as HTMLElement).click();
      // page 3 : les deux dernières gommettes ; page 4 : les dessins (aucun : le mot de Kiki)
      expect(pages()[0].querySelectorAll(".cn-gommette").length).toBe(2);
      expect(pages()[1].querySelector(".cn-vide")).not.toBeNull();
      (ecran.querySelector('.cn-onglet[data-rubrique="passeport"]') as HTMLElement).click();
      expect(ecran.querySelectorAll(".cn-tampon").length).toBe(1);
      expect((ecran.querySelector(".cn-tourner.suiv") as HTMLElement).style.visibility).toBe("hidden");
    } finally {
      (app as any).show = show;
    }
  });
});
