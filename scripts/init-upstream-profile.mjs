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
const hasPatchReload = !usesLegacyTemplate
  && typeof template === 'object'
  && template !== null
  && Object.prototype.hasOwnProperty.call(template, 'patchReload')

assert.ok(
  Array.isArray(bundles),
  'app-boot must expose bundles for the web profile template',
)
if (hasPatchReload) {
  assert.ok(
    patchReload === 'live' || patchReload === 'startup',
    'an exposed patchReload policy must be live or startup',
  )
}

const profileDirectory = join(dshHome, 'profiles', 'web')
if (patchReload === undefined) {
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
if (patchReload === undefined) {
  assert.equal(
    manifest.dsh?.profile?.patchReload,
    undefined,
    'initialized manifest must not invent a patchReload policy',
  )
} else {
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
