import { afterAll, describe, expect, test } from "bun:test";

// Livraison 2 de la refonte : compagnons de voyage, écran de l'île des Nombres, cadre d'activité habité, nénuphars
// redessinés, fêtes (message d'une couleur, grande fête avec l'hôte), carte et accueil dessinés.
// Les tests d'affichage demandent un DOM simulé (happy-dom) : sautés s'il n'est pas installé.
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
afterAll(() => dom?.unregister());
const withDom = test.skipIf(!dom);

const { COMPAGNONS, CHAPEAUX, attribuerCompagnons, chapeauDe, compagnonLibre, estCompagnon } = await import("../src/compagnons");
const { ELEMENTS, PERSONNAGES } = await import("../src/illustrations");
const { normalize } = await import("../src/services");
const { ACTIVITIES } = await import("../src/activities");

describe("compagnons de voyage", () => {
  test("huit bébés animaux, différents, et aucun n'est un hôte des îles", () => {
    expect(new Set(COMPAGNONS).size).toBe(8);
    const hotes = new Set(["basile", "mona", "rico", "bip", "octave", "kiki", "pico", "plume"]);
    for (const a of COMPAGNONS) expect(hotes.has(a)).toBe(false);
  });
  test("chaque compagnon a son dessin, et chaque couleur de profil son chapeau", () => {
    for (const a of COMPAGNONS) {
      const im = ELEMENTS[`accueil/compagnon-${a}`];
      expect(im).toBeDefined();
      expect(im.points?.disque).toBeDefined();
      expect(im.points?.chapeau).toBeDefined();
      expect(Number(im.infos?.rayon)).toBeGreaterThan(50);
    }
    for (const c of Object.values(CHAPEAUX)) expect(ELEMENTS[`accueil/chapeau-${c}`]?.points?.base).toBeDefined();
  });
  test("chapeau : la couleur du profil, ou la plus proche", () => {
    expect(chapeauDe("#3D8BEA")).toBe("bleu");
    expect(chapeauDe("#3d8bea")).toBe("bleu");
    expect(chapeauDe("#FFC000")).toBe("jaune");
    expect(chapeauDe("pas une couleur")).toBe("jaune");
  });
  test("les profils d'avant la refonte reçoivent un compagnon, toujours le même, sans doublon", () => {
    const profils = () => [{ id: "a1" }, { id: "b2" }, { id: "c3", avatar: "panda" }] as { id: string; avatar?: string }[];
    const x = profils(), y = profils();
    attribuerCompagnons(x); attribuerCompagnons(y);
    expect(x.map((p) => p.avatar)).toEqual(y.map((p) => p.avatar));
    expect(new Set(x.map((p) => p.avatar)).size).toBe(3);
    expect(x[2].avatar).toBe("panda");
    for (const p of x) expect(estCompagnon(p.avatar)).toBe(true);
  });
  test("les données enregistrées sont complétées au chargement ; un compagnon inconnu est remplacé", () => {
    const d = normalize({ profiles: [{ id: "p1", name: "Lou", color: "#FFC145" }, { id: "p2", name: "Sam", avatar: "dragon" }] });
    expect(estCompagnon(d.profiles[0].avatar)).toBe(true);
    expect(estCompagnon(d.profiles[1].avatar)).toBe(true);
    expect(d.profiles[0].avatar).not.toBe(d.profiles[1].avatar);
  });
  test("un nouveau profil prend le premier compagnon libre", () => {
    expect(compagnonLibre(["renard", "lapin"])).toBe("ourson");
    expect(compagnonLibre(COMPAGNONS)).toBe("renard");
  });
});

