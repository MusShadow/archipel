#!/usr/bin/env python3
"""Fabrique les illustrations d'Archipel 2 : personnages (poses, expressions, pièces) et écrans d'île (décor de base,
remplissages des emplacements libres, lieux des activités). Voir scripts/illustration/LISEZMOI.md.

  python3 scripts/illustration/fabriquer.py              # tout
  python3 scripts/illustration/fabriquer.py personnages  # ou : iles

Sortie : public/illustrations/**.webp, scripts/illustration/catalogue.json (boîtes et ancres), et src/illustrations.ts
(le même catalogue, typé, pour l'appli). Même source, même image : le rendu est déterministe."""
import json, os, pathlib, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from moteur import *
from couches import Atelier
import personnages as P
import hotes as H
import decors as D
import iles as I
import importlib

# Éléments isolés de la livraison 2 (une image chacun) : module → ELEMENTS {nom: cadre, dessin, options}.
MODULES_ELEMENTS = ["activites", "fetes", "carte", "accueil"]
def tous_elements(quoi=None):
    out = {}
    for m in MODULES_ELEMENTS:
        if quoi and m not in quoi:
            continue
        try:
            mod = importlib.import_module(m)
        except ModuleNotFoundError:
            continue
        out.update({k: {**e, "module": m} for k, e in mod.ELEMENTS.items()})
    return out

RACINE = pathlib.Path(__file__).resolve().parents[2]
SORTIE = RACINE / "public/illustrations"
CATALOGUE = pathlib.Path(__file__).with_name("catalogue.json")
EXPRS = ["content", "rieur", "surpris", "pensif", "doux"]

# Personnages : dessin, échelle de rendu, cadre (l, h), point d'ancrage dans le cadre, décalage du sol (en unités locales).
# Les hôtes debout ont une ombre au sol ; Plume et Mona flottent.
def _hote(fn, sol):
    return lambda R, x, y, s, expr, salut: fn(R, x, y, s, expr=expr, salut=salut)

PERSOS = {
    "basile": dict(dessin=lambda R, x, y, s, expr, salut: P.basile(R, x, y, s, wave=salut, expr=expr), s=1.1, cadre=(300, 360), sol=103, ombre=(64, 11)),
    "mona": dict(dessin=_hote(H.mona, 0), s=1.0, cadre=(320, 260), sol=None),
    "rico": dict(dessin=_hote(H.rico, 102), s=1.05, cadre=(300, 360), sol=102, ombre=(66, 11)),
    "bip": dict(dessin=_hote(H.bip, 83), s=1.0, cadre=(240, 260), sol=83, ombre=(52, 9)),
    "octave": dict(dessin=_hote(H.octave, 140), s=1.0, cadre=(300, 320), sol=140, ombre=(70, 12)),
    "kiki": dict(dessin=_hote(H.kiki, 81), s=1.0, cadre=(320, 280), sol=81, ombre=(84, 9)),
    "pico": dict(dessin=_hote(H.pico, 85), s=1.15, cadre=(300, 340), sol=85, ombre=(60, 11)),
}
PLUME_S, PLUME_CADRE = 0.9, (360, 300)

def charger():
    return json.loads(CATALOGUE.read_text()) if CATALOGUE.exists() else {"personnages": {}, "iles": {}}

def enregistrer(cat):
    CATALOGUE.write_text(json.dumps(cat, indent=1, ensure_ascii=False) + "\n")
    ecrire_ts(cat)

def rel(boite, x, y):
    return [round((x - boite[0]) / boite[2], 4), round((y - boite[1]) / boite[3], 4)]

