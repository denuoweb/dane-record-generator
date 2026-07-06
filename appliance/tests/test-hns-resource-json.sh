#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=test-lib.sh
source "$SCRIPT_DIR/test-lib.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
make_test_env "$tmp"
seed_config

jq '.network.publicIPv6 = "2001:db8::10" | .nameservers[0].ipv6 = "2001:db8::10" | .dnssec.ds = {keyTag: 12345, algorithm: 13, digestType: 2, digest: "ABCDEF012345"} | .tls.spkiSha256 = "AABBCC"' "$HNS_DANE_CONFIG" > "$tmp/config.json"
mv "$tmp/config.json" "$HNS_DANE_CONFIG"

"$TEST_ROOT/lib/generate-hns-resource.sh"

assert_eq "NS" "$(jq -r '.records[0].type' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "first record type"
assert_eq "ns1.denuoweb." "$(jq -r '.records[0].ns' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "NS nameserver"
assert_eq "GLUE4" "$(jq -r '.records[1].type' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "IPv4 record type"
assert_eq "ns1.denuoweb." "$(jq -r '.records[1].ns' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "GLUE4 nameserver"
assert_eq "GLUE6" "$(jq -r '.records[2].type' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "IPv6 record type"
assert_eq "DS" "$(jq -r '.records[3].type' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "DS record type"
assert_eq "12345" "$(jq -r '.records[3].keyTag' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "DS key tag"
assert_eq "4" "$(jq -r '.records | length' "$HNS_DANE_OUTPUT_DIR/hns-resource.json")" "record count"
assert_file_not_contains "hnsdns=1" "$HNS_DANE_OUTPUT_DIR/hns-resource.json" "experimental DoH TXT removed"
assert_file_not_contains "hnsb=1" "$HNS_DANE_OUTPUT_DIR/hns-resource.json" "capsule experiment removed"

printf 'ok - hns-resource-json\n'
