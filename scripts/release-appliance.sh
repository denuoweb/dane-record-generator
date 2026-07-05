#!/usr/bin/env bash
set -Eeuo pipefail

version="${1:-$(tr -d '[:space:]' < appliance/VERSION)}"
out_dir="${2:-dist-release}"
archive="${out_dir}/hns-dane-appliance-${version}.tar.gz"

mkdir -p "$out_dir"
tar -czf "$archive" appliance stackscripts docs scripts README.md LICENSE package.json
sha256sum "$archive" > "${archive}.sha256"

printf '%s\n' "$archive"
printf '%s\n' "${archive}.sha256"
