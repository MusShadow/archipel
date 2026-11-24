"""Île du Cœur (livraison 3) : le théâtre de Pico (un castelet à rideaux, deux marionnettes, une qui rit, une qui
est triste) et le coin calme (un hamac, un tapis rond, des coussins, une lanterne douce). L'arbre aux cœurs, le banc
des copains, les tulipes. Pico accueille à l'entrée du chemin. Couleur de l'île : rose."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

ROSE, ROSE_F, PRUNE = "#E85D9A", "#C2477F", "#8C6BE0"
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"theatre": "A", "calme": "B"},
    "pastilles": {"theatre": (300, 548), "calme": (842, 596)},
    "plume": (726, 330),
    "animes": ["pico"],
    # décor vivant (livraison 4) : de petits cœurs montent au-dessus de Pico
    "vivant": {"hote": "pico", "surprise": {"type": "coeurs", "point": [204, 614]}},
}
COTE = C.contour(seed=69, amp=(18, 14), ondes=(4, 2))

def base(R):
    C.ciel_mer(R, nuages=((160, 100, 0.9, 16), (700, 120, 0.66, 17), (1030, 96, 0.82, 18)))
    C.ile(R, COTE, herbe=("#A9D98C", "#80C46B"), seed=69)
    C.chemin(R, [([(356, 724), (338, 660), (318, 600)], 15), ([(300, 628), (420, 642), (510, 652), (560, 694)], 13),
                 ([(560, 694), (680, 652), (780, 612), (842, 586)], 12)], seed=67, c="#F0D9B0")
    for (x, y, rx, ry, sd) in ((104, 528, 20, 14, 71), (126, 546, 12, 8, 72), (1120, 562, 18, 12, 73), (866, 690, 13, 9, 74)):
        D.rock(R, x, y, rx, ry, seed=sd)
    D.palm(R, 1086, 504, 1.0, lean=-14, seed=19)
    for k, (x, y) in enumerate(((430, 700), (452, 708), (684, 712), (706, 704), (512, 572), (700, 470), (1030, 596))):
        C.tulipe(R, x, y, (ROSE, "#FFC145", PRUNE, "#FF7F50")[k % 4], h=18)
    for (fx, fy, c) in ((610, 716, "#FFFDF4"), (380, 652, ROSE)):
        D.flower_stem(R, fx, fy, c, h=12)

def arbre_coeurs(R, x=590, y=400):
    """L'arbre aux cœurs : un arbre rond, fleuri de petits cœurs roses."""
    D.round_tree(R, x, y, 0.95, seed=75)
    for (dx, dy, r, c) in ((-40, -96, 9, ROSE), (-6, -118, 8, "#F49AB8"), (30, -94, 9, ROSE), (-22, -70, 7, "#F49AB8"), (46, -122, 7, ROSE), (12, -78, 8, "#F49AB8")):
        part(R, R.mask(C.coeur(x + dx, y + dy, r)), c, Mat(puff=3, line_w=0.9, spec=0.2), shadow=False)

def banc(R, x=560, y=690):
    """Le banc des copains, deux coussins posés dessus."""
    D.ground_shadow(R, x + 6, y + 2, 84, 9, 0.24, dx=5, blur=4)
    for px in (x - 62, x + 62):
        part(R, R.mask(rrect(px - 5, y - 34, 10, 34, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    part(R, R.mask(rrect(x - 84, y - 44, 168, 14, 5)), "#C98B55", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))
    for k in range(3):
        part(R, R.mask(rrect(x - 80, y - 92 + k * 15, 160, 11, 4)), "#C98B55", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0))
    for (cx, c) in ((x - 36, ROSE), (x + 34, PRUNE)):
        cou = R.mask(catmull([(cx - 28, y - 46), (cx - 30, y - 72), (cx, y - 80), (cx + 30, y - 72), (cx + 28, y - 46), (cx, y - 42)], n=8))
        part(R, cou, c, Mat(puff=8, profile="pillow", line_w=1.2, tex=0.7), decal=[(R.mask(C.coeur(cx, y - 62, 8)), "#FFFDF4", 1.0)])

def topiaire(R, x=990, y=650):
    """Un petit arbre taillé en cœur, dans son pot, et des tulipes autour."""
    D.ground_shadow(R, x + 5, y + 2, 30, 6, 0.24, dx=4, blur=3)
    part(R, R.mask(catmull([(x - 22, y - 30), (x + 22, y - 30), (x + 16, y), (x - 16, y)], n=4)), "#D9805A", Mat(puff=4, profile="pillow", line_w=1.2, tex=0.8))
    part(R, R.mask(rrect(x - 25, y - 36, 50, 9, 3)), "#C46F4C", Mat(puff=2, line_w=1.1))
    part(R, R.mask(rrect(x - 3, y - 76, 6, 42, 2)), "#8E5F37", Mat(puff=2, line_w=0.9, tex=1.0))
    cm = R.mask(C.coeur(x, y - 100, 34))
    part(R, cm, "#5FAE4C", Mat(puff=12, profile="pillow", line_w=1.4, tex=1.0),
         decal=[(m_union(*[R.mask(circle(x + dx, y - 100 + dy, 2.6)) for dx, dy in ((-16, -12), (8, -16), (18, 2), (-6, 4), (2, 18))]), ROSE, 1.0)])
    for k, dx in enumerate((-58, -40, 40, 58)):
        C.tulipe(R, x + dx, y + 4 - (k % 2) * 6, (ROSE, "#FFC145", PRUNE, ROSE)[k], h=20)

def remplissage(R, ident):
    if ident == "C":
        banc(R)
    elif ident == "D":
        arbre_coeurs(R)
    elif ident == "E":
        topiaire(R)
    elif ident == "F":
        D.bush(R, 170, 608, 0.72, "#56A84A", seed=76, flowers=ROSE)
        C.tulipe(R, 206, 622, "#FFC145", h=18)
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=77, flowers=ROSE)

