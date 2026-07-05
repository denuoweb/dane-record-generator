#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=test-lib.sh
source "$SCRIPT_DIR/test-lib.sh"
# shellcheck source=../lib/escape-html.sh
source "$TEST_ROOT/lib/escape-html.sh"

escaped="$(printf '%s' '<script>x&"'\''</script>' | escape_html)"
assert_eq '&lt;script&gt;x&amp;&quot;&#x27;&lt;/script&gt;' "$escaped" "basic HTML escaping"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
make_test_env "$tmp"
seed_config
jq '.dnssec.ds = {keyTag: 12345, algorithm: 13, digestType: 2, digest: "ABCDEF"} | .tlsa.associationData = "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"' "$HNS_DANE_CONFIG" > "$tmp/config.json"
mv "$tmp/config.json" "$HNS_DANE_CONFIG"
"$TEST_ROOT/lib/generate-hns-resource.sh"
"$TEST_ROOT/lib/render-wallet-instructions.sh"
"$TEST_ROOT/lib/generate-dashboard.sh"

assert_file_contains 'HNS &lt;DANE&gt; Site' "$HNS_DANE_WEB/index.html" "dashboard title is escaped"
assert_file_not_contains 'HNS <DANE> Site' "$HNS_DANE_WEB/index.html" "dashboard has no raw title markup"
assert_file_contains 'color-scheme: light;' "$HNS_DANE_WEB/index.html" "dashboard uses fixed light color scheme"
assert_file_contains 'background: var(--panel); color: var(--fg);' "$HNS_DANE_WEB/index.html" "dashboard cards set explicit text color"
assert_file_not_contains 'color-scheme: light dark' "$HNS_DANE_WEB/index.html" "dashboard does not opt into browser dark color substitutions"
assert_file_not_contains 'canvasText' "$HNS_DANE_WEB/index.html" "dashboard does not use dark-mode-sensitive system text color"
assert_file_not_contains 'LinkText' "$HNS_DANE_WEB/index.html" "dashboard does not use dark-mode-sensitive system link color"
assert_file_contains 'color-scheme:light' "$HNS_DANE_WEB/preflight.html" "preflight page uses fixed light color scheme"
assert_file_not_contains 'color-scheme: light dark' "$HNS_DANE_WEB/preflight.html" "preflight page does not opt into browser dark color substitutions"

printf 'ok - html-escaping\n'
