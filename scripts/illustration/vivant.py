"""Décor vivant des îles (livraison 4).

- Les petits sujets que l'appli pose et anime sur tous les écrans d'île : l'étincelle sur la mer, la bouffée de fumée,
  deux papillons ; et ceux des surprises (une à la fois, toutes les 20 à 60 secondes) : le dauphin et ses gerbes, la
  baleine au loin et son souffle, les oiseaux (deux poses d'ailes), le poisson de l'étang, les cœurs, le voilier,
  l'arc-en-ciel, le ballon de Rico. Chacun est un élément à part (ELEMENTS, dossier vivant/).
- Les calques propres à chaque île sont rendus par fabriquer.py à partir de ce que le fond a noté (decors.noter) :
  les nuages, les palmes des palmiers, les deux jeux de reflets sur la mer ; et les variantes « yeux fermés » des hôtes.
- Les places de ces sujets (étincelles, dauphin, baleine, papillons) sont choisies ici, sur la mer ou sur l'herbe
  libre, loin des lieux, des étiquettes et de Plume, et dans la partie du dessin visible en portrait."""
import math
import numpy as np
import cv2
from moteur import *
from personnages import part, flat, leaf, INK
import decors as D
import creatures as C
from ile_commun import coeur
from jeux_decouvertes import glacis

W, H = D.W, D.H
HORIZON = 236
VISIBLE = (160, 1034)   # en portrait, le dessin est rogné de 12 % de chaque côté : x de 143 à 1051 reste visible

# ---------------------------------------------------------------------------- sujets communs (éléments)
def etincelle(R):
    C.sparkle(R, 20, 20, 9)

def bouffee(R):
    C.puff(R, 30, 30, 13)

def dauphin(R):
    C.dolphin(R, 102, 48, 1.0)

def gerbe(R):
    C.splash(R, 40, 38, 1.0)

def baleine(R):
    C.whale_back(R, 40, 22, 1.25)

def souffle(R):
    C.whale_spout(R, 22, 46, 1.25)

def oiseau(R, pose):
    C.bird(R, 30, 14, 1.15, frame=pose)

def poisson(R):
    C.fish(R, 31, 16, 1.2)

def papillon(R, couleur):
    D.butterfly(R, 20, 20, couleur, 1.25)

def petit_coeur(R):
    m = R.mask(coeur(20, 19, 15))
    part(R, m, "#F25C7A", Mat(puff=6, spec=0.45, shin=36, line_w=1.3), decal=[(R.mask(ellipse(14, 13, 4, 3)), "#FFFFFF", 1.2)])

def voilier(R):
    x, y = 46, 70
    part(R, R.mask(rrect(x - 1.5, y - 60, 3, 56, 1.5)), "#8E5F37", Mat(puff=2, line_w=0.8))
    part(R, R.mask(np.array([(x + 3, y - 58), (x + 32, y - 10), (x + 3, y - 8)], float)), "#FFF4E2", Mat(puff=5, profile="pillow", line_w=1.2, tex=0.8))
    part(R, R.mask(np.array([(x - 3, y - 50), (x - 22, y - 10), (x - 3, y - 8)], float)), "#FFD9C2", Mat(puff=4, profile="pillow", line_w=1.1, tex=0.8))
    part(R, R.mask(catmull([(x - 32, y - 6), (x + 36, y - 7), (x + 26, y + 8), (x - 24, y + 8)], n=6)), "#1FA9B5", Mat(puff=6, profile="pillow", line_w=1.3, spec=0.1))
    flat(R, R.line_mask([(x - 30, y + 11), (x + 30, y + 11)], 1.6, smooth_it=False), "#DDF4F4")

def arc_en_ciel(R):
    cx, cy = 210, 170
    for k, c in enumerate(("#E5483B", "#FF9A3C", "#FFD24D", "#7CC062", "#3D8BEA", "#8C6BE0")):
        r0 = 150 - k * 11
        bande = m_sub(R.mask(ellipse(cx, cy, r0, r0 * 0.92)), R.mask(ellipse(cx, cy, r0 - 11, (r0 - 11) * 0.92)),
                      R.mask(np.array([(0, cy - 4), (420, cy - 4), (420, 200), (0, 200)], float)))
        glacis(R, bande, c, 0.7, flou=1.5)

