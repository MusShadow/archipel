#!/usr/bin/env python3
# Génère le pack de voix naturelle de Plume à partir de voix/clips.json (voir README, « Voix naturelle de Plume »).
#
# Voix : Supertonic 3 (Supertone, modèle OpenRAIL-M), style F1, vitesse 0,9, en français, via sherpa-onnx 1.13.x.
# Chaque clip est contrôlé par une reconnaissance vocale (Parakeet TDT 0.6B v3) : on compare les sons attendus et
# entendus (phonèmes eSpeak) ; un clip raté est refait (trois essais au plus, on garde le meilleur).
# Les syllabes et morceaux de mots isolés sont dits dans une phrase porteuse (« Je dis … ») pour ce contrôle, et
# plusieurs écritures sont essayées quand la voix hésite (« pu », « pue », « pus » : on garde celle qui sonne juste).
#
# Sortie : public/voix/index-<empreinte>.json et un paquet audio par île (MP3 mono 24 kHz, 32 kb/s, clips bout à bout).
# Les clips déjà faits sont gardés dans un cache (VOIX_CACHE) : relancer ne refait que les nouveaux.
#
# Prérequis : pip install "sherpa-onnx==1.13.8" numpy soundfile espeakng-loader phonemizer-fork ; ffmpeg ;
# modèles (VOIX_MODELES) depuis https://github.com/k2-fsa/sherpa-onnx/releases :
#   tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2
#   asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8.tar.bz2   (contrôle, facultatif : VOIX_CONTROLE=0)
import hashlib, json, os, re, subprocess, sys, time
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
MODELS = os.environ.get("VOIX_MODELES", "/home/claude/voix/models")
CACHE = os.environ.get("VOIX_CACHE", "/home/claude/voix/cache")
CONTROLE = os.environ.get("VOIX_CONTROLE", "1") != "0"
# Plusieurs générateurs en parallèle : VOIX_PART=0/2 et VOIX_PART=1/2 (un fil chacun), puis une passe finale qui assemble.
PART = os.environ.get("VOIX_PART")
THREADS = int(os.environ.get("VOIX_FILS", "1" if PART else "2"))
VOICE = {"engine": "supertonic-3-int8", "sid": 0, "speed": 0.9, "steps": 8, "lang": "fr", "post": 2}
SR_OUT, BITRATE = 24000, "32k"
os.makedirs(CACHE, exist_ok=True)

import sherpa_onnx as so

# ---------- Synthèse ----------
_tts = None
def tts():
    global _tts
    if _tts is None:
        d = f"{MODELS}/sherpa-onnx-supertonic-3-tts-int8-2026-05-11"
        st = so.OfflineTtsSupertonicModelConfig()
        st.duration_predictor = f"{d}/duration_predictor.int8.onnx"; st.text_encoder = f"{d}/text_encoder.int8.onnx"
        st.vector_estimator = f"{d}/vector_estimator.int8.onnx"; st.vocoder = f"{d}/vocoder.int8.onnx"
        st.tts_json = f"{d}/tts.json"; st.unicode_indexer = f"{d}/unicode_indexer.bin"; st.voice_style = f"{d}/voice.bin"
        mc = so.OfflineTtsModelConfig(); mc.supertonic = st; mc.num_threads = THREADS; mc.provider = "cpu"
        cfg = so.OfflineTtsConfig(); cfg.model = mc
        _tts = so.OfflineTts(cfg)
    return _tts

def synth(text):
    gc = so.GenerationConfig(); gc.sid = VOICE["sid"]; gc.speed = VOICE["speed"]; gc.num_steps = VOICE["steps"]; gc.extra = {"lang": VOICE["lang"]}
    a = tts().generate(text, gc)
    return np.array(a.samples, dtype=np.float32), a.sample_rate

