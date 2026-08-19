/** `failureLens` namespace dictionaries (Chinese is the key-set source of truth). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'failureLens'

/** Simplified Chinese dictionary. */
export const zh = {
  'title': 'Harness 沙箱限制',
  'meaning': '测试未启动；这不代表测试断言失败。',
  'action': '如需验证，请在用户批准后以沙箱外权限重试同一命令。',
  'signature': 'EPERM · spawn',
  'signatureExit': 'EPERM · spawn · 退出码 {exitCode}',
  'evidenceExit': '失败证据：同一工具结果中有 {stackCount} 个启动失败堆栈，非零退出码为 {exitCode}，errno 为 {errno}。',
  'evidenceToolError': '失败证据：同一工具结果中有 {stackCount} 个启动失败堆栈，并被工具标记为错误，errno 为 {errno}。',
} as const

/** English dictionary (same key set). */
export const en: Record<FailureLensKey, string> = {
  'title': 'Harness sandbox limitation',
  'meaning': 'The test never started; this does not mean a test assertion failed.',
  'action': 'To verify, retry the same command outside the sandbox after user approval.',
  'signature': 'EPERM · spawn',
  'signatureExit': 'EPERM · spawn · exit {exitCode}',
  'evidenceExit': 'Failure evidence: {stackCount} spawn-failure stacks in the same tool result, non-zero exit {exitCode}, errno {errno}.',
  'evidenceToolError': 'Failure evidence: {stackCount} spawn-failure stacks in the same tool result, marked as a tool error, errno {errno}.',
}

/** Union of this namespace's dictionary keys. */
export type FailureLensKey = keyof typeof zh
