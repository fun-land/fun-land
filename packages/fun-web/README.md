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
  useFunWebState,
  mount,
  bindProperty,
  on,
  type Component,
  type FunWebState,
} from "@fun-land/fun-web";

interface CounterProps {
  state: FunWebState<number>;
}

const Counter: Component<CounterProps> = (signal, props) => {
  // Component runs once - no re-rendering on state changes
  const button = h("button", {}, `Count: ${state.get()}`);

  // Subscriptions handle updates automatically
  bindProperty(button, "textContent", state, signal);

  // Event handlers never go stale (component doesn't re-run)
  on(button, "click", () => state.mod((n) => n + 1), signal);

  return button;
};

// Create reactive state and mount
const state = useFunWebState<CounterState>({ count: 0 });
const mounted = mount(Counter, { state }, document.body);
```

## Core Concepts

### Components Run Once

**The most important difference from React/Vue/Svelte:** fun-web components execute once when mounted, set up subscriptions, and never re-run.

```typescript
const Counter: Component<{ count: FunWebState<number> }> = (signal, props) => {
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
| Stale closure bugs | Closures never go stale (component doesn't re-run) |

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
const FunWebCounter: Component<{ count: FunWebState<number> }> = (signal, props) => {
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

### FunWebState - Reactive State with Subscriptions

`FunWebState<T>` follows the compositional FunState pattern (from @fun-land/fun-state) and adds subscription support for DOM updates:

```typescript
interface FunWebState<State> {
  // Core operations (from FunState pattern)
  get(): State
  set(value: State): void
  mod(fn: (s: State) => State): void

  // Focusing (from FunState pattern)
  prop<K extends keyof State>(key: K): FunWebState<State[K]>
  focus<Sub>(accessor: Accessor<State, Sub>): FunWebState<Sub>
  query<A>(accessor: Accessor<State, A>): A[]

  // Subscriptions (unique to FunWebState)
  subscribe(signal: AbortSignal, callback: (state: State) => void): void
}
```

**Key difference from the FunState pattern:** Adds the `.subscribe()` method for subscriptions. DOM elements can subscribe to state changes and the AbortSignal handles cleanup automatically.

```typescript
const userState = useFunWebState({ name: "Alice", age: 30 });

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
const Counter: Component<{ count: FunWebState<number> }> = (signal, props) =>
  h("div", {}, String(props.count.get()));

// Mix of static and reactive
const Dashboard: Component<{
  onLogout: () => void;
  user: FunWebState<User>;
  settings: FunWebState<Settings>;
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
const nameState: FunWebState<string> = state.prop("user").prop("name");

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
const MyComponent: Component<{ state: FunWebState<State> }> = (signal, props) => {
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
// ✅ Good - complex logic needs manual control
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

### State

#### `useFunWebState<T>(initialState: T): FunWebState<T>`

Create a reactive state instance for standalone usage.

```typescript
const state = useFunWebState({ count: 0, name: "Alice" });
```

#### `FunWebState<State>`

```typescript
interface FunWebState<State> {
  // Read
  get(): State
  query<A>(accessor: Accessor<State, A>): A[]

  // Write
  set(value: State): void
  mod(fn: (s: State) => State): void

  // Focus
  prop<K extends keyof State>(key: K): FunWebState<State[K]>
  focus<Sub>(accessor: Accessor<State, Sub>): FunWebState<Sub>

  // Subscribe
  subscribe(signal: AbortSignal, callback: (state: State) => void): void
}
```

### DOM Utilities

#### `h<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, attrs?: Record<string, any> | null, children?: ElementChild | ElementChild[]): HTMLElementTagNameMap[Tag]`

Create an element with automatic type inference.

```typescript
const div: HTMLDivElement = h("div", { id: "app" }, [
  h("h1", null, "Hello"),
  h("input", { type: "text", value: "foo" })
]);
```

**Attribute conventions:**
- Dashed properties (`data-*`, `aria-*`) → `setAttribute()`
- Properties starting with `on` → `addEventListener()`
- Everything else → property assignment

#### `bindProperty<E extends Element, K extends keyof E>(el: E, key: K, state: FunWebState<E[K]>, signal: AbortSignal): E`

Bind element property to state. Returns element for chaining.

```typescript
const input: HTMLInputElement = h("input");
bindProperty(input, "value", state.prop("name"), signal);
// input.value syncs with state.name
```

#### `on<E extends Element, K extends keyof HTMLElementEventMap>(el: E, type: K, handler: (ev: HTMLElementEventMap[K] & { currentTarget: E }) => void, signal: AbortSignal): E`

Add type-safe event listener. Returns element for chaining.

```typescript
on(h("button"), "click", (e) => {
  // e.currentTarget is typed as HTMLButtonElement
  e.currentTarget.disabled = true;
}, signal);
```

#### `keyedChildren<T extends { key: string }>(parent: Element, signal: AbortSignal, list: FunWebState<T[]>, renderRow: (rowSignal: AbortSignal, item: FunWebState<T>) => Element): KeyedChildren<T>`

Render and reconcile keyed lists efficiently.

```typescript
interface Todo {
  key: string;
  label: string;
  done: boolean;
}

const todos: FunWebState<Todo[]> = useFunWebState([
  { key: "a", label: "First", done: false }
]);

keyedChildren(
  h("ul"),
  signal,
  todos,
  (rowSignal, todo: FunWebState<Todo>) => {
    const li = h("li");
    bindProperty(li, "textContent", todo.prop("label"), rowSignal);
    return li;
  }
);
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
pipe: <T>(...fns: Array<(x: T) => T>) => (x: T) => T
```

### Mounting

#### `mount<Props>(component: Component<Props>, props: Props, container: Element): MountedComponent`

Mount component to DOM and manage lifecycle.

```typescript
const state = useFunWebState({ count: 0 });
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

const App: Component<{ state: FunWebState<AppState> }> = (signal, props) => {
  const userSection = UserProfile(signal, {
    editable: true,
    state: props.state.focus(prop<AppState>()("user")),
  });

  const settingsSection = SettingsPanel(signal, {
    state: props.state.focus(prop<AppState>()("settings")),
  });

  return h("div", {}, [userSection, settingsSection]);
};
```

Focused states only trigger updates when their slice changes. Components can also create **local state** using `useFunWebState()` instead of receiving it via props - there's no distinction, state is just data.

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
