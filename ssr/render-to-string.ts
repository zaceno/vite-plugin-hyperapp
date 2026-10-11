import { app, type Dispatchable, type VNode } from 'hyperapp'
import { vdomToHtml } from './vdom-html.ts'

type ServerAppProps<S> = {
  init: Dispatchable<S>
  view: (state: S) => VNode<S>
}

/** Render the state reached by Hyperapp's synchronous initialization effects. */
export function renderToString<S>({ init, view }: ServerAppProps<S>): string {
  const dispatch = app<S>({ init })
  let state!: S
  dispatch(current => (state = current))
  return vdomToHtml(view(state))
}
