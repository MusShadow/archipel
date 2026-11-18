#!/usr/bin/env python3
"""Imagier d'Archipel 2 : les images d'exercice (environ 200), dans la finition album, à partir d'une base libre.

Base : Fluent Emoji de Microsoft (licence MIT), dessins « Color » en SVG. L'atelier les restyle comme le reste
de l'appli : aplats peints, trait coloré au bord, texture gouache, lumière dorée. Même source, même image.

  python3 scripts/illustration/imagier.py [chemin du dépôt fluentui-emoji]

Le dépôt source est cloné au besoin (sans les images 3D, trop lourdes) dans IMAGIER_SOURCE
(par défaut ~/.cache/archipel/fluentui-emoji), à la version FLUENT_VERSION ci-dessous.
Sortie : public/imagier/<nom>.webp (320 x 320), public/imagier/LICENCE-fluentui-emoji.txt, src/imagier.ts.
Prérequis : numpy, opencv-python-headless, pillow, playwright (Chrome) pour lire les SVG."""
import base64, json, os, pathlib, re, subprocess, sys, zlib
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from moteur import to_lin, to_srgb, value_noise, smooth, mix, tweak, lin2lab, L

RACINE = pathlib.Path(__file__).resolve().parents[2]
SORTIE = RACINE / "public/imagier"
FLUENT_DEPOT = "https://github.com/microsoft/fluentui-emoji.git"
FLUENT_VERSION = "1ffb34c752ecf5d402f04cfb4b392c77f57c54bc"  # 24 août 2026
TAILLE, TRAVAIL = 320, 512

# Les emoji de l'appli : tout ce qui est écrit dans src/ (lexique, activités, écrans), hors fichiers générés.
def inventaire():
    import unicodedata
    vus = {}
    for f in sorted((RACINE / "src").rglob("*.ts")):
        if f.name in ("imagier.ts", "illustrations.ts", "art_static.ts"):
            continue
        texte = f.read_text(encoding="utf-8")
        i = 0
        while i < len(texte):
            c = texte[i]
            if _pictographique(c):
                j = i + 1
                while j < len(texte) and (texte[j] in "️⃣" or (texte[j] == "‍" and j + 1 < len(texte) and _pictographique(texte[j + 1]))):
                    j += 2 if texte[j] == "‍" else 1
                vus.setdefault(texte[i:j], set()).add(str(f.relative_to(RACINE)))
                i = j
            else:
                i += 1
    return vus

# Caractères « pictographiques » (propriété Unicode Extended_Pictographic), sans les symboles de texte (★, ➜…).
_DINGBATS = {0x2702, 0x2705, 0x2708, 0x2709, 0x270A, 0x270B, 0x270C, 0x270D, 0x270F, 0x2712, 0x2714, 0x2716, 0x271D, 0x2721,
             0x2728, 0x2733, 0x2734, 0x2744, 0x2747, 0x274C, 0x274E, 0x2753, 0x2754, 0x2755, 0x2757, 0x2763, 0x2764,
             0x2765, 0x2766, 0x2767, 0x2795, 0x2796, 0x2797, 0x27A1, 0x27B0, 0x27BF}
def _pictographique(c):
    o = ord(c)
    if 0x1F000 <= o <= 0x1FAFF:
        return not (0x1F3FB <= o <= 0x1F3FF)  # pas les modificateurs de couleur de peau
    if 0x2600 <= o <= 0x26FF:
        return o not in (0x2605, 0x2606)
    return o in _DINGBATS or o in (0x2B50, 0x2B55, 0x2B1B, 0x2B1C, 0x23F0, 0x23F3, 0x231A, 0x231B)

norm = lambda s: s.replace("️", "").replace("⃣", "")

