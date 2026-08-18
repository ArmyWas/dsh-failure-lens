/**
 * Build the node-half `lib/*.js` artifacts for the dsh-failure-lens plugin:
 *   - lib/index.js     (empty apply — minimal cordis entry)
 *   - lib/invariant.js (package-invariant companion)
 *   - lib/classifier.js (pure classifier, exported for tests and reuse)
 *
 * The Host Loader imports the node half by the package `main`/`exports` fields;
 * cordis resolves at runtime from the profile tree, so it stays external. The
 * client ESM half is bundled separately by `scripts/build-client.mjs`.
 */

import { resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

await build({
  entryPoints: {
    index: resolve(ROOT, 'src/index.ts'),
    invariant: resolve(ROOT, 'src/invariant.ts'),
    classifier: resolve(ROOT, 'src/classifier.ts'),
  },
  outdir: resolve(ROOT, 'lib'),
  entryNames: '[name]',
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  bundle: true,
  sourcemap: false,
  write: true,
  external: ['@deepseek-ai/cordis'],
})
