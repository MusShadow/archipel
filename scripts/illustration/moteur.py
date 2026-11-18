"""Moteur d'illustration d'Archipel 2 (rendu au moment de la construction, déterministe).

Les formes sont décrites en coordonnées « écran » (px CSS) et rendues à l'échelle S.
Chaque élément reçoit une matière (couleur, volume, brillance, texture) et une finition :
  album   : album illustré — deux tons doux, trait coloré, texture gouache
  volume  : volume doux — modelé lisse, reflets, ombres de contact
  papier  : papier découpé — aplats texturés, bords coupés, ombres portées douces
Même source, même seed => même image : les illustrations ne changent jamais d'un rendu à l'autre.
"""
import math
import numpy as np
import cv2

# ----------------------------------------------------------------------------- couleurs
def hex2rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)

def to_lin(c):
    c = np.asarray(c, np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)

def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055).astype(np.float32)

def L(h):
    """Couleur hex -> RVB linéaire."""
    return to_lin(hex2rgb(h)) if isinstance(h, str) else np.asarray(h, np.float32)

_M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                [0.2119034982, 0.6806995451, 0.1073969566],
                [0.0883024619, 0.2817188376, 0.6299787005]], np.float32)
_M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
                [1.9779984951, -2.4285922050, 0.4505937099],
                [0.0259040371, 0.7827717662, -0.8086757660]], np.float32)
_M1i = np.linalg.inv(_M1).astype(np.float32)
_M2i = np.linalg.inv(_M2).astype(np.float32)

def lin2lab(c):
    lms = np.cbrt(np.maximum(c @ _M1.T, 0))
    return lms @ _M2.T

def lab2lin(lab):
    lms = lab @ _M2i.T
    return np.maximum((lms ** 3) @ _M1i.T, 0)

def tweak(c, dl=0.0, sat=1.0, dh=0.0):
    """Ajuste une couleur linéaire (ou un tableau) en OKLCh : clarté, chroma, teinte (degrés)."""
    lab = lin2lab(np.asarray(c, np.float32))
    l, a, b = lab[..., 0] + dl, lab[..., 1], lab[..., 2]
    if dh:
        r = math.radians(dh)
        a, b = a * math.cos(r) - b * math.sin(r), a * math.sin(r) + b * math.cos(r)
    return lab2lin(np.stack([l, a * sat, b * sat], -1)).astype(np.float32)

def mix(a, b, t):
    t = np.asarray(t, np.float32)
    return a + (b - a) * t

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

# ----------------------------------------------------------------------------- géométrie
def catmull(pts, closed=True, n=14):
    """Spline de Catmull-Rom centripète. Un point (x, y, 'c') fait un angle vif."""
    P = []
    m = len(pts)
    for i, p in enumerate(pts):
        if len(p) > 2 and p[2] == "c":
            a = pts[(i - 1) % m]; b = pts[(i + 1) % m]
            if closed or 0 < i < m - 1:
                P.append((p[0] + 0.03 * (a[0] - p[0]), p[1] + 0.03 * (a[1] - p[1])))
                P.append((p[0], p[1]))
                P.append((p[0] + 0.03 * (b[0] - p[0]), p[1] + 0.03 * (b[1] - p[1])))
                continue
        P.append((p[0], p[1]))
    P = np.array(P, np.float64)
    if not closed:
        P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    k = len(P)
    out = []
    rng = range(k) if closed else range(1, k - 2)
    for i in rng:
        p0, p1, p2, p3 = P[(i - 1) % k], P[i % k], P[(i + 1) % k], P[(i + 2) % k]
        def tj(ti, a, b):
            return ti + max(np.linalg.norm(b - a), 1e-6) ** 0.5
        t0 = 0.0; t1 = tj(t0, p0, p1); t2 = tj(t1, p1, p2); t3 = tj(t2, p2, p3)
        ts = np.linspace(t1, t2, n, endpoint=False)[:, None]
        A1 = (t1 - ts) / (t1 - t0) * p0 + (ts - t0) / (t1 - t0) * p1
        A2 = (t2 - ts) / (t2 - t1) * p1 + (ts - t1) / (t2 - t1) * p2
        A3 = (t3 - ts) / (t3 - t2) * p2 + (ts - t2) / (t3 - t2) * p3
        B1 = (t2 - ts) / (t2 - t0) * A1 + (ts - t0) / (t2 - t0) * A2
        B2 = (t3 - ts) / (t3 - t1) * A2 + (ts - t1) / (t3 - t1) * A3
        out.append((t2 - ts) / (t2 - t1) * B1 + (ts - t1) / (t2 - t1) * B2)
    res = np.vstack(out)
    if not closed:
        res = np.vstack([res, P[-2]])
    return res

