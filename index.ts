import type { Plugin } from 'vite'
import { hyperappJsx } from './jsx/vite.ts'
import { hyperappHmr } from './hmr/vite.ts'
import { safariExternalSourcemapsPlugin } from './safari-sourcemaps/vite.ts'

export type HyperappOptions = {
  hmr?: boolean
  safariExternalSourcemaps?: boolean
}

export function hyperapp(options: HyperappOptions = {}): Plugin[] {
  const plugins = [hyperappJsx()]
  if (options.hmr !== false) plugins.push(hyperappHmr())
  if (options.safariExternalSourcemaps) plugins.push(safariExternalSourcemapsPlugin())
  return plugins
}
