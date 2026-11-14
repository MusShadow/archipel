import math, random

INK = "#273043"
GREY = "#5B6475"
CREAM = "#FFF7EA"
LINE = "#E4D9C5"
WHITE = "#FFFFFF"
TURQ = "#1FA9B5"
TURQ_D = "#12737B"
PINK = "#E85D9A"

def st(**kw):
    return "; ".join(f"{k.replace('_', '-')}: {v}" for k, v in kw.items())

def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".") if isinstance(v, float) else str(v)

def circle(cx, cy, r, **s):
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" style="{st(**s)}"></circle>'

def ellipse(cx, cy, rx, ry, rot=None, **s):
    t = f' transform="rotate({f(rot)} {f(cx)} {f(cy)})"' if rot is not None else ""
    return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}"{t} style="{st(**s)}"></ellipse>'

def path(d, **s):
    return f'<path d="{d}" style="{st(**s)}"></path>'

def poly(points, **s):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return f'<polygon points="{pts}" style="{st(**s)}"></polygon>'

def rect(x, y, w, h, rx=0, **s):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(rx)}" style="{st(**s)}"></rect>'

def line(x1, y1, x2, y2, **s):
    return f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" style="{st(**s)}"></line>'

def group(inner, transform=None):
    t = f' transform="{transform}"' if transform else ""
    return f"<g{t}>{inner}</g>"

def star_points(cx, cy, n, R, r, rot=-90):
    pts = []
    for i in range(2 * n):
        a = math.radians(rot + i * 180 / n)
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts

def blob_path(cx, cy, rx, ry, seed, n=10, jitter=0.12, scale=1.0, dy=0.0):
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = (1 + rnd.uniform(-jitter, jitter)) * scale
        pts.append((cx + rx * k * math.cos(a), cy + dy + ry * k * math.sin(a)))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + " Z"

# ---------- Character faces (viewBox 0 0 84 84) ----------
def face_plume():
    return "".join([
        ellipse(33, 22, 3.5, 8, -20, fill=PINK),
        ellipse(40, 21, 3, 7, 10, fill=PINK),
        circle(38, 44, 22, fill=TURQ),
        ellipse(49, 58, 10, 6, -15, fill=PINK),
        poly([(57, 43), (80, 40), (58, 49)], fill=INK),
        circle(46, 40, 6.5, fill=WHITE),
        circle(47.6, 40.6, 3.8, fill=INK),
        circle(49, 39, 1.3, fill=WHITE),
    ])

def face_basile():
    brown, dark = "#A0673F", "#7A4A2C"
    return "".join([
        circle(24, 26, 8, fill=brown), circle(24, 26, 4, fill=dark),
        circle(60, 26, 8, fill=brown), circle(60, 26, 4, fill=dark),
        circle(42, 46, 25, fill=brown),
        ellipse(42, 57, 14, 10, fill="#E2B48A"),
        rect(37.6, 59, 4.2, 8, 1, fill=WHITE, stroke=INK, stroke_width=1),
        rect(42.2, 59, 4.2, 8, 1, fill=WHITE, stroke=INK, stroke_width=1),
        ellipse(42, 51, 5.5, 3.8, fill=INK),
        circle(33, 40, 3.3, fill=INK), circle(34.2, 38.9, 1, fill=WHITE),
        circle(51, 40, 3.3, fill=INK), circle(52.2, 38.9, 1, fill=WHITE),
    ])

def face_mona():
    body = "#4E7FB0"
    return "".join([
        path("M42 27 Q36 16 29 19 M42 27 Q48 16 55 19 M42 28 L42 14", fill="none", stroke="#5BB8E6", stroke_width=3, stroke_linecap="round"),
        path("M15 54 C9 50 6 44 3 42 C5 50 5 58 3 66 C7 62 10 58 15 56 Z", fill=body),
        path("M10 50 C10 36 24 28 42 28 C60 28 74 38 74 50 C74 62 60 70 42 70 C30 70 20 66 14 60 Z", fill=body),
        path("M24 62 C34 68 54 68 66 60 C58 67 46 70 38 69 C31 68 27 66 24 62 Z", fill="#CFE3F5"),
        circle(58, 46, 3.5, fill=INK), circle(59.2, 45, 1.1, fill=WHITE),
        path("M52 55 Q58 59 64 54", fill="none", stroke=INK, stroke_width=2, stroke_linecap="round"),
    ])

