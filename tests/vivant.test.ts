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
const { ecranIle, ILE_CSS } = await import("../src/screens/ile");
const { ilesV2 } = await import("../src/iles");
import type { Environnement, Minuterie } from "../src/screens/vivant";

const ILES = Object.keys(DECORS_ILES);

// Les images-clés d'une feuille de style : pour chaque animation, ses étapes (temps 0 à 1, rotation en degrés, translation
// en px ; une étape sans transform est laissée de côté, le navigateur l'interpole).
type Etape = { t: number; rot: number; x: number; y: number };
function images(css: string): Map<string, Etape[]> {
  const out = new Map<string, Etape[]>();
  for (const m of css.matchAll(/@keyframes ([\w-]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)) {
    const etapes: Etape[] = [];
    for (const b of m[2].matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const tr = /transform:([^;]*)/.exec(b[2])?.[1];
      if (tr === undefined) continue;
      const num = (re: RegExp) => { const r = re.exec(tr); return r ? parseFloat(r[1]) : 0; };
      const tl = /translate\(([-\d.]+)(?:px)?,\s*([-\d.]+)(?:px)?\)/.exec(tr);
      const x = tl ? parseFloat(tl[1]) : num(/translateX\(([-\d.]+)/);
      const y = tl ? parseFloat(tl[2]) : num(/translateY\(([-\d.]+)/);
      const rot = num(/rotate\(([-\d.]+)deg/);
      for (const sel of b[1].split(",").map((x) => x.trim())) {
        const t = sel === "from" ? 0 : sel === "to" ? 1 : parseFloat(sel) / 100;
        if (!Number.isNaN(t)) etapes.push({ t, rot, x, y });
      }
    }
    out.set(m[1], etapes.sort((a, b) => a.t - b.t));
  }
  return out;
}
// Les animations qui tournent en boucle (« infinite ») et leur vitesse la plus forte, d'une étape à la suivante.
function enContinu(css: string): { nom: string; degParS: number; pxParS: number }[] {
  const kf = images(css);
  const out: { nom: string; degParS: number; pxParS: number }[] = [];
  for (const d of css.matchAll(/animation:([^;}]*)/g)) {
    // les animations d'une même règle sont séparées par des virgules (hors des parenthèses des courbes)
    const parts: string[] = [];
    let prof = 0, cur = "";
    for (const ch of d[1]) { if (ch === "(") prof++; if (ch === ")") prof--; if (ch === "," && !prof) { parts.push(cur); cur = ""; } else cur += ch; }
    parts.push(cur);
    for (const a of parts) {
      if (!/\binfinite\b/.test(a)) continue;
      const nom = a.trim().split(/\s+/).find((w) => kf.has(w));
      const dur = /(?:^|\s)([\d.]+)(ms|s)\b/.exec(a);
      if (!nom || !dur) continue;
      const ms = parseFloat(dur[1]) * (dur[2] === "s" ? 1000 : 1);
      const e = kf.get(nom)!;
      let deg = 0, px = 0;
      for (let i = 1; i < e.length; i++) {
        const dt = ((e[i].t - e[i - 1].t) * ms) / 1000;
        if (dt <= 0) continue;
        deg = Math.max(deg, Math.abs(e[i].rot - e[i - 1].rot) / dt);
        px = Math.max(px, Math.hypot(e[i].x - e[i - 1].x, e[i].y - e[i - 1].y) / dt);
      }
      out.push({ nom, degParS: deg, pxParS: px });
    }
  }
  return out;
}
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
  test("tout ce qui bouge en continu va moins vite que l'aile de Plume (vitesses mesurées sur les images-clés)", () => {
    // Plume : son aile tourne de 3° à -16° en un battement ; le bout de l'aile est à environ 73 px de l'épaule sur une île
    const aile = images(ILE_CSS).get("plume-battement")!;
    const amplitude = Math.abs(aile[1].rot - aile[0].rot);
    const plumeDeg = amplitude / (MOUVEMENTS.battementPlume / 1000);
    const plumePx = ((amplitude * Math.PI) / 180) * 73 / (MOUVEMENTS.battementPlume / 1000);
    expect(plumeDeg).toBeGreaterThan(15);
    const continues = enContinu(VIVANT_CSS);
    // le décor vivant : reflets, nuages, fumée, palmes, bateau, papillons, oiseaux qui planent…
    for (const n of ["viv-houle", "viv-derive", "viv-fume", "viv-balance", "viv-tangue", "viv-volj", "viv-volv"]) expect(continues.map((c) => c.nom)).toContain(n);
    for (const c of continues) {
      expect(`${c.nom} : ${c.degParS.toFixed(1)} °/s`).toBe(`${c.nom} : ${Math.min(c.degParS, plumeDeg).toFixed(1)} °/s`);
      expect(`${c.nom} : ${c.pxParS.toFixed(1)} px/s`).toBe(`${c.nom} : ${Math.min(c.pxParS, plumePx).toFixed(1)} px/s`);
    }
    // ce qui est plus vif ne tourne pas en boucle : Basile salue une fois, la grenouille saute quand on la touche (ou
    // pour une surprise)
    for (const n of ["viv-salue", "viv-hop", "viv-saute", "viv-secoue"]) expect(continues.map((c) => c.nom)).not.toContain(n);
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
  withDom("ce qui se touche dans le décor est à côté des lieux ; ce qui est posé sur un lieu l'ouvre (la grenouille, la fumée du volcan)", () => {
    for (const ile of ILES) {
      const d = DECORS_ILES[ile];
      const lieux = Object.values(d.lieux).map((l) => l.boite);
      const ouverts: string[] = [];
      const { el } = ecranIle(ilesV2()[ile as never], { onLieu: (id) => ouverts.push(id) });
      const boite = (e: HTMLElement) => ["left", "top", "width", "height"].map((k) => parseFloat(e.style.getPropertyValue(k)));
      for (const b of Array.from(el.querySelectorAll<HTMLElement>(".viv-touche"))) {
        const [x, y, l, h] = boite(b);
        expect(lieux.some((o) => x < o[0] + o[2] && o[0] < x + l && y < o[1] + o[3] && o[1] < y + h) ? `${ile} : ${b.getAttribute("aria-label")} sur un lieu` : "").toBe("");
      }
      for (const r of Array.from(el.querySelectorAll<HTMLElement>(".viv-relais"))) {
        expect(Object.keys(d.lieux)).toContain(r.dataset.relais!);
        expect(r.getAttribute("aria-hidden")).toBe("true");
        r.click();
        expect(ouverts.pop()).toBe(r.dataset.relais!);
      }
    }
    const nombres = ecranIle(ilesV2().nombres, { onLieu: () => {} }).el;
    expect(nombres.querySelector<HTMLElement>(".viv-grenouille")!.dataset.relais).toBe("nenuphars");
    const decouvertes = ecranIle(ilesV2().decouvertes, { onLieu: () => {} }).el;
    expect(decouvertes.querySelector<HTMLElement>(".viv-zone")!.dataset.relais).toBe("volcan");
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
    const attentes: { fn: () => void; ms: number; quoi: Minuterie; id: number; a: number }[] = [];
    let n = 0, t = 0;
    const env: Partial<Environnement> = {
      attendre: (fn, ms, quoi) => { attentes.push({ fn, ms, quoi, id: ++n, a: t }); return n; },
      annuler: (id) => { const i = attentes.findIndex((a) => a.id === id); if (i >= 0) attentes.splice(i, 1); },
      maintenant: () => t,
      parle: () => false, cache: () => false, reduit: () => false, hasard: () => 0.5, ...o,
    };
    const de = (quoi: Minuterie) => attentes.filter((a) => a.quoi === quoi).sort((a, b) => a.id - b.id).pop();
    const tirer = (quoi: Minuterie = "prochaine") => { const a = de(quoi)!; attentes.splice(attentes.indexOf(a), 1); t = Math.max(t, a.a + a.ms); a.fn(); };
    return { env, attentes, de, suivante: () => de("prochaine"), tirer, avancer: (ms: number) => { t += ms; } };
  }
  const monter = (env: Partial<Environnement>, ile = "nombres") => {
    const cadre = document.createElement("div");
    document.body.appendChild(cadre);
    const v = decorVivant(DECORS_ILES[ile], cadre, env);
    cadre.append(...v.fond, ...v.haut);
    return { v, cadre, jouees: () => Array.from(cadre.querySelectorAll("[data-surprise].joue")) };
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
      expect(j.length).toBe(1);
      vues.push(j.map((e) => e.className).join("|"));
      h.tirer("fin"); // elle s'efface à la fin de son mouvement
      expect(jouees().length).toBe(0);
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
  withDom("si Plume se met à parler pendant une surprise, celle-ci s'efface vite (fondu de 300 ms)", () => {
    let parle = false;
    const h = horloge({ parle: () => parle });
    const { v, jouees } = monter(h.env);
    expect(v.jouer("baleine")).toBe(true);
    h.tirer("veille");
    expect(jouees()[0].classList.contains("efface")).toBe(false);
    parle = true;
    h.tirer("veille");
    expect(jouees()[0].classList.contains("efface")).toBe(true);
    expect(h.de("fin")!.ms).toBe(300);
    h.tirer("fin");
    expect(jouees().length).toBe(0);
    expect(h.de("veille")).toBeUndefined();
  });
  withDom("en arrière-plan, la surprise en cours attend ; au retour, elle reprend là où elle en était", () => {
    let cache = false;
    const h = horloge({ cache: () => cache });
    const { v, jouees } = monter(h.env);
    v.demarrer();
    expect(v.jouer("oiseaux")).toBe(true);
    const total = h.de("fin")!.ms;
    h.avancer(5000);
    cache = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(h.de("fin")).toBeUndefined(); // sa fin ne tombe pas pendant qu'on ne la voit pas
    expect(h.de("veille")).toBeUndefined();
    h.avancer(60000);
    cache = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(jouees().length).toBe(1);
    expect(h.de("fin")!.ms).toBe(total - 5000);
    h.tirer("fin");
    expect(jouees().length).toBe(0);
  });
  withDom("l'île quittée (arreter), plus rien ne tourne : ni minuterie, ni écoute de l'arrière-plan, ni surprise", () => {
    let cache = false;
    const h = horloge({ cache: () => cache });
    const { v, cadre, jouees } = monter(h.env);
    v.demarrer();
    v.jouer("dauphin");
    v.arreter();
    expect(jouees().length).toBe(0);
    expect(h.attentes.length).toBe(0);
    cache = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cadre.classList.contains("viv-pause")).toBe(false);
    expect(v.jouer("dauphin")).toBe(false);
  });
  withDom("sansSurprises : plus de surprise programmée, mais le décor vit encore (pause en arrière-plan, surprise à la main)", () => {
    let cache = false;
    const h = horloge({ cache: () => cache });
    const { v, cadre } = monter(h.env);
    v.demarrer();
    v.sansSurprises();
    expect(h.suivante()).toBeUndefined();
    cache = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(cadre.classList.contains("viv-pause")).toBe(true);
    cache = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(h.suivante()).toBeUndefined();
    expect(v.jouer("dauphin")).toBe(true);
    v.arreter();
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
