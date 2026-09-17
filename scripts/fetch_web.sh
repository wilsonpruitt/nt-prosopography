#!/usr/bin/env bash
# Download the public-domain World English Bible (verse-per-line) from eBible.org into web/
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p web && cd web
curl -sL -o web.zip https://ebible.org/Scriptures/engwebp_vpl.zip
unzip -o -q web.zip engwebp_vpl.txt
echo "WEB text: $(wc -l < engwebp_vpl.txt) verses"
