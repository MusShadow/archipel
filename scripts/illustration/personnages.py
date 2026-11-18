"""Personnages d'Archipel 2 : Plume (colibri) et Basile (castor), dessinés en formes organiques."""
import numpy as np
from moteur import *

INK = "#273043"
_wob = [0]

def part(R, m, color, mat=None, shadow=True, decal=None, **kw):
    """Peint une pièce avec l'ombre et le traitement propres à la finition."""
    mat = mat or Mat()
    st = R.style
    k = R.k / R.S
    if st == "papier":
        mat = Mat(**{**mat, "puff": min(mat["puff"], 2.4), "profile": "pillow", "tex": 1.0})
        _wob[0] += 1
        m = m_wobble(m, 0.55 * R.S, 7 * R.S, seed=_wob[0])
        if shadow and mat["shadow"]:
            R.cast(m, 1.4 * k, 3.0 * k, 2.2 * k, 0.34)
        R.paint(m, color, mat, **kw)
        for dm, dc, _soft in (decal or []):
            piece = m_wobble(m_clip(dm, m), 0.5 * R.S, 6 * R.S, seed=_wob[0] + 7)
            R.cast(piece, 0.8 * k, 1.8 * k, 1.4 * k, 0.26, clip=m)
            R.paint(piece, dc, Mat(**{**mat, "shadow": False}))
        return m
    if shadow and mat["shadow"]:
        if st == "volume":
            R.cast(m, 1.2 * k, 3.5 * k, 5.0 * k, 0.24)
            R.cast(m, 0.4 * k, 1.0 * k, 1.4 * k, 0.16)
        else:
            R.cast(m, 0.8 * k, 2.2 * k, 2.4 * k, 0.20)
    R.paint(m, color, mat, decal=decal, **kw)
    return m

def flat(R, m, color, **kw):
    R.paint(m, color, Mat(flat=True, line=False), **kw)

def leaf(base, tip, w, bend=0.0, tip_round=0.35, base_w=None):
    """Forme de plume / feuille : base -> pointe, largeur w, courbure bend (en fraction de longueur)."""
    b, t = np.array(base, float), np.array(tip, float)
    d = t - b
    ln = np.linalg.norm(d)
    u = d / ln
    n = np.array([-u[1], u[0]])
    bw = w * 0.55 if base_w is None else base_w
    def at(f, side, width):
        off = n * (bend * ln * 4 * f * (1 - f))
        return b + d * f + off + n * side * width
    pts = [at(0.0, 1, bw / 2), at(0.35, 1, w / 2), at(0.72, 1, w * 0.45),
           tuple(t + n * (bend * 0) + u * w * tip_round * 0.2),
           at(0.72, -1, w * 0.45), at(0.35, -1, w / 2), at(0.0, -1, bw / 2)]
    return catmull([tuple(p) for p in pts])

# ============================================================================ Plume
TURQ, TURQ_D, TURQ_DD, TURQ_L, TURQ_W = "#1FA9B5", "#14848F", "#0F6870", "#C4F0EA", "#3CC3CD"
CORAL, CORAL_D, CORAL_L, RASP = "#FF7F50", "#E2603A", "#FFA27E", "#E85D9A"

def plume_wing(R, rot, color, cover, tipc, scale=1.0, mat=None):
    """Aile de colibri : quatre rémiges en éventail + couvertures, pivot à l'épaule (160, 148)."""
    mat = mat or Mat(puff=6, spec=0.12, shin=20, rim=0.3, line_w=1.3)
    R.push(Affine.R(rot, 160, 148) @ Affine.S(scale, scale, 160, 148))
    feathers = [((158, 150), (90, 26), 17, -0.04), ((160, 150), (106, 34), 16, -0.03),
                ((162, 150), (122, 46), 15, -0.02), ((164, 150), (138, 62), 14, -0.01)]
    for base, tip, w, bend in feathers:
        fm = R.mask(leaf(base, tip, w, bend))
        tipm = R.mask(ellipse(tip[0] + (base[0] - tip[0]) * 0.12, tip[1] + (base[1] - tip[1]) * 0.12, w * 0.9, w * 1.3,
                              np.degrees(np.arctan2(tip[1] - base[1], tip[0] - base[0])) + 90))
        part(R, fm, color, mat, decal=[(tipm, tipc, 3.0)])
    cov = R.mask(catmull([(174, 160), (156, 158), (144, 142), (138, 122), (140, 108, "c"), (152, 120), (164, 132), (176, 148)]))
    part(R, cov, cover, Mat(**{**mat, "puff": 9}))
    R.pop()

