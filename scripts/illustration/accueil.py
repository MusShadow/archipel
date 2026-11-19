"""Accueil d'Archipel 2 (livraison 2) : la plage où l'on choisit qui part en voyage, et les compagnons de voyage.
Chaque enfant a un bébé animal coiffé d'un chapeau d'explorateur de sa couleur : huit animaux (aucun n'est un hôte des
îles), et un chapeau par couleur de profil, posé par l'appli sur la tête de l'animal (point « chapeau » de chaque
animal). Le buste est coupé en bas par le cercle de l'avatar : les oreilles et le chapeau peuvent en dépasser."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, eye_parts, mouth, brow, leaf, INK
import decors as D

# ---------------------------------------------------------------------------- la plage
PLAGE = (1194, 834)

def plage(R):
    W, H = PLAGE
    D.sky(R)
    for (x, y, s, sd) in ((170, 96, 0.9, 1), (880, 76, 0.7, 2), (1060, 160, 0.8, 3), (520, 150, 0.55, 4)):
        D.cloud(R, x, y, s, sd)
    D.far_islands(R)
    D.sea(R, None)
    # sable : la plage monte du bas de l'écran jusqu'à la ligne d'écume
    rive = [(-30, 520), (120, 500), (300, 486), (520, 478), (760, 482), (980, 494), (1230, 508), (1230, 870), (-30, 870)]
    sable = R.mask(catmull(rive, n=14, closed=True))
    mouille = m_sub(m_grow(sable, 14 * R.S), sable)
    R.paint(mouille, "#BFD9C9", Mat(puff=4, profile="pillow", line=False, tex=0.6))
    ecume = m_wobble(m_sub(m_grow(sable, 6 * R.S), m_grow(sable, 1 * R.S)), 1.5 * R.S, 18 * R.S, seed=91)
    R.paint(ecume, "#F7FCFA", Mat(flat=True))
    def sable_alb(x, y, base):
        t = np.clip((y - 480) / 340, 0, 1)[..., None]
        return mix(L("#F6E3B8"), L("#EED29A"), t)
    R.paint(sable, "#F3DDAF", Mat(puff=10, profile="pillow", line=False, tex=1.0), albedo=sable_alb)
    r = np.random.default_rng(5)
    for k in range(60):  # grains et petites ondulations du sable
        x, y = r.random() * W, 520 + r.random() * 300
        flat(R, R.line_mask([(x, y), (x + 10, y - 2), (x + 20, y)], 1.2), "#E3C68C")
    # coquillages, étoile de mer, bouée de Plume
    for (x, y, c) in ((140, 760, "#F6A3C0"), (1040, 720, "#FFD9B0"), (980, 790, "#F6A3C0")):
        m = R.mask(catmull([(x - 12, y + 6), (x - 10, y - 6), (x, y - 12), (x + 10, y - 6), (x + 12, y + 6)], n=6))
        fan = m_union(*[R.line_mask([(x, y + 6), (x + dx, y - 8)], 1.0, smooth_it=False) for dx in (-8, -4, 0, 4, 8)])
        part(R, m, c, Mat(puff=3, profile="pillow", line_w=1.0), decal=[(m_clip(fan, m), tweak(L(c), dl=-0.1), 0.3)])
    sx, sy = 230, 700
    etoile = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = 22 if k % 2 == 0 else 10
        etoile.append((sx + math.cos(a) * rr, sy + math.sin(a) * rr * 0.8))
    part(R, R.mask(catmull(etoile, n=4)), "#FF8E5E", Mat(puff=4, profile="pillow", line_w=1.2, tex=0.9))
    # palmiers des deux côtés, buissons fleuris au pied
    D.palm(R, 70, 640, 1.15, lean=14, seed=4)
    D.palm(R, 1140, 610, 1.05, lean=-16, seed=6)
    D.bush(R, 60, 690, 0.9, seed=13, flowers="#E85D9A")
    D.bush(R, 1150, 670, 0.85, "#56A84A", seed=14, flowers="#FFC145")
    # barque au bord de l'eau, à droite
    coque = R.mask(catmull([(960, 446), (1040, 446), (1028, 466), (972, 466)], n=6))
    part(R, coque, "#1FA9B5", Mat(puff=6, spec=0.2, line_w=1.3), decal=[(R.mask(rrect(958, 444, 84, 6, 2)), "#FFFFFF", 0.4)])

# ---------------------------------------------------------------------------- compagnons
CADRE_ANIMAL = (240, 260)
DISQUE = (120, 150, 100)  # centre et rayon du cercle de l'avatar

def _decoupe(R):
    """Le buste ne descend pas sous le cercle de l'avatar."""
    cx, cy, rr = DISQUE
    return m_union(R.mask(circle(cx, cy, rr - 2)), R.mask(rrect(0, 0, 240, cy, 0)))

