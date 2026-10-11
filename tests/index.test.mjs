import assert from 'node:assert/strict'
import { test } from 'vitest'
import { hyperapp } from '../dist/index.js'
import { createFixtureServer } from './test-helpers.mjs'

test('the entry point composes defaults and optional features', async () => {
  const server = await createFixtureServer()
  try {
    assert.deepEqual(hyperapp().map(plugin => plugin.name), [
      'local:hyperapp-jsx',
      'local:hyperapp-hmr',
    ])
    assert.deepEqual(
      hyperapp({ hmr: false, safariExternalSourcemaps: true }).map(plugin => plugin.name),
      ['local:hyperapp-jsx', 'local:safari-external-sourcemaps'],
    )

    const noHmr = await createFixtureServer({ hmr: false })
    try {
      const entry = await noHmr.transformRequest('/fixtures/run.ts')
      const view = await noHmr.transformRequest('/fixtures/view.tsx')
      assert.doesNotMatch(entry.code, /__hyperappHmr|import\.meta\.hot\.accept/)
      assert.match(view.code, /jsx-dev-runtime/)
    } finally {
      await noHmr.close()
    }
  } finally {
    await server.close()
  }
})
