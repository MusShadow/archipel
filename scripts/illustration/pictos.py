"""Livraison 4 bis : les dessins au trait de l'appli repeints dans la finition album.

Ce qui passe ici : les images du voyage de la goutte (35), du voyage des déchets (44), du grand tri (26) et des
chapitres du volcan d'Octave (50), le tipi et le domino du jeu des syllabes (sans emoji, donc sans image dans
l'imagier), la rue du camion poubelle (en trois calques : le fond, le camion qui repart, l'éboueur) et la carte du
monde du Port.

La source est le dessin que l'appli écrit elle-même (src/activities/*_art.ts, src/flags.ts, lus par
pictos_source.ts) : le contenu de chaque image ne change pas, chacune a été pensée pour une question précise. Seule sa
matière change, avec le moteur des autres dessins :
- Chrome lit chaque dessin sans lissage, deux fois : une couleur-repère par forme (chaque aplat, chaque trait de
  couleur), le trait d'encre à part ; puis les formes translucides (reflets, maisons du fond), chacune avec ce qui
  les cache ;
- chaque forme devient un masque, peint par le moteur dans sa couleur : volume selon sa taille, deux tons, gouache,
  pigment au bord ; un grand fond (la mer, le ciel, la route, une bande d'eau) ne se bombe presque pas ;
- le contour d'encre d'une forme, aminci, prend la couleur de cette forme, foncée : le trait coloré de l'album. Il
  garde au moins 3,3:1 contre le papier des cartes, pour qu'un objet blanc ou clair reste net ;
- un trait d'encre sans forme (flèche, fêlure, symbole, bouche) reste une encre foncée, à peine teintée par ce qu'il
  touche, et peu aminci : au moins 4,5:1 contre son fond ;
- un trait d'encre épais sans forme (un bras, un châssis, une aiguille) est un objet : il garde sa largeur et se peint
  comme une forme ;
- les formes translucides sont posées par-dessus, en glacis.
Même source, même image."""
import json, os, pathlib, subprocess, tempfile
import numpy as np, cv2
from moteur import Mat, Mask, L, mix, tweak, to_lin

RACINE = pathlib.Path(__file__).resolve().parents[2]
TRAIT = 0.62          # épaisseur du contour d'encre d'une forme, par rapport au dessin d'origine
TRAIT_DETAIL = 0.8    # épaisseur d'un trait d'encre sans forme (flèches, fêlures, symboles)
EPAIS = 4.0           # au-delà (en unités du dessin), un trait d'encre sans forme est un objet, peint comme une forme
ENCRE = (39, 48, 67)  # #273043, l'encre des dessins au trait
REGION, TRAIT_TAG, CACHE_TAG = 7, 77, 177  # canal bleu des couleurs-repères
CARTE = to_lin(np.array([0xFD, 0xF9, 0xF1], np.float32) / 255)  # le papier des cartes de l'appli
CONTOUR, DETAIL = 3.3, 4.5  # contrastes minimaux : contour contre le papier, trait sans forme contre son fond
DEBORDE_MASQUE = 64   # px : une forme coupée par le bord de l'image continue au-delà (pas de faux bord)

_sources, _rasters = None, {}

def sources():
    """Les dessins tels que l'appli les écrit (bun lit les modules TypeScript)."""
    global _sources
    if _sources is None:
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "pictos.json"
            subprocess.run(["bun", str(RACINE / "scripts/illustration/pictos_source.ts"), str(f)], check=True, capture_output=True, cwd=RACINE)
            _sources = json.loads(f.read_text(encoding="utf-8"))
    return _sources

