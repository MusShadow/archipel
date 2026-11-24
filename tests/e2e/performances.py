"""Performances du décor vivant (livraison 4), mesurées sur chaque île, en paysage (iPad 11 pouces), et pendant les deux
mouvements les plus lourds de la livraison : le vol de Plume vers l'île choisie, l'éruption du volcan d'Octave.
- Chaque animation du décor ne touche que transform et opacity : le navigateur les confie au compositeur, sans
  recalculer la page à chaque image (vérifié animation par animation).
- Images par seconde et intervalle entre deux images (95e centile, le plus long), pendant 6 s, décor vivant puis animations
  réduites (la référence) ; tâches longues (plus de 50 ms) sur le fil principal.
- Poids des images de l'écran de l'île (décor vivant compris).
Chrome sans écran dessine sans carte graphique : les chiffres sont plus bas que sur l'iPad. Échec si moins de 50 images
par seconde, si une image sur vingt met plus de 34 ms (deux images à 60 Hz), ou si une tâche dure plus de 200 ms.
Usage : python3 tests/e2e/performances.py [fichier.json]"""
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
  window.__archipelTest = Object.assign({ fetes: false, graine: 5, item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } }, window.__archipelTest || {});
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  window.__longues = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longues.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
})();
""" % json.dumps(json.dumps(DATA))
ILES = ["nombres", "mots", "enigmes", "decouvertes", "atelier", "coeur", "port"]
MESURE = """(ms) => new Promise((ok) => { const t = []; const t0 = performance.now(); window.__longues = [];
  const pas = (x) => { t.push(x); if (x - t0 < ms) requestAnimationFrame(pas); else {
    const d = t.slice(1).map((v, i) => v - t[i]).sort((a, b) => a - b);
    ok({ ips: Math.round((t.length - 1) / ((t[t.length - 1] - t[0]) / 1000)), p95: Math.round(d[Math.floor(d.length * 0.95)]), max: Math.round(d[d.length - 1]), longues: window.__longues.slice() }); } };
  requestAnimationFrame(pas); })"""
PROPRIETES = """() => { const permis = new Set(['transform', 'translate', 'rotate', 'scale', 'opacity', 'offset', 'easing', 'composite', 'computedOffset']);
  return document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest('.ile-cadre'))
    .flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))).filter((p) => !permis.has(p)); }"""
CATALOGUE = json.loads((ROOT / "scripts/illustration/catalogue.json").read_text())
def poids(ile):
    """Poids des images de l'écran de l'île (Ko) et, dedans, celui du décor vivant (ses calques et les petits sujets)."""
    d = CATALOGUE["iles"][ile]
    taille = lambda f: (ROOT / "public/illustrations" / f).stat().st_size
    tout = [d["base"]["fichier"]] + [x["fichier"] for k in ("remplissages", "lieux", "animes") for x in d[k].values()]
    sujets = [e["fichier"] for n, e in CATALOGUE["elements"].items() if n.startswith("vivant/")]
    vivant = [x["fichier"] for x in d["animes"].values()] + sujets
    return round(sum(map(taille, tout + sujets)) / 1024), round(sum(map(taille, vivant)) / 1024)

IPS_MIN, P95_MAX = 50, 34
# Hasard rejouable pour le volcan (comme tests/e2e/volcan.py) : les mêmes exercices à chaque passage.
GRAINE = """(() => { let s = %d >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__archipelTest = { graine: 4082 }; })();"""
LANCER = "(ms) => { window.__mesure = (" + MESURE + ")(ms); }"

def juger(nom, m):
    if m["ips"] < IPS_MIN: echecs.append(f"{nom} : {m['ips']} images par seconde")
    if m["p95"] > P95_MAX: echecs.append(f"{nom} : une image sur vingt met {m['p95']} ms")
    if any(t > 200 for t in m["longues"]): echecs.append(f"{nom} : tâche longue {max(m['longues'])} ms")

def ouvrir(b, data=None, graine=None):
    ctx = b.new_context(viewport={"width": 1194, "height": 834}, device_scale_factor=2)
    if graine is not None: ctx.add_init_script(GRAINE % graine)
    ctx.add_init_script(INIT if data is None else INIT.replace(json.dumps(json.dumps(DATA)), json.dumps(json.dumps(data))))
    page = ctx.new_page()
    page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
    page.click(".kid"); page.wait_for_timeout(1900)
    page.wait_for_selector(".garde-appui", state="detached")
    return ctx, page

def vol(b):
    """Plume vole vers l'île la plus loin d'elle : on mesure pendant le vol (au moins 600 ms), avant l'écran de l'île."""
    ctx, page = ouvrir(b)
    centre = lambda isl: page.evaluate(f"() => {{ const r = document.querySelector('[data-isl={isl}] .ile-zone').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }}")
    px, py = page.evaluate("() => { const r = document.querySelector('.carte-plume .plume-vol').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }")
    ile = max(["port", "enigmes", "mots", "nombres"], key=lambda i: (centre(i)[0] - px) ** 2 + (centre(i)[1] - py) ** 2)
    page.evaluate(LANCER, 550)
    page.click(f'[data-isl="{ile}"] .ile-zone', force=True)
    envol = page.evaluate("() => document.querySelector('.carte-plume').classList.contains('vers-choix')")
    m = page.evaluate("() => window.__mesure")
    ctx.close()
    if not envol: echecs.append(f"vol vers {ile} : Plume ne s'est pas envolée")
    return ile, m

def eruption(b):
    """Le volcan d'Octave, niveau 2 : on répond juste jusqu'à « fais monter le magma », puis on mesure pendant l'éruption."""
    data = json.loads(json.dumps(DATA))
    data["profiles"][0]["stairs"] = {"volcan": {"level": 2, "up": 0, "down": 0}}
    ctx, page = ouvrir(b, data, graine=2043)
    page.click('[data-isl="decouvertes"] .ile-zone', force=True)
    page.wait_for_selector(".ile-ecran"); page.wait_for_timeout(900)
    page.click('[data-act="volcan"]'); page.wait_for_timeout(500)
    m, dernier = None, None
    for _ in range(40):
        page.wait_for_timeout(200)
        if page.locator('[aria-label="Continuer"]').count():
            page.click('[aria-label="Continuer"]'); page.wait_for_timeout(300); continue
        it = page.evaluate("() => window.__archipelTest.item")
        if not it or json.dumps(it, sort_keys=True) == dernier or not page.locator(".stage").count():
            continue
        if it["kind"] == "monte" and page.locator(".vcoupe.vmonte").count():
            x, y = page.evaluate("""() => { const s = document.querySelector('.vcoupe svg'); const p = s.createSVGPoint(); p.x = 100; p.y = 140;
              const q = p.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }""")
            page.evaluate(LANCER, 2600)
            for _ in range(10):
                page.mouse.click(x, y); page.wait_for_timeout(60)
                if page.locator(".veruption").count(): break
            vu = page.locator(".veruption").count() > 0
            m = page.evaluate("() => window.__mesure")
            if not vu: echecs.append("éruption : le magma n'est pas arrivé au cratère")
            break
        if it["kind"] in ("partie", "monte") and not page.locator(".vcoupe").count():
            continue
        if it["kind"] != "partie" and not page.locator(".stage [data-t]").count():
            continue
        dernier = json.dumps(it, sort_keys=True)
        if it["kind"] == "partie":
            bb = page.locator(f'.vcoupe [data-t="{it["target"]}"] .hit').bounding_box()
            page.mouse.click(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2)
        else:
            page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(500)
    ctx.close()
    if m is None: echecs.append("éruption : aucun exercice « fais monter le magma » rencontré")
    return m

