/** Boot an isolated Harness Web profile and prove the plugin reaches the page. */

import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const dshHome = process.env.DSH_HOME
assert.ok(dshHome, 'DSH_HOME is required')

const cli = resolve('node_modules/@deepseek-ai/dsh/lib/bin.js')
const child = spawn(process.execPath, [cli, 'web', '--no-open', '--port', '0'], {
  env: { ...process.env, DSH_HOME: dshHome },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
let resolved = false
let rejectStarted
const started = new Promise((resolveStarted, reject) => {
  rejectStarted = reject
  const accept = (chunk) => {
    output += chunk.toString()
    const match = output.match(/dsh web:\s+(http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)/)
    if (match !== null && !resolved) {
      resolved = true
      resolveStarted(match[1])
    }
  }
  child.stdout.on('data', accept)
  child.stderr.on('data', accept)
})

child.once('exit', (code, signal) => {
  if (!resolved) {
    rejectStarted(new Error(`dsh web exited before listening (code=${code}, signal=${signal})\n${redact(output)}`))
  }
})

const timeout = setTimeout(() => {
  if (!resolved) rejectStarted(new Error(`dsh web did not listen within 60 seconds\n${redact(output)}`))
}, 60_000)

function redact(value) {
  return value.replace(/([?&]token=)[^\s&]+/g, '$1<redacted>')
}

async function stop() {
  if (child.exitCode !== null || child.signalCode !== null) return
  if (process.platform === 'win32') {
    child.kill('SIGKILL')
    await new Promise((resolveExit) => child.once('exit', resolveExit))
    return
  }
  child.kill('SIGTERM')
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000)),
  ])
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
}

try {
  const url = await started
  clearTimeout(timeout)
  const authentication = await fetch(url, { redirect: 'manual' })
  let response = authentication
  if (authentication.status >= 300 && authentication.status < 400) {
    const location = authentication.headers.get('location')
    const setCookie = authentication.headers.get('set-cookie')
    assert.ok(location, 'Harness authentication redirect must include a location')
    assert.ok(setCookie, 'Harness authentication redirect must issue a browser-trust cookie')
    response = await fetch(new URL(location, url), {
      headers: { cookie: setCookie.split(';', 1)[0] },
    })
  }
  assert.equal(response.status, 200, 'Harness root page must respond with HTTP 200')
  const html = await response.text()
  assert.match(html, /dsh-failure-lens\/client\.js/, 'the boot page must include the Failure Lens client bundle')
  process.stdout.write(`${JSON.stringify({
    status: response.status,
    pluginClientIncluded: true,
    profile: 'web',
  })}\n`)
} finally {
  clearTimeout(timeout)
  await stop()
}
