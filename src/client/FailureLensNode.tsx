/**
 * Keyed Chat renderer for the `failure-lens` Conversation Node.
 *
 * Presentation-only: everything arrives through the four props shares. The
 * component reads only `node.data` and the framework-injected `t` seat plus the
 * session-standard `useSessions` (required by the keyed slot scope). It never
 * scans the Session window, never reads other Contexts, and never duplicates the
 * raw tool output — the built-in tool card above it keeps the evidence.
 */

import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './FailureLensNode.module.css'

/** Complete keyed Chat renderer props (runtime share + locale seat). */
export type FailureLensNodeProps =
  PropsRuntime<'conversation.chat.node', 'failure-lens'>
  & PropsLocale<'failureLens'>

/** Render one compact bilingual warning row with no raw-output duplication. */
export function FailureLensNode({ node, t }: FailureLensNodeProps) {
  const data = node.data
  if (data.kind !== 'windows-spawn-eperm') return null
  const title = t('title')
  const meaning = t('meaning')
  const action = t('action')
  const signature = t('signature')
  return (
    <section
      className={css.root}
      data-failure-lens
      data-failure-lens-kind="windows-spawn-eperm"
      role="note"
      aria-label={title}
    >
      <span className={css.dotSlot}>
        <StateDot state="warning" />
      </span>
      <div className={css.body}>
        <div className={css.head}>
          <h4 className={css.title}>{title}</h4>
          <span className={css.signature} data-signature>{signature}</span>
        </div>
        <p className={css.meaning}>{meaning}</p>
        <p className={css.action}>{action}</p>
      </div>
    </section>
  )
}
