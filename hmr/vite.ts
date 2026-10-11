import { readFile } from 'node:fs/promises'
import MagicString from 'magic-string'
import { parseSync, type Plugin } from 'vite'

const virtualId = 'virtual:hyperapp-hmr'
const resolvedId = '\0' + virtualId

// This plugin only instruments the module that imports and calls Hyperapp's app.
// It does not need to know the entry point, the app's state type, or its view.
export function hyperappHmr(): Plugin {
  return {
    name: 'local:hyperapp-hmr',
    apply: 'serve',
    enforce: 'post', // inspect JavaScript after Vite has transformed TS/TSX
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    async load(id) {
      if (id === resolvedId) {
        return readFile(new URL('./runtime.js', import.meta.url), 'utf8')
      }
    },
    transform(code, id, options) {
      if (options?.ssr || id.includes('/node_modules/') || !/\.[cm]?[jt]sx?(?:\?|$)/.test(id)) return
      if (!code.includes('hyperapp')) return

      const ast = parseSync(id, code)
      const importsApp = ast.program.body.some(node =>
        node.type === 'ImportDeclaration' &&
        node.source.value === 'hyperapp' &&
        node.specifiers.some(specifier =>
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          specifier.imported.name === 'app' &&
          specifier.local.name === 'app',
        ),
      )
      if (!importsApp) return

      const calls: { start: number; end: number }[] = []
      function visit(value: unknown): void {
        if (!value || typeof value !== 'object') return
        if (Array.isArray(value)) {
          value.forEach(visit)
          return
        }
        const node = value as Record<string, unknown>
        if (node.type === 'CallExpression') {
          const callee = node.callee as { type: string; name?: string; start: number; end: number }
          if (callee.type === 'Identifier' && callee.name === 'app') {
            calls.push({ start: callee.start, end: callee.end })
          }
        }
        for (const [key, child] of Object.entries(node)) {
          if (key !== 'start' && key !== 'end') visit(child)
        }
      }
      visit(ast.program.body)
      if (!calls.length) return
      if (calls.length !== 1) {
        this.error(`Expected exactly one Hyperapp app() call in ${id}; found ${calls.length}`)
      }

      const output = new MagicString(code)
      output.prepend(
        `import { createHmrApp as __hyperappHmrCreate } from '${virtualId}';\n` +
        `const __hyperappHmr = __hyperappHmrCreate(import.meta.hot);\n`,
      )
      output.overwrite(
        calls[0].start,
        code.indexOf('(', calls[0].end) + 1,
        '__hyperappHmr.mount(app, ',
      )
      output.append('\nimport.meta.hot.accept();\nimport.meta.hot.dispose(__hyperappHmr.dispose);\n')
      return { code: output.toString(), map: output.generateMap({ hires: true }) }
    },
  }
}
