# Archipel

Application éducative adaptative pour un enfant de 4 à 6 ans, pensée pour l'iPad.
Un archipel d'îles à explorer avec Plume, un colibri voyageur : nombres, lecture, drapeaux du monde, et bientôt énigmes, découvertes, atelier et émotions.

Principes : pas de publicité, pas d'achat, pas de compte, pas d'inconnus, pas d'accès libre à Internet.
Les progrès restent sur l'appareil. Les séances sont courtes (12 minutes par défaut) et se terminent par un défi à faire hors écran.

## Livraison 1 (version jouable)

- **Carte de l'archipel** : missions proposées par le planificateur (révisions dues, compétences « à la frontière », équilibre entre domaines), soleil qui mesure le temps de séance, îles encore endormies.
- **Le marché de Basile** (Nombres) : voir sans compter, constituer une collection, compléter à 10, dizaines et unités.
- **L'atelier des syllabes** (Mots) : entendre une syllabe, la fabriquer, écrire un mot avec des syllabes, lire un mot et trouver son image. Seuls les sons déjà connus sont utilisés.
- **Le drapeau mystère** (Port des Voyages) : reconnaître un drapeau entendu, lire le nom d'un pays, distinguer des drapeaux presque jumeaux, placer un pays sur une carte du monde simplifiée. 50 drapeaux.
- **Moteur adaptatif** : modèle de type Elo par compétence (avec prise en compte du hasard et des indices), escalier de difficulté (2 réussites seules : plus dur ; 2 erreurs : plus facile), révisions espacées (1, 3, 7, 14, 30 jours), états de maîtrise (découverte, en cours, acquise, consolidée).
- **Plume** donne des indices en 4 étapes, du rappel de la consigne jusqu'à la réponse qui brille. Après 4 erreurs d'affilée, une pause au **coin calme** est proposée (respiration avec Pico).
- **Gommettes** jamais promises à l'avance, toujours accompagnées de leur raison ; **carnet d'explorateur** et passeport des drapeaux.
- **Espace parent** (appui long sur le cadenas puis code) : suivi par compétence, temps par domaine, pistes pour la semaine, profils, réglages (durée, voix, débit, sons connus, mode accompagné), sauvegarde et restauration.

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

## Sur l'iPad

- La voix de Plume utilise la synthèse vocale de l'appareil. Pour une voix plus naturelle : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis télécharger une voix « améliorée ». Elle se choisit ensuite dans l'espace parent.
- Le mode « Accès guidé » de l'iPad (Réglages › Accessibilité) permet de verrouiller l'appareil sur l'application pendant la séance.
