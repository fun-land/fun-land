Don't you hate when you have to update 4 different files (constants, actions, reducer, component, and interface) to make a checkbox do something?

On top of that, manually updating nested data immutably is messy and error prone:

```ts
SET_USER_CHECKED: (state: State): State => {
  return {
    ...state,
    users: state.users.map(user => {
      if ((user.id = action.payload.id)) {
        return {...user, checked: action.payload.checked}
      }
      return user
    })
  }
}
```

And even if you do everything right redux just doesn't seem TypeScript native. Its types are an
afterthought.

<img src="https://i.imgflip.com/46vcs3.jpg" alt="matrix reference joke" />

With <b>FunState</b> you can make the update in the same file as the checkbox and still have type-safety, testability, and much more concise code.

# FunState

FunState is a React architecture and library for doing fractal, compositional state in a way that is typesafe,
testable, and easy to refactor.

# Getting Started

FunState works with any react 16.8+ application. Usage without TypeScript works but isn't recommended.

1. `npm install -S fun-state`
2. Create a component to act as the root for your FunState application (Doesn't actually have to be the root):

```ts
// App.tsx
// Define an interface for your App's state
interface AppState {
  ...
}

// Define an initial state:
const initialAppState: AppState = {
  ...
};

// Create a FunState instance within a React.FunctionalComponent (uses react hooks)
const App = () => {
  const funState = useFunState(initialAppState);
  return (
    <div>
      {/* Child components can either get the root state directly: */}
      <MyComponent {...funState} />
      {/* Or you can select down to a subset of the state using `.sub()` and an `Accessor`: */}
      <MyChildComponent {...funState.sub('childProp')} />
    </div>
  );
};
```

3. Create a child component focused on a piece of your state:

```ts
// MyChildComponent.tsx
// Should be imported into the parent state interface
export interface ChildState {
  isCool: boolean;
}

export const MyChildComponent: React.FC<FunState<ChildState>> = ({setKey, state: {checked}}) => (
  <input type="checkbox" checked={checked} onChange=(e => setKey('isCool')(e.currentTarget.checked))>
);
```

# Tips

- Keep your FunState Apps simple and delegate the complex logic to pure child components, using `.sub()` where practical.
- Use Accessor composition to drill down into deep parts of your tree or operate on multiple items. See `./TodoApp` or <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts docs</a> for examples.
- If child components need data from multiple places in the state tree, you can create and pass more than one FunState or just pass the root and then query out what you need with Accessors.
- Unit test your updaters and snapshot test your components.
- As usual, memoizing event handlers can help if you run into rendering performance problems.

# Basic Architecture

https://app.lucidchart.com/invitations/accept/657b566b-5302-49c2-a5fa-d0e5957b4899

# API

## Accessor

See <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts</a>

## FunState

```ts
export interface FunState<State> {
  // Your App's state
  state: State
  // Transform the state with the passed function
  mod: (transform: (state: State) => State) => void
  // Query the state using some accessor
  query: <A>(acc: Accessor<State, A>) => A[]
  // Set the state at the passed accessor
  set: <A>(acc: Accessor<State, A>) => (val: A) => void
  // Set state at passed key
  setKey: <K extends keyof State>(key: K) => (val: State[K]) => void
  // return a new FunState focused at the passed accessor
  sub: <SubState>(acc: Accessor<State, SubState>) => FunState<SubState>
}
```

Data structure that holds the state along with a stateful function that updates it.

## useFunState

```ts
function useFunState<State>(initialState: State): FunState<State>
```

Creates an instance of the state machine with a starting state. Any component that calls this becomes an "App".
