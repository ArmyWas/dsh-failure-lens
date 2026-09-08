/**
 * Registry-hygiene sentinel for the client Runtime package removed upstream.
 *
 * The active plugin compatibility canary must never install this package. This
 * separate check reports the npm metadata as structured state. A known,
 * unchanged upstream gap is a successful observation; query, parse, and
 * notification failures remain real CI failures.
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-runtime'

function optionalString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/** Convert npm metadata into the stable state consumed by the workflow. */
export function classifyRegistryMetadata(metadata) {
  assert(metadata !== null && typeof metadata === 'object', 'npm metadata must be an object')

  const rawTags = metadata['dist-tags']
  const tags = rawTags !== null && typeof rawTags === 'object' ? rawTags : {}
  const latest = optionalString(tags.latest)
  const next = optionalString(tags.next)
  const version = optionalString(metadata.version)
  const deprecated = optionalString(metadata.deprecated)

  const status = next === undefined || deprecated !== undefined ? 'resolved' : 'unresolved'
  const reason = next === undefined
    ? 'next-tag-removed'
    : deprecated !== undefined
      ? 'package-deprecated'
      : 'orphan-still-advertised'

  const fingerprintInput = {
    version: version ?? null,
    latest: latest ?? null,
    next: next ?? null,
    deprecated: deprecated ?? null,
  }
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(fingerprintInput))
    .digest('hex')

  return {
    package: PACKAGE_NAME,
    status,
    reason,
    version,
    latest,
    next,
    deprecated,
    fingerprint,
  }
}

/** Human-readable Actions summary for one registry observation. */
export function formatRegistryReport(state) {
  const stateLine = state.status === 'resolved'
    ? 'resolved: the removed artifact is no longer silently advertised as active'
    : 'known warning: npm still advertises an undeclared `next` version for the removed package'

  return [
    '## Removed Runtime registry sentinel',
    '',
    `- Package: \`${state.package}\``,
    `- npm default version: \`${state.version ?? 'absent'}\``,
    `- npm \`latest\`: \`${state.latest ?? 'absent'}\``,
    `- npm \`next\`: \`${state.next ?? 'absent'}\``,
    `- Deprecation message: ${state.deprecated === undefined ? '_absent_' : `\`${state.deprecated}\``}`,
    `- Metadata fingerprint: \`${state.fingerprint}\``,
    `- State: **${stateLine}**`,
    '',
    'This registry-hygiene signal is independent from the Failure Lens compatibility build. The current plugin graph does not depend on this removed package.',
    '',
    'An unchanged known warning keeps this workflow green. The tracking issue is created, updated, or closed only when the metadata fingerprint or resolution state changes.',
    '',
  ].join('\n')
}

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

function parseArguments(args) {
  if (args.length === 1 && args[0] === '--self-test') return { selfTest: true }
  if (args.length === 0) return {}
  if (args.length === 2 && args[0] === '--json') return { jsonPath: args[1] }
  throw new Error('usage: check-removed-runtime-tag.mjs [--json <path> | --self-test]')
}

function runSelfTest() {
  const unresolved = classifyRegistryMetadata({
    'dist-tags': { latest: '0.0.1-rc.1', next: '0.1.1-rc.2' },
    version: '0.0.1-rc.1',
  })
  assert.equal(unresolved.status, 'unresolved')
  assert.equal(unresolved.reason, 'orphan-still-advertised')
  assert.equal(unresolved.fingerprint.length, 64)
  assert.equal(
    unresolved.fingerprint,
    classifyRegistryMetadata({
      'dist-tags': { latest: '0.0.1-rc.1', next: '0.1.1-rc.2' },
      version: '0.0.1-rc.1',
    }).fingerprint,
  )

  const tagRemoved = classifyRegistryMetadata({
    'dist-tags': { latest: '0.0.1-rc.1' },
    version: '0.0.1-rc.1',
  })
  assert.equal(tagRemoved.status, 'resolved')
  assert.equal(tagRemoved.reason, 'next-tag-removed')

  const deprecated = classifyRegistryMetadata({
    'dist-tags': { latest: '0.0.1-rc.1', next: '0.1.1-rc.2' },
    deprecated: 'Runtime was folded into its consumers.',
  })
  assert.equal(deprecated.status, 'resolved')
  assert.equal(deprecated.reason, 'package-deprecated')

  const whitespaceIsAbsent = classifyRegistryMetadata({
    'dist-tags': { next: '0.1.1-rc.2' },
    deprecated: '   ',
  })
  assert.equal(whitespaceIsAbsent.status, 'unresolved')
  assert.notEqual(whitespaceIsAbsent.fingerprint, unresolved.fingerprint)

  process.stdout.write('registry sentinel contract: ok\n')
}

export function main(args = process.argv.slice(2)) {
  const options = parseArguments(args)
  if (options.selfTest) {
    runSelfTest()
    return
  }

  const state = classifyRegistryMetadata(npmView())
  process.stdout.write(formatRegistryReport(state))
  if (options.jsonPath !== undefined) {
    writeFileSync(options.jsonPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  }
}

const entrypoint = process.argv[1] === undefined
  ? undefined
  : pathToFileURL(resolve(process.argv[1])).href
if (entrypoint === import.meta.url) main()
