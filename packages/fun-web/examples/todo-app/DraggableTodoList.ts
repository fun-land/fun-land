import { h, keyedChildren, type Component, $ } from "../../src/index";
import type { FunState } from "../../src/state";
import { Todo, type TodoState } from "./Todo";

const ANIMATION_DURATION = 300;

interface DraggableTodoListProps {
  items: FunState<TodoState[]>;
}

const getElementByKey = (key: string) => $(`[data-key="${key}"]`);

// Complex component to show off how you can use all the normal DOM and CSS techniques without having to figure out frameworks or do special stuff
export const DraggableTodoList: Component<DraggableTodoListProps> = (
  signal,
  { items }
) => {
  let draggedKey: string | null = null;
  let lastTargetKey: string | null = null;
  let previousItemCount = items.get().length;

  // Watch for new items being added and animate them sliding down
  items.watch(signal, (currentItems) => {
    const currentCount = currentItems.length;
    if (currentCount > previousItemCount) {
      // New item added - capture positions and animate
      const positions = new Map<string, DOMRect>();
      currentItems.forEach((item) => {
        const el = $(`[data-key="${item.key}"]`);
        if (el) positions.set(item.key, el.getBoundingClientRect());
      });

      requestAnimationFrame(() => {
        positions.forEach((first, key) => {
          const el = $(`[data-key="${key}"]`);
          if (!el) return;
          const last = el.getBoundingClientRect();
          const deltaY = first.top - last.top;
          if (deltaY) {
            el.animate(
              [
                { transform: `translateY(${deltaY}px)` },
                { transform: "translateY(0)" },
              ],
              {
                duration: ANIMATION_DURATION,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              }
            );
          }
        });
      });
    }
    previousItemCount = currentCount;
  });

  const handleDragStart = (key: string) => {
    draggedKey = key;
    lastTargetKey = null;
  };

  const handleDragOver = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey || lastTargetKey === targetKey)
      return;

    lastTargetKey = targetKey;

    // Reorder items
    const allItems = items.get();
    const draggedIndex = allItems.findIndex((item) => item.key === draggedKey);
    const targetIndex = allItems.findIndex((item) => item.key === targetKey);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newItems = [...allItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      items.set(newItems);
    }
  };

  const handleDragEnd = () => {
    if (lastTargetKey) {
      // FLIP animation: capture positions before, then animate after state change
      const positions = new Map<string, DOMRect>();
      items.get().forEach((item) => {
        const el = getElementByKey(item.key);
        if (el) positions.set(item.key, el.getBoundingClientRect());
      });

      requestAnimationFrame(() => {
        positions.forEach((first, key) => {
          const el = getElementByKey(key);
          if (!el) return;

          const last = el.getBoundingClientRect();
          const deltaX = first.left - last.left;
          const deltaY = first.top - last.top;

          if (deltaX || deltaY) {
            el.animate(
              [
                { transform: `translate(${deltaX}px, ${deltaY}px)` },
                { transform: "translate(0, 0)" },
              ],
              {
                duration: ANIMATION_DURATION,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              }
            );
          }
        });
      });
    }

    draggedKey = null;
    lastTargetKey = null;
  };

  const todoList = h("ul", { className: "todo-list" });

  keyedChildren(todoList, signal, items, (row) =>
    Todo(row.signal, {
      removeItem: () => {
        const element = $<HTMLElement>(`[data-key="${row.state.get().key}"]`);
        if (element) {
          element.classList.add("todo-item-exit");
          setTimeout(() => {
            // Capture positions before removal
            const positions = new Map<string, DOMRect>();
            items.get().forEach((item) => {
              const el = $(`[data-key="${item.key}"]`);
              if (el) positions.set(item.key, el.getBoundingClientRect());
            });

            row.remove();

            // Animate remaining items
            requestAnimationFrame(() => {
              positions.forEach((first, key) => {
                const el = getElementByKey(key);
                if (!el) return;
                const last = el.getBoundingClientRect();
                const deltaY = first.top - last.top;
                if (deltaY) {
                  el.animate(
                    [
                      { transform: `translateY(${deltaY}px)` },
                      { transform: "translateY(0)" },
                    ],
                    {
                      duration: ANIMATION_DURATION,
                      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                    }
                  );
                }
              });
            });
          }, ANIMATION_DURATION);
        } else {
          row.remove();
        }
      },
      state: row.state,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
    })
  );

  return todoList;
};