# Le script de la page : prépare le dessin pour une lecture (« aplats » ou « glacis ») et décrit ses formes.
PREPARER = r"""
([mode, cacher, seul, trait, detail, epais, unite]) => {
  const svg = document.querySelector('#scene svg');
  svg.setAttribute('shape-rendering', 'crispEdges');
  const encre = (c) => c === 'rgb(39, 48, 67)';
  const formes = Array.from(svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text'));
  const cache = new Set();
  for (const sel of cacher) svg.querySelectorAll(sel).forEach((g) => { g.style.display = 'none'; g.querySelectorAll('*').forEach((x) => cache.add(x)); cache.add(g); });
  if (seul) { const g = svg.querySelector(seul); formes.forEach((f) => { if (!g.contains(f)) cache.add(f); }); }
  const opa = (el) => { let o = 1; for (let e = el; e && e !== svg; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  // la forme remplit-elle une surface ? (quelques points de sa boîte dans le remplissage)
  const surface = (el) => {
    if (!el.isPointInFill) return true;
    let b; try { b = el.getBBox(); } catch (e) { return true; }
    if (b.width < 0.3 || b.height < 0.3) return false;
    const p = svg.createSVGPoint();
    for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) {
      p.x = b.x + (b.width * i) / 10; p.y = b.y + (b.height * j) / 10;
      if (el.isPointInFill(p)) return true;
    }
    return false;
  };
  const desc = [];
  const rep = (id, tag) => `rgb(${id & 255}, ${(id >> 8) & 255}, ${tag})`;
  let n = 0;
  const lus = formes.map((f) => {
    const s = getComputedStyle(f);
    const o = opa(f);
    const fill = s.fill !== 'none' && !s.fill.startsWith('url') ? s.fill : null;
    const stroke = s.stroke !== 'none' && parseFloat(s.strokeWidth) > 0 ? s.stroke : null;
    const fo = o * parseFloat(s.fillOpacity), so = o * parseFloat(s.strokeOpacity);
    const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
    const r = { f, fill: fill && parse(fill), stroke: stroke && parse(stroke), fo, so, sw: parseFloat(s.strokeWidth), cache: cache.has(f) };
    if (r.fill) { r.fo *= r.fill[3]; r.fill = r.fill.slice(0, 3); }
    if (r.stroke) { r.so *= r.stroke[3]; r.stroke = r.stroke.slice(0, 3); }
    r.encre = r.stroke && encre(`rgb(${r.stroke.join(', ')})`);
    // un aplat n'en est un que s'il couvre une surface : un trait droit sans « fill » a le noir par défaut, sans surface
    const aplat = r.fill && r.fo > 0.004 && !r.cache && surface(f);
    // l'épaisseur vraie du trait, en unités du dessin (un groupe peut être mis à l'échelle) : un trait d'encre épais
    // sans forme (bras, châssis, aiguille) est un objet, il garde sa largeur et se peint comme une forme
    let k = 1;
    try { const m = f.getCTM(); if (m) k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / unite; } catch (e) { /* pas de géométrie */ }
    if (r.encre && !aplat && r.sw * k >= epais) r.encre = false;
    if (aplat) { r.idF = ++n; desc.push({ id: n, rgb: r.fill, op: r.fo, forme: 'aplat' }); }
    if (r.stroke && !r.encre && r.so > 0.004 && !r.cache) { r.idS = ++n; desc.push({ id: n, rgb: r.stroke, op: r.so, forme: 'trait' }); }
    // le trait d'encre d'une forme translucide (les maisons du fond) : un glacis de la couleur foncée de la forme
    if (r.encre && r.so < 0.98 && !r.cache) { r.idS = ++n; r.encreGlacis = true; desc.push({ id: n, rgb: r.fill || r.stroke, op: r.so, forme: 'encre' }); }
    return r;
  });
  svg.querySelectorAll('g').forEach((g) => { g.style.opacity = '1'; });
  for (const r of lus) {
    const st = r.f.style;
    st.opacity = '1'; st.fillOpacity = '1'; st.strokeOpacity = '1';
    if (r.cache) { st.visibility = 'hidden'; continue; }
    const translF = r.idF && r.fo < 0.98, translS = r.idS && r.so < 0.98;
    // le trait d'encre porte l'identifiant de sa forme (0 : un trait sans forme), pour prendre sa couleur à elle
    const ep = String(r.sw * (r.idF ? trait : detail));
    if (mode === 'aplats') {
      st.fill = r.idF && !translF ? rep(r.idF, 7) : 'none';
      if (r.encreGlacis) st.stroke = 'none';
      else if (r.encre) { st.stroke = rep(r.idF || 0, 77); st.strokeWidth = ep; }
      else st.stroke = r.idS && !translS ? rep(r.idS, 7) : 'none';
    } else {
      st.fill = r.idF ? (translF ? rep(r.idF, 7) : rep(0, 177)) : 'none';
      if (r.encreGlacis) { st.stroke = rep(r.idS, 7); st.strokeWidth = String(r.sw * trait); }
      else if (r.encre) { st.stroke = rep(0, 177); st.strokeWidth = ep; }
      else st.stroke = r.idS ? (translS ? rep(r.idS, 7) : rep(0, 177)) : 'none';
    }
  }
  return desc;
}
"""

