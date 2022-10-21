import {useState, useMemo, useRef, ChangeEventHandler} from 'react'
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

/**
 * bind state to value property of `input[type=text]`, `textarea`, or `select` elements
 * @param state FunState to use for the binding
 * @param [onChange] optional other onChange handler to also call onChange
 * @returns properties to spread onto a input or textarea element
 * @example
 *   const Name = () => {
 *     const state = useFunState('');
 *     return <input type="text" {...bindValue(state)} />
 *   }
 */
export const bindValue = <T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
  state: FunState<string>,
  onChange?: ChangeEventHandler<T>
): {value: string; onChange: ChangeEventHandler<T>} => ({
  value: state.get(),
  onChange: (e): void => {
    onChange?.(e)
    state.set(e.currentTarget.value)
  }
})

/**
 * bind state to checked property of `input[type=radio]` or `input[type=checkbox]` elements
 * @param state FunState to use for the binding
 * @param [onChange] optional other onChange handler to also call onChange
 * @returns properties to spread onto a input or textarea element
 * @example
 *   const Cool = () => {
 *     const state = useFunState(false);
 *     return <input type="radio" {...bindChecked(state)} />
 *   }
 */
export const bindChecked = <T extends HTMLInputElement>(
  state: FunState<boolean>,
  onChange?: ChangeEventHandler<T>
): {checked: boolean; onChange: ChangeEventHandler<T>} => ({
  checked: state.get(),
  onChange: (e): void => {
    onChange?.(e)
    state.set(e.currentTarget.checked)
  }
})
