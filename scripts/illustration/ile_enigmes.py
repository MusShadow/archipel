"""Île des Énigmes (livraison 3) : le jardin des formes de Rico, le chemin de Bip (un damier de dalles avec ses
flèches), le cadre à perles des motifs. Rico salue sur le chemin ; la tour au point d'interrogation veille au fond.
Couleur de l'île : violet."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

VIOLET, VIOLET_F, VIOLET_C = "#8C6BE0", "#7959C6", "#E6DEFA"
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"formes": "A", "bip": "B", "motifs": "C"},
    "pastilles": {"formes": (290, 544), "bip": (842, 620), "motifs": (560, 758)},
    "plume": (726, 330),
    "animes": ["rico"],
    # décor vivant (livraison 4) : un ballon point d'interrogation s'envole au-dessus de l'île
    "vivant": {"hote": "rico", "surprise": {"type": "ballon", "point": [600, 300]}},
}
COTE = C.contour(seed=33, amp=(16, 16), ondes=(4, 3))

def cristal(R, x, y, h=26, c=VIOLET):
    m = R.mask(np.array([(x - 7, y), (x - 6, y - h * 0.7), (x, y - h), (x + 6, y - h * 0.7), (x + 7, y)], float))
    part(R, m, c, Mat(puff=3, spec=0.6, shin=40, line_w=1.0), decal=[(R.mask(np.array([(x - 2, y - h * 0.2), (x - 1, y - h * 0.8), (x + 1, y - h * 0.6)], float)), "#FFFFFF", 1.0)])

def base(R):
    C.ciel_mer(R, nuages=((130, 120, 0.85, 7), (760, 92, 0.75, 8), (1060, 140, 0.7, 9)))
    C.ile(R, COTE, herbe=("#A2D481", "#7FC066"), seed=33)
    C.chemin(R, [([(356, 724), (340, 660), (330, 600)], 15), ([(300, 628), (420, 640), (500, 650), (560, 692)], 13),
                 ([(560, 692), (680, 646), (770, 600), (836, 572)], 12), ([(470, 640), (520, 560), (590, 470)], 10)], seed=59)
    for (x, y, rx, ry, sd) in ((100, 524, 20, 14, 41), (124, 542, 12, 8, 42), (1120, 562, 18, 12, 43), (868, 688, 13, 9, 44)):
        D.rock(R, x, y, rx, ry, c="#B7AFC9", seed=sd)
    D.palm(R, 1082, 504, 0.98, lean=-14, seed=14)
    for (x, y, h, c) in ((150, 596, 24, VIOLET), (166, 602, 16, "#B9A4F2"), (1040, 600, 22, "#B9A4F2"), (1056, 606, 14, VIOLET), (720, 700, 18, "#D5C8F8")):
        cristal(R, x, y, h, c)
    for (fx, fy, c) in ((430, 700, VIOLET), (700, 712, "#FFC145"), (520, 574, "#E85D9A"), (1010, 560, VIOLET)):
        D.flower_stem(R, fx, fy, c, h=14)

def tour(R, x=590, y=404):
    """La tour aux énigmes (même repère que sur la carte), dans l'emplacement D tant qu'il est libre."""
    D.ground_shadow(R, x + 10, y + 3, 62, 12, 0.26, dx=6, blur=5)
    corps = R.mask(catmull([(x - 46, y), (x - 42, y - 128), (x + 42, y - 128), (x + 46, y)], n=4))
    part(R, corps, VIOLET, Mat(puff=14, line_w=1.6, tex=0.9),
         decal=[(m_union(*[R.mask(rrect(x - 50, y - 128 + k * 30, 100, 3.5, 0)) for k in range(1, 4)]), VIOLET_F, 0.4)])
    for k in range(5):
        part(R, R.mask(rrect(x - 46 + k * 20, y - 146, 13, 20, 3)), VIOLET, Mat(puff=4, line_w=1.2))
    part(R, R.mask(rrect(x - 14, y - 54, 28, 54, 12)), "#543F8A", Mat(puff=4, line_w=1.2), shadow=False)
    part(R, R.mask(rrect(x - 2.5, y - 210, 5, 66, 2)), "#8E5F37", Mat(puff=2, line_w=0.9))
    part(R, R.mask(np.array([(x + 3, y - 210), (x + 58, y - 196), (x + 3, y - 180)], float)), "#FFC145", Mat(puff=4, line_w=1.1))
    part(R, R.mask(circle(x, y - 92, 22)), "#FFFDF4", Mat(puff=5, line_w=1.2), shadow=False)
    flat(R, D.text_mask(R, "?", x, y - 92, 32), "#543F8A")

def remplissage(R, ident):
    if ident == "D":
        tour(R)
    elif ident == "E":
        D.bush(R, 984, 636, 0.9, seed=36, flowers=VIOLET)
        cristal(R, 1024, 652, 20, "#B9A4F2")
    elif ident == "F":
        D.bush(R, 172, 614, 0.74, "#56A84A", seed=37, flowers="#FFC145")
        cristal(R, 206, 622, 18, VIOLET)
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=38, flowers=VIOLET)

# ---------------------------------------------------------------------------- lieux
def formes(R):
    """Les formes de Rico : un rond, un triangle, un carré et une étoile peints, debout sur un muret."""
    x, y = 318, 486
    D.ground_shadow(R, x + 8, y + 3, 140, 12, 0.26, dx=6, blur=5)
    muret = R.mask(rrect(x - 150, y - 26, 300, 28, 8))
    pierres = m_union(*[R.line_mask([(x - 150 + k * 50, y - 26), (x - 150 + k * 50, y + 2)], 1.6, smooth_it=False) for k in range(1, 6)])
    part(R, muret, "#D6C7A8", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), decal=[(m_clip(pierres, muret), "#B9A988", 0.4)])
    # rond bleu
    part(R, R.mask(circle(x - 104, y - 74, 40)), "#3D8BEA", Mat(puff=12, profile="pillow", line_w=1.5, tex=0.8), decal=[(R.mask(circle(x - 116, y - 88, 12)), "#7DB4F2", 4.0)])
    # triangle jaune
    tri = R.mask(catmull([(x - 46, y - 28), (x - 2, y - 122), (x + 42, y - 28)], n=3))
    part(R, tri, "#FFC145", Mat(puff=10, profile="pillow", line_w=1.5, tex=0.8))
    # carré vert
    part(R, R.mask(rrect(x + 52, y - 104, 74, 76, 8)), "#34B37A", Mat(puff=10, profile="pillow", line_w=1.5, tex=0.8))
    # étoile corail, plus petite, sur le bout du muret
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = 30 if k % 2 == 0 else 13
        pts.append((x + 144 + math.cos(a) * rr, y - 62 + math.sin(a) * rr))
    part(R, R.mask(catmull(pts, n=3)), "#FF7F50", Mat(puff=6, profile="pillow", line_w=1.3, tex=0.8))

def bip(R):
    """Le chemin de Bip : un damier de dalles, des flèches peintes, le drapeau d'arrivée, et Bip au départ."""
    x, y = 842, 520
    cases = []
    for i in range(4):          # colonnes (vers la droite)
        for j in range(3):      # rangées (vers le fond)
            cx = x - 112 + i * 62 + j * 18
            cy = y - 20 - j * 34
            cases.append((cx, cy, (i + j) % 2))
    D.ground_shadow(R, x + 10, y + 2, 150, 14, 0.24, dx=6, blur=5)
    for (cx, cy, k) in sorted(cases, key=lambda c: c[1]):
        dalle = R.mask(np.array([(cx - 28, cy + 14), (cx + 26, cy + 14), (cx + 40, cy - 16), (cx - 12, cy - 16)], float))
        part(R, dalle, "#E6DEFA" if k else "#FFFDF4", Mat(puff=3, profile="pillow", line_w=1.2, tex=0.7))
    # flèches peintes (deux à droite, une vers le fond)
    for (cx, cy) in ((x - 112 + 62 + 0, y - 20), (x - 112 + 124 + 0, y - 20)):
        fl = R.mask(np.array([(cx - 14, cy - 4), (cx + 4, cy - 4), (cx + 4, cy - 10), (cx + 16, cy), (cx + 4, cy + 10), (cx + 4, cy + 4), (cx - 14, cy + 4)], float))
        part(R, fl, VIOLET, Mat(puff=2, line_w=0.9), shadow=False)
    # drapeau d'arrivée sur la dernière dalle
    gx, gy = x - 112 + 3 * 62 + 2 * 18 + 6, y - 20 - 2 * 34
    part(R, R.mask(rrect(gx - 2, gy - 70, 4, 70, 2)), "#8E5F37", Mat(puff=2, line_w=0.8))
    damier = m_union(*[R.mask(rrect(gx + 2 + (k % 3) * 10, gy - 70 + (k // 3) * 9, 10, 9, 0)) for k in range(6) if (k + k // 3) % 2 == 0])
    drap = R.mask(rrect(gx + 2, gy - 70, 30, 18, 2))
    part(R, drap, "#FFFDF4", Mat(puff=2, line_w=1.0), decal=[(m_clip(damier, drap), "#273043", 0.0)])
    # Bip sur la première dalle
    HT.bip(R, x - 112, y - 64, 0.42, expr="content", salut=True)

def motifs(R):
    """Les motifs de Rico : un cadre en bois à trois tringles de perles qui se répètent."""
    x, y = 560, 676
    D.ground_shadow(R, x + 8, y + 3, 120, 13, 0.26, dx=6, blur=5)
    for px in (x - 118, x + 118):
        part(R, R.mask(rrect(px - 7, y - 150, 14, 150, 4)), "#A8703F", Mat(puff=4, line_w=1.2, tex=1.0))
    part(R, R.mask(rrect(x - 132, y - 162, 264, 16, 6)), "#B98250", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))
    rangs = [("#E85D9A", "#3D8BEA"), ("#FFC145", "#FFC145", "#34B37A"), (VIOLET, "#FF7F50", "#FF7F50")]
    for j, motif in enumerate(rangs):
        yy = y - 128 + j * 38
        flat(R, R.line_mask([(x - 112, yy), (x + 112, yy)], 2.4, smooth_it=False), "#8A6A4E")
        for k in range(8):
            c = motif[k % len(motif)]
            bx = x - 98 + k * 28
            if j == 1:
                perle = R.mask(np.array([(bx - 11, yy + 9), (bx, yy - 11), (bx + 11, yy + 9)], float))  # triangles
            elif j == 2:
                perle = R.mask(rrect(bx - 10, yy - 10, 20, 20, 4))  # carrés
            else:
                perle = R.mask(circle(bx, yy, 11))
            part(R, perle, c, Mat(puff=5, spec=0.35, shin=30, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(x - 132, y - 14, 264, 16, 6)), "#B98250", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))

def anime(R, nom):
    if nom == "rico":
        # Rico accueille à l'entrée du chemin
        D.ground_shadow(R, 236, 700, 30, 7, 0.26, dx=5, blur=4)
        HT.rico(R, 230, 700 - 102 * 0.46, 0.46, expr="content", salut=True)
    else:
        raise KeyError(nom)

def lieu(R, activite):
    {"formes": formes, "bip": bip, "motifs": motifs}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
