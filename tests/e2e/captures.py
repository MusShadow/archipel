"""Captures de la refonte : le même parcours, joué sur deux versions de l'appli, mis côte à côte (avant / après).
Accueil, carte, île des Nombres, nénuphars, petite fête, grande fête, gommette ; iPad en paysage (1180 x 820),
profil « Lou », graine fixe (mêmes exercices des deux côtés quand l'activité n'a pas changé).

Usage : python3 tests/e2e/captures.py <avant/dist/index.html> <après/dist/index.html> <dossier de sortie>
Écrit <sortie>/avant-*.png, <sortie>/apres-*.png et les planches <sortie>/planche-*.webp.
"""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
AVANT, APRES, OUT = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve(), Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
now = int(time.time() * 1000)
DATA = {
    "version": 1, "pin": "1234", "activeId": "p1",
    "settings": {"sessionMinutes": 90, "accompanied": False, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
    "profiles": [{"id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
                  "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [], "stairs": {}}],
}
INIT = """
(() => {
  localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { fetes: true, graine: 7, item: null, mod: null, n: 0, onItem(item, mod) { this.item = item; this.mod = mod; this.n++; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { setTimeout(() => u.onend && u.onend(), 30); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
""" % json.dumps(json.dumps(DATA))
ETAPES = ["accueil", "carte", "ile", "nenuphars", "fete", "finale", "gommette"]
TITRES = {"accueil": "Accueil", "carte": "Carte de l'archipel", "ile": "Île des Nombres", "nenuphars": "Les nénuphars",
          "fete": "Petite fête", "finale": "Grande fête", "gommette": "Gommette"}

def parcours(page, tag):
    def shot(nom, wait=600):
        page.wait_for_timeout(wait)
        page.screenshot(path=str(OUT / f"{tag}-{nom}.png"))
    def juste():
        it = page.evaluate("() => window.__archipelTest.item")
        if it.get("kind") == "manque":
            page.click(f'.stage [data-c="{it["target"]}"]')
        else:
            page.click(f'.pad[data-n="{it["target"]}"]')
    page.wait_for_timeout(900)
    shot("accueil", 400)
    page.click(".kid")
    shot("carte", 1600)
    page.click('[data-isl="nombres"]', force=True)
    page.wait_for_selector(".ile-ecran")  # Plume vole d'abord vers l'île (livraison 4)
    shot("ile", 1300)
    page.wait_for_timeout(450)  # fondu de 350 ms entre les écrans
    page.click('[data-act="nenuphars"]')
    shot("nenuphars", 1500)
    def suivant(n):
        # attend l'exercice suivant (la fête précédente est finie)
        for _ in range(80):
            if page.evaluate("() => window.__archipelTest.n") > n and page.locator(".fete").count() == 0:
                page.wait_for_timeout(500)
                return
            page.wait_for_timeout(150)
    page.evaluate("() => { window.__archipelTest.scene = 'pompiers'; }")
    n = page.evaluate("() => window.__archipelTest.n")
    juste()
    shot("fete", 1500)
    for k in range(5):
        suivant(n)
        n = page.evaluate("() => window.__archipelTest.n")
        juste()
        if k == 4:
            shot("finale", 1700)
    for _ in range(40):
        page.wait_for_timeout(300)
        if page.locator(".sticker-big").count():
            break
    shot("gommette", 900)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    for tag, page_path in (("avant", AVANT), ("apres", APRES)):
        ctx = browser.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        page.goto(page_path.as_uri())
        parcours(page, tag)
        ctx.close()
        print(tag, "OK")
    browser.close()

# Planches : avant à gauche, après à droite, une ligne par écran.
police = ROOT / "public/polices/baloo-2-latin-700-normal.woff2"
try:
    f = ImageFont.truetype(str(police), 28)
except Exception:
    f = ImageFont.load_default()
W, H, M, T = 700, 486, 16, 44
def planche(nom, etapes):
    out = Image.new("RGB", (2 * W + 3 * M, len(etapes) * (H + T + M) + M), (255, 247, 234))
    d = ImageDraw.Draw(out)
    for i, e in enumerate(etapes):
        y = M + i * (H + T + M)
        for j, tag in enumerate(("avant", "apres")):
            x = M + j * (W + M)
            im = Image.open(OUT / f"{tag}-{e}.png").convert("RGB").resize((W, H), Image.LANCZOS)
            out.paste(im, (x, y + T))
            d.text((x + 2, y + 4), f"{TITRES[e]} — {'avant' if tag == 'avant' else 'après'}", fill=(39, 48, 67), font=f)
    out.save(OUT / f"{nom}.webp", "WEBP", quality=82, method=6)
    print(OUT / f"{nom}.webp", out.size)
planche("planche-1-accueil-carte-ile", ["accueil", "carte", "ile"])
planche("planche-2-activite-fetes-gommette", ["nenuphars", "fete", "finale", "gommette"])
