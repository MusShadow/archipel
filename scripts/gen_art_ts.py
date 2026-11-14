import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from archi_lib import *

def face_plume_b():
    return "".join([
        path("M24 62 C16 64 10 70 6 76 C14 74 20 70 26 66 Z", fill="#FF7F50"),
        circle(40, 44, 20, fill=TURQ),
        ellipse(50, 56, 8, 5, -15, fill=PINK),
        path("M24 57 C32 65 50 65 58 57 L60 62 C50 71 32 71 22 62 Z", fill="#FF7F50"),
        poly([(57, 40.5), (83, 36.5), (57.5, 45.5)], fill=INK),
        circle(47, 40, 6.5, fill=WHITE), circle(48.6, 40.6, 3.8, fill=INK), circle(50, 39, 1.3, fill=WHITE),
    ])

faces = {k: fn() for k, fn in FACES.items()}
faces["plume"] = face_plume_b()

# ---- static map base (same layout as the mockup), Plume and dynamic parts excluded
SEA, SEA_D, SAND = "#BFE8EE", "#A6DCE5", "#F6E7C8"
islands = [
    ("nombres", 250, 340, 120, 82, 3, "#3D8BEA", "#D3E5FB", "basile", "Île des Nombres"),
    ("mots", 545, 235, 115, 78, 7, "#FF7F50", "#FFE0D3", "mona", "Île des Mots"),
    ("enigmes", 865, 250, 112, 80, 11, "#8C6BE0", "#E6DEFA", "rico", "Île des Énigmes"),
    ("decouvertes", 975, 548, 122, 90, 5, "#34B37A", "#D5F0E1", "octave", "Île des Découvertes"),
    ("atelier", 685, 590, 105, 75, 13, "#FFC145", "#FFEDC2", "kiki", "Île de l'Atelier"),
    ("coeur", 405, 612, 100, 72, 17, "#E85D9A", "#FBD9E7", "pico", "Île du Cœur"),
    ("port", 150, 690, 112, 62, 19, "#1FA9B5", "#CFEFF1", "plume", "Port des Voyages"),
]
def medallion_g(name, cx, cy, size=64):
    s = size / 84
    face = group(faces[name], "translate(42 42) scale(0.9) translate(-42 -42)")
    return (f'<g transform="translate({cx - size / 2:.1f} {cy - size / 2:.1f}) scale({s:.4f})">'
            f'{circle(42, 42, 41, fill=TINTS[name])}{face}{circle(42, 42, 40, fill="none", stroke=WHITE, stroke_width=4)}</g>')

island_svg = {}
for key, cx, cy, rx, ry, seed, col, tint, ch, label in islands:
    s = path(blob_path(cx, cy, rx, ry, seed, scale=1.08), fill=SEA_D)
    s += path(blob_path(cx, cy, rx, ry, seed), fill=SAND)
    s += path(blob_path(cx, cy, rx, ry, seed, scale=0.84, dy=-6), fill=tint)
    island_svg[key] = s
landmarks = {}
landmarks["nombres"] = (path("M270 345 A35 28 0 0 1 340 345 Z", fill="#A0673F")
    + path("M279 339 A26 19 0 0 1 331 339 M288 330 A17 11 0 0 1 322 330", fill="none", stroke="#7A4A2C", stroke_width=3, stroke_linecap="round")
    + "".join(circle(x, y, 11, fill="#EEF1F6", stroke="#B9C2D3", stroke_width=1.5)
              + f'<text x="{x}" y="{y + 5}" style="font-family: \'Baloo 2\', ui-rounded, sans-serif; font-weight: 700; font-size: 14px; fill: #273043; text-anchor: middle">{i + 1}</text>'
              for i, (x, y) in enumerate([(281, 370), (306, 375), (331, 370)])))
landmarks["mots"] = (poly([(597, 224), (621, 224), (617, 172), (601, 172)], fill=WHITE, stroke="#E4D9C5", stroke_width=1.5)
    + poly([(599.2, 196), (618.8, 196), (618.2, 188), (599.8, 188)], fill="#FF7F50")
    + poly([(598.3, 214), (619.7, 214), (619.1, 206), (598.9, 206)], fill="#FF7F50")
    + rect(599, 159, 20, 13, 2, fill="#FFC145", stroke="#E0A400", stroke_width=1.5)
    + poly([(595, 159), (623, 159), (609, 146)], fill="#FF7F50")
    + line(626, 160, 640, 154, stroke="#FFC145", stroke_width=3, stroke_linecap="round")
    + line(626, 168, 641, 170, stroke="#FFC145", stroke_width=3, stroke_linecap="round"))
landmarks["enigmes"] = (rect(908, 200, 34, 48, 3, fill="#C5B6F2", stroke="#8C6BE0", stroke_width=2)
    + "".join(rect(x, 192, 8, 10, 1, fill="#C5B6F2", stroke="#8C6BE0", stroke_width=2) for x in (906, 921, 936))
    + circle(925, 218, 9, fill=WHITE)
    + '<text x="925" y="224" style="font-family: \'Baloo 2\', ui-rounded, sans-serif; font-weight: 800; font-size: 16px; fill: #273043; text-anchor: middle">?</text>'
    + path("M918 248 V240 A7 7 0 0 1 932 240 V248 Z", fill="#8C6BE0")
    + line(925, 192, 925, 172, stroke="#5B6475", stroke_width=2) + poly([(925, 172), (943, 177), (925, 182)], fill="#8C6BE0"))
