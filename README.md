# Vite Hyperapp Plugin

Use Vite 8 to develop and build Hyperapp apps, with support for JSX/TSX, HMR and SSR.

## Get started

In a Vite project, install `hyperapp` as a dependency and `vite-plugin-hyperapp` as a development-dependency: 

```sh
npm install hyperapp
npm install -D vite vite-plugin-hyperapp
```

> If you intend to use SSR, you will want to install `vite-plugin-hyperapp` as a regular dependency since the server needs to `import {renderToString} from 'vite-plugin-hyperapp/ssr'`

Add the plugin to your Vite config:

```js
// vite.config.js
import { defineConfig } from 'vite'
import { hyperapp } from 'vite-plugin-hyperapp'

export default defineConfig({
  plugins: [hyperapp()],
})
```

Here is a small app to try it with:

```html
<!-- index.html -->
<main id="app"></main>
<script type="module" src="/src/main.jsx"></script>
```

```jsx
// src/main.jsx
import { app } from 'hyperapp'

const Increment = (state) => ({ count: state.count + 1 })

const view = (state) => (
  <main id="app">
    <button onclick={Increment}>Count: {state.count}</button>
  </main>
)

const node = document.getElementById('app')
if (!node) throw new Error('Mount node not found')

app({
  init: { count: 0 },
  view,
  node,
})
```

## Views in JSX or TSX

You are free to use hyperapp's built-in `h()` and `text()`, or `@hyperapp/html` or any other view authoring system you prefer. 

But if you want to use JSX, you can do so with no extra config. Just make sure to name every file where you use JSX with the extension `.jsx` (or `.tsx` if you are using Typescript).

### Component children

Unlike the old standard, the JSX support of this plugin now follows the modern convention of putting `children` as a property of components, rather than a second argument.

```jsx
function Panel({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

const view = (state) => (
  <main id="app">
    <Panel title="Welcome"><p>{state.message}</p></Panel>
  </main>
)
```
### Fragments

The JSX support comes with support for fragments (`<>...</>`) - allowing components to return an array of nodes.

```jsx

function Items({items}) {
  return (
    <>
    {items.map(txt => <li>{txt}</li>)}
    </>
  )
}

function List({items}) {
  return (
    <ul>
      <li>Always First</li>
      <Items items={items} />
      <li>Always Last</li>
    </ul>
  )
}

<List items={['a', 'b', 'c']} />
/* ==>
  <ul>
    <li>Always First</li>
    <li>a</li>
    <li>b</li>
    <li>c</li>
    <li>Always Last</li>
  </ul>
*/
```

> Note: Hyperapp requires the top node of the view to ***not*** be a fragment.

### Using TypeScript (TSX)

If you use TypeScript, use the file extension `.tsx` rather than `.jsx`.

You will also need to configure TypeScript to recognize the JSX runtime in your `tsconfig.json`, by adding the following to your `compilerOptions`:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "vite-plugin-hyperapp/jsx"
  }
}
```

For components that accept children, type the children as `Child` – a convenience type exported from the runtime:

```tsx
import type { Child } from 'vite-plugin-hyperapp/jsx/jsx-runtime'

function Panel({ title, children }: { title: string; children?: Child }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}
```

## Hot module reloading

Hot Module Reloading is on by default in the dev server, when using this plugin. It means that any changes to your app will be reloaded *without clearing the state*. That lets you navigate to a particular view and develop it with live updates – and because the state does not change, you don't have to navigate back to the view to see your changes – you are already there!

For HMR to work, some simple rules need to be observed:

- In your main client side entry, import `app` from `hyperapp` *without renaming it* – e.g. do *not* `import  {app as hyperApp} ...`
- Use an id to identify the app mountpoint in the html entrypoint, and make sure to use the exact same tag ***and id*** for the top vnode of your view.
- Any kind of logic you put outside of `app()` risks being rerun every HMR so keep your app logic contained to the properties you pass to app (`init`, `subscriptions`, `dispatch`).

If HMR is giving you grief, simply disable it by setting the `hmr` option to `false` in the plugin options: 


```js
// vite.config.js
import { defineConfig } from 'vite'
import { hyperapp } from 'vite-plugin-hyperapp'

