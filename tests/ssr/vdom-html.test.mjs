import assert from 'node:assert/strict'
import { test } from 'vitest'
import { h, memo, text } from 'hyperapp'
import { vdomToHtml } from '../../dist/ssr/vdom-html.js'

test('escapes text and attributes but never serializes the vnode key', () => {
  const node = h('div', { key: 'secret', title: `"<&'`, 'data-label': 'a&b' }, [text(`<Hello> & "'`)])
  assert.equal(vdomToHtml(node),
    '<div title="&quot;&lt;&amp;&#39;" data-label="a&amp;b">&lt;Hello&gt; &amp; &quot;&#39;</div>')
})

test('class arrays and objects are normalized by Hyperapp h()', () => {
  const node = h('p', { class: ['first', { active: true, hidden: false }, ['last']] }, [text('ok')])
  assert.equal(vdomToHtml(node), '<p class="first active last">ok</p>')
})

test('event handlers, DOM-only properties, and unrepresentable values are omitted', () => {
  const node = h('button', {
    onclick: () => {}, oninput: [() => {}, {}], key: 'ignored',
    scrollTop: 5, innerHTML: '<b>no</b>', customObject: { a: 1 },
    id: 'submit', disabled: true, title: null,
  }, [text('Save')])
  assert.equal(vdomToHtml(node), '<button id="submit" disabled>Save</button>')
})

test('HTML boolean, enumerated boolean, overloaded boolean, and data attributes', () => {
  const node = h('div', {
    hidden: false, draggable: false, contentEditable: true,
    'aria-hidden': false, 'data-active': true, download: true,
  })
  assert.equal(vdomToHtml(node),
    '<div draggable="false" contenteditable="true" aria-hidden="false" data-active="true" download></div>')
})

test('HTML attribute names are used directly, including form control state', () => {
  const node = h('form', { 'accept-charset': 'utf-8', novalidate: true }, [
    h('label', { for: 'name' }, [text('Name')]),
    h('input', { id: 'name', type: 'checkbox', checked: true, value: 'a&b', readOnly: false }),
    h('input', { defaultValue: 'initial', defaultChecked: true }),
    h('button', { type: 'submit', disabled: false }, [text('Go')]),
  ])
  assert.equal(vdomToHtml(node),
    '<form accept-charset="utf-8" novalidate><label for="name">Name</label>' +
    '<input id="name" type="checkbox" checked value="a&amp;b"><input value="initial" checked>' +
    '<button type="submit">Go</button></form>')
})

test('textarea value becomes text content, and initial newlines survive HTML parsing', () => {
  assert.equal(vdomToHtml(h('textarea', { value: '\n<hello>&' })),
    '<textarea>\n\n&lt;hello&gt;&amp;</textarea>')
  assert.equal(vdomToHtml(h('pre', {}, [text('\nhello')])), '<pre>\n\nhello</pre>')
  assert.equal(vdomToHtml(h('select', { value: 'b' }, [
    h('option', { value: 'a' }, [text('A')]),
    h('option', { value: 'b', selected: true }, [text('B')]),
  ])), '<select><option value="a">A</option><option value="b" selected>B</option></select>')
})

test('style objects use CSS names and escape the enclosing HTML attribute', () => {
  const node = h('div', {
    style: { backgroundColor: 'red', WebkitTransform: 'scale(1)', msTransition: 'all 1s',
      '--accent': '"&', display: null, width: '12px', cssFloat: 'left' },
  })
  assert.equal(vdomToHtml(node),
    '<div style="background-color: red; -webkit-transform: scale(1); -ms-transition: all 1s; --accent: &quot;&amp;; width: 12px; float: left"></div>')
})

test('SVG uses the attribute names given to Hyperapp without remapping', () => {
  const node = h('svg', { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('path', { 'stroke-width': 2, 'fill-rule': 'evenodd', d: 'M0 0' }),
    h('use', { 'xlink:href': '#icon', href: '#icon' }),
    h('foreignObject', {}, [h('input', { disabled: true })]),
  ])
  assert.equal(vdomToHtml(node),
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path stroke-width="2" fill-rule="evenodd" d="M0 0"></path>' +
    '<use xlink:href="#icon" href="#icon"></use><foreignObject><input disabled></foreignObject></svg>')
})

test('memo nodes render their views and omitted children match Hyperapp', () => {
  const node = h('ul', {}, [false, null, memo(({ label }) => h('li', {}, [text(label)]), { label: 'memo' })])
  assert.equal(vdomToHtml(node), '<ul><li>memo</li></ul>')
})

test('raw-text elements preserve contents without HTML entity escaping', () => {
  assert.equal(vdomToHtml(h('script', {}, [text('if (a < b) console.log("ok")')])),
    '<script>if (a < b) console.log("ok")</script>')
  assert.throws(() => vdomToHtml(h('script', {}, [text('</script>')])), /closing script tag/)
  assert.throws(() => vdomToHtml(h('bad tag', {})), /Invalid element tag/)
})