describe("dessins de la livraison 2", () => {
  test("la carte : la mer, les sept îles avec leur centre, le soleil et la lune", () => {
    expect(ELEMENTS["carte/mer"]).toBeDefined();
    for (const id of ["nombres", "mots", "port", "enigmes", "decouvertes", "atelier", "coeur"]) expect(ELEMENTS[`carte/ile-${id}`]?.points?.centre).toBeDefined();
    expect(ELEMENTS["carte/soleil"]).toBeDefined();
    expect(ELEMENTS["carte/lune"]).toBeDefined();
  });
  test("les fêtes : sept ballons, la voiture et le camion avec leurs roues, la fusée et sa flamme, le volcan, la guirlande", () => {
    for (const c of ["jaune", "corail", "rose", "violet", "bleu", "turquoise", "vert"]) expect(ELEMENTS[`fetes/ballon-${c}`]).toBeDefined();
    expect(ELEMENTS["fetes/voiture"].points?.roue2).toBeDefined();
    expect(ELEMENTS["fetes/camion"].points?.roue3).toBeDefined();
    expect(ELEMENTS["fetes/camion"].points?.lance).toBeDefined();
    expect(ELEMENTS["fetes/fusee"].points?.tuyere).toBeDefined();
    expect(ELEMENTS["fetes/volcan"].points?.cratere).toBeDefined();
    for (const n of ["fetes/roue", "fetes/gyrophare", "fetes/flamme", "fetes/guirlande"]) expect(ELEMENTS[n]).toBeDefined();
  });
  test("chaque hôte d'activité a ses quatre expressions (Plume, hôtesse du Port, est le bouton d'indice)", () => {
    for (const a of ACTIVITIES) {
      if (a.host === "plume") continue;
      for (const e of ["content", "rieur", "doux", "pensif"]) expect(PERSONNAGES[`${a.host}-${e}`]).toBeDefined();
    }
  });
});

describe("écran de l'île", () => {
  test("Plume souhaite la bienvenue, puis l'hôte salue (pas de salut de Plume par elle-même)", async () => {
    const { bienvenueIle } = await import("../src/screens/ile");
    expect(bienvenueIle("nombres")).toEqual(["Bienvenue sur l'île des Nombres !", "Basile te fait coucou !"]);
    expect(bienvenueIle("port")).toEqual(["Bienvenue au Port des Voyages !"]);
  });
  withDom("chaque lieu de l'île des Nombres a son étiquette, qui ouvre son activité", async () => {
    const { ecranIle } = await import("../src/screens/ile");
    const { ilesV2 } = await import("../src/iles");
    const ouverts: string[] = [];
    const { el } = ecranIle(ilesV2().nombres, { conseil: "nenuphars", disponible: (id) => id !== "partage", onLieu: (id) => ouverts.push(id) });
    document.body.appendChild(el);
    const pills = Array.from(el.querySelectorAll<HTMLElement>(".a-pastille[data-act]"));
    expect(pills.map((p) => p.dataset.act).sort()).toEqual(["marche", "nenuphars", "partage"]);
    expect(el.querySelector('.a-pastille[data-act="nenuphars"]')!.classList.contains("conseillee")).toBe(true);
    expect(el.querySelector('.a-pastille[data-act="partage"]')!.getAttribute("aria-label")).toContain("pas encore ouverte");
    (el.querySelector('.a-pastille[data-act="marche"]') as HTMLElement).click();
    (el.querySelector('img.ile-lieu[data-lieu="nenuphars"]') as HTMLElement).click();
    expect(ouverts).toEqual(["marche", "nenuphars"]);
    el.remove();
  });
});

