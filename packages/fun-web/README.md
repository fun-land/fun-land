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
pnpm add @fun-land/fun-web @fun-land/fun-state @fun-land/accessor
```

## Quick Start

```typescript
import { hx, mount, type Component } from "@fun-land/fun-web";
import { funState, type FunState, type FunRead } from "@fun-land/fun-state";


const Counter: Component<{state: FunState<number>}> = (signal, {state}) => {
  // Component runs once - no re-rendering on state changes
  return hx("button", {
    signal,
    // bind syncs the button text with state
    bind: { textContent: state },
    // Event handlers never go stale (component doesn't re-run)
    on: { click: () => state.mod((n) => n + 1) },
  });
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

  const display = hx("div", {
    signal,
    bind: { textContent: props.count },
  });

  const button = hx("button", {
    signal,
    props: { textContent: "Increment" },
    on: { click: () => props.count.mod(n => n + 1) },
  });

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

  const display = hx("div", {
    signal,
    bind: { textContent: props.count },
  });

  const button = hx("button", {
    signal,
    props: { textContent: "+" },
    // No useCallback needed - this closure never goes stale
    on: { click: () => props.count.mod(n => n + 1) },
  });

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

**FunRead** - Read-only reactive values returned by `mapRead` and `derive`:

```typescript
import { mapRead, derive } from "@fun-land/fun-state";

// Transform single value
const count = funState(5);
const doubled = mapRead(count, n => n * 2);

// Combine multiple values
const firstName = funState("Alice");
const lastName = funState("Smith");
const fullName = derive(firstName, lastName, (f, l) => `${f} ${l}`);

// Use with bindings (accepts FunRead)
const display = hx("div", {
  signal,
  bind: { textContent: fullName },
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

**One-way binding with `hx`:**

```typescript
const nameState: FunState<string> = state.prop("user").prop("name");

const nameEl = hx("div", {
  signal,
  bind: { textContent: nameState },
});
// nameEl.textContent stays in sync with nameState
```

**Two-way binding with `hx`:**

```typescript
const input = hx("input", {
  signal,
  props: { type: "text" },
  bind: { value: state.prop("name") },
  on: { input: (e) => state.prop("name").set(e.currentTarget.value) },
});
```

**Event handlers with `hx`:**

```typescript
const button = hx("button", {
  signal,
  props: { textContent: "Click me" },
  on: {
    click: (e) => {
      console.log(e.currentTarget.textContent);
      e.currentTarget.disabled = true; // type-safe!
    }
  },
});
```

**Use `.watch()` for complex logic:**

```typescript
state.watch(signal, (s) => {
  element.textContent = s.count > 100 ? "Max!" : String(s.count);
  element.className = s.count > 100 ? "maxed" : "normal";
  element.setAttribute("aria-label", `Count: ${s.count}`);
});
```

**Using enhancers (alternative to `hx`):**

```typescript
// If you prefer functional composition
const input = enhance(
  h("input", { type: "text" }),
  bindProperty("value", state.prop("name"), signal),
  on("input", (e) => state.prop("name").set(e.currentTarget.value), signal)
);
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

**You can have more than one state**
It's just a value. If having one state manage multiple properties works then great but if you want to have several that's fine too.

**Deep chains of .prop() are a smell**
Code like `state.prop('foo').prop('bar').prop('baz').get()` is a sign your data model is too complex. However if you want to keep it that way you can create accessors to focus down more simply.

```ts
// create an reusable accssor at module scope
const bazFromState = Acc<MyState>().prop('foo').prop('bar').prop('baz')
// in your component
const baz = state.focus(bazFromState).get()
```

**Using .get() in component scope is a smell**
State is for when you want components to respond to state changes as such you should be using it with bindProperty or state.watch or inside event handlers. There are many cases for .get() but if it's the first thing you reach for you're probably gonna be confused that the UI isn't updating. 

**Prefer `hx` for reactive elements:**

```typescript
// ✅ Good - declarative and type-safe
const input = hx("input", {
  signal,
  props: { type: "text" },
  bind: { value: state.prop("name") },
  on: { input: (e) => state.prop("name").set(e.currentTarget.value) },
});

// ✅ Also good - functional composition with enhancers
const input = enhance(
  h("input", { type: "text" }),
  bindProperty("value", state.prop("name"), signal),
  on("input", (e) => state.prop("name").set(e.currentTarget.value), signal)
);

// ❌ Avoid manual subscriptions when `bind` works
const input = h("input", { type: "text" });
state.prop("name").watch(signal, (name) => {
  input.value = name; // Just use bind!
});
```

**Don't bind events in `h()` props:**

```typescript
// ✅ Good - uses hx with type-safe events
const button = hx("button", {
  signal,
  on: { click: (e) => e.currentTarget.disabled = true },
});

// ❌ Avoid - h() event props aren't cleaned up and lose types
const button = h("button", {
  onclick: (e) => {
    (e.currentTarget as HTMLButtonElement).disabled = true; // needs cast
  }, // ❌ event handler not cleaned up!
});
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

#### `hx` (recommended)

Create elements with structured props, attrs, event handlers, and reactive bindings. More complex but provides better type safety and ergonomics than `h` + enhancers.

```typescript
const input = hx("input", {
  signal,
  props: { type: "text", placeholder: "Enter name" },
  attrs: { "data-test": "name-input" },
  bind: { value: nameState },
  on: { input: (e) => nameState.set(e.currentTarget.value) },
});
```

**Parameters:**
- `props` - Element properties (typed per element, writable properties only)
- `attrs` - HTML attributes (data-*, aria-*, etc.)
- `on` - Event handlers (type-safe, with inferred `currentTarget`)
- `bind` - Reactive bindings (properties sync with FunState)
- `signal` - **Required** AbortSignal for cleanup

#### `h`

Create HTML elements declaratively. Consider using `hx` if you want to add event handlers or respond to state changes.

```typescript
const div = h("div", { id: "app" }, [
  h("h1", null, "Hello"),
  h("input", { type: "text", value: "foo" })
]);
```

**Attribute conventions:**
- Dashed properties (`data-*`, `aria-*`) → `setAttribute()`
- Properties starting with `on` → event listeners (⚠️ not cleaned up, use `hx` or `on()` enhancer)
- Everything else → property assignment

#### bindProperty

Bind element property to state. Accepts `FunRead` (including `FunState`, `map`, `derive` results). Returns `Enhancer`. Consider using `hx` with `bind` for better ergonomics.

```typescript
const input = enhance(
  h("input"),
  bindProperty("value", state.prop("name"), signal)
);
// input.value syncs with state.name

// Works with derived values
const formatted = mapRead(state.prop("price"), p => `$${p.toFixed(2)}`);
const display = enhance(
  h("div"),
  bindProperty("textContent", formatted, signal)
);

// Equivalent with hx:
const input = hx("input", {
  signal,
  bind: { value: state.prop("name") },
});
```

#### on

Add type-safe event listener. Returns `Enhancer`. Consider using `hx` with `on` for better ergonomics.

```typescript
const button = enhance(
  h("button"),
  on("click", (e) => {
    e.currentTarget.disabled = true;
  }, signal)
);

// Equivalent with hx:
const button = hx("button", {
  signal,
  on: {
    click: (e) => {
      e.currentTarget.disabled = true;
    }
  },
});
```

#### bindListChildren

Render a list of items from a state array. Each row gets its own AbortSignal for cleanup and a focused state. Returns `Enhancer`.

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
    key: prop<Todo>()("id"), // key is an accessor that targets the unique string value in your array items
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
  state: FunRead<State>;
  predicate?: (value: State) => boolean;
  component: Component<Props>;
  props: Props;
  signal: AbortSignal;
}): Element
```

Conditionally render a component based on state and an optional predicate. Accepts `FunRead` (including `FunState`, `map`, `derive` results). Returns a container element that mounts/unmounts the component as the condition changes.

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

  const toggleBtn = hx("button", {
    signal,
    props: { textContent: "Toggle Details" },
    on: { click: () => showDetailsState.mod(show => !show) },
  });

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

#### querySelectorAll

Query multiple elements. Returns a real Array (not NodeList) for better ergonomics.

```typescript
const items = querySelectorAll<HTMLDivElement>(".item").map(addClass("active"));
```

#### enhance

Apply multiple enhancers to an element. Useful with `h()` and the enhancer utilities below.

```typescript
const input = enhance(
  h("input", { type: "text" }),
  addClass("form-control"),
  bindProperty("value", nameState, signal),
  on("input", (e) => nameState.set(e.currentTarget.value), signal)
);
```

#### Other utilities

All return the element for chaining (used with `enhance`):

```typescript
text: (content: string | number) => (el: Element) => Element
attr: (name: string, value: string) => (el: Element) => Element
attrs: (obj: Record<string, string>) => (el: Element) => Element
addClass: (...classes: string[]) => (el: Element) => Element
removeClass: (...classes: string[]) => (el: Element) => Element
toggleClass: (className: string, force?: boolean) => (el: Element) => Element
append: (...children: Element[]) => (el: Element) => Element
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
import { h } from "@fun-land/fun-web";
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
