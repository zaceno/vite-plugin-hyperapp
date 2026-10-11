import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import hyperapp from '../dist/index.js'

export function createFixtureServer(options = {}) {
  return createServer({
    root: fileURLToPath(new URL('.', import.meta.url)),
    configFile: false,
    plugins: [hyperapp(options)],
    server: { middlewareMode: true, hmr: false },
  })
}
