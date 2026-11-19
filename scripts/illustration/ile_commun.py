"""Briques communes des écrans d'île d'Archipel 2 (livraison 3) : une île de base qu'on décline (côte, herbe,
chemins, végétation), et les petits objets des lieux (table, cube à lettre, cabane, livre, note de musique, panneau,
fanions). Même lumière, même matière que l'île des Nombres (decors.py) ; repère 1194 x 834."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf, INK
import decors as D

W, H = D.W, D.H

# ---------------------------------------------------------------------------- l'île
def contour(seed=0, amp=(18, 10), ondes=(3, 4)):
    """La côte de l'île des Nombres, ondulée autrement : chaque île a la sienne, les six emplacements restent dedans."""
    r = np.random.default_rng(seed)
    ph1, ph2 = r.random() * 6.28, r.random() * 6.28
    n = len(D.ISL)
    out = []
    for i, (x, y) in enumerate(D.ISL):
        t = 2 * math.pi * i / n
        out.append((x + amp[0] * math.sin(ondes[0] * t + ph1), y + amp[1] * math.sin(ondes[1] * t + ph2)))
    return out

def ile(R, pts, herbe=("#9BD27A", "#7CC062"), seed=11):
    top = catmull(pts, n=16)
    top_m = R.mask(top)
    side_m = m_union(*[m_shift(top_m, 0, dy * R.S) for dy in (10, 20, 30, 38)])
    halo = m_grow(side_m, 34 * R.S).padded(int(56 * R.S))
    halo.a = cv2.GaussianBlur(halo.a, (0, 0), 16 * R.S)
    R.paint(halo, "#8FDCD9", Mat(flat=True))
    foam = m_wobble(m_grow(side_m, 7 * R.S), 2.0 * R.S, 18 * R.S, seed=seed + 59).padded(int(6 * R.S))
    foam.a = cv2.GaussianBlur(foam.a, (0, 0), 1.2 * R.S)
    R.paint(foam, "#F2FBF8", Mat(flat=True))
    def side_alb(x, y, base):
        t = np.clip((y - 520) / 260, 0, 1)[..., None]
        return mix(L("#E2B47C"), L("#B97F4C"), t)
    strata = []
    for i, dy in enumerate((13, 24)):
        band = m_sub(m_wobble(m_shift(top_m, 0, dy * R.S), 1.6 * R.S, 26 * R.S, seed=seed + 70 + i), m_shift(top_m, 0, (dy - 2.2) * R.S))
        strata.append(m_clip(band, side_m))
    R.paint(side_m, "#C99060", Mat(puff=14, profile="pillow", line_w=2.0, tex=0.8), albedo=side_alb, decal=[(m_union(*strata), "#A8703F", 0.6)])
    R.paint(top_m, "#F3DDAF", Mat(puff=10, profile="pillow", line_w=1.8, tex=0.8))
    grass = m_shift(m_grow(R.mask(top), -30 * R.S), 0, -6 * R.S)
    grass = m_wobble(grass, 9.0 * R.S, 60 * R.S, seed=seed + 63)
    grass = m_wobble(grass, 2.5 * R.S, 14 * R.S, seed=seed + 64)
    def grass_alb(x, y, base):
        n = R.crop(R.mottle, (int(x[0, 0] * R.S), int(y[0, 0] * R.S), int(x[0, 0] * R.S) + x.shape[1], int(y[0, 0] * R.S) + x.shape[0]))
        t = np.clip((y - 330) / 380, 0, 1)[..., None]
        c = mix(L(herbe[0]), L(herbe[1]), t)
        return c * (1 + 0.10 * (n[..., None] - 0.5))
    R.paint(grass, herbe[0], Mat(puff=16, profile="pillow", line=False, tex=0.9), albedo=grass_alb)
    r = np.random.default_rng(seed)
    tufts = []
    for i in range(34):
        x = 190 + r.random() * 860
        y = 350 + r.random() * 330
        for bx, h, lean in ((-3, 7, -2), (0, 10, 0), (3, 7, 2)):
            tufts.append(R.line_mask([(x + bx, y), (x + bx + lean * 0.5, y - h * 0.5), (x + bx + lean, y - h)], 1.1))
    R.paint(m_clip(m_union(*tufts), grass), tweak(L(herbe[1]), dl=-0.06, sat=1.05), Mat(flat=True))
    return top_m

