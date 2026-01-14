import {
  h,
  funState,
  mount,
  onTo,
  type Component,
  enhance,
  renderWhen,
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

  // "All Done" indicator using renderWhen
  const AllDoneComponent: Component = () => {
    return h("span", {
      textContent: "🎉 All Done!",
      className: "all-done-text",
    });
  };

  // Derive a boolean state for whether all todos are done
  const allDoneState = funState(false);
  state.focus(allCheckedAcc).watchAll(signal, (checks) => {
    allDoneState.set(checks.length > 0 && checks.every(Boolean));
  });

  const allDoneEl = renderWhen({
    state: allDoneState,
    component: AllDoneComponent,
    props: {},
    signal
  });

  return h("div", { className: "todo-app" }, [
    h("h1", { textContent: "Todo Example" }),
    AddTodoForm(signal, { state }),
    h("div", { className: "controls" }, [markAllBtn, allDoneEl]),
    DraggableTodoList(signal, { items: state.prop("items") }),
  ]);
};

// ===== Initialize =====

const app = document.getElementById("app");

if (app) {
  mount(TodoApp, {}, app);
}
