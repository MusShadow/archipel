"""Test de bout en bout : une séance sans répétition, et les réponses proposées dites par Plume.
Deux tours de l'atelier des syllabes dans la même séance (12 exercices) : aucun mot ni aucune syllabe ne revient
(ex. « lama »). Deux tours de « Flotte ou coule ? » et du voyage de la goutte : aucun exercice ne revient, et dans la
goutte les réponses écrites sous les images sont lues après la consigne. Formes : la question des côtés nomme la forme.

Usage : python3 tests/e2e/seance.py [dist/index.html]
"""
import os, re, sys, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist" / "index.html").resolve()
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
now = int(time.time() * 1000)

def data():
    return {
        "version": 1, "pin": "1234", "activeId": "p1",
        "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
        "profiles": [{
            "id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
            "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [],
            "stairs": {"syllabes": {"level": 4, "up": 0, "down": 0}, "goutte": {"level": 3, "up": 0, "down": 0}, "flotte": {"level": 2, "up": 0, "down": 0},
                       "formes": {"level": 2, "up": 0, "down": 0}},
        }],
    }

INIT = """
(() => {
  if (!localStorage.getItem('archipel.v1')) localStorage.setItem('archipel.v1', %s);
  window.__archipelTest = { item: null, mod: null, count: 0, onItem(item, mod) { this.item = item; this.mod = mod; this.count++; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken = (window.__spoken || []).concat(u.text); setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""

errors = []

def item(page):
    return page.evaluate("() => { const t = window.__archipelTest; return t.item ? { ...JSON.parse(JSON.stringify(t.item)), _n: t.count } : null; }")

def spoken(page):
    return page.evaluate("() => window.__spoken || []")

def opt_text(label):
    s = " ".join(label.split())
    s = s[:1].upper() + s[1:]
    return s if re.search(r"[.!?…]$", s) else s + "."

def back_to_map(page):
    for _ in range(40):
        if page.locator(".sticker-big").count():
            page.click(".sticker-big"); page.wait_for_timeout(600)
        if page.locator('[data-isl]').count() and page.locator(".stage").count() == 0 and page.locator(".sticker-big").count() == 0:
            return
        page.wait_for_timeout(250)

def open_activity(page, island, act):
    page.click(f'[data-isl="{island}"]', force=True); page.wait_for_timeout(400)
    page.click(f'.actcard[data-act="{act}"]'); page.wait_for_timeout(400)

def play(page, act, rounds_of=6, on_item=None):
    """Joue un tour : répond juste à chaque exercice ; renvoie les exercices vus."""
    seen, last = [], None
    for _ in range(120):
        page.wait_for_timeout(120)
        if page.locator(".sticker-big").count() or (page.locator("[data-isl]").count() and page.locator(".stage").count() == 0):
            break
        if page.locator('[aria-label="Continuer"]').count():
            page.click('[aria-label="Continuer"]'); page.wait_for_timeout(250)
        it = item(page)
        if it is None or it["_n"] == last or page.locator(".stage [data-t]").count() == 0:
            continue
        last = it["_n"]
        seen.append(it)
        if on_item:
            on_item(page, it)
        answer(page, act, it)
        page.wait_for_timeout(500)
    return seen

def answer(page, act, it):
    k = it.get("kind")
    if act == "syllabes" and k == "mot":
        for syl in it["word"]["syl"]:
            page.locator(f'.tile[data-t="{syl}"]:not(.used)').first.click(); page.wait_for_timeout(80)
    elif act == "syllabes" and k == "fabrique":
        page.locator(f'.tile[data-t="{it["target"][0]}"]').first.click(); page.wait_for_timeout(80)
        page.locator(f'.tile[data-t="{it["target"][1:]}"]').first.click()
    else:
        page.click(f'.stage [data-t="{it["target"]}"]')
    page.wait_for_timeout(300)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1180, "height": 820})
    ctx.add_init_script(INIT % json.dumps(json.dumps(data())))
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.goto(PAGE.as_uri()); page.wait_for_timeout(500)
    page.click(".kid"); page.wait_for_timeout(600)

    # 1. Syllabes : deux tours, douze exercices, aucun mot ni syllabe deux fois (« lama » une seule fois).
    targets = []
    for r in range(2):
        open_activity(page, "mots", "syllabes")
        targets += [x["target"] for x in play(page, "syllabes")]
        back_to_map(page)
    print("syllabes :", targets)
    if len(targets) < 10:
        errors.append(f"syllabes : trop peu d'exercices joués ({len(targets)})")
    if len(set(targets)) != len(targets):
        errors.append(f"syllabes : un mot ou une syllabe revient dans la séance : {targets}")

    # 2. La goutte : aucun exercice deux fois, et les réponses écrites sous les images sont lues.
    lus = []
    def check_read(page, it):
        page.wait_for_timeout(300)
        texts = [opt_text(it["opts"][c]["label"]) for c in it.get("choices", []) if c in it.get("opts", {})]
        said = spoken(page)
        if texts and all(t in said[-len(texts) - 4:] for t in texts):
            lus.append(it["key"])
    keys = []
    for r in range(2):
        open_activity(page, "decouvertes", "goutte")
        keys += [x["key"] for x in play(page, "goutte", on_item=check_read)]
        back_to_map(page)
    print("goutte :", keys, "; réponses lues :", len(lus))
    if len(set(keys)) != len(keys):
        errors.append(f"goutte : un exercice revient dans la séance : {keys}")
    if len(lus) < 3:
        errors.append(f"goutte : réponses proposées lues trop rarement ({lus})")

    # 3. Flotte ou coule : aucun objet deux fois dans la même question.
    ids = []
    for r in range(2):
        open_activity(page, "decouvertes", "flotte")
        ids += [f'{x["kind"]}:{"+".join(sorted(o["e"] for o in x["objs"]))}' for x in play(page, "flotte")]
        back_to_map(page)
    print("flotte :", ids)
    if len(set(ids)) != len(ids):
        errors.append(f"flotte : un exercice revient dans la séance : {ids}")

    # 4. Formes : la question des côtés nomme la forme.
    open_activity(page, "enigmes", "formes")
    prompts = [x["prompt"] for x in play(page, "formes") if x.get("kind") == "cotes"]
    back_to_map(page)
    print("formes (côtés) :", prompts)
    for pr in prompts:
        if "cette forme" in pr or not re.match(r"Combien de côtés a (le |l')\w+", pr):
            errors.append(f"formes : la question ne nomme pas la forme : {pr}")
    browser.close()

if errors:
    print("ERREURS :")
    for e in errors: print(" -", e)
    sys.exit(1)
print("OK")
