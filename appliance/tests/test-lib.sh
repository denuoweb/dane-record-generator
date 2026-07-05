#!/usr/bin/env bash
set -Eeuo pipefail

TEST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail_test() {
  printf 'not ok - %s\n' "$*" >&2
  exit 1
}

assert_eq() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  [[ "$expected" == "$actual" ]] || fail_test "$message: expected [$expected], got [$actual]"
}

assert_contains() {
  local needle="$1"
  local haystack="$2"
  local message="$3"
  [[ "$haystack" == *"$needle"* ]] || fail_test "$message: missing [$needle]"
}

assert_file_contains() {
  local needle="$1"
  local file="$2"
  local message="$3"
  grep -Fq "$needle" "$file" || fail_test "$message: missing [$needle] in $file"
}

assert_file_not_contains() {
  local needle="$1"
  local file="$2"
  local message="$3"
  ! grep -Fq "$needle" "$file" || fail_test "$message: unexpected [$needle] in $file"
}

assert_rejects() {
  local value="$1"
  if normalize_hns_name "$value" >/dev/null 2>&1; then
    fail_test "expected input to be rejected: $value"
  fi
}

make_test_env() {
  local tmp="$1"
  export HNS_DANE_TEST=1
  export HNS_DANE_PUBLIC_IPV4=203.0.113.10
  export HNS_DANE_ETC="$tmp/etc"
  export HNS_DANE_STATE="$tmp/state"
  export HNS_DANE_LOG_DIR="$tmp/log"
  export HNS_DANE_ROOT="$tmp/root"
  export HNS_DANE_WEB="$tmp/web"
  export HNS_DANE_CONFIG="$tmp/etc/config.json"
  export HNS_DANE_OUTPUT_DIR="$tmp/root/output"
  export HNS_DANE_BACKUP_DIR="$tmp/root/backups"
  export HNS_DANE_TLS_DIR="$tmp/etc/tls"
  export HNS_DANE_ZONE_DIR="$tmp/state/zones"
  export HNS_DANE_FILES_DIR="$tmp/web/files"
  export HNS_DANE_KNOT_CONF="$tmp/knot/knot.conf"
  export HNS_DANE_NGINX_AVAILABLE="$tmp/nginx/sites-available/hns-dane"
  export HNS_DANE_NGINX_ENABLED="$tmp/nginx/sites-enabled/hns-dane"
  export HNS_DANE_SYSTEMD_DIR="$tmp/systemd"
}

seed_config() {
  "$TEST_ROOT/lib/generate-config.sh" \
    --hns-name "DenuoWeb/" \
    --site-title "HNS <DANE> Site" \
    --deployment-mode single-node \
    --wallet-style generic \
    --enable-ipv6 no
}
