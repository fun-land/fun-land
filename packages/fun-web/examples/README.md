# fun-web Examples

Standalone HTML examples that can be opened directly in a browser.

## Build All Examples

```bash
yarn build:examples
```

## Counter

A minimal counter example demonstrating the basics.

**To view:**
```bash
yarn build:counter
open examples/counter/index.html
```

**Demonstrates:**
- Creating reactive state with `useFunWebState()`
- Building a component with `(signal, props, ...states) => Element`
- Property binding with `bindProperty()`
- Event listeners with cleanup via `on()` and `AbortSignal`
- Mounting to the DOM with `mount()`
- Component composition with focused state

**Files:**
- `counter/counter.ts` - TypeScript source
- `counter/index.html` - HTML page
- `counter/bundle.js` - Generated bundle

## Todo App

A complete todo app demonstrating real-world patterns.

**To view:**
```bash
yarn build:todo
open examples/todo-app/todo.html
```

**Demonstrates:**
- Complex state management with nested data
- Keyed list rendering with `keyedChildren()` (efficient DOM reconciliation)
- Two-way form bindings using `bindProperty()` and `on()`
- Multiple focused state slices with accessors
- Business logic separation using accessor transformations
- Type-safe event handlers

**Features:**
- Add/remove todo items with stable keys
- Edit todo labels inline
- Toggle completion status
- Set priority (High/Low)
- Mark all as done
- "All done!" indicator

**Files:**
- `todo-app/todo-app.ts` - TypeScript source
- `todo-app/todo.html` - HTML page
- `todo-app/todo-bundle.js` - Generated bundle

## Making Changes

Edit the `.ts` files, rebuild with `yarn build:examples` (or individual scripts like `yarn build:counter`), and refresh your browser.
