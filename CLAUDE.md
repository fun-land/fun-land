# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fun-land is a TypeScript monorepo containing a collection of practical functional libraries for reactive programming. The core concept is based on **Accessors** (optics/lenses) for immutable updates and compositional state management, with framework-agnostic and React-specific implementations.

## Monorepo Structure

This is a Lerna + Nx + pnpm workspaces monorepo with independent package versioning. Packages are located in `packages/*`:

- **@fun-land/accessor** - Core optics library for immutable updates and queries on nested data structures
- **@fun-land/fun-state** - Framework-agnostic fractal, compositional state management with reactive subscriptions
- **@fun-land/fun-web** - Lightweight web component library using FunState for reactive UIs without a framework
- **@fun-land/use-fun-state** - React hook implementation of fun-state
- **@fun-land/validation** - State validation using accessors
- **@fun-land/react-validation** - React helpers for validation
- **@fun-land/observable-fun-state** - Observable wrapper for fun-state (non-React usage)
- **@fun-land/fun-state-examples** - Example Vite project demonstrating usage

## Common Commands

### Running Tests
```bash
# Run tests for all affected packages
pnpm test

# Run tests for a specific package
cd packages/<package-name>
pnpm test

# Run tests with coverage
cd packages/<package-name>
pnpm test-cover
```

### Building
```bash
# Build all affected packages
pnpm build

# Build a specific package (generates both CJS and ESM)
cd packages/<package-name>
pnpm build

# Build only CommonJS
pnpm build-cjs

# Build only ES modules
pnpm build-esm
```

### Linting
```bash
# Lint all affected packages
pnpm lint

# Lint a specific package
cd packages/<package-name>
pnpm lint
```

### Publishing
```bash
# Publish changed packages with Lerna
npx lerna publish

# Check which packages have changed
npx lerna changed
```

## Architecture

### Core Concepts

**Accessor Pattern**: The foundation of this library. An `Accessor<S, A>` is a composable lens that:
- `query: (struct: S) => A[]` - Extracts focused values (returns array to support multiple targets)
- `mod: (f: (x: A) => A) => (struct: S) => S` - Immutably transforms focused values

Accessors can target:
- Object properties via `prop<Obj>()(key)`
- Array indices via `index(i)`
- Multiple items via `all()`, `filter(pred)`, `before(i)`, `after(i)`
- Transformed views via `viewed(toView, fromView)`
- Composed paths via `comp(acc1, acc2, ...)`

**FunState Pattern**: A state container that wraps a `StateEngine` (getter/setter/subscriber) and provides:
- `get()` - Extract current value
- `set(val)` - Replace value
- `mod(fn)` - Transform value
- `query(accessor)` - Query using an accessor
- `focus(accessor)` - Create a focused FunState at an accessor path
- `prop(key)` - Sugar for focusing on a property
- `subscribe(signal, callback)` - Subscribe to state changes with AbortSignal cleanup

This enables fractal state management where components can be given a focused view of parent state without knowing their position in the hierarchy.

**FunWeb Pattern**: Native DOM component library with run-once components that:
- Execute once when mounted (no re-renders)
- Use subscriptions to reactively update specific DOM properties
- Leverage AbortSignal for automatic cleanup
- Provide utilities like `h()` for element creation, `bindProperty()` for reactive bindings, `on()` for events
- Support keyed list rendering with `keyedChildren()`
- Include DOM query utilities `$()` and `$$()`

### Package Dependencies

```
accessor (foundation, no internal deps)
  ↓
fun-state (depends on accessor)
  ↓
  ├─→ use-fun-state (depends on fun-state, accessor, react)
  │     ↓
  │   react-validation (depends on use-fun-state, validation)
  │
  ├─→ fun-web (depends on fun-state, accessor)
  │
  └─→ observable-fun-state (depends on fun-state, accessor, rxjs)

validation (depends on accessor)
```

### Build System

- **TypeScript Project References**: Uses composite project structure defined in root `tsconfig.json`
- **Dual Format Builds**: Each package builds both CommonJS (`dist/`) and ES modules (`dist/esm/`)
- **Nx Caching**: Build, test, and lint operations are cached by Nx (configured in `nx.json`)
- **Lerna**: Manages publishing with independent versioning

### Testing

- Jest is used for all packages (Jest 30.x)
- Test files are colocated with source: `*.test.ts`
- Root `jest.config.js` aggregates all package test configs
- Each package has its own `jest.config.js`
- **182 tests total** across all packages
- **Coverage requirements**:
  - accessor and fun-state require 100% coverage (branches, lines, statements, functions)
  - Other packages have coverage tracking but no strict thresholds

### ESLint

- **ESLint v9** with flat config format (`eslint.config.js`)
- TypeScript ESLint plugin for type-aware linting
- Jest plugin for test-specific rules
- **Relaxed rules for test files**: Test files (*.test.ts) allow `any` types, `require()`, and other test-specific patterns
- **No explicit return type requirement**: Type inference is preferred over explicit return types
- Complexity limit of 5 (warning level)
- Unused vars must be prefixed with `_`

## Key Implementation Details

### Reactive Subscriptions with AbortSignal

As of the fun-web addition, FunState now includes a `subscribe` method:
- `subscribe(signal: AbortSignal, callback: (state: State) => void)`
- Uses AbortSignal for automatic cleanup when component unmounts
- Focused subscriptions only fire when the focused value changes (reference equality check)
- This enables reactive DOM updates without virtual DOM or re-renders

### Reference Stability

As of commit 57909e0, `use-fun-state` maintains reference stability - the returned `FunState` object remains the same across renders (only depends on `ref`, not state changes). This is important for preventing unnecessary re-renders in child components.

### StateEngine Abstraction

The `StateEngine<State>` interface decouples FunState logic from the storage mechanism:
```typescript
interface StateEngine<State> {
  getState: () => State
  modState: Updater<State>
  subscribe: (listener: (state: State) => void) => Unsubscribe
}
```

Implementations:
- `standaloneEngine` - Simple mutable variable (for testing and standalone usage)
- `pureState` + React hooks - React-based implementation in use-fun-state
- `observable-fun-state` - RxJS Observable-based implementation
- `fun-web` - Native DOM with AbortSignal-based subscriptions

### Accessor Composition

Accessor composition (`comp`) works similarly to function composition but with a monadic bind operation for the `query` return type (array). The `mod` direction composes simply via function composition.

### Fun-Web Component Pattern

Fun-web components execute once and set up reactive subscriptions:
```typescript
type Component<Props = {}> = (
  signal: AbortSignal,
  props: Props
) => Element
```

Key differences from React/Vue/Svelte:
- **No re-renders**: Components execute once, subscriptions handle updates
- **No memoization needed**: No stale closures since components don't re-execute
- **Direct DOM updates**: Subscriptions update specific DOM properties, no virtual DOM
- **AbortSignal everywhere**: All subscriptions and event listeners use AbortSignal for cleanup

## Development Notes

- TypeScript strict mode is enabled
- All packages build to ES2015 target
- Source maps are generated for all builds
- Git hooks may be configured via Husky
- When adding new features, maintain test coverage requirements
- Use `pnpm test && pnpm lint` before committing
