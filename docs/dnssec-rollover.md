# DNSSEC Rollover

The HNS parent resource contains a `DS` record that must match the DNSSEC key served by the child zone. If the child DNSSEC key changes while the HNS `DS` remains old, validating resolvers can fail the name.

For that reason, the appliance uses Knot DNS signing with manual key management. Knot refreshes signatures, but parent-facing key generation and rollover are explicit operator actions.

Default v0.1 behavior:

```text
algorithm: ECDSAP256SHA256 / 13
parent-facing rollover: disabled
automatic KSK/CSK rollover: disabled
DS stability: required until guided rollover exists
```

Intentional rollover must be staged:

1. Generate the next DNSSEC key without immediately relying on it.
2. Publish the necessary DNSKEY data in the child zone.
3. Add or update the HNS parent `DS`.
4. Wait for confirmation and TTL/caching windows.
5. Verify validation succeeds.
6. Retire old key material only after the old records are no longer needed.

Do not silently rotate DNSSEC keys during normal appliance upgrades.
