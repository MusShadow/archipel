"""Port des Voyages (livraison 3) : le drapeau mystère (un mât, un drapeau au point d'interrogation, un globe), l'atelier
des drapeaux (une table de peinture, des drapeaux rayés qui sèchent sur un fil), le drapeau de mon île (le grand mât
en haut de l'île). Le phare, le ponton et son voilier, les caisses du port. Pas d'hôte : c'est Plume qui accueille.
Couleur de l'île : bleu canard."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import ile_commun as C

CANARD, CANARD_F = "#1FA9B5", "#0E7C86"
DRAPEAUX = {"bleu": "#1F5FB8", "blanc": "#FFFFFF", "rouge": "#E1323B", "vert": "#169B57", "jaune": "#FCD116", "noir": "#1D1D1B"}
DISPOSITION = {
    "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
    "lieux": {"drapeau": "A", "atelierdrapeaux": "B", "monDrapeau": "D"},
    "pastilles": {"drapeau": (318, 548), "atelierdrapeaux": (842, 600), "monDrapeau": (604, 462)},
    "plume": (726, 330),
    "animes": [],
}
COTE = C.contour(seed=81, amp=(16, 12), ondes=(3, 5))

def mouette(R, x, y, s=1.0):
    flat(R, R.line_mask([(x - 14 * s, y), (x - 7 * s, y - 6 * s), (x, y), (x + 7 * s, y - 6 * s), (x + 14 * s, y)], 2.2), "#5B6475")

def base(R):
    C.ciel_mer(R, nuages=((180, 110, 0.85, 19), (760, 90, 0.7, 20), (1040, 140, 0.8, 21)))
    for (x, y, s) in ((420, 150, 1.0), (452, 168, 0.8), (930, 200, 0.9)):
        mouette(R, x, y, s)
    C.ile(R, COTE, herbe=("#A4D884", "#7CC266"), seed=81)
    C.chemin(R, [([(300, 700), (318, 650), (318, 600)], 15), ([(300, 628), (420, 642), (510, 652), (560, 694)], 13),
                 ([(560, 694), (680, 652), (780, 616), (842, 590)], 12), ([(470, 640), (530, 560), (590, 486)], 11), ([(780, 616), (880, 650), (962, 690)], 11)],
             seed=83, c="#EAD8B0")
    for (x, y, rx, ry, sd) in ((104, 528, 20, 14, 81), (126, 546, 12, 8, 82), (1120, 562, 18, 12, 83), (868, 694, 13, 9, 84)):
        D.rock(R, x, y, rx, ry, seed=sd)
    D.palm(R, 1088, 502, 0.96, lean=-14, seed=20)
    # bittes d'amarrage sur le rivage
    for (x, y) in ((760, 728), (440, 734)):
        D.ground_shadow(R, x + 3, y + 2, 10, 3, 0.24, dx=2, blur=2)
        part(R, R.mask(rrect(x - 7, y - 18, 14, 18, 5)), "#5B6475", Mat(puff=4, profile="pillow", line_w=1.1))
        part(R, R.mask(ellipse(x, y - 18, 10, 4)), "#6F788A", Mat(puff=2, line_w=1.0), shadow=False)
    for (fx, fy, c) in ((420, 700, CANARD), (690, 712, "#FFC145"), (512, 570, "#E85D9A"), (700, 470, CANARD)):
        D.flower_stem(R, fx, fy, c, h=13)

# ---------------------------------------------------------------------------- remplissages
def caisses(R, x=560, y=690):
    """Les caisses du port, un tonneau, un rouleau de corde et une ancre."""
    D.ground_shadow(R, x + 6, y + 2, 100, 10, 0.24, dx=5, blur=4)
    for (cx, cy, a) in ((x - 60, y, 46), (x - 14, y, 40), (x - 40, y - 46, 38)):
        face = R.mask(rrect(cx - a / 2, cy - a, a, a, 3))
        lattes = m_union(*[R.line_mask([(cx - a / 2, cy - a + k * a / 3), (cx + a / 2, cy - a + k * a / 3)], 1.4, smooth_it=False) for k in (1, 2)])
        part(R, face, "#C98B55", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0), decal=[(m_clip(lattes, face), "#9E6E42", 0.4)])
    tx, ty = x + 34, y
    part(R, R.mask(catmull([(tx - 18, ty - 50), (tx + 18, ty - 50), (tx + 22, ty - 25), (tx + 18, ty), (tx - 18, ty), (tx - 22, ty - 25)], n=6)),
         "#A9703F", Mat(puff=8, profile="pillow", line_w=1.3, tex=1.0),
         decal=[(m_union(R.mask(rrect(tx - 22, ty - 42, 44, 5, 2)), R.mask(rrect(tx - 22, ty - 12, 44, 5, 2))), "#5B6475", 0.5)])
    # rouleau de corde
    rx, ry = x + 86, y - 8
    part(R, R.mask(ellipse(rx, ry, 24, 10)), "#E2C48E", Mat(puff=5, profile="pillow", line_w=1.1, tex=0.8),
         decal=[(m_sub(R.mask(ellipse(rx, ry - 1, 15, 5.5)), R.mask(ellipse(rx, ry - 1, 12, 4))), "#B89A64", 1.0)])
    # ancre appuyée contre la caisse
    ax, ay = x - 104, y
    flat(R, R.line_mask([(ax, ay - 2), (ax + 6, ay - 52)], 4.0, smooth_it=False), "#4E5668")
    flat(R, R.line_mask([(ax - 14, ay - 10), (ax - 4, ay), (ax + 8, ay - 2), (ax + 16, ay - 14)], 4.0), "#4E5668")
    part(R, m_sub(R.mask(circle(ax + 7, ay - 60, 7)), R.mask(circle(ax + 7, ay - 60, 3.5))), "#4E5668", Mat(puff=2, line_w=0.9), shadow=False)

def phare(R, x=996, y=652):
    """Le phare : rayé blanc et bleu canard, sa lampe jaune."""
    D.ground_shadow(R, x + 8, y + 3, 44, 9, 0.26, dx=6, blur=4)
    corps = R.mask(catmull([(x - 30, y), (x - 20, y - 160), (x + 20, y - 160), (x + 30, y)], n=4))
    bandes = m_union(*[R.mask(rrect(x - 40, y - 42 - k * 50, 80, 22, 0)) for k in range(3)])
    part(R, corps, "#FFFDF4", Mat(puff=12, profile="pillow", line_w=1.5, tex=0.8), decal=[(m_clip(bandes, corps), CANARD, 0.5)])
    part(R, R.mask(rrect(x - 8, y - 30, 16, 30, 6)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0), shadow=False)
    part(R, R.mask(rrect(x - 30, y - 170, 60, 12, 4)), "#4E5668", Mat(puff=3, line_w=1.2))
    part(R, R.mask(rrect(x - 18, y - 200, 36, 30, 5)), "#FFE9A8", Mat(puff=6, spec=0.6, line_w=1.2), decal=[(R.mask(circle(x, y - 185, 9)), "#FFC145", 2.5)])
    part(R, R.mask(catmull([(x - 24, y - 198), (x, y - 222), (x + 24, y - 198)], n=4)), CANARD_F, Mat(puff=5, profile="pillow", line_w=1.3))

def ponton(R):
    """Le ponton qui descend dans la mer, et le voilier amarré."""
    deck = R.mask(np.array([(250, 694), (282, 704), (226, 798), (192, 788)], float))
    for (px, py) in ((196, 800), (228, 808), (240, 744)):
        part(R, R.mask(rrect(px - 4, py - 16, 8, 30, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    planks = [R.line_mask([(254 - k * 8.4, 698 + k * 13.4), (284 - k * 8.4, 708 + k * 13.4)], 1.2, smooth_it=False) for k in range(1, 7)]
    part(R, deck, "#C99A68", Mat(puff=3, profile="pillow", line_w=1.3, tex=1.0), decal=[(m_clip(m_union(*planks), deck), "#9E6E42", 0.3)])
    # voilier
    bx, by = 130, 780
    coque = R.mask(catmull([(bx - 48, by - 18), (bx + 48, by - 18), (bx + 36, by + 4), (bx - 36, by + 4)], n=5))
    part(R, coque, "#FFFDF4", Mat(puff=6, profile="pillow", line_w=1.3), decal=[(R.mask(rrect(bx - 48, by - 12, 96, 6, 2)), CANARD, 1.0)])
    part(R, R.mask(rrect(bx - 2, by - 110, 4, 92, 1.5)), "#8E5F37", Mat(puff=1.5, line_w=0.8), shadow=False)
    part(R, R.mask(np.array([(bx + 4, by - 106), (bx + 4, by - 24), (bx + 46, by - 26)], float)), "#FFFDF4", Mat(puff=4, line_w=1.1), shadow=False)
    part(R, R.mask(np.array([(bx - 4, by - 96), (bx - 4, by - 26), (bx - 36, by - 28)], float)), "#FFE9A8", Mat(puff=4, line_w=1.1), shadow=False)
    for k in range(3):
        xx = bx - 54 + k * 38
        flat(R, R.line_mask([(xx, by + 12), (xx + 10, by + 7), (xx + 20, by + 12), (xx + 30, by + 7)], 2.2), "#F2FBF8")

def remplissage(R, ident):
    if ident == "C":
        caisses(R)
    elif ident == "E":
        phare(R)
    elif ident == "F":
        ponton(R)
    else:
        x, y = DISPOSITION["emplacements"][ident]
        D.bush(R, x, y - 14, 0.9, seed=85, flowers=CANARD)

# ---------------------------------------------------------------------------- lieux
def drapeau_flottant(R, x, y, l, h, couleur, ondes=1.0):
    """Un drapeau qui flotte au vent, attaché au mât en (x, y) (coin haut gauche) : rend le masque."""
    haut = [(x + l * t, y + 5 * ondes * math.sin(t * math.pi * 1.6)) for t in np.linspace(0, 1, 12)]
    bas = [(x + l * t, y + h + 5 * ondes * math.sin(t * math.pi * 1.6)) for t in np.linspace(1, 0, 12)]
    m = R.mask(np.array(haut + bas, float))
    return m

def mat(R, x, y, h, c="#FFFDF4"):
    part(R, R.mask(rrect(x - 4, y - h, 8, h, 3)), c, Mat(puff=3, line_w=1.1, tex=0.6))
    part(R, R.mask(circle(x, y - h - 4, 7)), "#FFC145", Mat(puff=3, spec=0.4, line_w=1.0), shadow=False)

def drapeau(R):
    """Le drapeau mystère : un mât, un drapeau au grand point d'interrogation, et le globe sur son pied."""
    x, y = 318, 490
    D.ground_shadow(R, x + 8, y + 3, 96, 11, 0.26, dx=6, blur=5)
    px = x - 50
    part(R, R.mask(ellipse(px, y - 4, 22, 8)), "#C9C1B2", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0))
    mat(R, px, y - 6, 216)
    fm = drapeau_flottant(R, px + 4, y - 214, 112, 72, CANARD)
    part(R, fm, CANARD, Mat(puff=5, profile="pillow", line_w=1.3, tex=0.6))
    flat(R, D.text_mask(R, "?", px + 62, y - 176, 52), "#FFFDF4")
    # le globe
    gx, gy = x + 56, y - 72
    part(R, R.mask(catmull([(gx - 26, y), (gx + 26, y), (gx + 10, y - 12), (gx - 10, y - 12)], n=4)), "#A9703F", Mat(puff=4, profile="pillow", line_w=1.1, tex=1.0))
    part(R, R.mask(rrect(gx - 3, gy + 20, 6, 46, 2)), "#A9703F", Mat(puff=2, line_w=0.9, tex=1.0))
    terres = m_union(R.mask(catmull([(gx - 22, gy - 14), (gx - 4, gy - 24), (gx + 4, gy - 12), (gx - 6, gy + 2), (gx - 18, gy - 2)], n=6)),
                     R.mask(catmull([(gx + 8, gy + 4), (gx + 24, gy - 2), (gx + 26, gy + 14), (gx + 12, gy + 22)], n=6)))
    globe = R.mask(circle(gx, gy, 34))
    part(R, globe, "#5BB8E6", Mat(puff=12, spec=0.35, line_w=1.4), decal=[(m_clip(terres, globe), "#7FC46A", 1.0)])
    arc = [(gx + 40 * math.cos(a), gy + 40 * math.sin(a)) for a in np.linspace(math.radians(110), math.radians(400), 20)]
    flat(R, R.line_mask(arc, 3.0), "#A9703F")

