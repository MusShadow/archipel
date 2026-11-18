"""Vérifie l'appli installable : manifeste, icône, et démarrage sans Internet grâce au service worker.

Usage : python3 tests/e2e/offline.py   (après bun run build ; sert dist/ sur http://localhost)
"""
import functools, http.server, os, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[2] / "dist"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

handler = functools.partial(Quiet, directory=str(DIST))
server = http.server.ThreadingHTTPServer(("localhost", 8137), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()

ok = True
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True)
    ctx = browser.new_context(viewport={"width": 1180, "height": 820})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:8137/")
    page.evaluate("() => navigator.serviceWorker.ready")
    page.reload()  # la page est maintenant contrôlée par le service worker
    page.wait_for_timeout(500)
    manifest = page.evaluate("() => fetch('manifest.webmanifest').then(r => r.json())")
    print("manifeste :", manifest["name"], manifest["display"], [i["src"] for i in manifest["icons"]])
    ctx.set_offline(True)
    page.reload()
    page.wait_for_timeout(600)
    title = page.locator("h1").first.inner_text()
    print("hors ligne, premier titre :", title)
    # Les polices embarquées sont gardées par le service worker : elles se chargent sans Internet.
    polices = page.evaluate("""async () => {
      const r = await Promise.all(["800 30px 'Baloo 2'", "700 30px 'Baloo 2'", "400 30px Andika", "400 16px Inter"]
        .map((f) => document.fonts.load(f, "Bonjour é").catch(() => [])));
      return r.map((faces) => faces.map((f) => `${f.family} ${f.weight} ${f.status}`).join(", "));
    }""")
    print("hors ligne, polices :", polices)
    polices_ok = all(p and "loaded" in p and "error" not in p for p in polices)
    ok = "Archipel" in title and not errors and polices_ok
    if errors:
        print("erreurs :", errors)
    browser.close()
server.shutdown()
print("Hors-ligne : OK" if ok else "Hors-ligne : ÉCHEC")
sys.exit(0 if ok else 1)
