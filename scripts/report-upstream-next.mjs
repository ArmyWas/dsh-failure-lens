import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const packages = [
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-app-boot',
]

const selectedPackages = new Set(packages)
function readNextMetadata(packageName) {
  const npmArguments = [
    'view',
    `${packageName}@next`,
    'version',
    'peerDependencies',
    '--json',
  ]
  const result = process.platform === 'win32'
    ? spawnSync(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', `npm ${npmArguments.join(' ')}`],
      { encoding: 'utf8' },
    )
    : spawnSync('npm', npmArguments, { encoding: 'utf8' })

  if (result.error) throw result.error
  assert.equal(
    result.status,
    0,
    `npm view failed for ${packageName}@next: ${result.stderr.trim()}`,
  )

  const metadata = JSON.parse(result.stdout)
  assert.equal(typeof metadata.version, 'string', `${packageName}@next has no version`)

  const selectedPeerDependencies = Object.entries(metadata.peerDependencies ?? {})
    .filter(([name]) => selectedPackages.has(name))
    .sort(([left], [right]) => left.localeCompare(right))

  return {
    name: packageName,
    version: metadata.version,
    selectedPeerDependencies,
  }
}

function escapeCell(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>')
}

const rows = packages.map(readNextMetadata)
const markdown = [
  '## Resolved DeepSeek Harness `next` dependency train',
  '',
  '| Package | Resolved version | Constraints on packages in this canary |',
  '| --- | --- | --- |',
  ...rows.map(({ name, version, selectedPeerDependencies }) => {
    const constraints = selectedPeerDependencies.length === 0
      ? '—'
      : selectedPeerDependencies
        .map(([peerName, range]) => `\`${peerName}\` \`${range}\``)
        .join('<br>')

    return `| \`${escapeCell(name)}\` | \`${escapeCell(version)}\` | ${constraints} |`
  }),
  '',
  'The following npm install is the authoritative compatibility check. A resolver failure is an upstream `next`-train signal; the canary deliberately does not bypass it with `--force` or `--legacy-peer-deps`.',
  '',
]

process.stdout.write(markdown.join('\n'))
