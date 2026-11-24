"""Île de l'Atelier (livraison 3) : le chevalet du dessin pas à pas, le miroir de Kiki (un papillon peint en deux
moitiés), les pots de peinture et les tournesols. Kiki salue au bord de l'eau. Couleur de l'île : jaune."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

JAUNE, JAUNE_F = "#FFC145", "#976100"
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"dessin": "A", "miroir": "B"},
    "pastilles": {"dessin": (318, 546), "miroir": (842, 584)},
    "plume": (726, 330),
    "animes": ["kiki"],
    # décor vivant (livraison 4) : un arc-en-ciel paraît dans le ciel, puis s'efface
    "vivant": {"hote": "kiki", "surprise": {"type": "arc-en-ciel", "point": [380, 30]}},
}
COTE = C.contour(seed=57, amp=(14, 18), ondes=(5, 3))

def tournesol(R, x, y, h=60, s=1.0):
    flat(R, R.line_mask([(x, y), (x + 2, y - h * 0.5), (x, y - h)], 2.6 * s), "#4E9A3E")
    part(R, R.mask(leaf((x, y - h * 0.4), (x + 16 * s, y - h * 0.55), 9 * s)), "#5FAE4C", Mat(puff=2, line_w=0.8), shadow=False)
    pet = [R.mask(leaf((x, y - h), (x + math.cos(a) * 17 * s, y - h + math.sin(a) * 17 * s), 8 * s)) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)]
    part(R, m_union(*pet), JAUNE, Mat(puff=3, line_w=0.9, tex=0.5), shadow=False)
    part(R, R.mask(circle(x, y - h, 7 * s)), "#8B5A35", Mat(puff=3, line_w=0.9), shadow=False)

def pots(R, x, y):
    for k, c in enumerate(("#E8504A", "#3D8BEA", JAUNE, "#34B37A")):
        px = x - 48 + k * 32
        part(R, R.mask(rrect(px - 13, y - 26, 26, 26, 4)), "#E9E4DA", Mat(puff=4, profile="pillow", line_w=1.1, tex=0.6))
        part(R, R.mask(ellipse(px, y - 26, 13, 5)), c, Mat(puff=2, line_w=0.9), shadow=False)
        part(R, R.mask(catmull([(px - 13, y - 22), (px - 6, y - 12), (px - 2, y - 22)], n=4)), c, Mat(puff=2, line_w=0.8), shadow=False)

def base(R):
    C.ciel_mer(R, nuages=((190, 110, 0.9, 13), (740, 100, 0.7, 14), (1050, 150, 0.75, 15)))
    C.ile(R, COTE, herbe=("#B0D97E", "#8CC665"), seed=57)
    C.chemin(R, [([(356, 724), (338, 660), (326, 598)], 15), ([(300, 626), (420, 640), (510, 652), (560, 692)], 13),
                 ([(560, 692), (680, 646), (770, 598), (836, 570)], 12)], seed=63, c="#EED8A8")
    for (x, y, rx, ry, sd) in ((1120, 562, 18, 12, 63), (862, 690, 13, 9, 64)):
        D.rock(R, x, y, rx, ry, seed=sd)
    # éclaboussures de peinture sur les rochers du rivage
    for (x, y, c) in ((1112, 556, "#E8504A"), (868, 686, "#3D8BEA")):
        part(R, R.mask(ellipse(x, y, 6, 3.5)), c, Mat(puff=2, line_w=0.6), shadow=False)
    D.palm(R, 1086, 504, 1.0, lean=-14, seed=17)
    for (x, y, h) in ((690, 486, 64), (716, 494, 54), (462, 700, 52), (1030, 600, 58)):
        tournesol(R, x, y, h)
    for (fx, fy, c) in ((420, 704, "#E85D9A"), (640, 714, "#8C6BE0"), (520, 576, "#FF7F50")):
        D.flower_stem(R, fx, fy, c, h=14)
    C.poteau(R, 400, 420, 80)
    C.poteau(R, 500, 404, 80)
    C.fanions(R, (400, 346), (500, 330), ["#E8504A", JAUNE, "#3D8BEA", "#34B37A", "#E85D9A"], n=5, creux=12)

def remplissage(R, ident):
    if ident == "C":
        # la table de peinture : pots ouverts, bocal de pinceaux, une feuille qui sèche
        C.table(R, 560, 690, w=170, h=40, c="#D9A26E")
        pots(R, 548, 638)
        part(R, R.mask(rrect(604, 606, 26, 32, 6)), "#CDEBF0", Mat(puff=4, spec=0.4, line_w=1.1, tex=0.3))
        for k, cc in enumerate(("#E8504A", "#3D8BEA", "#34B37A")):
            bx = 610 + k * 7
            part(R, R.mask(rrect(bx - 2, 580 + (k % 2) * 5, 4, 34, 2)), "#A9703F", Mat(puff=1.5, line_w=0.7), shadow=False)
            part(R, R.mask(ellipse(bx, 580 + (k % 2) * 5, 3.4, 6)), cc, Mat(puff=1.5, line_w=0.7), shadow=False)
    elif ident == "D":
        D.round_tree(R, 560, 380, 0.9, seed=58, fruit=JAUNE)
        D.bush(R, 640, 400, 0.8, seed=59, flowers="#FF7F50")
    elif ident == "E":
        for k, (x, h) in enumerate(((960, 70), (990, 82), (1020, 64))):
            tournesol(R, x, 650, h)
    elif ident == "F":
        D.bush(R, 168, 606, 0.7, "#56A84A", seed=60, flowers=JAUNE)
        tournesol(R, 206, 618, 44, 0.8)
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=61, flowers=JAUNE)

# ---------------------------------------------------------------------------- lieux
def chevalet(R, x, y, h=150):
    D.ground_shadow(R, x + 8, y + 3, 50, 9, 0.26, dx=6, blur=5)
    for (a, b) in (((x - 40, y), (x - 10, y - h)), ((x + 40, y), (x + 10, y - h)), ((x, y - 10), (x, y - h + 30))):
        c = stroke_pts([a, b], n=4)
        part(R, R.mask(ribbon(c, np.full(len(c), 6.0))), "#A9703F", Mat(puff=2, line_w=1.0, tex=1.0))
    part(R, R.mask(rrect(x - 66, y - h * 0.42, 132, 9, 3)), "#A9703F", Mat(puff=2, line_w=1.0, tex=1.0))

def dessin(R):
    """Dessine pas à pas : le grand chevalet, un chat à moitié dessiné (le reste en pointillés), le pot à crayons."""
    x, y = 318, 492
    chevalet(R, x, y, 170)
    toile = R.mask(rrect(x - 70, y - 168, 140, 104, 4))
    part(R, toile, "#FFFDF4", Mat(puff=5, profile="pillow", line_w=1.4, tex=0.6))
    # le chat : tête et oreilles tracées, le corps en pointillés (la prochaine étape)
    tx, ty = x, y - 122
    tete = [(tx - 24, ty + 2), (tx - 20, ty - 14), (tx, ty - 20), (tx + 20, ty - 14), (tx + 24, ty + 2), (tx + 16, ty + 16), (tx, ty + 20), (tx - 16, ty + 16)]
    flat(R, R.line_mask(tete, 2.6, closed=True), "#273043")
    for sx in (-1, 1):
        flat(R, R.line_mask([(tx + sx * 19, ty - 11), (tx + sx * 24, ty - 30), (tx + sx * 9, ty - 19)], 2.6, smooth_it=False), "#273043")
    flat(R, R.line_mask([(tx - 4, ty + 7), (tx, ty + 10), (tx + 4, ty + 7)], 2.0), "#273043")
    for ex in (tx - 9, tx + 9):
        flat(R, R.mask(circle(ex, ty, 2.6)), "#273043")
    pts = [(tx - 20, ty + 22), (tx - 30, ty + 40), (tx - 22, ty + 50), (tx + 22, ty + 50), (tx + 30, ty + 40), (tx + 20, ty + 22)]
    c = catmull(pts, n=10, closed=False)
    for k in range(0, len(c) - 2, 4):
        flat(R, R.line_mask([tuple(c[k]), tuple(c[k + 2])], 2.2, smooth_it=False), "#8C6BE0")
    # pot à crayons
    D.ground_shadow(R, x + 104, y + 1, 18, 4, 0.22, dx=3, blur=3)
    part(R, R.mask(rrect(x + 86, y - 34, 30, 34, 5)), "#3D8BEA", Mat(puff=4, profile="pillow", line_w=1.1))
    for k, cc in enumerate(("#E8504A", JAUNE, "#34B37A", "#8C6BE0")):
        bx = x + 90 + k * 7
        part(R, R.mask(rrect(bx - 2.5, y - 62 + (k % 2) * 6, 5, 32, 2)), cc, Mat(puff=1.5, line_w=0.7), shadow=False)

def miroir(R):
    """Le miroir de Kiki : un papillon peint en deux moitiés pareilles, de part et d'autre d'un trait."""
    x, y = 842, 512
    chevalet(R, x, y, 176)
    toile = R.mask(rrect(x - 84, y - 172, 168, 112, 4))
    part(R, toile, "#FFFDF4", Mat(puff=5, profile="pillow", line_w=1.4, tex=0.6))
    cx, cy = x, y - 116
    for sx in (-1, 1):
        haut = R.mask(catmull([(cx + sx * 3, cy - 2), (cx + sx * 26, cy - 36), (cx + sx * 56, cy - 30), (cx + sx * 54, cy - 4), (cx + sx * 20, cy + 4)], n=8))
        bas = R.mask(catmull([(cx + sx * 3, cy + 4), (cx + sx * 34, cy + 10), (cx + sx * 40, cy + 34), (cx + sx * 18, cy + 40)], n=8))
        part(R, haut, "#8C6BE0", Mat(puff=4, line_w=1.0), shadow=False, decal=[(R.mask(circle(cx + sx * 34, cy - 18, 7)), JAUNE, 1.0)])
        part(R, bas, "#E85D9A", Mat(puff=4, line_w=1.0), shadow=False, decal=[(R.mask(circle(cx + sx * 24, cy + 22, 5)), "#FFFDF4", 1.0)])
    part(R, R.mask(ellipse(cx, cy + 6, 4, 24)), "#4A3A2E", Mat(puff=2, line_w=0.8), shadow=False)
    for k in range(8):
        yy = y - 168 + k * 14
        flat(R, R.line_mask([(x, yy), (x, yy + 7)], 2.0, smooth_it=False), "#5B6475")
    # palette posée au pied
    pal = R.mask(catmull([(x + 70, y - 2), (x + 92, y - 22), (x + 128, y - 18), (x + 134, y - 2), (x + 110, y + 6)], n=8))
    part(R, pal, "#D9A26E", Mat(puff=4, profile="pillow", line_w=1.1, tex=1.0),
         decal=[(R.mask(circle(px, py, 5)), cc, 0.6) for (px, py, cc) in ((x + 96, y - 14, "#E8504A"), (x + 110, y - 18, "#3D8BEA"), (x + 122, y - 12, JAUNE))])

def anime(R, nom):
    if nom == "kiki":
        # Kiki sur sa branche, posée sur un rocher du rivage
        x, y = 228, 646
        D.rock(R, x + 2, y + 50, 58, 19, c="#B9B3A8", seed=62)
        HT.kiki(R, x, y, 0.52, expr="content", salut=True)
    else:
        raise KeyError(nom)

def lieu(R, activite):
    {"dessin": dessin, "miroir": miroir}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
