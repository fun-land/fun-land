<p align="center"><img src="docs/logo.svg" alt="" width="100" /></p>
<h1 align="center">useFunState</h1>

@fun-land/use-fun-state is a React.js hook for doing fractal, compositional state in a way that is type-safe,
testable, and easy to refactor.

# 🌱 Getting Started

To work its magic, useFunState needs any React version 16.8 (needs hooks) or above. While you can use it without TypeScript, doing so is not recommended for the best experience.

### npm

`npm install -S @fun-land/accessor @fun-land/fun-state @fun-land/use-fun-state`

### yarn

`yarn add @fun-land/accessor @fun-land/fun-state @fun-land/use-fun-state`

# 🤔 Why create another React state-management library?

While React's useState has its merits, there are some pitfalls:

* Excessive useState calls that increase management overhead.
* Challenges in cleanly unit-testing useState dependent code.
* Bloated functional components due to useState, making refactoring arduous.
* The need to pass many values and callbacks to child components.

Enter useFunState. Here's what it brings to the table:

1. **Direct State Updates**: Sidestep action-reducer indirection. Set the state in event handlers without guilt.
2. **Bundled State Management**: Combine setters and current value, making it easy to pass them to helper functions or child components.
3. **Modular State**: Easily isolate state sections and share them with functions or components.
4. **Enhanced Testability**: Test components without mocking React dependencies.
5. **Type-safe with TypeScript**: Ensure smooth and error-free refactoring.

While many libraries offer similar functionalities, useFunState aims for simplicity, leveraging functional programming and optics to cater to a broad spectrum of complex scenarios. Although it adopts an impure approach, it ensures that the majority of your code is testable and reduces the possibility of runtime errors.

# 🌟 Brief Example

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

See [fun-state-examples](https://github.com/fun-land/fun-land/tree/main/packages/fun-state-examples) for a sample standalone application using vite.

# ❗ Considerations 

**When to useFunState:**

- You have more than a couple useState calls in a component.
- When you're in a situation where you would gain benefit from redux or other state-managment libraries.
- You want composable/modular state
- You want to gradually try out another state management system without fully converting your app.

**When not to useFunState:**

- When you just have a single useState value.
- You're avoiding or can't use React Hooks.

# 💡 Tips

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
