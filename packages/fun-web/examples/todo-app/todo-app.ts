import {
  h,
  funState,
  mount,
  bindPropertyTo,
  onTo,
  keyedChildren,
  type Component,
  enhance,
} from "../../src/index";
import { prepend, flow, Acc } from "@fun-land/accessor";
import { TodoState, Todo } from "./Todo";

// ===== Types =====

interface TodoAppState {
  value: string;
  items: TodoState[];
}

// ===== Accessors and helpers =====

const stateFoci = Acc<TodoAppState>();

const addItem = (state: TodoAppState): TodoAppState =>
  stateFoci.prop("items").mod(
    prepend<TodoState>({
      checked: false,
      label: state.value,
      priority: 1,
      key: crypto.randomUUID(),
    })
  )(state);

const clearValue = stateFoci.prop("value").set("");

const markAllDone = stateFoci.prop("items").all().prop("checked").set(true);

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
  const input = enhance(
    h("input", {
      type: "text",
      value: state.get().value,
      placeholder: "Add a todo...",
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

  const addBtn = h("button", { type: "submit", textContent: "Add" });

  const form = enhance(
    h("form", {}, [input, addBtn]),
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

  // Because `on` returns the element you can pipe through
  const markAllBtn = enhance(
    h("button", { textContent: "Mark All Done" }),
    onTo(
      "click",
      () => {
        state.mod(markAllDone);
      },
      signal
    )
  );

  const todoList = h("ul", {});
  keyedChildren(todoList, signal, state.prop("items"), (row) =>
    Todo(row.signal, {
      removeItem: row.remove,
      state: row.state,
    })
  );

  return h("div", { className: "todo-app" }, [
    h("h1", { textContent: "Todo App" }),
    form,
    h("div", {}, [markAllBtn, h("span", { textContent: "" })]),
    todoList,
  ]);
};

// ===== Initialize =====

const app = document.getElementById("app");

if (app) {
  mount(TodoApp, {}, app);
}