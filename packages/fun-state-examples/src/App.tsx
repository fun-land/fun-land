import React, { FC } from "react";
import { Counter, initialCounterState, CounterState } from "./Counter";
import useFunState from "@fun-land/use-fun-state";
import TodoApp from "./TodoApp/TodoApp";

interface AppState {
  count: CounterState;
}

const initialState: AppState = {
  count: initialCounterState,
};

const App: FC = () => {
  const state = useFunState(initialState);

  // We're bootstrapping the Counter's state to the root as an example but it's not strictly necessary.
  return (
    <div>
      <TodoApp />
      <Counter state={state.prop("count")} />
    </div>
  );
};

export default App;
