import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  initProfile,
  PROFILE_TEMPLATES,
} from '@deepseek-ai/dsh-app-boot'

const dshHome = process.env.DSH_HOME
assert.ok(dshHome, 'DSH_HOME is required')

const template = PROFILE_TEMPLATES.web
const usesLegacyTemplate = Array.isArray(template)
const bundles = usesLegacyTemplate ? template : template?.bundles
const patchReload = usesLegacyTemplate ? undefined : template?.patchReload

assert.ok(
  Array.isArray(bundles),
  'app-boot must expose bundles for the web profile template',
)
if (!usesLegacyTemplate) {
  assert.ok(
    patchReload === 'live' || patchReload === 'startup',
    'the object-form web profile template must expose a valid patchReload policy',
  )
}

const profileDirectory = join(dshHome, 'profiles', 'web')
if (usesLegacyTemplate) {
  initProfile(profileDirectory, bundles)
} else {
  initProfile(profileDirectory, bundles, patchReload)
}

const manifest = JSON.parse(await readFile(join(profileDirectory, 'package.json'), 'utf8'))
assert.deepEqual(
  manifest.dsh?.profile?.bundles,
  bundles,
  'initialized manifest must preserve the official ordered bundle template',
)
if (!usesLegacyTemplate) {
  assert.equal(
    manifest.dsh?.profile?.patchReload,
    patchReload,
    'initialized manifest must preserve the official patchReload policy',
  )
}

process.stdout.write(`${JSON.stringify({
  profile: 'web',
  templateShape: usesLegacyTemplate ? 'array' : 'object',
  bundleCount: bundles.length,
  patchReload,
  manifest: join(profileDirectory, 'package.json'),
})}\n`)
