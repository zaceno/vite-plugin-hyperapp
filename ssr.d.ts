import { Subscription } from "hyperapp"

type Defs<S = any> = {
  init?: Dispatchable<S>
  view?: (state: S) => ElementVNode<S>
  subscriptions?: (state: S) => Subscription<S>[]
  dispatch?: (d: Dispatch<S>) => Dispatch<S>
}

declare module "vite-plugin-hyperapp/ssr" {
  export default function (defs: Defs): Promise<string>
}
