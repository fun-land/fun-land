/** Reactive FunState implementation with subscription support */
import { type Accessor, comp, prop, set, flow } from "@fun-land/accessor";

type Listener<State> = (state: State) => void;

export interface FunWebState<State> {
  /** Extract the value stored as the state */
  get: () => State;
  /** Query the state using an accessor */
  query: <A>(acc: Accessor<State, A>) => A[];
  /** Transform the state with the passed function */
  mod: (transform: (state: State) => State) => void;
  /** Replace the state */
  set: (val: State) => void;
  /** Create a new FunState focused at the passed accessor */
  focus: <SubState>(acc: Accessor<State, SubState>) => FunWebState<SubState>;
  /** Focus state at passed key (sugar over `focus(prop(k))`) */
  prop: <K extends keyof State>(key: K) => FunWebState<State[K]>;
  /** Subscribe to state changes with cleanup via AbortSignal */
  subscribe: (signal: AbortSignal, callback: (state: State) => void) => void;
}

type Unsubscribe = () => void;

interface StateEngine<State> {
  getState: () => State;
  modState: (transform: (state: State) => State) => void;
  subscribe: (listener: Listener<State>) => Unsubscribe; // CHANGED
}
/**
 * Create a reactive FunState instance from a StateEngine
 */
const pureState = <State>(engine: StateEngine<State>): FunWebState<State> => {
  const { getState, modState, subscribe } = engine;

  const setState = (v: State): void => {
    modState(() => v);
  };

  const focus = <SubState>(
    acc: Accessor<State, SubState>
  ): FunWebState<SubState> => subState(engine, acc);

  const subscribeToState = (signal: AbortSignal, callback: Listener<State>): void => {
    const unsubscribe = subscribe(callback);
    signal.addEventListener("abort", unsubscribe, { once: true });
  };

  const fs: FunWebState<State> = {
    get: getState,
    query: (acc) => acc.query(getState()),
    mod: modState,
    set: setState,
    focus,
    prop: flow(prop<State>(), focus),
    subscribe: subscribeToState,
  };

  return fs;
};

/**
 * Create a new FunState focused at the passed accessor
 */
const subState = <ParentState, ChildState>(
  engine: StateEngine<ParentState>,
  accessor: Accessor<ParentState, ChildState>
): FunWebState<ChildState> => {
  const { getState, modState, subscribe } = engine;
  const props = prop<ChildState>();

  const _get = (): ChildState => accessor.query(getState())[0];
  const _mod = flow(accessor.mod, modState);

  const focus = <SubState>(
    acc: Accessor<ChildState, SubState>
  ): FunWebState<SubState> =>
    subState(
      { getState: _get, modState: _mod, subscribe: createFocusedSubscribe() },
      acc
    );

  const _prop = flow(props, focus);

  const subscribeToState = (
    signal: AbortSignal,
    callback: Listener<ChildState>
  ): void => {
    let lastValue = _get();
    const unsubscribe = subscribe((parentState) => {
      const newValue = accessor.query(parentState)[0];
      if (newValue !== lastValue) {
        lastValue = newValue;
        callback(newValue);
      }
    });
    signal.addEventListener("abort", unsubscribe, { once: true });
  };

  function createFocusedSubscribe(): (
    listener: Listener<ChildState>
  ) => Unsubscribe {
    return (listener) => {
      let lastValue = _get();
      return subscribe((parentState) => {
        const newValue = accessor.query(parentState)[0];
        if (newValue !== lastValue) {
          lastValue = newValue;
          listener(newValue);
        }
      });
    };
  }

  return {
    get: _get,
    query: <A>(acc: Accessor<ChildState, A>): A[] =>
      comp(accessor, acc).query(getState()),
    mod: _mod,
    set: flow(set(accessor), modState),
    focus,
    prop: _prop,
    subscribe: subscribeToState,
  };
};

/**
 * Simple StateEngine with subscription support
 */
const standaloneEngine = <State>(initialState: State): StateEngine<State> => {
  let state: State = initialState;
  const listeners = new Set<Listener<State>>();

  const getState = (): State => state;

  const modState = (f: (s: State) => State): void => {
    state = f(getState());
    // Notify all listeners
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener: Listener<State>): Unsubscribe => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, modState, subscribe };
};

/**
 * Create a reactive FunState instance - for testing or standalone usage
 */
export const useFunWebState = <State>(
  initialState: State
): FunWebState<State> => pureState(standaloneEngine<State>(initialState));