def plume(R, x, y, s=1.0, pose="vol", flip=False, eye=None, wing_phase=0, only=None, expr=None):
    """Plume dans un repère local (~300 x 260), posé en (x, y) = centre du corps.
    pose : vol, salut, montre, pense, fete ; expr (facultatif) : content, rieur, surpris, pensif, doux."""
    tf = Affine.T(x, y) @ Affine.S(-s if flip else s, s) @ Affine.T(-160, -150)
    R.push(tf)
    if expr:
        eye = EXPRESSIONS[expr]["oeil"]
    eye = eye or {"vol": "ouvert", "salut": "ouvert", "montre": "ouvert", "pense": "haut", "fete": "rieur"}[pose]
    bec_ouvert = pose == "fete" or expr in ("rieur", "surpris")
    back_rot, front_rot = {"vol": (-8, 0), "salut": (34, -14), "montre": (-8, 128), "pense": (-10, 130), "fete": (-30, 14)}[pose]
    front_scale = {"pense": 0.6, "montre": 0.92}.get(pose, 1.0)
    if wing_phase:
        back_rot -= 22 * wing_phase
        front_rot -= 24 * wing_phase

    # ---------------- aile arrière
    R.mute = only not in (None, "aile_ar")
    plume_wing(R, back_rot, "#138893", "#17949F", TURQ_DD)
    R.mute = only not in (None, "corps")

    # ---------------- queue : trois rectrices en éventail, bout plus sombre
    tail = Mat(puff=6, spec=0.1, rim=0.2, line_w=1.3)
    for base, tip, w, bend in (((112, 204), (36, 212), 16, 0.03), ((114, 208), (46, 240), 16, 0.02), ((118, 210), (72, 260), 15, 0.0)):
        fm = R.mask(leaf(base, tip, w, bend))
        tipm = R.mask(circle(tip[0] + (base[0] - tip[0]) * 0.1, tip[1] + (base[1] - tip[1]) * 0.1, w * 0.95))
        part(R, fm, TURQ_D, tail, decal=[(tipm, TURQ_DD, 3.0)])

    # ---------------- corps + tête fusionnés
    body = catmull([(212, 146), (202, 180), (178, 202), (146, 214), (116, 214), (102, 204), (110, 190),
                    (132, 168), (156, 146), (178, 124)])
    head = circle(200, 110, 37)
    sil = m_fuse(m_union(R.mask(body), R.mask(head)), 4.5 * R.k)
    belly = R.mask(catmull([(222, 128), (214, 166), (190, 196), (152, 212), (120, 214), (154, 200), (182, 178), (198, 152), (206, 132)]))
    cheek = R.mask(ellipse(209, 133, 10, 6.4, -10))
    deco = [(belly, TURQ_L, 5.0), (cheek, "#F07AA8" if R.style == "papier" else RASP, 2.4)]
    body_mat = Mat(puff=26, spec=0.22, shin=16, rim=0.35, line_w=1.8)
    part(R, sil, TURQ, body_mat, decal=deco)

    # ---------------- bec
    bc = stroke_pts([(226, 110), (260, 108), (300, 106)], n=12)
    bw = np.linspace(5.6, 1.8, len(bc)); bw[-2:] = [1.5, 0.9]
    if bec_ouvert:
        lc = stroke_pts([(226, 117), (252, 121), (284, 124)], n=12)
        lower = R.mask(ribbon(lc, np.linspace(3.8, 1.0, len(lc))))
        part(R, lower, "#3A4258", Mat(puff=2.5, spec=0.5, shin=40, line_w=1.0), shadow=False)
    part(R, R.mask(ribbon(bc, bw)), INK, Mat(puff=3, spec=0.7, shin=50, rim=0.2, line_w=1.0), shadow=False)

    # ---------------- œil
    eye_parts(R, 213, 103, eye, r=14, lid=TURQ)

    # ---------------- écharpe : tour de cou épais + deux pans larges qui flottent, franges au bout
    smat = Mat(puff=5, spec=0.06, rim=0.25, line_w=1.5, profile="pillow")
    if pose in ("vol", "fete", "salut"):
        pans = [([(176, 138), (152, 126), (124, 134), (98, 124), (74, 130)], 16.0, CORAL),
                ([(174, 146), (154, 158), (130, 166), (106, 158)], 14.0, CORAL_D)]
    else:
        pans = [([(178, 142), (170, 166), (178, 190), (172, 206)], 15.0, CORAL)]
    for c, w, col in pans:
        line = stroke_pts(c, n=12)
        n = len(line)
        wd = w * (0.62 + 0.38 * np.abs(np.cos(np.linspace(0.2, 2.6, n))))   # le pan se tord une fois
        wd[:2] = [w * 0.55, w * 0.75]
        pm = R.mask(ribbon(line, wd / 2))
        end = line[-1]
        d = line[-1] - line[-3]
        d /= np.linalg.norm(d) + 1e-9
        nn = np.array([-d[1], d[0]])
        fr = [R.mask(rrect(0, 0, 1, 1, 0)) for _ in range(0)]
        fringes = []
        fringes.append(R.mask(circle(end[0], end[1], wd[-1] / 2)))
        part(R, m_union(pm, *fringes), col, smat)
    wc = stroke_pts([(172, 132), (184, 148), (204, 154), (226, 146)], n=12)
    hl = stroke_pts([(176, 136), (186, 146), (204, 150), (224, 143)], n=12)
    wrap = R.mask(ribbon(wc, np.full(len(wc), 6.2)))
    part(R, wrap, CORAL, smat, decal=[(R.mask(ribbon(hl, np.full(len(hl), 1.6))), CORAL_L, 1.5)])
    part(R, R.mask(ellipse(176, 139, 10, 9, 20)), CORAL_D, smat)

    # ---------------- aile avant
    R.mute = only not in (None, "aile_av")
    plume_wing(R, front_rot, "#20B1BD", "#2BBAC5", "#12808A", scale=front_scale)
    R.mute = False
    R.pop()


