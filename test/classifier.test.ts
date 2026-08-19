/**
 * Classifier unit tests: the positive real-log-derived input plus negative
 * lookalikes (generic EPERM, different syscall, user-authored text, missing
 * structural fields, and quoting/encoding robustness).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifySpawnEperm } from '../src/classifier'
import { realToolResultEvent } from './fixtures/real-tool-result'

/** Wrap a body in a minimal tool/result-shaped event (unknown extra fields allowed). */
function eventWith(
  text: string,
  overrides: Record<string, unknown> = {},
  isError: boolean | null = true,
): unknown {
  return {
    type: 'tool/result',
    seq: 1,
    time: 0,
    data: {
      turn: 0,
      step: 0,
      message: {
        content: [{
          type: 'tool-result',
          toolCallId: 'call_test',
          content: [{ type: 'text', text }],
          ...(isError === null ? {} : { isError }),
        }],
      },
    },
    ...overrides,
  }
}

const SIG1 = "Error: spawn EPERM\n    at ChildProcess.spawn (node:internal/child_process:421:11)\n    at spawn (node:child_process:796:9)\n    errno: -4048,\n    code: 'EPERM',\n    syscall: 'spawn'\n"
const SIG2 = 'Error: spawn EPERM\n    at X (node:internal/child_process:1:1)\n    code: "EPERM"\n    syscall: "spawn"\n'

describe('classifySpawnEperm — positive real-log-derived input', () => {
  it('matches the observed tool/result event seq 24071', () => {
    const result = classifySpawnEperm(realToolResultEvent)
    assert.ok(result)
    assert.equal(result.kind, 'windows-spawn-eperm')
    assert.equal(result.errno, '-4048')
    assert.equal(result.stackCount, 6)
    assert.equal(result.failureEvidence, 'non-zero-exit')
    assert.equal(result.exitCode, 1)
  })

  it('counts repeated stacks even without an errno', () => {
    const body = SIG1 + SIG2 + '[exit code: 1]'
    const result = classifySpawnEperm(eventWith(body))
    assert.ok(result)
    assert.equal(result.stackCount, 2)
  })

  it('accepts an explicit tool error without an exit marker', () => {
    const result = classifySpawnEperm(eventWith(SIG1))
    assert.ok(result)
    assert.equal(result.failureEvidence, 'tool-error')
    assert.equal(result.exitCode, undefined)
  })

  it('accepts a non-zero exit when isError is false or absent', () => {
    for (const isError of [false, null]) {
      const result = classifySpawnEperm(eventWith(`${SIG1}[exit code: 7]`, {}, isError))
      assert.ok(result)
      assert.equal(result.failureEvidence, 'non-zero-exit')
      assert.equal(result.exitCode, 7)
    }
  })
})

describe('classifySpawnEperm — encoding robustness', () => {
  it('normalizes CRLF and lone CR line endings', () => {
    const lf = classifySpawnEperm(eventWith(SIG1))
    const crlf = classifySpawnEperm(eventWith(SIG1.replace(/\n/g, '\r\n')))
    const cr = classifySpawnEperm(eventWith(SIG1.replace(/\n/g, '\r')))
    assert.ok(lf && crlf && cr)
    assert.equal(lf.stackCount, crlf.stackCount)
    assert.equal(lf.stackCount, cr.stackCount)
  })

  it('strips ANSI color escapes before matching', () => {
    const ansi = '\u001b[31mError: spawn EPERM\u001b[0m\n' + SIG1.slice('Error: spawn EPERM'.length)
    const result = classifySpawnEperm(eventWith(ansi))
    assert.ok(result)
    assert.equal(result.stackCount, 1)
  })

  it('accepts either quote style for code and syscall', () => {
    const single = classifySpawnEperm(eventWith(SIG1))
    const double = classifySpawnEperm(eventWith(SIG2))
    const mixedCodeDouble = classifySpawnEperm(eventWith(SIG1.replace("code: 'EPERM'", 'code: "EPERM"').replace("syscall: 'spawn'", "syscall: 'spawn'")))
    assert.ok(single && double && mixedCodeDouble)
  })
})

