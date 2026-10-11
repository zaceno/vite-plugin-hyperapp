import type { ElementVNode, VNode } from 'hyperapp'

const booleanAttributes = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'disablepictureinpicture',
  'disableremoteplayback', 'formnovalidate', 'hidden', 'inert', 'ismap',
  'itemscope', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open',
  'playsinline', 'readonly', 'required', 'reversed', 'selected',
])
const overloadedBooleanAttributes = new Set(['capture', 'download'])
const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])
const propertyOnly = new Set([
  'children', 'key', 'innerHTML', 'outerHTML', 'textContent', 'innerText',
  'nodeValue', 'scrollTop', 'scrollLeft', 'offsetWidth', 'offsetHeight',
  'clientWidth', 'clientHeight', 'files', 'labels',
  'elements', 'options', 'selectedOptions', 'validity', 'validationMessage',
  'willValidate', 'selectionStart', 'selectionEnd', 'selectionDirection',
  'valueAsDate', 'valueAsNumber',
])

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

function styleName(name: string): string {
  if (name.startsWith('--')) return name
  if (name === 'cssFloat') return 'float'
  return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    .replace(/^ms-/, '-ms-')
}

function serializeStyle(style: unknown): string {
  if (!style || typeof style !== 'object') return ''
  return Object.entries(style).flatMap(([name, value]) =>
    value == null || value === '' || typeof value === 'boolean'
      ? []
      : [`${styleName(name)}: ${String(value)}`],
  ).join('; ')
}

function serializeProps(props: Record<string, unknown>, tag: string, isSvg: boolean): string {
  let attributes = ''
  for (const [property, value] of Object.entries(props)) {
    if (property.startsWith('on') || propertyOnly.has(property) || value == null) continue
    if (property === 'style') {
      const css = serializeStyle(value)
      if (css) attributes += ` style="${escapeHtml(css)}"`
      continue
    }
    if (typeof value === 'function' || typeof value === 'object' || typeof value === 'symbol') continue

    // An input's current value is reflected by its value attribute; for a
    // textarea, the initial value lives in its text content instead.
    if ((tag === 'textarea' || tag === 'select') && (property === 'value' || property === 'defaultValue')) continue
    if (property === 'defaultValue' && tag !== 'input') continue
    if (property === 'defaultChecked' && tag !== 'input') continue

    const name = property === 'defaultValue' ? 'value'
      : property === 'defaultChecked' ? 'checked'
      : isSvg ? property : property.toLowerCase()

    if (!/^[^\s"'<>/=]+$/.test(name)) continue
    if (!isSvg && booleanAttributes.has(name)) {
      if (value) attributes += ` ${name}`
    } else if (!isSvg && overloadedBooleanAttributes.has(name) && value === true) {
      attributes += ` ${name}`
    } else if (typeof value !== 'boolean' || name.startsWith('aria-') || name.startsWith('data-') ||
      (!isSvg && ['contenteditable', 'draggable', 'spellcheck', 'translate'].includes(name))) {
      attributes += ` ${name}="${escapeHtml(value)}"`
    } else if (isSvg && value === true) {
      attributes += ` ${name}="true"`
    }
  }
  return attributes
}

function render(node: VNode<any> | boolean | null | undefined, isSvg: boolean): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node.tag === 'function') return render(node.tag((node as ElementVNode<any>).memo!), isSvg)
  if (node.type === 3) return escapeHtml(node.tag)

  const tag = node.tag
  if (!/^[A-Za-z][\w:.-]*$/.test(tag)) throw new Error(`Invalid element tag: ${tag}`)
  const svg = isSvg || tag === 'svg'
  const props = node.props as Record<string, unknown>
  const attributes = serializeProps(props, tag, svg)
  if (!svg && voidElements.has(tag)) return `<${tag}${attributes}>`

  let children: string
  if (tag === 'textarea' && !svg && (props.value != null || props.defaultValue != null)) {
    children = escapeHtml(props.value ?? props.defaultValue)
  } else if ((tag === 'script' || tag === 'style') && !svg) {
    // Raw-text HTML elements do not decode character references. A closing
    // tag in the content cannot safely be represented as a text child.
    children = node.children.map(child => {
      if (child == null || typeof child === 'boolean') return ''
      if (child.type !== 3) throw new Error(`${tag} only supports text children`)
      const value = String(child.tag)
      if (new RegExp(`</${tag}(?:[\\s/>])`, 'i').test(value)) {
        throw new Error(`Cannot serialize a closing ${tag} tag inside its text`)
      }
      return value
    }).join('')
  } else {
    children = node.children.map(child => render(child, svg && tag !== 'foreignObject')).join('')
  }
  // The HTML parser discards the first newline after these opening tags.
  if (!svg && ['pre', 'listing', 'textarea'].includes(tag) && children.startsWith('\n')) {
    children = `\n${children}`
  }
  return `<${tag}${attributes}>${children}</${tag}>`
}

/** Serialize an existing Hyperapp virtual tree without starting an app or using the DOM. */
export function vdomToHtml(node: VNode<any>): string {
  return render(node, false)
}
