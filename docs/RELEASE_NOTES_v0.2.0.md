# dsh-failure-lens v0.2.0

This release hardens the seam between an infrastructure failure and text that merely mentions one.

## Highlights

- Requires same-block failure evidence: `isError: true` or a non-zero `[exit code: N]`.
- Never combines signature fragments or failure flags from separate tool-result blocks.
- Displays the parsed exit code in the compact signature chip.
- Gives screen readers the evidence source, stack count, exit code, and errno without copying the raw stack.
- Documents how the real event, official Harness source, and classifier contract support the diagnosis.

## Verification

- TypeScript typecheck
- deterministic classifier, Conversation Definition, locale, component, lifecycle, and package tests
- production client/library build
- installed-plugin replay of the unchanged real event after a clean Harness restart
- package dry-run and fresh-release installation smoke test
- CI on Windows, macOS, and Linux with Node 22.19 and Node 24

The GitHub release remains the distribution channel; this release is not published to the npm registry.
