#!/bin/bash
# <UDF name="hns_name" label="Handshake name" example="denuoweb or denuoweb/" />
# <UDF name="site_title" label="Site title" default="HNS DANE Site" />
# <UDF name="deployment_mode" label="Deployment mode" oneOf="single-node,primary-node,secondary-node" default="single-node" />
# <UDF name="wallet_style" label="Wallet instruction style" oneOf="generic,bob,hsd-cli" default="generic" />
# <UDF name="enable_ipv6" label="Enable IPv6 if available" oneOf="no,yes" default="no" />

set -Eeuo pipefail

LOG_FILE="/root/hns-dane-bootstrap.log"
exec > >(tee -a "$LOG_FILE") 2>&1

export DEBIAN_FRONTEND=noninteractive

APPLIANCE_VERSION="v0.1.0"
APPLIANCE_ARCHIVE_URL="https://github.com/denuoweb/dane-record-generator/archive/refs/tags/${APPLIANCE_VERSION}.tar.gz"
APPLIANCE_ARCHIVE_SHA256="REPLACE_WITH_RELEASE_TARBALL_SHA256"

if [[ "${APPLIANCE_ARCHIVE_SHA256}" == "REPLACE_WITH_RELEASE_TARBALL_SHA256" ]]; then
  echo "This StackScript is pinned to ${APPLIANCE_VERSION}, but the release archive SHA256 has not been filled in yet." >&2
  echo "Build a release, compute the tarball hash with scripts/sha256-release.sh, then update this file." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl tar

WORK_DIR="$(mktemp -d)"
ARCHIVE="${WORK_DIR}/hns-dane-appliance.tar.gz"
curl -fsSL "$APPLIANCE_ARCHIVE_URL" -o "$ARCHIVE"
echo "${APPLIANCE_ARCHIVE_SHA256}  ${ARCHIVE}" | sha256sum -c -

tar -xzf "$ARCHIVE" -C "$WORK_DIR"
INSTALLER="$(find "$WORK_DIR" -type f -path '*/appliance/install.sh' | head -n 1)"
if [[ -z "$INSTALLER" ]]; then
  echo "Could not find appliance/install.sh in release archive." >&2
  exit 1
fi

bash "$INSTALLER" \
  --hns-name "${HNS_NAME}" \
  --site-title "${SITE_TITLE}" \
  --deployment-mode "${DEPLOYMENT_MODE}" \
  --wallet-style "${WALLET_STYLE}" \
  --enable-ipv6 "${ENABLE_IPV6}"
