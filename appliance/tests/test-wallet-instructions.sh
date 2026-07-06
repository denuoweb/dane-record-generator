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
  --wallet-style hsd-cli \
  --hsd-wallet-id primary \
  --hsd-account-name default \
  --enable-ipv6 no

jq '.dnssec.ds = {keyTag: 12345, algorithm: 13, digestType: 2, digest: "ABCDEF"} | .tls.spkiSha256 = "AABBCC"' "$HNS_DANE_CONFIG" > "$tmp/config.json"
mv "$tmp/config.json" "$HNS_DANE_CONFIG"

"$TEST_ROOT/lib/generate-hns-resource.sh"
"$TEST_ROOT/lib/render-wallet-instructions.sh"
"$TEST_ROOT/lib/generate-dashboard.sh"

assert_file_contains 'hsd-rpc getnameinfo denuoweb true' "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "node RPC name check"
assert_file_contains 'hsw-cli --id primary account list' "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "wallet account list"
assert_file_contains 'hsw-rpc selectwallet primary' "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "raw wallet RPC wallet selection"
assert_file_contains "hsw-rpc sendupdate denuoweb '{\"records\":[{\"type\":\"NS\",\"ns\":\"ns1.denuoweb.\"},{\"type\":\"GLUE4\",\"ns\":\"ns1.denuoweb.\",\"address\":\"203.0.113.10\"},{\"type\":\"DS\",\"keyTag\":12345,\"algorithm\":13,\"digestType\":2,\"digest\":\"ABCDEF\"},{\"type\":\"TXT\",\"txt\":[\"hnsb=1;host=@;alpn=h2,h3;tlsa=3,1,1,aabbcc\"]}]}' default" "$HNS_DANE_OUTPUT_DIR/wallet-hsd-cli.md" "account-aware hsw update"
assert_file_contains 'Wallet CLI Submit Commands' "$HNS_DANE_WEB/index.html" "dashboard shows wallet CLI section"
assert_file_contains 'hsd-rpc getnameinfo denuoweb true' "$HNS_DANE_WEB/index.html" "dashboard shows chain check command"
assert_file_contains 'hsw-cli --id primary account list' "$HNS_DANE_WEB/index.html" "dashboard shows account list command"
assert_file_contains 'hsw-rpc selectwallet primary' "$HNS_DANE_WEB/index.html" "dashboard shows raw wallet RPC selection"
assert_file_contains 'hsw-rpc sendupdate denuoweb' "$HNS_DANE_WEB/index.html" "dashboard shows wallet update command"
assert_file_contains 'default' "$HNS_DANE_WEB/index.html" "dashboard includes configured account"
assert_file_contains 'Records not listed here, including old nameserver glue, are removed.' "$HNS_DANE_WEB/index.html" "dashboard explains replacement semantics"

printf 'ok - wallet-instructions\n'
