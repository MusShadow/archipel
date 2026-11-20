"""Objets des jeux de l'île des Découvertes, dessinés pour Archipel 2 (livraison 4), mêmes matières que le marché :
- « Flotte ou coule ? » : le bassin de verre d'Octave, en deux couches (le fond : l'eau, le sable, les plantes ; le
  devant : les bords de verre, le socle en bois, un voile d'eau très léger et les reflets), entre lesquelles l'appli
  fait tomber les objets de l'imagier ; et les deux réponses (« il flotte », « il coule ») en petites vignettes ;
- « Le grand tri » : les poubelles à roulettes (jaune, bleue, verte, blanche, marron, grise) et le composteur, chacune
  en deux calques du même cadre : le corps avec son étiquette, et le couvercle, que l'appli soulève ;
- « Le volcan d'Octave » : le volcan coupé en deux (la terre en couches, la poche de magma, la cheminée vide, le cratère),
  et ce que l'appli pose par-dessus : la lave dans le cratère, la coulée, le nuage de cendres, le jet de l'éruption.
  Même repère que le volcan de l'appli (200 × 160), trois fois plus grand : les parties tombent sous les zones touchables."""
import math
import numpy as np
import cv2
from moteur import *
from personnages import part, flat, leaf, INK
import decors as D

def glacis(R, m, c, op, flou=0.0):
    """Voile translucide (verre, eau, reflet) : la couleur c, à l'opacité op, par-dessus ce qui est déjà peint.
    Rendu sur noir puis sur blanc, il donne une transparence partielle dans l'image finale."""
    a = m.to((0, 0, R.w, R.h))
    if flou:
        a = cv2.GaussianBlur(a, (0, 0), flou * R.S)
    a = (a * op)[..., None]
    R.img = R.img * (1 - a) + L(c) * a

BOIS, BOIS_D, BOIS_L = "#C98B55", "#9C6A3F", "#E2B07A"

# ---------------------------------------------------------------------------- le bassin de verre (« Flotte ou coule ? »)
BASSIN = (600, 300)
EAU_Y = 132          # la ligne d'eau, à 44 % de la hauteur : l'appli pose les objets qui flottent dessus
SABLE_Y = 240        # le dessus du sable, à 80 % : les objets qui coulent s'y posent
_DEHORS = (10, 10, 580, 264, 24)     # le bassin, bords de verre compris
_DEDANS = (24, 20, 552, 250, 14)     # l'intérieur, vu à travers la vitre de devant
_SOCLE = (4, 256, 592, 36, 12)

def _vague(y, x0, x1, amp=2.4, n=9, phase=0.0):
    return [(x0 + (x1 - x0) * k / (n * 4), y + amp * math.sin(phase + k * math.pi / 2)) for k in range(n * 4 + 1)]

