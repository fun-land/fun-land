import {useState} from 'react'
import {P2} from './fun'
import {Accessor, head, comp, set, prop} from './accessor'

export type Updater<State> = (transform: (state: State) => State) => void

/**
 * Intentionally similar to the signature of useState
 */
export interface FunState<State> {
  state: State
  mod: Updater<State>
  query: <A>(acc: Accessor<State, A>) => A[]
  set: <A>(acc: Accessor<State, A>) => (val: A) => void
  setKey: <K extends keyof State>(key: K) => (val: State[K]) => void
  sub: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>
}

/**
 * Small modification on React.useState that makes state more fractally composable
 */
export default function useFunState<State>(initialState: State): FunState<State> {
  const [state, setState] = useState(initialState)
  const modState: Updater<State> = f => setState(f(state))
  const _set = <A>(acc: Accessor<State, A>) => (v: A): void => modState(set(acc)(v))
  const props = prop<State>()
  const fs: FunState<State> = {
    state,
    mod: modState,
    query: acc => acc.query(state),
    set: _set,
    setKey: P2(props, _set),
    sub: <SubState>(acc: Accessor<State, SubState>): FunState<SubState> => subState(fs)(acc)
  }
  return fs
}

/**
 * Create a FunState focused on a child key of the passed FunState
 */
const subState = <ParentState>({state, mod: modState}: FunState<ParentState>) => <ChildState>(
  accessor: Accessor<ParentState, ChildState>
): FunState<ChildState> => {
  const _set = <A>(acc: Accessor<ChildState, A>) => (v: A) => modState(set(comp(accessor, acc))(v))
  const props = prop<ChildState>()
  const fs: FunState<ChildState> = {
    state: head(accessor.query(state)),
    mod: P2(accessor.mod, modState),
    query: acc => comp(accessor, acc).query(state),
    set: _set,
    setKey: P2(props, _set),
    sub: <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> => subState(fs)(acc)
  }
  return fs
}
