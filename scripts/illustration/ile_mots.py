"""Île des Mots (livraison 3) : la cabane de lecture (Lis et trouve), l'établi des syllabes, la conque où chante Mona,
le grand livre des histoires. Mona la baleine salue depuis la mer. Couleur de l'île : corail."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

CORAIL, CORAIL_F, CREME = "#FF7F50", "#E2603A", "#FFF4E2"
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"lis": "A", "syllabes": "B", "chants": "C", "histoires": "E"},
    "pastilles": {"lis": (318, 606), "syllabes": (842, 622), "chants": (560, 758), "histoires": (994, 770)},
    "plume": (726, 330),
    "animes": ["mona"],
}
COTE = C.contour(seed=21, amp=(22, 12), ondes=(2, 5))

def base(R):
    C.ciel_mer(R, nuages=((200, 96, 0.92, 4), (690, 126, 0.6, 5), (1010, 84, 0.82, 6)))
    C.ile(R, COTE, herbe=("#A8D67F", "#84C366"), seed=21)
    C.chemin(R, [([(176, 774), (236, 704), (300, 640), (330, 598)], 15), ([(300, 626), (420, 642), (510, 652), (560, 690)], 13),
                 ([(560, 690), (680, 642), (780, 594), (842, 566)], 12), ([(790, 598), (880, 650), (962, 704)], 12)], seed=57)
    for (x, y, rx, ry, sd) in ((104, 528, 20, 14, 31), (128, 546, 12, 8, 32), (1118, 566, 18, 12, 33), (850, 690, 13, 9, 34)):
        D.rock(R, x, y, rx, ry, seed=sd)
    D.palm(R, 1084, 506, 1.0, lean=-14, seed=12)
    D.palm(R, 126, 604, 0.9, lean=-10, seed=13)
    for (fx, fy, c) in ((420, 694, CORAIL), (700, 706, "#FFC145"), (510, 566, "#E85D9A"), (700, 470, CORAIL), (1030, 596, "#FFC145")):
        D.flower_stem(R, fx, fy, c, h=14)
    # fanions à lettres entre deux poteaux, au-dessus du chemin
    C.poteau(R, 650, 470, 86)
    C.poteau(R, 760, 452, 86)
    C.fanions(R, (650, 388), (760, 370), [CORAIL, "#FFC145", "#3D8BEA", "#34B37A", "#E85D9A"], n=5, creux=14, lettres="aeiou")

def remplissage(R, ident):
    if ident == "D":
        D.round_tree(R, 540, 370, 0.92, seed=24, fruit=CORAIL)
        D.bush(R, 612, 398, 0.85, seed=25, flowers="#FFC145")
    elif ident == "F":
        D.bush(R, 238, 650, 0.82, "#56A84A", seed=26, flowers=CORAIL)
        D.flower_stem(R, 196, 618, "#E85D9A")
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=27, flowers=CORAIL)

# ---------------------------------------------------------------------------- lieux
def lis(R):
    """Lis et trouve : la cabane de lecture, sa pile de livres et son panneau « abc »."""
    x, y = 318, 478
    C.cabane(R, x, y, 176, 96, mur=CREME, toit=CORAIL, porte="#A8703F")
    # étagère de livres sous l'auvent (à droite de la porte)
    for k, (c, hh) in enumerate((("#3D8BEA", 30), ("#FFC145", 26), ("#34B37A", 32), ("#E85D9A", 28))):
        part(R, R.mask(rrect(x + 22 + k * 11, y - 18 - hh, 10, hh, 2)), c, Mat(puff=2, line_w=0.9), shadow=False)
    # pile de livres à gauche, posée dans l'herbe
    for k, (c, w) in enumerate((("#E2603A", 46), ("#3D8BEA", 42), ("#FFC145", 38))):
        yy = y + 4 - k * 11
        part(R, R.mask(rrect(x - 132 - w / 2 + k * 3, yy - 11, w, 11, 3)), c, Mat(puff=3, profile="pillow", line_w=1.0),
             decal=[(R.mask(rrect(x - 132 - w / 2 + k * 3 + w - 8, yy - 9, 5, 7, 1)), "#FFFDF4", 0.3)])
    # enseigne sur le toit
    part(R, R.mask(rrect(x - 34, y - 160, 68, 30, 7)), "#C98B55", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0))
    flat(R, D.text_mask(R, "abc", x, y - 146, 19), "#4A2C1C")

def syllabes(R):
    """L'atelier des syllabes : l'établi, les cubes à lettres, le parasol corail."""
    x, y = 842, 506
    # parasol
    C.poteau(R, x + 54, y, 150)
    dome = R.mask(catmull([(x - 40, y - 132), (x + 4, y - 174), (x + 54, y - 186), (x + 104, y - 174), (x + 148, y - 132), (x + 54, y - 140)], n=10))
    bandes = m_union(*[R.mask(np.array([(x + 54, y - 186), (x - 40 + k * 47, y - 128), (x - 16 + k * 47, y - 128)], float)) for k in range(0, 5, 2)])
    part(R, dome, CREME, Mat(puff=10, profile="pillow", line_w=1.5, tex=0.9), decal=[(m_clip(bandes, dome), CORAIL, 0.4)])
    C.table(R, x, y, w=164, h=46, c="#C98B55")
    for k, (lettre, c) in enumerate((("m", CORAIL), ("a", "#3D8BEA"), ("p", "#34B37A"), ("o", "#FFC145"))):
        C.cube(R, x - 54 + k * 34, y - 58, 1.05, c, lettre)
    C.cube(R, x - 30, y - 88, 0.95, "#E85D9A", "l")
    # caisse de cubes au pied de l'établi
    part(R, R.mask(rrect(x - 132, y - 28, 50, 30, 4)), "#B98250", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0))
    for k, c in enumerate(("#3D8BEA", CORAIL, "#34B37A")):
        C.cube(R, x - 120 + k * 15, y - 26, 0.6, c)

def chants(R):
    """Les chants de Mona : une conque géante en coquille Saint-Jacques, sa petite scène, les notes qui s'envolent."""
    x, y = 560, 666
    D.ground_shadow(R, x + 8, y + 4, 110, 14, 0.24, dx=6, blur=5)
    scene = R.mask(ellipse(x, y - 6, 112, 22))
    part(R, scene, "#C98B55", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), decal=[(R.mask(ellipse(x, y - 10, 104, 15)), "#D9A26E", 2.0)])
    # coquille : un éventail de côtes, ouvert vers nous
    n = 9
    cotes = []
    for k in range(n):
        a0 = math.radians(196 + k * (148 / n))
        a1 = math.radians(196 + (k + 1) * (148 / n))
        cotes.append(np.array([(x, y - 20), (x + math.cos(a0) * 118, y - 20 + math.sin(a0) * 132), (x + math.cos((a0 + a1) / 2) * 128, y - 20 + math.sin((a0 + a1) / 2) * 142),
                               (x + math.cos(a1) * 118, y - 20 + math.sin(a1) * 132)], float))
    coquille = m_fuse(m_union(*[R.mask(catmull([tuple(p) for p in c], n=6)) for c in cotes]), 2 * R.S)
    sillons = m_union(*[R.line_mask([(x, y - 22), (x + math.cos(math.radians(196 + k * (148 / n))) * 120, y - 20 + math.sin(math.radians(196 + k * (148 / n))) * 134)], 1.6, smooth_it=False) for k in range(1, n)])
    part(R, coquille, "#FFD3C2", Mat(puff=16, line_w=1.6, tex=0.8, spec=0.12),
         decal=[(m_clip(sillons, coquille), "#F2A58A", 0.6), (R.mask(ellipse(x, y - 70, 60, 44)), "#FFE6DB", 8.0)])
    part(R, R.mask(ellipse(x, y - 18, 26, 12)), "#F7B79F", Mat(puff=4, line_w=1.1), shadow=False)
    # notes de musique qui montent
    for (nx, ny, s, c) in ((x - 78, y - 160, 1.1, CORAIL), (x + 6, y - 186, 1.25, "#3D8BEA"), (x + 92, y - 150, 1.0, "#E85D9A")):
        C.note(R, nx, ny, s, c)

