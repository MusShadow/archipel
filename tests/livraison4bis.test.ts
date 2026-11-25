import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Livraison 4 bis : les derniers dessins au trait passent dans la finition album. Les images du voyage de la goutte,
// du voyage des déchets, du grand tri et des chapitres du volcan sont repeintes par l'atelier à partir du dessin de
// l'appli (scripts/illustration/pictos.py) : même contenu, même place à l'écran. La rue du camion poubelle est peinte
// en calques (le camion repart toujours), la carte du monde est peinte sous les mêmes continents à toucher. Les mots
// du jeu des syllabes prennent leurs images de l'imagier, et les histoires sur mesure choisissent les leurs dedans.
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
const { IMAGIER, imageImagier } = await import("../src/imagier");
const goutte = await import("../src/activities/goutte_art");
const dechets = await import("../src/activities/dechets_art");
const tri = await import("../src/activities/tri_art");
const volcan = await import("../src/activities/volcan_art");
const { PICTO } = await import("../src/activities/syllabes");
const { syllabes } = await import("../src/activities/syllabes");
const { drapeau } = await import("../src/activities/drapeau");
const { CONTINENTS } = await import("../src/flags");
const { IMAGES_HISTOIRES, buildPrompt, imagesPermises, parseStory } = await import("../src/stories");
const { stickerArt } = await import("../src/activities");
const { emojiStickerSVG } = await import("../src/activities/chants");
const { SOUND_WORDS, READ_WORDS } = await import("../src/lexique");
const { createProfile } = await import("../src/app");
const { knownSet } = await import("../src/content");
const { makeRng } = await import("../src/core");
import type { Ctx, View } from "../src/host";

const surDisque = (fichier: string) => existsSync(join(root, "public", fichier));
const JEUX = [
  { dossier: "goutte", art: goutte.ART, html: goutte.artSVG },
  { dossier: "dechets", art: dechets.DART, html: dechets.dartSVG },
  { dossier: "tri", art: tri.TART, html: tri.tartSVG },
  { dossier: "volcan", art: volcan.VART, html: volcan.vartSVG },
];