def ballon(R):
    """Le ballon de Rico : violet, un point d'interrogation blanc, une ficelle qui ondule."""
    x, y = 30, 32
    flat(R, R.line_mask([(x, y + 30), (x - 4, y + 42), (x + 3, y + 54), (x - 2, y + 66)], 1.4), "#5B6475")
    part(R, R.mask(np.array([(x - 4, y + 31), (x + 4, y + 31), (x, y + 25)], float)), "#7A57D1", Mat(puff=2, line_w=0.9), shadow=False)
    corps = R.mask(catmull([(x, y - 27), (x + 20, y - 18), (x + 23, y), (x + 13, y + 20), (x, y + 27), (x - 13, y + 20), (x - 23, y), (x - 20, y - 18)], n=8))
    part(R, corps, "#8C6BE0", Mat(puff=12, spec=0.5, shin=36, line_w=1.4), decal=[(R.mask(ellipse(x - 9, y - 12, 6, 8, 25)), "#FFFFFF", 2.5)])
    flat(R, D.text_mask(R, "?", x + 1, y + 2, 26), "#FFFFFF")

ELEMENTS = {
    "vivant/etincelle": dict(cadre=(40, 40), dessin=etincelle),
    "vivant/bouffee": dict(cadre=(60, 56), dessin=bouffee),
    "vivant/dauphin": dict(cadre=(204, 96), dessin=dauphin),
    "vivant/gerbe": dict(cadre=(80, 48), dessin=gerbe),
    "vivant/baleine": dict(cadre=(80, 32), dessin=baleine),
    "vivant/souffle": dict(cadre=(44, 52), dessin=souffle),
    "vivant/oiseau-0": dict(cadre=(60, 32), dessin=lambda R: oiseau(R, 0)),
    "vivant/oiseau-1": dict(cadre=(60, 32), dessin=lambda R: oiseau(R, 1)),
    "vivant/poisson": dict(cadre=(60, 32), dessin=poisson),
    "vivant/papillon-jaune": dict(cadre=(40, 40), dessin=lambda R: papillon(R, "#FFC145")),
    "vivant/papillon-rose": dict(cadre=(40, 40), dessin=lambda R: papillon(R, "#F6A3C0")),
    "vivant/coeur": dict(cadre=(40, 38), dessin=petit_coeur),
    "vivant/voilier": dict(cadre=(92, 88), dessin=voilier),
    "vivant/arc-en-ciel": dict(cadre=(420, 200), dessin=arc_en_ciel),
    "vivant/ballon": dict(cadre=(60, 104), dessin=ballon),
}

# ---------------------------------------------------------------------------- calques propres à une île
def _cote(pts):
    """Le contour de l'île, avec son flanc (comme ile_commun.ile) : l'île vue d'un peu au-dessus."""
    top = catmull(list(pts), n=16)
    return np.vstack([top] + [top + [0, dy] for dy in (10, 20, 30, 38)])

def occupe(note, marge=40):
    """Carte (H x W, en px CSS) de ce qui n'est pas de la mer libre : les îles (et leur eau claire), les objets sur la mer."""
    m = np.zeros((H, W), np.uint8)
    for pts in note.get("iles", []):
        top = np.round(catmull(list(pts), n=16)).astype(np.int32)
        for dy in (0, 10, 20, 30, 38):
            cv2.fillPoly(m, [top + [0, dy]], 1)
    for (x0, y0, x1, y1) in note.get("obstacles", []):
        m[max(0, y0):y1, max(0, x0):x1] = 1
    if marge:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * marge + 1, 2 * marge + 1))
        m = cv2.dilate(m, k)
    m[:HORIZON + 8] = 1   # le ciel et la ligne d'horizon
    return m.astype(bool)

