import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Les fêtes de réussite : message avec le prénom, scènes qui changent à chaque fois, mouvements réduits.
let fete: typeof import("../src/fete");
beforeAll(async () => {
  GlobalRegistrator.register({ url: "https://archipel.local/", width: 1180, height: 820 });
  fete = await import("../src/fete");
});
afterAll(() => GlobalRegistrator.unregister());

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

  test("la fête s'affiche avec le prénom, puis s'en va", async () => {
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

  test("la dernière réussite a droit à la grande fête", () => {
    const host = document.createElement("div");
    const party = fete.celebrate(host, { name: "Lou", final: true });
    expect(party.scene).toBe("finale");
    expect(host.textContent).toContain("Mission accomplie");
    party.end();
  });

  test("mouvements réduits : le message seul, sans scène", () => {
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
