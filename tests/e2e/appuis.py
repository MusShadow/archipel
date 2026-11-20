"""Appuis sur la carte et les îles.
- Double appui (relecture de la livraison 3) : le second appui d'un double appui ne traverse pas d'un écran à l'autre.
  Sur une île de la carte : l'écran de l'île s'ouvre, aucun lieu ne démarre ; sur le dessin d'un lieu : l'activité
  s'ouvre, et le second appui ne répond pas à sa place au premier exercice. Au doigt, 180 ms entre les deux appuis.
- Vol de Plume (livraison 4) : l'enfant touche une île, Plume s'envole vers elle (sa bulle s'efface), puis l'île s'ouvre ;
  une autre île touchée pendant le vol ne change rien ; avec « Réduire les animations », l'île s'ouvre tout de suite.
En paysage et en portrait.
Usage : python3 tests/e2e/appuis.py"""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "dist" / "index.html"
CHROME = "/usr/bin/google-chrome"
now = int(time.time() * 1000)
DATA = {"version": 1, "pin": "1234", "activeId": "p1",
        "settings": {"sessionMinutes": 90, "accompanied": False, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
        "profiles": [{"id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
                      "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [], "stairs": {}}]}
INIT = """
(() => {
  localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { fetes: false, graine: 5, item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
""" % json.dumps(json.dumps(DATA))

echecs, erreurs = [], []
def verifie(cond, msg):
    print(("OK    " if cond else "ÉCHEC ") + msg)
    if not cond: echecs.append(msg)

def journal(page):
    return page.evaluate("() => JSON.parse(localStorage.getItem('archipel2.donnees')).profiles[0].log.length")

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, headless=True)
    for (W, H) in ((1180, 820), (834, 1194)):
        # 1. double appui sur une île de la carte
        ctx = b.new_context(viewport={"width": W, "height": H}, has_touch=True, device_scale_factor=1)
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
        page.click(".kid"); page.wait_for_timeout(2000)  # la carte, puis le vol de Plume
        x, y = page.evaluate("() => { const r = document.querySelector('[data-isl=nombres] .ile-zone').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }")
        page.touchscreen.tap(x, y); page.wait_for_timeout(180); page.touchscreen.tap(x, y); page.wait_for_timeout(1700)  # vol de Plume (1 s au plus), puis l'île
        ecran = page.evaluate("() => document.querySelector('.ile-ecran') ? 'île' : (window.__archipelTest.mod || 'autre')")
        verifie(ecran == "île", f"{W}x{H} : double appui sur l'île des Nombres → l'écran de l'île, sans lieu démarré ({ecran})")
        ctx.close()
        # 2. double appui sur le dessin d'un lieu
        for ile, lieu in (("mots", "lis"), ("coeur", "theatre"), ("enigmes", "formes")):
            ctx = b.new_context(viewport={"width": W, "height": H}, has_touch=True, device_scale_factor=1)
            ctx.add_init_script(INIT)
            page = ctx.new_page()
            page.on("pageerror", lambda e: erreurs.append(str(e)))
            page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
            page.click(".kid"); page.wait_for_timeout(2000)
            page.click(f'[data-isl="{ile}"] .ile-zone', force=True)
            page.wait_for_selector(".ile-ecran"); page.wait_for_timeout(600)  # Plume vole d'abord vers l'île, puis la garde de 400 ms
            x, y = page.evaluate(f"() => {{ const r = document.querySelector('img.ile-lieu[data-lieu=\"{lieu}\"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height * 0.62]; }}")
            page.touchscreen.tap(x, y); page.wait_for_timeout(180); page.touchscreen.tap(x, y); page.wait_for_timeout(1500)
            mod, n = page.evaluate("() => window.__archipelTest.mod"), journal(page)
            verifie(mod == lieu and n == 0, f"{W}x{H} : double appui sur le lieu « {lieu} » → l'activité s'ouvre ({mod}), aucune réponse enregistrée ({n})")
            ctx.close()
        # 3. vol de Plume vers l'île choisie (le Port, loin de son perchoir de départ), puis une autre île touchée en vol
        ctx = b.new_context(viewport={"width": W, "height": H}, has_touch=True, device_scale_factor=1)
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
        page.click(".kid"); page.wait_for_timeout(2200)
        avant = page.evaluate("() => getComputedStyle(document.querySelector('.carte-plume')).transform")
        cible = page.evaluate("() => document.querySelector('.ile-carte.mission') && document.querySelector('.ile-carte.mission').dataset.isl")
        ile = "port" if cible != "port" else "enigmes"
        autre = "mots" if ile != "mots" else "atelier"
        def centre(isl):
            return page.evaluate(f"() => {{ const r = document.querySelector('[data-isl={isl}] .ile-zone').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }}")
        x, y = centre(ile)
        page.touchscreen.tap(x, y); page.wait_for_timeout(250)
        etat = page.evaluate("""() => { const p = document.querySelector('.carte-plume'); return { carte: !!document.querySelector('.mapwrap') && !document.querySelector('.ile-ecran'),
            vol: p.classList.contains('vers-choix'), bulle: getComputedStyle(p.querySelector('[data-plume]')).opacity, t: getComputedStyle(p).transform }; }""")
        verifie(etat["carte"] and etat["vol"] and etat["t"] != avant and float(etat["bulle"]) < 0.5,
                f"{W}x{H} : île touchée → Plume s'envole vers elle, sa bulle s'efface, la carte reste le temps du vol ({etat})")
        x2, y2 = centre(autre)
        page.touchscreen.tap(x2, y2); page.wait_for_timeout(1500)
        titre = page.evaluate("() => (document.querySelector('.ile-ecran .a-ruban-txt') || {}).textContent || ''")
        attendu = {"port": "Port", "enigmes": "Énigmes"}[ile]
        verifie(attendu in titre, f"{W}x{H} : après le vol, l'île choisie s'ouvre, pas celle touchée pendant le vol ({titre})")
        ctx.close()
        # 4. « Réduire les animations » : pas de vol, l'île s'ouvre tout de suite
        ctx = b.new_context(viewport={"width": W, "height": H}, has_touch=True, device_scale_factor=1, reduced_motion="reduce")
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
        page.click(".kid"); page.wait_for_timeout(800)
        x, y = page.evaluate("() => { const r = document.querySelector('[data-isl=port] .ile-zone').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }")
        page.touchscreen.tap(x, y); page.wait_for_timeout(300)
        ouverte = page.evaluate("() => !!document.querySelector('.ile-ecran')")
        verifie(ouverte, f"{W}x{H} : « Réduire les animations » → l'île s'ouvre sans vol (après 300 ms : {ouverte})")
        ctx.close()
    b.close()

verifie(not erreurs, f"aucune erreur JavaScript {erreurs[:3]}")
print("Appuis et vol de Plume : " + ("OK" if not echecs else f"{len(echecs)} échec(s)"))
sys.exit(1 if echecs else 0)
