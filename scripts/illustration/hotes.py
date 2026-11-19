"""Les hôtes des îles, redessinés pour Archipel 2 en gardant les signes de la v1 :
Mona (baleine bleue, ventre clair, jet d'eau), Rico (raton laveur gris, masque sombre) et Bip (robot violet, écran,
antenne jaune), Octave (pieuvre verte à lunettes), Kiki (caméléon vert au béret rose), Pico (hérisson brun, joues roses).
Même méthode que Plume et Basile : formes souples fusionnées, lumière d'en haut à gauche, finition de l'atelier.
Chaque fonction prend (R, x, y, s, expr, salut) ; (x, y) est le milieu du ventre, expr une clé de EXPRESSIONS."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, eye_parts, mouth, brow, leaf, EXPRESSIONS, INK, paupiere, larme

def _bras(R, epaule, coude, main, ep, couleur, main_couleur, main_r):
    """Bras souple (ruban) terminé par une main ronde."""
    m = R.mask(ribbon(stroke_pts([epaule, coude, main], n=10), np.linspace(ep, ep * 0.85, 21)))
    part(R, m, couleur, Mat(puff=8, line_w=1.6, spec=0.04))
    part(R, R.mask(circle(main[0], main[1], main_r)), main_couleur, Mat(puff=6, line_w=1.5))

def _queue_courbe(R, pts, w0, w1, couleur, mat, decal=None):
    line = stroke_pts(pts, n=12)
    n = len(line)
    wd = np.linspace(w0, w1, n) * np.sqrt(np.clip(np.linspace(1, 0, n) * 12, 0.25, 1))
    m = R.mask(ribbon(line, wd))
    m = m_union(m, R.mask(circle(line[-1][0], line[-1][1], w1 * 0.9)))
    part(R, m, couleur, mat, decal=decal)
    return m, line, wd

# ============================================================================ Mona, la baleine (île des Mots)
MONA, MONA_D, MONA_DD, MONA_V = "#4E7FB0", "#3C679A", "#2D4F7A", "#CFE3F5"
JET, JET_L = "#5BB8E6", "#BFE8F7"

def mona(R, x, y, s=1.0, expr="content", salut=False):
    """Mona de profil, tournée vers la droite, (x, y) = milieu du corps. Repère local ~ 280 x 200."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-150, -112))
    peau = Mat(puff=30, spec=0.18, shin=18, rim=0.35, line_w=1.8)
    # nageoire caudale : un grand V qui se relève
    queue = R.mask(catmull([(64, 122), (44, 106), (24, 80), (10, 52, "c"), (36, 64), (54, 84), (54, 50, "c"), (68, 78), (78, 112)]))
    part(R, queue, MONA_D, Mat(puff=9, spec=0.12, line_w=1.6))
    # nageoire pectorale arrière (derrière le corps)
    part(R, R.mask(catmull([(150, 158), (138, 180), (130, 194, "c"), (150, 184), (166, 162)])), MONA_DD, Mat(puff=5, line_w=1.3))
    # corps en haricot : grosse tête ronde à droite, le corps s'affine vers la queue
    corps = catmull([(184, 38), (230, 46), (262, 78), (270, 116), (256, 150), (220, 170), (168, 178), (120, 172), (86, 156), (64, 134),
                     (58, 118), (66, 102), (92, 84), (122, 62), (152, 44)])
    cm = R.mask(corps)
    ventre = R.mask(catmull([(270, 120), (258, 154), (220, 174), (168, 182), (120, 176), (102, 166), (146, 162), (196, 156), (238, 140)]))
    plis = [R.line_mask([(244 - k * 4, 150 + k * 6), (204 - k * 7, 164 + k * 4), (150 - k * 9, 168 + k * 3)], 1.3) for k in range(3)]
    dos = R.mask(catmull([(150, 50), (196, 40), (236, 54), (200, 58), (150, 70), (100, 90)]))
    part(R, cm, MONA, peau, decal=[(ventre, MONA_V, 4.0), (m_clip(m_union(*plis), ventre), "#A9C8E6", 0.4), (dos, MONA_D, 7.0)])
    # nageoire pectorale avant : contre le flanc ; pour saluer, elle se lève
    if salut:
        fin = R.mask(catmull([(172, 140), (156, 112), (148, 90, "c"), (166, 104), (186, 132)]))
    else:
        fin = R.mask(catmull([(170, 144), (152, 168), (142, 184, "c"), (166, 174), (188, 146)]))
    part(R, fin, MONA_D, Mat(puff=7, spec=0.1, line_w=1.4))
    # jet d'eau : une colonne qui s'ouvre en deux gerbes, et des gouttes
    col = R.mask(ribbon(stroke_pts([(190, 42), (189, 26), (190, 12)], n=8), np.linspace(6.5, 5.0, 17)))
    gerbes = []
    for sg in (-1, 1):
        c = stroke_pts([(190, 12), (190 + sg * 14, 2), (190 + sg * 28, 6), (190 + sg * 34, 20)], n=10)
        gerbes.append(R.mask(ribbon(c, np.linspace(5.5, 3.2, len(c)))))
        gerbes.append(R.mask(circle(190 + sg * 34, 21, 4.2)))
    jm = m_fuse(m_union(col, *gerbes), 1.4 * R.k)
    part(R, jm, JET, Mat(puff=5, spec=0.35, shin=30, line_w=1.2, rim=0.3), decal=[(R.mask(ellipse(187, 22, 2.4, 12, -4)), JET_L, 1.6)])
    for gx, gy, gr in ((146, 18, 3.2), (234, 18, 3.0), (152, 34, 2.4), (228, 34, 2.4)):
        part(R, R.mask(circle(gx, gy, gr)), JET, Mat(puff=2, spec=0.4, line_w=0.9), shadow=False)
    # joue, œil, sourire
    R.paint(R.mask(ellipse(236, 122, 11, 6.5, -8)), "#E58FA8", Mat(flat=True))
    eye_parts(R, 218, 96, E["oeil"], r=12.5, look=(1.8, 0.6), lid=MONA)
    dy, tilt = E["sourcil"]
    brow(R, 218, 76 + dy, 15, tilt, MONA_DD, 2.6)
    b = E["bouche"]
    if b == "triste":
        flat(R, R.line_mask([(268, 132), (256, 127), (240, 131), (228, 140)], 2.6), MONA_DD)
    elif b == "moue":
        flat(R, R.line_mask([(266, 131), (254, 129), (242, 133)], 2.4), MONA_DD)
    elif b == "peur":
        flat(R, R.line_mask([(268, 128), (260, 133), (252, 128), (244, 133), (236, 128)], 2.4), MONA_DD)
    elif b == "fache":
        om = R.mask(catmull([(268, 128), (256, 124), (238, 130), (232, 142), (252, 140)], n=8))
        part(R, om, "#7A2E3A", Mat(puff=3, line_w=1.1, tex=0.3), shadow=False, decal=[(m_clip(R.mask(rrect(232, 122, 40, 7, 1)), om), "#FFFFFF", 0.6)])
    elif b == "sourire":
        flat(R, R.line_mask([(268, 124), (258, 136), (240, 141), (226, 137)], 2.4), MONA_DD)
    elif b == "petit":
        flat(R, R.line_mask([(266, 128), (254, 136), (240, 137)], 2.4), MONA_DD)
    elif b == "pensif":
        flat(R, R.line_mask([(266, 134), (254, 135), (240, 132)], 2.4), MONA_DD)
    elif b == "rond":
        part(R, R.mask(ellipse(252, 138, 6.5, 7.5)), "#7A2E3A", Mat(puff=3, line_w=1.0), shadow=False)
    else:
        om = R.mask(catmull([(269, 122), (258, 148), (238, 150), (228, 138), (248, 134)]))
        part(R, om, "#7A2E3A", Mat(puff=3, line_w=1.1, tex=0.3), shadow=False, decal=[(R.mask(ellipse(246, 147, 10, 5)), "#F2899A", 1.2)])
    R.pop()

