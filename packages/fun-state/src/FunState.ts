import {type Accessor, comp, set, prop, flow, mergeInto, all, index} from '@fun-land/accessor'

export type Updater<State> = (transform: (state: State) => State) => void
export type Listener<State> = (state: State) => void
export type Unsubscribe = () => void

type UnpackState<FS> = FS extends FunState<infer State> ? State : never

/** Merge a partial state into a FunState instance */
export const merge =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <FState extends FunState<any>>(fs: FState) =>
  (part: Partial<UnpackState<FState>>): void => {
    fs.mod(mergeInto(part))
  }

/** Convert a FunState holding an array of items into an array of FunState of the item. */
export const extractArray = <A>(state: FunState<A[]>): Array<FunState<A>> =>
  state.query(all<A>()).map((__, i) => state.focus(index(i)))

export interface StateEngine<State> {
  getState: () => State
  modState: Updater<State>
  subscribe: (listener: Listener<State>) => Unsubscribe
}

export interface FunState<State> {
  /** Extract the value stored as the state */
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
  /** Subscribe to state changes with cleanup via AbortSignal */
  subscribe: (signal: AbortSignal, callback: Listener<State>) => void
}

/**
 * Create a FunState instance from a StateEngine
 */
export const pureState = <State>({getState, modState, subscribe}: StateEngine<State>): FunState<State> => {
  const setState = (v: State): void => {
    modState(() => v)
  }
  const focus = <SubState>(acc: Accessor<State, SubState>): FunState<SubState> =>
    subState({getState, modState, subscribe}, acc)

  const subscribeToState = (signal: AbortSignal, callback: Listener<State>): void => {
    const unsubscribe = subscribe(callback)
    signal.addEventListener('abort', unsubscribe, {once: true})
  }

  const fs: FunState<State> = {
    get: getState,
    query: (acc) => acc.query(getState()),
    mod: modState,
    set: setState,
    focus,
    prop: flow(prop<State>(), focus),
    subscribe: subscribeToState
  }
  return fs
}

/**
 * Create a new FunState focused at the passed accessor
 */
const subState = <ParentState, ChildState>(
  {getState, modState, subscribe}: StateEngine<ParentState>,
  accessor: Accessor<ParentState, ChildState>
): FunState<ChildState> => {
  const props = prop<ChildState>()
  const _get = (): ChildState => accessor.query(getState())[0]
  const _mod = flow(accessor.mod, modState)

  function createFocusedSubscribe(): (listener: Listener<ChildState>) => Unsubscribe {
    return (listener) => {
      let lastValue = _get()
      return subscribe((parentState) => {
        const newValue = accessor.query(parentState)[0]
        if (newValue !== lastValue) {
          lastValue = newValue
          listener(newValue)
        }
      })
    }
  }

  const focus = <SubState>(acc: Accessor<ChildState, SubState>): FunState<SubState> =>
    subState({getState: _get, modState: _mod, subscribe: createFocusedSubscribe()}, acc)
  const _prop = flow(props, focus)

  const subscribeToState = (signal: AbortSignal, callback: Listener<ChildState>): void => {
    let lastValue = _get()
    const unsubscribe = subscribe((parentState) => {
      const newValue = accessor.query(parentState)[0]
      if (newValue !== lastValue) {
        lastValue = newValue
        callback(newValue)
      }
    })
    signal.addEventListener('abort', unsubscribe, {once: true})
  }

  return {
    get: _get,
    query: <A>(acc: Accessor<ChildState, A>): A[] => comp(accessor, acc).query(getState()),
    mod: _mod,
    set: flow(set(accessor), modState),
    focus,
    prop: _prop,
    subscribe: subscribeToState
  }
}

/**
 * Simple StateEngine that is just based on a single mutible variable. Primarilly used for unit testing.
 */
export const standaloneEngine = <State>(initialState: State): StateEngine<State> => {
  let state: State = initialState
  const listeners = new Set<Listener<State>>()

  const getState = (): State => state

  const modState: Updater<State> = (f): void => {
    state = f(getState())
    // Notify all listeners
    listeners.forEach((listener) => listener(state))
  }

  const subscribe = (listener: Listener<State>): Unsubscribe => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {getState, modState, subscribe}
}

export const funState = <State>(initialState: State): FunState<State> =>
  pureState(standaloneEngine<State>(initialState))
