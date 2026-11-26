"""Test de bout en bout (livraison 3) : île des Découvertes, « le voyage des déchets », les six niveaux.
Glisser la poubelle jusqu'au camion (au doigt, ou toucher la poubelle puis le camion), le tapis du centre de tri,
les questions à choisir avec une erreur expliquée et des indices, les réglages des poubelles, gommette ; un niveau en
portrait.

Usage : python3 tests/e2e/dechets.py [dist/index.html] [dossier_captures]
"""
import os, re, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "tests" / "e2e" / "shots7")
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
            "stairs": {"dechets": {"level": level, "up": 0, "down": 0}},
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

errors, kinds, shots, gestures, options_read = [], {}, set(), set(), set()
NAT = {"papiers": "jaune", "cuisine": "marron", "couleurs": "nationales"}
PLUME = '[aria-label="Demander un indice à Plume"]'

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

def drag_to(page, src, x1, y1, shot_name=None):
    x0, y0 = center(page, src)
    page.mouse.move(x0, y0); page.mouse.down()
    for k in range(1, 15):
        page.mouse.move(x0 + (x1 - x0) * k / 14, y0 + (y1 - y0) * k / 14); page.wait_for_timeout(15)
    if shot_name:
        shot(page, shot_name, 80)
    page.mouse.up()

def play_camion(page, prefix, it, n, mode):
    if f"camion-{prefix}" not in shots:
        shots.add(f"camion-{prefix}"); shot(page, f"{prefix}-camion", 100)
    if mode == "court":
        # Pas assez loin : la poubelle revient, Plume encourage.
        s0 = len(spoken(page))
        x0, y0 = center(page, ".dbin")
        drag_to(page, ".dbin", x0 + 40, y0)
        page.wait_for_timeout(450)
        if "Encore un peu plus loin, jusqu'au camion !" not in spoken(page)[s0:]:
            errors.append(f"{prefix} : pas d'encouragement quand la poubelle n'arrive pas au camion")
        for _ in range(3):
            page.click(PLUME); page.wait_for_timeout(150)
        if page.locator(".drue.hinted").count() != 1:
            errors.append(f"{prefix} : l'indice ne montre pas l'arrière du camion")
        shot(page, f"{prefix}-camion-indice", 300)
    lb = page.locator(".dlift").bounding_box()
    tx, ty = lb["x"] + lb["width"] * 0.4, lb["y"] + lb["height"] * 0.6
    if mode == "toucher":
        page.click(".dbin"); page.wait_for_timeout(150)
        if page.locator(".dbin.glow").count() != 1:
            errors.append(f"{prefix} : la poubelle touchée n'est pas choisie")
        page.mouse.click(tx, ty)
        gestures.add("toucher")
    else:
        drag_to(page, ".dbin", tx, ty, shot_name=f"{prefix}-camion-glisse" if f"glisse-{prefix}" not in shots else None)
        shots.add(f"glisse-{prefix}")
        gestures.add("glisser")
    # la poubelle se vide : des déchets de ce bac tombent dans le camion pendant qu'elle bascule
    try:
        page.wait_for_selector(".dchute", timeout=2000)
        chute = page.locator(".dchute").count()
    except Exception:
        chute = 0
    if chute == 0:
        errors.append(f"{prefix} : rien ne tombe de la poubelle dans le camion")
    page.wait_for_timeout(1400)
    if page.locator(".drue.dgo").count() == 0 and page.locator(".drue").count():
        errors.append(f"{prefix} : le camion n'est pas reparti")
    if page.locator(".dchute").count():
        errors.append(f"{prefix} : des déchets restent à l'écran après le départ du camion")
    elif "camion-part" not in shots:
        shots.add("camion-part"); shot(page, f"{prefix}-camion-part", 50)
    page.wait_for_timeout(900)

def play_tapis(page, prefix, it, n, mistake):
    if mistake:
        t = it["things"][0]
        bad = [c for c in ["plastique", "metal", "papier"] if c != it["answers"][t]][0]
        s0 = len(spoken(page))
        drag_to(page, f'.titem[data-item="{t}"]', *center(page, f'.tbin[data-bin="{bad}"]'))
        page.wait_for_timeout(300)
        if not any("Cette caisse, c'est pour" in x for x in spoken(page)[s0:]):
            errors.append(f"{prefix} : erreur du tapis non expliquée")
    for i, t in enumerate(it["things"]):
        drag_to(page, f'.titem[data-item="{t}"]', *center(page, f'.tbin[data-bin="{it["answers"][t]}"]'),
                shot_name=f"{prefix}-tapis" if i == 1 and "tapis" not in shots else None)
        if i == 1: shots.add("tapis")
        page.wait_for_timeout(200)
        if page.locator(f'.titem[data-item="{t}"]').count():
            errors.append(f"{prefix} : {t} n'est pas parti dans la caisse {it['answers'][t]}")
    page.wait_for_timeout(900)

