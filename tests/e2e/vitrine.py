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
# Zone de toucher réelle de chaque élément (en px CSS) : jusqu'où le doigt touche encore l'élément, de part et d'autre
# de son centre (zone agrandie comprise). 1,5 cm sur l'iPad = 78 px.
CIBLES = """(sel) => [...document.querySelectorAll(sel)].map((el) => {
  if (!el.closest('.v-ile')) el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const touche = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && el.contains(t); };
  let h = 0, b = 0, g = 0, d = 0;
  while (h < 120 && touche(cx, cy - h - 1)) h++;
  while (b < 120 && touche(cx, cy + b + 1)) b++;
  while (g < 400 && touche(cx - g - 1, cy)) g++;
  while (d < 400 && touche(cx + d + 1, cy)) d++;
  return { quoi: el.getAttribute('aria-label') || el.textContent.trim(), haut: h + b + 1, large: g + d + 1,
           boite: [r.left, r.top, r.right, r.bottom] };
})"""
CM15 = 78

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
    k = page.evaluate("() => { const r = document.querySelector('.ile-cadre').getBoundingClientRect(); return [r.width, r.height, r.left, r.top]; }")
    check(abs(k[0] - 1194) < 2 and abs(k[1] - 834) < 2 and abs(k[2]) < 2, f"le dessin couvre l'écran de l'iPad Pro 11 : {k}")
    cibles = page.evaluate(CIBLES, ".v-ile .a-pastille, .v-ile .a-bulle, .v-ile .a-rond")
    petites = [(c["quoi"], c["haut"], c["large"]) for c in cibles if min(c["haut"], c["large"]) < CM15]
    check(len(cibles) == 6 and not petites, f"chaque cible de l'île fait au moins 1,5 cm ({CM15} px) au toucher : " + ", ".join(f"{c['quoi'][:18]} {c['haut']}x{c['large']}" for c in cibles))
    boites = [c["boite"] for c in page.evaluate(CIBLES, ".v-ile .a-pastille")]
    chevauche = [(i, j) for i in range(len(boites)) for j in range(i + 1, len(boites))
                 if not (boites[i][2] < boites[j][0] or boites[j][2] < boites[i][0] or boites[i][3] < boites[j][1] or boites[j][3] < boites[i][1])]
    check(not chevauche, "les étiquettes ne se chevauchent pas")
    pills = page.locator(".v-ile .a-pastille").all_inner_texts()
    check(len(pills) == 3 and any("Plume conseille" in p and "Les nénuphars" in p for p in pills), f"trois étiquettes, Plume conseille les nénuphars : {pills}")
    check(page.locator(".v-ile .a-ruban").inner_text().strip() == "Île des Nombres", "ruban de titre")
    ailes = page.evaluate("() => [...document.querySelectorAll('.v-ile .plume-aile')].map((a) => getComputedStyle(a).animationDuration)")
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
    composants = page.evaluate(CIBLES, ".v-section .a-carte, .v-section .a-pastille, .v-section .a-bulle, .v-section .a-rond")
    trop_petits = [(c["quoi"][:20], c["haut"], c["large"]) for c in composants if min(c["haut"], c["large"]) < CM15]
    check(len(composants) >= 12 and not trop_petits, f"composants de la vitrine : {len(composants)} cibles d'au moins 1,5 cm" + (f", trop petites : {trop_petits}" if trop_petits else ""))
    cartes.nth(0).click()
    check("juste" in (cartes.nth(0).get_attribute("class") or "") and cartes.nth(0).get_attribute("aria-pressed") == "true", "la bonne réponse pose l'anneau vert (et le dit aux lecteurs d'écran)")
    cartes.nth(1).click()
    check("wobble" in (cartes.nth(1).get_attribute("class") or ""), "un essai fait balancer la carte")

    # en portrait et sur l'iPad Pro 11 récent, les étiquettes gardent leur taille et restent à l'écran
    for (w, hh) in ((834, 1194), (1210, 834)):
        page.set_viewport_size({"width": w, "height": hh})
        page.evaluate("() => document.querySelector('.v-page').scrollTo(0, 0)")
        page.wait_for_timeout(500)
        c2 = page.evaluate(CIBLES, ".v-ile .a-pastille, .v-ile .a-bulle")
        dedans = all(c["boite"][0] >= 0 and c["boite"][2] <= w and c["boite"][1] >= 0 and c["boite"][3] <= hh for c in c2)
        check(len(c2) == 4 and dedans and all(min(c["haut"], c["large"]) >= CM15 for c in c2), f"{w}x{hh} : étiquettes et bulle à l'écran, d'au moins 1,5 cm : "
              + ", ".join(f"{c['quoi'][:14]} {c['haut']}x{c['large']} {[round(v) for v in c['boite']]}" for c in c2))
    page.set_viewport_size({"width": 1194, "height": 834})

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
