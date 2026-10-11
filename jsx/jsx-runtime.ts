import { h, text, type Props, type VNode } from 'hyperapp'

// JSX does not carry Hyperapp's application state type through the tree.
export namespace JSX {
  export type Element = VNode<any>
  export interface ElementChildrenAttribute {
    children: {}
  }
  export interface IntrinsicElements {
    [tag: string]: Props<any> & { children?: Child }
  }
}

export type Child = JSX.Element | string | number | boolean | null | undefined | readonly Child[]
type Component = (props: Record<string, unknown>) => Child

export const Fragment = (props: { children?: Child }) => props.children ?? []

function normalize(children: Child): any[] {
  const result: any[] = []
  const visit = (child: Child): void => {
    if (Array.isArray(child)) {
      for (const item of child) visit(item)
    } else if (typeof child === 'string' || typeof child === 'number') {
      result.push(text(child))
    } else if (child != null && child !== false && child !== true) {
      result.push(child)
    }
  }
  visit(children)
  return result
}

export function jsx(
  tag: string | Component,
  props: Record<string, any> | null,
  key?: string,
): JSX.Element {
  const attributes = props ?? {}
  if (typeof tag === 'function') return tag(attributes) as JSX.Element
  const { children, ...rest } = attributes
  return h(tag, key === undefined ? rest : { ...rest, key }, normalize(children))
}

export const jsxs = jsx
