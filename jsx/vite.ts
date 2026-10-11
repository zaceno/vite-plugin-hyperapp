import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

// The JSX import source points at this folder's standard automatic runtime files.
export function hyperappJsx(): Plugin {
  return {
    name: 'local:hyperapp-jsx',
    config() {
      return {
        oxc: {
          jsx: { runtime: 'automatic', importSource: 'vite-plugin-hyperapp/jsx' },
        },
        resolve: {
          alias: {
            'vite-plugin-hyperapp/jsx': fileURLToPath(new URL('.', import.meta.url)),
          },
        },
      }
    },
  }
}