def atelierdrapeaux(R):
    """L'atelier des drapeaux : la table, les pots de peinture, un drapeau à moitié peint, et un fil où sèchent des drapeaux."""
    x, y = 842, 522
    # le fil et ses drapeaux, entre deux poteaux
    C.poteau(R, x - 108, y - 64, 100)
    C.poteau(R, x + 108, y - 70, 100)
    def at(t):
        return (x - 108 + 216 * t, y - 158 + 16 * math.sin(math.pi * t) - 6 * t)
    flat(R, R.line_mask([at(t) for t in np.linspace(0, 1, 24)], 1.6), "#8A6A4E")
    for k, (bandes, sens) in enumerate(((("bleu", "blanc", "rouge"), "v"), (("vert", "blanc", "rouge"), "v"), (("noir", "rouge", "jaune"), "h"), (("bleu", "jaune"), "h"))):
        t = (k + 0.5) / 4
        cx, cy = at(t)
        w, hh = 36, 26
        cadre = R.mask(rrect(cx - w / 2, cy + 2, w, hh, 2))
        dec = []
        for j, b in enumerate(bandes):
            if sens == "v":
                band = R.mask(rrect(cx - w / 2 + j * w / len(bandes), cy + 2, w / len(bandes) + 0.5, hh, 0))
            else:
                band = R.mask(rrect(cx - w / 2, cy + 2 + j * hh / len(bandes), w, hh / len(bandes) + 0.5, 0))
            dec.append((m_clip(band, cadre), DRAPEAUX[b], 0.3))
        part(R, cadre, "#FFFFFF", Mat(puff=3, profile="pillow", line_w=1.0, tex=0.5), decal=dec, shadow=False)
        flat(R, R.mask(rrect(cx - 2, cy - 2, 4, 7, 1)), "#E2C48E")
    # la table de peinture
    C.table(R, x, y, w=170, h=44, c="#D9A26E")
    tx, ty = x - 24, y - 56
    feuille = R.mask(rrect(tx - 40, ty - 26, 80, 26, 2))
    part(R, feuille, "#FFFFFF", Mat(puff=2, line_w=1.0, tex=0.4), decal=[(m_clip(R.mask(rrect(tx - 40, ty - 26, 27, 26, 0)), feuille), DRAPEAUX["bleu"], 0.3)], shadow=False)
    flat(R, R.line_mask([(tx - 6, ty - 34), (tx + 30, ty - 4)], 3.2, smooth_it=False), "#A9703F")
    part(R, R.mask(ellipse(tx - 8, ty - 36, 4, 6, -40)), DRAPEAUX["bleu"], Mat(puff=1.5, line_w=0.7), shadow=False)
    for k, c in enumerate(("bleu", "rouge", "jaune")):
        px = x + 34 + k * 22
        part(R, R.mask(rrect(px - 9, ty - 20, 18, 20, 3)), "#E9E4DA", Mat(puff=3, profile="pillow", line_w=1.0, tex=0.6))
        part(R, R.mask(ellipse(px, ty - 20, 9, 3.5)), DRAPEAUX[c], Mat(puff=2, line_w=0.8), shadow=False)

