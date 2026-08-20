# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-08-21

### Changed

- Replace requests for complete session exports with a structured,
  privacy-trimmed false-positive and false-negative report.
- Document the stable Harness target and the separate `next` compatibility
  canary.
- Restrict the main CI token to read-only repository contents.
- Publish the package through npm's OIDC trusted-publishing path, with
  automatically generated provenance and no long-lived registry token.
- Add pinned npm and GitHub Release installation paths for the same reviewed
  package version.

### Maintenance

- Add weekly npm and GitHub Actions dependency updates.
- Add a scheduled build-and-test canary against Harness `next` client packages.
- Add repository pull-request and conduct templates.

## [0.2.0] - 2026-08-19

### Changed

- Requires durable failure evidence (`isError: true` or a non-zero `[exit code: N]`) in the same `tool-result` block as the four `spawn EPERM` markers.
- Keeps tool-result blocks isolated so signatures and failure flags cannot be stitched together across unrelated results.
- Shows a parsed non-zero exit code in the visible signature chip and exposes the evidence source, stack count, exit code, and errno to screen readers without duplicating raw output.
- Documents the observed-session, public-source, and classifier evidence boundary, including that the fixture's `isError: false` is motivation rather than a matching condition.

### Tests

- Adds negative coverage for successful historical stacks, exit code zero, cross-block marker stitching, and borrowed tool-error flags.

## [0.1.1] - 2026-08-19

### Changed

- Treats Harness platform modules as host-provided build-time dependencies instead of profile peers, eliminating misleading missing-peer warnings during release-tarball installation.
- Keeps React as an optional peer because the Harness Web platform supplies the runtime singleton.
- Verifies the public release URL from a fresh isolated DSH home and confirms the bundle is added to the composed profile automatically.

## [0.1.0] - 2026-08-19

### Added

- Pure, deterministic classifier for the four-condition Windows `spawn EPERM` signature (`Error: spawn EPERM` + `code` + `syscall: 'spawn'` + `node:internal/child_process`), exported for tests.
- Single-event `ConversationNodeDefinition` (`failure-lens`) registered through `ctx.conversationEvents.register(...)`.
- Keyed renderer registered through `ctx.slots.inject('conversation.chat.node', ...)` using the official `StateDot`/row visual language and `--dsw-alias-*` tokens.
- Bilingual (`zh` / `en`) dictionaries registered through `ctx.locale.register(...)`.
- Host minimal entry (`apply`, empty node half) and package-invariant companion.
- CSS Modules styling, compiled into the client bundle.
- Native esbuild/Node build chain producing `lib/index.js`, `lib/invariant.js`, `lib/classifier.js`, and lazy-CJS `lib/client.js`.
- Typecheck, unit tests (positive real-log-derived case plus negative lookalikes), build, and `npm pack --dry-run` verification.
- Bilingual README, Apache-2.0 LICENSE, contribution guide, security policy, CI workflow, and issue template.
- Real installed-plugin screenshot and a prebuilt GitHub release installation path.

### Security

- The plugin is read-only and presentational: no telemetry, no network, no disk writes, no model calls, no auto-approval, no raw-output duplication, no DOM patching.