def source(chemin=None):
    """Dépôt fluentui-emoji : métadonnées de toutes les images, SVG « Color » de celles dont on a besoin."""
    d = pathlib.Path(chemin or os.environ.get("IMAGIER_SOURCE", pathlib.Path.home() / ".cache/archipel/fluentui-emoji"))
    if not (d / ".git").exists():
        d.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--filter=blob:none", "--no-checkout", FLUENT_DEPOT, str(d)], check=True)
    subprocess.run(["git", "-C", str(d), "sparse-checkout", "init", "--no-cone"], check=True, capture_output=True)
    (d / ".git/info/sparse-checkout").write_text("/assets/*/metadata.json\n/LICENSE\n")
    subprocess.run(["git", "-C", str(d), "checkout", "-q", FLUENT_VERSION], check=True)
    return d

def correspondance(d, emojis):
    par_glyphe = {}
    for m in sorted((d / "assets").glob("*/metadata.json")):
        meta = json.loads(m.read_text(encoding="utf-8"))
        par_glyphe[norm(meta["glyph"])] = (m.parent.name, meta)
    arbre = subprocess.run(["git", "-C", str(d), "ls-tree", "-r", "--name-only", "HEAD", "assets"], capture_output=True, text=True, check=True).stdout.splitlines()
    svg = {}
    for p in arbre:
        parts = p.split("/")
        if p.endswith(".svg") and (parts[2] == "Color" or p.split("/")[2:4] == ["Default", "Color"]):
            svg.setdefault(parts[1], p)
    res, manque = {}, []
    for e in sorted(emojis, key=norm):
        g = par_glyphe.get(norm(e))
        if not g or g[0] not in svg:
            manque.append(e)
            continue
        dossier, meta = g
        nom = re.sub(r"[^a-z0-9]+", "-", dossier.lower()).strip("-")
        res[e] = {"dossier": dossier, "svg": svg[dossier], "nom": nom, "cldr": meta.get("cldr", dossier.lower())}
    if manque:
        raise SystemExit(f"Emoji sans image dans Fluent Emoji : {' '.join(manque)}")
    # ne télécharge que les SVG utilisés
    lignes = ["/assets/*/metadata.json", "/LICENSE"] + sorted({"/" + v["svg"] for v in res.values()})
    (d / ".git/info/sparse-checkout").write_text("\n".join(lignes) + "\n")
    subprocess.run(["git", "-C", str(d), "checkout", "-q", FLUENT_VERSION], check=True)
    return res

def rasteriser(d, res):
    """Lit chaque SVG dans Chrome (fond transparent, 512 px)."""
    from playwright.sync_api import sync_playwright
    out = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        pg = b.new_page(viewport={"width": TRAVAIL, "height": TRAVAIL})
        for e, v in res.items():
            data = base64.b64encode((d / v["svg"]).read_bytes()).decode()
            pg.set_content(f'<html><body style="margin:0;background:transparent"><img id="i" src="data:image/svg+xml;base64,{data}" '
                           f'style="width:{TRAVAIL}px;height:{TRAVAIL}px;display:block"></body></html>')
            pg.wait_for_function("document.getElementById('i').complete")
            png = pg.screenshot(omit_background=True)
            im = np.asarray(Image.open(__import__("io").BytesIO(png)).convert("RGBA"), np.float32) / 255
            out[e] = im
        b.close()
    return out

