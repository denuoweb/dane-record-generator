#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=test-lib.sh
source "$SCRIPT_DIR/test-lib.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
make_test_env "$tmp"

"$TEST_ROOT/lib/generate-config.sh" \
  --hns-name "DenuoWeb/" \
  --site-title "HNS DANE Site" \
  --deployment-mode single-node \
  --wallet-style hsd-cli \
  --hsd-wallet-id primary \
  --hsd-account-name recovered2 \
  --enable-ipv6 no

jq '.dnssec.ds = {keyTag: 12345, algorithm: 13, digestType: 2, digest: "ABCDEF"}' "$HNS_DANE_CONFIG" > "$tmp/config.json"
mv "$tmp/config.json" "$HNS_DANE_CONFIG"

"$TEST_ROOT/lib/generate-hns-resource.sh"
"$TEST_ROOT/lib/render-wallet-instructions.sh"

assert_file_contains 'hsd-rpc getnameinfo denuoweb true' "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "node RPC name check"
assert_file_contains 'hsw-cli --id primary account list' "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "wallet account list"
assert_file_contains "hsw-rpc --id primary sendupdate denuoweb '{\"records\":[{\"type\":\"GLUE4\",\"ns\":\"ns1.denuoweb.\",\"address\":\"203.0.113.10\"},{\"type\":\"DS\",\"keyTag\":12345,\"algorithm\":13,\"digestType\":2,\"digest\":\"ABCDEF\"}]}' recovered2" "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "account-aware hsw update"

printf 'ok - wallet-instructions\n'