def ellipse(cx, cy, rx, ry, rot=0, n=72):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    x, y = rx * np.cos(t), ry * np.sin(t)
    r = math.radians(rot)
    return np.stack([cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r)], 1)

def circle(cx, cy, r, n=72):
    return ellipse(cx, cy, r, r, 0, n)

def rrect(x, y, w, h, r, n=10):
    r = min(r, w / 2, h / 2)
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for t in np.linspace(a0, a0 + 90, n):
            pts.append((cx + r * math.cos(math.radians(t)), cy + r * math.sin(math.radians(t))))
    return np.array(pts)

def ribbon(center, widths, closed_caps=True):
    """Bande à largeur variable le long d'une ligne (centre = points, widths = demi-largeurs)."""
    c = np.asarray(center, np.float64)
    w = np.asarray(widths, np.float64)
    d = np.gradient(c, axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    left = c + nrm * w[:, None]
    right = c - nrm * w[:, None]
    return np.vstack([left, right[::-1]])

def stroke_pts(pts, n=16):
    return catmull(pts, closed=False, n=n)

def taper(n, w0, w1, w_mid=None, round_end=True):
    t = np.linspace(0, 1, n)
    if w_mid is None:
        w = w0 + (w1 - w0) * t
    else:
        w = np.where(t < 0.5, w0 + (w_mid - w0) * t * 2, w_mid + (w1 - w_mid) * (t - 0.5) * 2)
    if round_end:
        w = w * np.sqrt(np.clip(np.minimum(t, 1 - t) * 18, 0, 1)) + 0.0
    return w

class Affine:
    def __init__(self, m=None):
        self.m = np.eye(3) if m is None else m

    def __matmul__(self, o):
        return Affine(self.m @ o.m)

    @staticmethod
    def T(x, y):
        return Affine(np.array([[1, 0, x], [0, 1, y], [0, 0, 1]], float))

    @staticmethod
    def R(deg, cx=0, cy=0):
        a = math.radians(deg)
        c, s = math.cos(a), math.sin(a)
        return Affine.T(cx, cy) @ Affine(np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], float)) @ Affine.T(-cx, -cy)

    @staticmethod
    def S(sx, sy=None, cx=0, cy=0):
        sy = sx if sy is None else sy
        return Affine.T(cx, cy) @ Affine(np.array([[sx, 0, 0], [0, sy, 0], [0, 0, 1]], float)) @ Affine.T(-cx, -cy)

    def apply(self, pts):
        p = np.asarray(pts, float)
        return p @ self.m[:2, :2].T + self.m[:2, 2]

    @property
    def scale(self):
        return math.sqrt(abs(np.linalg.det(self.m[:2, :2])))

# ----------------------------------------------------------------------------- masques
class Mask:
    """Couverture alpha (float32) posée en (x0, y0) dans l'image rendue."""
    def __init__(self, a, x0, y0):
        self.a, self.x0, self.y0 = a.astype(np.float32), int(x0), int(y0)

    @property
    def box(self):
        h, w = self.a.shape
        return self.x0, self.y0, self.x0 + w, self.y0 + h

    def to(self, box):
        X0, Y0, X1, Y1 = box
        out = np.zeros((Y1 - Y0, X1 - X0), np.float32)
        x0, y0, x1, y1 = self.box
        ix0, iy0, ix1, iy1 = max(x0, X0), max(y0, Y0), min(x1, X1), min(y1, Y1)
        if ix1 > ix0 and iy1 > iy0:
            out[iy0 - Y0:iy1 - Y0, ix0 - X0:ix1 - X0] = self.a[iy0 - y0:iy1 - y0, ix0 - x0:ix1 - x0]
        return out

    def padded(self, p):
        x0, y0, x1, y1 = self.box
        b = (x0 - p, y0 - p, x1 + p, y1 + p)
        return Mask(self.to(b), b[0], b[1])

