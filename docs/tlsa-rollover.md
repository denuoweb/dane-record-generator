# TLSA Rollover

The default TLSA record is:

```text
_443._tcp.<name>. IN TLSA 3 1 1 <sha256-of-SPKI>
```

That value pins the HTTPS service public key. If nginx starts serving a different key before DNS publishes the matching TLSA record, DANE-aware clients can reject the service.

Default v0.1 behavior:

```text
TLS key generated once
TLS private-key rotation disabled
TLSA generated from the existing HTTPS public key
installer reruns keep the existing key
```

Future staged rollover should follow this order:

1. Generate the next TLS key.
2. Publish current and next TLSA records together.
3. Wait at least the DNS TTL.
4. Switch nginx to the next key and certificate.
5. Verify the live HTTPS SPKI hash matches the new TLSA.
6. Remove the old TLSA after another TTL window.

Until that guided flow exists, do not replace `/etc/hns-dane-appliance/tls/*.key`.
