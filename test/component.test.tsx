/**
 * Component tests: bilingual copy, semantics, and no raw-output duplication.
 *
 * The FailureLensNode is rendered with realistic keyed-node props (the runtime +
 * locale shares it actually reads) and asserted on user-visible text only. Uses
 * react-dom/server so no browser is required at test time.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { FailureLensNode, type FailureLensNodeProps } from '../src/client/FailureLensNode'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { en, zh } from '../src/client/locales'

type TestProps = Pick<FailureLensNodeProps, 'node'> & Pick<PropsLocale<'failureLens'>, 't'>

function tOf(dict: Record<string, string>) {
  return (key: string, params: Record<string, unknown> = {}) =>
    (dict[key] ?? key).replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? `{${name}}`))
}

function renderNode(
  lang: 'zh' | 'en',
  failureEvidence: 'non-zero-exit' | 'tool-error' = 'non-zero-exit',
  exitCode: number | null = 1,
) {
  const node = {
    key: 'failure-lens:24071',
    kind: 'failure-lens' as const,
    id: '24071',
    target: 'chat' as const,
    anchorSeq: 24071,
    location: { kind: 'unresolved' as const },
    visibility: 'visible' as const,
    data: {
      kind: 'windows-spawn-eperm' as const,
      errno: '-4048',
      stackCount: 6,
      failureEvidence,
      exitCode: exitCode ?? undefined,
    },
  }
  const t = tOf(lang === 'zh' ? zh : en)
  return renderToString(createElement(FailureLensNode as never, { node, t } as TestProps))
}

describe('FailureLensNode — bilingual copy', () => {
  it('renders the Chinese title, meaning, action, and signature', () => {
    const html = renderNode('zh')
    assert.match(html, /Harness 沙箱限制/)
    assert.match(html, /测试未启动/)
    assert.match(html, /沙箱外权限/)
    assert.match(html, /EPERM · spawn · 退出码 1/)
    assert.match(html, /同一工具结果中有 6 个启动失败堆栈/)
    assert.match(html, /errno 为 -4048/)
  })

  it('renders the English title, meaning, action, and signature', () => {
    const html = renderNode('en')
    assert.match(html, /Harness sandbox limitation/)
    assert.match(html, /test never started/)
    assert.match(html, /outside the sandbox/)
    assert.match(html, /EPERM · spawn · exit 1/)
    assert.match(html, /6 spawn-failure stacks in the same tool result/)
    assert.match(html, /errno -4048/)
  })

  it('exposes the title as an accessible label', () => {
    const html = renderNode('en')
    assert.match(html, /aria-label="Harness sandbox limitation"/)
  })

  it('renders explicit tool-error evidence when no exit marker exists', () => {
    const html = renderNode('en', 'tool-error', null)
    assert.match(html, /EPERM · spawn/)
    assert.doesNotMatch(html, /EPERM · spawn · exit/)
    assert.match(html, /marked as a tool error/)
  })
})

describe('FailureLensNode — semantics', () => {
  it('does not render raw tool output (no stack frames, no exit-code marker)', () => {
    for (const lang of ['zh', 'en'] as const) {
      const html = renderNode(lang)
      assert.doesNotMatch(html, /node:internal\/child_process/)
      assert.doesNotMatch(html, /Error: spawn EPERM/)
      assert.doesNotMatch(html, /\[exit code: 1\]/)
    }
  })

  it('marks itself with a stable signature attribute', () => {
    const html = renderNode('en')
    assert.match(html, /data-failure-lens-kind="windows-spawn-eperm"/)
  })

  it('declines (renders nothing) for a non-signature kind', () => {
    const node = {
      key: 'failure-lens:x',
      kind: 'failure-lens',
      id: 'x',
      target: 'chat',
      anchorSeq: 0,
      location: { kind: 'unresolved' },
      visibility: 'visible',
      data: {
        kind: 'other',
        errno: undefined,
        stackCount: 0,
        failureEvidence: 'tool-error',
        exitCode: undefined,
      },
    }
    const html = renderToString(createElement(FailureLensNode as never, { node, t: tOf(en) } as never))
    assert.equal(html, '')
  })
})
