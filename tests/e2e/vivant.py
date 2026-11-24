"""Décor vivant des îles (livraison 4), dans un vrai navigateur, en paysage et en portrait.
- Sur chaque île : le décor bouge (reflets, nuages, palmes, hôte qui respire), chaque surprise joue puis s'efface, et
  aucune autre ne joue en même temps ; tout ce qui se touche dans le décor (l'hôte, le palmier, le bateau) réagit sans
  ouvrir de lieu.
- Les lieux restent entiers sous le doigt : chaque point de leur dessin répond à son lieu (ou à ce qui est posé dessus et
  l'ouvre : la grenouille sur l'étang) ; la fumée du petit volcan ouvre le volcan ; l'étiquette de chaque lieu répond à
  son lieu. Toucher la grenouille ouvre l'étang (elle saute).
- Arrière-plan : quand l'appli est cachée, le décor se fige (animations en pause), la surprise en cours comprise : elle
  reprend au retour, là où elle en était.
- « Réduire les animations » : rien ne bouge (aucune animation en cours sur le décor), aucune surprise ne joue, la fumée
  du petit volcan reste visible, posée ; la grenouille ouvre toujours l'étang.
Usage : python3 tests/e2e/vivant.py"""
import json, sys, time
from pathlib import Path
from PIL import Image
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
          "arc-en-ciel": 8000, "coeurs": 4200, "voilier": 16000, "grenouille": 1400}
CATALOGUE = json.loads((ROOT / "scripts/illustration/catalogue.json").read_text())
JOUE = "() => document.querySelectorAll('[data-surprise].joue').length"

def points_du_lieu(ile, lieu, pas=9):
    """Les points opaques du dessin d'un lieu, en coordonnées du dessin de l'île (1194 × 834)."""
    d = CATALOGUE["iles"][ile]["lieux"][lieu]
    x0, y0, l, ht = d["boite"]
    im = Image.open(ROOT / "dist/illustrations" / d["fichier"]).convert("RGBA")
    k = im.size[0] / l
    return [(x0 + fx, y0 + fy) for fy in range(2, int(ht), pas) for fx in range(2, int(l), pas)
            if im.getpixel((min(im.size[0] - 1, int(fx * k)), min(im.size[1] - 1, int(fy * k))))[3] > 200]

