"""Île des Découvertes (livraison 3) : le bassin d'Octave (flotte ou coule), le puits et son nuage (le voyage de la
goutte), le petit volcan, les poubelles de tri, le camion des déchets. Octave salue depuis son rocher, au bord de
l'eau. Couleur de l'île : vert."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

VERT, VERT_F = "#34B37A", "#007D4B"
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"goutte": "A", "flotte": "B", "tri": "C", "volcan": "D", "dechets": "E"},
    "pastilles": {"goutte": (300, 560), "flotte": (812, 566), "tri": (560, 770), "volcan": (590, 474), "dechets": (940, 742)},
    "plume": (726, 330),
    "animes": ["octave"],
    # décor vivant (livraison 4) : le petit volcan fume en continu (bouffées posées par l'appli) ; sa surprise : une
    # grosse bouffée
    "vivant": {"hote": "octave", "fumeeLieu": [[596, 280]], "surprise": {"type": "volcan", "point": [596, 280]}},
}
COTE = C.crique(C.contour(seed=45, amp=(20, 14), ondes=(3, 2)))

def fougere(R, x, y, s=1.0, c="#3F9A4E"):
    for k, a in enumerate((-150, -120, -90, -60, -30)):
        t = math.radians(a)
        tip = (x + math.cos(t) * 34 * s, y + math.sin(t) * 30 * s)
        part(R, R.mask(leaf((x, y), tip, 9 * s, 0.12 * (1 if k % 2 else -1))), c, Mat(puff=2, line_w=0.9, tex=0.8), shadow=False)

def base(R):
    C.ciel_mer(R, nuages=((170, 104, 0.95, 10), (720, 84, 0.68, 11), (1030, 128, 0.85, 12)))
    C.ile(R, COTE, herbe=("#99D27A", "#6FBA5C"), seed=45)
    C.chemin(R, [([(352, 706), (334, 650), (322, 598)], 15), ([(300, 626), (420, 642), (510, 652), (560, 694)], 13),
                 ([(560, 694), (680, 646), (770, 598), (834, 570)], 12), ([(780, 600), (880, 652), (962, 706)], 12), ([(440, 640), (520, 540), (580, 470)], 10)], seed=61)
    for (x, y, rx, ry, sd) in ((1120, 562, 18, 12, 53), (862, 690, 13, 9, 54)):
        D.rock(R, x, y, rx, ry, seed=sd)
    D.palm(R, 1086, 502, 1.0, lean=-14, seed=15)
    D.palm(R, 214, 560, 0.88, lean=-8, seed=16)
    for (x, y, s) in ((470, 700, 0.9), (690, 716, 0.8), (1030, 590, 0.9), (730, 480, 0.8)):
        fougere(R, x, y, s)
    for (fx, fy, c) in ((420, 702, VERT), (640, 712, "#FFC145"), (520, 578, "#E85D9A")):
        D.flower_stem(R, fx, fy, c, h=14)

def remplissage(R, ident):
    if ident == "F":
        D.bush(R, 176, 618, 0.78, "#4E9E48", seed=46, flowers="#FFC145")
        fougere(R, 212, 606, 0.8)
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=47, flowers=VERT)
        fougere(R, x + 30, y, 0.8)

# ---------------------------------------------------------------------------- lieux
def goutte(R):
    """Le voyage de la goutte : le puits de pierre, son seau, et un petit nuage qui pleut au-dessus."""
    x, y = 318, 490
    D.ground_shadow(R, x + 8, y + 3, 70, 11, 0.26, dx=6, blur=5)
    margelle = R.mask(rrect(x - 56, y - 56, 112, 58, 12))
    pierres = m_union(*[R.mask(ellipse(x - 40 + (k % 4) * 27 + (k // 4) * 13, y - 40 + (k // 4) * 22, 12, 8)) for k in range(8)])
    part(R, margelle, "#C9C1B2", Mat(puff=8, profile="pillow", line_w=1.5, tex=1.0), decal=[(m_clip(pierres, margelle), "#B3AA98", 1.0)])
    part(R, R.mask(ellipse(x, y - 56, 54, 12)), "#3D6E8A", Mat(puff=4, line_w=1.2), shadow=False)
    for px in (x - 50, x + 50):
        part(R, R.mask(rrect(px - 5, y - 132, 10, 80, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    toit = R.mask(np.array([(x - 72, y - 124), (x, y - 166), (x + 72, y - 124), (x + 64, y - 116), (x, y - 152), (x - 64, y - 116)], float))
    part(R, toit, "#B5683F", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0))
    flat(R, R.line_mask([(x, y - 124), (x, y - 76)], 1.4, smooth_it=False), "#6B4A33")
    part(R, R.mask(rrect(x - 13, y - 82, 26, 22, 4)), "#3D8BEA", Mat(puff=4, spec=0.3, line_w=1.1))
    # le petit nuage qui pleut
    cx, cy = x + 98, y - 196
    nuage = m_fuse(m_union(*[R.mask(circle(cx + bx, cy + by, br)) for bx, by, br in ((0, 0, 24), (-24, 8, 17), (24, 8, 18), (-8, -14, 16), (12, -14, 15))]), 2 * R.S)
    part(R, nuage, "#FFFFFF", Mat(puff=12, line_w=1.3, tex=0.4), decal=[(R.mask(ellipse(cx, cy + 14, 40, 8)), "#DCE8F4", 4.0)])
    for k, (dx, dy) in enumerate(((-18, 40), (2, 52), (20, 38), (-6, 70))):
        g = R.mask(catmull([(cx + dx, cy + dy - 9), (cx + dx + 5, cy + dy + 2), (cx + dx, cy + dy + 6), (cx + dx - 5, cy + dy + 2)], n=6))
        part(R, g, "#5BB8E6", Mat(puff=3, spec=0.6, shin=40, line_w=0.9), shadow=False)

def flotte(R):
    """Flotte ou coule ? Le bassin de verre d'Octave : un canard et un bateau flottent, un caillou est au fond."""
    x, y = 842, 520
    D.ground_shadow(R, x + 10, y + 3, 120, 12, 0.26, dx=6, blur=5)
    part(R, R.mask(rrect(x - 116, y - 22, 232, 22, 6)), "#A8703F", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))
    vitre = R.mask(rrect(x - 104, y - 132, 208, 112, 10))
    eau = R.mask(rrect(x - 100, y - 96, 200, 74, 8))
    part(R, vitre, "#E4F6F8", Mat(puff=6, profile="pillow", line_w=1.6, spec=0.3, tex=0.3))
    def eau_alb(xx, yy, base):
        t = np.clip((yy - (y - 96)) / 74, 0, 1)[..., None]
        return mix(L("#8FD7E4"), L("#4FAFC6"), t)
    R.paint(eau, "#6CC4D6", Mat(puff=4, profile="pillow", line=False, tex=0.4), albedo=eau_alb)
    # caillou au fond
    D.rock(R, x + 46, y - 34, 18, 12, c="#9C968C", seed=48)
    # canard et bateau à la surface
    corps = R.mask(ellipse(x - 46, y - 100, 24, 13))
    part(R, m_union(corps, R.mask(circle(x - 30, y - 118, 11))), "#FFD24D", Mat(puff=6, spec=0.3, line_w=1.2), shadow=False)
    part(R, R.mask(np.array([(x - 20, y - 120), (x - 8, y - 116), (x - 20, y - 112)], float)), "#FF8E3C", Mat(puff=2, line_w=0.8), shadow=False)
    flat(R, R.mask(circle(x - 27, y - 121, 2.2)), "#273043")
    coque = R.mask(np.array([(x + 6, y - 104), (x + 54, y - 104), (x + 46, y - 92), (x + 14, y - 92)], float))
    part(R, coque, "#E8504A", Mat(puff=3, line_w=1.0), shadow=False)
    part(R, R.mask(np.array([(x + 28, y - 150), (x + 28, y - 106), (x + 50, y - 108)], float)), "#FFFDF4", Mat(puff=3, line_w=1.0), shadow=False)
    for k in range(3):
        flat(R, R.line_mask([(x - 90 + k * 64, y - 96), (x - 78 + k * 64, y - 100), (x - 66 + k * 64, y - 96)], 1.6), "#E4F6F8")
    # reflet de la vitre
    flat(R, R.line_mask([(x - 92, y - 124), (x - 92, y - 40)], 3.0, smooth_it=False), "#FFFFFF")

