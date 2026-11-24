# Identité visuelle d'Archipel 2 : la finition « album illustré »

Ce document est la bible de la direction artistique. Toute image, tout écran et toute animation d'Archipel 2 s'y réfère. Les valeurs exactes sont dans `src/design/jetons.ts` (voir `systeme-de-design.md`) ; les personnages dans `guide-personnages.md`.

## L'idée

Un livre d'images qu'on visite. L'enfant de 4 à 6 ans voyage d'île en île ; chaque île est un lieu dessiné, habité par son hôte, où chaque endroit ouvre une activité. Tout est dans **un seul style**, du décor de l'île à la plus petite image d'exercice : c'est ce qui fait passer l'appli d'un assemblage d'éléments à un monde.

Finition retenue : l'**album illustré** (piste 1 des planches), la plus proche des références et la plus chaleureuse pour un enfant de cet âge. Elle repose sur :

- deux tons doux et un trait coloré ;
- une texture gouache ;
- une lumière dorée.

## Références, et ce qu'on en reprend

| Référence | Ce qu'on reprend, à notre façon |
|---|---|
| Khan Academy Kids | des hôtes présents dans leurs activités, qui réagissent et félicitent la démarche |
| Montessori Preschool | un menu qui est un lieu à explorer : on touche les objets d'une île pour ouvrir une activité |
| Pok Pok | la matière « faite main » et une réponse de jouet à chaque contact ; le calme : rien ne clignote ni ne se répète en boucle |
| Duolingo ABC | le mot qui s'allume pendant la lecture, des félicitations nettes et brèves |

**Règle de non-copie.** On reprend des principes, jamais un dessin, une couleur, une mise en page ou un personnage. Khan Academy Kids a lui aussi un colibri : Plume garde ce qui la distingue, à savoir sa silhouette fine d'aventurière, son écharpe corail et sa palette turquoise. Chaque planche passe une relecture de ressemblance.

## Lumière

- Une seule source, **en haut à gauche**, un peu de face, pour toutes les images et tous les composants : le côté haut-gauche d'une forme est éclairé, le bas-droite est dans l'ombre.
- Lumière **dorée d'après-midi** :
  - lumière principale `#FFF3DF` ;
  - ambiance bleutée `#C9D9F2` ;
  - un léger réchauffement de toute l'image (rouge +4,5 %, bleu −7 %).
- Le soleil est un halo doux dans le ciel en haut à gauche, jamais un disque éblouissant.

## Volume et matière

- **Deux tons par forme.** Le ton éclairé et le ton d'ombre, séparés par une transition douce. L'ombre tire vers le bleu-violet, plus saturée, comme en gouache ; jamais vers le gris ni le noir.
- **Trait coloré.** Chaque forme est cernée d'une version sombre de sa propre couleur, plus épaisse du côté de l'ombre. Jamais de contour noir uniforme.
- **Texture gouache** sur toutes les surfaces :
  - une marbrure lente ;
  - un grain fin ;
  - des coups de pinceau allongés ;
  - du pigment qui s'accumule un peu au bord.

  Elle efface l'aspect calculé.
- **Ombres posées.** Chaque objet posé au sol a une ombre de contact douce, décalée vers le bas à droite. Teinte d'ombre : `#3B3F78`, jamais du noir.
- **Profondeur.** Les îles lointaines prennent une brume bleutée ; la mer s'assombrit vers le bas de l'écran.

## Formes

- **Souples et fusionnées** : chaque personnage et chaque objet est une seule silhouette, faite de courbes, et non de ronds et de triangles empilés.
- **Rondes, jamais pointues**, sauf un signe voulu : le bec de Plume, les piquants de Pico, les oreilles de Rico.
- **Aucun détail plus fin que 2 mm à l'écran** : ce qui ne se voit pas à bout de bras n'est pas dessiné.
- **Un peu d'imperfection** : la nature n'est jamais parfaitement symétrique (graine fixe, donc stable d'un rendu à l'autre).

## Couleurs

**Les couleurs des îles ne changent pas** : l'enfant les connaît. Chacune a quatre tons (voir `systeme-de-design.md`).

| Île | Couleur |
|---|---|
| Nombres | `#3D8BEA` |
| Mots | `#FF7F50` |
| Port des Voyages | `#1FA9B5` |
| Énigmes | `#8C6BE0` |
| Découvertes | `#34B37A` |
| Atelier | `#FFC145` |
| Cœur | `#E85D9A` |

La couleur d'une île sert de **repère** : la pastille du ruban, l'hôte, ce qu'il porte (le tablier bleu de Basile, le foulard violet de Rico). Elle n'envahit pas le décor.

**La nature** est commune à toutes les îles :

| Élément | Couleurs |
|---|---|
| Ciel | du haut vers l'horizon : `#9FD8EA`, `#C4E8F0`, `#E3F4F1` |
| Mer | du loin vers le près : `#8FD7DF`, `#56BCCB`, `#2E9FB6` ; reflets `#BFEFF0`, écume `#F2FBF8` |
| Plage et chemin | `#F3DDAF`, `#EAD3A2` |
| Herbe | `#9BD27A` vers `#7CC062` |
| Flanc de l'île | `#E2B47C` vers `#B97F4C`, en strates |
| Feuillage | `#4FA74E`, palmes `#47A353` |
| Bois | `#C98D58` |

**Le papier de l'interface** :

