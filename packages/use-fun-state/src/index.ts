import {useState, useMemo, useRef} from 'react'
import {pureState, FunState} from '@fun-land/fun-state'

const id = <T>(x: T): T => x

/** Create react-hooks-based FunState */
export default function useFunState<State>(
  initialState: State,
  globalMod: (state: State) => State = id
): FunState<State> {
  // create the mutable state engine
  const ref = useRef(initialState)
  // creating an unused react state engine just to get rerender to happen when state changes
  const [_, setState] = useState(initialState)
  return useMemo(
    () =>
      pureState({
        getState: () => ref.current,
        modState: (f) => {
          ref.current = globalMod(f(ref.current))
          setState(ref.current)
        }
      }),
    [ref]
  )
}
