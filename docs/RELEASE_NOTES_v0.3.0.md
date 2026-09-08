# dsh-failure-lens v0.3.0

This release moves Failure Lens onto the current DeepSeek Harness client
architecture without broadening its classifier or permissions.

## Current Harness compatibility

- Targets `@deepseek-ai/dsh@0.1.2-rc.1` and its split client packages.
- Replaces the removed `@deepseek-ai/dsh-client-runtime` dependency with Cordis
  `Context`, `uiConversation.events`, and the public chat/conversation surfaces.
- Follows the upstream
  [`refactor(client): migrate consumers and remove Runtime`](https://github.com/deepseek-ai/deepseek-harness/commit/be531688f312537787838ffceaf9382b6a918884)
  boundary rather than treating the package's stale npm tag as an active client
  dependency.
- Keeps the renderer, bilingual copy, deterministic signature, and visible UI
  unchanged.
- Keeps `dsh-failure-lens@0.2.2` available for legacy Harness
  `0.1.0-rc.8` profiles.

## Better upstream signals

- The compatibility canary now tests one coherent client release manifest:
  every active Harness package is pinned to the exact version selected by
  `@deepseek-ai/dsh@next`.
- A separate registry-hygiene sentinel reports the orphaned
  `@deepseek-ai/dsh-client-runtime@next` tag. That external registry condition
  can no longer be confused with a Failure Lens build regression.
- A client-entry contract test proves the plugin registers through the current
  services and does not request the removed `conversationEvents` service.

## Unchanged product boundary

- One deterministic `spawn EPERM` signature.
- Same-block durable failure evidence remains mandatory.
- No telemetry, network, disk writes, model calls, auto-approval, raw-output
  duplication, or DOM patching.

## Install

```sh
dsh plugin --profile web add dsh-failure-lens@0.3.0
```

Legacy Harness `0.1.0-rc.8` profiles should instead pin:

```sh
dsh plugin --profile web add dsh-failure-lens@0.2.2
```

## Verification before release

- 40 deterministic tests plus TypeScript, production-build, package-contract,
  and pack-surface gates.
- Fresh Windows profile installation with the exact 0.3.0 tarball under
  `@deepseek-ai/dsh@0.1.2-rc.1`.
- Successful composed-config check and live Web boot (`HTTP 200`).
- Real browser load with the Failure Lens client asset present and no browser
  warning or error logs.
- Cross-platform CI and current-release canary results are required before the
  release is published.
