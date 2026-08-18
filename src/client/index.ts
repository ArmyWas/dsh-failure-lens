/**
 * Browser plugin body for the dsh-failure-lens client entry.
 *
 * Registers the single-event Conversation Definition, its keyed renderer, and
 * the bilingual dictionary through the three official paths:
 *   1. `ctx.conversationEvents.register(...)`
 *   2. `ctx.slots.inject('conversation.chat.node', ...)`
 *   3. `ctx.locale.register(...)`
 *
 * The node half (`./node.ts`) is the minimal empty cordis entry; this module is
 * the browser half bundled into `lib/client.js`.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { failureLensDefinition } from './definition'
import { FailureLensNode } from './FailureLensNode'
import { en, NS, type FailureLensKey, zh } from './locales'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Durable failure-lens node copy. */
    failureLens: FailureLensKey
  }
}

/** Required services for Definition, keyed renderer, and bilingual copy. */
export const inject = ['conversationEvents', 'slots', 'locale']

/** Register the Definition, dictionary, and keyed Chat renderer. */
export function apply(ctx: ClientContext): void {
  ctx.conversationEvents.register(failureLensDefinition)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-failure-lens: dictionaries')
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'failure-lens',
    locale: NS,
  }, FailureLensNode))
}