describe("cadre d'activité", () => {
  withDom("l'hôte change d'expression ; Plume n'est pas montrée deux fois sur le Port", async () => {
    const { hoteActivite, decorActivite } = await import("../src/host");
    expect(hoteActivite("plume")).toBeNull();
    const h = hoteActivite("basile")!;
    // quatre expressions, et (livraison 4) le calque « yeux fermés » de son clignement
    expect(h.el.querySelectorAll("img").length).toBe(5);
    expect(h.el.querySelectorAll("img.hote-cligne").length).toBe(1);
    expect(h.el.dataset.expr).toBe("content");
    h.expr("rieur", true);
    expect(h.el.dataset.expr).toBe("rieur");
    expect(h.el.classList.contains("saute")).toBe(true);
    h.expr("pensif", false, 10);
    expect(h.el.dataset.expr).toBe("pensif");
    await new Promise((r) => setTimeout(r, 30));
    expect(h.el.dataset.expr).toBe("content");
    h.fin();
    expect(decorActivite("nombres").classList.contains("dessine")).toBe(true);
    expect(decorActivite("pas-encore-dessinee").classList.contains("dessine")).toBe(false);
  });
  withDom("les nénuphars : l'étang dessiné, onze nénuphars numérotés, la grenouille en deux poses", async () => {
    const { nenuphars } = await import("../src/activities/nenuphars");
    const { makeRng } = await import("../src/core");
    const stage = document.createElement("div");
    document.body.appendChild(stage);
    const item = nenuphars.generate(1, { rng: makeRng(3) } as any);
    nenuphars.render(item, { stage, rng: makeRng(3), say: async () => {}, answer: () => {}, hintStep: () => 0 } as any);
    const pond = stage.querySelector<HTMLElement>(".pond.etang")!;
    expect(pond.style.getPropertyValue("--etang")).toContain("nenuphars-etang");
    const pads = Array.from(stage.querySelectorAll<HTMLElement>(".pad[data-n]"));
    expect(pads.length).toBe(11);
    pads.forEach((p, n) => { expect(p.getAttribute("aria-label")).toBe(String(n)); expect(p.querySelector(".padnum")!.textContent).toBe(String(n)); expect(p.querySelector("img.pad-img")).not.toBeNull(); });
    expect(stage.querySelectorAll(".frog img").length).toBe(2);
    stage.remove();
  });
});

describe("fêtes", () => {
  withDom("le message est d'une seule couleur (plus de lettres arc-en-ciel)", async () => {
    const fete = await import("../src/fete");
    const host = document.createElement("div");
    const party = fete.celebrate(host, { name: "Lou", firstTry: true });
    const msg = host.querySelector(".fete-msg")!;
    expect(msg.textContent).toContain("Lou");
    expect(msg.querySelectorAll("[style*='color']").length).toBe(0);
    party.end();
  });
  withDom("la grande fête : guirlande, l'hôte qui rit et Plume ; Plume seule sur le Port", async () => {
    const fete = await import("../src/fete");
    const a = document.createElement("div");
    const p1 = fete.celebrate(a, { name: "Lou", final: true, hote: "basile" });
    expect(p1.scene).toBe("finale");
    const srcs = Array.from(a.querySelectorAll(".fete-perso img")).map((i) => i.getAttribute("src") ?? "");
    expect(srcs.some((s) => s.includes("basile-rieur"))).toBe(true);
    expect(srcs.some((s) => s.includes("plume-fete"))).toBe(true);
    expect(a.querySelector(".guirlande img")).not.toBeNull();
    p1.end();
    const b = document.createElement("div");
    const p2 = fete.celebrate(b, { name: "Lou", final: true, hote: "plume" });
    expect(b.querySelectorAll(".fete-perso").length).toBe(1);
    p2.end();
  });
});

describe("accueil et carte", () => {
  withDom("un compagnon se dessine dans son cercle, coiffé du chapeau de sa couleur", async () => {
    const { compagnonHTML } = await import("../src/design/dessins");
    const box = document.createElement("div");
    box.innerHTML = compagnonHTML("lapin", "#E85D9A");
    const c = box.querySelector<HTMLElement>(".compagnon")!;
    expect(c.dataset.compagnon).toBe("lapin");
    expect(box.querySelector(".cp-animal")!.getAttribute("src")).toContain("compagnon-lapin");
    expect(box.querySelector(".cp-chapeau")!.getAttribute("src")).toContain("chapeau-rose");
    box.innerHTML = compagnonHTML("dragon", "#123456");
    expect(box.querySelector<HTMLElement>(".compagnon")!.dataset.compagnon).toBe("renard");
  });
});
