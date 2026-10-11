import { app } from 'hyperapp'
import { view } from './view'

export const dispatch = app({ init: {}, view, node: document.querySelector('#app')! })
