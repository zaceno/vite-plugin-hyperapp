import assert from 'node:assert/strict'
import { test } from 'vitest'
import { h, text } from 'hyperapp'
import { renderToString } from '../dist/ssr/index.js'
import { vdomToHtml } from '../dist/ssr/vdom-html.js'
import { jsx } from '../dist/jsx/jsx-runtime.js'
import { jsxDEV } from '../dist/jsx/jsx-dev-runtime.js'

test('legacy JSX subpaths re-export the extracted hyperapp-jsx runtime', () => {
  const node = jsx('div', { children: 'hello' })
  assert.equal(node.tag, 'div')
  assert.equal(node.children[0].tag, 'hello')
  assert.equal(jsxDEV, jsx)
})

test('legacy SSR subpaths re-export the extracted hyperapp-ssr helpers', () => {
  const node = h('main', {}, [text('<hello>')])
  assert.equal(vdomToHtml(node), '<main>&lt;hello&gt;</main>')
  assert.equal(renderToString({ init: 1, view: state => h('b', {}, [text(state)]) }), '<b>1</b>')
})