def bassin_fond(R):
    W, H = BASSIN
    # l'ombre du bassin, posé sur la table
    R.cast(R.mask(rrect(26, 270, W - 52, 20, 10)), 0, 3, 8, 0.30)
    dedans = R.mask(rrect(*_DEDANS))
    # la vitre du fond, au-dessus de l'eau : un aqua très pâle
    def alb_air(x, y, base):
        t = np.clip((y - 20) / (EAU_Y - 20), 0, 1)[..., None]
        return mix(L("#F7FCFC"), L("#E2F2F3"), t)
    part(R, dedans, "#EEF8F8", Mat(puff=3, profile="pillow", line=False, tex=0.2), albedo=alb_air, shadow=False)
    # l'eau, plus profonde vers le bas, avec des rais de lumière
    eau = m_clip(R.mask(np.array(_vague(EAU_Y, 0, W, 1.6) + [(W, H), (0, H)], float)), dedans)
    def alb_eau(x, y, base):
        t = np.clip((y - EAU_Y) / (SABLE_Y - EAU_Y), 0, 1)[..., None]
        return mix(L("#9FDCE8"), L("#4C9FC0"), t ** 0.9)
    rais = m_union(*[R.mask(np.array([(x, EAU_Y), (x + 26, EAU_Y), (x + 96, SABLE_Y), (x + 58, SABLE_Y)], float)) for x in (130, 250, 372, 470)])
    part(R, eau, "#7CC3DA", Mat(puff=2, profile="pillow", line=False, tex=0.3), albedo=alb_eau,
         decal=[(m_clip(rais, eau), "#CDEFF5", 9.0)], shadow=False)
    # le sable du fond, ondulé, piqué de grains
    sable = m_clip(R.mask(np.array(_vague(SABLE_Y, 0, W, 3.2, n=6, phase=1.0) + [(W, H), (0, H)], float)), dedans)
    r = np.random.default_rng(5)
    grains = m_union(*[R.mask(circle(x, y, 1.3)) for x, y in zip(r.uniform(30, W - 30, 70), r.uniform(SABLE_Y + 4, 262, 70))])
    part(R, sable, "#E8D3A2", Mat(puff=4, profile="pillow", line_w=1.2, tex=0.9), decal=[(grains, "#C9AE78", 0.3)], shadow=False)
    # galets de couleur, à demi enfouis
    for x, y, rx, ry, c in ((118, 250, 13, 8, "#9AA3B5"), (140, 254, 8, 5, "#E8A27E"), (300, 252, 10, 6, "#C8B8E8"),
                            (330, 255, 7, 4.5, "#9AA3B5"), (436, 251, 12, 7, "#B5C99A"), (462, 256, 8, 5, "#E8C27E")):
        g = R.mask(ellipse(x, y, rx, ry))
        part(R, g, c, Mat(puff=4, line_w=1.1, spec=0.25, shin=30, tex=0.4), decal=[(R.mask(ellipse(x - rx * 0.35, y - ry * 0.4, rx * 0.35, ry * 0.3)), "#FFFFFF", 1.5)])
    # un coquillage
    cx, cy = 512, 252
    coq = R.mask(catmull([(cx - 14, cy + 4), (cx - 12, cy - 8), (cx, cy - 14), (cx + 12, cy - 8), (cx + 14, cy + 4), (cx, cy + 6)], n=8))
    stries = m_union(*[R.line_mask([(cx, cy + 5), (cx + 15 * math.cos(a), cy + 5 - 17 * math.sin(a))], 1.0, smooth_it=False) for a in np.linspace(0.35, 2.8, 6)])
    part(R, coq, "#FFE3D2", Mat(puff=4, line_w=1.1, spec=0.2, tex=0.4), decal=[(m_clip(stries, coq), "#E8A27E", 0.3)])
    # des plantes d'eau dans les coins : de longues feuilles souples
    for (bx, by, tips, c) in ((52, 258, [(30, 150), (58, 128), (80, 168), (96, 196)], "#4FA35A"),
                              (556, 258, [(540, 168), (566, 142), (582, 190)], "#5FB04F")):
        for k, (tx, ty) in enumerate(tips):
            f = R.mask(leaf((bx + (k - 1) * 5, by), (tx, ty), 15, bend=0.06 * (1 if tx > bx else -1)))
            part(R, m_clip(f, dedans), tweak(L(c), dl=0.03 * (k % 2)), Mat(puff=5, line_w=1.2, tex=0.8, spec=0.05),
                 decal=[(R.line_mask([(bx + (k - 1) * 5, by), ((bx + tx) / 2, (by + ty) / 2), (tx, ty)], 1.2), "#2F8241", 0.4)])
    # quelques bulles qui montent des plantes
    for x, y, rr in ((74, 150, 4.5), (86, 126, 3.2), (70, 140, 2.4), (548, 150, 3.8), (556, 132, 2.6)):
        b = m_sub(R.mask(circle(x, y, rr)), R.mask(circle(x, y, rr - 1.2)))
        flat(R, b, "#E9F8FB")
        flat(R, R.mask(circle(x - rr * 0.35, y - rr * 0.35, rr * 0.28)), "#FFFFFF")

