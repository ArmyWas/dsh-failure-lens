/** Static guard for the public package's current Harness client contract. */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const expectedClientPackages = [
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-chat',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-renderer',
]

assert.deepEqual(
  manifest.dsh?.client?.inject,
  expectedClientPackages,
  'dsh.client.inject must declare the current public client package graph',
)
assert.equal(manifest.dsh?.client?.platform, 'web', 'the client platform must remain web')
assert.equal(
  '@deepseek-ai/dsh-client-runtime' in (manifest.devDependencies ?? {}),
  false,
  'the removed Runtime package must not return to devDependencies',
)
assert.equal(
  manifest.files?.includes('docs/RELEASE_NOTES_v0.3.0.md'),
  true,
  'the v0.3.0 release notes must ship in the public package',
)

process.stdout.write('package contract: current Harness client graph verified\n')
