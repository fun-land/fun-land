import {pipe} from './fun'
import {Accessor, comp, set, prop} from 'accessor-ts'

export type Updater<State> = (transform: (state: State) => State) => void

const _merge = <State>(part: Partial<State>) => (s: State): State => ({...s, ...part})

type UnpackState<FS> = FS extends FunState<infer State> ? State : never

export const merge = <FState extends FunState<any>>(fs: FState) => (part: Partial<UnpackState<FState>>): void =>
  fs.mod(_merge(part))

export interface StateEngine<State> {
  getState: () => State
  modState: Updater<State>
}

export interface FunState<State> {
  get: () => State
  /** Query the state using an accessor */
  query: <A>(acc: Accessor<State, A>) => A[]
  /** Transform the state with the passed function */
  mod: Updater<State>
  /** Replace the state */
  set: (val: State) => void
  /** Create a new FunState focused at the passed accessor */
  focus: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>
  /** focus state at passed key (sugar over `focus(prop(k))`) */
  prop: <K extends keyof State>(key: K) => FunState<State[K]>
}

/**
 * Create a FunState instance
 */
export const pureState = <State>({getState, modState}: StateEngine<State>): FunState<State> => {
  const setState = (v: State): void => modState(() => v)
  const focus = <SubState>(acc: Accessor<State, SubState>): FunState<SubState> => subState({getState, modState}, acc)
  const fs: FunState<State> = {
    get: getState,
    query: (acc) => acc.query(getState()),
    mod: modState,
    set: setState,
    focus,
    prop: pipe(prop<State>(), focus)
  }
  return fs
}

/**
 * Create a new FunState focused at the passed accessor
 */
const subState = <ParentState, ChildState>(
  {getState, modState}: StateEngine<ParentState>,
  accessor: Accessor<ParentState, ChildState>
): FunState<ChildState> => {
  const props = prop<ChildState>()
  const _get = (): ChildState => accessor.query(getState())[0]
  const _mod = pipe(accessor.mod, modState)
  const focus = <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> =>
    subState({getState: _get, modState: _mod}, acc)
  const _prop = pipe(props, focus)
  return {
    get: _get,
    query: <A>(acc: Accessor<ChildState, A>): A[] => comp(accessor, acc).query(getState()),
    mod: _mod,
    set: pipe(set(accessor), modState),
    focus,
    prop: _prop
  }
}

export const standaloneEngine = <State>(initialState: State): StateEngine<State> => {
  let state: State = initialState
  const getState = (): State => state
  const modState: Updater<State> = (f): void => {
    state = f(getState())
  }
  return {getState, modState}
}

export const funState = <State>(initialState: State): FunState<State> =>
  pureState(standaloneEngine<State>(initialState))