def post(x, sr):
    # Silences coupés au début et à la fin, niveau sonore égal d'un clip à l'autre.
    if not len(x): return x
    f = int(sr * 0.01)
    n = max(1, len(x) // f)
    rms = np.sqrt(np.mean(x[: n * f].reshape(n, f) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    th = max(-48.0, db.max() - 38.0)
    on = np.where(db > th)[0]
    if not len(on): return x
    a, b = max(0, on[0] * f - int(sr * 0.015)), min(len(x), (on[-1] + 1) * f + int(sr * 0.04))
    y = x[a:b].copy()
    active = rms[on[0]: on[-1] + 1]
    level = 20 * np.log10(np.sqrt(np.mean(active[active > 10 ** (th / 20)] ** 2)) + 1e-12)
    y *= 10 ** ((-19.0 - level) / 20)
    peak = np.max(np.abs(y))
    if peak > 0.89: y *= 0.89 / peak
    fade = min(len(y) // 4, int(sr * 0.008))
    if fade > 1:
        y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    return y

def encode(x, sr, path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                        "-af", f"aresample={SR_OUT}", "-ac", "1", "-c:a", "libmp3lame", "-b:a", BITRATE, path], input=x.astype(np.float32).tobytes())
    if p.returncode: raise RuntimeError(f"ffmpeg {path}")

# ---------- Contrôle ----------
_asr = None
def asr():
    global _asr
    if _asr is None:
        d = f"{MODELS}/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8"
        _asr = so.OfflineRecognizer.from_transducer(encoder=f"{d}/encoder.int8.onnx", decoder=f"{d}/decoder.int8.onnx", joiner=f"{d}/joiner.int8.onnx",
                                                    tokens=f"{d}/tokens.txt", model_type="nemo_transducer", num_threads=THREADS)
    return _asr

def transcribe(x, sr):
    n = int(len(x) * 16000 / sr)
    y = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
    s = asr().create_stream(); s.accept_waveform(16000, y); asr().decode_stream(s)
    return s.result.text.strip()

_be = None
def phon(text):
    global _be
    if _be is None:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path()); EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from phonemizer.backend import EspeakBackend
        _be = EspeakBackend("fr-fr", preserve_punctuation=False, with_stress=False, language_switch="remove-flags")
    return _be.phonemize([text], strip=True)[0]

# Sons proches confondus (é/è, o ouvert/fermé, e muet…), longueur et espaces ignorés.
MERGE = [("ɛ̃", "Ẽ"), ("œ̃", "Ẽ"), ("ɑ̃", "Ã"), ("ɔ̃", "Õ"), ("ɛ", "e"), ("ɔ", "o"), ("œ", "ø"), ("ə", "ø"), ("ɑ", "a"), ("ː", ""), ("ˈ", ""), ("ˌ", ""), ("ɡ", "g")]
def canon(p):
    for a, b in MERGE: p = p.replace(a, b)
    return re.sub(r"[\s\-,.!?;:'’()«»]", "", p)

def dist(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]

def per(expected_ph, heard_text):
    r, h = canon(expected_ph), canon(phon(heard_text)) if heard_text else ""
    return dist(r, h) / max(1, len(r))

_carrier = None
def carrier():
    global _carrier
    if _carrier is None:
        x, sr = synth("Je dis")
        _carrier = (post(x, sr), sr)
    return _carrier

# Écritures à essayer et sons attendus pour les syllabes et morceaux de mots.
PRON = json.load(open(os.path.join(ROOT, "voix/prononciation.json"), encoding="utf-8"))
ALT, IPA = PRON["essais"], PRON["sons"]

def check(y, sr, say, short, expected_ph):
    if not CONTROLE: return 0.0, ""
    if short:
        c, csr = carrier()
        y2 = np.concatenate([c, np.zeros(int(sr * 0.12), np.float32), y])
        heard = transcribe(y2, sr)
        return per("ʒədi" + expected_ph, heard), heard
    heard = transcribe(y, sr)
    return per(expected_ph, heard), heard

def expected_of(say):
    # Les sons attendus : ceux du texte corrigé (eSpeak avale aussi les consonnes finales que les corrections rétablissent,
    # « nounours » → « nounourse ») ; sinon le contrôle trouverait juste ce qui ne l'est pas.
    w = say.strip(" .,!?…").lower()
    return IPA.get(w) or phon(fix_text(say))

# Corrections de prononciation appliquées à tous les textes envoyés à la voix (voir voix/prononciation.json,
# « corrections » : expression régulière → remplacement ; une majuscule de départ est gardée).
def _keep_case(rep):
    def f(m):
        out = m.expand(rep)
        return out[:1].upper() + out[1:] if m.group(0)[:1].isupper() else out
    return f
FIXES = [(re.compile(p, re.I), _keep_case(r)) for p, r in PRON.get("corrections", [])]
# Syllabes ou petits mots en liste (« mot, tôt : moto ! », « Écoute : la, ma. ») : une vraie pause entre chacun,
# sinon la voix les enchaîne trop vite pour qu'on entende les morceaux.
SYL_LIST = re.compile(r"(^|: )((?:[\w'’]{1,6}, )+[\w'’]{1,6})(?=\s*[:.!?]|$)")
NOT_SYL = {"ça", "c'est", "oui", "non", "et", "ou", "bien", "bravo", "super"}
def _slow(m):
    if any(w.lower() in NOT_SYL for w in m.group(2).split(", ")): return m.group(0)
    return m.group(1) + m.group(2).replace(", ", "… ")
# Devant deux-points, la voix prononce une consonne finale muette (« qui choisis : » devenait « choisisses ») :
# ces deux-points deviennent une virgule. Sauf « c'est : é » (pause voulue avant une voyelle seule) et les syllabes
# recollées (« mot… tôt : moto ! »), qui ont besoin de leurs deux-points.
COLON = re.compile(r"([\w'’]+)\s*:(?=\s)")
def _colon(s):
    def rep(m):
        w = m.group(1).lower()
        if w in ("c'est", "c’est") or "…" in s[:m.start()] or len(w) < 3 or not re.search(r"([stdxz]|er)$", w): return m.group(0)
        return m.group(1) + ","
    return COLON.sub(rep, s)

def fix_text(s):
    for rx, rep in FIXES: s = rx.sub(rep, s)
    return _colon(SYL_LIST.sub(_slow, s))

def prepare(clip, chosen):
    """Texte dit par la voix, écritures à essayer et empreinte du clip dans le cache."""
    say = fix_text(clip["say"])
    tok = say.strip(" .,!?…:;")
    tries = ALT.get(tok.lower(), [tok]) if clip["words"] == 1 else []
    if clip["words"] > 1 and chosen:
        # Pseudo-mots réécrits dans les phrases avec l'écriture retenue (« Touche pu. » → « Touche pue. »).
        say = re.sub(r"(?<![\w'’-])(" + "|".join(map(re.escape, sorted(chosen, key=len, reverse=True))) + r")(?![\w'’-])",
                     lambda m: chosen.get(m.group(1).lower(), m.group(1)), say)
    h = hashlib.sha1(json.dumps([VOICE, say, tries], ensure_ascii=False).encode()).hexdigest()[:16]
    return say, tok, tries, h

REAL_WORDS = set("a i o u é la ma sa ta va pa ra si ni du tu vu nu lu pu le me te de ne lit riz nid on rat ré dé né fa mes les ces thé fée".split())

def make(clip, chosen):
    """Fabrique un clip (ou le reprend du cache). Renvoie les métadonnées."""
    words = clip["words"]
    short = words <= 2
    say, tok, tries, h = prepare(clip, chosen)
    meta_path, mp3 = f"{CACHE}/{h}.json", f"{CACHE}/{h}.mp3"
    if os.path.exists(meta_path) and os.path.exists(mp3):
        return json.load(open(meta_path, encoding="utf-8"))
    expected = expected_of(clip["say"])
    best = None
    if words == 1 and tok.lower() in ALT:
        # Syllabe ou morceau de mot : l'écriture préférée d'abord, les autres seulement si elle est mal entendue.
        for rank, spelling in enumerate(tries):
            text = re.sub(re.escape(tok), spelling, say, count=1)
            for attempt in range(2):
                x, sr = synth(text)
                y = post(x, sr)
                score, heard = check(y, sr, text, True, expected)
                if best is None or score + 0.1 * rank < best[0] + 0.1 * best[6] - 1e-9:
                    best = (score, heard, y, sr, text, spelling, rank)
                if score < 0.3: break
            if best[0] < 0.3: break
    else:
        for attempt in range(3):
            x, sr = synth(say)
            y = post(x, sr)
            score, heard = check(y, sr, say, short, expected)
            if best is None or score < best[0] - 1e-9:
                best = (score, heard, y, sr, say, None, 0)
            if score <= (0.15 if short else 0.08): break
    score, heard, y, sr, text, spelling, _rank = best
    encode(y, sr, mp3)
    meta = {"h": h, "say": text, "per": round(score, 3), "heard": heard, "ms": int(round(len(y) / sr * 1000)), "spelling": spelling}
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False)
    return meta

def graine():
    """Remet dans le cache les clips du pack déjà publié : seuls les clips nouveaux ou changés seront fabriqués."""
    out = os.path.join(ROOT, "public/voix")
    man = os.path.join(ROOT, "voix/pack.json")
    if not (os.path.isdir(out) and os.path.exists(man)): return 0
    idx = [f for f in os.listdir(out) if f.startswith("index-") and f.endswith(".json")]
    if not idx: return 0
    index = json.load(open(os.path.join(out, idx[0]), encoding="utf-8"))
    packs = [open(os.path.join(out, p["nom"]), "rb").read() for p in index["paquets"]]
    n = 0
    for key, m in json.load(open(man, encoding="utf-8")).items():
        if key not in index["clips"] or os.path.exists(f"{CACHE}/{m['h']}.json"): continue
        pi, off, ln, ms = index["clips"][key]
        open(f"{CACHE}/{m['h']}.mp3", "wb").write(packs[pi][off: off + ln])
        json.dump({"h": m["h"], "say": m["say"], "per": m["per"], "heard": "", "ms": ms, "spelling": m.get("spelling")},
                  open(f"{CACHE}/{m['h']}.json", "w", encoding="utf-8"), ensure_ascii=False)
        n += 1
    return n

def cached(clip, chosen):
    """Métadonnées du clip s'il est déjà dans le cache (sans rien fabriquer)."""
    _say, _tok, _tries, h = prepare(clip, chosen)
    meta_path = f"{CACHE}/{h}.json"
    return json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) and os.path.exists(f"{CACHE}/{h}.mp3") else None

