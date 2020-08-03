import { defineElement, html, prop } from '../../main/index'

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

  init(c, props) {
    const [state, setState] = c.addState({
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
  const counterRef = c.createElementRef()
  const onSetTo0 = () => counterRef.current.reset(0)
  const onSetTo100 = () => counterRef.current.reset(100)

  return () => html`
    <div>
      <h3>Complex counter demo</h3>
      <complex-counter *ref=${counterRef.bind}></complex-counter>
      <br />
      <button @click=${onSetTo0}>Set to 0</button>
      <button @click=${onSetTo100}>Set to 100</button>
    </div>
  `
})
