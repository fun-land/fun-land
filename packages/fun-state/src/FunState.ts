import {type Accessor, comp, set, prop, mergeInto, all, index, unit, get as accGet} from '@fun-land/accessor'

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
  /**
   * Extract the value stored as the state.
   * @note This may return undefined if the Accessor would return no results.
   * In those cases it's safer to us .query()
   **/
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
  /** Watch the focused value.
   * @note Like .get(), the callback may receive `undefined` if the Accessor yields no values.
   * Use .watchAll() for the safe, complete view.
   */
  watch: (signal: AbortSignal, callback: Listener<State>) => void
  /** Watch all focused values.
   * Emits the full result of the Accessor (mirrors .query()).
   */
  watchAll: (signal: AbortSignal, callback: (values: State[]) => void) => void
}

/**
 * Create a FunState instance from a StateEngine
 */
export const pureState = <RootState>({getState, modState, subscribe}: StateEngine<RootState>): FunState<RootState> =>
  mkFunState<RootState, RootState>({getState, modState, subscribe}, unit<RootState>())

function mkFunState<RootState, ViewState>(
  engine: StateEngine<RootState>,
  viewAcc: Accessor<RootState, ViewState>
): FunState<ViewState> {
  const select = accGet(viewAcc)

  const _get = (): ViewState => {
    const v = select(engine.getState())
    // unsafe get included for ergonomics but strictly speaking get on traversals may return undefined
    return v as ViewState
  }

  // Query current view using a composed accessor from root.
  const _query = <A>(acc: Accessor<ViewState, A>): A[] => comp(viewAcc, acc).query(engine.getState())

  // Mod the focused view by lifting through the composed accessor into root.
  const _mod: Updater<ViewState> = (f) => engine.modState(viewAcc.mod(f))

  const _set = (val: ViewState): void => engine.modState(set(viewAcc)(val))

  const _focus = <SubState>(acc: Accessor<ViewState, SubState>): FunState<SubState> => {
    // Compose accessors: root -> view -> subview
    return mkFunState(engine, comp(viewAcc, acc))
  }

  const _prop = <K extends keyof ViewState>(key: K): FunState<ViewState[K]> => {
    return _focus(prop<ViewState>()(key))
  }

  const _watch = (signal: AbortSignal, callback: Listener<ViewState>): void => {
    let last = select(engine.getState())
    callback(last as ViewState)

    const unsubscribe = engine.subscribe((rootState) => {
      const next = select(rootState)
      if (!Object.is(next, last)) {
        last = next
        callback(next as ViewState)
      }
    })

    signal.addEventListener('abort', unsubscribe, {once: true})
  }

  const _watchAll = (signal: AbortSignal, callback: (values: ViewState[]) => void): void => {
    let last = viewAcc.query(engine.getState())
    callback(last)

    const unsubscribe = engine.subscribe((rootState) => {
      const next = viewAcc.query(rootState)

      if (last.length !== next.length || next.some((v, i) => !Object.is(v, last[i]))) {
        last = next
        callback(next)
      }
    })

    signal.addEventListener('abort', unsubscribe, {once: true})
  }

  return {
    get: _get,
    query: _query,
    mod: _mod,
    set: _set,
    focus: _focus,
    prop: _prop,
    watch: _watch,
    watchAll: _watchAll
  }
}

/**
 * Simple StateEngine that is based on a single mutible variable.
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