def bassin_devant(R):
    W, H = BASSIN
    dehors, dedans = R.mask(rrect(*_DEHORS)), R.mask(rrect(*_DEDANS))
    # un voile d'eau très léger sur ce qui est dans l'eau (les objets qui ont coulé ont l'air mouillés)
    eau = m_clip(R.mask(np.array(_vague(EAU_Y, 0, W, 1.6) + [(W, H), (0, H)], float)), dedans)
    glacis(R, eau, "#2E86A8", 0.15)
    # la ligne d'eau : un fil de lumière, et un liseré plus clair juste dessous
    glacis(R, m_clip(R.line_mask(_vague(EAU_Y + 3.5, 0, W, 1.6), 5.0), dedans), "#E6F8FB", 0.25, flou=1.2)
    glacis(R, m_clip(R.line_mask(_vague(EAU_Y, 0, W, 1.6), 1.8), dedans), "#FFFFFF", 0.6)
    # reflets sur la vitre de devant : deux traits obliques à gauche, un petit en haut à droite
    for pts, w, op in ((((150, 34), (112, 168)), 12, 0.20), (((176, 34), (164, 74)), 5, 0.22), (((520, 34), (508, 58)), 6, 0.24)):
        glacis(R, R.line_mask(list(pts), w, smooth_it=False), "#FFFFFF", op, flou=1.5)
    # les bords de verre : une bande aqua claire, biseautée, avec son trait d'encre
    bords = m_sub(dehors, dedans)
    part(R, bords, "#CDEEEE", Mat(puff=5, profile="pillow", line_w=1.5, spec=0.5, shin=40, tex=0.2),
         decal=[(m_clip(R.line_mask([(16, 30), (16, 250)], 2.2, smooth_it=False), bords), "#FFFFFF", 0.6),
                (m_clip(R.line_mask([(W - 16, 30), (W - 16, 250)], 2.2, smooth_it=False), bords), "#FFFFFF", 0.6)], shadow=False)
    # le socle en bois
    socle = R.mask(rrect(*_SOCLE))
    veines = m_union(*[R.line_mask(_vague(y, 20, W - 20, 1.2, n=5, phase=y), 1.1) for y in (268, 278, 286)])
    def alb_socle(x, y, base):
        t = np.clip((y - 256) / 36, 0, 1)[..., None]
        return mix(L(BOIS_L), L(BOIS_D), t)
    part(R, socle, BOIS, Mat(puff=8, profile="pillow", line_w=1.6, tex=1.0), albedo=alb_socle, decal=[(m_clip(veines, socle), BOIS_D, 0.5)])

# ---------------------------------------------------------------------------- les deux réponses, en vignettes
VIGNETTE = (160, 120)

def _bocal(R, objet):
    W, H = VIGNETTE
    R.cast(R.mask(rrect(20, 104, 120, 10, 5)), 0, 2, 4, 0.25)
    dehors, dedans = R.mask(rrect(14, 30, 132, 82, 14)), R.mask(rrect(21, 34, 118, 74, 9))
    part(R, dedans, "#EEF8F8", Mat(puff=2, profile="pillow", line=False, tex=0.2), shadow=False)
    eau = m_clip(R.mask(np.array(_vague(58, 0, W, 1.4, n=4) + [(W, H), (0, H)], float)), dedans)
    def alb(x, y, base):
        t = np.clip((y - 58) / 50, 0, 1)[..., None]
        return mix(L("#9FDCE8"), L("#5AAAC8"), t)
    part(R, eau, "#7CC3DA", Mat(puff=2, profile="pillow", line=False, tex=0.3), albedo=alb, shadow=False)
    glacis(R, m_clip(R.line_mask(_vague(58, 0, W, 1.4, n=4), 2.0), dedans), "#FFFFFF", 0.85)
    objet(R)
    glacis(R, eau, "#2E86A8", 0.14)
    part(R, m_sub(dehors, dedans), "#CDEEEE", Mat(puff=3, profile="pillow", line_w=1.4, spec=0.4, shin=40, tex=0.2), shadow=False)
    glacis(R, R.line_mask([(36, 42), (28, 64)], 4, smooth_it=False), "#FFFFFF", 0.4, flou=0.8)

def flotte_oui(R):
    def balle(R):
        part(R, R.mask(circle(80, 52, 15)), "#FFC145", Mat(puff=6, spec=0.35, shin=30, line_w=1.3),
             decal=[(R.mask(ellipse(74, 45, 4.5, 3.4)), "#FFFFFF", 1.0)])
    _bocal(R, balle)

def flotte_non(R):
    def caillou(R):
        part(R, R.mask(catmull([(64, 104), (66, 92), (80, 86), (95, 90), (98, 104)], n=8)), "#9AA3B5", Mat(puff=5, line_w=1.3, tex=0.8, spec=0.1),
             decal=[(R.mask(ellipse(74, 93, 5, 2.6)), "#C9CED6", 1.0)])
        for x, y, rr in ((86, 76, 2.6), (78, 66, 2.0)):
            b = m_sub(R.mask(circle(x, y, rr)), R.mask(circle(x, y, rr - 0.9)))
            flat(R, b, "#E9F8FB")
    _bocal(R, caillou)
    # la flèche qui descend, à l'encre, au-dessus du bocal
    flat(R, R.line_mask([(80, 4), (80, 26)], 4.2, smooth_it=False), INK)
    flat(R, R.line_mask([(71, 18), (80, 27), (89, 18)], 4.2, smooth_it=False), INK)