def personnages(cat):
    out = cat["personnages"] = {}  # tout est refait : une variante retirée disparaît du catalogue
    for nom, p in PERSOS.items():
        W_, H_ = p["cadre"]
        A = Atelier(W_, H_)
        x = W_ / 2
        if p["sol"]:  # le sol à 90 % de la hauteur du cadre
            sol = (x, H_ * 0.9)
            y = sol[1] - p["sol"] * p["s"]
        else:
            sol, y = None, H_ / 2
        for var in EXPRS + ["salut"]:
            expr, salut = (var, False) if var != "salut" else ("content", True)
            def dessin(R, expr=expr, salut=salut):
                if sol and p.get("ombre"):
                    rx, ry = p["ombre"]
                    D.ground_shadow(R, sol[0], sol[1] - 2, rx * p["s"], ry * p["s"], 0.26, dx=6, blur=5)
                p["dessin"](R, x, y, p["s"], expr, salut)
            col, a = A.rgba(dessin)
            fichier = f"personnages/{nom}-{var}.webp"
            boite = A.enregistrer(SORTIE / fichier, col, a)
            ancre = rel(boite, *(sol or (x, y)))
            out[f"{nom}-{var}"] = {"fichier": fichier, "boite": boite, "ancre": ancre, "echelle": p["s"]}
            print(f"  {fichier:42} {boite}")
    # Plume : cinq poses, quatre expressions en vol, et les pièces pour l'animer (ailes et corps alignés)
    W_, H_ = PLUME_CADRE
    A = Atelier(W_, H_)
    x, y = W_ / 2 - 10, H_ / 2 + 10
    variantes = [(pose, dict(pose=pose)) for pose in ("vol", "salut", "montre", "pense", "fete")]
    variantes += [(f"vol-{e}", dict(pose="vol", expr=e)) for e in EXPRS if e != "content"]
    variantes += [(f"piece-{pc}", dict(pose="vol", only=k)) for pc, k in (("aile-ar", "aile_ar"), ("corps", "corps"), ("aile-av", "aile_av"))]
    for var, kw in variantes:
        col, a = A.rgba(lambda R, kw=kw: P.plume(R, x, y, PLUME_S, **kw))
        fichier = f"personnages/plume-{var}.webp"
        boite = A.enregistrer(SORTIE / fichier, col, a)
        entree = {"fichier": fichier, "boite": boite, "ancre": rel(boite, x, y), "echelle": PLUME_S}
        if var.startswith("piece-aile"):
            entree["pivot"] = rel(boite, x, y - 2 * PLUME_S)  # épaule : point (160, 148) du repère de Plume
        out[f"plume-{var}"] = entree
        print(f"  {fichier:42} {boite}")

def iles(cat):
    cat["iles"] = {}
    for ile, disp in I.DISPOSITIONS.items():
        d = I.DESSINS[ile]
        A = Atelier(I.W, I.H)
        t = time.time()
        col, a = A.opaque(d["base"])
        base = {"fichier": f"iles/{ile}/base.webp", "boite": A.enregistrer(SORTIE / f"iles/{ile}/base.webp", col, a, opaque=True, qualite=82)}
        print(f"  iles/{ile}/base.webp  {round(time.time() - t, 1)} s")
        occupes = set(disp["lieux"].values())
        remplissages = {}
        for e in disp["emplacements"]:
            if e in occupes:
                continue
            col, a = A.rgba(lambda R, e=e: d["remplissage"](R, e))
            f = f"iles/{ile}/remplissage-{e}.webp"
            remplissages[e] = {"fichier": f, "boite": A.enregistrer(SORTIE / f, col, a)}
            print(f"  {f:42} {remplissages[e]['boite']}")
        lieux = {}
        for act in disp["lieux"]:
            col, a = A.rgba(lambda R, act=act: d["lieu"](R, act))
            f = f"iles/{ile}/lieu-{act}.webp"
            lieux[act] = {"fichier": f, "boite": A.enregistrer(SORTIE / f, col, a)}
            print(f"  {f:42} {lieux[act]['boite']}")
        animes = {}
        for nom in disp.get("animes", []):
            col, a = A.rgba(lambda R, nom=nom: d["anime"](R, nom))
            f = f"iles/{ile}/anime-{nom}.webp"
            animes[nom] = {"fichier": f, "boite": A.enregistrer(SORTIE / f, col, a)}
            print(f"  {f:42} {animes[nom]['boite']}")
        cat["iles"][ile] = {
            "cadre": [I.W, I.H], "base": base, "remplissages": remplissages, "lieux": lieux, "animes": animes,
            "emplacements": {k: list(v) for k, v in disp["emplacements"].items()}, "lieuxEmplacement": dict(disp["lieux"]),
            "pastilles": {k: list(v) for k, v in disp["pastilles"].items()}, "plume": list(disp["plume"]),
        }

