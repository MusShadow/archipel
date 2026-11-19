"""Test de bout en bout (retours de test sur iPad) : glisser-déposer des biscuits (souris et doigt), assiettes qui
grandissent, fêtes de réussite (prénom affiché, scènes qui changent, ballons à éclater, grande fête finale), et
captures de chaque scène.

Usage : python3 tests/e2e/retours.py [dist/index.html] [dossier_captures]
"""
import os, re, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots4")
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
now = int(time.time() * 1000)

def data(stairs):
    return {
        "version": 1, "pin": "1234", "activeId": "p1",
        "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
        "profiles": [{
            "id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
            "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [],
            "stairs": stairs,
        }],
    }

INIT = """
(() => {
  if (!localStorage.getItem('archipel2.donnees')) localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { fetes: true, scene: undefined, item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""

errors = []

def shot(page, name, wait=0):
    if wait: page.wait_for_timeout(wait)
    page.screenshot(path=str(OUT / f"{name}.png"))

def item(page):
    return page.evaluate("() => JSON.parse(JSON.stringify(window.__archipelTest.item))")

def new_page(browser, stairs, vp=None, touch=False):
    ctx = browser.new_context(viewport=vp or {"width": 1180, "height": 820}, device_scale_factor=1, has_touch=touch)
    ctx.add_init_script(INIT % json.dumps(json.dumps(data(stairs))))
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "polices/" not in m.text and "ERR_" not in m.text and "manifest" not in m.text and "icon-" not in m.text else None)
    page.goto(PAGE.as_uri())
    page.wait_for_timeout(500)
    page.click(".kid")
    page.wait_for_timeout(600)
    return ctx, page

def open_act(page, island, act):
    page.click(f'[data-isl="{island}"]', force=True)
    page.wait_for_timeout(350)
    page.wait_for_timeout(450)  # fondu de 350 ms entre les écrans
    page.click(f'[data-act="{act}"]')
    page.wait_for_timeout(450)

def count(page, k):
    sel = '.cookies.box' if k < 0 else f'.plate[data-k="{k}"]'
    label = page.get_attribute(sel, "aria-label") or ""
    m = re.search(r"(\d+)", label if k < 0 else label.split(":")[-1])
    return int(m.group(1)) if m else -1

def center(page, sel):
    b = page.locator(sel).first.bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

def drag(page, src, dst, steps=10):
    x0, y0 = center(page, src)
    x1, y1 = center(page, dst)
    page.mouse.move(x0, y0)
    page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)
        page.wait_for_timeout(12)
    page.mouse.up()
    page.wait_for_timeout(120)

def touch_drag(page, cdp, src, dst, steps=10):
    x0, y0 = center(page, src)
    x1, y1 = center(page, dst)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
    for i in range(1, steps + 1):
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + (x1 - x0) * i / steps, "y": y0 + (y1 - y0) * i / steps}]})
        page.wait_for_timeout(16)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    page.wait_for_timeout(150)

def expect(cond, msg):
    if not cond:
        errors.append(msg)

def wait_new_item(page, old_key, timeout=9000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        page.wait_for_timeout(100)
        it = item(page)
        if page.locator(".sticker-big").count():
            return None
        if it and json.dumps(it, sort_keys=True) != old_key:
            return it
    return None

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])

    # ---------- 1. Partage : glisser à la souris et au doigt ----------
    ctx, page = new_page(browser, {"partage": {"level": 1, "up": 0, "down": 0}}, touch=True)
    cdp = ctx.new_cdp_session(page)
    open_act(page, "nombres", "partage")
    it = item(page)
    expect(it and it["kind"] == "egal", f"partage : exercice inattendu {it}")
    total, n = it["total"], len(it["friends"])
    shot(page, "01-partage-debut", 300)
    drag(page, ".cookies.box .cookie", '.plate[data-k="0"] .dish')
    expect(count(page, 0) == 1 and count(page, -1) == total - 1, f"glisser boîte → assiette 1 : {count(page, -1)}/{count(page, 0)}")
    drag(page, '.plate[data-k="0"] .dish .cookie', '.plate[data-k="1"] .dish')
    expect(count(page, 0) == 0 and count(page, 1) == 1, f"glisser assiette 1 → assiette 2 : {count(page, 0)}/{count(page, 1)}")
    page.click('.plate[data-k="1"] .dish .cookie')
    page.wait_for_timeout(500)
    expect(count(page, 1) == 0 and count(page, -1) == total, f"toucher un biscuit de l'assiette le remet dans la boîte : {count(page, 1)}/{count(page, -1)}")
    touch_drag(page, cdp, ".cookies.box .cookie", '.plate[data-k="1"] .dish')
    expect(count(page, 1) == 1, f"glisser au doigt boîte → assiette 2 : {count(page, 1)}")
    touch_drag(page, cdp, '.plate[data-k="1"] .dish .cookie', ".cookies.box")
    expect(count(page, 1) == 0 and count(page, -1) == total, f"glisser au doigt assiette → boîte : {count(page, 1)}/{count(page, -1)}")
    # Lâcher hors d'une assiette : le biscuit reste où il était.
    x0, y0 = center(page, ".cookies.box .cookie")
    page.mouse.move(x0, y0); page.mouse.down(); page.mouse.move(x0 + 40, y0 - 300, steps=6); page.mouse.up()
    page.wait_for_timeout(150)
    expect(count(page, -1) == total, "lâcher hors d'une assiette ne doit rien changer")
    expect(page.locator(".cookie.ghost").count() == 0, "biscuit fantôme resté à l'écran")
    # Toucher une assiette : un biscuit s'envole de la boîte.
    page.click('.plate[data-k="0"]')
    page.wait_for_timeout(450)
    expect(count(page, 0) == 1, f"toucher une assiette : {count(page, 0)}")
    # Tout dans la première assiette : elle grandit, les biscuits restent dedans.
    for _ in range(total - 1):
        drag(page, ".cookies.box .cookie", '.plate[data-k="0"] .dish', steps=5)
    shot(page, "02-partage-assiette-pleine", 400)
    inside = page.evaluate("""() => { const d = document.querySelector('.plate[data-k="0"] .dish').getBoundingClientRect();
      return [...document.querySelectorAll('.plate[data-k="0"] .dish .cookie')].every((c) => { const r = c.getBoundingClientRect();
        return r.left >= d.left - 1 && r.right <= d.right + 1 && r.top >= d.top - 1 && r.bottom <= d.bottom + 1; }); }""")
    expect(inside, "des biscuits débordent de l'assiette")
    # Boîte vide : toucher une assiette explique qu'on peut déplacer les biscuits entre assiettes.
    spoken0 = len(page.evaluate("() => window.__spoken || []"))
    page.click('.plate[data-k="1"]')
    page.wait_for_timeout(300)
    said = page.evaluate("() => window.__spoken || []")[spoken0:]
    expect(any("d'une assiette à l'autre" in s for s in said), f"boîte vide : explication non dite ({said})")
    # Rééquilibrer en glissant d'une assiette à l'autre, puis valider.
    for _ in range(total - it["target"]):
        drag(page, '.plate[data-k="0"] .dish .cookie', '.plate[data-k="1"] .dish', steps=6)
    shot(page, "03-partage-juste", 200)
    page.evaluate("() => { window.__archipelTest.scene = 'voiture'; }")
    key = json.dumps(it, sort_keys=True)
    page.click("[aria-label=\"C'est prêt\"]")
    page.wait_for_timeout(250)
    fete = page.locator(".fete")
    expect(fete.count() == 1, "pas de fête après la bonne réponse")
    if fete.count():
        txt = page.inner_text(".fete")
        expect("Lou" in txt, f"le prénom n'est pas dans la fête : {txt!r}")
        expect(page.get_attribute(".fete", "data-scene") == "voiture", "scène imposée non respectée")
    shot(page, "04-fete-voiture-entree", 300)
    shot(page, "05-fete-voiture-arret", 700)
    it2 = wait_new_item(page, key)
    expect(it2 is not None, "pas d'exercice suivant après la fête")
    page.wait_for_timeout(400)
    expect(page.locator(".fete").count() == 0, "la fête est restée à l'écran sur l'exercice suivant")
    ctx.close()

    # ---------- 2. Les scènes, une par une (île des Découvertes, la goutte, niveau 1) ----------
    ctx, page = new_page(browser, {"goutte": {"level": 1, "up": 0, "down": 0}})
    open_act(page, "decouvertes", "goutte")
    seen = []
    for scene in ["feu", "ballons", "fusee", "pompiers", "volcan", None]:
        for _ in range(20):
            if page.locator('[aria-label="Continuer"]').count():
                page.click('[aria-label="Continuer"]'); page.wait_for_timeout(250)
            if page.locator(".stage [data-t]").count():
                break
            page.wait_for_timeout(150)
        it = item(page)
        if not it:
            errors.append("goutte : pas d'exercice"); break
        if scene:
            page.evaluate(f"() => {{ window.__archipelTest.scene = '{scene}'; }}")
        key = json.dumps(it, sort_keys=True)
        page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(120)
        sc = page.get_attribute(".fete", "data-scene") if page.locator(".fete").count() else None
        seen.append(sc)
        t0 = time.time()
        shot(page, f"1{len(seen)}-fete-{sc}-a", 500)
        if sc == "ballons":
            page.wait_for_timeout(900)
            before = page.locator(".fete .ballon").count()
            box = page.locator(".fete .ballon").first.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] * 0.3)
                page.wait_for_timeout(120)
                shot(page, f"1{len(seen)}-fete-ballons-pop")
                expect(page.locator(".fete .ballon").count() == before - 1, "le ballon touché n'a pas éclaté")
                expect(page.locator(".fete .pop-mot").count() >= 1, "pas de « Pop ! » à l'éclatement")
            # Les éclater tous : l'exercice suivant arrive sans attendre la fin du vol.
            for _ in range(12):
                b = page.locator(".fete .ballon")
                if not b.count(): break
                bb = b.first.bounding_box()
                if bb and bb["y"] < 810: page.mouse.click(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] * 0.3)
                page.wait_for_timeout(110)
        else:
            shot(page, f"1{len(seen)}-fete-{sc}-b", 900)
        nxt = wait_new_item(page, key)
        dt = time.time() - t0
        if nxt is None and not page.locator(".sticker-big").count():
            errors.append(f"pas d'exercice suivant après la scène {sc}")
        expect(dt < 6.5, f"la scène {sc} retarde trop l'exercice suivant ({dt:.1f} s)")
        if page.locator(".sticker-big").count():
            break
    print("scènes vues :", seen)
    expect(seen[:5] == ["feu", "ballons", "fusee", "pompiers", "volcan"], f"scènes : {seen}")
    expect(seen[-1] == "finale", f"la dernière réussite devrait être la grande fête : {seen}")
    ctx.close()

    # ---------- 3. Sans scène imposée : jamais deux fois la même d'affilée ----------
    ctx, page = new_page(browser, {"goutte": {"level": 2, "up": 0, "down": 0}}, vp={"width": 820, "height": 1180})
    open_act(page, "decouvertes", "goutte")
    seen = []
    for _ in range(5):
        for _ in range(20):
            if page.locator('[aria-label="Continuer"]').count():
                page.click('[aria-label="Continuer"]'); page.wait_for_timeout(250)
            if page.locator(".stage [data-t]").count():
                break
            page.wait_for_timeout(150)
        it = item(page)
        if not it: break
        key = json.dumps(it, sort_keys=True)
        page.click(f'.stage [data-t="{it["target"]}"]')
        page.wait_for_timeout(150)
        seen.append(page.get_attribute(".fete", "data-scene") if page.locator(".fete").count() else None)
        if len(seen) == 2:
            shot(page, "20-portrait-fete", 600)
        if wait_new_item(page, key) is None: break
    print("rotation :", seen)
    expect(all(a != b for a, b in zip(seen, seen[1:])), f"deux fois la même scène d'affilée : {seen}")
    expect(None not in seen, f"réussite sans fête : {seen}")
    ctx.close()

    # ---------- 4. Partage en portrait et sur un petit iPad (mise en page) ----------
    for name, vp in [("portrait", {"width": 820, "height": 1180}), ("ipad-mini", {"width": 1133, "height": 744}), ("ancien-ipad", {"width": 1024, "height": 768})]:
        for level in (1, 3):
            ctx, page = new_page(browser, {"partage": {"level": level, "up": 0, "down": 0}}, vp=vp)
            open_act(page, "nombres", "partage")
            it = item(page)
            if it["kind"] != "combien":
                for i in range(len(it["friends"])):
                    for _ in range(it["target"] + (1 if i == 0 else 0)):
                        page.click(f'.plate[data-i="{i}"]')
                page.wait_for_timeout(450)
            overflow = page.evaluate("() => { const s = document.querySelector('.stage'); return s.scrollHeight > s.clientHeight + 2 || document.documentElement.scrollWidth > innerWidth + 2; }")
            ok_box = page.locator("[aria-label=\"C'est prêt\"]").bounding_box() if it["kind"] != "combien" else None
            if ok_box and ok_box["y"] + ok_box["height"] > vp["height"]:
                errors.append(f"{name} niveau {level} : la coche sort de l'écran")
            if overflow:
                errors.append(f"{name} niveau {level} : la page déborde")
            shot(page, f"3-partage-{name}-n{level}-{it['kind']}", 200)
            ctx.close()
    browser.close()

if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
