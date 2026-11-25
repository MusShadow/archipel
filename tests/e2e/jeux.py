"""Les jeux dessinés de la livraison 4, dans un vrai navigateur, en paysage et en portrait : ce que la relecture
indépendante a trouvé, vérifié pour de bon.
- Le marché de Basile (« voir sans compter ») : les pommes rangées comme sur un dé ne se chevauchent pas (au plus 5 %
  de leurs boîtes) et restent dans la corbeille.
- Les motifs de Rico (« Rico s'est trompé ») : chaque perle à toucher fait au moins 78 px ; en paysage, les douze perles
  tiennent sur une ligne ; sinon, la suite passe à la ligne entre deux morceaux du motif, jamais au milieu d'un motif.
- Le tableau de Rico : à l'indice, les alvéoles de la ligne et de la colonne s'éclairent, elles ne foncent pas.
- Le goûter : quand la boîte est vide, « Plus de biscuits à partager » est écrit sur une étiquette de papier, lisible
  (contraste d'au moins 4,5:1).
- Livraison 4 bis : la goutte, les déchets (et leur rue), le grand tri, le volcan, la carte du monde et les mots du jeu
  des syllabes montrent leurs images peintes, toutes chargées, sans plus aucun dessin au trait.
Usage : python3 tests/e2e/jeux.py"""
import io, json, sys, time
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "dist" / "index.html"
CHROME = "/usr/bin/google-chrome"
SHOTS = ROOT / "tests" / "e2e" / "shots7"
SHOTS.mkdir(parents=True, exist_ok=True)
now = int(time.time() * 1000)

def donnees(stairs):
    return {"version": 1, "pin": "1234", "activeId": "p1",
            "settings": {"sessionMinutes": 90, "accompanied": False, "voiceURI": None, "rate": 0.9, "sessionsPerWeek": 3, "voix": "appareil"},
            "profiles": [{"id": "p1", "name": "Lou", "ageMonths": 54, "color": "#FFC145", "createdAt": now - 9 * 86400000, "knownK": 15,
                          "skills": {}, "flags": {}, "log": [], "stickers": [], "sessions": [], "goals": [], "departDone": True, "stories": [], "stairs": stairs}]}
INIT = """
(() => {
  localStorage.setItem('archipel2.donnees', %s);
  window.__archipelTest = { fetes: false, graine: %d, item: null, mod: null, onItem(item, mod) { this.item = item; this.mod = mod; } };
  const fake = { speaking: false, pending: false, onvoiceschanged: null, getVoices: () => [], cancel() {}, pause() {}, resume() {},
    speak(u) { setTimeout(() => u.onend && u.onend(), 20); } };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();
"""
echecs, erreurs = [], []
def verifie(cond, msg):
    print(("OK    " if cond else "ÉCHEC ") + msg)
    if not cond: echecs.append(msg)

def ouvrir(b, W, H, ile, act, stairs, graine=7):
    ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1)
    ctx.add_init_script(INIT % (json.dumps(json.dumps(donnees(stairs))), graine))
    page = ctx.new_page()
    page.on("pageerror", lambda e: erreurs.append(str(e)))
    page.goto(PAGE.as_uri()); page.wait_for_timeout(500)
    page.click(".kid"); page.wait_for_timeout(1900)
    page.wait_for_selector(".garde-appui", state="detached")
    page.click(f'[data-isl="{ile}"] .ile-zone', force=True)
    page.wait_for_selector(".ile-ecran"); page.wait_for_timeout(800)
    page.click(f'[data-act="{act}"]'); page.wait_for_timeout(700)
    return ctx, page

def suivant(page, dernier):
    """Attend l'exercice suivant (après « Continuer » s'il y a une présentation) ; None à la fin de la manche."""
    for _ in range(40):
        page.wait_for_timeout(150)
        if page.locator(".sticker-big").count() or not page.locator(".stage").count():
            return None
        if page.locator('[aria-label="Continuer"]').count():
            page.click('[aria-label="Continuer"]'); page.wait_for_timeout(250); continue
        it = page.evaluate("() => window.__archipelTest.item")
        if it and json.dumps(it, sort_keys=True) != dernier and page.locator(".stage *").count():
            page.wait_for_timeout(250)
            return it
    return None

