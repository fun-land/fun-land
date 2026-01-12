/**
 * Example: Simple counter component demonstrating fun-web basics
 */
import {
  h,
  useFunWebState,
  mount,
  type Component,
  type FunWebState,
} from "../../src/index";
import { prop } from "@fun-land/accessor";

// Component state (dynamic data)
interface CounterState {
  count: number;
}

// Component props (static configuration + state)
interface CounterProps {
  label: string;
  onReset: () => void;
  state: FunWebState<CounterState>;
}

// Counter component - evaluates once, subscriptions handle updates
const Counter: Component<CounterProps> = (
  signal,
  { state, onReset, label }
) => {
  // Create DOM elements
  const display = h(
    "div",
    { className: "count-display" },
    String(state.get().count)
  );
  const incrementBtn = h("button", { textContent: "+" });
  const decrementBtn = h("button", { textContent: "-" });
  const resetBtn = h("button", { textContent: "Reset" });

  // Subscribe to state changes
  state.prop("count").subscribe(signal, (count) => {
    display.textContent = String(count);
  });

  // Event listeners with cleanup
  incrementBtn.addEventListener(
    "click",
    () => {
      state.mod((s) => ({ count: s.count + 1 }));
    },
    { signal }
  );

  decrementBtn.addEventListener(
    "click",
    () => {
      state.mod((s) => ({ count: s.count - 1 }));
    },
    { signal }
  );

  resetBtn.addEventListener("click", onReset, { signal });

  // Build and return DOM tree
  return h("div", { className: "counter" }, [
    h("h2", { textContent: label }),
    display,
    h("div", { className: "buttons" }, [incrementBtn, decrementBtn, resetBtn]),
  ]);
};

// App component demonstrating composition
interface AppState {
  title: string;
  counterValue: CounterState;
}

const App: Component = (signal) => {
  const state = useFunWebState<AppState>({
    title: "Fun-Web Counter Example",
    counterValue: { count: 0 },
  });
  const heading = h("h1", { textContent: state.get().title });

  // Subscribe to title changes
  state.prop("title").subscribe(signal, (title) => {
    heading.textContent = title;
  });

  // Create child component with focused state
  const counter = Counter(
    signal, // pass same signal - cleanup cascades
    {
      label: "Click Counter",
      onReset: () => state.prop("counterValue").set({ count: 0 }),
      state: state.focus(prop<AppState>()("counterValue")),
    }
  );

  return h("div", { className: "app" }, [heading, counter]);
};

// Usage
export const runExample = () => {
  const container = document.getElementById("app");
  if (!container) throw new Error("No #app element found");

  const mounted = mount(App, {}, container);

  // Return cleanup function
  return () => mounted.unmount();
};
