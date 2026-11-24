import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Livraison 4 : le décor vivant des îles. Les calques et les places viennent de l'atelier (scripts/illustration/vivant.py,
// fabriquer.py) ; l'appli les pose (src/screens/vivant.ts) et un chef d'orchestre lance les surprises. On vérifie ici
// les calques, l'ordre des couches, les touchers, et les garde-fous pas à pas : une surprise à la fois, toutes les 20 à
// 60 secondes, jamais pendant que Plume parle ni en arrière-plan, aucune avec « Réduire les animations ».
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
afterAll(() => dom?.unregister());
const withDom = test.skipIf(!dom);

const root = join(import.meta.dir, "..");
const { DECORS_ILES, ELEMENTS } = await import("../src/illustrations");
const { MOUVEMENTS } = await import("../src/design/jetons");
const { decorVivant, VIVANT_CSS } = await import("../src/screens/vivant");
const { ecranIle } = await import("../src/screens/ile");
const { ilesV2 } = await import("../src/iles");
import type { Environnement } from "../src/screens/vivant";

const ILES = Object.keys(DECORS_ILES);
const surDisque = (f: string) => existsSync(join(root, "public/illustrations", f));
const VISIBLE = [143, 1051]; // en portrait, le dessin est rogné de 12 % de chaque côté
const SUJETS: Record<string, string[]> = {
  poisson: ["poisson"], souffle: ["souffle"], ballon: ["ballon"], volcan: ["bouffee"], "arc-en-ciel": ["arc-en-ciel"], coeurs: ["coeur"], voilier: ["voilier"],
};

describe("les calques du décor vivant, dans le catalogue", () => {
  test("chaque île a ses reflets (deux jeux), ses nuages et les palmes de ses palmiers, chacun sur le disque", () => {
    for (const ile of ILES) {
      const a = Object.values(DECORS_ILES[ile].animes);
      for (const c of a) expect(surDisque(c.fichier) ? c.fichier : `${c.fichier} : absent`).toBe(c.fichier);
      expect(a.filter((c) => c.role === "reflets").length).toBe(2);
      expect(a.filter((c) => c.role === "nuage").length).toBeGreaterThanOrEqual(2);
      const palmes = a.filter((c) => c.role === "palmes");
      expect(palmes.length).toBeGreaterThanOrEqual(1);
      // elles tournent autour du haut du tronc, qui est dans leur image
      for (const p of palmes) for (const v of p.pivot!) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    }
  });
  test("l'hôte de chaque île a sa variante « yeux fermés », posée exactement sur lui ; Basile cligne à son étal", () => {
    for (const ile of ILES) {
      const a = DECORS_ILES[ile].animes;
      const hote = Object.entries(a).find(([, c]) => c.role === "hote");
      const cligne = Object.values(a).find((c) => c.role === "cligne");
      if (ile === "port") { expect(hote).toBeUndefined(); continue; } // le Port n'a pas d'hôte : Plume l'accueille
      expect(cligne).toBeDefined();
      if (ile === "nombres") { expect(hote).toBeUndefined(); continue; }
      expect(cligne!.boite).toEqual(hote![1].boite);
    }
    const n = DECORS_ILES.nombres.animes;
    for (const nom of ["bras", "grenouille", "bateau"]) expect(n[nom].pivot).toBeDefined();
  });
  test("les petits sujets sont placés dans la partie visible en portrait, et chaque surprise a ses dessins", () => {
    for (const ile of ILES) {
      const v = DECORS_ILES[ile].vivant!;
      expect(v.etincelles!.length).toBe(5);
      for (const [x, y] of [...v.etincelles!, v.dauphin!, v.baleine!, ...v.papillons!]) {
        expect(x).toBeGreaterThanOrEqual(VISIBLE[0]);
        expect(x).toBeLessThanOrEqual(VISIBLE[1]);
        expect(y).toBeGreaterThan(236); // sous l'horizon : sur la mer ou sur l'île
        expect(y).toBeLessThan(834);
      }
      expect(v.papillons!.length).toBe(2);
      const s = v.surprise!;
      expect(Object.keys(SUJETS)).toContain(s.type);
      for (const n of SUJETS[s.type]) expect(ELEMENTS[`vivant/${n}`]).toBeDefined();
    }
    for (const n of ["dauphin", "gerbe", "baleine", "souffle", "oiseau-0", "oiseau-1", "etincelle", "bouffee", "papillon-jaune", "papillon-rose"]) {
      expect(surDisque(ELEMENTS[`vivant/${n}`].fichier)).toBe(true);
    }
  });
  test("tout le décor bouge plus lentement que Plume ; seules les surprises sont plus vives, et rares", () => {
    const plume = MOUVEMENTS.battementPlume;
    for (const k of ["nuages", "houle", "etincelle", "palmes", "bateau", "papillon", "respiration", "salut", "clignement"] as const) expect(MOUVEMENTS[k]).toBeGreaterThan(plume);
    expect(MOUVEMENTS.surpriseMin).toBe(20000);
    expect(MOUVEMENTS.surpriseMax).toBe(60000);
    // « Réduire les animations » : aucune surprise, la fumée des volcans posée, immobile
    expect(VIVANT_CSS).toContain("@media (prefers-reduced-motion:reduce)");
    expect(VIVANT_CSS).toContain(".viv-surprise{display:none}");
    // en arrière-plan, tout se fige
    expect(VIVANT_CSS).toContain(".viv-pause .viv,.viv-pause .viv *{animation-play-state:paused!important}");
  });
});

