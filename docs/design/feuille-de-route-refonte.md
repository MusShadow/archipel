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
| iPad de référence | iPad Pro 11 récent : les dessins sont faits pour 1194 × 834 en paysage ; les modèles M4 font 1210 × 834, également vérifiés (le dessin couvre l'écran, à 1,3 % près) |
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

## Livraison 2 : pilote de cinq écrans (faite)

But : éprouver toute la chaîne sur un parcours complet avant de généraliser.

| Fait | Où |
|---|---|
| Accueil sur la plage ; compagnon de voyage de l'enfant (huit bébés animaux, chapeau d'explorateur de sa couleur), choisi à la création du profil et dans l'espace parent ; les profils existants en reçoivent un | `src/screens/child.ts`, `src/compagnons.ts`, `scripts/illustration/accueil.py` |
| Carte : mer et sept îles redessinées à leur place de la v1, Plume qui vole vers la mission, soleil et lune de l'atelier | `src/screens/child.ts`, `scripts/illustration/carte.py` |
| Écran de l'île des Nombres : lieux et étiquettes qui ouvrent les activités, Plume qui présente et conseille, Basile qui salue | `src/screens/ile.ts` |
| Cadre d'activité habité pour toutes les activités : boutons album, hôte qui réagit, décor léger, cartes album | `src/host.ts` |
| Nénuphars redessinés (étang, nénuphars, grenouille en deux poses) | `src/activities/nenuphars.ts`, `scripts/illustration/activites.py` |
| Fêtes : objets de l'atelier, message d'une seule couleur, grande fête avec l'hôte et Plume, plus rien ne clignote ; gommette de la grenouille | `src/fete.ts`, `scripts/illustration/fetes.py` |
| Fondu de 350 ms entre les écrans, réponse « jouet » à l'appui | `src/app.ts`, `src/host.ts` |
| Trois phrases nouvelles enregistrées (couverture 100 %) | `voix/`, `public/voix/` |
| Tests adaptés (aucune vérification retirée), tests de la refonte, captures avant / après | `tests/`, `docs/design/captures/` |
| Relecture indépendante : 1 constat bloquant (états visuels des activités écrasés par la matière album), 5 importants (fondu qui laissait vivre l'écran quitté, noms d'îles et Plume qui prenaient les appuis, double appui sur l'île, nénuphars trop petits en portrait), 5 mineurs : tous corrigés | — |

Ce qui était prévu :

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

## Livraison 3 : généralisation, île par île (faite)

| Fait | Où |
|---|---|
| L'imagier à la place des emoji, dans toutes les activités (consignes, cartes, gommettes) | `src/lexique.ts`, `src/host.ts`, `src/activities/chants.ts` |
| Les six autres îles dessinées, avec leur écran : Mots, Énigmes, Découvertes, Atelier, Cœur, Port des Voyages. Un lieu par activité, Plume qui présente et conseille, l'hôte qui salue à l'entrée du chemin (Mona et Octave dans une crique) ; la fenêtre d'activités de la v1 ne s'ouvre plus | `scripts/illustration/ile_*.py`, `src/iles.ts`, `src/screens/ile.ts` |
| Découvertes reste en un seul quartier : ses cinq lieux tiennent dans les six emplacements ; le modèle passe en quartiers dès le septième | `src/iles.ts`, `tests/iles.test.ts` |
| En portrait (dessin rogné de 12 % de chaque côté), chaque hôte et chaque lieu restent entiers : vérifié pour les sept îles | `tests/iles.test.ts` |
| Visages dessinés des sept personnages : un portrait pour les médaillons de toutes les activités, et six émotions pour le théâtre de Pico (joie, tristesse, colère, peur, surprise, déception) | `scripts/illustration/visages.py`, `src/ui.ts`, `src/activities/theatre.ts` |
| Le carnet qu'on feuillette : couverture (compagnon, prénom, drapeau de son île), gommettes collées, dessins scotchés, passeport tamponné ; deux pages en paysage, une en portrait, onglets et glissement du doigt | `src/screens/carnet.ts` |
| La fin de séance peinte : coucher de soleil sur l'archipel, le soleil qui descend une seule fois, Plume et le défi pour la maison | `scripts/illustration/fin.py`, `src/screens/child.ts` |
| Le coin calme : Pico entier, assis sur son tapis, les yeux fermés, qui gonfle doucement à l'inspiration ; un halo clair grandit et rapetisse derrière lui | `scripts/illustration/calme.py`, `src/screens/child.ts` |
| La gommette gagnée : ruban, gommette dans sa lumière (rayons fixes) | `src/screens/child.ts` |
| Les écrans à part (dessin pas à pas, miroir de Kiki, drapeau de mon île, histoires) dans le cadre des activités : ruban, décor estompé de leur île, matière album ; Plume dessinée pour l'aide au dessin | `src/host.ts` (`habillerEcran`), `src/screens/draw.ts`, `myflag.ts`, `histoires.ts` |
| Espace parent harmonisé : mêmes jetons (papier, ombres, onglets en pilules, titres Baloo), texte en Inter | `src/screens/styles3.ts` |
| Carte : la bulle de Plume évite aussi les autres îles quand elle le peut | `src/screens/child.ts` |
| Nénuphars : le chiffre posé sur une pastille claire (la réserve de contraste de la livraison 2 est levée) | `src/screens/styles3.ts` |
| Voix : accueil des îles, salut des hôtes, rubriques du carnet (couverture 100 %) | `voix/`, `public/voix/` |
| Tests adaptés (aucune vérification retirée), tests des sept îles et de la livraison 3, captures avant / après | `tests/`, `docs/design/captures/` |
| Relecture indépendante : 0 constat bloquant, 4 importants (étiquette des syllabes posée sur le livre des histoires, visages du théâtre trop proches à la taille de la carte, double appui qui répondait au premier exercice, titre d'histoire long qui poussait un bouton hors de l'écran), 7 mineurs (passeport rogné, paroles du carnet, bulle de Plume sur l'île de la mission, emoji restants, images de l'imagier un peu petites, contraste du coin calme, gros boutons sous 78 px) : tous corrigés | — |
| Visages du théâtre cadrés serré, avec les signes des livres d'images (goutte de sueur de la peur, fumée de la colère, traits de la surprise, grand O) ; l'atelier mesure l'écart entre deux émotions à la taille de la carte et un test l'exige pour chaque paire qu'un exercice peut montrer | `scripts/illustration/visages.py`, `tests/livraison3.test.ts` |
| Un nouvel écran ignore les appuis pendant 400 ms : le second appui d'un double appui ne répond plus à sa place au premier exercice | `src/app.ts`, `tests/e2e/appuis.py` |

Ce qui était prévu :

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

## Livraison 4 : animations et décor vivant (faite)

| Fait | Où |
|---|---|
| Sur la carte, Plume s'envole vers l'île que l'enfant touche (600 ms à 1 s selon la distance ; elle se retourne si elle part vers la gauche), puis l'île s'ouvre ; sa bulle s'efface au départ ; les autres appuis attendent la fin du vol ; avec « Réduire les animations », l'île s'ouvre tout de suite | `src/screens/child.ts`, `tests/e2e/appuis.py` |
| Le décor de chaque île est livré en couches qui bougent seules : deux jeux de reflets qui font onduler la mer, des étincelles, les nuages qui dérivent, la fumée du volcan au loin (et celle du petit volcan des Découvertes), les palmes qui se balancent, le bateau qui tangue, deux papillons ; Basile salue à l'arrivée | `scripts/illustration/vivant.py`, `fabriquer.py`, `src/screens/vivant.ts` |
| Les hôtes respirent et clignent des yeux, sur leur île et dans les activités (une variante « yeux fermés » des cinq hôtes d'activité, posée par-dessus le temps d'un clignement) | `personnages.py` (expression `cligne`), `src/host.ts` |
| Des surprises rares, une à la fois, toutes les 20 à 60 s : le dauphin et ses gerbes, la baleine au loin, les oiseaux ; et une par île : le poisson de l'étang (et le saut de la grenouille), le souffle de Mona, le ballon de Rico, la grosse bouffée du volcan, l'arc-en-ciel, les cœurs de Pico, le voilier du Port | `src/screens/vivant.ts` |
| Le décor répond au toucher : l'hôte sautille, le palmier se secoue, le bateau tangue (appui de 120 ms, réaction de 400 ms) ; ce qui est posé sur un lieu l'ouvre : la grenouille (elle saute) ouvre l'étang, la fumée du petit volcan ouvre le volcan (un palmier dont les palmes passent sur un lieu ne se touche pas) | `src/screens/vivant.ts` |
| Les réactions des hôtes adoucies (un seul petit saut) ; les bruitages en bois, marimba et clochettes, passés par une sortie plus douce (un peu moins fort, aigus filtrés), toujours fabriqués dans le code | `src/host.ts`, `src/services.ts` |
| Garde-fous : tout ce qui bouge en continu va moins vite que l'aile de Plume (vitesses calculées sur les images-clés), seules les surprises sont plus vives ; aucune surprise pendant que Plume parle ni par-dessus une autre, et celle qui joue s'efface si Plume prend la parole ; en arrière-plan, tout se fige, la surprise en cours comprise, et reprend au retour ; l'île quittée, plus rien ne tourne ; avec « Réduire les animations », rien ne bouge, aucune surprise (la fumée des volcans reste posée) | `src/screens/vivant.ts`, `tests/vivant.test.ts`, `tests/e2e/vivant.py` |
| Performances mesurées sur les sept îles, pendant le vol de Plume et pendant l'éruption du volcan : au moins 50 images par seconde exigées (60 mesurées), une image sur vingt au plus à 34 ms, aucune tâche longue, chaque animation sur `transform` et `opacity` seulement ; 300 à 400 Ko d'images par écran d'île, dont 110 à 170 Ko pour le décor vivant | `tests/e2e/performances.py` |
| Ajouté à ta demande : les jeux aux visuels encore simples dessinés comme les nénuphars. Le marché de Basile (panier en osier, corbeille, cagette à dix places, sac de dix pommes, ardoise), le goûter (assiettes en faïence, boîte à biscuits en fer, nappe), flotte ou coule (bassin de verre, onde à l'entrée dans l'eau, réponses en petits bocaux), les motifs de Rico (perles en bois sur un cordon, plateau à alvéoles), le chemin de Bip (potager en cases, Bip le personnage), le grand tri (poubelles à couvercle qui se soulève), le volcan d'Octave (coupe dessinée, éruption). Même pédagogie | `scripts/illustration/jeux*.py`, `src/activities/`, `src/screens/styles4.ts`, `tests/livraison4.test.ts` |
| Les zones touchables du volcan coupé restent celles d'avant : ses images ne prennent pas le doigt | `src/activities/volcan_art.ts` |
| Relecture indépendante, corrigée : la grenouille ne prend plus le doigt à l'étang ; les pommes du marché ne se chevauchent plus dans la corbeille ; les douze perles de « Rico s'est trompé » tiennent sur une ligne en paysage et ne se coupent plus au milieu d'un motif ; « Plus de biscuits à partager » sur une étiquette de papier lisible ; le haut du petit volcan ouvre de nouveau le volcan ; pendant le vol de Plume, plus rien ne répond ; les alvéoles éclairées par l'indice du tableau ne foncent plus ; la cagette du marché s'appelle cagette (voix refaite) ; les gommettes de Bip et du grand tri sont dessinées ; cibles d'au moins 78 px pour les perles à toucher, les flèches de Bip et le cratère | `tests/e2e/jeux.py`, `tests/e2e/vivant.py`, `tests/e2e/appuis.py` |

Ce qui était prévu :

- Les couches de chaque île bougent : vagues, nuages, palmes, bateau, fumée.
- Les personnages respirent et clignent des yeux.
- Les surprises sont rares (une toutes les 20 à 60 s), et le décor répond au toucher.
- Les réactions des hôtes et les bruitages sont adoucis (bois, marimba, clochettes, toujours fabriqués dans le code).
- Les garde-fous de `identite-visuelle.md` s'appliquent ; les performances sont mesurées sur l'iPad.

Les mesures de performance sont faites dans Chrome sans écran (sans carte graphique) : l'essai sur l'iPad reste à faire.

## Livraison 4 bis : les derniers jeux dessinés (faite)

| Fait | Où |
|---|---|
| Les dessins au trait des jeux repeints dans la finition album : les 35 images du voyage de la goutte, les 44 du voyage des déchets, les 26 déchets du grand tri, et les 50 des chapitres du volcan d'Octave (lave, types de volcans, métier, volcans du monde). L'atelier part du dessin de l'appli : chaque image garde son contenu exact (elle a été pensée pour une question), seule sa matière change (volume, trait coloré, gouache, lumière dorée) ; elle prend la place exacte du tracé | `scripts/illustration/pictos.py`, `pictos_source.ts`, `src/activities/*_art.ts` |
| Le voyage des déchets : la rue peinte (ciel, maisons, trottoir, route) en trois calques, le camion à part (il repart après avoir vidé la poubelle) ; les poubelles dessinées du grand tri remplacent celles au trait, dans la rue comme dans les étapes | `src/activities/dechets_art.ts`, `dechets.ts` |
| La carte du monde du Port peinte (mer, vagues, continents en relief, côte claire) ; les continents à toucher sont les mêmes formes, transparentes, posées dessus | `src/activities/drapeau.ts` |
| Les gommettes de la goutte, des déchets et du volcan peintes | `src/activities/*_art.ts` |
| Les derniers mots de l'imagier : les mots du jeu des syllabes (moto, vélo, lama, sofa, piano, radio) prennent l'image de l'imagier, la même que dans les autres jeux ; le tipi et le domino (sans emoji) et midi (l'horloge de l'imagier n'avait ni chiffres ni graduations) ont leur dessin repeint ; le doigt des indices (volcan, déchets) est une image de l'imagier | `src/activities/syllabes.ts`, `volcan.ts`, `dechets.ts` |
| Les histoires sur mesure : l'imagier accueille le vocabulaire courant des petites histoires (372 images en tout) ; l'histoire choisit ses images dans cette liste, un émoji inconnu n'entre pas ; les histoires déjà écrites ne changent pas | `src/stories.ts`, `scripts/illustration/imagier.py` |
| Tests : chaque dessin a son image peinte, plus aucun tracé dans ces jeux, la rue et la carte gardent leurs zones à toucher, mots des syllabes et images des histoires dans l'imagier ; dans le navigateur, toutes les images peintes chargées et jamais étirées | `tests/livraison4bis.test.ts`, `tests/e2e/jeux.py` |
| Relecture indépendante : 0 constat bloquant, 6 importants, une douzaine de mineurs, tous corrigés. Le contour d'un objet blanc ou clair était trop pâle (flèches du recyclage, fêlure du verre, châteaux d'eau) : il garde maintenant au moins 3,3:1 contre le papier, et un trait sans forme (flèche, fêlure, symbole) reste une encre foncée (au moins 4,5:1). Un trait épais (bras, châssis, siège) garde sa largeur. Les fumées ne sont plus coupées, le camion n'a plus de bande sombre, les bords des fonds n'ont plus de liseré. L'image peinte se pose dans un SVG de 100 comme le tracé, donc jamais étirée (les châteaux d'eau, le tipi, le domino). La côte des continents répond au doigt comme avant. Midi est repeint. La poubelle de la rue bascule sans sortir de l'écran (93 % visible au lieu de 30 %). Le doigt d'indice respecte « Réduire les animations ». La lueur d'indice de la carte ne pulse plus que trois fois. L'émoji de secours d'une ancienne histoire est échappé. Un émoji d'histoire avec une teinte de peau ou des espaces garde son image. L'arbre ajouté derrière l'éboueur est retiré | `scripts/illustration/pictos.py`, `src/design/dessins.ts`, `src/activities/dechets.ts`, `drapeau.ts`, `syllabes.ts`, `chants.ts`, `src/stories.ts` |

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
