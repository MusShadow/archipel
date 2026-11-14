# Reprise : la voix naturelle de Plume

Ce document permet de reprendre le projet dans une nouvelle conversation, sans rien perdre du contexte.
Le README décrit l'appli, les îles, l'organisation du code et les tests ; ici, seulement la prochaine tâche.

## Où en est Archipel (novembre 2026)

- Livraisons 1 et 2 terminées et en ligne : https://musshadow.github.io/archipel/
  (GitHub Pages, publié automatiquement à chaque envoi sur `main` par `.github/workflows/pages.yml`).
- Sept îles, 17 activités, moteur adaptatif, espace parent, histoires sur mesure, dessin pas à pas.
- Tests : `bun test` (44 tests), `tsc --noEmit -p .`, et trois parcours Playwright avec `/usr/bin/google-chrome` :
  `tests/e2e/smoke.py` (livraison 1), `tests/e2e/livraison2.py` (livraison 2), `tests/e2e/offline.py` (hors ligne).
- Pour qui : un enfant de 4 ans et demi, sur iPad, accompagné d'un adulte. Tout est en français ; le parent est
  tutoyé dans la conversation, vouvoyé dans l'appli.

## La tâche

Aujourd'hui, Plume parle avec la synthèse vocale de l'appareil : `src/services.ts`, classe `Speech`,
`speech.say(texte, débit?)`, qui renvoie une promesse tenue à la fin de la phrase (les activités s'enchaînent dessus),
et `speech.stop()`. Sur iPad, Safari n'a accès qu'aux voix de base (ni voix téléchargées, ni Siri) : la voix sonne
robotique. Objectif : une voix française naturelle, sans rien envoyer et sans casser le hors-ligne.

Approche retenue : pré-enregistrer avec une voix française neuronale libre (par exemple Piper) tout ce qui peut l'être,
l'embarquer comme « pack de voix » (fichiers audio servis par GitHub Pages et gardés par le service worker), et garder
la synthèse de l'iPad en secours pour le reste.

1. **Installer** le moteur et deux ou trois voix françaises candidates. Vérifier leur licence et l'écrire dans le
   README (attribution si CC-BY). Si les modèles sont inaccessibles (par exemple sur Hugging Face), demander au parent
   d'autoriser ce domaine dans Claude (Settings › Capabilities › Allow network egress), puis d'ouvrir une nouvelle
   conversation.
2. **Faire choisir la voix** : deux ou trois échantillons des mêmes phrases, envoyés au parent. C'est la seule décision
   à lui demander.
3. **Inventorier ce que dit Plume** :
   - phrases fixes : `src/content.ts` (`PRAISE`, `PRAISE_AFTER_EFFORT`, `RETRY`, défis), écrans de `src/screens/`
     (carte, coin calme, carnet, fin de séance, grand départ), `pitch` des activités ;
   - consignes, indices et phrases de réussite générées par les activités (`src/activities/*.ts`), souvent à trous
     (nombres, mots, pays, couleurs, formes, personnages) : un script peut faire tourner tous les générateurs à tous
     les niveaux pour recueillir les phrases réellement produites ;
   - mots isolés : lexique (`src/lexique.ts`), syllabes (`SAY_SYL` dans `content.ts`), noms des pays (`src/flags.ts`),
     nombres de 0 à 100.
4. **Brancher la lecture** sans réécrire les activités : `speech.say` reste le point d'entrée unique. Texte normalisé →
   clé → clip s'il existe ; phrases à trous lues par segments enregistrés quand c'est naturel, sinon voix de l'iPad.
   Garder la même promesse de fin. Sur iPad, passer par l'`AudioContext` déjà déverrouillé par un geste
   (`sfx.unlock()`), plus fiable que des balises audio.
5. **Poids et hors-ligne** : clips mono légers (AAC ou MP3 vers 32 kb/s), budget total annoncé au parent ; pré-cache
   par le service worker (`src/sw.js`, copié par `scripts/build.ts`) ; réglage parent « Voix de Plume : naturelle ou
   de l'iPad ».
6. **Tests** : unitaires (texte → clip, repli), parcours e2e avec lecture d'un clip et repli, hors-ligne.
7. **Publier et documenter** : envoi sur `main` (vérifier le déploiement Pages) ; republier l'artefact Claude
   « Archipel » (seul `index.html` y est publié ; il peut garder la voix de l'appareil) ; mettre à jour le mode
   d'emploi iPad (étape 1 « La voix » et « En cas de souci ») et la section « Où on en est » du document de
   proposition.

## À ne pas casser

- Le **studio voix** : les enregistrements du parent (`voice`, clé `archipel.voix`) passent avant Plume.
- Les **histoires sur mesure** (écrites par Claude) restent lues par la voix de l'appareil, ou par segments si possible.
- Aucune donnée de l'enfant envoyée ; aucune dépendance ajoutée à l'exécution ; l'appli doit rester utilisable hors ligne.

## Habitudes du projet

- Commits en français, terminés par les lignes d'attribution indiquées par la session ;
  envoi avec `git -c push.negotiate=true push origin main`.
- Construire (`bun run build`) puis committer `dist/` avec le code.