def chemin(R, segs, seed=55, c="#EAD3A2"):
    """Chemins de sable entre les lieux : liste de (points, largeur)."""
    ms = []
    for pts, w in segs:
        line = stroke_pts(pts, n=12)
        ms.append(R.mask(ribbon(line, np.linspace(w * 1.15, w * 0.85, len(line)))))
    m = m_fuse(m_union(*ms), 3 * R.S)
    m = m_wobble(m, 1.2 * R.S, 10 * R.S, seed=seed)
    R.paint(m, c, Mat(puff=5, profile="pillow", line=False, tex=0.9), decal=[(m_grow(m, -4 * R.S), tweak(L(c), dl=0.03), 3)])
    return m

def ciel_mer(R, nuages=((150, 112, 1.0, 1), (820, 96, 0.72, 2), (1040, 150, 0.85, 3))):
    D.sky(R)
    for (x, y, s, sd) in nuages:
        D.cloud(R, x, y, s, sd)
    D.far_islands(R)
    D.sea(R, None)

# ---------------------------------------------------------------------------- petits objets des lieux
def table(R, x, y, w=120, h=46, c="#C98B55", pieds="#8E5F37"):
    """Table vue de face : (x, y) = milieu du sol sous la table."""
    D.ground_shadow(R, x + 6, y + 2, w * 0.55, 8, 0.24, dx=4, blur=4)
    for px in (x - w / 2 + 10, x + w / 2 - 10):
        part(R, R.mask(rrect(px - 4, y - h, 8, h, 3)), pieds, Mat(puff=3, line_w=1.0, tex=1.0))
    part(R, R.mask(rrect(x - w / 2, y - h - 12, w, 14, 5)), c, Mat(puff=5, profile="pillow", line_w=1.4, tex=1.0))

def cube(R, x, y, s=1.0, c="#FF7F50", lettre=None, encre="#FFFFFF"):
    """Cube en bois coloré, posé : (x, y) = milieu du bas de la face avant."""
    a = 26 * s
    face = R.mask(rrect(x - a / 2, y - a, a, a, 3 * s))
    dessus = R.mask(np.array([(x - a / 2, y - a), (x - a / 2 + 7 * s, y - a - 7 * s), (x + a / 2 + 7 * s, y - a - 7 * s), (x + a / 2, y - a)], float))
    cote = R.mask(np.array([(x + a / 2, y - a), (x + a / 2 + 7 * s, y - a - 7 * s), (x + a / 2 + 7 * s, y - 7 * s), (x + a / 2, y)], float))
    part(R, cote, tweak(L(c), dl=-0.10), Mat(puff=2, line_w=1.0, tex=0.8))
    part(R, dessus, tweak(L(c), dl=0.06), Mat(puff=2, line_w=1.0, tex=0.8), shadow=False)
    part(R, face, c, Mat(puff=4, profile="pillow", line_w=1.2, tex=0.9), shadow=False)
    if lettre:
        flat(R, D.text_mask(R, lettre, x, y - a / 2 - 1, 17 * s), encre)

def note(R, x, y, s=1.0, c="#FF7F50"):
    """Note de musique (croche) : (x, y) = milieu de la tête."""
    part(R, R.mask(ellipse(x, y, 7 * s, 5.5 * s, -20)), c, Mat(puff=3, line_w=1.0, spec=0.2), shadow=False)
    part(R, R.mask(rrect(x + 4.5 * s, y - 26 * s, 3 * s, 26 * s, 1.5)), c, Mat(puff=1, line_w=0.8), shadow=False)
    fl = R.mask(catmull([(x + 6 * s, y - 26 * s), (x + 16 * s, y - 18 * s), (x + 14 * s, y - 10 * s), (x + 7 * s, y - 18 * s)], n=6))
    part(R, fl, c, Mat(puff=2, line_w=0.9), shadow=False)

def panneau(R, x, y, texte, w=70, h=34, c="#C98B55", encre="#4A2C1C", taille=17):
    """Panneau de bois sur un poteau : (x, y) = pied du poteau."""
    D.ground_shadow(R, x + 4, y + 2, 12, 4, 0.22, dx=3, blur=3)
    part(R, R.mask(rrect(x - 3, y - 70, 6, 70, 2)), "#8E5F37", Mat(puff=2, line_w=0.9, tex=1.0))
    part(R, R.mask(rrect(x - w / 2, y - 70 - h / 2 - 4, w, h, 6)), c, Mat(puff=4, profile="pillow", line_w=1.3, tex=1.0))
    flat(R, D.text_mask(R, texte, x, y - 74, taille), encre)

