/** `failureLens` namespace dictionaries (Chinese is the key-set source of truth). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'failureLens'

/** Simplified Chinese dictionary. */
export const zh = {
  'title': 'Harness 沙箱限制',
  'meaning': '测试未启动；这不代表测试断言失败。',
  'action': '如需验证，请在用户批准后以沙箱外权限重试同一命令。',
  'signature': 'EPERM · spawn',
} as const

/** English dictionary (same key set). */
export const en: Record<FailureLensKey, string> = {
  'title': 'Harness sandbox limitation',
  'meaning': 'The test never started; this does not mean a test assertion failed.',
  'action': 'To verify, retry the same command outside the sandbox after user approval.',
  'signature': 'EPERM · spawn',
}

/** Union of this namespace's dictionary keys. */
export type FailureLensKey = keyof typeof zh