RECOUVREMENT = """() => { const bs = Array.from(document.querySelectorAll('.stage .corbeille > .pomme')).map((e) => e.getBoundingClientRect());
  const c = document.querySelector('.stage .corbeille').getBoundingClientRect();
  let max = 0; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j];
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    max = Math.max(max, (ox * oy) / (a.width * a.height)); }
  const dedans = bs.every((a) => a.left >= c.left && a.right <= c.right && a.top >= c.top && a.bottom <= c.bottom);
  return { n: bs.length, recouvrement: Math.round(max * 1000) / 10, dedans, taille: Math.round(bs[0].width) }; }"""

def luminance(png, box):
    im = Image.open(io.BytesIO(png)).convert("L").crop(tuple(int(v) for v in box))
    px = im.tobytes()
    return sum(px) / len(px)

def contraste(c1, c2):
    def lum(c):
        r, g, b = [x / 255 for x in c]
        f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    a, b = sorted((lum(c1), lum(c2)), reverse=True)
    return (a + 0.05) / (b + 0.05)
RGB = lambda s: tuple(int(float(x)) for x in s[s.index("(") + 1:s.index(")")].split(",")[:3])

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, headless=True)
    for (W, H) in ((1180, 820), (834, 1194)):
        tag = f"{W}x{H}"
        # ---- le marché : voir sans compter
        vus = set()
        for graine in (7, 11, 19):
            ctx, page = ouvrir(b, W, H, "nombres", "marche", {"marche": {"level": 1, "up": 0, "down": 0}}, graine)
            dernier = None
            while True:
                it = suivant(page, dernier)
                if it is None or it.get("kind") != "voir":
                    break
                dernier = json.dumps(it, sort_keys=True)
                if it["n"] >= 2:
                    m = page.evaluate(RECOUVREMENT)
                    if it["n"] not in vus:
                        page.locator(".stage .corbeille").screenshot(path=str(SHOTS / f"marche-voir{it['n']}-{tag}.png"))
                    vus.add(it["n"])
                    verifie(m["n"] == it["n"] and m["recouvrement"] <= 5 and m["dedans"],
                            f"{tag} : marché, {it['n']} pommes dans la corbeille → recouvrement {m['recouvrement']} %, dans la corbeille : {m['dedans']} ({m['taille']} px)")
                page.click(f'.stage [data-n="{it["n"]}"]'); page.wait_for_timeout(900)
            ctx.close()
            if {3, 4} <= vus:
                break
        verifie({3, 4} <= vus, f"{tag} : marché, les dispositions à 3 et 4 pommes ont été vues ({sorted(vus)})")

        # ---- les motifs : « Rico s'est trompé »
        vu_long = False
        for graine in (3, 5, 8, 13, 21):
            ctx, page = ouvrir(b, W, H, "enigmes", "motifs", {"motifs": {"level": 4, "up": 0, "down": 0}}, graine)
            dernier = None
            while True:
                it = suivant(page, dernier)
                if it is None:
                    break
                dernier = json.dumps(it, sort_keys=True)
                if it["kind"] == "erreur":
                    toks = page.evaluate("""() => Array.from(document.querySelectorAll('.motifseq .tok')).map((t) => { const r = t.getBoundingClientRect();
                      return { w: r.width, h: r.height, top: Math.round(r.top), unite: Array.from(t.parentElement.parentElement.children).indexOf(t.parentElement) }; })""")
                    petits = [t for t in toks if t["w"] < 78 or t["h"] < 78]
                    lignes = sorted({t["top"] for t in toks})
                    coupe = any(len({t["top"] for t in toks if t["unite"] == u}) > 1 for u in {t["unite"] for t in toks})
                    verifie(not petits, f"{tag} : motifs, {len(toks)} perles à toucher, toutes d'au moins 78 px ({min(t['w'] for t in toks):.0f} px)")
                    verifie(not coupe, f"{tag} : motifs, {len(toks)} perles sur {len(lignes)} ligne(s), aucun morceau du motif coupé")
                    if len(toks) == 12:
                        vu_long = True
                        if W > H:
                            verifie(len(lignes) == 1, f"{tag} : motifs, les douze perles tiennent sur une ligne ({len(lignes)})")
                        page.locator(".stage .motif-cordon").screenshot(path=str(SHOTS / f"motifs-erreur12-{tag}.png"))
                    page.click(f'.motifseq .tok[data-t="{it["target"]}"]')
                else:
                    page.click(f'.stage .choices [data-t="{it["target"]}"]')
                page.wait_for_timeout(900)
            ctx.close()
            if vu_long:
                break
        verifie(vu_long, f"{tag} : motifs, une suite de douze perles à corriger a été vue")

        # ---- le tableau de Rico : l'indice éclaire la ligne et la colonne
        vu = False
        for graine in (2, 4, 6):
            ctx, page = ouvrir(b, W, H, "enigmes", "motifs", {"motifs": {"level": 5, "up": 0, "down": 0}}, graine)
            dernier = None
            while not vu:
                it = suivant(page, dernier)
                if it is None:
                    break
                dernier = json.dumps(it, sort_keys=True)
                if it["kind"] == "matrice":
                    avant = page.screenshot()
                    for _ in range(3):  # 1 : la consigne ; 2 : « regarde la ligne… » ; 3 : la ligne et la colonne s'éclairent
                        page.click('[aria-label="Demander un indice à Plume"]'); page.wait_for_timeout(400)
                    page.wait_for_timeout(400)
                    apres = page.screenshot()
                    cases = page.evaluate("""() => Array.from(document.querySelectorAll('.motifgrid .tok')).map((t) => { const r = t.getBoundingClientRect();
                      return { lit: t.classList.contains('lit'), hole: t.classList.contains('hole'), box: [r.left + r.width * .12, r.top + r.height * .12, r.right - r.width * .12, r.bottom - r.height * .12] }; })""")
                    eclairees = [c for c in cases if c["lit"] and not c["hole"]]
                    plus_sombres = [round(luminance(apres, c["box"]) - luminance(avant, c["box"]), 1) for c in eclairees if luminance(apres, c["box"]) < luminance(avant, c["box"]) - 1]
                    verifie(eclairees and not plus_sombres, f"{tag} : tableau, à l'indice {len(eclairees)} alvéoles s'éclairent, aucune ne fonce ({plus_sombres})")
                    page.screenshot(path=str(SHOTS / f"motifs-tableau-indice-{tag}.png"))
                    vu = True
                    break
                if it["kind"] == "erreur":
                    page.click(f'.motifseq .tok[data-t="{it["target"]}"]')
                else:
                    page.click(f'.stage .choices [data-t="{it["target"]}"]')
                page.wait_for_timeout(900)
            ctx.close()
            if vu:
                break
        verifie(vu, f"{tag} : tableau, un tableau à compléter a été vu")

        # ---- le goûter : la boîte vide
        vu = False
        for graine in (4, 9, 15):
            ctx, page = ouvrir(b, W, H, "nombres", "partage", {"partage": {"level": 1, "up": 0, "down": 0}}, graine)
            it = suivant(page, None)
            if it and it.get("kind") != "combien" and page.locator(".stage .plate").count():
                for _ in range(it["total"]):
                    page.locator(".stage .plate").first.click(); page.wait_for_timeout(450)
                page.wait_for_timeout(500)
                if page.locator(".etiquette-vide").count():
                    st = page.evaluate("() => { const s = getComputedStyle(document.querySelector('.etiquette-vide')); return { c: s.color, f: s.backgroundColor }; }")
                    r = contraste(RGB(st["c"]), RGB(st["f"]))
                    verifie(r >= 4.5, f"{tag} : goûter, « Plus de biscuits à partager » sur son étiquette de papier, contraste {r:.1f}:1")
                    page.locator(".stage .panel.cookies").screenshot(path=str(SHOTS / f"partage-boite-vide-{tag}.png"))
                    vu = True
            ctx.close()
            if vu:
                break
        verifie(vu, f"{tag} : goûter, la boîte vide a été vue")

        # ---- livraison 4 bis : les dessins repeints sont bien là, chargés, et plus aucun tracé dans ces jeux
        for act, isl, lv, graine in (("goutte", "decouvertes", 1, 3), ("goutte", "decouvertes", 3, 5), ("goutte", "decouvertes", 3, 11),
                                     ("syllabes", "mots", 6, 1), ("dechets", "decouvertes", 2, 5),
                                     ("dechets", "decouvertes", 1, 11), ("tri", "decouvertes", 1, 3), ("volcan", "decouvertes", 4, 5),
                                     ("drapeau", "port", 4, 3), ("syllabes", "mots", 6, 5)):
            ctx, page = ouvrir(b, W, H, isl, act, {act: {"level": lv, "up": 0, "down": 0}}, graine)
            it = suivant(page, None)
            page.wait_for_timeout(600)
            etat = page.evaluate("""async () => {
              const imgs = [...document.querySelectorAll('.stage .mot-image img, .stage image, .stage .poubelle img')];
              let ok = 0;
              for (const i of imgs) {
                if (i.tagName.toLowerCase() === 'img') { if (i.complete && i.naturalWidth > 0) ok++; continue; }
                // une <image> SVG : on charge son adresse pour de vrai
                const im = new Image(); im.src = i.getAttribute('href');
                try { await im.decode(); if (im.naturalWidth > 0) ok++; } catch (e) { /* pas chargée */ }
              }
              // l'image peinte d'un dessin n'est jamais étirée : à l'écran, elle garde les proportions de son image
              const etirees = [...document.querySelectorAll('.stage svg.picto image')].filter((i) => {
                const r = i.getBoundingClientRect(), w = +i.getAttribute('width'), h = +i.getAttribute('height');
                return r.width > 0 && Math.abs((r.width / r.height) / (w / h) - 1) > 0.02;
              }).length;
              const traces = [...document.querySelectorAll('.stage .wart > svg:not(.picto), .stage .titem > svg:not(.picto), .stage .tbinart > svg:not(.picto), .stage .card > svg:not(.picto):not([aria-label^="Drapeau"])')].length;
              return { n: imgs.length, ok, traces, etirees }; }""")
            nom = f"{act} niveau {lv} ({it and it.get('kind')})"
            verifie(etat["n"] > 0 and etat["ok"] == etat["n"] and etat["traces"] == 0 and etat["etirees"] == 0,
                    f"{tag} : {nom}, {etat['n']} images peintes chargées, aucune étirée, aucun tracé ({etat})")
            if act == "drapeau" and it and it.get("kind") == "carte":
                cont = page.evaluate("() => [...document.querySelectorAll('.monde [data-cont]')].map((p) => [getComputedStyle(p).fill, getComputedStyle(p).stroke])")
                verifie(cont and all(f == "rgba(0, 0, 0, 0)" and s == "rgba(0, 0, 0, 0)" for f, s in cont),
                        f"{tag} : la carte peinte, continents à toucher transparents, trait compris ({len(cont)})")
            page.screenshot(path=str(SHOTS / f"4bis-{act}-n{lv}-{tag}.png"))
            ctx.close()
    b.close()

print("erreurs de page :", erreurs[:5])
if erreurs: echecs.append("erreurs de page")
print(f"{len(echecs)} échec(s)" if echecs else "OK")
sys.exit(1 if echecs else 0)
