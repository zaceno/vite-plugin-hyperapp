# vite-plugin-hyperapp

Use vite as a dev-server and bundler for your hyperapp projects. Supports:

- Views in JSX/TSX
- Hot module reloading (HMR)
- Server-side rendering (SSR)

## Quickstart

To get up and running with Hyperapp and Vite in a few seconds, use [create-vite-hyperapp](https://github.com/zaceno/create-vite-hyperapp):

```sh
> npm create vite-hyperapp
```

This will set you up with all the necessary configuration described below.

## Config

To manually set up your vite-project for use with Hyperapp, install this plugin:

```sh
> npm install vite-plugin-hyperapp
```

And add it to the plugins in your `vite.config.js`:

```
import { defineConfig } from "vite"
import hyperapp from "vite-plugin-hyperapp"

export default defineConfig({
  plugins: [hyperapp()],
})
```

You can pass an options object to the plugin, e.g:

```
  plugins: [hyperapp({
    optionA: 'foo',
    optionB: 'bar',
  })]
```

...but most of the time you won't need it. See "Hot-module-reloading" below for some options that might be relevant.

## Typescript

To make sure you get proper typing support in your `.tsx` files, make sure to add these compiler options to your `tsconfig.json`:

```
/* Necessary for tsx to work with vite-plugin-hyperapp*/
"jsx": "preserve",
"jsxImportSource": "vite-plugin-hyperapp"
```

## Hot-module-reloading (HMR)

For hot-module-reloading to work, the plugin injects some code in the module where you initiate the app. It only works if the module follows these two rules:

- It must contain:

```js
import {..., app [as something],...} from 'hyperapp'
```

- It must _export_ a _named_ (not default) constant/variable `dispatch`, which should be the function retuned from calling `app({...})`.

If you'd rather name the `dispatch` export something else, you can tell the plugin the name you're using as a plugin option: `dispatchExport: "myPreferredName"`

And if you'd rather use Vite's HMR api directly, or forego HMR entirely, you can use the plugin option: `hmr: false`

## Server-side Rendering (SSR)

Generally, in order to set up SSR in your project you can follow Vite's instructions here: [https://vitejs.dev/guide/ssr.html#server-side-rendering](https://vitejs.dev/guide/ssr.html#server-side-rendering)

Here are some specifics you'll need to know when using hyperapp and this plugin:

### Redering your initial app to raw html

This plugin provides a function exported from `vite-plugin-hyperapp/ssr`, which can render your initial app as static html.

For example:

```js
import { init, view } from "./main"
import renderApp from "vite-plugin-hyperapp/ssr"
export async function render() {
  return await renderApp({ init, view })
}
```

`renderApp` is an async function that takes the same options object as `hyperapp.app` - except the `node` option - and returns a promise which resolves to the html-string.

Note: it is important that the server-entry module has `import ... from 'vite-plugin-hyperapp/ssr'` somewhere in it, in order for HMR to continue working on SSR enabled apps.

### Mountpoint defined by the view

Unlike many other framework, Hyperapp _replaces_ the given mount-node with the root node rended from the view.

This means that if your non-ssr `index.html` has this:

```html
<p>Static html here</p>
<div id="app"></div>
<p>More static html</p>
```

and you start your app like this:

```js
app({
  ...,
  node: document.querySelector('#app')
})
```

Then you _DON'T_ add your ssr outlet like this:

```html
<p>Static html here</p>
<div id="app">
  <!--ssr-outlet-->
</div>
<p>More static html</p>
```

...but rather like this:

```html
<p>Static html here</p>
<!--ssr-outlet-->
<p>More static html</p>
```

And you make sure that the root-node of your view has `id="app"`.