def elements(cat, quoi):
    """Éléments isolés : chacun dans son cadre, avec sa boîte, et ses points repères (fractions de la boîte)."""
    out = cat.setdefault("elements", {})
    liste = tous_elements(quoi)
    rendus = {e["module"] for e in liste.values()}
    for nom in [n for n, e in out.items() if e.get("module") in rendus and n not in liste]:
        del out[nom]  # élément retiré de son module
    for nom, e in liste.items():
        W_, H_ = e["cadre"]
        A = Atelier(W_, H_, S=e.get("S", 2))
        t = time.time()
        opaque = e.get("opaque", False)
        col, a = (A.opaque if opaque else A.rgba)(e["dessin"])
        fichier = f"{nom}.webp"
        boite = A.enregistrer(SORTIE / fichier, col, a, opaque=opaque, qualite=e.get("qualite", 86 if not opaque else 80))
        ent = {"fichier": fichier, "boite": boite, "module": e["module"]}
        if e.get("points"):
            ent["points"] = {k: rel(boite, *pt) for k, pt in e["points"].items()}
        if e.get("infos"):
            ent["infos"] = e["infos"]
        out[nom] = ent
        print(f"  {fichier:42} {boite}  {round(time.time() - t, 1)} s")

def nettoyer(cat, quoi):
    """Retire les images qui ne sont plus au catalogue (sinon le service worker les garderait pour rien)."""
    gardes = {e["fichier"] for e in cat["personnages"].values()} | {e["fichier"] for e in cat.get("elements", {}).values()}
    for d in cat["iles"].values():
        gardes |= {d["base"]["fichier"]} | {x["fichier"] for k in ("remplissages", "lieux", "animes") for x in d[k].values()}
    parties = ["personnages", "iles"] + ["activites", "gommettes", "fetes", "carte", "accueil"]
    for partie in parties:
        if not (SORTIE / partie).exists() or (partie in ("personnages", "iles") and partie not in quoi):
            continue
        if partie not in ("personnages", "iles") and not any(m in quoi for m in MODULES_ELEMENTS):
            continue
        for f in sorted((SORTIE / partie).rglob("*.webp")):
            rel = f.relative_to(SORTIE).as_posix()
            if rel not in gardes:
                f.unlink()
                print(f"  retiré : {rel}")

def ecrire_ts(cat):
    lignes = [
        "// Généré par scripts/illustration/fabriquer.py : ne pas modifier à la main.",
        "// Images de l'atelier d'illustration (public/illustrations) : boîte [x, y, l, h] en px CSS dans le cadre de rendu,",
        "// ancre (point au sol ou centre) et pivot en fraction de la boîte, échelle de rendu du personnage.",
        "export type Boite = [number, number, number, number];",
        "export interface ImageCadree { fichier: string; boite: Boite; ancre?: [number, number]; echelle?: number; pivot?: [number, number]; points?: Record<string, [number, number]>; infos?: Record<string, number | string> }",
        "export interface DecorIle {",
        "  cadre: [number, number]; base: ImageCadree; remplissages: Record<string, ImageCadree>; lieux: Record<string, ImageCadree>; animes: Record<string, ImageCadree>;",
        "  emplacements: Record<string, [number, number]>; lieuxEmplacement: Record<string, string>; pastilles: Record<string, [number, number]>; plume: [number, number];",
        "}",
        f"export const PERSONNAGES: Record<string, ImageCadree> = {json.dumps(cat['personnages'], ensure_ascii=False, sort_keys=True)};",
        f"export const DECORS_ILES: Record<string, DecorIle> = {json.dumps(cat['iles'], ensure_ascii=False, sort_keys=True)};",
        "// Éléments isolés (livraison 2) : activités, gommettes, fêtes, carte, accueil.",
        f"export const ELEMENTS: Record<string, ImageCadree> = {json.dumps({k: {c: v for c, v in e.items() if c != 'module'} for k, e in cat.get('elements', {}).items()}, ensure_ascii=False, sort_keys=True)};",
        "",
    ]
    (RACINE / "src/illustrations.ts").write_text("\n".join(lignes))

if __name__ == "__main__":
    quoi = set(sys.argv[1:]) or {"personnages", "iles", *MODULES_ELEMENTS}
    cat = charger()
    t = time.time()
    if "personnages" in quoi:
        print("Personnages")
        personnages(cat)
    if "iles" in quoi:
        print("Îles")
        iles(cat)
    if any(m in quoi for m in MODULES_ELEMENTS):
        print("Éléments")
        elements(cat, quoi)
    nettoyer(cat, quoi)
    enregistrer(cat)
    print(f"Fini en {round(time.time() - t)} s : {len(cat['personnages'])} images de personnages, {len(cat['iles'])} île(s), {len(cat.get('elements', {}))} éléments.")
