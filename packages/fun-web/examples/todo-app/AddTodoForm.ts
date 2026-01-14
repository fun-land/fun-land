import { flow } from "@fun-land/accessor";
import { FunState } from "@fun-land/fun-state";
import { Component, enhance, h, bindProperty, on } from "../../src";
import { TodoAppState, clearValue, addItem } from "./TodoAppState";

export const AddTodoForm: Component<{ state: FunState<TodoAppState> }> = (
  signal,
  { state }
) => {
  const input = enhance(
    h("input", {
      type: "text",
      placeholder: "Add a todo...",
      className: "todo-input",
    }),
    bindProperty("value", state.prop("value"), signal),
    on(
      "input",
      (e) => {
        state.prop("value").set(e.currentTarget.value);
      },
      signal
    )
  );

  return enhance(
    h("form", { className: "todo-form" }, [
      input,
      h("button", {
        type: "submit",
        textContent: "Add",
        className: "add-btn",
      }),
    ]),
    on(
      "submit",
      (e) => {
        e.preventDefault();
        if (state.get().value.trim()) {
          state.mod(flow(addItem, clearValue));
        }
      },
      signal
    )
  );
};
