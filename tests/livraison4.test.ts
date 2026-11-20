import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Livraison 4 de la refonte : Plume vole vers l'île choisie (vérifié de bout en bout dans tests/e2e/appuis.py) et les
// jeux redessinés : le marché et le goûter, le bassin de verre, les perles de Rico, le potager de Bip, les poubelles du
// grand tri, le volcan coupé. On vérifie ici que chaque objet dessiné existe et qu'il est posé là où l'appli l'attend ;
// la pédagogie, elle, ne change pas (activities.test.ts, tri.test.ts, volcan.test.ts).
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
afterAll(() => dom?.unregister());
const withDom = test.skipIf(!dom);

const root = join(import.meta.dir, "..");
const { ELEMENTS, PERSONNAGES } = await import("../src/illustrations");
const { ACTIVITIES } = await import("../src/activities");
const { MOUVEMENTS } = await import("../src/design/jetons");
const { createProfile } = await import("../src/app");
const { knownSet } = await import("../src/content");
const { makeRng } = await import("../src/core");
const { COLORS, SHAPES } = await import("../src/activities/motifs");
const { _triData, binArt, binArtTrace } = await import("../src/activities/tri");
const { coupeSVG } = await import("../src/activities/volcan_art");
import type { Ctx, View } from "../src/host";

