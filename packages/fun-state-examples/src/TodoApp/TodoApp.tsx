import React, { FC } from "react";
import { TodoState, Todo } from "./Todo";
import { FunState, extractArray } from "@fun-land/fun-state";
import useFunState, { bindValue } from "@fun-land/use-fun-state";
import { removeAt, flow, prepend, Acc } from "@fun-land/accessor";

interface TodoAppState {
  value: string;
  items: TodoState[];
}
const initialState: TodoAppState = { value: "", items: [] };
// caching the state foci to make usage cleaner
const stateFoci = Acc<TodoAppState>()

// some business logic pulled out of the component. These are all TodoAppState -> TodoAppState
const addItem = (state: TodoAppState): TodoAppState =>
  stateFoci
    .prop("items")
    .mod(
      prepend<TodoState>({ checked: false, label: state.value, priority: 1 })
    )(state);

const clearValue = stateFoci.prop("value").set("");

// Focusing on the state
const markAllDone = stateFoci
  // focus .items
  .prop("items")
  // for each item
  .all()
  // focus .checked
  .prop("checked")
  // and set all to true
  .set(true);

// remove todo item at passed index
const removeItem = (index: number) =>
  stateFoci.prop("items").mod(removeAt(index));

// depends on state as props but
const Todos: FC<{ state: FunState<TodoAppState> }> = ({ state }) => {
  const onClickAllDone = () => state.mod(markAllDone);
  // querying child items
  const allDone = state
    .query(stateFoci.prop("items").all())
    .every((a) => a.checked);
  return (
    <div>
      <h1>Todo App</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          state.mod(flow(addItem, clearValue));
        }}
      >
        <input {...bindValue(state.prop('value'))} type="input" />
        <button type="submit">Add</button>
      </form>
      <button onClick={onClickAllDone}>Mark All done</button>{" "}
      {allDone && "all done!"}
      <ul>
        {extractArray(state.prop("items")).map((itemState, i) => (
          <Todo
            state={itemState}
            key={i}
            removeItem={() => state.mod(removeItem(i))}
          />
        ))}
      </ul>
    </div>
  );
};

// The Apps themselves can be impure but other components should not be
const TodoApp: FC = () => <Todos state={useFunState(initialState)} />;
export default TodoApp;
