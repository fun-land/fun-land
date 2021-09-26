# `@fun-land/observable`

Use FunState with zen-observable!

# API

## observableFunState

```ts
<State>(initialState: State) => Observable<FunState<State>>
```

Create an [Observable](https://github.com/zenparsing/zen-observable) of a FunState
which calls Observable.next() when subscribers modify the state using the
[FunState API](https://github.com/fun-land/fun-land/tree/main/packages/fun-state).

```typescript
import observableFunState from "@fun-land/observable";

const observableState = observableFunState({ counter: 0 });

observableState.subscribe((funState) => {
    // can read from funState like usual
    const currentCount = funState.prop("counter").get();
    console.log(currentCount);

    if (currentCount < 10) {
      // writing to the state causes another event
      funState.prop("counter").mod((v) => v + 1);
    }
  }, 100);
});
```

# Why?

This allows usage of [FunState](https://github.com/fun-land/fun-land/tree/main/packages/fun-state) for doing reactive programming with [accessors](https://github.com/fun-land/fun-land/tree/main/packages/accessor) without requiring [use-fun-state](https://github.com/fun-land/fun-land/tree/main/packages/use-fun-state) or React.js.
