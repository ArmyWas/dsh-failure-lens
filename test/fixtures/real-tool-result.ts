/**
 * Fixtures derived from the real exported session (`../harness-failure-lens-audit/session/session.jsonl`,
 * matching event `tool/result`, seq `24071`).
 *
 * The observed result text contains six repeated `Error: spawn EPERM` stacks and
 * ends with `[exit code: 1]`, and — crucially — the tool-result block carries
 * `isError: false`, so thrown-error observers never see this case.
 */
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import type { CallId } from '@deepseek-ai/dsh-llm'
import type { MessageId } from '@deepseek-ai/dsh-client-connection/client'

/** The six-frame stack body verbatim from the audit log (ANSI-free, LF). */
export const REAL_EPERM_OUTPUT: string = [
  '\n> dsh-plugin-reducer@0.1.0 test',
  '> node --test test/*.test.js',
  '',
  '✖ test\\args.test.js (4.8264ms)',
  '',
  '✖ failing tests:',
  '',
  'test at test\\args.test.js:1:1',
  '✖ test\\args.test.js (4.8264ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at spawn (node:child_process:796:9)',
  '      at TestContext.<anonymous> (node:internal/test_runner/runner:415:19)',
  '      at new Promise (<anonymous>) {',
  "    errno: -4048,",
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '',
  'test at test\\ddmin.test.js:1:1',
  '✖ test\\ddmin.test.js (3.7158ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at spawn (node:child_process:796:9)',
  '      at new Promise (<anonymous>) {',
  '    errno: -4048,',
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '',
  'test at test\\integration.test.js:1:1',
  '✖ test\\integration.test.js (2.8332ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at new Promise (<anonymous>) {',
  '    errno: -4048,',
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '',
  'test at test\\list-candidates.test.js:1:1',
  '✖ test\\list-candidates.test.js (2.402ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at new Promise (<anonymous>) {',
  '    errno: -4048,',
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '',
  'test at test\\profile-lab.test.js:1:1',
  '✖ test\\profile-lab.test.js (1.9869ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at new Promise (<anonymous>) {',
  '    errno: -4048,',
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '',
  'test at test\\redact.test.js:1:1',
  '✖ test\\redact.test.js (1.5217ms)',
  '  Error: spawn EPERM',
  '      at ChildProcess.spawn (node:internal/child_process:421:11)',
  '      at new Promise (<anonymous>) {',
  '    errno: -4048,',
  "    code: 'EPERM',",
  "    syscall: 'spawn'",
  '  }',
  '[exit code: 1]',
].join('\n')

/** A `tool/result` event matching the observed seq 24071 shape (isError: false). */
export const realToolResultEvent: SessionEvent<'tool/result'> = {
  type: 'tool/result',
  seq: 24071,
  time: 1787064508406,
  data: {
    turn: 1,
    step: 12,
    message: {
      source: { kind: 'tool', callId: 'call_00_cGXceFPAedz4gjuQAFoI4055' as CallId },
      role: 'user',
      id: '5021e21c-d87b-49bf-a919-87b58cf559df' as MessageId,
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call_00_cGXceFPAedz4gjuQAFoI4055' as CallId,
          content: [{ type: 'text', text: REAL_EPERM_OUTPUT }],
          isError: false,
        },
      ],
    },
  },
  surfaceOp: 'append',
  sourceEventSeqs: [24070],
}