# ---------------------------------------------------------------------------- les poubelles du grand tri
POUBELLE = (120, 120)
TEINTES = {  # corps, couvercle (mêmes couleurs que les poubelles dessinées par l'appli)
    "jaune": ("#FFD23F", "#E8B400"), "bleu": ("#3D8BEA", "#2F6FC0"), "vert": ("#34B37A", "#25915F"),
    "blanc": ("#F4F1EA", "#CFC8B8"), "marron": ("#9B6B43", "#7A5232"), "gris": ("#8A8F9C", "#6B7080"),
}
POUBELLES = [("jaune", "recyclage"), ("bleu", "papier"), ("vert", "verre"), ("blanc", "verre"), ("marron", "cuisine"), ("gris", "reste"), ("vert", "reste")]
_CHARNIERE = (16, 40)   # le bord arrière gauche du couvercle : l'appli le fait tourner autour

def _symbole(R, sym, cx, cy):
    """Le dessin de l'étiquette, à l'encre et en couleurs douces, dans un carré d'environ 30 px centré en (cx, cy)."""
    if sym == "recyclage":
        for k in range(3):
            a0 = math.radians(-90 + 120 * k + 18)
            arc = [(cx + 12 * math.cos(a0 + t), cy + 12 * math.sin(a0 + t)) for t in np.linspace(0, math.radians(78), 8)]
            flat(R, R.line_mask(arc, 4.2, smooth_it=False), "#2F9E6A")
            ax, ay = arc[-1]
            d = np.array(arc[-1]) - np.array(arc[-3]); d /= np.linalg.norm(d); n = np.array([-d[1], d[0]])
            tete = [tuple(np.array([ax, ay]) + d * 6), tuple(np.array([ax, ay]) + n * 5.5), tuple(np.array([ax, ay]) - n * 5.5)]
            flat(R, R.mask(np.array(tete, float)), "#2F9E6A")
    elif sym == "verre":
        # une bouteille : col étroit, épaules, bouchon doré
        b = R.mask(np.array([(cx - 3, cy - 13), (cx + 3, cy - 13), (cx + 3, cy - 7), (cx + 8, cy - 2), (cx + 8.5, cy + 2), (cx + 8.5, cy + 14), (cx + 7, cy + 15.5),
                             (cx - 7, cy + 15.5), (cx - 8.5, cy + 14), (cx - 8.5, cy + 2), (cx - 8, cy - 2), (cx - 3, cy - 7)], float))
        part(R, m_fuse(b, 0.8 * R.S), "#7FCB9E", Mat(puff=4, spec=0.5, shin=40, line_w=1.2), decal=[(R.line_mask([(cx - 4.5, cy + 1), (cx - 4.5, cy + 11)], 2.0, smooth_it=False), "#E9FFF2", 0.6)], shadow=False)
        part(R, R.mask(rrect(cx - 3.6, cy - 17, 7.2, 4.6, 1.4)), "#E8B400", Mat(puff=2, line_w=1.0), shadow=False)
    elif sym == "cuisine":
        f = R.mask(leaf((cx - 11, cy + 12), (cx + 12, cy - 13), 17, bend=0.08))
        part(R, f, "#6DBE4E", Mat(puff=4, line_w=1.2, tex=0.6), decal=[(R.line_mask([(cx - 11, cy + 12), (cx, cy), (cx + 10, cy - 11)], 1.4), "#3F8F35", 0.3)], shadow=False)
    elif sym == "papier":
        f = R.mask(np.array([(cx - 11, cy - 15), (cx + 6, cy - 15), (cx + 12, cy - 9), (cx + 12, cy + 15), (cx - 11, cy + 15)], float))
        lignes = m_union(*[R.line_mask([(cx - 6, y), (cx + 7, y)], 1.8, smooth_it=False) for y in (cy - 5, cy + 1, cy + 7)])
        part(R, f, "#FFFFFF", Mat(puff=3, line_w=1.2), decal=[(lignes, "#9AA3B5", 0.0)], shadow=False)
    elif sym == "reste":
        sac = R.mask(catmull([(cx - 12, cy + 14), (cx - 13, cy), (cx - 7, cy - 8), (cx + 7, cy - 8), (cx + 13, cy), (cx + 12, cy + 14)], n=6))
        part(R, sac, "#5E6472", Mat(puff=5, spec=0.3, shin=30, line_w=1.2), shadow=False)
        noeud = R.mask(catmull([(cx - 6, cy - 16), (cx, cy - 9), (cx + 6, cy - 16), (cx + 2, cy - 7), (cx - 2, cy - 7)], n=4))
        part(R, noeud, "#5E6472", Mat(puff=2, line_w=1.0), shadow=False)

