"""Écrans d'île d'Archipel 2 : un décor de base, six emplacements, un lieu dessiné à part pour chaque activité.

Un lieu est rendu seul, avec son ombre, puis posé dans son emplacement : ajouter une activité ne demande jamais de
redessiner l'île. Un emplacement libre montre son « remplissage » (buissons, fleurs, arbre), rendu à part lui aussi.
Repère : 1194 x 834 px CSS (iPad Pro 11 en paysage), rendu à l'échelle 2."""
from moteur import *
import decors as D
import personnages as P

W, H = D.W, D.H

# Disposition de chaque île dessinée : emplacements (point au sol du lieu), lieu de chaque activité, pastilles
# (centre de l'étiquette du lieu). Les îles pas encore dessinées utilisent la disposition générique de src/iles.ts.
DISPOSITIONS = {
    "nombres": {
        "emplacements": {"A": (318, 470), "B": (842, 496), "C": (560, 660), "D": (590, 398), "E": (990, 640), "F": (232, 652)},
        "lieux": {"marche": "A", "nenuphars": "B", "partage": "C"},
        "pastilles": {"marche": (318, 612), "nenuphars": (842, 630), "partage": (560, 750)},
        "plume": (726, 330),
        "animes": ["bateau", "bras", "basile-cligne", "grenouille"],  # rendus à part pour bouger seuls (livraison 4)
        # Basile est à son étal (le lieu du marché) : son bras salue, ses yeux clignent ; la grenouille de l'étang saute
        # quand on la touche ; la surprise de l'île : un poisson saute dans l'étang
        "vivant": {"roles": {"basile-cligne": "cligne"}, "pivots": {"bateau": (82, 772), "bras": (357, 466), "grenouille": (646, 540)},
                   "surprise": {"type": "poisson", "point": [884, 548]}},
    },
}

# ---------------------------------------------------------------------------- île des Nombres
def nombres_base(R):
    """Ciel, mer, île, chemin et la végétation qui n'occupe aucun emplacement."""
    D.sky(R)
    for (x, y, s, sd) in ((150, 112, 1.0, 1), (820, 96, 0.72, 2), (1040, 150, 0.85, 3)):
        D.cloud(R, x, y, s, sd)
    D.far_islands(R)
    D.sea(R, None)
    D.island(R)
    D.path(R)
    for (x, y, rx, ry, sd) in ((96, 520, 20, 14, 21), (120, 536, 13, 9, 22), (1120, 560, 18, 12, 23)):
        D.rock(R, x, y, rx, ry, seed=sd)
    D.palm(R, 1078, 500, 1.05, lean=-14, seed=8)
    D.palm(R, 122, 598, 0.92, lean=-10, seed=9)
    for (fx, fy, c) in ((402, 690, "#FF7F50"), (720, 702, "#FFC145"), (520, 560, "#FF7F50"), (700, 470, "#E85D9A")):
        D.flower_stem(R, fx, fy, c, h=14)
    D.rock(R, 860, 666, 14, 10, seed=3)
    D.rock(R, 300, 696, 11, 8, seed=4)
    D.dock_boat(R, part_="ponton")

def nombres_remplissage(R, ident):
    """Ce qui occupe un emplacement libre : il disparaît quand une activité y prend place."""
    if ident == "D":
        D.round_tree(R, 520, 368, 0.95, seed=4, fruit="#E5483F")
        D.bush(R, 600, 396, 0.9, seed=6, flowers="#FF7F50")
        D.bush(R, 676, 386, 0.72, "#56A84A", seed=7)
        D.flower_stem(R, 640, 430, "#FFC145", h=14)
    elif ident == "E":
        D.bush(R, 970, 628, 0.95, seed=10, flowers="#E85D9A")
        D.rock(R, 1018, 652, 15, 10, seed=24)
        D.flower_stem(R, 1040, 612, "#FFC145", h=14)
    elif ident == "F":
        D.bush(R, 244, 650, 0.8, "#56A84A", seed=11, flowers="#FFC145")
        D.flower_stem(R, 196, 616, "#E85D9A")
        D.flower_stem(R, 176, 642, "#FF7F50", h=14)
    elif ident == "A":
        D.bush(R, 318, 452, 0.9, seed=13, flowers="#FFC145")
    elif ident == "B":
        D.bush(R, 842, 480, 0.9, seed=14, flowers="#E85D9A")
    elif ident == "C":
        D.bush(R, 560, 646, 0.9, seed=15, flowers="#FF7F50")

def nombres_lieu(R, activite):
    e = DISPOSITIONS["nombres"]["emplacements"]
    if activite == "marche":
        D.stall(R, *e["A"], arm="sans")   # le bras qui salue est un calque à part
    elif activite == "nenuphars":
        D.pond(R, *e["B"], with_frog=False)   # la grenouille est un calque à part : elle saute
    elif activite == "partage":
        D.picnic(R, *e["C"])
    else:
        raise KeyError(activite)

def nombres_anime(R, nom):
    e = DISPOSITIONS["nombres"]["emplacements"]
    if nom == "bateau":
        D.dock_boat(R, part_="bateau")
    elif nom == "bras":
        cx, cy = e["A"]
        P.basile(R, cx + 2, cy + 4, 0.8, wave=True, full=False, arm="seul")
    elif nom == "basile-cligne":
        # le visage de Basile, les yeux fermés, posé sur l'étal le temps d'un clignement
        import vivant as V
        cx, cy = e["A"]
        D.stall(R, cx, cy, arm="sans", expr="cligne")
        V.garder(R, R.mask(ellipse(cx + 2, cy - 64, 30, 18)))
    elif nom == "grenouille":
        cx, cy = e["B"]
        P.frog(R, cx - 196, cy + 14, 0.62)
    else:
        raise KeyError(nom)

DESSINS = {"nombres": {"base": nombres_base, "remplissage": nombres_remplissage, "lieu": nombres_lieu, "anime": nombres_anime}}

# ---------------------------------------------------------------------------- îles de la livraison 3
import ile_mots, ile_enigmes, ile_decouvertes, ile_atelier, ile_coeur, ile_port
for _id, _m in (("mots", ile_mots), ("enigmes", ile_enigmes), ("decouvertes", ile_decouvertes), ("atelier", ile_atelier), ("coeur", ile_coeur), ("port", ile_port)):
    DISPOSITIONS[_id] = _m.DISPOSITION
    DESSINS[_id] = _m.DESSINS
