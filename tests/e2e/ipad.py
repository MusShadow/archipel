"""Voix naturelle sur iPad (simulé dans Chrome) : session audio « playback », lecteur audio de secours quand le moteur
Web Audio ne décode pas ou reste interrompu (au lieu de la voix de l'appareil), diagnostic « Écouter Plume ».

Usage : python3 tests/e2e/ipad.py   (après bun run build ; sert dist/ sur http://localhost)
Chrome se présente comme un iPad, sans autoriser la lecture automatique : le son ne démarre qu'après un contact.
"""
import functools, http.server, json, os, sys, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[2] / "dist"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
PORT = 8141
IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15"

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(("localhost", PORT), functools.partial(Quiet, directory=str(DIST)))
threading.Thread(target=server.serve_forever, daemon=True).start()

now = int(time.time() * 1000)
DATA = {
    "version": 1, "pin": "1234", "activeId": "p1",
    "settings": {"sessionMinutes": 90, "accompanied": True, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "naturelle"},
    "profiles": [{"id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now, "knownK": 15, "skills": {}, "flags": {},
                  "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [], "stairs": {}}],
}
# Scénario : "ok" (moteur audio normal), "decodage" (décodage MP3 refusé), "interrompu" (contexte bloqué, comme sur iPad).
INIT = """
(() => {
  if (!localStorage.getItem('archipel2.donnees')) localStorage.setItem('archipel2.donnees', %s);
  Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
  // API Audio Session de Safari, simulée : l'appli doit demander une lecture « playback ».
  navigator.audioSession = { type: 'auto' };
  window.__spoken = []; window.__clips = []; window.__element = [];
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 30); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.duration > 0.01) window.__clips.push(this.buffer.duration); return start.apply(this, a); };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (this.src.startsWith('blob:')) window.__element.push(this.src); return play.apply(this); };
  const mode = %s;
  if (mode === 'decodage') BaseAudioContext.prototype.decodeAudioData = function (d, ok, ko) {
    const e = new DOMException('Decoding failed', 'EncodingError'); if (ko) setTimeout(() => ko(e)); return Promise.reject(e); };
  if (mode === 'interrompu') {
    Object.defineProperty(BaseAudioContext.prototype, 'state', { get: () => 'interrupted' });
    AudioContext.prototype.resume = () => new Promise(() => {});
  }
})();
"""
SAY = """async (text) => {
  const v = window.__archipelVoix, c0 = window.__clips.length, e0 = window.__element.length, s0 = window.__spoken.length;
  await v.speech.say(text);
  return { path: v.speech.lastPath, clips: window.__clips.length - c0, element: window.__element.length - e0,
           spoken: window.__spoken.slice(s0), err: v.natural.lastError };
}"""

checks = []
def check(name, cond, detail=""):
    checks.append((name, bool(cond)))
    print(("OK   " if cond else "ÉCHEC"), name, detail)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, headless=True)
    for mode in ["ok", "decodage", "interrompu"]:
        ctx = browser.new_context(viewport={"width": 1180, "height": 820}, user_agent=IPAD, has_touch=True)
        ctx.add_init_script(INIT % (json.dumps(json.dumps(DATA)), json.dumps(mode)))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"http://localhost:{PORT}/")
        page.wait_for_function("() => window.__archipelVoix.natural.complete", timeout=90000)
        if mode == "ok":
            check("session audio déclarée « playback » (mode silencieux de l'iPad)", page.evaluate("() => navigator.audioSession.type") == "playback")
            r = page.evaluate(SAY, "Bonjour ! Je suis Plume. On part en voyage ?")
            check("avant tout contact : voix de l'appareil (le son n'est pas encore permis)", r["path"] == "appareil", str(r))
        page.click(".kid")  # premier contact : le son est déverrouillé
        page.wait_for_timeout(800)
        r = page.evaluate(SAY, "Bonjour ! Je suis Plume. On part en voyage ?")
        if mode == "ok":
            check("après un contact : voix naturelle par le moteur audio", r["path"] == "naturelle" and r["clips"] > 0 and not r["spoken"], str(r))
        else:
            check(f"moteur audio en panne ({mode}) : voix naturelle par le lecteur de secours", r["path"] == "lecteur" and r["element"] > 0 and not r["spoken"], str(r))
            r2 = page.evaluate(SAY, "Choisis une île !")
            check(f"({mode}) phrase suivante aussi", r2["path"] == "lecteur" and r2["element"] > 0, str(r2))
        if mode == "decodage":
            # Diagnostic de l'espace parent.
            page.goto(f"http://localhost:{PORT}/")
            page.wait_for_function("() => window.__archipelVoix.natural.complete", timeout=90000)
            box = page.locator(".lockbtn").bounding_box()
            page.mouse.move(box["x"] + 20, box["y"] + 20); page.mouse.down(); page.wait_for_timeout(1500); page.mouse.up()
            for d in "1234":
                page.click(f'.pin button:text-is("{d}")')
            page.wait_for_timeout(400)
            page.click('.p-tab:text-is("Réglages")')
            page.wait_for_timeout(300)
            page.click("text=Écouter Plume")
            page.wait_for_function("() => document.querySelector('[data-voix-diag]').textContent.length > 0", timeout=15000)
            diag = page.locator("[data-voix-diag]").inner_text()
            check("« Écouter Plume » explique le chemin pris", "lecteur audio de secours" in diag and "décodage" in diag, diag)
            page.screenshot(path=str(Path(__file__).parent / "shots3" / "ipad-diagnostic.png"))
        check(f"({mode}) aucune erreur de page", not errors, str(errors[:3]))
        ctx.close()
    browser.close()
server.shutdown()
ok = all(c for _, c in checks)
print("iPad : OK" if ok else "iPad : ÉCHEC")
sys.exit(0 if ok else 1)
