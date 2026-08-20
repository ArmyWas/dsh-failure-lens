import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  initProfile,
  PROFILE_TEMPLATES,
} from '@deepseek-ai/dsh-app-boot'

const dshHome = process.env.DSH_HOME
assert.ok(dshHome, 'DSH_HOME is required')

const bundles = PROFILE_TEMPLATES.web
assert.ok(Array.isArray(bundles), 'app-boot next must expose the web profile template')

const profileDirectory = join(dshHome, 'profiles', 'web')
initProfile(profileDirectory, bundles)

const manifest = JSON.parse(await readFile(join(profileDirectory, 'package.json'), 'utf8'))
assert.deepEqual(
  manifest.dsh?.profile?.bundles,
  bundles,
  'initialized manifest must preserve the official ordered bundle template',
)

process.stdout.write(`${JSON.stringify({
  profile: 'web',
  bundleCount: bundles.length,
  manifest: join(profileDirectory, 'package.json'),
})}\n`)