def rasteriser(noms):
    """Lit les dessins dans Chrome : carte des formes (aplats et trait d'encre) et carte des glacis, sans lissage."""
    from playwright.sync_api import sync_playwright
    src = sources()
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"))
        pg = b.new_page()
        for nom in noms:
            s = src[nom]
            x0, y0, vw, vh = s["vb"]
            S = s["S"]
            ss = 4 if vw * vh * S * S < 600_000 else 2
            W, H = int(round(vw * S * ss)), int(round(vh * S * ss))
            pg.set_viewport_size({"width": W, "height": H})
            cartes, desc = {}, None
            for mode in ("aplats", "glacis"):
                pg.set_content(f'<html><body style="margin:0;background:transparent"><div id="scene" style="width:{W}px;height:{H}px">{s["svg"]}</div></body></html>')
                pg.evaluate(f"() => {{ const s = document.querySelector('#scene svg'); s.setAttribute('width', '{W}'); s.setAttribute('height', '{H}'); }}")
                d = pg.evaluate(PREPARER, [mode, s.get("cacher", []), s.get("seul"), TRAIT, TRAIT_DETAIL, EPAIS, S * ss])
                desc = desc or d
                png = pg.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": W, "height": H})
                im = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_UNCHANGED)  # BGRA (BGR si tout est opaque)
                if im.shape[2] == 3:
                    im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
                # un dessin d'un carré ne doit pas toucher le bord de son cadre : ce qui dépasse serait coupé
                al = im[..., 3]
                if s.get("carre") and (al[0].any() or al[-1].any() or al[:, 0].any() or al[:, -1].any()):
                    raise ValueError(f"{nom} déborde de son cadre : agrandir son cadre (DEBORDE dans pictos_source.ts)")
                cartes[mode] = im
            _rasters[nom] = {"cartes": cartes, "desc": desc, "ss": ss}
        b.close()

def _ids(im, tag):
    """Identifiant de forme de chaque pixel opaque dont le canal bleu porte l'étiquette ; -1 ailleurs."""
    bgr = im[..., :3].astype(np.int32)
    ok = (im[..., 3] == 255) & (bgr[..., 0] == tag)
    return np.where(ok, bgr[..., 2] + 256 * bgr[..., 1], -1)

