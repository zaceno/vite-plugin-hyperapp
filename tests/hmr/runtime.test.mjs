import assert from 'node:assert/strict'
import { test } from 'vitest'
import { app as hyperapp } from 'hyperapp'
import { createHmrApp } from '../../hmr/runtime.js'

test('Hyperapp stops active subscriptions when dispatched without arguments', () => {
  let cleaned = 0
  const dispatch = hyperapp({
    init: { count: 0 },
    subscriptions: () => [[() => () => cleaned++, {}]],
  })
  assert.equal(cleaned, 0)
  dispatch()
  assert.equal(cleaned, 1)
})

test('handoff preserves state and disposes subscriptions without re-running init', async () => {
  const originalRAF = globalThis.requestAnimationFrame
  globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
  try {
    const hot = { data: {} }
    let initialized = 0
    let started = 0
    let cleaned = 0
    const rendered = []
    const subscribe = () => {
      started++
      return () => cleaned++
    }
    const props = {
      init: () => {
        initialized++
        return { count: 0 }
      },
      view: state => {
        rendered.push(state.count)
        return { count: state.count }
      },
      subscriptions: () => [[subscribe, {}]],
      node: { id: 'app' },
    }
    const mounts = []
    const app = options => {
      mounts.push(options)
      let state = typeof options.init === 'function' ? options.init() : options.init
      const cleanup = options.subscriptions(state)[0][0](() => {}, {})
      return action => {
        if (action === undefined) {
          cleanup()
          state = undefined
        } else if (typeof action === 'function') {
          const previous = state
          state = action(state)
          if (state !== previous) requestAnimationFrame(() => options.view(state))
        }
        else state = action
      }
    }

    const first = createHmrApp(hot)
    const send = first.mount(app, props)
    send(state => ({ count: state.count + 3 }))
    await first.dispose(hot.data)
    assert.equal(mounts[0].view, props.view)
    assert.deepEqual(rendered, [3])
    assert.equal(started, 1)
    assert.equal(cleaned, 1)
    assert.deepEqual(hot.data.__hyperappHmrState, { count: 3 })

    const second = createHmrApp(hot)
    second.mount(app, props)
    assert.deepEqual(mounts[1].init, { count: 3 })
    assert.equal(initialized, 1)
    assert.equal(started, 2)
    await second.dispose(hot.data)
    assert.equal(cleaned, 2)

    // A full reload gets a fresh hot.data object, unlike an HMR update.
    const reload = createHmrApp({ data: {} })
    reload.mount(app, props)
    assert.equal(initialized, 2)
    assert.equal(mounts[2].init, props.init)
  } finally {
    globalThis.requestAnimationFrame = originalRAF
  }
})