def poubelle(R, teinte, sym):
    corps_c, _ = TEINTES[teinte]
    D.ground_shadow(R, 62, 112, 44, 6, 0.26, dx=4, blur=4)
    for x in (32, 88):   # les roues, en partie cachées
        part(R, R.mask(circle(x, 106, 9)), "#3B4150", Mat(puff=4, line_w=1.2, spec=0.2), decal=[(R.mask(circle(x, 106, 3.4)), "#9AA3B5", 0.0)], shadow=False)
    # le corps, un peu plus large en haut, aux coins adoucis
    corps = m_fuse(R.mask(np.array([(20, 40), (100, 40), (94, 99), (91, 103), (29, 103), (26, 99)], float)), 2.5 * R.S)
    nervures = m_union(R.line_mask([(23, 49), (97, 49)], 1.6, smooth_it=False), R.line_mask([(27, 94), (93, 94)], 1.6, smooth_it=False))
    part(R, corps, corps_c, Mat(puff=10, profile="pillow", line_w=1.6, spec=0.18, shin=26, tex=0.5), decal=[(m_clip(nervures, corps), tweak(L(corps_c), dl=-0.08), 0.4)])
    etiquette = R.mask(rrect(42, 55, 36, 34, 9))
    part(R, etiquette, "#FFFDF6", Mat(puff=3, profile="pillow", line_w=1.2, tex=0.2), shadow=False)
    _symbole(R, sym, 60, 72)

def couvercle(R, teinte):
    _, lid_c = TEINTES[teinte]
    poignee = R.mask(rrect(48, 21, 24, 10, 4))
    part(R, poignee, lid_c, Mat(puff=3, line_w=1.2, spec=0.2), shadow=False)
    lid = R.mask(rrect(14, 28, 92, 13, 6))
    part(R, lid, lid_c, Mat(puff=6, profile="pillow", line_w=1.5, spec=0.25, shin=30, tex=0.4))

def composteur(R):
    D.ground_shadow(R, 62, 110, 46, 6, 0.26, dx=4, blur=4)
    # des feuilles qui dépassent sous le couvercle
    for (b, t, c) in (((36, 46), (28, 30), "#6DBE4E"), ((50, 46), (52, 28), "#8BCB78"), ((70, 46), (78, 30), "#5FAE4C"), ((84, 46), (94, 34), "#8BCB78")):
        part(R, R.mask(leaf(b, t, 12, bend=0.05)), c, Mat(puff=3, line_w=1.0), shadow=False)
    caisse = R.mask(rrect(18, 42, 84, 66, 5))
    planches = m_union(*[R.line_mask([(18, y), (102, y)], 1.8, smooth_it=False) for y in (58, 75, 92)])
    part(R, caisse, "#C8955F", Mat(puff=6, profile="pillow", line_w=1.6, tex=1.0), decal=[(m_clip(planches, caisse), "#8E5F37", 0.3)])
    for x in (30, 90):
        part(R, R.mask(rrect(x - 4, 42, 8, 66, 2)), "#A87A4C", Mat(puff=2, line_w=1.0, tex=1.0), shadow=False)
    etiquette = R.mask(rrect(44, 60, 32, 30, 8))
    part(R, etiquette, "#FFFDF6", Mat(puff=3, profile="pillow", line_w=1.2, tex=0.2), shadow=False)
    _symbole(R, "cuisine", 60, 75)

def composteur_couvercle(R):
    toit = R.mask(np.array([(12, 43), (20, 30), (100, 30), (108, 43)], float))
    part(R, toit, "#A87A4C", Mat(puff=5, profile="pillow", line_w=1.5, tex=1.0), decal=[(m_clip(R.line_mask([(22, 36), (98, 36)], 1.4, smooth_it=False), toit), "#8E5F37", 0.3)])

# ---------------------------------------------------------------------------- le volcan coupé en deux
K = 3                          # le repère de l'appli (200 × 160), trois fois plus grand
COUPE = (200 * K, 160 * K)
LAVA, LAVA_D, LAVA_L = "#FF7F50", "#E8504A", "#FFC145"

