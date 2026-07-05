# Troubleshooting

## Dashboard opens but DNS fails

Check the Linode Cloud Firewall. The server can have UFW open while the provider firewall still blocks UDP 53 or TCP 53.

Run:

```bash
sudo hns-dane verify
sudo hns-dane status
```

## Knot is not active

Check the service logs:

```bash
systemctl status knot
journalctl -u knot --no-pager -n 100
```

Common causes are another service already listening on port 53 or invalid zone syntax.

## DS mismatch

Copy the DS from the dashboard or `/var/www/hns-dane/files/ds.txt` into the HNS wallet resource editor and submit a new update. Do not rotate the DNSSEC key to fix a parent mismatch unless you are intentionally performing a rollover.

## TLSA mismatch

Do not replace the TLS private key. Run:

```bash
sudo hns-dane verify
sudo hns-dane show-config
```

If the served HTTPS key changed, restore the original key from the private backup or perform a staged TLSA rollover once that flow exists.

## Private backups

Private backup archives live at:

```text
/root/hns-dane-appliance/backups/
```

They are not published on the dashboard because they contain private DNSSEC and TLS material.
