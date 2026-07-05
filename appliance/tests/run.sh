#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

tests=(
  "$SCRIPT_DIR/test-normalize-name.sh"
  "$SCRIPT_DIR/test-html-escaping.sh"
  "$SCRIPT_DIR/test-tlsa-generation.sh"
  "$SCRIPT_DIR/test-hns-resource-json.sh"
  "$SCRIPT_DIR/test-zone-render.sh"
)

for test in "${tests[@]}"; do
  bash "$test"
done

printf 'ok - appliance test suite\n'
