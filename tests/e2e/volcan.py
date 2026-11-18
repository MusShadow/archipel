"""Test de bout en bout (livraison 3) : île des Découvertes, « le volcan d'Octave », les six niveaux.
Toucher les parties du volcan coupé en deux, faire monter le magma au doigt (et en touchant la poche), une erreur
expliquée et un indice par manche, gommette ; format portrait pour un niveau.

Usage : python3 tests/e2e/volcan.py [dist/index.html] [dossier_captures]
"""
import os, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots5")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
now = int(time.time() * 1000)

def data(level):
    return {
        "version": 1, "pin": "1234", "activeId": "p1",
        "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
        "profiles": [{
            "id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
            "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [],
            "stairs": {"volcan": {"level": level, "up": 0, "down": 0}},
        }],
    }

INIT = """
(() => {
  if (!localStorage.getItem('archipel2.donnees')) localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""

# Hasard rejouable : Math.random suit une graine fixe par contexte (mulberry32), pour que chaque passage voie
# les mêmes exercices (le test ne dépend plus de la chance pour rencontrer les huit types d'exercices).
GRAINE = """
(() => {
  let s = %d >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
"""

errors, kinds, shots = [], {}, set()

def shot(page, name, wait=250):
    page.wait_for_timeout(wait)
    page.screenshot(path=str(OUT / f"{name}.png"))

def item(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(window.__archipelTest.item))")

def spoken(page):
    return page.evaluate("() => window.__spoken || []")

def part_point(page, t):
    """Point à toucher pour une partie du volcan : le centre de sa zone de toucher."""
    b = page.locator(f'.vcoupe [data-t="{t}"] .hit').bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

def svg_point(page, x, y):
    return page.evaluate("""([x, y]) => { const s = document.querySelector('.vcoupe svg'); const p = s.createSVGPoint(); p.x = x; p.y = y;
      const q = p.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }""", [x, y])

def raise_magma(page, mode):
    if mode == "doigt":
        x0, y0 = svg_point(page, 100, 140)
        page.mouse.move(x0, y0); page.mouse.down()
        for k in range(1, 15):
            x, y = svg_point(page, 100 + (3 if k % 2 else -3), 140 - k * 7)
            page.mouse.move(x, y); page.wait_for_timeout(20)
        page.mouse.up()
    else:
        x0, y0 = svg_point(page, 100, 140)
        for _ in range(8):
            page.mouse.click(x0, y0); page.wait_for_timeout(60)
            if page.locator(".veruption").count(): break

def play_round(page, prefix, mistake_at=1, monte_mode="doigt", max_steps=60):
    n, last = 0, None
    for _ in range(max_steps):
        page.wait_for_timeout(150)
        if page.locator(".sticker-big").count() or (page.locator(".mapwrap").count() and page.locator(".stage").count() == 0):
            break
        if page.locator('[aria-label="Continuer"]').count():
            if f"intro-{prefix}" not in shots:
                shots.add(f"intro-{prefix}"); shot(page, f"{prefix}-intro", 150)
            page.click('[aria-label="Continuer"]'); page.wait_for_timeout(250)
        it = item(page)
        if it is None or json.dumps(it, sort_keys=True) == last or page.locator(".stage").count() == 0:
            continue
        if it["kind"] not in ("partie", "monte") and page.locator(".stage [data-t]").count() == 0:
            continue
        if it["kind"] in ("partie", "monte") and page.locator(".vcoupe").count() == 0:
            continue
        last = json.dumps(it, sort_keys=True)
        k = it["kind"]
        kinds[k] = kinds.get(k, 0) + 1
        if k not in shots:
            shots.add(k); shot(page, f"{prefix}-ex{n}-{k}", 150)
        if n == mistake_at and k != "monte":
            bad = [c for c in it["choices"] if c != it["target"]][0]
            s0 = len(spoken(page))
            if k == "partie":
                page.mouse.click(*part_point(page, bad))
            else:
                page.click(f'.stage [data-t="{bad}"]')
            page.wait_for_timeout(300)
            said = spoken(page)[s0:]
            if it["retry"][bad] not in said:
                errors.append(f"{prefix} : explication d'erreur non dite ({it['retry'][bad]}) ; entendu : {said}")
            page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(200)
            page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(250)
            shot(page, f"{prefix}-indice-{k}", 100)
        if k == "partie":
            page.mouse.click(*part_point(page, it["target"]))
        elif k == "monte":
            if n == mistake_at:
                page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(150)
                page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(150)
                page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(250)
                shot(page, f"{prefix}-indice-monte", 50)
            raise_magma(page, monte_mode)
            page.wait_for_timeout(500)
            if page.locator(".veruption").count() == 0:
                errors.append(f"{prefix} : le magma n'est pas arrivé au cratère ({monte_mode})")
            elif "eruption" not in shots:
                shots.add("eruption"); shot(page, f"{prefix}-eruption", 400)
            page.wait_for_timeout(900)
        else:
            page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(450)
        n += 1
    return n

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    modes = set()
    for n, level in enumerate([1, 2, 2, 2, 3, 4, 5, 6]):
        if level == 2 and modes >= {"doigt", "toucher"}:
            continue
        portrait = level == 4
        vp = {"width": 820, "height": 1180} if portrait else {"width": 1180, "height": 820}
        ctx = browser.new_context(viewport=vp, device_scale_factor=1, has_touch=False)
        ctx.add_init_script(GRAINE % (2026 + 17 * n))
        ctx.add_init_script(INIT % json.dumps(json.dumps(data(level))))
        ctx.add_init_script(f"window.__archipelTest.graine = {4051 + 31 * n};")
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "polices/" not in m.text and "ERR_" not in m.text and "manifest" not in m.text and "icon-" not in m.text else None)
        page.goto(PAGE.as_uri())
        page.wait_for_timeout(500)
        page.click(".kid")
        page.wait_for_timeout(600)
        page.click('[data-isl="decouvertes"]', force=True)
        page.wait_for_timeout(400)
        if level == 1:
            shot(page, "00-ile-decouvertes")
        page.click('.actcard[data-act="volcan"]')
        page.wait_for_timeout(400)
        mode = "toucher" if "doigt" in modes else "doigt"
        before = kinds.get("monte", 0)
        print(f"niveau {level} :", play_round(page, f"n{level}", mistake_at=1 if level % 2 else 2, monte_mode=mode), "exercices")
        if kinds.get("monte", 0) > before:
            modes.add(mode)
        if page.locator(".sticker-big").count():
            shot(page, f"n{level}-gommette")
        ctx.close()
    browser.close()

print("types d'exercices vus :", kinds, "; magma monté :", sorted(modes))
if not modes:
    errors.append("le magma n'a jamais été monté")
if len(kinds) < 8:
    errors.append(f"trop peu de types d'exercices vus : {sorted(kinds)}")
if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
