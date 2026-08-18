# dsh-failure-lens — product brief

## Product decision

Build a small, deterministic DeepSeek Harness Web client plugin that explains one high-confidence Windows sandbox failure at the moment it appears in the conversation:

> `spawn EPERM` caused by a confined Node child process trying to use piped stdio.

The plugin must add a separate Conversation Node immediately after the matching tool result. It must not replace the built-in tool row, patch the DOM, alter the session log, run another model, auto-approve anything, or hide raw output.

## Real evidence

- Installed-plugin screenshot: [`docs/failure-lens-harness.jpg`](docs/failure-lens-harness.jpg)
- Real-event-derived fixture: [`test/fixtures/real-tool-result.ts`](test/fixtures/real-tool-result.ts)
- Matching event: `tool/result`, sequence `24071`
- The result text contains six repeated `Error: spawn EPERM` stacks and ends with `[exit code: 1]`.
- Crucially, the tool-result block has `isError: false`. Existing failure observers that only consume thrown tool errors do not see this case.
- The full exported session stays out of the repository because session logs may contain private conversation context; the minimal fixture retains only the evidence needed by the classifier test.
- Official boundary documentation lives in the [`dsh-sandbox-windows-acl`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/sandbox/sandbox-windows-acl) and [`dsh-tool-pwsh`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/shell/tool-pwsh) packages.

## Community gap check (2026-08-19)

- Exact GitHub searches for `dsh failure lens`, `spawn EPERM` + DeepSeek Harness, and the Windows ACL sandbox package returned no implementation.
- [`dsh-fail-logger`](https://github.com/Areium/dsh-fail-logger) is adjacent but different: it records thrown failures into a long-term skill and explicitly does not trigger for non-zero shell exit codes. This observed event is `isError: false`.
- Session reports, telemetry, approval gates, verifiers, plugin doctors, and launchers already exist and are out of scope.

## User problem

When a normal Windows user sees every test file marked failed plus a long stack and exit code 1, the natural conclusion is “the project tests are broken.” In this known case, no test body started; the Harness sandbox blocked the test runner from spawning workers. The UI should distinguish those meanings immediately and preserve the evidence.

## V0.1 experience

After a matching tool result, show a compact warning row using the official Harness visual language and tokens:

- Title: `Harness 沙箱限制` / `Harness sandbox limitation`
- Plain-language meaning: `测试未启动；这不代表测试断言失败。`
- Safe next action: `如需验证，请在用户批准后以沙箱外权限重试同一命令。`
- Signature chip/text: `EPERM · spawn`

The row is historical information, keyboard/assistive-technology readable, and bilingual through the official locale service. Raw output remains in the built-in tool card immediately above it.

## Classifier contract

Create a pure exported-for-tests classifier that accepts an unknown Session event and returns either `null` or a renderer-safe diagnosis object.

Match only when all of these are present in a `tool/result` text block:

1. `Error: spawn EPERM`
2. `code: 'EPERM'` or `code: "EPERM"`
3. `syscall: 'spawn'` or `syscall: "spawn"`
4. a Node child-process stack marker such as `node:internal/child_process`

Treat whitespace, CRLF/LF, ANSI color escapes, repeated stacks, and either quote style deterministically. Do not match generic `EPERM`, a user-authored assistant message, a different syscall, or a successful text merely mentioning the phrase without the structured signature.

## Official extension path

Use only documented APIs from the installed/current Harness packages:

- register a single-event `ConversationNodeDefinition` through `ctx.conversationEvents.register(...)`
- register its keyed renderer through `ctx.slots.inject('conversation.chat.node', ...)`
- register `zh` and `en` dictionaries through `ctx.locale.register(...)`
- package the browser half through `dsh.client` and an out-of-tree `lib/client.js` bundle

Relevant references:

- [`docs/cookbook/adding-a-conversation-node.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-conversation-node.md)
- [`packages/client/ui-workflow-run/src/client`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-workflow-run/src/client)
- [`packages/client/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)

## Acceptance criteria

- Clean npm package and real DSH bundle patch; installable with `dsh plugin --profile web add link:<path>`.
- No host-side runtime behavior beyond the minimal Cordis plugin entry required for loading.
- Pure classifier tests cover positive real-log-derived input and negative lookalikes.
- Conversation definition tests cover stable identity, location, and replay.
- Component tests cover Chinese and English copy, semantics, and no raw-output duplication.
- Build produces `lib/index.js`, `lib/invariant.js`, and lazy-CJS `lib/client.js` expected by Harness.
- Typecheck, unit tests, package dry-run, and a real install/boot smoke test pass.
- Apache-2.0 license, bilingual README, security/privacy section, uninstall/rollback instructions, screenshots, changelog, CI, issue templates, and contribution guide.
- Keep V0.1 deliberately narrow; a future classifier registry is allowed only after real demand.

## Stop conditions

Stop and report rather than shipping a workaround if the current public APIs cannot add the node without source changes, if the plugin requires importing private client internals, or if a live duplicate with the same immediate UX and signature already exists.
