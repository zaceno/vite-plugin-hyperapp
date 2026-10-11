import assert from 'node:assert/strict'
import { afterAll, beforeAll, test } from 'vitest'
import { createFixtureServer } from '../test-helpers.mjs'
import { jsx, jsxs, Fragment } from '../../dist/jsx/jsx-runtime.js'

let server

beforeAll(async () => {
  server = await createFixtureServer()
})

afterAll(async () => {
  await server?.close()
})

test('intrinsic elements retain Hyperapp props, keys, and normalized children', () => {
  const onClick = () => {}
  const child = jsx('span', { children: 'nested' })
  const node = jsxs('div', {
    class: ['example', { active: true }],
    onclick: onClick,
    children: ['Hello', [12, null, false, true, child]],
  }, 'row-1')

  assert.equal(node.tag, 'div')
  assert.equal(node.key, 'row-1')
  assert.equal(node.props.class, 'example active')
  assert.equal(node.props.onclick, onClick)
  assert.equal(node.props.children, undefined)
  assert.deepEqual(node.children.map(child => child.tag), ['Hello', 12, 'span'])
  assert.equal(node.children[0].type, 3)
  assert.equal(node.children[2], child)
})

test('components get children in props, and fragments flatten in elements', () => {
  const received = []
  const Component = props => {
    received.push(props)
    return jsx('strong', { children: props.children })
  }
  const fragment = jsx(Fragment, { children: ['one', jsx('em', {})] })
  const node = jsxs('section', {
    children: [jsx(Component, { title: 'demo', children: 'child' }), fragment],
  })

  assert.deepEqual(received, [{ title: 'demo', children: 'child' }])
  assert.deepEqual(node.children.map(child => child.tag), ['strong', 'one', 'em'])
})

test('Vite transforms TSX and supplies a map back to the source file', async () => {
  const result = await server.transformRequest('/fixtures/view.tsx')
  assert.ok(result)
  assert.match(result.code, /jsx-dev-runtime/)
  assert.ok(result.map)
  assert.ok(result.map.sources.some(source => source.endsWith('view.tsx')))
})
