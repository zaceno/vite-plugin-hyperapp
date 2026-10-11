import assert from 'node:assert/strict'
import { test } from 'vitest'
import { h, text } from 'hyperapp'
import { renderToString } from '../../dist/ssr/index.js'

test('renders plain initial state without invoking other app properties', () => {
  const ignored = () => { throw new Error('should not be called') }
  const html = renderToString({
    init: { name: '<Alice>' },
    view: state => h('main', {}, [text(state.name)]),
    subscriptions: ignored,
    dispatch: ignored,
    node: { nodeType: 1 },
  })
  assert.equal(html, '<main>&lt;Alice&gt;</main>')
})

test('runs an init action through Hyperapp before rendering', () => {
  let renders = 0
  const html = renderToString({
    init: () => ({ count: 2 }),
    view: state => {
      renders++
      return h('output', {}, [text(state.count)])
    },
  })
  assert.equal(html, '<output>2</output>')
  assert.equal(renders, 1)
})

test('synchronous effects can dispatch further initialization actions', () => {
  const increment = (state, amount) => ({ count: state.count + amount })
  const branch = (dispatch, amount) => dispatch([increment, amount])
  const html = renderToString({
    init: () => [{ count: 1 }, [branch, 2], [branch, 3]],
    view: state => h('strong', {}, [text(state.count)]),
  })
  assert.equal(html, '<strong>6</strong>')
})

test('delayed dispatch does not affect the returned HTML', () => {
  let later
  const html = renderToString({
    init: () => [{ count: 1 }, dispatch => { later = dispatch }],
    view: state => h('span', {}, [text(state.count)]),
  })
  later(state => ({ count: 10 }))
  assert.equal(html, '<span>1</span>')
})
