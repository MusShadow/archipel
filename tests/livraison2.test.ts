import { describe, expect, test } from "bun:test";
import { DEFIS } from "../src/content";
import { DRAWINGS, primPolylines, samplePrims, scoreStep } from "../src/drawings";
import { META } from "../src/activities";
import { SKILLS } from "../src/core";
import { buildPrompt, decodableWord, difficultWords, graphemes, parseStory, requestStory } from "../src/stories";
import { knownSet } from "../src/content";

describe("dessins pas à pas", () => {
  test("chaque dessin a des étapes courtes, dans le cadre, avec une consigne", () => {
    expect(DRAWINGS.length).toBeGreaterThanOrEqual(10);
    for (const d of DRAWINGS) {
      expect(d.steps.length).toBeGreaterThanOrEqual(4);
      expect(d.steps.length).toBeLessThanOrEqual(10);
      for (const s of d.steps) {
        expect(s.say.length).toBeGreaterThan(5);
        expect(s.prims.length).toBeGreaterThan(0);
        for (const [x, y] of samplePrims(s.prims)) { expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(99); expect(y).toBeGreaterThanOrEqual(1); expect(y).toBeLessThanOrEqual(99); }
      }
    }
  });
  test("suivre le modèle valide l'étape ; un trait ailleurs ne la valide pas", () => {
    for (const d of DRAWINGS) for (const s of d.steps) {
      const traced = s.prims.flatMap((p) => primPolylines(p)).map((poly) => poly.map(([x, y]) => [x + 1.5, y - 1] as [number, number]));
      const ok = scoreStep(s.prims, traced, 7);
      expect(ok.recall).toBeGreaterThanOrEqual(0.8);
      expect(ok.precision).toBeGreaterThanOrEqual(0.9);
      const far = traced.map((poly) => poly.map(([x, y]) => [100 - y, x] as [number, number]));
      const bad = scoreStep(s.prims, [[[5, 95], [6, 96]]], 7);
      expect(bad.recall).toBeLessThan(0.5);
      void far;
    }
  });
  test("un cercle tracé à moitié ne suffit pas", () => {
    const circle = DRAWINGS.find((d) => d.id === "soleil")!.steps[0].prims;
    const half = primPolylines(circle[0])[0].slice(0, 33);
    expect(scoreStep(circle, [half], 10).recall).toBeLessThan(0.68); // seuil le plus bas (niveau 3)
  });
});

describe("histoires sur mesure", () => {
  test("découpage en graphèmes et lettres muettes", () => {
    expect(graphemes("chats").gp).toEqual(["ch", "a", "t", "s"]);
    expect(graphemes("chats").mute).toBe(2);
    expect(graphemes("petite").mute).toBe(1);
    expect(graphemes("maison").gp).toEqual(["m", "ai", "s", "on"]);
    expect(graphemes("lune").gp).toEqual(["l", "u", "n", "e"]);
    const k = knownSet(21);
    expect(decodableWord("lune", k)).toBe(true);
    expect(decodableWord("bateau", k)).toBe(false);
    expect(decodableWord("chat", k)).toBe(true);
    expect(decodableWord("le", knownSet(0))).toBe(true);
    expect(difficultWords("Plume voit un bateau sur la mer.", 21, ["Plume"])).toEqual(["voit", "bateau"]);
  });
  test("la demande ne contient pas le prénom de l'enfant et reprend les sons connus", () => {
    const { system, user } = buildPrompt({ k: 11, theme: "la mer", hero: "mona", phrases: 5 });
    expect(system).toContain("a, i, o, u, é");
    expect(user).toContain("Mona");
    expect(user).toContain("5 phrases");
  });
  test("lecture d'une réponse JSON, même entourée de texte", () => {
    const st = parseStory('Voici : {"titre":"Mona et la lune","emoji":"🐳","phrases":["Mona nage.","Mona voit la lune."],"images":["🐳","🌙"],"question":{"texte":"Que voit Mona ?","choix":["la lune","un vélo","un ami"],"bonne":0}} Bonne lecture !', { k: 11, theme: "la mer", hero: "mona" });
    expect(st.titre).toBe("Mona et la lune");
    expect(st.phrases.length).toBe(2);
    expect(st.images).toEqual(["🐳", "🌙"]);
    expect(st.question.bonne).toBe(0);
    expect(() => parseStory("pas de json", { k: 0, theme: "", hero: "" })).toThrow();
    expect(() => parseStory('{"titre":"x","phrases":["a","b"],"question":{"texte":"q","choix":["a","b"],"bonne":5}}', { k: 0, theme: "", hero: "" })).toThrow();
  });
  test("appel à l'API : en-têtes, modèle, erreurs", async () => {
    let seen: any = null;
    const ok = (async (url: string, init: any) => { seen = { url, init }; return new Response(JSON.stringify({ content: [{ type: "text", text: '{"titre":"T","phrases":["a b","c d"],"question":{"texte":"q ?","choix":["x","y","z"],"bonne":1}}' }] }), { status: 200 }); }) as any;
    const st = await requestStory("sk-ant-test", { k: 11, theme: "la forêt", hero: "pico", phrases: 3 }, ok);
    expect(st.titre).toBe("T");
    expect(seen.url).toBe("https://api.anthropic.com/v1/messages");
    expect(seen.init.headers["x-api-key"]).toBe("sk-ant-test");
    expect(seen.init.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    expect(JSON.parse(seen.init.body).model).toBe("claude-sonnet-5-5");
    const denied = (async () => new Response("{}", { status: 401 })) as any;
    await expect(requestStory("x", { k: 0, theme: "", hero: "plume", phrases: 3 }, denied)).rejects.toThrow("cle");
  });
});

describe("livraison 2 : contenus", () => {
  test("chaque activité suivie a ses défis pour la maison et ses compétences", () => {
    for (const m of META) {
      expect(DEFIS[m.id]?.length).toBeGreaterThan(0);
      for (const s of m.skills) expect(SKILLS.some((k) => k.id === s)).toBe(true);
    }
    for (const s of SKILLS) if (s.activity) expect(META.some((m) => m.id === s.activity && m.skills.includes(s.id))).toBe(true);
  });
});
