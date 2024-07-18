import { App } from "hyperapp"
declare module "vite-plugin-hyperapp/ssr" {
  export default function (defs: App<any>): Promise<string>
}
