"""Activités redessinées pour Archipel 2 (livraison 2) : les nénuphars de l'île des Nombres.
L'étang est un fond (les nénuphars et la grenouille sont posés dessus par l'appli) ; chaque nénuphar est rendu sans son
nombre, que l'appli écrit par-dessus (encre vert foncé sur le centre clair : contraste d'au moins 4,5 pour 1).
La grenouille a deux poses (assise, en plein saut) ; sa gommette est dans la même matière que le reste."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, eye_parts, mouth, brow, leaf, EXPRESSIONS, INK
import decors as D
import creatures as C

GREEN, GREEN_D, GREEN_L, GREEN_C = "#5DB54C", "#3F8F35", "#8ED07A", "#A6DC8F"
FROG, FROG_D, FROG_L, FROG_V = "#6CC04A", "#4E9E37", "#CDEBA8", "#3E8A2C"

# ---------------------------------------------------------------------------- l'étang (fond de l'activité)
ETANG = (1200, 200)

def _bord_etang(W, H, seed=3):
    r = np.random.default_rng(seed)
    pts = []
    n = 26
    for k in range(n):
        t = k / n * 2 * math.pi
        # super-ellipse aplatie : un long étang aux rives douces
        c, s = math.cos(t), math.sin(t)
        x = W / 2 + (W / 2 - 22) * np.sign(c) * abs(c) ** 0.42
        y = H / 2 + (H / 2 - 14) * np.sign(s) * abs(s) ** 0.75
        x += r.normal(0, 4); y += r.normal(0, 3)
        pts.append((float(x), float(y)))
    return pts

def etang(R):
    W, H = ETANG
    bord = R.mask(catmull(_bord_etang(W, H), n=12))
    eau = m_grow(bord, -11 * R.S)
    # rive : sable clair, herbe par-dessus sur le haut
    R.cast(bord, 0, 4, 6, 0.22)
    part(R, bord, "#D9C38F", Mat(puff=6, profile="pillow", line_w=1.6, tex=1.0), shadow=False)
    herbe = m_sub(m_wobble(m_grow(bord, -1 * R.S), 2.2 * R.S, 22 * R.S, seed=5), m_shift(m_grow(bord, -9 * R.S), 0, 12 * R.S))
    R.paint(m_clip(herbe, bord), "#86C565", Mat(puff=4, profile="pillow", line=False, tex=0.9))
    def eau_alb(x, y, base):
        t = np.clip(y / H, 0, 1)[..., None]
        c = mix(L("#57B9CC"), L("#7CCFD8"), t)
        d = np.abs((x - W / 2) / (W / 2))[..., None]
        return mix(c, L("#4AAAC2"), np.clip(1 - d, 0, 1) * 0.18)
    R.cast(eau, 0, 3, 3, 0.35, clip=bord)
    R.paint(eau, "#5DBFD0", Mat(puff=8, profile="pillow", line=False, tex=0.55), albedo=eau_alb)
    # reflets du ciel, en longs traits
    r = np.random.default_rng(8)
    for k in range(16):
        x0 = 60 + r.random() * (W - 180)
        y0 = 40 + r.random() * (H - 80)
        ln = 30 + r.random() * 70
        flat(R, m_clip(R.line_mask([(x0, y0), (x0 + ln / 2, y0 - 1.2), (x0 + ln, y0)], 2.0), eau), "#A8E3E6")
    # roseaux et massettes aux deux bouts, petites feuilles de nénuphar le long des rives
    for k, (rx, h, by) in enumerate(((44, 64, 120), (58, 82, 118), (72, 58, 124), (W - 70, 70, 120), (W - 54, 88, 116), (W - 40, 60, 122),
                                     (W * 0.36, 34, 62), (W * 0.37, 44, 60), (W * 0.64, 40, 62))):
        flat(R, R.line_mask([(rx, by), (rx + 2, by - h * 0.5), (rx + 1, by - h)], 2.4), "#4F8F3A")
        if h > 50:
            part(R, R.mask(rrect(rx - 3.5, by - h - 2, 7, 22, 3.5)), "#8B5A35", Mat(puff=3, line_w=1.0, tex=0.8), shadow=False)
        lm = R.mask(leaf((rx, by), (rx + (12 if k % 2 else -12), by - h * 0.7), 7, 0.1))
        part(R, lm, "#5EA246", Mat(puff=2, line_w=0.9), shadow=False)
    for (fx, fy, fr, rot) in ((150, 36, 13, 20), (W - 160, 168, 12, -30), (W * 0.5, 172, 10, 60), (250, 168, 11, 140)):
        pm = R.mask(ellipse(fx, fy, fr, fr * 0.6, rot))
        part(R, m_clip(pm, eau), GREEN, Mat(puff=3, profile="pillow", line_w=1.0, tex=0.8), shadow=False)
    for (fx, fy) in ((112, 150), (W - 120, 44)):
        for k in range(6):
            a = math.radians(-90 + (k - 2.5) * 30)
            pt = R.mask(leaf((fx, fy), (fx + math.cos(a) * 13, fy + math.sin(a) * 12), 8))
            part(R, pt, "#F6A3C0", Mat(puff=3, line_w=0.9, tex=0.5), shadow=False)
        flat(R, R.mask(circle(fx, fy - 2, 3.2)), "#FFD24D")

# ---------------------------------------------------------------------------- un nénuphar (sans nombre)
NENUPHAR = (130, 90)

def nenuphar(R, variante=0):
    W, H = NENUPHAR
    cx, cy, rx, ry = W / 2, H / 2 + 2, 56, 34
    rot = (-18, 12, 160)[variante % 3]
    pm = R.mask(ellipse(cx, cy, rx, ry))
    a = math.radians(rot)
    notch = R.mask(np.array([(cx, cy), (cx + math.cos(a - 0.22) * rx * 1.3, cy + math.sin(a - 0.22) * ry * 1.3),
                             (cx + math.cos(a + 0.22) * rx * 1.3, cy + math.sin(a + 0.22) * ry * 1.3)], float))
    pm = m_sub(pm, notch)
    R.cast(pm, 2.5, 4, 3, 0.30)
    veins = [R.line_mask([(cx, cy), (cx + math.cos(t) * rx * 0.92, cy + math.sin(t) * ry * 0.9)], 1.3, smooth_it=False)
             for t in np.linspace(a + 0.5, a + 2 * math.pi - 0.5, 9)]
    centre = R.mask(ellipse(cx, cy - 1, rx * 0.56, ry * 0.58))
    part(R, pm, GREEN, Mat(puff=6, profile="pillow", line_w=1.5, tex=0.9, spec=0.06), shadow=False,
         decal=[(m_clip(m_union(*veins), pm), GREEN_D, 0.4), (centre, GREEN_C, 5.0)])

# ---------------------------------------------------------------------------- la grenouille
GRENOUILLE = (150, 150)

def grenouille(R, pose="assise", expr="content"):
    """La grenouille, (75, 70) au milieu du corps. pose : assise, saut."""
    E = EXPRESSIONS[expr]
    x, y = 75, 74
    R.push(Affine.T(x, y) @ Affine.T(-50, -50))
    m = Mat(puff=12, spec=0.25, shin=20, rim=0.3, line_w=1.5)
    if pose == "saut":
        # en plein saut : pattes arrière tendues en diagonale, pieds palmés au bout ; le corps s'étire vers le haut
        for sx in (-1, 1):
            jambe = R.mask(ribbon(stroke_pts([(50 + sx * 14, 74), (50 + sx * 26, 96), (50 + sx * 38, 114)], n=10), np.linspace(12, 5.5, 21)))
            part(R, jambe, FROG_D, Mat(puff=6, line_w=1.3))
            part(R, R.mask(ellipse(50 + sx * 42, 117, 10, 4.5, sx * 28)), FROG_D, Mat(puff=4, line_w=1.2))
        body = catmull([(50, 18), (80, 30), (88, 58), (76, 80), (50, 86), (24, 80), (12, 58), (20, 30)])
    else:
        for lx in (22, 78):
            part(R, R.mask(ellipse(lx, 76, 17, 9)), FROG_D, Mat(puff=6, line_w=1.3))
        body = catmull([(50, 26), (80, 36), (90, 62), (78, 82), (50, 88), (22, 82), (10, 62), (20, 36)])
    domes = [circle(32, 30 if pose != "saut" else 24, 15), circle(68, 30 if pose != "saut" else 24, 15)]
    sil = m_fuse(m_union(R.mask(body), *[R.mask(d) for d in domes]), 3 * R.k)
    part(R, sil, FROG, m, decal=[(R.mask(ellipse(50, 68, 25, 16)), FROG_L, 4.0), (R.mask(ellipse(34, 50, 5, 3)), FROG_V, 1.0),
                                 (R.mask(ellipse(66, 56, 4, 2.6)), FROG_V, 1.0)])
    ey = 28 if pose != "saut" else 22
    eye_parts(R, 32, ey, E["oeil"], r=9.5, look=(0.8, 0.8), lid=FROG)
    eye_parts(R, 68, ey, E["oeil"], r=9.5, look=(0.8, 0.8), lid=FROG)
    my = 54 if pose != "saut" else 48
    if E["bouche"] in ("grand", "rond"):
        mouth(R, 50, my - 2, 26, E["bouche"], ink="#2F5A24", inner="#9E3B4A")
    else:
        flat(R, R.line_mask([(32, my), (50, my + 8), (68, my)], 2.4), "#2F5A24")
    for cx in (24, 76):
        R.paint(R.mask(ellipse(cx, my - 4, 7, 4)), "#F29AA6", Mat(flat=True))
    # pattes avant
    if pose == "saut":
        for sx in (-1, 1):
            part(R, R.mask(ribbon(stroke_pts([(50 + sx * 22, 66), (50 + sx * 30, 76), (50 + sx * 31, 86)], n=8), np.linspace(6, 4.5, 17))), FROG, Mat(puff=4, line_w=1.2))
            part(R, R.mask(ellipse(50 + sx * 31, 88, 5.5, 3.5)), FROG, Mat(puff=3, line_w=1.0))
    else:
        for sx in (-1, 1):
            part(R, R.mask(ellipse(50 + sx * 16, 84, 7, 5)), FROG, Mat(puff=4, line_w=1.2))
    R.pop()

# ---------------------------------------------------------------------------- gommettes
GOMMETTE = (200, 200)

def fond_gommette(R, fond="#D5F0E1"):
    """Gommette ronde : bord blanc découpé, ombre posée, disque de couleur claire."""
    cx, cy = 100, 98
    bord = R.mask(circle(cx, cy, 88))
    R.cast(bord, 2, 5, 5, 0.26)
    part(R, bord, "#FFFDF8", Mat(puff=8, profile="pillow", line_w=1.4, tex=0.5), shadow=False)
    disque = R.mask(circle(cx, cy, 76))
    def alb(x, y, base):
        d = np.sqrt((x - cx + 22) ** 2 + (y - cy + 26) ** 2)[..., None] / 120
        return mix(L(fond) * 1.04, L(fond) * 0.9, np.clip(d, 0, 1))
    part(R, disque, fond, Mat(puff=4, profile="pillow", line_w=1.2, tex=0.7), shadow=False, albedo=alb)
    return cx, cy

def gommette_grenouille(R):
    cx, cy = fond_gommette(R, "#D5F0E1")
    R.push(Affine.T(cx, cy + 30) @ Affine.S(1.0) @ Affine.T(-65, -45))
    nenuphar(R, 1)
    R.pop()
    R.push(Affine.T(cx, cy - 6) @ Affine.S(0.95) @ Affine.T(-75, -74))
    grenouille(R, "assise", "rieur")
    R.pop()
    C.sparkle(R, cx + 50, cy - 46, 7)
    C.sparkle(R, cx - 54, cy - 30, 5)

ELEMENTS = {
    "activites/nenuphars-etang": dict(cadre=ETANG, dessin=etang),
    **{f"activites/nenuphar-{v}": dict(cadre=NENUPHAR, dessin=(lambda R, v=v: nenuphar(R, v))) for v in range(3)},
    "activites/grenouille-assise": dict(cadre=GRENOUILLE, dessin=lambda R: grenouille(R, "assise"), points={"pieds": (75, 112)}),
    "activites/grenouille-saut": dict(cadre=GRENOUILLE, dessin=lambda R: grenouille(R, "saut"), points={"pieds": (75, 112)}),
    "activites/grenouille-rieur": dict(cadre=GRENOUILLE, dessin=lambda R: grenouille(R, "assise", "rieur"), points={"pieds": (75, 112)}),
    "gommettes/grenouille": dict(cadre=GOMMETTE, dessin=gommette_grenouille),
}
