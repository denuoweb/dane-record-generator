# Linode Firewall Preflight

The appliance configures UFW on the server. A Linode Cloud Firewall is separate and can still block traffic before it reaches the VPS.

Allow these ports in both places:

```text
TCP 22    SSH
UDP 53    authoritative DNS
TCP 53    authoritative DNS fallback and large DNSSEC answers
TCP 80    HTTP dashboard
TCP 443   HTTPS test site and DANE endpoint
```

If DNS tests fail but the server says Knot is running, check the Linode Cloud Firewall first.

Do not expose a recursive resolver. This appliance runs authoritative DNS only.
