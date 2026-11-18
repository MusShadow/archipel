"""Animaux et effets du décor vivant : dauphin, baleine au loin, poisson, oiseaux, fumée, étincelles, éclaboussures."""
import numpy as np
from moteur import *
from personnages import part, flat, eye_parts, INK

def dolphin(R, x, y, s=1.0):
    """Dauphin de profil, tourné vers la droite ; (x, y) = milieu du corps. Repère local ~ 170 x 70."""
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-75, -36))
    body_c, back_c, belly_c = "#5FA2C8", "#4A88B0", "#DDF0F5"
    m = Mat(puff=14, spec=0.35, shin=24, rim=0.35, line_w=1.6)
    # nageoire caudale
    tail = R.mask(catmull([(16, 40), (2, 30), (-14, 22, "c"), (-6, 40), (-14, 58, "c"), (2, 50), (16, 46)]))
    part(R, tail, back_c, Mat(puff=5, spec=0.2, line_w=1.4))
    # nageoire pectorale arrière (derrière le corps)
    part(R, R.mask(catmull([(96, 46), (90, 64, "c"), (108, 50)])), back_c, Mat(puff=4, line_w=1.2))
    # corps
    body = catmull([(12, 44), (38, 28), (80, 16), (116, 16), (136, 22), (148, 31), (162, 36, "c"), (148, 41), (128, 45),
                    (98, 52), (60, 54), (24, 50)])
    bm = R.mask(body)
    belly = R.mask(catmull([(40, 50), (80, 44), (118, 40), (146, 39), (128, 47), (96, 54), (58, 56)]))
    dorsal_sheen = R.mask(catmull([(40, 30), (80, 18), (116, 18), (90, 26), (60, 32)]))
    part(R, bm, body_c, m, decal=[(belly, belly_c, 4.0), (dorsal_sheen, back_c, 5.0)])
    # aileron dorsal
    fin = R.mask(catmull([(64, 22), (76, 6), (88, -2, "c"), (86, 10), (94, 22)]))
    part(R, fin, back_c, Mat(puff=5, spec=0.2, line_w=1.4))
    # nageoire pectorale avant
    part(R, R.mask(catmull([(100, 46), (98, 66, "c"), (116, 50)])), back_c, Mat(puff=4, line_w=1.3))
    # œil et sourire
    eye_parts(R, 124, 29, "ouvert", r=4.8, look=(0.8, 0.3))
    flat(R, R.line_mask([(150, 39), (140, 42), (130, 42)], 1.5), "#2E5F80")
    R.paint(R.mask(ellipse(132, 37, 5, 3)), "#F2A7B8", Mat(flat=True))
    R.pop()

def splash(R, x, y, s=1.0):
    R.push(Affine.T(x, y) @ Affine.S(s))
    drops = []
    for k, (dx, dy, r) in enumerate(((-18, -10, 4), (-9, -22, 5), (0, -28, 5.5), (10, -20, 4.5), (19, -9, 4), (-26, -2, 3), (27, -2, 3))):
        drops.append(R.mask(circle(dx, dy, r)))
    foam = R.mask(ellipse(0, 0, 30, 7))
    R.paint(foam, "#F4FBFB", Mat(puff=3, profile="pillow", line=False, tex=0.3))
    R.paint(m_union(*drops), "#F4FBFB", Mat(puff=3, line=False, tex=0.2, spec=0.3, shin=30))
    R.pop()

def whale_back(R, x, y, s=1.0):
    """Dos de baleine qui affleure, au loin (Mona en visite)."""
    hump = R.mask(catmull([(x - 26 * s, y), (x - 10 * s, y - 11 * s), (x + 12 * s, y - 12 * s), (x + 26 * s, y)]))
    R.paint(hump, "#3F6E9A", Mat(puff=6 * s, line=False, tex=0.4, spec=0.2), haze=0.25)
    flat(R, R.line_mask([(x - 30 * s, y + 1), (x + 30 * s, y + 1)], 1.6 * s), "#DDF4F4")

