# Linode Beginner Deploy

This path is for a user who wants Linode/Akamai to bill them directly and wants to paste the final HNS records into their own wallet.

## Flow

1. Open the project UI and enter one Handshake name, such as `denuoweb` or `denuoweb/`.
2. Choose the Linode/Akamai deployment path.
3. Create a Debian 12 Linode with the pinned HNS DANE StackScript.
4. Wait for the StackScript to finish.
5. Open the dashboard at the server IPv4 address.
6. Copy the GLUE and DS records into the wallet that owns the HNS name.
7. Submit the HNS update yourself.
8. Return to the dashboard after confirmation and check verification status.

## What the appliance never asks for

Do not paste these into the UI, StackScript UDF fields, SSH session, or dashboard:

```text
HNS wallet seed
HNS private key
Linode API token
Cloud provider API token
Credit card/payment data
Registrar login
TLS private key supplied by user
DNSSEC private key supplied by user
```

The VPS generates its own TLS and DNSSEC keys locally. The public dashboard shows only public DNS records and status.

## Beginner mode

Use `single-node` for v0.1. It creates:

```text
ns1.<name>. -> server IPv4
GLUE4 + DS for the HNS wallet
TLSA _443._tcp.<name>. from the local HTTPS key
```

Terraform/OpenTofu and SYNTH records are not part of the beginner path.