def _yeux(R, x1, x2, y, r, lid, look=(0.8, 1.0)):
    eye_parts(R, x1, y, "ouvert", r=r, look=look, lid=lid)
    eye_parts(R, x2, y, "ouvert", r=r, look=look, lid=lid)

def _joues(R, x1, x2, y, c="#F49AB8", rx=11, ry=6.5):
    for x in (x1, x2):
        R.paint(R.mask(ellipse(x, y, rx, ry)), c, Mat(flat=True))

def _corps(R, c, clair=None):
    cut = _decoupe(R)
    corps = m_clip(R.mask(catmull([(44, 266), (56, 220), (84, 180), (156, 180), (184, 220), (196, 266)], n=8)), cut)
    part(R, corps, c, Mat(puff=16, line_w=1.6, tex=0.8),
         decal=[(m_clip(R.mask(ellipse(120, 236, 34, 30)), corps), clair, 6.0)] if clair else None)

def renard(R):
    O, O_D, B = "#F08A3C", "#C9672A", "#FFF6EA"
    _corps(R, O, B)
    for sx in (-1, 1):
        oreille = R.mask(catmull([(120 + sx * 34, 96), (120 + sx * 62, 34), (120 + sx * 70, 100)], n=6))
        part(R, oreille, O, Mat(puff=8, line_w=1.5), decal=[(R.mask(catmull([(120 + sx * 56, 50), (120 + sx * 64, 34), (120 + sx * 72, 60)], n=4)), "#3A2E2A", 2.0),
                                                            (R.mask(catmull([(120 + sx * 42, 92), (120 + sx * 60, 50), (120 + sx * 62, 92)], n=5)), "#F7C9A8", 2.0)])
    tete = R.mask(catmull([(120, 70), (168, 84), (186, 124), (172, 160), (120, 186), (68, 160), (54, 124), (72, 84)], n=10))
    part(R, tete, O, Mat(puff=22, spec=0.05, line_w=1.7),
         decal=[(R.mask(catmull([(66, 136), (96, 140), (120, 160), (144, 140), (174, 136), (160, 172), (120, 188), (80, 172)], n=8)), B, 3.0)])
    _yeux(R, 96, 144, 124, 12, O)
    part(R, R.mask(ellipse(120, 152, 9, 6.5)), "#2E2A2A", Mat(puff=3, spec=0.6, shin=40, line_w=0.9), shadow=False)
    mouth(R, 120, 162, 18, "sourire", ink="#5A3A2A")
    _joues(R, 82, 158, 148)

def lapin(R):
    G, G_D, R_ = "#EDE4DA", "#C9BBAE", "#F6B5C6"
    _corps(R, G, "#FFFFFF")
    for sx in (-1, 1):
        oreille = R.mask(catmull([(120 + sx * 16, 92), (120 + sx * 20, 40), (120 + sx * 34, 4), (120 + sx * 48, 30), (120 + sx * 44, 96)], n=8))
        part(R, oreille, G, Mat(puff=10, line_w=1.5), decal=[(R.mask(catmull([(120 + sx * 24, 88), (120 + sx * 26, 44), (120 + sx * 34, 18), (120 + sx * 41, 40), (120 + sx * 38, 88)], n=6)), R_, 2.5)])
    tete = R.mask(catmull([(120, 76), (162, 86), (180, 124), (168, 162), (120, 182), (72, 162), (60, 124), (78, 86)], n=10))
    part(R, tete, G, Mat(puff=22, spec=0.05, line_w=1.7), decal=[(R.mask(ellipse(120, 156, 30, 20)), "#FFFFFF", 4.0)])
    _yeux(R, 98, 142, 124, 11.5, G)
    part(R, R.mask(catmull([(112, 146), (128, 146), (120, 154)], n=4)), "#F28CA8", Mat(puff=3, line_w=0.9), shadow=False)
    mouth(R, 120, 158, 16, "sourire", ink="#7A5A5A")
    _joues(R, 84, 156, 148)

