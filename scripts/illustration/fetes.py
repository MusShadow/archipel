"""Fêtes de réussite d'Archipel 2 (livraison 2) : les objets des petites scènes, dans la matière de l'atelier.
Ballons (une couleur d'île chacun), voiture et camion de pompiers vus de côté (roues à part, pour tourner), fusée et
sa flamme, volcan rigolo, guirlande de fanions de la grande fête. Les mouvements restent dans l'appli (src/fete.ts)."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, eye_parts, mouth, leaf, INK
import decors as D

COULEURS = {"jaune": "#FFC145", "corail": "#FF7F50", "rose": "#E85D9A", "violet": "#8C6BE0", "bleu": "#3D8BEA", "turquoise": "#1FA9B5", "vert": "#34B37A"}

# ---------------------------------------------------------------------------- ballon
BALLON = (100, 190)

def ballon(R, c):
    cx, cy = 50, 54
    corps = R.mask(catmull([(cx, cy - 46), (cx + 30, cy - 34), (cx + 38, cy - 4), (cx + 26, cy + 30), (cx + 6, cy + 48), (cx - 6, cy + 48),
                            (cx - 26, cy + 30), (cx - 38, cy - 4), (cx - 30, cy - 34)]))
    # ficelle souple (dessinée d'abord : elle passe derrière le nœud)
    fil = [(cx, cy + 54)] + [(cx + 5 * math.sin(k * 0.9), cy + 54 + k * 11) for k in range(1, 11)]
    flat(R, R.line_mask(fil, 1.6), "#8A8F9C")
    part(R, R.mask(np.array([(cx - 6, cy + 46), (cx + 6, cy + 46), (cx + 4, cy + 56), (cx - 4, cy + 56)], float)), tweak(L(c), dl=-0.04), Mat(puff=2, line_w=1.0))
    part(R, corps, c, Mat(puff=20, spec=0.55, shin=36, rim=0.25, line_w=1.6, tex=0.5),
         decal=[(R.mask(ellipse(cx - 14, cy - 22, 7, 13, -24)), "#FFFFFF", 3.0)])

# ---------------------------------------------------------------------------- roues
ROUE = (70, 70)

def roue(R):
    cx, cy = 35, 35
    part(R, R.mask(circle(cx, cy, 30)), "#2E3445", Mat(puff=8, spec=0.15, line_w=1.5, tex=0.6))
    part(R, R.mask(circle(cx, cy, 15)), "#E4D9C5", Mat(puff=5, line_w=1.2), shadow=False)
    # rayons : on voit la roue tourner
    for k in range(4):
        a = k * math.pi / 2
        flat(R, R.line_mask([(cx + math.cos(a) * 4, cy + math.sin(a) * 4), (cx + math.cos(a) * 13, cy + math.sin(a) * 13)], 2.6, smooth_it=False), "#9AA0AE")
    part(R, R.mask(circle(cx, cy, 4.5)), "#9AA0AE", Mat(puff=2, line_w=0.8), shadow=False)

# ---------------------------------------------------------------------------- voiture de course (roule vers la droite)
VOITURE = (300, 170)
ROUES_VOITURE = ((86, 128), (230, 128))

def voiture(R):
    D.ground_shadow(R, 158, 156, 126, 8, 0.22, dx=0, blur=5)
    caisse = catmull([(26, 112), (24, 88), (44, 78), (84, 72), (112, 44), (148, 34), (182, 36), (210, 64), (258, 72), (282, 86), (284, 112),
                      (262, 124), (40, 124)], n=10)
    cm = R.mask(caisse)
    part(R, cm, "#FF6B57", Mat(puff=16, spec=0.45, shin=30, rim=0.25, line_w=1.8),
         decal=[(R.mask(rrect(30, 96, 252, 9, 4)), "#FFFFFF", 0.6)])
    # vitres, phare, rond du numéro
    for pts in ([(120, 72), (136, 48), (160, 44), (160, 72)], [(170, 44), (186, 46), (204, 72), (170, 72)]):
        part(R, R.mask(catmull(pts, n=6)), "#BFE8EE", Mat(puff=4, spec=0.6, shin=40, line_w=1.2), shadow=False)
    part(R, R.mask(circle(100, 92, 14)), "#FFF7EA", Mat(puff=4, line_w=1.2), shadow=False)
    tm = D.text_mask(R, "1", 100, 92, 19)
    flat(R, tm, "#C2452F")
    part(R, R.mask(ellipse(276, 92, 7, 6)), "#FFF3C4", Mat(puff=3, spec=0.6, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(14, 98, 14, 12, 3)), "#5B6475", Mat(puff=3, line_w=1.0))
    # passages de roue (les roues sont posées par l'appli)
    for (x, y) in ROUES_VOITURE:
        flat(R, m_clip(R.mask(circle(x, y, 34)), cm), "#B8412F")

# ---------------------------------------------------------------------------- camion de pompiers (roule vers la gauche)
CAMION = (420, 230)
ROUES_CAMION = ((80, 186), (262, 186), (340, 186))

def camion(R):
    D.ground_shadow(R, 210, 214, 190, 9, 0.22, dx=0, blur=6)
    rouge, rouge_d = "#E8504A", "#C23D38"
    cabine = R.mask(catmull([(22, 180), (22, 110), (34, 84), (64, 76), (126, 76), (136, 90), (136, 180)], n=8))
    caisse = R.mask(rrect(130, 88, 272, 94, 12))
    part(R, caisse, rouge, Mat(puff=12, spec=0.3, shin=24, line_w=1.8), decal=[(R.mask(rrect(132, 150, 268, 10, 4)), "#FFFFFF", 0.5)])
    part(R, cabine, rouge, Mat(puff=12, spec=0.35, shin=24, line_w=1.8), decal=[(R.mask(rrect(24, 150, 110, 10, 4)), "#FFFFFF", 0.5)])
    part(R, R.mask(catmull([(40, 128), (42, 100), (62, 90), (118, 90), (118, 128)], n=6)), "#BFE8EE", Mat(puff=4, spec=0.6, shin=40, line_w=1.2), shadow=False)
    for x in (150, 220, 290):
        part(R, R.mask(rrect(x, 100, 56, 40, 6)), rouge_d, Mat(puff=4, line_w=1.2), shadow=False)
    # bobine du tuyau, échelle sur le toit, lance au bout
    part(R, R.mask(circle(368, 120, 20)), "#FFC145", Mat(puff=6, line_w=1.4), shadow=False,
         decal=[(R.mask(circle(368, 120, 8)), "#D99A1C", 1.0)])
    for y in (58, 74):
        part(R, R.mask(rrect(140, y, 262, 7, 3.5)), "#C9CED8", Mat(puff=3, spec=0.3, line_w=1.0))
    for k in range(11):
        part(R, R.mask(rrect(150 + k * 23, 58, 5, 23, 2)), "#C9CED8", Mat(puff=2, line_w=0.8), shadow=False)
    part(R, R.mask(rrect(392, 50, 16, 12, 4)), "#5B6475", Mat(puff=3, line_w=1.0))
    part(R, R.mask(ellipse(26, 150, 6, 7)), "#FFF3C4", Mat(puff=3, spec=0.6, line_w=1.0), shadow=False)
    for (x, y) in ROUES_CAMION:
        flat(R, m_clip(R.mask(circle(x, y, 32)), m_union(caisse, cabine)), "#A9332F")
    # socle du gyrophare (la lumière est posée par l'appli)
    part(R, R.mask(rrect(60, 66, 32, 10, 4)), "#5B6475", Mat(puff=3, line_w=1.0))

GYRO = (60, 50)

def gyrophare(R):
    m = R.mask(catmull([(12, 40), (14, 22), (30, 10), (46, 22), (48, 40)], n=8))
    part(R, m, "#4E9BF0", Mat(puff=10, spec=0.8, shin=40, rim=0.4, line_w=1.4), decal=[(R.mask(ellipse(24, 22, 5, 7, -20)), "#FFFFFF", 2.0)])

# ---------------------------------------------------------------------------- fusée et flamme
FUSEE = (140, 270)

def fusee(R):
    cx = 70
    for sx in (-1, 1):
        aileron = R.mask(catmull([(cx + sx * 22, 150), (cx + sx * 50, 214), (cx + sx * 46, 226), (cx + sx * 20, 210)], n=6))
        part(R, aileron, "#E8504A", Mat(puff=6, line_w=1.4))
    corps = R.mask(catmull([(cx, 12), (cx + 30, 52), (cx + 34, 130), (cx + 28, 214), (cx - 28, 214), (cx - 34, 130), (cx - 30, 52)], n=10))
    part(R, corps, "#F7F3EA", Mat(puff=18, spec=0.4, shin=30, rim=0.25, line_w=1.6))
    pointe = m_clip(R.mask(rrect(cx - 40, 0, 80, 64, 4)), corps)
    R.paint(pointe, "#E8504A", Mat(puff=10, spec=0.4, shin=30, line_w=1.6))
    part(R, R.mask(rrect(cx - 34, 186, 68, 12, 5)), "#E8504A", Mat(puff=4, line_w=1.2), shadow=False)
    part(R, R.mask(circle(cx, 108, 20)), "#FFFFFF", Mat(puff=5, line_w=1.2), shadow=False)
    part(R, R.mask(circle(cx, 108, 14)), "#3D8BEA", Mat(puff=6, spec=0.7, shin=40, line_w=1.0), shadow=False,
         decal=[(R.mask(circle(cx - 5, 103, 4)), "#BFE0FA", 1.5)])
    part(R, R.mask(rrect(cx - 18, 212, 36, 14, 4)), "#8A8F9C", Mat(puff=3, line_w=1.0))

FLAMME = (80, 120)

def flamme(R):
    ext = R.mask(catmull([(40, 6), (64, 30), (70, 64), (54, 104), (40, 116), (26, 104), (10, 64), (16, 30)], n=8))
    R.paint(ext, "#FFB23F", Mat(puff=10, line=False, tex=0.3))
    inter = R.mask(catmull([(40, 8), (54, 34), (54, 66), (40, 92), (26, 66), (26, 34)], n=8))
    R.paint(inter, "#FFE07A", Mat(puff=8, line=False, tex=0.2))
    flat(R, R.mask(ellipse(40, 30, 10, 18)), "#FFF6CF")

# ---------------------------------------------------------------------------- volcan rigolo
VOLCAN = (380, 250)

def volcan(R):
    pente = R.mask(catmull([(18, 236), (90, 140), (140, 60), (164, 46), (216, 46), (240, 60), (290, 140), (362, 236)], n=10))
    def alb(x, y, base):
        t = np.clip((y - 50) / 190, 0, 1)[..., None]
        return mix(L("#B07A4E"), L("#8E5C38"), t)
    part(R, pente, "#9B6B43", Mat(puff=24, profile="pillow", line_w=1.8, tex=1.0), albedo=alb,
         decal=[(R.mask(catmull([(140, 60), (164, 46), (216, 46), (240, 60), (226, 86), (208, 74), (192, 96), (176, 72), (160, 90)], n=6)), "#FF7F50", 2.0)])
    part(R, R.mask(ellipse(190, 50, 30, 8)), "#E8504A", Mat(puff=4, line_w=1.2), shadow=False)
    # visage
    for ex in (160, 220):
        eye_parts(R, ex, 140, "ouvert", r=10, look=(0.6, 1.0), lid="#9B6B43")
    mouth(R, 190, 168, 36, "sourire", ink="#4A2C1C")
    for chx in (140, 240):
        R.paint(R.mask(ellipse(chx, 166, 11, 6)), "#F49AB8", Mat(flat=True))
    # herbe au pied
    herbe = R.mask(catmull([(4, 250), (24, 222), (70, 214), (110, 230), (160, 222), (220, 230), (270, 218), (330, 220), (372, 244)], n=8))
    herbe = m_union(herbe, R.mask(rrect(0, 236, 380, 14, 2)))
    part(R, herbe, "#5FB04F", Mat(puff=8, profile="pillow", line_w=1.4, tex=0.9), shadow=False)

# ---------------------------------------------------------------------------- guirlande de fanions (grande fête)
GUIRLANDE = (1000, 120)

def guirlande(R):
    W = GUIRLANDE[0]
    corde = [(x, 18 + 34 * math.sin(math.pi * x / W)) for x in np.linspace(0, W, 40)]
    flat(R, R.line_mask(corde, 2.2), "#8A6A4E")
    cols = list(COULEURS.values())
    n = 15
    for k in range(n):
        x0 = W * (k + 0.2) / n
        x1 = W * (k + 0.8) / n
        y0 = 18 + 34 * math.sin(math.pi * x0 / W)
        y1 = 18 + 34 * math.sin(math.pi * x1 / W)
        xm = (x0 + x1) / 2
        ym = (y0 + y1) / 2 + 48
        m = R.mask(np.array([(x0, y0), (x1, y1), (xm, ym)], float))
        part(R, m, cols[k % len(cols)], Mat(puff=4, profile="pillow", line_w=1.2, tex=0.8))

ELEMENTS = {
    **{f"fetes/ballon-{n}": dict(cadre=BALLON, dessin=(lambda R, c=c: ballon(R, c))) for n, c in COULEURS.items()},
    "fetes/roue": dict(cadre=ROUE, dessin=roue, points={"centre": (35, 35)}),
    "fetes/voiture": dict(cadre=VOITURE, dessin=voiture, points={"roue1": ROUES_VOITURE[0], "roue2": ROUES_VOITURE[1], "pot": (16, 106)}, infos={"rayonRoue": 30}),
    "fetes/camion": dict(cadre=CAMION, dessin=camion, points={"roue1": ROUES_CAMION[0], "roue2": ROUES_CAMION[1], "roue3": ROUES_CAMION[2], "lance": (406, 54), "gyro": (76, 66)}, infos={"rayonRoue": 30}),
    "fetes/gyrophare": dict(cadre=GYRO, dessin=gyrophare, points={"socle": (30, 40)}),
    "fetes/fusee": dict(cadre=FUSEE, dessin=fusee, points={"tuyere": (70, 226)}),
    "fetes/flamme": dict(cadre=FLAMME, dessin=flamme, points={"haut": (40, 6)}),
    "fetes/volcan": dict(cadre=VOLCAN, dessin=volcan, points={"cratere": (190, 48)}),
    "fetes/guirlande": dict(cadre=GUIRLANDE, dessin=guirlande),
}
