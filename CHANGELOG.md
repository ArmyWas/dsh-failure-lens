# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
