const defaultOptions = {
  hmr: true,
  dispatchExport: "dispatch",
}

const rxIsEntry = /import {.*app[^}]*} from "hyperapp"/
const rxIsSSREntry = /import .+ from "vite-plugin-hyperapp\/ssr"/

const HMRAppendage = dispatch => `
if (import.meta.hot) {
  import.meta.hot.accept(m => {
    if (!${dispatch}) return
    let prevState = null
    ${dispatch}(s => (prevState = s))
    ${dispatch}()
    m.${dispatch}(prevState)
  })
}
`

const SSRHMRAppendage = `
if (import.meta.hot) {
  import.meta.hot.accept()
}
`

export default function injectConsoleLog(options = {}) {
  options = { ...defaultOptions, ...options }

  return {
    name: "vite-plugin-hyperapp",

    config: () => ({
      esbuild: {
        jsxFactory: "jsxNode",
        jsxFragment: "jsxFragment",
        jsxInject:
          "import {jsxNode, jsxFragment} from 'vite-plugin-hyperapp/jsx.js'",
      },
    }),

    async transform(code, id) {
      if (!options.hmr) return null

      if (rxIsEntry.test(code)) {
        return {
          code: code + HMRAppendage(options.dispatchExport),
          map: null,
        }
      }

      if (rxIsSSREntry.test(code)) {
        return {
          code: code + SSRHMRAppendage,
          map: null,
        }
      }

      return null
    },
  }
}