def histoires(R):
    """Mes histoires : le grand livre ouvert sur son pupitre, sous un arbre, et un coussin pour écouter."""
    x, y = 990, 652
    D.round_tree(R, x + 62, y - 26, 0.72, seed=28, fruit="#FFC145")
    D.ground_shadow(R, x + 6, y + 2, 54, 9, 0.26, dx=4, blur=4)
    # pupitre
    part(R, R.mask(rrect(x - 6, y - 56, 12, 56, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    part(R, R.mask(rrect(x - 30, y - 6, 60, 8, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    plateau = R.mask(np.array([(x - 58, y - 52), (x + 58, y - 52), (x + 50, y - 70), (x - 50, y - 70)], float))
    part(R, plateau, "#A8703F", Mat(puff=3, profile="pillow", line_w=1.2, tex=1.0))
    # grand livre ouvert, les pages relevées
    for sx in (-1, 1):
        page = R.mask(catmull([(x, y - 64), (x + sx * 26, y - 70), (x + sx * 56, y - 66), (x + sx * 58, y - 116), (x + sx * 28, y - 124), (x, y - 114)], n=6))
        part(R, page, "#FFFDF4", Mat(puff=5, profile="pillow", line_w=1.3, tex=0.6))
        for k in range(4):
            yy = y - 106 + k * 10
            flat(R, R.line_mask([(x + sx * 10, yy + 2), (x + sx * 30, yy - 1), (x + sx * 50, yy + 1)], 1.5), "#C9B79A")
    part(R, R.mask(catmull([(x - 62, y - 64), (x, y - 56), (x + 62, y - 64), (x + 60, y - 58), (x, y - 50), (x - 60, y - 58)], n=6)), CORAIL, Mat(puff=3, line_w=1.2))
    # coussin et petite étoile qui brille
    coussin = R.mask(catmull([(x - 92, y + 14), (x - 74, y - 4), (x - 40, y - 2), (x - 26, y + 14), (x - 58, y + 22)], n=8))
    part(R, coussin, "#8C6BE0", Mat(puff=8, profile="pillow", line_w=1.3, tex=0.9), decal=[(R.mask(circle(x - 58, y + 8, 4)), "#B9A4F2", 1.0)])

def anime(R, nom):
    if nom == "mona":
        x, y = 128, 760
        rond = R.mask(ellipse(x + 4, y + 48, 92, 16))
        R.paint(rond, "#BDEDE6", Mat(puff=4, profile="pillow", line=False, tex=0.4))
        HT.mona(R, x, y, 0.56, expr="content", salut=True)
        # vaguelettes devant : Mona est dans l'eau
        for k in range(3):
            xx = x - 70 + k * 52
            flat(R, R.line_mask([(xx, y + 56), (xx + 12, y + 50), (xx + 24, y + 56), (xx + 36, y + 50)], 2.6), "#F2FBF8")
    else:
        raise KeyError(nom)

def lieu(R, activite):
    {"lis": lis, "syllabes": syllabes, "chants": chants, "histoires": histoires}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
