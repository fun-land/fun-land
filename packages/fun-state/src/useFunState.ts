import {useState, useMemo, useRef} from 'react'
import {pureState, FunState} from './FunState'

/** Create react-hooks-based FunState */
export default function useFunState<State>(initialState: State): FunState<State> {
  // create the mutable state engine
  const ref = useRef(initialState)
  // creating an unused react state engine just to get rerender to happen when state changes
  const [_, setState] = useState(initialState)
  return useMemo(
    () =>
      pureState({
        getState: () => ref.current,
        modState: (f) => {
          ref.current = f(ref.current)
          setState(ref.current)
        }
      }),
    [ref]
  )
}
