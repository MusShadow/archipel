"""Portraits des personnages (livraison 3) : la tête et le haut des épaules, cadrés pareil pour tous dans un carré.
L'appli les pose dans un médaillon rond (les médaillons des activités), et le théâtre de Pico en fait ses visages
d'émotions : joie, tristesse, colère, peur, surprise, déception (plus « content » pour les médaillons)."""
import math
from moteur import *
from personnages import part, flat, INK
import personnages as P
import hotes as H

CADRE = (160, 160)
CENTRE = (80, 84)  # où tombe le milieu de la tête
RAYON = 58  # rayon de la tête dans le cadre
# nom : dessin(R, x, y, s, expr), ancre du repère local, milieu et rayon de la tête dans le repère local
PERSOS = {
    "basile": (lambda R, x, y, s, e: P.basile(R, x, y, s, wave=False, expr=e), (110, 160), (110, 96), 60),
    "mona": (lambda R, x, y, s, e: H.mona(R, x, y, s, expr=e), (150, 112), (236, 108), 62),
    "rico": (lambda R, x, y, s, e: H.rico(R, x, y, s, expr=e), (110, 170), (110, 100), 62),
    "octave": (lambda R, x, y, s, e: H.octave(R, x, y, s, expr=e), (120, 110), (120, 104), 66),
    "kiki": (lambda R, x, y, s, e: H.kiki(R, x, y, s, expr=e), (136, 140), (220, 98), 58),
    "pico": (lambda R, x, y, s, e: H.pico(R, x, y, s, expr=e), (110, 160), (110, 126), 70),
    "plume": (lambda R, x, y, s, e: P.plume(R, x, y, s, pose="vol", expr=e), (160, 150), (218, 112), 58),
}
# émotion du théâtre → expression de l'atelier
EMOTIONS = {"content": "content", "joie": "rieur", "triste": "triste", "colere": "colere", "peur": "peur", "surprise": "surpris", "decu": "decu"}

# Visages du théâtre : cadrés serré sur ce qui change d'une émotion à l'autre (yeux, sourcils, bouche, larmes), pour
# qu'à la taille de la carte les émotions se distinguent (relecture de la livraison 3). Milieu de cette zone dans le
# repère local du personnage, et grossissement par rapport au portrait des médaillons.
SERRE = {
    "basile": ((112, 92), 1.38), "mona": ((236, 108), 1.42), "rico": ((106, 90), 1.42), "octave": ((120, 104), 1.5),
    "kiki": ((240, 100), 1.36), "pico": ((112, 122), 1.85), "plume": ((236, 92), 1.32),
}

def portrait(R, nom, expr):
    fn, (ax, ay), (hx, hy), r = PERSOS[nom]
    s = RAYON / r
    if expr != "content":
        (hx, hy), z = SERRE[nom]
        s *= z
    fn(R, CENTRE[0] - s * (hx - ax), CENTRE[1] - s * (hy - ay), s, expr)
    if expr != "content":
        signes(R, nom, expr)

# Ceux qui sont de profil (tournés vers la droite) ont l'arrière de la tête à gauche du cadre.
PROFIL = {"mona", "kiki", "plume"}

def goutte(R, x, y, r):
    """Goutte de sueur, pointe en haut."""
    m = R.mask(catmull([(x, y - 1.7 * r, "c"), (x + r, y - 0.1 * r), (x + 0.7 * r, y + 0.75 * r), (x, y + r), (x - 0.7 * r, y + 0.75 * r), (x - r, y - 0.1 * r)], n=8))
    part(R, m, "#8FD3F4", Mat(puff=3, spec=0.6, shin=40, line_w=1.1), shadow=False, decal=[(R.mask(ellipse(x - 0.3 * r, y - 0.1 * r, 0.22 * r, 0.4 * r)), "#FFFFFF", 0.5)])

def traits(R, x, y, sens):
    """Trois traits qui jaillissent (la surprise), vers la gauche (sens -1) ou la droite (sens 1)."""
    for a in (-70, -35, 0):
        t = math.radians(a)
        dx, dy = sens * math.cos(t), math.sin(t)
        flat(R, R.line_mask([(x + dx * 4, y + dy * 4), (x + dx * 18, y + dy * 18)], 3.8, smooth_it=False), INK)

def fumee(R, x, y, sens):
    """Nuage de fumée qui sort de la tête (la colère) : trois boules qui montent, la plus petite vers l'extérieur."""
    boules = [(x + sens * k * 11, y - k * 9, r) for k, r in enumerate((11, 8.5, 6))]
    m = m_union(*[R.mask(circle(bx, by, r)) for bx, by, r in boules])
    part(R, m, "#E6E2DC", Mat(puff=5, line_w=1.4, tex=0.3), shadow=False, decal=[(m_union(*[R.mask(circle(bx - r * 0.3, by - r * 0.3, r * 0.45)) for bx, by, r in boules]), "#FFFFFF", 1.5)])

def signes(R, nom, expr):
    cx, cy = CENTRE
    if expr == "peur":
        goutte(R, cx - 40 if nom in PROFIL else cx + 44, cy - 42, 8)
    elif expr == "surpris":
        traits(R, cx - 50, cy - 40, -1)
        traits(R, cx + 50, cy - 40, 1)
    elif expr == "colere":
        fumee(R, cx - 46, cy - 36, -1)
        fumee(R, cx + 46, cy - 36, 1)

ELEMENTS = {f"visages/{nom}-{emo}": dict(cadre=CADRE, dessin=(lambda R, nom=nom, e=e: portrait(R, nom, e)), qualite=88)
            for nom in PERSOS for emo, e in EMOTIONS.items()}


# ---------------------------------------------------------------------------- lisibilité
# Écart entre deux émotions d'un même personnage, à la taille de la carte du théâtre (140 px) : part des pixels du
# médaillon qui changent nettement (distance RVB > 64), sur un fond crème. Les tests de l'appli (tests/livraison3.test.ts)
# exigent un écart suffisant pour chaque paire qu'un même exercice peut montrer.
TAILLE_CARTE, SEUIL_RVB = 140, 64

def ecarts(dossier):
    import itertools, numpy as np
    from PIL import Image, ImageDraw
    m = Image.new("L", (TAILLE_CARTE, TAILLE_CARTE), 0)
    ImageDraw.Draw(m).ellipse((0, 0, TAILLE_CARTE - 1, TAILLE_CARTE - 1), fill=255)
    masque = np.asarray(m) > 0
    def carte(f):
        im = Image.open(f).convert("RGBA").resize((TAILLE_CARTE, TAILLE_CARTE), Image.LANCZOS)
        fond = Image.new("RGBA", im.size, (255, 247, 234, 255))
        fond.alpha_composite(im)
        return np.asarray(fond.convert("RGB")).astype(float)
    emos = [e for e in EMOTIONS if e != "content"]
    out = {"taille": TAILLE_CARTE, "seuilRVB": SEUIL_RVB, "octets": {}, "ecarts": {}}
    for nom in PERSOS:
        cartes = {e: carte(dossier / f"visages/{nom}-{e}.webp") for e in emos}
        for e in emos:
            out["octets"][f"{nom}-{e}"] = (dossier / f"visages/{nom}-{e}.webp").stat().st_size
        out["ecarts"][nom] = {f"{a}/{b}": round(float(((np.sqrt(((cartes[a] - cartes[b]) ** 2).sum(-1)) > SEUIL_RVB) & masque).sum() / masque.sum() * 100), 2)
                              for a, b in itertools.combinations(emos, 2)}
    return out
