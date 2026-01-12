import {
  h,
  bindProperty,
  on,
  type Component,
  type FunState,
} from "../../src/index";

export interface TodoState {
  key: string;
  checked: boolean;
  priority: number;
  label: string;
}

interface TodoProps {
  removeItem: () => void;
  state: FunState<TodoState>;
}

export const Todo: Component<TodoProps> = (signal, { state, removeItem }) => {
  // h is a much more ergonomic way of creating html but it's just document.createElement under the hood
  const prioritySelect = h("select", {}, [
    h("option", { value: "0" }, "High"),
    h("option", { value: "1" }, "Low"),
  ]);
  // 😓 You can manually set initial state
  prioritySelect.value = String(state.get().priority);
  // 😓 and listen to when a state updates to update the element
  state.prop("priority").subscribe(signal, (priority) => {
    prioritySelect.value = String(priority);
  });
  // 😓 native event binding works but requires casting and dev must remember to pass signal so they don't leak memory
  prioritySelect.addEventListener(
    "change",
    (e) => {
      state.prop("priority").set(+(e.currentTarget as HTMLSelectElement).value);
    },
    { signal }
  );

  const checkbox = h("input", { type: "checkbox" });
  // 😎 For easier binding you can bind property to a reactive state
  bindProperty(checkbox, "checked", state.prop("checked"), signal); // when state.checked updates the checkbox.checked updates
  // 😎 For easier event binding use `on` helper for better type inferrence and you can't forget to cleanup
  on(
    checkbox,
    "change",
    (e) => {
      state.prop("checked").set(e.currentTarget.checked);
    },
    signal
  );

  // 😎 or do both at the same time since they both return the element
  const labelInput = on(
    bindProperty(
      h("input", {
        type: "text",
      }),
      "value",
      state.prop("label"),
      signal
    ),
    "input",
    (e) => {
      state.prop("label").set(e.currentTarget.value);
    },
    signal
  );

  return h("li", {}, [
    checkbox,
    prioritySelect,
    labelInput,
    // you can even inline to go tacit
    on(h("button", { textContent: "X" }), "click", removeItem, signal),
  ]);
};
