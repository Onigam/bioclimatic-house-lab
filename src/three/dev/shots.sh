#!/bin/zsh
# Takes the Mac's Chrome lock (two modelers share it), runs the shots, always releases it.
LOCK=$HOME/.cache/lab-review/chrome.lock
until mkdir "$LOCK" 2>/dev/null; do sleep 20; done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
URL=${URL:-http://localhost:5863/src/three/dev/harness.html} OUT=${OUT:-$HOME/.cache/lab-review/bioclimatic-house-lab/3d} SHOTS="$1" node "$(dirname "$0")/shots.mjs"
