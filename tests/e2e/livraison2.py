"""Test de bout en bout (livraison 2) : îles des Énigmes, du Cœur, des Découvertes, de l'Atelier (dessin pas à pas,
miroir), Port (atelier des drapeaux, drapeau de mon île), histoires sur mesure (écriture simulée, lecture),
carnet, formats portrait.

Usage : python3 tests/e2e/livraison2.py [dist/index.html] [dossier_captures]
"""
import os, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots2")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

now = int(time.time() * 1000)
seen = {c: {"seen": 3, "ok": 2, "last": now - 86400000} for c in ["FR", "IT", "DE", "BE", "ML", "JP"]}
DATA = {
    "version": 1, "pin": "1234", "activeId": "p1",
    "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3},
    "profiles": [{
        "id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
        "skills": {}, "flags": seen, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [],
        "stairs": {"formes": {"level": 2, "up": 0, "down": 0}, "bip": {"level": 4, "up": 0, "down": 0}, "motifs": {"level": 3, "up": 0, "down": 0},
                   "theatre": {"level": 4, "up": 0, "down": 0}, "flotte": {"level": 3, "up": 0, "down": 0}, "atelierdrapeaux": {"level": 1, "up": 0, "down": 0},
                   "dessin": {"level": 1, "up": 0, "down": 0}},
    }],
}
STORY = {"titre": "Mona et la lune", "emoji": "🐳", "phrases": ["Mona nage sur la mer.", "Le soir, la lune arrive.", "Mona dit : « Salut la lune ! »", "La lune sourit à Mona."],
         "images": ["🐳", "🌙", "👋", "😊"], "question": {"texte": "Qui arrive le soir ?", "choix": ["la lune", "un bateau", "Basile"], "bonne": 0}}

INIT = """
(() => {
  const realNow = Date.now.bind(Date);
  if (!localStorage.getItem('archipel2.donnees')) { localStorage.setItem('archipel2.donnees', %s); localStorage.setItem('archipel2.cleapi', 'sk-ant-test'); }
  window.__archipelTest = {
    skew: 0, item: null, mod: null, polys: null, ready: false, calls: 0,
    onItem(item, mod) { this.item = item; this.mod = mod; },
    onDrawStep(polys, id, i) { this.polys = polys; this.step = i; this.ready = false; },
    onDrawReady() { this.ready = true; },
    fetch: async (url, init) => { window.__archipelTest.calls++; window.__archipelTest.lastBody = init.body; return new Response(JSON.stringify({ content: [{ type: 'text', text: %s }] }), { status: 200 }); },
  };
  Date.now = () => realNow() + window.__archipelTest.skew;
  const fake = {
    speaking: false, pending: false, onvoiceschanged: null,
    getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
""" % (json.dumps(json.dumps(DATA)), json.dumps(json.dumps(STORY, ensure_ascii=False)))

errors = []

def shot(page, name, wait=350):
    page.wait_for_timeout(wait)
    page.screenshot(path=str(OUT / f"{name}.png"))

def state(page):
    return page.evaluate("() => JSON.parse(JSON.stringify({ item: window.__archipelTest.item, mod: window.__archipelTest.mod }))")

def solve(page):
    st = state(page)
    it, mod = st["item"], st["mod"]
    k = it.get("kind")
    if mod == "bip":
        if k == "prog":
            for d in it["solution"]:
                page.click(f'.bippad [data-dir="{d}"]')
            page.click(".bippad .round.ok")
        else:
            page.click(f'.bipslot[data-t="{it["target"]}"]')
        page.wait_for_timeout(420 * len(it["solution"]) + 500)
    elif mod == "atelierdrapeaux" and k != "intrus":
        # On touche chaque bande à sa place à l'écran (et non par son numéro) : c'est ce que fait le doigt.
        n = len(it["bands"])
        for i, b in enumerate(it["bands"]):
            page.click(f'.swatch[data-c="{b}"]')
            box = page.locator(".flagpaint svg").bounding_box()
            if it["dir"] == "v":
                x, y = (2 + (i + 0.5) * 90 / n) / 94, (2 + 30) / 64
            else:
                x, y = (2 + 45) / 94, (2 + (i + 0.5) * 60 / n) / 64
            page.mouse.click(box["x"] + x * box["width"], box["y"] + y * box["height"])
            page.wait_for_timeout(60)
        colored = page.evaluate("() => [...document.querySelectorAll('.flagpaint rect[data-b]')].length")
        if page.locator(".flagpaint").count() and colored != n:
            errors.append(f"atelier des drapeaux : {colored} bandes touchables pour {n}")
    elif mod == "flotte":
        page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(1700)
    else:
        page.click(f'.stage [data-t="{it["target"]}"]')

