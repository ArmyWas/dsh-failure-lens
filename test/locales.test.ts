/**
 * Locale completeness: the zh dictionary is the key-set source of truth and the
 * en dictionary must carry exactly the same keys (the official registration
 * enforces this at compile time as well).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { en, NS, zh } from '../src/client/locales'

describe('failureLens locales', () => {
  it('uses the documented namespace', () => {
    assert.equal(NS, 'failureLens')
  })

  it('zh and en carry the same key set', () => {
    assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
  })

  it('ships the four documented keys', () => {
    assert.deepEqual(Object.keys(zh).sort(), ['action', 'meaning', 'signature', 'title'])
  })

  it('keeps the required copy verbatim', () => {
    assert.equal(zh.title, 'Harness 沙箱限制')
    assert.equal(zh.signature, 'EPERM · spawn')
    assert.equal(en.title, 'Harness sandbox limitation')
    assert.equal(en.signature, 'EPERM · spawn')
  })
})
