/**
 * Registry-hygiene sentinel for the client Runtime package removed upstream.
 *
 * The active plugin compatibility canary must never install this package. This
 * separate check stays intentionally red while npm still advertises an
 * undeclared `@next` version for a package that no longer exists in the current
 * Harness source graph.
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-runtime'

function npmView() {
  const args = ['view', PACKAGE_NAME, 'dist-tags', 'deprecated', 'version', '--json']
  const result = process.platform === 'win32'
    ? spawnSync(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', `npm ${args.join(' ')}`],
      { encoding: 'utf8' },
    )
    : spawnSync('npm', args, { encoding: 'utf8' })

  if (result.error) throw result.error
  assert.equal(result.status, 0, `npm view failed: ${result.stderr.trim()}`)
  return JSON.parse(result.stdout)
}

const metadata = npmView()
const tags = metadata['dist-tags'] ?? {}
const next = typeof tags.next === 'string' ? tags.next : undefined
const deprecated = typeof metadata.deprecated === 'string' && metadata.deprecated.trim() !== ''
  ? metadata.deprecated.trim()
  : undefined

const state = next === undefined
  ? 'clean: the removed package no longer has an npm `next` tag'
  : deprecated !== undefined
    ? 'clean: the removed package is explicitly deprecated'
    : 'actionable: npm still advertises an undeclared `next` version for the removed package'

const report = [
  '## Removed Runtime registry sentinel',
  '',
  `- Package: \`${PACKAGE_NAME}\``,
  `- npm \`latest\`: \`${tags.latest ?? 'absent'}\``,
  `- npm \`next\`: \`${next ?? 'absent'}\``,
  `- Deprecation message: ${deprecated === undefined ? '_absent_' : `\`${deprecated}\``}`,
  `- State: **${state}**`,
  '',
  'This registry-hygiene signal is deliberately independent from the Failure Lens compatibility build. The current plugin graph does not depend on this removed package.',
  '',
]

process.stdout.write(report.join('\n'))

if (next !== undefined && deprecated === undefined) {
  process.exitCode = 1
}
