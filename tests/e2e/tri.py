"""Test de bout en bout (livraison 3) : île des Découvertes, « le grand tri », les six niveaux.
Glisser chaque déchet dans la bonne poubelle (au doigt, ou toucher le déchet puis la poubelle), une erreur expliquée
et des indices par manche, réglages des poubelles (bac bleu, composteur, couleurs de Paris), gommette ; un niveau en
portrait.

Usage : python3 tests/e2e/tri.py [dist/index.html] [dossier_captures]
"""
import os, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots6")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
now = int(time.time() * 1000)

def data(level, tri):
    return {
        "version": 1, "pin": "1234", "activeId": "p1",
        "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil", "tri": tri},
        "profiles": [{
            "id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
            "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [],
            "stairs": {"tri": {"level": level, "up": 0, "down": 0}},
        }],
    }

INIT = """
(() => {
  if (!localStorage.getItem('archipel2.donnees')) localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { item: null, mod: null, count: 0, onItem(item, mod) { this.item = item; this.mod = mod; this.count++; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""

# Hasard rejouable (comme les tests du volcan et de la goutte) : Math.random suit une graine fixe par contexte, et la
# graine des exercices passe par le crochet de test ; chaque passage voit les mêmes exercices.
GRAINE = """
(() => {
  let s = %d >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();
"""

errors, shots, chaps, modes = [], set(), {}, set()
NAT = {"papiers": "jaune", "cuisine": "marron", "couleurs": "nationales"}

def shot(page, name, wait=250):
    page.wait_for_timeout(wait)
    page.screenshot(path=str(OUT / f"{name}.png"))

def item(page):
    return page.evaluate("() => { const t = window.__archipelTest; return t.item ? { ...JSON.parse(JSON.stringify(t.item)), _n: t.count } : null; }")

def spoken(page):
    return page.evaluate("() => window.__spoken || []")

def center(page, sel):
    b = page.locator(sel).bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

def drag(page, thing, binid, shot_name=None):
    x0, y0 = center(page, f'.titem[data-item="{thing}"]')
    x1, y1 = center(page, f'.tbin[data-bin="{binid}"]')
    page.mouse.move(x0, y0); page.mouse.down()
    for k in range(1, 13):
        page.mouse.move(x0 + (x1 - x0) * k / 12, y0 + (y1 - y0) * k / 12); page.wait_for_timeout(15)
    if shot_name:
        shot(page, shot_name, 80)
    page.mouse.up()
    modes.add("glisser")

def tap(page, thing, binid):
    page.click(f'.titem[data-item="{thing}"]')
    page.wait_for_timeout(120)
    if page.locator(f'.titem[data-item="{thing}"].selected').count() == 0:
        errors.append(f"le déchet {thing} n'est pas choisi au toucher")
    page.click(f'.tbin[data-bin="{binid}"]')
    modes.add("toucher")

def play_round(page, prefix, mistake_at=1, tap_at=2, max_steps=60):
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
        if it is None or it["_n"] == last or page.locator(".tbin").count() == 0 or page.locator(".titem").count() == 0:
            continue
        last = it["_n"]
        chaps[it["chap"]] = chaps.get(it["chap"], 0) + 1
        if n == 0:
            shot(page, f"{prefix}-manche", 150)
            # Après la consigne, Plume nomme les poubelles (leur étiquette écrite).
            page.wait_for_timeout(250)
            labels = page.evaluate("() => [...document.querySelectorAll('.tbin .tlab')].map(e => e.textContent + '.')")
            said = spoken(page)
            if not all(l in said for l in labels):
                errors.append(f"{prefix} : poubelles non nommées après la consigne : {labels} ; entendu : {said[-6:]}")
            shown = page.evaluate("() => [...document.querySelectorAll('.tbin')].map(b => b.dataset.bin)")
            if shown != it["bins"]:
                errors.append(f"{prefix} : poubelles affichées {shown} au lieu de {it['bins']}")
        things = list(it["things"])
        if n == mistake_at:
            t = things[0]
            bad = [b for b in it["bins"] if b != it["answers"][t]][0]
            s0 = len(spoken(page))
            drag(page, t, bad)
            page.wait_for_timeout(300)
            said = " ".join(spoken(page)[s0:])
            if page.locator(f'.titem[data-item="{t}"]').count() != 1:
                errors.append(f"{prefix} : le déchet {t} a disparu après une erreur")
            if "c'est pour" not in said:
                errors.append(f"{prefix} : erreur non expliquée ; entendu : {said}")
            for _ in range(3):
                page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(200)
            if page.locator(".tbin.glow").count() != 1:
                errors.append(f"{prefix} : l'indice 3 n'éclaire pas la bonne poubelle")
            elif page.locator(f'.tbin.glow[data-bin="{it["answers"][t]}"]').count() != 1:
                errors.append(f"{prefix} : l'indice éclaire la mauvaise poubelle")
            shot(page, f"{prefix}-indice", 100)
        for i, t in enumerate(things):
            if page.locator(f'.titem[data-item="{t}"]').count() == 0:
                continue
            if n == tap_at:
                tap(page, t, it["answers"][t])
            else:
                drag(page, t, it["answers"][t], shot_name=f"{prefix}-glisse" if i == 0 and f"glisse-{prefix}" not in shots else None)
                shots.add(f"glisse-{prefix}")
            page.wait_for_timeout(220)
            if page.locator(f'.titem[data-item="{t}"]').count():
                errors.append(f"{prefix} : {t} n'est pas parti dans {it['answers'][t]}")
        page.wait_for_timeout(700)
        n += 1
    return n

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    runs = [(1, NAT), (2, {"papiers": "jaune", "cuisine": "marron", "couleurs": "paris"}), (3, {"papiers": "jaune", "cuisine": "compost", "couleurs": "nationales"}),
            (4, {"papiers": "bleu", "cuisine": "marron", "couleurs": "nationales"}), (5, NAT), (6, {"papiers": "bleu", "cuisine": "compost", "couleurs": "paris"})]
    for i, (level, tri) in enumerate(runs):
        portrait = level == 3
        vp = {"width": 820, "height": 1180} if portrait else {"width": 1180, "height": 820}
        ctx = browser.new_context(viewport=vp, device_scale_factor=1, has_touch=False)
        ctx.add_init_script(GRAINE % (2026 + 17 * i))
        ctx.add_init_script(INIT % json.dumps(json.dumps(data(level, tri))))
        ctx.add_init_script(f"window.__archipelTest.graine = {4051 + 31 * i};")
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
        page.click('[data-act="tri"]')
        page.wait_for_timeout(400)
        print(f"niveau {level} ({tri['papiers']}, {tri['cuisine']}, {tri['couleurs']}) :", play_round(page, f"n{level}", mistake_at=1 if level % 2 else 0, tap_at=2), "manches")
        if page.locator(".sticker-big").count():
            shot(page, f"n{level}-gommette")
        else:
            errors.append(f"niveau {level} : pas de gommette à la fin")
        ctx.close()
    browser.close()

print("chapitres vus :", chaps, "; gestes :", sorted(modes))
if modes != {"glisser", "toucher"}:
    errors.append(f"gestes manquants : {sorted(modes)}")
if len(chaps) < 6:
    errors.append(f"trop peu de chapitres vus : {sorted(chaps)}")
if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
