"""Test de bout en bout (livraison 3) : île des Découvertes, « le voyage de la goutte », les six niveaux,
une erreur par manche (réponse expliquée, puis indice), gommette ; format portrait pour le grand tour.

Usage : python3 tests/e2e/livraison3.py [dist/index.html] [dossier_captures]
"""
import os, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots3")
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
            "stairs": {"goutte": {"level": level, "up": 0, "down": 0}},
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

# Hasard rejouable (comme le test du volcan) : Math.random suit une graine fixe par contexte, et la graine des
# exercices passe par le crochet de test ; chaque passage voit les mêmes exercices.
GRAINE = """
(() => {
  let s = %d >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
"""

errors, kinds = [], {}

def shot(page, name, wait=350):
    page.wait_for_timeout(wait)
    page.screenshot(path=str(OUT / f"{name}.png"))

def item(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(window.__archipelTest.item))")

def play_round(page, prefix, mistake_at=1, max_steps=30):
    n, last = 0, None
    for _ in range(max_steps):
        page.wait_for_timeout(200)
        if page.locator(".sticker-big").count() or page.locator(".mapwrap").count() and page.locator(".stage").count() == 0:
            break
        if page.locator('[aria-label="Continuer"]').count():
            shot(page, f"{prefix}-intro{n}", 200)
            page.click('[aria-label="Continuer"]')
            page.wait_for_timeout(250)
        if page.locator(".stage [data-t]").count() == 0:
            continue
        it = item(page)
        if it is None or it.get("key") == last:
            continue
        last = it["key"]
        kinds[it["kind"]] = kinds.get(it["kind"], 0) + 1
        shot(page, f"{prefix}-ex{n}-{it['kind']}", 150)
        if n == mistake_at:
            bad = [c for c in it["choices"] if c != it["target"]]
            spoken0 = len(page.evaluate("() => window.__spoken || []"))
            page.click(f'.stage [data-t="{bad[0]}"]')
            page.wait_for_timeout(300)
            said = page.evaluate("() => window.__spoken || []")[spoken0:]
            if it["retry"][bad[0]] not in said:
                errors.append(f"{prefix} : explication d'erreur non dite ({it['retry'][bad[0]]})")
            page.click('[aria-label="Demander un indice à Plume"]')
            page.wait_for_timeout(250)
            shot(page, f"{prefix}-indice-{it['kind']}", 100)
        page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(500)
        if n == 0:
            shot(page, f"{prefix}-ex0-juste", 50)
        n += 1
    return n

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    for level in range(1, 7):
        portrait = level == 5
        vp = {"width": 820, "height": 1180} if portrait else {"width": 1180, "height": 820}
        ctx = browser.new_context(viewport=vp, device_scale_factor=1)
        ctx.add_init_script(GRAINE % (2026 + 17 * level))
        ctx.add_init_script(INIT % json.dumps(json.dumps(data(level))))
        ctx.add_init_script(f"window.__archipelTest.graine = {4051 + 31 * level};")
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
        page.wait_for_timeout(450)  # fondu de 350 ms entre les écrans
        page.click('[data-act="goutte"]')
        page.wait_for_timeout(400)
        print(f"niveau {level} :", play_round(page, f"n{level}", mistake_at=1 if level % 2 else 2), "exercices")
        if page.locator(".sticker-big").count():
            shot(page, f"n{level}-gommette")
        ctx.close()
    browser.close()

print("types d'exercices vus :", kinds)
if len(kinds) < 9:
    errors.append(f"trop peu de types d'exercices vus : {sorted(kinds)}")
if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
