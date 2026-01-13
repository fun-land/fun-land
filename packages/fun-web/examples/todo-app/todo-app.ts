import {
  h,
  funState,
  mount,
  bindPropertyTo,
  onTo,
  type Component,
  enhance,
} from "../../src/index";
import { prepend, flow, Acc } from "@fun-land/accessor";
import type { TodoState } from "./Todo";
import { DraggableTodoList } from "./DraggableTodoList";

// ===== Types =====

interface TodoAppState {
  value: string;
  items: TodoState[];
}

// ===== Accessors and helpers =====

const stateAcc = Acc<TodoAppState>();

const addItem = (state: TodoAppState): TodoAppState =>
  stateAcc.prop("items").mod(
    prepend<TodoState>({
      checked: false,
      label: state.value,
      priority: 1,
      key: crypto.randomUUID(),
    })
  )(state);

const clearValue = stateAcc.prop("value").set("");
const allCheckedAcc = stateAcc.prop("items").all().prop("checked");
const markAllDone = allCheckedAcc.set(true);

// ===== Todo App Component =====

const initialState: TodoAppState = {
  value: "",
  items: [
    { checked: false, label: "Learn fun-web", priority: 0, key: "asdf" },
    { checked: true, label: "Build something cool", priority: 1, key: "fdas" },
  ],
};

const TodoApp: Component = (signal) => {
  const state = funState(initialState);

  // ===== Form Components =====

  const input = enhance(
    h("input", {
      type: "text",
      placeholder: "Add a todo...",
      className: "todo-input",
    }),
    bindPropertyTo("value", state.prop("value"), signal),
    onTo(
      "input",
      (e) => {
        state.prop("value").set(e.currentTarget.value);
      },
      signal
    )
  );

  const form = enhance(
    h("form", { className: "todo-form" }, [
      input,
      h("button", {
        type: "submit",
        textContent: "Add",
        className: "add-btn",
      }),
    ]),
    onTo(
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

  const markAllBtn = enhance(
    h("button", {
      textContent: "Mark All Done",
      className: "mark-all-btn",
    }),
    onTo(
      "click",
      () => {
        state.mod(markAllDone);
      },
      signal
    )
  );

  // "All Done" indicator
  const allDoneText = h("span", {
    textContent: "",
    className: "all-done-text",
  });
  state.focus(allCheckedAcc).watchAll(signal, (checks) => {
    allDoneText.textContent =
      checks.length > 0 && checks.every(Boolean) ? "🎉 All Done!" : "";
  });

  return h("div", { className: "todo-app" }, [
    h("h1", { textContent: "🚀 Advanced Todo App" }),
    form,
    h("div", { className: "controls" }, [markAllBtn, allDoneText]),
    DraggableTodoList(signal, { items: state.prop("items") }),
  ]);
};

// ===== Initialize =====

const app = document.getElementById("app");

if (app) {
  mount(TodoApp, {}, app);
}