def eye_parts(R, ex, ey, kind="ouvert", r=12.5, look=(2.0, 0.5), lid="#1FA9B5"):
    """Œil : ouvert, haut (regarde en l'air), rieur (arc), surpris (grand rond), doux (paupière mi-close), ferme.
    lid : couleur de la paupière (celle du visage) pour « doux »."""
    if kind == "rieur":
        arc = R.line_mask([(ex - r * 0.75, ey + 3), (ex, ey - r * 0.55), (ex + r * 0.75, ey + 3)], max(2.2, r * 0.32))
        flat(R, arc, INK)
        return
    if kind == "ferme":
        arc = R.line_mask([(ex - r * 0.75, ey - 1), (ex, ey + r * 0.38), (ex + r * 0.75, ey - 1)], max(2.0, r * 0.28))
        flat(R, arc, INK)
        return
    rr = r * (1.1 if kind == "surpris" else 1.0)
    sclera = R.mask(ellipse(ex, ey, rr * 0.9, rr))
    lid_shade = R.mask(ellipse(ex - 1, ey - rr * 0.95, rr * 1.25, rr * 0.72))
    R.paint(sclera, "#FFFFFF", Mat(puff=5, spec=0.0, line_w=1.1, tex=0.2, rim=0.0),
            decal=[(m_clip(lid_shade, sclera), "#D4E2EC", 2.5)])
    lx, ly = look
    pr = 0.62
    if kind == "haut":
        lx, ly = 1.5, -r * 0.32
    elif kind == "surpris":
        lx, ly, pr = lx * 0.4, ly * 0.4, 0.46
    elif kind == "doux":
        lx, ly = lx * 0.5, -r * 0.08
    pupil = R.mask(ellipse(ex + lx, ey + ly, rr * pr, rr * (pr + 0.06)))
    R.paint(m_clip(pupil, sclera), INK, Mat(puff=4, spec=0.0, line=False, tex=0.1),
            decal=[(R.mask(ellipse(ex + lx, ey + ly + rr * 0.28, rr * 0.5, rr * 0.32)), "#40507A", 3.0)])
    flat(R, m_clip(R.mask(circle(ex + lx + rr * 0.24, ey + ly - rr * 0.27, rr * 0.24)), sclera), "#FFFFFF")
    flat(R, m_clip(R.mask(circle(ex + lx - rr * 0.2, ey + ly + rr * 0.3, rr * 0.1)), sclera), "#FFFFFF")
    if kind == "doux":
        # œil qui sourit : la paupière du bas remonte en arc, la joue pousse
        lidm = m_clip(R.mask(catmull([(ex - rr * 1.3, ey + rr * 1.5), (ex - rr * 1.05, ey + rr * 0.5), (ex, ey + rr * 0.1),
                                      (ex + rr * 1.05, ey + rr * 0.5), (ex + rr * 1.3, ey + rr * 1.5)])), m_grow(sclera, 0.6 * R.S))
        R.paint(lidm, lid, Mat(puff=4, line=False, tex=0.5))
        edge = R.line_mask([(ex - rr * 0.86, ey + rr * 0.52), (ex, ey + rr * 0.12), (ex + rr * 0.86, ey + rr * 0.52)], max(1.5, rr * 0.14))
        flat(R, edge, INK)


