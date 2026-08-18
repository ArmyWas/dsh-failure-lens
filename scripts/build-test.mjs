/**
 * Bundle the TypeScript test suite into a single self-contained ESM file and run
 * it in-process. This avoids two Windows-sandbox problems at once:
 *   1. `node --test` spawns one child process per test file (piped stdio), which
 *      the confined environment blocks with the exact `spawn EPERM` this plugin
 *      diagnoses — a sandbox limitation, not a test failure.
 *   2. Node's native ESM loader cannot resolve extensionless `.ts` imports.
 * Bundling through esbuild (already a devDependency) resolves both: a single
 * `lib` bundle runs under one `node --test` process with no child spawn.
 */

import { resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

await build({
  entryPoints: [resolve(ROOT, 'test/all.test.ts')],
  outfile: resolve(ROOT, 'test-dist/all.test.mjs'),
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  bundle: true,
  write: true,
  // Harness contracts resolve at runtime from node_modules; react/react-dom too.
  external: [
    '@deepseek-ai/*',
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/server',
  ],
  plugins: [{
    name: 'test-harness-primitives-stub',
    setup(builder) {
      builder.onResolve(
        { filter: /^@deepseek-ai\/dsh-client-ui-primitives$/ },
        () => ({ path: resolve(ROOT, 'test/stubs/primitives.ts') }),
      )
    },
  }],
})
