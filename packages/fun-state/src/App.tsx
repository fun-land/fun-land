import React, { FC } from 'react'
import { CounterEl, initialCounterState, CounterState } from './Counter'
import useFunState, { subState } from './lib/useFunState'
import TodoApp from './TodoApp/TodoApp'
import { Readme } from './Readme'
import { prop } from './lib/accessor'

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
      <Readme />
      <TodoApp />
      <CounterEl {...subState(prop<AppState>()('count'), funState)} />
    </div>
  )
}

export default App
