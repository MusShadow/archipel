# Archipel

Application éducative adaptative pour un enfant de 4 à 6 ans, pensée pour l'iPad.
Un archipel d'îles à explorer avec Plume, un colibri voyageur : nombres, lecture, drapeaux du monde, et bientôt énigmes, découvertes, atelier et émotions.

Principes : pas de publicité, pas d'achat, pas de compte, pas d'inconnus, pas d'accès libre à Internet.
Les progrès restent sur l'appareil. Les séances sont courtes (12 minutes par défaut) et se terminent par un défi à faire hors écran.

## Livraison 1

- **Le grand départ** : la première aventure de l'enfant, trois mini-parcours dont la difficulté bouge à chaque réponse, pour régler les niveaux de départ en jouant.
- **Carte de l'archipel** : missions proposées par le planificateur (révisions dues, compétences « à la frontière », équilibre entre domaines, objectifs du parent), soleil qui mesure le temps de séance, choix de l'activité sur chaque île.
- **Île des Nombres** : le marché de Basile (quantités, compléments à 10, dizaines), les nénuphars (ligne numérique, bonds en avant et en arrière, de 2 en 2), le partage du goûter (parts égales, reste, combien chacun).
- **Île des Mots** : les chants de Mona (syllabes frappées, rimes, début et premier son des mots), l'atelier des syllabes (entendre, fabriquer, écrire), lis et trouve (mots, groupes de mots et petites phrases déchiffrables, lettres muettes en gris, mots-outils soulignés).
- **Port des Voyages** : le drapeau mystère, 50 drapeaux et une carte du monde simplifiée.
- **Moteur adaptatif** : modèle de type Elo par compétence (hasard et indices pris en compte), escalier de difficulté, révisions espacées (1, 3, 7, 14, 30 jours), états de maîtrise (découverte, en cours, acquise, consolidée).
- **Plume** donne des indices en 4 étapes ; après 4 erreurs d'affilée, une pause au **coin calme** est proposée (respiration avec Pico).
- **Gommettes** jamais promises à l'avance, toujours expliquées ; **carnet d'explorateur** et passeport des drapeaux ; un défi hors écran à chaque fin de séance.
- **Espace parent** (appui long sur le cadenas puis code, ou « Code oublié ? ») : suivi par compétence, objectifs (trois au plus), profils, réglages (durée, voix, débit, sons connus, mode accompagné), **studio voix** (vos encouragements enregistrés), sauvegarde et restauration.

## Développement

Prérequis : [Bun](https://bun.sh) et TypeScript.

```sh
bun run build       # construit dist/index.html (fichier unique, autonome)
bun test            # tests du moteur, des contenus et des générateurs d'exercices
tsc --noEmit -p .   # vérification des types
python3 tests/e2e/smoke.py   # parcours complet dans Chrome (Playwright), captures dans tests/e2e/shots
```

Aucune dépendance d'exécution. Les illustrations sont des formes vectorielles générées par `scripts/gen_art_ts.py` (voir `scripts/archi_lib.py`) dans `src/art_static.ts`.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/core.ts` | Référentiel de compétences, modèle de l'enfant, escalier, planificateur (sans DOM, testé) |
| `src/content.ts` | Progression des sons, mots déchiffrables, phrases de Plume, défis hors écran |
| `src/flags.ts` | Drapeaux (dessins SVG), continents, projection de la carte |
| `src/host.ts` | Hôte commun des activités : consignes, indices, preuves, escalier, fin d'activité |
| `src/activities/` | Une activité par fichier, toutes sur le même contrat `ActivityModule` |
| `src/screens/` | Écrans de l'enfant (accueil, carte, coin calme, carnet, fin de séance) et espace parent |
| `src/services.ts` | Stockage local, synthèse vocale, sons synthétisés |

Ajouter une activité : créer un module qui implémente `ActivityModule` (générer, afficher, indices, gommette, astuce parent), déclarer ses compétences dans `core.ts`, puis l'associer à son île dans `src/activities/index.ts`.

## Publication

Chaque envoi sur `main` lance `.github/workflows/pages.yml` : tests, construction, puis publication sur GitHub Pages
(`https://musshadow.github.io/archipel/`). À faire une fois dans le dépôt : Settings › Pages › Source : GitHub Actions.
GitHub Pages est gratuit pour un dépôt public ; pour un dépôt privé, il faut un forfait payant. Le site publié est toujours
public, mais il ne contient que le code : les données de l'enfant restent sur l'iPad.

L'appli est installable (manifeste, icône) et fonctionne hors ligne grâce à un service worker (`src/sw.js`),
vérifié par `python3 tests/e2e/offline.py`.

## Sur l'iPad

Le mode d'emploi complet (installation sur l'écran d'accueil, Accès guidé, sauvegarde) est dans le document « Archipel sur l'iPad — mode d'emploi ».

- La voix de Plume utilise la synthèse vocale de l'appareil. Pour une voix plus naturelle : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis télécharger une voix « améliorée ». Elle se choisit ensuite dans l'espace parent.
- Le mode « Accès guidé » de l'iPad (Réglages › Accessibilité) permet de verrouiller l'appareil sur l'application pendant la séance.
