# @fun-land/fun-web

A lightweight web component library for building reactive UIs with native DOM and compositional state management.

## Why fun-web?

Build web UIs without a framework using:
- **Run-once components** that never re-render (sidesteps stale closures, memoization, render cycles)
- **Reactive state** following the FunState compositional pattern
- **Native DOM** elements (no virtual DOM)
- **TypeScript-first** APIs with full type inference
- **AbortSignal** for automatic cleanup

Perfect for embedding interactive components in static sites, building lightweight tools, or avoiding framework lock-in.

## Features

- **Subscription-based reactivity** - State changes automatically update DOM
- **Keyed list rendering** - Efficient reconciliation without virtual DOM
- **Type-safe utilities** - Element types and events inferred automatically
- **Memory-safe by default** - AbortSignal prevents leaks
- **Framework-agnostic** - Just functions and elements

## Installation

```bash
yarn add @fun-land/fun-web @fun-land/accessor
```

## Quick Start

```typescript
import {
  h,
  funState,
  mount,
  bindProperty,
  on,
  type Component,
  type FunState,
} from "@fun-land/fun-web";


const Counter: Component<{state: FunState<number>}> = (signal, {state}) => {
  // Component runs once - no re-rendering on state changes
  const button = h("button", {}, `Count: ${state.get()}`);

  // bindProperty subscribes to the past state and updates named property
  bindProperty(button, "textContent", state, signal);

  // Event handlers never go stale (component doesn't re-run)
  on(button, "click", () => state.mod((n) => n + 1), signal);

  return button;
};

// Create reactive state and mount 
const mounted = mount(Counter, { state: funState(0) }, document.body);
```

## Core Concepts

### Components Run Once

**The most important difference from React/Vue/Svelte:** fun-web components execute once when mounted, set up subscriptions, and never re-run.

```typescript
const Counter: Component<{ count: FunState<number> }> = (signal, props) => {
  console.log("Component runs once");

  const display = h("div");
  const button = h("button", {}, "Increment");

  // This subscription handles updates, not re-rendering
  bindProperty(display, "textContent", props.count, signal);
  on(button, "click", () => props.count.mod(n => n + 1), signal);

  return h("div", {}, [display, button]);
  // Component function exits, but subscriptions keep working
};
```

When `count` changes, the component **doesn't re-run**. Instead, the `bindProperty` subscription updates `display.textContent` directly.

**Problems this sidesteps:**

| Framework components | fun-web components |
|---------------------|-------------------|
| Re-execute on every state change | Execute once, subscriptions handle updates |
| Need memoization (`useMemo`, `useCallback`) | No re-execution = no stale closures to worry about |
| Virtual DOM diffing overhead | Direct DOM updates via subscriptions |
| Rules about when you can update state | Update state whenever you want |
| "Render cycles" and batching complexity | No render cycles, updates are just function calls |

**What this means:**
- Component functions are just **constructors** - they build UI once and set up reactive bindings
- State changes trigger **targeted DOM updates**, not full re-renders
- No "rendering" concept - just imperative DOM manipulation driven by reactive state
- Simpler mental model: "When X changes, update this specific DOM property"

**Concrete example:**

```typescript
// In React - component re-executes on every count change
function ReactCounter() {
  const [count, setCount] = useState(0);
  console.log("Re-rendering!"); // Logs on every state change

  // Need useCallback to prevent infinite re-renders
  const increment = useCallback(() => setCount(c => c + 1), []);

  return <div>{count} <button onClick={increment}>+</button></div>;
}

// In fun-web - component executes once
const FunWebCounter: Component<{ count: FunState<number> }> = (signal, props) => {
  console.log("Mounting!"); // Logs once, never again

  const display = h("div");
  const button = h("button", {}, "+");

  // No useCallback needed - this closure never goes stale
  on(button, "click", () => props.count.mod(n => n + 1), signal);
  bindProperty(display, "textContent", props.count, signal);

  return h("div", {}, [display, button]);
};
```

In React, clicking the button causes the entire component to re-execute. In fun-web, clicking the button just calls `count.mod()`, which triggers the `bindProperty` subscription to update `display.textContent`. The component function never runs again.

### FunState - Reactive State with Subscriptions

`FunState<T>` provides reactive compositional state [@fun-land/fun-state](../fun-state):

```typescript
const userState = funState({ name: "Alice", age: 30 });

// Get current value
userState.prop("name").get(); // "Alice"

// Update state
userState.prop("age").set(31);

// Subscribe to changes (cleaned up when signal aborts)
userState.prop("name").subscribe(signal, (name) => {
  element.textContent = name; // runs when name changes
});
```