def album(rgba, seed):
    """Finition album : aplats peints, texture gouache, trait coloré au bord et entre les couleurs franches."""
    rgb, a = to_lin(rgba[..., :3]), rgba[..., 3]
    s8 = (to_srgb(rgb) * 255).astype(np.uint8)
    st = cv2.stylization(s8, sigma_s=40, sigma_r=0.35)
    rgb = mix(rgb, to_lin(st.astype(np.float32) / 255), 0.65)
    h, w = a.shape
    mo = value_noise(h, w, 30, seed, 4, 0.55)
    gr = value_noise(h, w, 1.2, seed + 1, 2, 0.6)
    br = value_noise(h, w, 8, seed + 2, 3, 0.5, (2.5, 0.7))
    rgb = rgb * (1 + 0.20 * (mo - 0.5) + 0.08 * (gr - 0.5) + 0.10 * (br - 0.5))[..., None]
    D = cv2.distanceTransform((a > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    rgb = rgb * (1 - 0.12 * smooth(10, 0, D))[..., None]
    lab = lin2lab(rgb)
    gx = cv2.Sobel(lab[..., 0], cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lab[..., 0], cv2.CV_32F, 0, 1, ksize=3)
    g = np.sqrt(gx ** 2 + gy ** 2)
    inner = smooth(0.25, 0.6, cv2.GaussianBlur(g, (0, 0), 0.8)) * (D > 6)
    dark = tweak(rgb, dl=-0.28, sat=1.1, dh=-6)
    rgb = mix(rgb, dark, (inner * 0.55)[..., None])
    rgb = mix(rgb, dark, (smooth(5.5, 3.5, D) * 0.95)[..., None])
    # lumière dorée de l'album
    rgb = tweak(np.clip(rgb, 0, 4), sat=1.05) * np.array([1.045, 1.0, 0.93], np.float32)
    return np.dstack([to_srgb(rgb), a])

def graine(nom):
    """Graine tirée du nom de l'image : ajouter ou retirer un emoji ne change aucune autre image."""
    return zlib.crc32(nom.encode("utf-8")) % 1_000_003

def ecrire(res, images):
    SORTIE.mkdir(parents=True, exist_ok=True)
    for e, v in sorted(res.items(), key=lambda kv: kv[1]["nom"]):
        im = album(images[e], seed=graine(v["nom"]))
        im = cv2.resize(im, (TAILLE, TAILLE), interpolation=cv2.INTER_AREA)
        px = (np.clip(im, 0, 1) * 255 + 0.5).astype(np.uint8)
        Image.fromarray(px, "RGBA").save(SORTIE / f"{v['nom']}.webp", "WEBP", quality=84, alpha_quality=90, method=6)
    # fichiers qui ne servent plus
    garder = {f"{v['nom']}.webp" for v in res.values()}
    for f in SORTIE.glob("*.webp"):
        if f.name not in garder:
            f.unlink()

def licence(d):
    texte = (d / "LICENSE").read_text(encoding="utf-8")
    (SORTIE / "LICENCE-fluentui-emoji.txt").write_text(
        "Imagier d'Archipel 2 : images dérivées de Fluent Emoji (https://github.com/microsoft/fluentui-emoji),\n"
        f"version {FLUENT_VERSION}. Modifications : rendu en 320 x 320, finition « album illustré »\n"
        "(aplats, texture, trait coloré, lumière) par scripts/illustration/imagier.py.\n\n"
        "Licence d'origine, qui s'applique à ces images :\n\n" + "\n".join(l.strip() for l in texte.splitlines()) + "\n", encoding="utf-8")

def ecrire_ts(res, vus):
    lignes = [
        "// Généré par scripts/illustration/imagier.py : ne pas modifier à la main.",
        "// Imagier : chaque emoji de l'appli a son image dans la finition album (base Fluent Emoji, licence MIT,",
        "// voir public/imagier/LICENCE-fluentui-emoji.txt). Les écrans les utilisent à la place des emoji, île par île.",
        "export interface ImageImagier { fichier: string; nom: string }",
        "export const IMAGIER: Record<string, ImageImagier> = {",
    ]
    for e, v in sorted(res.items(), key=lambda kv: kv[1]["nom"]):
        lignes.append(f"  {json.dumps(norm(e), ensure_ascii=False)}: {{ fichier: \"imagier/{v['nom']}.webp\", nom: {json.dumps(v['cldr'], ensure_ascii=False)} }},")
    lignes += ["};", "export const sansVariante = (e: string) => e.replace(/[\\uFE0F\\u20E3]/g, \"\");",
               "export const imageImagier = (e: string): ImageImagier | undefined => IMAGIER[sansVariante(e)];", ""]
    (RACINE / "src/imagier.ts").write_text("\n".join(lignes), encoding="utf-8")

if __name__ == "__main__":
    vus = inventaire()
    print(f"{len(vus)} emoji dans src/")
    d = source(sys.argv[1] if len(sys.argv) > 1 else None)
    res = correspondance(d, list(vus))
    images = rasteriser(d, res)
    ecrire(res, images)
    licence(d)
    ecrire_ts(res, vus)
    print(f"Imagier : {len(res)} images dans public/imagier/")
