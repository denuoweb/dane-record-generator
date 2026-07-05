#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=test-lib.sh
source "$SCRIPT_DIR/test-lib.sh"
# shellcheck source=../lib/normalize-name.sh
source "$TEST_ROOT/lib/normalize-name.sh"

assert_eq "denuoweb" "$(normalize_hns_name "denuoweb")" "plain label"
assert_eq "denuoweb" "$(normalize_hns_name "denuoweb/")" "slash label"
assert_eq "denuoweb" "$(normalize_hns_name "denuoweb.")" "trailing dot label"
assert_eq "denuoweb" "$(normalize_hns_name "DenuoWeb")" "uppercase label"
assert_eq "xn--example" "$(normalize_hns_name "xn--example")" "punycode label"

assert_rejects "www.denuoweb"
assert_rejects "https://denuoweb/"
assert_rejects "denuoweb.com"
assert_rejects "bad/name/here"
assert_rejects ""
assert_rejects "-bad"
assert_rejects "bad-"
assert_rejects "bad_name"
assert_rejects "$(printf 'a%.0s' {1..64})"

printf 'ok - normalize-name\n'