# ---------------------------------------------------------------------------- bouche et sourcils
def mouth(R, x, y, w, kind="sourire", ink="#4A2C1C", inner="#7A2E3A", tongue="#F2899A", lw=None):
    """Bouche : sourire, grand (ouverte, joie), rond (surprise), petit (sourire doux), pensif (moue de côté)."""
    lw = lw or max(1.6, w * 0.085)
    if kind == "sourire":
        flat(R, R.line_mask([(x - w / 2, y - w * 0.06), (x - w * 0.22, y + w * 0.2), (x + w * 0.22, y + w * 0.2), (x + w / 2, y - w * 0.06)], lw), ink)
    elif kind == "petit":
        flat(R, R.line_mask([(x - w * 0.3, y), (x, y + w * 0.14), (x + w * 0.3, y)], lw), ink)
    elif kind == "pensif":
        flat(R, R.line_mask([(x - w * 0.28, y + w * 0.06), (x + w * 0.05, y + w * 0.04), (x + w * 0.3, y - w * 0.08)], lw), ink)
    elif kind == "rond":
        m = R.mask(ellipse(x, y + w * 0.08, w * 0.17, w * 0.21))
        R.paint(m, inner, Mat(puff=3, line_w=1.0, tex=0.3), decal=[(R.mask(ellipse(x, y + w * 0.2, w * 0.1, w * 0.07)), tongue, 1.0)])
    elif kind == "grand":
        m = R.mask(catmull([(x - w / 2, y - w * 0.04), (x, y - w * 0.01), (x + w / 2, y - w * 0.04), (x + w * 0.3, y + w * 0.3), (x, y + w * 0.42), (x - w * 0.3, y + w * 0.3)]))
        R.paint(m, inner, Mat(puff=3, line_w=1.1, tex=0.3), decal=[(R.mask(ellipse(x, y + w * 0.36, w * 0.24, w * 0.14)), tongue, 1.5)])

def brow(R, x, y, w, tilt=0.0, color=INK, width=2.6):
    """Sourcil : petit trait courbe ; tilt > 0 relève le bout intérieur (x croissant vers le centre si w < 0)."""
    flat(R, R.line_mask([(x - w / 2, y + tilt), (x, y - abs(w) * 0.12), (x + w / 2, y - tilt)], width), color)

# Expressions communes à tous les personnages : yeux, bouche, sourcils (décalage vertical, inclinaison).
EXPRESSIONS = {
    "content": dict(oeil="ouvert", bouche="sourire", sourcil=(0.0, 0.0)),
    "rieur": dict(oeil="rieur", bouche="grand", sourcil=(-2.5, 0.0)),
    "surpris": dict(oeil="surpris", bouche="rond", sourcil=(-6.0, 0.0)),
    "pensif": dict(oeil="haut", bouche="pensif", sourcil=(-1.5, -1.2)),  # sourcils un peu froncés
    "doux": dict(oeil="doux", bouche="petit", sourcil=(0.5, 1.4)),  # bouts intérieurs relevés : bienveillant
}


