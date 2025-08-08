import { h, text } from "hyperapp"

const nodeify = x =>
  (typeof x === "string") | (typeof x === "number") ? text(x) : x

export const jsxNode = (tag, props, ...children) =>
  typeof tag === "function"
    ? tag(props, children)
    : h(tag, props || {}, children.flat(2).map(nodeify))

export const jsxFragment = (_, children) => {
  return children.flat(2).map(nodeify)
}
