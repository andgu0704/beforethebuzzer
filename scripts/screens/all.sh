#!/usr/bin/env bash
# Exports the web build and screenshots every screen in light and dark, at iPhone SE and iPhone 17 Pro Max sizes.
set -euo pipefail
out="${1:-docs/screens}"
npm run web:export >/dev/null
node scripts/screens/serve.mjs dist 8090 >/dev/null 2>&1 &
server=$!
trap 'kill $server' EXIT
sleep 1
for scheme in light dark; do
  node scripts/screens/flow.mjs http://localhost:8090 "$out" "$scheme" 375 667 60 ahead
  node scripts/screens/flow.mjs http://localhost:8090 "$out" "$scheme" 440 956 60 ahead
done
