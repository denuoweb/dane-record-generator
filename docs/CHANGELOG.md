# Changelog

## Unreleased

- Added an experimental HNS Browser Capsule TXT output that reuses TLSA 3 1 1 SPKI hashes and emits compact HSD `TXT` resource JSON for direct browser tests.
- Replaced raw browser base64 decode errors with field-specific PEM/DNSKEY validation messages.
- Clarified the DANE certificate/public-key field as the TLSA source and shows its how-to instructions whenever TLSA is missing.
- Added production DANE/DNSSEC guidance for validation, authoritative nameserver hardening, DNSSEC lifecycle, TLSA rollover, client enforcement, service scope, and pasted-input correctness.
- Expanded generated verification commands to distinguish direct authoritative answers from DNSSEC chain validation with `delv`, AD-bit checks, and HNS-aware resolver checks.
- Added generated web-server notes for TLSA current/next key rollover and DANE client-support limits.
- Added authoritative-server operational checklists to server presets.
- Added hosted DNS provider preset for web admins using a DNS host instead of running an authoritative daemon.
- Added Windows Server DNS preset and Debian/Windows OS quick starts for delegated authoritative DANE and HNS SYNTH nameserver setup.
- Linked the OS quick starts from the website footer and DNS server preset field so users can find them before generating records.
- Expanded setup-mode guidance with a nameserver hostname walkthrough, glue/DNSSEC/DS/TLSA placement, and provider-specific DNSSEC/TLSA caveats.
- Added IDNA normalization for internationalized domain input and documented i18n standards.
- Expanded new-admin FAQ coverage for DNSKEY timing, parent/server record split, TLSA provider support, and DANE web-server requirements.
- Removed the DANE basic/advanced toggle, made optional fields visible by default, always shows integrator JSON, and added focused field-level "How to get this" help for certificate/PUBLIC KEY and DNSKEY inputs.
- Audited the "How to get this" command examples so certificate and DNSKEY help updates with the current domain, website IP, nameserver, and HTTPS port.
- Added UI localization with a persisted language selector for English, Spanish, French, German, Portuguese, Japanese, Arabic, Persian, and Hebrew.
- Localized generated guidance, notices, setup-status details, output explanations, web-server notes, and help tips through a result-localization pass.

## 0.3.0

- Refactored the scaffold into a focused first production version.
- Added output sections for verification commands and optional integrator JSON.
- Added NSD preset.
- Hardened DNSKEY parsing for parenthesized/multiline zone-file input.
- Improved TLSA PEM handling and private-key rejection.
- Replaced long visible explanations with concise help text.
- Pinned dependency versions in `package.json`.
- Added tests for integrator output and multiline DNSKEY parsing.

## 0.2.0

- Added the onboarding UI, server presets, Docker/Nginx deployment files, and production docs.

## 0.1.0

- Initial HNS/ICANN DNSSEC + DANE bootstrap scaffold.
