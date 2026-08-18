/**
 * Pure deterministic classifier for the Windows-sandbox `spawn EPERM` signature.
 *
 * This module is deliberately free of Harness imports: it accepts an unknown
 * Session-like event and returns either `null` (no match) or a renderer-safe
 * diagnosis object. It is the single source of truth for the V0.1 signature and
 * is exercised directly by unit tests.
 *
 * The V0.1 signature is the four-condition conjunction from the product brief:
 *   1. `Error: spawn EPERM`
 *   2. `code: 'EPERM'` or `code: "EPERM"`
 *   3. `syscall: 'spawn'` or `syscall: "spawn"`
 *   4. a Node child-process stack marker such as `node:internal/child_process`
 *
 * Whitespace, CRLF/LF line endings, ANSI color escapes, repeated stacks, and
 * either quote style are handled deterministically. Nothing here calls a model,
 * mutates a session log, approves anything, or copies raw long output.
 */

/** Renderer-safe diagnosis produced for a positive match. */
export interface EpermDiagnosis {
  /** Machine-readable signature kind; stable across releases. */
  readonly kind: 'windows-spawn-eperm'
  /** The `errno` from the originating stack, or `undefined` when absent. */
  readonly errno: string | undefined
  /** Number of distinct `Error: spawn EPERM` stack occurrences in the text. */
  readonly stackCount: number
}

/**
 * Text extracted from an unknown event. `null` means the event cannot carry a
 * tool-result body at all (wrong type or missing structure).
 */
export interface ToolResultTextSource {
  readonly type: string
  /** Flat string body, or `null` when this event has no tool-result text. */
  text: string | null
}

/** ANSI color / control-sequence escape, covering CSI and OSC forms. */
const ANSI_ESCAPE = /\u001b\[[0-9;?]*[A-Za-z]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g

/** A `code:` field with either single or double quotes around `EPERM`. */
const CODE_EPERM = /code:\s*['"]EPERM['"]/

/** A `syscall:` field with either single or double quotes around `spawn`. */
const SYSCALL_SPAWN = /syscall:\s*['"]spawn['"]/

/** The Node child-process stack frame emitted by `spawn`. */
const CHILD_PROCESS_MARKER = /node:internal\/child_process/

/** The exact first line of the Node child-process error. */
const SPAWN_EPERM_LINE = /Error: spawn EPERM/

/** Strips ANSI escapes and normalizes all line endings to `\n`. */
function normalize(text: string): string {
  return text.replace(ANSI_ESCAPE, '').replace(/\r\n?/g, '\n')
}

/**
 * Count occurrences of the `Error: spawn EPERM` line in normalized text.
 * Repeated stacks (the observed event carries six) are counted individually.
 */
function countSpawnEperm(flat: string): number {
  let count = 0
  let index = flat.indexOf('Error: spawn EPERM')
  let cursor = 0
  while (index !== -1) {
    count += 1
    cursor = index + 1
    index = flat.indexOf('Error: spawn EPERM', cursor)
  }
  return count
}

/** Read the first `errno` value from the normalized text, if present. */
function readErrno(flat: string): string | undefined {
  const match = /errno:\s*(-?\d+|'[^']*'|"[^"]*")/.exec(flat)
  if (match === null) return undefined
  const raw = match[1]
  return raw[0] === "'" || raw[0] === '"' ? raw.slice(1, -1) : raw
}

/**
 * Classify an unknown Session event against the V0.1 signature.
 *
 * @param event - unknown event carrying at least `type` and, for a tool result,
 *   a nested `text` string. Extra or unknown fields are ignored.
 * @returns the diagnosis for a positive match, otherwise `null`.
 */
export function classifySpawnEperm(event: unknown): EpermDiagnosis | null {
  const source = toolResultText(event)
  if (source === null || source.text === null) return null
  const flat = normalize(source.text)
  if (!SPAWN_EPERM_LINE.test(flat)) return null
  if (!CODE_EPERM.test(flat)) return null
  if (!SYSCALL_SPAWN.test(flat)) return null
  if (!CHILD_PROCESS_MARKER.test(flat)) return null
  return {
    kind: 'windows-spawn-eperm',
    errno: readErrno(flat),
    stackCount: countSpawnEperm(flat),
  }
}

/**
 * Extract flat text from the nested `ToolResultBlock.content` carried by a
 * durable `tool/result` event. Harness stores one `tool-result` block at the
 * message level; its model-facing text blocks live one level deeper.
 */
function toolResultText(event: unknown): ToolResultTextSource | null {
  if (typeof event !== 'object' || event === null) return null
  const candidate = event as { type?: unknown; data?: unknown }
  if (candidate.type !== 'tool/result' || candidate.data === null || typeof candidate.data !== 'object') {
    return null
  }
  const data = candidate.data as { message?: unknown }
  const message = data.message
  if (typeof message !== 'object' || message === null) return null
  const messageContent = (message as { content?: unknown }).content
  if (!Array.isArray(messageContent)) return null
  const text = messageContent
    .flatMap((part): unknown[] => {
      if (typeof part !== 'object' || part === null) return []
      const result = part as { type?: unknown; content?: unknown }
      if (result.type !== 'tool-result' || !Array.isArray(result.content)) return []
      return result.content
    })
    .map((part): string | null => {
      if (typeof part !== 'object' || part === null) return null
      const block = part as { type?: unknown; text?: unknown }
      return block.type === 'text' && typeof block.text === 'string' ? block.text : null
    })
    .filter((value): value is string => value !== null)
    .join('\n')
  return { type: candidate.type, text }
}
