"""Portraits des personnages (livraison 3) : la tête et le haut des épaules, cadrés pareil pour tous dans un carré.
L'appli les pose dans un médaillon rond (les médaillons des activités), et le théâtre de Pico en fait ses visages
d'émotions : joie, tristesse, colère, peur, surprise, déception (plus « content » pour les médaillons)."""
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

def portrait(R, nom, expr):
    fn, (ax, ay), (hx, hy), r = PERSOS[nom]
    s = RAYON / r
    fn(R, CENTRE[0] - s * (hx - ax), CENTRE[1] - s * (hy - ay), s, expr)

ELEMENTS = {f"visages/{nom}-{emo}": dict(cadre=CADRE, dessin=(lambda R, nom=nom, e=e: portrait(R, nom, e)), qualite=88)
            for nom in PERSOS for emo, e in EMOTIONS.items()}
