#!/usr/bin/env bash
set -Eeuo pipefail

escape_html() {
  python3 -c 'import html, sys; print(html.escape(sys.stdin.read(), quote=True), end="")'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  escape_html
fi
