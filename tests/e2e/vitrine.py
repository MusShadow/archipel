"""Vitrine (#vitrine) : l'île des Nombres en taille réelle, les composants, les personnages et l'imagier s'affichent
sans erreur ; les images viennent du cache du service worker quand on est hors ligne ; l'appli normale n'en montre rien.

Usage : python3 tests/e2e/vitrine.py   (après bun run build ; sert dist/ sur http://localhost)
"""
import functools, http.server, os, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[2] / "dist"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
PORT = 8142
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(("localhost", PORT), functools.partial(Quiet, directory=str(DIST)))
threading.Thread(target=server.serve_forever, daemon=True).start()

ok = True
def check(cond, msg):
    global ok
    print(("OK   " if cond else "ÉCHEC ") + msg)
    ok = ok and bool(cond)

IMAGES_CHARGEES = """(sel) => [...document.querySelectorAll(sel)].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0])"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True)
    ctx = browser.new_context(viewport={"width": 1194, "height": 834})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # l'appli normale ne montre pas la vitrine
    page.goto(f"http://localhost:{PORT}/")
    page.wait_for_timeout(600)
    check(page.locator(".v-page").count() == 0, "l'appli normale ne montre pas la vitrine")

    page.goto(f"http://localhost:{PORT}/#vitrine")
    page.wait_for_selector(".v-ile")
    page.wait_for_timeout(1200)
    ile = page.evaluate(IMAGES_CHARGEES, ".v-ile img")
    check(len(ile) == 11 and all(c for _, c in ile), f"île des Nombres : décor, 3 remplissages, bateau, 3 lieux, Plume en 3 pièces = {len(ile)} images chargées")
    check(all("?v=" in s for s, _ in ile), "chaque image porte son empreinte")
    k = page.evaluate("() => { const r = document.querySelector('.v-cadre').getBoundingClientRect(); return [r.width, r.height, r.left, r.top]; }")
    check(abs(k[0] - 1194) < 2 and abs(k[1] - 834) < 2 and abs(k[2]) < 2, f"le dessin couvre l'écran de l'iPad Pro 11 : {k}")
    pills = page.locator(".v-ile .a-pastille").all_inner_texts()
    check(len(pills) == 3 and any("Plume conseille" in p and "Les nénuphars" in p for p in pills), f"trois étiquettes, Plume conseille les nénuphars : {pills}")
    check(page.locator(".v-ile .a-ruban").inner_text().strip() == "Île des Nombres", "ruban de titre")
    ailes = page.evaluate("() => [...document.querySelectorAll('.v-ile .v-aile')].map((a) => getComputedStyle(a).animationDuration)")
    check(ailes == ["1.1s", "1.1s"], f"Plume bat des ailes lentement : {ailes}")
    check(page.locator(".v-persos img").count() == 42, "sept hôtes, six dessins chacun")
    check(page.locator(".v-imagier img").count() == 195, "imagier complet")
    # toutes les images de la page (l'imagier se charge en défilant)
    page.evaluate("async () => { const p = document.querySelector('.v-page'); for (let y = 0; y < p.scrollHeight; y += 600) { p.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } }")
    page.wait_for_timeout(800)
    toutes = page.evaluate(IMAGES_CHARGEES, ".v-page img")
    manquantes = [s for s, c in toutes if not c]
    check(not manquantes, f"{len(toutes)} images de la vitrine chargées" + (f", manquantes : {manquantes[:5]}" if manquantes else ""))
    # composants : une bonne réponse pose l'anneau vert, un essai fait balancer (jamais de rouge)
    cartes = page.locator(".v-section .a-carte")
    cartes.nth(0).click()
    check("juste" in (cartes.nth(0).get_attribute("class") or ""), "la bonne réponse pose l'anneau vert")
    cartes.nth(1).click()
    check("wobble" in (cartes.nth(1).get_attribute("class") or ""), "un essai fait balancer la carte")

    # hors ligne : les images viennent du cache archipel2-images
    page.evaluate("() => navigator.serviceWorker.ready")
    page.reload()
    page.wait_for_timeout(1500)
    page.evaluate("() => navigator.serviceWorker.ready")
    caches = page.evaluate("async () => { const c = await caches.open('archipel2-images'); return (await c.keys()).length; }")
    check(caches >= 250, f"cache des images rempli : {caches} fichiers")
    ctx.set_offline(True)
    page.reload()
    page.wait_for_selector(".v-ile")
    page.wait_for_timeout(1200)
    hors = page.evaluate(IMAGES_CHARGEES, ".v-ile img")
    check(all(c for _, c in hors), f"hors ligne, l'île s'affiche avec ses {len(hors)} images")
    erreurs = [e for e in errors if "ERR_INTERNET_DISCONNECTED" not in e and "net::" not in e]
    check(not erreurs, "aucune erreur JavaScript" + (f" : {erreurs[:3]}" if erreurs else ""))
    browser.close()
server.shutdown()
print("Vitrine : OK" if ok else "Vitrine : ÉCHEC")
sys.exit(0 if ok else 1)
