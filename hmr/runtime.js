// Development-only browser runtime. Keep this independent of any particular app.
const stateKey = '__hyperappHmrState'

export function createHmrApp(hot) {
  let dispatch

  return {
    mount(app, props) {
      dispatch = app({
        ...props,
        init: Object.hasOwn(hot.data, stateKey) ? hot.data[stateKey] : props.init,
      })
      return dispatch
    },
    async dispose(data) {
      // Let any already queued Hyperapp render finish before stopping the app.
      await new Promise(resolve => requestAnimationFrame(resolve))
      dispatch(state => (data[stateKey] = state))
      dispatch()
    },
  }
}