def _k(pts):
    return np.array([(x * K, y * K) for x, y in pts], float)

def _bande(y0, y1, x0=4, x1=196, amp=1.6, seed=0):
    """Une couche de terre entre deux lignes ondulées (en unités de l'appli)."""
    r = np.random.default_rng(seed)
    xs = np.linspace(x0, x1, 14)
    haut = [(x, y0 + amp * math.sin(x * 0.11 + seed) + r.normal(0, 0.4)) for x in xs]
    bas = [(x, y1 + amp * math.sin(x * 0.09 + seed + 2)) for x in xs[::-1]]
    return _k(haut + bas)

def volcan_coupe(R):
    # la terre, coupée : des couches de couleurs, quelques cailloux
    bloc = R.mask(_k([(4, 104), (196, 104), (196, 152), (191, 157), (9, 157), (4, 152)]))
    part(R, bloc, "#C49A6C", Mat(puff=6, profile="pillow", line_w=1.6, tex=1.0), shadow=False)
    for (y0, y1, c, sd) in ((104, 109, "#7A5236", 1), (109, 121, "#C9A374", 2), (121, 134, "#B5865A", 3), (134, 146, "#A27453", 4), (146, 158, "#8E6446", 5)):
        bd = m_clip(R.mask(_bande(y0, y1, seed=sd)), bloc)
        part(R, bd, c, Mat(puff=2, profile="pillow", line=False, tex=1.0), shadow=False)
    r = np.random.default_rng(8)
    for x, y in zip(r.uniform(10, 190, 16), r.uniform(112, 154, 16)):
        if abs(x - 100) < 52 and y > 120:
            continue   # pas de cailloux sur la poche de magma
        part(R, R.mask(ellipse(x * K, y * K, r.uniform(2.5, 5) * K / 2, r.uniform(1.5, 3) * K / 2)), "#8F8577", Mat(puff=3, line_w=1.0, tex=0.6), shadow=False)
    # l'herbe, de chaque côté du volcan
    for x0, x1 in ((4, 24), (176, 196)):
        herbe = R.mask(_k([(x0, 104.5), (x1, 104.5), (x1, 101.5), (x0, 101.5)]))
        part(R, herbe, "#7CC062", Mat(puff=3, profile="pillow", line_w=1.2, tex=1.0), shadow=False)
        for x in np.linspace(x0 + 3, x1 - 3, 4):
            flat(R, R.line_mask(_k([(x, 102), (x + 0.6, 99.4)]), 1.6, smooth_it=False), "#4E9A3E")
    # la chaleur de la poche de magma, qui rougit la roche autour
    glacis(R, R.mask(_k(ellipse(100, 138, 54, 22))), "#FF7F50", 0.45, flou=10)
    # le volcan, coupé : des couches de vieilles laves, en chevrons
    cone_pts = [(22, 104), (84, 40), (92, 36.5), (100, 35), (108, 36.5), (116, 40), (178, 104)]
    cone = R.mask(_k(cone_pts))
    part(R, cone, "#A77B56", Mat(puff=8, profile="pillow", line_w=1.7, tex=1.0))
    for k, c in ((1, "#BF9468"), (2, "#9A6E4D"), (3, "#B58A5F"), (4, "#93684A")):
        ch = m_clip(R.mask(_k([(22 + 17 * k, 104), (100, 44 + 13 * k), (178 - 17 * k, 104)])), cone)
        part(R, ch, c, Mat(puff=3, profile="pillow", line_w=0.8, tex=1.0), shadow=False)
    # la croûte des pentes, plus sombre, et quelques blocs pris dans les couches
    croute = m_clip(m_sub(cone, m_grow(cone, -9 * R.S)), R.mask(_k([(0, 0), (200, 0), (200, 101), (0, 101)])))
    part(R, croute, "#7E5A3E", Mat(puff=2, profile="pillow", line=False, tex=1.0), shadow=False)
    for x, y, rx in ((60, 90, 2.6), (75, 76, 2.0), (132, 92, 2.4), (122, 72, 1.8), (48, 98, 1.8), (150, 98, 2.0)):
        part(R, R.mask(_k(ellipse(x, y, rx, rx * 0.7))), "#6F6458", Mat(puff=2, line_w=0.8, tex=0.6), shadow=False)
    glacis(R, m_clip(R.mask(_k(ellipse(100, 120, 40, 22))), cone), "#FF7F50", 0.22, flou=8)
    # de petits arbres sur les pentes
    for x, y, s in ((44, 82, 1.0), (36, 92, 0.85), (158, 84, 0.95)):
        tronc = R.mask(_k([(x - 0.8, y), (x + 0.8, y), (x + 0.8, y - 3), (x - 0.8, y - 3)]))
        part(R, tronc, "#8D6E4C", Mat(puff=1, line_w=0.9), shadow=False)
        houppe = R.mask(_k(ellipse(x, y - 6 * s, 4.2 * s, 5 * s)))
        part(R, houppe, "#4FA35A", Mat(puff=4, line_w=1.1, tex=0.8, spec=0.05), shadow=False)
    # la cheminée, vide : un tuyau sombre au milieu (le magma y monte, dessiné par l'appli)
    x0, x1 = 100 - 6.5, 100 + 6.5
    tuyau = R.mask(_k([(x0, 42), (x1, 42), (x1, 128), (x0, 128)]))
    def alb_tuyau(x, y, base):
        t = np.abs((x / K - 100) / 6.5)[..., None]
        return mix(L("#6B4630"), L("#3E2A1E"), np.clip(t, 0, 1) ** 1.5)
    part(R, tuyau, "#5A3A26", Mat(puff=3, profile="pillow", line_w=1.3, tex=0.6), albedo=alb_tuyau, shadow=False)
    # le cratère, vide : un creux sombre en haut
    cratere = R.mask(_k([(84, 40), (92, 36.6), (100, 35.8), (108, 36.6), (116, 40), (108, 43.4), (100, 44.4), (92, 43.4)]))
    part(R, cratere, "#5A3A26", Mat(puff=3, profile="pillow", line_w=1.3, tex=0.6), shadow=False)
    # la poche de magma, qui brille
    poche = R.mask(_k(ellipse(100, 138, 42, 14)))
    def alb_poche(x, y, base):
        d = np.sqrt(((x / K - 98) / 40) ** 2 + ((y / K - 136) / 12) ** 2)[..., None]
        return mix(mix(L("#FFE07A"), L(LAVA), np.clip(d / 0.55, 0, 1)), L("#C9372F"), np.clip((d - 0.55) / 0.45, 0, 1))
    bulles = m_union(*[R.mask(circle(x * K, y * K, rr * K)) for x, y, rr in ((82, 140, 1.6), (118, 134, 1.3), (108, 143, 1.1), (90, 133, 1.0))])
    part(R, poche, LAVA_D, Mat(puff=8, line_w=1.6, spec=0.3, shin=24), albedo=alb_poche, decal=[(bulles, "#FFE9A8", 0.6)], shadow=False)

