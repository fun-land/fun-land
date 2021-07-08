<p align="center"><img src="docs/logo.svg" alt="" width="100" /></p>
<h1 align="center">useFunState</h1>

@fun-land/use-fun-state is a React.js hook for doing fractal, compositional state in a way that is type-safe,
testable, and easy to refactor.

# Getting Started

useFunState works with any react 16.8+ application. Usage without TypeScript works but isn't recommended.

1. `npm install -S @fun-land/accessor @fun-land/fun-state @fun-land/use-fun-state`
2. Pick or create a component to hold the FunState:

```ts
import {index} from '@fun-dev/accessor';
import useFunState from '@fun-dev/use-fun-state';
import {Todo, TodoItem} from './Todo/TodoItem';
...

// Define an interface for your App's state
interface TodoApp {
  users: Todo[]
  ...
}

// Define an initial state:
const initialAppState: TodoApp = {
  todos: [],
  ...
};

// Create a FunState instance within a React.FunctionalComponent (uses react hooks)
const App = () => {
  const state = useFunState(initialAppState);
  const {todos} = funState.get();
  return (
    {/* Child components can get the root state directly */}
    <SelectAll state={state} />
    {todos.map((item, i) => (
      {/* or focus down to the state the component needs to interact with */}
      <TodoItem state={state.prop('todos').focus(index(i))} />
    ))}
  );
};
```

3. Create child components focused on a piece of your state:

```ts
// MyChildComponent.tsx
// Should be imported into the parent state interface
export type ChildState = boolean;

export const MyChildComponent: React.FC<{state: FunState<ChildState>}> = ({state}) => (
  <input type="checkbox" checked={state.get()} onChange=(e => state.set(e.currentTarget.checked))>
);
```

# More examples

See [fun-state-examples](https://github.com/jethrolarson/fun-state-examples) for a sample standalone application.

# When to useFunState

- When you're in a situation where you would gain benefit from redux or other state-managment libraries.
- You want composable/modular state
- You want to gradually try out another state management system without fully converting your app.

# When not to useFunState

- When your data or component heirachy is mostly flat.
- When your app is not as complex as [TodoMVC](https://todomvc.com/).
- You're avoiding `FunctionComponent`s

# Tips

- Keep your FunState Apps simple and delegate the complex logic to pure child components, using `.prop()` where practical.
- Use Accessor composition to drill down into deep parts of your tree or operate on multiple items. See `./TodoApp` or <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts docs</a> for examples.
- If child components need data from multiple places in the state tree, you can create and pass more than one FunState or just pass the root and then query what you need with Accessors.
- Unit test your updaters and snapshot test your components.

# API

## useFunState

```ts
<State>(initialState: State) => FunState<State>
```

Creates an react-hooks based FunState instance with a starting state.

## FunState?

See [@fun-land/fun-state](../packages/fun-state)</a>.

## Accessor?

Used by `FunState:query` and `FunState:focus` for operating on more complex structures. See [@fun-land/accessor](../packages/accessor)</a>.