describe("l'écran d'île vivant", () => {
  withDom("les couches : la mer et le ciel sur le dessin de base, sous les lieux ; l'île vivante au-dessus des lieux, sous Plume", () => {
    for (const ile of ILES) {
      const { el, vivant } = ecranIle(ilesV2()[ile as never]);
      const cadre = el.querySelector(".ile-cadre")!;
      const enfants = Array.from(cadre.children);
      const rang = (sel: string) => enfants.findIndex((e) => e.matches(sel));
      const dernier = (sel: string) => enfants.map((e) => e.matches(sel)).lastIndexOf(true);
      expect(rang("img.ile-base")).toBe(0);
      expect(rang(".viv-reflets")).toBe(1);
      expect(dernier(".viv-nuage")).toBeLessThan(rang("img.ile-lieu"));
      expect(rang(".viv-palmes")).toBeGreaterThan(dernier("img.ile-lieu"));
      expect(dernier(".viv")).toBeLessThan(rang(".plume-vol"));
      expect(vivant!.surprises).toEqual(expect.arrayContaining(["dauphin", "baleine", "oiseaux", DECORS_ILES[ile].vivant!.surprise!.type]));
      // ce qu'on touche est un bouton nommé ; le reste ne prend pas le doigt
      for (const b of Array.from(cadre.querySelectorAll<HTMLElement>(".viv-touche"))) {
        expect(b.tagName).toBe("BUTTON");
        expect(b.getAttribute("aria-label")).toBeTruthy();
      }
      if (ile !== "port" && ile !== "nombres") expect(cadre.querySelector(".viv-hote .viv-cligne")).not.toBeNull();
    }
  });
  withDom("un palmier dont les palmes passent sur un lieu ne se touche pas : le lieu reste entier sous le doigt", () => {
    for (const ile of ILES) {
      const d = DECORS_ILES[ile];
      const lieux = Object.values(d.lieux).map((l) => l.boite);
      const { el } = ecranIle(ilesV2()[ile as never]);
      const palmes = Array.from(el.querySelectorAll<HTMLElement>(".viv-palmes"));
      for (const p of palmes) {
        const [x, y, l, h] = ["left", "top", "width", "height"].map((k) => parseFloat(p.style.getPropertyValue(k)));
        const croise = lieux.some((b) => x < b[0] + b[2] && b[0] < x + l && y < b[1] + b[3] && b[1] < y + h);
        expect(p.tagName === "BUTTON").toBe(!croise);
      }
    }
  });
});