def monDrapeau(R):
    """Le drapeau de mon île : le grand mât, en haut de l'île, et un drapeau inventé (une vague et une étoile)."""
    x, y = 590, 410
    D.ground_shadow(R, x + 8, y + 3, 54, 10, 0.26, dx=6, blur=5)
    socle = R.mask(catmull([(x - 40, y), (x - 32, y - 22), (x + 32, y - 22), (x + 40, y)], n=4))
    pierres = m_union(*[R.mask(ellipse(x - 26 + k * 17, y - 11 + (k % 2) * 4, 9, 6)) for k in range(4)])
    part(R, socle, "#C9C1B2", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), decal=[(m_clip(pierres, socle), "#B3AA98", 1.0)])
    mat(R, x, y - 20, 218)
    fm = drapeau_flottant(R, x + 4, y - 236, 124, 80, "#FFFDF4", ondes=1.2)
    vague = R.mask(np.array([(x + 4 + 124 * t, y - 176 + 6 * math.sin(t * math.pi * 1.6) - 8 * math.sin(t * math.pi * 3)) for t in np.linspace(0, 1, 16)]
                            + [(x + 4 + 124 * t, y - 150 + 6 * math.sin(t * math.pi * 1.6)) for t in np.linspace(1, 0, 16)], float))
    etoile = []
    ex, ey = x + 66, y - 210
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        r = 15 if k % 2 == 0 else 6.5
        etoile.append((ex + r * math.cos(a), ey + r * math.sin(a)))
    part(R, fm, "#FFFDF4", Mat(puff=5, profile="pillow", line_w=1.3, tex=0.6),
         decal=[(m_clip(vague, fm), CANARD, 0.6), (R.mask(np.array(etoile, float)), "#FFC145", 0.6)])
    # petite flamme au sommet du mât
    part(R, R.mask(np.array([(x + 4, y - 246), (x + 30, y - 241), (x + 4, y - 236)], float)), "#E85D9A", Mat(puff=2, line_w=0.9), shadow=False)

def anime(R, nom):
    raise KeyError(nom)

def lieu(R, activite):
    {"drapeau": drapeau, "atelierdrapeaux": atelierdrapeaux, "monDrapeau": monDrapeau}[activite](R)

DESSINS = {"base": base, "remplissage": remplissage, "lieu": lieu, "anime": anime}
