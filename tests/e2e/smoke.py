"""Test de bout en bout : premier lancement, carte, trois activités, gommette, carnet, coin calme,
fin de séance et espace parent, avec captures d'écran sur iPad paysage, iPad portrait et téléphone.

Usage : python3 tests/e2e/smoke.py [dist/index.html] [dossier_captures]
La synthèse vocale est simulée (réponses instantanées) et l'horloge peut être avancée.
"""
import os, sys, json, time
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

def item(page):
    return page.evaluate("() => JSON.parse(JSON.stringify({ item: window.__archipelTest.item, mod: window.__archipelTest.mod }))")

def solve(page):
    """Répond correctement à l'exercice courant (ou explore la carte du monde)."""
    st = item(page)
    it, mod = st["item"], st["mod"]
    k = it.get("kind")
    if mod == "drapeau":
        if k == "carte":
            for cont in ["europe", "afrique", "asie", "amnord", "amsud", "oceanie"]:
                page.click(f'[data-cont="{cont}"]', force=True)
                page.wait_for_timeout(120)
                if page.evaluate("() => window.__archipelTest.item !== null && !!document.querySelector('.pin[style=\"\"]')"):
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

def wrong(page):
    """Donne volontairement une mauvaise réponse (pour tester indices et relances)."""
    st = item(page)
    it, mod = st["item"], st["mod"]
    if it.get("choices"):
        bad = [c for c in it["choices"] if c != (it.get("n") if mod == "marche" else it.get("target"))]
        sel = f'[data-n="{bad[0]}"]' if mod == "marche" else (f'[data-code="{bad[0]}"]' if mod == "drapeau" else f'[data-t="{bad[0]}"]')
        page.click(f".stage {sel}")
        return True
    return False

def play_round(page, prefix, mistakes=0):
    seen = 0
    for step in range(40):
        page.wait_for_timeout(150)
        if page.locator(".sticker-big").count() or page.locator(".mapwrap").count():
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
            print("solve:", e)
        seen += 1
        page.wait_for_timeout(500)
    return seen

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1, has_touch=False)
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
    page.goto(PAGE.as_uri())
    page.wait_for_timeout(400)

    # Premier lancement
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

    # Carte
    page.click(".kid")
    page.wait_for_timeout(500)
    shot(page, "04-carte")
    page.click('[data-isl="enigmes"]', force=True)  # île endormie
    page.wait_for_timeout(200)

    # Le drapeau mystère
    page.click('[data-isl="port"]', force=True)
    n = play_round(page, "05-drapeau")
    print("drapeau, exercices joués :", n)
    if page.locator(".sticker-big").count():
        shot(page, "06-gommette")
        page.click(".sticker-big")
        page.wait_for_timeout(900)

    # Le marché de Basile, avec des erreurs volontaires
    page.click('[data-isl="nombres"]', force=True)
    n = play_round(page, "07-marche", mistakes=2)
    print("marché, exercices joués :", n)
    if page.locator(".sticker-big").count():
        page.click(".sticker-big"); page.wait_for_timeout(900)

    # L'atelier des syllabes
    page.click('[data-isl="mots"]', force=True)
    n = play_round(page, "08-syllabes", mistakes=1)
    print("syllabes, exercices joués :", n)
    if page.locator(".sticker-big").count():
        page.click(".sticker-big"); page.wait_for_timeout(900)
    shot(page, "09-carte-apres")

    # Carnet et coin calme
    page.click('[aria-label="Ouvrir mon carnet d\'explorateur"]')
    shot(page, "10-carnet")
    page.click('[aria-label="Retour à la carte"]')
    page.click('[aria-label="Aller au coin calme"]')
    page.wait_for_timeout(2500)
    shot(page, "11-coin-calme")
    page.click('[aria-label="Retour à la carte"]')

    # Autres formats d'écran
    for (w, h, name) in [(820, 1180, "ipad-portrait"), (915, 412, "telephone")]:
        page.set_viewport_size({"width": w, "height": h})
        shot(page, f"12-carte-{name}")
        page.click('[data-isl="port"]', force=True)
        page.wait_for_timeout(500)
        if page.locator('[aria-label="Continuer"]').count():
            page.click('[aria-label="Continuer"]')
            page.wait_for_timeout(300)
        shot(page, f"13-drapeau-{name}")
        page.click('[aria-label="Retour à la carte"]')
        page.click("text=Oui")
        page.wait_for_timeout(400)
    page.set_viewport_size({"width": 1180, "height": 820})

    # Fin de séance : on avance l'horloge de 30 minutes
    page.evaluate("() => { window.__archipelTest.skew = 30 * 60 * 1000; }")
    page.wait_for_timeout(3600)
    shot(page, "14-fin-de-seance")
    page.click("text=Au revoir Plume")
    page.wait_for_timeout(300)
    shot(page, "15-accueil-repos")

    # Espace parent : appui long sur le cadenas, puis code
    lock = page.locator(".lockbtn")
    box = lock.bounding_box()
    page.mouse.move(box["x"] + 20, box["y"] + 20)
    page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
    for d in "1234":
        page.click(f'.pin button:text-is("{d}")')
    page.wait_for_timeout(400)
    shot(page, "16-parent-suivi")
    page.set_viewport_size({"width": 1180, "height": 1600})
    shot(page, "16b-parent-suivi-long")
    page.set_viewport_size({"width": 1180, "height": 820})
    for tab in ["Profils", "Réglages", "Données"]:
        page.click(f'.p-tab:text-is("{tab}")')
        shot(page, f"17-parent-{tab.lower()}")

    # Code parent oublié : question pour adulte, puis nouveau code
    page.click("text=Retour au jeu")
    page.wait_for_timeout(300)
    lock = page.locator(".lockbtn")
    box = lock.bounding_box()
    page.mouse.move(box["x"] + 20, box["y"] + 20)
    page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
    page.click("text=Code oublié ?")
    q = page.locator("text=/Combien font/").inner_text()
    import re as _re
    a, b = map(int, _re.findall(r"\d+", q))
    page.fill(".adult-answer", "1")
    page.click("text=Valider")
    shot(page, "18-code-oublie")
    page.fill(".adult-answer", str(a * b))
    page.click("text=Valider")
    for d in "4321" + "4321":
        page.click(f'.pin button:text-is("{d}")')
        page.wait_for_timeout(60)
    page.wait_for_timeout(300)
    assert page.locator("text=Espace parent").count() > 0, "le nouveau code n'ouvre pas l'espace parent"

    data = page.evaluate("() => JSON.parse(localStorage.getItem('archipel.v1'))")
    assert data["pin"] == "4321", data["pin"]
    p = data["profiles"][0]
    print("profil :", p["name"], "| gommettes :", len(p["stickers"]), "| séances :", len(p["sessions"]), "| entrées journal :", len(p["log"]))
    print("drapeaux vus :", sorted(p["flags"].keys()))
    print("escaliers :", json.dumps(p["stairs"]))
    print("phrases dites (extrait) :", page.evaluate("() => (window.__spoken || []).slice(0, 14)"))
    browser.close()

print("\n".join(errors) if errors else "Aucune erreur JavaScript.")
sys.exit(1 if errors else 0)
