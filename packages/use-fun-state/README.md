<p align="center"><img src="docs/logo.svg" alt="" width="100" /></p>
<h1 align="center">useFunState</h1>

@fun-land/use-fun-state is a React.js hook for doing fractal, compositional state in a way that is type-safe,
testable, and easy to refactor.

# Getting Started

useFunState works with any react 16.8+ application. Usage without TypeScript works but isn't recommended.

### npm

`npm install -S @fun-land/accessor @fun-land/fun-state @fun-land/use-fun-state`

### yarn

`yarn add @fun-land/accessor @fun-land/fun-state @fun-land/use-fun-state`

# Why create another React state-management library?

React's useState hook eliminated a lot of the need to have a state-management solution but I still ran into a number of problems that I didn't like:

1. Too many `useState` calls in my application each of which created two values to manage.
2. I found it difficult to write unit tests for code using useState in a way that felt clean.
3. Using useState was bloating the size of my functional components and it was hard to refactor the functionality out (esentially requiring custom hooks which are themselves hard to unit test.)
4. Having a lot of useState instances meant I had to pass tons of values and callbacks down to child components.

What I wanted:

1. Rather than adding indirection of actions and reducers I wanted to be able to just set the state in event handlers without shame
2. To bundle the concept of setter and current value up so that it can be passed to helper functions as well as child components.
3. Make it easy to drill down into the state and pass subsets of it to functions and child components.
4. Make it easy to write unit tests for components or functions that use the bundled state without mocking react dependencies.
5. Maintain good type-safety with typescript so that refactoring is a breeze.

I looked at many state-management libraries out there and they seemed to have too-much-magic or too-much-boilerplate or both, and still didn't nail all of my goals. I was able to leverage my experience with functional programming and optics to create a pattern that I think is pretty simple while still supporting an enormous number of complex cases. FunState is impure and the types are not quite bullet-proof but it's easy to write most of your code in a testable way and have high confidence that you're not going to have runtime errors.

# Brief Example

```ts
import useFunState from '@fun-land/use-fun-state'

// Type definition for state.
interface CounterState {
  count: number
}

// initial value for the state
const initialCounterState: CounterState = {
  count: 0
}

export const Counter: React.FC = () => {
  // Create the FunState instance wrapping your state
  const state = useFunState(initialCounterState)
  // you can use .prop to focus a child property of a state
  const countState = state.prop('count')
  // Similar to useState you can just set directly (via .set) or apply function to the current value
  const onClick = (): void => countState.mod((count) => count + 1)

  // Extract the current value from the state with .get()
  return <button onClick={onClick}>{countState.get()}</button>
}
```

# More examples

See [fun-state-examples](https://github.com/fun-land/fun-land/tree/main/packages/fun-state-examples) for a sample standalone application using vite.

# When to useFunState

- You have more than a couple useState calls in a component.
- When you're in a situation where you would gain benefit from redux or other state-managment libraries.
- You want composable/modular state
- You want to gradually try out another state management system without fully converting your app.

# When not to useFunState

- When you just have a single state value.
- You're avoiding or can't use React Hooks.

# Tips

- Keep your FunState Apps simple and delegate the complex logic to pure child components, using `.prop()` where practical.
- Drill down into deep parts of your tree using .focus in conjunction with `Accessors`. See `./TodoApp` or [@fun-land/accessor docs](https://github.com/fun-land/fun-land/blob/main/packages/accessor) for examples.
- If child components need data from multiple places in the state tree, you can create and pass more than one FunState or just pass the root and then focus to what you need.

# API

## useFunState

```ts
;<State>(initialState: State) => FunState<State>
```

Creates an react-hooks based [FunState](../fun-state)</a> instance with a starting state.

## bindValue

```ts
;<T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
  state: FunState<string>,
  onChange?: ChangeEventHandler<T>
) => {
  value: string
  onChange: ChangeEventHandler<T>
}
```

Bind `FunState<string>` to the value property of `input[type=text]`, `textarea`, or `select` elements.

```tsx
const Name = () => {
  const state = useFunState('')
  return <input type="text" {...bindValue(state)} />
}
```

## bindChecked

```ts
;<T extends HTMLInputElement>(state: FunState<boolean>, onChange?: ChangeEventHandler<T>) => {
  checked: boolean
  onChange: ChangeEventHandler<T>
}
```

Bind `FunState<boolean>` to the checked property of `input[type=radio]` or `input[type=checkbox]` elements.

```tsx
const Cool = () => {
  const state = useFunState(false)
  return <input type="radio" {...bindChecked(state)} />
}
```

## FunState?

See [@fun-land/fun-state](../fun-state)</a>.

## Accessor?

Used by `FunState:query` and `FunState:focus` for operating on more complex structures. See [@fun-land/accessor](../accessor).
