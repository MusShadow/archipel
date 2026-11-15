# Archipel

Application éducative adaptative pour un enfant de 4 à 6 ans, pensée pour l'iPad.
Un archipel de sept îles à explorer avec Plume, un colibri voyageur : nombres, lecture, drapeaux du monde, énigmes et formes, découvertes, dessin et émotions.

Principes : pas de publicité, pas d'achat, pas de compte, pas d'inconnus, pas d'accès libre à Internet.
Les progrès restent sur l'appareil. Les séances sont courtes (12 minutes par défaut) et se terminent par un défi à faire hors écran.
Plume parle avec une voix naturelle enregistrée à l'avance (voix de synthèse libre), même sans Internet.

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

## Livraison 2

- **Île des Énigmes** (Rico) : *les formes de Rico* (formes planes : nommer, compter les côtés qui s'allument un par un ; solides : boule, cube, pavé, cylindre, cône, pyramide, retrouver un solide dans les objets, deviner la trace qu'il laisse), *le chemin de Bip* (programmer un robot avec des flèches, puis trouver la flèche qui se trompe : toute correction qui marche est acceptée), *les motifs de Rico* (continuer une suite, trouver l'erreur, compléter un trou, tableau à double entrée).
- **Île du Cœur** (Pico) : *le théâtre de Pico* (émotions, leurs causes, comment aider, goûts différents, fausse croyance en bande dessinée, émotion cachée) ; le coin calme est aussi sur l'île.
- **Île des Découvertes** (Octave) : *flotte ou coule ?* (prédire, tester dans le bassin, comprendre ; au niveau 3, « ce n'est pas la taille qui compte »).
- **Île de l'Atelier** (Kiki) : *dessine pas à pas* — douze vrais dessins (soleil, maison, fleur, arbre, poisson, chat, bateau, escargot, lapin, papillon, voiture, oiseau). Le dessin terminé est montré, puis il disparaît ; Kiki le refait trait par trait (démonstration animée), l'enfant suit au doigt, chaque trait est vérifié (couverture et précision), un trait trop loin s'efface sans reproche. Trois niveaux : pointillés, repères légers, de mémoire. À la fin : comparaison avec le modèle, coloriage au pot de peinture, rangement dans la galerie du carnet. Et *le miroir de Kiki* (dessin symétrique, 1 ou 2 miroirs).
- **Port des Voyages** : *l'atelier des drapeaux* (colorier d'après le modèle, puis de mémoire, puis repérer le vrai drapeau parmi des drapeaux à l'envers) et *le drapeau de mon île* (forme, couleurs, symbole ; affiché dans le carnet).
- **Histoires sur mesure** : dans l'espace parent (onglet Histoires), Claude écrit une petite histoire avec la clé API du parent (thème, héros, longueur, sons connus de l'enfant ; jamais son prénom). Les mots probablement trop difficiles sont surlignés ; le parent valide, réécrit ou jette. L'enfant lit sur l'île des Mots : mots touchables, phrase lue à voix haute, question de compréhension.
- **Carnet** : drapeau de mon île, gommettes, galerie des dessins (12 derniers, sur l'appareil), passeport.

## Livraison 2 bis : la voix naturelle de Plume

- **Voix naturelle** : tout ce que dit Plume a été enregistré à l'avance avec une voix française neuronale libre,
  *Supertonic 3* (voix « F1 », débit posé), choisie à l'écoute parmi trois. Environ 4 700 clips (près de 2 heures de parole) : phrases entières,
  et pour les phrases à trous très variées (listes de mots, programmes de Bip, suites de motifs), des morceaux coupés
  à la ponctuation et aux fins de liste, que la lecture recolle avec les pauses de la ponctuation. Jamais de lecture
  mot à mot sans ponctuation : ce que la voix naturelle ne peut pas dire en entier (histoires sur mesure, phrase
  nouvelle) est lu par la voix de l'appareil, en entier.
- **Le prénom de l'enfant n'est jamais enregistré** (le pack est public) : la voix naturelle dit la phrase sans lui
  (« Bonjour ! » au lieu de « Bonjour Léa ! », « ton île » au lieu de « l'île de Léa »). Le prénom reste affiché.
- **Hors ligne** : le pack (MP3 mono 32 kb/s, environ 30 Mo, un paquet commun et un par île) est servi par GitHub Pages et
  gardé par le service worker, à part du code : une mise à jour de l'appli ne le retélécharge pas.
- **Espace parent** (Réglages) : « Voix de Plume : Naturelle / De l'iPad », état du pack (prêt, en téléchargement,
  indisponible), voix de l'iPad en secours, débit lent ou rapide appliqué sans changer la hauteur de la voix.
  Les encouragements enregistrés dans le studio voix passent toujours avant Plume.
- **Lecture** : un seul point d'entrée, `speech.say(texte, débit?)`, dont la promesse est tenue à la fin de la phrase ;
  clips décodés et joués par l'`AudioContext` déverrouillé au premier contact de l'enfant.

## Livraison 3 : l'île des Découvertes (en cours)

- **Le voyage de la goutte** (Octave) : Ploc, une goutte d'eau, fait le grand tour, raconté comme un dialogue
  (« Ploc demande… Octave répond… »), en six niveaux qui s'ouvrent au fil des réussites :
  1. *la ronde de la nature* : qui a besoin d'eau pour vivre, puis « et ensuite ? » (mer, vapeur, nuage, pluie ou neige,
     rivière ou nappe sous la terre) ;
  2. *le labo d'Octave* : glace, eau, vapeur, selon qu'on chauffe ou qu'on refroidit (glaçon au soleil, congélateur,
     flaque qui sèche, linge, casserole, buée du miroir) ;
  3. *de la source au robinet* : pompe, usine d'eau potable (des bulles, les saletés enlevées, les microbes chassés),
     château d'eau ou réservoir sur la colline (l'eau descend toute seule, plus il est haut, plus elle pousse fort),
     quelle eau peut-on boire ;
  4. *du robinet à la station d'épuration* : égouts, grilles, bassin à bulles où des bactéries mangent la saleté,
     bassin calme où la boue tombe au fond, retour à la rivière (assez propre pour les poissons, pas pour boire) ;
  5. *le grand tour* : quatre étapes qui se suivent, l'une cachée ; aucune mauvaise réponse ne peut aller à sa place ;
  6. *les bons gestes* : lingettes à la poubelle (ni aux toilettes, ni au bac jaune), robinet fermé pendant le brossage,
     douche rapide plutôt que grand bain.
  Chaque mauvaise réponse a son explication ; le « ? » se remplit avec la bonne réponse. Six compétences suivies dans
  l'espace parent, astuces parent et trois défis hors écran (mini château d'eau, buée, château d'eau du quartier).