def improve(clip, chosen, takes=4):
    """Nouvelles prises pour un clip jugé douteux : on garde la meilleure, l'ancienne comprise."""
    say, tok, tries, h = prepare(clip, chosen)
    meta_path, mp3 = f"{CACHE}/{h}.json", f"{CACHE}/{h}.mp3"
    meta = json.load(open(meta_path, encoding="utf-8"))
    text, short = meta["say"], clip["words"] <= 2
    expected = expected_of(clip["say"])
    for _ in range(takes):
        x, sr = synth(text)
        y = post(x, sr)
        score, heard = check(y, sr, text, short, expected)
        if score < meta["per"] - 1e-9:
            encode(y, sr, mp3)
            meta.update({"per": round(score, 3), "heard": heard, "ms": int(round(len(y) / sr * 1000))})
            json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False)
        if meta["per"] <= (0.15 if short else 0.08): break
    return meta

def main():
    clips = json.load(open(os.path.join(ROOT, "voix/clips.json"), encoding="utf-8"))
    only = sys.argv[1] if len(sys.argv) > 1 else None
    seeded = graine() if only != "partiel" else 0
    if seeded: print(f"{seeded} clips repris du pack publié", flush=True)
    if only == "partiel":
        # Paquet d'essai avec les clips déjà faits (pour tester l'appli pendant que la génération continue).
        singles = [c for c in clips if c["words"] == 1 and c["say"].strip(" .,!?…:;").lower() in ALT]
        chosen = {}
        for c in singles:
            m = cached(c, None); tok = c["say"].strip(" .,!?…:;").lower()
            if m and m.get("spelling") and m["spelling"].lower() != tok and tok not in REAL_WORDS: chosen[tok] = m["spelling"]
        metas = {c["key"]: cached(c, None if c in singles else chosen) for c in clips}
        part = [c for c in clips if metas[c["key"]]]
        build(part, metas)
        return
    # 1) Syllabes et morceaux isolés d'abord : leur meilleure écriture sert ensuite dans les phrases.
    singles = [c for c in clips if c["words"] == 1 and c["say"].strip(" .,!?…:;").lower() in ALT]
    chosen = {}
    t0 = time.time(); done = 0
    for c in singles:
        m = make(c, None)
        tok = c["say"].strip(" .,!?…:;").lower()
        # Seuls les pseudo-mots sont réécrits dans les phrases (jamais « a », « la », « lit »… qui y ont leur sens).
        if m.get("spelling") and m["spelling"].lower() != tok and tok not in REAL_WORDS: chosen[tok] = m["spelling"]
        done += 1
    print(f"syllabes : {len(singles)} clips, écritures changées : {chosen}", flush=True)
    rest = [c for c in clips if c not in singles]
    if only == "syllabes": return
    if PART:
        i, n = map(int, PART.split("/"))
        mine = [c for k, c in enumerate(rest) if k % n == i]
        for k, c in enumerate(mine):
            make(c, chosen)
            if k % 100 == 0: print(f"partie {PART} : {k}/{len(mine)} clips ({(time.time() - t0) / 60:.1f} min)", flush=True)
        print(f"partie {PART} : terminé ({(time.time() - t0) / 60:.1f} min)", flush=True)
        return
    metas = {}
    for i, c in enumerate(rest):
        metas[c["key"]] = make(c, chosen)
        if i % 100 == 0:
            el = time.time() - t0
            print(f"{i}/{len(rest)} clips ({el / 60:.1f} min)", flush=True)
    for c in singles: metas[c["key"]] = make(c, None)
    if only == "reprise":
        # Seconde chance pour les clips du rapport précédent.
        flagged = {f["key"] for f in json.load(open(os.path.join(ROOT, "voix/rapport.json"), encoding="utf-8"))["a_revoir"]}
        for c in clips:
            if c["key"] in flagged: metas[c["key"]] = improve(c, None if c in singles else chosen)
        print(f"reprise : {len(flagged)} clips revus", flush=True)
    build(clips, metas)

