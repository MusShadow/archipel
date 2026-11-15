#!/usr/bin/env python3
# Contrôle acoustique des consonnes finales muettes : la reconnaissance vocale pardonne « égoutse » pour « égouts »,
# alors on écoute la fin de chaque clip dont le dernier mot finit par une lettre muette (s, x, z, t, d…) :
# un souffle aigu qui dure (un [s] prononcé, 60 ms et plus) est suspect ; le claquement d'un [t] est bref.
# Deuxième contrôle : ce que la reconnaissance vocale a entendu, mot à mot (« chaude » pour « chaud », « formant » pour
# « forment ») ; à confirmer en refaisant la phrase (une erreur de la reconnaissance ne se répète pas).
# Usage : python3 scripts/voix/finales.py [fichier_de_clés.txt]  (sans argument : tous les clips du pack)
import json, os, re, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import generer as g

ROOT = g.ROOT
clips = json.load(open(os.path.join(ROOT, "voix/clips.json"), encoding="utf-8"))
# Mots dont la consonne finale se prononce vraiment.
SOUNDED = set("six dix plus fils os bus as ours vis tennis laos palaos sens mars hélas oasis cassis iris maïs index lynx est ouest sud nord net sept huit août but fait".split())
SILENT = re.compile(r"[a-zàâäéèêëîïôöùûüç]+(?:s|x|z|ts|ds|ps|ct|t|d)$")

def tail_hiss(mp3_path):
    """Durée (ms) du souffle aigu qui termine le clip : un [s] dure, le claquement d'un [t] est bref."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", mp3_path, "-f", "f32le", "-ac", "1", "-ar", "24000", "-"], capture_output=True)
    x = np.frombuffer(p.stdout, dtype=np.float32)
    if len(x) < 4800: return 0
    f = 240  # trames de 10 ms
    n = len(x) // f
    fr = x[: n * f].reshape(n, f)
    rms = np.sqrt(np.mean(fr ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    voiced = np.where(db > db.max() - 40)[0]
    if not len(voiced): return 0
    freqs = np.fft.rfftfreq(f, 1 / 24000)
    run = 0
    for i in range(voiced[-1], max(-1, voiced[-1] - 40), -1):
        spec = np.abs(np.fft.rfft(fr[i] * np.hanning(f))) ** 2
        hi = spec[(freqs >= 4000) & (freqs <= 11000)].sum() / (spec[(freqs >= 150) & (freqs <= 11000)].sum() + 1e-12)
        if hi > 0.5 and db[i] > db.max() - 40: run += 1
        else: break
    return run * 10

def heard_suspects(subset):
    """Mots entendus avec une consonne ou une syllabe en trop (« chaude » pour « chaud », « formant » pour « forment »)."""
    import difflib
    norm = lambda t: re.findall(r"[\wàâäéèêëîïôöùûüçœ]+", t.lower().replace("’", "'").replace("-", " "))
    out = []
    for c, m in subset:
        if not m.get("heard"): continue
        a, b = norm(c["say"]), norm(m["heard"])
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b).get_opcodes():
            if op != "replace" or i2 - i1 != j2 - j1: continue
            for x, y in zip(a[i1:i2], b[j1:j2]):
                ent = x.endswith("ent") and y.endswith("ant") and x[:-3] == y[:-3]
                muet = x[-1:] in "stdxz" or (x.endswith("er") and x not in ("mer", "fer", "ver", "hiver", "super", "cher", "hier"))
                cons = muet and y in (x + "e", x + "se", x[:-1] + "se", x + "ses", x + "sse", x[:-1] + "sses", x[:-2] + "ère")
                if ent or cons: out.append((x, y, c["say"]))
    return out

def main():
    only = set(open(sys.argv[1], encoding="utf-8").read().split("\n")) if len(sys.argv) > 1 else None
    singles = [c for c in clips if c["words"] == 1 and c["say"].strip(" .,!?…:;").lower() in g.ALT]
    res = []
    for c in clips:
        if only is not None and c["key"] not in only: continue
        if c in singles: continue
        words = re.findall(r"[\wàâäéèêëîïôöùûüçœ'’-]+", c["say"].lower())
        if not words: continue
        last = words[-1].split("'")[-1].split("-")[-1]
        m = g.cached(c, None)
        if not m: continue
        r = tail_hiss(f"{g.CACHE}/{m['h']}.mp3")
        silent = bool(SILENT.match(last)) and last not in SOUNDED
        res.append((r, silent, c["say"], c["key"]))
    base = [r for r, s, _, _ in res if not s]
    print(f"{len(res)} clips ; souffle aigu final (fins sans lettre muette) : médiane {np.median(base):.0f} ms, 95e centile {np.percentile(base, 95):.0f} ms")
    subset = [(c, g.cached(c, None)) for c in clips if (only is None or c["key"] in only) and c not in singles]
    hs = heard_suspects([(c, m) for c, m in subset if m])
    print(f"mots entendus avec un son en trop : {len(hs)}")
    for x, y, say in hs[:60]: print(f"  {x} → {y} | {say}")
    lim = 60
    sus = sorted([x for x in res if x[1] and x[0] >= lim], reverse=True)
    print(f"seuil {lim} ms : {len(sus)} clips suspects (consonne muette peut-être prononcée)")
    for r, _, say, _ in sus[:80]: print(f"{r:4d} ms | {say}")

if __name__ == "__main__":
    main()
