
# Vite Hyperapp Plugin & Starter

Use vite as a dev-server and bundler for your hyperapp projects. Supports:

- Views in JSX/TSX
- Hot module reloading (HMR)
- Server-side rendering (SSR)

## Get Started

To get up and running with Hyperapp and Vite in a few seconds, use [create-vite-hyperapp](https://github.com/zaceno/create-vite-hyperapp):

```sh
> npm create vite-hyperapp
```

> Use `npm create vite-hyperapp -- --help` for some command line options.

The starter will ask you for a folder in which to scaffold the project, and it will also ask if you would like to use typescript and/or SSR.


### Manual setup

In case you want to install manually, you need a project folder with `vite` installed, and a `vite.config.js` ready to go. Then you can install the vite-plugin for hyperapp, and enable it in the config:

```sh
> npm install vite-plugin-hyperapp
```

```js
// vite.config.js
import { defineConfig } from "vite"
import hyperapp from "vite-plugin-hyperapp"

export default defineConfig({
  plugins: [hyperapp()],
})
```
> Options are passed as an object to `hyperapp({...})`. Available options described below.

In order to enable build TSX files to build, please add the following options to `compilerOptions` in your `tsconfig.json`:

```json
/* Necessary for tsx to work with vite-plugin-hyperapp */
"jsx": "preserve",
"jsxFactory": "jsx",
"jsxFragmentFactory": "jsxFragment"
```

and to make sure your editor's TS language server picks up the right types for JSX/TSX,
add this line in your `src/vite-env.d.ts`:

```
/// <reference types="vite-plugin-hyperapp/jsx" />
```

## JSX/TSX 

Our JSX/TSX works the same as React/Preact, however, note that when you pass children to a component, like:

```jsx
<MyComponent>
  <p>foo</p>
  <p>bar</p>
</MyComponent>
```

they will arrive as an array of virtual nodes in the _second_ argument to the component.

```jsx
const MyComponent = (props, children) => {
  //children will be: [<p>foo</p>, <p>bar</p>]
}
```

It's ok to put this array of children among other children, because the jsx transform will flatten the child-list:

```jsx
const MyComponent = (props, children) => (
  <div>
    <h1>Header</h1>
    {children} {/* <--- this is fine */}
  </div>
)
```

## Hot-module-reloading (HMR)

> The following is taken care of already, when you scaffold your app with `npm create vite-hyperapp`, but it is useful to be aware of

For hot-module-reloading to work, the plugin injects some code in the module where you initiate the app. In order for this to work, the app-initiation module must follow these two rules:

1. It must import `app` from `"hyperapp"` using named imports (i.e. with `{..app...}`, not `*`
2. The dispatch function returned from the app-call must be exported as a _named_ (not default) export.

By default, HMR expects the exported dispatch function to be named `dispatch`. If you choose to name it something else, let the plugin know by providing it to the plugin options: 

```js
//vite.config.js
export default defineConfig({
  plugins: [hyperapp({
    dispatchExport: "myDispatchAlias"
  })],
})
```

And if you'd rather use Vite's HMR api directly, or forego HMR entirely, you can use set that as an option in the plugin as well:

```js
//vite.config.js
export default defineConfig({
  plugins: [hyperapp({
    hmr: false
  })],
})
```

## Server-side Rendering (SSR)

Server side rendering with Vite in general is described here: https://vitejs.dev/guide/ssr.html#server-side-rendering Below are some important details specific to Hyperapp and this plugin.

> When you use `npm create vite-hyperapp` to scaffold a project with SSR, these details are set up for you. But they're useful to be aware of as you build out your app.

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

> It is important that the server-entry module has `import ... from 'vite-plugin-hyperapp/ssr'` somewhere in it, in order for HMR to continue working on SSR enabled apps.

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