# Qui répond au doigt en un point du dessin : un lieu (son dessin), ce qui est posé sur un lieu et l'ouvre (relais), une
# étiquette de lieu, un élément du décor qu'on touche, un bouton de l'écran (Plume, la carte, l'oreille), ou le fond.
QUI = """([pts]) => { const c = document.querySelector('.ile-cadre').getBoundingClientRect(); const k = c.width / 1194;
  return pts.map(([fx, fy]) => { const x = c.x + fx * k, y = c.y + fy * k;
    if (x < 1 || y < 1 || x >= innerWidth - 1 || y >= innerHeight - 1) return 'hors écran';
    const e = document.elementFromPoint(x, y); if (!e) return 'fond';
    const l = e.closest('[data-lieu]'); if (l) return 'lieu:' + l.dataset.lieu;
    const r = e.closest('[data-relais]'); if (r) return 'relais:' + r.dataset.relais;
    const a = e.closest('[data-act]'); if (a) return 'étiquette:' + a.dataset.act;
    const v = e.closest('.viv-touche'); if (v) return 'décor:' + v.getAttribute('aria-label');
    const b = e.closest('button'); return b ? 'bouton:' + (b.getAttribute('aria-label') || b.className) : 'fond'; }); }"""

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
            # chaque surprise joue, seule, puis s'efface (plus de surprise programmée : le test les lance une à une)
            page.evaluate("() => document.querySelector('.ile-ecran')._vivant.sansSurprises()")
            noms = page.evaluate("() => document.querySelector('.ile-ecran')._vivant.surprises")
            for n in noms:
                ok = page.evaluate(f"() => document.querySelector('.ile-ecran')._vivant.jouer('{n}')")
                page.wait_for_timeout(300)
                joue = page.evaluate(JOUE)
                bouge = page.evaluate(ANIMS, "[data-surprise].joue")
                verifie(ok and joue == 1 and bouge > 0, f"{tag} : la surprise « {n} » joue, seule ({joue}, {bouge} animations)")
                page.wait_for_timeout(DUREES[n] + 300)
                verifie(page.evaluate(JOUE) == 0, f"{tag} : « {n} » s'efface")
            # chaque point du dessin d'un lieu répond à ce lieu (ou à ce qui, posé dessus, l'ouvre) ; seules les étiquettes
            # des lieux et les boutons de l'écran passent par-dessus (c'est voulu : ils restent entiers, eux aussi)
            for lieu in CATALOGUE["iles"][ile]["lieux"]:
                pts = points_du_lieu(ile, lieu)
                qui = page.evaluate(QUI, [pts])
                dessus = [q for q in qui if q.startswith(("étiquette:", "bouton:")) and q != f"étiquette:{lieu}"]
                perdus = sorted({q for q in qui if q not in (f"lieu:{lieu}", f"relais:{lieu}", f"étiquette:{lieu}", "hors écran") and q not in dessus})
                verifie(not perdus, f"{tag} : le lieu « {lieu} » reste entier sous le doigt ({len(pts)} points ; ailleurs : {perdus} ;"
                        f" sous une étiquette ou un bouton : {len(dessus)})")
            # la fumée du petit volcan fait partie du volcan
            for x, y in CATALOGUE["iles"][ile].get("vivant", {}).get("fumeeLieu", []):
                qui = page.evaluate(QUI, [[[x, y - 30], [x, y - 60]]])
                verifie(all(q in ("relais:volcan", "lieu:volcan", "hors écran") for q in qui), f"{tag} : toucher la fumée du petit volcan → le volcan ({qui})")
            # l'étiquette de chaque lieu répond toujours à son lieu (aucun calque vivant ne la couvre)
            for act in page.evaluate("() => Array.from(document.querySelectorAll('.a-pastille[data-act]')).map(p => p.dataset.act)"):
                qui = page.evaluate("""(act) => { const r = document.querySelector(`.a-pastille[data-act="${act}"]`).getBoundingClientRect();
                  const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e && e.closest('[data-act]') ? e.closest('[data-act]').dataset.act : null; }""", act)
                verifie(qui == act, f"{tag} : l'étiquette « {act} » reste sous le doigt ({qui})")
            # le toucher : tout ce qui se touche dans le décor réagit (l'hôte sautille, le palmier se secoue, le bateau
            # tangue), en 400 ms ; aucun lieu ne s'ouvre
            touches = page.evaluate("() => Array.from(document.querySelectorAll('.ile-cadre .viv-touche')).map((b, i) => (b.dataset.t = i, b.getAttribute('aria-label')))")
            for i, nom in enumerate(touches):
                sel = f'.viv-touche[data-t="{i}"]'
                bb = page.locator(sel).bounding_box()
                x, y = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] * 0.6
                if not (0 < x < W and 0 < y < H):
                    continue  # en portrait, le dessin est rogné sur les côtés : ce calque est hors de l'écran
                page.touchscreen.tap(x, y)
                page.wait_for_timeout(120)
                reagit = page.evaluate("(s) => /saute|secoue/.test(document.querySelector(s).className)", sel)
                duree = page.evaluate("(s) => getComputedStyle(document.querySelector(s)).animationDuration", sel)
                verifie(reagit and duree == "0.4s" and page.locator(".ile-ecran").count() == 1 and not page.locator(".stage").count(),
                        f"{tag} : toucher « {nom} » → il réagit ({duree}), l'île reste ouverte")
                page.wait_for_timeout(500)
            # arrière-plan : le décor se fige, puis repart
            page.evaluate("() => window.__cacher(true)")
            page.wait_for_timeout(100)
            fige = page.evaluate("() => document.querySelector('.ile-cadre').classList.contains('viv-pause')")
            verifie(fige and page.evaluate(EN_PAUSE) == "paused", f"{tag} : en arrière-plan, le décor se fige")
            page.evaluate("() => window.__cacher(false)")
            page.wait_for_timeout(100)
            verifie(page.evaluate(EN_PAUSE) == "running", f"{tag} : au retour, le décor repart")
            # la surprise en cours attend aussi : cachée 3 s au milieu de son mouvement, elle est encore là au retour
            if "baleine" in noms:
                page.evaluate("() => document.querySelector('.ile-ecran')._vivant.jouer('baleine')")
                page.wait_for_timeout(1500)
                page.evaluate("() => window.__cacher(true)")
                page.wait_for_timeout(5000)
                page.evaluate("() => window.__cacher(false)")
                page.wait_for_timeout(300)
                verifie(page.evaluate(JOUE) == 1, f"{tag} : la baleine, cachée en plein souffle, reprend au retour")
                page.wait_for_timeout(4800)
                verifie(page.evaluate(JOUE) == 0, f"{tag} : puis elle s'efface à la fin de son mouvement")
            # la grenouille est posée sur l'étang : la toucher ouvre l'étang
            if page.locator(".viv-grenouille").count():
                bb = page.locator(".viv-grenouille").bounding_box()
                page.touchscreen.tap(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2)
                page.wait_for_timeout(1200)
                verifie(page.evaluate("() => window.__archipelTest.mod") == "nenuphars", f"{tag} : toucher la grenouille → l'étang s'ouvre ({page.evaluate('() => window.__archipelTest.mod')})")
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
            if ile == "nombres":
                bb = page.locator(".viv-grenouille").bounding_box()
                page.touchscreen.tap(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2)
                page.wait_for_timeout(900)
                verifie(page.evaluate("() => window.__archipelTest.mod") == "nenuphars", f"{tag} : la grenouille ouvre toujours l'étang")
            ctx.close()
    b.close()

print("erreurs de page :", erreurs[:5])
if erreurs: echecs.append("erreurs de page")
print(f"{len(echecs)} échec(s)" if echecs else "OK")
sys.exit(1 if echecs else 0)