def volcan(R):
    """Le volcan d'Octave : un petit volcan qui fume, au fond de l'île."""
    x, y = 590, 410
    D.ground_shadow(R, x + 10, y + 3, 90, 12, 0.24, dx=6, blur=5)
    cone = R.mask(catmull([(x - 104, y), (x - 60, y - 60), (x - 26, y - 118), (x + 26, y - 118), (x + 60, y - 60), (x + 104, y)], n=8))
    def alb(xx, yy, base):
        t = np.clip((yy - (y - 118)) / 118, 0, 1)[..., None]
        return mix(L("#B3784A"), L("#8A5A36"), t)
    part(R, cone, "#9B6B43", Mat(puff=18, profile="pillow", line_w=1.6, tex=1.0), albedo=alb,
         decal=[(R.mask(catmull([(x - 26, y - 118), (x + 26, y - 118), (x + 18, y - 92), (x + 6, y - 104), (x - 6, y - 84), (x - 18, y - 102)], n=5)), "#FF7F50", 1.5)])
    part(R, R.mask(ellipse(x, y - 118, 26, 7)), "#E8504A", Mat(puff=3, line_w=1.1), shadow=False)
    pied = m_clip(m_wobble(R.mask(rrect(x - 110, y - 26, 220, 30, 8)), 2.0 * R.S, 14 * R.S, seed=49), cone)
    R.paint(pied, "#7FBF63", Mat(puff=4, profile="pillow", line=False, tex=0.9))
    # sa fumée monte en bouffées : l'appli les pose et les anime (décor vivant, livraison 4)

