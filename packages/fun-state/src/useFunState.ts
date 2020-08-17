import {useState} from 'react'
import {pipe} from './fun'
import {Accessor, comp, set, prop} from 'accessor-ts'

export type Updater<State> = (transform: (state: State) => State) => void

/**
 * Intentionally similar to the signature of useState
 */
export interface FunState<State> {
  state: State
  /** Transform the state with the passed function */
  mod: Updater<State>
  /** Query the state using an accessor */
  query: <A>(acc: Accessor<State, A>) => A[]
  /** Set the state at the passed accessor */
  set: <A>(acc: Accessor<State, A>) => (val: A) => void
  /** Set state at passed key */
  setKey: <K extends keyof State>(key: K) => (val: State[K]) => void
  /** Create a new FunState focused at the passed accessor */
  sub: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>
}

/**
 * Create a FunState instance
 */
export default function useFunState<State>(initialState: State): FunState<State> {
  const [state, setState] = useState(initialState)
  const modState: Updater<State> = (f) => setState(f(state))
  const _set = <A>(acc: Accessor<State, A>) => (v: A): void => modState(set(acc)(v))
  const props = prop<State>()
  const fs: FunState<State> = {
    state,
    mod: modState,
    query: (acc) => acc.query(state),
    set: _set,
    setKey: pipe(props, _set),
    sub: <SubState>(acc: Accessor<State, SubState>): FunState<SubState> => subState(fs)(acc)
  }
  return fs
}

/**
 * Create a new FunState focused at the passed accessor
 */
const subState = <ParentState>({state, mod: modState}: FunState<ParentState>) => <ChildState>(
  accessor: Accessor<ParentState, ChildState>
): FunState<ChildState> => {
  const _set = <A>(acc: Accessor<ChildState, A>) => (v: A): void => modState(set(comp(accessor, acc))(v))
  const props = prop<ChildState>()
  const fs: FunState<ChildState> = {
    state: accessor.query(state)[0],
    mod: pipe(accessor.mod, modState),
    query: (acc) => comp(accessor, acc).query(state),
    set: _set,
    setKey: pipe(props, _set),
    sub: <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> => subState(fs)(acc)
  }
  return fs
}
