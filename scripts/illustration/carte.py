"""Carte de l'archipel d'Archipel 2 (livraison 2) : la mer, et les sept îles redessinées, toutes différentes.
Chaque île est rendue seule, à sa taille sur la carte (repère 1180 x 820 de la v1) ; l'appli la pose à sa place, en
paysage comme en portrait, avec son nom, l'anneau de la mission et Plume qui vole vers elle. Silhouettes : ovale
(Nombres), haricot (Mots), croissant autour d'un port (Port), île découpée (Énigmes), grande île ronde du volcan
(Découvertes), palette avec son trou (Atelier), cœur (Cœur). Repères : marché, livre, phare, tour au point
d'interrogation, volcan, chevalet, arbre en fleurs."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf, INK
import decors as D

# ---------------------------------------------------------------------------- la mer
MER = (1194, 1194)

def mer(R):
    W, H = MER
    yy, xx = np.mgrid[0:R.h, 0:R.w].astype(np.float32) / R.S
    d = np.sqrt(((xx - W * 0.45) / W) ** 2 + ((yy - H * 0.42) / H) ** 2)
    base = mix(L("#9FDDE3"), L("#6CC4D2"), np.clip(d * 1.6, 0, 1)[..., None])
    mo = R.mottle[..., None] - 0.5
    R.img = base * (1 + 0.10 * mo)
    # nappes plus claires (hauts-fonds) et traits de vagues
    r = np.random.default_rng(12)
    for k in range(9):
        x, y = r.random() * W, r.random() * H
        m = R.mask(ellipse(x, y, 90 + r.random() * 120, 40 + r.random() * 50, r.random() * 180))
        m = m.padded(int(60 * R.S))
        m.a = cv2.GaussianBlur(m.a, (0, 0), 30 * R.S) * 0.35
        R.paint(m, "#C4EDEC", Mat(flat=True))
    for k in range(70):
        x, y = r.random() * W, r.random() * H
        s = 0.7 + r.random() * 0.7
        pts = [(x, y), (x + 8 * s, y - 5 * s), (x + 16 * s, y), (x + 24 * s, y - 5 * s), (x + 32 * s, y)]
        flat(R, R.line_mask(pts, 2.2 * s), "#E8F8F6" if k % 3 else "#FFFFFF")
    for k in range(26):
        x, y = r.random() * W, r.random() * H
        flat(R, R.mask(circle(x, y, 1.6 + r.random() * 1.6)), "#FFFFFF")

# ---------------------------------------------------------------------------- socle d'une île
def socle(R, pts, relief=16, herbe=("#A2D57F", "#7DC262"), sable="#F3DDAF", seed=1, inset=16, lagon=None):
    """Île vue de trois quarts : halo d'eau claire, écume, flanc de terre, plage, herbe. lagon : forme d'eau à creuser."""
    top_m = R.mask(catmull(pts, n=16))
    if lagon is not None:
        top_m = m_sub(top_m, R.mask(catmull(lagon, n=10)))
    side_m = m_union(*[m_shift(top_m, 0, dy * R.S) for dy in np.linspace(relief * 0.3, relief, 4)])
    halo = m_grow(side_m, 16 * R.S).padded(int(30 * R.S))
    halo.a = cv2.GaussianBlur(halo.a, (0, 0), 9 * R.S) * 0.85
    R.paint(halo, "#BDEDE6", Mat(flat=True))
    foam = m_wobble(m_grow(side_m, 4 * R.S), 1.4 * R.S, 12 * R.S, seed=seed + 70).padded(int(4 * R.S))
    foam.a = cv2.GaussianBlur(foam.a, (0, 0), 0.9 * R.S)
    R.paint(foam, "#F2FBF8", Mat(flat=True))
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts) + relief
    def side_alb(x, y, base):
        t = np.clip((y - (y0 + y1) / 2) / max(1, (y1 - y0) / 2), 0, 1)[..., None]
        return mix(L("#E2B47C"), L("#B97F4C"), t)
    strata = m_clip(m_sub(m_wobble(m_shift(top_m, 0, relief * 0.6 * R.S), 1.0 * R.S, 16 * R.S, seed=seed + 81), m_shift(top_m, 0, (relief * 0.6 - 1.6) * R.S)), side_m)
    R.paint(side_m, "#C99060", Mat(puff=8, profile="pillow", line_w=1.6, tex=0.8), albedo=side_alb, decal=[(strata, "#A8703F", 0.5)])
    R.paint(top_m, sable, Mat(puff=7, profile="pillow", line_w=1.5, tex=0.8))
    grass = m_shift(m_grow(top_m, -inset * R.S), 0, -3 * R.S)
    grass = m_wobble(grass, 4.0 * R.S, 30 * R.S, seed=seed + 74)
    grass = m_wobble(grass, 1.4 * R.S, 9 * R.S, seed=seed + 75)
    def grass_alb(x, y, base):
        t = np.clip((y - y0) / max(1, (y1 - y0)), 0, 1)[..., None]
        return mix(L(herbe[0]), L(herbe[1]), t)
    R.paint(grass, herbe[0], Mat(puff=10, profile="pillow", line=False, tex=0.9), albedo=grass_alb)
    r = np.random.default_rng(seed + 11)
    ys, xs = np.where(grass.a > 0.9)
    tufts = []
    if len(xs):
        for i in range(int(len(xs) / (R.S * R.S) / 900) + 6):
            j = r.integers(len(xs))
            x, y = (xs[j] + grass.x0) / R.S, (ys[j] + grass.y0) / R.S
            for bx, h, lean in ((-2, 5, -1.5), (0, 7, 0), (2, 5, 1.5)):
                tufts.append(R.line_mask([(x + bx, y), (x + bx + lean * 0.5, y - h * 0.5), (x + bx + lean, y - h)], 0.9))
    if tufts:
        R.paint(m_clip(m_union(*tufts), grass), "#6FB257", Mat(flat=True))
    if lagon is not None:
        lm = R.mask(catmull(lagon, n=10))
        R.paint(lm, "#7FD3DA", Mat(puff=6, profile="pillow", line_w=1.4, tex=0.6))
    return top_m, grass

def ovale(cx, cy, rx, ry, n=14, bosses=(), seed=0):
    r = np.random.default_rng(seed)
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        f = 1 + 0.05 * r.standard_normal()
        for (ta, amp) in bosses:
            f += amp * math.exp(-((math.atan2(math.sin(t - ta), math.cos(t - ta))) / 0.45) ** 2)
        pts.append((cx + rx * f * math.cos(t), cy + ry * f * math.sin(t)))
    return pts

def baton(R, a, b, w):
    """Bâton droit (pied, manche) de largeur w, de a à b."""
    c = stroke_pts([a, b], n=4)
    return R.mask(ribbon(c, np.full(len(c), float(w))))

def palmier(R, x, y, s=0.5, lean=10, seed=1, flip=False):
    D.palm(R, x, y, s, lean=lean, seed=seed, flip=flip)

def maisonnette(R, x, y, w, h, mur, toit, porte="#8B5A35"):
    D.ground_shadow(R, x + 4, y + 2, w * 0.6, 5, 0.22, dx=3, blur=3)
    part(R, R.mask(rrect(x - w / 2, y - h, w, h, 4)), mur, Mat(puff=5, line_w=1.3, tex=0.8))
    part(R, R.mask(np.array([(x - w / 2 - 6, y - h + 2), (x, y - h - h * 0.75), (x + w / 2 + 6, y - h + 2)], float)), toit, Mat(puff=5, line_w=1.3, tex=0.8))
    part(R, R.mask(rrect(x - w * 0.14, y - h * 0.55, w * 0.28, h * 0.55, 3)), porte, Mat(puff=2, line_w=1.0), shadow=False)

# ---------------------------------------------------------------------------- les sept îles
# Cadre de chaque île : 380 x 330, centre de l'île (point de la carte de la v1) en (190, 200).
CADRE_ILE = (380, 360)
CX, CY = 190, 200

def ile_nombres(R):
    socle(R, ovale(CX, CY, 118, 74, seed=1, bosses=((0.4, 0.08), (3.6, 0.06))), seed=1)
    # petit étang aux nénuphars
    pond = R.mask(ellipse(CX + 52, CY + 14, 34, 17))
    part(R, pond, "#D9C38F", Mat(puff=3, profile="pillow", line_w=1.1), shadow=False)
    R.paint(m_grow(pond, -3 * R.S), "#5DBFD0", Mat(puff=4, profile="pillow", line=False, tex=0.5))
    for (px, py) in ((CX + 38, CY + 12), (CX + 56, CY + 18), (CX + 70, CY + 10)):
        part(R, R.mask(ellipse(px, py, 7, 4)), "#5DB54C", Mat(puff=2, line_w=0.8), shadow=False)
    palmier(R, CX + 96, CY - 4, 0.42, lean=-10, seed=8)
    D.bush(R, CX - 92, CY + 18, 0.45, seed=13, flowers="#FFC145")
    # le marché de Basile : étal, auvent rayé, cagettes de fruits, panneau « 1 2 3 »
    sx, sy = CX - 34, CY + 6
    D.ground_shadow(R, sx + 4, sy + 2, 44, 6, 0.24, dx=3, blur=3)
    part(R, R.mask(rrect(sx - 38, sy - 30, 76, 30, 4)), "#C98B55", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0))
    for i, c in enumerate(("#E5483F", "#FFC145", "#34B37A")):
        for k in range(3):
            part(R, R.mask(circle(sx - 26 + i * 25 + k * 7, sy - 34 + (k % 2) * 2, 4.6)), c, Mat(puff=3, spec=0.3, line_w=0.8), shadow=False)
    for px in (sx - 36, sx + 34):
        part(R, R.mask(rrect(px - 2.5, sy - 76, 5, 50, 2)), "#8B5A35", Mat(puff=2, line_w=0.9))
    auvent = R.mask(catmull([(sx - 46, sy - 66), (sx - 40, sy - 84), (sx + 40, sy - 84), (sx + 46, sy - 66)], n=6))
    bandes = [R.mask(rrect(sx - 46 + k * 15.4, sy - 90, 7.7, 30, 0)) for k in range(6)]
    part(R, auvent, "#FFFFFF", Mat(puff=5, line_w=1.3), decal=[(m_clip(m_union(*bandes), auvent), "#3D8BEA", 0.3)])
    for k in range(6):
        part(R, R.mask(circle(sx - 40 + k * 16, sy - 65, 8)), "#3D8BEA" if k % 2 == 0 else "#FFFFFF", Mat(puff=3, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(sx + 50, sy - 52, 44, 24, 4)), "#3A3F4A", Mat(puff=3, line_w=1.0))
    part(R, R.mask(rrect(sx + 70, sy - 28, 4, 26, 2)), "#8B5A35", Mat(puff=2, line_w=0.8))
    flat(R, D.text_mask(R, "123", sx + 72, sy - 40, 15), "#F4F1E6")

def ile_mots(R):
    pts = ovale(CX, CY, 116, 70, seed=2, bosses=((1.6, -0.22), (4.7, 0.1)))
    socle(R, pts, seed=2, herbe=("#A9D883", "#86C66A"))
    D.round_tree(R, CX + 84, CY - 10, 0.5, seed=21, fruit="#FF7F50")
    # grand livre ouvert, posé debout
    bx, by = CX - 6, CY + 2
    D.ground_shadow(R, bx + 6, by + 4, 58, 7, 0.24, dx=4, blur=3)
    for sx in (-1, 1):
        page = R.mask(catmull([(bx, by), (bx + sx * 26, by - 8), (bx + sx * 58, by - 4), (bx + sx * 60, by - 66), (bx + sx * 28, by - 72), (bx, by - 64)], n=6))
        part(R, page, "#FFFDF4", Mat(puff=5, profile="pillow", line_w=1.3, tex=0.6))
        for k in range(4):
            y = by - 54 + k * 11
            flat(R, R.line_mask([(bx + sx * 10, y + 2), (bx + sx * 30, y - 2), (bx + sx * 50, y + 1)], 1.6), "#C9B79A")
    part(R, R.mask(catmull([(bx - 62, by - 2), (bx, by + 8), (bx + 62, by - 2), (bx + 60, by + 6), (bx, by + 14), (bx - 60, by + 6)], n=6)), "#FF7F50", Mat(puff=4, line_w=1.3))
    flat(R, D.text_mask(R, "a", bx - 30, by - 36, 26), "#BB4816")
    flat(R, D.text_mask(R, "b", bx + 30, by - 36, 26), "#BB4816")
    # cubes de lettres
    for (x, y, lettre, c) in ((CX - 86, CY + 22, "A", "#FF7F50"), (CX - 66, CY + 30, "B", "#FFC145"), (CX - 76, CY + 8, "C", "#3D8BEA")):
        part(R, R.mask(rrect(x - 10, y - 18, 20, 20, 4)), c, Mat(puff=4, profile="pillow", line_w=1.2))
        flat(R, D.text_mask(R, lettre, x, y - 8, 14), "#FFFFFF")

def ile_port(R):
    # croissant autour d'une baie : le port est dans le creux
    pts = [(CX - 120, CY - 6), (CX - 98, CY - 50), (CX - 50, CY - 66), (CX + 4, CY - 58), (CX + 22, CY - 34), (CX - 20, CY - 26), (CX - 52, CY - 8),
           (CX - 46, CY + 22), (CX + 4, CY + 36), (CX + 70, CY + 24), (CX + 112, CY + 34), (CX + 90, CY + 60), (CX + 20, CY + 72), (CX - 60, CY + 62), (CX - 108, CY + 34)]
    socle(R, pts, seed=3, herbe=("#A8D985", "#83C468"))
    # ponton et bateau dans la baie
    for k in range(5):
        part(R, R.mask(rrect(CX - 44 + k * 12, CY - 4, 10.5, 18, 2)), "#C98B55", Mat(puff=2, profile="pillow", line_w=0.9))
    bx, by = CX + 52, CY - 2
    coque = R.mask(catmull([(bx - 30, by), (bx + 30, by), (bx + 22, by + 14), (bx - 22, by + 14)], n=6))
    part(R, coque, "#E8504A", Mat(puff=5, spec=0.2, line_w=1.2))
    part(R, R.mask(rrect(bx - 1.5, by - 46, 3, 46, 1.5)), "#8B5A35", Mat(puff=2, line_w=0.8))
    part(R, R.mask(np.array([(bx + 2, by - 44), (bx + 2, by - 6), (bx + 26, by - 8)], float)), "#FFFFFF", Mat(puff=4, line_w=1.0))
    part(R, R.mask(np.array([(bx - 2, by - 40), (bx - 2, by - 8), (bx - 20, by - 10)], float)), "#1FA9B5", Mat(puff=4, line_w=1.0))
    # le phare rayé
    lx, ly = CX - 70, CY + 20
    D.ground_shadow(R, lx + 4, ly + 2, 20, 5, 0.25, dx=3, blur=3)
    tour = R.mask(np.array([(lx - 17, ly), (lx - 11, ly - 92), (lx + 11, ly - 92), (lx + 17, ly)], float))
    bandes = m_union(*[R.mask(rrect(lx - 20, ly - 92 + k * 23, 40, 11.5, 0)) for k in range(4)])
    part(R, tour, "#FFFFFF", Mat(puff=8, line_w=1.3), decal=[(m_clip(bandes, tour), "#1FA9B5", 0.3)])
    part(R, R.mask(rrect(lx - 15, ly - 98, 30, 7, 2)), "#0D5A60", Mat(puff=2, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(lx - 10, ly - 116, 20, 18, 4)), "#FFE07A", Mat(puff=4, spec=0.5, line_w=1.0))
    part(R, R.mask(np.array([(lx - 14, ly - 114), (lx, ly - 130), (lx + 14, ly - 114)], float)), "#E8504A", Mat(puff=3, line_w=1.0))
    palmier(R, CX + 70, CY + 36, 0.38, lean=8, seed=31)

def ile_enigmes(R):
    pts = ovale(CX, CY, 112, 76, n=18, seed=4, bosses=((0.0, 0.14), (1.2, -0.12), (2.4, 0.12), (3.8, -0.1), (5.2, 0.12)))
    socle(R, pts, seed=4, herbe=("#A5D681", "#80C364"))
    # tour violette et son point d'interrogation
    tx, ty = CX + 6, CY + 10
    D.ground_shadow(R, tx + 6, ty + 2, 34, 6, 0.25, dx=4, blur=3)
    tour = R.mask(catmull([(tx - 28, ty), (tx - 26, ty - 70), (tx + 26, ty - 70), (tx + 28, ty)], n=4))
    part(R, tour, "#8C6BE0", Mat(puff=10, line_w=1.4, tex=0.8),
         decal=[(m_union(*[R.mask(rrect(tx - 30, ty - 70 + k * 18, 60, 2.5, 0)) for k in range(1, 4)]), "#7959C6", 0.3)])
    for k in range(4):
        part(R, R.mask(rrect(tx - 28 + k * 15, ty - 82, 10, 14, 2)), "#8C6BE0", Mat(puff=3, line_w=1.0))
    part(R, R.mask(rrect(tx - 8, ty - 30, 16, 30, 7)), "#543F8A", Mat(puff=3, line_w=1.0), shadow=False)
    part(R, R.mask(rrect(tx - 1.5, ty - 122, 3, 44, 1.5)), "#8B5A35", Mat(puff=2, line_w=0.8))
    part(R, R.mask(np.array([(tx + 2, ty - 122), (tx + 40, ty - 112), (tx + 2, ty - 100)], float)), "#FFC145", Mat(puff=3, line_w=1.0))
    rond = R.mask(circle(tx, ty - 50, 13))
    part(R, rond, "#FFFDF4", Mat(puff=4, line_w=1.1), shadow=False)
    flat(R, D.text_mask(R, "?", tx, ty - 50, 20), "#543F8A")
    # pièce de puzzle et cristaux
    px, py = CX - 72, CY + 18
    pz = m_union(R.mask(rrect(px - 14, py - 14, 28, 22, 4)), R.mask(circle(px, py - 16, 6)), R.mask(circle(px + 15, py - 3, 6)))
    part(R, pz, "#FFC145", Mat(puff=5, profile="pillow", line_w=1.2))
    for (x, y, h, c) in ((CX + 70, CY + 22, 26, "#B9A4F2"), (CX + 82, CY + 26, 18, "#8C6BE0"), (CX + 62, CY + 28, 14, "#D5C8F8")):
        part(R, R.mask(np.array([(x - 6, y), (x - 5, y - h * 0.7), (x, y - h), (x + 5, y - h * 0.7), (x + 6, y)], float)), c, Mat(puff=3, spec=0.6, shin=40, line_w=1.0))

def ile_decouvertes(R):
    socle(R, ovale(CX, CY, 124, 82, seed=5, bosses=((5.5, 0.08),)), seed=5, herbe=("#9ED27B", "#6FB85A"))
    # le volcan
    vx, vy = CX - 10, CY + 4
    cone = R.mask(catmull([(vx - 70, vy + 10), (vx - 40, vy - 40), (vx - 18, vy - 78), (vx + 18, vy - 78), (vx + 40, vy - 40), (vx + 70, vy + 10)], n=8))
    def alb(x, y, base):
        t = np.clip((y - (vy - 80)) / 90, 0, 1)[..., None]
        return mix(L("#B3784A"), L("#8A5A36"), t)
    part(R, cone, "#9B6B43", Mat(puff=14, profile="pillow", line_w=1.5, tex=1.0), albedo=alb,
         decal=[(R.mask(catmull([(vx - 18, vy - 78), (vx + 18, vy - 78), (vx + 12, vy - 62), (vx + 4, vy - 70), (vx - 4, vy - 58), (vx - 12, vy - 70)], n=5)), "#FF7F50", 1.5)])
    part(R, R.mask(ellipse(vx, vy - 78, 18, 5)), "#E8504A", Mat(puff=3, line_w=1.0), shadow=False)
    pied = m_clip(m_wobble(R.mask(rrect(vx - 80, vy - 14, 160, 30, 6)), 2.0 * R.S, 12 * R.S, seed=55), cone)
    R.paint(pied, "#86C468", Mat(puff=4, profile="pillow", line=False, tex=0.9))
    for (px, py, pr) in ((vx + 4, vy - 96, 8), (vx + 14, vy - 110, 10), (vx + 28, vy - 122, 12)):
        R.paint(R.mask(circle(px, py, pr)), "#FFFFFF", Mat(puff=pr * 0.8, line=False, tex=0.3), haze=0.15)
    palmier(R, CX + 78, CY + 4, 0.44, lean=-12, seed=51)
    palmier(R, CX + 100, CY + 30, 0.34, lean=-8, seed=52)
    D.bush(R, CX - 92, CY + 30, 0.42, "#56A84A", seed=53)
    # loupe d'Octave
    lx, ly = CX + 52, CY + 40
    part(R, baton(R, (lx + 8, ly + 8), (lx + 22, ly + 22), 5.0), "#8B5A35", Mat(puff=2, line_w=0.9))
    part(R, R.mask(circle(lx, ly, 12)), "#5B6475", Mat(puff=3, spec=0.4, line_w=1.0))
    part(R, R.mask(circle(lx, ly, 8.5)), "#CFF1F4", Mat(puff=3, spec=0.8, shin=40, line_w=0.8), shadow=False)

def ile_atelier(R):
    # palette de peintre : son trou devient un petit lagon
    pts = ovale(CX, CY, 108, 70, seed=6, bosses=((2.9, -0.16),))
    lagon = ovale(CX - 64, CY - 6, 16, 11, n=10, seed=61)
    socle(R, pts, seed=6, herbe=("#A9D883", "#86C66A"), lagon=lagon)
    for (x, y, c) in ((CX - 20, CY + 32, "#E85D9A"), (CX + 10, CY + 40, "#3D8BEA"), (CX + 44, CY + 36, "#34B37A"), (CX + 74, CY + 24, "#FF7F50")):
        part(R, R.mask(ellipse(x, y, 13, 8)), c, Mat(puff=4, profile="pillow", line_w=1.1, tex=0.8))
    # chevalet et sa toile
    ex, ey = CX + 14, CY + 6
    D.ground_shadow(R, ex + 6, ey + 4, 30, 5, 0.25, dx=4, blur=3)
    for (a, b) in (((ex - 24, ey + 6), (ex - 4, ey - 86)), ((ex + 24, ey + 6), (ex + 4, ey - 86)), ((ex, ey + 2), (ex, ey - 60))):
        part(R, baton(R, a, b, 4.0), "#A9703F", Mat(puff=2, line_w=0.9))
    toile = R.mask(rrect(ex - 34, ey - 82, 68, 54, 3))
    part(R, toile, "#FFFDF4", Mat(puff=4, profile="pillow", line_w=1.3, tex=0.6),
         decal=[(R.mask(circle(ex - 14, ey - 60, 11)), "#FFC145", 1.0), (R.mask(ellipse(ex + 12, ey - 46, 16, 9)), "#3D8BEA", 1.0),
                (R.mask(ellipse(ex + 16, ey - 66, 7, 6)), "#E85D9A", 1.0), (R.mask(ellipse(ex - 16, ey - 40, 12, 5)), "#34B37A", 1.0)])
    part(R, R.mask(rrect(ex - 38, ey - 30, 76, 5, 2)), "#A9703F", Mat(puff=2, line_w=0.9))
    # grand pinceau planté
    bx, by = CX + 78, CY - 2
    part(R, baton(R, (bx, by), (bx + 6, by - 62), 5.0), "#C98B55", Mat(puff=2, line_w=0.9))
    part(R, R.mask(rrect(bx + 1, by - 74, 11, 12, 2)), "#C9CED8", Mat(puff=2, line_w=0.9))
    part(R, R.mask(catmull([(bx + 1, by - 74), (bx + 12, by - 74), (bx + 10, by - 92), (bx + 6, by - 98), (bx + 2, by - 90)], n=6)), "#E85D9A", Mat(puff=3, line_w=1.0))
    D.round_tree(R, CX - 30, CY - 24, 0.42, seed=62, fruit="#FFC145")

def ile_coeur(R):
    # un cœur : deux lobes en haut, la pointe vers la mer
    pts = [(CX, CY - 34), (CX + 30, CY - 66), (CX + 78, CY - 70), (CX + 108, CY - 38), (CX + 100, CY + 4), (CX + 60, CY + 40), (CX, CY + 76),
           (CX - 60, CY + 40), (CX - 100, CY + 4), (CX - 108, CY - 38), (CX - 78, CY - 70), (CX - 30, CY - 66)]
    socle(R, pts, seed=7, herbe=("#AAD985", "#86C66A"))
    # arbre en fleurs roses
    tx, ty = CX - 6, CY + 4
    D.ground_shadow(R, tx + 6, ty + 2, 30, 6, 0.25, dx=4, blur=3)
    part(R, R.mask(ribbon(stroke_pts([(tx, ty), (tx - 2, ty - 30), (tx + 2, ty - 50)], n=6), np.linspace(9, 6, 13))), "#8B5A35", Mat(puff=3, line_w=1.0))
    blobs = [circle(tx + bx, ty - 62 + by, br) for bx, by, br in ((0, 0, 30), (-28, 8, 22), (28, 8, 22), (-14, -18, 22), (16, -20, 22))]
    cime = m_fuse(m_union(*[R.mask(b) for b in blobs]), 3 * R.S)
    fleurs = m_union(*[R.mask(circle(tx + dx, ty - 62 + dy, 3.4)) for dx, dy in ((-20, -8), (8, -26), (22, 4), (-6, 12), (-30, 14), (30, -8), (0, -6), (14, 18))])
    part(R, cime, "#F6A3C0", Mat(puff=14, line_w=1.4, tex=0.8), decal=[(fleurs, "#FFFFFF", 0.5)])
    # banc et cœurs-fleurs
    part(R, R.mask(rrect(CX + 34, CY + 12, 40, 7, 3)), "#C98B55", Mat(puff=3, profile="pillow", line_w=1.0))
    for x in (CX + 38, CX + 70):
        part(R, R.mask(rrect(x - 2, CY + 18, 4, 10, 1.5)), "#8B5A35", Mat(puff=2, line_w=0.8))
    for (x, y) in ((CX - 60, CY + 24), (CX - 44, CY + 36), (CX + 50, CY - 30)):
        coeur = m_union(R.mask(circle(x - 4, y - 3, 5)), R.mask(circle(x + 4, y - 3, 5)), R.mask(np.array([(x - 9, y - 1), (x + 9, y - 1), (x, y + 9)], float)))
        part(R, coeur, "#E85D9A", Mat(puff=3, line_w=0.9), shadow=False)

ILES = {"nombres": ile_nombres, "mots": ile_mots, "port": ile_port, "enigmes": ile_enigmes, "decouvertes": ile_decouvertes, "atelier": ile_atelier, "coeur": ile_coeur}

# ---------------------------------------------------------------------------- soleil et lune de la séance
ASTRE = (100, 100)

def soleil(R):
    D.sun(R, 50, 50, 22)

def lune(R):
    m = m_sub(R.mask(circle(50, 50, 26)), R.mask(circle(64, 40, 22)))
    part(R, m, "#FFD978", Mat(puff=6, profile="pillow", line_w=1.3, tex=0.8))

ELEMENTS = {
    "carte/mer": dict(cadre=MER, dessin=mer, opaque=True, qualite=78),
    **{f"carte/ile-{k}": dict(cadre=CADRE_ILE, dessin=f, points={"centre": (CX, CY)}) for k, f in ILES.items()},
    "carte/soleil": dict(cadre=ASTRE, dessin=soleil),
    "carte/lune": dict(cadre=ASTRE, dessin=lune),
}