def volcan_cratere_lave(R):
    glacis(R, R.mask(_k(ellipse(100, 37, 15, 7))), LAVA_L, 0.45, flou=4)
    lave = R.mask(_k([(84.6, 40), (92, 36.8), (100, 36), (108, 36.8), (115.4, 40), (108, 43.2), (100, 44.2), (92, 43.2)]))
    def alb(x, y, base):
        d = np.sqrt(((x / K - 100) / 15) ** 2 + ((y / K - 40) / 4) ** 2)[..., None]
        return mix(L("#FFE07A"), L(LAVA_D), np.clip(d, 0, 1))
    part(R, lave, LAVA, Mat(puff=4, line_w=1.2, spec=0.3), albedo=alb, shadow=False)

FLOW = [(113, 41), (122, 48), (132, 58), (142, 69), (152, 80), (162, 92), (171, 103)]

def volcan_coulee(R):
    pts = [(x * K, y * K) for x, y in FLOW]
    larg = np.linspace(6.5, 11.5, len(catmull(pts, closed=False, n=8))) * K / 2
    croute = R.mask(ribbon(catmull(pts, closed=False, n=8), larg * 1.0))
    part(R, croute, "#C9372F", Mat(puff=5, line_w=1.4, tex=0.6), shadow=False)
    coeur_ = R.mask(ribbon(catmull(pts, closed=False, n=8), larg * 0.55))
    def alb(x, y, base):
        return mix(L("#FFE07A"), L(LAVA), np.clip((y / K - 41) / 70, 0, 1)[..., None])
    part(R, coeur_, LAVA, Mat(puff=3, line=False, spec=0.25), albedo=alb, shadow=False)
    # la petite mare de lave au pied du volcan
    mare = R.mask(_k(ellipse(172, 103.5, 9, 2.6)))
    part(R, mare, LAVA, Mat(puff=2, line_w=1.2), decal=[(R.mask(_k(ellipse(170, 103, 4, 1))), "#FFE07A", 0.5)], shadow=False)

