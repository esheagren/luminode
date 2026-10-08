// A tiny module-level store so pane edits survive switching panes (each pane remounts on its tab).
// State lives for the session only; nothing is persisted.
import { useSyncExternalStore } from 'react'

export function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? next(state) : next
      listeners.forEach((fn) => fn())
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
