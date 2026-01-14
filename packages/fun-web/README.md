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
pnpm add @fun-land/fun-web @fun-land/accessor
```

## Quick Start

```typescript
import {
  h,
  funState,
  mount,
  bindProperty,
  on,
  enhance,
  type Component,
  type FunState,
} from "@fun-land/fun-web";


const Counter: Component<{state: FunState<number>}> = (signal, {state}) => {
  // Component runs once - no re-rendering on state changes
  const button = h("button", {}, `Count: ${state.get()}`);

  // bindProperty subscribes to the state and updates named property
  enhance(button, bindProperty("textContent", state, signal));

  // Event handlers never go stale (component doesn't re-run)
  enhance(button, on("click", () => state.mod((n) => n + 1), signal));

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
  enhance(display, bindProperty("textContent", props.count, signal));
  enhance(button, on("click", () => props.count.mod(n => n + 1), signal));

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
  enhance(button, on("click", () => props.count.mod(n => n + 1), signal));
  enhance(display, bindProperty("textContent", props.count, signal));

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
userState.prop("name").watch(signal, (name) => {
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

enhance(nameEl, bindProperty("textContent", nameState, signal));
// nameEl.textContent stays in sync with nameState
```

**Use `on` for events:**

```typescript
const button = h("button", {}, "Click me");
enhance(button, on("click", (e: MouseEvent & { currentTarget: HTMLButtonElement }) => {
  console.log(e.currentTarget.textContent);
}, signal));
```

**Chain for two-way bindings:**

```typescript
const input = enhance(
  h("input", { type: "text" }),
  bindProperty("value", state.prop("name"), signal),
  on("input", (e) => state.prop("name").set(e.currentTarget.value), signal)
);
```

**Use `.watch()` for complex logic:**

```typescript
state.watch(signal, (s) => {
  element.textContent = s.count > 100 ? "Max!" : String(s.count);
  element.className = s.count > 100 ? "maxed" : "normal";
  element.setAttribute("aria-label", `Count: ${s.count}`);
});
```

### Cleanup with AbortSignal

All subscriptions and event listeners require an AbortSignal. When the signal aborts, everything cleans up automatically:

```typescript
const MyComponent: Component<{ state: FunState<State> }> = (signal, {state}) => {
  const display = h("div");
  const button = h("button");

  // All three clean up when signal aborts
  enhance(display, bindProperty("textContent", state.prop("count"), signal));
  enhance(button, on("click", () => state.mod(increment), signal));
  state.watch(signal, (s) => console.log("Changed:", s));

  return h("div", {}, [display, button]);
};

const mounted = mount(MyComponent, { state }, container);
mounted.unmount(); // Aborts signal → everything cleans up
```

For the most part you won't have to worry about the abort signal if you use the helpers provided.

## Best Practices

**Don't have one big app state**
This isn't redux. There's little reason to create giant state objects. Create state near the leaves and hoist it when you need to. That said

**You can have more that one state**
It's just a value. If having one state manage multiple properties works then great but if you want to have several that's fine too.

**Deep chains of .prop() are a smell**
Code like `state.prop('foo').prop('bar').prop('baz').get()` is a sign your data model is too complex. However if you want to keep it that way you can create accessors to focus down more simply.

```ts
// create an reusable accssor at module scope
const bazFromState = Acc<MyState>().prop('foo').prop('bar').prop('baz')
// in your component
const baz = state.focus(bazFromState).get()
```

**Prefer helpers over manual subscriptions:**

```typescript
// ✅ Good
enhance(element, bindProperty("textContent", state.prop("count"), signal));

// ❌ Avoid (when bindProperty works)
state.prop("count").watch(signal, (count) => {
  element.textContent = String(count);
});
```

**Use `on()` for type safety:**

```typescript
// ✅ Good - types inferred
enhance(button, on("click", (e) => {
  e.currentTarget.disabled = true; // TypeScript knows it's HTMLButtonElement
}, signal));

// ❌ Avoid - loses type information
button.addEventListener("click", (e) => {
  (e.currentTarget as HTMLButtonElement).disabled = true;
}); // ❌ Forgot {signal} !

// ❌ Avoid binding events in props
h('button', {onclick: (e) => {
  // ❌ type info lost!
  (e.currentTarget as HTMLButtonElement).disabled = true;
  // ❌ event handler not cleaned up!
}})
```

**Manual subscriptions for complex updates:**

```typescript
// ✅ complex updates may need watch
state.watch(signal, (s) => {
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

Bind element property to state. Returns `Enhancer`.

```typescript
const input = enhance(
  h("input"),
  bindProperty("value", state.prop("name"), signal)
);
// input.value syncs with state.name
```

#### on

Add type-safe event listener. Returns `Enhancer`.

```typescript
const button = enhance(
  h("button"),
  on("click", (e) => {
    e.currentTarget.disabled = true;
  }, signal)
);
```

#### bindListChildren

Render and reconcile keyed lists efficiently. Each row gets its own AbortSignal for cleanup and a focused state. Returns `Enhancer`.

```typescript
import { Acc } from "@fun-land/accessor";

interface Todo {
  id: string;
  label: string;
  done: boolean;
}

const todos: FunState<Todo[]> = funState([
  { id: "a", label: "First", done: false }
]);

const list = enhance(
  h("ul"),
  bindListChildren({
    signal,
    state: todos,
    key: Acc<Todo>().prop("id"),
    row: ({ signal, state, remove }) => {
      const li = h("li");

      // state is a focused FunState<Todo> for this item
      enhance(li, bindProperty("textContent", state.prop("label"), signal));

      // remove() removes this item from the list
      const deleteBtn = h("button", { textContent: "Delete" });
      enhance(deleteBtn, on("click", remove, signal));

      li.appendChild(deleteBtn);
      return li;
    }
  })
);
```

#### renderWhen
```ts
function renderWhen<State, Props>(options: {
  state: FunState<State>;
  predicate?: (value: State) => boolean;
  component: Component<Props>;
  props: Props;
  signal: AbortSignal;
}): Element
```

Conditionally render a component based on state and an optional predicate. Returns a container element that mounts/unmounts the component as the condition changes.

**Key features:**
- Component is mounted when condition is `true`, unmounted when `false`
- With boolean state, component mounts when state is `true`
- With predicate, component mounts when `predicate(state)` returns `true`
- Each mount gets its own AbortController for proper cleanup
- Container uses `display: contents` to not affect layout
- Multiple toggles create fresh component instances each time

**Example with boolean state:**

```typescript
const ShowDetails: Component<{ user: User }> = (signal, { user }) => {
  return h("div", { className: "details" }, [
    h("p", null, `Email: ${user.email}`),
    h("p", null, `Joined: ${user.joinDate}`),
  ]);
};

const App: Component = (signal) => {
  const showDetailsState = funState(false);
  const userState = funState({ email: "alice@example.com", joinDate: "2024" });

  const toggleBtn = h("button", { textContent: "Toggle Details" });
  enhance(toggleBtn, on("click", () => {
    showDetailsState.mod(show => !show);
  }, signal));

  // Details component mounts/unmounts based on showDetailsState
  const detailsEl = renderWhen({
    state: showDetailsState,
    component: ShowDetails,
    props: { user: userState.get() },
    signal
  });

  return h("div", {}, [toggleBtn, detailsEl]);
};
```

**Example with predicate:**

```typescript
enum Status { Loading, Success, Error }

const SuccessMessage: Component<{ message: string }> = (signal, { message }) => {
  return h("div", { className: "success" }, message);
};

const App: Component = (signal) => {
  const statusState = funState(Status.Loading);

  // Only render SuccessMessage when status is Success
  const successEl = renderWhen({
    state: statusState,
    predicate: (status) => status === Status.Success,
    component: SuccessMessage,
    props: { message: "Operation completed!" },
    signal
  });

  return h("div", {}, [successEl]);
};
```

**When to use:**
- Conditionally showing/hiding expensive components (better than CSS `display: none`)
- Mounting components that need full cleanup when hidden
- Components with their own timers, subscriptions, or resources

**Simple visibility toggling:**
If you just need to toggle visibility without full mount/unmount, use `bindProperty` with `style.display` instead:

```typescript
const element = h("div", {}, "Content");
const showState = funState(true);

// Just toggles visibility, element stays mounted
showState.watch(signal, (show) => {
  element.style.display = show ? "block" : "none";
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
// pipe a value through a series of endomorphisms
pipeAll: <T>(x: T, ...fns: Array<(x: T) => T>) => T
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
import { UserProfile, UserData } from "./UserProfile";
import { SettingsPanel, Settings } from "./Settings";

// Parent state is composed from the child states
interface AppState {
  user: UserData;
  settings: Settings;
}

const App: Component<{ state: FunState<AppState> }> = (signal, {state}) => 
  h("div", {}, [
    UserProfile(signal, {
      editable: true,
      // Focus the state on what the child needs
      state: state.focus(prop<AppState>()("user")),
    }),
    SettingsPanel(signal, {
      state: state.focus(prop<AppState>()("settings")),
    })
  ]);
```

Focused states only trigger updates when their slice changes. Components can also create **local state** using `funState()` instead of receiving it via props - there's no distinction, state is just data.

## Examples

See working examples:
- `examples/counter/counter.ts` - Basic reactivity and composition
- `examples/todo-app/todo-app.ts` - Keyed lists and form binding

```bash
pnpm run build:examples
open examples/counter/index.html
open examples/todo-app/todo.html
```

## Status

**Experimental** - APIs may change.

## License

MIT
