"""Objets des jeux de l'île des Énigmes, dessinés pour Archipel 2 (livraison 4), mêmes matières que le marché :
- « Les motifs de Rico » : des perles en bois laqué, cinq formes (rond, carré, triangle, étoile, cœur) en quatre
  couleurs (rouge, bleu, jaune, vert : les couleurs que l'appli nomme), enfilées sur un cordon (dessiné par l'appli) ;
  le plateau en bois du tableau à double entrée, et ses alvéoles ;
- « Le chemin de Bip » : un potager en cases (cadre en planches, terre, carrés d'herbe), les cailloux et l'étoile.
  Bip lui-même est le personnage de l'atelier (personnages/bip-*)."""
import math
import numpy as np
from moteur import *
from personnages import part, flat, leaf, INK
from ile_commun import coeur
import decors as D

def arrondi(pts, r, n=6):
    """Polygone aux coins arrondis : chaque sommet est remplacé par un petit arc (Bézier quadratique)."""
    P = [np.array(p, float) for p in pts]
    out = []
    for i, p in enumerate(P):
        a, b = P[i - 1], P[(i + 1) % len(P)]
        da, db = (a - p) / np.linalg.norm(a - p), (b - p) / np.linalg.norm(b - p)
        q0, q1 = p + da * r, p + db * r
        for t in np.linspace(0, 1, n):
            out.append(tuple((1 - t) ** 2 * q0 + 2 * (1 - t) * t * p + t ** 2 * q1))
    return np.array(out)

# ---------------------------------------------------------------------------- les perles de Rico
PERLE = (120, 120)
COULEURS = {"rouge": "#E5483B", "bleu": "#3D8BEA", "jaune": "#FFC145", "vert": "#34B37A"}
FORMES = ["cercle", "carre", "triangle", "etoile", "coeur"]

def forme_perle(forme, cx=60, cy=60):
    if forme == "cercle":
        return ellipse(cx, cy, 41, 40)
    if forme == "carre":
        return rrect(cx - 37, cy - 37, 74, 74, 15)
    if forme == "triangle":
        return arrondi([(cx, cy - 42), (cx + 46, cy + 36), (cx - 46, cy + 36)], 13)
    if forme == "etoile":
        pts = [(cx + (47 if k % 2 == 0 else 21) * math.cos(math.radians(-90 + 36 * k)),
                cy + 3 + (47 if k % 2 == 0 else 21) * math.sin(math.radians(-90 + 36 * k))) for k in range(10)]
        return arrondi(pts, 6)
    if forme == "coeur":
        return coeur(cx, cy + 2, 43)
    raise ValueError(forme)

def perle(R, forme, couleur):
    c = COULEURS[couleur]
    m = R.mask(forme_perle(forme))
    # le fil du bois, sous la laque : de fines ondes plus foncées
    fil = m_union(*[R.line_mask([(10 + 4 * math.sin(y * 0.7), y), (60, y + 3 * math.sin(y)), (110, y - 2)], 1.1) for y in range(22, 104, 9)])
    lumiere = R.mask(ellipse(44, 40, 15, 9, -30)) if forme != "triangle" else R.mask(ellipse(50, 44, 11, 7, -30))
    part(R, m, c, Mat(puff=13, spec=0.45, shin=34, line_w=1.5, tex=0.5, rim=0.2),
         decal=[(m_clip(fil, m), tweak(L(c), dl=-0.05), 0.6), (m_clip(lumiere, m), "#FFFFFF", 2.6)])

# ---------------------------------------------------------------------------- le plateau et ses alvéoles (tableau)
PLATEAU, ALVEOLE = (300, 300), (100, 100)
BOIS, BOIS_D, BOIS_L = "#D9A26E", "#B57C4A", "#EBC08E"

