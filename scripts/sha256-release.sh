#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: sha256-release.sh FILE_OR_URL" >&2
  exit 2
fi

target="$1"
if [[ "$target" =~ ^https?:// ]]; then
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  curl -fsSL "$target" -o "$tmp"
  sha256sum "$tmp"
else
  sha256sum "$target"
fi