def face_octave():
    g, gd = "#34B37A", "#26895B"
    tents = "".join(path(d, fill="none", stroke=gd, stroke_width=6, stroke_linecap="round") for d in [
        "M28 54 Q20 64 24 72 Q27 76 31 73", "M37 58 Q35 68 39 76",
        "M47 58 Q49 68 45 76", "M56 54 Q64 64 60 72 Q57 76 53 73"])
    return tents + "".join([
        ellipse(42, 40, 22, 21, fill=g),
        line(19, 30, 65, 30, stroke=INK, stroke_width=2.5),
        circle(34, 30, 7, fill="#CFEFFF", stroke=INK, stroke_width=2.5),
        circle(50, 30, 7, fill="#CFEFFF", stroke=INK, stroke_width=2.5),
        circle(35, 44, 3, fill=INK), circle(49, 44, 3, fill=INK),
        path("M37 51 Q42 55 47 51", fill="none", stroke=INK, stroke_width=2, stroke_linecap="round"),
    ])

def face_rico():
    grey, dgrey = "#9AA0B4", "#5B6075"
    return "".join([
        poly([(19, 32), (24, 11), (37, 25)], fill=grey), poly([(23, 28), (25, 17), (32, 25)], fill=dgrey),
        poly([(65, 32), (60, 11), (47, 25)], fill=grey), poly([(61, 28), (59, 17), (52, 25)], fill=dgrey),
        circle(42, 45, 24, fill=grey),
        path("M42 22 L38.5 35 L45.5 35 Z", fill=dgrey),
        path("M18 43 C22 33 34 35 42 41 C50 35 62 33 66 43 C62 51 50 51 42 47 C34 51 22 51 18 43 Z", fill=INK),
        circle(31, 42, 4.2, fill=WHITE), circle(31.8, 42.4, 2.3, fill=INK),
        circle(53, 42, 4.2, fill=WHITE), circle(52.2, 42.4, 2.3, fill=INK),
        ellipse(42, 57, 12, 9, fill="#F4F1EC"),
        ellipse(42, 52.5, 4, 3, fill=INK),
    ])

def face_kiki():
    g, gd = "#7CC36B", "#4E9A44"
    return "".join([
        path("M14 56 C14 38 28 28 44 28 C58 28 70 38 72 50 C66 60 52 66 38 66 C26 66 16 63 14 56 Z", fill=g),
        path("M18 42 C24 28 38 21 52 27", fill="none", stroke=gd, stroke_width=4, stroke_linecap="round"),
        ellipse(36, 23, 14, 6, fill=PINK), circle(36, 16, 2.6, fill=PINK),
        path("M22 52 Q26 48 30 52", fill="none", stroke="#FFC145", stroke_width=2.5, stroke_linecap="round"),
        path("M26 58 Q30 54 34 58", fill="none", stroke="#FFC145", stroke_width=2.5, stroke_linecap="round"),
        circle(52, 44, 10, fill="#9BD98B", stroke=gd, stroke_width=2),
        circle(54.5, 44, 4, fill=INK), circle(56, 42.5, 1.3, fill=WHITE),
        path("M40 59 Q54 62 66 54", fill="none", stroke="#3E7F35", stroke_width=2, stroke_linecap="round"),
    ])

