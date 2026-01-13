<p align="center"><img src="docs/logo.svg" alt="" width="100" /></p>
<h1 align="center">Fun-State</h1>

@fun-land/fun-state is a framework-agnostic library for doing fractal, compositional state in a way that is type-safe,
testable, and easy to refactor.

# Getting Started

See [@fun-land/use-fun-state](../use-fun-state) to get started using react hooks.

# API

## FunState

```ts
export interface FunState<State> {
  /** Extract the enclosed immutable State */
  get: () => State

  /** Query the state using an accessor */
  query: <A>(acc: Accessor<State, A>) => A[]

  /** Transform the state with the passed function */
  mod: Updater<State>

  /** Replace the state */
  set: (val: State) => void

  /** Create a new FunState focused at the passed accessor */
  focus: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>

  /** Focus state at passed property key (sugar for `focus(prop(k))`) */
  prop: <K extends keyof State>(key: K) => FunState<State[K]>

  /** watch state changes. Unsubscribes when AbortSignal is triggered */
  watch: (signal: AbortSignal, callback: (state: State) => void) => void
}
```

Data structure that holds the state along with stateful methods that interact with it.

## funState

```ts
<State>(initialState: State) => FunState<State>
```

Creates a standalone FunState instance with the given initial state. This is useful for:
- Unit testing functions or components that take a FunState instance
- Creating state outside of framework hooks (e.g., in vanilla JS/DOM applications)
- Prototyping and quick experiments

```ts
const state = funState({ count: 0, name: "Alice" });

state.get(); // { count: 0, name: "Alice" }
state.set({ count: 1, name: "Alice" });
state.prop("count").mod(n => n + 1);
```

## pureState

```ts
<State>({getState, modState, subscribe}: StateEngine<State>): FunState<State>
```

Creates an instance of FunState given a custom StateEngine. If you want to add support for preact or other libraries with hooks, you want this.

The StateEngine interface:
```ts
interface StateEngine<State> {
  getState: () => State
  modState: (transform: (state: State) => State) => void
  subscribe: (listener: (state: State) => void) => Unsubscribe
}
```

This allows FunState to work with any state management system that can provide these three operations.

## Accessor

Used by `FunState:query` and `FunState:focus` for operating on more complex structures. See [@fun-land/accessor](..//accessor)

## merge

```ts
<State>(fs: FunState<State>) => (part: Partial<State>) => void
```

Mutably merge a partial state into a FunState

## extractArray

```ts
<A>(state: FunState<A[]>): Array<FunState<A>> =>
```

Transform a FunState holding an array of items into an array of FunState of the item. Usefull when you want to pass FunState instances to child components.


### watch

The `watch` method allows you to listen for state changes with automatic cleanup via [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal):

```ts
const state = funState({ count: 0 });
const controller = new AbortController();

// watch value for changes. Emits initial state.
state.watch(controller.signal, (newState) => {
  console.log('State changed:', newState);
});

state.set({ count: 1 }); // Logs: State changed: { count: 1 }

// Cleanup - stops all subscriptions using this signal
controller.abort();

state.set({ count: 2 }); // No log - subscription cleaned up
```

Focused state only notifies when the focused value actually changes:

```ts
const state = funState({ user: { name: "Alice" }, count: 0 });

state.prop("user").prop("name").watch(signal, (name) => {
  console.log('Name changed:', name);
});

state.set({ user: { name: "Alice" }, count: 1 }); // No log - name unchanged
state.set({ user: { name: "Bob" }, count: 1 });   // Logs: Name changed: Bob
```

# TODO / Contributing

- Give feedback!
- Add performance benchmarks
- File bugs
- Improve documentation
- Add more examples
