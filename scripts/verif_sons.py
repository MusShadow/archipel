#!/usr/bin/env python3
# Vérifie les jeux de sons (chants de Mona, grand départ) par la prononciation : chaque clé de rime, de début et de
# premier son doit correspondre à un seul son (eSpeak), et deux clés différentes à deux sons différents.
# « banane » était rangée avec « serpent » (clé « an ») alors que [an] ne rime pas avec [ɑ̃].
# Écrit tests/fixtures/sons.json (prononciation de chaque mot), lu par tests/sons.test.ts.
# Usage (environnement de la voix, avec phonemizer-fork et espeakng-loader) : python3 scripts/verif_sons.py
import collections, json, os, subprocess, sys
import espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_library(espeakng_loader.get_library_path()); EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
from phonemizer.backend import EspeakBackend
from phonemizer.separator import Separator

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
words = json.loads(subprocess.run(["bun", "-e", 'import { SOUND_WORDS } from "./src/lexique"; console.log(JSON.stringify(SOUND_WORDS))'],
                                  cwd=ROOT, capture_output=True, text=True, check=True).stdout)
ipa = EspeakBackend("fr-fr", language_switch="remove-flags").phonemize([w["w"] for w in words], separator=Separator(phone=" ", word="|"), strip=True)
V = {"a", "ɑ", "e", "ɛ", "i", "o", "ɔ", "u", "y", "ø", "œ", "ə", "ɑ̃", "ɔ̃", "ɛ̃", "œ̃"}
out, bad = {}, []
for w, p in zip(words, ipa):
    ph = p.replace("|", " ").split()
    vs = [i for i, x in enumerate(ph) if x in V]
    out[w["w"]] = {"api": "".join(ph), "rime": "".join(ph[vs[-1]:]), "debut": "".join(ph[:vs[0] + 1]), "son": ph[0] if ph[0] not in V else None}
for key in ["rime", "debut", "son"]:
    by_key, by_sound = collections.defaultdict(set), collections.defaultdict(set)
    for w in words:
        if w[key] is None: continue
        by_key[w[key]].add(out[w["w"]][key]); by_sound[out[w["w"]][key]].add(w[key])
    bad += [f"{key} « {k} » : sons différents {sorted(v)}" for k, v in by_key.items() if len(v) > 1]
    bad += [f"{key} : le son [{s}] a plusieurs clés {sorted(v)}" for s, v in by_sound.items() if len(v) > 1]
json.dump(out, open(os.path.join(ROOT, "tests/fixtures/sons.json"), "w"), ensure_ascii=False, indent=1)
print(f"{len(words)} mots ; " + ("aucune incohérence" if not bad else "\n".join(bad)))
sys.exit(1 if bad else 0)