const surDisque = (fichier: string) => existsSync(join(root, "public", fichier));
function dessine(nom: string) {
  const im = ELEMENTS[nom];
  expect(im === undefined ? `${nom} : absent` : nom).toBe(nom);
  expect(surDisque(`illustrations/${im.fichier}`)).toBe(true);
  expect(im.cadre).toBeDefined(); // l'appli replace l'image recadrée dans son cadre (calques, vignettes)
  return im;
}
const p = createProfile({ name: "Lou", ageMonths: 54, color: "#FFC145", readingK: 15, countTo: 20, flags: 0 });
const ctx = (k: number): Ctx => ({ profile: p, rng: makeRng(k), known: knownSet(15), now: Date.now() });
const vue = (stage: HTMLElement): View => ({ stage, rng: makeRng(1), answer() {}, say: async () => {}, hintStep: () => 0 });
const images = (html: string) => [...html.matchAll(/illustrations\/[^"')?\s]+\.webp/g)].map((m) => m[0]);
function rendu(id: string, niveau: number, graine: number) {
  const mod = ACTIVITIES.find((m) => m.id === id)!;
  const item = mod.generate(niveau, ctx(graine));
  const stage = document.createElement("div");
  document.body.appendChild(stage);
  mod.render(item, vue(stage));
  return { item: item as any, stage };
}

describe("Plume vole vers l'île choisie", () => {
  test("le vol est un mouvement d'ambiance documenté : de 600 ms à 1 s selon la distance", () => {
    expect(MOUVEMENTS.volChoixMin).toBe(600);
    expect(MOUVEMENTS.volChoixMax).toBe(1000);
  });
});

describe("les objets dessinés des jeux", () => {
  test("le marché et le goûter : panier, corbeille, cagette à dix places, sac de dix, ardoise, assiette, boîte à biscuits", () => {
    for (const nom of ["panier", "corbeille", "cagette-10", "sac-10", "ardoise", "assiette", "boite-biscuits"]) dessine(`activites/${nom}`);
    const cagette = ELEMENTS["activites/cagette-10"];
    expect(Object.keys(cagette.points ?? {}).length).toBe(10);
    for (const [x, y] of Object.values(cagette.points ?? {})) { expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(1); expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(1); }
    expect(ELEMENTS["activites/sac-10"].points?.etiquette).toBeDefined();
    expect(Number(ELEMENTS["activites/boite-biscuits"].infos?.bord)).toBeGreaterThan(0);
  });
  test("une perle en bois par forme et par couleur des motifs de Rico, toutes dans le même cadre carré", () => {
    for (const s of SHAPES) for (const c of Object.keys(COLORS)) expect(dessine(`activites/perle-${s}-${c}`).cadre).toEqual([120, 120]);
    for (const nom of ["plateau-perles", "alveole"]) dessine(`activites/${nom}`);
  });
  test("le bassin de verre : le fond et le devant ont le même cadre ; la ligne d'eau est au-dessus du sable", () => {
    const fond = dessine("activites/bassin-fond"), devant = dessine("activites/bassin-devant");
    expect(devant.cadre).toEqual(fond.cadre!);
    const eau = Number(fond.infos?.eau), sable = Number(fond.infos?.sable);
    expect(eau).toBeGreaterThan(0.3);
    expect(sable).toBeLessThan(0.9);
    expect(sable - eau).toBeGreaterThan(0.25); // assez d'eau pour qu'un objet y coule tout entier
    for (const nom of ["flotte-oui", "flotte-non"]) expect(dessine(`activites/${nom}`).cadre).toEqual([160, 120]);
  });
  test("le potager de Bip : cadre en planches, trois herbes, deux cailloux, l'étoile ; Bip a ses trois visages", () => {
    expect(Number(dessine("activites/potager").infos?.bord)).toBeGreaterThan(0);
    for (const nom of ["herbe-1", "herbe-2", "herbe-3", "caillou-1", "caillou-2", "etoile"]) dessine(`activites/${nom}`);
    for (const e of ["content", "surpris", "rieur"]) expect(surDisque(`illustrations/${PERSONNAGES[`bip-${e}`].fichier}`)).toBe(true);
  });
  test("le grand tri : chaque poubelle de chaque réglage est dessinée, son couvercle à part ; le voyage des déchets garde les siennes", () => {
    const { binsFor } = _triData;
    for (const papiers of ["jaune", "bleu"] as const) for (const cuisine of ["marron", "compost"] as const) for (const couleurs of ["nationales", "paris"] as const) {
      for (const b of binsFor({ papiers, cuisine, couleurs })) {
        const html = binArt(b);
        expect(html).toContain('class="poubelle"');
        expect(html).toContain("calque lid");
        expect(images(html).length).toBe(2);
        for (const f of images(html)) expect(surDisque(f)).toBe(true);
        expect(binArtTrace(b)).toStartWith("<svg");
      }
    }
  });
});

describe("le volcan coupé dessiné", () => {
  // Les boîtes des images posées dans le volcan (repère 200 × 160) et les zones touchables des cinq parties.
  const svg = coupeSVG();
  const boite = (nom: string) => {
    const m = new RegExp(`<image[^>]*href="[^"]*volcan-${nom}\\.webp[^"]*" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`).exec(svg);
    expect(m === null ? `volcan-${nom} : absent` : nom).toBe(nom);
    const [x, y, l, h] = m!.slice(1).map(Number);
    return { x0: x, y0: y, x1: x + l, y1: y + h };
  };
  const zone = (t: string) => {
    const m = new RegExp(`data-t="${t}"[^>]*>.*?<rect class="hit" x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`).exec(svg);
    const [x, y, l, h] = m!.slice(1).map(Number);
    return { x0: x, y0: y, x1: x + l, y1: y + h };
  };
  const dedans = (b: { x0: number; y0: number; x1: number; y1: number }, x: number, y: number) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
  test("les cinq parties sont toujours touchables, chacune avec sa zone généreuse ; les images ne prennent pas le doigt", () => {
    for (const t of ["chambre", "cheminee", "cratere", "coulee", "cendres"]) expect(svg).toContain(`data-t="${t}"`);
    expect((svg.match(/class="hit"/g) ?? []).length).toBe(5);
    // une image SVG se touche sur tout son rectangle : le nuage couvrirait le cratère, la coulée la cheminée
    const imgs = svg.match(/<image[^>]*>/g) ?? [];
    expect(imgs.length).toBeGreaterThanOrEqual(4);
    for (const i of imgs) expect(i).toContain('pointer-events="none"');
  });
  test("chaque partie dessinée tombe sous sa zone touchable", () => {
    const fond = boite("coupe"), lave = boite("cratere-lave"), coulee = boite("coulee"), nuage = boite("nuage");
    // la poche de magma et la cheminée sont peintes dans le fond
    const ch = zone("chambre"), che = zone("cheminee");
    for (const [x, y] of [[ch.x0, ch.y0], [ch.x1, ch.y1], [che.x0, che.y0], [che.x1, che.y1]]) expect(dedans(fond, x, y)).toBe(true);
    // la lave du cratère est au milieu de la zone du cratère
    const cr = zone("cratere");
    expect(dedans(cr, (lave.x0 + lave.x1) / 2, (lave.y0 + lave.y1) / 2)).toBe(true);
    // la coulée passe par sa zone (le début et la fin du tracé touchable)
    for (const [x, y] of [[127, 54], [170, 101]]) expect(dedans(coulee, x, y)).toBe(true);
    // le nuage couvre le milieu de sa zone, et ne dépasse pas le haut du dessin
    const ce = zone("cendres");
    expect(dedans(nuage, (ce.x0 + ce.x1) / 2, (ce.y0 + ce.y1) / 2)).toBe(true);
    expect(nuage.y0).toBeGreaterThanOrEqual(0);
  });
  test("avant l'éruption, le cratère est vide : sa lave est cachée, le magma attend en bas de la cheminée", () => {
    const avant = coupeSVG({ flow: false, cloud: false, level: 0.06 });
    expect(avant).toMatch(/class="vcratere-lave"[^>]*style="opacity:0"/);
    expect(avant).not.toContain("volcan-coulee");
    expect(avant).not.toContain("volcan-nuage");
    expect(coupeSVG()).not.toContain("opacity:0");
  });
});

describe("les jeux redessinés, à tous les niveaux", () => {
  // (le goûter est habillé par la feuille de style : ses assiettes et sa boîte sont vérifiées plus bas)
  const JEUX: [string, number[]][] = [["marche", [1, 2, 3, 4, 5, 6]], ["flotte", [1, 2, 3]], ["motifs", [1, 2, 3, 4, 5]],
    ["bip", [1, 2, 3, 4, 5]], ["tri", [1, 2, 3, 4, 5, 6]], ["volcan", [1, 2]]]; // volcan : le volcan coupé (parties, magma)
  withDom("chaque plateau montre des objets dessinés, et chaque image qu'il demande existe", () => {
    for (const [id, niveaux] of JEUX) for (const n of niveaux) for (const g of [3, 8]) {
      const { stage } = rendu(id, n, g * 10 + n);
      if (id === "volcan" && !stage.querySelector(".vcoupe")) { stage.remove(); continue; } // les autres questions du volcan : des cartes
      const vues = images(stage.innerHTML);
      expect(vues.some((f) => f.includes("illustrations/activites/")) ? id : `${id} niveau ${n} : aucun objet dessiné`).toBe(id);
      for (const f of vues) expect(surDisque(f) ? f : `${f} : introuvable`).toBe(f);
      stage.remove();
    }
  });
  withDom("le goûter : des assiettes et une boîte à biscuits, que la feuille de style habille des objets dessinés", async () => {
    const { STYLES_L4 } = await import("../src/screens/styles4");
    for (const nom of ["assiette", "corbeille", "boite-biscuits"]) expect(STYLES_L4).toContain(`illustrations/${ELEMENTS[`activites/${nom}`].fichier}`);
    for (const n of [1, 2, 3, 4]) {
      const { stage } = rendu("partage", n, 7 + n);
      expect(stage.querySelectorAll(".plate .dish, .panel.cookies").length).toBeGreaterThan(0);
      stage.remove();
    }
  });
  withDom("le bassin : les objets tombent entre le fond et le devant ; les réponses sont deux bocaux dessinés", () => {
    for (let g = 1; g <= 12; g++) {
      const { item, stage } = rendu("flotte", 3, g);
      const bassin = stage.querySelector(".bassin.verre")!;
      const enfants = Array.from(bassin.children);
      expect(enfants[0].matches("img.calque")).toBe(true);
      expect(enfants[enfants.length - 1].matches("img.calque.devant")).toBe(true);
      expect(bassin.querySelectorAll(".fobj").length).toBe(item.objs.length);
      if (item.kind === "predire") expect(stage.querySelectorAll(".pickcard .fvign img").length).toBe(2);
      stage.remove();
    }
  });
  withDom("les motifs : chaque perle montre la forme et la couleur de son motif", () => {
    for (let g = 1; g <= 10; g++) for (const n of [1, 3, 5]) {
      const { item, stage } = rendu("motifs", n, g);
      const toks = Array.from(stage.querySelectorAll<HTMLElement>(".motifseq .tok, .motifgrid .tok"));
      expect(toks.length).toBe(item.seq.length);
      item.seq.forEach((t: { s: string; c: string } | null, i: number) => {
        const src = toks[i].querySelector("img")?.getAttribute("src") ?? "";
        if (t) expect(src).toContain(`perle-${t.s}-${t.c}.webp`);
        else expect(toks[i].classList.contains("hole")).toBe(true);
      });
      stage.remove();
    }
  });
  withDom("le potager de Bip : une herbe sous chaque case, l'étoile au but, un caillou sur chaque rocher, Bip au départ", () => {
    for (let g = 1; g <= 8; g++) for (const n of [1, 3, 5]) {
      const { item, stage } = rendu("bip", n, g);
      const cases = Array.from(stage.querySelectorAll<HTMLElement>(".bipcell"));
      expect(cases.length).toBe(item.cols * item.rows);
      for (const c of cases) expect(c.style.backgroundImage).toContain("activites/herbe-");
      expect(cases[item.goal].innerHTML).toContain("activites/etoile.webp");
      for (const r of item.rocks) expect(cases[r].innerHTML).toContain("activites/caillou-");
      expect(stage.querySelector(".bipbot img")?.getAttribute("src")).toContain("personnages/bip-content");
      stage.remove();
    }
  });
});