# ---------------------------------------------------------------------------- lieux
def visage(R, cx, cy, r, c, humeur):
    """Tête de marionnette ronde : 'rit' ou 'triste'."""
    part(R, R.mask(circle(cx, cy, r)), c, Mat(puff=6, spec=0.2, line_w=1.2))
    for ex in (cx - r * 0.36, cx + r * 0.36):
        flat(R, R.mask(circle(ex, cy - r * 0.12, r * 0.12)), "#273043")
    if humeur == "rit":
        flat(R, R.line_mask([(cx - r * 0.45, cy + r * 0.2), (cx, cy + r * 0.52), (cx + r * 0.45, cy + r * 0.2)], 2.4), "#273043")
        for chx in (cx - r * 0.6, cx + r * 0.6):
            R.paint(R.mask(ellipse(chx, cy + r * 0.2, r * 0.16, r * 0.1)), "#F49AB8", Mat(flat=True))
    else:
        flat(R, R.line_mask([(cx - r * 0.4, cy + r * 0.48), (cx, cy + r * 0.26), (cx + r * 0.4, cy + r * 0.48)], 2.4), "#273043")
        part(R, R.mask(catmull([(cx + r * 0.36, cy + r * 0.02), (cx + r * 0.42, cy + r * 0.22), (cx + r * 0.36, cy + r * 0.3), (cx + r * 0.3, cy + r * 0.22)], n=5)),
             "#7DC4EC", Mat(puff=2, spec=0.5, line_w=0.7), shadow=False)

def theatre(R):
    """Le théâtre de Pico : un castelet en bois peint, ses rideaux roses, et deux marionnettes qui jouent les émotions."""
    x, y = 318, 488
    D.ground_shadow(R, x + 8, y + 3, 92, 11, 0.26, dx=6, blur=5)
    # le fond de la scène
    part(R, R.mask(rrect(x - 74, y - 206, 148, 100, 4)), "#4B3A6E", Mat(puff=4, line_w=1.2, tex=0.5))
    # les marionnettes, sur leur bâton
    for (cx, c, hum) in ((x - 30, "#FFC145", "rit"), (x + 32, "#9CC9F0", "triste")):
        part(R, R.mask(rrect(cx - 3, y - 140, 6, 40, 2)), "#A9703F", Mat(puff=2, line_w=0.8), shadow=False)
        part(R, R.mask(catmull([(cx - 20, y - 112), (cx - 14, y - 140), (cx + 14, y - 140), (cx + 20, y - 112)], n=4)),
             ROSE if hum == "rit" else PRUNE, Mat(puff=4, line_w=1.0), shadow=False)
        visage(R, cx, y - 158, 22, c, hum)
    # le castelet : montants, bas peint, rideaux, lambrequin festonné, fronton au cœur
    for px in (x - 86, x + 74):
        part(R, R.mask(rrect(px, y - 214, 12, 112, 3)), "#C98B55", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0))
    bas = R.mask(rrect(x - 90, y - 108, 180, 108, 8))
    part(R, bas, "#F7D3E2", Mat(puff=8, profile="pillow", line_w=1.5, tex=0.8),
         decal=[(R.mask(C.coeur(x, y - 54, 26)), ROSE, 1.5), (R.mask(rrect(x - 90, y - 108, 180, 12, 4)), "#C98B55", 0.8)])
    for sx in (-1, 1):
        rideau = R.mask(catmull([(x + sx * 74, y - 206), (x + sx * 40, y - 206), (x + sx * 52, y - 170), (x + sx * 62, y - 150),
                                 (x + sx * 58, y - 112), (x + sx * 74, y - 112)], n=8))
        plis = m_union(*[R.line_mask([(x + sx * (46 + k * 8), y - 204), (x + sx * (56 + k * 5), y - 156), (x + sx * (64 + k * 3), y - 114)], 1.3) for k in range(3)])
        part(R, rideau, ROSE, Mat(puff=8, profile="pillow", line_w=1.3, tex=0.8), decal=[(m_clip(plis, rideau), ROSE_F, 0.6)])
        part(R, R.mask(ellipse(x + sx * 62, y - 152, 9, 4)), "#FFC145", Mat(puff=2, line_w=0.8), shadow=False)
    bord = [(x + 92, y - 204, "c")]
    for k in range(8):
        bord += [(x + 92 - k * 23 - 11.5, y - 190), (x + 92 - (k + 1) * 23, y - 204, "c")]
    fest = R.mask(catmull([(x - 92, y - 234, "c"), (x + 92, y - 234, "c")] + bord, n=6))
    part(R, fest, ROSE_F, Mat(puff=6, profile="pillow", line_w=1.4, tex=0.8), decal=[(R.mask(rrect(x - 92, y - 230, 184, 6, 2)), "#FFC145", 0.6)])
    fronton = R.mask(catmull([(x - 70, y - 232), (x - 40, y - 262), (x, y - 272), (x + 40, y - 262), (x + 70, y - 232)], n=8))
    part(R, fronton, "#C98B55", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), decal=[(R.mask(C.coeur(x, y - 248, 13)), ROSE, 1.0)])

