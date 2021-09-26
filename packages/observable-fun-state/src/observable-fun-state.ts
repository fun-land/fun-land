import { FunState, pureState, Updater } from "@fun-land/fun-state";
import Observable from "zen-observable";

/**
 * Create an [Observable](https://github.com/zenparsing/zen-observable) of a FunState
 * which calls Observable.next() when subscribers modify the state using the
 * [FunState API](https://github.com/fun-land/fun-land/tree/main/packages/fun-state)
 */
export const observableFunState = <State>(
  initialState: State
): Observable<FunState<State>> => {
  let state: State = initialState;
  const observers = new Set<
    ZenObservable.SubscriptionObserver<FunState<State>>
  >();
  const getState = (): State => state;
  const modState: Updater<State> = (f): void => {
    state = f(getState());
    observers.forEach((observer) => observer.next(fs));
  };
  const fs = pureState({ getState, modState });
  return new Observable<FunState<State>>((observer) => {
    observers.add(observer);
    observer.next(fs);
    return (): void => {
      observers.delete(observer);
    };
  });
};