def face_pico():
    return "".join([
        poly(star_points(42, 42, 14, 30, 22), fill="#8A5A3B"),
        circle(28, 40, 4.5, fill="#E8C9A6"), circle(56, 40, 4.5, fill="#E8C9A6"),
        ellipse(42, 51, 18, 16, fill="#F1D7B8"),
        circle(35, 48, 2.8, fill=INK), circle(49, 48, 2.8, fill=INK),
        circle(42, 56, 3.5, fill=INK),
        ellipse(30, 55, 3.5, 2.2, fill="#F49AB8"), ellipse(54, 55, 3.5, 2.2, fill="#F49AB8"),
    ])

FACES = {"plume": face_plume, "basile": face_basile, "mona": face_mona, "octave": face_octave,
         "rico": face_rico, "kiki": face_kiki, "pico": face_pico}
TINTS = {"plume": "#D5F1F3", "basile": "#DCE9FB", "mona": "#FFE2D6", "octave": "#D9F2E5",
         "rico": "#E7E0FA", "kiki": "#FFF0C9", "pico": "#FADCE9"}

def medallion(name, size, ring=None):
    ring_svg = circle(42, 42, 40.5, fill="none", stroke=ring, stroke_width=3) if ring else ""
    inner = group(FACES[name](), "translate(42 42) scale(0.9) translate(-42 -42)")
    return (f'<svg viewBox="0 0 84 84" width="{size}" height="{size}" aria-hidden="true" style="display: block; flex-shrink: 0">'
            f'{circle(42, 42, 41, fill=TINTS[name])}{inner}{ring_svg}</svg>')

# ---------- Icons (viewBox 0 0 24 24, stroke) ----------
ICONS = {
    "home": ['<path d="M3.5 11 L12 4 L20.5 11"></path>', '<path d="M5.5 9.5 V20 H10 V14.5 H14 V20 H18.5 V9.5"></path>'],
    "ear": ['<path d="M6.5 9 A5.75 5.75 0 1 1 18 9 C18 12.5 15 13.5 14.5 16 C14 18.5 12.5 20.5 10.2 20.5 C8.6 20.5 7.4 19.6 6.8 18.3"></path>',
            '<path d="M9.8 9.4 A2.4 2.4 0 0 1 14.6 9.4 C14.6 11 13 11.6 12.6 13"></path>'],
    "book": ['<path d="M4 5.5 C6.5 4.5 9.5 4.5 12 6 C14.5 4.5 17.5 4.5 20 5.5 V19 C17.5 18 14.5 18 12 19.5 C9.5 18 6.5 18 4 19 Z"></path>', '<path d="M12 6 V19.5"></path>'],
    "leaf": ['<path d="M5 19 C5 10 11 5 19 5 C19 13 14 19 5 19 Z"></path>', '<path d="M5 19 L13 11"></path>'],
    "play": ['<path d="M8 5.5 L18 12 L8 18.5 Z"></path>'],
    "grid": ['<path d="M4 4 H10 V10 H4 Z M14 4 H20 V10 H14 Z M4 14 H10 V20 H4 Z M14 14 H20 V20 H14 Z"></path>'],
    "layers": ['<path d="M12 4 L20 8.5 L12 13 L4 8.5 Z"></path>', '<path d="M4 12.5 L12 17 L20 12.5"></path>'],
    "target": ['<circle cx="12" cy="12" r="8"></circle>', '<circle cx="12" cy="12" r="4"></circle>', '<circle cx="12" cy="12" r="0.6"></circle>'],
    "sliders": ['<path d="M5 7 H19 M5 12 H19 M5 17 H19"></path>', '<circle cx="9" cy="7" r="2" style="fill: #FFFFFF"></circle>',
                '<circle cx="15" cy="12" r="2" style="fill: #FFFFFF"></circle>', '<circle cx="11" cy="17" r="2" style="fill: #FFFFFF"></circle>'],
    "wand": ['<path d="M5 19 L15 9"></path>', '<path d="M17 3.5 V7.5 M15 5.5 H19"></path>', '<path d="M19.5 10 V13 M18 11.5 H21"></path>'],
    "tree": ['<path d="M12 21 V14"></path>', '<path d="M12 3 C7 3 5 7 6.5 10 C4.5 12 6 16 9.5 15 C10.5 16.5 13.5 16.5 14.5 15 C18 16 19.5 12 17.5 10 C19 7 17 3 12 3 Z"></path>'],
    "mic": ['<path d="M12 4 A3 3 0 0 1 15 7 V12 A3 3 0 0 1 9 12 V7 A3 3 0 0 1 12 4 Z"></path>', '<path d="M6 11 A6 6 0 0 0 18 11 M12 17 V20 M9 20 H15"></path>'],
    "data": ['<path d="M5 6 C5 4.3 8.1 3 12 3 C15.9 3 19 4.3 19 6 C19 7.7 15.9 9 12 9 C8.1 9 5 7.7 5 6 Z"></path>',
             '<path d="M5 6 V18 C5 19.7 8.1 21 12 21 C15.9 21 19 19.7 19 18 V6 M5 12 C5 13.7 8.1 15 12 15 C15.9 15 19 13.7 19 12"></path>'],
    "plus": ['<path d="M12 5 V19 M5 12 H19"></path>'],
    "lock": ['<path d="M7.5 11 V8 A4.5 4.5 0 0 1 16.5 8 V11"></path>', '<rect x="5" y="11" width="14" height="10" rx="2"></rect>'],
    "chevron": ['<path d="M6 9 L12 15 L18 9"></path>'],
    "check": ['<path d="M5 12.5 L10 17 L19 7.5"></path>'],
    "clock": ['<circle cx="12" cy="12" r="8"></circle>', '<path d="M12 7.5 V12 L15 14"></path>'],
    "sound": ['<path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z"></path>', '<path d="M15.5 9 C17 10.5 17 13.5 15.5 15 M18 6.5 C21 9.5 21 14.5 18 17.5"></path>'],
}