export default defineConfig({
  plugins: [hyperapp({
    hmr: false
  })],
})
```


## Server-side rendering

Server-side rendering is when the server sends your app's initial view already fully rendered as HTML. Since Hyperapp recycles existing nodes (as long as they match the initial view), your initial view will be rendered even while your app is still loading, improving perceived performance.

See [Vite's SSR guide](https://vite.dev/guide/ssr) for setting up a server and
client entry. 

This plugin exports `renderToString` from
`vite-plugin-hyperapp/ssr`. Import it in your server entry to render the
initial view to an HTML string:

```js
// src/entry-server.js
import { renderToString } from 'vite-plugin-hyperapp/ssr'
import { init, view } from './app.jsx'

//...

let html = readFileSync('./index.html.template', 'utf-8')
html = html.replace(
  '<!--ssr-outlet-->,
  () => renderToString({init, view })
) 

//... respond with html

```

### How to avoid calling browser APIs server-side

Since you pass the same `init` to your server rendering as you pass to your client side app (in order to get the same initial view), there is a danger if your init runs effects that depend on browser-only APIs. 

To avoid this, use the `import.meta.env.SSR` environment variable in your init action, to opt out of browser-only effects when in SSR:

```js
// src/app.jsx
const focusInput = () => document.querySelector('#new-item')?.focus()

export const init = () => [
  {items: []},
  !import.meta.env.SSR && focusInput //effect won't run in SSR
]
```

> Note: this only matters for the init action. renderToString does not run subscriptions, nor other actions - unless an init effect dispatches them.


### Initializing your app with data

A common requirement is to initialize one's app with some preloaded data. Let's say, for example, you have a shopping cart and want to start the app with the cart items for the logged in user. 

```js
//src/entry-server.js

// check auth header and get the logged in user
const user = await auth.checkLogin()

// get the users existing cart items:
const cartItems = await db.getCartItemsForUser(user)

// ... now, how do we send this data, along with the app
// to the client?

```

In order to ensure that the server and client both produce the same initial DOM structure, we must ensure they are initialized the same way with the same data. Here is a simple pattern for that:


#### Step 1 – Make the init action accept initialization data.

```js
//app.jsx
export const init = (
  _,
  {user, cartItems}={user:null, cartItems:[]}
) => ({
  //...a bunch of other initial state,
  cartItems, user
})
```

#### Step 2 - Pass the data as payload to init on the server

```js
// src/entry-server.js
// ...

let html = readFileSync('./index.html.template', 'utf-8')

html = html.replace(
  '<!--ssr-outlet-->',
  () => renderToString({init: [init, {user, cartItems}], view })
) 
```

#### Step 3 - Serialize the data into the html response

This way the same data will be available in the client when the app starts up. 

```js
// src/entry-server.js

//...

//html-safe json serialization
const json = JSON
  .stringify({user, cartItems})
  .replace(
    /[<>&\u2028\u2029]/g,
    character => ({
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
      '\u2028': '\\u2028',
      '\u2029': '\\u2029',
    })[character]
  )

html = html.replace(
  '<!--initial-data-->',
  () => `<script>window.initialData=${json};</script>`
)
```

(The HTML template might look like this)
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
  </head>
  <body>
    <!--initial-data-->
    <!--ssr-outlet-->
    <script type="module" src="/src/entry-client.js"></script>
  </body>
</html>

```


#### Step 4 - Use the initial data in client app init

Wherever you start up your app in the client (in this example `entry-client.js`), pass along the data embedded in the page.

```js
// src/entry-client.js
import {app} from 'hyperapp'
import {init, view} from './app.jsx'
app({
  init: [init, window.initialData],
  view,
  node: document.getElementById('app')
})

```

## Safari TSX source maps

If Safari Web Inspector doesn't show your original TSX under the transformed
module, enable the optional development workaround:

```js
// vite.config.js
export default defineConfig({
  plugins: [hyperapp({ safariExternalSourcemaps: true })],
})
```

It makes Safari load Vite's external `.tsx.map` rather than an inline map.
Safari shows the generated JS as the parent source and the original TSX below
it. Chrome and production output are unchanged. This option is off by default;
ordinary `.ts` files don't need it.
