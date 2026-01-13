import {
  h,
  funState,
  mount,
  onTo,
  type Component,
  enhance,
} from "../../src/index";
import {
  type TodoAppState,
  markAllDone,
  allCheckedAcc,
  init_TodoAppState,
} from "./TodoAppState";
import { DraggableTodoList } from "./DraggableTodoList";
import { AddTodoForm } from "./AddTodoForm";

// ===== Todo App Component =====

const TodoApp: Component = (signal) => {
  const state = funState(init_TodoAppState());

  // ===== Form Components =====

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
    h("h1", { textContent: "Todo Example" }),
    AddTodoForm(signal, { state }),
    h("div", { className: "controls" }, [markAllBtn, allDoneText]),
    DraggableTodoList(signal, { items: state.prop("items") }),
  ]);
};

// ===== Initialize =====

const app = document.getElementById("app");

if (app) {
  mount(TodoApp, {}, app);
}