def ourson(R):
    B, B_D, M = "#A87148", "#7E5131", "#E6C59C"
    _corps(R, B, M)
    for sx in (-1, 1):
        part(R, R.mask(circle(120 + sx * 54, 82, 22)), B, Mat(puff=10, line_w=1.5), decal=[(R.mask(circle(120 + sx * 54, 84, 11)), "#D9A47A", 2.0)])
    tete = R.mask(catmull([(120, 70), (166, 82), (184, 122), (172, 162), (120, 186), (68, 162), (56, 122), (74, 82)], n=10))
    part(R, tete, B, Mat(puff=22, spec=0.05, line_w=1.7), decal=[(R.mask(ellipse(120, 156, 30, 23)), M, 3.0)])
    _yeux(R, 96, 144, 122, 11.5, B)
    part(R, R.mask(ellipse(120, 146, 11, 8)), "#3A2A22", Mat(puff=3, spec=0.6, shin=40, line_w=0.9), shadow=False)
    mouth(R, 120, 160, 18, "sourire", ink="#4A2C1C")
    _joues(R, 80, 160, 148)

def chaton(R):
    G, G_D = "#A9B2C2", "#7E889B"
    _corps(R, G, "#F4F1EC")
    for sx in (-1, 1):
        oreille = R.mask(catmull([(120 + sx * 28, 90), (120 + sx * 56, 40), (120 + sx * 68, 98)], n=6))
        part(R, oreille, G, Mat(puff=8, line_w=1.5), decal=[(R.mask(catmull([(120 + sx * 38, 88), (120 + sx * 54, 54), (120 + sx * 60, 90)], n=5)), "#F6B5C6", 2.0)])
    tete = R.mask(catmull([(120, 72), (168, 84), (186, 126), (170, 164), (120, 184), (70, 164), (54, 126), (72, 84)], n=10))
    rayures = m_union(*[R.line_mask([(120 + dx, 74), (120 + dx * 1.1, 96)], 4.0) for dx in (-12, 0, 12)],
                      *[R.line_mask([(120 + sx * 66, 118 + k * 12), (120 + sx * 50, 120 + k * 12)], 3.6) for sx in (-1, 1) for k in range(2)])
    part(R, tete, G, Mat(puff=22, spec=0.05, line_w=1.7), decal=[(m_clip(rayures, tete), G_D, 0.6), (R.mask(ellipse(120, 156, 28, 20)), "#F4F1EC", 4.0)])
    eye_parts(R, 96, 124, "ouvert", r=12.5, look=(0.8, 1.2), lid=G)
    eye_parts(R, 144, 124, "ouvert", r=12.5, look=(0.8, 1.2), lid=G)
    part(R, R.mask(catmull([(113, 146), (127, 146), (120, 153)], n=4)), "#F28CA8", Mat(puff=3, line_w=0.9), shadow=False)
    mouth(R, 120, 157, 16, "sourire", ink="#5A5A6A")
    for sx in (-1, 1):
        for k in (-1, 1):
            flat(R, R.line_mask([(120 + sx * 24, 152 + k * 3), (120 + sx * 50, 148 + k * 7)], 1.3, smooth_it=False), "#6B7280")
    _joues(R, 82, 158, 146)

