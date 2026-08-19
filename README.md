# dsh-failure-lens

[![CI](https://github.com/ArmyWas/dsh-failure-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/ArmyWas/dsh-failure-lens/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

[Official DeepSeek Harness community discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/3193)

**English** · [简体中文说明见下文](#简体中文说明)

A small, deterministic [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **Web client plugin** (v0.2) that explains one high-confidence Windows sandbox failure the moment it appears in the conversation: `spawn EPERM` caused by a confined Node child process trying to use piped stdio.

It adds a single **Conversation Node** immediately after the matching tool result — a compact, bilingual, keyboard/assistive-technology-readable warning row. It never replaces the built-in tool row, never patches the DOM, never alters the session log, never runs another model, never auto-approves anything, and never hides raw output.

## What it detects (exactly one signature)

`dsh-failure-lens` matches **only** when *all four* of these are present in the same `tool-result` block:

1. `Error: spawn EPERM`
2. `code: 'EPERM'` or `code: "EPERM"`
3. `syscall: 'spawn'` or `syscall: "spawn"`
4. a Node child-process stack marker such as `node:internal/child_process`

The same block must also carry durable failure evidence: either `isError: true` or a non-zero `[exit code: N]` marker. Evidence is never borrowed from another block. This prevents a successful command that prints a complete historical stack from being mislabeled.

Whitespace, CRLF/LF line endings, ANSI color escapes, repeated stacks, and either quote style are handled deterministically. It does **not** match a generic `EPERM`, a user-authored assistant message, a different syscall, or a successful text that merely mentions the phrase without the structured signature and failure evidence.

This signature comes from a real exported session: `tool/result`, sequence `24071`, whose result text carries six repeated `Error: spawn EPERM` stacks and ends with `[exit code: 1]`, while its tool-result block has `isError: false`. Failure observers that only consume *thrown* tool errors never see this case; this plugin reads the already-recorded result text instead. The observed `isError: false` is motivation, not a matching condition—the non-zero exit marker is the durable evidence in this fixture. See [Evidence boundary](docs/BOUNDARY_EVIDENCE.md).

## What you see

![dsh-failure-lens v0.2 explaining a real spawn EPERM result inside DeepSeek Harness](docs/failure-lens-harness-v0.2.png)

The screenshot above is the installed v0.2 plugin replaying a durable, real
`npm test` event inside Harness—not a mockup. The raw event was produced by the
v0.1.0 workspace test; v0.2 reclassifies that unchanged session evidence after
a clean service restart and adds the parsed `exit 1` chip.

After a matching tool result, a compact warning row appears using the official Harness visual language and design tokens (`StateDot`, row chrome, `--dsw-alias-*` tokens):

| Chinese | English |
|---|---|
| **Harness 沙箱限制** | **Harness sandbox limitation** |
| 测试未启动；这不代表测试断言失败。 | The test never started; this does not mean a test assertion failed. |
| 如需验证，请在用户批准后以沙箱外权限重试同一命令。 | To verify, retry the same command outside the sandbox after user approval. |
| `EPERM · spawn · 退出码 1` | `EPERM · spawn · exit 1` |

The row is **historical information**: it reads what already happened and never invents facts. Raw output remains in the built-in tool card immediately above it.

## Not a failure logger

This plugin is deliberately narrow and is **not**
[`dsh-fail-logger`](https://github.com/Areium/dsh-fail-logger):

- `dsh-fail-logger` records *thrown* failures into a long-term skill and explicitly does **not** trigger for non-zero shell exit codes. This observed event is `isError: false` and a non-zero exit code, so it falls outside that tool's contract.
- `dsh-failure-lens` adds **no** record, writes **no** skill, and triggers **only** on the four-condition `spawn EPERM` signature plus same-block failure evidence. It is a read-only, presentational explanation of one known sandbox boundary.

## Installation

Requires Node `^22.19.0 || >=24.0.0` and a DeepSeek Harness Web profile.

The stable compatibility target is `@deepseek-ai/dsh@0.1.0-rc.7`. Repository
CI covers Node 22.19 and 24 on Windows, macOS, and Linux. A separate weekly
canary rebuilds and tests the plugin against the Harness `next` client packages;
a canary failure is an early upstream-compatibility signal, not a regression in
the last stable release.

Install the prebuilt GitHub release (no clone or local build required):

```sh
dsh plugin --profile web add https://github.com/ArmyWas/dsh-failure-lens/releases/download/v0.2.0/dsh-failure-lens-0.2.0.tgz
```

Or install a local checkout while developing:

```sh
dsh plugin --profile web add link:<path-to-dsh-failure-lens>
```

The package declares its shipped `cordis.patch.yml` through `dsh.bundle.patch`.
The `dsh plugin` command installs the dependency and appends the bundle to the
profile's ordered `dsh.profile.bundles` list. Restart the Web profile and
refresh the browser.

## Uninstall / rollback

```sh
dsh plugin --profile web remove dsh-failure-lens
```

The same `dsh plugin` command removes the dependency and its bundle-list entry.

To roll back to a prior composition without uninstalling, edit the profile's `cordis.patch.yml` (under `$DSH_HOME/profiles/web`) to disable the plugin row:

```yaml
- id: dsh-failure-lens
  disabled: true
```

Rollback is immediate: the plugin owns no durable state, writes nothing to the session log, and its disposer removes the Conversation Definition, keyed renderer, and locale dictionaries exactly as the official client plugin lifecycle requires.

## Privacy & security

- **No telemetry, no network, no disk writes.** The plugin reads the session events already delivered to the browser and renders a row. It writes nothing anywhere.
- **No model calls.** Classification is a pure deterministic function; the plugin never invokes an LLM, never changes the system prompt, and never adds tokens to the request.
- **No approval.** The plugin never auto-approves, never widens sandbox permissions, and never re-runs anything. Its "next action" line is advice text only.
- **No raw-output duplication.** The tool result stays in the built-in tool card. The plugin copies neither the stack nor the long output; it shows only a summary line and, for screen readers, the evidence type, stack count, exit code (when present), and errno.
- **No DOM patching.** The feature composes exclusively through the documented `conversationEvents.register`, `slots.inject('conversation.chat.node', …)`, and `locale.register` surfaces. There is no DOM injection and no import of private client internals.

## False-positives

The signature-plus-failure-evidence conjunction is deliberately conservative. A false positive is still possible if a non-sandboxed process fails with an identically-shaped Node `spawn EPERM` stack and a non-zero exit/tool-error flag. The row therefore says what this evidence is consistent with and preserves the raw result above it; please [file an issue](#contributing) with a privacy-trimmed event if you see a row you believe is wrong.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [Evidence boundary](docs/BOUNDARY_EVIDENCE.md). The test suite includes a positive case derived from a real exported Harness session and negative lookalikes (generic EPERM, different syscall, user-authored text, missing structure, successful historical output, cross-block evidence, ANSI/CRLF/repeated stacks). Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run pack:check` before opening a PR.

## License

Apache-2.0. See [LICENSE](LICENSE).

---

## 简体中文说明

`dsh-failure-lens` 是一个**确定性的** DeepSeek Harness **网页客户端插件**（v0.2）。它只在同一个 `tool-result` 块中同时出现以下**四项签名证据**时才提示，并紧跟在匹配的工具结果之后插入一个独立的 Conversation Node（紧凑警告行，中英双语，支持键盘与屏幕阅读器）：

1. `Error: spawn EPERM`
2. `code: 'EPERM'` 或 `code: "EPERM"`
3. `syscall: 'spawn'` 或 `syscall: "spawn"`
4. Node 子进程的栈标记（如 `node:internal/child_process`）

同一块还必须有可持久验证的失败证据：`isError: true`，或非零 `[exit code: N]`；插件不会跨块拼接签名或借用失败标记。因此，成功命令即使打印了一段完整的历史错误栈也不会误触发。

它**不会**替换官方工具行、不会做 DOM 注入、不会修改会话日志、不会调用模型、不会自动审批，也不会复制原始长日志。该签名来自真实导出的会话（`tool/result`，序列 `24071`，六个重复 `Error: spawn EPERM` 栈并以 `[exit code: 1]` 结尾）。其中 `isError: false` 是我们发现观察盲区的动机，不是分类条件；本事件由非零退出码提供失败证据。详见[证据边界](docs/BOUNDARY_EVIDENCE.md)。

它与 `dsh-fail-logger` 的边界：后者只记录**被抛出的**失败，且不处理非零退出码；而本事件是 `isError: false` 的非零退出码，本插件只做只读、展示性的解释，不写入任何长期记忆。

安装已构建版本：`dsh plugin --profile web add https://github.com/ArmyWas/dsh-failure-lens/releases/download/v0.2.0/dsh-failure-lens-0.2.0.tgz`；本地开发可用 `dsh plugin --profile web add link:<路径>`。该命令会安装依赖，并把 bundle 自动追加到 profile 的 `dsh.profile.bundles`，随后重启 Web profile。卸载：`dsh plugin --profile web remove dsh-failure-lens`，它会同步移除 bundle 条目。插件不产生任何持久状态。

隐私与安全：无遥测、无网络、无磁盘写入、无模型调用、无自动审批、无原始输出复制、无 DOM 补丁，全部通过官方 `conversationEvents.register` / `slots.inject` / `locale.register` 三个公开接口组合。