describe("les dessins au trait, repeints", () => {
  test("chaque dessin des quatre jeux a son image peinte, sur le disque, dans un carré de 100 avec 5 de marge", () => {
    let n = 0;
    for (const j of JEUX) for (const id of Object.keys(j.art)) {
      const im = ELEMENTS[`${j.dossier}/${id}`];
      expect(im === undefined ? `${j.dossier}/${id} : absent` : id).toBe(id);
      expect(surDisque(`illustrations/${im.fichier}`)).toBe(true);
      expect(im.cadre).toEqual([110, 110]);
      expect(im.rendu).toBe(3); // 330 px pour un carré affiché jusqu'à 150 px
      n++;
    }
    expect(n).toBeGreaterThan(150); // 35 + 44 + 26 + 50 dessins aujourd'hui
  });
  test("à l'écran, l'image peinte prend la place du tracé : un SVG de 100 comme lui, l'image dedans, plus aucun trait", () => {
    for (const j of JEUX) for (const id of Object.keys(j.art)) {
      const html = j.html(id);
      expect(html.startsWith('<svg class="picto" viewBox="0 0 100 100"')).toBe(true);
      expect(html).toContain("width:100%;height:100%;overflow:visible");
      expect(html).toContain(ELEMENTS[`${j.dossier}/${id}`].fichier);
      expect(html.match(/<image /g)?.length).toBe(1);
      expect(/<(path|rect|circle|ellipse|polygon|line)\b/.test(html)).toBe(false);
    }
  });
  test("un dessin qui dépasse de son carré (la fumée d'une cheminée) n'est pas coupé : son image monte au-dessus du cadre", () => {
    for (const nom of ["dechets/verrerie", "dechets/usine_chaleur"]) {
      const im = ELEMENTS[nom];
      expect(im.cadre).toEqual([110, 110]);
      expect(im.boite[1]).toBeLessThan(-6); // au-dessus du carré de 100 et de sa marge
      const [, id] = nom.split("/");
      const y = Number(dechets.dartSVG(id).match(/<image [^>]* y="(-?[\d.]+)"/)![1]);
      expect(y).toBeCloseTo(-5 + im.boite[1], 1);
    }
  });
  test("les gommettes de la goutte, des déchets et du volcan sont peintes aussi (l'image dans la pastille)", () => {
    for (const [kind, refs, dossier] of [["goutte", ["ploc", "chateau", "gestes"], "goutte/"], ["dechets", ["camion", "boucle", "gourde"], "dechets/"], ["volcan", ["volcan", "badge", "monde"], "volcan/"]] as const) {
      for (const ref of refs) {
        const svg = stickerArt(kind, ref);
        expect(svg).toContain("<image");
        expect(svg).toContain(`illustrations/${dossier}`);
      }
    }
  });
  test("la rue du camion poubelle : trois calques peints dans le cadre de la rue ; le camion bouge seul ; la zone où l'on dépose la poubelle ne change pas", () => {
    for (const n of ["rue-fond", "rue-camion", "rue-eboueur"]) {
      const im = ELEMENTS[`dechets/${n}`];
      expect(im?.cadre).toEqual([dechets.RUE.w, dechets.RUE.h]);
      expect(surDisque(`illustrations/${im.fichier}`)).toBe(true);
    }
    const svg = dechets.rueSVG();
    expect(svg).toContain(`<g class="dtruck"><image href="`);
    expect(svg).toContain("rue-camion");
    const lift = `<rect class="dlift" x="${dechets.RUE.lift.x}" y="${dechets.RUE.lift.y}" width="${dechets.RUE.lift.w}" height="${dechets.RUE.lift.h}"`;
    expect(svg).toContain(lift);
    expect(dechets.rueTrace()).toContain(lift); // le tracé, source de la rue peinte, garde la même zone
  });
});

describe("la carte du monde du Port", () => {
  withDom("peinte, sous les mêmes continents à toucher (transparents) ; le bon continent se cerne", () => {
    const p = createProfile({ name: "Lou", ageMonths: 54, color: "#FFC145", readingK: 15, countTo: 20, flags: 0 });
    const ctx: Ctx = { profile: p, rng: makeRng(3), known: knownSet(15), now: Date.now() };
    let item: any = null;
    for (let i = 0; i < 40 && item?.kind !== "carte"; i++) item = drapeau.generate(4, { ...ctx, rng: makeRng(i) });
    expect(item.kind).toBe("carte");
    const stage = document.createElement("div");
    const view: View = { stage, rng: makeRng(1), answer() {}, say: async () => {}, hintStep: () => 0 };
    drapeau.render(item, view);
    const svg = stage.querySelector(".monde svg")!;
    expect(svg.outerHTML).toContain(`href="`);
    expect(svg.outerHTML).toContain(ELEMENTS["monde/carte"].fichier);
    const conts = Array.from(svg.querySelectorAll("[data-cont]"));
    expect(conts.length).toBe(CONTINENTS.length);
    // transparents, le trait compris : la côte répond au doigt comme avant
    for (const c of conts) { expect(c.getAttribute("fill")).toBe("transparent"); expect(c.getAttribute("stroke")).toBe("transparent"); expect(c.getAttribute("stroke-width")).toBe("2"); }
    expect(ELEMENTS["monde/carte"].cadre).toEqual([1000, 500]);
  });
});

