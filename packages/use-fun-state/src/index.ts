import {type ChangeEventHandler, useReducer} from 'react'
import {pureState, type FunState} from '@fun-land/fun-state'

/** Create react-hooks-based FunState */
export default function useFunState<State>(initialState: State): FunState<State> {
  // creating an unused react state engine just to get rerender to happen when state changes
  const [state, dispatch] = useReducer((state: State, mod: (s: State) => State) => mod(state), initialState)
  return pureState({
    getState: () => state,
    modState: dispatch
  })
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