def build(clips, metas):
    out = os.path.join(ROOT, "public/voix")
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(os.path.join(out, f))
    packs = sorted({c["pack"] for c in clips}, key=lambda p: (p != "commun", p))
    index = {"v": 1, "voix": "Supertonic 3 · F1", "vitesse": VOICE["speed"], "paquets": [], "clips": {}}
    total_bytes, total_ms, flagged = 0, 0, []
    for pi, p in enumerate(packs):
        blob = bytearray()
        for c in clips:
            if c["pack"] != p: continue
            m = metas[c["key"]]
            data = open(f"{CACHE}/{m['h']}.mp3", "rb").read()
            index["clips"][c["key"]] = [pi, len(blob), len(data), m["ms"]]
            blob += data; total_ms += m["ms"]
            if m["per"] > (0.2 if c["words"] <= 2 else 0.15): flagged.append({"key": c["key"], "say": m["say"], "heard": m["heard"], "per": m["per"]})
        # Un paquet est une suite de MP3 complets, mis bout à bout : c'est encore un flux MP3 valable.
        name = f"{p}-{hashlib.sha1(bytes(blob)).hexdigest()[:10]}.mp3"
        open(os.path.join(out, name), "wb").write(bytes(blob))
        index["paquets"].append({"nom": name, "octets": len(blob)})
        total_bytes += len(blob)
    index["octets"], index["secondes"] = total_bytes, round(total_ms / 1000)
    # Empreinte de chaque clip publié : une prochaine génération reprend ces clips tels quels (voir graine()).
    json.dump({c["key"]: {"h": metas[c["key"]]["h"], "say": metas[c["key"]]["say"], "per": metas[c["key"]]["per"], "spelling": metas[c["key"]].get("spelling")} for c in clips},
              open(os.path.join(ROOT, "voix/pack.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    raw = json.dumps(index, ensure_ascii=False, separators=(",", ":")).encode()
    name = f"index-{hashlib.sha1(raw).hexdigest()[:10]}.json"
    open(os.path.join(out, name), "wb").write(raw)
    json.dump({"clips": len(clips), "octets": total_bytes, "minutes": round(total_ms / 60000, 1), "a_revoir": flagged},
              open(os.path.join(ROOT, "voix/rapport.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"pack : {len(clips)} clips, {total_bytes / 1e6:.1f} Mo, {total_ms / 60000:.0f} min, à revoir : {len(flagged)}", flush=True)

if __name__ == "__main__":
    main()
