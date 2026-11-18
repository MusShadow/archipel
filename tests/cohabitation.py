"""Vérifie que la v1 et la v2 cohabitent sur le site assemblé (même origine, comme sur GitHub Pages).

Usage : bash scripts/assembler.sh <v1> <v2> site && python3 tests/cohabitation.py site
Le site est servi sous /archipel/ (v1) et /archipel/v2/ (v2), dans Chrome, qui applique les mêmes règles de portée
des service workers que Safari.
"""
import functools, http.server, os, re, shutil, sys, tempfile, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else "site").resolve()
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
root = Path(tempfile.mkdtemp())
(root / "archipel").symlink_to(SITE, target_is_directory=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

server = http.server.ThreadingHTTPServer(("localhost", 8139), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
V1, V2 = "http://localhost:8139/archipel/", "http://localhost:8139/archipel/v2/"
errors = []
def check(cond, what):
    print(("ok   " if cond else "ÉCHEC") + " " + what)
    if not cond:
        errors.append(what)

CACHES = "async () => (await caches.keys()).sort()"
V1_HOLDS_V2 = """async () => { const out = [];
  for (const k of await caches.keys()) { if (!k.startsWith('archipel-')) continue;
    for (const r of await (await caches.open(k)).keys()) if (new URL(r.url).pathname.startsWith('/archipel/v2/')) out.push(k + ' ' + r.url); }
  return out; }"""
sw1 = SITE / "sw.js"
original = sw1.read_text()
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME, headless=True)
        ctx = browser.new_context(viewport={"width": 1194, "height": 834})
        page = ctx.new_page()
        page.goto(V1)
        page.wait_for_function("() => navigator.serviceWorker.controller", timeout=240000)
        check(page.title() == "Archipel", f"la v1 s'ouvre sur /archipel/ (titre « {page.title()} »)")
        page.evaluate("() => localStorage.setItem('archipel.v1', JSON.stringify({version: 1, pin: null, settings: {}, profiles: [{id: 'p1', name: 'Lou'}], activeId: 'p1'}))")
        v1_data = page.evaluate("() => localStorage.getItem('archipel.v1')")

        page.goto(V2)
        page.wait_for_function("() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.includes('/v2/')", timeout=240000)
        page.reload()
        check(page.title() == "Archipel 2", f"la v2 s'ouvre sur /archipel/v2/ avec son propre service worker (titre « {page.title()} »)")
        regs = page.evaluate("async () => (await navigator.serviceWorker.getRegistrations()).map(r => new URL(r.scope).pathname).sort()")
        check(regs == ["/archipel/", "/archipel/v2/"], f"deux service workers, deux portées : {regs}")
        keys = page.evaluate(CACHES)
        check(any(k.startswith("archipel-") and k != "archipel-voix" for k in keys) and "archipel-voix" in keys, "caches de la v1 présents")
        check(any(k.startswith("archipel2-") and k != "archipel2-voix" for k in keys) and "archipel2-voix" in keys, f"caches de la v2 à part : {keys}")
        check(page.evaluate(V1_HOLDS_V2) == [], "la v1 n'a rien copié de /archipel/v2/ dans ses caches")
        check(page.evaluate("() => localStorage.getItem('archipel.v1')") == v1_data, "les données de la v1 sont intactes après l'ouverture de la v2")
        v2_keys = page.evaluate("() => Object.keys(localStorage).sort()")
        check(all(k == "archipel.v1" or k.startswith("archipel2.") for k in v2_keys), f"clés de stockage : {v2_keys}")

        # Mise à jour de la v1 (nouvelle version de cache) : les caches de la v2 doivent survivre.
        m = re.search(r'const CACHE = "archipel-([0-9a-f]+)"', original)
        sw1.write_text(original.replace(m.group(0), 'const CACHE = "archipel-0000000001"'))
        page.goto(V1)
        page.evaluate("""async () => { const reg = await navigator.serviceWorker.getRegistration('./');
            await reg.update(); const w = reg.installing || reg.waiting;
            if (w) await new Promise(res => { const f = () => { if (w.state === 'activated' || w.state === 'redundant') res(); }; w.addEventListener('statechange', f); f(); }); }""")
        page.wait_for_timeout(1500)
        keys = page.evaluate(CACHES)
        check(any(k.startswith("archipel2-") and k != "archipel2-voix" for k in keys) and "archipel2-voix" in keys, f"après une mise à jour de la v1, les caches de la v2 sont toujours là : {keys}")

        # Sans Internet : chaque adresse rouvre sa propre appli.
        ctx.set_offline(True)
        page.goto(V2); page.wait_for_timeout(800)
        check(page.title() == "Archipel 2", f"hors ligne, /archipel/v2/ rouvre la v2 (titre « {page.title()} »)")
        page.goto(V1); page.wait_for_timeout(800)
        check(page.title() == "Archipel", f"hors ligne, /archipel/ rouvre la v1 (titre « {page.title()} »)")
        browser.close()
finally:
    sw1.write_text(original)
    server.shutdown()
    shutil.rmtree(root, ignore_errors=True)

print("Cohabitation : OK" if not errors else f"Cohabitation : {len(errors)} échec(s)")
sys.exit(1 if errors else 0)