describe("le chef d'orchestre des surprises", () => {
  // Une horloge à la main : on note ce qui est programmé, et on le déclenche quand on veut.
  function horloge(o: Partial<Environnement> = {}) {
    const attentes: { fn: () => void; ms: number; id: number }[] = [];
    let n = 0;
    const env: Partial<Environnement> = {
      attendre: (fn, ms) => { attentes.push({ fn, ms, id: ++n }); return n; },
      annuler: (id) => { const i = attentes.findIndex((a) => a.id === id); if (i >= 0) attentes.splice(i, 1); },
      parle: () => false, cache: () => false, reduit: () => false, hasard: () => 0.5, ...o,
    };
    // la prochaine surprise programmée (les retraits de « joue », plus courts, sont laissés de côté)
    const suivante = () => attentes.filter((a) => a.ms >= 4000).sort((a, b) => a.id - b.id).pop();
    return { env, attentes, suivante, tirer: () => { const a = suivante()!; attentes.splice(attentes.indexOf(a), 1); a.fn(); } };
  }
  const monter = (env: Partial<Environnement>, ile = "nombres") => {
    const cadre = document.createElement("div");
    document.body.appendChild(cadre);
    const v = decorVivant(DECORS_ILES[ile], cadre, env);
    cadre.append(...v.fond, ...v.haut);
    return { v, cadre, jouees: () => Array.from(cadre.querySelectorAll(".viv-surprise.joue")) };
  };
  withDom("la première surprise vient 20 à 60 secondes après l'arrivée ; puis une à la fois, jamais deux fois la même", () => {
    const h = horloge({ hasard: () => 0 });
    const { v, jouees } = monter(h.env);
    v.demarrer();
    expect(h.suivante()!.ms).toBe(MOUVEMENTS.surpriseMin);
    const vues: string[] = [];
    for (let i = 0; i < 6; i++) {
      h.tirer();
      const j = jouees();
      expect(j.length).toBeGreaterThanOrEqual(1);
      vues.push(j.map((e) => e.className).join("|"));
      for (const e of j) e.classList.remove("joue");
      const ms = h.suivante()!.ms;
      expect(ms).toBeGreaterThanOrEqual(MOUVEMENTS.surpriseMin);
      expect(ms).toBeLessThanOrEqual(MOUVEMENTS.surpriseMax);
    }
    for (let i = 1; i < vues.length; i++) expect(vues[i]).not.toBe(vues[i - 1]);
  });
  withDom("pendant que Plume parle, ou quand l'appli est en arrière-plan, aucune surprise : on réessaie un peu plus tard", () => {
    let parle = true, cache = false;
    const h = horloge({ parle: () => parle, cache: () => cache });
    const { v, jouees } = monter(h.env);
    v.demarrer();
    h.tirer();
    expect(jouees().length).toBe(0);
    expect(h.suivante()!.ms).toBe(4000);
    parle = false; cache = true;
    h.tirer();
    expect(jouees().length).toBe(0);
    cache = false;
    h.tirer();
    expect(jouees().length).toBe(1);
  });
  withDom("une surprise ne démarre jamais par-dessus une autre (celle lancée à la main par la vitrine, par exemple)", () => {
    const h = horloge();
    const { v, jouees } = monter(h.env);
    v.demarrer();
    expect(v.jouer("oiseaux")).toBe(true);
    h.tirer();
    expect(jouees().length).toBe(1);
    expect(h.suivante()!.ms).toBe(4000);
    v.arreter();
    expect(h.suivante()).toBeUndefined();
  });
  withDom("en arrière-plan, le décor se fige ; au retour, il repart et les surprises reprennent", () => {
    let cache = false;
    const h = horloge({ cache: () => cache });
    const { v, cadre } = monter(h.env);
    v.demarrer();
    cache = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cadre.classList.contains("viv-pause")).toBe(true);
    expect(h.suivante()).toBeUndefined();
    cache = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cadre.classList.contains("viv-pause")).toBe(false);
    expect(h.suivante()!.ms).toBeGreaterThanOrEqual(MOUVEMENTS.surpriseMin);
  });
  withDom("avec « Réduire les animations », aucune surprise n'est programmée ni jouée", () => {
    const h = horloge({ reduit: () => true });
    const { v } = monter(h.env);
    v.demarrer();
    expect(h.attentes.length).toBe(0);
    expect(v.jouer("dauphin")).toBe(false);
  });
  withDom("l'écran quitté, le chef d'orchestre s'arrête", () => {
    const h = horloge();
    const { v, cadre, jouees } = monter(h.env);
    v.demarrer();
    cadre.remove();
    h.tirer();
    expect(jouees().length).toBe(0);
    expect(h.suivante()).toBeUndefined();
  });
});
