"""Objets des jeux de l'île des Nombres, dessinés pour Archipel 2 (livraison 4), même matière que les nénuphars :
- le marché de Basile : le grand panier en osier où l'on pose les pommes, la corbeille ronde (combien de pommes ?),
  la cagette à dix places (compléments à 10), le sac de dix pommes en toile de jute, l'ardoise du compteur ;
- le partage du goûter : l'assiette en faïence et la boîte à biscuits en fer (posée en neuf morceaux : son bord garde
  sa forme quelle que soit la taille de la boîte).
Les pommes et les biscuits sont ceux de l'imagier ; le nombre du sac et celui de l'ardoise sont écrits par l'appli."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D

OSIER, OSIER_D, OSIER_DD, OSIER_L = "#D9A26E", "#B57C4A", "#8A5A33", "#EBC08E"

def tressage(R, zone, pas=18, rang=13, decal_rang=0.5, ep=1.4, seed=0):
    """Texture de vannerie : rangs horizontaux de brins, montants verticaux décalés d'un rang à l'autre."""
    x0, y0, x1, y1 = zone
    traits = []
    y = y0
    k = 0
    while y < y1:
        traits.append(R.line_mask([(x0, y), (x1, y)], ep, smooth_it=False))
        off = (k % 2) * pas * decal_rang
        x = x0 + off
        while x < x1:
            traits.append(R.line_mask([(x, y + 1.5), (x, y + rang - 1.5)], ep * 0.9, smooth_it=False))
            x += pas
        y += rang
        k += 1
    return m_union(*traits)

# ---------------------------------------------------------------------------- le grand panier du marché
PANIER = (1000, 300)

def panier(R):
    W, H = PANIER
    cx = W / 2
    # ombre posée sous le panier
    R.cast(R.mask(ellipse(cx, H - 26, W / 2 - 40, 18)), 0, 2, 8, 0.22)
    # anses aux deux bouts : boucles d'osier tressé
    for sx in (-1, 1):
        ax = cx + sx * (W / 2 - 52)
        anse = R.mask(ribbon(stroke_pts([(ax - sx * 30, 120), (ax + sx * 6, 64), (ax + sx * 34, 122)], n=12), np.full(25, 9.0)))
        part(R, anse, OSIER_D, Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))
    # fond intérieur (on le voit d'un peu au-dessus), plus sombre, tressé en rond
    bord = catmull([(70, 112), (cx, 84), (W - 70, 112), (W - 40, 160), (W - 70, 214), (cx, 236), (70, 214), (40, 160)], n=14)
    interieur = R.mask(bord)
    def alb_int(x, y, base):
        t = np.clip((y - 90) / 140, 0, 1)[..., None]
        return mix(L("#9C6A3F"), L("#C48A55"), t)
    part(R, interieur, OSIER_D, Mat(puff=4, profile="pillow", line_w=1.6, tex=1.0), albedo=alb_int,
         decal=[(m_clip(tressage(R, (40, 84, W - 40, 236), pas=22, rang=12), interieur), "#8E5F37", 0.4)], shadow=False)
    # paroi de devant : la vannerie, bombée, qui cache le bas du fond
    paroi = R.mask(catmull([(40, 168), (cx, 206), (W - 40, 168), (W - 58, 236, "c"), (W - 90, 270), (cx, 288), (90, 270), (58, 236, "c")], n=12))
    def alb_paroi(x, y, base):
        t = np.clip((y - 170) / 120, 0, 1)[..., None]
        return mix(L(OSIER_L), L(OSIER_D), t)
    part(R, paroi, OSIER, Mat(puff=10, profile="pillow", line_w=1.6, tex=1.0), albedo=alb_paroi,
         decal=[(m_clip(tressage(R, (30, 176, W - 30, 292), pas=20, rang=14, seed=1), paroi), OSIER_DD, 0.5)])
    # le bord : un gros boudin d'osier torsadé tout autour
    rim = catmull([(70, 112), (cx, 84), (W - 70, 112), (W - 40, 160), (W - 70, 196), (cx, 214), (70, 196), (40, 160)], n=16)
    anneau = m_sub(m_grow(R.mask(rim), 9 * R.S), m_grow(R.mask(rim), -7 * R.S))
    torsades = m_union(*[R.line_mask([(x, 70), (x + 14, 230)], 2.0, smooth_it=False) for x in range(20, W, 22)])
    part(R, anneau, OSIER_L, Mat(puff=8, profile="pillow", line_w=1.4, tex=0.9), decal=[(m_clip(torsades, anneau), OSIER_D, 0.5)], shadow=False)

# ---------------------------------------------------------------------------- la corbeille ronde (« combien de pommes ? »)
CORBEILLE = (400, 380)

def corbeille(R):
    W, H = CORBEILLE
    cx, cy = W / 2, 178
    R.cast(R.mask(ellipse(cx, H - 34, 160, 22)), 0, 2, 8, 0.22)
    paroi = R.mask(catmull([(cx - 178, cy), (cx, cy + 40), (cx + 178, cy), (cx + 150, cy + 130), (cx, cy + 168), (cx - 150, cy + 130)], n=12))
    def alb_paroi(x, y, base):
        t = np.clip((y - cy) / 170, 0, 1)[..., None]
        return mix(L(OSIER_L), L(OSIER_D), t)
    part(R, paroi, OSIER, Mat(puff=10, profile="pillow", line_w=1.6, tex=1.0), albedo=alb_paroi,
         decal=[(m_clip(tressage(R, (cx - 180, cy, cx + 180, cy + 170), pas=18, rang=13), paroi), OSIER_DD, 0.5)])
    interieur = R.mask(ellipse(cx, cy, 168, 128))
    def alb_int(x, y, base):
        d = np.clip(np.sqrt((x - cx) ** 2 + ((y - cy) * 1.3) ** 2) / 170, 0, 1)[..., None]
        return mix(L("#C48A55"), L("#8E5F37"), d ** 2)
    rayons = m_union(*[R.line_mask([(cx, cy), (cx + math.cos(a) * 170, cy + math.sin(a) * 130)], 1.6, smooth_it=False) for a in np.linspace(0, 2 * math.pi, 24, endpoint=False)])
    cercles = m_union(*[m_sub(R.mask(ellipse(cx, cy, r, r * 0.76)), R.mask(ellipse(cx, cy, r - 2.2, r * 0.76 - 1.8))) for r in range(26, 168, 14)])
    part(R, interieur, OSIER_D, Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), albedo=alb_int,
         decal=[(m_clip(m_union(rayons, cercles), interieur), "#7A4E2C", 0.4)], shadow=False)
    rim = R.mask(ellipse(cx, cy, 168, 128))
    anneau = m_sub(m_grow(rim, 10 * R.S), m_grow(rim, -6 * R.S))
    torsades = m_union(*[R.line_mask([(x, cy - 150), (x + 16, cy + 150)], 2.0, smooth_it=False) for x in range(int(cx - 200), int(cx + 200), 20)])
    part(R, anneau, OSIER_L, Mat(puff=8, profile="pillow", line_w=1.4, tex=0.9), decal=[(m_clip(torsades, anneau), OSIER_D, 0.5)], shadow=False)

# ---------------------------------------------------------------------------- la cagette à dix places
CAGETTE = (560, 280)
CASES = [(86 + k * 97, 96 + r * 92) for r in range(2) for k in range(5)]

def cagette(R):
    W, H = CAGETTE
    R.cast(R.mask(rrect(24, 30, W - 48, H - 52, 18)), 0, 5, 8, 0.24)
    caisse = R.mask(rrect(20, 26, W - 40, H - 52, 18))
    planches = m_union(*[R.line_mask([(20, y), (W - 20, y)], 1.6, smooth_it=False) for y in (60, 140, 218)])
    part(R, caisse, "#D9A26E", Mat(puff=8, profile="pillow", line_w=1.6, tex=1.0), decal=[(m_clip(planches, caisse), "#B57C4A", 0.4)])
    plateau = R.mask(rrect(40, 44, W - 80, H - 88, 12))
    part(R, plateau, "#E8C08C", Mat(puff=4, profile="pillow", line_w=1.2, tex=1.0), shadow=False)
    for (x, y) in CASES:
        trou = R.mask(circle(x, y, 38))
        def alb(xx, yy, base, x=x, y=y):
            d = np.clip(np.sqrt((xx - x + 10) ** 2 + (yy - y + 12) ** 2) / 48, 0, 1)[..., None]
            return mix(L("#7A4E2C"), L("#A9703F"), d)
        part(R, trou, "#8E5F37", Mat(puff=2, profile="pillow", line_w=1.2, tex=0.8), albedo=alb, shadow=False)
    # coins renforcés
    for (x, y) in ((34, 40), (W - 34, 40), (34, H - 40), (W - 34, H - 40)):
        part(R, R.mask(circle(x, y, 7)), "#8E5F37", Mat(puff=2, line_w=1.0), shadow=False)

# ---------------------------------------------------------------------------- le sac de dix pommes
SAC = (140, 150)

def sac(R):
    W, H = SAC
    cx = W / 2
    R.cast(R.mask(ellipse(cx, H - 12, 52, 8)), 0, 1, 4, 0.24)
    corps = R.mask(catmull([(cx - 34, 44), (cx - 50, 70), (cx - 58, 110), (cx - 44, H - 14), (cx, H - 8), (cx + 44, H - 14), (cx + 58, 110), (cx + 50, 70), (cx + 34, 44)], n=12))
    def alb(x, y, base):
        t = np.clip((y - 40) / 110, 0, 1)[..., None]
        return mix(L("#E2C48E"), L("#C9A46E"), t)
    toile = m_union(*([R.line_mask([(cx - 70, y), (cx + 70, y)], 1.0, smooth_it=False) for y in range(40, H, 7)]
                      + [R.line_mask([(x, 30), (x, H)], 1.0, smooth_it=False) for x in range(int(cx - 70), int(cx + 70), 7)]))
    # étiquette de toile claire cousue sur le ventre : l'appli y écrit 10
    etiquette = R.mask(ellipse(cx, 104, 33, 22))
    coutures = m_union(*[R.line_mask([(cx + math.cos(a) * 30, 104 + math.sin(a) * 19), (cx + math.cos(a + 0.12) * 30, 104 + math.sin(a + 0.12) * 19)], 1.4, smooth_it=False)
                         for a in np.linspace(0, 2 * math.pi, 18, endpoint=False)])
    part(R, corps, "#D6B47F", Mat(puff=10, profile="pillow", line_w=1.5, tex=1.0), albedo=alb, shadow=False,
         decal=[(m_clip(toile, corps), "#B89A64", 0.5), (etiquette, "#FFF7E6", 1.0), (coutures, "#B89A64", 0.3)])
    # le col froncé, les pommes qui dépassent, la ficelle
    for (x, y, c) in ((cx - 18, 34, "#E5483B"), (cx + 16, 32, "#E5483B"), (cx, 22, "#F0644A")):
        pm = R.mask(circle(x, y, 14))
        part(R, pm, c, Mat(puff=6, spec=0.35, shin=30, line_w=1.2), decal=[(R.mask(ellipse(x - 5, y - 5, 4, 5)), "#FFFFFF", 2.0)])
        flat(R, R.line_mask([(x, y - 12), (x + 2, y - 19)], 2.2), "#7A4A2C")
    col = R.mask(catmull([(cx - 40, 48), (cx - 30, 36), (cx, 42), (cx + 30, 36), (cx + 40, 48), (cx, 58)], n=8))
    part(R, col, "#CDAE78", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0), decal=[(m_clip(toile, col), "#B89A64", 0.5)], shadow=False)
    ficelle = R.mask(ribbon(stroke_pts([(cx - 38, 54), (cx, 60), (cx + 38, 54)], n=10), np.full(21, 3.2)))
    part(R, ficelle, "#8E5F37", Mat(puff=2, line_w=0.9, tex=0.8), shadow=False)
    flat(R, R.line_mask([(cx + 30, 56), (cx + 38, 74), (cx + 30, 82)], 2.6), "#8E5F37")

# ---------------------------------------------------------------------------- l'ardoise du compteur
ARDOISE = (220, 150)

def ardoise(R):
    W, H = ARDOISE
    R.cast(R.mask(rrect(14, 16, W - 28, H - 28, 16)), 0, 4, 6, 0.24)
    cadre = R.mask(rrect(10, 12, W - 20, H - 26, 16))
    part(R, cadre, "#C98B55", Mat(puff=6, profile="pillow", line_w=1.5, tex=1.0))
    pierre = R.mask(rrect(30, 32, W - 60, H - 66, 8))
    def alb(x, y, base):
        n = R.crop(R.mottle, (int(x[0, 0] * R.S), int(y[0, 0] * R.S), int(x[0, 0] * R.S) + x.shape[1], int(y[0, 0] * R.S) + x.shape[0]))
        return L("#3B4A48") * (1 + 0.10 * (n[..., None] - 0.5))
    traces = m_union(R.line_mask([(48, 46), (120, 42)], 3.0), R.line_mask([(130, 92), (176, 88)], 2.4))
    part(R, pierre, "#3B4A48", Mat(puff=2, profile="pillow", line_w=1.2, tex=0.6), albedo=alb, decal=[(traces, "#56645F", 2.0)], shadow=False)

# ---------------------------------------------------------------------------- l'assiette en faïence
ASSIETTE = (420, 240)

def assiette(R):
    W, H = ASSIETTE
    cx, cy = W / 2, H / 2 - 4
    R.cast(R.mask(ellipse(cx, cy + 10, 196, 96)), 0, 6, 8, 0.24)
    bord = R.mask(ellipse(cx, cy, 200, 104))
    def alb_bord(x, y, base):
        t = np.clip((y - (cy - 104)) / 208, 0, 1)[..., None]
        return mix(L("#FFFFFF"), L("#E9E6DF"), t)
    motif = m_union(*[R.mask(circle(cx + math.cos(a) * 176, cy + math.sin(a) * 90, 5.2)) for a in np.linspace(0, 2 * math.pi, 34, endpoint=False)])
    filet = m_sub(R.mask(ellipse(cx, cy, 190, 98)), R.mask(ellipse(cx, cy, 186, 95.5)))
    part(R, bord, "#FBFAF6", Mat(puff=8, profile="pillow", line_w=1.5, spec=0.25, shin=30, tex=0.3), albedo=alb_bord,
         decal=[(m_clip(motif, bord), "#7DB3E8", 0.6), (filet, "#9CC4EE", 0.3)], shadow=False)
    creux = R.mask(ellipse(cx, cy + 3, 150, 72))
    def alb_creux(x, y, base):
        t = np.clip((y - (cy - 72)) / 150, 0, 1)[..., None]
        return mix(L("#E8E3D8"), L("#FFFFFF"), t)
    part(R, creux, "#F6F3EC", Mat(puff=3, profile="pillow", line_w=1.1, tex=0.3), albedo=alb_creux, shadow=False)

# ---------------------------------------------------------------------------- la boîte à biscuits (en neuf morceaux)
BOITE = (300, 200)
BOITE_BORD = 40  # épaisseur du bord en px du cadre : la tranche que l'appli garde telle quelle (border-image)

def boite(R):
    W, H = BOITE
    tole = R.mask(rrect(0, 0, W, H, 30))  # la tôle remplit le cadre : l'image est découpée en neuf sans marge
    def alb(x, y, base):
        t = np.clip((y - 4) / (H - 8), 0, 1)[..., None]
        return mix(L("#5E9AD8"), L("#3D74B6"), t)
    pois = m_union(*([R.mask(circle(x, 18, 3.6)) for x in range(40, W - 30, 22)] + [R.mask(circle(x, H - 18, 3.6)) for x in range(40, W - 30, 22)]
                     + [R.mask(circle(18, y, 3.6)) for y in range(44, H - 34, 22)] + [R.mask(circle(W - 18, y, 3.6)) for y in range(44, H - 34, 22)]))
    part(R, tole, "#4A86C8", Mat(puff=6, profile="pillow", line_w=1.6, spec=0.4, shin=40, tex=0.3), albedo=alb, decal=[(pois, "#FFD24D", 0.4)], shadow=False)
    # papier plissé au fond de la boîte, où l'on pose les biscuits
    fond = R.mask(rrect(BOITE_BORD - 6, BOITE_BORD - 6, W - 2 * BOITE_BORD + 12, H - 2 * BOITE_BORD + 12, 16))
    plis = m_union(*[R.line_mask([(x, BOITE_BORD - 6), (x + 4, H - BOITE_BORD + 6)], 1.2, smooth_it=False) for x in range(BOITE_BORD, W - BOITE_BORD, 9)])
    part(R, fond, "#FFF4DD", Mat(puff=3, profile="pillow", line_w=1.2, tex=0.6), decal=[(m_clip(plis, fond), "#EAD7B0", 0.6)], shadow=False)

ELEMENTS = {
    "activites/panier": dict(cadre=PANIER, dessin=panier, infos={"interieur": "90,96,910,232"}),
    "activites/corbeille": dict(cadre=CORBEILLE, dessin=corbeille, points={"centre": (200, 178)}),
    "activites/cagette-10": dict(cadre=CAGETTE, dessin=cagette, points={f"c{i}": p for i, p in enumerate(CASES)}),
    "activites/sac-10": dict(cadre=SAC, dessin=sac, points={"etiquette": (70, 104)}),
    "activites/ardoise": dict(cadre=ARDOISE, dessin=ardoise),
    "activites/assiette": dict(cadre=ASSIETTE, dessin=assiette),
    "activites/boite-biscuits": dict(cadre=BOITE, dessin=boite, infos={"bord": BOITE_BORD}),
}
