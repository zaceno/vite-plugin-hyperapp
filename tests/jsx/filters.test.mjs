import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import hyperappPlugin from '../../dist/index.js'
import { createFixtureServer } from '../test-helpers.mjs'

const hyperapp = '/fixtures/hyperapp/view.jsx'
const other = '/fixtures/react/view.jsx'
const hyperappRuntime = /(?:vite-plugin-hyperapp\/jsx|dist\/jsx)\/jsx-dev-runtime/
const source = 'export const view = () => <main>Other JSX</main>'

function pragma(options, path, code = source) {
  const plugin = hyperappPlugin({ jsx: options })[0]
  return plugin.transform(code, fileURLToPath(new URL(`../${path.slice(1)}`, import.meta.url)))
}

async function transformed(options, path) {
  const server = await createFixtureServer({ jsx: options, hmr: false })
  try {
    return (await server.transformRequest(path)).code
  } finally {
    await server.close()
  }
}

test('without filters, JSX still uses the Hyperapp runtime globally', async () => {
  assert.match(await transformed(undefined, other), hyperappRuntime)
})

test('include selects only Hyperapp files without changing the other JSX runtime', async () => {
  const options = { include: /\/fixtures\/hyperapp\// }
  assert.match(await transformed(options, hyperapp), hyperappRuntime)
  assert.equal(pragma(options, other), undefined)
})

test('exclude alone selects every JSX file except exclusions', async () => {
  const options = { exclude: /\/fixtures\/react\// }
  assert.match(await transformed(options, hyperapp), hyperappRuntime)
  assert.equal(pragma(options, other), undefined)
})

test('exclude takes precedence over include', async () => {
  const options = { include: /\/fixtures\//, exclude: /\/fixtures\/react\// }
  assert.match(await transformed(options, hyperapp), hyperappRuntime)
  assert.equal(pragma(options, other), undefined)
})

test('an explicit import source takes precedence over matching filters', () => {
  assert.equal(pragma({ include: /\/fixtures\/hyperapp\// }, hyperapp,
    '// @jsxImportSource other-runtime\n' + source), undefined)
  assert.equal(pragma({ include: /\/fixtures\/hyperapp\// }, hyperapp,
    '/* @jsxImportSource other-runtime */\n' + source), undefined)
  assert.match(pragma({ include: /\/fixtures\/hyperapp\// }, hyperapp,
    source + '\n// @jsxImportSource other-runtime').code, /^\/\/ @jsxImportSource vite-plugin-hyperapp\/jsx/)
})

test('filtered transform supports Vite query ids and retains a source map', () => {
  const result = pragma({ include: /\/fixtures\/hyperapp\// }, hyperapp + '?v=1')
  assert.match(result.code, /^\/\/ @jsxImportSource vite-plugin-hyperapp\/jsx/)
  assert.ok(result.map)
})

test('filtered JSX also selects Hyperapp during SSR transformation', async () => {
  const server = await createFixtureServer({ jsx: { include: /\/fixtures\/hyperapp\// }, hmr: false })
  try {
    const result = await server.transformRequest(hyperapp, { ssr: true })
    assert.match(result.code, /jsx-dev-runtime/)
    assert.doesNotMatch(result.code, /react\/jsx-dev-runtime/)
  } finally {
    await server.close()
  }
})

test('filtered mode also works for TSX files', async () => {
  const code = await transformed({ include: /\/fixtures\/view\.tsx$/ }, '/fixtures/view.tsx')
  assert.match(code, hyperappRuntime)
})