def tri(R):
    """Le grand tri : quatre poubelles de couleur, couvercles et pictogrammes."""
    x, y = 560, 700
    D.ground_shadow(R, x + 8, y + 3, 132, 12, 0.26, dx=6, blur=5)
    for k, c in enumerate(("#FFC145", "#34B37A", "#3D8BEA", "#8B5A35")):
        bx = x - 96 + k * 64
        corps = R.mask(catmull([(bx - 27, y - 92), (bx + 27, y - 92), (bx + 23, y - 2), (bx - 23, y - 2)], n=4))
        part(R, corps, c, Mat(puff=8, profile="pillow", line_w=1.4, tex=0.9),
             decal=[(m_union(*[R.mask(rrect(bx - 19 + j * 13, y - 80, 4, 68, 2)) for j in range(4)]), tweak(L(c), dl=-0.06), 0.6)])
        part(R, R.mask(rrect(bx - 30, y - 106, 60, 15, 6)), tweak(L(c), dl=-0.08), Mat(puff=4, profile="pillow", line_w=1.3))
        part(R, R.mask(rrect(bx - 9, y - 114, 18, 8, 3)), tweak(L(c), dl=-0.16), Mat(puff=2, line_w=1.0), shadow=False)
        part(R, R.mask(circle(bx, y - 50, 12)), "#FFFDF4", Mat(puff=3, line_w=1.0), shadow=False)
        # flèches du recyclage, en petit
        for j in range(3):
            a = math.radians(-90 + j * 120)
            flat(R, R.line_mask([(bx + math.cos(a) * 6.5, y - 50 + math.sin(a) * 6.5), (bx + math.cos(a + 1.5) * 6.5, y - 50 + math.sin(a + 1.5) * 6.5)], 2.0), c)

def dechets(R):
    """Le voyage des déchets : le camion vert du ramassage, garé près de l'île."""
    x, y = 932, 686
    R.push(Affine.T(x, y) @ Affine.S(0.86) @ Affine.T(-x, -y))
    D.ground_shadow(R, x + 8, y + 2, 110, 10, 0.26, dx=6, blur=5)
    benne = R.mask(rrect(x - 104, y - 92, 136, 74, 10))
    part(R, benne, VERT, Mat(puff=10, profile="pillow", line_w=1.5, tex=0.9),
         decal=[(m_union(*[R.mask(rrect(x - 96 + j * 30, y - 84, 4, 58, 2)) for j in range(4)]), "#2B9468", 0.5)])
    cabine = R.mask(catmull([(x + 34, y - 18), (x + 34, y - 76), (x + 72, y - 76), (x + 96, y - 46), (x + 96, y - 18)], n=6))
    part(R, cabine, "#FFFDF4", Mat(puff=8, profile="pillow", line_w=1.5, tex=0.8))
    part(R, R.mask(catmull([(x + 44, y - 70), (x + 68, y - 70), (x + 86, y - 48), (x + 44, y - 48)], n=4)), "#BFE8EE", Mat(puff=3, spec=0.6, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(x - 110, y - 26, 210, 12, 4)), "#5B6475", Mat(puff=3, line_w=1.0))
    for wx in (x - 70, x - 4, x + 66):
        part(R, R.mask(circle(wx, y - 12, 17)), "#2E3445", Mat(puff=6, line_w=1.3))
        part(R, R.mask(circle(wx, y - 12, 7)), "#C9CED8", Mat(puff=3, line_w=0.9), shadow=False)
    # symbole du recyclage sur la benne
    part(R, R.mask(circle(x - 36, y - 56, 20)), "#FFFDF4", Mat(puff=3, line_w=1.0), shadow=False)
    for j in range(3):
        a = math.radians(-90 + j * 120)
        flat(R, R.line_mask([(x - 36 + math.cos(a) * 11, y - 56 + math.sin(a) * 11), (x - 36 + math.cos(a + 1.6) * 11, y - 56 + math.sin(a + 1.6) * 11)], 3.0), VERT)
    R.pop()

def anime(R, nom):
    if nom == "octave":
        # Octave sur son rocher, dans la crique, au pied du puits
        x, y = 250, 694
        D.rock(R, x + 4, y + 42, 60, 24, c="#A9A398", seed=50)
        HT.octave(R, x, y + 26 - 140 * 0.44, 0.44, expr="content", salut=True)
        for k in range(3):
            xx = x - 66 + k * 46
            flat(R, R.line_mask([(xx, y + 68), (xx + 11, y + 62), (xx + 22, y + 68), (xx + 33, y + 62)], 2.4), "#F2FBF8")
    else:
        raise KeyError(nom)

def lieu(R, activite):
    {"goutte": goutte, "flotte": flotte, "volcan": volcan, "tri": tri, "dechets": dechets}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