def panda(R):
    Wt, K = "#FAF8F4", "#2F3340"
    _corps(R, K)
    for sx in (-1, 1):
        part(R, R.mask(circle(120 + sx * 54, 82, 21)), K, Mat(puff=10, line_w=1.4))
    tete = R.mask(catmull([(120, 70), (166, 82), (184, 122), (172, 162), (120, 186), (68, 162), (56, 122), (74, 82)], n=10))
    taches = m_union(*[R.mask(ellipse(120 + sx * 25, 126, 14, 17, sx * -28)) for sx in (-1, 1)])
    part(R, tete, Wt, Mat(puff=22, spec=0.05, line_w=1.7), decal=[(taches, K, 0.8)])
    _yeux(R, 96, 144, 124, 9.5, K, look=(0.6, 0.8))
    part(R, R.mask(ellipse(120, 148, 10, 7)), K, Mat(puff=3, spec=0.6, shin=40, line_w=0.9), shadow=False)
    mouth(R, 120, 160, 17, "sourire", ink="#3A3A44")
    _joues(R, 80, 160, 152)

def lionceau(R):
    Y, Y_D, C = "#E9B24C", "#C98F2E", "#C9772C"
    _corps(R, Y, "#FFF0CF")
    crin = R.mask(catmull([(120 + 88 * math.cos(a) * (1.0 if k % 2 == 0 else 0.86), 128 + 82 * math.sin(a) * (1.0 if k % 2 == 0 else 0.86))
                           for k, a in enumerate(np.linspace(0, 2 * math.pi, 22, endpoint=False))], n=6))
    part(R, m_clip(crin, _decoupe(R)), C, Mat(puff=14, line_w=1.6, tex=1.0))
    for sx in (-1, 1):
        part(R, R.mask(circle(120 + sx * 50, 84, 16)), Y, Mat(puff=8, line_w=1.4), decal=[(R.mask(circle(120 + sx * 50, 86, 8)), "#F5D190", 2.0)])
    tete = R.mask(catmull([(120, 76), (162, 86), (178, 124), (166, 160), (120, 180), (74, 160), (62, 124), (78, 86)], n=10))
    part(R, tete, Y, Mat(puff=22, spec=0.05, line_w=1.7), decal=[(R.mask(ellipse(120, 154, 28, 21)), "#FFF0CF", 3.0)])
    _yeux(R, 98, 142, 122, 11.5, Y)
    part(R, R.mask(catmull([(110, 142), (130, 142), (120, 152)], n=4)), "#6B3E26", Mat(puff=3, spec=0.4, line_w=0.9), shadow=False)
    mouth(R, 120, 158, 17, "sourire", ink="#6B3E26")
    _joues(R, 84, 156, 146)

def pingouin(R):
    K, Wt, O = "#3A4560", "#FBFAF6", "#FFA23F"
    _corps(R, K, Wt)
    tete = R.mask(catmull([(120, 66), (166, 80), (184, 122), (172, 164), (120, 188), (68, 164), (56, 122), (74, 80)], n=10))
    masque = R.mask(catmull([(120, 108), (150, 96), (172, 120), (164, 158), (120, 180), (76, 158), (68, 120), (90, 96)], n=10))
    part(R, tete, K, Mat(puff=22, spec=0.12, shin=24, line_w=1.7), decal=[(masque, Wt, 2.5)])
    # petite houppe sur la tête (sous le chapeau, elle dépasse un peu)
    _yeux(R, 100, 140, 128, 10.5, Wt)
    bec = R.mask(catmull([(106, 146), (134, 146), (120, 160)], n=5))
    part(R, bec, O, Mat(puff=4, spec=0.3, line_w=1.0), shadow=False)
    _joues(R, 84, 156, 150)

def elephant(R):
    G, G_D, R_ = "#A4B6CB", "#7F94AE", "#F2B7C7"
    _corps(R, G)
    for sx in (-1, 1):
        oreille = R.mask(catmull([(120 + sx * 40, 92), (120 + sx * 84, 70), (120 + sx * 104, 112), (120 + sx * 92, 156), (120 + sx * 48, 150)], n=8))
        part(R, oreille, G, Mat(puff=12, line_w=1.5), decal=[(R.mask(catmull([(120 + sx * 52, 100), (120 + sx * 82, 84), (120 + sx * 94, 114), (120 + sx * 84, 144), (120 + sx * 56, 138)], n=6)), R_, 4.0)])
    tete = R.mask(catmull([(120, 72), (160, 82), (176, 118), (164, 152), (120, 166), (76, 152), (64, 118), (80, 82)], n=10))
    trompe = R.mask(ribbon(stroke_pts([(120, 140), (122, 168), (132, 186), (146, 188)], n=8), np.linspace(17, 9, 25)))
    part(R, m_union(tete, trompe), G, Mat(puff=20, spec=0.05, line_w=1.7))
    for k in range(3):
        flat(R, R.line_mask([(112 + k * 1.5, 166 + k * 7), (128 + k * 2, 164 + k * 7)], 1.4, smooth_it=False), G_D)
    _yeux(R, 100, 140, 118, 10.5, G)
    mouth(R, 106, 156, 12, "petit", ink="#4A5468")
    _joues(R, 84, 156, 138)