def plateau(R):
    W, H = PLATEAU
    R.cast(R.mask(rrect(10, 14, W - 20, H - 20, 26)), 0, 5, 8, 0.24)
    m = R.mask(rrect(6, 6, W - 12, H - 14, 26))
    veines = m_union(*[R.line_mask([(10, y), (W / 2, y + 5 * math.sin(y)), (W - 10, y - 3)], 1.2) for y in range(20, H, 15)])
    part(R, m, BOIS, Mat(puff=10, profile="pillow", line_w=1.6, tex=1.0), decal=[(m_clip(veines, m), BOIS_D, 0.6)])

def alveole(R):
    W, H = ALVEOLE
    m = R.mask(rrect(6, 6, W - 12, H - 12, 16))
    def alb(x, y, base):
        t = np.clip((y - 6) / (H - 12), 0, 1)[..., None]
        return mix(L("#8E5F37"), L("#C48A55"), t ** 0.8)   # creusée : sombre en haut (l'ombre du bord), claire en bas
    part(R, m, "#A9703F", Mat(puff=3, profile="pillow", line_w=1.3, tex=0.9), albedo=alb, shadow=False)
    flat(R, m_clip(R.line_mask([(16, H - 9), (W - 16, H - 9)], 2.0, smooth_it=False), m), "#E2B07A")

# ---------------------------------------------------------------------------- le potager de Bip
CADRE, CADRE_BORD = (300, 240), 22   # cadre en planches posé en neuf morceaux (border-image) : l'épaisseur des planches
CASE = (100, 100)

def potager(R):
    W, H, B = CADRE[0], CADRE[1], CADRE_BORD
    m = R.mask(rrect(0, 0, W, H, 16))       # remplit le cadre : l'image est découpée en neuf sans marge
    def alb(x, y, base):
        n = R.crop(R.mottle, (int(x[0, 0] * R.S), int(y[0, 0] * R.S), int(x[0, 0] * R.S) + x.shape[1], int(y[0, 0] * R.S) + x.shape[0]))
        return L("#8B5E3C") * (1 + 0.16 * (n[..., None] - 0.5))
    mottes = m_union(*[R.mask(circle(x, y, 1.6)) for x, y in zip(np.random.default_rng(3).uniform(B, W - B, 90), np.random.default_rng(4).uniform(B, H - B, 90))])
    part(R, m, "#8B5E3C", Mat(puff=2, profile="pillow", line=False, tex=0.8), albedo=alb, decal=[(mottes, "#6E4529", 0.3)], shadow=False)
    # les planches du bord, avec leurs veines dans le sens du bois
    for (x, y, w, h, sens) in ((0, 0, W, B, "h"), (0, H - B, W, B, "h"), (0, 0, B, H, "v"), (W - B, 0, B, H, "v")):
        pl = R.mask(rrect(x, y, w, h, 9))
        if sens == "h":
            v = m_union(*[R.line_mask([(x + 6, yy), (x + w / 2, yy + 1.5), (x + w - 6, yy)], 1.0) for yy in (y + 7, y + 14)])
        else:
            v = m_union(*[R.line_mask([(xx, y + 6), (xx + 1.5, y + h / 2), (xx, y + h - 6)], 1.0) for xx in (x + 7, x + 14)])
        part(R, pl, "#C98B55", Mat(puff=6, profile="pillow", line_w=1.4, tex=1.0), decal=[(m_clip(v, pl), "#9C6A3F", 0.5)], shadow=False)
    for (x, y) in ((11, 11), (W - 11, 11), (11, H - 11), (W - 11, H - 11)):
        part(R, R.mask(circle(x, y, 4)), "#8E8A84", Mat(puff=2, spec=0.4, line_w=0.9), shadow=False)

