# dsh-failure-lens v0.2.1

This maintenance release completes the public registry and feedback loop for
the stable, deliberately narrow `spawn EPERM` classifier.

## Highlights

- Install the exact stable version from npm or its matching pinned GitHub
  Release artifact.
- Publish through npm OIDC trusted publishing with automatic provenance and no
  long-lived registry token.
- Add a privacy-trimmed real field-report form for false positives and false
  negatives.
- Document the plugin's declared and observed capability surface, including why
  a diagnostic `node:internal/child_process` literal is not subprocess access.
- Exercise the Harness `next` client integration on both Ubuntu and Windows in
  the scheduled canary while keeping stable compatibility pinned to rc.7.

## Install

```sh
dsh plugin --profile web add dsh-failure-lens@0.2.1
```

The pinned GitHub asset and its SHA-256 checksum are attached to this release.

## Verification

- Script syntax, TypeScript typecheck, deterministic tests, and production
  client/library build.
- Package dry run and clean Harness profile install/boot smoke test.
- CI on Windows, macOS, and Linux with Node.js 22.19 and 24.
- Registry install and Harness bundle activation after trusted publication.
