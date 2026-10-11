import assert from 'node:assert/strict'
import { afterAll, beforeAll, test } from 'vitest'
import { createFixtureServer } from '../test-helpers.mjs'

let server
beforeAll(async () => {
  server = await createFixtureServer()
})
afterAll(async () => server?.close())

test('only the app-call module becomes a self-accepting HMR boundary', async () => {
  const entry = await server.transformRequest('/fixtures/run.ts')
  const view = await server.transformRequest('/fixtures/view.tsx')
  assert.match(entry.code, /__hyperappHmr\.mount\(app,\s*\{/)
  assert.match(entry.code, /import\.meta\.hot\.accept\(\)/)
  assert.match(entry.code, /import\.meta\.hot\.dispose\(__hyperappHmr\.dispose\)/)
  assert.ok(entry.map.sources.some(source => source.endsWith('run.ts')))
  assert.doesNotMatch(view.code, /__hyperappHmr\.mount/)
  const runtime = await server.transformRequest('virtual:hyperapp-hmr')
  assert.match(runtime.code, /export function createHmrApp/)
})

test('the plugin recognizes a conventional app call independently of its filename', () => {
  const plugin = server.config.plugins.find(plugin => plugin.name === 'local:hyperapp-hmr')
  const code = 'import { app } from "hyperapp"; const dispatch = app ({ init: {} });'
  const result = plugin.transform.call({}, code, '/other-project/entry.js', {})
  assert.match(result.code, /__hyperappHmr\.mount\(app,\s*\{/)
  assert.equal(
    plugin.transform.call({}, 'import { app as start } from "hyperapp"; start({});', '/entry.js', {}),
    undefined,
  )
})
