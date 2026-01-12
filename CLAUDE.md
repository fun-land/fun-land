# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fun-land is a TypeScript monorepo containing a collection of practical functional libraries for reactive programming. The core concept is based on **Accessors** (optics/lenses) for immutable updates and compositional state management.

## Monorepo Structure

This is a Lerna + Nx + Yarn workspaces monorepo with independent package versioning. Packages are located in `packages/*`:

- **@fun-land/accessor** - Core optics library for immutable updates and queries on nested data structures
- **@fun-land/fun-state** - Framework-agnostic fractal, compositional state management
- **@fun-land/use-fun-state** - React hook implementation of fun-state
- **@fun-land/validation** - State validation using accessors
- **@fun-land/react-validation** - React helpers for validation
- **@fun-land/observable-fun-state** - Observable wrapper for fun-state (non-React usage)
- **@fun-land/fun-state-examples** - Example Vite project demonstrating usage

## Common Commands

### Running Tests
```bash
# Run tests for all affected packages
yarn test

# Run tests for a specific package
cd packages/<package-name>
yarn test

# Run tests with coverage
cd packages/<package-name>
yarn test-cover
```

### Building
```bash
# Build all affected packages
yarn build

# Build a specific package (generates both CJS and ESM)
cd packages/<package-name>
yarn build

# Build only CommonJS
yarn build-cjs

# Build only ES modules
yarn build-esm
```

### Linting
```bash
# Lint all affected packages
yarn lint

# Lint a specific package
cd packages/<package-name>
yarn lint
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

**FunState Pattern**: A state container that wraps a `StateEngine` (getter/setter pair) and provides:
- `get()` - Extract current value
- `set(val)` - Replace value
- `mod(fn)` - Transform value
- `query(accessor)` - Query using an accessor
- `focus(accessor)` - Create a focused FunState at an accessor path
- `prop(key)` - Sugar for focusing on a property

This enables fractal state management where components can be given a focused view of parent state without knowing their position in the hierarchy.

### Package Dependencies

```
accessor (foundation, no internal deps)
  ↓
fun-state (depends on accessor)
  ↓
use-fun-state (depends on fun-state, accessor, react)
  ↓
validation (depends on accessor)
  ↓
react-validation (depends on use-fun-state, validation)

observable-fun-state (depends on fun-state, accessor, rxjs)
```

### Build System

- **TypeScript Project References**: Uses composite project structure defined in root `tsconfig.json`
- **Dual Format Builds**: Each package builds both CommonJS (`dist/`) and ES modules (`dist/esm/`)
- **Nx Caching**: Build, test, and lint operations are cached by Nx (configured in `nx.json`)
- **Lerna**: Manages publishing with independent versioning

### Testing

- Jest is used for all packages
- Test files are colocated with source: `*.test.ts`
- Root `jest.config.js` aggregates all package test configs
- Each package has its own `jest.config.js`

## Key Implementation Details

### Reference Stability

As of commit 57909e0, `use-fun-state` maintains reference stability - the returned `FunState` object remains the same across renders (only depends on `ref`, not state changes). This is important for preventing unnecessary re-renders in child components.

### StateEngine Abstraction

The `StateEngine<State>` interface (`getState`, `modState`) decouples FunState logic from the storage mechanism:
- `standaloneEngine` - Simple mutable variable (for testing)
- `pureState` + React hooks - React-based implementation in use-fun-state
- `observable-fun-state` - RxJS Observable-based implementation

### Accessor Composition

Accessor composition (`comp`) works similarly to function composition but with a monadic bind operation for the `query` return type (array). The `mod` direction composes simply via function composition.

## Development Notes

- TypeScript strict mode is enabled
- ESLint with TypeScript plugin is configured
- All packages build to ES2015 target
- Source maps are generated for all builds
