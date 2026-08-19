/**
 * Pure deterministic classifier for the Windows-sandbox `spawn EPERM` signature.
 *
 * This module is deliberately free of Harness imports: it accepts an unknown
 * Session-like event and returns either `null` (no match) or a renderer-safe
 * diagnosis object. It is the single source of truth for the V0.2 signature and
 * is exercised directly by unit tests.
 *
 * The V0.2 signature requires the four-condition conjunction from the product brief:
 *   1. `Error: spawn EPERM`
 *   2. `code: 'EPERM'` or `code: "EPERM"`
 *   3. `syscall: 'spawn'` or `syscall: "spawn"`
 *   4. a Node child-process stack marker such as `node:internal/child_process`
 *
 * It also requires durable failure evidence from the same tool-result block:
 * either `isError: true` or a non-zero `[exit code: N]` marker. This prevents a
 * successful command that merely prints a complete historical stack from being
 * mislabeled. Whitespace, CRLF/LF line endings, ANSI color escapes, repeated
 * stacks, and either quote style are handled deterministically. Nothing here
 * calls a model, mutates a session log, approves anything, or copies raw output.
 */

/** Renderer-safe diagnosis produced for a positive match. */
export interface EpermDiagnosis {
  /** Machine-readable signature kind; stable across releases. */
  readonly kind: 'windows-spawn-eperm'
  /** The `errno` from the originating stack, or `undefined` when absent. */
  readonly errno: string | undefined
  /** Number of distinct `Error: spawn EPERM` stack occurrences in the text. */
  readonly stackCount: number
  /** Durable evidence proving that the containing tool result failed. */
  readonly failureEvidence: 'non-zero-exit' | 'tool-error'
  /** Parsed non-zero process exit code, when the result text carries one. */
  readonly exitCode: number | undefined
}

/**
 * Text extracted from an unknown event. `null` means the event cannot carry a
 * tool-result body at all (wrong type or missing structure).
 */
export interface ToolResultTextSource {
  readonly type: 'tool/result'
  /** Flat string body, or `null` when this event has no tool-result text. */
  readonly text: string | null
  /** Harness' tool-result flag; `undefined` when the producer omitted it. */
  readonly isError: boolean | undefined
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

/** Read the first non-zero Harness shell-exit marker from normalized text. */
function readNonZeroExitCode(flat: string): number | undefined {
  const matches = flat.matchAll(/\[exit code:\s*(-?\d+)\]/gi)
  for (const match of matches) {
    const exitCode = Number(match[1])
    if (Number.isSafeInteger(exitCode) && exitCode !== 0) return exitCode
  }
  return undefined
}

/**
 * Classify an unknown Session event against the V0.2 signature.
 *
 * @param event - unknown event carrying at least `type` and, for a tool result,
 *   a nested `text` string. Extra or unknown fields are ignored.
 * @returns the diagnosis for a positive match, otherwise `null`.
 */
export function classifySpawnEperm(event: unknown): EpermDiagnosis | null {
  const sources = toolResultTexts(event)
  if (sources === null) return null
  for (const source of sources) {
    if (source.text === null) continue
    const flat = normalize(source.text)
    if (!SPAWN_EPERM_LINE.test(flat)) continue
    if (!CODE_EPERM.test(flat)) continue
    if (!SYSCALL_SPAWN.test(flat)) continue
    if (!CHILD_PROCESS_MARKER.test(flat)) continue
    const exitCode = readNonZeroExitCode(flat)
    if (exitCode === undefined && source.isError !== true) continue
    return {
      kind: 'windows-spawn-eperm',
      errno: readErrno(flat),
      stackCount: countSpawnEperm(flat),
      failureEvidence: exitCode === undefined ? 'tool-error' : 'non-zero-exit',
      exitCode,
    }
  }
  return null
}

/**
 * Extract flat text from the nested `ToolResultBlock.content` carried by a
 * durable `tool/result` event. Harness stores one `tool-result` block at the
 * message level; its model-facing text blocks live one level deeper.
 */
function toolResultTexts(event: unknown): ToolResultTextSource[] | null {
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
  return messageContent.flatMap((part): ToolResultTextSource[] => {
    if (typeof part !== 'object' || part === null) return []
    const result = part as { type?: unknown; content?: unknown; isError?: unknown }
    if (result.type !== 'tool-result' || !Array.isArray(result.content)) return []
    const text = result.content
      .map((block): string | null => {
        if (typeof block !== 'object' || block === null) return null
        const content = block as { type?: unknown; text?: unknown }
        return content.type === 'text' && typeof content.text === 'string' ? content.text : null
      })
      .filter((value): value is string => value !== null)
      .join('\n')
    const isError = typeof result.isError === 'boolean' ? result.isError : undefined
    return [{ type: 'tool/result', text: text === '' ? null : text, isError }]
  })
}
