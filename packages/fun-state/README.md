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
}
```

Data structure that holds the state along with a stateful methods that interact with it.

## mockState

```ts
<State>(initialState: State) => FunState<State>
```

Creates a library-agnostic instance of the state machine with a starting state. This is useful when unit testing functions or components that take a FunState instance.

## pureState

```ts
<State>({getState, modState}: StateEngine<State>): FunState<State>
```

Creates an instance of funState given a custom StateEngine. If you want to add support for preact or other libraries with things like hooks you want this.

## Accessor

Used by `FunState:query` and `FunState:focus` for operating on more complex structures. See <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts</a>

## merge

```ts
<State>(fs: FunState<State>) => (part: Partial<State>) => void
```

Mutably merge a partial state into a FunState

# TODO / Contributing

- Give feedback!
- Add performance benchmarks
- File bugs
- Improve documentation
- Add more examples
