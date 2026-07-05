# HNS DANE Appliance

This directory contains the server-side appliance for a beginner HNS DANE deployment path.

The appliance turns one Debian 12 Linode into:

- an authoritative Knot DNS server for one Handshake label
- a DNSSEC-signed zone with parent-facing DS export
- a local HTTPS endpoint with TLSA `3 1 1`
- a static dashboard with exact HNS wallet records
- public exports for GLUE, DS, TLSA, and status
- root-only backups for generated private key material

The installer does not ask for wallet seeds, wallet private keys, Linode API tokens, registrar credentials, user-supplied TLS private keys, user-supplied DNSSEC private keys, payment data, or credit card data.

## Supported v0.1 path

Debian 12 is the primary target. Ubuntu 24.04 is accepted if the same packages and service names are available.

Beginner mode is single-node:

```bash
sudo appliance/install.sh \
  --hns-name denuoweb/ \
  --site-title "HNS DANE Site" \
  --deployment-mode single-node \
  --wallet-style generic \
  --enable-ipv6 no
```

The generated canonical config is:

```text
/etc/hns-dane-appliance/config.json
```

All renderers use that config as their source of truth.

## Important paths

```text
/etc/hns-dane-appliance/config.json
/etc/hns-dane-appliance/tls/
/var/lib/hns-dane-appliance/
/var/log/hns-dane-appliance/
/root/hns-dane-appliance/output/
/root/hns-dane-appliance/backups/
/var/www/hns-dane/
/var/www/hns-dane/files/
```

Private backups stay under `/root/hns-dane-appliance/backups/` and are not published by nginx.

## Local CLI

The installer creates:

```text
/usr/local/bin/hns-dane
```

Supported commands:

```bash
hns-dane status
hns-dane verify
hns-dane print-hns-resource
hns-dane print-wallet-instructions
hns-dane backup
hns-dane regenerate-dashboard
hns-dane show-config
```

## Rollover defaults

DNSSEC parent-facing rollover is frozen by default. TLS private-key rotation is also frozen by default. Both are deliberate: the HNS parent resource is manually updated by the user, so changing the DNSSEC key or HTTPS key without a staged update can break validation.

Two-node reliable mode is documented as a design target in [Two-Node Reliable Mode](../docs/two-node-mode.md). v0.1 fails clearly if `primary-node` or `secondary-node` is selected because redundancy is not complete yet.
