# dsh-failure-lens v0.2.2

This release makes the client artifact reproducible without changing the
classifier or visible behavior.

## Fixed

- CSS Module hashes now use a canonical repository-relative identity instead
  of a build-machine absolute path.
- Building the same source from a different checkout root produces the same
  `lib/client.js` bytes.
- The build fails if a Windows, Linux, or symlink-resolved absolute repository
  path leaks into the shipped client bundle.
- The trusted workflow packs once and uses that exact tarball for both the
  GitHub Release asset and npm publication.

## Unchanged product boundary

- One deterministic `spawn EPERM` signature.
- Same-block durable failure evidence remains mandatory.
- No telemetry, network, disk writes, model calls, auto-approval, raw-output
  duplication, or DOM patching.

## Install

```sh
dsh plugin --profile web add dsh-failure-lens@0.2.2
```

## Verification

- 38 deterministic tests, TypeScript typecheck, and production builds.
- Identical client SHA-256 under the normal checkout and a second junctioned
  checkout root on Windows.
- CI on Windows, macOS, and Linux with Node.js 22.19 and 24.
- Clean Harness registry install and npm signature/provenance verification.
- Matching SHA-256 for the GitHub asset and a fresh npm registry download.