def opt_text(label):
    s = " ".join(label.split())
    s = s[:1].upper() + s[1:]
    return s if re.search(r"[.!?…]$", s) else s + "."

def norm(t):
    return " ".join(re.sub(r"[.!?…,;:'’]", " ", t.lower()).split())

def play_choice(page, prefix, it, n, mistake):
    k = it["kind"]
    if k not in shots:
        shots.add(k); shot(page, f"{prefix}-ex{n}-{k}", 150)
        # Plume lit les réponses proposées après la consigne (sauf si la consigne les nomme déjà).
        page.wait_for_timeout(300)
        texts = [opt_text(it["opts"][c]["label"]) for c in it["choices"]]
        said = spoken(page)
        if not all(f" {norm(t)} " in f" {norm(it['prompt'])} " for t in texts):
            missing = [t for t in texts if t not in said[-len(texts) - 3:]]
            if missing:
                errors.append(f"{prefix} : réponses proposées non lues ({k}) : {missing}")
            else:
                options_read.add(k)
        # Le haut-parleur d'une carte la redit, sans répondre.
        if "haut-parleur" not in shots:
            shots.add("haut-parleur")
            s0, n0 = len(spoken(page)), item(page)["_n"]
            page.locator(f'.choices [data-t="{it["choices"][0]}"] .sayit').click()
            page.wait_for_timeout(250)
            if spoken(page)[s0:] != [texts[0]] or item(page)["_n"] != n0 or page.locator(".choices .right").count():
                errors.append(f"{prefix} : le haut-parleur n'a pas seulement redit « {texts[0]} » : {spoken(page)[s0:]}")
    if mistake:
        bad = [c for c in it["choices"] if c != it["target"]][0]
        s0 = len(spoken(page))
        page.click(f'.choices [data-t="{bad}"]'); page.wait_for_timeout(300)
        if it["retry"][bad] not in spoken(page)[s0:]:
            errors.append(f"{prefix} : explication d'erreur non dite ({it['retry'][bad]}) ; entendu : {spoken(page)[s0:]}")
        page.click(PLUME); page.wait_for_timeout(150)
        page.click(PLUME); page.wait_for_timeout(200)
        shot(page, f"{prefix}-indice-{k}", 80)
    page.click(f'.choices [data-t="{it["target"]}"]')
    page.wait_for_timeout(500)

def play_round(page, prefix, mistake_at=1, max_steps=60):
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
        if it is None or it["_n"] == last or page.locator(".stage").count() == 0:
            continue
        k = it["kind"]
        ready = {"camion": ".dbin", "tapis": ".titem"}.get(k, ".choices [data-t]")
        if page.locator(ready).count() == 0:
            continue
        last = it["_n"]
        kinds[k] = kinds.get(k, 0) + 1
        if k == "camion":
            mode = "court" if n == mistake_at else ("toucher" if "toucher" not in gestures else "glisser")
            play_camion(page, prefix, it, n, mode)
        elif k == "tapis":
            play_tapis(page, prefix, it, n, n == mistake_at)
        else:
            play_choice(page, prefix, it, n, n == mistake_at)
        n += 1
    return n

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    runs = [(1, NAT), (1, {"papiers": "bleu", "cuisine": "compost", "couleurs": "paris"}), (2, NAT), (3, NAT),
            (4, {"papiers": "bleu", "cuisine": "compost", "couleurs": "nationales"}), (4, NAT), (5, {"papiers": "jaune", "cuisine": "marron", "couleurs": "paris"}), (6, NAT)]
    for i, (level, tri) in enumerate(runs):
        portrait = i == 3
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
        page.wait_for_selector(".ile-ecran")  # Plume vole d'abord vers l'île (livraison 4)
        page.wait_for_timeout(400)
        if i == 0:
            shot(page, "00-ile-decouvertes")
        page.wait_for_timeout(450)  # fondu de 350 ms entre les écrans
        page.click('[data-act="dechets"]')
        page.wait_for_timeout(400)
        prefix = f"r{i}n{level}"
        print(f"niveau {level} ({tri['papiers']}, {tri['cuisine']}, {tri['couleurs']}) :", play_round(page, prefix, mistake_at=1 if i % 2 else 0), "exercices")
        if page.locator(".sticker-big").count():
            shot(page, f"{prefix}-gommette")
        else:
            errors.append(f"{prefix} : pas de gommette à la fin")
        ctx.close()
    browser.close()

print("types d'exercices vus :", kinds, "; gestes :", sorted(gestures), "; réponses lues :", sorted(options_read))
if len(options_read) < 3:
    errors.append(f"réponses proposées lues dans trop peu d'exercices : {sorted(options_read)}")
if len(kinds) < 10:
    errors.append(f"trop peu de types d'exercices vus : {sorted(kinds)}")
if gestures != {"glisser", "toucher"}:
    errors.append(f"gestes manquants : {sorted(gestures)}")
if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
