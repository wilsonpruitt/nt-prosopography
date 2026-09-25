#!/bin/sh
# Copy the built Liber generationis site (~/liber-generationis, its own repo) into dist/genealogies/,
# served at ntnames.wrootpress.com/genealogies/. Build it there first: cd ~/liber-generationis && python3 build.py
# Committing the result to main deploys it to production.
set -e
SRC="${LIBER_DIST:-$HOME/liber-generationis/dist}"
[ -f "$SRC/index.html" ] || { echo "no build at $SRC — run python3 build.py in ~/liber-generationis" >&2; exit 1; }
cd "$(dirname "$0")/.."
rm -rf dist/genealogies
mkdir -p dist/genealogies
cp -R "$SRC"/. dist/genealogies/
echo "synced $(find dist/genealogies -type f | wc -l | tr -d ' ') files from $SRC"