def fanions(R, a, b, couleurs, n=7, creux=20, lettres=None, encre="#FFFFFF"):
    """Guirlande de fanions entre deux points (poteaux posés par l'appelant)."""
    (x0, y0), (x1, y1) = a, b
    def at(t):
        return (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + creux * math.sin(math.pi * t))
    flat(R, R.line_mask([at(t) for t in np.linspace(0, 1, 24)], 1.6), "#8A6A4E")
    for k in range(n):
        t0, t1 = (k + 0.15) / n, (k + 0.85) / n
        p0, p1 = at(t0), at(t1)
        pm = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 22)
        part(R, R.mask(np.array([p0, p1, pm], float)), couleurs[k % len(couleurs)], Mat(puff=2, profile="pillow", line_w=1.0, tex=0.8), shadow=False)
        if lettres:
            flat(R, D.text_mask(R, lettres[k % len(lettres)], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 8, 10), encre)

def poteau(R, x, y, h=90, c="#8E5F37"):
    D.ground_shadow(R, x + 3, y + 2, 9, 3, 0.22, dx=2, blur=2)
    part(R, R.mask(rrect(x - 3.5, y - h, 7, h, 2)), c, Mat(puff=2, line_w=0.9, tex=1.0))

def livre(R, x, y, w=60, c="#FF7F50", pages="#FFFDF4", lignes="#C9B79A"):
    """Livre ouvert posé à plat (vu de trois quarts) : (x, y) = milieu de la reliure, en bas."""
    for sx in (-1, 1):
        page = R.mask(catmull([(x, y), (x + sx * w * 0.45, y - w * 0.06), (x + sx * w, y - w * 0.02), (x + sx * w * 0.98, y - w * 0.5),
                               (x + sx * w * 0.5, y - w * 0.56), (x, y - w * 0.48)], n=6))
        part(R, page, pages, Mat(puff=4, profile="pillow", line_w=1.2, tex=0.6))
        for k in range(3):
            yy = y - w * 0.38 + k * w * 0.1
            flat(R, R.line_mask([(x + sx * w * 0.15, yy + 1), (x + sx * w * 0.5, yy - 2), (x + sx * w * 0.82, yy)], 1.3), lignes)
    part(R, R.mask(catmull([(x - w * 1.04, y - w * 0.02), (x, y + w * 0.1), (x + w * 1.04, y - w * 0.02), (x + w, y + w * 0.08), (x, y + w * 0.18), (x - w, y + w * 0.08)], n=6)), c, Mat(puff=3, line_w=1.2))

def cabane(R, x, y, w=150, h=90, mur="#FFF4E2", toit="#FF7F50", porte="#A8703F", fenetre=True):
    """Petite cabane : (x, y) = milieu du bas de la façade."""
    D.ground_shadow(R, x + 10, y + 3, w * 0.62, 12, 0.26, dx=6, blur=5)
    part(R, R.mask(rrect(x - w / 2, y - h, w, h, 6)), mur, Mat(puff=8, profile="pillow", line_w=1.6, tex=1.0))
    toit_m = R.mask(catmull([(x - w / 2 - 16, y - h + 6), (x - w * 0.2, y - h - h * 0.55), (x + w * 0.2, y - h - h * 0.55), (x + w / 2 + 16, y - h + 6)], n=6))
    part(R, toit_m, toit, Mat(puff=10, profile="pillow", line_w=1.6, tex=1.0),
         decal=[(m_clip(m_union(*[R.line_mask([(x - w / 2 - 10 + k * w / 5, y - h + 4), (x - w * 0.25 + k * w / 10, y - h - h * 0.5)], 2.0) for k in range(6)]), toit_m), tweak(L(toit), dl=-0.08), 0.5)])
    part(R, R.mask(rrect(x - 14, y - 46, 28, 46, 6)), porte, Mat(puff=3, line_w=1.1, tex=1.0), shadow=False)
    if fenetre:
        for fx in (x - w * 0.32, x + w * 0.32):
            part(R, R.mask(rrect(fx - 14, y - h + 22, 28, 24, 5)), "#BFE8EE", Mat(puff=3, spec=0.5, line_w=1.1), shadow=False)
