# Security policy

## Reporting a vulnerability

`dsh-failure-lens` is a read-only, presentational browser plugin. If you find a security issue — especially anything that contradicts the guarantees below — please report it privately rather than opening a public issue.

**Report to:** open a private security advisory in the GitHub repository, or contact the maintainer directly. Please include the affected version and a minimal reproduction.

## Security guarantees (v0.3)

The plugin is designed within the following hard boundaries. Any behavior outside them is a bug and should be reported:

- **No telemetry, no network, no disk writes.** The plugin adds no requests of its own and writes nothing to storage.
- **No model calls.** Classification is a pure deterministic function; the plugin never invokes an LLM, never edits the system prompt, and never adds tokens to a request.
- **No approval, no re-execution.** The plugin never auto-approves, never escalates sandbox permissions, and never runs the command again.
- **No raw-output duplication.** The tool card keeps the original output; the plugin renders only a summary row.
- **No DOM patching or private-internals imports.** Composition is exclusively through the documented Harness client APIs.

## Supported versions

Only the latest release is supported for security fixes. Pin to the current version and upgrade when a fix is published.

## Scope

The plugin observes the locally-delivered session events in the browser tab where it is installed. It does not transmit, store, or persist any of that data.
