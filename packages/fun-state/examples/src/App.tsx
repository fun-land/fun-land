import React, { FC } from 'react'
import { Counter, initialCounterState, CounterState } from './Counter'
import useFunState from '../../src/useFunState'
import TodoApp from './TodoApp/TodoApp'
import { prop } from 'accessor-ts'

interface AppState {
  count: CounterState
}

const initialState: AppState = {
  count: initialCounterState
}

/** App components should be the only things that instantiate state */
const App: FC = () => {
  const funState = useFunState(initialState)

  // We're bootstrapping the Counter's state to the root as an example but it's not strictly necessary.
  return (
    <div>
      <TodoApp />
      <Counter {...funState.prop('count')} />
    </div>
  )
}

export default App