def calme(R):
    """Le coin calme : un hamac entre deux arceaux, un coussin, un tapis rond, une lanterne à la lumière douce."""
    x, y = 842, 520
    tapis = R.mask(ellipse(x, y - 8, 124, 26))
    part(R, tapis, "#D9CDF6", Mat(puff=5, profile="pillow", line_w=1.3, tex=0.7),
         decal=[(m_sub(R.mask(ellipse(x, y - 8, 104, 19)), R.mask(ellipse(x, y - 8, 96, 15))), "#B9A4F2", 1.0)])
    for sx in (-1, 1):
        arc = stroke_pts([(x + sx * 112, y - 6), (x + sx * 116, y - 70), (x + sx * 100, y - 130)], n=10)
        part(R, R.mask(ribbon(arc, np.full(len(arc), 8.0))), "#A9703F", Mat(puff=3, line_w=1.1, tex=1.0))
    toile = R.mask(catmull([(x - 98, y - 124), (x - 50, y - 70), (x, y - 58), (x + 50, y - 70), (x + 98, y - 124), (x + 60, y - 92), (x, y - 82), (x - 60, y - 92)], n=10))
    raies = m_union(*[R.line_mask([(x - 90 + k * 22, y - 128), (x - 84 + k * 22, y - 50)], 5.0, smooth_it=False) for k in range(9)])
    part(R, toile, "#FFF4E2", Mat(puff=8, profile="pillow", line_w=1.3, tex=0.7), decal=[(m_clip(raies, toile), "#F49AB8", 0.6)])
    for sx in (-1, 1):
        flat(R, R.line_mask([(x + sx * 100, y - 130), (x + sx * 98, y - 124)], 2.2, smooth_it=False), "#8A6A4E")
    part(R, R.mask(catmull([(x + 22, y - 84), (x + 26, y - 104), (x + 62, y - 108), (x + 72, y - 92), (x + 56, y - 80)], n=8)), PRUNE, Mat(puff=6, profile="pillow", line_w=1.1))
    # coussins ronds sur le tapis
    for (cx, c) in ((x - 70, ROSE), (x - 30, "#FFC145")):
        part(R, R.mask(ellipse(cx, y - 16, 22, 11)), c, Mat(puff=6, profile="pillow", line_w=1.1, tex=0.6))
    # la lanterne : un bocal à la lumière douce
    lx, ly = x + 140, y - 4
    halo = R.mask(circle(lx, ly - 22, 24))
    R.paint(halo, "#FFE9A8", Mat(flat=True), haze=0.55)
    part(R, R.mask(rrect(lx - 13, ly - 40, 26, 38, 7)), "#FFF1C4", Mat(puff=5, spec=0.5, line_w=1.1, tex=0.3),
         decal=[(R.mask(circle(lx, ly - 21, 7)), "#FFC145", 3.0)])
    part(R, R.mask(rrect(lx - 15, ly - 46, 30, 8, 3)), "#8E5F37", Mat(puff=2, line_w=1.0))

def anime(R, nom):
    if nom == "pico":
        # Pico accueille à l'entrée du chemin
        D.ground_shadow(R, 236, 702, 30, 7, 0.26, dx=5, blur=4)
        HT.pico(R, 230, 702 - 85 * 0.48, 0.48, expr="content", salut=True)
    else:
        raise KeyError(nom)

def lieu(R, activite):
    {"theatre": theatre, "calme": calme}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