def union_box(*boxes):
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

def m_union(*ms):
    b = union_box(*[m.box for m in ms])
    a = np.zeros((b[3] - b[1], b[2] - b[0]), np.float32)
    for m in ms:
        a = np.maximum(a, m.to(b))
    return Mask(a, b[0], b[1])

def m_sub(m, *cut):
    a = m.a.copy()
    for c in cut:
        a *= 1 - c.to(m.box)
    return Mask(a, m.x0, m.y0)

def m_clip(m, by):
    return Mask(m.a * by.to(m.box), m.x0, m.y0)

def m_fuse(m, r):
    """Fusion organique : arrondit les raccords (union lisse) — r en px rendus."""
    p = m.padded(int(r * 2 + 2))
    b = cv2.GaussianBlur(p.a, (0, 0), r)
    return Mask(smooth(0.42, 0.58, b), p.x0, p.y0)

def m_grow(m, r):
    p = m.padded(int(abs(r) + 3))
    k = int(abs(r) * 2) | 1
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    a = cv2.dilate(p.a, se) if r > 0 else cv2.erode(p.a, se)
    return Mask(a, p.x0, p.y0)

def m_wobble(m, amp, cell, seed=0):
    """Bord découpé à la main : déplace légèrement le contour (amp et cell en px rendus)."""
    p = m.padded(int(amp * 2 + 2))
    h, w = p.a.shape
    nx = (value_noise(h, w, cell, seed, octaves=2) - 0.5) * 2 * amp
    ny = (value_noise(h, w, cell, seed + 99, octaves=2) - 0.5) * 2 * amp
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = cv2.remap(p.a, xx + nx, yy + ny, cv2.INTER_LINEAR, borderValue=0)
    return Mask(a, p.x0, p.y0)

def m_shift(m, dx, dy):
    return Mask(m.a, m.x0 + int(round(dx)), m.y0 + int(round(dy)))

# ----------------------------------------------------------------------------- bruit (déterministe)
def value_noise(h, w, cell, seed, octaves=4, pers=0.5, stretch=(1.0, 1.0)):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        cx = max(1.0, cell * stretch[0] / 2 ** o)
        cy = max(1.0, cell * stretch[1] / 2 ** o)
        gw, gh = int(w / cx) + 4, int(h / cy) + 4
        g = rng.random((gh, gw)).astype(np.float32)
        up = cv2.resize(g, (int(gw * cx), int(gh * cy)), interpolation=cv2.INTER_CUBIC)
        out += up[:h, :w] * amp
        tot += amp
        amp *= pers
    return out / tot

# ----------------------------------------------------------------------------- matières
class Mat(dict):
    """Paramètres d'une matière. Valeurs par défaut raisonnables pour chaque finition."""
    def __init__(self, **kw):
        base = dict(puff=18.0, profile="round", spec=0.0, shin=24.0, rim=0.15, tex=0.6, kind="matte",
                    line=True, line_w=1.6, flat=False, shadow=True, sat=1.0, gloss=0.0)
        base.update(kw)
        super().__init__(base)

