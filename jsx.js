import { h, text } from "hyperapp"

const cproc = children =>
  children
    .flat()
    .map(x => ((typeof x === "string") | (typeof x === "number") ? text(x) : x))

export const jsx = (tag, props, ...children) =>
  typeof tag === "function"
    ? tag(props, cproc(children))
    : h(tag, props || {}, cproc(children))

export const jsxFragment = (_, children) => cproc(children)
