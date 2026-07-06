# Publish The Linode StackScript

The beginner UI becomes fully integrated only after a maintainer publishes the StackScript to Linode and configures the app with the resulting StackScript ID.

This is a maintainer/release step, not something beginners should do.

## 1. Create a tagged release

Create the git tag that matches `appliance/VERSION`, then push it.

```bash
git tag v0.1.7
git push origin v0.1.7
```

## 2. Compute the GitHub release archive hash

```bash
scripts/sha256-release.sh https://github.com/denuoweb/dane-record-generator/archive/refs/tags/v0.1.7.tar.gz
```

The StackScript must be pinned to this hash before publication.

## 3. Publish to Linode

Use a maintainer token with the narrow StackScripts write permission. Do not put this token in the web UI, a StackScript UDF, a repo file, or user-facing docs.

```bash
export LINODE_API_TOKEN=...
scripts/publish-linode-stackscript.sh --sha256 <release-tarball-sha256>
```

To make the StackScript public, add `--public`. Linode treats public publication as irreversible, so do that only after testing in private mode.

### Cloud Manager form values

If publishing manually from `https://cloud.linode.com/stackscripts/create`, use these values:

```text
StackScript Label:
hns-dane-appliance

Description:
Beginner HNS DANE appliance for one Handshake domain. Installs Knot DNS authoritative DNSSEC, TLSA, nginx dashboard, wallet record exports, and local verification. Does not request wallet seeds, Linode API tokens, registrar credentials, or payment data.

Target Images:
Debian 13

Optional additional target:
Debian 12

Revision Note:
v0.1.7
```

Do not use the Handshake domain, such as `denuoweb/`, as the StackScript label. The domain is entered later when creating a Linode from the StackScript, in the generated `hns_name` UDF field.

The generated StackScript asks for the Handshake domain, wallet instruction format, hsd wallet ID, hsd account name, and IPv6 preference. The normal hsd defaults are wallet ID `primary` and account name `default`. These are non-secret routing hints used only to render local `hsw-rpc` instructions.

For the `Script` field, paste the rendered hash-pinned script:

```bash
scripts/render-linode-stackscript.sh --sha256 <release-tarball-sha256> > /tmp/hns-dane-appliance-stackscript.sh
```

Open `/tmp/hns-dane-appliance-stackscript.sh` and paste its contents into the Cloud Manager `Script` field. Do not paste `stackscripts/linode/hns-dane-appliance-bootstrap.sh` directly unless the placeholder hash has already been replaced; the committed source intentionally fails closed.

The command prints:

```json
{
  "id": 1234567,
  "label": "hns-dane-appliance",
  "cloudUrl": "https://cloud.linode.com/stackscripts/1234567",
  "appEnv": "VITE_LINODE_STACKSCRIPT_ID=1234567"
}
```

## 4. Configure the web app

Set the published StackScript ID when building the static app:

```bash
VITE_LINODE_STACKSCRIPT_ID=1234567 npm run build
```

When this value is set, the app shows an `Open Linode` deployment button that points at:

```text
https://cloud.linode.com/stackscripts/1234567
```

The user still deploys inside their own Linode account, and Linode bills them directly.

## Why this is separate

The browser app must not ask for a Linode API token because that would violate the beginner safety model. Publishing the StackScript is a project maintainer release action; using the published StackScript is the beginner action.
