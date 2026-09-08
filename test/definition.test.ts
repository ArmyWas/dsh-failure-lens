/**
 * Conversation Definition tests: stable identity, location, and replay.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ConversationNodeContext } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { failureLensDefinition } from '../src/client/definition'
import { realToolResultEvent } from './fixtures/real-tool-result'

/** Minimal synthetic start match with an unresolved location. */
function matchFor(event: unknown) {
  const m = failureLensDefinition.match(event as never)
  assert.ok(m)
  return { event, role: m.role as 'start' | 'update', location: { kind: 'unresolved' as const } }
}

function emptyContext(id: string): ConversationNodeContext {
  return {
    key: `failure-lens:${id}`,
    kind: 'failure-lens',
    id,
    matches: [],
    start: undefined,
    state: undefined,
    current: new Map(),
  }
}

describe('failureLensDefinition — identity and match', () => {
  it('declares a stable kind and chat target', () => {
    assert.equal(failureLensDefinition.kind, 'failure-lens')
    assert.equal(failureLensDefinition.target, 'chat')
  })

  it('uses the event seq as the Definition-local id and start role', () => {
    const m = failureLensDefinition.match(realToolResultEvent as never)
    assert.deepEqual(m, { id: '24071', role: 'start' })
  })

  it('does not match unrelated event types', () => {
    assert.equal(failureLensDefinition.match({ type: 'user/message', seq: 1, time: 0, data: {} } as never), null)
    assert.equal(failureLensDefinition.match({ type: 'assistant/message', seq: 2, time: 0, data: {} } as never), null)
  })

  it('does not match a tool/result lacking the signature', () => {
    const unrelated = {
      type: 'tool/result',
      seq: 9,
      time: 0,
      data: { turn: 0, step: 0, message: { content: [{ type: 'text', text: 'ok' }] } },
    } as never
    assert.equal(failureLensDefinition.match(unrelated), null)
  })
})

describe('failureLensDefinition — start state and view node', () => {
  it('start folds the diagnosis into State', () => {
    const match = matchFor(realToolResultEvent)
    const ctx = emptyContext('24071')
    const state = failureLensDefinition.start(ctx as never, match as never, { previous: () => undefined } as never)
    assert.deepEqual(state, {
      kind: 'windows-spawn-eperm',
      errno: '-4048',
      stackCount: 6,
      failureEvidence: 'non-zero-exit',
      exitCode: 1,
    })
  })

  it('update is a stable identity (returns current state)', () => {
    const state = {
      kind: 'windows-spawn-eperm',
      errno: '-4048',
      stackCount: 6,
      failureEvidence: 'non-zero-exit',
      exitCode: 1,
    } as const
    const ctx = { ...emptyContext('24071'), state }
    const next = failureLensDefinition.update(ctx as never, matchFor(realToolResultEvent) as never)
    assert.equal(next, state)
  })

  it('buildViewNode materializes a chat node anchored on the start seq', () => {
    const match = matchFor(realToolResultEvent)
    const ctx = emptyContext('24071')
    const state = failureLensDefinition.start(ctx as never, match as never, { previous: () => undefined } as never)
    const viewCtx = { ...ctx, start: match, state } as never
    const node = failureLensDefinition.buildViewNode?.(viewCtx) as {
      kind: string
      target: string
      id: string
      anchorSeq: number
      visibility: string
      data: unknown
    } | null
    assert.ok(node)
    assert.equal(node.kind, 'failure-lens')
    assert.equal(node.target, 'chat')
    assert.equal(node.id, '24071')
    assert.equal(node.anchorSeq, 24071)
    assert.equal(node.visibility, 'visible')
    assert.deepEqual(node.data, state)
  })

  it('buildViewNode returns null without state (replay resume)', () => {
    const node = failureLensDefinition.buildViewNode?.(emptyContext('24071') as never)
    assert.equal(node ?? null, null)
  })
})

describe('failureLensDefinition — replay determinism (complete then append)', () => {
  it('produces identical State when the same event is started twice', () => {
    const match = matchFor(realToolResultEvent)
    const ctx = emptyContext('24071')
    const a = failureLensDefinition.start(ctx as never, match as never, { previous: () => undefined } as never)
    const b = failureLensDefinition.start(ctx as never, match as never, { previous: () => undefined } as never)
    assert.deepEqual(a, b)
  })
})
