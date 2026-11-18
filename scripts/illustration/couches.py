"""Rendu en couches transparentes : chaque élément est peint deux fois, sur fond noir puis sur fond blanc ;
la différence donne la transparence exacte (ombres douces comprises). Écrit des WebP recadrés."""
import pathlib
import numpy as np
from PIL import Image
from moteur import Art, Affine, tweak, to_srgb

class Atelier:
    """Un cadre de rendu (W x H en px CSS, à l'échelle S) et ses textures, partagés par toutes les couches."""
    def __init__(self, W, H, S=2, style="album", seed=7):
        self.modele = Art(W, H, scale=S, style=style, seed=seed)
        self.W, self.H, self.S = W, H, S

    def art(self, fond):
        R = Art.__new__(Art)
        R.__dict__.update(self.modele.__dict__)
        R.img = np.full((R.h, R.w, 3), fond, np.float32)
        R.tf = [Affine()]
        return R

    def rgba(self, dessin):
        """Rend dessin(R) sur noir et sur blanc ; renvoie (couleur linéaire, alpha)."""
        Rn = self.art(0.0); dessin(Rn); N = Rn.img
        Rb = self.art(1.0); dessin(Rb); B = Rb.img
        a = np.clip(1 - (B - N).mean(-1), 0, 1)
        col = N / np.maximum(a[..., None], 1e-4)
        col[a < 1e-4] = 0
        return col, a

    def opaque(self, dessin):
        R = self.art(0.0)
        dessin(R)
        return R.img, np.ones(R.img.shape[:2], np.float32)

    def finition(self, col, papier=0.05):
        """Finition album : lumière dorée, grain de papier très léger (mêmes réglages que les planches validées)."""
        M = self.modele
        img = tweak(np.clip(col, 0, 4), sat=1.05) * np.array([1.045, 1.0, 0.93], np.float32)
        img = img * (1 + papier * (M.grain - 0.5) + papier * 0.6 * (M.fiber - 0.5))[..., None]
        out = to_srgb(img) + (M.grain[..., None] - 0.5) * 0.012
        return np.clip(out, 0, 1)

    def enregistrer(self, chemin, col, a, opaque=False, marge=3, qualite=86):
        """Recadre sur la partie visible, écrit le WebP ; renvoie la boîte en px CSS [x, y, l, h] dans le cadre."""
        chemin = pathlib.Path(chemin)
        chemin.parent.mkdir(parents=True, exist_ok=True)
        if opaque:
            y0, y1, x0, x1 = 0, a.shape[0], 0, a.shape[1]
        else:
            ys, xs = np.where(a > 0.004)
            y0, y1 = max(0, ys.min() - marge), min(a.shape[0], ys.max() + marge + 1)
            x0, x1 = max(0, xs.min() - marge), min(a.shape[1], xs.max() + marge + 1)
        rgb = (self.finition(col)[y0:y1, x0:x1] * 255 + 0.5).astype(np.uint8)
        if opaque:
            Image.fromarray(rgb).save(chemin, "WEBP", quality=qualite, method=6)
        else:
            al = (a[y0:y1, x0:x1] * 255 + 0.5).astype(np.uint8)
            Image.fromarray(np.dstack([rgb, al]), "RGBA").save(chemin, "WEBP", quality=qualite, alpha_quality=90, method=6)
        S = self.S
        return [float(round(x0 / S, 1)), float(round(y0 / S, 1)), float(round((x1 - x0) / S, 1)), float(round((y1 - y0) / S, 1))]
