import type { Props, MaybeVNode, ElementVNode } from "hyperapp"

type Component<S, P> = (
  props: P,
  children: MaybeVNode<S>[],
) => MaybeVNode<S> | MaybeVNode<S>[]

type _JSXChild<S> = string | number | MaybeVNode<S>
type JSXChild<S> = _JSXChild<S> | _JSXChild<S>[]

export declare function jsx<S>(
  type: string,
  props?: Props<S>,
  ...children: JSXChild<S>[]
): ElementVNode<S>

export declare function jsx<S, P>(
  type: Component<S, P>,
  props?: P | null,
  ...children: JSXChild<S>[]
): ReturnType<Component<S, P>>

export declare function jsxFragment<S>(
  _: any,
  children: JSXChild<S>[],
): MaybeVNode<S>[]

declare global {
  namespace JSX {
    /** Result of a JSX expression. Components may return arrays. */
    type Element = MaybeVNode<any> | MaybeVNode<any>[]

    /** What you can put in the `<X />` position */
    type ElementType = string | Component<any, any>

    /** Allow `<>...</>` fragments; returns an array */
    type Fragment = MaybeVNode<any>[]

    /** Intrinsic (HTML/SVG) elements. */
    interface IntrinsicElements {
      [elem: string]: Props<any>
    }

    /** prevents errors about children missing from props in components */
    type LibraryManagedAttributes<P> = P & { children?: JSXChild<any>[] }
  }
}

// make jsx and jsxFragment ambient globals because
// ts server doesn't know I'll add them later in transform
type JsxFn = typeof jsx
type JsxFragmentFn = typeof jsxFragment

declare global {
  const jsx: JsxFn
  const jsxFragment: JsxFragmentFn
}

export {}
