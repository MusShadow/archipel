# La voix naturelle de Plume : état et entretien

Ce document permet de reprendre le projet dans une nouvelle conversation, sans rien perdre du contexte.
Le README décrit l'appli, les îles, l'organisation du code et les tests ; ici, seulement la voix de Plume.

## Où en est Archipel (novembre 2026)

- Livraisons 1, 2 et 2 bis terminées et en ligne : https://musshadow.github.io/archipel/
  (GitHub Pages, publié automatiquement à chaque envoi sur `main` par `.github/workflows/pages.yml`).
- Livraison 2 bis : Plume parle avec une voix naturelle pré-enregistrée, gardée pour le hors-ligne.
- Livraison 3 (en cours) : île des Découvertes — le voyage de la goutte et le volcan d'Octave, puis le grand tri et le voyage des déchets.
- Tests : `bun test`, `tsc --noEmit -p .`, et des parcours Playwright avec `/usr/bin/google-chrome` :
  `tests/e2e/smoke.py`, `livraison2.py`, `livraison3.py`, `volcan.py`, `offline.py`, `voix.py`, `ipad.py`, `retours.py`.
- Pour qui : un enfant de 4 ans et demi, sur iPad, accompagné d'un adulte. Tout est en français ; le parent est
  tutoyé dans la conversation, vouvoyé dans l'appli.

## Ce qui a été fait

- **Voix choisie par le parent** : Supertonic 3 (Supertone, modèle OpenRAIL-M), style « F1 », vitesse 0,9, 8 étapes,
  parmi trois échantillons (F1, F2, F3). Kokoro v1.0 (« ff_siwis ») et Piper (« siwis », « upmc ») ont été essayées
  et écartées : moins nettes à la reconnaissance vocale (« douche » pour « touche », « cauche » pour « coche »).
- **Pack** : 4 664 clips, 30 Mo, 116 min de parole, MP3 mono 24 kHz 32 kb/s, dans `public/voix/` :
  un index (`index-<empreinte>.json` : clé → paquet, début, longueur, durée) et 8 paquets (commun + un par île).