def herbe(R, variante):
    W, H = CASE
    m = R.mask(rrect(3, 3, W - 6, H - 6, 12))
    def alb(x, y, base):
        t = np.clip((y - 3) / (H - 6), 0, 1)[..., None]
        return mix(L("#9BD27A"), L("#78BD5C"), t)
    r = np.random.default_rng(10 + variante)
    brins = m_union(*[R.line_mask([(x, y), (x + r.uniform(-2, 2), y - r.uniform(5, 8))], 1.4, smooth_it=False)
                      for x, y in zip(r.uniform(10, W - 10, 26), r.uniform(16, H - 8, 26))])
    part(R, m, "#88C86A", Mat(puff=5, profile="pillow", line_w=1.3, tex=1.0), albedo=alb, decal=[(m_clip(brins, m), "#5FA347", 0.4)], shadow=False)
    if variante == 2:   # deux pâquerettes
        for x, y in ((28, 70), (74, 30)):
            D.flower(R, x, y, 6.5, "#FFFFFF")
    if variante == 3:   # un trèfle
        for a in (-90, 30, 150):
            fx, fy = 70 + 6 * math.cos(math.radians(a)), 70 + 6 * math.sin(math.radians(a))
            part(R, R.mask(circle(fx, fy, 6)), "#4E9E37", Mat(puff=2, line_w=0.9), shadow=False)

def caillou(R, variante):
    W, H = CASE
    pts = [(14, 70), (20, 44), (40, 28), (64, 30), (84, 46), (88, 70), (70, 82), (34, 82)] if variante == 1 else \
          [(18, 74), (16, 52), (34, 34), (58, 26), (80, 38), (86, 62), (74, 80), (40, 84)]
    D.ground_shadow(R, 54, 82, 40, 8, 0.28, dx=4, blur=4)
    m = R.mask(catmull(pts, n=10))
    mousse = R.mask(catmull([(26, 50), (36, 38), (52, 34), (46, 44), (34, 52)], n=8)) if variante == 1 else R.mask(ellipse(62, 38, 12, 5, -15))
    part(R, m, "#A3A9B4", Mat(puff=14, line_w=1.5, tex=1.0, spec=0.08),
         decal=[(R.mask(ellipse(40, 46, 14, 7, -20)), "#C9CED6", 4.0), (m_clip(mousse, m), "#86B86A", 1.2)])

def etoile(R):
    W, H = CASE
    D.ground_shadow(R, 52, 88, 30, 6, 0.24, dx=3, blur=4)
    pts = [(50 + (44 if k % 2 == 0 else 19) * math.cos(math.radians(-90 + 36 * k)),
            52 + (44 if k % 2 == 0 else 19) * math.sin(math.radians(-90 + 36 * k))) for k in range(10)]
    m = R.mask(arrondi(pts, 6))
    part(R, m, "#FFC93C", Mat(puff=12, spec=0.55, shin=40, line_w=1.6, rim=0.25),
         decal=[(R.mask(ellipse(40, 38, 10, 6, -30)), "#FFFFFF", 2.0), (R.mask(ellipse(58, 64, 14, 10)), "#F2A81E", 4.0)])
    # deux petites étincelles
    for x, y, s in ((88, 18, 7), (12, 30, 5)):
        etin = R.mask(np.array([(x, y - s), (x + s * 0.25, y - s * 0.25), (x + s, y), (x + s * 0.25, y + s * 0.25), (x, y + s), (x - s * 0.25, y + s * 0.25), (x - s, y), (x - s * 0.25, y - s * 0.25)], float))
        flat(R, etin, "#FFD966")

ELEMENTS = {
    **{f"activites/perle-{f}-{c}": dict(cadre=PERLE, dessin=(lambda R, f=f, c=c: perle(R, f, c))) for f in FORMES for c in COULEURS},
    "activites/plateau-perles": dict(cadre=PLATEAU, dessin=plateau),
    "activites/alveole": dict(cadre=ALVEOLE, dessin=alveole),
    "activites/potager": dict(cadre=CADRE, dessin=potager, infos={"bord": CADRE_BORD}),
    **{f"activites/herbe-{v}": dict(cadre=CASE, dessin=(lambda R, v=v: herbe(R, v))) for v in (1, 2, 3)},
    **{f"activites/caillou-{v}": dict(cadre=CASE, dessin=(lambda R, v=v: caillou(R, v))) for v in (1, 2)},
    "activites/etoile": dict(cadre=CASE, dessin=etoile),
}