| Rôle | Couleur |
|---|---|
| Fond des écrans | crème `#FFF7EA` (jeton `creme`) |
| Boutons et pastilles | `#FFF8EC` (jeton `surface`) |
| Cartes et bulles | `#FFFDF8` (jeton `papier`) |
| Bords, couleur sable | `#E2CBA6` (jeton `bord`) |
| Texte | encre `#273043` (jeton `encre`) |

**Jamais de rouge pour une erreur.** Une bonne réponse pose un anneau vert. Un essai fait seulement balancer la carte, et l'hôte encourage d'un air doux.

## Typographie

| Police | Rôle | Pourquoi |
|---|---|---|
| Andika | tout ce que l'enfant lit (mots, syllabes, histoires, bulles) | dessinée pour l'apprentissage de la lecture : « a » et « g » d'écriture, lettres bien distinctes |
| Baloo 2 | titres, étiquettes, chiffres | ronde et joyeuse, lisible de loin |
| Inter | tout ce qui s'adresse à l'adulte (astuces, espace parent) | sobre et dense |

Les trois sont embarquées dans l'appli (licence SIL OFL).

## Personnages

Plume et les sept hôtes sont dessinés **en entier**, avec la même lumière et la même matière que le décor. Chacun garde les signes de la v1 et a cinq expressions. Voir `guide-personnages.md`.

## Mouvement

- Les réponses de l'interface durent **de 200 à 400 ms**, un changement d'écran 350 ms. L'écho d'un appui (le bouton qui s'enfonce) est immédiat : 120 ms, comme dans la v1.
- **Jamais de clignotement**, jamais de mouvement rapide qui se répète.
- Une **réponse de jouet à chaque contact** : un petit enfoncement, un son doux.
- **Le personnage-guide est l'élément le plus calme de l'écran.** Plume bat des ailes lentement et souplement : 1,1 s par aller, de +3° à −16°, avec un léger flottement. Les mouvements rapides restent réservés aux surprises courtes.

## Décor vivant (livraison 4)

Chaque écran est livré en couches (ciel, nuages, mer, île, lieux, personnages, éléments animés) ; chaque couche peut bouger seule.

- **En continu et discret** :
  - vagues et reflets, nuages qui glissent, palmes, bateau qui tangue ;
  - fumée du volcan, papillons ;
  - les personnages respirent et clignent des yeux.
- **Des surprises rares**, une à la fois, toutes les 20 à 60 secondes :
  - dauphins, Mona la baleine au loin ;
  - vol d'oiseaux, poisson dans l'étang ;
  - une ou deux propres à chaque île.
- **Un décor qui répond au toucher** : l'hôte qui sautille, le bateau qui sonne ; la grenouille, posée sur l'étang, saute et ouvre l'étang.

**Garde-fous :**

- décor calme pendant les exercices ;
- aucune surprise pendant que Plume parle ;
- les mouvements rapides seulement dans les surprises courtes ;
- tout s'arrête avec le réglage « Réduire les animations » de l'iPad ou quand l'appli passe en arrière-plan ;
- les animations utilisent `transform` et `opacity`, rien d'autre.

Fait dans la livraison 4 (`src/screens/vivant.ts`, calques de `scripts/illustration/vivant.py`) : les surprises propres aux îles sont le poisson de l'étang (Nombres), le souffle de Mona (Mots), le ballon de Rico (Énigmes), la grosse bouffée du petit volcan (Découvertes), l'arc-en-ciel (Atelier), les cœurs de Pico (Cœur) et le voilier sur l'horizon (Port). On touche l'hôte (il sautille), un palmier (il se secoue), le bateau (il tangue et sonne) ; la grenouille saute de temps en temps (c'est une des surprises des Nombres) et, touchée, ouvre l'étang sur lequel elle est posée. Basile salue une fois, à l'arrivée. Une surprise s'efface dès que Plume se met à parler ; en arrière-plan, elle attend avec le reste du décor. Les garde-fous sont vérifiés par `tests/vivant.test.ts`, `tests/e2e/vivant.py` et `tests/e2e/performances.py`.

## Ce qu'on ne fait pas

- Pas de générateur d'images : il dessinerait autre chose à chaque fois. Toutes les images sortent de l'atelier d'illustration, toujours identiques.
- Pas d'emoji du système comme images : leur dessin change d'un appareil à l'autre. L'imagier les remplace, île par île.
- Pas de dégradés criards, de néons, de reflets « plastique » ni de couleurs saturées en grands aplats.
- Pas de rouge pour signaler une erreur, pas de son d'échec.
- Pas de texte long pour l'enfant : la voix de Plume passe avant l'écrit.
- Pas de récompense aléatoire ni de série à entretenir.

## Fabrication

Les images sont fabriquées une fois, à la construction, par l'atelier d'illustration (`scripts/illustration/`, voir son `LISEZMOI.md`), puis embarquées dans l'appli.

- Même source, même image.
- Tout marche hors ligne.
- L'iPad n'a rien à calculer.
- Rendu à l'échelle 2 (écran Retina), en WebP : environ 300 Ko pour un écran d'île complet, 30 Ko pour un personnage, 10 Ko pour une image de l'imagier.

**Limite, dite franchement.** Un illustrateur de métier ferait mieux, surtout sur les personnages. L'atelier donne un rendu soigné et constant, que le dessin vectoriel brut n'atteint pas. Si un jour un illustrateur intervient, ce document et le guide des personnages lui servent de cahier des charges, et ses dessins peuvent passer par la même finition.
