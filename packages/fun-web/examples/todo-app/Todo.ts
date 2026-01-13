import { viewed } from "@fun-land/accessor";
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
  onDragStart?: (key: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (key: string) => void;
}

// a special Accessor that reads as string but writes as number
const stringNumberView = viewed(String, Number);

export const Todo: Component<TodoProps> = (
  signal,
  { state, removeItem, onDragStart, onDragEnd, onDragOver }
) => {
  const todoData = state.get();
  const priorityState = state.prop("priority").focus(stringNumberView);

  const prioritySelect = enhance(
    h("select", {}, [
      h("option", { value: "0" }, "High"),
      h("option", { value: "1" }, "Low"),
    ]),
    bindPropertyTo("value", priorityState, signal),
    onTo("change", (e) => priorityState.set(e.currentTarget.value), signal)
  );

  const checkedState = state.prop("checked");
  const checkbox = enhance(
    h("input", { type: "checkbox" }),
    bindPropertyTo("checked", checkedState, signal),
    onTo("change", (e) => checkedState.set(e.currentTarget.checked), signal)
  );

  const labelState = state.prop("label");
  const labelInput = enhance(
    h("input", {
      type: "text",
    }),
    bindPropertyTo("value", labelState, signal),
    onTo("input", (e) => labelState.set(e.currentTarget.value), signal)
  );

  const dragHandle = h("span", {
    className: "drag-handle",
    textContent: "⋮⋮",
    draggable: true,
  });

  const deleteBtn = enhance(
    h("button", { className: "delete-btn", textContent: "×" }),
    onTo("click", removeItem, signal)
  );

  const li = h("li", { className: "todo-item", "data-key": todoData.key }, [
    dragHandle,
    checkbox,
    prioritySelect,
    labelInput,
    deleteBtn,
  ]);

  // HTML5 drag and drop
  if (onDragStart) {
    dragHandle.addEventListener(
      "dragstart",
      (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", todoData.key);
          // Calculate offset from mouse to element's top-left
          const rect = li.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;
          e.dataTransfer.setDragImage(li, offsetX, offsetY);
        }
        li.classList.add("dragging");
        onDragStart(todoData.key);
      },
      { signal }
    );
  }

  if (onDragEnd) {
    dragHandle.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      onDragEnd();
    }, { signal });
  }

  if (onDragOver) {
    li.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "move";
        }
        onDragOver(todoData.key);
      },
      { signal }
    );
  }

  // Enter animation
  requestAnimationFrame(() => {
    li.classList.add("todo-item-enter");
  });

  return li;
};
