# Système de design d'Archipel 2

Chaque valeur visuelle d'Archipel 2 est définie une seule fois, dans `src/design/jetons.ts`, et posée en variables CSS au démarrage. Les composants de `src/design/composants.ts` ne lisent que ces variables. La vitrine (`…/v2/#vitrine`) montre tout en taille réelle, et les tests (`tests/design.test.ts`) vérifient les règles.

La direction artistique qui justifie ces choix est dans `identite-visuelle.md`.

## Unité d'écran

`--u` vaut 1 px sur l'écran de référence, 1180 × 820 (iPad Air en paysage) : `min(100vw / 1180, 100vh / 820)`. Sur l'iPad Pro 11, 1 u ≈ 1,01 px.

Les tailles s'écrivent en u avec un minimum en px pour les petits écrans : `max(16px, calc(var(--u) * 22))`.

## Couleurs

### Îles : quatre tons

| Île | clair (fonds) | vif (repère) | foncé (texte, fond d'un texte blanc) | ombre (bords) |
|---|---|---|---|---|
| Nombres | `#D3E5FB` | `#3D8BEA` | `#236EC5` | `#1B4D89` |
| Mots | `#FFE0D3` | `#FF7F50` | `#BB4816` | `#833414` |
| Port des Voyages | `#CFEFF1` | `#1FA9B5` | `#12737B` | `#0D5A60` |
| Énigmes | `#E6DEFA` | `#8C6BE0` | `#7959C6` | `#543F8A` |
| Découvertes | `#D5F0E1` | `#34B37A` | `#007D4B` | `#005532` |
| Atelier | `#FFEDC2` | `#FFC145` | `#976100` | `#694400` |
| Cœur | `#FBD9E7` | `#E85D9A` | `#BC3C77` | `#852D54` |

- Variables : `--ile-<île>-<ton>`, par exemple `--ile-mots-fonce`.
- Les tons « clair » et « vif » sont ceux de la v1 : l'enfant les connaît, un test le vérifie.
- Le vif n'est **jamais** une couleur de texte. Pour du texte coloré, on prend le foncé.

### Neutres

| Jeton | Valeur | Usage |
|---|---|---|
| `--creme` | `#FFF7EA` | fond des écrans de l'enfant |
| `--papier` | `#FFFDF8` | cartes, bulles, ce qu'on lit |
| `--surface` | `#FFF8EC` | boutons et pastilles album |
| `--sable` | `#F3E7D3` | second plan |
| `--bord` | `#E2CBA6` | bord des éléments album |
| `--trait` | `#E4D9C5` | séparations discrètes |
| `--encre` | `#273043` | texte principal (12,4 pour 1 sur crème) |
| `--encre-douce` | `#4A5468` | texte secondaire |
| `--mer` | `#BFE8EE` | eau en aplat |
| `--voile` | `rgba(39, 48, 67, 0.45)` | derrière une fenêtre |

### Retours

- **Juste** : anneau `--juste` (`#34B37A`), halo `--juste-halo`, petit rebond de 400 ms.
- **Essai** : la carte balance (classe `wobble`), aucune couleur.
- **Jamais de rouge** : un test refuse les rouges dans les composants.

### Contraste

Chaque paire texte / fond utilisée par les composants atteint **au moins 4,5 pour 1** (WCAG AA). La liste est dans `pairesDeTexte()` et vérifiée par les tests :

- encre et encre douce sur crème, papier, surface, sable ;
- blanc sur chaque foncé ;
- chaque foncé sur crème et sur papier ;
- encre sur chaque clair.

## Textes

| Jeton | Police | Graisse | Taille | Minimum | Usage |
|---|---|---|---|---|---|
| `--texte-titre-ecran` | Baloo 2 | 800 | 56 u | 32 px | grand titre d'écran |
| `--texte-titre` | Baloo 2 | 800 | 40 u | 26 px | titre, ruban |
| `--texte-sous-titre` | Baloo 2 | 700 | 30 u | 20 px | nom d'activité |
| `--texte-etiquette` | Baloo 2 | 700 | 22 u | 16 px | pastilles, boutons texte |
| `--texte-lecture-grande` | Andika | 400 | 104 u | 44 px | mot à lire |
| `--texte-lecture` | Andika | 400 | 40 u | 24 px | phrase à lire |
| `--texte-bulle` | Andika | 400 | 28 u | 19 px | bulle de Plume |
| `--texte-adulte` | Inter | 400 | 15 u | 15 px | astuces, espace parent |
| `--texte-adulte-titre` | Inter | 700 | 24 u | 22 px | titres pour l'adulte |

- Chaque jeton est un raccourci `font` complet : `font: var(--texte-titre)`.
- Les familles seules : `--police-titre`, `--police-lecture`, `--police-adulte`.

### Polices embarquées

- `public/polices/` contient l'alphabet latin et le latin étendu, en woff2, avec les licences SIL OFL.
- `src/index.html` les déclare (`@font-face` avec `unicode-range`) et précharge les trois plus utilisées.
- Le service worker garde les fichiers latins dès l'installation ; les variantes latin-ext ne se chargent que si un prénom en a besoin.

## Espacements, rayons, ombres

**Espacements** : `--esp-1` à `--esp-8` valent 4, 8, 12, 16, 24, 32, 48 et 64 u, avec un minimum de 60 % en px.

**Rayons** :

| Jeton | Valeur |
|---|---|
| `--rayon-petit` | 14 u |
| `--rayon-moyen` | 22 u |
| `--rayon-grand` | 32 u |
| `--rayon-pilule` | 999 px |

**Ombres**, toujours chaudes, la lumière venant d'en haut à gauche :

| Jeton | Valeur | Usage |
|---|---|---|
| `--ombre-posee` | `0 3px 0 rgba(122, 86, 50, .20)` | bouton, pastille : l'élément est posé sur la page |
| `--ombre-douce` | posée + flou de 24 px | carte qui se détache |
| `--ombre-haute` | `0 18px 42px rgba(74, 52, 30, .24)` | fenêtre au-dessus de l'écran |
| `--ombre-reflet` | `inset 0 2px 0 rgba(255, 255, 255, .65)` | arête éclairée en haut |

## Cibles tactiles

| Jeton | Valeur | Usage |
|---|---|---|
| `--cible-min` | 80 u, au moins 58 px | minimum de tout ce qui se touche (≈ 1,55 cm sur l'iPad) |
| `--cible-bouton` | 86 u | boutons ronds |
| `--cible-petit` | 56 u, au moins 44 px | actions secondaires seulement, jamais dans un exercice |

Les pastilles ont une zone de toucher agrandie (12 u autour).

## Mouvement

| Jeton | Durée | Usage |
|---|---|---|
| `--duree-appui` | 120 ms | enfoncement d'un bouton |
| `--duree-court` | 200 ms | changement d'état |
| `--duree-moyen` | 300 ms | apparition |
| `--duree-long` | 400 ms | réussite (rebond) |
| `--duree-ecran` | 350 ms | changement d'écran |
| `--duree-battement-plume` | 1100 ms | un aller du battement d'ailes |
| `--duree-respiration` | 3200 ms | respiration des personnages |

Courbes :

- `--courbe-douce` : arrivée qui ralentit ;
- `--courbe-rebond` : léger dépassement, pour une réussite ;
- `--courbe-calme` : aller-retour d'ambiance.

Le réglage « Réduire les animations » de l'iPad arrête tout. **Le personnage-guide est l'élément le plus calme de l'écran.**

## Composants

Tous dans `src/design/composants.ts`, dans la finition album :

- papier crème, bord sable de 2,5 u ;
- ombre posée ;
- reflet en haut ;
- un dégradé très doux qui suit la lumière.

Chacun accepte une île (`ile`), qui pose les variables `--accent`, `--accent-fonce`, `--accent-ombre` et `--accent-clair`.

| Composant | Fonction | Règles |
|---|---|---|
| Bouton rond | `boutonRond({ icone, etiquette, onclick, ile?, taille? })` | une icône, jamais de texte ; `etiquette` est lue par VoiceOver ; tailles normal, `petit`, `grand` ; `ile` teinte le fond et l'icône |
| Pastille d'activité | `pastille({ titre, ile, conseillee?, image? })` | l'étiquette d'un lieu sur l'île ; « conseillée » : la couleur de Plume et le badge « Plume conseille » (le badge est pour l'adulte, Plume le dit) |
| Ruban de titre | `ruban({ texte, ile })` | le nom de l'île ou de l'activité, la pastille de couleur de l'île, deux bouts repliés |
| Bulle de Plume | `bullePlume({ texte?, onclick, queue? })` | ce que Plume vient de dire ; la toucher le fait répéter ; sans texte, une simple bulle à haut-parleur |
| Carte de réponse | `carte({ contenu, etiquette, onclick, ile?, large? })` et `etatCarte(c, "juste" \| "choisie" \| "normal")` | une image ou un mot à toucher ; un essai se signale avec `wobble(c)` |

## Îles

Le modèle est dans `src/iles.ts`.

**Structure :**

- Une **île** a un ou plusieurs **quartiers**, un écran chacun.
- Un quartier a un **décor de base** et **six emplacements**.
- Chaque **lieu** occupe un emplacement, avec son **étiquette** (pastille). Un lieu ouvre une activité, ou un écran à part comme le miroir, le drapeau de mon île ou le coin calme.
- Un emplacement libre montre son **remplissage** (buissons, fleurs, arbre).

**Comment l'île grandit :**

- `placer(ile, id)` pose une nouvelle activité dans le premier emplacement libre, sinon ouvre un nouveau quartier. Le décor n'est jamais redessiné.
- Au-delà, des activités proches peuvent partager un lieu (`ids` en liste), et un thème qui grandit devient une nouvelle île.
- `verifier(ile)` liste ce qui ne va pas :
  - nombre d'emplacements ;
  - doublons ;
  - lieu sans dessin ;
  - emplacement libre sans remplissage ;
  - étiquette hors de l'écran.

**Où l'île se dessine à l'écran :**

- `echelle(ecran)` et `versEcran(point, ecran)` passent du repère des dessins (1194 × 834) à l'écran.
- Sur l'iPad en paysage, le dessin couvre l'écran.
- Ailleurs (portrait, téléphone), on rogne au plus 12 % de la largeur et 6 % de la hauteur de chaque côté, pour que chaque lieu reste visible. Le ciel et la mer continuent autour de part et d'autre de l'horizon.

**Ce que vérifient les tests :**

- chaque activité et chaque écran à part a un lieu, un seul, sur la bonne île ;
- chaque île est valide ;
- les quartiers s'ouvrent au-delà de six lieux ;
- l'île des Nombres est dessinée et bien posée ;
- les lieux restent à l'écran sur cinq formats.

## Images

- **Atelier d'illustration** (`scripts/illustration/`) : personnages, décors et lieux des îles, imagier. Voir `LISEZMOI.md`.
- **Catalogues générés** :
  - `src/illustrations.ts` : boîte de chaque image dans son cadre, ancre (point au sol ou centre), pivot des ailes ;
  - `src/imagier.ts` : l'image de chaque emoji.
- **Adresses** : `urlImage(chemin)` (`src/images.ts`) ajoute l'empreinte du fichier (`?v=…`), calculée par `scripts/build.ts`.
- **Hors ligne** : le service worker garde toutes les images dans le cache `archipel2-images`, d'une version à l'autre, et ne retélécharge que celles qui changent.

## Accessibilité

- Contraste d'au moins 4,5 pour 1 pour tout texte (tests).
- Cibles d'au moins 1,5 cm sur l'iPad.
- Chaque bouton a un nom lu par VoiceOver (`aria-label`) ; les images décoratives ont un texte vide.
- Aucune information par la couleur seule : la couleur d'une île s'accompagne de son nom, une bonne réponse d'un son et de la voix de Plume.
- « Réduire les animations » respecté partout.

## Vitrine

Page cachée de la v2 : `https://musshadow.github.io/archipel/v2/#vitrine`, à ouvrir dans Safari sur l'iPad. Elle montre :

- l'île des Nombres en taille réelle ;
- les couleurs avec leurs contrastes et les textes ;
- les composants à toucher ;
- les personnages et l'imagier.

Rien n'y est enregistré. Un test de bout en bout (`tests/e2e/vitrine.py`) la parcourt, y compris hors ligne.
