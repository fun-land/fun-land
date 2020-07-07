import React, { FC } from 'react'

export const Readme: FC = () => (
  <div>
    <p>
      Don't you hate when you have to update 4 different files (constants, actions, reducer, component, and interface)
      to make a checkbox do something?
    </p>
    <p>
      On top of that, updating nested data is messy and error prone:
      <pre>
        <code>
          {`...
SET_USER_CHECKED: (state: State): State => {
  return {
    ...state,
    users: state.users.map((user) =>
      user.id = action.payload.id ? {...user, checked: action.payload.checked} : user 
    )
  };
}
...
`}
        </code>
      </pre>
    </p>
    <p>
      And even if you do everything right redux just doesn't seem TypeScript native. It's types are like an
      afterthought.
    </p>
    <p>
      <img src="https://i.imgflip.com/46vcs3.jpg" alt="matrix reference joke" />
      <br />
      With <b>FunState</b> you can make the update in the same file as the checkbox and still have type-safety,
      testability, and much more concise code.
    </p>
    <h1>FunState</h1>
    <p>
      FunState is a React architecture and library for doing fractal, compositional state in a way that is typesafe,
      testable, and easy to refactor.
    </p>
    <h1>Getting Started</h1>
    FunState works with any react 16.8+ application. Usage without TypeScript works but isn't recommended.
    <ol>
      <li>(npm install instructions TODO once this is published)</li>
      <li>
        Create a component to act as the root for your FunState application (Doesn't actually have to be the root):
        <pre>
          <code>{`
// App.tsx
// Define an interface for your App's state
interface AppState {
  ...
}
//Define a bound Accessor for the state props
const appStateProps = prop<AppState>();
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
      {/* Or you can select down to a subset of the state using subState and an Accessor: */}
      <MyChildComponent {...subState(appStateProps('childProp'), funState)} />
    </div>
  );
};`}</code>
        </pre>
      </li>
      <li>
        Create a child component focused on a piece of your state:
        <pre>
          <code>{`
// MyChildComponent.tsx
// Should be imported into the parent state interface
export interface ChildState {
  checked: boolean;
}
const childProps = prop<ChildState>();
// boolean -> ChildState -> ChildState
export const setChecked = set(childProps('checked'));

export const MyChildComponent: React.FC<FunState<ChildState>> = ({set, state: {checked}}) => (
  <input type="checkbox" checked={checked} onChange=(e => set(childProps('checked'))(e.currentTarget.checked))>
);`}</code>
        </pre>
      </li>
    </ol>
    <h1>Tips</h1>
    <ul>
      <li>
        Keep your FunState Apps simple and delegate the complex logic to pure child components, using{' '}
        <code>subState</code> where possible.
      </li>
      <li>You can create and pass more than one subState if child components need multiple focus.</li>
      <li>
        Use Accessor composition to drill down into deep parts of your tree or operate on multiple items. See ./TodoApp
        or <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts docs</a> for examples.
      </li>
      <li>Unit test your updaters and snapshot test your components.</li>
      <li>As usual, memoizing event handlers can help if you run into rendering performance problems.</li>
    </ul>
    <h1>Basic Architecture</h1>
    <div style={{ width: 640, height: 480, margin: 10, position: 'relative' }}>
      <iframe
        title="diagram"
        frameBorder="0"
        allowFullScreen
        style={{ width: 640, height: 480 }}
        src="https://app.lucidchart.com/documents/embeddedchart/cd3f1a6d-9d60-4a68-8252-e9e203802450"
        id="mv4.4XhOp1E0"
      />
    </div>
    <h1>API</h1>
    <h2>Accessor</h2>
    <p>
      See <a href="https://github.com/jethrolarson/accessor-ts">accessor-ts</a>
    </p>
    <h2>FunState</h2>
    <pre>
      <code>{`
export interface FunState<State> {
  state: State
  mod: Updater<State>
  query: <A>(acc: Accessor<State, A>) => A[]
  set: <A>(acc: Accessor<State, A>) => (val: A) => void
  setKey: <K extends keyof State>(key: K) => (val: State[K]) => void
}`}</code>
    </pre>
    <p>Data structure that holds the state along with a stateful function that updates it.</p>
    <h2>useFunState</h2>
    <code>{`function useFunState<State>(initialState: State): FunState<State>`}</code>
    <p>
      Creates an instance of the state machine with a starting state. Any component that calls this becomes an "App".
    </p>
    <h2>subState</h2>
    <pre>
      <code>{`const subState = <ChildState, ParentState>(
  accessor: Accessor<ParentState, ChildState>,
  parentState: FunState<ParentState>
): FunState<ChildState>`}</code>
    </pre>
    <p>
      Create a FunState focused on a subset of a parent state.
      <a href="https://github.com/jethrolarson/accessor-ts">Accessor</a> can point to arbitrary depth or even to
      multiple items.
    </p>
    <h1>Examples</h1>
    <p>See the source of this page.</p>
  </div>
)
