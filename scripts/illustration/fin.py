"""Fin de séance (livraison 3) : le soleil se couche sur l'archipel. Un fond peint (ciel rose et orangé, nuages
éclairés par en dessous, îles lointaines, mer violette et chemin doré du soleil, plage au premier plan) et le soleil
à part : l'écran le fait descendre doucement derrière l'horizon. Repère 1194 x 834, horizon à y = 470."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D

W, H = 1194, 834
HORIZON = 470
SOLEIL = (742, 86)  # x du centre, rayon
ENCRE_SOIR = "#4E3A68"

def nuage(R, x, y, s=1.0, seed=1):
    """Nuage du soir : rose, éclairé par en dessous (le soleil est bas)."""
    r = D.rng(seed)
    blobs = [(0, 0, 34), (36, -12, 40), (78, -2, 32), (104, 10, 22), (-30, 10, 22), (50, 14, 30)]
    m = m_fuse(m_union(*[R.mask(circle(x + bx * s, y + by * s, br * s * (0.95 + 0.1 * r.random()))) for bx, by, br in blobs]), 2.5 * R.S * s)
    m = m_sub(m, R.mask(np.array([(x - 80 * s, y + 24 * s), (x + 160 * s, y + 24 * s), (x + 160 * s, y + 80 * s), (x - 80 * s, y + 80 * s)], float)))
    R.paint(m, "#F7B9C4", Mat(puff=14 * s, line=False, tex=0.5), decal=[(R.mask(ellipse(x + 40 * s, y + 20 * s, 96 * s, 14 * s)), "#FFD9A8", 6)])

def ile_lointaine(R, pts, c, haze):
    m = R.mask(catmull(pts + [(pts[-1][0], HORIZON + 1), (pts[0][0], HORIZON + 1)]))
    R.paint(m, c, Mat(puff=5, line=False, tex=0.3), haze=haze)
    return m

def palmier_ombre(R, x, y, s=1.0, lean=-12):
    """Palmier en contre-jour : une silhouette violette, sans détail."""
    top = (x + lean * s * 3.2, y - 230 * s)
    tronc = stroke_pts([(x, y), (x + lean * s * 1.2, y - 110 * s), top], n=12)
    flat(R, R.mask(ribbon(tronc, np.linspace(11 * s, 6 * s, len(tronc)))), ENCRE_SOIR)
    for a, ln, cb in ((-160, 120, 0.18), (-128, 110, 0.12), (-96, 96, 0.05), (-60, 112, -0.1), (-24, 124, -0.16), (8, 110, -0.2), (200, 100, 0.2)):
        t = math.radians(a)
        tip = (top[0] + math.cos(t) * ln * s, top[1] + math.sin(t) * ln * s + 26 * s)
        flat(R, R.mask(leaf(top, tip, 15 * s, cb)), ENCRE_SOIR)

def fond(R):
    R.haze = L("#F2C2C6")
    R.vgradient([(0, "#6C5DAA"), (0.20, "#9B6CB0"), (0.37, "#E388A2"), (0.49, "#FFAE7E"), (HORIZON / H, "#FFD996"), (1, "#FFD996")])
    yy, xx = np.mgrid[0:R.h, 0:R.w].astype(np.float32) / R.S
    d = np.sqrt((xx - SOLEIL[0]) ** 2 + ((yy - HORIZON) * 1.4) ** 2)
    R.img = R.img + np.exp(-(d / 330) ** 2)[..., None] * L("#FFE6B0") * 0.5
    for (x, y, s, sd) in ((130, 140, 1.15, 31), (520, 92, 0.8, 32), (960, 160, 1.05, 33), (330, 300, 0.7, 34), (1080, 330, 0.55, 35)):
        nuage(R, x, y, s, sd)
    # étoiles qui s'allument tout en haut (fixes : rien ne clignote)
    for (sx, sy, sr) in ((70, 40, 2.2), (300, 60, 1.6), (640, 30, 2.0), (880, 58, 1.5), (1120, 34, 2.2), (980, 96, 1.4)):
        R.paint(R.mask(circle(sx, sy, sr)), "#FFF6E0", Mat(flat=True))
    # la mer : violette, plus claire et rosée vers l'horizon
    ys = np.linspace(0, 1, R.h, dtype=np.float32)[:, None]
    t = np.clip((ys * H - HORIZON) / (H - HORIZON), 0, 1)
    far, mid, near = L("#D49AB6"), L("#8E77B6"), L("#5B5CA6")
    col = np.where(t[..., None] < 0.35, mix(far, mid, (t / 0.35)[..., None]), mix(mid, near, ((t - 0.35) / 0.65)[..., None]))
    col = np.repeat(col, R.w, axis=1)
    br = value_noise(R.h, R.w, 26 * R.S, 92, octaves=3, stretch=(6, 0.5))
    col = col * (1 + 0.1 * (br[..., None] - 0.5))
    mer = R.mask(np.array([(-10, HORIZON), (W + 10, HORIZON), (W + 10, H + 10), (-10, H + 10)], float))
    a = mer.to((0, 0, R.w, R.h))[..., None]
    R.img = R.img * (1 - a) + col * a
    # îles lointaines, dans la brume rose
    ile_lointaine(R, [(40, HORIZON), (90, 452), (160, 444), (230, 452), (280, HORIZON)], "#8C6FA6", 0.35)
    ile_lointaine(R, [(330, HORIZON), (372, 446), (410, 420), (430, 404, "c"), (452, 404, "c"), (470, 422), (520, 448), (566, HORIZON)], "#7D63A0", 0.3)
    ile_lointaine(R, [(960, HORIZON), (1010, 454), (1080, 448), (1140, 458), (1190, HORIZON)], "#8C6FA6", 0.38)
    for i, (px, py, pr) in enumerate(((446, 392, 8), (452, 378, 10), (462, 362, 12))):
        R.paint(R.mask(circle(px, py, pr)), "#F7D3D6", Mat(puff=5, line=False, tex=0.2), haze=0.3)
    # le chemin doré du soleil sur l'eau, qui s'élargit vers nous
    r = D.rng(7)
    for i in range(46):
        k = (i / 45) ** 1.3
        yy0 = HORIZON + 6 + k * (H - HORIZON - 70)
        demi = 20 + 120 * k
        xx = SOLEIL[0] + (r.random() * 2 - 1) * demi
        ln = 10 + 50 * k * (0.5 + r.random())
        m = R.line_mask([(xx - ln / 2, yy0), (xx, yy0 - 0.8), (xx + ln / 2, yy0)], 1.4 + 2.4 * k)
        R.paint(m, "#FFD98F" if i % 3 else "#FFE9B8", Mat(flat=True))
    for i in range(40):  # reflets roses ailleurs
        yy0 = HORIZON + 14 + (r.random() ** 1.5) * (H - HORIZON - 80)
        xx = r.random() * W
        if abs(xx - SOLEIL[0]) < 150:
            continue
        ln = 14 + 30 * (yy0 - HORIZON) / (H - HORIZON)
        R.paint(R.line_mask([(xx, yy0), (xx + ln / 2, yy0 - 0.8), (xx + ln, yy0)], 1.4 + 1.6 * (yy0 - HORIZON) / (H - HORIZON)), "#C9A2CF", Mat(flat=True))
    R.paint(R.mask(np.array([(-10, HORIZON - 1), (W + 10, HORIZON - 1), (W + 10, HORIZON + 2), (-10, HORIZON + 2)], float)), "#FFE3B0", Mat(flat=True))
    # la plage au premier plan, chaude dans la lumière du soir
    sable = R.mask(catmull([(-30, 760), (180, 726), (420, 744), (640, 770), (900, 754), (1100, 738), (1230, 752), (1230, 870), (-30, 870)], n=12))
    def sable_alb(x, y, base):
        tt = np.clip((y - 730) / 110, 0, 1)[..., None]
        return mix(L("#F7CB91"), L("#E8A978"), tt)
    mouille = m_sub(m_grow(sable, 9 * R.S), sable)
    R.paint(mouille, "#C99A9E", Mat(flat=True))
    R.paint(sable, "#F2BE88", Mat(puff=8, profile="pillow", line=False, tex=0.9), albedo=sable_alb)
    ecume = m_wobble(m_sub(m_grow(sable, 4 * R.S), m_grow(sable, 1 * R.S)), 1.0 * R.S, 12 * R.S, seed=8)
    R.paint(ecume, "#FFF1EA", Mat(flat=True))
    for (cx, cy, c) in ((250, 790, "#F49AB8"), (310, 808, "#FFFFFF"), (900, 800, "#FFC145")):
        part(R, R.mask(ellipse(cx, cy, 7, 4)), c, Mat(puff=2, line_w=0.8), shadow=False)
    palmier_ombre(R, 1112, 800, 1.05, lean=-14)
    palmier_ombre(R, 1040, 812, 0.72, lean=-6)

def soleil(R):
    x, y, r = 120, 120, SOLEIL[1]
    g = R.mask(circle(x, y, r + 14)).padded(int(40 * R.S))
    g.a = cv2.GaussianBlur(g.a, (0, 0), 14 * R.S) * 0.75
    R.paint(g, "#FFD08A", Mat(flat=True))
    m = R.mask(circle(x, y, r))
    def alb(xx_, yy_, base):
        tt = np.clip((yy_ - (y - r)) / (2 * r), 0, 1)[..., None]
        return mix(L("#FFE27A"), L("#FF9E5E"), tt)
    R.paint(m, "#FFC145", Mat(puff=10, line=False, tex=0.3), albedo=alb)

ELEMENTS = {
    "fin/coucher": dict(cadre=(W, H), dessin=fond, opaque=True, qualite=80),
    "fin/soleil": dict(cadre=(240, 240), dessin=soleil, points={"centre": (120, 120)}, infos={"rayon": SOLEIL[1], "horizon": HORIZON, "x": SOLEIL[0]}),
}
