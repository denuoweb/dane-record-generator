#!/usr/bin/env bash
set -Eeuo pipefail

normalize_hns_name() {
  local input="${1:-}"
  local name

  name="$(printf '%s' "$input" | tr -d '[:space:]')"
  [[ -n "$name" ]] || {
    echo "HNS name is required." >&2
    return 1
  }

  if [[ "$name" =~ :// ]]; then
    echo "Enter only the HNS label, not a URL." >&2
    return 1
  fi

  if [[ "$name" == */* && "$name" != */ ]]; then
    echo "HNS v0.1 accepts one label only; remove extra / characters." >&2
    return 1
  fi

  name="${name%/}"
  name="${name%.}"
  name="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"

  [[ -n "$name" ]] || {
    echo "HNS name is required." >&2
    return 1
  }
  [[ "$name" != *.* ]] || {
    echo "HNS v0.1 accepts one label only, not dotted hostnames." >&2
    return 1
  }
  [[ ${#name} -le 63 ]] || {
    echo "HNS labels must be 63 characters or shorter." >&2
    return 1
  }
  [[ "$name" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || {
    echo "HNS labels may use letters, digits, and interior hyphens only." >&2
    return 1
  }

  printf '%s\n' "$name"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  normalize_hns_name "${1:-}"
fi
