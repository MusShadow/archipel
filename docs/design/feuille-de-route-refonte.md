# Feuille de route de la refonte (Archipel 2)

La v2 refait ce que l'enfant voit, entend en bruitage et touche. Elle garde ce qui décide quoi lui proposer :

- le moteur adaptatif (`core.ts`), la pédagogie, les contenus ;
- la voix et le studio voix ;
- les histoires sur mesure ;
- le stockage local, le hors-ligne.

Six livraisons. Chacune est testée, puis essayée sur l'iPad avant la suivante.

## Règles qui valent pour toute la refonte

- **Aucune donnée de l'enfant envoyée, aucune dépendance ajoutée à l'exécution, l'appli reste utilisable hors ligne.**
- Le prénom de l'enfant ne va jamais dans le pack de voix public : il est seulement affiché. Rien de ce qui part sur GitHub ne contient le prénom de l'enfant : les tests utilisent un prénom fictif.
- Ne pas casser le studio voix (enregistrements du parent) ni les histoires sur mesure.
- La v2 a ses propres clés (`archipel2.`) et caches (`archipel2-`) et ne modifie jamais les données de la v1. Elle peut reprendre les progrès de la v1 depuis une sauvegarde.
- Chaque activité sépare déjà le calcul de l'exercice (`generate`, `hint`) de son affichage (`render`) : on refait `render` et les écrans, on ne touche pas au reste. On garde les repères que lisent les tests (`data-t`, `data-n`, `aria-label`).
- **Branches** : `v1` reçoit seulement des correctifs, `v2` reçoit toute la refonte, `main` publie les deux.
- **Habitudes** :
  1. commits en français ;
  2. `bun run build`, puis `dist/` committé avec le code ;
  3. envoi avec `git -c push.negotiate=true push origin <branche>`.
- **Publication** : le workflow « Vérifier » (tests, types, construction, `dist/` à jour) tourne sur `v1` et `v2`. Quand il réussit, « Publier Archipel » (sur `main`) assemble la v1 à la racine et la v2 dans `v2/`.

## Décisions prises

| Question | Décision |
|---|---|
| Point de départ de la v1 | `8694fea` (tag `v1.0`, à poser depuis un poste qui a les droits : `git tag -a v1.0 8694fea -m "Archipel v1.0" && git push origin v1.0`) |
| Branche de publication | `main` |
| Correctif du service worker de la v1 | fait en livraison 0 |
| Finition | album illustré |
| Images | atelier d'illustration et base libre pour l'imagier (Fluent Emoji, licence MIT) |
| Fêtes | scènes actuelles gardées et redessinées, l'hôte qui réagit, message d'une seule couleur, grande scène finale en fin d'activité |
| Activité du pilote | les nénuphars |
| iPad de référence | iPad Pro 11 récent (1194 × 834 en paysage) |
| Îles | extensibles : un décor de base, six emplacements, un lieu par activité, des quartiers au-delà |
| Décor | vivant, avec des garde-fous ; le guide est l'élément le plus calme de l'écran |

## Livraison 0 : cohabitation (faite)

- La v1 reste sur `/archipel/` avec une ligne de correctif dans son service worker : il laisse passer tout ce qui concerne `/v2/`.
- « Archipel 2 » vit sur `/archipel/v2/`, avec son nom, son icône, ses clés et ses caches, et peut reprendre une sauvegarde de la v1.
- `main` publie les deux ; un test de cohabitation vérifie le site assemblé.
- L'atelier de voix est remis en route (couverture 100 %).

## Livraison 1 : fondations (faite)

Rien ne change encore dans les écrans de l'enfant.

| Fait | Où |
|---|---|
| Les cinq documents de conception | `docs/design/` |
| Polices embarquées, plus aucun appel à Google | `public/polices/`, `src/index.html` |
| Système de design : jetons et cinq composants album, contrastes testés | `src/design/` |
| Atelier d'illustration dans le dépôt, rendu déterministe | `scripts/illustration/` |
| Personnages : Plume (cinq poses, quatre expressions, trois pièces) et sept hôtes (cinq expressions et un salut) | `public/illustrations/personnages/` |
| Îles extensibles : modèle, île des Nombres dessinée en couches | `src/iles.ts`, `public/illustrations/iles/` |
| Imagier : 195 images, licence MIT jointe | `public/imagier/`, `src/imagier.ts` |
| Images gardées hors ligne d'une version à l'autre | `src/sw.js` (cache `archipel2-images`) |
| Vitrine cachée pour juger sur l'iPad | `…/v2/#vitrine`, `src/vitrine.ts` |
| Test du volcan rendu déterministe ; nouveaux tests (design, polices, îles, illustrations, imagier, vitrine) | `tests/` |
| Planches « La famille d'Archipel » et « Cinq expressions », à montrer à l'enfant | canevas des pistes visuelles |

## Livraison 2 : pilote de cinq écrans

But : éprouver toute la chaîne sur un parcours complet avant de généraliser.