# ============================================================================ Basile (castor)
FUR, FUR_D, FUR_DD, FUR_L, MUZ = "#A9703F", "#8A5530", "#5E3820", "#D9A877", "#EFD3B0"
APRON, APRON_D = "#3D8BEA", "#2C6CC4"

def basile(R, x, y, s=1.0, wave=True, full=True, arm="avec", expr="content"):
    """Basile de face, (x, y) = milieu du ventre. Repère local ~ 220 x 260. expr : voir EXPRESSIONS."""
    E = EXPRESSIONS[expr]
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-110, -160))
    fur = Mat(puff=22, spec=0.05, shin=10, rim=0.25, line_w=1.8)
    if arm == "seul":
        arm_mat = Mat(puff=8, line_w=1.6, spec=0.04)
        a = R.mask(ribbon(stroke_pts([(156, 150), (178, 128), (190, 100)], n=10), np.linspace(10, 9, 21)))
        part(R, a, FUR, arm_mat)
        part(R, R.mask(circle(192, 94, 13)), FUR_D, Mat(puff=6, line_w=1.5))
        R.pop()
        return
    # queue plate (derrière), quadrillage
    if full:
        tail = R.mask(catmull([(150, 212), (196, 196), (222, 214), (214, 240), (178, 246), (148, 232)]))
        hatch = []
        for i in range(-3, 5):
            hatch.append(R.line_mask([(156 + i * 12, 200), (196 + i * 12, 250)], 1.1, smooth_it=False))
            hatch.append(R.line_mask([(196 + i * 12, 196), (156 + i * 12, 250)], 1.1, smooth_it=False))
        part(R, tail, "#6B4126", Mat(puff=8, line_w=1.5, spec=0.05), decal=[(m_clip(m_union(*hatch), tail), "#553219", 0.0)])
        # pieds
        for fx in (82, 138):
            part(R, R.mask(ellipse(fx, 252, 22, 11)), FUR_D, Mat(puff=8, line_w=1.5))
    # corps en poire + tête : une seule silhouette
    body = catmull([(110, 108), (150, 124), (168, 168), (164, 216), (140, 250), (110, 256), (80, 250), (56, 216), (52, 168), (70, 124)])
    head = circle(110, 92, 50)
    sil = m_fuse(m_union(R.mask(body), R.mask(head)), 5 * R.k)
    belly = R.mask(ellipse(110, 196, 40, 52))
    part(R, sil, FUR, fur, decal=[(belly, FUR_L, 6.0)])
    # oreilles
    for ex, rot in ((70, -20), (150, 20)):
        em = R.mask(ellipse(ex, 52, 13, 12, rot))
        part(R, em, FUR_D, Mat(puff=6, line_w=1.4), decal=[(R.mask(ellipse(ex, 54, 6.5, 6, rot)), "#C98B6A", 1.5)])
    # tablier bleu avec poche
    apron = R.mask(catmull([(74, 150), (146, 150), (156, 196), (150, 244), (110, 252), (70, 244), (64, 196)]))
    part(R, m_clip(apron, sil), APRON, Mat(puff=10, line_w=1.5, profile="pillow", spec=0.04),
         decal=[(R.mask(rrect(92, 196, 36, 24, 6)), APRON_D, 0.0)])
    straps = [R.line_mask([(80, 152), (88, 120)], 4.5, smooth_it=False), R.line_mask([(140, 152), (132, 120)], 4.5, smooth_it=False)]
    part(R, m_clip(m_union(*straps), sil), APRON_D, Mat(puff=3, line_w=1.0), shadow=False)
    # museau, nez, dents
    muz = R.mask(ellipse(110, 110, 30, 21))
    part(R, muz, MUZ, Mat(puff=10, line_w=1.5, spec=0.05))
    if E["bouche"] in ("grand", "rond"):
        # bouche ouverte sous les dents : joie (grande) ou surprise (petit rond)
        if E["bouche"] == "grand":
            om = R.mask(catmull([(94, 118), (110, 116), (126, 118), (122, 134), (110, 140), (98, 134)]))
        else:
            om = R.mask(ellipse(110, 132, 7, 8))
        part(R, om, "#7A2E3A", Mat(puff=3, line_w=1.1, tex=0.3), shadow=False, decal=[(R.mask(ellipse(110, 137, 7, 4)), "#F2899A", 1.2)])
    teeth = R.mask(rrect(100, 121, 20, 18 if E["bouche"] not in ("grand", "rond") else 13, 4))
    part(R, teeth, "#FFFFFF", Mat(puff=3, line_w=1.2, spec=0.2, shin=30), decal=[(R.mask(rrect(109.3, 121, 1.4, 18, 0.5)), "#C9D3DC", 0.0)])
    nose = R.mask(catmull([(98, 100), (110, 96), (122, 100), (116, 110), (110, 112, "c"), (104, 110)]))
    part(R, nose, "#4A2C1C", Mat(puff=4, spec=0.6, shin=40, line_w=1.0), shadow=False)
    if E["bouche"] == "pensif":
        flat(R, R.line_mask([(98, 117), (104, 119), (110, 116), (117, 117), (123, 113)], 1.6), "#4A2C1C")
    else:
        flat(R, R.line_mask([(96, 116), (103, 120), (110, 116), (117, 120), (124, 116)], 1.6), "#4A2C1C")
    # joues et yeux
    for cx in (78, 142):
        R.paint(R.mask(ellipse(cx, 112, 10, 6)), "#E8828C", Mat(flat=True), haze=0.0)
    eye_parts(R, 90, 84, E["oeil"], r=10, look=(1.0, 1.0), lid=FUR)
    eye_parts(R, 130, 84, E["oeil"], r=10, look=(1.0, 1.0), lid=FUR)
    # sourcils discrets
    dy, tilt = E["sourcil"]
    brow(R, 89, 65 + dy, 14, tilt, FUR_DD, 2.4)
    brow(R, 131, 65 + dy, -14, tilt, FUR_DD, 2.4)
    # bras : l'un salue, l'autre repose
    arm_mat = Mat(puff=8, line_w=1.6, spec=0.04)
    if wave and arm == "sans":
        pass
    elif wave:
        am = R.mask(ribbon(stroke_pts([(156, 150), (178, 128), (190, 100)], n=10), np.linspace(10, 9, 21)))
        part(R, am, FUR, arm_mat)
        part(R, R.mask(circle(192, 94, 13)), FUR_D, Mat(puff=6, line_w=1.5))
    else:
        am = R.mask(ribbon(stroke_pts([(156, 150), (168, 176), (162, 200)], n=10), np.linspace(10, 9, 21)))
        part(R, am, FUR, arm_mat)
        part(R, R.mask(circle(160, 204, 12)), FUR_D, Mat(puff=6, line_w=1.5))
    arm2 = R.mask(ribbon(stroke_pts([(64, 150), (52, 176), (58, 200)], n=10), np.linspace(10, 9, 21)))
    part(R, arm2, FUR, arm_mat)
    part(R, R.mask(circle(60, 204, 12)), FUR_D, Mat(puff=6, line_w=1.5))
    R.pop()

