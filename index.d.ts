import { type PluginOption } from "vite"

export interface HyperappPluginOptions {
  hmr?: boolean
  dispatchExport?: string
}

export default function hyperapp(
  options?: HyperappIntegrationOptions,
): PluginOption
