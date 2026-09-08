/** Client entry tests for the post-Runtime Harness service graph. */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { apply, inject } from '../src/client/index'
import { failureLensDefinition } from '../src/client/definition'
import { FailureLensNode } from '../src/client/FailureLensNode'

describe('client plugin contract', () => {
  it('injects the current conversation service instead of the removed Runtime service', () => {
    assert.deepEqual(inject, ['uiConversation', 'slots', 'locale'])
    assert.equal(inject.includes('conversationEvents'), false)
  })

  it('registers the definition, renderer, and dictionaries through public services', () => {
    const calls: Array<{ readonly kind: string; readonly value: unknown }> = []
    const ctx = {
      uiConversation: {
        events: {
          register(definition: unknown) {
            calls.push({ kind: 'definition', value: definition })
            return () => undefined
          },
        },
      },
      effect(callback: () => unknown, label: string) {
        calls.push({ kind: 'effect', value: label })
        return callback()
      },
      locale: {
        register(namespace: string, dictionaries: unknown) {
          calls.push({ kind: 'locale', value: { namespace, dictionaries } })
          return () => undefined
        },
      },
      slots: {
        inject(name: string, callback: () => unknown) {
          calls.push({ kind: 'slot-inject', value: name })
          return callback()
        },
        register(registration: unknown, component: unknown) {
          calls.push({ kind: 'slot-register', value: { registration, component } })
          return () => undefined
        },
      },
    }

    apply(ctx as never)

    assert.equal(calls[0]?.kind, 'definition')
    assert.equal(calls[0]?.value, failureLensDefinition)
    assert.deepEqual(calls.find(({ kind }) => kind === 'effect')?.value, 'dsh-failure-lens: dictionaries')
    assert.deepEqual(calls.find(({ kind }) => kind === 'slot-inject')?.value, 'conversation.chat.node')
    const renderer = calls.find(({ kind }) => kind === 'slot-register')?.value as {
      registration: { name: string; key: string; locale: string }
      component: unknown
    }
    assert.deepEqual(renderer.registration, {
      name: 'conversation.chat.node',
      key: 'failure-lens',
      locale: 'failureLens',
    })
    assert.equal(renderer.component, FailureLensNode)
  })
})
