export default function componentActions(initActions, initState = null) {
  return function useActions(c, ...args) {
    let currentImmutableState

    currentImmutableState = initState
      ? Object.assign({}, initState.apply(null, args))
      : args[1]

    const 
      mutableState = { ...currentImmutableState },
      getState = () => currentImmutableState,
      
      updater = update => {
        const unsubscribe = c.beforeUpdate(() => {
          unsubscribe()

          if (typeof update === 'function') {
            currentImmutableState =
              Object.assign({},
                currentImmutableState,
                update(currentImmutableState))
          } else {
            currentImmutableState =
              Object.assign({},
                currentImmutableState,
                update)
          }

          Object.assign(mutableState, currentImmutableState)
        })

        c.update()
      },

      actions = { ...initActions(updater, getState) },
      keys = Object.keys(actions)

    for (let i = 0; i < keys.length; ++i) {
      const
        key = keys[i],
        f = actions[key]

      actions[key] = (...args) => f.apply(null, [getState(), ...args])
    }

    return [actions, mutableState]
  }
}