echecs, lignes = [], []
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, headless=True)
    for ile in ILES:
        res = {"ile": ile}
        for mode in ("vivant", "reduit"):
            ctx = b.new_context(viewport={"width": 1194, "height": 834}, device_scale_factor=2, reduced_motion="reduce" if mode == "reduit" else "no-preference")
            ctx.add_init_script(INIT)
            page = ctx.new_page()
            # servi depuis le disque : on lit le poids réel des fichiers d'images
            page.goto(PAGE.as_uri()); page.wait_for_timeout(600)
            page.click(".kid"); page.wait_for_timeout(1900)
            page.wait_for_selector(".garde-appui", state="detached")
            page.click(f'[data-isl="{ile}"]', force=True)
            page.wait_for_selector(".ile-ecran"); page.wait_for_timeout(1500)
            if mode == "vivant":
                res["animations"] = page.evaluate("() => document.getAnimations().filter((a) => a.playState === 'running').length")
                res["hors_compositeur"] = sorted(set(page.evaluate(PROPRIETES)))
                # une surprise en cours pendant la mesure (la plus lourde : le dauphin et ses gerbes)
                page.evaluate("() => { const v = document.querySelector('.ile-ecran')._vivant; v.sansSurprises(); v.jouer('dauphin'); }")
            m = page.evaluate(MESURE, 6000)
            res[mode] = m
            ctx.close()
        res["poids_ko"], res["dont_vivant_ko"] = poids(ile)
        v, r = res["vivant"], res["reduit"]
        lignes.append(res)
        print(f"{ile:12} {res['animations']:3} animations · vivant {v['ips']:3} i/s (p95 {v['p95']} ms, max {v['max']} ms) · réduit {r['ips']:3} i/s"
              f" · tâches longues {v['longues']} · {res['poids_ko']} Ko d'images (dont {res['dont_vivant_ko']} pour le décor vivant)"
              f" · hors compositeur : {res['hors_compositeur'] or 'aucune'}")
        if res["hors_compositeur"]:
            echecs.append(f"{ile} : propriétés animées hors compositeur {res['hors_compositeur']}")
        juger(ile, v)
    ile, m = vol(b)
    print(f"vol de Plume vers {ile:8} : {m['ips']:3} i/s (p95 {m['p95']} ms, max {m['max']} ms) · tâches longues {m['longues']}")
    juger("vol de Plume", m)
    lignes.append({"vol": ile, **m})
    m = eruption(b)
    if m:
        print(f"éruption du volcan     : {m['ips']:3} i/s (p95 {m['p95']} ms, max {m['max']} ms) · tâches longues {m['longues']}")
        juger("éruption du volcan", m)
        lignes.append({"eruption": True, **m})
    b.close()
if len(sys.argv) > 1:
    Path(sys.argv[1]).write_text(json.dumps(lignes, ensure_ascii=False, indent=1) + "\n")
print(f"{len(echecs)} échec(s) : {echecs}" if echecs else "OK")
sys.exit(1 if echecs else 0)
