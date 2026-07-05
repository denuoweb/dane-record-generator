#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=test-lib.sh
source "$SCRIPT_DIR/test-lib.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
make_test_env "$tmp"
seed_config

"$TEST_ROOT/lib/generate-tlsa.sh"
tlsa_record="$(cat "$HNS_DANE_FILES_DIR/tlsa.txt")"
[[ "$tlsa_record" =~ ^_443\._tcp\.denuoweb\.\ 3600\ IN\ TLSA\ 3\ 1\ 1\ [0-9A-F]{64}$ ]] || fail_test "unexpected TLSA record: $tlsa_record"

key_path="$(jq -r '.tls.privateKeyPath' "$HNS_DANE_CONFIG")"
before="$(sha256sum "$key_path" | awk '{print $1}')"
"$TEST_ROOT/lib/generate-tlsa.sh"
after="$(sha256sum "$key_path" | awk '{print $1}')"
assert_eq "$before" "$after" "TLS private key should not rotate on rerun"

digest="$(jq -r '.tlsa.associationData' "$HNS_DANE_CONFIG")"
assert_contains "$digest" "$tlsa_record" "TLSA file should match config digest"

printf 'ok - tlsa-generation\n'
