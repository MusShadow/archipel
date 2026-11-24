"""Décor vivant des îles (livraison 4), dans un vrai navigateur, en paysage et en portrait.
- Sur chaque île : le décor bouge (reflets, nuages, palmes, hôte qui respire), chaque surprise joue puis s'efface, et
  aucune autre ne joue en même temps ; l'hôte, le palmier et la grenouille réagissent au toucher sans ouvrir de lieu.
- Arrière-plan : quand l'appli est cachée, le décor se fige (animations en pause) ; il repart au retour.
- « Réduire les animations » : rien ne bouge (aucune animation en cours sur le décor), aucune surprise ne joue, la fumée
  du petit volcan reste visible, posée.
- Rien ne cache les étiquettes : le centre de chaque étiquette répond toujours à son lieu.
Usage : python3 tests/e2e/vivant.py"""
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
  // l'appli cachée ou visible, à la demande du test
  let cache = false;
  Object.defineProperty(document, 'hidden', { get: () => cache, configurable: true });
  window.__cacher = (v) => { cache = v; document.dispatchEvent(new Event('visibilitychange')); };
})();
""" % json.dumps(json.dumps(DATA))
ILES = ["nombres", "mots", "enigmes", "decouvertes", "atelier", "coeur", "port"]
DUREES = {"dauphin": 2600, "baleine": 6000, "oiseaux": 12000, "poisson": 2400, "souffle": 2600, "ballon": 9000, "volcan": 4200,
          "arc-en-ciel": 8000, "coeurs": 4200, "voilier": 16000}

echecs, erreurs = [], []
def verifie(cond, msg):
    print(("OK    " if cond else "ÉCHEC ") + msg)
    if not cond: echecs.append(msg)

ANIMS = """(sel) => Array.from(document.querySelectorAll(sel)).flatMap(e => e.getAnimations({ subtree: true }))
  .filter(a => a.playState === 'running').length"""
EN_PAUSE = """() => { const a = document.querySelector('.viv-nuage').getAnimations()[0]; return a ? a.playState : 'aucune'; }"""

def ouvrir(b, W, H, ile, reduit=False):
    ctx = b.new_context(viewport={"width": W, "height": H}, has_touch=True, device_scale_factor=1, reduced_motion="reduce" if reduit else "no-preference")
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    page.on("pageerror", lambda e: erreurs.append(str(e)))
    page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
    page.click(".kid"); page.wait_for_timeout(1900)
    page.wait_for_selector(".garde-appui", state="detached")
    page.click(f'[data-isl="{ile}"]', force=True)
    page.wait_for_selector(".ile-ecran"); page.wait_for_timeout(900)
    return ctx, page

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, headless=True)
    for (W, H) in ((1180, 820), (834, 1194)):
        for ile in ILES:
            ctx, page = ouvrir(b, W, H, ile)
            tag = f"{W}x{H} {ile}"
            # le décor bouge : reflets, nuages, palmes, (hôte qui respire)
            for sel in (".viv-reflets", ".viv-nuage", ".viv-palmes"):
                verifie(page.evaluate(ANIMS, sel) > 0, f"{tag} : {sel} bouge")
            if ile not in ("port", "nombres"):
                verifie(page.evaluate(ANIMS, ".viv-hote") >= 2, f"{tag} : l'hôte respire et cligne des yeux")
            # chaque surprise joue, seule, puis s'efface (le chef d'orchestre est arrêté : le test les lance une à une)
            page.evaluate("() => document.querySelector('.ile-ecran')._vivant.arreter()")
            noms = page.evaluate("() => document.querySelector('.ile-ecran')._vivant.surprises")
            for n in noms:
                ok = page.evaluate(f"() => document.querySelector('.ile-ecran')._vivant.jouer('{n}')")
                page.wait_for_timeout(300)
                joue = page.evaluate("() => Array.from(document.querySelectorAll('.viv-surprise.joue')).length")
                bouge = page.evaluate(ANIMS, ".viv-surprise.joue")
                verifie(ok and joue == 1 and bouge > 0, f"{tag} : la surprise « {n} » joue, seule ({joue}, {bouge} animations)")
                page.wait_for_timeout(DUREES[n] + 300)
                verifie(page.evaluate("() => document.querySelectorAll('.viv-surprise.joue').length") == 0, f"{tag} : « {n} » s'efface")
            # l'étiquette de chaque lieu répond toujours à son lieu (aucun calque vivant ne la couvre)
            for act in page.evaluate("() => Array.from(document.querySelectorAll('.a-pastille[data-act]')).map(p => p.dataset.act)"):
                qui = page.evaluate("""(act) => { const r = document.querySelector(`.a-pastille[data-act="${act}"]`).getBoundingClientRect();
                  const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e && e.closest('[data-act]') ? e.closest('[data-act]').dataset.act : null; }""", act)
                verifie(qui == act, f"{tag} : l'étiquette « {act} » reste sous le doigt ({qui})")
            # le toucher : l'hôte sautille, le palmier se secoue, la grenouille saute ; aucun lieu ne s'ouvre
            for sel, cls in ((".viv-hote", "saute"), ("button.viv-palmes", "secoue"), (".viv-grenouille", "saute"), (".viv-bateau", "secoue")):
                if not page.locator(sel).count():
                    continue
                el = page.locator(sel).first
                bb = el.bounding_box()
                x, y = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] * 0.6
                if not (0 < x < W and 0 < y < H):
                    continue  # en portrait, le dessin est rogné sur les côtés : ce calque est hors de l'écran
                page.touchscreen.tap(x, y)
                page.wait_for_timeout(120)
                reagit = page.evaluate(f"(s) => document.querySelector(s).classList.contains('{cls}')", sel)
                verifie(reagit and page.locator(".ile-ecran").count() == 1 and not page.locator(".stage").count(), f"{tag} : toucher {sel} → il réagit, l'île reste ouverte")
                page.wait_for_timeout(800)
            # arrière-plan : le décor se fige, puis repart
            page.evaluate("() => window.__cacher(true)")
            page.wait_for_timeout(100)
            fige = page.evaluate("() => document.querySelector('.ile-cadre').classList.contains('viv-pause')")
            verifie(fige and page.evaluate(EN_PAUSE) == "paused", f"{tag} : en arrière-plan, le décor se fige")
            page.evaluate("() => window.__cacher(false)")
            page.wait_for_timeout(100)
            verifie(page.evaluate(EN_PAUSE) == "running", f"{tag} : au retour, le décor repart")
            ctx.close()
        # « Réduire les animations » : rien ne bouge, aucune surprise, la fumée du volcan reste posée
        for ile in ("nombres", "decouvertes"):
            ctx, page = ouvrir(b, W, H, ile, reduit=True)
            tag = f"{W}x{H} {ile} (animations réduites)"
            verifie(page.evaluate(ANIMS, ".viv") == 0, f"{tag} : aucune animation en cours sur le décor")
            verifie(page.evaluate("() => document.querySelector('.ile-ecran')._vivant.jouer('dauphin')") is False, f"{tag} : aucune surprise ne joue")
            if ile == "decouvertes":
                op = page.evaluate("() => getComputedStyle(document.querySelector('.viv-fumee.lieu')).opacity")
                verifie(float(op) > 0.5, f"{tag} : la fumée du petit volcan reste visible, posée ({op})")
            ctx.close()
    b.close()

print("erreurs de page :", erreurs[:5])
if erreurs: echecs.append("erreurs de page")
print(f"{len(echecs)} échec(s)" if echecs else "OK")
sys.exit(1 if echecs else 0)