- **Lecture** (`src/voix.ts`, `src/services.ts`) : `speech.say` reste l'entrée unique. Texte → mots + ponctuation →
  plan de clips (phrase entière d'abord, sinon morceaux coupés à la ponctuation et avant « ou », « et », « est sur ») →
  lecture par l'`AudioContext` de `sfx` (déverrouillé au premier contact), pauses selon la ponctuation, promesse
  tenue à la fin. Jamais deux morceaux d'un seul mot recollés sans ponctuation. Si le plan échoue : la voix de
  l'appareil dit tout l'énoncé, et le texte est noté dans `speech.misses` (visible par `window.__archipelVoix`).
- **Prénom** : jamais enregistré (le pack est public). `elideName` retire le prénom à sa place d'adresse
  (« Bonjour Léa ! », « …, Léa ? ») et change « l'île de Léa » en « ton île ».
- **Débit** : les clips sont au débit « normal » ; « lent » et « rapide » les étirent sans changer la hauteur (WSOLA).
- **Hors ligne** : `src/sw.js` garde la voix dans un cache à part (`archipel-voix`), d'une version de l'appli à
  l'autre ; seuls les fichiers nouveaux sont téléchargés, les anciens sont effacés.
- **Réglage parent** : « Voix de Plume : Naturelle / De l'iPad », état du pack, voix de l'iPad en secours.
  La licence OpenRAIL-M demande de dire que la voix est générée par ordinateur : c'est écrit dans ce réglage.
- **Non touchés** : le studio voix (enregistrements du parent, clé `archipel.voix`, toujours avant Plume) et les
  histoires sur mesure (voix de l'appareil ; un mot touché seul peut avoir son clip).
- **Artefact Claude « Archipel »** : publié avec le pack (fichiers `voix/…` à côté de `index.html`) ; sans service
  worker, il ne marche pas hors ligne.

## Ajouter ou changer des phrases

1. Modifier le code comme d'habitude.
2. `bun scripts/voix/inventaire.ts` : fait jouer toutes les activités dans un DOM simulé (happy-dom, dépendance de
   développement) et ajoute les phrases des écrans → `voix/inventaire.json`. Une nouvelle phrase d'écran doit être
   ajoutée à la main dans la partie « Écrans » du script (et une phrase à trous rare, dans « Phrases à trous »). Au-delà de `ITEMS=80` exercices par niveau, la mémoire
   de la machine de Claude ne suffit plus.
3. `bun scripts/voix/clips.ts` → `voix/clips.json` (clés, textes à dire, paquet de chaque clip).
4. `python3 scripts/voix/generer.py` : reprend les clips du pack publié (`voix/pack.json`), fabrique les nouveaux,
   contrôle chacun par reconnaissance vocale et écrit `public/voix/` et `voix/rapport.json` (clips douteux).
   Environnement : `pip install "sherpa-onnx==1.13.8" numpy soundfile espeakng-loader phonemizer-fork` (la
   version 2 de sherpa-onnx n'a plus eSpeak intégré), ffmpeg, modèles dans `VOIX_MODELES` téléchargés depuis les
   versions publiées de k2-fsa/sherpa-onnx sur GitHub (Hugging Face est bloqué depuis la machine de Claude).
   Compter environ 1 s par clip ; en parallèle : `VOIX_PART=0/2` et `VOIX_PART=1/2`, puis une passe sans
   `VOIX_PART` pour assembler.
5. Vérifier la couverture sur un inventaire tiré avec une autre graine (100 % en novembre 2026) :
   `SEED=42 ITEMS=40 OUT=/tmp/inv.json bun scripts/voix/inventaire.ts && bun scripts/voix/couverture.ts /tmp/inv.json`.
6. Contrôler les clips nouveaux : `python3 scripts/voix/finales.py fichier_de_clés.txt` (souffle d'un [s] muet
   prononcé en fin de clip, et mots que la reconnaissance a entendus avec un son en trop : « chaude » pour « chaud »,
   « formant » pour « forment »). Un soupçon se confirme en refaisant la phrase deux fois : une faute de la voix se
   répète, une erreur de la reconnaissance non. La correction va dans `voix/prononciation.json`.
7. `bun run build`, les tests, puis committer `dist/`, `public/voix/` et `voix/` avec le code.

`clips.ts` garde les clips de la liste précédente que l'inventaire (tiré au hasard) n'a pas ressortis, sauf pour les
activités qui donnent la liste complète de leurs phrases (`voiceLines()`, aujourd'hui la goutte et le volcan).

Sur iPad (novembre 2026), la voix naturelle se taisait alors que celle de l'iPad marchait : Safari coupe le son des
pages (Web Audio) en mode silencieux et peut laisser le contexte audio « interrompu ». Corrigé dans `services.ts` :
session `navigator.audioSession.type = "playback"`, déverrouillage à chaque fin d'appui ou clic (`main.ts`), contexte
recréé s'il reste bloqué, et lecteur audio HTML de secours (clips en `blob:`) avant la voix de l'appareil.
Test : `tests/e2e/ipad.py` (iPad simulé dans Chrome, moteur audio cassé exprès). Diagnostic sur l'appareil : espace
parent › Réglages › « Écouter Plume ».

Retours de test (novembre 2026) : le partage du goûter dit de nouvelles phrases selon l'état du plateau (boîte vide,
assiettes inégales, panier trop plein) ; elles sont ajoutées à la main dans la partie « Phrases à trous » de
l'inventaire, car le hasard ne les fait pas toujours sortir. Les fêtes de réussite n'ajoutent aucune phrase : leur
message (avec le prénom) est seulement affiché.

Pièges connus de la voix (novembre 2026) : devant deux-points, une consonne finale muette est prononcée (« qui choisis :
» devenait « choisisses ») : ces deux-points deviennent une virgule pour la voix ; « chaud » et « froid » se disaient
avec un [d] ; certains verbes en -ent se disaient en « -ant » (« elles formant ») : on écrit le singulier.

Les écritures des syllabes dites seules sont dans `voix/prononciation.json` (la première est préférée ; les
suivantes ne servent que si la reconnaissance vocale l'entend mal). Les pseudo-mots changés sont repris dans les
phrases (« sue » pour « su », « tôt » pour « to », « fut » pour « fût », « leil » pour « lèye »).

## Habitudes du projet

- Commits en français, terminés par les lignes d'attribution indiquées par la session ;
  envoi avec `git -c push.negotiate=true push origin main`.
- Construire (`bun run build`) puis committer `dist/` avec le code.
