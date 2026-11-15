"""Voix naturelle de Plume : pack de voix chargé, phrases lues par clips (avec le prénom retiré), repli sur la voix
de l'appareil pour une phrase inconnue, réglage parent, débit, arrêt, et lecture hors ligne depuis la copie gardée.

Usage : python3 tests/e2e/voix.py   (après bun run build ; sert dist/ sur http://localhost)
La synthèse vocale de l'appareil est simulée ; les clips joués sont comptés au niveau de l'AudioContext.
"""
import functools, http.server, os, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[2] / "dist"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
PORT = 8139

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(("localhost", PORT), functools.partial(Quiet, directory=str(DIST)))
threading.Thread(target=server.serve_forever, daemon=True).start()

INIT = """
(() => {
  window.__spoken = []; window.__clips = [];
  const fake = {
    speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 30); },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  const start = AudioBufferSourceNode.prototype.start;
  // Les clips seulement (pas l'échantillon de silence joué à chaque contact pour déverrouiller le son sur iPad).
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.duration > 0.01) window.__clips.push(this.buffer.duration); return start.apply(this, a); };
})();
"""

checks = []
def check(name, cond, detail=""):
    checks.append((name, bool(cond)))
    print(("OK   " if cond else "ÉCHEC"), name, detail)

SAY = """async ([text, name]) => {
  const v = window.__archipelVoix; v.speech.childName = () => name;
  const c0 = window.__clips.length, s0 = window.__spoken.length, t0 = performance.now();
  await v.speech.say(text);
  return { clips: window.__clips.slice(c0), spoken: window.__spoken.slice(s0), ms: performance.now() - t0 };
}"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    ctx = browser.new_context(viewport={"width": 1180, "height": 820})
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"http://localhost:{PORT}/")
    page.wait_for_timeout(400)
    page.click("text=Commencer")
    for d in "1234" + "1234":
        page.click(f'.pin button:text-is("{d}")')
        page.wait_for_timeout(50)
    page.fill('input[aria-label="Prénom"]', "Léa")
    page.click("text=Lit des syllabes")
    page.click("text=Créer le profil")
    page.click("text=C'est parti pour Léa")
    page.wait_for_function("() => window.__archipelVoix.natural.state === 'prête'", timeout=30000)
    page.wait_for_function("() => window.__archipelVoix.natural.complete", timeout=120000)
    ix = page.evaluate("() => { const i = window.__archipelVoix.natural.index; return { clips: Object.keys(i.clips).length, octets: i.octets, paquets: i.paquets.length }; }")
    check("pack de voix chargé", ix["clips"] > 1000, f"{ix['clips']} clips, {ix['paquets']} paquets, {ix['octets'] / 1e6:.1f} Mo")

    # Premier contact de l'enfant : le grand départ commence, Plume parle avec la voix naturelle, sans dire le prénom.
    s0 = page.evaluate("() => window.__spoken.length"); c0 = page.evaluate("() => window.__clips.length")
    page.click(".kid")
    page.wait_for_timeout(2500)
    spoken = page.evaluate(f"() => window.__spoken.slice({s0})"); clips = page.evaluate(f"() => window.__clips.slice({c0})")
    check("accueil du grand départ en voix naturelle", len(clips) >= 2 and not any("Bienvenue" in t for t in spoken), f"{len(clips)} clips, voix de l'appareil : {spoken}")

    r = page.evaluate(SAY, ["Bravo, tu as trouvé !", None])
    check("phrase connue : un clip, pas de voix de l'appareil", len(r["clips"]) == 1 and not r["spoken"], f"{r['clips']} {r['spoken']}")
    check("la promesse attend la fin du clip", r["ms"] >= 0.8 * 1000 * sum(r["clips"]), f"{r['ms']:.0f} ms pour {sum(r['clips']):.2f} s")
    r = page.evaluate(SAY, ["Bonjour Léa ! Aujourd'hui, je te propose l'île des Mots ou le Port des Voyages. Où veux-tu aller ?", "Léa"])
    check("phrase avec le prénom : voix naturelle, prénom retiré", len(r["clips"]) >= 2 and not r["spoken"], f"{len(r['clips'])} clips {r['spoken']}")
    r = page.evaluate(SAY, ["Le dromadaire mange une pastèque violette.", None])
    misses = page.evaluate("() => window.__archipelVoix.speech.misses")
    check("phrase inconnue : voix de l'appareil", r["spoken"] == ["Le dromadaire mange une pastèque violette."] and not r["clips"]
          and "Le dromadaire mange une pastèque violette." in misses, f"{r}")
    base = page.evaluate(SAY, ["Super, tu as pris ton temps.", None])["clips"]
    page.evaluate("() => { window.__archipelVoix.speech.rate = 0.8; }")
    slow = page.evaluate(SAY, ["Super, tu as pris ton temps.", None])["clips"]
    page.evaluate("() => { window.__archipelVoix.speech.rate = 0.9; }")
    check("débit lent : clip étiré (même voix)", base and slow and abs(slow[0] / base[0] - 1.125) < 0.02, f"{base} → {slow}")
    stopped = page.evaluate("""async () => {
      const v = window.__archipelVoix, t0 = performance.now();
      const p = v.speech.say("Mona n'a pas vu qu'on avait déplacé sa balle. Elle croit que c'est toujours dans la boîte.");
      setTimeout(() => v.speech.stop(), 200);
      await p; return performance.now() - t0;
    }""")
    check("arrêt : la promesse est tenue tout de suite", stopped < 600, f"{stopped:.0f} ms")

    # Réglage parent : voix de l'iPad, puis retour à la voix naturelle.
    page.goto(f"http://localhost:{PORT}/")
    page.wait_for_function("() => window.__archipelVoix.natural.complete", timeout=60000)
    box = page.locator(".lockbtn").bounding_box()
    page.mouse.move(box["x"] + 20, box["y"] + 20); page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
    for d in "1234":
        page.click(f'.pin button:text-is("{d}")')
    page.wait_for_timeout(400)
    page.click('.p-tab:text-is("Réglages")')
    page.wait_for_timeout(300)
    status = page.locator("[data-voix-etat]").inner_text()
    check("espace parent : état de la voix naturelle affiché", "Voix naturelle prête" in status, status[:90])
    shots = Path(__file__).parent / "shots3"; shots.mkdir(exist_ok=True)
    page.screenshot(path=str(shots / "voix-reglages.png"))
    page.click(".opt:text-is(\"De l'iPad\")")
    s0 = page.evaluate("() => window.__spoken.length"); c0 = page.evaluate("() => window.__clips.length")
    page.click("text=Écouter Plume"); page.wait_for_timeout(600)
    check("réglage « De l'iPad » : synthèse de l'appareil", page.evaluate("() => window.__spoken.length") > s0 and page.evaluate("() => window.__clips.length") == c0)
    page.click('.opt:text-is("Naturelle")')
    c0 = page.evaluate("() => window.__clips.length")
    page.click("text=Écouter Plume"); page.wait_for_timeout(3500)
    saved = page.evaluate("() => JSON.parse(localStorage.getItem('archipel.v1')).settings.voix")
    check("réglage « Naturelle » : clips", page.evaluate("() => window.__clips.length") > c0 and saved == "naturelle", saved)

    # Hors ligne : le service worker a gardé l'index et tous les paquets.
    page.evaluate("() => navigator.serviceWorker.ready")
    page.wait_for_function("""async () => {
      const files = (await (await fetch('sw.js')).text()).match(/VOIX_FILES = (\\[[^\\]]*\\])/);
      const want = JSON.parse(files[1]).length;
      const keys = await (await caches.open('archipel-voix')).keys();
      return want > 0 && keys.length >= want;
    }""", timeout=120000, polling=1000)
    ctx.set_offline(True)
    page.reload()
    page.wait_for_function("() => window.__archipelVoix.natural.complete", timeout=30000)
    page.mouse.click(5, 5)
    r = page.evaluate(SAY, ["Où se trouve le Japon ? Touche son continent sur la carte.", None])
    check("hors ligne : clip lu depuis la copie gardée", r["clips"] and not r["spoken"], f"{r['clips']} {r['spoken']}")
    check("aucune erreur de page", not errors, str(errors[:3]))
    browser.close()
server.shutdown()
ok = all(c for _, c in checks)
print("Voix naturelle : OK" if ok else "Voix naturelle : ÉCHEC")
sys.exit(0 if ok else 1)
