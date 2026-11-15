import { afterAll, describe, expect, test } from "bun:test";

// Les fêtes de réussite : message avec le prénom, scènes qui changent à chaque fois, mouvements réduits.
// Les tests d'affichage demandent un DOM simulé (happy-dom, dépendance de développement) : sautés s'il n'est pas
// installé, comme sur le serveur de publication, qui ne fait pas « bun install ».
let dom: { unregister: () => Promise<void> | void } | null = null;
try {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  dom = GlobalRegistrator;
} catch { /* pas de DOM simulé */ }
const fete = await import("../src/fete");
afterAll(() => dom?.unregister());
const withDom = test.skipIf(!dom);

describe("fêtes de réussite", () => {
  test("le message contient le prénom, avec une espace insécable avant le point d'exclamation", () => {
    expect(fete.cheer("Lou", { firstTry: true }, () => 0)).toBe("Bravo, Lou !");
    expect(fete.cheer("  ", {}, () => 0)).toBe("Bravo !");
    expect(fete.cheer(null, {}, () => 0)).toBe("Bravo !");
    expect(fete.cheer("Lou", { firstTry: false }, () => 0)).toBe("Tu as réussi, Lou !");
    expect(fete.cheer("Lou", { final: true }, () => 0.99)).toBe("Bravo, Lou !");
  });

  test("les scènes passent à tour de rôle, jamais deux fois la même d'affilée", () => {
    const seq = Array.from({ length: 12 }, () => fete.nextScene());
    expect(new Set(seq.slice(0, 6)).size).toBe(6);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    for (let i = 0; i < 12; i++) expect(fete.nextScene(["ballons"])).not.toBe("ballons");
  });

  withDom("la fête s'affiche avec le prénom, puis s'en va", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const party = fete.celebrate(host, { name: "Lou", firstTry: true });
    const layer = host.querySelector(".fete")!;
    expect(layer).not.toBeNull();
    expect(fete.SCENES as string[]).toContain(layer.getAttribute("data-scene")!);
    expect(layer.textContent).toContain("Lou");
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    party.end();
    await new Promise((r) => setTimeout(r, 350));
    expect(host.querySelector(".fete")).toBeNull();
  });

  withDom("la dernière réussite a droit à la grande fête", () => {
    const host = document.createElement("div");
    const party = fete.celebrate(host, { name: "Lou", final: true });
    expect(party.scene).toBe("finale");
    expect(host.textContent).toContain("Mission accomplie");
    party.end();
  });

  withDom("mouvements réduits : le message seul, sans scène", () => {
    const real = window.matchMedia;
    (window as any).matchMedia = (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} });
    (globalThis as any).matchMedia = (window as any).matchMedia;
    try {
      const host = document.createElement("div");
      const party = fete.celebrate(host, { name: "Lou" });
      expect(party.scene).toBe("message");
      expect(host.querySelectorAll(".fete .p, .fete .ballon").length).toBe(0);
      expect(host.textContent).toContain("Lou");
      party.end();
    } finally {
      (window as any).matchMedia = real;
      (globalThis as any).matchMedia = real;
    }
  });
});
