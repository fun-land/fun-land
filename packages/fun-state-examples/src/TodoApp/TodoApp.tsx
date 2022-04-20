import { FC, ChangeEventHandler } from "react";
import { TodoState, Todo } from "./Todo";
import { FunState, extractArray } from "@fun-land/fun-state";
import useFunState from "@fun-land/use-fun-state";
import { removeAt, flow, prepend, Acc } from "@fun-land/accessor";

interface TodoAppState {
  value: string;
  items: TodoState[];
}
const initialState: TodoAppState = { value: "", items: [] };

// some business logic pulled out of the component. These are all TodoAppState -> TodoAppState
const addItem = (state: TodoAppState): TodoAppState =>
  Acc<TodoAppState>()
    .prop("items")
    .mod(
      prepend<TodoState>({ checked: false, label: state.value, priority: 1 })
    )(state);

const clearValue = Acc<TodoAppState>().prop("value").set("");

// Focusing on the state
const markAllDone = Acc<TodoAppState>()
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
  Acc<TodoAppState>().prop("items").mod(removeAt(index));

// depends on state as props but
const Todos: FC<{ state: FunState<TodoAppState> }> = ({ state }) => {
  // A little bit of business logic in-line for convenience
  const onValueChange: ChangeEventHandler<HTMLInputElement> = ({
    currentTarget: { value },
  }) => state.prop("value").set(value);
  const onClickAllDone = () => state.mod(markAllDone);
  // querying child items
  const allDone = state
    .query(Acc<TodoAppState>().prop("items").all())
    .every((a) => a.checked);
  const { value } = state.get();
  return (
    <div>
      <h1>Todo App</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          state.mod(flow(addItem, clearValue));
        }}
      >
        <input value={value} onChange={onValueChange} type="input" />
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