ANIMAUX = {"renard": renard, "lapin": lapin, "ourson": ourson, "chaton": chaton, "panda": panda, "lionceau": lionceau, "pingouin": pingouin, "elephant": elephant}
# Où poser le chapeau : milieu du bord bas du chapeau (sur le crâne), largeur du bord, inclinaison (degrés).
CHAPEAUX_SUR = {
    "renard": ((120, 90), 108, -4), "lapin": ((120, 94), 96, 3), "ourson": ((120, 86), 112, -3), "chaton": ((120, 90), 108, 4),
    "panda": ((120, 86), 112, -3), "lionceau": ((120, 90), 104, 3), "pingouin": ((120, 82), 112, -4), "elephant": ((120, 88), 104, 3),
}

# ---------------------------------------------------------------------------- chapeaux d'explorateur
CADRE_CHAPEAU = (160, 110)
BASE_CHAPEAU = (80, 80)  # milieu du bord, là où le chapeau touche la tête
LARGEUR_CHAPEAU = 130    # largeur du bord, d'un bout à l'autre

def chapeau(R, c):
    cx, by = BASE_CHAPEAU
    bord = R.mask(catmull([(cx - 65, by + 2), (cx - 40, by - 8), (cx + 40, by - 8), (cx + 65, by + 2), (cx + 40, by + 14), (cx - 40, by + 14)], n=8))
    dome = R.mask(catmull([(cx - 42, by - 2), (cx - 40, by - 34), (cx - 18, by - 56), (cx + 18, by - 56), (cx + 40, by - 34), (cx + 42, by - 2)], n=8))
    bande = m_clip(R.mask(rrect(cx - 50, by - 20, 100, 14, 2)), dome)
    fonce = tweak(L(c), dl=-0.12, sat=1.05)
    part(R, bord, c, Mat(puff=8, profile="pillow", line_w=1.5, tex=0.9))
    part(R, dome, c, Mat(puff=16, spec=0.12, line_w=1.6, tex=0.9), decal=[(bande, fonce, 0.5)])
    part(R, R.mask(circle(cx, by - 57, 6)), fonce, Mat(puff=3, line_w=1.0), shadow=False)
    # petite plume d'explorateur sur la bande
    pl = R.mask(leaf((cx + 26, by - 16), (cx + 46, by - 50), 10, 0.15))
    part(R, pl, "#FFFDF4", Mat(puff=3, line_w=1.0, tex=0.5))

COULEURS = {"jaune": "#FFC145", "corail": "#FF7F50", "rose": "#E85D9A", "violet": "#8C6BE0", "bleu": "#3D8BEA", "turquoise": "#1FA9B5", "vert": "#34B37A"}

ELEMENTS = {
    "accueil/plage": dict(cadre=PLAGE, dessin=plage, opaque=True, qualite=80),
    **{f"accueil/compagnon-{n}": dict(cadre=CADRE_ANIMAL, dessin=f, points={"disque": DISQUE[:2], "chapeau": CHAPEAUX_SUR[n][0]},
                                      infos={"rayon": DISQUE[2], "chapeauLargeur": CHAPEAUX_SUR[n][1], "chapeauAngle": CHAPEAUX_SUR[n][2]})
       for n, f in ANIMAUX.items()},
    **{f"accueil/chapeau-{n}": dict(cadre=CADRE_CHAPEAU, dessin=(lambda R, c=c: chapeau(R, c)), points={"base": BASE_CHAPEAU},
                                    infos={"largeur": LARGEUR_CHAPEAU}) for n, c in COULEURS.items()},
}
