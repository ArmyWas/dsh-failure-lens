/**
 * Durable single-event Conversation Node definition for the Windows sandbox
 * `spawn EPERM` signature, following the official Conversation Node cookbook.
 *
 * A single-event business uses the event's stable identity (`event.seq`) as its
 * Definition-local id, exactly as the cookbook prescribes. `match` reads only
 * the current event; the classifier is the pure signature gate and the start
 * function records the diagnosis into State for the keyed renderer.
 */

import type {
  ChatConversationViewNode,
  ConversationLocation,
  ConversationNodeContext,
  ConversationNodeDefinition,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import { classifySpawnEperm, type EpermDiagnosis } from '../classifier'

/** Final keyed Chat payload for one diagnosed sandbox limitation. */
export interface FailureLensChatData {
  /** Stable signature kind; the renderer keys its copy on this value only. */
  readonly kind: 'windows-spawn-eperm'
  /** The `errno` captured from the originating stack, if present. */
  readonly errno: string | undefined
  /** Number of distinct `Error: spawn EPERM` stacks in the tool result. */
  readonly stackCount: number
  /** Durable failure evidence from the matching tool-result block. */
  readonly failureEvidence: 'non-zero-exit' | 'tool-error'
  /** Parsed non-zero process exit code, when present. */
  readonly exitCode: number | undefined
}

declare module '@deepseek-ai/dsh-client-ui-conversation/client' {
  interface ChatNodeDataMap {
    'failure-lens': FailureLensChatData
  }
}

/** Definition-local State carried through the engine for one diagnosis. */
type FailureLensState = FailureLensChatData

/** Resolve a context's display location (the start match, else unresolved). */
function locationOf(context: ConversationNodeContext<FailureLensState>): ConversationLocation {
  return context.start?.location ?? context.matches[0]?.location ?? { kind: 'unresolved' }
}

/** Replace a text block only when the four-condition conjunction matches. */
function diagnosisOf(event: SessionEvent): EpermDiagnosis | null {
  return classifySpawnEperm(event)
}

/** Durable single-event Definition folded into one keyed Chat node. */
export const failureLensDefinition: ConversationNodeDefinition<FailureLensState> = {
  kind: 'failure-lens',
  target: 'chat',
  match: (event) => {
    if (event.type !== 'tool/result') return null
    if (diagnosisOf(event) === null) return null
    // A single-event business uses the event's stable identity as its id.
    return { id: String(event.seq), role: 'start' }
  },
  start: (_context, match) => {
    if (match.event.type !== 'tool/result') throw new Error('failure-lens requires tool/result')
    const diagnosis = diagnosisOf(match.event)
    if (diagnosis === null) throw new Error('failure-lens match did not satisfy the signature')
    return {
      kind: diagnosis.kind,
      errno: diagnosis.errno,
      stackCount: diagnosis.stackCount,
      failureEvidence: diagnosis.failureEvidence,
      exitCode: diagnosis.exitCode,
    }
  },
  update: (context) => context.state,
  buildViewNode: (context): ChatConversationViewNode | null => {
    if (context.state === undefined) return null
    return {
      key: context.key,
      kind: 'failure-lens',
      id: context.id,
      target: 'chat',
      anchorSeq: context.start?.event.seq ?? context.matches[0]?.event.seq ?? 0,
      location: locationOf(context),
      visibility: 'visible',
      data: context.state,
    }
  },
}