# ============================================================================ Rico, le raton laveur (île des Énigmes)
RICO, RICO_D, RICO_DD, RICO_L, MASQUE = "#9AA0B4", "#767C92", "#4A4F63", "#F4F1EC", "#3A3F52"
FOULARD, FOULARD_D = "#8C6BE0", "#6B4FC4"

def rico(R, x, y, s=1.0, expr="content", salut=False):
    """Rico debout, de face, (x, y) = milieu du ventre. Repère local ~ 220 x 270."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-110, -170))
    fur = Mat(puff=22, spec=0.05, shin=10, rim=0.25, line_w=1.8)
    # queue touffue à anneaux, derrière, qui remonte à droite
    qline = stroke_pts([(140, 236), (182, 230), (208, 204), (212, 168), (198, 140)], n=12)
    n = len(qline)
    qw = 15 + 6 * np.sin(np.linspace(0.2, 2.6, n))
    qw[-3:] = qw[-3:] * np.array([0.9, 0.75, 0.5])
    qm = m_union(R.mask(ribbon(qline, qw)), R.mask(circle(qline[-1][0], qline[-1][1], qw[-1] * 1.4)))
    anneaux = []
    for f in (0.3, 0.5, 0.7, 0.92):
        i = int(f * (n - 1))
        p = qline[i]
        d = qline[min(n - 1, i + 1)] - qline[max(0, i - 1)]
        d = d / (np.linalg.norm(d) + 1e-9)
        nn = np.array([-d[1], d[0]])
        anneaux.append(R.mask(ribbon(np.array([p - nn * 30, p + nn * 30]), np.array([5.5, 5.5]))))
    part(R, qm, RICO, Mat(puff=12, line_w=1.6, spec=0.04), decal=[(m_clip(m_union(*anneaux), qm), RICO_DD, 1.0)])
    # pieds
    for fx in (84, 136):
        part(R, R.mask(ellipse(fx, 262, 21, 10)), RICO_DD, Mat(puff=7, line_w=1.5))
    # oreilles pointues (derrière la tête)
    for pts, inner in (([(58, 70), (60, 30, "c"), (96, 50)], [(66, 64), (66, 40, "c"), (86, 52)]),
                       ([(162, 70), (160, 30, "c"), (124, 50)], [(154, 64), (154, 40, "c"), (134, 52)])):
        em = R.mask(catmull(pts))
        part(R, em, RICO_D, Mat(puff=6, line_w=1.4), decal=[(R.mask(catmull(inner)), RICO_DD, 1.5)])
    # corps en poire + tête large aux joues touffues
    body = catmull([(110, 122), (148, 136), (162, 178), (158, 222), (138, 252), (110, 258), (82, 252), (62, 222), (58, 178), (72, 136)])
    head = catmull([(110, 44), (152, 54), (170, 84), (178, 104, "c"), (160, 112), (150, 128), (110, 138), (70, 128), (60, 112), (42, 104, "c"), (50, 84), (68, 54)])
    sil = m_fuse(m_union(R.mask(body), R.mask(head)), 5 * R.k)
    ventre = R.mask(ellipse(110, 204, 34, 42))
    part(R, sil, RICO, fur, decal=[(ventre, RICO_L, 6.0)])
    # visage : museau clair, bande sombre du front, masque, sourcils blancs
    part(R, R.mask(ellipse(110, 116, 30, 21)), RICO_L, Mat(puff=10, line_w=1.4, spec=0.04))
    flat(R, R.mask(catmull([(104, 50), (116, 50), (114, 92), (110, 96, "c"), (106, 92)])), RICO_D)
    masque = R.mask(catmull([(52, 96), (66, 80), (94, 80), (110, 90), (126, 80), (154, 80), (168, 96), (154, 108), (128, 104), (110, 98),
                             (92, 104), (66, 108)]))
    part(R, masque, MASQUE, Mat(puff=6, line_w=1.2, tex=0.6), shadow=False)
    dy, tilt = E["sourcil"]
    for cx, sg in ((88, 1), (132, -1)):
        pts = [(cx - 14, 74 + dy + tilt * sg), (cx, 68 + dy), (cx + 14, 74 + dy - tilt * sg)]
        part(R, R.line_mask(pts, 6.5), RICO_L, Mat(puff=3, line=False, tex=0.4), shadow=False)
    eye_parts(R, 90, 92, E["oeil"], r=10.5, look=(1.0, 1.0), lid=MASQUE)
    eye_parts(R, 130, 92, E["oeil"], r=10.5, look=(1.0, 1.0), lid=MASQUE)
    nez = R.mask(catmull([(100, 106), (110, 102), (120, 106), (114, 114), (110, 116, "c"), (106, 114)]))
    part(R, nez, "#2E3242", Mat(puff=4, spec=0.6, shin=40, line_w=1.0), shadow=False)
    for cx in (84, 136):
        R.paint(R.mask(ellipse(cx, 120, 7, 4.5)), "#EDA0AC", Mat(flat=True))
    mouth(R, 110, 123, 18, E["bouche"], ink="#3A3F52")
    # foulard violet à pois, noué au cou
    tour = R.mask(ribbon(stroke_pts([(70, 134), (110, 146), (150, 134)], n=10), np.full(21, 7.0)))
    pointe = R.mask(catmull([(86, 140), (134, 140), (112, 170, "c")]))
    pois = m_union(*[R.mask(circle(px, py, 2.6)) for px, py in ((100, 148), (118, 150), (110, 160), (126, 144), (94, 140))])
    fm = m_union(tour, pointe)
    part(R, fm, FOULARD, Mat(puff=6, profile="pillow", line_w=1.4, spec=0.05), decal=[(m_clip(pois, fm), "#E6DEFA", 0.0)])
    part(R, R.mask(ellipse(110, 142, 9, 7)), FOULARD_D, Mat(puff=4, profile="pillow", line_w=1.2), shadow=False)
    # bras : mains sombres de raton laveur
    if salut:
        _bras(R, (156, 152), (180, 128), (190, 100), 10, RICO, RICO_DD, 12)
    else:
        _bras(R, (156, 152), (168, 178), (162, 202), 10, RICO, RICO_DD, 11)
    _bras(R, (64, 152), (52, 178), (58, 202), 10, RICO, RICO_DD, 11)
    R.pop()

# ============================================================================ Bip, le robot de Rico
BIP, BIP_D, ECRAN, ECRAN_D = "#8C6BE0", "#5B3FB8", "#E6DEFA", "#C9BDF3"

def bip(R, x, y, s=1.0, expr="content", salut=False):
    """Bip de face, (x, y) = milieu du corps. Repère local ~ 160 x 200."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-80, -112))
    peinture = Mat(puff=16, spec=0.35, shin=28, rim=0.3, line_w=1.8, profile="pillow")
    # roues
    for wx in (46, 114):
        part(R, R.mask(circle(wx, 178, 17)), "#3A4258", Mat(puff=8, spec=0.3, shin=30, line_w=1.4),
             decal=[(R.mask(circle(wx, 178, 7)), "#9AA3B5", 1.0)])
    # antenne
    part(R, R.mask(rrect(77, 28, 6, 34, 3)), "#5B6475", Mat(puff=3, spec=0.4, line_w=1.0))
    part(R, R.mask(circle(80, 22, 9)), "#FFC145", Mat(puff=8, spec=0.5, shin=30, line_w=1.3), decal=[(R.mask(circle(77, 19, 3)), "#FFE7A6", 1.0)])
    # bras
    if salut:
        _bras(R, (130, 112), (150, 92), (154, 66), 7, BIP_D, "#5B6475", 9)
    else:
        _bras(R, (130, 112), (148, 128), (150, 150), 7, BIP_D, "#5B6475", 9)
    _bras(R, (30, 112), (12, 128), (10, 150), 7, BIP_D, "#5B6475", 9)
    # corps : un bloc arrondi, l'écran en haut, trois boutons en bas
    cm = R.mask(rrect(20, 56, 120, 112, 30))
    boutons = m_union(*[R.mask(circle(bx, 150, 5.5)) for bx in (64, 80, 96)])
    part(R, cm, BIP, peinture, decal=[(R.mask(rrect(30, 64, 100, 20, 10)), "#A88BEA", 6.0)])
    for bx, bc in ((62, "#FFC145"), (80, "#E85D9A"), (98, "#1FA9B5")):
        part(R, R.mask(circle(bx, 150, 5.5)), bc, Mat(puff=4, spec=0.5, shin=30, line_w=1.0), shadow=False)
    ecran = R.mask(rrect(34, 72, 92, 54, 17))
    R.paint(ecran, ECRAN, Mat(puff=6, profile="pillow", line_w=1.6, spec=0.05, tex=0.3),
            decal=[(R.mask(rrect(34, 110, 92, 20, 10)), ECRAN_D, 6.0)])
    # visage sur l'écran : yeux et bouche lumineux
    o = E["oeil"]
    for ex in (62, 98):
        if o in ("rieur", "doux"):
            flat(R, R.line_mask([(ex - 8, 100), (ex, 91), (ex + 8, 100)], 4.0), INK)
        else:
            ry = {"surpris": 10, "haut": 7}.get(o, 8)
            ey = 92 if o == "haut" else 97
            em = R.mask(ellipse(ex, ey, 6.5 if o != "surpris" else 8.5, ry))
            R.paint(em, INK, Mat(puff=3, line=False, tex=0.1))
            flat(R, R.mask(circle(ex + 2, ey - 3, 2.2)), "#FFFFFF")
    for cx in (44, 116):
        R.paint(R.mask(ellipse(cx, 112, 6, 3.5)), "#F0A6C6", Mat(flat=True))
    b = E["bouche"]
    if b == "rond":
        R.paint(R.mask(ellipse(80, 116, 4.5, 5)), INK, Mat(puff=2, line=False))
    elif b == "grand":
        R.paint(R.mask(catmull([(70, 110), (90, 110), (86, 120), (80, 122, "c"), (74, 120)])), INK, Mat(puff=2, line=False))
    elif b == "pensif":
        flat(R, R.line_mask([(72, 116), (80, 116), (88, 113)], 2.6), INK)
    else:
        w = 9 if b == "petit" else 12
        flat(R, R.line_mask([(80 - w, 112), (80, 118), (80 + w, 112)], 2.8), INK)
    R.pop()

