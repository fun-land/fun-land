// There's nothing special about this file, it's just a recommended way of organizing your accessors, updaters, and interfaces
import { Acc, prepend } from "@fun-land/accessor";
import { TodoState } from "./TodoState";

export interface TodoAppState {
  value: string;
  items: TodoState[];
}

export const init_TodoAppState = (): TodoAppState => ({
  value: "",
  items: [
    { checked: false, label: "Learn fun-web", priority: 0, key: "asdf" },
    { checked: true, label: "Build something cool", priority: 1, key: "fdas" },
  ],
});

// accessors and updaters
export const stateAcc = Acc<TodoAppState>();
export const allCheckedAcc = stateAcc.prop("items").all().prop("checked");
export const markAllDone = allCheckedAcc.set(true);
export const clearValue = stateAcc.prop("value").set("");
export const addItem = (state: TodoAppState): TodoAppState =>
  Acc<TodoAppState>()
    .prop("items")
    .mod(
      prepend<TodoState>({
        checked: false,
        label: state.value,
        priority: 1,
        key: crypto.randomUUID(),
      })
    )(state);