1. **Accueil.** Un décor de plage, l'enfant se reconnaît (avatar dessiné qu'il choisit), Plume qui accueille.
2. **Carte de l'archipel.** Les sept îles dessinées, toutes différentes ; Plume vole vers la mission proposée ; le soleil qui mesure la séance est gardé.
3. **Écran de l'île des Nombres.**
   - Le décor et les lieux de la livraison 1, les étiquettes, Basile qui accueille, Plume qui conseille.
   - Il remplace la fenêtre à cartes pour cette île. Les autres îles gardent la fenêtre de la v1 jusqu'à leur tour.
4. **Cadre d'activité habité, avec les nénuphars redessinés.** Un décor léger de l'île derrière la zone de jeu, l'hôte à côté qui réagit (expressions), les trois boutons fixes dans la finition album.
5. **Fêtes et gommette.**
   - Les scènes actuelles, redessinées : l'hôte qui réagit, un message d'une seule couleur ;
   - la grande scène finale en fin d'activité ;
   - la gommette dans la nouvelle matière.

Avec :

- les gestes de base (appui de jouet, transitions de 350 ms entre écrans) ;
- les phrases de voix nouvelles (couverture 100 %) ;
- les captures avant et après ;
- un essai sur l'iPad.

## Livraison 3 : généralisation, île par île

L'île des Mots passe en premier : la lecture est l'objectif principal, et c'est elle qui a le plus d'images à redessiner. Puis Énigmes, Découvertes (la première à passer en quartiers), Atelier, Cœur et le Port des Voyages.

Pour chaque île :

- son décor et ses lieux (atelier d'illustration) ;
- l'affichage de ses activités redessiné ;
- l'imagier à la place des emoji ;
- ses phrases de voix ;
- ses tests adaptés sans retirer une vérification.

Aussi :

- le théâtre de Pico avec les visages des personnages (tristesse, colère, peur, déception) ;
- le carnet qu'on feuillette ;
- la fin de séance avec ses images ;
- le coin calme avec Pico en entier.

L'espace parent est seulement harmonisé (mêmes jetons).

## Livraison 4 : animations et décor vivant

- Les couches de chaque île bougent : vagues, nuages, palmes, bateau, fumée.
- Les personnages respirent et clignent des yeux.
- Les surprises sont rares (une toutes les 20 à 60 s), et le décor répond au toucher.
- Les réactions des hôtes et les bruitages sont adoucis (bois, marimba, clochettes, toujours fabriqués dans le code).
- Les garde-fous de `identite-visuelle.md` s'appliquent ; les performances sont mesurées sur l'iPad.

## Livraison 5 : validation finale

- Essai complet sur l'iPad (paysage et portrait), avec l'enfant.
- Captures après pour tous les écrans de l'audit.
- Revue d'accessibilité (contrastes, cibles, VoiceOver, « Réduire les animations »).
- Performances, hors-ligne, mises à jour.
- Relecture indépendante.
- Décision sur la suite de la v1.

## Organisation

Six rôles, un seul propriétaire à la fois sur chaque partie du code ; le contrôle est confié à un agent qui n'a pas écrit ce qu'il vérifie.

| Rôle | Livre | Quand |
|---|---|---|
| Auditeur UX/UI | `audit-visuel.md`, captures avant et après | livraison 1, puis à chaque livraison |
| Directeur artistique | `identite-visuelle.md`, `guide-personnages.md`, planches, atelier d'illustration | livraison 1, puis avant chaque île |
| Concepteur UI | `systeme-de-design.md`, jetons, composants | livraisons 1 et 2 |
| Développeur frontend | les écrans et l'affichage des activités | livraisons 2 et 3 |
| Motion designer | animations, transitions, réactions | gestes de base en 2, le reste en 4 |
| QA | tests, régressions, iPad, comparaison des captures, rapport | fin de chaque livraison |

## Risques et parades

| Risque | Parade |
|---|---|
| Casser la v1 en changeant la publication | <ul><li>la v1 reste à la racine avec les mêmes fichiers (sauf `sw.js`) ;</li><li>test de cohabitation ;</li><li>Pages garde l'ancienne version tant que la nouvelle n'a pas réussi ;</li><li>tag `v1.0` pour revenir.</li></ul> |
| Service workers qui se gênent | préfixe `archipel2-`, correctif d'une ligne dans la v1, test automatique |
| Régressions pendant la refonte | on change l'affichage, pas la logique ; tous les tests à chaque livraison ; repères des tests gardés |
| Voix incomplète | inventaire et couverture à 100 % avant chaque livraison |
| Performances sur iPad | images calculées à l'avance, animations sur `transform` et `opacity`, rien qui tourne en boucle hors du personnage-guide |
| Poids de l'appli | images en WebP à l'échelle 2 ; environ 300 Ko par île, 3,3 Mo d'images en tout à la livraison 1 ; gardées d'une version à l'autre |
