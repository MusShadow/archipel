# Atelier d'illustration d'Archipel 2

Toutes les images d'Archipel 2 sortent de cet atelier, comme la voix sort de `scripts/voix/`. Elles sont fabriquées une fois, ici, puis embarquées dans l'appli : même dessin sur tous les appareils, rien à calculer sur l'iPad, tout marche hors ligne. Le rendu est déterministe : même source, même image, octet pour octet.

La direction artistique (lumière, matières, couleurs, mouvement) est décrite dans `docs/design/identite-visuelle.md`, les personnages dans `docs/design/guide-personnages.md`.

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `moteur.py` | Le moteur : formes souples (splines, fusions), lumière d'en haut à gauche, volume, finition « album » (deux tons, trait coloré, texture gouache), ombres posées. |
| `personnages.py` | Plume (cinq poses, pièces pour l'animer), Basile, la grenouille ; yeux, bouches, sourcils, les cinq expressions communes, les quatre émotions du théâtre (triste, colère, peur, déçu) et l'expression calme. |
| `hotes.py` | Mona, Rico et Bip, Octave, Kiki, Pico. |
| `decors.py` | Ciel, mer, île, chemin, végétation, et les lieux de l'île des Nombres (marché, étang, goûter). |
| `creatures.py` | Animaux et effets du décor vivant (dauphin, baleine, oiseaux, fumée…). |
| `vivant.py` | Livraison 4 : le décor vivant des îles. Les petits sujets que l'appli anime (étincelle, bouffée de fumée, papillons, et ceux des surprises : dauphin, gerbe, baleine, souffle, oiseaux, poisson, cœur, voilier, arc-en-ciel, ballon de Rico), les reflets de la mer, et le choix des places (sur la mer libre ou l'herbe libre, loin des lieux, des étiquettes et de Plume, visibles en portrait). |
| `jeux.py`, `jeux_decouvertes.py`, `jeux_enigmes.py` | Livraison 4 : les objets des jeux, dessinés comme les nénuphars. Le marché de Basile et le goûter ; le bassin de verre (en deux calques), les poubelles (corps et couvercle), le volcan coupé (fond et calques posés par-dessus, dans le repère du volcan de l'appli, trois fois plus grand) ; les perles en bois de Rico, leur plateau, le potager de Bip. |
| `iles.py` | Disposition des îles dessinées : six emplacements, le lieu de chaque activité, les étiquettes (l'île des Nombres y est dessinée ; les six autres sont dans leurs modules `ile_*.py`). |
| `ile_commun.py` | Livraison 3 : les briques des îles (côte ondulée de chaque île, crique où nage l'hôte de l'eau, herbe, chemins, ciel et mer) et les petits objets des lieux (table, cube à lettre, note, panneau, fanions, livre, cabane, cœur, tulipe). |
| `ile_mots.py`, `ile_enigmes.py`, `ile_decouvertes.py`, `ile_atelier.py`, `ile_coeur.py`, `ile_port.py` | Livraison 3 : une île chacun (`DISPOSITION` et `DESSINS` : décor de base, remplissages, lieux, hôte qui salue). |
| `visages.py` | Livraison 3 : les portraits des sept personnages (médaillons), contents et avec les six émotions du théâtre de Pico. |
| `fin.py` | Livraison 3 : le coucher de soleil de la fin de séance (fond peint) et le soleil, à part, qui descend derrière l'horizon. |
| `calme.py` | Livraison 3 : le décor du coin calme, et Pico assis, les yeux fermés puis content. |
| `activites.py` | Livraison 2 : les nénuphars (étang, nénuphars sans nombre, grenouille assise et en plein saut) et la gommette de la grenouille. |
| `fetes.py` | Livraison 2 : les objets des fêtes (ballons, voiture, camion de pompiers, roues, gyrophare, fusée, flamme, volcan, guirlande). |
| `carte.py` | Livraison 2 : la mer de la carte, les sept îles (chacune son dessin et son repère), le soleil et la lune. |
| `accueil.py` | Livraison 2 : la plage d'accueil, les huit compagnons de voyage et un chapeau d'explorateur par couleur de profil. |
| `couches.py` | Rendu en couches transparentes (fond noir, fond blanc, la différence donne la transparence) et écriture en WebP. |
| `fabriquer.py` | Fabrique les personnages, les îles et les éléments isolés (une image chacun, avec ses points repères : roues, chapeau, centre d'une île…) ; écrit `catalogue.json` et `src/illustrations.ts`. |
| `imagier.py` | Fabrique l'imagier : une image album pour chaque emoji de l'appli (dont, depuis la livraison 4 bis, le vocabulaire des histoires sur mesure, `IMAGES_HISTOIRES` dans `src/stories.ts`) ; écrit `src/imagier.ts`. |
| `pictos.py`, `pictos_source.ts` | Livraison 4 bis : les dessins au trait de l'appli repeints dans la finition album. `pictos_source.ts` lit les dessins tels que l'appli les écrit (goutte, déchets, grand tri, volcan, tipi, domino et midi des syllabes, rue du camion, carte du monde) ; Chrome les lit sans lissage (une couleur-repère par forme, le trait d'encre à part, les formes translucides avec ce qui les cache) ; chaque forme est peinte par le moteur (volume selon sa taille, prolongée sous ce qui la recouvre, continuée au-delà du bord de l'image) ; le contour d'encre d'une forme prend sa couleur foncée, au moins 3,3:1 contre le papier des cartes ; un trait d'encre sans forme (flèche, fêlure, symbole) reste une encre foncée, au moins 4,5:1 ; un trait d'encre épais sans forme (bras, châssis) se peint comme une forme ; les formes translucides deviennent des glacis. Un dessin ne doit pas toucher le bord de son cadre (l'atelier le refuse) ; celui qui en dépasse (une fumée) a une toile plus haute (`DEBORDE` dans `pictos_source.ts`). Le contenu ne change pas, seule la matière. |

## Lancer

Prérequis (développement seulement, rien n'est ajouté à l'appli) : Python 3.11 ou plus, puis

```sh
pip install "numpy==2.5.3" "opencv-python-headless==5.0.0.*" "pillow==12.3.0" playwright
```

et Google Chrome (ou `CHROME=/chemin/vers/chrome`) pour lire les SVG de l'imagier. Pillow doit lire le woff2
(FreeType avec Brotli, le cas des roues officielles).

« Octet pour octet » vaut à versions égales : les images du dépôt ont été rendues avec numpy 2.5.3, OpenCV 5.0.0,
Pillow 12.3.0 (FreeType 2.14.3) et Chrome 153 pour l'imagier. Avec d'autres versions, le rendu reste le même à l'œil,
mais quelques octets peuvent changer.

```sh
python3 scripts/illustration/fabriquer.py              # personnages et îles (environ 1 minute)
python3 scripts/illustration/fabriquer.py personnages  # ou seulement : iles, une île (mots, coeur…), activites, fetes, carte, accueil, visages, fin, calme, jeux, jeux_decouvertes, jeux_enigmes, vivant, pictos
python3 scripts/illustration/imagier.py                # imagier (environ 2 minutes)
bun run build                                          # puis construire l'appli
```

`imagier.py` clone au premier lancement le dépôt de Fluent Emoji (sans les images 3D) dans `~/.cache/archipel/fluentui-emoji`, à la version notée dans le script ; un autre dossier se donne en argument ou par `IMAGIER_SOURCE`.

## Ce qui sort

- `public/illustrations/personnages/` : chaque hôte dans les cinq expressions (`content`, `rieur`, `surpris`, `pensif`, `doux`), les yeux fermés (`cligne`, pour cligner des yeux) et en train de saluer ; Plume dans ses cinq poses, ses quatre expressions en vol et en trois pièces (aile arrière, corps, aile avant) pour battre des ailes lentement.
- `public/illustrations/iles/<île>/` : le décor de base (opaque), un remplissage pour chaque emplacement libre, un lieu par activité, les calques du décor vivant (`anime-*.webp`).
- `public/illustrations/activites/` et `public/illustrations/vivant/` : les objets des jeux et les petits sujets du décor vivant.
- `public/illustrations/goutte/`, `dechets/`, `tri/`, `volcan/`, `mots/`, `monde/` : les dessins au trait repeints (livraison 4 bis), rendus à l'échelle 3 (la rue à 5), notée `rendu` au catalogue.
- `public/imagier/` : une image par emoji, 320 × 320, et la licence de la base.
- `src/illustrations.ts` et `src/imagier.ts` : les catalogues pour l'appli (fichiers générés, à ne pas modifier à la main).

Tout est rendu à l'échelle 2 (écran Retina). Les boîtes du catalogue sont en px CSS, dans le repère du dessin : 1194 × 834 pour une île (l'iPad Pro 11 en paysage).

## Ajouter une activité sur une île

- **Île déjà dessinée** (depuis la livraison 3 : toutes). Ses lieux viennent du catalogue de l'atelier.
  1. Dans le module de l'île (`iles.py` pour les Nombres, `ile_<île>.py` pour les autres), dessiner le lieu (fonction `lieu`), l'affecter à un emplacement libre (`lieux`) et placer son étiquette (`pastilles`).
  2. Relancer `fabriquer.py <île>` : le nouveau lieu est rendu, le remplissage de l'emplacement disparaît, le décor de base ne bouge pas.
  3. Garder le lieu, son étiquette et l'hôte dans la partie que le portrait montre (x de 143 à 1051) : `tests/iles.test.ts` le vérifie.

  Tant que le lieu n'est pas dessiné, `placer()` pose l'activité dans un emplacement libre et sa pastille la représente ; `verifier()` signale le dessin qui manque.

  `src/iles.ts` reprend tout du catalogue, et les tests vérifient que l'activité a son lieu.
- **Île pas encore dessinée.** Ajouter l'activité à la liste de son quartier dans `src/iles.ts` (ou laisser `placer()` la poser) ; son lieu sera dessiné avec l'île.

Au-delà de six lieux, l'île passe en quartiers : un deuxième écran, avec ses propres six emplacements.

## Hors ligne et mises à jour

`scripts/build.ts` calcule une empreinte pour chaque image et l'ajoute à son adresse (`?v=…`). Le service worker garde les images dans le cache `archipel2-images`, d'une version à l'autre : seule une image qui change est téléchargée à nouveau. Chaque image de l'imagier tire sa texture d'une graine faite de son nom : ajouter un emoji ne change aucune autre image. `fabriquer.py` retire les images qui ne sont plus au catalogue.

## Licences

- Dessins de l'atelier : ceux du dépôt d'Archipel.
- Imagier : dérivé de [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (Microsoft, licence MIT, jointe dans `public/imagier/`).
- Polices utilisées pour les chiffres des dessins : Baloo 2 (SIL OFL, `public/polices/`).

**Visages du théâtre.** `python3 scripts/illustration/fabriquer.py visages` écrit aussi `visages-ecarts.json` : pour chaque personnage, la part du médaillon (à 140 px) qui change d'une émotion à l'autre, et la taille des images mesurées. `tests/livraison3.test.ts` vérifie que ces mesures sont celles des images publiées et qu'elles atteignent 5 % pour chaque paire qu'un exercice du théâtre peut montrer.

## Le décor vivant d'une île (livraison 4)

Pendant le rendu du décor de base, `decors.noter()` met de côté ce qui doit bouger seul au lieu de le peindre : les nuages, les palmes des palmiers (le tronc reste dans le décor), les reflets de la mer, la fumée du volcan au loin ; il note aussi le contour de l'île et les objets posés sur la mer (le ponton), que les reflets évitent. `fabriquer.py` rend ensuite chacun en calque à part (`calques_vivants`), avec son **rôle** (`nuage`, `palmes`, `reflets`, `hote`, `cligne`, `bateau`, `bras`, `grenouille`) et, s'il tourne, son **pivot** (le haut du tronc pour les palmes, l'épaule de Basile, la quille du bateau). L'appli anime chaque calque selon son rôle (`src/screens/vivant.ts`).

Dans le module de l'île, `DISPOSITION["vivant"]` donne l'hôte (dont la variante « yeux fermés » est rendue en forçant l'expression `cligne`), la surprise propre à l'île (`poisson`, `souffle`, `ballon`, `volcan`, `arc-en-ciel`, `coeurs`, `voilier`, et son point), et, s'il y en a, la fumée continue d'un lieu. Les places des étincelles, du dauphin, de la baleine et des papillons sont choisies par `vivant.py` et écrites dans le catalogue de l'île (`vivant`).

Partout ailleurs (planches, fin de séance, autres scènes), rien n'est noté : tout est peint comme avant.