def reflets(R, note, graine):
    """Traits de lumière sur la mer libre (comme decors.sea, avec une autre graine) : deux jeux qui s'éteignent l'un
    après l'autre font onduler la mer."""
    libre = ~occupe(note, marge=34)
    r = D.rng(graine)
    traits = []
    for i in range(80):
        yy = HORIZON + 12 + (r.random() ** 1.6) * (H - HORIZON - 20)
        xx = r.random() * W
        ln = 12 + 34 * (yy - HORIZON) / (H - HORIZON) * r.random() + 8
        if not (libre[int(min(H - 1, yy)), int(min(W - 1, xx))] and libre[int(min(H - 1, yy)), int(min(W - 1, xx + ln))]):
            continue
        thick = 1.2 + 2.2 * (yy - HORIZON) / (H - HORIZON)
        traits.append(R.line_mask([(xx, yy), (xx + ln / 2, yy - 0.8), (xx + ln, yy)], thick))
    if traits:
        R.paint(m_union(*traits), "#C8F2F2", Mat(flat=True))

def garder(R, masque):
    """Ne garde que ce qui est dans le masque (le reste redevient le fond du rendu) : un visage seul, par exemple."""
    a = cv2.GaussianBlur(masque.to((0, 0, R.w, R.h)), (0, 0), 1.5 * R.S)[..., None]
    R.img = R.img * a + R.fond * (1 - a)

# ---------------------------------------------------------------------------- places des sujets
def _loin(p, autres, d):
    return all(math.hypot(p[0] - q[0], p[1] - q[1]) >= d for q in autres)

def places_mer(note, n, graine, eviter=(), ecart=150):
    """n points sur la mer libre, visibles en portrait, bien espacés (les étincelles)."""
    libre = ~occupe(note, marge=26)
    r = np.random.default_rng(graine)
    pts = []
    for _ in range(4000):
        x, y = int(r.uniform(*VISIBLE)), int(r.uniform(HORIZON + 22, H - 30))
        if libre[y, x] and _loin((x, y), pts, ecart) and _loin((x, y), eviter, 90):
            pts.append((x, y))
            if len(pts) == n:
                break
    return [[int(x), int(y)] for x, y in pts]

def place_saut(note, eviter, l=170, haut=96, y_eau=286, viser=470):
    """Le point d'eau du dauphin : sous lui, la mer ; au-dessus, la mer du large et le ciel (rien de l'île)."""
    o = occupe(note, marge=8)
    o[:HORIZON + 8] = False   # il peut sauter devant le ciel
    best = None
    for x in range(VISIBLE[0] + l // 2, VISIBLE[1] - l // 2, 6):
        zone = o[y_eau - haut:y_eau + 10, x - l // 2:x + l // 2]
        if zone.any() or not _loin((x, y_eau), eviter, 150):
            continue
        if best is None or abs(x - viser) < abs(best - viser):
            best = x
    return [int(best), y_eau] if best is not None else None

def place_baleine(note, eviter, y=262, viser=640):
    o = occupe(note, marge=6)
    best = None
    for x in range(VISIBLE[0] + 60, VISIBLE[1] - 60, 6):
        if o[y - 4:y + 12, x - 40:x + 40].any() or not _loin((x, y), eviter, 120):
            continue
        if best is None or abs(x - viser) < abs(best - viser):
            best = x
    return [int(best), y] if best is not None else None

def places_papillons(note, boites, eviter, graine=7):
    """Deux points sur l'herbe libre de l'île, loin des lieux, des étiquettes, de Plume et de l'hôte."""
    ile = np.zeros((H, W), np.uint8)
    for pts in note.get("iles", []):
        cv2.fillPoly(ile, [np.round(catmull(list(pts), n=16)).astype(np.int32)], 1)
    ile = cv2.erode(ile, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61))).astype(bool)
    r = np.random.default_rng(graine)
    pts = []
    for _ in range(6000):
        x, y = int(r.uniform(VISIBLE[0] + 40, VISIBLE[1] - 40)), int(r.uniform(360, 700))
        if not ile[y, x] or not _loin((x, y), eviter, 110) or not _loin((x, y), pts, 320):
            continue
        if any(bx - 30 <= x <= bx + bw + 30 and by - 30 <= y <= by + bh + 30 for bx, by, bw, bh in boites):
            continue
        pts.append((x, y))
        if len(pts) == 2:
            break
    return [[int(x), int(y)] for x, y in pts]