- À venir : le volcan d'Octave, le grand tri, le voyage des déchets jusqu'à la déchetterie.

## Développement

Prérequis : [Bun](https://bun.sh) et TypeScript.

```sh
bun run build       # construit dist/index.html (fichier unique, autonome)
bun test            # tests du moteur, des contenus et des générateurs d'exercices
tsc --noEmit -p .   # vérification des types
python3 tests/e2e/smoke.py        # parcours complet de la livraison 1 dans Chrome (Playwright), captures dans tests/e2e/shots
python3 tests/e2e/livraison2.py   # îles de la livraison 2, dessin au doigt simulé, histoire simulée (captures dans tests/e2e/shots2)
python3 tests/e2e/offline.py      # démarrage sans Internet
python3 tests/e2e/voix.py         # voix naturelle : clips, prénom retiré, repli, réglage parent, débit, hors ligne
python3 tests/e2e/livraison3.py   # le voyage de la goutte, ses six niveaux (captures dans tests/e2e/shots3)
python3 tests/e2e/ipad.py         # voix naturelle sur iPad simulé : session « playback », lecteur de secours, diagnostic
```

### Refaire le pack de voix (après avoir ajouté ou changé des phrases)

```sh
bun scripts/voix/inventaire.ts    # tout ce que dit Plume → voix/inventaire.json (activités jouées dans un DOM simulé)
bun scripts/voix/clips.ts         # clips à enregistrer, par paquet → voix/clips.json
python3 scripts/voix/generer.py   # synthèse, contrôle, paquets → public/voix/ (puis bun run build)
bun scripts/voix/couverture.ts /tmp/inv.json   # part des phrases dites en entier, sur un inventaire tiré avec SEED=42
python3 scripts/voix/finales.py   # consonnes finales muettes prononcées par erreur (souffle aigu en fin de clip)
```

L'inventaire tire les exercices au hasard : `clips.ts` garde donc les clips de la liste précédente qui ne sont pas
ressortis cette fois (`KEEP=0` pour repartir de zéro). Une activité peut aussi donner la liste complète de ses phrases
(`voiceLines()` dans `src/activities/goutte.ts`), reprise telle quelle par l'inventaire.

`generer.py` reprend tels quels les clips du pack publié (voir `voix/pack.json`) et ne fabrique que les nouveaux.
Prérequis et modèles : en tête du script (sherpa-onnx 1.13, ffmpeg, modèles téléchargés depuis les versions publiées
de sherpa-onnx sur GitHub). Chaque clip est contrôlé par une reconnaissance vocale qui compare les sons attendus et
entendus ; un clip raté est refait, et ceux qui restent douteux sont listés dans `voix/rapport.json`.
Les écritures des syllabes dites seules (« pu », « sue »…) sont dans `voix/prononciation.json`.

Aucune dépendance d'exécution. Les illustrations sont des formes vectorielles générées par `scripts/gen_art_ts.py` (voir `scripts/archi_lib.py`) dans `src/art_static.ts`.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/core.ts` | Référentiel de compétences, modèle de l'enfant, escalier, planificateur (sans DOM, testé) |
| `src/content.ts` | Progression des sons, mots déchiffrables, phrases de Plume, défis hors écran |
| `src/flags.ts` | Drapeaux (dessins SVG), continents, projection de la carte |
| `src/host.ts` | Hôte commun des activités : consignes, indices, preuves, escalier, fin d'activité |
| `src/activities/` | Une activité par fichier, toutes sur le même contrat `ActivityModule` |
| `src/screens/` | Écrans de l'enfant (accueil, carte, coin calme, carnet, fin de séance, dessin, miroir, drapeau de mon île, histoires) et espace parent |
| `src/shapes.ts` | Formes planes et solides (SVG) |
| `src/drawings.ts` | Les dessins pas à pas (étapes, traits) et la correction d'un trait (couverture, précision) |
| `src/stories.ts` | Histoires sur mesure : demande à Claude, lecture de la réponse, repérage des mots difficiles |
| `src/services.ts` | Stockage local, voix (pack de voix naturelle, synthèse de l'appareil en secours), sons synthétisés |
| `src/voix.ts` | Voix naturelle, partie texte (sans DOM, testée) : mots et clés, prénom retiré, plan de lecture en clips, débit |
| `scripts/voix/` | Inventaire des phrases, liste des clips, génération et contrôle du pack de voix |
| `public/voix/` | Le pack de voix publié : index et paquets audio (noms à empreinte) |

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

- Plume parle avec la voix naturelle dès que le pack est téléchargé (la première fois, quelques minutes en Wi-Fi,
  appli ouverte) ; avant, et pour les histoires sur mesure, c'est la voix française de base de l'iPad (Safari ne donne
  pas accès aux voix téléchargées ni à celles de Siri). Le réglage « Voix de Plume » de l'espace parent permet de
  revenir à la voix de l'iPad.
- Sur iPad, Safari range le son des pages parmi les sons d'ambiance : sans précaution, la voix naturelle (Web Audio)
  se tait en mode silencieux, alors que la voix de l'iPad continue, et le contexte audio peut rester « interrompu ».
  L'appli déclare donc une lecture « playback » (`navigator.audioSession`), relance le son à chaque contact (fin
  d'appui ou clic, seuls gestes acceptés par Safari) et, si le moteur audio ne répond pas, lit les mêmes clips avec le
  lecteur audio HTML avant de passer à la voix de l'iPad. Le bouton « Écouter Plume » (espace parent › Réglages) dit
  par où la phrase est passée.
- Le mode « Accès guidé » de l'iPad (Réglages › Accessibilité) permet de verrouiller l'appareil sur l'application pendant la séance.

## Licences et crédits

- **Voix de Plume** : clips générés avec *Supertonic 3* © Supertone Inc. (style F1). Le modèle est sous licence
  [OpenRAIL-M](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE), qui interdit certains usages
  (Attachment A) et demande d'indiquer qu'un contenu est généré par une machine : l'espace parent précise que c'est
  une voix de synthèse. Le modèle lui-même n'est pas distribué avec l'appli, seulement les clips.
- Génération : [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) (Apache-2.0). Contrôle des clips, outils non
  distribués : *Parakeet TDT 0.6B v3* (NVIDIA, CC-BY-4.0) et eSpeak NG (GPL-3.0).
- Voix écartées après essai : Kokoro v1.0 (« ff_siwis ») et Piper (« siwis », « upmc »), moins nettes en français.
