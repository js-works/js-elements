import { defineElement, html, prop } from '../../main/js-elements-lit-html'
import { useState } from '../../main/js-elements-ext'

type CounterMethods = {
  reset(n: number): void
}

defineElement('complex-counter', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter'),
    ref: prop.obj.opt()
  },

  methods: ['reset'],

  main(c, props) {
    const [state, setState] = useState(c, {
      count: props.initialValue
    })

    const onIncrement = () => setState({ count: state.count + 1 })
    const onDecrement = () => setState({ count: state.count - 1 })

    c.setMethods({
      reset(n: number) {
        setState({ count: n })
      }
    })

    c.effect(() => {
      console.log('Component "complex-counter" has been mounted')

      return () => console.log('Component "complex-counter" will be umounted')
    }, null)

    c.effect(
      () => {
        console.log(`Value of counter "${props.label}": ${state.count}`)
      },
      () => [state.count]
    )

    return () => html`
      <div>
        <label>${props.label}: </label>
        <button @click=${onDecrement}>-</button>
        <span>${state.count} </span>
        <button @click=${onIncrement}>+</button>
      </div>
    `
  }
})

defineElement('complex-counter-demo', (c) => {
  const findCounter = () => c.find<CounterMethods>('[data-counter]')!
  const onSetTo0 = () => findCounter().reset(0)
  const onSetTo100 = () => findCounter().reset(100)

  return () => html`
    <div>
      <h3>Complex counter demo</h3>
      <complex-counter data-counter></complex-counter>
      <br />
      <button @click=${onSetTo0}>Set to 0</button>
      <button @click=${onSetTo100}>Set to 100</button>
    </div>
  `
})
