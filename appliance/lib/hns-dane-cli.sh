#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

case "${1:-}" in
  status)
    if [[ -f "$HNS_DANE_FILES_DIR/status.json" ]]; then
      cat "$HNS_DANE_FILES_DIR/status.json"
    else
      echo "No status file yet. Run: hns-dane verify" >&2
      exit 1
    fi
    ;;
  verify)
    "$SCRIPT_DIR/verify-local.sh"
    "$SCRIPT_DIR/verify-hns.sh"
    "$SCRIPT_DIR/generate-dashboard.sh"
    ;;
  print-hns-resource)
    cat "$HNS_DANE_OUTPUT_DIR/hns-resource.json"
    ;;
  print-wallet-instructions)
    cat "$(selected_wallet_path)"
    ;;
  backup)
    "$SCRIPT_DIR/generate-backup.sh"
    ;;
  regenerate-dashboard)
    "$SCRIPT_DIR/generate-dashboard.sh"
    ;;
  show-config)
    cat "$HNS_DANE_CONFIG"
    ;;
  ""|-h|--help)
    cat <<'EOF'
Usage: hns-dane COMMAND

Commands:
  status
  verify
  print-hns-resource
  print-wallet-instructions
  backup
  regenerate-dashboard
  show-config
EOF
    ;;
  *)
    fail "Unknown command: $1"
    ;;
esac
