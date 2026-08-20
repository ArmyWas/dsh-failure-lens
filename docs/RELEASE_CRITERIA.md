# Release, adoption, and expansion gates

The current release is stable for its single documented signature. “Stable”
does not mean the plugin has broad adoption or should grow into a generic error
classifier without evidence.

## Registry publication gate

- The exact GitHub release artifact passes typecheck, tests, build, pack, and a
  clean Harness install/boot smoke test.
- The client bundle contains no absolute build-machine path, and its CSS Module
  identities remain byte-for-byte stable when the checkout root changes.
- The trusted release workflow uploads the same tarball it submits to npm, and
  the GitHub asset digest matches the downloaded registry tarball.
- `.github/workflows/publish.yml` is the package's npm trusted publisher; it
  uses GitHub OIDC rather than a long-lived registry token, and provenance is
  produced automatically.
- A clean registry install is verified before README commands are changed.

## Classifier expansion gate

- Collect at least three independent, privacy-reviewed field reports.
- Record false positives, false negatives, Harness version, and evidence shape.
- Add a new signature only when it has a documented upstream boundary and
  same-block durable failure evidence.
- Prefer a generic upstream “infrastructure vs assertion” seam over an
  indefinitely growing private registry.

Stars, clone counts, release downloads, and automated catalog inclusion are
discovery signals, not field reports. CI and release smoke tests can generate
the same events.
