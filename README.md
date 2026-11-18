# Archipel : publication des deux applis

Ce dépôt contient deux applis éducatives pour l'iPad, publiées ensemble sur GitHub Pages.

| Appli | Branche | Adresse |
| --- | --- | --- |
| Archipel, la première version | `v1` (partie du commit 8694fea ; correctifs seulement) | https://musshadow.github.io/archipel/ |
| Archipel 2, la refonte | `v2` | https://musshadow.github.io/archipel/v2/ |

La branche `main` ne contient plus le code des applis, seulement ce qui les publie :

- `.github/workflows/publier.yml` : à chaque envoi sur `main`, quand le workflow « Vérifier » réussit sur `v1` ou `v2`,
  ou à la main (Actions › Publier Archipel › Run workflow). Il construit les deux branches, vérifie que leur `dist/`
  committé est à jour, pose la v1 à la racine et la v2 dans `v2/`, puis publie le tout. Si une étape échoue, le site
  en ligne ne change pas.
- `scripts/assembler.sh` : l'assemblage, le même en local et sur GitHub.
- `tests/cohabitation.py` : vérifie dans Chrome que les deux applis cohabitent (service workers, caches, données,
  hors ligne, mise à jour de la v1).

## Travailler sur une appli

`git switch v2` pour la refonte, `git switch v1` pour un correctif de la première version. Chaque branche a son README,
ses tests et son workflow « Vérifier ». Les habitudes ne changent pas : commits en français, `bun run build` puis
`dist/` committé avec le code, envoi avec `git -c push.negotiate=true push origin <branche>`.

## Cohabitation

Les deux applis sont sur la même origine (musshadow.github.io) et partagent donc le stockage du navigateur :

- la v2 a ses propres clés (`archipel2.…`) et ses propres caches (`archipel2-…`), et n'écrit jamais dans ceux de la v1 ;
- le service worker de la v1 couvre tout `/archipel/` mais laisse passer `/archipel/v2/`, où la v2 a le sien ;
- sur l'iPad, chaque icône de l'écran d'accueil a son propre stockage : pour reprendre les progrès de la v1 dans la v2,
  on copie la sauvegarde dans la v1 (espace parent › Données) et on la restaure dans la v2.

## Vérifier en local

```sh
git worktree add ../archipel-v1 v1 && git worktree add ../archipel-v2 v2
bash scripts/assembler.sh ../archipel-v1 ../archipel-v2 site
python3 tests/cohabitation.py site
```