describe("les derniers mots de l'imagier", () => {
  withDom("jeu des syllabes : chaque mot à lire montre son image de l'imagier (le tipi, le domino et midi, repeints)", () => {
    const p = createProfile({ name: "Lou", ageMonths: 54, color: "#FFC145", readingK: 30, countTo: 20, flags: 0 });
    const vus = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const ctx: Ctx = { profile: p, rng: makeRng(i), known: knownSet(30), now: Date.now() };
      const it: any = syllabes.generate(6, ctx);
      if (it.kind !== "lire") continue;
      const stage = document.createElement("div");
      syllabes.render(it, { stage, rng: makeRng(1), answer() {}, say: async () => {}, hintStep: () => 0 } as View);
      for (const b of Array.from(stage.querySelectorAll<HTMLElement>("[data-t]"))) {
        const w = b.dataset.t!;
        vus.add(w);
        const repeint = ["tipi", "domino", "midi"].includes(w);
        // jamais de tracé : l'image de l'imagier, ou le dessin repeint dans son SVG de 100
        const html = b.innerHTML;
        expect(/<(path|rect|circle|ellipse|polygon|line)\b/.test(html)).toBe(false);
        if (repeint) expect(html).toContain(`illustrations/${ELEMENTS[`mots/${w}`].fichier}`);
        else expect(b.querySelector("img")!.getAttribute("src")).toMatch(/imagier\//);
      }
    }
    expect([...vus].sort()).toEqual(Object.keys(PICTO).sort());
    for (const w of ["tipi", "domino", "midi"]) expect(surDisque(`illustrations/${ELEMENTS[`mots/${w}`].fichier}`)).toBe(true);
  });
  test("histoires sur mesure : chaque image proposée a son dessin dans l'imagier, et la demande les cite", () => {
    const permises = imagesPermises();
    expect(permises.length).toBeGreaterThan(250);
    for (const e of [...IMAGES_HISTOIRES, ...SOUND_WORDS.map((w) => w.e), ...READ_WORDS.map((w) => w.pic)]) {
      expect(imageImagier(e) ? e : `${e} : sans image`).toBe(e);
      expect(surDisque(imageImagier(e)!.fichier)).toBe(true);
    }
    const { system } = buildPrompt({ k: 11, theme: "la mer", hero: "mona", phrases: 5 });
    for (const e of ["🐳", "🦫", "🦝", "🦎", "🦔", "🐙", "🌊", "🎂"]) expect(system).toContain(e);
    expect(system).toContain("choisi seulement parmi ceux-ci");
  });
  test("histoires sur mesure : un émoji que l'imagier ne connaît pas n'entre pas dans l'histoire", () => {
    const o = { k: 11, theme: "la mer", hero: "mona" };
    const st = parseStory('{"titre":"T","emoji":"🦑","phrases":["Mona nage.","Mona voit la lune.","Fin."],"images":["🦑","🌙","<b>"],"question":{"texte":"q ?","choix":["a","b","c"],"bonne":0}}', o);
    expect(st.images).toEqual(["", "🌙", ""]);
    expect(st.emoji).toBe("🌙"); // la première image connue
    const sans = parseStory('{"titre":"T","phrases":["a b","c d"],"question":{"texte":"q ?","choix":["x","y"],"bonne":1}}', o);
    expect(sans.emoji).toBe("📖");
    // un émoji connu reste connu avec des espaces autour ou une teinte de peau
    const main = ["👋", "👍", "👏", "🙌"].find((e) => imageImagier(e))!;
    expect(main).toBeTruthy();
    const nuance = parseStory(JSON.stringify({ titre: "T", emoji: " 🐳 ", phrases: ["a b", "c d"], images: [`${main}\u{1F3FD}`, "🐳 "], question: { texte: "q ?", choix: ["x", "y"], bonne: 1 } }), o);
    expect(nuance.emoji).toBe("🐳");
    expect(nuance.images).toEqual([main, "🐳"]);
  });
  test("une ancienne histoire dont l'émoji n'a pas d'image : sa gommette « livre » l'écrit échappé", () => {
    const svg = emojiStickerSVG("<b>x", "#D7EFF8");
    expect(svg).toContain("&lt;b&gt;x");
    expect(svg).not.toContain("<b>");
  });
  test("l'imagier compte toutes ses images sur le disque", () => {
    const n = Object.keys(IMAGIER).length;
    expect(n).toBeGreaterThan(360);
    for (const im of Object.values(IMAGIER)) expect(surDisque(im.fichier)).toBe(true);
  });
});