### Component Signature

Components are functions that receive an AbortSignal and props:

```typescript
type Component<Props = {}> = (
  signal: AbortSignal,    // For cleanup
  props: Props            // Data (static or reactive)
) => Element              // Returns plain DOM element
```

**Props can contain anything:** Static values, callbacks, reactive state, or any combination. There's no distinction between "props" and "state" - state is just data that happens to have `.get()` and `.set()` methods.

**Examples:**
```typescript
// Static props only
const Static: Component<{ title: string }> = (signal, props) =>
  h("h1", {}, props.title);

// Reactive state in props
const Counter: Component<{ count: FunState<number> }> = (signal, props) =>
  h("div", {}, String(props.count.get()));

// Mix of static and reactive
const Dashboard: Component<{
  onLogout: () => void;
  user: FunState<User>;
  settings: FunState<Settings>;
}> = (signal, props) => {
  // props.onLogout is a static callback
  // props.user is reactive state
  // props.settings is reactive state
};
```

### Reactivity Patterns

**Use `bindProperty` for simple one-way bindings:**

```typescript
const nameEl = h("div");
const nameState: FunState<string> = state.prop("user").prop("name");

bindProperty(nameEl, "textContent", nameState, signal);
// nameEl.textContent stays in sync with nameState
```

**Use `on` for events:**

```typescript
const button = h("button", {}, "Click me");
on(button, "click", (e: MouseEvent & { currentTarget: HTMLButtonElement }) => {
  console.log(e.currentTarget.textContent);
}, signal);
```

**Chain for two-way bindings:**

```typescript
const input = on(
  bindProperty(
    h("input", { type: "text" }),
    "value",
    state.prop("name"),
    signal
  ),
  "input",
  (e) => state.prop("name").set(e.currentTarget.value),
  signal
);
```

**Use `.subscribe()` for complex logic:**

```typescript
state.subscribe(signal, (s) => {
  element.textContent = s.count > 100 ? "Max!" : String(s.count);
  element.className = s.count > 100 ? "maxed" : "normal";
  element.setAttribute("aria-label", `Count: ${s.count}`);
});
```

### Cleanup with AbortSignal

All subscriptions and event listeners require an AbortSignal. When the signal aborts, everything cleans up automatically:

```typescript
const MyComponent: Component<{ state: FunState<State> }> = (signal, props) => {
  const display = h("div");
  const button = h("button");

  // All three clean up when signal aborts
  bindProperty(display, "textContent", props.state.prop("count"), signal);
  on(button, "click", () => props.state.mod(increment), signal);
  props.state.subscribe(signal, (s) => console.log("Changed:", s));

  return h("div", {}, [display, button]);
};

const mounted = mount(MyComponent, { state }, container);
mounted.unmount(); // Aborts signal → everything cleans up
```

For the most part you won't have to worry about the abort signal if you use the helpers provided.

## Best Practices

**Prefer helpers over manual subscriptions:**

```typescript
// ✅ Good
bindProperty(element, "textContent", state.prop("count"), signal);

// ❌ Avoid (when bindProperty works)
state.prop("count").subscribe(signal, (count) => {
  element.textContent = String(count);
});
```

**Use `on()` for type safety:**

```typescript
// ✅ Good - types inferred
on(button, "click", (e) => {
  e.currentTarget.disabled = true; // TypeScript knows it's HTMLButtonElement
}, signal);

// ❌ Avoid - loses type information
button.addEventListener("click", (e) => {
  (e.currentTarget as HTMLButtonElement).disabled = true;
}, { signal });
```

**Manual subscriptions for complex updates:**

```typescript
// ✅ complex updates may need subscribe
state.subscribe(signal, (s) => {
  // Multiple DOM updates based on complex conditions
  if (s.status === "loading") {
    spinner.style.display = "block";
    button.disabled = true;
  } else {
    spinner.style.display = "none";
    button.disabled = false;
  }
});
```

## API Reference

### DOM Utilities

#### `h`

Declaratively create an HTML Element with properties and children.

```typescript
const div = h("div", { id: "app" }, [
  h("h1", null, "Hello"),
  h("input", { type: "text", value: "foo" })
]);
```

**Attribute conventions:**
- Dashed properties (`data-*`, `aria-*`) → `setAttribute()`
- Don't event bind with properties, use `on()`
- Everything else → property assignment

#### bindProperty
```ts
<E extends Element, K extends keyof E>(
  el: E,
  key: K,
  fs: FunState<E[K]>,
  signal: AbortSignal
): E
```