def icon(name, size=32, color=INK, sw=2.2):
    body = "".join(ICONS[name])
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" aria-hidden="true" '
            f'style="display: block; fill: none; stroke: {color}; stroke-width: {sw}; stroke-linecap: round; stroke-linejoin: round">{body}</svg>')

# ---------- Flags ----------
FLAG_BANDS = {"FR": ["#0055A4", "#FFFFFF", "#EF4135"], "IT": ["#009246", "#FFFFFF", "#CE2B37"],
              "ML": ["#14B53A", "#FCD116", "#CE1126"]}

def flag(code, w=216, h=144, label=""):
    inner = ""
    if code in FLAG_BANDS:
        bw = w / 3
        for i, c in enumerate(FLAG_BANDS[code]):
            inner += rect(round(i * bw, 2), 0, round(bw + 0.5, 2), h, fill=c)
    elif code == "JP":
        inner += rect(0, 0, w, h, fill="#FFFFFF") + circle(w / 2, h / 2, round(0.3 * h, 1), fill="#BC002D")
    inner += rect(0.75, 0.75, w - 1.5, h - 1.5, 2, fill="none", stroke="#D8CDB8", stroke_width=1.5)
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{label}" '
            f'style="display: block; border-radius: 4px">{inner}</svg>')

# ---------- Plume variants (viewBox 0 0 300 300) ----------
def plume_a():
    teal_d = "#158A94"
    return "".join([
        ellipse(84, 214, 26, 10, -25, fill=teal_d), ellipse(90, 229, 26, 10, 5, fill=teal_d), ellipse(102, 240, 24, 9, 35, fill=teal_d),
        ellipse(146, 93, 6, 16, -15, fill=PINK), ellipse(160, 96, 5, 13, 18, fill=PINK),
        circle(150, 165, 72, fill=TURQ),
        ellipse(168, 194, 44, 34, fill="#C9F0EF"),
        ellipse(124, 166, 46, 23, -35, fill=teal_d),
        ellipse(198, 180, 19, 12, -20, fill=PINK),
        ellipse(204, 162, 7, 4.5, fill="#FF9DB8"),
        poly([(214, 149), (262, 156), (215, 163)], fill=INK, stroke=INK, stroke_width=2, stroke_linejoin="round"),
        circle(186, 140, 17, fill=WHITE), circle(190, 142, 10, fill=INK),
        circle(194, 137, 3.5, fill=WHITE), circle(186.5, 147.5, 1.6, fill=WHITE),
        line(140, 236, 136, 254, stroke=INK, stroke_width=4, stroke_linecap="round"),
        line(160, 236, 158, 254, stroke=INK, stroke_width=4, stroke_linecap="round"),
        line(129, 254, 142, 254, stroke=INK, stroke_width=4, stroke_linecap="round"),
        line(152, 254, 165, 254, stroke=INK, stroke_width=4, stroke_linecap="round"),
    ])

