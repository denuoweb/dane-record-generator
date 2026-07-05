#!/usr/bin/env bash
set -Eeuo pipefail

echo "This removes services and public files but keeps private backups/config unless --purge is passed." >&2
purge=0
if [[ "${1:-}" == "--purge" ]]; then
  purge=1
fi

systemctl disable --now hns-dane-verify.timer hns-dane-verify.service 2>/dev/null || true
rm -f /etc/systemd/system/hns-dane-verify.timer /etc/systemd/system/hns-dane-verify.service
rm -f /usr/local/bin/hns-dane
rm -rf /usr/local/lib/hns-dane-appliance /var/www/hns-dane

if [[ "$purge" == "1" ]]; then
  rm -rf /etc/hns-dane-appliance /var/lib/hns-dane-appliance /var/log/hns-dane-appliance /root/hns-dane-appliance
fi

systemctl daemon-reload 2>/dev/null || true