# ============================================================================ Octave, la pieuvre (île des Découvertes)
OCT, OCT_D, OCT_DD, OCT_L, VENTOUSE = "#34B37A", "#26895B", "#1B6A45", "#7FD3A6", "#C9EFD9"

def _tentacule(R, pts, w0, couleur, mat, ventouses=True):
    line = stroke_pts(pts, n=12)
    n = len(line)
    wd = np.linspace(w0, w0 * 0.32, n)
    m = m_union(R.mask(ribbon(line, wd)), R.mask(circle(line[-1][0], line[-1][1], wd[-1] * 1.1)))
    dec = []
    if ventouses:
        vs = []
        for i in range(n // 3, n - 2, 3):
            p = line[i]
            d = line[i + 1] - line[i - 1]
            d = d / (np.linalg.norm(d) + 1e-9)
            nn = np.array([-d[1], d[0]])
            q = p - nn * wd[i] * 0.45
            vs.append(R.mask(circle(q[0], q[1], max(1.4, wd[i] * 0.32))))
        if vs:
            dec = [(m_clip(m_union(*vs), m), VENTOUSE, 0.0)]
    part(R, m, couleur, mat, decal=dec)

def octave(R, x, y, s=1.0, expr="content", salut=False):
    """Octave de face, (x, y) = milieu de la tête. Repère local ~ 240 x 260."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-120, -110))
    peau = Mat(puff=26, spec=0.25, shin=18, rim=0.35, line_w=1.8)
    tm = Mat(puff=8, spec=0.18, shin=18, rim=0.3, line_w=1.5)
    # tentacules de derrière, plus sombres
    for pts in (([(88, 160), (54, 176), (26, 170), (18, 150), (30, 142)]), ([(152, 160), (186, 176), (214, 170), (222, 150), (210, 142)])):
        _tentacule(R, pts, 13, OCT_D, tm, ventouses=False)
    # tentacules de devant : quatre qui s'enroulent vers l'extérieur
    devant = [[(96, 160), (84, 196), (60, 226), (40, 228), (34, 212), (46, 206)],
              [(112, 166), (108, 206), (100, 238), (86, 250), (74, 242), (82, 232)],
              [(128, 166), (132, 206), (140, 238), (154, 250), (166, 242), (158, 232)]]
    if salut:
        devant.append([(150, 156), (180, 140), (200, 108), (204, 82), (194, 72), (186, 82)])
    else:
        devant.append([(144, 160), (156, 196), (180, 226), (200, 228), (206, 212), (194, 206)])
    for pts in devant:
        _tentacule(R, pts, 14, OCT, tm)
    # tête en bulbe, taches claires
    tete = None
    taches = m_union(*[R.mask(ellipse(tx, ty, rx, ry, rot)) for tx, ty, rx, ry, rot in
                       ((90, 40, 9, 6, -20), (152, 38, 7, 5, 20), (176, 76, 5, 7, 0), (64, 78, 5, 7, 0), (120, 26, 6, 4, 0))])
    tm_ = m_fuse(m_union(R.mask(ellipse(120, 84, 70, 74)), R.mask(ellipse(120, 136, 60, 30))), 6 * R.k)
    part(R, tm_, OCT, peau, decal=[(m_clip(taches, tm_), OCT_L, 2.0), (R.mask(ellipse(120, 150, 52, 18)), OCT_D, 8.0)])
    # joues, yeux derrière les lunettes, sourire
    for cx in (80, 160):
        R.paint(R.mask(ellipse(cx, 124, 10, 6)), "#F09AAA", Mat(flat=True))
    dy, tilt = E["sourcil"]
    brow(R, 94, 70 + dy, 16, tilt, OCT_DD, 3.0)
    brow(R, 146, 70 + dy, -16, tilt, OCT_DD, 3.0)
    for ex in (96, 144):
        lentille = R.mask(circle(ex, 98, 19))
        R.paint(lentille, "#DDF4FF", Mat(puff=5, line=False, spec=0.2, tex=0.2))
        eye_parts(R, ex, 99, E["oeil"], r=11, look=(1.2, 0.8), lid="#DDF4FF")
        flat(R, m_clip(R.line_mask([(ex - 11, 88), (ex - 5, 83), (ex + 2, 82)], 2.6), lentille), "#FFFFFF")
        flat(R, R.line_mask([(ex + 19 * math.cos(t), 98 + 19 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 40)], 4.2, closed=True), INK)
    flat(R, R.line_mask([(115, 96), (120, 93), (125, 96)], 4.0), INK)
    flat(R, R.line_mask([(77, 94), (56, 88)], 3.6, smooth_it=False), INK)
    flat(R, R.line_mask([(163, 94), (184, 88)], 3.6, smooth_it=False), INK)
    mouth(R, 120, 132, 24, E["bouche"], ink=OCT_DD)
    R.pop()

# ============================================================================ Kiki, le caméléon (île de l'Atelier)
KIKI, KIKI_D, KIKI_L, ANNEAU = "#7CC36B", "#4E9A44", "#B6E3A2", "#3E7F35"
BERET, BERET_D, PEINTURE = "#E85D9A", "#C2477F", "#FFC145"

def kiki(R, x, y, s=1.0, expr="content", salut=False):
    """Kiki de profil sur sa branche, tournée vers la droite, (x, y) = milieu du corps. Repère local ~ 270 x 230."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-136, -140))
    peau = Mat(puff=20, spec=0.15, shin=16, rim=0.3, line_w=1.7)
    # branche
    br = R.mask(ribbon(stroke_pts([(36, 214), (130, 210), (236, 206)], n=10), np.full(21, 7.5)))
    part(R, br, "#9A6A44", Mat(puff=5, line_w=1.4, tex=1.0))
    part(R, R.mask(leaf((60, 212), (40, 192), 12, -0.1)), "#5FAE4C", Mat(puff=3, line_w=1.0))
    # queue enroulée en spirale
    spir = [(84, 166), (58, 176), (36, 168), (28, 146), (38, 128), (56, 126), (64, 140), (56, 150), (46, 146)]
    _queue_courbe(R, spir, 13, 4.5, KIKI_D, Mat(puff=8, line_w=1.5, spec=0.08))
    # patte de derrière (côté caché)
    part(R, R.mask(ribbon(stroke_pts([(112, 178), (106, 196), (114, 208)], n=8), np.linspace(8, 6, 17))), KIKI_D, Mat(puff=5, line_w=1.3))
    # corps + grosse tête casquée
    corps = catmull([(76, 130), (110, 108), (156, 102), (186, 112), (196, 140), (180, 170), (138, 182), (98, 178), (72, 158)])
    tete = catmull([(170, 108), (184, 72), (214, 58), (248, 70), (266, 100), (262, 128), (240, 146), (206, 152), (180, 140)])
    casque = catmull([(176, 100), (178, 64), (194, 40, "c"), (208, 56), (204, 80)])
    sil = m_fuse(m_union(R.mask(corps), R.mask(tete), R.mask(casque)), 4 * R.k)
    ventre = R.mask(catmull([(92, 170), (140, 182), (186, 168), (230, 148), (262, 128), (244, 152), (190, 178), (140, 192), (96, 184)]))
    crete = m_union(*[R.mask(circle(cx, cy, 5.5)) for cx, cy in ((92, 120), (110, 110), (130, 104), (150, 102))])
    taches = m_union(*[R.mask(ellipse(tx, ty, 6, 4, -15)) for tx, ty in ((118, 134), (146, 126), (138, 154), (164, 146))])
    part(R, m_union(sil, crete), KIKI, peau, decal=[(ventre, KIKI_L, 4.0), (taches, KIKI_D, 2.0)])
    # pattes (côté visible)
    for pts in (([(128, 176), (124, 196), (132, 208)]), ([(176, 164) if not salut else (180, 162), (182, 190), (190, 208)])):
        if salut and pts[0][0] > 150:
            continue
        part(R, R.mask(ribbon(stroke_pts(pts, n=8), np.linspace(9, 7, 17))), KIKI, Mat(puff=6, line_w=1.4))
        fx, fy = pts[-1]
        part(R, R.mask(circle(fx - 4, fy + 2, 5)), KIKI_D, Mat(puff=3, line_w=1.0), shadow=False)
        part(R, R.mask(circle(fx + 5, fy + 2, 5)), KIKI_D, Mat(puff=3, line_w=1.0), shadow=False)
    if salut:  # la patte de devant se lève pour dire bonjour
        part(R, R.mask(ribbon(stroke_pts([(180, 160), (204, 166), (220, 150)], n=8), np.linspace(9, 7, 17))), KIKI, Mat(puff=6, line_w=1.4))
        part(R, R.mask(circle(222, 146, 6.5)), KIKI_D, Mat(puff=3, line_w=1.0), shadow=False)
    # traces de peinture jaune sur la joue (elle peint !)
    for tx, ty, tr in ((244, 132, 3.6), (252, 124, 2.8), (148, 112, 3.2)):
        part(R, R.mask(circle(tx, ty, tr)), PEINTURE, Mat(puff=2, line_w=0.9, spec=0.3), shadow=False)
    # grand œil en tourelle : anneau, blanc, pupille
    tour = R.mask(circle(222, 98, 22))
    part(R, tour, KIKI, Mat(puff=11, line_w=1.6, spec=0.15), decal=[(m_sub(tour, R.mask(circle(222, 98, 15.5))), ANNEAU, 1.5)], shadow=False)
    o = E["oeil"]
    if o in ("rieur", "ferme"):
        flat(R, R.line_mask([(212, 100), (222, 90), (232, 100)], 3.6), INK)
    else:
        rr = 12.5 if o in ("surpris", "peur") else 11.5
        sclera = R.mask(circle(223, 97, rr))
        R.paint(sclera, "#FFFFFF", Mat(puff=4, line_w=1.0, tex=0.2))
        lx, ly = {"haut": (2, -5), "doux": (2, -2), "surpris": (1, 0), "peur": (1, 0), "triste": (1, 4), "las": (1, 4)}.get(o, (3, 1))
        R.paint(m_clip(R.mask(circle(223 + lx, 97 + ly, 4.2 if o == "peur" else 5.4 if o == "surpris" else 6.6)), sclera), INK, Mat(puff=2, line=False))
        flat(R, R.mask(circle(225.5 + lx, 94.5 + ly, 2.1)), "#FFFFFF")
        if o in ("triste", "fache", "las"):
            paupiere(R, sclera, 223, 97, rr, {"triste": 0.3, "fache": 0.42, "las": 0.52}[o], KIKI)
            if o == "triste":
                larme(R, 230, 116, 1.0)
        if o == "doux":
            lidm = m_clip(R.mask(catmull([(206, 116), (210, 103), (223, 98), (236, 103), (240, 116)])), sclera)
            R.paint(lidm, KIKI, Mat(puff=3, line=False))
            flat(R, R.line_mask([(213, 104), (223, 99), (233, 104)], 1.7), INK)
    # bouche le long de la mâchoire
    b = E["bouche"]
    if b == "grand":
        om = R.mask(catmull([(264, 118), (252, 142), (232, 144), (224, 134), (244, 130)]))
        part(R, om, "#7A2E3A", Mat(puff=3, line_w=1.1, tex=0.3), shadow=False, decal=[(R.mask(ellipse(242, 142, 8, 4)), "#F2899A", 1.0)])
    elif b == "rond":
        part(R, R.mask(ellipse(252, 132, 5.5, 6.5)), "#7A2E3A", Mat(puff=2, line_w=1.0), shadow=False)
    elif b == "pensif":
        flat(R, R.line_mask([(264, 126), (246, 130), (230, 126)], 2.2), ANNEAU)
    elif b == "triste":
        flat(R, R.line_mask([(264, 130), (250, 127), (236, 131), (224, 139)], 2.6), ANNEAU)
    elif b == "moue":
        flat(R, R.line_mask([(264, 130), (252, 129), (238, 132)], 2.4), ANNEAU)
    elif b == "peur":
        flat(R, R.line_mask([(264, 128), (256, 133), (248, 128), (240, 133), (232, 128)], 2.4), ANNEAU)
    elif b == "fache":
        om = R.mask(catmull([(264, 128), (250, 124), (232, 130), (226, 142), (248, 140)], n=8))
        part(R, om, "#7A2E3A", Mat(puff=3, line_w=1.1, tex=0.3), shadow=False, decal=[(m_clip(R.mask(rrect(226, 122, 40, 7, 1)), om), "#FFFFFF", 0.6)])
    else:
        flat(R, R.line_mask([(264, 122), (252, 134), (234, 136), (222, 130)] if b == "sourire" else [(264, 124), (250, 132), (234, 131)], 2.2), ANNEAU)
    R.paint(R.mask(ellipse(240, 120, 7, 4.5, -10)), "#EE97B5", Mat(flat=True))
    # béret rose posé de travers, avec sa queue
    beret = R.mask(catmull([(180, 58), (196, 40), (226, 34), (250, 46), (244, 60), (210, 64)]))
    part(R, beret, BERET, Mat(puff=8, profile="pillow", line_w=1.5, spec=0.06, tex=0.9), decal=[(R.mask(ellipse(214, 60, 30, 5, -6)), BERET_D, 2.0)])
    part(R, R.mask(circle(214, 33, 4.5)), BERET_D, Mat(puff=3, line_w=1.0), shadow=False)
    if expr in ("triste", "colere", "peur", "decu"):  # un sourcil sous le béret, au-dessus de la tourelle : l'émotion se lit
        dy, tilt = E["sourcil"]
        brow(R, 224, 70 + dy * 0.6, 22, tilt, ANNEAU, 3.0)
    R.pop()

# ============================================================================ Pico, le hérisson (île du Cœur)
PIC, PIC_D, PIC_L, VISAGE, VISAGE_D = "#8A5A3B", "#6B4129", "#A8754E", "#F1D7B8", "#E2BE96"

def pico(R, x, y, s=1.0, expr="content", salut=False):
    """Pico debout, de face, (x, y) = milieu du ventre. Repère local ~ 220 x 250."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-110, -160))
    # manteau de piquants : une silhouette dentelée autour de la tête et du dos
    cx, cy = 110, 128
    pts = []
    k = 0
    for a in np.linspace(math.radians(158), math.radians(382), 23):
        rad = (96 if k % 2 == 0 else 74)
        rx, ry = rad * 1.0, rad * 0.98
        p = (cx + math.cos(a) * rx, cy + math.sin(a) * ry)
        pts.append((p[0], p[1], "c") if k % 2 == 0 else p)
        k += 1
    pts += [(cx + 66, cy + 70), (cx, cy + 92), (cx - 66, cy + 70)]
    manteau = R.mask(catmull(pts, n=10))
    traits = []
    for a in np.linspace(math.radians(170), math.radians(370), 14):
        p0 = (cx + math.cos(a) * 52, cy + math.sin(a) * 50)
        p1 = (cx + math.cos(a + 0.05) * 80, cy + math.sin(a + 0.05) * 78)
        traits.append(R.line_mask([p0, p1], 2.2, smooth_it=False))
    part(R, manteau, PIC, Mat(puff=18, spec=0.08, shin=14, rim=0.3, line_w=1.8, tex=1.0),
         decal=[(m_clip(m_union(*traits), manteau), PIC_D, 0.8), (R.mask(ellipse(cx - 30, cy - 50, 34, 18, -25)), PIC_L, 8.0)])
    # pieds
    for fx in (86, 134):
        part(R, R.mask(ellipse(fx, 236, 18, 9)), VISAGE_D, Mat(puff=6, line_w=1.4))
    # visage et ventre crème, oreilles rondes
    for ex in (68, 152):
        part(R, R.mask(circle(ex, 92, 12)), VISAGE_D, Mat(puff=6, line_w=1.4), decal=[(R.mask(circle(ex, 93, 6)), "#F2A7BE", 1.5)])
    face = catmull([(110, 82), (150, 92), (164, 124), (156, 154), (138, 172), (154, 196), (150, 226), (110, 236), (70, 226), (66, 196),
                    (82, 172), (64, 154), (56, 124), (70, 92)])
    part(R, R.mask(face), VISAGE, Mat(puff=16, spec=0.05, line_w=1.6), decal=[(R.mask(ellipse(110, 206, 30, 26)), "#F8E6CF", 6.0)])
    # museau en avant, truffe
    part(R, R.mask(ellipse(110, 140, 17, 12)), "#F8E6CF", Mat(puff=6, line_w=1.2), shadow=False)
    part(R, R.mask(ellipse(110, 134, 7, 5.5)), "#2E2A2A", Mat(puff=3, spec=0.6, shin=40, line_w=0.9), shadow=False)
    for chx in (78, 142):
        R.paint(R.mask(ellipse(chx, 140, 10, 6)), "#F49AB8", Mat(flat=True))
    eye_parts(R, 90, 118, E["oeil"], r=10, look=(1.0, 1.0), lid=VISAGE)
    eye_parts(R, 130, 118, E["oeil"], r=10, look=(1.0, 1.0), lid=VISAGE)
    dy, tilt = E["sourcil"]
    brow(R, 90, 101 + dy, 13, tilt, PIC_D, 2.4)
    brow(R, 130, 101 + dy, -13, tilt, PIC_D, 2.4)
    mouth(R, 110, 150, 15, E["bouche"], ink="#6B4129")
    # bras
    if salut:
        _bras(R, (146, 176), (168, 156), (176, 130), 8, VISAGE_D, VISAGE_D, 9)
    else:
        _bras(R, (146, 178), (156, 196), (150, 212), 8, VISAGE_D, VISAGE_D, 9)
    _bras(R, (74, 178), (64, 196), (70, 212), 8, VISAGE_D, VISAGE_D, 9)
    R.pop()

HOTES = {"basile": None, "mona": mona, "rico": rico, "bip": bip, "octave": octave, "kiki": kiki, "pico": pico}