def whale_spout(R, x, y, s=1.0):
    col = R.mask(ribbon(np.array([(x, y), (x + 1 * s, y - 10 * s), (x, y - 20 * s)], float), np.array([1.6, 2.2, 2.6]) * s))
    puffs = [R.mask(circle(x + dx * s, y + dy * s, r * s)) for dx, dy, r in ((-7, -24, 6), (6, -25, 6.5), (0, -30, 7), (-12, -18, 4), (12, -19, 4))]
    m = m_union(col, *puffs)
    R.paint(m, "#FFFFFF", Mat(puff=4 * s, line=False, tex=0.2), haze=0.15)

def fish(R, x, y, s=1.0):
    R.push(Affine.T(x, y) @ Affine.S(s))
    body = R.mask(catmull([(-14, 0), (-4, -7), (8, -6), (15, 0, "c"), (8, 6), (-4, 7)]))
    tail = R.mask(catmull([(-12, 0), (-22, -8, "c"), (-19, 0), (-22, 8, "c")]))
    part(R, tail, "#F07A2E", Mat(puff=2, line_w=1.0), shadow=False)
    part(R, body, "#FF9A3C", Mat(puff=4, spec=0.4, shin=30, line_w=1.0), shadow=False,
         decal=[(R.mask(ellipse(0, 3, 9, 3)), "#FFD2A0", 1.5)])
    flat(R, R.mask(circle(8, -1.5, 1.6)), INK)
    R.pop()

def bird(R, x, y, s=1.0, frame=0):
    """Mouette stylisée ; frame 0 = ailes hautes, 1 = ailes basses."""
    R.push(Affine.T(x, y) @ Affine.S(s))
    if frame == 0:
        wl = [(0, 0), (-8, -7), (-17, -8), (-24, -4)]
        wr = [(0, 0), (8, -7), (17, -8), (24, -4)]
    else:
        wl = [(0, 0), (-9, 2), (-17, 6), (-23, 11)]
        wr = [(0, 0), (9, 2), (17, 6), (23, 11)]
    for w in (wl, wr):
        c = stroke_pts(w, n=8)
        wd = np.linspace(3.2, 0.8, len(c))
        part(R, R.mask(ribbon(c, wd)), "#FFFFFF", Mat(puff=2, line_w=0.9, tex=0.2), shadow=False,
             decal=[(R.mask(circle(w[-1][0], w[-1][1], 4.5)), "#6B7A8C", 0.5)])
    part(R, R.mask(ellipse(0, 1, 5, 3.2)), "#FFFFFF", Mat(puff=2, line_w=0.9, tex=0.2), shadow=False)
    flat(R, R.mask(np.array([(4, 0), (8, 1), (4, 2)], float)), "#FFB43C")
    R.pop()

def puff(R, x, y, r=10):
    m = m_union(R.mask(circle(x, y, r)), R.mask(circle(x - r * 0.7, y + r * 0.3, r * 0.7)), R.mask(circle(x + r * 0.75, y + r * 0.25, r * 0.65)))
    R.paint(m, "#FFFFFF", Mat(puff=r * 0.8, line=False, tex=0.3), haze=0.2)

def sparkle(R, x, y, r=7):
    glow = R.mask(circle(x, y, r * 0.9))
    glow.a = cv2.GaussianBlur(glow.padded(int(r * R.S)).a, (0, 0), r * 0.5 * R.S) if False else glow.a
    g = glow.padded(int(r * 2 * R.S))
    g.a = cv2.GaussianBlur(g.a, (0, 0), r * 0.45 * R.S) * 0.55
    R.paint(g, "#FFFFFF", Mat(flat=True))
    star = m_union(R.mask(np.array([(x, y - r), (x + r * 0.18, y), (x, y + r), (x - r * 0.18, y)], float)),
                   R.mask(np.array([(x - r, y), (x, y - r * 0.18), (x + r, y), (x, y + r * 0.18)], float)))
    R.paint(star, "#FFFFFF", Mat(flat=True))
