import {useState} from 'react'
import {pipe} from './fun'
import {Accessor, comp, set, prop} from 'accessor-ts'

export type Updater<State> = (transform: (state: State) => State) => void

const _merge = <State>(part: Partial<State>) => (s: State): State => ({...s, ...part})

type UnpackState<FS> = FS extends FunState<infer State> ? State : never

export const merge = <FState extends FunState<any>>(fs: FState) => (part: Partial<UnpackState<FState>>): void =>
  fs.mod(_merge(part))

export interface FunState<State> {
  state: State
  /** Query the state using an accessor */
  query: <A>(acc: Accessor<State, A>) => A[]
  /** Get the state */
  get: () => State
  /** Transform the state with the passed function */
  mod: Updater<State>
  /** Replace the state (sugar over `mod(K(v))`) */
  set: (val: State) => void
  /** Create a new FunState focused at the passed accessor */
  focus: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>
  /** focus state at passed key (sugar over `focus(prop(k))`) */
  prop: <K extends keyof State>(key: K) => FunState<State[K]>
}

/**
 * Create a FunState instance
 */
export default function useFunState<State>(initialState: State): FunState<State> {
  const [state, setState] = useState(initialState)
  const modState: Updater<State> = (f) => setState(f(state))
  const props = prop<State>()
  const fs: FunState<State> = {
    state,
    query: (acc) => acc.query(state),
    get: () => state,
    mod: modState,
    set: setState,
    focus: <SubState>(acc: Accessor<State, SubState>): FunState<SubState> => subState(fs)(acc),
    prop: (k) => fs.focus(props(k))
  }
  return fs
}

/**
 * Create a new FunState focused at the passed accessor
 */
const subState = <ParentState>({state, mod: modState}: FunState<ParentState>) => <ChildState>(
  accessor: Accessor<ParentState, ChildState>
): FunState<ChildState> => {
  const props = prop<ChildState>()
  const fs: FunState<ChildState> = {
    state: accessor.query(state)[0],
    get: () => fs.state,
    query: (acc) => comp(accessor, acc).query(state),
    mod: pipe(accessor.mod, modState),
    set: (v) => modState(set(accessor)(v)),
    focus: <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> => subState(fs)(acc),
    prop: (k) => fs.focus(props(k))
  }
  return fs
}
