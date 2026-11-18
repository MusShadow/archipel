#!/usr/bin/env bash
# Construit la v1 et la v2, vérifie que chaque dist/ construit est identique au dist/ committé,
# puis assemble le site publié : la v1 à la racine, la v2 dans v2/.
# Usage : bash scripts/assembler.sh <dossier de la branche v1> <dossier de la branche v2> <dossier du site>
set -euo pipefail
v1="$1"; v2="$2"; site="$3"
for d in "$v1" "$v2"; do
  (cd "$d" && bun install --frozen-lockfile >/dev/null && bun run build)
  if ! git -C "$d" diff --quiet -- dist; then
    echo "Le dist/ committé dans $d n'est pas à jour : lancer bun run build et committer dist/." >&2
    git -C "$d" diff --stat -- dist >&2
    exit 1
  fi
done
rm -rf "$site"
mkdir -p "$site/v2"
cp -R "$v1/dist/." "$site/"
cp -R "$v2/dist/." "$site/v2/"
# Garde-fous de la cohabitation : la v1 garde son nom et son service worker laisse passer /v2/ ;
# la v2 a son nom et ses propres caches.
grep -q 'content="Archipel"' "$site/index.html"
grep -q 'new URL("./v2/", self.registration.scope)' "$site/sw.js"
grep -q 'content="Archipel 2"' "$site/v2/index.html"
grep -q 'const CACHE = "archipel2-' "$site/v2/sw.js"
echo "Site assemblé : $(du -sh "$site" | cut -f1). v1 à la racine, v2 dans v2/."
