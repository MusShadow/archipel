"""Coin calme (livraison 3) : un décor doux pour respirer avec Pico. Un ciel pastel, des collines, l'arbre aux
cœurs, des tulipes, un tapis rond au milieu ; Pico à part (les yeux fermés, puis content), que l'écran fait
respirer : il gonfle un peu à l'inspiration, se repose à l'expiration. Repère 1194 x 834."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf
import decors as D
import hotes as HT
import ile_commun as C

W, H = 1194, 834
TAPIS = (597, 712)  # là où Pico est assis

def colline(R, pts, c1, c2, seed):
    m = R.mask(catmull(pts + [(W + 40, H + 40), (-40, H + 40)], n=12))
    top = min(p[1] for p in pts)
    def alb(x, y, base):
        t = np.clip((y - top) / (H - top), 0, 1)[..., None]
        return mix(L(c1), L(c2), t)
    R.paint(m, c1, Mat(puff=18, profile="pillow", line=False, tex=0.7), albedo=alb)
    return m

def fond(R):
    R.haze = L("#F3E3F2")
    R.vgradient([(0, "#C9B8EE"), (0.30, "#E8C4E2"), (0.55, "#FBD7DC"), (0.72, "#FFE9D8"), (1, "#FFE9D8")])
    yy, xx = np.mgrid[0:R.h, 0:R.w].astype(np.float32) / R.S
    d = np.sqrt((xx - 597) ** 2 + ((yy - 300) * 1.3) ** 2)
    R.img = R.img + np.exp(-(d / 420) ** 2)[..., None] * L("#FFF6EE") * 0.35
    for (x, y, s, sd) in ((150, 130, 0.95, 41), (820, 90, 0.75, 42), (1040, 210, 0.6, 43), (420, 230, 0.5, 44)):
        D.cloud(R, x, y, s, sd)
    colline(R, [(-40, 560), (220, 500), (480, 540), (700, 520), (980, 470), (1240, 520)], "#C9E6B4", "#B2DA9C", 1)
    colline(R, [(-40, 640), (260, 600), (560, 628), (860, 596), (1240, 640)], "#A9D98C", "#8CCB75", 2)
    # l'arbre aux cœurs, à gauche ; un petit buisson à droite
    D.round_tree(R, 196, 600, 1.25, seed=75)
    for (dx, dy, r, c) in ((-52, -128, 11, "#E85D9A"), (-8, -156, 10, "#F49AB8"), (40, -124, 11, "#E85D9A"), (-28, -92, 9, "#F49AB8"), (60, -160, 9, "#E85D9A"), (16, -102, 10, "#F49AB8")):
        part(R, R.mask(C.coeur(196 + dx, 600 + dy, r)), c, Mat(puff=3, line_w=0.9, spec=0.2), shadow=False)
    D.bush(R, 1010, 640, 1.05, "#7FC46A", seed=45, flowers="#E85D9A")
    for k, (x, y) in enumerate(((330, 690), (356, 700), (860, 696), (884, 690), (910, 704), (120, 720), (1100, 716))):
        C.tulipe(R, x, y, ("#E85D9A", "#FFC145", "#8C6BE0", "#F49AB8")[k % 4], h=22, s=1.2)
    # le tapis rond, ses coussins
    tx, ty = TAPIS
    tapis = R.mask(ellipse(tx, ty, 190, 40))
    part(R, tapis, "#D9CDF6", Mat(puff=6, profile="pillow", line_w=1.4, tex=0.7),
         decal=[(m_sub(R.mask(ellipse(tx, ty, 160, 31)), R.mask(ellipse(tx, ty, 150, 27))), "#B9A4F2", 1.0),
                (m_sub(R.mask(ellipse(tx, ty, 100, 18)), R.mask(ellipse(tx, ty, 92, 15))), "#F49AB8", 1.0)])
    for (cx, c) in ((tx - 150, "#F49AB8"), (tx + 150, "#FFC145")):
        part(R, R.mask(ellipse(cx, ty - 12, 30, 15)), c, Mat(puff=7, profile="pillow", line_w=1.2, tex=0.6))

def pico(R, expr):
    HT.pico(R, 150, 300 - 85 * 1.15, 1.15, expr=expr)

ELEMENTS = {
    "calme/fond": dict(cadre=(W, H), dessin=fond, opaque=True, qualite=80),
    "calme/pico": dict(cadre=(300, 320), dessin=(lambda R: pico(R, "calme")), points={"pieds": (150, 300)}),
    "calme/pico-content": dict(cadre=(300, 320), dessin=(lambda R: pico(R, "content")), points={"pieds": (150, 300)}),
}