def volcan_nuage(R):
    bouffees = [(70, 22, 9), (80, 14, 10.5), (93, 11, 10), (106, 11.5, 10), (118, 16, 9), (124, 23, 7), (64, 26, 6.5), (100, 22, 12), (86, 24, 10), (112, 25, 9)]
    m = m_union(*[R.mask(_k(ellipse(x, y, rr, rr * 0.92))) for x, y, rr in bouffees] + [R.mask(_k([(95, 28), (105, 28), (104, 39), (96, 39)]))])
    m = m_fuse(m, 3.0 * R.S)
    def alb(x, y, base):
        t = np.clip((y / K - 2) / 34, 0, 1)[..., None]
        return mix(L("#C9CED8"), L("#7D8597"), t)
    lumieres = m_union(*[R.mask(_k(ellipse(x - rr * 0.3, y - rr * 0.35, rr * 0.45, rr * 0.3))) for x, y, rr in bouffees[:6]])
    part(R, m, "#9AA3B5", Mat(puff=12, line_w=1.6, tex=0.6), albedo=alb, decal=[(m_clip(lumieres, m), "#E6E9EF", 5.0)])

def volcan_jet(R):
    # une fontaine de lave : elle jaillit du cratère et s'ouvre en éventail de gerbes arrondies
    gerbes = [(87, 23, 5), (93, 16, 6), (100, 12.5, 7), (107, 16, 6), (113, 23, 5)]
    jet = m_union(R.mask(_k([(93, 40.5), (86, 26), (89, 18), (100, 14), (111, 18), (114, 26), (107, 40.5)])), *[R.mask(_k(ellipse(x, y, rr, rr))) for x, y, rr in gerbes])
    jet = m_fuse(jet, 2.0 * R.S)
    def alb(x, y, base):
        d = np.abs((x / K - 100) / 12)[..., None]
        return mix(L("#FFE07A"), L(LAVA), np.clip(d * 1.2, 0, 1))
    part(R, jet, LAVA, Mat(puff=7, line_w=1.5, spec=0.25), albedo=alb, shadow=False)
    for x, y, rr in ((82, 14, 2.8), (118, 12, 2.8), (76, 26, 2.4), (124, 24, 2.4), (100, 3, 2.6)):
        part(R, R.mask(_k(ellipse(x, y, rr, rr))), LAVA, Mat(puff=3, line_w=1.1, spec=0.3), decal=[(R.mask(_k(ellipse(x - 0.8, y - 0.8, rr * 0.4, rr * 0.4))), "#FFE07A", 0.0)], shadow=False)

ELEMENTS = {
    "activites/bassin-fond": dict(cadre=BASSIN, dessin=bassin_fond, infos={"eau": EAU_Y / BASSIN[1], "sable": SABLE_Y / BASSIN[1]}),
    "activites/bassin-devant": dict(cadre=BASSIN, dessin=bassin_devant),
    "activites/flotte-oui": dict(cadre=VIGNETTE, dessin=flotte_oui),
    "activites/flotte-non": dict(cadre=VIGNETTE, dessin=flotte_non),
    **{f"activites/poubelle-{t}-{sym}": dict(cadre=POUBELLE, dessin=(lambda R, t=t, sym=sym: poubelle(R, t, sym))) for t, sym in POUBELLES},
    **{f"activites/couvercle-{t}": dict(cadre=POUBELLE, dessin=(lambda R, t=t: couvercle(R, t))) for t in TEINTES},
    "activites/composteur": dict(cadre=POUBELLE, dessin=composteur),
    "activites/composteur-couvercle": dict(cadre=POUBELLE, dessin=composteur_couvercle),
    "activites/volcan-coupe": dict(cadre=COUPE, dessin=volcan_coupe, infos={"echelle": K}),
    "activites/volcan-cratere-lave": dict(cadre=COUPE, dessin=volcan_cratere_lave),
    "activites/volcan-coulee": dict(cadre=COUPE, dessin=volcan_coulee),
    "activites/volcan-nuage": dict(cadre=COUPE, dessin=volcan_nuage),
    "activites/volcan-jet": dict(cadre=COUPE, dessin=volcan_jet),
}