# ============================================================================ grenouille
FROG, FROG_D, FROG_L = "#6CC04A", "#4E9E37", "#CDEBA8"

def frog(R, x, y, s=1.0):
    R.push(Affine.T(x, y) @ Affine.S(s) @ Affine.T(-50, -50))
    m = Mat(puff=12, spec=0.25, shin=20, rim=0.3, line_w=1.5)
    for lx in (22, 78):
        part(R, R.mask(ellipse(lx, 74, 16, 9)), FROG_D, Mat(puff=6, line_w=1.3))
    body = catmull([(50, 26), (80, 36), (90, 62), (78, 82), (50, 88), (22, 82), (10, 62), (20, 36)])
    domes = [circle(32, 30, 15), circle(68, 30, 15)]
    sil = m_fuse(m_union(R.mask(body), *[R.mask(d) for d in domes]), 3 * R.k)
    part(R, sil, FROG, m, decal=[(R.mask(ellipse(50, 70, 26, 16)), FROG_L, 4.0)])
    eye_parts(R, 32, 28, "ouvert", r=9, look=(0.8, 0.8))
    eye_parts(R, 68, 28, "ouvert", r=9, look=(0.8, 0.8))
    flat(R, R.line_mask([(30, 54), (50, 62), (70, 54)], 2.2), "#2F5A24")
    for cx in (24, 76):
        R.paint(R.mask(ellipse(cx, 50, 7, 4)), "#F29AA6", Mat(flat=True))
    R.pop()
