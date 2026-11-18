# Atelier d'illustration d'Archipel 2

Toutes les images d'Archipel 2 sortent de cet atelier, comme la voix sort de `scripts/voix/`. Elles sont fabriquées une fois, ici, puis embarquées dans l'appli : même dessin sur tous les appareils, rien à calculer sur l'iPad, tout marche hors ligne. Le rendu est déterministe : même source, même image, octet pour octet.

La direction artistique (lumière, matières, couleurs, mouvement) est décrite dans `docs/design/identite-visuelle.md`, les personnages dans `docs/design/guide-personnages.md`.

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `moteur.py` | Le moteur : formes souples (splines, fusions), lumière d'en haut à gauche, volume, finition « album » (deux tons, trait coloré, texture gouache), ombres posées. |
| `personnages.py` | Plume (cinq poses, pièces pour l'animer), Basile, la grenouille ; yeux, bouches, sourcils et les cinq expressions communes. |
| `hotes.py` | Mona, Rico et Bip, Octave, Kiki, Pico. |
| `decors.py` | Ciel, mer, île, chemin, végétation, et les lieux de l'île des Nombres (marché, étang, goûter). |
| `creatures.py` | Animaux et effets du décor vivant (dauphin, baleine, oiseaux, fumée…), pour la livraison 4. |
| `iles.py` | Disposition des îles dessinées : six emplacements, le lieu de chaque activité, les étiquettes. |
| `couches.py` | Rendu en couches transparentes (fond noir, fond blanc, la différence donne la transparence) et écriture en WebP. |
| `fabriquer.py` | Fabrique les personnages et les îles ; écrit `catalogue.json` et `src/illustrations.ts`. |
| `imagier.py` | Fabrique l'imagier : une image album pour chaque emoji de l'appli ; écrit `src/imagier.ts`. |

## Lancer

Prérequis (développement seulement, rien n'est ajouté à l'appli) : Python 3.11 ou plus, puis

```sh
pip install numpy opencv-python-headless pillow playwright
```

et Google Chrome (ou `CHROME=/chemin/vers/chrome`) pour lire les SVG de l'imagier.

```sh
python3 scripts/illustration/fabriquer.py              # personnages et îles (environ 1 minute)
python3 scripts/illustration/fabriquer.py personnages  # ou seulement : iles
python3 scripts/illustration/imagier.py                # imagier (environ 2 minutes)
bun run build                                          # puis construire l'appli
```

`imagier.py` clone au premier lancement le dépôt de Fluent Emoji (sans les images 3D) dans `~/.cache/archipel/fluentui-emoji`, à la version notée dans le script ; un autre dossier se donne en argument ou par `IMAGIER_SOURCE`.

## Ce qui sort

- `public/illustrations/personnages/` : chaque hôte dans les cinq expressions (`content`, `rieur`, `surpris`, `pensif`, `doux`) et en train de saluer ; Plume dans ses cinq poses, ses quatre expressions en vol et en trois pièces (aile arrière, corps, aile avant) pour battre des ailes lentement.
- `public/illustrations/iles/<île>/` : le décor de base (opaque), un remplissage pour chaque emplacement libre, un lieu par activité, les éléments du décor vivant.
- `public/imagier/` : une image par emoji, 320 × 320, et la licence de la base.
- `src/illustrations.ts` et `src/imagier.ts` : les catalogues pour l'appli (fichiers générés, à ne pas modifier à la main).

Tout est rendu à l'échelle 2 (écran Retina). Les boîtes du catalogue sont en px CSS, dans le repère du dessin : 1194 × 834 pour une île (l'iPad Pro 11 en paysage).

## Ajouter une activité sur une île

1. Dans `src/iles.ts`, ajouter l'activité dans un emplacement libre (ou laisser `placer()` la poser) ; les tests vérifient qu'elle a son lieu.
2. Dans `iles.py`, dessiner son lieu (`lieu` de l'île) et l'affecter au même emplacement.
3. Relancer `fabriquer.py iles` : seuls le nouveau lieu et les remplissages changent ; le décor de base ne bouge pas.

Au-delà de six lieux, l'île passe en quartiers : un deuxième écran, avec ses propres six emplacements.

## Hors ligne et mises à jour

`scripts/build.ts` calcule une empreinte pour chaque image et l'ajoute à son adresse (`?v=…`). Le service worker garde les images dans le cache `archipel2-images`, d'une version à l'autre : seule une image qui change est téléchargée à nouveau.

## Licences

- Dessins de l'atelier : ceux du dépôt d'Archipel.
- Imagier : dérivé de [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (Microsoft, licence MIT, jointe dans `public/imagier/`).
- Polices utilisées pour les chiffres des dessins : Baloo 2 (SIL OFL, `public/polices/`).
