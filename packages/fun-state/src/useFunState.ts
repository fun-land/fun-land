import {useState} from 'react'
import {pureState, FunState} from './FunState'

/** Create react-hooks-based FunState */
export default function useFunState<State>(initialState: State): FunState<State> {
  // create the mutable state engine
  const [current, modState] = useState(initialState)
  return pureState({getState: () => current, modState})
}
