import { useState } from 'react'
import { P2 } from './fun'
import { Accessor, head, comp, set, prop } from './accessor'

export type Updater<State> = (f: (state: State) => State) => void

/**
 * Intentionally similar to the signature of useState
 */
export interface FunState<State> {
  state: State
  mod: Updater<State>
  query: <A>(acc: Accessor<State, A>) => A[]
  set: <A>(acc: Accessor<State, A>) => (val: A) => void
  setKey: <K extends keyof State>(key: K) => (val: State[K]) => void
}

/**
 * Small modification on React.useState that makes state more fractally composable
 */
export default function useFunState<State>(initialState: State): FunState<State> {
  const [state, setState] = useState(initialState)
  const modState: Updater<State> = f => setState(f(state))
  const _set = <A>(acc: Accessor<State, A>) => (v: A): void => modState(set(acc)(v))
  const props = prop<State>()
  return {
    state,
    mod: modState,
    query: acc => acc.query(state),
    set: _set,
    setKey: P2(props, _set)
  }
}

/**
 * Create a FunState focused on a child key of the passed FunState
 * TODO make key an optic
 */
export const subState = <ChildState, ParentState>(
  accessor: Accessor<ParentState, ChildState>,
  { state, mod: modState }: FunState<ParentState>
): FunState<ChildState> => {
  const _set = <A>(acc: Accessor<ChildState, A>) => (v: A) => modState(set(comp(accessor, acc))(v))
  const props = prop<ChildState>()
  return {
    state: head(accessor.query(state)),
    mod: P2(accessor.mod, modState),
    query: acc => comp(accessor, acc).query(state),
    set: _set,
    setKey: P2(props, _set)
  }
}