def plume_b():
    teal_d, teal_l, coral = "#158A94", "#19A0AC", "#FF7F50"
    return "".join([
        path("M140 156 C126 118 104 84 86 64 C118 74 148 106 160 146 Z", fill=teal_l),
        poly([(96, 190), (36, 222), (64, 196)], fill=teal_d),
        poly([(100, 202), (52, 252), (80, 210)], fill=teal_d),
        ellipse(140, 172, 62, 34, -25, fill=TURQ),
        ellipse(150, 186, 40, 16, -25, fill="#C9F0EF"),
        circle(196, 122, 30, fill=TURQ),
        path("M178 150 C160 152 140 140 120 146 C108 150 100 160 92 158 C104 148 112 136 128 132 C144 128 162 140 176 142 Z", fill=coral),
        path("M178 146 C188 154 206 154 216 144 L218 152 C206 162 188 162 176 154 Z", fill=coral),
        path("M150 152 C138 112 120 76 104 50 C136 62 164 98 172 140 Z", fill=teal_d),
        ellipse(208, 138, 13, 7, -20, fill=PINK),
        poly([(222, 118), (292, 109), (223, 127)], fill=INK, stroke=INK, stroke_width=1.5, stroke_linejoin="round"),
        circle(206, 115, 10, fill=WHITE), circle(209, 116, 6, fill=INK), circle(211, 113, 2, fill=WHITE),
    ])

def plume_c():
    shadow = "#0E6168"
    pieces = [
        ("poly", [(96, 196), (40, 220), (78, 182)], "#0F6F78"),
        ("poly", [(100, 206), (54, 250), (92, 194)], "#0F6F78"),
        ("poly", [(92, 200), (176, 118), (230, 152), (190, 220)], TURQ),
        ("poly", [(120, 176), (168, 92), (190, 166)], "#12808A"),
        ("circle", (202, 124, 30), "#26B7C3"),
        ("poly", [(204, 148), (232, 150), (210, 166)], PINK),
        ("poly", [(229, 119), (292, 112), (230, 130)], INK),
    ]
    out = ""
    for kind, geo, color in pieces:  # paper shadow layer first
        if kind == "poly":
            out += poly([(x + 5, y + 5) for x, y in geo], fill=shadow)
        else:
            out += circle(geo[0] + 5, geo[1] + 5, geo[2], fill=shadow)
    for kind, geo, color in pieces:
        if kind == "poly":
            out += poly(geo, fill=color)
        else:
            out += circle(geo[0], geo[1], geo[2], fill=color)
    out += circle(212, 118, 9, fill=WHITE) + circle(214, 118, 5, fill=INK)
    return out

def plume_svg(variant, size=300, bg="#E3F5F6"):
    body = {"a": plume_a, "b": plume_b, "c": plume_c}[variant]()
    return (f'<svg viewBox="0 0 300 300" width="{size}" height="{size}" aria-hidden="true" style="display: block">'
            f'{rect(0, 0, 300, 300, 24, fill=bg)}{body}</svg>')

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&amp;family=Baloo+2:wght@500;600;700;800&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#273043}}a:hover{{color:#12737B}}
button{{font:inherit}}
</style>
</helmet>
"""

def tail(w=1180, h=820):
    return ("</x-dc>\n"
            f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>\n"""
            "class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}\n</script>\n</body>\n</html>\n")