def _prolonger(sel, couvert, r):
    """La forme continue sous ce qui sera peint par-dessus (formes suivantes, trait d'encre) : son volume et son bord ne
    voient pas les formes posées sur elle. On l'étend de r pixels dans ce qui la couvre, puis on bouche ses trous."""
    if r >= 1:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
        sel = sel | (cv2.dilate(sel.astype(np.uint8), k).astype(bool) & couvert)
    plein = sel.astype(np.uint8).copy()
    h, w = plein.shape
    bord = np.zeros((h + 2, w + 2), np.uint8)
    inv = (1 - plein).copy()
    cv2.floodFill(inv, bord, (0, 0), 2) if inv[0, 0] == 1 else None
    # les pixels du fond non atteints depuis le coin sont des trous ; on ne bouche que ceux qui seront recouverts
    for (y, x) in ((0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if inv[y, x] == 1:
            cv2.floodFill(inv, bord, (x, y), 2)
    trous = (inv == 1)
    return sel | (trous & couvert)

def _masque(sel, ss, pad=2, bord=True):
    """Masque d'une forme (booléens au rendu × ss) → Mask lissé au rendu, recadré sur la forme. Une forme coupée par le
    bord de l'image continue au-delà (bord=True) : le moteur ne voit pas de bord là (sinon une ombre ou un liseré le
    long du cadre)."""
    ys, xs = np.where(sel)
    Hc, Wc = sel.shape[0] // ss, sel.shape[1] // ss
    y0, y1 = max(0, ys.min() // ss - pad), min(Hc, ys.max() // ss + pad + 1)
    x0, x1 = max(0, xs.min() // ss - pad), min(Wc, xs.max() // ss + pad + 1)
    crop = np.zeros(((y1 - y0) * ss, (x1 - x0) * ss), np.float32)
    sub = sel[y0 * ss:y1 * ss, x0 * ss:x1 * ss]
    crop[:sub.shape[0], :sub.shape[1]] = sub
    a = cv2.resize(crop, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    D = DEBORDE_MASQUE if bord else 0
    h, g = (D if y0 == 0 and a[0].any() else 0), (D if x0 == 0 and a[:, 0].any() else 0)
    b, d = (D if y1 == Hc and a[-1].any() else 0), (D if x1 == Wc and a[:, -1].any() else 0)
    if h or g or b or d:
        a = cv2.copyMakeBorder(a, h, b, g, d, cv2.BORDER_REPLICATE)
    return Mask(a, x0 - g, y0 - h)

def _lum(c):
    """Luminance relative (WCAG) d'une couleur linéaire."""
    return float(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])

def _contraster(c, refs, t):
    """Fonce c (couleur linéaire, même teinte) jusqu'à un contraste t contre chaque couleur de refs, si c'est possible."""
    y = _lum(c)
    ymax = max(0.012, min((_lum(r) + 0.05) / t - 0.05 for r in refs))
    return (c * (ymax / y)).astype(np.float32) if y > ymax else c

def _couleur_contour(base):
    """Le contour d'une forme : sa couleur, foncée ; assez sombre pour la détacher du papier et d'elle-même."""
    c = tweak(base[None, None, :], dl=-0.30, sat=1.15, dh=-6)[0, 0]
    return _contraster(_contraster(c, [CARTE], CONTOUR), [base], 1.8)

def peindre(R, nom):
    if nom not in _rasters:
        rasteriser([nom])
    r = _rasters[nom]
    ss, desc = r["ss"], {d["id"]: d for d in r["desc"]}
    ap, gl = r["cartes"]["aplats"], r["cartes"]["glacis"]
    ids = _ids(ap, REGION)
    encre = _ids(ap, TRAIT_TAG) >= 0
    total = R.w * R.h
    k = R.k
    # ---- les aplats et les traits de couleur, dans l'ordre du dessin
    for i in sorted(desc):
        d = desc[i]
        if d["op"] < 0.98:
            continue
        sel = ids == i
        if not sel.any():
            continue
        A = _masque(sel, ss, bord=False).a
        D = cv2.distanceTransform((A > 0.5).astype(np.uint8), cv2.DIST_L2, 3)
        dmax = float(D.max()) if D.size else 0.0
        aire = float(A.sum())
        ys, xs = np.where(sel)
        # un fond : une grande forme, ou une bande qui traverse tout le dessin (la mer, le ciel, l'eau d'une plage)
        bande = xs.max() - xs.min() >= 0.85 * sel.shape[1] or ys.max() - ys.min() >= 0.85 * sel.shape[0]
        fond = aire > 0.30 * total or bande
        puff = 2.5 if fond else float(np.clip(dmax / k * 0.75, 1.2, 14.0))
        m = _masque(_prolonger(sel, (ids > i) | encre, int(min(60, puff * k * ss * 1.5))), ss)
        if fond:
            mat = Mat(puff=puff, line=False, tex=0.45, rim=0.05)
        elif dmax < 1.6 * k:
            mat = Mat(puff=1.0, line=False, tex=0.25, rim=0.0)
        else:
            # le volume suit la taille de la forme ; la gouache reste légère (les petits dessins ne se salissent pas)
            mat = Mat(puff=puff, line=False, tex=0.4, rim=0.12)
        col = to_lin(np.array(d["rgb"], np.float32) / 255)
        R.paint(m, col, mat)
    # ---- les glacis (reflets, maisons du fond…)
    gids = _ids(gl, REGION)
    for i in sorted(desc):
        d = desc[i]
        if d["op"] >= 0.98:
            continue
        sel = gids == i
        if not sel.any():
            continue
        m = _masque(sel, ss)
        col = to_lin(np.array(d["rgb"], np.float32) / 255)
        if d["forme"] == "encre":
            col = _couleur_contour(col)
        _poser(R, m, col, d["op"])
    # ---- le trait d'encre. Le contour d'une forme prend la couleur de cette forme, foncée (le trait coloré de l'album) ;
    # un trait sans forme (flèche, fêlure, symbole) reste une encre foncée, teintée par la forme la plus proche
    tid = _ids(ap, TRAIT_TAG)  # -1 : pas de trait ; 0 : trait sans forme ; i > 0 : contour de la forme i
    trait = tid >= 0
    if trait.any():
        regions = ids >= 0
        # la forme la plus proche de chaque pixel (hors trait et hors vide)
        src8 = np.where(regions, 0, 255).astype(np.uint8)
        proche = np.zeros(ids.shape, np.int64)
        if regions.any():
            _, lab = cv2.distanceTransformWithLabels(src8, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
            ys, xs = np.where(src8 == 0)
            table = np.zeros(lab.max() + 1, np.int64)
            table[lab[ys, xs]] = ids[ys, xs]
            proche = table[lab]
        n = max(desc) + 1 if desc else 1
        contours, details = np.zeros((n, 3), np.float32), np.zeros((n, 3), np.float32)
        encre_lin = to_lin(np.array(ENCRE, np.float32) / 255)
        details[0] = encre_lin
        for i, d in desc.items():
            base = to_lin(np.array(d["rgb"], np.float32) / 255)
            contours[i] = _couleur_contour(base)
            fonce = tweak(base[None, None, :], dl=-0.45, sat=1.1, dh=-6)[0, 0]
            details[i] = _contraster(mix(encre_lin, fonce, 0.25), [base, CARTE], DETAIL)
        lc = np.where((tid > 0)[..., None], contours[np.clip(tid, 0, n - 1)], details[np.clip(proche, 0, n - 1)])
        h, w = R.h, R.w
        la = cv2.resize(trait.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
        lc = cv2.resize(lc * trait[..., None], (w, h), interpolation=cv2.INTER_AREA) / np.maximum(la[..., None], 1e-4)
        a3 = (la * 0.95)[..., None]
        R.img = R.img * (1 - a3) + lc * a3

def _poser(R, m, col, op):
    """Glacis : la couleur posée à plat, translucide, avec la texture du papier."""
    x0, y0 = m.x0, m.y0
    A = m.a
    h, w = A.shape
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(R.w, x0 + w), min(R.h, y0 + h)
    if X1 <= X0 or Y1 <= Y0:
        return
    a = A[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] * op
    gr = R.grain[Y0:Y1, X0:X1] - 0.5
    c = col[None, None, :] * (1 + 0.05 * gr[..., None])
    R.img[Y0:Y1, X0:X1] = R.img[Y0:Y1, X0:X1] * (1 - a[..., None]) + c * a[..., None]

def _element(nom):
    s = sources()[nom]
    x0, y0, vw, vh = s["vb"]
    cadre = tuple(s.get("cadre", (vw, vh)))
    e = dict(cadre=cadre, S=s["S"], dessin=(lambda R, nom=nom: peindre(R, nom)), qualite=84 if cadre[0] <= 120 else 82)
    if s.get("decalage"):
        # un dessin qui dépasse de son carré (la fumée d'une cheminée) : rendu sur une toile plus grande, sa boîte
        # comptée depuis le coin du carré (elle peut sortir du cadre ; l'appli la pose quand même au bon endroit)
        e["toile"], e["decalage"] = (vw, vh), tuple(s["decalage"])
    return e

def _elements():
    return {nom: _element(nom) for nom in sources()}

class _Paresseux(dict):
    """ELEMENTS se remplit à la première lecture (bun lit les dessins de l'appli) ; rasterise d'un coup avant de peindre."""
    def _charger(self):
        if not dict.__len__(self):
            dict.update(self, _elements())
    def items(self):
        self._charger()
        noms = [n for n in dict.keys(self) if n not in _rasters]
        if noms:
            rasteriser(noms)
        return dict.items(self)
    def keys(self):
        self._charger(); return dict.keys(self)
    def __iter__(self):
        self._charger(); return dict.__iter__(self)
    def __len__(self):
        self._charger(); return dict.__len__(self)
    def __getitem__(self, k):
        self._charger(); return dict.__getitem__(self, k)

ELEMENTS = _Paresseux()
