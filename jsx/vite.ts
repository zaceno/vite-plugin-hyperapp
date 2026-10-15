import { fileURLToPath } from 'node:url'
import MagicString from 'magic-string'
import { createFilter, type FilterPattern, type Plugin } from 'vite'

type JsxOptions = { include?: FilterPattern; exclude?: FilterPattern }

// The JSX import source points at this folder's standard automatic runtime files.
export function hyperappJsx(options?: JsxOptions): Plugin {
  const filtered = options?.include != null || options?.exclude != null
  const filter = createFilter(options?.include ?? /\.[jt]sx$/, options?.exclude)
  return {
    name: 'local:hyperapp-jsx',
    enforce: 'pre',
    config() {
      return {
        oxc: {
          jsx: filtered
            ? { runtime: 'automatic' }
            : { runtime: 'automatic', importSource: 'vite-plugin-hyperapp/jsx' },
        },
        resolve: {
          alias: {
            'vite-plugin-hyperapp/jsx': fileURLToPath(new URL('.', import.meta.url)),
          },
        },
      }
    },
    transform(code, id) {
      if (!filtered) return
      const path = id.split('?')[0]
      if (!/\.[jt]sx$/.test(path) || path.includes('/node_modules/') || !filter(path)) return
      // Oxc only considers pragma comments before the first statement.
      const leadingComments = code.match(/^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*/)?.[0] ?? ''
      if (/@jsxImportSource\b/.test(leadingComments)) return
      const source = new MagicString(code)
      source.prepend('// @jsxImportSource vite-plugin-hyperapp/jsx\n')
      return { code: source.toString(), map: source.generateMap({ hires: true }) }
    },
  }
}