def wrong(page):
    st = state(page)
    it = st["item"]
    if not it.get("choices"):
        return False
    bad = [c for c in it["choices"] if c != it["target"] and not (st["mod"] == "bip" and c in it.get("fixes", {}))]
    if not bad:
        return False
    page.click(f'.stage [data-t="{bad[0]}"]')
    if st["mod"] == "flotte":
        page.wait_for_timeout(1700)
    return True

def on_map(page):
    return page.locator(".mapwrap").count() > 0 and page.locator(".overlay .actcards").count() == 0

def play_round(page, prefix, mistakes=0, max_steps=40):
    seen_n = 0
    for _ in range(max_steps):
        page.wait_for_timeout(150)
        if page.locator(".sticker-big").count() or on_map(page):
            break
        if page.locator('[aria-label="Continuer"]').count():
            if seen_n == 0:
                shot(page, f"{prefix}-intro")
            page.click('[aria-label="Continuer"]')
            page.wait_for_timeout(150)
        if page.locator(".stage").count() == 0:
            continue
        if seen_n in (0, 1, 3):
            shot(page, f"{prefix}-exercice{seen_n}")
        if mistakes and seen_n == 2:
            for _ in range(mistakes):
                if wrong(page):
                    page.wait_for_timeout(300)
            shot(page, f"{prefix}-indice")
        try:
            solve(page)
        except Exception as e:
            print("solve:", str(e).splitlines()[0])
        seen_n += 1
        page.wait_for_timeout(500)
    return seen_n

def store_sticker(page):
    if page.locator(".sticker-big").count():
        page.click(".sticker-big")
        page.wait_for_timeout(900)

def open_island(page, island, act=None, shot_name=None):
    page.click(f'[data-isl="{island}"]', force=True)
    page.wait_for_timeout(350)
    if shot_name:
        shot(page, shot_name)
    if act:
        page.wait_for_timeout(450)  # fondu de 350 ms entre les écrans
        page.click(f'[data-act="{act}"]')
        page.wait_for_timeout(350)

def board_point(page, x, y):
    box = page.locator(".board").bounding_box()
    b = 3
    return box["x"] + b + x / 100 * (box["width"] - 2 * b), box["y"] + b + y / 100 * (box["height"] - 2 * b)

def stroke(page, pts):
    sx, sy = board_point(page, *pts[0])
    page.mouse.move(sx, sy)
    page.mouse.down()
    for (x, y) in pts[1:]:
        px, py = board_point(page, x, y)
        page.mouse.move(px, py)
    page.mouse.up()

