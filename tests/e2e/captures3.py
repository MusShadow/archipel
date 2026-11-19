"""Captures de la livraison 3 : les mêmes écrans, joués sur deux versions de l'appli, mis côte à côte (avant / après).
Île des Mots, théâtre de Pico, carnet, coin calme, fin de séance, dessin pas à pas, espace parent ; iPad en paysage
(1180 x 820), profil « Lou » avec des gommettes, des drapeaux et le drapeau de son île.

Usage : python3 tests/e2e/captures3.py <avant/dist/index.html> <après/dist/index.html> <dossier de sortie>
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
STICKERS = [
    {"t": 1, "kind": "depart", "reason": "Celle-ci, c'est ton passeport d'explorateur : tu as réussi le grand départ !"},
    {"t": 2, "kind": "syllabe", "ref": "ma", "reason": "Tu as lu la syllabe ma."},
    {"t": 3, "kind": "grenouille", "reason": "Tu as aidé la grenouille à sauter."},
    {"t": 4, "kind": "biscuit", "reason": "Tu as partagé les biscuits."},
    {"t": 5, "kind": "drapeau", "ref": "FR", "reason": "Tu as reconnu le drapeau de la France."},
    {"t": 6, "kind": "forme", "ref": "🔺", "reason": "Tu as trouvé les formes."},
    {"t": 7, "kind": "bip", "reason": "Tu as guidé Bip."},
    {"t": 8, "kind": "theatre", "ref": "🎭", "reason": "Tu as compris les émotions."},
    {"t": 9, "kind": "flotte", "ref": "🦆", "reason": "Tu as trouvé ce qui flotte."},
]
DATA = {
    "version": 1, "pin": "1234", "activeId": "p1",
    "settings": {"sessionMinutes": 90, "accompanied": False, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
    "profiles": [{"id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "avatar": "renard", "createdAt": now - 9 * 86400000, "knownK": 15,
                  "skills": {}, "log": [], "stickers": STICKERS, "sessions": [], "goals": [], "departDone": True, "stories": [],
                  "flags": {c: {"seen": 1, "ok": 1, "last": i} for i, c in enumerate(["FR", "IT", "JP", "DE", "CA", "MA"])},
                  "myFlag": {"layout": "croix", "colors": ["vert", "jaune"], "symbol": "etoile", "symbolColor": "rouge"},
                  "stairs": {"theatre": {"level": 2, "up": 0, "down": 0}}}],
}
INIT = """
(() => {
  localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { fetes: false, graine: 7, item: null, mod: null, n: 0, onItem(item, mod) { this.item = item; this.mod = mod; this.n++; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { setTimeout(() => u.onend && u.onend(), 30); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
""" % json.dumps(json.dumps(DATA))
ETAPES = ["ile-mots", "theatre", "carnet", "calme", "fin", "dessin", "parent"]
TITRES = {"ile-mots": "Île des Mots", "theatre": "Le théâtre de Pico", "carnet": "Le carnet", "calme": "Le coin calme",
          "fin": "Fin de séance", "dessin": "Dessine pas à pas", "parent": "Espace parent"}

def ouvrir_carte(page):
    page.wait_for_timeout(900)
    page.click(".kid")
    page.wait_for_timeout(1800)  # fondu, puis Plume vole vers la mission

def etape(page, tag, nom):
    def shot(wait=600):
        page.wait_for_timeout(wait)
        page.screenshot(path=str(OUT / f"{tag}-{nom}.png"))
    if nom == "parent":
        page.wait_for_timeout(900)
        box = page.locator(".lockbtn").bounding_box()
        page.mouse.move(box["x"] + 20, box["y"] + 20); page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
        for d in "1234":
            page.click(f'.pin button:text-is("{d}")')
        shot(700)
        return
    ouvrir_carte(page)
    if nom == "ile-mots":
        page.click('[data-isl="mots"]', force=True); shot(1500)
    elif nom == "theatre":
        page.click('[data-isl="coeur"]', force=True); page.wait_for_timeout(800)
        page.click('[data-act="theatre"]'); shot(1600)
    elif nom == "dessin":
        page.click('[data-isl="atelier"]', force=True); page.wait_for_timeout(800)
        page.click('[data-act="dessin"]'); shot(1200)
    elif nom == "carnet":
        page.click('[aria-label="Ouvrir mon carnet d\'explorateur"]'); shot(1000)
    elif nom == "calme":
        page.click('[aria-label="Aller au coin calme"]'); shot(3200)
    elif nom == "fin":
        page.wait_for_timeout(500)
        page.click('.hud-moi, [aria-label*="arrêter le voyage"]')
        page.wait_for_timeout(500)
        page.click("text=Oui, on range"); shot(3000)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    for tag, page_path in (("avant", AVANT), ("apres", APRES)):
        for nom in ETAPES:
            ctx = browser.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
            ctx.add_init_script(INIT)
            page = ctx.new_page()
            page.goto(page_path.as_uri())
            etape(page, tag, nom)
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
planche("planche-5-ile-theatre-dessin", ["ile-mots", "theatre", "dessin"])
planche("planche-6-carnet-calme-fin-parent", ["carnet", "calme", "fin", "parent"])
