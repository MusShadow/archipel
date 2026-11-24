"""Performances du décor vivant (livraison 4), mesurées sur chaque île, en paysage (iPad 11 pouces).
- Chaque animation du décor ne touche que transform et opacity : le navigateur les confie au compositeur, sans
  recalculer la page à chaque image (vérifié animation par animation).
- Images par seconde et intervalle le plus long entre deux images, pendant 6 s, décor vivant puis animations réduites
  (la référence) ; tâches longues (plus de 50 ms) sur le fil principal.
- Poids des images de l'écran de l'île (décor vivant compris).
Chrome sans écran dessine sans carte graphique : les chiffres sont plus bas que sur l'iPad ; c'est l'écart avec la
référence et l'absence de tâche longue qui comptent. Échec si moins de 20 images par seconde ou une tâche de plus de 200 ms.
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
  window.__archipelTest = { fetes: false, graine: 5, item: null, mod: null, onItem() {} };
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
                page.evaluate("() => { const v = document.querySelector('.ile-ecran')._vivant; v.arreter(); v.jouer('dauphin'); }")
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
        if v["ips"] < 20:
            echecs.append(f"{ile} : {v['ips']} images par seconde")
        if any(t > 200 for t in v["longues"]):
            echecs.append(f"{ile} : tâche longue {max(v['longues'])} ms")
    b.close()
if len(sys.argv) > 1:
    Path(sys.argv[1]).write_text(json.dumps(lignes, ensure_ascii=False, indent=1) + "\n")
print(f"{len(echecs)} échec(s) : {echecs}" if echecs else "OK")
sys.exit(1 if echecs else 0)
