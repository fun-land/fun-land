import { viewed } from "accessor";
import {
  h,
  type Component,
  type FunState,
  enhance,
  bindPropertyTo,
  onTo,
} from "../../src/index";

export interface TodoState {
  key: string;
  checked: boolean;
  priority: number;
  label: string;
}

export interface TodoProps {
  removeItem: () => void;
  state: FunState<TodoState>;
}

// a special Accessor that reads as string but writes as number
const stringNumberView = viewed(String, Number);

export const Todo: Component<TodoProps> = (signal, { state, removeItem }) => {
  const priorityState = state.prop("priority").focus(stringNumberView);
  // h is a much more ergonomic way of creating html but it's just document.createElement under the hood
  const prioritySelect = enhance(
    h("select", {}, [
      h("option", { value: "0" }, "High"),
      h("option", { value: "1" }, "Low"),
    ]),
    bindPropertyTo("value", priorityState, signal),
    // native event binding works but for easier event binding use `on` helper for better type inferrence and you can't forget to cleanup
    onTo("change", (e) => priorityState.set(e.currentTarget.value), signal)
  );

  const checkedState = state.prop("checked");
  const checkbox = enhance(
    h("input", { type: "checkbox" }),
    // use bindPropertyTo to automatically update a property when the focused state changes
    bindPropertyTo("checked", checkedState, signal), // when state.checked updates the checkbox.checked updates
    onTo("change", (e) => checkedState.set(e.currentTarget.checked), signal)
  );

  // 😎 or do both at the same time since they both return the element
  const labelState = state.prop("label");
  const labelInput = enhance(
    h("input", {
      type: "text",
    }),
    bindPropertyTo("value", labelState, signal),
    onTo("input", (e) => labelState.set(e.currentTarget.value), signal)
  );

  return h("li", {}, [
    checkbox,
    prioritySelect,
    labelInput,
    enhance(
      h("button", { textContent: "X" }),
      onTo("click", removeItem, signal)
    ),
  ]);
};
