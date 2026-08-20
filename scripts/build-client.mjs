/**
 * Build `lib/client.js` for the dsh-failure-lens browser half.
 *
 * This is a self-contained mirror of the official `packages/client/tsdown.client.ts`
 * client-config, because an out-of-tree npm package cannot depend on the Harness
 * repo's tsdown preset. It emits the exact artifact the Host's `dsh-client-modules`
 * node half expects:
 *   - `lib/client.js`, lazy CJS, wrapping `window.__ModuleLoader__.load({ id, factory })`
 *   - platform modules stay external (answered by the frozen module table)
 *   - every other dependency is inlined
 *   - CSS Modules compile through lightningcss into a hashed class map whose
 *     stylesheet text self-injects a `<style data-plugin>` tag at factory time
 *   - react / react/jsx-runtime and the wire contracts stay external where they
 *     are platform modules; inline-safe wire layers are bundled
 *
 * Externals must mirror the platform seed table (see `packages/client/web/src/platform.ts`).
 */

import { readFileSync, realpathSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { transform } from 'lightningcss'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_ROOT = realpathSync(ROOT)

const PLUGIN_ID = 'dsh-failure-lens'

/** Platform seed table entries; a require() the table cannot answer is a runtime throw. */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

/**
 * Documented temporary exemption: the snapshot-store engine lives in runtime
 * pending rehoming. At runtime the lazy CJS table answers the require natively.
 */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

const CLIENT_EXTERNALS = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

/**
 * Wire/type layers that may be inlined: browser-safe contract surfaces with no
 * runtime identity to share (no Symbol/instanceof/singleton state).
 */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

/** Vendored libraries rescoped into @deepseek-ai that may be inlined. */
const VENDORED_LIBRARY = /^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/

/** Generated descriptor/codec contributions with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

/** CSS Modules: compile lightningcss, hand back the hashed class map + injector. */
const cssModulesPlugin = {
  name: 'dsh-css-modules-inline',
  setup(builder) {
    builder.onResolve({ filter: /\.module\.css$/ }, (args) => {
      const absolutePath = realpathSync(resolve(dirname(args.importer), args.path))
      const logicalPath = relative(SOURCE_ROOT, absolutePath).replaceAll('\\', '/')
      if (logicalPath === '..' || logicalPath.startsWith('../')) {
        return { errors: [{ text: `CSS Module escapes the package root: ${args.path}` }] }
      }
      return {
        path: logicalPath,
        namespace: 'dsh-css',
        pluginData: { absolutePath },
      }
    })
    builder.onLoad({ filter: /.*/, namespace: 'dsh-css' }, (args) => {
      const absolutePath = args.pluginData?.absolutePath
      if (typeof absolutePath !== 'string') {
        return { errors: [{ text: `CSS Module ${args.path} is missing its source path` }] }
      }
      const source = readFileSync(absolutePath)
      const { code, exports: cssExports } = transform({
        // lightningcss includes filename in [hash]. A repository-relative,
        // slash-normalized identity keeps class names reproducible across OSes
        // and prevents build-machine paths from leaking into the bundle.
        filename: args.path,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap = {}
      for (const [local, exp] of Object.entries(cssExports ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
        classMap[local] = exp.name
      }
      const base = args.path.split('/').pop() ?? 'style.module.css'
      const tagId = `${PLUGIN_ID}/${base}`
      const js = [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
        `  const tag = document.createElement('style');`,
        `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
        `  tag.dataset.pluginCss = tagId;`,
        `  tag.textContent = css;`,
        `  document.head.appendChild(tag);`,
        `}`,
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
      return { contents: js, loader: 'js', resolveDir: dirname(absolutePath) }
    })
  },
}

/** Bundle purity gate: reject cross-plugin value imports the module table can't answer. */
const purityPlugin = {
  name: 'dsh-client-bundle-purity',
  setup(builder) {
    builder.onResolve({ filter: /^@deepseek-ai\// }, (args) => {
      const source = args.path
      if (CLIENT_EXTERNALS.includes(source)) return null
      if (VENDORED_LIBRARY.test(source)) return null
      if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
      return {
        errors: [{
          text: `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS), an inline-safe wire layer, or a generated /remote contribution — cross-plugin value imports are forbidden`,
        }],
      }
    })
  },
}

await build({
  entryPoints: { client: resolve(ROOT, 'src/client/index.ts') },
  outdir: resolve(ROOT, 'lib'),
  entryNames: 'client',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  bundle: true,
  sourcemap: true,
  write: true,
  metafile: false,
  external: CLIENT_EXTERNALS,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [purityPlugin, cssModulesPlugin],
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
})

const clientOutput = readFileSync(resolve(ROOT, 'lib/client.js'), 'utf8')
for (const buildRoot of new Set([
  ROOT,
  ROOT.replaceAll('\\', '/'),
  SOURCE_ROOT,
  SOURCE_ROOT.replaceAll('\\', '/'),
])) {
  if (clientOutput.includes(buildRoot)) {
    throw new Error(`client bundle leaked the absolute build root: ${buildRoot}`)
  }
}

// esbuild inlines all non-external deps by default when bundle:true and
// external lists the platform table, matching tsdown's noExternal rule.