# ----------------------------------------------------------------------------- moteur
class Art:
    def __init__(self, W, H, scale=1.0, style="album", seed=7):
        self.W, self.H, self.S, self.style = W, H, scale, style
        self.w, self.h = int(round(W * scale)), int(round(H * scale))
        self.img = np.zeros((self.h, self.w, 3), np.float32)
        self.tf = [Affine()]
        self.seed = seed
        # lumière : vient d'en haut à gauche, un peu de face
        l = np.array([-0.46, -0.66, 0.60], np.float32)
        self.Ldir = l / np.linalg.norm(l)
        self.key = L("#FFF3DF") * 1.06
        self.amb = L("#C9D9F2") * 0.42
        self.shadow_tint = L("#3B3F78")
        self.haze = L("#DDEFF3")
        h, w = self.h, self.w
        s = scale
        self.grain = value_noise(h, w, 1.2 * s, seed + 1, octaves=2, pers=0.6)
        self.mottle = value_noise(h, w, 34 * s, seed + 2, octaves=4, pers=0.55)
        self.fiber = value_noise(h, w, 3.0 * s, seed + 3, octaves=3, pers=0.5, stretch=(9.0, 0.6))
        self.brush = value_noise(h, w, 9 * s, seed + 4, octaves=3, pers=0.5, stretch=(2.5, 0.7))

    def crop(self, f, box):
        x0, y0, x1, y1 = box
        out = np.full((y1 - y0, x1 - x0), 0.5, np.float32)
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.w, x1), min(self.h, y1)
        if X1 > X0 and Y1 > Y0:
            out[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] = f[Y0:Y1, X0:X1]
        return out

    # ---- transformations (en coordonnées écran)
    def push(self, a):
        self.tf.append(self.tf[-1] @ a)

    def pop(self):
        self.tf.pop()

    def P(self, pts):
        return self.tf[-1].apply(pts) * self.S

    @property
    def k(self):
        """Échelle courante (rendu) : pour convertir des tailles locales en px rendus."""
        return self.tf[-1].scale * self.S

    # ---- rasterisation
    def mask(self, pts, ss=None):
        p = self.P(pts)
        x0, y0 = np.floor(p.min(0)).astype(int) - 2
        x1, y1 = np.ceil(p.max(0)).astype(int) + 2
        w, h = x1 - x0, y1 - y0
        if ss is None:
            ss = 4 if w * h < 900_000 else 2
        can = np.zeros((h * ss, w * ss), np.uint8)
        q = np.round((p - [x0, y0]) * ss * 16).astype(np.int32)
        cv2.fillPoly(can, [q], 255, lineType=cv2.LINE_8, shift=4)
        a = cv2.resize(can, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        return Mask(a, x0, y0)

    def mask_many(self, polys):
        return m_union(*[self.mask(p) for p in polys])

    def line_mask(self, pts, width, closed=False, n=12, smooth_it=True):
        c = catmull(pts, closed=closed, n=n) if smooth_it and len(pts) > 2 else np.asarray(pts, float)
        p = self.P(c)
        wpx = width * self.k
        x0, y0 = np.floor(p.min(0) - wpx).astype(int) - 2
        x1, y1 = np.ceil(p.max(0) + wpx).astype(int) + 2
        ss = 4
        can = np.zeros(((y1 - y0) * ss, (x1 - x0) * ss), np.uint8)
        q = np.round((p - [x0, y0]) * ss * 16).astype(np.int32)
        cv2.polylines(can, [q], closed, 255, thickness=max(1, int(round(wpx * ss))), lineType=cv2.LINE_AA, shift=4)
        a = cv2.resize(can, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        return Mask(a, x0, y0)

    # ---- fond
    def vgradient(self, stops):
        ys = np.linspace(0, 1, self.h, dtype=np.float32)
        cols = np.zeros((self.h, 3), np.float32)
        pos = [s[0] for s in stops]
        for c in range(3):
            cols[:, c] = np.interp(ys, pos, [L(s[1])[c] for s in stops])
        self.img[:] = cols[:, None, :]

    # ---- ombres posées sur l'image existante
    def cast(self, m, dx=0.0, dy=0.0, blur=6.0, op=0.3, tint=None, clip=None):
        """Ombre douce : la forme décalée et floutée assombrit ce qui est déjà peint."""
        if getattr(self, "mute", False):
            return
        S = self.S
        bl = max(0.5, blur * S)
        pad = int(bl * 3 + abs(dx * S) + abs(dy * S) + 4)
        p = m.padded(pad)
        a = cv2.GaussianBlur(p.a, (0, 0), bl)
        sh = m_shift(Mask(a, p.x0, p.y0), dx * S, dy * S)
        if clip is not None:
            sh = m_clip(sh, clip)
        x0, y0, x1, y1 = sh.box
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.w, x1), min(self.h, y1)
        if X1 <= X0 or Y1 <= Y0:
            return
        A = sh.a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0, None] * op
        t = self.shadow_tint if tint is None else L(tint)
        self.img[Y0:Y1, X0:X1] *= (1 - A) + A * t

    # ---- élément peint
    def paint(self, m, color, mat=None, albedo=None, haze=0.0, outline=None, decal=None, ao_from=None,
              shadow=None, style=None):
        """Peint une forme. color : hex ou RVB linéaire ; albedo(x, y, base) peut renvoyer une couleur par pixel."""
        if getattr(self, "mute", False):
            return
        st = style or self.style
        mat = mat or Mat()
        S = self.S
        pad = int(max(mat["puff"] * self.k * 0.6, 6))
        mm = m.padded(pad)
        x0, y0, x1, y1 = mm.box
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.w, x1), min(self.h, y1)
        if X1 <= X0 or Y1 <= Y0:
            return
        A = mm.a
        hgt, wid = A.shape
        base = L(color) if isinstance(color, str) else np.asarray(color, np.float32)
        alb = np.empty((hgt, wid, 3), np.float32)
        alb[:] = base
        if albedo is not None:
            yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
            alb = albedo(xx / S, yy / S, alb)
        if decal:
            for dm, dc, dsoft in decal:
                da = dm.to(mm.box)
                if dsoft:
                    da = cv2.GaussianBlur(da, (0, 0), dsoft * S)
                alb = mix(alb, L(dc) if isinstance(dc, str) else np.asarray(dc, np.float32), da[..., None])
        if mat["sat"] != 1.0:
            alb = tweak(alb, sat=mat["sat"])
        # ---- distance intérieure et normales
        inside = (A > 0.5).astype(np.uint8)
        D = cv2.distanceTransform(inside, cv2.DIST_L2, 5).astype(np.float32) + (A - 0.5)
        R = max(1.0, mat["puff"] * self.k)
        if mat["profile"] == "round":
            t = np.clip(D / R, 0, 1)
            H = np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1)) * R
            H = cv2.GaussianBlur(H, (0, 0), max(0.6, R * 0.18))
        else:  # coussin : bord arrondi, dessus plat
            H = cv2.GaussianBlur(A, (0, 0), max(0.6, R * 0.5)) * R * 1.4
        gy, gx = np.gradient(H)
        N = np.stack([-gx, -gy, np.ones_like(H)], -1)
        N /= np.linalg.norm(N, axis=-1, keepdims=True)
        ndl = N @ self.Ldir
        Lz = self.Ldir[2]
        col = self.shade(st, alb, N, ndl, D, A, mat, (x0, y0, x1, y1), outline)
        if haze:
            col = mix(col, self.haze, haze)
        # ---- composition
        sl = (slice(Y0 - y0, Y1 - y0), slice(X0 - x0, X1 - x0))
        a3 = A[sl][..., None]
        self.img[Y0:Y1, X0:X1] = self.img[Y0:Y1, X0:X1] * (1 - a3) + col[sl] * a3

    def shade(self, st, alb, N, ndl, D, A, mat, box, outline):
        S = self.S
        x0, y0, x1, y1 = box
        Lz = float(self.Ldir[2])
        if mat["flat"]:
            return alb
        if st == "volume":
            wrap = 0.35
            diff = np.clip((ndl + wrap) / (1 + wrap), 0, 1)
            flat = (Lz + wrap) / (1 + wrap)
            light = self.amb * 1.0 + self.key * ((diff / flat) * 0.72)[..., None]
            col = alb * light
            # ombre propre plus saturée, un peu froide (diffusion)
            dark = 1 - smooth(0.15, 0.75, diff)
            col = mix(col, tweak(col, dl=-0.02, sat=1.25, dh=-8), dark[..., None] * 0.6)
            # reflet spéculaire
            if mat["spec"] > 0:
                hv = self.Ldir + np.array([0, 0, 1], np.float32)
                hv /= np.linalg.norm(hv)
                nh = np.clip(N @ hv, 0, 1)
                sp = (nh ** mat["shin"]) * mat["spec"]
                col = col + sp[..., None] * self.key
            # liseré de contre-jour
            fres = (1 - np.clip(N[..., 2], 0, 1)) ** 2.5
            col = col + fres[..., None] * mat["rim"] * 0.6 * L("#FFFFFF")
            # bruit très fin (évite les aplats numériques)
            g = self.crop(self.grain, box)
            col = col * (0.985 + 0.03 * g[..., None])
            return col
        if st == "album":
            diff = np.clip(ndl, 0, 1)
            flatv = Lz
            # deux tons, transition douce ; l'ombre tire vers le bleu-violet
            t = smooth(flatv * 0.86 - 0.04, flatv * 0.86 + 0.04, diff)
            sh = tweak(alb, dl=-0.085, sat=1.15, dh=-16)
            col = mix(sh, alb, t[..., None])
            # dégradé doux dans chaque ton + lumière chaude sur les bords éclairés
            col = col * (0.95 + 0.10 * np.clip(diff / max(flatv, 1e-3), 0, 1.3))[..., None]
            hi = smooth(0.93, 0.99, diff) * 0.16
            col = mix(col, tweak(alb, dl=0.08, sat=0.95, dh=6), hi[..., None])
            # texture gouache : marbrure + grain + coups de pinceau
            mo = self.crop(self.mottle, box) - 0.5
            gr = self.crop(self.grain, box) - 0.5
            br = self.crop(self.brush, box) - 0.5
            tx = 1 + mat["tex"] * (0.22 * mo + 0.08 * gr + 0.10 * br)
            col = col * tx[..., None]
            # pigment qui s'accumule au bord
            edge = smooth(4.0 * S, 0.0, D)
            col = col * (1 - 0.10 * edge)[..., None]
            # trait coloré, plus épais côté ombre
            if (mat["line"] if outline is None else outline):
                lw = mat["line_w"] * S * (0.8 + 0.9 * (1 - np.clip(diff / max(flatv, 1e-3), 0, 1)))
                la = smooth(lw + 0.7, lw - 0.7, D)
                lc = tweak(alb, dl=-0.30, sat=1.15, dh=-6)
                col = mix(col, lc, (la * 0.92)[..., None])
            return col
        if st == "papier":
            diff = np.clip(ndl, 0, 1)
            # aplat : très léger dégradé de lumière + biseau du bord coupé
            bevel = diff - Lz
            col = alb * (1.0 + 0.55 * bevel)[..., None]
            fi = self.crop(self.fiber, box) - 0.5
            gr = self.crop(self.grain, box) - 0.5
            mo = self.crop(self.mottle, box) - 0.5
            tx = 1 + mat["tex"] * (0.10 * fi + 0.07 * gr + 0.05 * mo)
            col = col * tx[..., None]
            return col
        return alb

    # ---- filtres d'image
    def blur(self, sigma):
        self.img = cv2.GaussianBlur(self.img, (0, 0), sigma * self.S)

    def finish(self, vignette=0.10, grain=0.02, paper=0.0, grade=None):
        img = self.img.copy()
        if grade == "chaud":      # album : lumière dorée d'après-midi
            img = tweak(img, sat=1.05) * np.array([1.045, 1.0, 0.93], np.float32)
        elif grade == "net":      # volume : couleurs franches, un peu froides
            img = tweak(img, sat=1.10) * np.array([0.985, 1.0, 1.03], np.float32)
        elif grade == "doux":     # papier : pastel, papier crème
            img = mix(tweak(img, sat=0.86), L("#FFF4E4"), 0.05)
        h, w = self.h, self.w
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
        img *= (1 - vignette * smooth(0.6, 1.45, r))[..., None]
        if paper:
            img *= (1 + paper * (self.grain - 0.5) + paper * 0.6 * (self.fiber - 0.5))[..., None]
        out = to_srgb(img)
        out = out + (self.grain[..., None] - 0.5) * grain
        return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)

    def save(self, path, **kw):
        out = self.finish(**kw)
        cv2.imwrite(path, cv2.cvtColor(out, cv2.COLOR_RGB2BGR))
        return path