landmarks["decouvertes"] = (circle(1040, 478, 8, fill="#E3E6EC") + circle(1052, 466, 6, fill="#E3E6EC") + circle(1030, 469, 5, fill="#E3E6EC")
    + poly([(995, 542), (1022, 494), (1048, 494), (1075, 542)], fill="#8A5A3B")
    + path("M1022 494 Q1035 484 1048 494 L1044 506 Q1035 500 1026 506 Z", fill="#FF7F50")
    + path("M1036 502 Q1031 514 1037 526", fill="none", stroke="#FF7F50", stroke_width=5, stroke_linecap="round"))
landmarks["atelier"] = (line(722, 602, 734, 552, stroke="#A0673F", stroke_width=4, stroke_linecap="round")
    + line(758, 602, 746, 552, stroke="#A0673F", stroke_width=4, stroke_linecap="round")
    + line(740, 604, 740, 566, stroke="#A0673F", stroke_width=4, stroke_linecap="round")
    + rect(717, 538, 46, 34, 3, fill=WHITE, stroke="#A0673F", stroke_width=2) + circle(730, 549, 5, fill="#FFC145")
    + path("M720 569 Q732 556 744 563 Q752 558 760 566 V569 Z", fill="#34B37A") + circle(752, 548, 3, fill="#E85D9A"))
landmarks["coeur"] = (rect(456, 598, 8, 20, 2, fill="#8A5A3B")
    + path("M460 602 C440 587 432 568 446 560 C454 555 460 562 460 568 C460 562 466 555 474 560 C488 568 480 587 460 602 Z", fill="#E85D9A"))
env = "M0 -56 C34 -56 50 -30 45 -2 C41 20 20 32 10 40 L-10 40 C-20 32 -41 20 -45 -2 C-50 -30 -34 -56 0 -56 Z"
landmarks["port"] = (rect(232, 684, 62, 14, 2, fill="#C89B6D")
    + path("M245 684 V698 M258 684 V698 M271 684 V698 M284 684 V698", fill="none", stroke="#A57B52", stroke_width=1.5)
    + circle(240, 700, 3.5, fill="#7A4A2C") + circle(288, 700, 3.5, fill="#7A4A2C")
    + line(286, 684, 286, 652, stroke="#5B6475", stroke_width=2.5, stroke_linecap="round")
    + rect(287, 652, 8, 14, fill="#0055A4") + rect(295, 652, 8, 14, fill=WHITE) + rect(303, 652, 8, 14, fill="#EF4135")
    + '<g transform="translate(175 560)">' + path(env, fill=TURQ)
    + path("M0 -56 C10 -40 10 20 4 40 L-4 40 C-10 20 -10 -40 0 -56 Z", fill=PINK)
    + path("M-17 -52 C-30 -32 -30 12 -7 40 M17 -52 C30 -32 30 12 7 40", fill="none", stroke=CREAM, stroke_width=5)
    + line(-9, 40, -8, 54, stroke="#7A4A2C", stroke_width=2) + line(9, 40, 8, 54, stroke="#7A4A2C", stroke_width=2)
    + rect(-13, 54, 26, 17, 3, fill="#A0673F") + line(-13, 61, 13, 61, stroke="#7A4A2C", stroke_width=1.5) + "</g>")
medals = {key: medallion_g(ch, cx - 28, cy + 4, 64) for key, cx, cy, rx, ry, seed, col, tint, ch, label in islands if key != "port"}
waves = "".join(path(f"M{x} {y} q8 -6 16 0 q8 6 16 0", fill="none", stroke=WHITE, stroke_width=3, stroke_linecap="round", opacity=0.7)
                for (x, y) in [(90, 180), (420, 440), (760, 390), (1080, 330), (560, 720), (900, 720), (1110, 150), (60, 470), (760, 120)])
pico_spikes = " ".join(f"{x:.1f},{y:.1f}" for x, y in star_points(42, 42, 14, 30, 22))
pico_face = "".join([circle(28, 40, 4.5, fill="#E8C9A6"), circle(56, 40, 4.5, fill="#E8C9A6"), ellipse(42, 51, 18, 16, fill="#F1D7B8"),
                     circle(35, 48, 2.8, fill=INK), circle(49, 48, 2.8, fill=INK), circle(42, 56, 3.5, fill=INK),
                     ellipse(30, 55, 3.5, 2.2, fill="#F49AB8"), ellipse(54, 55, 3.5, 2.2, fill="#F49AB8")])

out = "// Généré par scripts/art (formes vectorielles de l'identité Archipel). Ne pas modifier à la main.\n"
out += "export const PLUME_B = " + json.dumps(plume_b(), ensure_ascii=False) + ";\n"
out += "export const FACES: Record<string, string> = " + json.dumps(faces, ensure_ascii=False) + ";\n"
out += "export const TINTS: Record<string, string> = " + json.dumps(TINTS, ensure_ascii=False) + ";\n"
out += "export const MAP_WAVES = " + json.dumps(waves, ensure_ascii=False) + ";\n"
out += "export const ISLAND_SHAPES: Record<string, string> = " + json.dumps(island_svg, ensure_ascii=False) + ";\n"
out += "export const LANDMARKS: Record<string, string> = " + json.dumps(landmarks, ensure_ascii=False) + ";\n"
out += "export const MEDALS: Record<string, string> = " + json.dumps(medals, ensure_ascii=False) + ";\n"
out += "export const PICO_SPIKES = " + json.dumps(pico_spikes) + ";\n"
out += "export const PICO_FACE = " + json.dumps(pico_face, ensure_ascii=False) + ";\n"
out += "export const ISLANDS = " + json.dumps([dict(id=k, cx=cx, cy=cy, rx=rx, ry=ry, color=col, tint=tint, host=ch, label=label)
                                             for k, cx, cy, rx, ry, seed, col, tint, ch, label in islands], ensure_ascii=False) + " as const;\n"
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "art_static.ts"), "w").write(out)
print(len(out))
