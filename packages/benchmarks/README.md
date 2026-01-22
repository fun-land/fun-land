# @fun-land/benchmarks

Performance benchmarks for fun-land packages.

## js-framework-benchmark

Standardized framework comparison using [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark).

### Setup

**Option 1: Build in fun-land (for local testing)**

Build the benchmark using workspace dependencies:

```bash
# From fun-land root - install all workspace dependencies first
pnpm install

# Then build the benchmark
cd packages/benchmarks/js-framework-benchmark
pnpm run build-prod
# dist/main.js is ready
```

**Quick sync to js-framework-benchmark:**

```bash
# From packages/benchmarks/js-framework-benchmark
./sync-to-benchmark.sh [path-to-js-framework-benchmark]
# Defaults to ~/develop/js-framework-benchmark
```

This automatically builds, copies files, and updates package.json.

**Option 2: Integration with js-framework-benchmark repo**

1. Clone js-framework-benchmark repo (separate from fun-land):

```bash
# In a different directory (not inside fun-land)
cd ~/develop  # or wherever you keep projects
git clone https://github.com/krausest/js-framework-benchmark.git
cd js-framework-benchmark
```

2. Copy fun-web implementation:

```bash
cp -r ~/develop/fun-land/packages/benchmarks/js-framework-benchmark frameworks/keyed/fun-web
```

3. Replace package.json with standalone version (uses npm packages instead of workspace deps):

```bash
cd frameworks/keyed/fun-web
cp package.json.standalone package.json
```

4. Install and build:

```bash
cd frameworks/keyed/fun-web
npm install
npm run build-prod
```

4. Test locally:

```bash
# From js-framework-benchmark root
npm start
# Navigate to http://localhost:8080/frameworks/keyed/fun-web/
```

5. Run benchmarks:

```bash
# From js-framework-benchmark root
npm run bench -- --framework keyed/fun-web
```

6. View results:

After running benchmarks, regenerate the results and view them:

# Ensure the server is still running (from step 4)
# If not, start it: npm start

# Regenerate results.ts (this queries the server to discover frameworks)
npm run results
# Or: cd webdriver-ts && npm run results

# View results in the interactive report
cd webdriver-ts-results
npm run dev
# Open http://localhost:5173 (or the port shown) in your browser


### Implementation Notes

- Uses `bindListChildren` for efficient keyed list reconciliation
- Direct DOM updates via subscriptions (no virtual DOM)
- AbortSignal-based cleanup for all subscriptions

## Custom Benchmarks

### Microbench (accessor + fun-state)

Run:

```bash
pnpm -C /Users/jethrolarson/develop/fun-land/packages/benchmarks run bench
```

Latest run (darwin 22.1.0, local machine; ops/sec, higher is better):

Versions:
- `@fun-land/fun-state` 9.2.0
- `@fun-land/accessor` 4.0.2

- `fun-state.get`: 104,037,719
- `fun-state.mod`: 30,382,050
- `fun-state.prop.get`: 39,475,301
- `fun-state.derive.get`: 7,310,552
- `fun-state.mapRead.get`: 38,762,638
- `fun-state.mapRead.chain.get`: 4,998,331
- `fun-state.focus.item.get`: 28,340,756
- `fun-state.focus.item.prop.get`: 11,348,930
- `fun-state.focus.item.mod`: 264,870
- `fun-state.list.mod`: 30,997,304
- `accessor.get:name`: 49,245,450
- `accessor.mod:age+1`: 20,485,064
- `accessor.query:tags`: 41,073,358
- `accessor.query:tag0`: 17,325,697
- `accessor.query:users10k`: 457,289
- `baseline.map:users`: 211,679
- `baseline.filter:users`: 218,738

Notes:
- Microbenchmarks are for relative tracking only, not cross-machine comparisons.

Future micro-benchmarks for:

- **fun-web**: DOM manipulation, component mounting, state updates
- **fun-state**: State subscription overhead, focused state performance
- **accessor**: Query and modification performance on nested structures
