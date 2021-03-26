import { attr, define, h, Attr } from 'js-element'
import { useState } from 'js-element/hooks'

class CounterProps {
  @attr(Attr.number, true)
  initialCount = 0

  @attr(Attr.string, true)
  label = 'Counter'
}

const Counter = define('simple-counter', CounterProps, (p) => {
  const [s, set] = useState({
    count: p.initialCount
  })

  const onClick = () => set('count', (it) => it + 1)

  return () => (
    <button onClick={onClick}>
      {p.label}: {s.count}
    </button>
  )
})

const CounterDemo = define('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter label="Counter" initialCount={100} />
    </div>
  )
})

export default CounterDemo
