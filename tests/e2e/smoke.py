"""Test de bout en bout (livraison 1) : premier lancement, grand départ, carte, les sept activités, gommettes, carnet,
coin calme, autres formats d'écran, fin de séance, espace parent (objectifs, studio voix, code oublié).

Usage : python3 tests/e2e/smoke.py [dist/index.html] [dossier_captures]
La synthèse vocale est simulée (réponses instantanées) et l'horloge peut être avancée.
"""
import os, re, sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")

INIT = """
(() => {
  const realNow = Date.now.bind(Date);
  window.__archipelTest = { skew: 0, item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } };
  Date.now = () => realNow() + window.__archipelTest.skew;
  const fake = {
    speaking: false, pending: false, onvoiceschanged: null,
    getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""

errors = []

def shot(page, name):
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT / f"{name}.png"))

def state(page):
    return page.evaluate("() => JSON.parse(JSON.stringify({ item: window.__archipelTest.item, mod: window.__archipelTest.mod }))")

def click_text(page, text):
    page.get_by_text(text, exact=False).first.click()

def solve(page):
    """Répond correctement à l'exercice courant."""
    st = state(page)
    it, mod = st["item"], st["mod"]
    k = it.get("kind")
    if mod == "drapeau":
        if k == "carte":
            for cont in ["europe", "afrique", "asie", "amnord", "amsud", "oceanie"]:
                page.click(f'[data-cont="{cont}"]', force=True)
                page.wait_for_timeout(150)
                if page.evaluate("() => !!document.querySelector('.pin[style=\"\"]')"):
                    break
        else:
            page.click(f'.stage [data-code="{it["target"]}"]')
    elif mod == "marche":
        if k in ("voir", "complement", "dizaines"):
            page.click(f'.stage [data-n="{it["n"]}"]')
        else:
            n = it["n"]
            bags, apples = (n // 10, n % 10) if k == "preparer" else (0, n)
            for _ in range(bags):
                page.click('[aria-label="Ajouter un sac de 10 pommes"]')
            for _ in range(apples):
                page.click('[aria-label="Ajouter une pomme"]')
            page.click("[aria-label=\"C'est prêt\"]")
    elif mod == "syllabes":
        if k == "ecoute":
            page.click(f'.stage .tile[data-t="{it["target"]}"]')
        elif k == "fabrique":
            page.click(f'.stage .tile[data-t="{it["target"][0]}"]')
            page.click(f'.stage .tile[data-t="{it["target"][1:]}"]')
        elif k == "mot":
            for s in it["word"]["syl"]:
                page.evaluate("(t) => [...document.querySelectorAll('.stage .tile')].find(e => e.dataset.t === t && !e.classList.contains('used')).click()", s)
        else:
            page.click(f'.stage .card[data-t="{it["target"]}"]')
    elif mod == "chants":
        if k == "frappe":
            for _ in range(it["target"]):
                page.click(".drum")
            page.click("[aria-label=\"C'est prêt\"]")
        else:
            page.click(f'.stage [data-t="{it["target"]}"]')
    elif mod == "lis":
        page.click(f'.stage [data-t="{it["target"]}"]')
    elif mod == "nenuphars":
        if k == "manque":
            page.click(f'.stage [data-c="{it["target"]}"]')
        else:
            page.click(f'.pad[data-n="{it["target"]}"]')
            page.wait_for_timeout(300 * max(1, it.get("steps", 1)) + 200)
    elif mod == "partage":
        if k == "combien":
            page.click(f'.stage [data-c="{it["target"]}"]')
        else:
            for i in range(len(it["friends"])):
                for _ in range(it["target"]):
                    page.click(f'.plate[data-i="{i}"]')
            for _ in range(it.get("rest", 0)):
                page.click(".plate.basket")
            page.click("[aria-label=\"C'est prêt\"]")

def wrong(page):
    """Donne volontairement une mauvaise réponse (pour tester indices et relances)."""
    st = state(page)
    it, mod = st["item"], st["mod"]
    if not it.get("choices"):
        return False
    answer = it.get("n") if mod == "marche" else it.get("target")
    bad = [c for c in it["choices"] if c != answer][0]
    attr = {"marche": "data-n", "drapeau": "data-code", "nenuphars": "data-c", "partage": "data-c"}.get(mod, "data-t")
    page.click(f'.stage [{attr}="{bad}"]')
    return True

def on_map(page):
    return page.locator(".mapwrap").count() > 0 and page.locator(".overlay .actcards").count() == 0

def play_round(page, prefix, mistakes=0, max_steps=40):
    seen = 0
    for _ in range(max_steps):
        page.wait_for_timeout(150)
        if page.locator(".sticker-big").count() or on_map(page) or page.locator("text=On y va").count() or page.locator("text=Vers l'archipel").count():
            break
        if page.locator('[aria-label="Continuer"]').count():
            if seen == 0:
                shot(page, f"{prefix}-intro")
            page.click('[aria-label="Continuer"]')
            page.wait_for_timeout(150)
        if page.locator(".stage").count() == 0:
            continue
        if seen == 1:
            shot(page, f"{prefix}-exercice")
        if mistakes and seen == 2:
            for _ in range(mistakes):
                if wrong(page):
                    page.wait_for_timeout(250)
            shot(page, f"{prefix}-indice")
        try:
            solve(page)
        except Exception as e:  # l'exercice a pu changer entre-temps
            print("solve:", str(e).splitlines()[0])
        seen += 1
        page.wait_for_timeout(500)
    return seen

def store_sticker(page):
    if page.locator(".sticker-big").count():
        page.click(".sticker-big")
        page.wait_for_timeout(900)

def open_activity(page, island, act=None, shot_name=None):
    page.click(f'[data-isl="{island}"]', force=True)
    page.wait_for_timeout(300)
    if act:
        if shot_name:
            shot(page, shot_name)
        page.click(f'.actcard[data-act="{act}"]')
        page.wait_for_timeout(300)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=[
        "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"])
    ctx = browser.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text and "manifest" not in m.text and "icon-" not in m.text else None)
    page.goto(PAGE.as_uri())
    page.wait_for_timeout(400)

    # Premier lancement (parent)
    shot(page, "01-bienvenue")
    page.click("text=Commencer")
    for d in "1234" + "1234":
        page.click(f'.pin button:text-is("{d}")')
        page.wait_for_timeout(60)
    page.wait_for_timeout(300)
    page.fill('input[aria-label="Prénom"]', "Lou")
    page.click("text=Lit des syllabes")
    page.click('.opts >> nth=1 >> text="20"')
    shot(page, "02-profil")
    page.click("text=Créer le profil")
    page.click("text=C'est parti pour Lou")
    shot(page, "03-accueil")

    # Grand départ (première séance de l'enfant)
    page.click(".kid")
    page.wait_for_timeout(400)
    shot(page, "04-grand-depart")
    page.click("text=C'est parti")
    for n in range(3):
        page.wait_for_timeout(300)
        if n == 0:
            shot(page, "04b-grand-depart-etape")
        page.click("text=On y va")
        play_round(page, f"04c-depart-{n}")
    page.wait_for_timeout(300)
    shot(page, "04d-passeport")
    page.click("text=Vers l'archipel")
    page.wait_for_timeout(500)
    shot(page, "05-carte")

    # Île des Nombres : les trois activités
    open_activity(page, "nombres", "nenuphars", "06-ile-nombres")
    print("nénuphars :", play_round(page, "07-nenuphars", mistakes=1))
    store_sticker(page)
    open_activity(page, "nombres", "partage")
    print("partage :", play_round(page, "08-partage"))
    store_sticker(page)
    open_activity(page, "nombres", "marche")
    print("marché :", play_round(page, "09-marche", mistakes=2))
    store_sticker(page)

    # Île des Mots : les trois activités
    open_activity(page, "mots", "chants", "10-ile-mots")
    print("chants :", play_round(page, "11-chants", mistakes=1))
    store_sticker(page)
    open_activity(page, "mots", "lis")
    print("lis et trouve :", play_round(page, "12-lis"))
    store_sticker(page)
    open_activity(page, "mots", "syllabes")
    print("syllabes :", play_round(page, "13-syllabes", mistakes=1))
    store_sticker(page)

    # Port des Voyages
    open_activity(page, "port", "drapeau")
    print("drapeau :", play_round(page, "14-drapeau"))
    store_sticker(page)
    shot(page, "15-carte-apres")

    # Carnet et coin calme
    page.click('[aria-label="Ouvrir mon carnet d\'explorateur"]')
    shot(page, "16-carnet")
    page.click('[aria-label="Retour à la carte"]')
    page.click('[aria-label="Aller au coin calme"]')
    page.wait_for_timeout(2500)
    shot(page, "17-coin-calme")
    page.click('[aria-label="Retour à la carte"]')

    # Autres formats d'écran
    for (w, h, name) in [(820, 1180, "ipad-portrait"), (915, 412, "telephone")]:
        page.set_viewport_size({"width": w, "height": h})
        shot(page, f"18-carte-{name}")
        open_activity(page, "nombres", "nenuphars")
        page.wait_for_timeout(500)
        shot(page, f"19-nenuphars-{name}")
        page.click('[aria-label="Retour à la carte"]')
        page.click("text=Oui")
        page.wait_for_timeout(400)
    page.set_viewport_size({"width": 1180, "height": 820})

    # Fin de séance : on avance l'horloge de 30 minutes
    page.evaluate("() => { window.__archipelTest.skew = 30 * 60 * 1000; }")
    page.wait_for_timeout(3600)
    shot(page, "20-fin-de-seance")
    page.click("text=Au revoir Plume")
    page.wait_for_timeout(300)

    # Espace parent : appui long sur le cadenas, puis code
    def open_parent(pin="1234"):
        box = page.locator(".lockbtn").bounding_box()
        page.mouse.move(box["x"] + 20, box["y"] + 20)
        page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
        for d in pin:
            page.click(f'.pin button:text-is("{d}")')
        page.wait_for_timeout(400)
    open_parent()
    page.locator(".goalbtn").first.click()
    page.wait_for_timeout(200)
    shot(page, "21-parent-suivi")
    page.set_viewport_size({"width": 1180, "height": 2400})
    shot(page, "21b-parent-suivi-long")
    page.set_viewport_size({"width": 1180, "height": 820})
    page.click('.p-tab:text-is("Studio voix")')
    rec = page.locator(".p-item button.pbtn:not(.ghost):not(.danger)").first
    rec.click(); page.wait_for_timeout(1200); rec.click(); page.wait_for_timeout(800)
    shot(page, "22-studio-voix")
    for tab in ["Profils", "Réglages", "Données"]:
        page.click(f'.p-tab:text-is("{tab}")')
        shot(page, f"23-parent-{tab.lower()}")

    # Code parent oublié : question pour adulte, puis nouveau code
    page.click("text=Retour au jeu")
    page.wait_for_timeout(300)
    box = page.locator(".lockbtn").bounding_box()
    page.mouse.move(box["x"] + 20, box["y"] + 20)
    page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
    page.click("text=Code oublié ?")
    q = page.locator("text=/Combien font/").inner_text()
    a, b = map(int, re.findall(r"\d+", q))
    page.fill(".adult-answer", str(a * b))
    page.click("text=Valider")
    for d in "4321" + "4321":
        page.click(f'.pin button:text-is("{d}")')
        page.wait_for_timeout(60)
    page.wait_for_timeout(300)
    assert page.locator("text=Espace parent").count() > 0, "le nouveau code n'ouvre pas l'espace parent"

    data = page.evaluate("() => JSON.parse(localStorage.getItem('archipel.v1'))")
    voix = page.evaluate("() => Object.keys(JSON.parse(localStorage.getItem('archipel.voix') || '{}'))")
    assert data["pin"] == "4321", data["pin"]
    p = data["profiles"][0]
    assert p["departDone"] is True, "grand départ non enregistré"
    print("profil :", p["name"], "| gommettes :", len(p["stickers"]), "| séances :", len(p["sessions"]), "| entrées journal :", len(p["log"]), "| objectifs :", p["goals"], "| voix :", voix)
    print("escaliers :", json.dumps(p["stairs"]))
    browser.close()

print("\n".join(errors) if errors else "Aucune erreur JavaScript.")
sys.exit(1 if errors else 0)
