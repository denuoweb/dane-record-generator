# Publish The Linode StackScript

The beginner UI becomes fully integrated only after a maintainer publishes the StackScript to Linode and configures the app with the resulting StackScript ID.

This is a maintainer/release step, not something beginners should do.

## 1. Create a tagged release

Create the git tag that matches `appliance/VERSION`, then push it.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 2. Compute the GitHub release archive hash

```bash
scripts/sha256-release.sh https://github.com/denuoweb/dane-record-generator/archive/refs/tags/v0.1.0.tar.gz
```

The StackScript must be pinned to this hash before publication.

## 3. Publish to Linode

Use a maintainer token with the narrow StackScripts write permission. Do not put this token in the web UI, a StackScript UDF, a repo file, or user-facing docs.

```bash
export LINODE_API_TOKEN=...
scripts/publish-linode-stackscript.sh --sha256 <release-tarball-sha256>
```

To make the StackScript public, add `--public`. Linode treats public publication as irreversible, so do that only after testing in private mode.

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
