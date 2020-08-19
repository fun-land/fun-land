/** This component's state is managed externally so strictly-speaking it's a stateless functional component  */
import React, { FC, ChangeEventHandler } from 'react'
import { FunState } from '../../src/useFunState'

const inc = (a: number) => a + 1
const dec = (a: number) => a - 1

export type CounterState = number
export const initialCounterState = 0

export const Counter: FC<FunState<CounterState>> = ({ state, mod, set }) => {
  const onCountChange: ChangeEventHandler<HTMLInputElement> = e => {
    const val = +e.currentTarget.value
    if (isFinite(val)) set(val)
  }
  return (
    <div>
      <h1>Counter</h1>
      <span>
        <input value={state} onChange={onCountChange} />
      </span>
      <button onClick={() => mod(inc)}>up</button>
      <button onClick={() => mod(dec)}>down</button>
    </div>
  )
}
