import { JSDOM } from "jsdom"
import { app } from "hyperapp"

export default function (defs) {
  const dom = new JSDOM("")
  global.document = dom.window.document
  const parent = document.createElement("div")
  const node = document.createElement("div")
  parent.appendChild(node)
  return new Promise(resolve => {
    const stop = app({ ...defs, node })
    setTimeout(() => {
      stop() //prevents any eventual callbacks from calling back
      resolve(parent.firstChild.outerHTML)
    }, 0)
  })
}
