# Capability declaration

This document separates the package's declarative Harness surface from behavior
that a static scanner might infer from diagnostic string literals.

## Declared Harness surface

- `dsh.bundle.patch` points to `cordis.patch.yml`, which inserts one named
  browser plugin row. It does not monkey-patch Harness source or private APIs.
- `dsh.client.platform` is `web`.
- The browser bundle injects the documented locale, chat, conversation, and
  renderer client packages needed to register one Conversation Node. It does
  not depend on the removed `@deepseek-ai/dsh-client-runtime` package.

## Runtime behavior

- Reads already-delivered `tool/result` session events in the browser.
- Applies a pure deterministic classifier.
- Renders a compact explanation node through public Harness extension APIs.
- Disposes every registration through the normal plugin lifecycle.

## Explicitly absent

- no `node:child_process` / `child_process` import, `spawn`, `exec`, or shell;
- no filesystem read or write;
- no network request, telemetry, or external domain;
- no environment-variable or credential access;
- no model call, prompt mutation, approval, retry, or permission escalation;
- no DOM patching or private client import.

`src/classifier.ts` contains the literal `node:internal/child_process` only
because that stack-frame text is one of four required markers in a recorded
failure. Matching that string is not process execution.

The package patch and source are the authoritative evidence. Generated
third-party capability cards should distinguish diagnostic string matching from
imports/calls before assigning subprocess or execution behavior.
