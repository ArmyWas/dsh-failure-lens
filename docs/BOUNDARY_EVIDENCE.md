# Evidence boundary

`dsh-failure-lens` separates three kinds of evidence so the UI does not turn one observed log into a broader claim than it supports.

## 1. Observed Harness event

The privacy-trimmed fixture in [`test/fixtures/real-tool-result.ts`](../test/fixtures/real-tool-result.ts) comes from exported Harness event `tool/result` sequence `24071`. Its single `tool-result` block contains:

- six `Error: spawn EPERM` stacks;
- `code: 'EPERM'`, `syscall: 'spawn'`, and `node:internal/child_process`;
- `[exit code: 1]`; and
- `isError: false`.

The full session is not published because it can contain private conversation context. The fixture retains only fields used by the classifier.

`isError: false` explains why observers limited to thrown tool errors miss this event. It is not itself a positive matching condition. In this fixture, `[exit code: 1]` is the durable failure evidence.

## 2. Public Harness source contract

The upstream [Windows ACL sandbox documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/sandbox-windows-acl/README.md) describes the restricted-token named-pipe boundary: a confined Node grandchild using piped stdio can surface `spawn EPERM`, while inherited or ignored stdio works.

The upstream PowerShell tool documents two separate facts:

- its [tool contract](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/tool-pwsh/README.md) reports non-zero process exits as `[exit code: N]`; and
- its [renderer](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/tool-pwsh/src/render.ts) treats ordinary non-zero exits as model-interpreted results rather than thrown tool errors.

Those public contracts explain why the observed event can have a non-zero exit marker while `isError` remains false.

## 3. Classifier contract

The plugin emits a node only when one `tool-result` block contains all four exact stack markers and either:

- `isError: true`; or
- a parsed non-zero `[exit code: N]` marker.

It does not join text or flags across sibling blocks. A successful result that merely prints a complete historical stack does not match. Unit tests pin both rules.

## What the UI claims

The row distinguishes a known process-start boundary from a test assertion failure. It does not claim that every Node `spawn EPERM` in every environment is caused by Harness, and it never changes permissions or retries the command. The built-in result directly above the row remains the source of truth.
