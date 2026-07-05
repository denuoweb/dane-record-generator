#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

generate_backup() {
  config_required
  ensure_dir 0700 "$HNS_DANE_BACKUP_DIR"

  local stamp archive manifest
  stamp="$(date -u '+%Y%m%dT%H%M%SZ')"
  archive="$HNS_DANE_BACKUP_DIR/hns-dane-backup-${stamp}.tar.gz"
  manifest="$HNS_DANE_OUTPUT_DIR/backup-manifest.txt"

  {
    printf 'version=%s\n' "$HNS_DANE_VERSION"
    printf 'createdAt=%s\n' "$(utc_now)"
    printf 'config=%s\n' "$HNS_DANE_CONFIG"
    printf 'tlsDir=%s\n' "$HNS_DANE_TLS_DIR"
    printf 'zoneDir=%s\n' "$HNS_DANE_ZONE_DIR"
    printf 'outputDir=%s\n' "$HNS_DANE_OUTPUT_DIR"
  } > "$manifest"
  chmod 0600 "$manifest"

  tar --ignore-failed-read -czf "$archive" \
    "$HNS_DANE_CONFIG" \
    "$HNS_DANE_TLS_DIR" \
    "$HNS_DANE_ZONE_DIR" \
    "$HNS_DANE_OUTPUT_DIR" \
    /var/lib/knot/keys \
    /var/lib/knot/kasp \
    2>/dev/null || true
  chmod 0600 "$archive"
  log "Wrote private backup archive: $archive"
  printf '%s\n' "$archive"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  generate_backup "$@"
fi