def draw_lesson(page, prefix):
    steps = 0
    for _ in range(30):
        for _ in range(80):
            if page.locator("[data-done]").count() or page.evaluate("() => window.__archipelTest.ready"):
                break
            page.wait_for_timeout(100)
        if page.locator("[data-done]").count():
            break
        if steps == 0:
            shot(page, f"{prefix}-etape1", 50)
        polys = page.evaluate("() => window.__archipelTest.polys")
        page.evaluate("() => { window.__archipelTest.ready = false; }")
        if steps == 1:
            # un trait loin du modèle : il doit s'effacer
            stroke(page, [(5, 95), (12, 95)])
            page.wait_for_timeout(400)
        for prim in polys:
            for poly in prim:
                stroke(page, [(x + 0.8, y - 0.6) for (x, y) in poly])
        steps += 1
        if steps == 3:
            shot(page, f"{prefix}-etape3", 150)
        page.wait_for_timeout(250)
    return steps

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "polices/" not in m.text and "ERR_" not in m.text and "manifest" not in m.text and "icon-" not in m.text else None)
    page.goto(PAGE.as_uri())
    page.wait_for_timeout(500)
    page.click(".kid")
    page.wait_for_timeout(600)
    shot(page, "30-carte")

    # Île des Énigmes
    open_island(page, "enigmes", "formes", "31-ile-enigmes")
    print("formes :", play_round(page, "32-formes", mistakes=2))
    store_sticker(page)
    open_island(page, "enigmes", "bip")
    print("bip :", play_round(page, "33-bip", mistakes=1))
    store_sticker(page)
    open_island(page, "enigmes", "motifs")
    print("motifs :", play_round(page, "34-motifs", mistakes=1))
    store_sticker(page)

    # Île du Cœur
    open_island(page, "coeur", "theatre", "35-ile-coeur")
    print("théâtre :", play_round(page, "36-theatre", mistakes=1))
    store_sticker(page)

    # Île des Découvertes : flotte ou coule (le voyage de la goutte est testé dans livraison3.py)
    open_island(page, "decouvertes", "flotte")
    print("flotte :", play_round(page, "37-flotte", mistakes=1))
    store_sticker(page)

    # Port : atelier des drapeaux, drapeau de mon île
    open_island(page, "port", "atelierdrapeaux", "38-port")
    print("atelier des drapeaux :", play_round(page, "39-atelierdrapeaux"))
    store_sticker(page)
    open_island(page, "port", "monDrapeau")
    page.wait_for_timeout(300)
    page.click('[data-layout="croix"]')
    page.click('.swatch[data-c="vert"]'); page.dispatch_event('.myflag [data-p="0"]', "click")
    page.click('.swatch[data-c="jaune"]'); page.dispatch_event('.myflag [data-p="1"]', "click")
    page.click('[data-sym="etoile"]')
    page.click('.swatch[data-c="rouge"]'); page.dispatch_event('.myflag [data-p="s"]', "click")
    shot(page, "40-mon-drapeau")
    page.click("[data-save]")
    page.wait_for_timeout(1500)

    # Atelier : dessin pas à pas, puis miroir
    open_island(page, "atelier", "dessin", "41-ile-atelier")
    shot(page, "42-choix-dessin")
    page.click('[data-draw="soleil"]')
    page.wait_for_timeout(400)
    shot(page, "43-modele", 100)
    n = draw_lesson(page, "44-dessin")
    print("dessin (étapes) :", n)
    shot(page, "45-dessin-fini")
    page.click(".palette .swatch >> nth=2")
    px, py = board_point(page, 50, 50)
    page.mouse.click(px, py)
    page.click(".palette .swatch >> nth=5")
    px, py = board_point(page, 8, 8)
    page.mouse.click(px, py)
    shot(page, "46-dessin-colorie")
    page.click("[data-done]")
    page.wait_for_timeout(800)
    store_sticker(page)
    open_island(page, "atelier", "miroir")
    page.wait_for_timeout(300)
    stroke(page, [(30, 30), (40, 20), (45, 40), (30, 60)])
    stroke(page, [(20, 70), (40, 80), (48, 70)])
    page.click("text=1 miroir")
    page.click('.palette .swatch >> nth=6')
    stroke(page, [(20, 20), (35, 35)])
    shot(page, "47-miroir")
    page.click("[data-keep]")
    page.wait_for_timeout(500)
    page.click('[aria-label="Retour à la carte"]')
    page.wait_for_timeout(500)

    # Carnet : gommettes, dessins, drapeau de mon île
    page.click('[aria-label="Ouvrir mon carnet d\'explorateur"]')
    shot(page, "48-carnet")
    page.set_viewport_size({"width": 1180, "height": 1700})
    shot(page, "48b-carnet-long")
    page.set_viewport_size({"width": 1180, "height": 820})
    page.click('[aria-label="Retour à la carte"]')
    page.wait_for_timeout(400)

    # Portrait : quelques écrans
    page.set_viewport_size({"width": 820, "height": 1180})
    shot(page, "49-carte-portrait")
    open_island(page, "enigmes", "bip")
    page.wait_for_timeout(600)
    shot(page, "50-bip-portrait")
    page.click('[aria-label="Retour à la carte"]'); page.click("text=Oui"); page.wait_for_timeout(500)
    open_island(page, "atelier", "dessin")
    page.click('[data-draw="chat"]')
    page.wait_for_timeout(5500)
    shot(page, "51-dessin-portrait")
    page.click('[aria-label="Retour à la carte"]'); page.click("text=Oui"); page.wait_for_timeout(500)
    open_island(page, "port", "monDrapeau")
    shot(page, "52-mon-drapeau-portrait")
    page.click('[aria-label="Retour à la carte"]'); page.wait_for_timeout(700)  # fondu, puis la carte écoute les appuis
    page.set_viewport_size({"width": 1180, "height": 820})

    # Espace parent : histoires (écriture simulée)
    page.click('[aria-label="Lou : arrêter le voyage"]')
    page.click("text=Oui, on range")
    page.wait_for_timeout(500)
    page.click("text=Au revoir Plume")
    box = page.locator(".lockbtn").bounding_box()
    page.mouse.move(box["x"] + 20, box["y"] + 20)
    page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
    for d in "1234":
        page.click(f'.pin button:text-is("{d}")')
    page.wait_for_timeout(400)
    page.set_viewport_size({"width": 1180, "height": 2200})
    shot(page, "53-parent-suivi")
    page.set_viewport_size({"width": 1180, "height": 820})
    page.click('.p-tab:text-is("Histoires")')
    page.click("text=la mer")
    page.click('.herochip[aria-label="Mona"]')
    page.click("[data-write]")
    page.wait_for_timeout(600)
    page.set_viewport_size({"width": 1180, "height": 1500})
    shot(page, "54-parent-histoire")
    page.click("[data-validate]")
    page.wait_for_timeout(300)
    shot(page, "55-parent-bibliotheque")
    page.set_viewport_size({"width": 1180, "height": 820})
    body = json.loads(page.evaluate("() => window.__archipelTest.lastBody"))
    assert "Lou" not in json.dumps(body, ensure_ascii=False), "le prénom ne doit pas partir dans la demande"
    page.click("text=Retour au jeu")
    page.wait_for_timeout(300)

    # L'enfant lit l'histoire
    page.click(".kid")
    page.wait_for_timeout(600)
    open_island(page, "mots", "histoires")
    shot(page, "56-etagere")
    page.click("[data-story]")
    page.wait_for_timeout(500)
    shot(page, "57-histoire-page1")
    for _ in range(len(STORY["phrases"])):
        page.click('[aria-label="Page suivante"]')
        page.wait_for_timeout(250)
    shot(page, "58-histoire-question")
    page.click('.choicecard[data-t="1"]')
    page.wait_for_timeout(300)
    page.click('.choicecard[data-t="0"]')
    page.wait_for_timeout(1200)
    shot(page, "59-apres-histoire")
    store_sticker(page)

    data = page.evaluate("() => JSON.parse(localStorage.getItem('archipel2.donnees'))")
    p = data["profiles"][0]
    acts = sorted(set(l["activity"] for l in p["log"]))
    print("activités au journal :", acts)
    print("gommettes :", [s["kind"] for s in p["stickers"]])
    print("drapeau de mon île :", p.get("myFlag"))
    print("histoires :", [(s["titre"], s.get("lu")) for s in p["stories"]])
    print("escaliers :", json.dumps(p["stairs"]))
    dessins = page.evaluate("() => JSON.parse(localStorage.getItem('archipel2.dessins.p1') || '[]').map(d => d.id)")
    print("galerie :", dessins)
    for a in ["formes", "bip", "motifs", "theatre", "flotte", "atelierdrapeaux", "dessin", "histoires"]:
        assert a in acts, f"{a} absent du journal"
    assert p.get("myFlag", {}).get("layout") == "croix"
    assert p["stories"] and p["stories"][0]["lu"] == 1
    assert "soleil" in dessins and "miroir" in dessins
    browser.close()

print("\n".join(errors) if errors else "Aucune erreur JavaScript.")
sys.exit(1 if errors else 0)