Bind element property to state. Returns element for chaining.

```typescript
const input: HTMLInputElement = h("input");
bindProperty(input, "value", state.prop("name"), signal);
// input.value syncs with state.name
```

#### on
```ts
<E extends Element, K extends keyof HTMLElementEventMap>(
  el: E,
  type: K,
  handler: (ev: HTMLElementEventMap[K] & { currentTarget: E }) => void,
  signal: AbortSignal
): E
```

Add type-safe event listener. Returns element for chaining.

```typescript
on(h("button"), "click", (e) => {
  // e.currentTarget is typed as HTMLButtonElement
  e.currentTarget.disabled = true;
}, signal);
```

#### keyedChildren
```ts
<T extends { key: string }>(
  parent: Element,
  signal: AbortSignal,
  list: FunState<T[]>,
  renderRow: (row: {
    signal: AbortSignal;
    state: FunState<T>;
    remove: () => void;
  }) => Element
): KeyedChildren<T>
```

Render and reconcile keyed lists efficiently. Each row gets its own AbortSignal for cleanup and a focused state.

```typescript
interface Todo {
  key: string;
  label: string;
  done: boolean;
}

const todos: FunState<Todo[]> = funState([
  { key: "a", label: "First", done: false }
]);

keyedChildren(h("ul"), signal, todos, (row) => {
  const li = h("li");

  // row.state is a focused FunState<Todo> for this item
  bindProperty(li, "textContent", row.state.prop("label"), row.signal);

  // row.remove() removes this item from the list
  const deleteBtn = h("button", { textContent: "Delete" });
  on(deleteBtn, "click", row.remove, row.signal);

  li.appendChild(deleteBtn);
  return li;
});
```

#### $ and $$ - DOM Query Utilities

Convenient shortcuts for `querySelector` and `querySelectorAll` with better TypeScript support.

**`$<T extends Element>(selector: string): T | undefined`**

Query a single element. Returns `undefined` instead of `null` if not found.

```typescript
const button = $<HTMLButtonElement>("#submit-btn");
if (button) {
  button.disabled = true;
}

const input = $<HTMLInputElement>(".name-input");
```

**`$$<T extends Element>(selector: string): T[]`**

Query multiple elements. Returns a real Array (not NodeList) for better ergonomics.

```typescript
const items = $$<HTMLDivElement>(".item");
items.forEach(item => item.classList.add("active"));

// Array methods work directly
const texts = $$(".label").map(el => el.textContent);
```

#### Other utilities

All return the element for chaining:

```typescript
text: (content: string | number) => (el: Element) => Element
attr: (name: string, value: string) => (el: Element) => Element
attrs: (obj: Record<string, string>) => (el: Element) => Element
addClass: (...classes: string[]) => (el: Element) => Element
removeClass: (...classes: string[]) => (el: Element) => Element
toggleClass: (className: string, force?: boolean) => (el: Element) => Element
append: (...children: Element[]) => (el: Element) => Element
pipeEndo: <T>(...fns: Array<(x: T) => T>) => (x: T) => T
```

### Mounting

#### mount
```ts
<Props>(component: Component<Props>, props: Props, container: Element): MountedComponent
```

Mount component to DOM and manage lifecycle. You probably only need to call this once in your app.

```typescript
const state = funState({ count: 0 });
const mounted = mount(
  Counter,
  { label: "Clicks", state },
  document.body
);

mounted.unmount(); // Cleanup
```

**Returns:**
```typescript
interface MountedComponent {
  element: Element
  unmount(): void
}
```

## Composition

Components compose by calling other components and passing focused state via props:

```typescript
import { prop } from "@fun-land/accessor";

interface AppState {
  user: UserData;
  settings: Settings;
}

const App: Component<{ state: FunState<AppState> }> = (signal, props) => 
  h("div", {}, [
    UserProfile(signal, {
      editable: true,
      state: props.state.focus(prop<AppState>()("user")),
    }),
    SettingsPanel(signal, {
      state: props.state.focus(prop<AppState>()("settings")),
    })
  ]);
```

Focused states only trigger updates when their slice changes. Components can also create **local state** using `funState()` instead of receiving it via props - there's no distinction, state is just data.

## Examples

See working examples:
- `examples/counter/counter.ts` - Basic reactivity and composition
- `examples/todo-app/todo-app.ts` - Keyed lists and form binding

```bash
yarn build:examples
open examples/counter/index.html
open examples/todo-app/todo.html
```

## Status

**Experimental** - APIs may change.

## License

MIT
