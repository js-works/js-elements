import { State, Store, UIEvent } from './types'

export { createEvent, initStore }

function createEvent<T extends string, D = null>(
  type: T,
  detail?: D
): UIEvent<T, D> {
  return new CustomEvent(type, {
    detail: detail || null,
    bubbles: true,
    composed: true
  }) as any
}

// === store =========================================================

type InitStoreResult<S extends State> = [
  Store<S>,
  (fn: (state: S) => S) => void,
  () => S
]

function initStore<S extends State>(initialState: S): InitStoreResult<S>

function initStore<S extends State>(
  name: string,
  initialState: S
): InitStoreResult<S>

function initStore<S extends State>(arg1: any, arg2?: any): InitStoreResult<S> {
  let state: S = typeof arg1 === 'string' ? arg2 : arg1
  let subscribers: ((() => void) | null)[] = []
  let notifying = false
  let unsubscribedWhileNotifying = false
  let destroyed = false

  const name = typeof arg1 === 'string' ? arg1 : '' // TODO
  const getState = () => state

  const setState = (fn: (state: S) => S) => {
    state = Object.assign({}, state, fn(state)) // TODO

    if (notifying) {
      throw new Error('Not allowed to set state while store is notifying')
    }

    const subscriberCount = subscribers.length
    unsubscribedWhileNotifying = false

    try {
      for (let i = 0; i < subscriberCount; ++i) {
        const subscriber = subscribers[i]

        if (subscriber) {
          subscriber()
        }
      }

      if (unsubscribedWhileNotifying) {
        subscribers = subscribers.filter((it) => it !== null)
      }
    } finally {
      unsubscribedWhileNotifying = false
      notifying = false
    }
  }

  const store: Store<S> = {
    getState,

    dispatch(ev: any) {},

    subscribe(subscriber) {
      const sub = subscriber.bind(null)
      let unsubscribed = false

      subscribers.push(sub)

      return () => {
        if (unsubscribed) {
          return
        }

        const idx = subscribers.findIndex((it) => it === sub)

        if (notifying) {
          unsubscribedWhileNotifying = true
          subscribers[idx] = null
        } else {
          subscribers.splice(idx, 1)
        }

        unsubscribed = true
      }
    },

    destroy() {
      if (!destroyed && typeof state.destroy === 'function') {
        state.destroy()
        destroyed = true
      }
    }
  }

  return [store, setState, getState]
}