describe('classifySpawnEperm — negative lookalikes', () => {
  it('rejects a complete historical stack without durable failure evidence', () => {
    assert.equal(classifySpawnEperm(eventWith(SIG1, {}, false)), null)
    assert.equal(classifySpawnEperm(eventWith(SIG1, {}, null)), null)
    assert.equal(classifySpawnEperm(eventWith(`${SIG1}[exit code: 0]`, {}, false)), null)
  })

  it('does not stitch signature or failure evidence across tool-result blocks', () => {
    const split = {
      type: 'tool/result',
      data: {
        message: {
          content: [
            {
              type: 'tool-result',
              isError: false,
              content: [{ type: 'text', text: "Error: spawn EPERM\ncode: 'EPERM'" }],
            },
            {
              type: 'tool-result',
              isError: true,
              content: [{ type: 'text', text: "syscall: 'spawn'\nnode:internal/child_process\n[exit code: 1]" }],
            },
          ],
        },
      },
    }
    assert.equal(classifySpawnEperm(split), null)
  })

  it('does not borrow an error flag from another tool-result block', () => {
    const mismatched = {
      type: 'tool/result',
      data: {
        message: {
          content: [
            {
              type: 'tool-result',
              isError: false,
              content: [{ type: 'text', text: SIG1 }],
            },
            {
              type: 'tool-result',
              isError: true,
              content: [{ type: 'text', text: 'unrelated failure' }],
            },
          ],
        },
      },
    }
    assert.equal(classifySpawnEperm(mismatched), null)
  })

  it('rejects generic EPERM without a spawn line', () => {
    const body = "errno: -4048,\ncode: 'EPERM',\nsyscall: 'spawn'\nnode:internal/child_process:1:1\n"
    assert.equal(classifySpawnEperm(eventWith(body)), null)
  })

  it('rejects a different syscall', () => {
    const body = "Error: spawn EPERM\ncode: 'EPERM'\nsyscall: 'open'\nnode:internal/child_process:1:1\n"
    assert.equal(classifySpawnEperm(eventWith(body)), null)
  })

  it('rejects a different code', () => {
    const body = "Error: spawn EPERM\ncode: 'EACCES'\nsyscall: 'spawn'\nnode:internal/child_process:1:1\n"
    assert.equal(classifySpawnEperm(eventWith(body)), null)
  })

  it('rejects a missing child_process stack marker', () => {
    const body = "Error: spawn EPERM\ncode: 'EPERM'\nsyscall: 'spawn'\nat someFn (/app/x.js:1:1)\n"
    assert.equal(classifySpawnEperm(eventWith(body)), null)
  })

  it('rejects a user-authored assistant message mentioning the phrase', () => {
    const body = 'The test failed because of "Error: spawn EPERM" — please fix it.'
    assert.equal(classifySpawnEperm(eventWith(body, { type: 'assistant/message' })), null)
  })

  it('rejects a successful text merely mentioning the phrase without structure', () => {
    const body = 'All good: we handled an Error: spawn EPERM earlier with code EPERM syscall spawn.'
    assert.equal(classifySpawnEperm(eventWith(body)), null)
  })

  it('rejects missing structural fields (no message.content)', () => {
    assert.equal(classifySpawnEperm({ type: 'tool/result', data: {} }), null)
    assert.equal(classifySpawnEperm({ type: 'tool/result', data: { message: {} } }), null)
    assert.equal(classifySpawnEperm({
      type: 'tool/result',
      data: { message: { content: [{ type: 'text', text: SIG1 }] } },
    }), null)
    assert.equal(classifySpawnEperm({ type: 'tool/result' }), null)
  })

  it('rejects non-object and wrong-type events', () => {
    assert.equal(classifySpawnEperm(null), null)
    assert.equal(classifySpawnEperm(undefined), null)
    assert.equal(classifySpawnEperm('Error: spawn EPERM'), null)
    assert.equal(classifySpawnEperm({ type: 'assistant/message', data: {} }), null)
    assert.equal(classifySpawnEperm({ type: 'tool/call', data: {} }), null)
  })
})
