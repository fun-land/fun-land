import {mergeInto} from './fun'
import {Accessor, comp, set, prop, flow} from '@fun-land/accessor'

export type Updater<State> = (transform: (state: State) => State) => void

type UnpackState<FS> = FS extends FunState<infer State> ? State : never

export const merge = <FState extends FunState<any>>(fs: FState) => (part: Partial<UnpackState<FState>>): void =>
  fs.mod(mergeInto(part))

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
 * Create a FunState instance from a StateEngine
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
    prop: flow(prop<State>(), focus)
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
  const _mod = flow(accessor.mod, modState)
  const focus = <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> =>
    subState({getState: _get, modState: _mod}, acc)
  const _prop = flow(props, focus)
  return {
    get: _get,
    query: <A>(acc: Accessor<ChildState, A>): A[] => comp(accessor, acc).query(getState()),
    mod: _mod,
    set: flow(set(accessor), modState),
    focus,
    prop: _prop
  }
}

/**
 * Simple StateEngine that is just based on a single mutible variable. Primarilly used for unit testing.
 */
export const standaloneEngine = <State>(initialState: State): StateEngine<State> => {
  let state: State = initialState
  const getState = (): State => state
  const modState: Updater<State> = (f): void => {
    state = f(getState())
  }
  return {getState, modState}
}

/**
 * create a FunState instance without react hooks. Primarily useful for unit testing.
 */
export const mockState = <State>(initialState: State): FunState<State> =>
  pureState(standaloneEngine<State>(initialState))

/**
 * @deprecated renamed to `mockState`
 */
export const funState = mockState
