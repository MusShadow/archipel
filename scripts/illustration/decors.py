"""Île des Nombres — écran d'île d'Archipel 2 (1194 x 834, iPad Pro 11 en paysage)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moteur import *
from personnages import *

W, H = 1194, 834
import os
RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BALOO = os.path.join(RACINE, "public/polices/baloo-2-latin-800-normal.woff2")

def rng(seed):
    return np.random.default_rng(seed)

def text_mask(R, txt, cx, cy, size, font=BALOO, rot=0):
    S = R.S * 4
    f = ImageFont.truetype(font, int(size * S))
    l, t, r, b = f.getbbox(txt)
    im = Image.new("L", (r - l + 8, b - t + 8), 0)
    ImageDraw.Draw(im).text((4 - l, 4 - t), txt, font=f, fill=255)
    if rot:
        im = im.rotate(-rot, resample=Image.BICUBIC, expand=True)
    a = np.asarray(im, np.float32) / 255
    h, w = a.shape
    a = cv2.resize(a, (max(1, w // 4), max(1, h // 4)), interpolation=cv2.INTER_AREA)
    p = R.P([(cx, cy)])[0]
    return Mask(a, int(p[0] - a.shape[1] / 2), int(p[1] - a.shape[0] / 2))

def ground_shadow(R, cx, cy, rx, ry, op=0.28, dx=6, blur=5):
    m = R.mask(ellipse(cx + dx, cy, rx, ry))
    if R.style == "papier":
        R.cast(m, 0, 0, blur * 0.6, op * 1.1)
    else:
        R.cast(m, 0, 0, blur, op)

# ============================================================================ ciel, nuages, horizon
def sky(R):
    if R.style == "papier":
        R.vgradient([(0, "#BFE5EE"), (0.30, "#DDF1F1"), (1, "#E9F6F2")])
        # bandes de papier dans le ciel
        for i, (y, c) in enumerate(((150, "#D3EDEF"), (196, "#E0F3F1"))):
            pts = [(-20, y)] + [(x, y + 6 * math.sin(x / 90 + i)) for x in range(0, W + 60, 60)] + [(W + 20, 300), (-20, 300)]
            m = m_wobble(R.mask(np.array(pts, float)), 0.6 * R.S, 8 * R.S, seed=40 + i)
            R.cast(m, 0, -1.5, 2.0, 0.10)
            R.paint(m, c, Mat(puff=2, profile="pillow", tex=1.0))
        return
    R.vgradient([(0, "#9FD8EA"), (0.18, "#C4E8F0"), (0.30, "#E3F4F1"), (1, "#EAF6F2")])
    # halo du soleil en haut à gauche
    yy, xx = np.mgrid[0:R.h, 0:R.w].astype(np.float32) / R.S
    d = np.sqrt((xx - 140) ** 2 + (yy - 40) ** 2)
    glow = np.exp(-(d / 420) ** 2)[..., None]
    R.img = R.img + glow * L("#FFF1D6") * 0.35

def sun(R, x, y, r=30):
    rays = []
    for k in range(12):
        a = math.radians(k * 30)
        b = math.radians(k * 30 + 9)
        c = math.radians(k * 30 - 9)
        rays.append(R.mask(np.array([(x + math.cos(b) * r * 1.15, y + math.sin(b) * r * 1.15), (x + math.cos(a) * r * 1.75, y + math.sin(a) * r * 1.75),
                                     (x + math.cos(c) * r * 1.15, y + math.sin(c) * r * 1.15)], float)))
    rm = m_wobble(m_union(*rays), 0.5 * R.S, 6 * R.S, seed=31)
    R.cast(rm, 1.5, 3, 2.2, 0.18)
    R.paint(rm, "#FFC861", Mat(puff=2, profile="pillow", tex=1.0))
    dm = m_wobble(R.mask(circle(x, y, r)), 0.5 * R.S, 6 * R.S, seed=32)
    R.cast(dm, 1.5, 3, 2.2, 0.22)
    R.paint(dm, "#FFD978", Mat(puff=2, profile="pillow", tex=1.0))

def butterfly(R, x, y, c="#FFC145", s=1.0, flip=False, open_=1.0):
    sg = -1 if flip else 1
    for dx, dy, rx, ry, rot in ((-6, -4, 7, 9, -30), (6, -4, 7, 9, 30), (-4, 5, 5, 6, -20), (4, 5, 5, 6, 20)):
        part(R, R.mask(ellipse(x + dx * s * sg * open_, y + dy * s, max(1.2, rx * s * open_), ry * s, rot * sg)), c, Mat(puff=2, line_w=0.9, tex=0.5), shadow=False)
    flat(R, R.mask(ellipse(x, y, 1.6 * s, 7 * s)), "#4A3A2E")
    flat(R, R.line_mask([(x, y - 6 * s), (x - 3 * s, y - 12 * s)], 0.9, smooth_it=False), "#4A3A2E")
    flat(R, R.line_mask([(x, y - 6 * s), (x + 3 * s, y - 12 * s)], 0.9, smooth_it=False), "#4A3A2E")

def cloud(R, x, y, s=1.0, seed=1):
    r = rng(seed)
    blobs = [(0, 0, 34), (36, -12, 40), (78, -2, 32), (104, 10, 22), (-30, 10, 22), (50, 14, 30)]
    polys = [circle(x + bx * s, y + by * s, br * s * (0.95 + 0.1 * r.random())) for bx, by, br in blobs]
    base = R.mask(np.array([(x - 46 * s, y + 18 * s), (x + 124 * s, y + 18 * s), (x + 124 * s, y + 26 * s), (x - 46 * s, y + 26 * s)]))
    m = m_fuse(m_union(*[R.mask(p) for p in polys]), 2.5 * R.S * s)
    m = m_sub(m, R.mask(np.array([(x - 80 * s, y + 24 * s), (x + 160 * s, y + 24 * s), (x + 160 * s, y + 80 * s), (x - 80 * s, y + 80 * s)])))
    if R.style == "papier":
        m = m_wobble(m, 0.6 * R.S, 8 * R.S, seed=seed)
        R.cast(m, 2, 4, 3, 0.16)
        R.paint(m, "#FFFFFF", Mat(puff=2, profile="pillow", tex=1.0))
    elif R.style == "volume":
        R.paint(m, "#FFFFFF", Mat(puff=18 * s, spec=0.0, rim=0.1),
                decal=[(R.mask(ellipse(x + 40 * s, y + 22 * s, 90 * s, 12 * s)), "#DCE8F4", 6)])
    else:
        R.paint(m, "#FFFFFF", Mat(puff=16 * s, line=False, tex=0.5))

def far_islands(R, smoke=True):
    hz = 0.0 if R.style == "papier" else 0.45
    isl = [
        # île du volcan (Découvertes), loin à droite
        ([(870, 236), (900, 214), (930, 196), (950, 176, "c"), (972, 176, "c"), (990, 198), (1030, 214), (1070, 236)], "#7FAFA8", "#E68A5C"),
        # petite île aux palmiers à gauche
        ([(120, 238), (150, 222), (196, 216), (236, 224), (262, 238)], "#86B9A3", None),
    ]
    for pts, c, top in isl:
        m = R.mask(catmull(pts + [(pts[-1][0], 240), (pts[0][0], 240)]))
        if R.style == "papier":
            R.cast(m, 1, 2, 1.5, 0.12)
            R.paint(m, "#A9CFC6", Mat(puff=2, profile="pillow", tex=1.0))
        else:
            R.paint(m, c, Mat(puff=6, line=False, tex=0.3), haze=hz)
    # panache du volcan
    if not smoke:
        return
    if R.style != "papier":
        for i, (px, py, pr) in enumerate(((962, 160, 9), (970, 146, 11), (982, 132, 13))):
            R.paint(R.mask(circle(px, py, pr)), "#FFFFFF", Mat(puff=6, line=False, tex=0.2), haze=0.35)
    else:
        for i, (px, py, pr) in enumerate(((962, 160, 9), (970, 146, 11), (982, 132, 13))):
            m = R.mask(circle(px, py, pr))
            R.cast(m, 1, 2, 1.5, 0.12)
            R.paint(m, "#FFFFFF", Mat(puff=2, profile="pillow", tex=1.0))

# ============================================================================ mer
def sea(R, isl_mask, streaks="avec"):
    y0 = 236
    if R.style == "papier":
        bands = [(y0, "#7FCFD9"), (300, "#6CC5D2"), (420, "#5BBBCB"), (560, "#4CB0C3"), (700, "#43A7BC")]
        for i, (y, c) in enumerate(bands):
            pts = [(-30, y)] + [(x, y + 7 * math.sin(x / (70 + 10 * i) + i * 1.7)) for x in range(-30, W + 80, 40)] + [(W + 30, H + 30), (-30, H + 30)]
            m = m_wobble(R.mask(np.array(pts, float)), 0.7 * R.S, 9 * R.S, seed=60 + i)
            R.cast(m, 0, -2.5, 2.5, 0.18)
            R.paint(m, c, Mat(puff=2.5, profile="pillow", tex=1.0))
        return
    ys = np.linspace(0, 1, R.h, dtype=np.float32)[:, None]
    t = np.clip((ys * H - y0) / (H - y0), 0, 1)
    far, mid, near = L("#8FD7DF"), L("#56BCCB"), L("#2E9FB6")
    col = np.where(t[..., None] < 0.4, mix(far, mid, (t / 0.4)[..., None]), mix(mid, near, ((t - 0.4) / 0.6)[..., None]))
    col = np.repeat(col, R.w, axis=1)
    sea_m = R.mask(np.array([(-10, y0), (W + 10, y0), (W + 10, H + 10), (-10, H + 10)], float))
    a = sea_m.to((0, 0, R.w, R.h))[..., None]
    if R.style == "album":
        br = value_noise(R.h, R.w, 26 * R.S, 91, octaves=3, stretch=(6, 0.5))
        col = col * (1 + 0.12 * (br[..., None] - 0.5))
    if streaks != "seuls":
        R.img = R.img * (1 - a) + col * a
    # ligne d'horizon claire
    hz = R.mask(np.array([(-10, y0 - 1), (W + 10, y0 - 1), (W + 10, y0 + 3), (-10, y0 + 3)], float))
    if streaks != "seuls":
        R.paint(hz, "#D9F2F2", Mat(flat=True))
    if streaks == "sans":
        return
    # reflets : traits horizontaux clairs
    r = rng(5)
    for i in range(70):
        yy = y0 + 12 + (r.random() ** 1.6) * (H - y0 - 20)
        if isl_mask is not None:
            pass
        xx = r.random() * W
        ln = 12 + 34 * (yy - y0) / (H - y0) * r.random() + 8
        thick = 1.2 + 2.2 * (yy - y0) / (H - y0)
        m = R.line_mask([(xx, yy), (xx + ln / 2, yy - 0.8), (xx + ln, yy)], thick)
        c = "#BFEFF0" if R.style == "album" else "#D8F7F7"
        R.paint(m, c, Mat(flat=True))

# ============================================================================ île
ISL = [(70, 548), (92, 470), (150, 404), (262, 350), (420, 314), (600, 298), (790, 304), (958, 328), (1066, 376),
       (1128, 450), (1134, 530), (1100, 604), (1030, 662), (930, 704), (760, 738), (600, 752),
       (440, 746), (300, 718), (190, 672), (112, 618)]

def island(R):
    top = catmull(ISL, n=16)
    top_m = R.mask(top)
    side_m = m_union(*[m_shift(top_m, 0, dy * R.S) for dy in (10, 20, 30, 38)])
    st = R.style
    # eau peu profonde autour
    if st != "papier":
        halo = m_grow(side_m, 34 * R.S).padded(int(56 * R.S))
        halo.a = cv2.GaussianBlur(halo.a, (0, 0), 16 * R.S)
        R.paint(halo, "#8FDCD9", Mat(flat=True))
        foam = m_wobble(m_grow(side_m, 7 * R.S), 2.0 * R.S, 18 * R.S, seed=70).padded(int(6 * R.S))
        foam.a = cv2.GaussianBlur(foam.a, (0, 0), 1.2 * R.S)
        R.paint(foam, "#F2FBF8", Mat(flat=True))
    else:
        foam = m_wobble(m_grow(side_m, 9 * R.S), 1.2 * R.S, 12 * R.S, seed=71)
        R.cast(foam, 1, 3, 2.5, 0.22)
        R.paint(foam, "#F4FAF6", Mat(puff=2, profile="pillow", tex=1.0))
    # flanc (terre et sable), plus sombre vers le bas
    def side_alb(x, y, base):
        t = np.clip((y - 520) / 260, 0, 1)[..., None]
        return mix(L("#E2B47C"), L("#B97F4C"), t)
    if st == "papier":
        side_m = m_wobble(side_m, 0.8 * R.S, 10 * R.S, seed=72)
        R.cast(side_m, 2, 4, 3, 0.30)
        R.paint(side_m, "#C99060", Mat(puff=2.4, profile="pillow", tex=1.0))
        # strates du flanc
        for i, dy in enumerate((14, 26)):
            strata = m_clip(m_wobble(m_shift(top_m, 0, dy * R.S), 0.9 * R.S, 9 * R.S, seed=80 + i), side_m)
            R.cast(strata, 0, -1.5, 1.5, 0.18, clip=side_m)
            R.paint(strata, ["#D6A06C", "#B67B49"][i], Mat(puff=2, profile="pillow", tex=1.0))
    else:
        strata = []
        for i, dy in enumerate((13, 24)):
            band = m_sub(m_wobble(m_shift(top_m, 0, dy * R.S), 1.6 * R.S, 26 * R.S, seed=81 + i), m_shift(top_m, 0, (dy - 2.2) * R.S))
            strata.append(m_clip(band, side_m))
        R.paint(side_m, "#C99060", Mat(puff=14, profile="pillow", line_w=2.0, tex=0.8), albedo=side_alb,
                decal=[(m_union(*strata), "#A8703F", 0.6)])
    # dessus : sable puis herbe
    if st == "papier":
        top_m = m_wobble(top_m, 0.8 * R.S, 10 * R.S, seed=73)
        R.cast(top_m, 1, 2.5, 2, 0.25)
    R.paint(top_m, "#F3DDAF", Mat(puff=10 if st != "papier" else 2.4, profile="pillow", line_w=1.8, tex=0.8))
    grass = m_grow(R.mask(catmull(ISL, n=16)), -30 * R.S)
    grass = m_shift(grass, 0, -6 * R.S)
    grass = m_wobble(grass, 9.0 * R.S, 60 * R.S, seed=74)
    grass = m_wobble(grass, 2.5 * R.S, 14 * R.S, seed=75)
    def grass_alb(x, y, base):
        n = R.crop(R.mottle, (int(x[0, 0] * R.S), int(y[0, 0] * R.S), int(x[0, 0] * R.S) + x.shape[1], int(y[0, 0] * R.S) + x.shape[0]))
        t = np.clip((y - 330) / 380, 0, 1)[..., None]
        c = mix(L("#9BD27A"), L("#7CC062"), t)
        return c * (1 + 0.10 * (n[..., None] - 0.5))
    if st == "papier":
        R.cast(grass, 1, 3, 2.2, 0.26)
        R.paint(grass, "#93CD72", Mat(puff=2.4, profile="pillow", tex=1.0))
        # deux collines de papier
        for i, pts in enumerate(([(260, 470), (330, 420), (470, 396), (600, 404), (640, 440), (560, 470)],
                                 [(640, 610), (760, 580), (900, 590), (960, 630), (860, 660), (720, 660)])):
            hm = m_wobble(R.mask(catmull(pts)), 1.0 * R.S, 10 * R.S, seed=90 + i)
            R.cast(hm, 1, 2.5, 2, 0.20)
            R.paint(hm, "#A6D886", Mat(puff=2.2, profile="pillow", tex=1.0))
    else:
        R.paint(grass, "#8FCB6E", Mat(puff=16, profile="pillow", line=False, tex=0.9), albedo=grass_alb)
        # petites touffes d'herbe
        r = rng(11)
        tufts = []
        for i in range(34):
            x = 190 + r.random() * 860
            y = 350 + r.random() * 330
            for bx, h, lean in ((-3, 7, -2), (0, 10, 0), (3, 7, 2)):
                tufts.append(R.line_mask([(x + bx, y), (x + bx + lean * 0.5, y - h * 0.5), (x + bx + lean, y - h)], 1.1))
        tm = m_clip(m_union(*tufts), grass)
        R.paint(tm, "#74B85A", Mat(flat=True))
    return top_m

def path(R):
    segs = [([(196, 760), (236, 700), (292, 640), (330, 590)], 15),
            ([(300, 620), (400, 612), (500, 630), (560, 640)], 13),
            ([(470, 624), (560, 590), (660, 566), (720, 548)], 12)]
    ms = []
    for c, w in segs:
        line = stroke_pts(c, n=12)
        ms.append(R.mask(ribbon(line, np.linspace(w * 1.15, w * 0.85, len(line)))))
    m = m_fuse(m_union(*ms), 3 * R.S)
    m = m_wobble(m, 1.2 * R.S, 10 * R.S, seed=55)
    if R.style == "papier":
        R.cast(m, 1, 2, 1.6, 0.20)
        R.paint(m, "#EBD3A4", Mat(puff=2, profile="pillow", tex=1.0))
    else:
        R.paint(m, "#EAD3A2", Mat(puff=5, profile="pillow", line=False, tex=0.9),
                decal=[(m_grow(m, -4 * R.S), "#F1DDB2", 3)])
    # cailloux plats
    r = rng(3)
    for i in range(14):
        t = r.random()
        x, y = 240 + t * 460 + r.normal(0, 8), 600 + r.normal(0, 22)
        sm = R.mask(ellipse(x, y, 5 + r.random() * 3, 3 + r.random() * 1.5))
        part(R, m_clip(sm, m), "#D2BC92", Mat(puff=2, line=False), shadow=False)

# ============================================================================ végétation
def bush(R, x, y, s=1.0, c="#5FB04F", seed=1, flowers=None):
    r = rng(seed)
    blobs = [(0, 0, 26), (-24, 8, 18), (24, 8, 19), (-10, -14, 18), (12, -16, 17)]
    ground_shadow(R, x + 4 * s, y + 16 * s, 40 * s, 9 * s, 0.25)
    ms = [R.mask(circle(x + bx * s, y + by * s, br * s * (0.9 + 0.2 * r.random()))) for bx, by, br in blobs]
    m = m_union(*ms)
    m = m_sub(m, R.mask(np.array([(x - 60 * s, y + 16 * s), (x + 60 * s, y + 16 * s), (x + 60 * s, y + 60 * s), (x - 60 * s, y + 60 * s)])))
    hi = R.mask(ellipse(x - 10 * s, y - 12 * s, 16 * s, 9 * s, -20))
    part(R, m, c, Mat(puff=14 * s, line_w=1.6, tex=1.0, spec=0.05), decal=[(hi, tweak(L(c), dl=0.07, sat=1.05), 5)])
    if flowers:
        for i in range(4):
            fx, fy = x + (r.random() - 0.5) * 50 * s, y - 4 * s + (r.random() - 0.5) * 22 * s
            flower(R, fx, fy, 4.2 * s, flowers)

def flower(R, x, y, r=5.0, c="#FF7F50"):
    pet = []
    for k in range(5):
        a = math.radians(k * 72 - 90)
        pet.append(R.mask(circle(x + math.cos(a) * r * 0.75, y + math.sin(a) * r * 0.75, r * 0.62)))
    m = m_union(*pet)
    part(R, m, c, Mat(puff=2.5, line_w=0.9, tex=0.4), shadow=R.style != "album")
    flat(R, R.mask(circle(x, y, r * 0.38)), "#FFD24D")

def flower_stem(R, x, y, c, h=18, seed=0):
    flat(R, R.line_mask([(x, y), (x + 1, y - h / 2), (x, y - h)], 1.6), "#4E9A3E")
    lm = R.mask(leaf((x, y - 5), (x + 9, y - 11), 5))
    part(R, lm, "#5FAE4C", Mat(puff=2, line_w=0.8), shadow=False)
    flower(R, x, y - h, 5.5, c)

def round_tree(R, x, y, s=1.0, seed=1, fruit=None):
    ground_shadow(R, x + 10 * s, y + 4 * s, 48 * s, 11 * s, 0.30)
    trunk = R.mask(catmull([(x - 9 * s, y), (x - 6 * s, y - 50 * s), (x - 10 * s, y - 70 * s), (x + 10 * s, y - 70 * s), (x + 6 * s, y - 50 * s), (x + 9 * s, y)]))
    part(R, trunk, "#9A6A44", Mat(puff=6 * s, line_w=1.5, tex=1.0))
    r = rng(seed)
    blobs = [(0, -110, 46), (-38, -86, 34), (38, -88, 36), (-20, -132, 32), (22, -134, 30), (0, -78, 34)]
    ms = [R.mask(circle(x + bx * s, y + by * s, br * s * (0.92 + 0.16 * r.random()))) for bx, by, br in blobs]
    m = m_union(*ms)
    hi = R.mask(ellipse(x - 18 * s, y - 128 * s, 26 * s, 16 * s, -25))
    part(R, m, "#4FA74E", Mat(puff=22 * s, line_w=1.8, tex=1.0, spec=0.04), decal=[(hi, "#7CC46A", 7)])
    if fruit:
        for k in range(6):
            fx = x + (r.random() - 0.5) * 70 * s
            fy = y - 90 * s - r.random() * 50 * s
            part(R, R.mask(circle(fx, fy, 5.5 * s)), fruit, Mat(puff=4, spec=0.4, shin=30, line_w=1.0), shadow=False)

def palm(R, x, y, s=1.0, lean=12, seed=1, flip=False, part_="tout"):
    sg = -1 if flip else 1
    if part_ != "palmes":
        ground_shadow(R, x + 16 * s, y + 4 * s, 34 * s, 8 * s, 0.28)
    top = (x + sg * lean * s * 2.4, y - 168 * s)
    line = stroke_pts([(x, y), (x + sg * lean * s * 0.6, y - 60 * s), (x + sg * lean * s * 1.6, y - 120 * s), top], n=10)
    trunk = R.mask(ribbon(line, np.linspace(9 * s, 6 * s, len(line))))
    rings = []
    for i in range(3, len(line) - 1, 3):
        p = line[i]
        rings.append(R.line_mask([(p[0] - 9 * s, p[1] + 1), (p[0], p[1] + 3 * s), (p[0] + 9 * s, p[1] + 1)], 1.3 * s))
    if part_ != "palmes":
        part(R, trunk, "#B5824F", Mat(puff=6 * s, line_w=1.5, tex=1.0), decal=[(m_clip(m_union(*rings), trunk), "#8E5F37", 0.5)])
    if part_ == "tronc":
        return
    # palmes
    fr = []
    for ang, ln, droop in ((-160, 92, 26), (-125, 78, 18), (-90, 60, 6), (-55, 80, 18), (-20, 94, 28), (180, 70, 30), (0, 72, 30)):
        a = math.radians(ang)
        tip = (top[0] + math.cos(a) * ln * s, top[1] + math.sin(a) * ln * s + droop * s)
        mid = (top[0] + math.cos(a) * ln * 0.55 * s, top[1] + math.sin(a) * ln * 0.55 * s - 8 * s)
        cl = stroke_pts([top, mid, tip], n=10)
        n = len(cl)
        wd = np.sin(np.linspace(0.15, math.pi * 0.92, n)) * 13 * s
        fm = R.mask(ribbon(cl, wd))
        # découpes des folioles
        cuts = []
        for k in range(3, n - 2, 2):
            p = cl[k]
            dd = cl[k + 1] - cl[k - 1]
            dd = dd / (np.linalg.norm(dd) + 1e-9)
            nn = np.array([-dd[1], dd[0]])
            for sd in (1, -1):
                q = p + nn * sd * wd[k] * 1.05
                cuts.append(R.line_mask([tuple(p + nn * sd * wd[k] * 0.45 + dd * 2 * s), tuple(q - dd * 3 * s)], 1.1 * s, smooth_it=False))
        if cuts:
            fm = m_sub(fm, m_union(*cuts))
        rib = R.line_mask([tuple(p) for p in cl[::3]], 1.2 * s)
        fr.append((fm, rib))
    for fm, rib in fr:
        part(R, fm, "#47A353", Mat(puff=4 * s, line_w=1.2, tex=1.0, spec=0.05), decal=[(m_clip(rib, fm), "#2F8241", 0.3)])
    for dx, dy in ((-6, 8), (6, 9), (0, 14)):
        part(R, R.mask(circle(top[0] + dx * s, top[1] + dy * s, 6.5 * s)), "#8A5A33", Mat(puff=4, spec=0.2, line_w=1.0))

def rock(R, x, y, rx, ry, c="#B9B3A8", seed=0):
    r = rng(seed)
    pts = [(x + math.cos(t) * rx * (0.85 + 0.25 * r.random()), y + math.sin(t) * ry * (0.85 + 0.2 * r.random())) for t in np.linspace(0, 2 * math.pi, 8, endpoint=False)]
    m = R.mask(catmull(pts))
    m = m_sub(m, R.mask(np.array([(x - rx * 2, y + ry * 0.55), (x + rx * 2, y + ry * 0.55), (x + rx * 2, y + ry * 3), (x - rx * 2, y + ry * 3)])))
    ground_shadow(R, x + 3, y + ry * 0.5, rx * 1.1, ry * 0.35, 0.25, dx=3, blur=3)
    part(R, m, c, Mat(puff=min(rx, ry) * 0.9, line_w=1.3, tex=1.0, spec=0.05), shadow=False)

# ============================================================================ marché de Basile
def stall(R, cx=318, cy=470, arm="avec"):
    st = R.style
    wood, wood_d, wood_l = "#C98D58", "#9E6538", "#E0AE78"
    ground_shadow(R, cx + 18, cy + 92, 132, 18, 0.32, dx=10, blur=7)
    # poteaux arrière
    for px in (cx - 112, cx + 112):
        part(R, R.mask(rrect(px - 6, cy - 150, 12, 232, 5)), wood_d, Mat(puff=5, line_w=1.4, tex=1.0))
    # Basile derrière le comptoir
    basile(R, cx + 2, cy + 4, 0.8, wave=True, full=False, arm=arm)
    # comptoir : dessus + façade en planches
    topf = R.mask(np.array([(cx - 128, cy + 10), (cx + 128, cy + 10), (cx + 136, cy + 26), (cx - 136, cy + 26)], float))
    front = R.mask(rrect(cx - 136, cy + 24, 272, 70, 6))
    planks = [R.line_mask([(cx - 136, cy + 24 + k * 17.5), (cx + 136, cy + 24 + k * 17.5)], 1.4, smooth_it=False) for k in (1, 2, 3)]
    nails = [R.mask(circle(cx + sx, cy + 33 + k * 17.5, 1.6)) for sx in (-122, 122) for k in range(4)]
    part(R, front, wood, Mat(puff=8, profile="pillow", line_w=1.8, tex=1.0, spec=0.03),
         decal=[(m_clip(m_union(*planks), front), wood_d, 0.4), (m_union(*nails), "#6E4426", 0.0)])
    part(R, topf, wood_l, Mat(puff=4, profile="pillow", line_w=1.4, tex=1.0))
    # cagettes de fruits
    def crate(x, y, w, fruit, fc, n_row=(4, 3), fr=7.5):
        cm = R.mask(rrect(x - w / 2, y - 18, w, 24, 3))
        part(R, cm, "#D9A56C", Mat(puff=4, profile="pillow", line_w=1.3, tex=1.0),
             decal=[(R.line_mask([(x - w / 2, y - 6), (x + w / 2, y - 6)], 1.2, smooth_it=False), "#A9713F", 0)])
        r = rng(int(x))
        for row, cnt in enumerate(n_row):
            for k in range(cnt):
                fx = x - (cnt - 1) * fr * 1.0 + k * fr * 2.0 + (r.random() - 0.5) * 2
                fy = y - 20 - row * fr * 1.35
                fm = R.mask(circle(fx, fy, fr))
                part(R, fm, fc, Mat(puff=fr * 0.9, spec=0.45, shin=26, line_w=1.0, rim=0.25), shadow=st != "album",
                     decal=[(R.mask(circle(fx - fr * 0.35, fy - fr * 0.35, fr * 0.35)), tweak(L(fc), dl=0.08), 1.2)])
                if fruit == "pomme":
                    flat(R, R.line_mask([(fx, fy - fr * 0.8), (fx + 1, fy - fr * 1.25)], 1.2, smooth_it=False), "#6B4A2E")
    crate(cx - 92, cy + 8, 74, "pomme", "#E5483F")
    crate(cx + 94, cy + 8, 70, "orange", "#FFA235", n_row=(3, 2), fr=8.5)
    # poires posées devant Basile
    for k, (fx, fy) in enumerate(((cx - 20, cy + 4), (cx - 4, cy + 6), (cx + 13, cy + 4))):
        pm = R.mask(catmull([(fx, fy - 12), (fx + 5, fy - 4), (fx + 7, fy + 4), (fx, fy + 8), (fx - 7, fy + 4), (fx - 5, fy - 4)]))
        part(R, pm, "#B8D35A", Mat(puff=6, spec=0.4, shin=26, line_w=1.0, rim=0.25), shadow=R.style != "album",
             decal=[(R.mask(circle(fx - 2.5, fy - 1, 3)), "#D3E585", 1.0)])
    # auvent rayé, bord festonné
    aw_top = cy - 176
    canopy = R.mask(np.array([(cx - 132, aw_top), (cx + 132, aw_top), (cx + 152, aw_top + 54), (cx - 152, aw_top + 54)], float))
    scallops = [R.mask(circle(cx - 152 + 19 + k * 38, aw_top + 54, 19)) for k in range(8)]
    aw = m_union(canopy, *scallops)
    stripes = []
    for k in range(8):
        if k % 2 == 0:
            x0 = cx - 152 + k * 38
            stripes.append(R.mask(np.array([(x0 + (k * 38) * 0 + 20 - 20 * 0.0 - 2, aw_top), (x0 + 38 - 2, aw_top), (x0 + 38, aw_top + 80), (x0, aw_top + 80)], float)))
    stripe_m = m_clip(m_union(*stripes), aw)
    part(R, aw, "#FFF6E8", Mat(puff=12, profile="pillow", line_w=1.7, tex=0.8, spec=0.03), decal=[(stripe_m, "#E8574A", 0.0)])
    # enseigne ardoise « 1 2 3 »
    sign = R.mask(rrect(cx + 150, cy - 64, 66, 46, 8))
    part(R, R.mask(rrect(cx + 178, cy - 20, 8, 112, 3)), wood_d, Mat(puff=4, line_w=1.2, tex=1.0))
    part(R, sign, "#3B4A4F", Mat(puff=5, profile="pillow", line_w=1.6, tex=1.0), decal=[])
    tm = text_mask(R, "1 2 3", cx + 183, cy - 41, 21)
    flat(R, tm, "#F4F1E6")

# ============================================================================ étang aux nénuphars
def pond(R, cx=842, cy=496, with_frog=True):
    st = R.style
    rim = R.mask(catmull([(cx - 196, cy + 6), (cx - 160, cy - 62), (cx - 40, cy - 92), (cx + 100, cy - 86), (cx + 190, cy - 44), (cx + 200, cy + 24), (cx + 120, cy + 82), (cx - 40, cy + 92), (cx - 160, cy + 64)]))
    water = m_grow(rim, -9 * R.S)
    # berge
    part(R, rim, "#D7C08C", Mat(puff=6, profile="pillow", line_w=1.6, tex=1.0), shadow=False)
    def water_alb(x, y, base):
        t = np.clip((y - (cy - 90)) / 180, 0, 1)[..., None]
        c = mix(L("#3FA7C0"), L("#68C4CF"), t)
        d = np.sqrt(((x - cx) / 190) ** 2 + ((y - cy) / 90) ** 2)[..., None]
        return mix(c, L("#2B8FAE"), np.clip(1 - d, 0, 1) * 0.35)
    if st == "papier":
        R.cast(water, 0, 2, 2, 0.30, clip=rim)
        R.paint(water, "#4FB3C6", Mat(puff=2, profile="pillow", tex=1.0))
        inner = m_wobble(m_grow(water, -18 * R.S), 1.0 * R.S, 10 * R.S, seed=77)
        R.cast(inner, 0, 2, 1.5, 0.18, clip=water)
        R.paint(inner, "#3D9EB8", Mat(puff=2, profile="pillow", tex=1.0))
    else:
        R.cast(water, 0, 3, 3, 0.35, clip=rim)
        R.paint(water, "#4FB3C6", Mat(puff=8, profile="pillow", line=False, spec=0.0, tex=0.6), albedo=water_alb)
        # reflets du ciel
        for (x0, y0, ln) in ((cx - 110, cy - 50, 60), (cx + 30, cy - 64, 80), (cx - 40, cy + 40, 50), (cx + 110, cy + 20, 40)):
            flat(R, m_clip(R.line_mask([(x0, y0), (x0 + ln / 2, y0 - 1), (x0 + ln, y0)], 2.2), water), "#9FE0E4")
    # roseaux et massettes au fond à droite
    for k, (rx, h) in enumerate(((cx + 150, 70), (cx + 166, 88), (cx + 182, 62), (cx - 176, 54), (cx - 162, 70))):
        by = cy - 30 if rx > cx else cy - 12
        flat(R, R.line_mask([(rx, by), (rx + 2, by - h * 0.5), (rx + 1, by - h)], 2.2), "#4F8F3A")
        part(R, R.mask(rrect(rx - 3.5, by - h - 2, 7, 22, 3.5)), "#8B5A35", Mat(puff=3, line_w=1.0, tex=0.8), shadow=False)
        lm = R.mask(leaf((rx, by), (rx + (10 if k % 2 else -10), by - h * 0.7), 6, 0.1))
        part(R, lm, "#5EA246", Mat(puff=2, line_w=0.9), shadow=False)
    # nénuphars numérotés : un chemin de 1 à 5
    pads = [(cx - 118, cy + 24, 30), (cx - 52, cy - 14, 28), (cx + 14, cy + 22, 29), (cx + 78, cy - 18, 27), (cx + 136, cy + 18, 26)]
    for i, (px, py, pr) in enumerate(pads):
        pm = R.mask(ellipse(px, py, pr, pr * 0.58))
        notch = R.mask(np.array([(px, py), (px + pr * 1.2, py - pr * 0.25), (px + pr * 1.2, py + pr * 0.15)], float))
        pm = m_sub(pm, notch)
        veins = [R.line_mask([(px, py), (px + math.cos(a) * pr * 0.85, py + math.sin(a) * pr * 0.5)], 1.0, smooth_it=False) for a in np.linspace(0.5, 2 * math.pi - 0.3, 7)]
        R.cast(pm, 2, 3, 2.5, 0.28, clip=water)
        part(R, pm, "#5DB54C", Mat(puff=5, profile="pillow", line_w=1.3, tex=0.9, spec=0.08), shadow=False,
             decal=[(m_clip(m_union(*veins), pm), "#4A9A3C", 0.3)])
        tm = text_mask(R, str(i + 1), px - 3, py - 1, 22)
        flat(R, tm, "#FFFDF4")
    # fleurs de lotus roses
    for (fx, fy) in ((cx + 100, cy + 58), (cx - 150, cy - 30)):
        for k in range(6):
            a = math.radians(-90 + (k - 2.5) * 30)
            pt = R.mask(leaf((fx, fy), (fx + math.cos(a) * 12, fy + math.sin(a) * 12 * 0.9), 7))
            part(R, pt, "#F6A3C0", Mat(puff=3, line_w=0.9, tex=0.5), shadow=False)
        flat(R, R.mask(circle(fx, fy - 2, 3)), "#FFD24D")
    # grenouille au départ
    if with_frog:
        frog(R, cx - 196, cy + 14, 0.62)
    return pads

# ============================================================================ goûter
def picnic(R, cx=560, cy=660):
    st = R.style
    quad = np.array([(cx - 128, cy - 44), (cx + 118, cy - 50), (cx + 150, cy + 46), (cx - 152, cy + 52)], float)
    blanket = R.mask(quad)
    ground_shadow(R, cx + 6, cy + 6, 150, 50, 0.18, dx=8, blur=6)
    # vichy en perspective : coordonnées (u, v) dans le quadrilatère
    def vichy(x, y, base):
        p0, p1, p2, p3 = quad
        v = np.clip((y - (cy - 47)) / 98, 0, 1)
        left = p0[0] + (p3[0] - p0[0]) * v
        right = p1[0] + (p2[0] - p1[0]) * v
        u = (x - left) / (right - left)
        a = (np.floor(u * 7) % 2).astype(np.float32)
        b = (np.floor(v * 4) % 2).astype(np.float32)
        k = (a + b)[..., None]
        c0, c1, c2 = L("#FFF4EA"), L("#F7B4A2"), L("#EF8A73")
        return np.where(k < 0.5, c0, np.where(k < 1.5, c1, c2))
    part(R, blanket, "#F7B4A2", Mat(puff=6, profile="pillow", line_w=1.6, tex=0.9), albedo=vichy, shadow=False)
    # assiettes et biscuits
    for i, (px, py) in enumerate(((cx - 64, cy - 6), (cx + 10, cy - 14), (cx + 84, cy - 4))):
        plate = R.mask(ellipse(px, py, 30, 15))
        part(R, plate, "#FFFFFF", Mat(puff=6, profile="pillow", line_w=1.3, spec=0.2, shin=30),
             decal=[(R.mask(ellipse(px, py, 20, 9.5)), "#E9EEF2", 1.0)])
        for k in range(2 + i % 2):
            bx, by = px - 10 + k * 10, py - 2 - (k % 2) * 3
            bm = R.mask(ellipse(bx, by, 8.5, 5.5))
            chips = [R.mask(circle(bx + dx, by + dy, 1.4)) for dx, dy in ((-3, -1), (2, 1), (3, -2), (-1, 2))]
            part(R, bm, "#D99A57", Mat(puff=4, line_w=1.0, tex=1.0, spec=0.05), shadow=False, decal=[(m_union(*chips), "#6B3F22", 0.0)])
    # panier en osier
    bx, by = cx - 138, cy - 30
    handle = R.line_mask([(bx - 24, by - 4), (bx - 18, by - 34), (bx + 18, by - 34), (bx + 24, by - 4)], 4.0)
    part(R, handle, "#B07B45", Mat(puff=2, line_w=1.0, tex=1.0), shadow=False)
    basket = R.mask(catmull([(bx - 32, by - 6), (bx + 32, by - 6), (bx + 26, by + 22), (bx - 26, by + 22)]))
    weave = [R.line_mask([(bx - 32, by + k * 7), (bx + 32, by + k * 7)], 1.1, smooth_it=False) for k in range(0, 4)]
    ground_shadow(R, bx + 6, by + 22, 34, 7, 0.3, dx=4, blur=3)
    part(R, basket, "#D8A15C", Mat(puff=8, profile="pillow", line_w=1.5, tex=1.0), shadow=False, decal=[(m_clip(m_union(*weave), basket), "#B07B45", 0.3)])
    cloth = R.mask(catmull([(bx - 20, by - 6), (bx - 6, by - 16), (bx + 14, by - 12), (bx + 22, by - 6)]))
    part(R, cloth, "#EF8A73", Mat(puff=3, line_w=1.0, tex=0.8), shadow=False)
    # bocal de biscuits
    jx, jy = cx + 156, cy - 22
    ground_shadow(R, jx + 4, jy + 26, 20, 5, 0.3, dx=3, blur=3)
    jar = R.mask(rrect(jx - 17, jy - 20, 34, 46, 9))
    part(R, jar, "#D6EEF3", Mat(puff=6, profile="pillow", line_w=1.2, spec=0.6, shin=40), shadow=False,
         decal=[(R.mask(circle(jx - 6, jy + 6, 8)), "#D99A57", 0.0), (R.mask(circle(jx + 7, jy + 13, 7.5)), "#C98A4A", 0.0), (R.mask(circle(jx + 2, jy - 6, 7)), "#D99A57", 0.0)])
    part(R, R.mask(rrect(jx - 15, jy - 28, 30, 10, 4)), "#E8574A", Mat(puff=3, profile="pillow", line_w=1.0), shadow=False)

# ============================================================================ ponton et bateau
def dock_boat(R, part_="tout"):
    st = R.style
    # ponton
    deck = R.mask(np.array([(196, 694), (226, 704), (168, 790), (136, 780)], float))
    if part_ == "bateau":
        _boat(R)
        return
    for (px, py) in ((140, 790), (170, 800), (186, 740)):
        part(R, R.mask(rrect(px - 4, py - 16, 8, 30, 3)), "#8E5F37", Mat(puff=3, line_w=1.0, tex=1.0))
    planks = [R.line_mask([(200 - k * 8.6, 698 + k * 12.4), (228 - k * 8.6, 708 + k * 12.4)], 1.2, smooth_it=False) for k in range(1, 8)]
    part(R, deck, "#C99A68", Mat(puff=3, profile="pillow", line_w=1.3, tex=1.0), decal=[(m_clip(m_union(*planks), deck), "#9E6E42", 0.3)])
    if part_ == "ponton":
        return
    _boat(R)

def _boat(R):
    st = R.style
    bx, by = 82, 760
    hull = R.mask(catmull([(bx - 46, by - 10), (bx + 50, by - 12), (bx + 36, by + 12), (bx - 32, by + 12)]))
    if st != "papier":
        refl = R.mask(ellipse(bx, by + 18, 48, 6))
        R.cast(refl, 0, 0, 4, 0.25)
    part(R, R.mask(rrect(bx - 2, by - 88, 4, 80, 2)), "#8E5F37", Mat(puff=2, line_w=0.8))
    sail = R.mask(np.array([(bx + 4, by - 86), (bx + 44, by - 18), (bx + 4, by - 16)], float))
    part(R, sail, "#FFF4E2", Mat(puff=6, profile="pillow", line_w=1.3, tex=0.8))
    flag = R.mask(np.array([(bx - 2, by - 92), (bx - 26, by - 84), (bx - 2, by - 78)], float))
    part(R, flag, "#1FA9B5", Mat(puff=2, line_w=1.0), shadow=False)
    part(R, hull, "#FF7F50", Mat(puff=8, profile="pillow", line_w=1.5, tex=0.8, spec=0.1),
         decal=[(R.mask(rrect(bx - 50, by - 12, 104, 6, 2)), "#FFF4E2", 0.0)])

# ============================================================================ scène complète
def island_scene(R, plume_pose="montre"):
    sky(R)
    if R.style == "papier":
        sun(R, 300, 70)
    for (x, y, s, sd) in ((150, 112, 1.0, 1), (820, 96, 0.72, 2), (1040, 150, 0.85, 3)):
        cloud(R, x, y, s, sd)
    far_islands(R)
    if R.style == "volume":
        R.blur(1.6)
    sea(R, None)
    island(R)
    path(R)
    # arrière-plan de l'île
    round_tree(R, 486, 356, 0.95, seed=4, fruit="#E5483F")
    bush(R, 1020, 420, 0.7, "#56A84A", seed=12)
    bush(R, 560, 392, 0.9, seed=6, flowers="#FF7F50")
    bush(R, 650, 380, 0.75, "#56A84A", seed=7)
    # rochers sur le rivage
    for (x, y, rx, ry, sd) in ((96, 520, 20, 14, 21), (120, 536, 13, 9, 22), (1120, 560, 18, 12, 23), (1000, 650, 15, 10, 24)):
        rock(R, x, y, rx, ry, seed=sd)
    stall(R)
    pond(R)
    picnic(R)
    # premier plan
    palm(R, 1078, 500, 1.05, lean=-14, seed=8)
    palm(R, 122, 598, 0.92, lean=-10, seed=9)
    bush(R, 960, 628, 0.95, seed=10, flowers="#E85D9A")
    bush(R, 250, 650, 0.8, "#56A84A", seed=11, flowers="#FFC145")
    for (fx, fy, c) in ((402, 690, "#FF7F50"), (720, 702, "#FFC145"), (700, 418, "#E85D9A"), (990, 560, "#FF7F50"), (200, 612, "#E85D9A")):
        flower_stem(R, fx, fy, c)
    rock(R, 860, 666, 14, 10, seed=3)
    butterfly(R, 566, 468, "#FFC145", 1.0)
    butterfly(R, 700, 606, "#8C6BE0", 0.85, flip=True)
    for (fx, fy, c) in ((612, 450, "#FFC145"), (520, 560, "#FF7F50"), (1040, 560, "#FFC145"), (180, 640, "#FF7F50")):
        flower_stem(R, fx, fy, c, h=14)
    rock(R, 300, 696, 11, 8, seed=4)
    dock_boat(R)
    ground_shadow(R, 742, 432, 34, 7, 0.16, dx=4, blur=6)
    plume(R, 726, 330, 0.58, pose=plume_pose)
